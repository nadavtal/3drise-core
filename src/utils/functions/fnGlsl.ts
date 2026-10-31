// =============================================================================
// fnGlsl — a function reference as GPU code: the chunk to include, the uniforms, the call
// =============================================================================
//
//   const g = fnGlsl(ref, 'edge');
//   fragment = g.declarations + g.chunk + `… float v = ${g.call('p')}; …`
//   material.uniforms = { ...g.uniforms }        (and update them from the same FnRef later)
//
// The chunk is pure GLSL functions; params are ARGUMENTS, so the same function can be used twice
// in one shader with different settings, and the uniforms are only glue named after `name`
// (u_edge_seed, u_edge_octaves …). A layering function is generated per base (fn_fbm_simplex).
// Several references in one shader: fnGlslJoin dedupes their shared pieces.
//
import { FN_HASH_GLSL } from './fnHash';
import { FN_NOISE_CORE_GLSL } from './fnNoise';
import { fnDef, fnResolve } from './fnRegistry';
import type { FieldFnDef, FnRef } from './fnTypes';

/** The named chunks functions depend on. */
export const FN_GLSL_CHUNKS: Record<string, string> = {
    hash: FN_HASH_GLSL,
    'noise-core': FN_NOISE_CORE_GLSL,
};

export interface FnGlslPiece { key: string; src: string }
export interface FnGlsl {
    /** The GLSL function's name. */
    fn: string;
    /** Everything the function needs, in order (deps, base, the function), deduped. */
    pieces: FnGlslPiece[];
    /** `pieces` joined — paste once, above the first use. */
    chunk: string;
    /** `uniform float u_<name>_<param>;` lines (and the seed for fields). */
    declarations: string;
    /** Uniform name → value, from the resolved reference. */
    uniforms: Record<string, number>;
    /** The argument expressions after the position / t, in order. */
    args: string[];
    /** The call: fields `fn(p, seed, params…)`, curves `fn(t, params…)`. */
    call: (p: string) => string;
}

function piecesOf(id: string, out: FnGlslPiece[], seen: Set<string>, baseId?: string): string {
    const d = fnDef(id);
    if (d.shape === 'sequence' || !d.glsl) throw new Error(`functions: '${id}' has no GLSL side`);
    for (const dep of d.glsl.deps ?? []) {
        if (seen.has(dep)) continue;
        const src = FN_GLSL_CHUNKS[dep];
        if (!src) throw new Error(`functions: unknown GLSL chunk '${dep}'`);
        seen.add(dep); out.push({ key: dep, src });
    }
    if (d.shape === 'field' && (d as FieldFnDef).takesBase) {
        const baseFn = piecesOf(baseId!, out, seen);
        const name = `${d.glsl.name}_${baseFn.replace(/^fn_/, '')}`;
        if (!seen.has(name)) { seen.add(name); out.push({ key: name, src: d.glsl.chunk.split('{{base}}').join(baseFn).split('{{name}}').join(name) }); }
        return name;
    }
    if (!seen.has(id)) { seen.add(id); out.push({ key: id, src: d.glsl.chunk }); }
    return d.glsl.name;
}

export function fnGlsl(ref: FnRef, name: string): FnGlsl {
    const r = fnResolve(ref), d = fnDef(r.id);
    const pieces: FnGlslPiece[] = [];
    const fn = piecesOf(r.id, pieces, new Set(), r.base);
    const uniforms: Record<string, number> = {};
    const args: string[] = [];
    if (d.shape === 'field') { uniforms[`u_${name}_seed`] = r.seed; args.push(`u_${name}_seed`); }
    for (const p of d.params) { uniforms[`u_${name}_${p.key}`] = r.params[p.key]; args.push(`u_${name}_${p.key}`); }
    const declarations = Object.keys(uniforms).map((u) => `uniform float ${u};`).join('\n') + (Object.keys(uniforms).length ? '\n' : '');
    return {
        fn, pieces, chunk: pieces.map((p) => p.src).join('\n'), declarations, uniforms, args,
        call: (p) => `${fn}(${[p, ...args].join(', ')})`,
    };
}

/** The uniform values for a reference already compiled with fnGlsl (same id / base — only values change). */
export function fnGlslUniforms(ref: FnRef, name: string): Record<string, number> {
    const r = fnResolve(ref), d = fnDef(r.id);
    const u: Record<string, number> = {};
    if (d.shape === 'field') u[`u_${name}_seed`] = r.seed;
    for (const p of d.params) u[`u_${name}_${p.key}`] = r.params[p.key];
    return u;
}

/** Several functions in one shader: their pieces, each once. */
export function fnGlslJoin(list: FnGlsl[]): string {
    const seen = new Set<string>(); const out: string[] = [];
    for (const g of list) for (const p of g.pieces) if (!seen.has(p.key)) { seen.add(p.key); out.push(p.src); }
    return out.join('\n');
}
