// =============================================================================
// shapeWaves — the known waveforms, as one function of the shape API
// =============================================================================
//
// waveValue(wave, t, cycles) → a value in about −1 … 1 for t in 0 … 1 along the shape: the
// waveform `cycles` times over the length. Every frequency preset (edges, rings, sheets, signal
// paths) and the `waveform` / `waveRing` shape kinds read it, so a sawtooth is the same everywhere.
// Deterministic; a changed waveform is a new name, never a changed output.
//
export type WaveKind =
    | 'sine' | 'square' | 'triangle' | 'sawtooth' | 'pulse'
    | 'damped' | 'beats' | 'am' | 'fm' | 'chirp' | 'sinc' | 'packet' | 'harmonics' | 'heartbeat';

export const WAVE_KINDS: ReadonlyArray<{ id: WaveKind; label: string; description: string }> = [
    { id: 'sine', label: 'Sine', description: 'The pure tone: one frequency.' },
    { id: 'square', label: 'Square', description: 'On / off: high half the cycle, low the other half.' },
    { id: 'triangle', label: 'Triangle', description: 'Straight rises and falls.' },
    { id: 'sawtooth', label: 'Sawtooth', description: 'A slow rise and a sudden drop.' },
    { id: 'pulse', label: 'Pulse', description: 'A square wave high a quarter of each cycle.' },
    { id: 'damped', label: 'Damped', description: 'A sine dying away — a plucked string, a struck bell.' },
    { id: 'beats', label: 'Beats', description: 'Two close frequencies together: the loudness swells and fades.' },
    { id: 'am', label: 'AM', description: 'Amplitude modulation: a carrier whose height follows a slow wave.' },
    { id: 'fm', label: 'FM', description: 'Frequency modulation: a carrier whose spacing follows a slow wave.' },
    { id: 'chirp', label: 'Chirp', description: 'A frequency rising along the length — a sweep.' },
    { id: 'sinc', label: 'Sinc', description: 'sin x / x: a main peak with fading side lobes.' },
    { id: 'packet', label: 'Wave packet', description: 'A sine inside a bell curve: a burst.' },
    { id: 'harmonics', label: 'Harmonics', description: 'The first odd harmonics added: a square wave from sines.' },
    { id: 'heartbeat', label: 'Heartbeat', description: 'An ECG trace: P, QRS spike, T.' },
];

const TAU = Math.PI * 2;
const frac = (v: number) => v - Math.floor(v);
const g = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

/** The waveform's value (about −1 … 1) at t (0 … 1 along the shape), `cycles` times over it. */
export function waveValue(wave: WaveKind, t: number, cycles = 4): number {
    const c = Math.max(0.25, cycles), p = c * t;
    switch (wave) {
        case 'sine': return Math.sin(TAU * p);
        case 'square': return frac(p) < 0.5 ? 1 : -1;
        case 'triangle': { const f = frac(p + 0.25); return f < 0.5 ? 4 * f - 1 : 3 - 4 * f; }
        case 'sawtooth': return 2 * frac(p) - 1;
        case 'pulse': return frac(p) < 0.25 ? 1 : -1;
        case 'damped': return Math.exp(-3.2 * t) * Math.sin(TAU * p);
        case 'beats': return (Math.sin(TAU * p) + Math.sin(TAU * p * (1 + 1 / c))) / 2;
        case 'am': return ((1 + 0.75 * Math.sin(TAU * t - Math.PI / 2)) / 1.75) * Math.sin(TAU * p);
        case 'fm': return Math.sin(TAU * p + 2.4 * Math.sin(TAU * t));
        case 'chirp': return Math.sin(TAU * (0.5 * t + (c - 0.5) * t * t));
        case 'sinc': { const x = TAU * c * (t - 0.5) / 2; return Math.abs(x) < 1e-6 ? 1 : Math.sin(x) / x; }
        case 'packet': return g(t, 0.5, 0.16) * Math.sin(TAU * p);
        case 'harmonics': return (4 / Math.PI) * (Math.sin(TAU * p) + Math.sin(3 * TAU * p) / 3 + Math.sin(5 * TAU * p) / 5) / 1.18;
        case 'heartbeat': {
            const f = frac(p);
            return 0.12 * g(f, 0.18, 0.035) - 0.16 * g(f, 0.31, 0.012) + 1 * g(f, 0.34, 0.014) - 0.3 * g(f, 0.375, 0.014) + 0.28 * g(f, 0.6, 0.05);
        }
    }
}

/** Samples a waveform needs to read right: sharp ones (square, saw, pulse, heartbeat) more. */
export function waveSamples(wave: WaveKind, cycles: number): number {
    const per = wave === 'square' || wave === 'pulse' || wave === 'sawtooth' ? 40 : wave === 'heartbeat' ? 48 : wave === 'chirp' || wave === 'fm' ? 28 : 20;
    return Math.min(1600, Math.max(32, Math.round(Math.max(1, cycles) * per)));
}
