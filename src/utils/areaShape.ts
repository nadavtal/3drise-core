// =============================================================================
// areaShape — an area as one finished shape (what everything that uses an area gets)
// =============================================================================
//
// An area is authored as a closed CurveSpec (utils/curve — the ONE curving API): points ([x, y, z]
// — y is the point's height), rounding (`curve`), round corners (`smoothCorners`, per point
// `corners`), edge noise (`noise`), each side's own shape (`segments`: rounding, bend and lift,
// noise), how heights run between points (`heightCurve`), and holes — each hole is itself an
// area (an instance: the same fields, no holes of its own) cut out of the inside (an island in a
// lake, a fountain in a plaza). A hole can be a GROUND: still cut out of the area, but filled with
// a surface of its own (a lake bed, a lawn in a plaza) that the place using the area gives its own
// texture — `holeGround` sets it for every hole, a hole's own `ground` overrides it; each hole has a
// stable `id` ('h1', 'h2'…) that those textures are keyed by. Those are only for making it. Core builds the finished shape once
// from them (curveLine), and the Layouts drawing, the area editor, the gallery previews, every
// consumer and the AI use that same shape:
//   outline   the edge as an even closed PathLine (pathLine.ts) at its heights — a path too (a
//             fence, lamps, a walk along the edge); `holes[k].outline` each hole's edge
//   ring      the drawn polygon [x, z] of the outer edge (holes: `holes[k].ring`)
//   fill      the inside as a surface: triangles that leave the holes out, at heights that run
//             smoothly between every edge (a stretched sheet — the edges' heights, nothing else:
//             the harmonic surface they span). Flat when every edge is at one height.
//   area, perimeter, bounds, centroid
//   queries   inside (holes are outside), signed distance and nearest point on any edge (holes'
//             edges too), the surface's height (areaHeightAt), random / even points
//
// Units: an area is a shape in its own units (metres at scale 1). Its origin is its centre —
// buildArea moves it (holes too) so the middle of its outer edge's bounds is at x 0, z 0; heights
// stay as they are — and whatever uses it builds it in its own local space, so the object's
// transform places, turns and sizes it.
//
// Seen from above with x east and z south (like the grid ground outlines), the outer ring runs
// clockwise (its signed area Σ (x_i z_(i+1) − x_(i+1) z_i) / 2 is positive) and the holes
// anticlockwise, so every edge's outward normal (dz, −dx) points out of the area.
//
import { ShapeUtils, Vector2 } from 'three';
import { curveLine, type CurveSpec } from './curve';
import { pathLineFromDrawn, reversePathLine, type PathLine } from './pathLine';

type V3 = [number, number, number];

/** One ring of an area as authored: a closed CurveSpec (points [x, y, z], curve, smoothCorners, corners, noise, segments, heightCurve). */
export type AreaRingInput = Omit<CurveSpec, 'closed' | 'points'> & { points: V3[] };
/**
 * A hole: an area of its own (an instance — the same fields, no holes inside it) cut out of the inside.
 * `id`: stable ('h1', 'h2'…; never changes, so what is keyed by it — a ground's texture — stays put).
 * `ground`: filled with its own surface (true) or empty (false); left out: the area's `holeGround`.
 */
export type AreaHole = AreaRingInput & { id?: string; ground?: boolean };
/**
 * What an area is authored as (a `layout` asset of kind 'area' stores exactly this): its outer
 * ring (segments[i] is the side from point i to point i + 1; the last closes back) and its holes.
 * `holeGround`: every hole is a ground unless it says otherwise (default false: holes are empty).
 */
export type AreaInput = AreaRingInput & { holes?: AreaHole[]; holeGround?: boolean };

/** Is hole k a ground: its own `ground`, else the area's `holeGround`. */
export const areaHoleIsGround = (input: Pick<AreaInput, 'holes' | 'holeGround'>, k: number): boolean =>
    input.holes?.[k]?.ground ?? input.holeGround ?? false;
/** The id the next new hole gets ('h' + one more than the highest, like the grid's grounds). */
export function areaNextHoleId(input: Pick<AreaInput, 'holes'>): string {
    const n = (input.holes ?? []).reduce((m, h) => Math.max(m, Number(/^h(\d+)$/.exec(h.id ?? '')?.[1] ?? 0)), 0);
    return `h${n + 1}`;
}
/** Every hole with an id (missing ones given the next ids, in order); the same object when all have one. */
export function withHoleIds<T extends Pick<AreaInput, 'holes'>>(input: T): T {
    if (!input.holes?.some((h) => !h.id)) return input;
    let n = input.holes.reduce((m, h) => Math.max(m, Number(/^h(\d+)$/.exec(h.id ?? '')?.[1] ?? 0)), 0);
    const seen = new Set<string>();
    const holes = input.holes.map((h) => {
        if (h.id && !seen.has(h.id)) { seen.add(h.id); return h; }
        const id = `h${++n}`; seen.add(id);
        return { ...h, id };
    });
    return { ...input, holes };
}

export interface AreaBounds { minX: number; minZ: number; maxX: number; maxZ: number }

export interface AreaHoleShape {
    /** The hole's id (its authored one, else 'h' + its place). */
    id: string;
    /** A ground: filled with its own surface (areaGrounds), not empty. */
    ground: boolean;
    /** The hole's edge: even, closed, anticlockwise seen from above, at its heights. */
    outline: PathLine;
    /** Its drawn polygon, flat [x, z, …]. */
    ring: Float64Array;
    count: number;
}

export interface AreaShape {
    /** The outer edge: even, closed, clockwise seen from above, at its heights. */
    outline: PathLine;
    /** The outer drawn polygon, flat [x, z, …] (no repeated first point), clockwise. */
    ring: Float64Array;
    /** Points in `ring`. */
    count: number;
    /** The holes (valid ones), in the order authored. */
    holes: AreaHoleShape[];
    /** The inside: positions [x, y, z, …] (the edges' points, then inner points of a surface with height) and triangles. */
    fill: { positions: Float32Array; index: Uint32Array };
    /** Every edge at one height (the fill is flat at `height`). */
    flat: boolean;
    /** The height of a flat area (the first point's otherwise). */
    height: number;
    /** Covered (own units², holes taken off). */
    area: number;
    /** Every edge's length (outer + holes). */
    perimeter: number;
    bounds: AreaBounds;
    /** The covered shape's centroid (centre of mass, holes taken off) — not always the bounds' centre (0, 0). */
    centroid: [number, number];
    /** What buildArea took off the authoring points to centre them (the bounds' centre as drawn). */
    center: [number, number];
    /** An edge crosses itself or another edge, or a hole lies outside the area (the fill and the inside tests are then unreliable). */
    crosses: boolean;
    /** @internal every ring's edges together, for the queries. */
    _e: EdgeSet;
}

/** @internal every ring's points in one array; edge i runs from point i to next[i]. */
interface EdgeSet {
    xz: Float64Array;
    next: Int32Array;
    /** Which ring (0 outer, k + 1 hole k). */
    ringOf: Int32Array;
    /** Metres along its ring at each point. */
    along: Float64Array;
    n: number;
    grid: EdgeGrid;
}

// ---------------------------------------------------------------------------- building
/** A ring's drawn outline as its points are now (not centred): curveLine, closed, at its heights. */
export function areaOutline(input: AreaRingInput): { points: V3[]; knots: number[] } {
    const points = (input.points ?? []).map((p) => [p[0], p[1] ?? 0, p[2]] as V3);
    if (points.length < 3) return { points, knots: points.map((_, i) => i) };
    const d = curveLine({ ...input, points, closed: true });
    return { points: d.points as V3[], knots: d.knots };
}

/** The middle of the outer edge's drawn bounds (rounding, corners, bends and noise included), [x, z]. */
function drawnCentre(input: AreaRingInput): [number, number] {
    const points = input.points ?? [];
    if (!points.length) return [0, 0];
    const drawn = points.length > 2 ? areaOutline(input).points : points;
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const p of drawn) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2]); }
    return [(x0 + x1) / 2, (z0 + z1) / 2];
}

/** The outer points moved so the middle of the DRAWN outline's bounds is at x 0, z 0 (heights kept). */
export function centerAreaPoints(input: AreaRingInput): { points: V3[]; center: [number, number] } {
    const [cx, cz] = drawnCentre(input);
    return { points: (input.points ?? []).map((p) => [p[0] - cx, p[1] ?? 0, p[2] - cz] as V3), center: [cx, cz] };
}

/** The whole area (outer ring and holes) moved so the outer edge's drawn bounds are centred on x 0, z 0 — what the editor stores and buildArea does. */
export function centerArea(input: AreaInput): { input: AreaInput; center: [number, number] } {
    const [cx, cz] = drawnCentre(input);
    const move = (pts: V3[]) => pts.map((p) => [p[0] - cx, p[1] ?? 0, p[2] - cz] as V3);
    const out: AreaInput = { ...input, points: move(input.points ?? []) };
    if (input.holes) out.holes = input.holes.map((h) => ({ ...h, points: move(h.points ?? []) }));
    return { input: out, center: [cx, cz] };
}

const signedArea2 = (xz: ArrayLike<number>, n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; s += xz[i * 2] * xz[j * 2 + 1] - xz[j * 2] * xz[i * 2 + 1]; }
    return s / 2;
};

interface BuiltRing { xz: Float64Array; y: Float64Array; count: number; outline: PathLine; signed: number }
/** One ring drawn (curveLine), its repeated points dropped, turned to `clockwise` (from the same start, as reversePathLine keeps the outline's). */
function buildRing(r: AreaRingInput, clockwise: boolean, spacing: number): BuiltRing | null {
    const pts = (r.points ?? []).filter((p) => Array.isArray(p) && p.length >= 3 && Number.isFinite(p[0]) && Number.isFinite(p[2]));
    if (pts.length < 3) return null;
    const drawn = areaOutline({ ...r, points: pts });
    const ring: V3[] = [];
    for (const p of drawn.points) { const q = ring[ring.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[2] - p[2]) > 1e-7) ring.push(p); }
    if (ring.length > 2 && Math.hypot(ring[0][0] - ring[ring.length - 1][0], ring[0][2] - ring[ring.length - 1][2]) <= 1e-7) ring.pop();
    const count = ring.length;
    if (count < 3) return null;
    const flat2 = new Float64Array(count * 2);
    ring.forEach((p, i) => { flat2[i * 2] = p[0]; flat2[i * 2 + 1] = p[2]; });
    let signed = signedArea2(flat2, count);
    if (!(Math.abs(signed) > 1e-9)) return null;
    let outline = pathLineFromDrawn(drawn.points, drawn.knots, true, spacing);
    if ((signed > 0) !== clockwise) {
        const flipped = [ring[0], ...ring.slice(1).reverse()];
        ring.splice(0, ring.length, ...flipped);
        signed = -signed;
        outline = reversePathLine(outline);
    }
    const xz = new Float64Array(count * 2), y = new Float64Array(count);
    ring.forEach((p, i) => { xz[i * 2] = p[0]; xz[i * 2 + 1] = p[2]; y[i] = p[1]; });
    return { xz, y, count, outline, signed };
}

/** The finished area, built once from its authoring data (centred). Null with fewer than 3 distinct outer points or no area. Holes that can't be drawn are left out. */
export function buildArea(input: AreaInput, spacing = 0.05): AreaShape | null {
    const { input: centred, center } = centerArea(input);
    const outer = buildRing(centred, true, spacing);
    if (!outer) return null;
    const holeInfo: Array<{ id: string; ground: boolean }> = [];
    const holes = (centred.holes ?? []).map((h, k) => {
        const r = buildRing(h, false, spacing);
        if (r) holeInfo.push({ id: h.id ?? `h${k + 1}`, ground: areaHoleIsGround(centred, k) });
        return r;
    }).filter((h): h is BuiltRing => !!h);
    const rings = [outer, ...holes];

    // every ring's edges in one set (the queries go over all of them)
    const n = rings.reduce((s, r) => s + r.count, 0);
    const xz = new Float64Array(n * 2), ys = new Float64Array(n), next = new Int32Array(n), ringOf = new Int32Array(n), along = new Float64Array(n);
    let o = 0, perimeter = 0;
    rings.forEach((r, k) => {
        let acc = 0;
        for (let i = 0; i < r.count; i++) {
            const j = (i + 1) % r.count;
            xz[(o + i) * 2] = r.xz[i * 2]; xz[(o + i) * 2 + 1] = r.xz[i * 2 + 1]; ys[o + i] = r.y[i];
            next[o + i] = o + j; ringOf[o + i] = k; along[o + i] = acc;
            acc += Math.hypot(r.xz[j * 2] - r.xz[i * 2], r.xz[j * 2 + 1] - r.xz[i * 2 + 1]);
        }
        perimeter += acc;
        o += r.count;
    });
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < outer.count; i++) { const x = outer.xz[i * 2], z = outer.xz[i * 2 + 1]; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
    const bounds = { minX, minZ, maxX, maxZ };
    const e: EdgeSet = { xz, next, ringOf, along, n, grid: makeEdgeGrid(xz, next, n, bounds) };

    // covered area and centroid, holes taken off (a hole's signed area is negative)
    let sa = 0, cx = 0, cz = 0;
    for (const r of rings) {
        sa += r.signed;
        for (let i = 0; i < r.count; i++) {
            const j = (i + 1) % r.count, x = r.xz[i * 2], z = r.xz[i * 2 + 1], xn = r.xz[j * 2], zn = r.xz[j * 2 + 1], c = x * zn - xn * z;
            cx += (x + xn) * c; cz += (z + zn) * c;
        }
    }
    const centroid: [number, number] = sa > 1e-9 ? [cx / (6 * sa), cz / (6 * sa)] : [0, 0];

    // a hole out of the area, or edges that cross
    const holeOut = holes.some((h) => !containsIn(e, h.xz[0], h.xz[1], 0));
    const crosses = holeOut || edgesCross(e);

    // the fill: flat when every edge is at one height; otherwise inner points too, at the harmonic surface the edges span
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) { lo = Math.min(lo, ys[i]); hi = Math.max(hi, ys[i]); }
    const flat = hi - lo < 1e-6;
    const loops = rings.map((r) => Array.from({ length: r.count }, (_, i) => new Vector2(r.xz[i * 2], r.xz[i * 2 + 1])));
    let positions: Float32Array, index: Uint32Array;
    if (flat || crosses) {
        const tris = ShapeUtils.triangulateShape(loops[0], loops.slice(1));
        positions = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { positions[i * 3] = xz[i * 2]; positions[i * 3 + 1] = flat ? lo : ys[i]; positions[i * 3 + 2] = xz[i * 2 + 1]; }
        index = new Uint32Array(tris.length * 3);
        tris.forEach((t, k) => { index[k * 3] = t[0]; index[k * 3 + 1] = t[1]; index[k * 3 + 2] = t[2]; });
    } else {
        // a surface with height: an even mesh (surfaceFill — a triangle lattice inside, a band of triangles to the edges),
        // then the inner points settle into the harmonic sheet the edges span
        const fill = surfaceFill(rings, e, bounds, sa);
        // the outer edge's heights: the stretched (harmonic) sheet, holes left free; then the holes' heights blended in
        ({ positions, index } = surfaceMesh(fill.xz, fill.ys, rings.length > 1 ? fill.outer : fill.fixed, fill.tris, fill.h * 1.6));
        if (rings.length > 1) blendHoles(positions, fill);
    }

    return {
        outline: outer.outline, ring: outer.xz, count: outer.count,
        holes: holes.map((r, k) => ({ ...holeInfo[k], outline: r.outline, ring: r.xz, count: r.count })),
        fill: { positions, index }, flat, height: flat ? lo : ys[0],
        area: Math.max(0, sa), perimeter, bounds, centroid, center, crosses, _e: e,
    };
}

/** Most lattice points a surface gets (the lattice widens past it): ~8 k triangles. */
const SURFACE_INNER_MAX = 4000;
/**
 * An even triangle mesh for a surface with height (the harmonic sheet needs one: triangles that span
 * from edge to edge cannot carry what the edges do between them, and three's earcut is not a mesher —
 * points given to it as holes get bridged into long triangles).
 *   lattice  rows h·√3/2 apart, every other one shifted h/2 (near-equilateral triangles), ~1/40 of the
 *            area's size apart (wider past SURFACE_INNER_MAX); a point is kept inside the area (holes are
 *            outside) and ≥ 0.45 h from every edge; neighbouring rows are zipped into triangles where all
 *            three points are kept
 *   band     the rest — between the edges (resampled to ≤ h, heights straight between their points) and
 *            the lattice's outline — by earcut as a polygon with holes (the area's holes and the lattice's
 *            outlines), which it does well
 * Returns the points (the edges' first — fixed at their heights — then the lattice's, free), the triangles
 * and h.
 */
interface SurfaceFill { xz: Float64Array; ys: Float64Array; fixed: number; outer: number; rings: number[][]; tris: number[][]; h: number }
function surfaceFill(rings: BuiltRing[], e: EdgeSet, b: AreaBounds, area: number): SurfaceFill {
    const size = Math.max(b.maxX - b.minX, b.maxZ - b.minZ, 1e-6);
    let h = size / 40;
    const cap = Math.sqrt(Math.max(area, 1e-9) / (0.866 * SURFACE_INNER_MAX));
    if (h < cap) h = cap;
    const X: number[] = [], Z: number[] = [], Y: number[] = [];
    // the edges, resampled to ≤ h
    const ringIdx: number[][] = rings.map((r) => {
        const idx: number[] = [];
        for (let i = 0; i < r.count; i++) {
            const j = (i + 1) % r.count, x0 = r.xz[i * 2], z0 = r.xz[i * 2 + 1], x1 = r.xz[j * 2], z1 = r.xz[j * 2 + 1];
            const m = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / h));
            for (let k = 0; k < m; k++) { const t = k / m; idx.push(X.length); X.push(x0 + (x1 - x0) * t); Z.push(z0 + (z1 - z0) * t); Y.push(r.y[i] + (r.y[j] - r.y[i]) * t); }
        }
        return idx;
    });
    const fixed = X.length;
    // the lattice
    const dz = h * 0.866, hit = { x: 0, z: 0, distance: 0, ring: 0 } as AreaEdgeHit;
    const rows: Array<{ x0: number; ids: Int32Array }> = [];
    let row = 0;
    for (let z = b.minZ + dz / 2; z < b.maxZ; z += dz, row++) {
        const x0 = b.minX + (row % 2 ? h * 0.75 : h * 0.25), cols = Math.max(0, Math.ceil((b.maxX - x0) / h));
        const ids = new Int32Array(cols).fill(-1);
        for (let c = 0; c < cols; c++) {
            const x = x0 + c * h;
            if (!containsIn(e, x, z) || nearestIn(e, x, z, hit).distance < h * 0.45) continue;
            ids[c] = X.length; X.push(x); Z.push(z); Y.push(0);
        }
        rows.push({ x0, ids });
    }
    // zip each pair of rows: the shifted row's point c sits between the other's c and c + 1 (or c − 1 and c)
    // every triangle wound one way — positive signed area in (x, z), as the flat fill's — so the outline's edges chain
    const wind = (t: number[]) => ((X[t[1]] - X[t[0]]) * (Z[t[2]] - Z[t[0]]) - (Z[t[1]] - Z[t[0]]) * (X[t[2]] - X[t[0]]) < 0 ? [t[0], t[2], t[1]] : t);
    const tris: number[][] = [], add = (a: number, b2: number, c: number) => { if (a >= 0 && b2 >= 0 && c >= 0) tris.push(wind([a, b2, c])); };
    for (let r = 0; r + 1 < rows.length; r++) {
        const A = rows[r], B = rows[r + 1], right = B.x0 > A.x0;   // B shifted right of A by h/2, or left
        const at = (R: typeof A, c: number) => (c >= 0 && c < R.ids.length ? R.ids[c] : -1);
        const n = Math.max(A.ids.length, B.ids.length) + 1;
        for (let c = -1; c < n; c++) {
            if (right) { add(at(A, c), at(A, c + 1), at(B, c)); add(at(B, c), at(A, c + 1), at(B, c + 1)); }
            else { add(at(B, c), at(B, c + 1), at(A, c)); add(at(A, c), at(B, c + 1), at(A, c + 1)); }
        }
    }
    // the lattice's outline: its edges used by one triangle, chained into loops
    const key = (a: number, c: number) => a * 4194304 + c;
    const use = new Map<number, number>();
    for (const t of tris) for (let k = 0; k < 3; k++) { const a = t[k], c = t[(k + 1) % 3], q = a < c ? key(a, c) : key(c, a); use.set(q, (use.get(q) ?? 0) + 1); }
    const nextOf = new Map<number, number[]>();
    for (const t of tris) for (let k = 0; k < 3; k++) {
        const a = t[k], c = t[(k + 1) % 3];
        if (use.get(a < c ? key(a, c) : key(c, a)) !== 1) continue;
        (nextOf.get(a) ?? nextOf.set(a, []).get(a)!).push(c);
    }
    const loops: number[][] = [];
    for (const start of nextOf.keys()) {
        while ((nextOf.get(start)?.length ?? 0) > 0) {
            const loop: number[] = [];
            let v = start, guard = 0;
            do { loop.push(v); const nx = nextOf.get(v)!; v = nx.pop()!; } while (v !== start && nextOf.get(v)?.length && ++guard < 200000);
            if (loop.length >= 3) loops.push(loop);
        }
    }
    // the band, in pieces (a hole may not sit inside another hole — earcut leaves such a strip out):
    //  - the outer edge, with the lattice's outer outlines as its holes (wound positive: the triangles are);
    //  - every outline the lattice has around a gap (wound negative) as a piece of its own, with the area's
    //    holes that lie in that gap as its holes — the strip from the lattice down to each hole's edge;
    //  - an area hole the lattice does not surround (too near the edge for a lattice point) is a hole of the outer piece.
    const V = (i: number) => new Vector2(X[i], Z[i]);
    const signedOf = (l: number[]) => { let s = 0; for (let i = 0; i < l.length; i++) { const a = l[i], c = l[(i + 1) % l.length]; s += X[a] * Z[c] - X[c] * Z[a]; } return s / 2; };
    const insideLoop = (l: number[], x: number, z: number) => {
        let inside = false;
        for (let i = 0, j = l.length - 1; i < l.length; j = i++) {
            const xi = X[l[i]], zi = Z[l[i]], xj = X[l[j]], zj = Z[l[j]];
            if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
        }
        return inside;
    };
    const outlines = loops.filter((l) => signedOf(l) > 0), gaps = loops.filter((l) => signedOf(l) <= 0);
    const pieces: Array<{ contour: number[]; holes: number[][] }> = gaps.map((g) => ({ contour: g, holes: [] }));
    const outerPiece = { contour: ringIdx[0], holes: [...outlines] as number[][] };
    for (const hole of ringIdx.slice(1)) {
        // the smallest gap around the hole's first point (gaps don't nest; the test is cheap)
        const x = X[hole[0]], z = Z[hole[0]];
        const piece = pieces.find((p) => insideLoop(p.contour, x, z));
        (piece ?? outerPiece).holes.push(hole);
    }
    const band: number[][] = [];
    for (const p of [outerPiece, ...pieces]) {
        const flatP = [p.contour, ...p.holes].flat();
        for (const t of ShapeUtils.triangulateShape(p.contour.map(V), p.holes.map((l) => l.map(V)))) band.push([flatP[t[0]], flatP[t[1]], flatP[t[2]]]);
    }
    // earcut drops points that sit in a straight line with their neighbours — on a sheet straight in plan that is
    // every edge point, heights and all: put each dropped one back by fanning the triangle along its edge
    const used = new Uint8Array(X.length);
    for (const t of band) for (const k of t) used[k] = 1;
    const skipped = new Map<number, { from: number; pts: number[] }>();
    const pairKey = (a: number, c: number) => (a < c ? key(a, c) : key(c, a));
    for (const idx of ringIdx) {
        const first = idx.findIndex((v) => used[v]);
        if (first < 0) continue;
        for (let i = 0, start = first; i < idx.length; i++) {
            const k = (first + i + 1) % idx.length, v = idx[k];
            if (!used[v]) continue;
            const a = idx[start], pts: number[] = [];
            for (let m = (start + 1) % idx.length; m !== k; m = (m + 1) % idx.length) pts.push(idx[m]);
            if (pts.length) skipped.set(pairKey(a, v), { from: a, pts });
            start = k;
        }
    }
    const fan = (t: number[], out: number[][]) => {
        for (let k = 0; k < 3; k++) {
            const u = t[k], v = t[(k + 1) % 3], w = t[(k + 2) % 3], sk = skipped.get(pairKey(u, v));
            if (!sk) continue;
            const seq = [u, ...(sk.from === u ? sk.pts : [...sk.pts].reverse()), v];
            for (let i = 0; i + 1 < seq.length; i++) fan([seq[i], seq[i + 1], w], out);
            return;
        }
        out.push(wind(t));
    };
    const filled: number[][] = [];
    for (const t of band) { filled.length = 0; fan(t, filled); tris.push(...filled); }
    delaunayFlips(tris, X, Z);
    const xz = new Float64Array(X.length * 2), ys = new Float64Array(X.length);
    for (let i = 0; i < X.length; i++) { xz[i * 2] = X[i]; xz[i * 2 + 1] = Z[i]; ys[i] = Y[i]; }
    return { xz, ys, fixed, outer: ringIdx[0].length, rings: ringIdx, tris, h };
}

/**
 * The holes' heights on a surface (a hole held up or down — a summit, a plateau, a crater floor, a support
 * line): a stretched sheet alone would only lift the points right by a small hole (a tent pole). So with
 * d_o the distance to the outer edge and, per hole k, d_k its distance and y_k the height of its nearest
 * point, the holes give H = Σ y_k / d_k² / Σ 1 / d_k² (smooth between holes) at d_h = (Σ 1 / d_k²)^−½, and the
 * surface is (1 − s) · sheet + s · H with s = d_o / (d_o + d_h): the outer edge's sheet at the edge, the hole's
 * height on the hole, straight in between (a cone, a slope to a plateau).
 */
function blendHoles(positions: Float32Array, fill: SurfaceFill): void {
    const { xz, ys, rings } = fill;
    const segs = rings.map((idx) => idx.map((a, k) => [a, idx[(k + 1) % idx.length]] as const));
    // the nearest point of one ring: distance² and its height (straight along the segment)
    const near = (k: number, x: number, z: number): [number, number] => {
        let best = Infinity, y = 0;
        for (const [a, c] of segs[k]) {
            const ax = xz[a * 2], az = xz[a * 2 + 1], dx = xz[c * 2] - ax, dz = xz[c * 2 + 1] - az, L = dx * dx + dz * dz;
            const t = L > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0;
            const px = ax + dx * t - x, pz = az + dz * t - z, d = px * px + pz * pz;
            if (d < best) { best = d; y = ys[a] + (ys[c] - ys[a]) * t; }
        }
        return [best, y];
    };
    for (let i = 0; i < positions.length / 3; i++) {
        const x = positions[i * 3], z = positions[i * 3 + 2];
        const [d2o] = near(0, x, z);
        let wSum = 0, yw = 0, onHole = NaN;
        for (let k = 1; k < rings.length; k++) {
            const [d2, y] = near(k, x, z);
            if (d2 < 1e-10) { onHole = y; break; }
            wSum += 1 / d2; yw += y / d2;
        }
        if (!Number.isNaN(onHole)) { positions[i * 3 + 1] = onHole; continue; }
        if (d2o < 1e-10) continue;   // on the outer edge: the sheet is the edge's height
        const dh = Math.sqrt(1 / wSum), dOut = Math.sqrt(d2o), s = dOut / (dOut + dh);
        positions[i * 3 + 1] = (1 - s) * positions[i * 3 + 1] + s * (yw / wSum);
    }
}

/**
 * Lawson flips: every inner edge whose two triangles are not Delaunay (the far point inside the other
 * triangle's circumcircle) is turned to join the other two points, until none is left — earcut's fans and
 * slivers become a well-shaped mesh; the outline (edges used once) never moves. Triangles are wound
 * positive in (x, z) and stay so.
 */
function delaunayFlips(tris: number[][], X: number[], Z: number[]): void {
    const key = (a: number, c: number) => (a < c ? a * 4194304 + c : c * 4194304 + a);
    const edges = new Map<number, number[]>();
    const link = (a: number, c: number, t: number) => { const q = key(a, c); const l = edges.get(q); if (l) l.push(t); else edges.set(q, [t]); };
    const unlink = (a: number, c: number, t: number) => { const l = edges.get(key(a, c)); if (l) { const i = l.indexOf(t); if (i >= 0) l.splice(i, 1); } };
    tris.forEach((t, i) => { link(t[0], t[1], i); link(t[1], t[2], i); link(t[2], t[0], i); });
    const orient = (a: number, b: number, c: number) => (X[b] - X[a]) * (Z[c] - Z[a]) - (Z[b] - Z[a]) * (X[c] - X[a]);
    const inCircle = (a: number, b: number, c: number, d: number) => {
        const ax = X[a] - X[d], az = Z[a] - Z[d], bx = X[b] - X[d], bz = Z[b] - Z[d], cx = X[c] - X[d], cz = Z[c] - Z[d];
        return (ax * ax + az * az) * (bx * cz - cx * bz) - (bx * bx + bz * bz) * (ax * cz - cx * az) + (cx * cx + cz * cz) * (ax * bz - bx * az) > 1e-9;
    };
    const stack: Array<[number, number]> = [];
    for (const q of edges.keys()) stack.push([Math.floor(q / 4194304), q % 4194304]);
    let guard = 0;
    while (stack.length && guard++ < 2_000_000) {
        const [p, r] = stack.pop()!;
        const on = edges.get(key(p, r));
        if (!on || on.length !== 2) continue;
        const [i1, i2] = on, T1 = tris[i1], T2 = tris[i2];
        // T1 = (a, b, c) with the edge a → b; T2 holds b → a and d
        const k1 = T1.findIndex((v, k) => (v === p && T1[(k + 1) % 3] === r) || (v === r && T1[(k + 1) % 3] === p));
        if (k1 < 0) continue;
        const a = T1[k1], b = T1[(k1 + 1) % 3], c = T1[(k1 + 2) % 3];
        const d = T2.find((v) => v !== a && v !== b);
        if (d === undefined || !inCircle(a, b, c, d)) continue;
        if (orient(a, d, c) <= 0 || orient(d, b, c) <= 0) continue;   // the quad is not convex: no flip
        unlink(a, b, i1); unlink(a, b, i2); unlink(b, c, i1); unlink(a, d, i2);
        tris[i1] = [a, d, c]; tris[i2] = [d, b, c];
        link(c, d, i1); link(c, d, i2); link(a, d, i1); link(b, c, i2);
        stack.push([a, d], [d, b], [b, c], [c, a]);
    }
}

/**
 * The fill of a surface with height: the edges' triangles split (each side longer than `h` at its
 * middle, neighbours split alike so no point hangs) until every side is at most `h`; points on the
 * edges keep the edge's height (straight between its points), the inner ones settle into the
 * harmonic surface the edges span (each the average of its neighbours — a stretched sheet).
 */
function surfaceMesh(xz: Float64Array, ys: Float64Array, n: number, tris: number[][], h: number): { positions: Float32Array; index: Uint32Array } {
    const X: number[] = [], Z: number[] = [], Y: number[] = [], fixed: boolean[] = [];
    // the first n points are the edges' (fixed at their heights); the rest are inner points (free)
    const total0 = xz.length / 2;
    for (let i = 0; i < total0; i++) { X.push(xz[i * 2]); Z.push(xz[i * 2 + 1]); Y.push(i < n ? ys[i] : 0); fixed.push(i < n); }
    const key = (a: number, b: number) => (a < b ? a * 4194304 + b : b * 4194304 + a);
    let T: number[] = [];
    for (const t of tris) T.push(t[0], t[1], t[2]);
    // the edges of the area (used by one triangle): points added on them stay on the edge
    const uses = new Map<number, number>();
    for (let k = 0; k < T.length; k += 3) for (let s = 0; s < 3; s++) { const q = key(T[k + s], T[k + (s + 1) % 3]); uses.set(q, (uses.get(q) ?? 0) + 1); }
    const border = new Set<number>();
    for (const [q, c] of uses) if (c === 1) border.add(q);
    const len = (a: number, b: number) => Math.hypot(X[b] - X[a], Z[b] - Z[a]);
    for (let pass = 0; pass < 16; pass++) {
        const marked = new Set<number>();
        for (let k = 0; k < T.length; k += 3) {
            let best = -1, bl = h;
            for (let s = 0; s < 3; s++) { const l = len(T[k + s], T[k + (s + 1) % 3]); if (l > bl) { bl = l; best = s; } }
            if (best >= 0) marked.add(key(T[k + best], T[k + (best + 1) % 3]));
        }
        if (!marked.size || X.length > 20000) break;
        const mids = new Map<number, number>();
        const mid = (a: number, b: number) => {
            const q = key(a, b);
            let m = mids.get(q);
            if (m === undefined) {
                m = X.length;
                X.push((X[a] + X[b]) / 2); Z.push((Z[a] + Z[b]) / 2); Y.push((Y[a] + Y[b]) / 2);
                const onEdge = border.has(q);
                fixed.push(onEdge);
                if (onEdge) { border.add(key(a, m)); border.add(key(m, b)); }
                mids.set(q, m);
            }
            return m;
        };
        const out: number[] = [];
        for (let k = 0; k < T.length; k += 3) {
            const v = [T[k], T[k + 1], T[k + 2]];
            const on = [0, 1, 2].map((s) => marked.has(key(v[s], v[(s + 1) % 3])));
            const count = on.filter(Boolean).length;
            if (!count) { out.push(v[0], v[1], v[2]); continue; }
            if (count === 3) {
                const m0 = mid(v[0], v[1]), m1 = mid(v[1], v[2]), m2 = mid(v[2], v[0]);
                out.push(v[0], m0, m2, m0, v[1], m1, m2, m1, v[2], m0, m1, m2);
                continue;
            }
            if (count === 1) {
                const s = on.indexOf(true), a = v[s], b = v[(s + 1) % 3], c = v[(s + 2) % 3], m = mid(a, b);
                out.push(a, m, c, m, b, c);
                continue;
            }
            // two: rotate so the unsplit side is c → a; then (a, mab, mbc) cut off and the quad a, mbc, c… split
            const s = on.indexOf(false), a = v[(s + 1) % 3], b = v[(s + 2) % 3], c = v[s];
            const mab = mid(a, b), mbc = mid(b, c);
            out.push(mab, b, mbc, a, mab, mbc, a, mbc, c);
        }
        T = out;
    }
    // the sheet: the inner points relaxed (SOR) from the mean of the edges' heights
    const total = X.length;
    const nbr: Array<Set<number>> = Array.from({ length: total }, () => new Set());
    for (let k = 0; k < T.length; k += 3) {
        const a = T[k], b = T[k + 1], c = T[k + 2];
        nbr[a].add(b); nbr[a].add(c); nbr[b].add(a); nbr[b].add(c); nbr[c].add(a); nbr[c].add(b);
    }
    const lists = nbr.map((q) => Int32Array.from(q));
    let lo = Infinity, hi = -Infinity, mean = 0, nf = 0;
    for (let i = 0; i < total; i++) if (fixed[i]) { lo = Math.min(lo, Y[i]); hi = Math.max(hi, Y[i]); mean += Y[i]; nf++; }
    mean /= Math.max(1, nf);
    for (let i = 0; i < total; i++) if (!fixed[i]) Y[i] = mean;
    const tol = Math.max(1e-6, (hi - lo) * 1e-5), omega = 1.85;
    for (let it = 0; it < 3000; it++) {
        let change = 0;
        for (let i = 0; i < total; i++) {
            if (fixed[i]) continue;
            const l = lists[i];
            if (!l.length) continue;
            let s = 0;
            for (let k = 0; k < l.length; k++) s += Y[l[k]];
            const now = Y[i] + omega * (s / l.length - Y[i]);
            change = Math.max(change, Math.abs(now - Y[i]));
            Y[i] = now;
        }
        if (change < tol) break;
    }
    const positions = new Float32Array(total * 3);
    for (let i = 0; i < total; i++) { positions[i * 3] = X[i]; positions[i * 3 + 1] = Y[i]; positions[i * 3 + 2] = Z[i]; }
    return { positions, index: Uint32Array.from(T) };
}

/** An area straight from a polygon (no rounding, flat): for shapes derived from a finished area (scaled, inset…). */
export function areaFromPolygon(xz: ArrayLike<number>): AreaShape | null {
    const pts: V3[] = [];
    for (let i = 0; i + 1 < xz.length; i += 2) pts.push([xz[i], 0, xz[i + 1]]);
    return buildArea({ points: pts });
}

/** The outer edge scaled about the centroid by `f` (e.g. a park's path loop inside it), flat, no holes — once per use. Keeps the centroid where it is. */
export function scaleArea(a: AreaShape, f: number): AreaShape | null {
    const [cx, cz] = a.centroid;
    const xz = new Float64Array(a.ring.length);
    for (let i = 0; i < a.count; i++) { xz[i * 2] = cx + (a.ring[i * 2] - cx) * f; xz[i * 2 + 1] = cz + (a.ring[i * 2 + 1] - cz) * f; }
    const s = areaFromPolygon(xz);
    if (!s) return null;
    // areaFromPolygon centres it again: move it back so it stays inside the original
    const dx = s.center[0], dz = s.center[1];
    return dx || dz ? translateArea(s, dx, dz) : s;
}

/** @internal the same shape moved (keeps every derived field consistent). */
function translateArea(a: AreaShape, dx: number, dz: number): AreaShape {
    const shift2 = (src: Float64Array) => { const out = new Float64Array(src); for (let i = 0; i < out.length; i += 2) { out[i] += dx; out[i + 1] += dz; } return out; };
    const shiftLine = (l: PathLine): PathLine => { const samples = new Float32Array(l.samples); for (let k = 0; k < l.count; k++) { samples[k * 3] += dx; samples[k * 3 + 2] += dz; } return { ...l, samples }; };
    const positions = new Float32Array(a.fill.positions);
    for (let i = 0; i < positions.length; i += 3) { positions[i] += dx; positions[i + 2] += dz; }
    const bounds = { minX: a.bounds.minX + dx, maxX: a.bounds.maxX + dx, minZ: a.bounds.minZ + dz, maxZ: a.bounds.maxZ + dz };
    const exz = shift2(a._e.xz);
    return {
        ...a, ring: shift2(a.ring), outline: shiftLine(a.outline), fill: { positions, index: a.fill.index }, bounds,
        holes: a.holes.map((h) => ({ ...h, ring: shift2(h.ring), outline: shiftLine(h.outline) })),
        centroid: [a.centroid[0] + dx, a.centroid[1] + dz], center: [a.center[0] - dx, a.center[1] - dz],
        _e: { ...a._e, xz: exz, grid: makeEdgeGrid(exz, a._e.next, a._e.n, bounds) },
    };
}

// ---------------------------------------------------------------------------- queries
/** Is (x, z) inside (and not in a hole)? */
export function areaContains(a: AreaShape, x: number, z: number): boolean {
    const b = a.bounds;
    if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return false;
    return containsIn(a._e, x, z);
}

export interface AreaEdgeHit {
    /** The nearest point on an edge. */
    x: number; z: number;
    /** Distance to it (≥ 0). */
    distance: number;
    /** Which edge: 0 the outer one, k + 1 hole k. */
    ring: number;
    /** Metres along that edge from its start (pathLinePointAt(outline, along) is the same point — the hole's outline for a hole). */
    along: number;
    /** The edge's outward normal there (out of the area: into a hole on a hole's edge). */
    nx: number; nz: number;
}

/** The nearest point on any edge (the outer one or a hole's) to (x, z). */
export function areaNearestEdge(a: AreaShape, x: number, z: number, out: AreaEdgeHit = { x: 0, z: 0, distance: 0, ring: 0, along: 0, nx: 0, nz: 0 }): AreaEdgeHit {
    return nearestIn(a._e, x, z, out);
}

const hitTmp: AreaEdgeHit = { x: 0, z: 0, distance: 0, ring: 0, along: 0, nx: 0, nz: 0 };
/** Distance to the nearest edge: negative inside, positive outside (in a hole is outside). */
export function areaSignedDistance(a: AreaShape, x: number, z: number): number {
    const d = areaNearestEdge(a, x, z, hitTmp).distance;
    return areaContains(a, x, z) ? -d : d;
}

const triGrids = new WeakMap<AreaShape, { x0: number; z0: number; cw: number; ch: number; cols: number; rows: number; cells: number[][] }>();
/** The surface's height at (x, z) (the fill's triangles), or NaN outside the area / in a hole. */
export function areaHeightAt(a: AreaShape, x: number, z: number): number {
    if (a.flat) return areaContains(a, x, z) ? a.height : NaN;
    const p = a.fill.positions, t = a.fill.index;
    let g = triGrids.get(a);
    if (!g) {
        const b = a.bounds, w = Math.max(1e-6, b.maxX - b.minX), h = Math.max(1e-6, b.maxZ - b.minZ);
        const side = Math.max(1, Math.min(96, Math.round(Math.sqrt(t.length / 6))));
        const cols = Math.max(1, Math.round(side * Math.sqrt(w / h))), rows = Math.max(1, Math.round(side * Math.sqrt(h / w)));
        const cw = w / cols, ch = h / rows, cells: number[][] = Array.from({ length: cols * rows }, () => []);
        const col = (v: number) => Math.max(0, Math.min(cols - 1, Math.floor((v - b.minX) / cw))), row = (v: number) => Math.max(0, Math.min(rows - 1, Math.floor((v - b.minZ) / ch)));
        for (let k = 0; k < t.length; k += 3) {
            const xs = [p[t[k] * 3], p[t[k + 1] * 3], p[t[k + 2] * 3]], zs = [p[t[k] * 3 + 2], p[t[k + 1] * 3 + 2], p[t[k + 2] * 3 + 2]];
            for (let r = row(Math.min(...zs)); r <= row(Math.max(...zs)); r++) for (let c = col(Math.min(...xs)); c <= col(Math.max(...xs)); c++) cells[r * cols + c].push(k);
        }
        g = { x0: b.minX, z0: b.minZ, cw, ch, cols, rows, cells };
        triGrids.set(a, g);
    }
    const c = Math.floor((x - g.x0) / g.cw), r = Math.floor((z - g.z0) / g.ch);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return NaN;
    for (const k of g.cells[r * g.cols + c]) {
        const i = t[k] * 3, j = t[k + 1] * 3, l = t[k + 2] * 3;
        const ax = p[i], az = p[i + 2], bx = p[j] - ax, bz = p[j + 2] - az, cx = p[l] - ax, cz = p[l + 2] - az;
        const d = bx * cz - bz * cx;
        if (Math.abs(d) < 1e-12) continue;
        const px = x - ax, pz = z - az, u = (px * cz - pz * cx) / d, v = (bx * pz - bz * px) / d;
        if (u >= -1e-9 && v >= -1e-9 && u + v <= 1 + 1e-9) return p[i + 1] + (p[j + 1] - p[i + 1]) * u + (p[l + 1] - p[i + 1]) * v;
    }
    return NaN;
}

/** A seeded random number generator (mulberry32), 0 ≤ r < 1 — the one the scatter functions use. */
export function areaRandom(seed: number): () => number {
    let s = (Math.floor(seed) >>> 0) || 0x9e3779b9;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** `count` random points evenly spread over the inside (by area seen from above; holes left out; no retries), flat [x, z, …]. Same seed, same points. */
export function areaRandomPoints(a: AreaShape, count: number, seed = 1): Float32Array {
    const { positions: p, index: t } = a.fill;
    const nt = t.length / 3;
    const out = new Float32Array(Math.max(0, count) * 2);
    if (!nt || count <= 0) return out;
    const cum = new Float64Array(nt);
    let total = 0;
    for (let k = 0; k < nt; k++) {
        const i = t[k * 3] * 3, j = t[k * 3 + 1] * 3, l = t[k * 3 + 2] * 3;
        total += Math.abs((p[j] - p[i]) * (p[l + 2] - p[i + 2]) - (p[l] - p[i]) * (p[j + 2] - p[i + 2])) / 2;
        cum[k] = total;
    }
    const rnd = areaRandom(seed);
    for (let n = 0; n < count; n++) {
        const w = rnd() * total;
        let lo = 0, hi = nt - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < w) lo = m + 1; else hi = m; }
        const i = t[lo * 3] * 3, j = t[lo * 3 + 1] * 3, l = t[lo * 3 + 2] * 3;
        let u = rnd(), v = rnd();
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        out[n * 2] = p[i] + (p[j] - p[i]) * u + (p[l] - p[i]) * v;
        out[n * 2 + 1] = p[i + 2] + (p[j + 2] - p[i + 2]) * u + (p[l + 2] - p[i + 2]) * v;
    }
    return out;
}

export interface AreaEvenOptions {
    /** 0 a regular grid … 1 fully jittered inside each cell (default 0.7). */
    jitter?: number;
    /** Keep this far inside every edge (default 0). */
    margin?: number;
    seed?: number;
    /** Stop after this many (default 100 000). */
    max?: number;
}
/** Points about `spacing` apart over the inside (a jittered grid; holes left out), flat [x, z, …]. Same seed, same points. */
export function areaEvenPoints(a: AreaShape, spacing: number, o: AreaEvenOptions = {}): Float32Array {
    const s = Math.max(1e-3, spacing), jit = clamp01(o.jitter ?? 0.7), margin = Math.max(0, o.margin ?? 0), max = o.max ?? 100000;
    const rnd = areaRandom(o.seed ?? 1);
    const b = a.bounds, out: number[] = [];
    for (let z = b.minZ + s / 2; z < b.maxZ && out.length < max * 2; z += s) {
        for (let x = b.minX + s / 2; x < b.maxX && out.length < max * 2; x += s) {
            const px = x + (rnd() - 0.5) * s * jit, pz = z + (rnd() - 0.5) * s * jit;
            if (margin > 0 ? areaSignedDistance(a, px, pz) <= -margin : areaContains(a, px, pz)) out.push(px, pz);
        }
    }
    return Float32Array.from(out);
}

// ---------------------------------------------------------------------------- edits
/** A ground hole's own surface: its id and its fill (triangles at its heights), in the area's built frame. */
export interface AreaGround { id: string; hole: number; positions: Float32Array; index: Uint32Array }
/**
 * The grounds' surfaces: every hole that is a ground, built as the area it is (its outline filled at
 * its edge heights — the harmonic sheet, like any area), placed where it sits in the built area
 * (the same frame as buildArea's fill). Holes that can't be drawn are left out.
 */
export function areaGrounds(input: AreaInput, spacing = 0.05): AreaGround[] {
    const { input: centred } = centerArea(input);
    const out: AreaGround[] = [];
    (centred.holes ?? []).forEach((h, k) => {
        if (!areaHoleIsGround(centred, k)) return;
        const { id: _id, ground: _g, ...ring } = h;
        const s = buildArea(ring, spacing);
        if (!s) return;
        // buildArea centred the hole on itself: put it back where it is in the area
        const p = Float32Array.from(s.fill.positions);
        for (let i = 0; i < p.length; i += 3) { p[i] += s.center[0]; p[i + 2] += s.center[1]; }
        out.push({ id: h.id ?? `h${k + 1}`, hole: k, positions: p, index: s.fill.index });
    });
    return out;
}

/** Every height to 0: the points (outer and holes) and the sides' lifts. */
export function flattenArea(input: AreaInput): AreaInput {
    const ring = <T extends AreaRingInput>(r: T): T => {
        const out = { ...r, points: r.points.map((p) => [p[0], 0, p[2]] as V3) };
        if (r.segments) out.segments = r.segments.map((s) => {
            if (!s?.bend?.lift) return s;
            const { lift: _l, ...bend } = s.bend;
            const next: NonNullable<typeof s> = { ...s, bend };
            if (!Object.keys(bend).length) delete next.bend;
            return Object.keys(next).length ? next : null;
        });
        return out;
    };
    const out = ring(input);
    if (input.holes) out.holes = input.holes.map(ring);
    return out;
}

// ---------------------------------------------------------------------------- checks
/** Does a closed polygon cross itself? (two edges that are not neighbours intersect) */
export function ringCrossesItself(xz: ArrayLike<number>, n: number): boolean {
    if (n < 4) return false;
    for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            if (segmentsCross(xz, i * 2, ((i + 1) % n) * 2, j * 2, ((j + 1) % n) * 2)) return true;
        }
    }
    return false;
}

/** A saved area's data checked: the input (points [x, y, z], curve, smoothCorners, corners, noise, segments, heightCurve, holes), or errors. */
export function validateArea(data: unknown): { input: AreaInput | null; errors: string[] } {
    const d = (data ?? {}) as Record<string, unknown>;
    const errors: string[] = [];
    let input = readRing(d) as AreaInput;
    if (input.points.length < 3) errors.push('An area needs at least 3 points.');
    if (Array.isArray(d.holes)) {
        const holes = (d.holes as Array<Record<string, unknown>>).filter((h) => h && typeof h === 'object').map((h) => {
            const r: AreaHole = readRing(h);
            if (typeof h.id === 'string' && h.id) r.id = h.id;
            if (typeof h.ground === 'boolean') r.ground = h.ground;
            return r;
        }).filter((h) => h.points.length >= 3);
        if (holes.length) input.holes = holes;
    }
    if (typeof d.holeGround === 'boolean') input.holeGround = d.holeGround;
    input = withHoleIds(input);
    if (!errors.length && !buildArea(input)) errors.push('The outline has no area.');
    return { input: errors.length ? null : input, errors };
}

function readRing(d: Record<string, unknown>): AreaRingInput {
    const points = (Array.isArray(d.points) ? d.points : [])
        .filter((p): p is number[] => Array.isArray(p) && p.length >= 2 && p.every((v) => Number.isFinite(Number(v))))
        .map((p) => (p.length >= 3 ? [Number(p[0]), Number(p[1]), Number(p[2])] : [Number(p[0]), 0, Number(p[1])]) as V3);
    const r: AreaRingInput = { points, curve: clamp01(Number(d.curve ?? 0.3)), smoothCorners: clamp01(Number(d.smoothCorners ?? 0)) };
    // the curving API's per-point / per-side / noise / height fields, kept as they are (curveLine reads them defensively)
    if (Array.isArray(d.corners)) r.corners = (d.corners as unknown[]).slice(0, points.length).map((c) => (typeof c === 'number' && c > 0 ? c : null));
    if (Array.isArray(d.segments)) r.segments = (d.segments as unknown[]).slice(0, points.length).map((g) => (g && typeof g === 'object' ? (g as NonNullable<AreaRingInput['segments']>[number]) : null));
    if (d.noise && typeof d.noise === 'object') r.noise = d.noise as AreaRingInput['noise'];
    if (d.heightCurve === 'smooth') r.heightCurve = 'smooth';
    return r;
}

// ---------------------------------------------------------------------------- internals
function clamp01(v: number) { return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0; }

/** Even-odd inside test over every edge (a hole's inside is outside); `ring` limits it to one ring. */
function containsIn(e: EdgeSet, x: number, z: number, ring = -1): boolean {
    const g = e.grid, xz = e.xz;
    // a ray to +x through the cells of this row; a crossing counts in the cell whose x span holds it (no double counts)
    if (z < g.z0 || z > g.z0 + g.rows * g.ch) return false;
    const row = g.rowOf(z);
    let inside = false;
    for (let c = g.colOf(x); c < g.cols; c++) {
        const cx0 = g.x0 + c * g.cw, cx1 = cx0 + g.cw;
        for (const k of g.cells[row * g.cols + c]) {
            if (ring >= 0 && e.ringOf[k] !== ring) continue;
            const i = k * 2, j = e.next[k] * 2;
            const xi = xz[i], zi = xz[i + 1], xj = xz[j], zj = xz[j + 1];
            if ((zi > z) === (zj > z)) continue;
            const xc = xi + ((z - zi) / (zj - zi)) * (xj - xi);
            if (xc < x) continue;
            if (xc < cx0 || (xc >= cx1 && c < g.cols - 1)) continue;
            inside = !inside;
        }
    }
    return inside;
}

function nearestIn(e: EdgeSet, x: number, z: number, out: AreaEdgeHit): AreaEdgeHit {
    const g = e.grid, xz = e.xz;
    let best = Infinity, bestE = 0, bestT = 0;
    const test = (k: number) => {
        const i = k * 2, j = e.next[k] * 2;
        const ax = xz[i], az = xz[i + 1], dx = xz[j] - ax, dz = xz[j + 1] - az;
        const L = dx * dx + dz * dz;
        const t = L > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0;
        const px = ax + dx * t - x, pz = az + dz * t - z, d = px * px + pz * pz;
        if (d < best) { best = d; bestE = k; bestT = t; }
    };
    // rings of cells round the point's cell until nothing nearer can be outside them
    const c0 = g.colOf(x), r0 = g.rowOf(z);
    const seen = new Uint8Array(e.n);
    const maxRing = Math.max(g.cols, g.rows);
    for (let k = 0; k <= maxRing; k++) {
        for (let r = r0 - k; r <= r0 + k; r++) {
            if (r < 0 || r >= g.rows) continue;
            for (let c = c0 - k; c <= c0 + k; c++) {
                if (c < 0 || c >= g.cols || (Math.abs(r - r0) !== k && Math.abs(c - c0) !== k)) continue;
                for (const q of g.cells[r * g.cols + c]) if (!seen[q]) { seen[q] = 1; test(q); }
            }
        }
        // every cell outside the searched block is at least this far: the nearest side of the block that still has cells beyond it
        let reach = Infinity;
        if (c0 - k > 0) reach = Math.min(reach, x - (g.x0 + (c0 - k) * g.cw));
        if (c0 + k < g.cols - 1) reach = Math.min(reach, g.x0 + (c0 + k + 1) * g.cw - x);
        if (r0 - k > 0) reach = Math.min(reach, z - (g.z0 + (r0 - k) * g.ch));
        if (r0 + k < g.rows - 1) reach = Math.min(reach, g.z0 + (r0 + k + 1) * g.ch - z);
        if (reach === Infinity || (best < Infinity && Math.sqrt(best) <= reach)) break;
    }
    const i = bestE * 2, j = e.next[bestE] * 2;
    const ax = xz[i], az = xz[i + 1], dx = xz[j] - ax, dz = xz[j + 1] - az, L = Math.hypot(dx, dz) || 1;
    out.x = ax + dx * bestT; out.z = az + dz * bestT; out.distance = Math.sqrt(best);
    out.ring = e.ringOf[bestE];
    out.along = e.along[bestE] + L * bestT;
    out.nx = dz / L; out.nz = -dx / L;   // outer clockwise / holes anticlockwise from above (z south): outward = (dz, −dx)
    return out;
}

function segmentsCross(xz: ArrayLike<number>, a: number, b: number, c: number, d: number): boolean {
    const cross = (ax: number, az: number, bx: number, bz: number, cx: number, cz: number) => (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
    const ax = xz[a], az = xz[a + 1], bx = xz[b], bz = xz[b + 1], cx = xz[c], cz = xz[c + 1], dx = xz[d], dz = xz[d + 1];
    if (Math.max(cx, dx) < Math.min(ax, bx) || Math.min(cx, dx) > Math.max(ax, bx) || Math.max(cz, dz) < Math.min(az, bz) || Math.min(cz, dz) > Math.max(az, bz)) return false;
    const d1 = cross(ax, az, bx, bz, cx, cz), d2 = cross(ax, az, bx, bz, dx, dz);
    const d3 = cross(cx, cz, dx, dz, ax, az), d4 = cross(cx, cz, dx, dz, bx, bz);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)) && !!d1 && !!d2 && !!d3 && !!d4;
}

/** Do any two edges (of any rings) that are not neighbours cross? Only edges sharing a grid cell are compared. */
function edgesCross(e: EdgeSet): boolean {
    const g = e.grid;
    for (const cell of g.cells) {
        for (let p = 0; p < cell.length; p++) {
            const a = cell[p];
            for (let q = p + 1; q < cell.length; q++) {
                const b = cell[q];
                if (e.next[a] === b || e.next[b] === a) continue;
                if (segmentsCross(e.xz, a * 2, e.next[a] * 2, b * 2, e.next[b] * 2)) return true;
            }
        }
    }
    return false;
}

interface EdgeGrid {
    x0: number; z0: number; cw: number; ch: number; cols: number; rows: number;
    cells: number[][];
    colOf(x: number): number; rowOf(z: number): number;
}
/** Edges bucketed into a grid over the bounds (≈ 2 edges per cell), so the queries look only nearby. */
function makeEdgeGrid(xz: Float64Array, next: Int32Array, n: number, b: AreaBounds): EdgeGrid {
    const w = Math.max(1e-6, b.maxX - b.minX), h = Math.max(1e-6, b.maxZ - b.minZ);
    const side = Math.max(1, Math.min(128, Math.round(Math.sqrt(n / 2))));
    const cols = Math.max(1, Math.round(side * Math.sqrt(w / h))), rows = Math.max(1, Math.round(side * Math.sqrt(h / w)));
    const cw = w / cols, ch = h / rows;
    const cells: number[][] = Array.from({ length: cols * rows }, () => []);
    const colOf = (x: number) => Math.max(0, Math.min(cols - 1, Math.floor((x - b.minX) / cw)));
    const rowOf = (z: number) => Math.max(0, Math.min(rows - 1, Math.floor((z - b.minZ) / ch)));
    for (let k = 0; k < n; k++) {
        const i = k * 2, j = next[k] * 2;
        const c0 = colOf(Math.min(xz[i], xz[j])), c1 = colOf(Math.max(xz[i], xz[j]));
        const r0 = rowOf(Math.min(xz[i + 1], xz[j + 1])), r1 = rowOf(Math.max(xz[i + 1], xz[j + 1]));
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cells[r * cols + c].push(k);
    }
    return { x0: b.minX, z0: b.minZ, cw, ch, cols, rows, cells, colOf, rowOf };
}
