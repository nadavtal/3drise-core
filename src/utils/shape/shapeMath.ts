// =============================================================================
// shapeMath — the small helpers every generator shares (a pen, fitting, turning)
// =============================================================================
//
// Generators draw in whatever frame is natural (unit radius, a sketch in units, screen x / y with
// y up) and hand the points to `fit`, which centres them on their x / z bounds and scales them to
// the asked size (x) and depth (z). "Up" in a sketch (screen +y) is north (−z) on the ground.
//
type V3 = [number, number, number];
type V2 = [number, number];

export const TAU = Math.PI * 2;
export const deg = (d: number) => (d * Math.PI) / 180;

/** A tiny path pen in screen coordinates (x right, y up): lines, quadratics and cubics sampled to points. */
export class Pen {
    pts: V2[] = [];
    private cur: V2 = [0, 0];
    constructor(private readonly perCurve = 8) {}
    moveTo(x: number, y: number) { this.cur = [x, y]; this.pts.push([x, y]); return this; }
    lineTo(x: number, y: number) { this.cur = [x, y]; this.pts.push([x, y]); return this; }
    quadraticCurveTo(cx: number, cy: number, x: number, y: number, n = this.perCurve) {
        const [x0, y0] = this.cur;
        for (let k = 1; k <= n; k++) {
            const t = k / n, u = 1 - t;
            this.pts.push([u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y]);
        }
        this.cur = [x, y];
        return this;
    }
    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number, n = this.perCurve) {
        const [x0, y0] = this.cur;
        for (let k = 1; k <= n; k++) {
            const t = k / n, u = 1 - t;
            this.pts.push([
                u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
                u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
            ]);
        }
        this.cur = [x, y];
        return this;
    }
    /** An arc about (cx, cy), radius r, from angle a0 to a1 (radians, screen frame), `n` steps, both ends included. */
    arc(cx: number, cy: number, r: number, a0: number, a1: number, n = this.perCurve * 2) {
        for (let k = 0; k <= n; k++) { const a = a0 + ((a1 - a0) * k) / n; this.pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
        this.cur = this.pts[this.pts.length - 1];
        return this;
    }
    /** The sampled points as a ring: the closing duplicate (if any) dropped. */
    ring(): V2[] { return dedupeRing(this.pts); }
}

/** Drop consecutive duplicates and a last point equal to the first. */
export function dedupeRing(pts: V2[], eps = 1e-6): V2[] {
    const out: V2[] = [];
    for (const p of pts) {
        const q = out[out.length - 1];
        if (!q || Math.abs(q[0] - p[0]) > eps || Math.abs(q[1] - p[1]) > eps) out.push(p);
    }
    if (out.length > 2) { const a = out[0], b = out[out.length - 1]; if (Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps) out.pop(); }
    return out;
}

/** Points on a circle of radius r (screen frame), `n` of them, starting at angle a0 (default: the top). */
export function circlePts(n: number, r = 1, a0 = Math.PI / 2, rx = r, ry = r): V2[] {
    return Array.from({ length: n }, (_, k) => { const a = a0 + (k / n) * TAU; return [Math.cos(a) * rx, Math.sin(a) * ry] as V2; });
}
/** A polar curve r(θ) sampled at `n` angles (screen frame, θ 0 at the top, turning anticlockwise on screen). */
export function polar(n: number, r: (theta: number) => number, a0 = Math.PI / 2): V2[] {
    return Array.from({ length: n }, (_, k) => { const t = (k / n) * TAU; const rr = r(t), a = t + a0; return [Math.cos(a) * rr, Math.sin(a) * rr] as V2; });
}

export interface FitOptions { size: number; depth?: number; turn?: number }

/**
 * Screen points (x right, y up) → ground points [x, 0, z] (north = −z): centred on their bounds and
 * scaled so the width is `size`; `depth` (when given) scales z on its own, else z keeps the shape's
 * proportion. Then turned by `turn` degrees about y (clockwise seen from above).
 */
export function fit(pts: V2[], o: FitOptions): V3[] {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const w = Math.max(1e-9, x1 - x0), h = Math.max(1e-9, y1 - y0);
    const kx = o.size / w, kz = o.depth !== undefined ? o.depth / h : kx;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const out = pts.map(([x, y]) => [(x - cx) * kx, 0, -(y - cy) * kz] as V3);
    return o.turn ? turnY(out, deg(o.turn)) : out;
}
/** Ground points scaled so their x extent is `size` and (when given) z extent `depth`; heights scale with x. */
export function fit3(pts: V3[], o: FitOptions): V3[] {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const [x, , z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const w = Math.max(1e-9, x1 - x0), d = Math.max(1e-9, z1 - z0);
    const kx = o.size / w, kz = o.depth !== undefined ? o.depth / d : kx;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const out = pts.map(([x, y, z]) => [(x - cx) * kx, y, (z - cz) * kz] as V3);
    return o.turn ? turnY(out, deg(o.turn)) : out;
}

/** Turn ground points about y (clockwise seen from above, x east / z south). */
export function turnY(pts: V3[], rad: number): V3[] {
    if (!rad) return pts;
    const c = Math.cos(rad), s = Math.sin(rad);
    return pts.map(([x, y, z]) => [x * c - z * s, y, x * s + z * c] as V3);
}
/** Move points. */
export const movePts = (pts: V3[], dx: number, dy: number, dz: number): V3[] => pts.map(([x, y, z]) => [x + dx, y + dy, z + dz] as V3);
/** Scale points about the origin (one factor, or per axis). */
export const scalePts = (pts: V3[], sx: number, sy = sx, sz = sx): V3[] => pts.map(([x, y, z]) => [x * sx, y * sy, z * sz] as V3);
/** Mirror points across the z axis (x → −x) — keeps the ring's order. */
export const mirrorX = (pts: V3[]): V3[] => pts.map(([x, y, z]) => [-x, y, z] as V3);
/** Give every point a height from its position and index (presets lift rims, slopes, waves with it). */
export const liftPts = (pts: V3[], y: (x: number, z: number, i: number, n: number) => number): V3[] => pts.map(([x, , z], i) => [x, y(x, z, i, pts.length), z] as V3);
/** Round every coordinate to the centimetre (presets are stored this way). */
export const roundPts = (pts: V3[], d = 100): V3[] => pts.map(([x, y, z]) => [Math.round(x * d) / d, Math.round(y * d) / d, Math.round(z * d) / d] as V3);
