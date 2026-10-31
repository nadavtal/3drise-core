// =============================================================================
// curveNoise — noise along a line: an organic edge (a coast, a forest edge, a rough wall)
// =============================================================================
//
// Part of the ONE curving API (utils/curve). A CurveNoise pushes a line sideways (along its
// normal) by a FIELD FUNCTION of the functions library (utils/functions) read along it: on a
// closed line it is read round a circle in function space, so it closes with no seam; on an open
// line or a single side it runs along it and fades out at the ends, so they stay where they are
// and the line joins its neighbours smoothly.
//   fn       the function (an FnRef: any field — a noise, a layering over a noise, a wave, or a
//            preset), picked in the FunctionsGallery
//   bumps    how many features along the line (or the side)
//   depth    how far in / out, metres (the line's own units)
//   seed     the function's seed (the CurveNoise's seed wins over the FnRef's)
//   noise, layers, octaves   the OLD way of naming the function (before the library) — still
//            read when `fn` is absent, mapped to the same library functions (curveNoiseFnRef),
//            so every saved edge keeps its exact shape
//
// Deterministic (no Math.random): same options, same line, everywhere. Built-in layouts use it by
// reference, so NEVER change what an existing value returns — a new behaviour is a new function id.
//
import { fnDef, fnField, fnHas, fnHash1, fnRefObj, fnResolve, type FnRef, type FnRefObj } from '../functions';

export type CurveNoiseKind = 'value' | 'perlin' | 'simplex' | 'worley' | 'sine';
export type CurveNoiseLayers = 'single' | 'fbm' | 'ridged' | 'billow' | 'warp' | 'terrace';

export interface CurveNoise {
    /** The field function (library id, params, base). Absent: `noise` + `layers` + `octaves` name it the old way. */
    fn?: FnRefObj | string;
    /** @deprecated the old function name; read only when `fn` is absent. */
    noise?: CurveNoiseKind;
    /** @deprecated the old layering; read only when `fn` is absent. */
    layers?: CurveNoiseLayers;
    /** Features along the line (or the side), 0.5 – 64. */
    bumps?: number;
    /** Metres in / out. */
    depth?: number;
    /** @deprecated octaves of the old layering; read only when `fn` is absent (a library fn has them in its params). */
    octaves?: number;
    seed?: number;
}

/** The old function names — kept for reading old values; new code picks from the library. */
export const CURVE_NOISE_KINDS: ReadonlyArray<{ value: CurveNoiseKind; label: string; description: string }> = [
    { value: 'value', label: 'Value', description: 'Smooth random lumps — soft, a little blocky.' },
    { value: 'perlin', label: 'Perlin', description: 'Gradient noise — rolling, natural bumps.' },
    { value: 'simplex', label: 'Simplex', description: 'Like Perlin with fewer straight artefacts — the all-rounder.' },
    { value: 'worley', label: 'Worley', description: 'Cellular — scalloped bays between rounded headlands.' },
    { value: 'sine', label: 'Sine', description: 'Regular lobes — waves, a flower, a cog.' },
];
export const CURVE_NOISE_LAYERS: ReadonlyArray<{ value: CurveNoiseLayers; label: string; description: string }> = [
    { value: 'single', label: 'Single', description: 'One layer of noise.' },
    { value: 'fbm', label: 'Fractal (fBm)', description: 'Layers of finer noise — a coastline.' },
    { value: 'ridged', label: 'Ridged', description: 'Sharp points outward — rocky capes, cliffs.' },
    { value: 'billow', label: 'Billow', description: 'Puffy round lobes — clouds, shrubs.' },
    { value: 'warp', label: 'Warped', description: 'The noise bent by itself — swirls, hooks and deep bays.' },
    { value: 'terrace', label: 'Terraced', description: 'Stepped levels — eroded, quarried edges.' },
];
export const CURVE_NOISE_LIMITS = { bumps: [0.5, 64], octaves: [1, 8] } as const;

/** A noise filled in (clamped, defaults). `fn` stays as given (resolved by curveNoiseFnRef). */
export function curveNoiseDefaults(n: Partial<CurveNoise>): Required<Omit<CurveNoise, 'fn'>> & { fn?: FnRefObj | string } {
    const cl = (v: number, [a, b]: readonly [number, number]) => Math.min(b, Math.max(a, v));
    return {
        fn: n.fn,
        noise: n.noise ?? 'simplex',
        layers: n.layers ?? 'fbm',
        bumps: cl(n.bumps ?? 6, CURVE_NOISE_LIMITS.bumps),
        depth: Number.isFinite(n.depth) ? (n.depth as number) : 1,
        octaves: Math.round(cl(n.octaves ?? 4, CURVE_NOISE_LIMITS.octaves)),
        seed: Math.floor(n.seed ?? 1),
    };
}

/**
 * The library function a CurveNoise reads: its `fn` (with the CurveNoise's seed), or the old
 * noise / layers / octaves mapped onto the library — the same math, so the same edge.
 */
export function curveNoiseFnRef(noise: Partial<CurveNoise>): FnRefObj {
    const o = curveNoiseDefaults(noise);
    if (o.fn) {
        const r = fnRefObj(o.fn);
        if (fnHas(r.id) && fnDef(r.id).shape === 'field') return { ...r, seed: o.seed };
    }
    // the old 'sine': lobes turned and pointed by the seed — now the lobes' own params, the old seed's values
    if (o.noise === 'sine') return { id: 'wave.lobes', seed: o.seed, params: { turn: fnHash1(o.seed * 11.7) * 6.283 / (Math.PI * 2), sharp: 0.15 + 0.2 * fnHash1(o.seed * 5.3 + 2.1) } };
    if (o.layers === 'single') return { id: `noise.${o.noise}`, seed: o.seed };
    return { id: `layer.${o.layers}`, base: `noise.${o.noise}`, params: { octaves: o.octaves }, seed: o.seed };
}

/** How the noise fades in from a side's ends (0 at the end, 1 a fifth of the way in). */
export const curveNoiseTaper = (u: number) => { const e = Math.min(1, Math.max(0, Math.min(u, 1 - u) / 0.2)); return e * e * (3 - 2 * e); };

/** How fine the noise's detail is — its octaves (1 for a single layer / a wave); sets how densely a line is sampled. */
export function curveNoiseDetail(noise: Partial<CurveNoise>): number {
    const r = curveNoiseFnRef(noise);
    return Math.max(1, Math.round(fnResolve(r).params.octaves ?? 1));
}

// the compiled sampler per CurveNoise object (specs keep their noise objects between samples)
const samplers = new WeakMap<CurveNoise, { open?: (u: number) => number; closed?: (u: number) => number }>();

/**
 * The noise's push at `u` (0..1 along the line or side), metres. `closed`: read round a circle
 * (seamless, no taper); open: along it, faded to 0 at both ends. The function is compiled once
 * per noise object (curveNoiseSampler) and reused.
 */
export function curveNoiseAt(noise: CurveNoise, u: number, closed: boolean): number {
    let c = samplers.get(noise);
    if (!c) { c = {}; samplers.set(noise, c); }
    const key = closed ? 'closed' : 'open';
    let s = c[key];
    if (!s) { s = curveNoiseSampler(noise, closed); c[key] = s; }
    return s(u);
}

/** The push along a line as a function of u — the function compiled once. */
export function curveNoiseSampler(noise: CurveNoise, closed: boolean): (u: number) => number {
    const o = curveNoiseDefaults(noise);
    if (!o.depth) return () => 0;
    const ref: FnRef = curveNoiseFnRef(o);
    const f = fnField(ref);
    const taper = closed ? () => 1 : curveNoiseTaper;
    if (fnDef(ref.id).family === 'wave') {
        // regular: x in cycles — `bumps` lobes round a closed line (whole, so it closes), bumps along an open one
        const cycles = Math.max(1, closed ? Math.round(o.bumps) : o.bumps);
        return (u) => o.depth * f(u * cycles, 0) * taper(u);
    }
    // the scale: about `bumps` features along the line
    const k = 1.6 * o.bumps, r = k / (2 * Math.PI);
    if (closed) return (u) => o.depth * f(Math.cos(u * Math.PI * 2) * r, Math.sin(u * Math.PI * 2) * r);
    return (u) => o.depth * f(u * k, 0.37) * taper(u);
}
