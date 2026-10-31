// =============================================================================
// shapeCurves — the lines and 3D curves of the shape API (paths, flights, helices, knots)
// =============================================================================
//
// Open lines run along x (west → east); a closed curve is a ring like an outline but may climb
// (its points carry y). Everything is centred on its x / z bounds; heights start at 0 at the
// lowest point unless the shape is symmetric about y 0 (wavy rings, lissajous, knots).
//
import { fit3, TAU, deg } from './shapeMath';
import { waveSamples, waveValue } from './shapeWaves';
import type { CurveShapeSpec, ShapeResult } from './shapeTypes';

type V3 = [number, number, number];
type Spec<K extends CurveShapeSpec['kind']> = Extract<CurveShapeSpec, { kind: K }>;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const count = (v: number | undefined, d: number, min = 2, max = 8192) => Math.round(clamp(v ?? d, min, max));

/** Sample t in [0, 1] (`n` + 1 points, both ends) or round a closed curve (`n` points, no repeat). */
const sample = (n: number, closed: boolean, f: (t: number) => V3): V3[] =>
    Array.from({ length: closed ? n : n + 1 }, (_, k) => f(k / n));

export const CURVES: { [K in CurveShapeSpec['kind']]: (s: Spec<K>) => { points: V3[]; closed: boolean } } = {
    line: (s) => ({ closed: false, points: [[-s.size / 2, 0, 0], [s.size / 2, 0, 0]] }),
    arc: (s) => {
        const ang = deg(clamp(s.angle ?? 180, 10, 350)), n = count(s.samples, 16), d = s.depth ?? s.size;
        // opening north: the arc bulges south, its ends north
        return { closed: false, points: fit3(sample(n, false, (t) => { const a = Math.PI / 2 + ang / 2 - ang * t; return [Math.cos(a), 0, -Math.sin(a)]; }), { size: s.size, depth: d }) };
    },
    zigzag: (s) => {
        const c = count(s.count, 5, 1, 200), d = s.depth ?? s.size / 4, pts: V3[] = [];
        for (let k = 0; k <= c * 2; k++) pts.push([-s.size / 2 + (k / (c * 2)) * s.size, 0, (k % 2 ? 1 : -1) * d / 2]);
        return { closed: false, points: pts };
    },
    wave: (s) => {
        const c = count(s.count, 3, 1, 200), d = s.depth ?? s.size / 4, n = count(s.samples, c * 12);
        return { closed: false, points: sample(n, false, (t) => [-s.size / 2 + t * s.size, 0, Math.sin(t * TAU * c) * d / 2]) };
    },
    spiral: (s) => {
        const turns = clamp(s.turns, 0.25, 40), inner = clamp(s.inner ?? 0.1, 0, 0.95), n = count(s.samples, Math.round(turns * 24)), R = s.size / 2;
        const golden = s.growth === 'golden';
        const pts = sample(n, false, (t) => {
            const a = t * TAU * turns;
            const r = golden ? R * Math.pow(inner <= 0 ? 0.02 : inner, 1 - t) : R * (inner + (1 - inner) * t);
            return [Math.cos(a) * r, 0, -Math.sin(a) * r];
        });
        return { closed: false, points: fit3(pts, { size: s.size, depth: s.depth }) };
    },
    helix: (s) => {
        const turns = clamp(s.turns, 0.25, 60), taper = clamp(s.taper ?? 1, 0, 4), n = count(s.samples, Math.round(turns * 16)), R = s.size / 2, h = s.height;
        const pts = sample(n, false, (t) => {
            const a = t * TAU * turns, r = R * (1 - (1 - taper) * t);
            return [Math.cos(a) * r, t * h, -Math.sin(a) * r];
        });
        if (s.axis === 'x') {
            // lying along x: the climb runs east, the coil turns about x
            return { closed: false, points: pts.map(([x, y, z]) => [y - h / 2, x + R, z] as V3) };
        }
        return { closed: false, points: pts };
    },
    stairs: (s) => {
        const steps = count(s.steps, 6, 1, 400), rise = s.height / steps, tread = s.size / steps, pts: V3[] = [[-s.size / 2, 0, 0]];
        for (let k = 0; k < steps; k++) {
            const x0 = -s.size / 2 + k * tread, x1 = x0 + tread;
            pts.push([x0, (k + 1) * rise, 0], [x1, (k + 1) * rise, 0]);
        }
        return { closed: false, points: pts };
    },
    figureEight: (s) => {
        const n = count(s.samples, 48, 8), d = s.depth ?? s.size / 2;
        return { closed: true, points: sample(n, true, (t) => { const a = t * TAU; return [Math.sin(a) * s.size / 2, 0, Math.sin(2 * a) * d / 2]; }) };
    },
    lissajous: (s) => {
        const a = s.a ?? 3, b = s.b ?? 2, c = s.c ?? 0, n = count(s.samples, 96, 12), d = s.depth ?? s.size, h = s.height ?? 0;
        const pts = sample(n, true, (t) => { const p = t * TAU; return [Math.sin(a * p) * s.size / 2, c ? Math.sin(c * p) * h / 2 : 0, Math.sin(b * p + Math.PI / 2) * d / 2]; });
        return { closed: true, points: pts };
    },
    torusKnot: (s) => {
        const p = count(s.p, 2, 1, 20), q = count(s.q, 3, 1, 20), tube = clamp(s.tube ?? 0.4, 0.05, 0.95), n = count(s.samples, 120, 24), R = s.size / 2 / (1 + tube), r = R * tube;
        // the knot winds on a torus of major radius R and minor radius r: radial R + r cos(q u / p), height r sin(q u / p)
        const h = s.height ?? r * 2;
        const pts = sample(n, true, (t) => {
            const u = t * TAU * p, v = (q / p) * u, radial = R + r * Math.cos(v);
            return [radial * Math.cos(u), Math.sin(v) * h / 2, -radial * Math.sin(u)];
        });
        return { closed: true, points: fit3(pts, { size: s.size, depth: s.depth }) };
    },
    waveform: (s) => {
        // up and down (y) when a height is given, else sideways (z, `depth`)
        const c = s.cycles ?? 4, n = count(s.samples, waveSamples(s.wave, c), 8);
        const up = typeof s.height === 'number', amp = (typeof s.height === 'number' ? s.height : s.depth ?? s.size / 4) / 2;
        return { closed: false, points: sample(n, false, (t) => { const v = waveValue(s.wave, t, c) * amp; return [-s.size / 2 + t * s.size, up ? v : 0, up ? 0 : v]; }) };
    },
    wavyRing: (s) => {
        const w = count(s.waves, 3, 1, 64), n = count(s.samples, Math.max(24, w * 12), 8), d = s.depth ?? s.size;
        return { closed: true, points: sample(n, true, (t) => { const a = Math.PI / 2 + t * TAU; return [Math.cos(a) * s.size / 2, Math.sin(w * t * TAU) * s.height / 2, -Math.sin(a) * d / 2]; }) };
    },
};

/** The line or ring a curve spec describes (metres, centred, turned by `turn`). */
export function curvePoints(spec: CurveShapeSpec): ShapeResult {
    const gen = CURVES[spec.kind] as (s: CurveShapeSpec) => { points: V3[]; closed: boolean };
    const { points, closed } = gen(spec);
    const turned = spec.turn ? fit3(points, { size: span(points), turn: spec.turn }) : points;
    return { points: turned, closed };
}
function span(pts: V3[]): number {
    let a = Infinity, b = -Infinity;
    for (const p of pts) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); }
    return Math.max(1e-9, b - a);
}
