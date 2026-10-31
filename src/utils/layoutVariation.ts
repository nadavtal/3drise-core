// =============================================================================
// layoutVariation — per-copy variation of an object layout (meshSettings.layout)
// =============================================================================
//
// LayoutCreator places the slots; this makes each copy a little different —
// size, turn, tint and variant — deterministically from the layout `seed`. Each
// property draws from its own random stream (streamSeed), and every copy draws a
// fixed number of values from it, so copy i always gets the same values and
// raising one knob never reshuffles the others.
//
// Used by both viewer paths: InstancedLayout (mesh / model) and LayoutInstances
// (effects, lights and the fallbacks). Surface placement (onGround) needs the
// scene's ground and lives in the viewer.
import type { LayoutSlot, LayoutVariantMix, ObjectLayoutKind, ObjectLayoutSettings } from "../types/gallery";
import type { CreatedObjectSettings } from "../types/scene3d";
import { createRng } from "../autoAnimate/rng";
import { DEFAULT_OBJECT_LAYOUT, generateLayoutSlots, getObjectLayoutSupport, streamSeed } from "./LayoutCreator";
import { getLayoutPresets } from "./GalleryLayouts";

/** One copy: its slot transform with the variation applied, its variant and tint shift. */
export interface LayoutCopy {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    /** Index into variantMix.values, or -1 (the object as it is). */
    variant: number;
    /** Hue shift (turns, ±) and lightness shift (±) for the copy's tint. 0, 0 = untinted. */
    tint: [number, number];
}

const STREAM = { scale: 0x5CA1E, rotation: 0x0707A7E, tint: 0x7141, variant: 0x7A41A } as const;
/** tintJitter 1 = ±HUE_SPREAD turns of hue and ±LIGHT_SPREAD of lightness. */
const HUE_SPREAD = 0.08;
const LIGHT_SPREAD = 0.15;

const clamp01 = (v: unknown) => Math.min(1, Math.max(0, Number(v) || 0));

/** Weighted pick of an index from `weights` (missing / bad weights = equal). */
function pickWeighted(r: number, n: number, weights?: number[]): number {
    const w = Array.from({ length: n }, (_, i) => {
        const v = weights?.[i];
        return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : (weights?.length ? 0 : 1);
    });
    const total = w.reduce((a, b) => a + b, 0);
    if (total <= 0) return Math.floor(r * n) % n;
    let acc = 0;
    for (let i = 0; i < n; i++) { acc += w[i] / total; if (r < acc) return i; }
    return n - 1;
}

/** The copies of a layout: slots (LayoutCreator) + variation. `count` is already capped by the caller. */
export function layoutCopies(layout: ObjectLayoutSettings, count: number = layout.count): LayoutCopy[] {
    const slots: LayoutSlot[] = generateLayoutSlots(count, layout);
    const seed = layout.seed ?? 1;
    const sj = clamp01(layout.scaleJitter), rj = clamp01(layout.rotationJitter), tj = clamp01(layout.tintJitter);
    const mix = layout.variantMix && layout.variantMix.values?.length ? layout.variantMix : null;
    const rs = createRng(streamSeed(seed, STREAM.scale)).next;
    const rr = createRng(streamSeed(seed, STREAM.rotation)).next;
    const rt = createRng(streamSeed(seed, STREAM.tint)).next;
    const rv = createRng(streamSeed(seed, STREAM.variant)).next;
    return slots.map((slot) => {
        // always draw, so copy i's values do not depend on which knobs are on
        const s = rs(), r = rr(), th = rt(), tl = rt(), v = rv();
        const k = 1 + (s - 0.5) * sj;
        const base = slot.scale ?? [1, 1, 1];
        const rot = slot.rotation ?? [0, 0, 0];
        return {
            position: slot.position,
            rotation: [rot[0], rot[1] + (r * 2 - 1) * Math.PI * rj, rot[2]],
            scale: [base[0] * k, base[1] * k, base[2] * k],
            variant: mix ? pickWeighted(v, mix.values.length, mix.weights) : -1,
            tint: [(th * 2 - 1) * HUE_SPREAD * tj, (tl * 2 - 1) * LIGHT_SPREAD * tj],
        };
    });
}

/** The object with copy `variant` applied (config[field] = value), cached per object + variant. */
const variantCache = new WeakMap<object, Map<string, CreatedObjectSettings>>();
export function objectForVariant(obj: CreatedObjectSettings, mix: LayoutVariantMix | null | undefined, variant: number): CreatedObjectSettings {
    if (!mix || variant < 0 || variant >= mix.values.length) return obj;
    const field = mix.field || 'type';
    const value = mix.values[variant];
    if ((obj.config as any)?.[field] === value) return obj;
    let byKey = variantCache.get(obj);
    if (!byKey) { byKey = new Map(); variantCache.set(obj, byKey); }
    const key = `${field}=${value}`;
    let out = byKey.get(key);
    if (!out) {
        out = { ...obj, config: { ...(obj.config as object), [field]: value } as CreatedObjectSettings['config'] };
        byKey.set(key, out);
    }
    return out;
}

// =============================================================================
// Validation — scripts / the agent set the block as a whole or in part
// =============================================================================

export class LayoutValidationError extends Error { }

const OBJECT_LAYOUT_KINDS: ObjectLayoutKind[] = [...getLayoutPresets().map(p => p.value), 'area', 'path'];
const NUMBER_FIELDS = ['count', 'seed', 'columns', 'spacing', 'startX', 'startY', 'radius', 'size', 'rotations', 'heightIncrement', 'arcAngle', 'amplitude', 'frequency', 'layers', 'depth', 'scaleFactor', 'bounds', 'width'] as const;
const UNIT_FIELDS = ['scaleJitter', 'rotationJitter', 'tintJitter'] as const;
const BOOL_FIELDS = ['enabled', 'onGround', 'alignToSlope', 'facePath'] as const;

/**
 * A layout patch merged over the object's current block (or the defaults), checked
 * field by field. Throws LayoutValidationError with words a script author can act on;
 * out-of-range values are clamped and reported in `warnings`.
 */
export function validateObjectLayout(
    obj: Pick<CreatedObjectSettings, 'type' | 'config' | 'modeConfig'> & { materialSettings?: any },
    patch: unknown,
    current?: Partial<ObjectLayoutSettings> | null,
): { value: ObjectLayoutSettings; warnings: string[] } {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch))
        throw new LayoutValidationError('meshSettings.layout takes an object, e.g. { enabled: true, layout: "area", count: 500, spacing: 4 }.');
    const support = getObjectLayoutSupport(obj);
    if (!support.allowed) throw new LayoutValidationError(support.reason ?? 'This object cannot be repeated in a layout.');
    const p = patch as Record<string, unknown>;
    const warnings: string[] = [];
    const known = new Set<string>([...NUMBER_FIELDS, ...UNIT_FIELDS, ...BOOL_FIELDS, 'layout', 'variantMix', 'areaShape', 'points']);
    const unknown = Object.keys(p).filter(k => !known.has(k));
    if (unknown.length) throw new LayoutValidationError(`Unknown layout field${unknown.length > 1 ? 's' : ''} ${unknown.join(', ')}. Fields: ${[...known].join(', ')}.`);
    const out: Record<string, unknown> = { ...DEFAULT_OBJECT_LAYOUT, ...(current ?? {}) };
    for (const [k, v] of Object.entries(p)) {
        if ((NUMBER_FIELDS as readonly string[]).includes(k)) {
            if (typeof v !== 'number' || !Number.isFinite(v)) throw new LayoutValidationError(`layout.${k} must be a number, got ${JSON.stringify(v)}.`);
            out[k] = v;
        } else if ((UNIT_FIELDS as readonly string[]).includes(k)) {
            if (typeof v !== 'number' || !Number.isFinite(v)) throw new LayoutValidationError(`layout.${k} must be a number 0–1, got ${JSON.stringify(v)}.`);
            const c = Math.min(1, Math.max(0, v));
            if (c !== v) warnings.push(`layout.${k} ${v} clamped to ${c} (range 0…1).`);
            out[k] = c;
        } else if ((BOOL_FIELDS as readonly string[]).includes(k)) {
            if (typeof v !== 'boolean') throw new LayoutValidationError(`layout.${k} must be true or false, got ${JSON.stringify(v)}.`);
            out[k] = v;
        } else if (k === 'layout') {
            if (!OBJECT_LAYOUT_KINDS.includes(v as ObjectLayoutKind)) throw new LayoutValidationError(`layout.layout must be one of ${OBJECT_LAYOUT_KINDS.join(', ')}; got ${JSON.stringify(v)}.`);
            out[k] = v;
        } else if (k === 'areaShape') {
            if (v !== 'rectangle' && v !== 'polygon') throw new LayoutValidationError(`layout.areaShape must be "rectangle" or "polygon", got ${JSON.stringify(v)}.`);
            out[k] = v;
        } else if (k === 'points') {
            if (!Array.isArray(v) || !v.every(q => Array.isArray(q) && q.length === 2 && q.every(n => typeof n === 'number' && Number.isFinite(n))))
                throw new LayoutValidationError(`layout.points must be an array of [x, z] pairs (object-local metres), got ${JSON.stringify(v)}.`);
            out[k] = v.map(q => [q[0], q[1]]);
        } else if (k === 'variantMix') {
            if (v === null) { out[k] = null; continue; }
            const m = v as Record<string, unknown>;
            if (!m || typeof m !== 'object' || !Array.isArray(m.values) || !m.values.length || !m.values.every(x => typeof x === 'string'))
                throw new LayoutValidationError('layout.variantMix must be { values: ["variantA", "variantB", …], weights?: [numbers], field?: "type" } or null.');
            if (m.weights !== undefined && (!Array.isArray(m.weights) || m.weights.length !== m.values.length || !m.weights.every(x => typeof x === 'number' && x >= 0)))
                throw new LayoutValidationError('layout.variantMix.weights must be one non-negative number per value.');
            if (m.field !== undefined && typeof m.field !== 'string') throw new LayoutValidationError('layout.variantMix.field must be a config field name (default "type").');
            out[k] = { values: m.values, ...(m.weights ? { weights: m.weights } : {}), ...(m.field ? { field: m.field } : {}) };
        }
    }
    const count = Math.floor(out.count as number);
    if (count < 1) throw new LayoutValidationError('layout.count must be at least 1.');
    if (count > support.maxCount) { warnings.push(`layout.count ${count} clamped to ${support.maxCount} (the ${obj.type} limit${support.mode === 'instanced' ? ' for instanced copies' : ''}).`); out.count = support.maxCount; }
    else out.count = count;
    if (out.layout === 'area' && out.areaShape === 'polygon' && !((out.points as unknown[] | undefined)?.length! >= 3))
        throw new LayoutValidationError('An area with areaShape "polygon" needs at least 3 points ([x, z]).');
    if (out.layout === 'path' && !((out.points as unknown[] | undefined)?.length! >= 2))
        throw new LayoutValidationError('A path layout needs at least 2 points ([x, z]).');
    if (out.alignToSlope && !out.onGround) warnings.push('layout.alignToSlope only acts with onGround: true.');
    return { value: out as unknown as ObjectLayoutSettings, warnings };
}
