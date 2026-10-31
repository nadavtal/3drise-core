// =============================================================================
// meshEdit — a mesh's own shape, edited: `config.edit` on a mesh object
// =============================================================================
//
// The config tab's "Edit mesh" opens the editor that fits the mesh; the result is saved on the
// mesh's config as one field, and the viewer applies it after building the mesh as always
// (removing the field brings the original back):
//
//   config.edit = {
//     area?: AreaInput   the mesh's outline — the same area every layout uses (core areaShape, the
//                        area editor): flat meshes become its surface, solid ones its extrusion,
//                        symbols (heart, star…) their outline extruded to their depth
//     cage?: MeshCage    any other mesh, bent through a cage of control points round it
//   }
//
// A lathe's profile is its own config (`profile`, `curve`) — the editor edits those directly.
// What a mesh takes (meshEditKind) goes by its type. An outline is applied through applyShapeLayout
// (the one way a layout reshapes a mesh), fitted into the mesh's own size; the cage after it.
//
// The cage: size × size × size points spanning the mesh's bounds (a Bernstein free-form deformation
// — Blender's lattice). `points` holds only the moved ones, keyed 'i,j,k' (x, y, z index, 0 at the
// min side), each an offset as a share of the mesh's largest extent — so it holds when the mesh is
// resized. The rest cage changes nothing.
//
import { BufferAttribute, type BufferGeometry } from 'three';
import { centerArea, validateArea, type AreaInput } from './areaShape';
import { shapePoints, type OutlineSpec } from './shape';
import { applyShapeLayout, applyShapeLayoutGrounds, FLAT_LAYOUT_SHAPES, shapeLayoutData, type ShapeLayout } from './shapeLayout';

type V3 = [number, number, number];

export interface MeshCage {
    /** Points per side: 2, 3 or 4. */
    size: number;
    /** The moved points: 'i,j,k' → [dx, dy, dz] as shares of the mesh's largest extent. */
    points: Record<string, V3>;
}
export interface MeshEdit {
    area?: AreaInput;
    cage?: MeshCage;
}
/** Which editor a mesh takes: its outline (area), its profile (a lathe's own config), or a cage. Null: none. */
export type MeshEditKind = 'area' | 'profile' | 'cage';

export const MESH_CAGE_SIZES = [2, 3, 4] as const;
/** The furthest a cage point may move (shares of the mesh's largest extent). */
export const MESH_CAGE_MAX_OFFSET = 2;

type ShapeCfg = { type?: string; [k: string]: unknown };
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** The symbol meshes (extruded 2D shapes, standing up) and their outline in the shape API. */
const SYMBOL_OUTLINES: Record<string, (c: ShapeCfg) => OutlineSpec> = {
    heart: () => ({ kind: 'heart', size: 40 }),
    spade: () => ({ kind: 'spade', size: 40 }),
    club: () => ({ kind: 'club', size: 40 }),
    diamond: () => ({ kind: 'diamond', size: 40 }),
    droplet: () => ({ kind: 'droplet', size: 40 }),
    lightning: () => ({ kind: 'lightning', size: 40 }),
    shield: () => ({ kind: 'shield', size: 40 }),
    infinity: () => ({ kind: 'infinity', size: 40 }),
    star: (c) => ({ kind: 'star', size: 40, points: Math.round(num(c.points, 5)) }),
    sparkle: (c) => ({ kind: 'sparkle', size: 40, points: Math.round(num(c.points, 4)) }),
    polygon: (c) => ({ kind: 'polygon', size: 40, sides: Math.round(num(c.sides, 6)) }),
    gear: (c) => ({ kind: 'gear', size: 40, teeth: Math.round(num(c.teeth, 12)) }),
    flower: (c) => ({ kind: 'flower', size: 40, petals: Math.round(num(c.petals, 6)) }),
    superformula: (c) => ({ kind: 'superformula', size: 40, symmetry: Math.round(num(c.symmetry, 5)) }),
};
const SHARP_SYMBOLS = new Set(['star', 'polygon', 'diamond', 'lightning', 'gear']);
/** Meshes whose outline is edited (the rest of the solid / flat ones a layout extrudes or becomes). */
const AREA_MESHES = new Set(['plane', 'ring', 'arcPlane', 'box', 'cylinder', 'extrude', 'outline', ...Object.keys(SYMBOL_OUTLINES)]);
/** Meshes with nothing to edit by points. */
const NO_EDIT = new Set(['point', 'text']);

export function meshEditKind(type: string | undefined): MeshEditKind | null {
    if (!type || NO_EDIT.has(type)) return null;
    if (type === 'lathe') return 'profile';
    return AREA_MESHES.has(type) ? 'area' : 'cage';
}

/** Symbols and upright extrusions stand in the XY plane: their outline's heights go along Z (their depth). */
const meshEditUpAxis = (c: ShapeCfg): 2 | undefined =>
    SYMBOL_OUTLINES[c.type ?? ''] || (c.type === 'extrude' && c.orientation === 'upright') ? 2 : undefined;

/** The layout an edited outline is applied as: a flat mesh becomes it, every other one is extruded from it. */
export function meshEditLayout(c: ShapeCfg & { edit?: MeshEdit | null }): ShapeLayout | null {
    const area = c.edit?.area;
    if (!area || meshEditKind(c.type) !== 'area') return null;
    return { area, mode: FLAT_LAYOUT_SHAPES.has(c.type ?? '') ? 'surface' : 'extrude' };
}

/**
 * The mesh's geometry with its edit applied (the base as built from the config): the outline, then
 * the cage. Returns the base itself when there is nothing to apply (or the outline gives nothing).
 * `grounds`: the outline's ground holes (as applyShapeLayoutGrounds).
 */
export function applyMeshEdit(base: BufferGeometry, c: ShapeCfg & { edit?: MeshEdit | null }): { geometry: BufferGeometry; grounds: Array<{ id: string; geometry: BufferGeometry }>; layout: ShapeLayout | null } {
    let geometry = base, grounds: Array<{ id: string; geometry: BufferGeometry }> = [];
    const sl = meshEditLayout(c);
    if (sl) {
        const up = meshEditUpAxis(c), layout = shapeLayoutData(sl);
        const shaped = applyShapeLayout(base, c.type, sl, layout, up);
        if (shaped) { geometry = shaped; grounds = applyShapeLayoutGrounds(base, c.type, sl, layout, up); }
    }
    const cage = c.edit?.cage;
    if (cage && Object.keys(cage.points ?? {}).length) {
        const bent = applyMeshCage(geometry, cage);
        if (geometry !== base) geometry.dispose();
        geometry = bent;
    }
    return { geometry, grounds, layout: sl };
}

// ---------------------------------------------------------------------------- where an edit starts
/** Points of a dense outline thinned to about `n` (an area rounds between them). */
function thin(pts: V3[], n: number): V3[] {
    if (pts.length <= n) return pts;
    const step = pts.length / n, out: V3[] = [];
    for (let k = 0; k < n; k++) out.push(pts[Math.floor(k * step)]);
    return out;
}
const round2 = (p: V3): V3 => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100, Math.round(p[2] * 100) / 100];

/**
 * The outline the editor opens with: the mesh's edit, else an area the mesh takes from its Layout
 * tab (layout.shape — the editor takes it over), else the mesh's own outline (a symbol's from the
 * shape API, an extrusion's points, a plane's rectangle, a cylinder's circle, a box's square).
 * In the editor's metres (about 40 across; an outline is fitted into the mesh's size either way).
 */
export function meshEditStartArea(c: ShapeCfg & { edit?: MeshEdit | null }, layoutShape?: ShapeLayout | null): AreaInput {
    if (c.edit?.area) return c.edit.area;
    // centred on the origin as the editor keeps it (so opening it changes nothing)
    const start = startOutline(c, layoutShape), m = centerArea(start);
    return Math.hypot(m.center[0], m.center[1]) < 0.005 ? start : { ...m.input, points: m.input.points.map(round2) };
}
function startOutline(c: ShapeCfg & { edit?: MeshEdit | null }, layoutShape?: ShapeLayout | null): AreaInput {
    const fromLayout = layoutShape ? shapeLayoutData(layoutShape) : null;
    if (fromLayout?.kind === 'area') return fromLayout.area;
    const type = c.type ?? 'box';
    const sym = SYMBOL_OUTLINES[type];
    if (sym) {
        const pts = shapePoints(sym(c)).points as V3[];
        // sharp symbols keep straight sides; curved ones round between their (thinned) points
        return { points: thin(pts, 40).map(round2), curve: SHARP_SYMBOLS.has(type) ? 0 : 0.6, smoothCorners: 0 };
    }
    if ((type === 'extrude' || type === 'outline') && Array.isArray(c.points) && c.points.length >= 3) {
        const p = c.points as number[][];
        let r = 0;
        for (const q of p) r = Math.max(r, Math.abs(q[0]), Math.abs(q[1]));
        const k = r > 0 ? 20 / r : 1;
        const holes = type === 'extrude' && Array.isArray(c.holes)
            ? (c.holes as number[][][]).filter((h) => h.length >= 3).map((h, i) => ({ id: `h${i + 1}`, points: h.map((q) => round2([q[0] * k, 0, q[1] * k])) }))
            : [];
        return { points: p.map((q) => round2([q[0] * k, 0, q[1] * k])), curve: num(c.curve, 0), smoothCorners: 0, ...(holes.length ? { holes } : {}) } as AreaInput;
    }
    if (type === 'cylinder' || type === 'ring') return { points: thin(shapePoints({ kind: 'ellipse', size: 40 }).points as V3[], 12).map(round2), curve: 1, smoothCorners: 0 };
    const w = type === 'plane' ? num(c.width, 1) : 1, d = type === 'plane' ? num(c.height, 1) : 1;
    const k = 40 / Math.max(w, d, 1e-6), hx = (w * k) / 2, hz = (d * k) / 2;
    return { points: [[-hx, 0, -hz], [hx, 0, -hz], [hx, 0, hz], [-hx, 0, hz]].map((p) => round2(p as V3)), curve: 0, smoothCorners: 0 };
}

// ---------------------------------------------------------------------------- the cage
const binom = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const bern = (n: number, i: number, t: number) => binom(n, i) * t ** i * (1 - t) ** (n - i);
export const meshCageKey = (i: number, j: number, k: number) => `${i},${j},${k}`;

/** The mesh's bounds as the cage spans them: min, extents (a flat side kept at 0) and the largest extent. */
export function meshCageFrame(g: BufferGeometry) {
    g.computeBoundingBox();
    const b = g.boundingBox!;
    const min: V3 = [b.min.x, b.min.y, b.min.z], ext: V3 = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
    return { min, ext, big: Math.max(ext[0], ext[1], ext[2], 1e-6) };
}
/** The cage's points at rest, in mesh space (index i,j,k → (i * size + j) * size + k). */
export function meshCageRestPoints(g: BufferGeometry, size: number): V3[] {
    const { min, ext } = meshCageFrame(g), n = Math.max(1, size - 1), out: V3[] = [];
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) for (let k = 0; k < size; k++)
        out.push([min[0] + (ext[0] * i) / n, min[1] + (ext[1] * j) / n, min[2] + (ext[2] * k) / n]);
    return out;
}
/** The cage's points as they are (rest + offsets), in mesh space. */
export function meshCagePoints(g: BufferGeometry, cage: MeshCage): V3[] {
    const { big } = meshCageFrame(g), s = cage.size, rest = meshCageRestPoints(g, s);
    for (const [key, o] of Object.entries(cage.points ?? {})) {
        const [i, j, k] = key.split(',').map(Number), c = (i * s + j) * s + k;
        if (rest[c]) rest[c] = [rest[c][0] + o[0] * big, rest[c][1] + o[1] * big, rest[c][2] + o[2] * big];
    }
    return rest;
}

/** A new geometry: `g` bent through the cage (only the moved points move it — the rest cage is the identity). */
export function applyMeshCage(g: BufferGeometry, cage: MeshCage): BufferGeometry {
    const out = g.clone();
    const s = Math.round(cage.size), n = s - 1;
    const moved = Object.entries(cage.points ?? {}).map(([key, o]) => { const [i, j, k] = key.split(',').map(Number); return { i, j, k, o }; })
        .filter((m) => [m.i, m.j, m.k].every((v) => Number.isInteger(v) && v >= 0 && v < s));
    if (!moved.length || n < 1) return out;
    const { min, ext, big } = meshCageFrame(g);
    const pos = out.getAttribute('position') as BufferAttribute;
    const share = (v: number, a: 0 | 1 | 2) => (ext[a] > big * 1e-6 ? (v - min[a]) / ext[a] : 0.5);
    for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
        const sx = share(x, 0), sy = share(y, 1), sz = share(z, 2);
        let dx = 0, dy = 0, dz = 0;
        for (const m of moved) {
            const w = bern(n, m.i, sx) * bern(n, m.j, sy) * bern(n, m.k, sz);
            dx += w * m.o[0]; dy += w * m.o[1]; dz += w * m.o[2];
        }
        pos.setXYZ(v, x + dx * big, y + dy * big, z + dz * big);
    }
    pos.needsUpdate = true;
    out.computeVertexNormals();
    out.computeBoundingBox();
    out.computeBoundingSphere();
    return out;
}

// ---------------------------------------------------------------------------- checks (the agent, the API)
export function validateMeshEdit(raw: unknown, type?: string): { value: MeshEdit | null; errors: string[]; warnings: string[] } {
    const errors: string[] = [], warnings: string[] = [];
    if (raw === null || raw === false) return { value: null, errors, warnings };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { value: null, errors: [`edit must be an object { area?, cage? } or null to remove it, got ${JSON.stringify(raw)}.`], warnings };
    const r = raw as Record<string, unknown>, out: MeshEdit = {};
    const extra = Object.keys(r).filter((k) => k !== 'area' && k !== 'cage');
    if (extra.length) warnings.push(`edit: ignored ${extra.join(', ')} (it takes area, cage).`);
    const kind = meshEditKind(type);
    if (kind === 'profile') warnings.push(`edit: a lathe is edited by its own profile and curve (config.profile, config.curve).`);
    if (r.area !== undefined && r.area !== null) {
        if (type && kind !== 'area') errors.push(`edit.area: a ${type} has no outline to edit — use edit.cage.`);
        else {
            const { input, errors: e } = validateArea(r.area);
            if (!input) errors.push(...e.map((x) => `edit.area: ${x}`));
            else out.area = input;
        }
    }
    if (r.cage !== undefined && r.cage !== null) {
        const c = r.cage as Record<string, unknown>;
        const size = c && typeof c === 'object' ? c.size : undefined;
        if (!(MESH_CAGE_SIZES as readonly number[]).includes(size as number)) errors.push(`edit.cage.size must be ${MESH_CAGE_SIZES.join(', ')} (points per side), got ${JSON.stringify(size)}.`);
        else {
            const s = size as number, pts: Record<string, V3> = {};
            const raw3 = c.points && typeof c.points === 'object' && !Array.isArray(c.points) ? (c.points as Record<string, unknown>) : null;
            if (c.points !== undefined && !raw3) errors.push(`edit.cage.points must be an object { 'i,j,k': [dx, dy, dz] } (the moved points), got ${JSON.stringify(c.points)}.`);
            for (const [key, v] of Object.entries(raw3 ?? {})) {
                const idx = key.split(',').map((x) => Number(x.trim()));
                if (idx.length !== 3 || !idx.every((x) => Number.isInteger(x) && x >= 0 && x < s)) { errors.push(`edit.cage.points: '${key}' is not a point of a ${s}×${s}×${s} cage — 'i,j,k' each 0..${s - 1} (x, y, z; 0 the min side).`); continue; }
                if (!Array.isArray(v) || v.length !== 3 || !v.every((x) => typeof x === 'number' && Number.isFinite(x))) { errors.push(`edit.cage.points['${key}'] must be [dx, dy, dz] (shares of the mesh's largest extent), got ${JSON.stringify(v)}.`); continue; }
                const o = (v as number[]).map((x) => Math.max(-MESH_CAGE_MAX_OFFSET, Math.min(MESH_CAGE_MAX_OFFSET, x))) as V3;
                if (o.some((x, q) => x !== (v as number[])[q])) warnings.push(`edit.cage.points['${key}'] kept to ±${MESH_CAGE_MAX_OFFSET}.`);
                if (o.some((x) => x !== 0)) pts[meshCageKey(idx[0], idx[1], idx[2])] = o;
            }
            out.cage = { size: s, points: pts };
        }
    }
    return { value: out.area || out.cage ? out : null, errors, warnings };
}

// ---------------------------------------------------------------------------- cage presets (3 × 3 × 3)
/** A 3-point cage from what each point does (i, j, k ∈ 0..2: x, y, z; 1 the middle); untouched points left out. */
function cage3(f: (i: number, j: number, k: number) => V3 | null): MeshCage {
    const points: Record<string, V3> = {};
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
        const o = f(i, j, k);
        if (o && o.some((v) => Math.abs(v) > 1e-9)) points[meshCageKey(i, j, k)] = o.map((v) => Math.round(v * 1000) / 1000) as V3;
    }
    return { size: 3, points };
}
const turn = (i: number, k: number, a: number): V3 => {
    const x = (i - 1) * 0.5, z = (k - 1) * 0.5, c = Math.cos(a), s = Math.sin(a);
    return [x * c - z * s - x, 0, x * s + z * c - z];
};
/** Ready cages (the editor's presets; the agent can start from one). Offsets as shares of the mesh's largest extent. */
export const MESH_CAGE_PRESETS: Array<{ id: string; name: string; description: string; cage: MeshCage }> = [
    { id: 'taper', name: 'Taper', description: 'Narrower towards the top.', cage: cage3((i, j, k) => (j === 2 ? [-(i - 1) * 0.3, 0, -(k - 1) * 0.3] : null)) },
    { id: 'flare', name: 'Flare', description: 'Wider towards the top.', cage: cage3((i, j, k) => (j === 2 ? [(i - 1) * 0.3, 0, (k - 1) * 0.3] : null)) },
    { id: 'bulge', name: 'Bulge', description: 'Swollen round the middle.', cage: cage3((i, j, k) => (j === 1 ? [(i - 1) * 0.3, 0, (k - 1) * 0.3] : null)) },
    { id: 'pinch', name: 'Pinch', description: 'A waist round the middle.', cage: cage3((i, j, k) => (j === 1 ? [-(i - 1) * 0.3, 0, -(k - 1) * 0.3] : null)) },
    { id: 'stretch', name: 'Stretch', description: 'Pulled up from the top.', cage: cage3((i, j, k) => (j === 2 ? [0, 0.5, 0] : j === 1 ? [0, 0.15, 0] : null)) },
    { id: 'squash', name: 'Squash', description: 'Pressed down, spreading out.', cage: cage3((i, j, k) => (j === 2 ? [(i - 1) * 0.15, -0.35, (k - 1) * 0.15] : j === 1 ? [(i - 1) * 0.2, -0.15, (k - 1) * 0.2] : null)) },
    { id: 'lean', name: 'Lean', description: 'The top shifted to one side.', cage: cage3((i, j) => (j === 2 ? [0.35, 0, 0] : j === 1 ? [0.1, 0, 0] : null)) },
    { id: 'twist', name: 'Twist', description: 'The top turned a quarter round.', cage: cage3((i, j, k) => (j === 2 ? turn(i, k, Math.PI / 2) : j === 1 ? turn(i, k, Math.PI / 4) : null)) },
];

// ---------------------------------------------------------------------------- lathe profiles
/** Ready lathe profiles ([radius, y] bottom → top, metres — a lathe's config.profile and curve). */
export const LATHE_PROFILE_PRESETS: Array<{ id: string; name: string; description: string; profile: Array<[number, number]>; curve: number }> = [
    { id: 'vase', name: 'Vase', description: 'A round belly, a narrow neck, a lip.', profile: [[0.3, 0], [0.9, 0.3], [0.7, 1.2], [0.35, 1.8], [0.45, 2.3]], curve: 0.6 },
    { id: 'bowl', name: 'Bowl', description: 'Wide and shallow on a small foot.', profile: [[0.01, 0], [0.4, 0], [0.45, 0.08], [0.9, 0.35], [1.2, 0.75], [1.25, 0.8]], curve: 0.6 },
    { id: 'bottle', name: 'Bottle', description: 'A straight body, shoulders, a long neck.', profile: [[0.01, 0], [0.5, 0], [0.55, 0.1], [0.55, 1.3], [0.2, 1.75], [0.18, 2.3], [0.22, 2.35]], curve: 0.4 },
    { id: 'goblet', name: 'Goblet', description: 'A wide foot, a thin stem, a deep cup.', profile: [[0.01, 0], [0.6, 0], [0.12, 0.15], [0.08, 0.9], [0.4, 1.1], [0.65, 1.6], [0.7, 2]], curve: 0.6 },
    { id: 'cup', name: 'Cup', description: 'Straight sides, gently flared.', profile: [[0.01, 0], [0.5, 0], [0.55, 0.1], [0.7, 1.1], [0.72, 1.2]], curve: 0.3 },
    { id: 'lampshade', name: 'Lampshade', description: 'A cone, open at the top.', profile: [[1.1, 0], [0.95, 0.1], [0.5, 1.1], [0.45, 1.2]], curve: 0.2 },
    { id: 'pawn', name: 'Pawn', description: 'A chess pawn: base, collar, head.', profile: [[0.01, 0], [0.7, 0], [0.7, 0.15], [0.45, 0.3], [0.25, 1], [0.45, 1.1], [0.2, 1.2], [0.4, 1.45], [0.35, 1.75], [0.01, 1.9]], curve: 0.5 },
    { id: 'column', name: 'Column', description: 'A base, a slim shaft, a capital.', profile: [[0.01, 0], [0.75, 0], [0.75, 0.2], [0.5, 0.35], [0.42, 2.6], [0.6, 2.8], [0.75, 2.95], [0.75, 3.1], [0.01, 3.1]], curve: 0.15 },
];
