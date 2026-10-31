// =============================================================================
// shapeOutlines — the closed outlines (rings) of the shape API
// =============================================================================
//
// Each generator draws in its natural frame (screen x right / y up, unit sizes) and `fit`s the
// ring to the asked size / depth / turn (shapeMath). Every ring is a simple polygon (no
// self-crossing) so it can be an area; the symbolic ones are the mesh variants' outlines
// (viewer utils/shapes.ts draws the same curves), so a mesh and a layout agree on what a heart is.
//
import { circlePts, fit, Pen, polar, TAU, deg } from './shapeMath';
import { waveSamples, waveValue } from './shapeWaves';
import type { OutlineSpec, ShapeLetter, ShapeResult } from './shapeTypes';

type V2 = [number, number];
type Spec<K extends OutlineSpec['kind']> = Extract<OutlineSpec, { kind: K }>;
type Gen<K extends OutlineSpec['kind']> = (s: Spec<K>) => V2[];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const share = (v: number | undefined, d: number) => clamp(v ?? d, 0.02, 0.98);
const count = (v: number | undefined, d: number, min = 3, max = 4096) => Math.round(clamp(v ?? d, min, max));

/** A stadium (rounded ends on the ±x sides) in a w × h box. */
function stadium(w: number, h: number, n: number): V2[] {
    const r = Math.min(h / 2, w / 2), hx = w / 2 - r, out: V2[] = [];
    for (let k = 0; k <= n; k++) { const a = -Math.PI / 2 + (k / n) * Math.PI; out.push([hx + Math.cos(a) * r, Math.sin(a) * r]); }
    for (let k = 0; k <= n; k++) { const a = Math.PI / 2 + (k / n) * Math.PI; out.push([-hx + Math.cos(a) * r, Math.sin(a) * r]); }
    return out;
}

/** Block letters on a 10 × 10 sketch, stroke `t` units (default 3). */
function letter(L: ShapeLetter, t: number): V2[] {
    const u = 10, a = t, b = u - t, m = (u - t) / 2, m2 = (u + t) / 2;
    switch (L) {
        case 'L': return [[0, 0], [u, 0], [u, a], [a, a], [a, u], [0, u]];
        case 'U': return [[0, 0], [u, 0], [u, u], [b, u], [b, a], [a, a], [a, u], [0, u]];
        case 'T': return [[0, b], [0, u], [u, u], [u, b], [m2, b], [m2, 0], [m, 0], [m, b]];
        case 'H': return [[0, 0], [a, 0], [a, m], [b, m], [b, 0], [u, 0], [u, u], [b, u], [b, m2], [a, m2], [a, u], [0, u]];
        case 'I': return [[0, 0], [u, 0], [u, a], [m2, a], [m2, b], [u, b], [u, u], [0, u], [0, b], [m, b], [m, a], [0, a]];
        case 'E': return [[0, 0], [u, 0], [u, a], [a, a], [a, m], [u * 0.8, m], [u * 0.8, m2], [a, m2], [a, b], [u, b], [u, u], [0, u]];
        case 'F': return [[0, 0], [a, 0], [a, m], [u * 0.8, m], [u * 0.8, m2], [a, m2], [a, b], [u, b], [u, u], [0, u]];
        case 'C': return [[0, 0], [u, 0], [u, a], [a, a], [a, b], [u, b], [u, u], [0, u]];
        case 'Z': { const d = t * 1.25; return [[0, 0], [u, 0], [u, a], [d, a], [u, b], [u, u], [0, u], [0, b], [u - d, b], [0, a]]; }
        case 'S': return [[0, 0], [u, 0], [u, m2], [a, m2], [a, b], [u, b], [u, u], [0, u], [0, m], [b, m], [b, a], [0, a]];
        case 'N': { const d = t * 1.1; return [[0, 0], [a, 0], [a, u - d * 1.4], [b, 0], [u, 0], [u, u], [b, u], [b, d * 1.4], [a, u], [0, u]]; }
        case 'X': { const d = t * 0.75, c = u / 2; return [[0, 0], [d, 0], [c, c - d], [u - d, 0], [u, 0], [u, d], [c + d, c], [u, u - d], [u, u], [u - d, u], [c, c + d], [d, u], [0, u], [0, u - d], [c - d, c], [0, d]]; }
        case 'Y': return [[m, 0], [m2, 0], [m2, m], [u, b], [u, u], [u - t * 0.9, u], [u / 2, m2 + t * 0.4], [t * 0.9, u], [0, u], [0, b], [m, m]];
    }
}

export const OUTLINES: { [K in OutlineSpec['kind']]: Gen<K> } = {
    // ---- geometric
    rect: () => [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
    ellipse: (s) => circlePts(count(s.samples, 24)),
    stadium: (s) => { const d = s.depth ?? s.size * 0.4; return stadium(s.size, d, count(s.samples, 20, 4) / 2); },
    semicircle: (s) => { const n = count(s.samples, 13, 4); return Array.from({ length: n }, (_, k) => { const a = Math.PI + (k / (n - 1)) * Math.PI; return [Math.cos(a), Math.sin(a)] as V2; }); },
    sector: (s) => {
        const ang = deg(clamp(s.angle ?? 90, 5, 350)), n = count(s.samples, 12, 2) - 1;
        const out: V2[] = [[0, 0]];
        for (let k = 0; k <= n; k++) { const a = Math.PI / 2 - ang / 2 + (k / n) * ang; out.push([Math.cos(a), Math.sin(a)]); }
        return out;
    },
    polygon: (s) => circlePts(count(s.sides, 6, 3, 64)),
    star: (s) => { const n = count(s.points, 5, 3, 64), r = share(s.inner, 0.45); return Array.from({ length: n * 2 }, (_, k) => { const a = Math.PI / 2 + (k / (n * 2)) * TAU, rr = k % 2 ? r : 1; return [Math.cos(a) * rr, Math.sin(a) * rr] as V2; }); },
    sparkle: (s) => {
        const n = count(s.points, 4, 3, 32), inner = share(s.inner, 0.28), step = TAU / n, pen = new Pen(6);
        const tip = (k: number): V2 => { const a = k * step + Math.PI / 2; return [Math.cos(a), Math.sin(a)]; };
        const ctrl = (k: number): V2 => { const a = (k + 0.5) * step + Math.PI / 2; return [Math.cos(a) * inner, Math.sin(a) * inner]; };
        pen.moveTo(...tip(0));
        for (let i = 0; i < n; i++) { const [cx, cy] = ctrl(i), [tx, ty] = tip((i + 1) % n); pen.quadraticCurveTo(cx, cy, tx, ty); }
        return pen.ring();
    },
    superellipse: (s) => {
        const n = clamp(s.n ?? 4, 0.3, 20), e = 2 / n;
        return polar(count(s.samples, 32), () => 1).map(([x, y]) => [Math.sign(x) * Math.pow(Math.abs(x), e), Math.sign(y) * Math.pow(Math.abs(y), e)] as V2);
    },
    superformula: (s) => {
        const m = s.symmetry ?? 6, n1 = Math.max(0.05, s.roundness ?? 0.3), n2 = s.twist1 ?? 0.3, n3 = s.twist2 ?? 0.3, a = s.stretchX ?? 1, b = s.stretchY ?? 1;
        return polar(count(s.samples, 48), (phi) => {
            const t1 = Math.pow(Math.abs(Math.cos((m * phi) / 4) / a), n2), t2 = Math.pow(Math.abs(Math.sin((m * phi) / 4) / b), n3);
            return Math.pow(t1 + t2, -1 / n1);
        });
    },
    rose: (s) => { const k = count(s.petals, 5, 2, 24), inner = share(s.inner, 0.15); return polar(count(s.samples, k * 8), (t) => inner + (1 - inner) * Math.abs(Math.cos((k * t) / 2))); },
    flower: (s) => { const k = count(s.petals, 6, 2, 24), inner = share(s.inner, 0.52), sharp = clamp(s.sharp ?? 0.7, 0.1, 4); return polar(count(s.samples, k * 8), (t) => inner + (1 - inner) * Math.pow(0.5 + 0.5 * Math.cos(k * t), sharp)); },
    spirograph: (s) => {
        // a hypotrochoid: R = lobes + 1, r = 1, d = bulge (≤ r keeps it simple — no self-crossing)
        const R = count(s.lobes, 5, 2, 24) + 1, r = 1, d = share(s.bulge, 0.6), n = count(s.samples, R * 8);
        return Array.from({ length: n }, (_, k) => { const t = (k / n) * TAU; return [(R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t), (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)] as V2; });
    },
    gear: (s) => {
        const teeth = count(s.teeth, 12, 3, 64), inner = share(s.inner, 0.76), step = TAU / teeth, out: V2[] = [];
        for (let i = 0; i < teeth; i++) {
            const a = i * step + Math.PI / 2, ang = [a + step * 0.2, a + step * 0.35, a + step * 0.65, a + step * 0.8], rad = [inner, 1, 1, inner];
            for (let j = 0; j < 4; j++) out.push([Math.cos(ang[j]) * rad[j], Math.sin(ang[j]) * rad[j]]);
        }
        return out;
    },
    reuleaux: (s) => {
        const n = count(s.samples, 30, 6) / 3, c = circlePts(3), out: V2[] = [];
        // each side is an arc about the opposite corner
        for (let i = 0; i < 3; i++) {
            const o = c[(i + 2) % 3], a = c[i], b = c[(i + 1) % 3];
            const a0 = Math.atan2(a[1] - o[1], a[0] - o[0]), a1 = Math.atan2(b[1] - o[1], b[0] - o[0]), r = Math.hypot(a[0] - o[0], a[1] - o[1]);
            let d = a1 - a0; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
            for (let k = 0; k < n; k++) { const t = a0 + (d * k) / n; out.push([o[0] + Math.cos(t) * r, o[1] + Math.sin(t) * r]); }
        }
        return out;
    },
    triangle: () => circlePts(3),
    rightTriangle: () => [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5]],
    diamond: () => [[0, 1], [0.5, 0], [0, -1], [-0.5, 0]],
    kite: () => [[0, 1], [0.6, 0.3], [0, -1], [-0.6, 0.3]],
    trapezoid: (s) => { const t = share(s.top, 0.6) / 2; return [[-0.5, -0.5], [0.5, -0.5], [t, 0.5], [-t, 0.5]]; },
    parallelogram: (s) => { const k = share(s.slant, 0.4); return [[-0.5, -0.5], [0.5 - k, -0.5], [0.5, 0.5], [-0.5 + k, 0.5]]; },
    chevron: (s) => { const t = share(s.thickness, 0.5); return [[-0.5, -0.5], [-0.5 + t, -0.5], [0.5, 0], [-0.5 + t, 0.5], [-0.5, 0.5], [0.5 - t, 0]]; },
    arrow: (s) => { const t = share(s.thickness, 0.4) / 2, h = 0.4; return [[-0.5, -t], [h, -t], [h, -0.5], [0.5, 0], [h, 0.5], [h, t], [-0.5, t]]; },
    cross: (s) => { const t = share(s.thickness, 0.34) / 2; return [[-t, -0.5], [t, -0.5], [t, -t], [0.5, -t], [0.5, t], [t, t], [t, 0.5], [-t, 0.5], [-t, t], [-0.5, t], [-0.5, -t], [-t, -t]]; },
    letter: (s) => letter(s.letter, share(s.thickness, 0.3) * 10),
    // ---- symbolic — the mesh variants' outlines (viewer utils/shapes.ts), same curves
    heart: () => new Pen().moveTo(0.25, 0.25)
        .bezierCurveTo(0.25, 0.25, 0.20, 0, 0, 0).bezierCurveTo(-0.30, 0, -0.30, 0.35, -0.30, 0.35)
        .bezierCurveTo(-0.30, 0.55, -0.10, 0.77, 0.25, 0.95).bezierCurveTo(0.60, 0.77, 0.80, 0.55, 0.80, 0.35)
        .bezierCurveTo(0.80, 0.35, 0.80, 0, 0.50, 0).bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25).ring(),
    spade: () => new Pen().moveTo(0, 0.5)
        .bezierCurveTo(-0.05, 0.30, -0.45, 0.18, -0.45, -0.05).bezierCurveTo(-0.45, -0.28, -0.18, -0.30, -0.05, -0.12)
        .bezierCurveTo(-0.10, -0.28, -0.16, -0.34, -0.18, -0.42).lineTo(0.18, -0.42)
        .bezierCurveTo(0.16, -0.34, 0.10, -0.28, 0.05, -0.12).bezierCurveTo(0.18, -0.30, 0.45, -0.28, 0.45, -0.05)
        .bezierCurveTo(0.45, 0.18, 0.05, 0.30, 0, 0.5).ring(),
    club: (s) => {
        const R = 0.32, A = 0.18, gap = deg(18), start = Math.PI * 1.5 + gap, sweep = TAU - 2 * gap, n = count(s.samples, 60, 12), out: V2[] = [];
        for (let i = 0; i <= n; i++) { const t = start + (i / n) * sweep, r = R + A * Math.cos(3 * (t - Math.PI / 2)); out.push([Math.cos(t) * r, Math.sin(t) * r]); }
        out.push([-0.07, -0.5], [0.07, -0.5]);
        return out;
    },
    droplet: (s) => {
        const w = 0.25, top = 0.55 * clamp(s.taper ?? 1, 0.3, 2), bot = -0.45;
        return new Pen().moveTo(0, top)
            .bezierCurveTo(w * 0.2, top * 0.55, w, (top + bot) * 0.5, w, bot * 0.45).bezierCurveTo(w, bot, w * 0.5, bot * 1.25, 0, bot * 1.25)
            .bezierCurveTo(-w * 0.5, bot * 1.25, -w, bot, -w, bot * 0.45).bezierCurveTo(-w, (top + bot) * 0.5, -w * 0.2, top * 0.55, 0, top).ring();
    },
    lightning: () => [[0.10, 0.50], [-0.25, 0.05], [-0.05, 0.05], [-0.20, -0.50], [0.25, 0.0], [0.05, 0.0]],
    shield: () => { const w = 0.4, top = 0.5, bot = -0.5; return new Pen().moveTo(-w, top).lineTo(w, top).lineTo(w, top * 0.1).bezierCurveTo(w, bot * 0.5, w * 0.5, bot * 0.9, 0, bot).bezierCurveTo(-w * 0.5, bot * 0.9, -w, bot * 0.5, -w, top * 0.1).ring(); },
    infinity: (s) => {
        // the lemniscate silhouette r² = a² cos 2θ + b²: pointed lobes, a solid waist
        const a = 0.5, waist = clamp(s.waist ?? 0.14, 0.03, 0.5), b = Math.sqrt(a * a + waist * waist), n = count(s.samples, 48, 12);
        return Array.from({ length: n }, (_, i) => { const th = (i / n) * TAU, r = Math.sqrt(Math.max(a * a * Math.cos(2 * th) + b * b, 1e-6)); return [r * Math.cos(th), r * Math.sin(th)] as V2; });
    },
    // ---- organic
    teardrop: (s) => { const n = count(s.samples, 20, 8); return Array.from({ length: n }, (_, k) => { const t = (k / n) * TAU; return [Math.cos(t), Math.sin(t) * 0.65 * Math.pow(Math.abs(Math.sin(t / 2)), 1.2)] as V2; }); },
    egg: (s) => { const n = count(s.samples, 24, 8); return Array.from({ length: n }, (_, k) => { const t = (k / n) * TAU; return [Math.cos(t) * 0.78 * (1 - 0.12 * Math.sin(t)), Math.sin(t)] as V2; }); },
    leaf: (s) => { const n = count(s.samples, 24, 8); return Array.from({ length: n }, (_, k) => { const t = (k / n) * TAU; const w = Math.pow(Math.abs(Math.sin(t / 2)), 0.9) * Math.sin(t) * 0.5; return [Math.cos(t) * -1, w] as V2; }); },
    kidney: () => [[0, 0.33], [0.42, 0], [0.83, 0.17], [1.08, 0], [1.5, 0.33], [1.42, 0.87], [0.83, 1], [0.25, 0.92]],
    crescent: (s) => {
        // the unit disc minus a disc through its two tips (0, ±1): thickness t → the moon is 2t radii wide at the middle
        const t = share(s.thickness, 0.38), n = Math.round(count(s.samples, 24, 8) / 2), out: V2[] = [];
        const k = 2 * t - 1, c = Math.abs(k) < 1e-3 ? 1e4 : (k * k - 1) / (2 * k), ri = Math.hypot(c, 1);
        for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (i / n) * Math.PI; out.push([Math.cos(a), Math.sin(a)]); }          // outer arc, top → west → bottom
        const p0 = Math.atan2(-1, -c), p1 = Math.atan2(1, -c);
        for (let i = 1; i < n; i++) { const a = p0 + ((p1 - p0) * i) / n; out.push([c + Math.cos(a) * ri, Math.sin(a) * ri]); }    // inner arc, bottom → top
        return out.map(([x, y]) => [-x, y] as V2);                                                                                   // convex side east
    },
    cloud: (s) => { const p = count(s.puffs, 5, 3, 12); return polar(count(s.samples, p * 10), (t) => 0.8 + 0.2 * Math.abs(Math.cos((p * t) / 2)) + 0.06 * Math.cos(2 * t)); },
    bubble: () => {
        // an ellipse with a gap on its lower-left side, the tail's tip outside it
        const n = 22, out: V2[] = [];
        for (let k = 0; k <= n; k++) { const a = Math.PI * 1.35 + (k / n) * Math.PI * 1.7; out.push([Math.cos(a) * 1.2, 0.2 + Math.sin(a) * 0.9]); }
        out.push([-1.3, -1.25]);
        return out;
    },
    house: () => [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.15], [0, 0.6], [-0.5, 0.15]],
    bell: () => new Pen().moveTo(-0.5, -0.4).lineTo(0.5, -0.4).lineTo(0.5, -0.28).bezierCurveTo(0.25, -0.2, 0.2, 0.1, 0.18, 0.4).bezierCurveTo(0.14, 0.6, -0.14, 0.6, -0.18, 0.4).bezierCurveTo(-0.2, 0.1, -0.25, -0.2, -0.5, -0.28).ring(),
    // ---- frequencies
    waveStrip: (s) => {
        // the waveform along the north edge (screen y up = north), a straight south edge; 1 unit deep
        const c = s.cycles ?? 6, a = share(s.amount, 0.35) / 2, n = count(s.samples, waveSamples(s.wave, c), 8);
        const w = s.size / (s.depth ?? s.size / 3);
        const top: V2[] = Array.from({ length: n + 1 }, (_, k) => { const t = k / n; return [t * w, 1 - a + a * waveValue(s.wave, t, c)] as V2; });
        return [[0, 0], [w, 0], ...top.reverse()];
    },
    waveRing: (s) => {
        const c = Math.max(1, Math.round(s.cycles ?? 12)), a = clamp(s.amount ?? 0.15, 0.01, 0.6), n = count(s.samples, waveSamples(s.wave, c), 12);
        return Array.from({ length: n }, (_, k) => { const t = k / n, r = 1 + a * waveValue(s.wave, t, c), ang = Math.PI / 2 - t * TAU; return [Math.cos(ang) * r, Math.sin(ang) * r] as V2; });
    },
    fish: () => new Pen().moveTo(0.5, 0).bezierCurveTo(0.2, 0.42, -0.25, 0.42, -0.5, 0.1).lineTo(-0.85, 0.35).lineTo(-0.72, 0).lineTo(-0.85, -0.35).lineTo(-0.5, -0.1).bezierCurveTo(-0.25, -0.42, 0.2, -0.42, 0.5, 0).ring(),
};

/** The ring an outline spec describes, fitted to its size / depth / turn. */
export function outlinePoints(spec: OutlineSpec): ShapeResult {
    const gen = OUTLINES[spec.kind] as Gen<typeof spec.kind>;
    const pts = gen(spec as never);
    const depth = spec.depth ?? (spec.kind === 'rect' || spec.kind === 'ellipse' ? spec.size : spec.kind === 'waveStrip' ? spec.size / 3 : undefined);
    return { points: fit(pts, { size: spec.size, depth, turn: spec.turn }), closed: true };
}
