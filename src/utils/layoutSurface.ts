// =============================================================================
// layoutSurface — a layout (area, path or grid) applied to an object: the surface it becomes
// =============================================================================
//
// From the lab (Claude outputs/layout-apply-lab). ONE way for every layout kind to reshape an
// object (a plane mesh, a land): the layout is reduced to a surface — triangles in its own metres,
// holes left out, heights kept — and the object takes that surface fitted into its own size.
//   area   the area itself (core buildArea: outline, holes, the harmonic surface)
//   path   a ribbon `width` metres wide along the path, at its heights (a road, a river)
//   grid   part 'blocks': every block (cell between the street centre lines, merged cells as one),
//          inset by half a street;  part 'streets': a ribbon `width` wide along every street
// The object's own geometry is not touched: applying is a field on the object, removing it
// brings the original back. Meshes: config.shapeLayout (shapeLayout.ts — the frame, modes, checks).
// What applying does depends on the object (its default mode; `mode` overrides):
//   surface   flat meshes — the geometry becomes the surface              (layoutSurfaceGeometry)
//   extrude   solid meshes — the surface is the footprint, the mesh's height its depth, walls on every edge (layoutExtrudeGeometry)
//   cut       curved meshes — the region from above is a stencil: triangles outside / in holes go (layoutCutGeometry)
//   place     models — copies placed by the layout: inside an area / block, along a path / street (layoutPlacePoints)
//
import { BufferAttribute, BufferGeometry, ShapeUtils, Vector2 } from 'three';
import { areaGrounds, buildArea, type AreaInput } from './areaShape';
import { buildPathLine, type PathLineInput } from './pathLine';
import { gridLayoutPlan, gridStreetPoints3d, type GridLayout } from './gridLayout';
import { gridGroundPolygons } from './gridGround';
import type { ResolvedLayout } from './layoutRefs';

type V3 = [number, number, number];

/** The options an object can set when it applies a layout — the same field for every kind. */
export interface LayoutApplyOptions {
    /** Use the layout's heights (default true); false lays it flat. */
    heights?: boolean;
    /** The texture over the surface: 'fit' its bounds once (default) or 'tile' every `repeat` metres of the layout. */
    uv?: 'fit' | 'tile';
    repeat?: number;
    /** path: the ribbon's width · grid streets: the street width · grid blocks: the street gap (metres, layout units). */
    width?: number;
    /** grid only: which part becomes the surface. */
    part?: 'blocks' | 'streets';
    /** What applying does (default: the object's — surface / extrude / cut / place). */
    mode?: 'surface' | 'extrude' | 'cut' | 'place';
    /** place: metres between copies (in the object's size). */
    spacing?: number;
    /** How the layout fills the size: 'even' (default — centred, one scale, the shape kept) or 'stretch'
     *  (each axis to the size: the bounds fill it exactly; heights take the smaller axis's scale). */
    fit?: 'even' | 'stretch';
}

/** A layout as a surface in its own metres: triangles (holes left out) and the edges (for drawing / fences). */
export interface LayoutSurface {
    positions: Float32Array;
    index: Uint32Array;
    edges: V3[][];
    /** The centre lines of ribbons (path, streets) — what `place` follows. */
    lines: V3[][];
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
    /**
     * The grounds (an area's holes that are grounds — core areaGrounds): each hole's own surface, in
     * the same metres, keyed by the hole's id. Not part of `positions` (the hole stays cut out there):
     * a consumer draws them with their own texture (layoutGroundGeometries).
     */
    grounds: Array<{ id: string; positions: Float32Array; index: Uint32Array }>;
}

// ---------------------------------------------------------------------------- the one entry point
export function layoutSurface(layout: ResolvedLayout, o: LayoutApplyOptions = {}): LayoutSurface | null {
    switch (layout.kind) {
        case 'area': return areaSurface(layout.area);
        case 'path': return pathSurface(layout.path, o.width ?? 4);
        case 'grid': return o.part === 'streets' ? gridStreetsSurface(layout.grid, o.width ?? 12) : gridBlocksSurface(layout.grid, o.width ?? 12);
    }
}

/**
 * The surface fitted into an object of `size` [width, depth] (centred, evenly scaled — heights by
 * the same factor), with UVs and normals: the geometry the object draws in place of its own.
 */
export function layoutSurfaceGeometry(s: LayoutSurface, size: [number, number], o: LayoutApplyOptions = {}): BufferGeometry {
    const { minX, maxX, minZ, maxZ } = s.bounds;
    const bw = Math.max(1e-6, maxX - minX), bd = Math.max(1e-6, maxZ - minZ);
    // the fit every mode shares (even, or stretched to the size — a land's): the region, edges and grounds all use it
    const f = fitOf(s, size, o);
    const n = s.positions.length / 3, pos = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    const rep = Math.max(1e-3, o.repeat ?? 10);
    for (let i = 0; i < n; i++) {
        const x = s.positions[i * 3], y = s.positions[i * 3 + 1], z = s.positions[i * 3 + 2];
        const q = f([x, y, z]);
        pos[i * 3] = q[0]; pos[i * 3 + 1] = q[1]; pos[i * 3 + 2] = q[2];
        if (o.uv === 'tile') { uv[i * 2] = x / rep; uv[i * 2 + 1] = -z / rep; }
        else { uv[i * 2] = (x - minX) / bw; uv[i * 2 + 1] = 1 - (z - minZ) / bd; }
    }
    // every triangle faces up (+Y): the surface is seen from above, single-sided materials included
    const idx = Uint32Array.from(s.index);
    for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
        const ny = (pos[c] - pos[a]) * (pos[b + 2] - pos[a + 2]) - (pos[b] - pos[a]) * (pos[c + 2] - pos[a + 2]);
        if (ny < 0) { const x = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = x; }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2));
    g.setIndex(new BufferAttribute(idx, 1));
    g.computeVertexNormals();
    return g;
}
/** The grounds as geometries, fitted exactly like the surface (the same bounds, so they sit in their holes). */
export function layoutGroundGeometries(s: LayoutSurface, size: [number, number], o: LayoutApplyOptions = {}): Array<{ id: string; geometry: BufferGeometry }> {
    return s.grounds.map((g) => ({ id: g.id, geometry: layoutSurfaceGeometry({ ...s, positions: g.positions, index: g.index, grounds: [] }, size, o) }));
}
/** The fit every mode shares: the layout centred and evenly scaled into the object's [width, depth] (heights by the same factor). */
function fitOf(s: LayoutSurface, size: [number, number], o: LayoutApplyOptions) {
    const { minX, maxX, minZ, maxZ } = s.bounds;
    const kx0 = size[0] / Math.max(1e-6, maxX - minX), kz0 = size[1] / Math.max(1e-6, maxZ - minZ), k = Math.min(kx0, kz0);
    const kx = o.fit === 'stretch' ? kx0 : k, kz = o.fit === 'stretch' ? kz0 : k, cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const f = (p: V3): V3 => [(p[0] - cx) * kx, o.heights === false ? 0 : p[1] * k, (p[2] - cz) * kz];
    return Object.assign(f, { k });
}
/** The surface's edges fitted the same way (for drawing them; extrude's walls). */
export function layoutSurfaceEdges(s: LayoutSurface, size: [number, number], o: LayoutApplyOptions = {}): V3[][] {
    const f = fitOf(s, size, o);
    return s.edges.map((e) => e.map(f));
}

// ---------------------------------------------------------------------------- extrude (solid meshes)
/**
 * The surface as a solid `height` deep (a box's height): the top is the surface lifted by `height`,
 * the bottom flat at 0, and a wall down every edge (outline, holes, ribbon and block edges).
 * Two geometries: the caps (the surface's UVs) and the walls (UVs along the wall, in metres / repeat).
 */
export function layoutExtrudeGeometry(s: LayoutSurface, size: [number, number], height: number, o: LayoutApplyOptions = {}): BufferGeometry[] {
    const top = layoutSurfaceGeometry(s, size, o);
    const tp = top.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < tp.count; i++) tp.setY(i, tp.getY(i) + height);
    top.computeVertexNormals();
    const bottom = layoutSurfaceGeometry(s, size, { ...o, heights: false });
    // the bottom faces down: flip its triangles
    const bi = bottom.getIndex()!.array as Uint32Array, flipped = new Uint32Array(bi.length);
    for (let k = 0; k < bi.length; k += 3) { flipped[k] = bi[k]; flipped[k + 1] = bi[k + 2]; flipped[k + 2] = bi[k + 1]; }
    bottom.setIndex(new BufferAttribute(flipped, 1));
    bottom.computeVertexNormals();
    // wall UVs at the caps' texel size: 'tile' every `repeat` metres of the layout, 'fit' one texture per the layout's longer side
    const k = fitOf(s, size, o).k, span = Math.max(s.bounds.maxX - s.bounds.minX, s.bounds.maxZ - s.bounds.minZ);
    const pos: number[] = [], uv: number[] = [], rep = Math.max(1e-3, o.uv === 'tile' ? o.repeat ?? 10 : span) * k;
    // each wall faces out: as built it faces left of travel — flipped where the inside is on the left
    // walls along a thinned edge (a point at least 1/300 of the size from the last): an area's edge is
    // sampled densely for its fill, a wall per sample is ~10× the triangles for no visible gain
    const region = layoutSurfaceRegion(s, size, o), eps = Math.max(size[0], size[1]) * 1e-3, step = Math.max(size[0], size[1]) / 300;
    for (const e of layoutSurfaceEdges(s, size, o).map((l) => thinLine(l, step))) {
        let along = 0;
        for (let i = 0; i + 1 < e.length; i++) {
            const a = e[i], b = e[i + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
            if (L < 1e-6) continue;
            const ya = a[1] + height, yb = b[1] + height, u0 = along / rep, u1 = (along + L) / rep;
            const mx = (a[0] + b[0]) / 2, mz = (a[2] + b[2]) / 2, lx = -(b[2] - a[2]) / L, lz = (b[0] - a[0]) / L;
            if (region.contains(mx + lx * eps, mz + lz * eps)) {
                pos.push(a[0], 0, a[2], b[0], yb, b[2], b[0], 0, b[2], a[0], 0, a[2], a[0], ya, a[2], b[0], yb, b[2]);
                uv.push(u0, 0, u1, yb / rep, u1, 0, u0, 0, u0, ya / rep, u1, yb / rep);
            } else {
                pos.push(a[0], 0, a[2], b[0], 0, b[2], b[0], yb, b[2], a[0], 0, a[2], b[0], yb, b[2], a[0], ya, a[2]);
                uv.push(u0, 0, u1, 0, u1, yb / rep, u0, 0, u1, yb / rep, u0, ya / rep);
            }
            along += L;
        }
    }
    const walls = new BufferGeometry();
    walls.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
    walls.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
    walls.computeVertexNormals();
    return [top, bottom, walls];
}

// ---------------------------------------------------------------------------- the region, fitted (cut, place)
/** The fitted surface as a region: is (x, z) on it, and its height there (its triangles, from above). */
export function layoutSurfaceRegion(s: LayoutSurface, size: [number, number], o: LayoutApplyOptions = {}) {
    const f = fitOf(s, size, o);
    const n = s.positions.length / 3, P = new Float64Array(n * 3);
    for (let i = 0; i < n; i++) { const q = f([s.positions[i * 3], s.positions[i * 3 + 1], s.positions[i * 3 + 2]]); P[i * 3] = q[0]; P[i * 3 + 1] = q[1]; P[i * 3 + 2] = q[2]; }
    const T = s.index, cell = Math.max(size[0], size[1]) / 48, cells = new Map<number, number[]>();
    const key = (c: number, r: number) => c * 100003 + r;
    for (let k = 0; k < T.length; k += 3) {
        const xs = [P[T[k] * 3], P[T[k + 1] * 3], P[T[k + 2] * 3]], zs = [P[T[k] * 3 + 2], P[T[k + 1] * 3 + 2], P[T[k + 2] * 3 + 2]];
        for (let c = Math.floor(Math.min(...xs) / cell); c <= Math.floor(Math.max(...xs) / cell); c++)
            for (let r = Math.floor(Math.min(...zs) / cell); r <= Math.floor(Math.max(...zs) / cell); r++) {
                const kk = key(c, r); let l = cells.get(kk); if (!l) cells.set(kk, (l = [])); l.push(k);
            }
    }
    const heightAt = (x: number, z: number): number => {
        for (const k of cells.get(key(Math.floor(x / cell), Math.floor(z / cell))) ?? []) {
            const i = T[k] * 3, j = T[k + 1] * 3, l = T[k + 2] * 3;
            const ax = P[i], az = P[i + 2], bx = P[j] - ax, bz = P[j + 2] - az, cx = P[l] - ax, cz = P[l + 2] - az, d = bx * cz - bz * cx;
            if (Math.abs(d) < 1e-12) continue;
            const px = x - ax, pz = z - az, u = (px * cz - pz * cx) / d, v = (bx * pz - bz * px) / d;
            if (u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9) return P[i + 1] + (P[j + 1] - P[i + 1]) * u + (P[l + 1] - P[i + 1]) * v;
        }
        return NaN;
    };
    return { contains: (x: number, z: number) => Number.isFinite(heightAt(x, z)), heightAt, fit: f };
}

// ---------------------------------------------------------------------------- cut (curved meshes)
/** The mesh with only what lies on the region (seen from above) kept: a triangle stays when its middle is on it. The mesh keeps its shape and UVs. */
export function layoutCutGeometry(base: BufferGeometry, s: LayoutSurface, size: [number, number], o: LayoutApplyOptions = {}): BufferGeometry {
    const region = layoutSurfaceRegion(s, size, o);
    const g = base.index ? base.toNonIndexed() : base.clone();
    const p = g.getAttribute('position') as BufferAttribute, uvA = g.getAttribute('uv') as BufferAttribute | undefined;
    const keepPos: number[] = [], keepUv: number[] = [];
    for (let t = 0; t < p.count; t += 3) {
        const mx = (p.getX(t) + p.getX(t + 1) + p.getX(t + 2)) / 3, mz = (p.getZ(t) + p.getZ(t + 1) + p.getZ(t + 2)) / 3;
        if (!region.contains(mx, mz)) continue;
        for (let k = 0; k < 3; k++) { keepPos.push(p.getX(t + k), p.getY(t + k), p.getZ(t + k)); if (uvA) keepUv.push(uvA.getX(t + k), uvA.getY(t + k)); }
    }
    const out = new BufferGeometry();
    out.setAttribute('position', new BufferAttribute(new Float32Array(keepPos), 3));
    if (uvA) out.setAttribute('uv', new BufferAttribute(new Float32Array(keepUv), 2));
    out.computeVertexNormals();
    return out;
}

// ---------------------------------------------------------------------------- place (models)
/**
 * Where copies go, in the object's size: along the centre lines (path, streets) every `spacing`, or
 * spread over the surface (area, blocks) about `spacing` apart — at the surface's height, with the
 * direction along a line (yaw, radians) so things can face along a road.
 */
export function layoutPlacePoints(s: LayoutSurface, size: [number, number], o: LayoutApplyOptions = {}): Array<{ x: number; y: number; z: number; yaw: number }> {
    const sp = Math.max(0.2, o.spacing ?? 2), out: Array<{ x: number; y: number; z: number; yaw: number }> = [];
    const f = fitOf(s, size, o);
    if (s.lines.length) {
        for (const l of s.lines) {
            const pts = l.map(f);
            let carry = sp / 2;
            for (let i = 0; i + 1 < pts.length; i++) {
                const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[2] - a[2]);
                const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]);
                for (let d = carry; d < L; d += sp) { const t = d / L; out.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, z: a[2] + (b[2] - a[2]) * t, yaw }); }
                carry = ((carry - L) % sp + sp) % sp;
            }
        }
        return out;
    }
    const region = layoutSurfaceRegion(s, size, o);
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let z = -size[1] / 2 + sp / 2; z < size[1] / 2; z += sp) {
        for (let x = -size[0] / 2 + sp / 2; x < size[0] / 2; x += sp) {
            const px = x + (rnd() - 0.5) * sp * 0.7, pz = z + (rnd() - 0.5) * sp * 0.7, y = region.heightAt(px, pz);
            if (Number.isFinite(y)) out.push({ x: px, y, z: pz, yaw: rnd() * Math.PI * 2 });
        }
    }
    return out;
}

// ---------------------------------------------------------------------------- area
function areaSurface(a: AreaInput): LayoutSurface | null {
    const shape = buildArea(a);
    if (!shape) return null;
    const line = (l: { samples: Float32Array; count: number }) => Array.from({ length: l.count }, (_, i) => [l.samples[i * 3], l.samples[i * 3 + 1], l.samples[i * 3 + 2]] as V3);
    const close = (pts: V3[]) => (pts.length ? [...pts, pts[0]] : pts);
    return {
        positions: shape.fill.positions, index: shape.fill.index,
        edges: [close(line(shape.outline)), ...shape.holes.map((h) => close(line(h.outline)))],
        lines: [], bounds: shape.bounds,
        grounds: areaGrounds(a).map((g) => ({ id: g.id, positions: g.positions, index: g.index })),
    };
}

// ---------------------------------------------------------------------------- ribbons (path, grid streets)
/** A ribbon `width` wide along points (each at its height): two rows of vertices, a triangle strip. */
function ribbon(pts: V3[], width: number, closed: boolean, out: Builder) {
    const n = pts.length;
    if (n < 2) return;
    const half = width / 2, base = out.count;
    out.lines.push(closed ? [...pts, pts[0]] : pts.slice());
    const left: V3[] = [], right: V3[] = [];
    for (let i = 0; i < n; i++) {
        const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1;
        const nx = -dz / L, nz = dx / L, p = pts[i];
        out.vert(p[0] + nx * half, p[1], p[2] + nz * half); left.push([p[0] + nx * half, p[1], p[2] + nz * half]);
        out.vert(p[0] - nx * half, p[1], p[2] - nz * half); right.push([p[0] - nx * half, p[1], p[2] - nz * half]);
    }
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
        const j = (i + 1) % n, a = base + i * 2, b = base + j * 2;
        out.tri(a, b, a + 1); out.tri(a + 1, b, b + 1);
    }
    if (closed) { out.edges.push([...left, left[0]], [...right, right[0]]); }
    else out.edges.push([...left, ...right.reverse(), left[0]]);
}

function pathSurface(p: PathLineInput, width: number): LayoutSurface | null {
    if ((p.points ?? []).length < 2) return null;
    const line = buildPathLine(p, Math.max(0.05, width / 4));
    const pts = Array.from({ length: line.count }, (_, i) => [line.samples[i * 3], line.samples[i * 3 + 1], line.samples[i * 3 + 2]] as V3);
    const b = new Builder();
    ribbon(pts, width, line.closed, b);
    return b.done();
}

// ---------------------------------------------------------------------------- grid
function gridStreetsSurface(g: GridLayout, width: number): LayoutSurface | null {
    const plan = gridLayoutPlan(g), removed = new Set(g.removed ?? []);
    const b = new Builder();
    for (const s of plan.streets) if (!removed.has(s.id)) ribbon(gridStreetPoints3d(plan, s, 0, 0, Math.max(1, width / 3)), width, false, b);
    return b.done();
}

/** Every block: a ground per cell (merged cells as one) — core gridGroundPolygons, the outline through the street centres — inset by half the street. */
function gridBlocksSurface(g: GridLayout, street: number): LayoutSurface | null {
    const plan0 = gridLayoutPlan(g);
    const grounds = plan0.cells.map((c) => {
        const cells: string[] = [];
        for (let r = c.row; r < c.row + c.rows; r++) for (let q = c.col; q < c.col + c.cols; q++) cells.push(`${q},${r}`);
        return { id: c.id, cells };
    });
    const plan = { ...plan0, layout: { ...plan0.layout, grounds } };
    const b = new Builder();
    for (const ground of gridGroundPolygons(plan, Math.max(1, street / 3))) {
        for (const o of ground.outlines) {
            if (o.hole) continue;
            const ring = inset(o.points, street / 2);
            if (ring.length < 3) continue;
            const base = b.count;
            for (const p of ring) b.vert(p[0], p[1], p[2]);
            for (const t of ShapeUtils.triangulateShape(ring.map((p) => new Vector2(p[0], p[2])), [])) b.tri(base + t[0], base + t[1], base + t[2]);
            b.edges.push([...ring, ring[0]]);
        }
    }
    return b.done();
}

/** A line keeping a point once it is `step` from the last kept one (the ends always kept). */
function thinLine(l: V3[], step: number): V3[] {
    if (l.length < 3) return l;
    const out: V3[] = [l[0]];
    for (let i = 1; i < l.length - 1; i++) {
        const q = out[out.length - 1];
        if (Math.hypot(l[i][0] - q[0], l[i][2] - q[2]) >= step) out.push(l[i]);
    }
    out.push(l[l.length - 1]);
    return out;
}

/** A closed ring moved `d` inward (miter offset; clockwise or not), heights kept. */
function inset(pts: V3[], d: number): V3[] {
    const n = pts.length;
    let s = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], c = pts[(i + 1) % n]; s += a[0] * c[2] - c[0] * a[2]; }
    const sign = s > 0 ? 1 : -1;   // positive: clockwise from above (x east, z south) — inward is (−dz, dx)
    const out: V3[] = [];
    for (let i = 0; i < n; i++) {
        const p = pts[(i - 1 + n) % n], c = pts[i], q = pts[(i + 1) % n];
        const n1 = unitNormal(p, c, sign), n2 = unitNormal(c, q, sign);
        let mx = n1[0] + n2[0], mz = n1[1] + n2[1];
        const ml = Math.hypot(mx, mz) || 1;
        mx /= ml; mz /= ml;
        const cos = Math.max(0.3, mx * n1[0] + mz * n1[1]);
        out.push([c[0] + (mx * d) / cos, c[1], c[2] + (mz * d) / cos]);
    }
    return out;
}
function unitNormal(a: V3, b: V3, sign: number): [number, number] {
    const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1;
    return [(-dz / L) * sign, (dx / L) * sign];
}

class Builder {
    pos: number[] = [];
    idx: number[] = [];
    edges: V3[][] = [];
    lines: V3[][] = [];
    get count() { return this.pos.length / 3; }
    vert(x: number, y: number, z: number) { this.pos.push(x, y, z); }
    tri(a: number, b: number, c: number) { this.idx.push(a, b, c); }
    done(): LayoutSurface | null {
        if (!this.idx.length) return null;
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (let i = 0; i < this.pos.length; i += 3) { minX = Math.min(minX, this.pos[i]); maxX = Math.max(maxX, this.pos[i]); minZ = Math.min(minZ, this.pos[i + 2]); maxZ = Math.max(maxZ, this.pos[i + 2]); }
        return { positions: Float32Array.from(this.pos), index: Uint32Array.from(this.idx), edges: this.edges, lines: this.lines, bounds: { minX, maxX, minZ, maxZ }, grounds: [] };
    }
}
