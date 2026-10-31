// =============================================================================
// fnNoise — the noise fields: value, perlin, simplex, worley, white (≈ −1 … 1)
// =============================================================================
//
// The CPU side is the curving API's noise, moved here unchanged (same ops, same order), so every
// area / path / grid edge drawn before this library keeps its exact shape. The GLSL side is the
// same math on the same hash (fnHash). The seed goes into the hash AND, as the old code did,
// shifts the coordinates by a seed-sized offset; in GLSL that offset is split into its integer
// part (added to the lattice index) and its fraction (added to the coordinate), so fp32 keeps
// its precision — value, perlin and worley match the CPU to ~1e-6. Simplex skews the coordinates
// before the lattice, so its offset can't be split: it matches to ~1e-3 for large seeds (a GPU
// pattern a hair off the CPU one, never a different pattern).
//
import { fnHash2, fnSmooth, fnFade } from './fnHash';
import type { FieldFnDef, FieldSampler } from './fnTypes';

// ---------------------------------------------------------------------------- CPU (the curving API's noise, verbatim)
export function fnValueNoise(x: number, y: number, seed: number): number {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = fnSmooth(xf), v = fnSmooth(yf);
    const a = fnHash2(xi, yi, seed), b = fnHash2(xi + 1, yi, seed), c = fnHash2(xi, yi + 1, seed), d = fnHash2(xi + 1, yi + 1, seed);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
function grad(ix: number, iy: number, seed: number, dx: number, dy: number): number {
    const a = fnHash2(ix, iy, seed) * Math.PI * 2;
    return Math.cos(a) * dx + Math.sin(a) * dy;
}
export function fnPerlin(x: number, y: number, seed: number): number {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = fnFade(xf), v = fnFade(yf);
    const n00 = grad(xi, yi, seed, xf, yf), n10 = grad(xi + 1, yi, seed, xf - 1, yf);
    const n01 = grad(xi, yi + 1, seed, xf, yf - 1), n11 = grad(xi + 1, yi + 1, seed, xf - 1, yf - 1);
    const nx0 = n00 + (n10 - n00) * u, nx1 = n01 + (n11 - n01) * u;
    return nx0 + (nx1 - nx0) * v;
}
const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
export function fnSimplex(x: number, y: number, seed: number): number {
    const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2, x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const corner = (cx: number, cy: number, gi: number, gj: number) => {
        const tt = 0.5 - cx * cx - cy * cy;
        if (tt < 0) return 0;
        const t2 = tt * tt;
        return t2 * t2 * grad(gi, gj, seed, cx, cy);
    };
    return 70 * (corner(x0, y0, i, j) + corner(x1, y1, i + i1, j + j1) + corner(x2, y2, i + 1, j + 1));
}
/** Distance to the nearest feature point (F1), ≈ 0 … 1. */
export function fnWorleyF1(x: number, y: number, seed: number): number {
    const xi = Math.floor(x), yi = Math.floor(y);
    let best = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const cx = xi + i, cy = yi + j;
        const px = cx + fnHash2(cx, cy, seed), py = cy + fnHash2(cx, cy, seed + 101);
        best = Math.min(best, Math.hypot(px - x, py - y));
    }
    return best;
}

/** The seed's coordinate offset (the old curveNoise's `so`). */
const seedOffset = (seed: number) => seed * 0.6180339 % 1000;

const valueSampler = (_p: Record<string, number>, seed: number): FieldSampler => { const so = seedOffset(seed); return (x, y) => fnValueNoise(x + so * 13.1, y - so * 7.7, seed); };
const perlinSampler = (_p: Record<string, number>, seed: number): FieldSampler => { const so = seedOffset(seed); return (x, y) => fnPerlin(x + so * 13.1, y - so * 7.7, seed) * 1.4; };
const simplexSampler = (_p: Record<string, number>, seed: number): FieldSampler => { const so = seedOffset(seed); return (x, y) => fnSimplex(x + so * 13.1, y - so * 7.7, seed) * 1.15; };
const worleySampler = (_p: Record<string, number>, seed: number): FieldSampler => { const so = seedOffset(seed); return (x, y) => 1 - 2 * Math.min(1, fnWorleyF1(x * 1.3 + so, y * 1.3 - so, seed) * 1.25); };
const whiteSampler = (_p: Record<string, number>, seed: number): FieldSampler => (x, y) => fnHash2(Math.floor(x), Math.floor(y), seed) * 2 - 1;

// ---------------------------------------------------------------------------- GLSL (same math; the seed offset split into lattice + fraction)
/** The shared pieces every noise uses: the seed offset split, the gradient. Chunk 'noise-core'. */
export const FN_NOISE_CORE_GLSL = /*glsl*/ `
// the old curveNoise seed offset: so = seed * 0.6180339 mod 1000, applied as (+ so * 13.1, - so * 7.7)
// returned split: xy = the fraction to add to the coordinate, zw = the integer to add to the lattice index
vec4 fn_seedOffset(float seed) {
    float so = mod(seed * 0.6180339, 1000.0);
    float ox = so * 13.1, oy = -so * 7.7;
    vec2 oi = floor(vec2(ox, oy));
    return vec4(vec2(ox, oy) - oi, oi);
}
float fn_grad(float ix, float iy, float seed, float dx, float dy) {
    float a = fn_hash2(ix, iy, seed) * 6.283185307179586;
    return cos(a) * dx + sin(a) * dy;
}
// value noise of a point whose lattice index is shifted by li (integers)
float fn_valueAt(vec2 p, vec2 li, float seed) {
    vec2 i = floor(p), f = p - i;
    i += li;
    float u = fn_smooth(f.x), v = fn_smooth(f.y);
    float a = fn_hash2(i.x, i.y, seed), b = fn_hash2(i.x + 1.0, i.y, seed), c = fn_hash2(i.x, i.y + 1.0, seed), d = fn_hash2(i.x + 1.0, i.y + 1.0, seed);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2.0 - 1.0;
}
float fn_perlinAt(vec2 p, vec2 li, float seed) {
    vec2 i = floor(p), f = p - i;
    i += li;
    float u = fn_fade(f.x), v = fn_fade(f.y);
    float n00 = fn_grad(i.x, i.y, seed, f.x, f.y), n10 = fn_grad(i.x + 1.0, i.y, seed, f.x - 1.0, f.y);
    float n01 = fn_grad(i.x, i.y + 1.0, seed, f.x, f.y - 1.0), n11 = fn_grad(i.x + 1.0, i.y + 1.0, seed, f.x - 1.0, f.y - 1.0);
    float nx0 = n00 + (n10 - n00) * u, nx1 = n01 + (n11 - n01) * u;
    return nx0 + (nx1 - nx0) * v;
}
float fn_simplexCorner(float cx, float cy, float gi, float gj, float seed) {
    float tt = 0.5 - cx * cx - cy * cy;
    if (tt < 0.0) return 0.0;
    float t2 = tt * tt;
    return t2 * t2 * fn_grad(gi, gj, seed, cx, cy);
}
float fn_simplexAt(vec2 p, float seed) {
    const float F2 = 0.36602540378443865, G2 = 0.21132486540518713;
    float s = (p.x + p.y) * F2, i = floor(p.x + s), j = floor(p.y + s);
    float t = (i + j) * G2, x0 = p.x - (i - t), y0 = p.y - (j - t);
    float i1 = x0 > y0 ? 1.0 : 0.0, j1 = x0 > y0 ? 0.0 : 1.0;
    float x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1.0 + 2.0 * G2, y2 = y0 - 1.0 + 2.0 * G2;
    return 70.0 * (fn_simplexCorner(x0, y0, i, j, seed) + fn_simplexCorner(x1, y1, i + i1, j + j1, seed) + fn_simplexCorner(x2, y2, i + 1.0, j + 1.0, seed));
}
// F1 worley of a point whose lattice index is shifted by li
float fn_worleyAt(vec2 p, vec2 li, float seed) {
    vec2 i = floor(p);
    float best = 9.0;
    for (int j = -1; j <= 1; j++) for (int k = -1; k <= 1; k++) {
        vec2 c = i + vec2(float(k), float(j));
        vec2 cl = c + li;
        vec2 q = c + vec2(fn_hash2(cl.x, cl.y, seed), fn_hash2(cl.x, cl.y, seed + 101.0));
        best = min(best, length(q - p));
    }
    return best;
}
`;

const valueGlsl = /*glsl*/ `
float fn_value(vec2 p, float seed) { vec4 o = fn_seedOffset(seed); return fn_valueAt(p + o.xy, o.zw, seed); }`;
const perlinGlsl = /*glsl*/ `
float fn_perlin(vec2 p, float seed) { vec4 o = fn_seedOffset(seed); return fn_perlinAt(p + o.xy, o.zw, seed) * 1.4; }`;
const simplexGlsl = /*glsl*/ `
float fn_simplex(vec2 p, float seed) { vec4 o = fn_seedOffset(seed); return fn_simplexAt(p + o.xy + o.zw, seed) * 1.15; }`;
const worleyGlsl = /*glsl*/ `
float fn_worley(vec2 p, float seed) {
    float so = mod(seed * 0.6180339, 1000.0);
    vec2 ofs = vec2(so, -so), oi = floor(ofs);
    return 1.0 - 2.0 * min(1.0, fn_worleyAt(p * 1.3 + (ofs - oi), oi, seed) * 1.25);
}`;
const whiteGlsl = /*glsl*/ `
float fn_white(vec2 p, float seed) { return fn_hash2(floor(p.x), floor(p.y), seed) * 2.0 - 1.0; }`;

// ---------------------------------------------------------------------------- the defs
const R: [number, number] = [-1, 1];
export const FN_NOISE_DEFS: FieldFnDef[] = [
    { id: 'noise.value', name: 'Value', family: 'noise', shape: 'field', range: R, params: [],
      description: 'Smooth random lumps — soft, a little blocky.', goodFor: ['Soft terrain', 'Gentle wobble', 'Cheap large-scale variation'],
      sampler: valueSampler, glsl: { name: 'fn_value', deps: ['hash', 'noise-core'], chunk: valueGlsl } },
    { id: 'noise.perlin', name: 'Perlin', family: 'noise', shape: 'field', range: R, params: [],
      description: 'Gradient noise — rolling, natural bumps.', goodFor: ['Hills', 'Wood and stone grain', 'Slow drift'],
      sampler: perlinSampler, glsl: { name: 'fn_perlin', deps: ['hash', 'noise-core'], chunk: perlinGlsl } },
    { id: 'noise.simplex', name: 'Simplex', family: 'noise', shape: 'field', range: R, params: [],
      description: 'Like Perlin with fewer straight artefacts — the all-rounder.', goodFor: ['Coastlines', 'Clouds and smoke', 'Anything organic'],
      sampler: simplexSampler, glsl: { name: 'fn_simplex', deps: ['hash', 'noise-core'], chunk: simplexGlsl } },
    { id: 'noise.worley', name: 'Worley', family: 'noise', shape: 'field', range: R, params: [],
      description: 'Cellular — scalloped bays between rounded headlands.', goodFor: ['Cells and scales', 'Cracked ground', 'Bays and coves'],
      sampler: worleySampler, glsl: { name: 'fn_worley', deps: ['hash', 'noise-core'], chunk: worleyGlsl } },
    { id: 'noise.white', name: 'White', family: 'noise', shape: 'field', range: R, params: [],
      description: 'Pure random per cell — no smoothness at all.', goodFor: ['Grain and static', 'Per-cell variation', 'Sparkle'],
      sampler: whiteSampler, glsl: { name: 'fn_white', deps: ['hash'], chunk: whiteGlsl } },
];
