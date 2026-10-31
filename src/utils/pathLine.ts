// =============================================================================
// pathLine — a path as one finished line (what everything that uses a path gets)
// =============================================================================
//
// A path is authored as points + rounding + smooth corners + loop (a CurveSpec — utils/curve, the
// one curving API, draws it); those are only for making it. What a use gets is the line: built
// once from them, sampled evenly along its length, so moving by equal distances is exact through corners and around a loop's seam. Users never
// re-curve the points — they ask where / which way at a distance or a fraction, and offset the
// whole line once (offsetPathLine), not per frame.
//
import { Matrix4, Quaternion, Vector3 } from 'three';
import { curveLine, type CurveSpec } from './curve/curveLine';
import type { Vector3Array } from '../types/scene3d';

/**
 * A path's authoring data: a CurveSpec (utils/curve — the one curving API) with `loop` for
 * `closed`. Only points, curve, smoothCorners and loop are saved on a path today; the rest
 * (per-point corners, per-side shapes, noise, heights) is the same API, ready for it.
 */
export interface PathLineInput extends Omit<CurveSpec, 'closed'> {
    points: Vector3Array[];
    /** 0 straight segments … 1 a smooth curve through the points. */
    curve?: number;
    /** 0 sharp corners … 1 round corners (arcs; straights stay straight). */
    smoothCorners?: number;
    /** The end joins the start. */
    loop?: boolean;
}

export interface PathLine {
    /** Even samples, flat [x, y, z, …]; a closed line does not repeat its first sample. */
    samples: Float32Array;
    count: number;
    /** Metres from one sample to the next. */
    step: number;
    /** Total length in metres (a loop includes the closing stretch). */
    length: number;
    closed: boolean;
    /**
     * Metres along the line at which each authoring point sits, in order (one per input point).
     * A rounded corner (smoothCorners) is not on the line: its knot is the middle of its arc.
     * How a timed track maps its keys onto the curve (clips' curved position tracks, path bakes).
     */
    knots: Float64Array;
}

const MAX_SAMPLES = 20000;

/** The drawn line and, per authoring point, where it lands on it (a fractional index into the drawn points) — curveLine. */
export function pathDrawnPointsWithKnots(p: PathLineInput): { points: Vector3Array[]; knots: number[] } {
    const { loop, ...rest } = p;
    const drawn = curveLine({ ...rest, points: p.points ?? [], closed: !!loop });
    return { points: drawn.points as Vector3Array[], knots: drawn.knots };
}

/** The drawn line before even sampling: corners rounded, then the whole line by `curve` (what the studio draws). */
export function pathDrawnPoints(p: PathLineInput): Vector3Array[] {
    return pathDrawnPointsWithKnots(p).points;
}

/** The finished line: the drawn points resampled every `spacing` metres (coarser only for very long lines). */
export function buildPathLine(p: PathLineInput, spacing = 0.05): PathLine {
    const { points: drawn, knots } = pathDrawnPointsWithKnots(p);
    return pathLineFromDrawn(drawn, knots, !!p.loop && drawn.length > 2, spacing);
}

/**
 * A line already drawn by curveLine (its points and knots), resampled evenly every `spacing`
 * metres — for whoever drew it once and needs the line too (an area's outline), so it is never
 * curved twice.
 */
export function pathLineFromDrawn(drawn: Vector3Array[], at: number[], closed: boolean, spacing = 0.05): PathLine {
    const pts = closed ? [...drawn, drawn[0]] : drawn;
    if (pts.length < 2) {
        const one = pts[0] ?? [0, 0, 0];
        return { samples: new Float32Array(one), count: pts.length ? 1 : 0, step: 0, length: 0, closed: false, knots: new Float64Array(at.length) };
    }
    // cumulative length along the drawn polyline
    const cum = new Float64Array(pts.length);
    for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        cum[i] = cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    }
    const length = cum[pts.length - 1];
    // each authoring point's distance: its fractional drawn index read on the cumulative length
    const knots = new Float64Array(at.length);
    for (let i = 0; i < at.length; i++) {
        const f = Math.min(Math.max(at[i], 0), pts.length - 1);
        const j = Math.min(Math.floor(f), pts.length - 2);
        knots[i] = j < 0 ? 0 : cum[j] + (cum[j + 1] - cum[j]) * (f - j);
    }
    if (!(length > 0)) return { samples: new Float32Array(pts[0]), count: 1, step: 0, length: 0, closed: false, knots };
    const segs = Math.max(1, Math.min(MAX_SAMPLES - 1, Math.ceil(length / spacing)));
    const step = length / segs;
    const count = closed ? segs : segs + 1;   // closed: the last sample would be the first again
    const samples = new Float32Array(count * 3);
    let j = 1;
    for (let k = 0; k < count; k++) {
        const d = k * step;
        while (j < pts.length - 1 && cum[j] < d) j++;
        const a = pts[j - 1], b = pts[j];
        const span = cum[j] - cum[j - 1];
        const u = span > 0 ? (d - cum[j - 1]) / span : 0;
        samples[k * 3] = a[0] + (b[0] - a[0]) * u;
        samples[k * 3 + 1] = a[1] + (b[1] - a[1]) * u;
        samples[k * 3 + 2] = a[2] + (b[2] - a[2]) * u;
    }
    return { samples, count, step, length, closed, knots };
}

/** The same line moved by a world offset — once per use, so following it costs nothing extra. */
export function offsetPathLine(line: PathLine, offset: Vector3Array | null | undefined): PathLine {
    if (!offset || (!offset[0] && !offset[1] && !offset[2])) return line;
    const samples = new Float32Array(line.samples);
    for (let k = 0; k < line.count; k++) {
        samples[k * 3] += offset[0];
        samples[k * 3 + 1] += offset[1];
        samples[k * 3 + 2] += offset[2];
    }
    return { ...line, samples };
}

/** The same line run the other way (end → start) — once per use, like the offset. */
export function reversePathLine(line: PathLine): PathLine {
    const n = line.count, src = line.samples, samples = new Float32Array(src.length);
    // a closed line keeps its start sample (the loop just turns the other way)
    for (let k = 0; k < n; k++) {
        const from = line.closed ? (n - k) % n : n - 1 - k;
        samples[k * 3] = src[from * 3]; samples[k * 3 + 1] = src[from * 3 + 1]; samples[k * 3 + 2] = src[from * 3 + 2];
    }
    // the authoring points in the new order, measured from the new start
    const n2 = line.knots.length, knots = new Float64Array(n2);
    for (let i = 0; i < n2; i++) {
        const d = line.length - line.knots[n2 - 1 - i];
        knots[i] = line.closed ? d % line.length : d;
    }
    return { ...line, samples, knots };
}

/** The point `d` metres along the line (wraps on a closed line, clamps on an open one), written into `out`. */
export function pathLinePointAt(line: PathLine, d: number, out: Vector3 = new Vector3()): Vector3 {
    const s = line.samples;
    if (line.count < 2 || !(line.step > 0)) return out.set(s[0] ?? 0, s[1] ?? 0, s[2] ?? 0);
    let x = d / line.step;
    if (line.closed) x = ((x % line.count) + line.count) % line.count;
    else x = Math.max(0, Math.min(line.count - 1, x));
    const i = Math.min(Math.floor(x), line.closed ? line.count - 1 : line.count - 2);
    const u = x - i;
    const n = line.closed ? (i + 1) % line.count : i + 1;
    return out.set(
        s[i * 3] + (s[n * 3] - s[i * 3]) * u,
        s[i * 3 + 1] + (s[n * 3 + 1] - s[i * 3 + 1]) * u,
        s[i * 3 + 2] + (s[n * 3 + 2] - s[i * 3 + 2]) * u,
    );
}

const tmpA = new Vector3();
const tmpB = new Vector3();
/**
 * The direction of travel at `d` metres: from a little behind to a little ahead (`span` metres
 * each way), so it turns smoothly through corners instead of jumping sample to sample.
 */
export function pathLineDirectionAt(line: PathLine, d: number, span = 0.5, out: Vector3 = new Vector3()): Vector3 {
    let a = d - span, b = d + span;
    if (!line.closed) { a = Math.max(0, a); b = Math.min(line.length, b); }
    pathLinePointAt(line, a, tmpA);
    pathLinePointAt(line, b, tmpB);
    return out.subVectors(tmpB, tmpA).normalize();
}

/**
 * A line through points visited in order — a clip track's keys, a baked path run: one line drawn
 * through them with `curve` / `smoothCorners` (the same drawing as a layout path). A point that
 * repeats the previous one is a pause (same distance). A run that ends where it began (and has at
 * least three distinct points) is drawn as a closed loop, so the seam is as smooth as the rest.
 *
 * `at[i]` is the distance of point i along the run, never decreasing: a closed run's last point
 * is its first one plus the length (pathLinePointAt wraps). A rounded corner is not on the line:
 * its distance is its arc's middle. Lines are sampled finer when short (≈4000 samples, 2 mm–5 cm),
 * so the line passes a sharp key within a fraction of a millimetre on small scenes.
 * Null for fewer than two distinct points or no length.
 */
export function buildRunLine(points: Vector3Array[], shape: { curve?: number; smoothCorners?: number } = {}): { line: PathLine; at: Float64Array } | null {
    const distinct: Vector3Array[] = [];
    const index: number[] = [];
    const same = (a: Vector3Array, b: Vector3Array) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9 && Math.abs(a[2] - b[2]) < 1e-9;
    for (const p of points) {
        const last = distinct[distinct.length - 1];
        if (!last || !same(last, p)) distinct.push(p);
        index.push(distinct.length - 1);
    }
    if (distinct.length < 2) return null;
    const loop = distinct.length >= 4 && same(distinct[0], distinct[distinct.length - 1]);
    const ring = loop ? distinct.slice(0, -1) : distinct;
    let chord = 0;
    for (let i = 1; i < distinct.length; i++) {
        const a = distinct[i - 1], b = distinct[i];
        chord += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    }
    const spacing = Math.min(0.05, Math.max(0.002, chord / 4000));
    const line = buildPathLine({ points: ring, curve: shape.curve ?? 0, smoothCorners: shape.smoothCorners ?? 0, loop }, spacing);
    if (!(line.length > 0)) return null;
    const lastIndex = distinct.length - 1;
    const at = Float64Array.from(index, (i) => (loop && i === lastIndex ? line.knots[0] + line.length : line.knots[i]));
    return { line, at };
}

const HEADING_UP = new Vector3(0, 1, 0);
const headingOrigin = new Vector3();
const headingMat = new Matrix4();
/**
 * Facing for travel along `dir`: +Z along the travel, pitching with the slope, no roll; then the
 * object's own rotation (`rest`, its facing correction) on top. In whatever space `dir` is in —
 * a world-space line gives a world rotation (the path animation then puts it in its parent's
 * space), a clip track's line is in the parent's space already. False when `dir` has no length.
 */
export function pathLineHeading(dir: Vector3, rest: Quaternion | null | undefined, out: Quaternion): boolean {
    if (!(dir.lengthSq() > 1e-12)) return false;
    headingMat.lookAt(dir, headingOrigin, HEADING_UP);
    out.setFromRotationMatrix(headingMat);
    if (rest) out.multiply(rest);
    return true;
}
