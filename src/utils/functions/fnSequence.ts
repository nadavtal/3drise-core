// =============================================================================
// fnSequence — arrangements: where the i-th of `count` things goes, in the unit disc / square
// =============================================================================
//
// (i, count) → [x, y] in −1 … 1. Deterministic; the seed turns or jitters the pattern. CPU only
// (a shader scatters by instancing, not per fragment). The consumer scales the points into its
// own space — an area's bounds, a ring's radius.
//
import { fnHash2 } from './fnHash';
import type { FnParam, FnParams, SequenceFnDef, SequenceSampler } from './fnTypes';

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const R: [number, number] = [-1, 1];

/** Van der Corput radical inverse in base b. */
function radicalInverse(i: number, b: number): number {
    let f = 1, r = 0, n = i;
    while (n > 0) { f /= b; r += f * (n % b); n = Math.floor(n / b); }
    return r;
}

const seq = (id: string, name: string, description: string, goodFor: string[], params: FnParam[], sampler: (p: FnParams, seed: number) => SequenceSampler): SequenceFnDef =>
    ({ id, name, family: 'sequence', shape: 'sequence', range: R, description, goodFor, params, sampler });

export const FN_SEQUENCE_DEFS: SequenceFnDef[] = [
    seq('sequence.phyllotaxis', 'Sunflower', 'Points by the golden angle — the sunflower\'s even spiral.', ['Even scatter in a disc', 'Flower heads', 'Radial layouts'],
        [{ key: 'spread', label: 'Spread', min: 0.5, max: 1, step: 0.01, default: 1, tip: 'How far the outer points reach — 1 fills the disc.' }],
        (p, seed) => { const turn = fnHash2(seed, 0, 7) * TAU, s = p.spread; return (i, count) => { const r = s * Math.sqrt((i + 0.5) / count), a = i * GOLDEN_ANGLE + turn; return [Math.cos(a) * r, Math.sin(a) * r]; }; }),
    seq('sequence.halton', 'Halton', 'A low-discrepancy scatter — even but not gridded, in a square.', ['Even scatter in a square', 'Sample points', 'Trees without rows'],
        [{ key: 'jitter', label: 'Jitter', min: 0, max: 1, step: 0.01, default: 0, tip: 'Random nudge of each point, as a share of its spacing.' }],
        (p, seed) => { const j = p.jitter, off = Math.floor(fnHash2(seed, 1, 3) * 1000); return (i, count) => { const k = i + 1 + off; const cell = 1 / Math.sqrt(Math.max(1, count)); const jx = (fnHash2(i, 11, seed) - 0.5) * j * cell, jy = (fnHash2(i, 23, seed) - 0.5) * j * cell; return [(radicalInverse(k, 2) + jx) * 2 - 1, (radicalInverse(k, 3) + jy) * 2 - 1]; }; }),
    seq('sequence.grid', 'Grid', 'Rows and columns, optionally staggered.', ['Orchards', 'Parking', 'Tiles'],
        [{ key: 'stagger', label: 'Stagger', min: 0, max: 0.5, step: 0.01, default: 0, tip: 'Shifts every other row sideways — 0.5 is a brick pattern.' }],
        (p) => { const st = p.stagger; return (i, count) => { const cols = Math.max(1, Math.round(Math.sqrt(count))), rows = Math.ceil(count / cols); const c = i % cols, r = Math.floor(i / cols); const x = (c + 0.5 + (r % 2 ? st : 0)) / cols, y = (r + 0.5) / rows; return [x * 2 - 1, y * 2 - 1]; }; }),
    seq('sequence.ring', 'Ring', 'Evenly round a circle — or a polygon\'s corners.', ['Pillars round a plaza', 'Clock faces', 'Petals'],
        [{ key: 'radius', label: 'Radius', min: 0.1, max: 1, step: 0.01, default: 0.9, tip: 'The ring\'s size.' },
         { key: 'turn', label: 'Turn', min: 0, max: 1, step: 0.01, default: 0, tip: 'Rotates the whole ring.' }],
        (p) => { const r = p.radius, t = p.turn * TAU; return (i, count) => { const a = -Math.PI / 2 + t + (i / Math.max(1, count)) * TAU; return [Math.cos(a) * r, Math.sin(a) * r]; }; }),
    seq('sequence.spiral', 'Spiral', 'An Archimedean spiral, evenly spaced along its length.', ['Galaxy arms', 'Garden paths', 'Snail layouts'],
        [{ key: 'turns', label: 'Turns', min: 0.5, max: 8, step: 0.1, default: 3, tip: 'How many times it goes round.' }],
        (p, seed) => { const turns = p.turns, t0 = fnHash2(seed, 2, 5) * TAU; return (i, count) => { const u = Math.sqrt((i + 0.5) / count); const a = u * turns * TAU + t0; return [Math.cos(a) * u, Math.sin(a) * u]; }; }),
    seq('sequence.lissajous', 'Lissajous', 'A figure traced by two perpendicular waves.', ['Figure-eights', 'Looping flight paths', 'Decorative curves'],
        [{ key: 'a', label: 'X waves', min: 1, max: 6, step: 1, default: 3, integer: true, tip: 'Cycles across.' }, { key: 'b', label: 'Y waves', min: 1, max: 6, step: 1, default: 2, integer: true, tip: 'Cycles up and down.' },
         { key: 'delta', label: 'Offset', min: 0, max: 1, step: 0.01, default: 0.25, tip: 'The phase between the two waves — changes the figure.' }],
        (p) => { const a = Math.round(p.a), b = Math.round(p.b), d = p.delta * TAU; return (i, count) => { const t = (i / Math.max(1, count)) * TAU; return [Math.sin(a * t + d), Math.sin(b * t)]; }; }),
    seq('sequence.rose', 'Rose', 'Petals from a sine of the angle — a rhodonea.', ['Flowers', 'Ornaments', 'Mandalas'],
        [{ key: 'petals', label: 'Petals', min: 1, max: 12, step: 1, default: 5, integer: true, tip: 'The number of petals (odd counts give exactly this many).' }],
        (p) => { const k = Math.round(p.petals); return (i, count) => { const t = (i / Math.max(1, count)) * TAU; const r = Math.cos(k * t); return [Math.cos(t) * r, Math.sin(t) * r]; }; }),
    seq('sequence.fibonacciSphere', 'Fibonacci disc', 'The Fibonacci sphere\'s points seen from above — denser toward the rim.', ['Dome layouts', 'Even points on a hemisphere', 'Lamps on a ceiling'],
        [],
        (_p, seed) => { const turn = fnHash2(seed, 3, 9) * TAU; return (i, count) => { const z = 1 - (i + 0.5) / count; const r = Math.sqrt(1 - z * z), a = i * GOLDEN_ANGLE + turn; return [Math.cos(a) * r, Math.sin(a) * r]; }; }),
];
