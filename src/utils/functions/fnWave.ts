// =============================================================================
// fnWave — regular, repeating fields: lobes, sine, square, triangle, sawtooth, pulse, harmonics (≈ −1 … 1)
// =============================================================================
//
// A wave reads x in CYCLES (x = 2 is two full waves) and ignores y — along a line it is a rhythm,
// over a plane it is stripes. Waves take no seed (their params say everything; fnHash1's sin
// can't be matched on the GPU for seed-sized arguments). 'wave.lobes' is the curving API's old
// 'sine' noise: a base wave plus two harmonics locked to it — its turn and pointedness, which the
// old code drew from the seed, are its params (curveNoiseFnRef passes the old seed's values).
//
import type { FieldFnDef, FieldSampler, FnParam, FnParams } from './fnTypes';

const TAU = Math.PI * 2;
const R: [number, number] = [-1, 1];

const lobes = (p: FnParams): FieldSampler => {
    const turn = p.turn * TAU, sharp = p.sharp;
    return (x) => { const a = x * TAU + turn; return (Math.sin(a) + sharp * Math.sin(a * 2 - Math.PI / 2) + sharp * 0.5 * Math.sin(a * 3)) / (1 + sharp * 1.5); };
};
const sine = (p: FnParams): FieldSampler => { const ph = p.phase; return (x) => Math.sin((x + ph) * TAU); };
const square = (p: FnParams): FieldSampler => { const d = p.duty, ph = p.phase; return (x) => { const f = x + ph - Math.floor(x + ph); return f < d ? 1 : -1; }; };
const triangle = (p: FnParams): FieldSampler => { const ph = p.phase; return (x) => { const f = x + ph + 0.25 - Math.floor(x + ph + 0.25); return 1 - 4 * Math.abs(f - 0.5); }; };
const sawtooth = (p: FnParams): FieldSampler => { const ph = p.phase; return (x) => { const f = x + ph - Math.floor(x + ph); return f * 2 - 1; }; };
const pulse = (p: FnParams): FieldSampler => {
    const w = p.width, s = p.softness, ph = p.phase;
    return (x) => { const f = x + ph - Math.floor(x + ph); const d = Math.abs(f - 0.5) - w * 0.5; const e = Math.max(1e-4, s * 0.25); const t = Math.min(1, Math.max(0, 0.5 - d / e)); return (t * t * (3 - 2 * t)) * 2 - 1; };
};
const harmonics = (p: FnParams): FieldSampler => {
    const n = Math.round(p.count), decay = p.decay, ph = p.phase;
    return (x) => { let sum = 0, norm = 0, amp = 1; for (let k = 1; k <= n; k++) { sum += amp * Math.sin((x + ph) * TAU * k); norm += amp; amp *= decay; } return sum / norm; };
};

const PHASE: FnParam = { key: 'phase', label: 'Phase', min: 0, max: 1, step: 0.01, default: 0, tip: 'Slides the wave along — where in its cycle it starts.' };

const wave = (id: string, name: string, description: string, goodFor: string[], params: FnParam[], sampler: FieldFnDef['sampler'], chunk: string): FieldFnDef =>
    ({ id, name, family: 'wave', shape: 'field', range: R, usesSeed: false, description, goodFor, params, sampler, glsl: { name: `fn_${id.slice(5)}`, deps: ['hash'], chunk } });

export const FN_WAVE_DEFS: FieldFnDef[] = [
    wave('wave.lobes', 'Lobes', 'Regular lobes — waves, a flower, a cog — with a touch of pointedness.', ['Flower and gear outlines', 'Scalloped edges', 'Regular ripples'],
        [{ key: 'sharp', label: 'Pointed', min: 0, max: 0.6, step: 0.01, default: 0.25, tip: 'Round lobes at 0; higher makes them pointed, like petals or cogs.' },
         { key: 'turn', label: 'Turn', min: 0, max: 1, step: 0.01, default: 0, tip: 'Rotates the lobes round the line.' }], lobes, /*glsl*/ `
float fn_lobes(vec2 p, float seed, float sharp, float turn) {
    float a = p.x * 6.283185307179586 + turn * 6.283185307179586;
    return (sin(a) + sharp * sin(a * 2.0 - 1.5707963267948966) + sharp * 0.5 * sin(a * 3.0)) / (1.0 + sharp * 1.5);
}`),
    wave('wave.sine', 'Sine', 'The pure wave.', ['Gentle swell', 'Breathing', 'Smooth ripples'], [PHASE], sine, /*glsl*/ `
float fn_sine(vec2 p, float seed, float phase) { return sin((p.x + phase) * 6.283185307179586); }`),
    wave('wave.square', 'Square', 'On / off — hard edges, a duty share on.', ['Blinking', 'Stripes', 'Crenellations'],
        [{ key: 'duty', label: 'On share', min: 0.05, max: 0.95, step: 0.01, default: 0.5, tip: 'How much of each cycle is on (high).' }, PHASE], square, /*glsl*/ `
float fn_square(vec2 p, float seed, float duty, float phase) { return fract(p.x + phase) < duty ? 1.0 : -1.0; }`),
    wave('wave.triangle', 'Triangle', 'Straight up, straight down.', ['Zigzag edges', 'Linear back-and-forth', 'Sawteeth both ways'], [PHASE], triangle, /*glsl*/ `
float fn_triangle(vec2 p, float seed, float phase) { return 1.0 - 4.0 * abs(fract(p.x + phase + 0.25) - 0.5); }`),
    wave('wave.sawtooth', 'Sawtooth', 'A slow ramp up, a snap back.', ['Ratchets', 'Charging then release', 'Ramps'], [PHASE], sawtooth, /*glsl*/ `
float fn_sawtooth(vec2 p, float seed, float phase) { return fract(p.x + phase) * 2.0 - 1.0; }`),
    wave('wave.pulse', 'Pulse', 'A soft-edged bump each cycle — a heartbeat.', ['Heartbeat', 'Glow pulses', 'Spaced bumps'],
        [{ key: 'width', label: 'Width', min: 0.05, max: 0.9, step: 0.01, default: 0.3, tip: 'How wide each pulse is, as a share of the cycle.' },
         { key: 'softness', label: 'Softness', min: 0, max: 1, step: 0.01, default: 0.5, tip: 'Hard-edged pulses, or soft ones that fade in and out.' }, PHASE], pulse, /*glsl*/ `
float fn_pulse(vec2 p, float seed, float width, float softness, float phase) {
    float f = fract(p.x + phase), d = abs(f - 0.5) - width * 0.5, e = max(1e-4, softness * 0.25);
    float t = clamp(0.5 - d / e, 0.0, 1.0);
    return (t * t * (3.0 - 2.0 * t)) * 2.0 - 1.0;
}`),
    wave('wave.harmonics', 'Harmonics', 'A sine with overtones — richer, more "played".', ['Organic rhythm', 'Plucked motion', 'Ornamented edges'],
        [{ key: 'count', label: 'Overtones', min: 1, max: 8, step: 1, default: 4, integer: true, tip: 'How many overtones ride on the base wave.' },
         { key: 'decay', label: 'Decay', min: 0.1, max: 0.95, step: 0.01, default: 0.5, tip: 'How much quieter each overtone is than the last.' }, PHASE], harmonics, /*glsl*/ `
float fn_harmonics(vec2 p, float seed, float count, float decay, float phase) {
    int n = int(count + 0.5); float sum = 0.0, norm = 0.0, amp = 1.0;
    for (int k = 1; k <= 8; k++) { if (k > n) break; sum += amp * sin((p.x + phase) * 6.283185307179586 * float(k)); norm += amp; amp *= decay; }
    return sum / norm;
}`),
];
