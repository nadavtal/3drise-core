// =============================================================================
// Geometry scripts — the `script` mesh variant: source + params, never vertices
// =============================================================================
//
//   config = { type: 'script', source, params, schema }
//
//   source  the body of `function build(p, g)` (a bare body, or the whole function
//           declaration) returning a BufferGeometry or an array of them;
//   params  plain values the script reads as `p.height`, `p.seed`…;
//   schema  the knobs behind those values — what the Shape tab and the property
//           registry show (config.params.<key>, structural).
//
// Execution lives in the viewer (utils/geometryScript.ts: a Web Worker with the
// kit); this module is what both sides share: the static checks, the schema → rows
// adapter, the cache key, the function wrapper and the buffer (de)serialisation.
// Nothing here touches the DOM, so the agent's dry runs and node tests use it too.
//

import { BufferAttribute, BufferGeometry } from 'three';
import type { OptionalProperty } from '../properties/tables/optionalProperties';
import { createGeometryKit, finishScriptResult, type Kit } from './geometryKit';

export type ScriptParamKind = 'number' | 'boolean' | 'select' | 'points';
export interface ScriptParamDef {
    kind: ScriptParamKind;
    label?: string;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    /** select: the allowed values */
    options?: string[];
    /** points: 2 = [x, z] / [u, v] lists, 3 = [x, y, z] */
    dims?: 2 | 3;
}
export type ScriptSchema = Record<string, ScriptParamDef>;
export type ScriptParams = Record<string, number | boolean | string | number[][]>;

export interface ScriptGeometryConfig {
    type: 'script';
    source: string;
    params: ScriptParams;
    schema: ScriptSchema;
}

export const SCRIPT_SOURCE_MAX = 60_000;
export const SCRIPT_TIMEOUT_MS = 10_000;
const KEY = /^[A-Za-z_][A-Za-z0-9_]{0,31}$/;

export const DEFAULT_SCRIPT_CONFIG: ScriptGeometryConfig = {
    type: 'script',
    source: [
        '// A stepped podium: three slabs, welded, with a round hole through the top one.',
        'const slabs = [];',
        'for (let i = 0; i < p.steps; i++) {',
        '  const s = 1 - i * 0.18;',
        '  slabs.push(g.move(g.box(p.width * s, p.stepHeight, p.width * s), 0, p.stepHeight * (i + 0.5), 0));',
        '}',
        'let geo = g.merge(slabs);',
        'const hole = g.move(g.cylinder(p.width * 0.12, p.width * 0.12, p.stepHeight * 2, 24), 0, p.stepHeight * p.steps, 0);',
        'geo = g.subtract(geo, hole);',
        'return g.uvBox(g.creased(geo, 30));',
    ].join('\n'),
    params: { width: 3, steps: 3, stepHeight: 0.25 },
    schema: {
        width: { kind: 'number', min: 0.5, max: 20, step: 0.1, label: 'Width', description: 'Footprint of the lowest slab (m).' },
        steps: { kind: 'number', min: 1, max: 8, step: 1, label: 'Steps' },
        stepHeight: { kind: 'number', min: 0.05, max: 1, step: 0.01, label: 'Step height' },
    },
};

export const isScriptShape = (type: unknown): type is 'script' => type === 'script';

/** A short stable key for a (source, params) pair — the viewer's build cache and React memo key. */
export function scriptKey(source: string, params: ScriptParams): string {
    const s = source + '\u0000' + JSON.stringify(params, Object.keys(params).sort());
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = Math.imul(h2 + c, 2246822519) ^ (h2 >>> 13); }
    return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) + s.length.toString(36);
}

/** The schema's knobs as property rows (tab "params"), so the registry and the Shape tab read one format. */
export function scriptRows(schema: ScriptSchema | undefined): OptionalProperty[] {
    const out: OptionalProperty[] = [];
    for (const [name, def] of Object.entries(schema ?? {})) {
        if (!def || typeof def !== 'object') continue;
        const base = { name, label: def.label, description: def.description ?? `Script parameter ${name}.`, tab: 'params', animatable: false } as OptionalProperty;
        if (def.kind === 'number') out.push({ ...base, type: 'number', min: def.min ?? 0, max: def.max ?? 10, step: def.step ?? 0.01 });
        else if (def.kind === 'boolean') out.push({ ...base, type: 'boolean' });
        else if (def.kind === 'select') out.push({ ...base, type: 'select', options: def.options ?? [] });
        else if (def.kind === 'points') out.push({ ...base, type: 'points', ...(def.dims === 3 ? { dims: 3 } : {}) } as OptionalProperty);
    }
    return out;
}

/** Everything statically wrong with a script config: sentences that say what to fix. Empty = runnable. */
export function checkScriptConfig(cfg: Partial<ScriptGeometryConfig>): string[] {
    const out: string[] = [];
    if (typeof cfg.source !== 'string' || !cfg.source.trim()) out.push('source must be the JavaScript of build(p, g) — a function body that returns a geometry.');
    else if (cfg.source.length > SCRIPT_SOURCE_MAX) out.push(`source is ${cfg.source.length} characters — keep it under ${SCRIPT_SOURCE_MAX}.`);
    else if (!/\breturn\b/.test(cfg.source)) out.push('source never returns — end with `return geo;` (a BufferGeometry or an array of them).');
    const schema = cfg.schema ?? {};
    const params = cfg.params ?? {};
    if (schema && (typeof schema !== 'object' || Array.isArray(schema))) out.push('schema must be an object { key: { kind, min, max, … } }.');
    if (params && (typeof params !== 'object' || Array.isArray(params))) out.push('params must be an object { key: value }.');
    for (const [k, def] of Object.entries(schema)) {
        if (!KEY.test(k)) { out.push(`schema key "${k}" must be an identifier (letters, digits, _; ≤ 32 chars).`); continue; }
        if (!def || !['number', 'boolean', 'select', 'points'].includes(def.kind)) { out.push(`schema.${k}.kind must be number | boolean | select | points.`); continue; }
        const v = params[k];
        if (v === undefined) { out.push(`params.${k} is missing (schema declares it).`); continue; }
        if (def.kind === 'number') {
            if (typeof v !== 'number' || !Number.isFinite(v)) out.push(`params.${k} must be a number.`);
            else if (def.min !== undefined && v < def.min) out.push(`params.${k} = ${v} is below its min ${def.min}.`);
            else if (def.max !== undefined && v > def.max) out.push(`params.${k} = ${v} is above its max ${def.max}.`);
        } else if (def.kind === 'boolean' && typeof v !== 'boolean') out.push(`params.${k} must be true or false.`);
        else if (def.kind === 'select') {
            if (!Array.isArray(def.options) || !def.options.length) out.push(`schema.${k}.options must list the allowed values.`);
            else if (!def.options.includes(String(v))) out.push(`params.${k} must be one of ${def.options.join(', ')}.`);
        } else if (def.kind === 'points') {
            const d = def.dims === 3 ? 3 : 2;
            if (!Array.isArray(v) || !v.every((pt) => Array.isArray(pt) && pt.length >= d && pt.slice(0, d).every((n) => typeof n === 'number' && Number.isFinite(n)))) out.push(`params.${k} must be a list of ${d === 3 ? '[x, y, z]' : '[x, z]'} points.`);
        }
    }
    for (const k of Object.keys(params)) if (!(k in schema)) out.push(`params.${k} has no schema entry — add schema.${k} = { kind: 'number', min, max } so it shows as a knob.`);
    return out;
}

// ----------------------------------------------------------------------------- running

/** `build(p, g)` as a callable: a bare body, or a declaration of `build` (function / const). */
export function compileScript(source: string): (p: ScriptParams, g: Kit) => unknown {
    const declares = /(^|\n)\s*(async\s+)?function\s+build\s*\(|(^|\n)\s*(const|let|var)\s+build\s*=/.test(source);
    const body = declares ? `${source}\nreturn build(p, g);` : source;
    // line 1 of the body is line 1 of the source (no prelude line), so stack lines map 1:1 after the wrapper offset
    return new Function('p', 'g', body) as (p: ScriptParams, g: Kit) => unknown;
}

/** Lines `new Function` adds before the body (header line + the opening brace line). */
const FUNCTION_HEADER_LINES = 2;

/** The script line an error happened on, from its stack (undefined when it is not in the script). */
export function errorLine(err: unknown): number | undefined {
    const stack = (err as Error)?.stack ?? '';
    const m = stack.match(/<anonymous>:(\d+):\d+/) ?? stack.match(/eval at [^\n]*<anonymous>:(\d+):\d+/) ?? stack.match(/Function:(\d+):\d+/);
    if (!m) return undefined;
    const line = Number(m[1]) - FUNCTION_HEADER_LINES;
    return line > 0 ? line : undefined;
}

export interface ScriptRunReport {
    triangles: number;
    bounds: { min: [number, number, number]; max: [number, number, number]; size: [number, number, number] };
    ms: number;
}

/** Runs a script on the calling thread (the worker, the agent's dry run in a worker, node tests). Throws with the script's error. */
export async function runGeometryScript(source: string, params: ScriptParams, kit: Kit = createGeometryKit()): Promise<{ geometry: BufferGeometry; report: ScriptRunReport }> {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const fn = compileScript(source);
    const result = await fn({ ...params }, kit);
    const geometry = finishScriptResult(result, kit);
    const b = kit.bounds(geometry);
    const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    return { geometry, report: { triangles: kit.triangles(geometry), bounds: b, ms: Math.round(ms * 10) / 10 } };
}

// ----------------------------------------------------------------------------- transfer

export interface GeometryBuffers { position: Float32Array; normal: Float32Array; uv: Float32Array }

export function geometryToBuffers(geo: BufferGeometry): GeometryBuffers {
    const g = geo.index ? geo.toNonIndexed() : geo;
    return {
        position: new Float32Array(g.getAttribute('position').array as ArrayLike<number>),
        normal: new Float32Array(g.getAttribute('normal').array as ArrayLike<number>),
        uv: new Float32Array(g.getAttribute('uv').array as ArrayLike<number>),
    };
}

export function buffersToGeometry(b: GeometryBuffers): BufferGeometry {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(b.position, 3));
    geo.setAttribute('normal', new BufferAttribute(b.normal, 3));
    geo.setAttribute('uv', new BufferAttribute(b.uv, 2));
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
}
