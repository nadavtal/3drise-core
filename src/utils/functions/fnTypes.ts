// =============================================================================
// fnTypes — the ONE functions library: what a function is and how it is referred to
// =============================================================================
//
// 3drise uses noises, waves, easings, signals and arrangements everywhere — shaders, the curving
// API, scatter, animation, the AI. This library defines each ONCE, by id, with a CPU (TS) sampler
// and, where it runs on the GPU, a GLSL chunk that gives the same result. Consumers store an FnRef
// (an id, its params, a seed) — never the math — and sample it with fnSampler / fnGlsl.
//
//   shape     how it is sampled:
//               field      (x, y) → value             noise, layering, waves over space
//               curve      t in 0..1 → value          easing, signal shaping
//               sequence   (i, count) → [x, y]        arrangements: phyllotaxis, halton, spirals
//   range     the output's range ([-1, 1] for noise, [0, 1] for signal / easing)
//   params    the sliders: key, range, default, tip — the same names become GLSL arguments
//   base      layering functions (fbm, ridged…) run over a base field (a noise id)
//
// An id's output NEVER changes once shipped: built-in layouts, presets and saved scenes refer to
// it. A better algorithm is a new id.
//
export type FnShape = 'field' | 'curve' | 'sequence';
export type FnFamily = 'noise' | 'layer' | 'wave' | 'ease' | 'signal' | 'sequence';

export interface FnParam {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    default: number;
    /** Shown after the value (" m", "×"). */
    unit?: string;
    /** What it does, in the user's words — the slider's tooltip. */
    tip: string;
    integer?: boolean;
}

/** A function in use: its id, the params that differ from the defaults, a seed, and (layering) its base noise. */
export interface FnRefObj {
    id: string;
    params?: Record<string, number>;
    seed?: number;
    /** Layering functions: the field they layer (a 'noise.*' id). */
    base?: string;
}
/** An FnRefObj, a bare id ('noise.simplex') or a preset ('preset:ragged-coast'). */
export type FnRef = FnRefObj | string;

export type FnParams = Record<string, number>;
export type FieldSampler = (x: number, y: number) => number;
export type CurveSampler = (t: number) => number;
export type SequenceSampler = (i: number, count: number) => [number, number];

/** The GLSL side of a function: one pure function, its dependencies, its argument order. */
export interface FnGlslDef {
    /** The function's GLSL name ('fn_simplex'). Layering: `{{base}}` inside the chunk is the base's name. */
    name: string;
    /** Named chunks it needs (FN_GLSL_CHUNKS keys), in order. */
    deps?: string[];
    /** The function's source. Fields: `float NAME(vec2 p, float seed, <params…>)`; curves: `float NAME(float t, <params…>)`. */
    chunk: string;
}

interface FnDefBase {
    id: string;
    name: string;
    family: FnFamily;
    description: string;
    /** Where it shines — the gallery's "Good for" line. */
    goodFor: string[];
    params: FnParam[];
    range: [number, number];
}
export interface FieldFnDef extends FnDefBase {
    shape: 'field';
    /** Layering: needs a base field. */
    takesBase?: boolean;
    /** False: the seed changes nothing (waves) — no seed control. Default true. */
    usesSeed?: boolean;
    sampler: (p: FnParams, seed: number, base?: FieldSampler) => FieldSampler;
    glsl: FnGlslDef;
}
export interface CurveFnDef extends FnDefBase {
    shape: 'curve';
    sampler: (p: FnParams, seed: number) => CurveSampler;
    glsl?: FnGlslDef;
}
export interface SequenceFnDef extends FnDefBase {
    shape: 'sequence';
    sampler: (p: FnParams, seed: number) => SequenceSampler;
}
export type FnDef = FieldFnDef | CurveFnDef | SequenceFnDef;

export interface FnFamilyInfo { id: FnFamily; label: string; shape: FnShape; description: string }
export const FN_FAMILIES: ReadonlyArray<FnFamilyInfo> = [
    { id: 'noise', label: 'Noise', shape: 'field', description: 'Random but smooth fields — the raw material of everything organic.' },
    { id: 'layer', label: 'Layering', shape: 'field', description: 'Octaves of a noise combined — coastlines, ridges, clouds, swirls, steps.' },
    { id: 'wave', label: 'Waves', shape: 'field', description: 'Regular, repeating — lobes, pulses, rhythm.' },
    { id: 'ease', label: 'Easing', shape: 'curve', description: 'How a motion starts and ends — snappy, soft, springy, bouncy.' },
    { id: 'signal', label: 'Signal', shape: 'curve', description: 'Shape a 0..1 value — soften, sharpen, threshold, bell.' },
    { id: 'sequence', label: 'Arrangement', shape: 'sequence', description: 'Where the n-th of many things goes — sunflowers, even scatter, spirals, figures.' },
];

/** The seed every function starts from. */
export const FN_DEFAULT_SEED = 1;
export const FN_PRESET_PREFIX = 'preset:';
