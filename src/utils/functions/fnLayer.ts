// =============================================================================
// fnLayer — layering: octaves of a base noise combined (≈ −1 … 1)
// =============================================================================
//
// A layering function runs over a base field (any 'noise.*' id — the FnRef's `base`): fbm sums
// finer and finer octaves, ridged sharpens the peaks, billow puffs them, warp bends the noise by
// itself, terrace steps it. The CPU side is the curving API's `layered`, unchanged. In GLSL the
// base is spliced in by name ({{base}}), so each (layer, base) pair is one generated function:
// fn_fbm_simplex, fn_ridged_perlin, …
//
import { fnSmooth } from './fnHash';
import type { FieldFnDef, FieldSampler, FnParam, FnParams } from './fnTypes';

const OCTAVES: FnParam = { key: 'octaves', label: 'Octaves', min: 1, max: 8, step: 1, default: 4, integer: true, tip: 'Layers of finer detail — more octaves, more fine roughness.' };

type Base = FieldSampler;
function fbm(f: Base, px: number, py: number, oct: number): number {
    let sum = 0, amp = 1, norm = 0, fr = 1;
    for (let i = 0; i < oct; i++) { sum += amp * f(px * fr + i * 17.3, py * fr - i * 9.1); norm += amp; amp *= 0.5; fr *= 2.03; }
    return sum / norm;
}
const oct = (p: FnParams) => Math.round(p.octaves);

const fbmSampler = (p: FnParams, _s: number, f?: Base): FieldSampler => { const o = oct(p), b = f!; return (x, y) => fbm(b, x, y, o); };
const ridgedSampler = (p: FnParams, _s: number, f?: Base): FieldSampler => {
    const o = oct(p), b = f!;
    return (x, y) => {
        let sum = 0, amp = 1, norm = 0, fr = 1;
        for (let i = 0; i < o; i++) { const v = 1 - Math.abs(b(x * fr + i * 17.3, y * fr - i * 9.1)); sum += amp * v * v; norm += amp; amp *= 0.5; fr *= 2.03; }
        return (sum / norm) * 2 - 1;
    };
};
const billowSampler = (p: FnParams, _s: number, f?: Base): FieldSampler => {
    const o = oct(p), b = f!;
    return (x, y) => {
        let sum = 0, amp = 1, norm = 0, fr = 1;
        for (let i = 0; i < o; i++) { sum += amp * Math.abs(b(x * fr + i * 17.3, y * fr - i * 9.1)); norm += amp; amp *= 0.5; fr *= 2.03; }
        return (sum / norm) * 2 - 1;
    };
};
const warpSampler = (p: FnParams, seed: number, f?: Base): FieldSampler => {
    const o = oct(p), w = p.warp, b = f!, ow = Math.max(1, o - 1);
    return (x, y) => {
        const wx = fbm(b, x + 5.2, y + 1.3, ow), wy = fbm(b, x - 3.7 + seed * 0.01, y + 8.1, ow);
        return fbm(b, x + w * wx, y + w * wy, o);
    };
};
const terraceSampler = (p: FnParams, _s: number, f?: Base): FieldSampler => {
    const o = oct(p), steps = Math.round(p.steps), b = f!;
    return (x, y) => {
        const v = fbm(b, x, y, o);
        const q = Math.floor((v * 0.5 + 0.5) * steps), fr = (v * 0.5 + 0.5) * steps - q;
        return ((q + fnSmooth(Math.min(1, Math.max(0, (fr - 0.75) / 0.25)))) / steps) * 2 - 1;
    };
};

// ---------------------------------------------------------------------------- GLSL ({{base}} = the base noise's function name, {{name}} = this function's)
const fbmCore = /*glsl*/ `
float {{name}}_fbm(vec2 p, float seed, int oct) {
    float sum = 0.0, amp = 1.0, norm = 0.0, fr = 1.0;
    for (int i = 0; i < 8; i++) {
        if (i >= oct) break;
        sum += amp * {{base}}(vec2(p.x * fr + float(i) * 17.3, p.y * fr - float(i) * 9.1), seed);
        norm += amp; amp *= 0.5; fr *= 2.03;
    }
    return sum / norm;
}`;
const fbmGlsl = fbmCore + /*glsl*/ `
float {{name}}(vec2 p, float seed, float octaves) { return {{name}}_fbm(p, seed, int(octaves + 0.5)); }`;
const ridgedGlsl = /*glsl*/ `
float {{name}}(vec2 p, float seed, float octaves) {
    int oct = int(octaves + 0.5);
    float sum = 0.0, amp = 1.0, norm = 0.0, fr = 1.0;
    for (int i = 0; i < 8; i++) {
        if (i >= oct) break;
        float v = 1.0 - abs({{base}}(vec2(p.x * fr + float(i) * 17.3, p.y * fr - float(i) * 9.1), seed));
        sum += amp * v * v; norm += amp; amp *= 0.5; fr *= 2.03;
    }
    return (sum / norm) * 2.0 - 1.0;
}`;
const billowGlsl = /*glsl*/ `
float {{name}}(vec2 p, float seed, float octaves) {
    int oct = int(octaves + 0.5);
    float sum = 0.0, amp = 1.0, norm = 0.0, fr = 1.0;
    for (int i = 0; i < 8; i++) {
        if (i >= oct) break;
        sum += amp * abs({{base}}(vec2(p.x * fr + float(i) * 17.3, p.y * fr - float(i) * 9.1), seed));
        norm += amp; amp *= 0.5; fr *= 2.03;
    }
    return (sum / norm) * 2.0 - 1.0;
}`;
const warpGlsl = fbmCore + /*glsl*/ `
float {{name}}(vec2 p, float seed, float octaves, float warp) {
    int oct = int(octaves + 0.5), ow = max(1, oct - 1);
    float wx = {{name}}_fbm(p + vec2(5.2, 1.3), seed, ow), wy = {{name}}_fbm(p + vec2(-3.7 + seed * 0.01, 8.1), seed, ow);
    return {{name}}_fbm(p + warp * vec2(wx, wy), seed, oct);
}`;
const terraceGlsl = fbmCore + /*glsl*/ `
float {{name}}(vec2 p, float seed, float octaves, float steps) {
    float v = {{name}}_fbm(p, seed, int(octaves + 0.5)), st = floor(steps + 0.5);
    float q = floor((v * 0.5 + 0.5) * st), fr = (v * 0.5 + 0.5) * st - q;
    return ((q + fn_smooth(clamp((fr - 0.75) / 0.25, 0.0, 1.0))) / st) * 2.0 - 1.0;
}`;

const R: [number, number] = [-1, 1];
const layer = (id: string, name: string, description: string, goodFor: string[], params: FnParam[], sampler: FieldFnDef['sampler'], chunk: string): FieldFnDef =>
    ({ id, name, family: 'layer', shape: 'field', range: R, takesBase: true, description, goodFor, params, sampler, glsl: { name: `fn_${id.slice(6)}`, deps: ['hash'], chunk } });

export const FN_LAYER_DEFS: FieldFnDef[] = [
    layer('layer.fbm', 'Fractal (fBm)', 'Layers of finer noise — a coastline.', ['Coastlines', 'Terrain', 'Clouds'], [OCTAVES], fbmSampler, fbmGlsl),
    layer('layer.ridged', 'Ridged', 'Sharp points outward — rocky capes, cliffs.', ['Mountain ridges', 'Cliffs', 'Lightning-like veins'], [OCTAVES], ridgedSampler, ridgedGlsl),
    layer('layer.billow', 'Billow', 'Puffy round lobes — clouds, shrubs.', ['Cumulus clouds', 'Shrubs and canopies', 'Foam'], [OCTAVES], billowSampler, billowGlsl),
    layer('layer.warp', 'Warped', 'The noise bent by itself — swirls, hooks and deep bays.', ['Marble', 'Swirling smoke', 'Deep bays and fjords'],
        [OCTAVES, { key: 'warp', label: 'Warp', min: 0, max: 4, step: 0.1, default: 1.6, tip: 'How far the noise bends itself — 0 is plain fBm, high is swirls.' }], warpSampler, warpGlsl),
    layer('layer.terrace', 'Terraced', 'Stepped levels — eroded, quarried edges.', ['Quarries and mesas', 'Rice terraces', 'Stepped shores'],
        [OCTAVES, { key: 'steps', label: 'Steps', min: 2, max: 12, step: 1, default: 4, integer: true, tip: 'How many levels the steps climb.' }], terraceSampler, terraceGlsl),
];
