// =============================================================================
// fnRegistry — every function by id, and how a reference becomes a sampler
// =============================================================================
//
//   FN_DEFS                 all functions, in gallery order
//   fnDef(id)               a definition (throws on an unknown id)
//   fnResolve(ref)          an FnRef (object, bare id or 'preset:<id>') → a full FnRefObj:
//                           params clamped and filled, seed, base (layering) — like curveNoiseDefaults
//   fnField / fnCurve / fnSequence(ref)   a compiled sampler for hot loops (resolve once, sample many)
//   fnSample(ref, x, y)     one value of a field
//   fnPresetRef(id), fnIsPreset(ref), fnPresetOf(ref)
//
import { FN_NOISE_DEFS } from './fnNoise';
import { FN_LAYER_DEFS } from './fnLayer';
import { FN_WAVE_DEFS } from './fnWave';
import { FN_EASE_DEFS, FN_SIGNAL_DEFS } from './fnCurves';
import { FN_SEQUENCE_DEFS } from './fnSequence';
import { FN_PRESETS, type FnPreset } from './fnPresets';
import { FN_DEFAULT_SEED, FN_PRESET_PREFIX, type CurveSampler, type FieldFnDef, type FieldSampler, type FnDef, type FnFamily, type FnRef, type FnRefObj, type SequenceSampler } from './fnTypes';

export const FN_DEFS: readonly FnDef[] = [...FN_NOISE_DEFS, ...FN_LAYER_DEFS, ...FN_WAVE_DEFS, ...FN_EASE_DEFS, ...FN_SIGNAL_DEFS, ...FN_SEQUENCE_DEFS];
const BY_ID = new Map<string, FnDef>(FN_DEFS.map((d) => [d.id, d]));
const PRESET_BY_ID = new Map<string, FnPreset>(FN_PRESETS.map((p) => [p.id, p]));

/** The base every layering function starts from when none is given. */
export const FN_DEFAULT_BASE = 'noise.simplex';

export function fnDef(id: string): FnDef {
    const d = BY_ID.get(id);
    if (!d) throw new Error(`functions: unknown function '${id}'`);
    return d;
}
export const fnHas = (id: string): boolean => BY_ID.has(id);
export const fnDefsOf = (family: FnFamily): FnDef[] => FN_DEFS.filter((d) => d.family === family);
/** The fields a layering function may run over. */
export const fnBaseDefs = (): FieldFnDef[] => FN_NOISE_DEFS;

export const fnPresetRef = (presetId: string): string => `${FN_PRESET_PREFIX}${presetId}`;
export const fnIsPreset = (ref: FnRef): ref is string => typeof ref === 'string' && ref.startsWith(FN_PRESET_PREFIX);
export function fnPresetOf(ref: FnRef): FnPreset | null {
    if (!fnIsPreset(ref)) return null;
    return PRESET_BY_ID.get(ref.slice(FN_PRESET_PREFIX.length)) ?? null;
}

/** The reference as an object (a preset's function, a bare id's object); params not yet filled. */
export function fnRefObj(ref: FnRef): FnRefObj {
    if (typeof ref !== 'string') return ref;
    if (ref.startsWith(FN_PRESET_PREFIX)) {
        const p = PRESET_BY_ID.get(ref.slice(FN_PRESET_PREFIX.length));
        if (!p) throw new Error(`functions: unknown preset '${ref}'`);
        return { ...p.fn, params: p.fn.params ? { ...p.fn.params } : undefined };
    }
    return { id: ref };
}

/** A full reference: every param present and clamped, the seed, the base (layering only). */
export function fnResolve(ref: FnRef): Required<Pick<FnRefObj, 'id' | 'params' | 'seed'>> & { base?: string } {
    const r = fnRefObj(ref);
    const d = fnDef(r.id);
    const params: Record<string, number> = {};
    for (const p of d.params) {
        const raw = r.params?.[p.key];
        let v = Number.isFinite(raw) ? (raw as number) : p.default;
        v = Math.min(p.max, Math.max(p.min, v));
        if (p.integer) v = Math.round(v);
        params[p.key] = v;
    }
    const out: ReturnType<typeof fnResolve> = { id: d.id, params, seed: Math.floor(Number.isFinite(r.seed) ? (r.seed as number) : FN_DEFAULT_SEED) };
    if (d.shape === 'field' && d.takesBase) out.base = r.base && fnHas(r.base) && fnDef(r.base).shape === 'field' && !(fnDef(r.base) as FieldFnDef).takesBase ? r.base : FN_DEFAULT_BASE;
    return out;
}

/** A field's sampler, (x, y) → value. Throws if the function is not a field. */
export function fnField(ref: FnRef): FieldSampler {
    const r = fnResolve(ref), d = fnDef(r.id);
    if (d.shape !== 'field') throw new Error(`functions: '${r.id}' is a ${d.shape}, not a field`);
    const base = r.base ? fnField({ id: r.base, seed: r.seed }) : undefined;
    return d.sampler(r.params, r.seed, base);
}
/** A curve's sampler, t (0..1) → value. */
export function fnCurve(ref: FnRef): CurveSampler {
    const r = fnResolve(ref), d = fnDef(r.id);
    if (d.shape !== 'curve') throw new Error(`functions: '${r.id}' is a ${d.shape}, not a curve`);
    return d.sampler(r.params, r.seed);
}
/** An arrangement's sampler, (i, count) → [x, y] in −1 … 1. */
export function fnSequence(ref: FnRef): SequenceSampler {
    const r = fnResolve(ref), d = fnDef(r.id);
    if (d.shape !== 'sequence') throw new Error(`functions: '${r.id}' is a ${d.shape}, not a sequence`);
    return d.sampler(r.params, r.seed);
}
/** One value of a field — for a single read; loops should keep an fnField sampler. */
export const fnSample = (ref: FnRef, x: number, y = 0): number => fnField(ref)(x, y);

/** The function's name for labels: a preset's name, or "Fractal (fBm) · Simplex". */
export function fnLabel(ref: FnRef): string {
    const preset = fnPresetOf(ref);
    if (preset) return preset.name;
    const r = fnResolve(ref), d = fnDef(r.id);
    return r.base ? `${d.name} · ${fnDef(r.base).name}` : d.name;
}
/** The function's shape (for a place that accepts only fields, say). */
export const fnShapeOf = (ref: FnRef) => fnDef(fnRefObj(ref).id).shape;
