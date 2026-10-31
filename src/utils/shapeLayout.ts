// =============================================================================
// shapeLayout — a layout (area, path or grid) applied to a mesh: its geometry, reshaped
// =============================================================================
//
// One field on an object (its own `layout` column):  layout.shape = { ref | area | path | grid, mode?, width?, part?, heights?, uv?, repeat?, groundTexture?, groundTextures? }
//   ref         a saved layout (its asset id) or a built-in layout ('preset:<kind>:<id>') — resolved through layoutRefs
//   area / path / grid   the layout itself, inline (what a script writes when it has no saved one)
// The shape's own geometry is built as always; the layout then reshapes it (removing the field brings
// the original back). What it does depends on the mesh (its default mode; `mode` overrides):
//   surface   flat meshes (plane, ring, arc plane) — the geometry becomes the layout's surface
//   extrude   solid meshes (box, cylinder, extrude, outline) — the surface is the footprint, the mesh's height its depth
//   cut       every other (curved) mesh — the layout from above is a stencil: what lies outside it / in a hole goes
// Fit: the layout is centred and evenly scaled into the mesh's own size (its bounds across the
// ground: width × depth; a flat mesh's two long sides), heights by the same factor. A flat mesh's
// "up" is its thin side (a plane's +Z — the ground once the plane is turned flat).
// Construction: layoutSurface.ts (shared by every object kind that takes a layout).
//
import { BufferAttribute, BufferGeometry, Matrix4 } from 'three';
import { validateArea, type AreaInput } from './areaShape';
import type { PathLineInput } from './pathLine';
import { validateGridLayout, type GridLayout } from './gridLayout';
import { isLayoutPresetRef, layoutPresetOfRef, layoutPresetRefsOf, LAYOUT_PRESET_KINDS, type LayoutPresetKind } from './layoutPresets';
import { resolveLayout, type LayoutKind, type ResolvedLayout } from './layoutRefs';
import { layoutCutGeometry, layoutExtrudeGeometry, layoutGroundGeometries, layoutSurface, layoutSurfaceEdges, layoutSurfaceGeometry, layoutSurfaceRegion, type LayoutApplyOptions, type LayoutSurface } from './layoutSurface';
import type { UrbanTextureRef } from '../types/urbanObjects';

export type ShapeLayoutMode = 'surface' | 'extrude' | 'cut';
export const SHAPE_LAYOUT_MODES: ShapeLayoutMode[] = ['surface', 'extrude', 'cut'];

/** A mesh's `config.shapeLayout`: one source (ref, or the layout inline) and the options. */
export interface ShapeLayout {
    /** A saved layout's asset id, or 'preset:<kind>:<id>' (a built-in area, path or grid). */
    ref?: string;
    /** The layout inline (instead of `ref`) — exactly one source. */
    area?: AreaInput;
    path?: PathLineInput;
    grid?: GridLayout;
    /** What applying does (default: by the mesh — surface / extrude / cut). */
    mode?: ShapeLayoutMode;
    /** Use the layout's heights (default true); false lays it flat. */
    heights?: boolean;
    /** The texture: 'fit' the layout's bounds once (default) or 'tile' every `repeat` metres of the layout. */
    uv?: 'fit' | 'tile';
    repeat?: number;
    /** path: the ribbon's width · grid: the street width (metres of the layout). */
    width?: number;
    /** grid: the blocks (default) or the streets. */
    part?: 'blocks' | 'streets';
    /**
     * The grounds' textures (an area's holes that are grounds — the street grid's pattern: the layout
     * holds the shapes, the place that uses it the textures): one for every ground, and per ground by
     * its id ('h1'…). None: a mesh's ground takes the mesh's own material, a land's a plain lawn.
     */
    groundTexture?: UrbanTextureRef;
    groundTextures?: Record<string, UrbanTextureRef>;
}

/** A ground's texture: its own, else the one for every ground, else none. */
export const shapeLayoutGroundTexture = (sl: ShapeLayout | null | undefined, id: string): UrbanTextureRef | null => {
    const r = sl?.groundTextures?.[id] ?? sl?.groundTexture ?? null;
    return r && r.set ? r : null;
};

export const SHAPE_LAYOUT_LIMITS = { width: [0.1, 500] as const, repeat: [0.05, 5000] as const };
export const SHAPE_LAYOUT_DEFAULTS = { heights: true, uv: 'fit' as const, repeat: 10, pathWidth: 4, gridWidth: 12, part: 'blocks' as const };

/** Shapes that are flat (their layout becomes the surface) and solid (extruded); every other one is cut. */
export const FLAT_LAYOUT_SHAPES = new Set(['plane', 'ring', 'arcPlane']);
export const SOLID_LAYOUT_SHAPES = new Set(['box', 'cylinder', 'extrude', 'outline']);

/** What applying a layout does to this shape when `mode` is not set. */
export function defaultShapeLayoutMode(shapeType: string | undefined): ShapeLayoutMode {
    if (shapeType && FLAT_LAYOUT_SHAPES.has(shapeType)) return 'surface';
    if (shapeType && SOLID_LAYOUT_SHAPES.has(shapeType)) return 'extrude';
    return 'cut';
}

/** The layout a shapeLayout uses: inline, else its ref's (null: none, or a saved one not loaded yet). */
export function shapeLayoutData(sl: ShapeLayout | null | undefined): ResolvedLayout | null {
    if (!sl) return null;
    if (sl.area) return { kind: 'area', area: sl.area };
    if (sl.path) return { kind: 'path', path: sl.path };
    if (sl.grid) return { kind: 'grid', grid: sl.grid };
    return resolveLayout(sl.ref);
}
/** Its kind when known without loading (inline, or a built-in layout). */
export function shapeLayoutKind(sl: ShapeLayout | null | undefined): LayoutKind | null {
    if (!sl) return null;
    if (sl.area) return 'area';
    if (sl.path) return 'path';
    if (sl.grid) return 'grid';
    return layoutPresetOfRef(sl.ref)?.kind ?? resolveLayout(sl.ref)?.kind ?? null;
}

/** The options layoutSurface takes, with the kind's defaults. */
function optionsOf(sl: ShapeLayout, kind: LayoutKind): LayoutApplyOptions {
    return {
        heights: sl.heights !== false,
        uv: sl.uv === 'tile' ? 'tile' : 'fit',
        repeat: sl.repeat ?? SHAPE_LAYOUT_DEFAULTS.repeat,
        width: sl.width ?? (kind === 'path' ? SHAPE_LAYOUT_DEFAULTS.pathWidth : SHAPE_LAYOUT_DEFAULTS.gridWidth),
        part: sl.part === 'streets' ? 'streets' : 'blocks',
    };
}

// the surface is the costly part (an area's harmonic fill): kept per layout data object and options
const surfaces = new WeakMap<object, Map<string, LayoutSurface | null>>();
function surfaceOf(layout: ResolvedLayout, o: LayoutApplyOptions): LayoutSurface | null {
    const data = (layout.kind === 'area' ? layout.area : layout.kind === 'path' ? layout.path : layout.grid) as object;
    // only what changes the surface (uv / heights are applied after)
    const key = layout.kind === 'area' ? 'a' : `${o.width}|${layout.kind === 'grid' ? o.part : ''}`;
    let m = surfaces.get(data);
    if (!m) surfaces.set(data, (m = new Map()));
    if (!m.has(key)) {
        if (m.size > 8) m.clear();
        let s: LayoutSurface | null = null;
        try { s = layoutSurface(layout, o); } catch { s = null; }
        m.set(key, s);
    }
    return m.get(key) ?? null;
}

/** The mesh's frame: layout space (x, height, z) → the mesh's own, its size across and its height. */
function frameOf(base: BufferGeometry) {
    base.computeBoundingBox();
    const b = base.boundingBox!;
    const ext = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
    const c = [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2];
    const big = Math.max(...ext, 1e-6);
    const thin = ext.indexOf(Math.min(...ext));
    const up = ext[thin] <= big * 1e-3 ? thin : 1;          // a flat mesh's up is its thin side; otherwise Y
    const R = new Matrix4();
    let size: [number, number];
    if (up === 2) { R.set(1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1); size = [ext[0], ext[1]]; }       // (x, h, z) → (x, −z, h)
    else if (up === 0) { R.set(0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); size = [ext[1], ext[2]]; }  // (x, h, z) → (h, −x, z)
    else size = [ext[0], ext[2]];
    size = [Math.max(size[0], 1e-3), Math.max(size[1], 1e-3)];
    /** layout → mesh, the layout's 0 height at `level` along up ('mid' the middle, 'min' the bottom). */
    const matrix = (level: 'mid' | 'min') => {
        const t = [...c];
        if (level === 'min') t[up] = [b.min.x, b.min.y, b.min.z][up];
        return new Matrix4().makeTranslation(t[0], t[1], t[2]).multiply(R);
    };
    return { size, height: ext[up], big, matrix };
}

/**
 * The grounds (an area's holes that are grounds) as geometries, shaped like the mesh's layout: on a
 * flat mesh where the holes are; extruded, as the caps of their wells (at the top); cut, as the mesh's
 * own triangles inside them. UVs in the layout's metres (a texture's tile size is its material's
 * repeat). Empty when the layout has no grounds.
 */
export function applyShapeLayoutGrounds(base: BufferGeometry, shapeType: string | undefined, sl: ShapeLayout, layout: ResolvedLayout | null = shapeLayoutData(sl)): Array<{ id: string; geometry: BufferGeometry }> {
    if (!layout || layout.kind !== 'area' || !base.getAttribute('position')?.count) return [];
    const o = optionsOf(sl, layout.kind);
    const s = surfaceOf(layout, o);
    if (!s?.grounds.length) return [];
    const f = frameOf(base);
    const mode = sl.mode ?? defaultShapeLayoutMode(shapeType);
    const tiled: LayoutApplyOptions = { ...o, uv: 'tile', repeat: 1 };
    if (mode === 'cut') {
        const M = f.matrix('mid'), local = base.clone().applyMatrix4(M.clone().invert());
        const out = s.grounds.map((g) => {
            const geometry = layoutCutGeometry(local, { ...s, positions: g.positions, index: g.index, edges: [], lines: [], grounds: [] }, f.size, o);
            geometry.applyMatrix4(M);
            return { id: g.id, geometry };
        }).filter((g) => g.geometry.getAttribute('position')?.count);
        local.dispose();
        return out;
    }
    const flat = !(f.height > f.big * 1e-3);
    const lift = mode === 'extrude' ? (flat ? f.big * 0.1 : f.height) : 0;
    const M = f.matrix(mode === 'extrude' && !flat ? 'min' : 'mid');
    return layoutGroundGeometries(s, f.size, tiled).map(({ id, geometry }) => {
        if (lift) { const p = geometry.getAttribute('position') as BufferAttribute; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + lift); }
        geometry.applyMatrix4(M);
        geometry.computeBoundingSphere();
        return { id, geometry };
    });
}

/**
 * The grounds fitted into `size` like shapeLayoutField (land: fit 'stretch' into the unit grid): each
 * ground's geometry with UVs across the layout's bounds (0…1 — a land tiles them by its scale), and
 * the factor its heights were multiplied by (divide to get the layout's own metres).
 */
export function shapeLayoutGroundGeometries(sl: ShapeLayout, size: [number, number], fit: 'even' | 'stretch' = 'even', layout: ResolvedLayout | null = shapeLayoutData(sl)): { heightScale: number; grounds: Array<{ id: string; geometry: BufferGeometry }> } {
    if (!layout || layout.kind !== 'area') return { heightScale: 1, grounds: [] };
    const o = { ...optionsOf(sl, layout.kind), fit, uv: 'fit' as const };
    const s = surfaceOf(layout, o);
    if (!s?.grounds.length) return { heightScale: 1, grounds: [] };
    const bw = Math.max(1e-6, s.bounds.maxX - s.bounds.minX), bd = Math.max(1e-6, s.bounds.maxZ - s.bounds.minZ);
    return { heightScale: Math.min(size[0] / bw, size[1] / bd), grounds: layoutGroundGeometries(s, size, o) };
}

/** Geometries as one (positions, normals, uvs; not indexed). */
function mergeParts(parts: BufferGeometry[]): BufferGeometry {
    const flat = parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const count = flat.reduce((n, g) => n + g.getAttribute('position').count, 0);
    const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), uv = new Float32Array(count * 2);
    let at = 0;
    for (const g of flat) {
        const p = g.getAttribute('position'), n = g.getAttribute('normal'), u = g.getAttribute('uv');
        pos.set(p.array as Float32Array, at * 3);
        if (n) nor.set(n.array as Float32Array, at * 3);
        if (u) uv.set(u.array as Float32Array, at * 2);
        at += p.count;
    }
    for (const g of parts) g.dispose();
    for (const g of flat) g.dispose();
    const out = new BufferGeometry();
    out.setAttribute('position', new BufferAttribute(pos, 3));
    out.setAttribute('normal', new BufferAttribute(nor, 3));
    out.setAttribute('uv', new BufferAttribute(uv, 2));
    return out;
}

/**
 * The mesh's geometry with the layout applied, or null when it can't be (no layout data yet, an
 * empty surface, nothing left after a cut). `base` is not changed — the caller keeps or disposes it.
 */
export function applyShapeLayout(base: BufferGeometry, shapeType: string | undefined, sl: ShapeLayout, layout: ResolvedLayout | null = shapeLayoutData(sl)): BufferGeometry | null {
    if (!layout || !base.getAttribute('position')?.count) return null;
    const o = optionsOf(sl, layout.kind);
    const s = surfaceOf(layout, o);
    if (!s) return null;
    const f = frameOf(base);
    const mode = sl.mode ?? defaultShapeLayoutMode(shapeType);
    let out: BufferGeometry;
    if (mode === 'surface') {
        out = layoutSurfaceGeometry(s, f.size, o);
        out.applyMatrix4(f.matrix('mid'));
    } else if (mode === 'extrude') {
        // a flat mesh extruded: a tenth of its size deep
        const h = f.height > f.big * 1e-3 ? f.height : f.big * 0.1;
        out = mergeParts(layoutExtrudeGeometry(s, f.size, h, o));
        out.applyMatrix4(f.matrix(f.height > f.big * 1e-3 ? 'min' : 'mid'));
    } else {
        const M = f.matrix('mid');
        const local = base.clone().applyMatrix4(M.clone().invert());
        out = layoutCutGeometry(local, s, f.size, o);
        local.dispose();
        out.applyMatrix4(M);
    }
    if (!out.getAttribute('position')?.count) { out.dispose(); return null; }
    out.computeBoundingBox();
    out.computeBoundingSphere();
    return out;
}

// ---------------------------------------------------------------------------- as a field (land)
/** Where a point stands against a shapeLayout fitted into `size` (metres, centred): inside, the layout's height there, how far from its edge. */
export interface ShapeLayoutField {
    /** What the layout's heights were multiplied by (its metres → the size's units). */
    heightScale: number;
    /** On the layout (not outside it, not in a hole). */
    contains(x: number, z: number): boolean;
    /** The layout's height there (fitted; 0 with heights off), NaN off it. */
    heightAt(x: number, z: number): number;
    /**
     * Distance to the nearest edge (outline, holes, ribbon sides), capped at `reach`, the unit
     * direction away from that edge (gx, gz) — the gradient of the distance — and the edge's height
     * at that nearest point (y, fitted; 0 when none is in reach).
     */
    edgeDistance(x: number, z: number, reach: number, out?: { d: number; gx: number; gz: number; y?: number }): { d: number; gx: number; gz: number; y?: number };
}

/**
 * A shapeLayout as a field over an object of `size` [width, depth] metres (centred, evenly fitted
 * as the meshes are): what a land object reads to keep its terrain on the layout and lift it by
 * the layout's heights. null: no layout data yet, or an empty surface.
 */
export function shapeLayoutField(sl: ShapeLayout, size: [number, number], layout: ResolvedLayout | null = shapeLayoutData(sl), fit: 'even' | 'stretch' = 'even'): ShapeLayoutField | null {
    if (!layout) return null;
    const o = { ...optionsOf(sl, layout.kind), fit };
    const s = surfaceOf(layout, o);
    if (!s) return null;
    const region = layoutSurfaceRegion(s, size, o);
    // every edge segment, bucketed on a grid for the nearest-edge query (cells sized to the reach asked for)
    // (thinned to a point every 1/400 of the size — an area's edge is sampled far finer for its fill)
    const segs: number[] = [], step = Math.max(size[0], size[1]) / 400;
    for (const e of layoutSurfaceEdges(s, size, o)) {
        let last = e[0];
        for (let i = 1; i < e.length; i++) {
            const q = e[i];
            if (i < e.length - 1 && Math.hypot(q[0] - last[0], q[2] - last[2]) < step) continue;
            segs.push(last[0], last[2], last[1], q[0], q[2], q[1]);   // x, z, height of each end
            last = q;
        }
    }
    const key = (c: number, r: number) => c * 100003 + r;
    const grids = new Map<number, Map<number, number[]>>();
    const gridFor = (cell: number) => {
        let b = grids.get(cell);
        if (b) return b;
        grids.set(cell, (b = new Map()));
        for (let k = 0; k < segs.length; k += 6) {
            const c0 = Math.floor(Math.min(segs[k], segs[k + 3]) / cell), c1 = Math.floor(Math.max(segs[k], segs[k + 3]) / cell);
            const r0 = Math.floor(Math.min(segs[k + 1], segs[k + 4]) / cell), r1 = Math.floor(Math.max(segs[k + 1], segs[k + 4]) / cell);
            for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) { const kk = key(c, r); let l = b.get(kk); if (!l) b.set(kk, (l = [])); l.push(k); }
        }
        return b;
    };
    const minCell = Math.max(size[0], size[1]) / 128;
    const stamp = new Int32Array(segs.length / 6);
    let query = 0;
    const bw = Math.max(1e-6, s.bounds.maxX - s.bounds.minX), bd = Math.max(1e-6, s.bounds.maxZ - s.bounds.minZ);
    return {
        heightScale: Math.min(size[0] / bw, size[1] / bd),
        contains: region.contains,
        heightAt: (x, z) => region.heightAt(x, z),
        edgeDistance(x, z, reach, out = { d: 0, gx: 0, gz: 0 }) {
            const cell = Math.max(minCell, reach / 3), b = gridFor(cell);
            let best = reach * reach, bx = 0, bz = 0, by = 0, found = false;
            const n = Math.ceil(reach / cell), c0 = Math.floor(x / cell), r0 = Math.floor(z / cell);
            query++;
            for (let c = c0 - n; c <= c0 + n; c++) for (let r = r0 - n; r <= r0 + n; r++) {
                const l = b.get(key(c, r));
                if (!l) continue;
                for (const k of l) {
                    const q = k / 6;
                    if (stamp[q] === query) continue;
                    stamp[q] = query;
                    const ax = segs[k], az = segs[k + 1], dx = segs[k + 3] - ax, dz = segs[k + 4] - az;
                    const L2 = dx * dx + dz * dz;
                    const t = L2 > 0 ? Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / L2)) : 0;
                    const px = ax + dx * t, pz = az + dz * t, d2 = (x - px) * (x - px) + (z - pz) * (z - pz);
                    if (d2 < best) { best = d2; bx = px; bz = pz; by = segs[k + 2] + (segs[k + 5] - segs[k + 2]) * t; found = true; }
                }
            }
            if (!found) { out.d = reach; out.gx = 0; out.gz = 0; out.y = 0; return out; }
            const d = Math.sqrt(best);
            out.d = d; out.gx = d > 1e-9 ? (x - bx) / d : 0; out.gz = d > 1e-9 ? (z - bz) / d : 0; out.y = by;
            return out;
        },
    };
}

// ---------------------------------------------------------------------------- checking (scripts, saved data)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: number, [a, b]: readonly [number, number]) => Math.min(b, Math.max(a, v));

/**
 * A shapeLayout from a script or saved data, merged over the current one (a new source — ref, area,
 * path or grid — replaces the old source; options merge). null / false removes it.
 */
export function validateShapeLayout(raw: unknown, current?: ShapeLayout | null): { value: ShapeLayout | null; errors: string[]; warnings: string[] } {
    const errors: string[] = [], warnings: string[] = [];
    if (raw === null || raw === false) return { value: null, errors, warnings };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { value: null, errors: [`shapeLayout must be an object { ref | area | path | grid, mode?, width?, part?, heights?, uv?, repeat?, groundTexture?, groundTextures? } or null to remove it, got ${JSON.stringify(raw)}.`], warnings };
    const r = raw as Record<string, unknown>;
    const known = ['ref', 'area', 'path', 'grid', 'mode', 'heights', 'uv', 'repeat', 'width', 'part', 'groundTexture', 'groundTextures'];
    const extra = Object.keys(r).filter((k) => !known.includes(k));
    if (extra.length) warnings.push(`shapeLayout: ignored ${extra.join(', ')} (it takes ${known.join(', ')}).`);
    const sources = (['ref', 'area', 'path', 'grid'] as const).filter((k) => r[k] !== undefined && r[k] !== null);
    if (sources.length > 1) errors.push(`shapeLayout takes one source — ref, area, path or grid — got ${sources.join(' + ')}.`);
    const out: ShapeLayout = {};
    if (sources.length === 0 && current) { for (const k of ['ref', 'area', 'path', 'grid'] as const) if (current[k] !== undefined) (out as Record<string, unknown>)[k] = current[k]; }
    const src = sources[0];
    if (src === 'ref') {
        const ref = r.ref;
        if (typeof ref !== 'string' || !ref.trim()) errors.push(`shapeLayout.ref must be a saved layout's asset id or 'preset:<kind>:<id>', got ${JSON.stringify(ref)}.`);
        else if (isLayoutPresetRef(ref) && !layoutPresetOfRef(ref)) {
            const kind = ref.split(':')[1] as LayoutPresetKind;
            errors.push(LAYOUT_PRESET_KINDS.includes(kind)
                ? `shapeLayout.ref: no built-in ${kind} ${JSON.stringify(ref)} — one of ${layoutPresetRefsOf(kind).map((r) => `'${r}'`).join(', ')}.`
                : `shapeLayout.ref: no built-in layout ${JSON.stringify(ref)} — a preset is 'preset:<kind>:<id>' with kind ${LAYOUT_PRESET_KINDS.join(' | ')}.`);
        }
        else out.ref = ref.trim();
    } else if (src === 'area') {
        const { input, errors: e } = validateArea(r.area);
        if (!input) errors.push(...e.map((x) => `shapeLayout.area: ${x}`));
        else out.area = input;
    } else if (src === 'path') {
        const p = r.path as Record<string, unknown>;
        const raw3 = Array.isArray(p?.points) ? (p.points as unknown[]) : [];
        // [x, z] points are on the ground; [x, y, z] keep their heights
        const pts = raw3.filter((q): q is number[] => Array.isArray(q) && (q.length === 2 || q.length === 3) && q.every(isNum))
            .map((q) => (q.length === 2 ? [q[0], 0, q[1]] : [q[0], q[1], q[2]]) as [number, number, number]);
        if (pts.length < 2 || pts.length !== raw3.length) errors.push(`shapeLayout.path.points must be 2 or more points [x, z] or [x, y, z] in metres.`);
        else out.path = { points: pts, curve: isNum(p.curve) ? clamp(p.curve, [0, 1]) : 0.5, smoothCorners: isNum(p.smoothCorners) ? clamp(p.smoothCorners, [0, 1]) : 0, loop: !!p.loop } as PathLineInput;
    } else if (src === 'grid') {
        const { layout, errors: e } = validateGridLayout(r.grid);
        if (!layout) errors.push(...e.map((x) => `shapeLayout.grid: ${x}`));
        else out.grid = layout;
    }
    if (!out.ref && !out.area && !out.path && !out.grid && !errors.length) errors.push('shapeLayout needs a source: ref (a saved layout or \'preset:<kind>:<id>\'), or the layout inline as area, path or grid.');
    // options: the new ones over the current
    const pick = <K extends keyof ShapeLayout>(k: K) => (r[k] !== undefined ? r[k] : current?.[k]);
    const mode = pick('mode');
    if (mode !== undefined && mode !== null) {
        if (SHAPE_LAYOUT_MODES.includes(mode as ShapeLayoutMode)) out.mode = mode as ShapeLayoutMode;
        else errors.push(`shapeLayout.mode must be one of ${SHAPE_LAYOUT_MODES.join(', ')} (or left out: by the mesh), got ${JSON.stringify(mode)}.`);
    }
    const heights = pick('heights');
    if (heights !== undefined) out.heights = heights !== false;
    const uv = pick('uv');
    if (uv !== undefined && uv !== null) { if (uv === 'fit' || uv === 'tile') out.uv = uv; else errors.push(`shapeLayout.uv must be 'fit' or 'tile', got ${JSON.stringify(uv)}.`); }
    for (const k of ['repeat', 'width'] as const) {
        const v = pick(k);
        if (v === undefined || v === null) continue;
        if (!isNum(v)) { errors.push(`shapeLayout.${k} must be a number (metres), got ${JSON.stringify(v)}.`); continue; }
        const c = clamp(v, SHAPE_LAYOUT_LIMITS[k]);
        if (c !== v) warnings.push(`shapeLayout.${k} ${v} → ${c} (range ${SHAPE_LAYOUT_LIMITS[k].join('–')}).`);
        out[k] = c;
    }
    const part = pick('part');
    if (part !== undefined && part !== null) { if (part === 'blocks' || part === 'streets') out.part = part; else errors.push(`shapeLayout.part must be 'blocks' or 'streets', got ${JSON.stringify(part)}.`); }
    // the grounds' textures: { set, maps?, tileSize? } (a set name alone is filled from the library by the app)
    const tex = (v: unknown, where: string): UrbanTextureRef | null => {
        if (typeof v === 'string' && v.trim()) return { set: v.trim(), maps: {}, tileSize: 4 };
        const t = v as Record<string, unknown> | null;
        if (!t || typeof t !== 'object' || typeof t.set !== 'string') { errors.push(`${where} must be a texture set name or { set, tileSize? }, got ${JSON.stringify(v)}.`); return null; }
        return { set: t.set, maps: (t.maps && typeof t.maps === 'object' ? t.maps : {}) as UrbanTextureRef['maps'], tileSize: isNum(t.tileSize) ? clamp(t.tileSize, [0.1, 500]) : 4 };
    };
    const gt = pick('groundTexture');
    if (gt !== undefined && gt !== null) { const t = tex(gt, 'shapeLayout.groundTexture'); if (t) out.groundTexture = t; }
    const gts = pick('groundTextures');
    if (gts !== undefined && gts !== null) {
        if (typeof gts !== 'object' || Array.isArray(gts)) errors.push(`shapeLayout.groundTextures must be { holeId: texture }, got ${JSON.stringify(gts)}.`);
        else {
            const map: Record<string, UrbanTextureRef> = {};
            for (const [id, v] of Object.entries(gts as Record<string, unknown>)) { const t = tex(v, `shapeLayout.groundTextures.${id}`); if (t) map[id] = t; }
            if (Object.keys(map).length) out.groundTextures = map;
        }
    }
    if (out.area && (out.width !== undefined || out.part !== undefined)) warnings.push('shapeLayout: width and part are for paths and grids — an area ignores them.');
    if (out.path && out.part !== undefined) warnings.push('shapeLayout.part is for grids — a path ignores it.');
    return { value: errors.length ? null : out, errors, warnings };
}
