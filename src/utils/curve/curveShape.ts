// =============================================================================
// curveShape — the small shapes every curved line in 3drise is made of
// =============================================================================
//
// Part of the ONE curving API (utils/curve, see curveLine.ts). Paths, areas, grid streets, clip
// tracks and the AI all bend, round and lift lines with these functions — never a copy.
//   curveBulge          a side's bend / lift profile: 1 at its peak, 0 at its ends, level there
//   curveSidePoints     one side from a to b with its bend (sideways) — straight ends kept (hold)
//   curveCornerPoints   a corner rounded as a quadratic through it (paths, areas, grid corners)
//   curveCornerCut      how far a corner's round reaches along its legs (metres, clamped)
//   curveHermite        a smooth height through neighbours (Catmull-Rom slopes)
//
// Sideways is to the RIGHT of travel (from a to b), seen from above with x east and z south:
// the normal is (−dz, dx). Lift is up (+y).
//
type V2 = [number, number];
type V3 = [number, number, number];

/** A side's bend: sideways and up, where it peaks and how much of the side it takes. */
export interface CurveBend {
    /** Metres to the right of travel at the peak (negative: to the left). */
    side?: number;
    /** Metres up at the peak (negative: down) — an arch, a bridge, a dip. */
    lift?: number;
    /** Where along the side it peaks, 0.1 – 0.9 (absent: 0.5, the middle). */
    peak?: number;
    /** How much of the side it takes, 0 – 1 (absent: 1 = all of it; 0 = a jump at the peak). */
    sharpness?: number;
}

export const CURVE_LIMITS = {
    minPeak: 0.1, maxPeak: 0.9, minSharpness: 0, maxSharpness: 1,
    /** A bend's sideways reach is at most this share of its side's length. */
    maxBendShare: 0.45,
    /** A corner's round reaches at most this share of its shorter leg. */
    maxCornerShare: 0.45,
} as const;

export const curvePeak = (v: number | undefined) => (v === undefined || !Number.isFinite(v) ? 0.5 : Math.min(CURVE_LIMITS.maxPeak, Math.max(CURVE_LIMITS.minPeak, v)));
export const curveSharpness = (v: number | undefined) => (v === undefined || !Number.isFinite(v) ? 1 : Math.min(CURVE_LIMITS.maxSharpness, Math.max(CURVE_LIMITS.minSharpness, v)));

/**
 * A bend's profile at t (0..1 along its side): exactly 1 at `peak`, 0 outside its reach, level
 * where it starts and ends. Sharpness 1: it starts at the side's two ends (one smooth bulge, sin²);
 * lower: it takes only that share of each half round the peak; 0: it jumps there and back.
 */
export function curveBulge(t: number, peak = 0.5, sharpness = 1): number {
    const d = t <= peak ? (peak - t) / peak : (t - peak) / (1 - peak);   // 0 at the peak, 1 at either end
    const w = Math.max(1e-3, sharpness);
    return d >= w ? 0 : Math.cos((Math.PI / 2) * (d / w)) ** 2;
}

/** How much denser a bend is sampled when it is narrow (so a sharp one still shows its shape). */
export const curveDensity = (sharpness: number) => Math.min(12, 1 / Math.max(0.08, sharpness));

/** The right-of-travel normal of a direction (dx, dz) — what `side` pushes along. */
export const curveSideNormal = (dx: number, dz: number): V2 => [-dz, dx];

/**
 * One side from a to b ([x, z]) with its sideways bend, `step` metres apart (denser for a sharp
 * bend). The bend lives between `holdA` metres from a and `holdB` metres from b — the ends stay
 * straight there (a junction's arms, a corner's round); the points at the hold edges are included.
 * An unbent side is just its ends (and the hold edges); a lift alone is sampled too (the caller
 * lifts the points). The bend's side is clamped to
 * CURVE_LIMITS.maxBendShare of the side's length.
 */
export function curveSidePoints(a: V2, b: V2, bend: CurveBend | null | undefined, holdA = 0, holdB = 0, step = 4): V2[] {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!(L > 0)) return [[a[0], a[1]], [b[0], b[1]]];
    const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L;
    const [nx, nz] = curveSideNormal(dx, dz);
    const lim = L * CURVE_LIMITS.maxBendShare;
    const side = Math.max(-lim, Math.min(lim, bend?.side ?? 0));
    const peak = curvePeak(bend?.peak), sharp = curveSharpness(bend?.sharpness);
    const s0 = Math.min(holdA, L / 2), s1 = Math.max(L - holdB, s0);
    const span = s1 - s0;
    const at = (s: number): V2 => {
        const t = span > 1e-6 ? Math.min(1, Math.max(0, (s - s0) / span)) : 0;
        const k = side * curveBulge(t, peak, sharp);
        return [a[0] + dx * s + nx * k, a[1] + dz * s + nz * k];
    };
    const out: V2[] = [at(0)];
    if (s0 > 0) out.push(at(s0));
    // a bend (sideways or up) is sampled every `step`; a straight side is just its ends
    const n = Math.abs(side) < 1e-3 && Math.abs(bend?.lift ?? 0) < 1e-3 ? 1 : Math.max(2, Math.ceil((span / step) * curveDensity(sharp)));
    for (let k = 1; k < n; k++) out.push(at(s0 + (span * k) / n));
    if (s1 < L) out.push(at(s1));
    out.push(at(L));
    return out;
}

/**
 * How far a corner's round reaches along each leg (metres): `wanted`, at most
 * CURVE_LIMITS.maxCornerShare of the shorter leg (so two rounds on one side never meet), at least
 * 2 m (or the cap, when the leg is shorter).
 */
export function curveCornerCut(shortLeg: number, wanted: number): number {
    const max = shortLeg * CURVE_LIMITS.maxCornerShare;
    return Math.max(Math.min(2, max), Math.min(max, wanted));
}

/**
 * A corner's round: the quadratic from `a` (on the leg coming in) through the corner `c` to `b`
 * (on the leg going out), as `segments` + 1 points, both ends included. Any dimension (x, z or
 * x, y, z) — the points have the length of `a`.
 */
export function curveCornerPoints<T extends number[]>(a: T, c: T, b: T, segments: number): T[] {
    const out: T[] = [];
    for (let k = 0; k <= segments; k++) {
        const u = k / segments, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
        out.push(a.map((_, d) => w0 * a[d] + w1 * c[d] + w2 * b[d]) as T);
    }
    return out;
}

/**
 * A smooth value between two points (Hermite with Catmull-Rom slopes, uneven spacing): yA at
 * t = 0, yB at t = 1; `prev` / `next` are the neighbours' values and their distances (null at an
 * end: the slope of the stretch itself). `L` is the distance from A to B; `span` the length the
 * change happens over (L, or less when the ends stay level for a while — a roundabout platform).
 * `levelA` / `levelB`: arrive level there.
 */
export function curveHermite(yA: number, yB: number, t: number, L: number, prev: { y: number; d: number } | null, next: { y: number; d: number } | null, levelA = false, levelB = false, span = L): number {
    const own = (yB - yA) / span;
    const mA = levelA ? 0 : (prev ? (yB - prev.y) / (prev.d + L) : own) * span;
    const mB = levelB ? 0 : (next ? (next.y - yA) / (L + next.d) : own) * span;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * yA + (t3 - 2 * t2 + t) * mA + (-2 * t3 + 3 * t2) * yB + (t3 - t2) * mB;
}

export type { V2 as CurveV2, V3 as CurveV3 };
