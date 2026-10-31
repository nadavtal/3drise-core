// =============================================================================
// curveLine — THE curving API: one description of a curved line, one function that draws it
// =============================================================================
//
// Every curved line in 3drise — a path, an area's outline, a grid street, a clip's motion line,
// whatever the AI makes — is described by a CurveSpec and drawn by curveLine. Nothing else curves
// lines: consumers resample (pathLine.buildPathLine), fill (areaShape) or build meshes from what
// this returns, they never re-curve the points.
//
//   points        the authoring points, [x, y, z]
//   closed        the end joins the start (an area, a loop)
//   curve         0 straight sides … 1 a smooth line through the points (whole line)
//   smoothCorners 0 sharp … 1 round corners — a share of the shorter side (whole line)
//   corners       per point: a round corner reaching this many metres along its legs (wins over smoothCorners)
//   heightCurve   'linear' (y straight between points) | 'smooth' (eased through the neighbours)
//   noise         sideways noise along the whole line (CurveNoise, curveNoise.ts)
//   segments      per side — segments[i] is the side from point i to point i + 1 (on a closed
//                 line the last runs back to point 0): its own rounding, its bend (sideways /
//                 up, peak, sharpness — curveShape.ts), its own noise (or 'none'), straight ends
//
// The steps, in this order: corners (a quadratic through each corner, curveCornerPoints) →
// rounding (Catmull-Rom blended with the straight line per side) → heights → bends (each side's
// bulge, curveBulge, measured across its chord) → noise (along the normal, seamless on a closed
// line, faded at a side's ends). Edits that keep `segments` / `corners` in step with the points
// are in curveEdits.ts.
//
// The result is the drawn line (uneven: dense where it curves) and, for every authoring point,
// where it lands on it (`knots`, a fractional index; a rounded corner's knot is its round's middle).
//
import { CatmullRomCurve3, Vector3 } from 'three';
import { curveBulge, curveCornerCut, curveCornerPoints, curveDensity, curveHermite, curvePeak, curveSharpness, curveSidePoints, CURVE_LIMITS, type CurveBend } from './curveShape';
import { curveNoiseAt, curveNoiseDefaults, curveNoiseDetail, curveNoiseTaper, type CurveNoise } from './curveNoise';

type V3 = [number, number, number];

/** One side's own shape (the side from point i to point i + 1). Absent fields follow the whole line. */
export interface CurveSegment {
    /** This side's rounding (0 straight … 1 smooth); absent: the line's `curve`. */
    curve?: number;
    /** A bulge sideways and / or up. */
    bend?: CurveBend;
    /** Its own noise, or 'none' (kept clean of the line's noise); absent: the line's noise. */
    noise?: CurveNoise | 'none';
    /** Metres at its start / end that stay straight (the bend lives between): a junction's arms. */
    hold?: [number, number];
}

export interface CurveSpec {
    points: V3[];
    closed?: boolean;
    curve?: number;
    smoothCorners?: number;
    /** Per point: a round corner reaching this many metres along both legs (null / absent: smoothCorners). */
    corners?: Array<number | null>;
    heightCurve?: 'linear' | 'smooth';
    noise?: CurveNoise;
    segments?: Array<CurveSegment | null>;
}

export interface CurveLine {
    /** The drawn line, [x, y, z] (a closed line does not repeat its first point). */
    points: V3[];
    /** Per authoring point: where it lands on `points` (a fractional index). */
    knots: number[];
    closed: boolean;
}

export interface CurveLineOptions {
    /** Metres between samples of a bent side (denser for a sharp bend). Default 4. */
    step?: number;
}

/** Samples per side the rounding draws: authoring vertex j lands on drawn sample j × this. */
export const CURVE_ROUND_PER = 8;
/** Steps in a corner's round given in metres (`corners`): the same as a grid corner. */
export const CURVE_CORNER_STEPS = 10;

/**
 * How far point i's round corner reaches along its legs (metres; 0: a sharp corner) — its own
 * `corners[i]` (capped, curveCornerCut) or the whole line's `smoothCorners`. What curveLine cuts;
 * editors place a corner's handle with it (as the grid editor does).
 */
export function curveCornerReach(spec: Pick<CurveSpec, 'points' | 'closed' | 'smoothCorners' | 'corners'>, i: number): number {
    const pts = spec.points ?? [], n = pts.length;
    const closed = !!spec.closed && n > 2;
    if (i < 0 || i >= n || !(closed || (i > 0 && i < n - 1))) return 0;
    const prev = pts[(i - 1 + n) % n], curr = pts[i], next = pts[(i + 1) % n];
    const leg = Math.min(dist3(prev, curr), dist3(next, curr));
    const metres = spec.corners?.[i];
    if (typeof metres === 'number' && metres > 0) return curveCornerCut(leg, metres);
    const amount = clamp01(spec.smoothCorners);
    return amount > 0 ? leg * amount * 0.4 : 0;
}

const clamp01 = (v: number | undefined) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v as number)) : 0);
const bent = (b: CurveBend | undefined) => !!b && (Math.abs(b.side ?? 0) > 1e-6 || Math.abs(b.lift ?? 0) > 1e-6);

/** Draw a curve. See the header for what each field does and the order of the steps. */
export function curveLine(spec: CurveSpec, options: CurveLineOptions = {}): CurveLine {
    const pts = (spec.points ?? []).map((p) => [p[0], p[1] ?? 0, p[2]] as V3);
    const n = pts.length;
    const closed = !!spec.closed && n > 2;
    if (n < 2) return { points: pts, knots: pts.map((_, i) => i), closed: false };
    const sides = closed ? n : n - 1;
    const seg = (i: number): CurveSegment | null => spec.segments?.[i] ?? null;

    // ---- 1. corners: each cornered point becomes its round (a quadratic through it)
    const amount = clamp01(spec.smoothCorners);
    const corner: V3[] = [];
    const block: Array<{ start: number; count: number }> = [];
    const isCorner = (i: number) => closed || (i > 0 && i < n - 1);
    for (let i = 0; i < n; i++) {
        const start = corner.length;
        const metres = spec.corners?.[i];
        const useMetres = typeof metres === 'number' && metres > 0;
        if (isCorner(i) && (useMetres || amount > 0)) {
            const prev = pts[(i - 1 + n) % n], curr = pts[i], next = pts[(i + 1) % n];
            const dPrev = dist3(prev, curr), dNext = dist3(next, curr);
            let cut: number, steps: number;
            if (useMetres) { cut = curveCornerCut(Math.min(dPrev, dNext), metres as number); steps = CURVE_CORNER_STEPS; }
            else { const s = amount * 100; cut = Math.min(dPrev * (s / 100) * 0.4, dNext * (s / 100) * 0.4); steps = Math.max(3, Math.floor(s / 10)); }
            const toPrev = dir3(curr, prev), toNext = dir3(curr, next);
            const before: V3 = [curr[0] + toPrev[0] * cut, curr[1] + toPrev[1] * cut, curr[2] + toPrev[2] * cut];
            const after: V3 = [curr[0] + toNext[0] * cut, curr[1] + toNext[1] * cut, curr[2] + toNext[2] * cut];
            for (const q of curveCornerPoints(before, curr, after, steps)) corner.push(q);
        } else corner.push(pts[i]);
        block.push({ start, count: corner.length - start });
    }
    let knots = block.map((b) => b.start + (b.count - 1) / 2);
    // which side each cornered stretch j → j + 1 belongs to (-1: inside a corner's round)
    const m = corner.length;
    const stretchSide = new Array<number>(closed ? m : m - 1).fill(-1);
    for (let i = 0; i < sides; i++) stretchSide[block[i].start + block[i].count - 1] = i;

    // ---- 2. rounding: Catmull-Rom blended with the straight line, per side
    const lineCurve = clamp01(spec.curve);
    const weights = stretchSide.map((s) => (s >= 0 ? clamp01(seg(s)?.curve ?? lineCurve) : lineCurve));
    let drawn = corner;
    let per = 1;
    if (m >= 3 && weights.some((w) => w > 0)) {
        drawn = roundWeighted(corner, weights, CURVE_ROUND_PER, closed);
        per = CURVE_ROUND_PER;
        knots = knots.map((k) => k * per);
    }
    // each side's body on the drawn line: from the last point of its start's block to the first of its end's
    const total = drawn.length;
    const bodyOf = (i: number): [number, number] => {
        const a = (block[i].start + block[i].count - 1) * per;
        const b = closed && i === n - 1 ? m * per : block[(i + 1) % n].start * per;
        return [a, b];
    };

    // ---- 3. heights: eased through the neighbours
    if (spec.heightCurve === 'smooth') {
        const lens = arcLengths(drawn, closed);
        for (let i = 0; i < sides; i++) {
            const A = pts[i], B = pts[(i + 1) % n];
            const L = Math.hypot(B[0] - A[0], B[2] - A[2]) || 1;
            const P = closed || i > 0 ? pts[(i - 1 + n) % n] : null, Q = closed || i + 2 < n ? pts[(i + 2) % n] : null;
            const prev = P ? { y: P[1], d: Math.hypot(A[0] - P[0], A[2] - P[2]) } : null;
            const next = Q ? { y: Q[1], d: Math.hypot(Q[0] - B[0], Q[2] - B[2]) } : null;
            const k0 = knots[i], k1 = closed && i === n - 1 ? total : knots[i + 1];
            const s0 = lenAt(lens, k0), s1 = lenAt(lens, k1);
            for (let j = Math.ceil(k0); j <= Math.min(Math.floor(k1), total - 1); j++) {
                const t = s1 > s0 ? (lens[j] - s0) / (s1 - s0) : 0;
                drawn[j] = [drawn[j][0], curveHermite(A[1], B[1], Math.min(1, Math.max(0, t)), L, prev, next), drawn[j][2]];
            }
        }
    }

    // ---- 4. bends: each bent side's body bulges across its chord (sideways) and up
    if (spec.segments?.some((s) => bent(s?.bend))) {
        const step = Math.max(0.05, options.step ?? 4);
        const out: V3[] = [];
        const map = new Array<number>(total + 1);   // old index → new index (a body's inner points → its start)
        let j = 0;                                   // the next old point to copy
        const copyThrough = (last: number) => { for (; j <= last && j < total; j++) { map[j] = out.length; out.push(drawn[j]); } };
        for (let i = 0; i < sides; i++) {
            const bend = seg(i)?.bend;
            if (!bent(bend)) continue;
            const [a, b] = bodyOf(i);
            copyThrough(a);                          // up to and including the body's start
            const A = drawn[a], B = drawn[b % total];
            const [holdA, holdB] = seg(i)?.hold ?? [0, 0];
            let piece: V3[];
            if (b - a === 1) {
                // a straight side: the bend's own sampling (curveSidePoints), heights straight between its ends
                const flat = curveSidePoints([A[0], A[2]], [B[0], B[2]], bend, holdA, holdB, step);
                const L = Math.hypot(B[0] - A[0], B[2] - A[2]) || 1;
                const ux = (B[0] - A[0]) / L, uz = (B[2] - A[2]) / L;
                piece = flat.map(([x, z]) => { const t = Math.min(1, Math.max(0, ((x - A[0]) * ux + (z - A[2]) * uz) / L)); return [x, A[1] + (B[1] - A[1]) * t, z] as V3; });
            } else {
                // a rounded side: its drawn points, made fine enough for the bend, pushed across its chord
                const body = drawn.slice(a, b + 1);
                if (b === total) body.push(drawn[0]);
                piece = displaceAcross(resampleFine(body, step / curveDensity(curveSharpness(bend!.sharpness))), bend!, holdA, holdB);
            }
            if (bend!.lift) liftAlong(piece, bend!.lift, bend!, holdA, holdB);
            for (let k = 1; k < piece.length - 1; k++) out.push(piece[k]);
            for (let q = a + 1; q < b && q < total; q++) map[q] = map[a];
            j = Math.max(j, b);                      // the body's end is the next block's first point
        }
        copyThrough(total - 1);
        map[total] = out.length;
        knots = knots.map((k) => remapIndex(k, map, total));
        drawn = out;
    }

    // ---- 5. noise: along the normal, seamless round a closed line, faded at a side's ends
    const sideNoise = (i: number) => seg(i)?.noise;
    const anyNoise = !!spec.noise || (spec.segments?.some((s) => !!s?.noise && s.noise !== 'none') ?? false);
    if (anyNoise && drawn.length >= 2) {
        const lens0 = arcLengths(drawn, closed);
        const L = lens0[lens0.length - 1];
        if (L > 0) {
            // fine enough for the busiest noise
            let perMetre = 0;
            const sideLen = (i: number) => lenAt(lens0, closed && i === n - 1 ? drawn.length : knots[i + 1]) - lenAt(lens0, knots[i]);
            if (spec.noise) { const o = curveNoiseDefaults(spec.noise); perMetre = Math.max(perMetre, (o.bumps * 16 * Math.min(4, curveNoiseDetail(o))) / L); }
            for (let i = 0; i < sides; i++) {
                const s = sideNoise(i);
                if (s && s !== 'none') { const o = curveNoiseDefaults(s); perMetre = Math.max(perMetre, (o.bumps * 16 * Math.min(4, curveNoiseDetail(o))) / Math.max(1e-6, sideLen(i))); }
            }
            const h = Math.max(L / 20000, Math.min(1, 1 / Math.max(perMetre, 1e-6)));
            const knotLens = knots.map((k) => lenAt(lens0, k));
            const fine = resampleEven(drawn, lens0, closed, h);
            const lens = arcLengths(fine, closed);
            const N = fine.length;
            const out: V3[] = new Array(N);
            for (let j = 0; j < N; j++) {
                const s = lens[j];
                // which side, and how far along it
                let i = 0;
                while (i < sides - 1 && s >= knotLens[i + 1]) i++;
                const sa = knotLens[i], sb = closed && i === n - 1 ? L : knotLens[i + 1];
                const u = sb > sa ? Math.min(1, Math.max(0, (s - sa) / (sb - sa))) : 0;
                const own = sideNoise(i);
                let d = 0;
                // the line's noise, faded out inside a side that has its own (or 'none'); its own on top
                if (spec.noise) d += (own === undefined ? 1 : 1 - curveNoiseTaper(u)) * curveNoiseAt(spec.noise, s / L, closed);
                if (own && own !== 'none') d += curveNoiseAt(own, u, false);
                const p = fine[j], q = fine[(j - 1 + N) % N], r = fine[(j + 1) % N];
                const a = closed || j > 0 ? q : p, b = closed || j < N - 1 ? r : p;
                const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz) || 1;
                out[j] = [p[0] + (-dz / l) * d, p[1], p[2] + (dx / l) * d];
            }
            knots = knotLens.map((s) => indexAtLength(lens, s));
            drawn = out;
        }
    }
    return { points: drawn, knots, closed };
}

// ---------------------------------------------------------------------------- the steps' helpers
function dist3(a: V3, b: V3) { return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); }
function dir3(from: V3, to: V3): V3 { const l = dist3(from, to) || 1; return [(to[0] - from[0]) / l, (to[1] - from[1]) / l, (to[2] - from[2]) / l]; }

/**
 * Catmull-Rom (centripetal) through the points, blended per stretch with the straight line by
 * `weights[j]` (0 straight … 1 the spline); `per` samples a stretch; input vertex j lands on
 * output sample j × per. With equal weights this is core roundPoints exactly.
 */
function roundWeighted(points: V3[], weights: number[], per: number, closed: boolean): V3[] {
    const v3 = points.map((p) => new Vector3(p[0], p[1], p[2]));
    const spline = new CatmullRomCurve3(v3, closed, 'centripetal');
    const n = points.length, segs = closed ? n : n - 1, total = segs * per;
    const out: V3[] = [];
    const tmp = new Vector3();
    for (let k = 0; k < (closed ? total : total + 1); k++) {
        const t = k / total;
        const p = segs * t;
        const i = Math.min(Math.floor(p), segs - 1);
        const w = p - i;
        const a = v3[i], b = v3[(i + 1) % n];
        spline.getPoint(Math.min(t, 1), tmp);
        const c = weights[i] ?? 0;
        const lx = a.x + (b.x - a.x) * w, ly = a.y + (b.y - a.y) * w, lz = a.z + (b.z - a.z) * w;
        out.push([lx + (tmp.x - lx) * c, ly + (tmp.y - ly) * c, lz + (tmp.z - lz) * c]);
    }
    return out;
}

/** Cumulative length (x / z) at each point; a closed line gets one more entry: the full loop. */
function arcLengths(p: V3[], closed: boolean): number[] {
    const out = [0];
    for (let j = 1; j < p.length; j++) out.push(out[j - 1] + Math.hypot(p[j][0] - p[j - 1][0], p[j][2] - p[j - 1][2]));
    if (closed && p.length > 1) out.push(out[p.length - 1] + Math.hypot(p[0][0] - p[p.length - 1][0], p[0][2] - p[p.length - 1][2]));
    return out;
}
/** The length at a fractional index. */
function lenAt(lens: number[], k: number): number {
    const j = Math.max(0, Math.min(lens.length - 1, Math.floor(k)));
    const f = k - j;
    return f > 0 && j + 1 < lens.length ? lens[j] + (lens[j + 1] - lens[j]) * f : lens[j];
}
/** The fractional index at a length. */
function indexAtLength(lens: number[], s: number): number {
    let lo = 0, hi = lens.length - 1;
    if (s <= 0) return 0;
    if (s >= lens[hi]) return hi;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (lens[mid] <= s) lo = mid; else hi = mid; }
    const span = lens[hi] - lens[lo];
    return lo + (span > 0 ? (s - lens[lo]) / span : 0);
}
/** An old fractional index after points were inserted / replaced (map: old index → new index). */
function remapIndex(k: number, map: number[], total: number): number {
    const j = Math.max(0, Math.min(total, Math.floor(k))), f = k - j;
    const a = map[j] ?? 0, b = map[Math.min(total, j + 1)] ?? a;
    return a + (b - a) * f;
}
/** Points along a polyline no further apart than `h` (its own points kept). */
function resampleFine(p: V3[], h: number): V3[] {
    const out: V3[] = [p[0]];
    for (let j = 1; j < p.length; j++) {
        const a = p[j - 1], b = p[j], l = Math.hypot(b[0] - a[0], b[2] - a[2]);
        const k = Math.max(1, Math.ceil(l / h));
        for (let q = 1; q <= k; q++) out.push([a[0] + ((b[0] - a[0]) * q) / k, a[1] + ((b[1] - a[1]) * q) / k, a[2] + ((b[2] - a[2]) * q) / k]);
    }
    return out;
}
/** A line resampled evenly every ~h (x / z length); a closed line does not repeat its start. */
function resampleEven(p: V3[], lens: number[], closed: boolean, h: number): V3[] {
    const L = lens[lens.length - 1];
    // L / h is often a whole number (h is chosen from L): round off float noise first, so moving a
    // line (the same shape anywhere) never adds or drops a sample
    const count = Math.max(closed ? 3 : 2, Math.ceil(Math.round((L / h) * 1e6) / 1e6));
    const out: V3[] = [];
    const last = closed ? count - 1 : count;
    let j = 0;
    for (let k = 0; k <= last; k++) {
        const s = (L * k) / count;
        while (j < lens.length - 2 && lens[j + 1] < s) j++;
        const a = p[j], b = p[(j + 1) % p.length];
        const span = lens[j + 1] - lens[j];
        const t = span > 0 ? (s - lens[j]) / span : 0;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
    return out;
}
/** A (rounded) side pushed sideways by its bend, measured across its chord (first → last point). */
function displaceAcross(body: V3[], bend: CurveBend, holdA: number, holdB: number): V3[] {
    const A = body[0], B = body[body.length - 1];
    const L = Math.hypot(B[0] - A[0], B[2] - A[2]);
    if (!(L > 0)) return body;
    const ux = (B[0] - A[0]) / L, uz = (B[2] - A[2]) / L;
    const lim = L * CURVE_LIMITS.maxBendShare;
    const side = Math.max(-lim, Math.min(lim, bend.side ?? 0));
    const peak = curvePeak(bend.peak), sharp = curveSharpness(bend.sharpness);
    const s0 = Math.min(holdA, L / 2), s1 = Math.max(L - holdB, s0), span = s1 - s0;
    return body.map((p) => {
        const s = (p[0] - A[0]) * ux + (p[2] - A[2]) * uz;
        const t = span > 1e-6 ? Math.min(1, Math.max(0, (s - s0) / span)) : 0;
        const k = side * curveBulge(t, peak, sharp);
        return [p[0] - uz * k, p[1], p[2] + ux * k] as V3;
    });
}
/** A side lifted by its bend's `lift` (metres up at the peak), along its chord. */
function liftAlong(piece: V3[], lift: number, bend: CurveBend, holdA: number, holdB: number): void {
    const A = piece[0], B = piece[piece.length - 1];
    const L = Math.hypot(B[0] - A[0], B[2] - A[2]);
    if (!(L > 0)) return;
    const ux = (B[0] - A[0]) / L, uz = (B[2] - A[2]) / L;
    const peak = curvePeak(bend.peak), sharp = curveSharpness(bend.sharpness);
    const s0 = Math.min(holdA, L / 2), s1 = Math.max(L - holdB, s0), span = s1 - s0;
    for (const p of piece) {
        const s = (p[0] - A[0]) * ux + (p[2] - A[2]) * uz;
        const t = span > 1e-6 ? Math.min(1, Math.max(0, (s - s0) / span)) : 0;
        p[1] += lift * curveBulge(t, peak, sharp);
    }
}
