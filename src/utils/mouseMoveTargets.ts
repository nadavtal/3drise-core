// =============================================================================
// Mouse-move targets — Self / Each / Targets for pointer-driven rows
// =============================================================================
//
// The mouse-move twin of the Animation tab's targeting (animationTargets.ts). A
// MouseMoveProperty on a group or a model carries the same scope / targets / stagger:
//   self     the object as one piece — the old path (handleTransformMouseMove /
//            handleMaterialMouseMove), min / max absolute (not handled here)
//   each     every part on its own (group: leaf child objects, model: meshes)
//   targets  only the chosen ones
//
// Transform min / max on each / targets are RELATIVE to the target's own rest:
// position / rotation are added, scale is multiplied. Material min / max stay absolute.
//
// Stagger is a follow lag: target i sees the pointer as it was `delay[i]` seconds ago
// (delays from staggerDelays — same orders as the Animation tab), so a sweep of the
// pointer travels across the parts as a wave.
//
// Rest values, material cloning and putting a target back when a row stops driving it
// are AnimationTargetState's job — the viewer hook holds one per object for mouse-move.
//
import type { Object3D } from 'three';
import type { MouseMoveProperty } from '../types/objectSettings';
import { effectiveScope, type AnimationTargetState, type TransformKey } from './animationTargets';
import { interpolateMouseMoveProperty } from './mouseMoveUtils';

type Vec3 = [number, number, number];
const TRANSFORM_KEYS: readonly TransformKey[] = ['position', 'rotation', 'scale'];

/** True when the row runs on each / targets on this root (false: the old self path). */
export function isTargetedMouseMove(root: Object3D, p: MouseMoveProperty): boolean {
    return effectiveScope(root, p) !== 'self';
}

// -----------------------------------------------------------------------------
// Pointer history (for the follow-lag stagger)
// -----------------------------------------------------------------------------

/** Ring buffer of pointer samples; `sample(t)` reads the pointer as it was at time t (seconds). */
export class PointerHistory {
    private readonly cap: number;
    private readonly t: Float64Array;
    private readonly x: Float32Array;
    private readonly y: Float32Array;
    private head = 0;   // next write slot
    private size = 0;

    constructor(capacity = 1024) {
        this.cap = capacity;
        this.t = new Float64Array(capacity);
        this.x = new Float32Array(capacity);
        this.y = new Float32Array(capacity);
    }

    push(time: number, x: number, y: number): void {
        this.t[this.head] = time;
        this.x[this.head] = x;
        this.y[this.head] = y;
        this.head = (this.head + 1) % this.cap;
        if (this.size < this.cap) this.size++;
    }

    /** Writes the pointer at `time` into `out` (linear between samples, clamped to the oldest / newest). */
    sample(time: number, out: { x: number; y: number }): { x: number; y: number } {
        if (!this.size) { out.x = 0; out.y = 0; return out; }
        const idx = (k: number) => (this.head - 1 - k + this.cap) % this.cap;   // k = 0 newest
        let newer = idx(0);
        if (time >= this.t[newer]) { out.x = this.x[newer]; out.y = this.y[newer]; return out; }
        for (let k = 1; k < this.size; k++) {
            const older = idx(k);
            if (this.t[older] <= time) {
                const span = this.t[newer] - this.t[older];
                const f = span > 0 ? (time - this.t[older]) / span : 0;
                out.x = this.x[older] + (this.x[newer] - this.x[older]) * f;
                out.y = this.y[older] + (this.y[newer] - this.y[older]) * f;
                return out;
            }
            newer = older;
        }
        out.x = this.x[newer]; out.y = this.y[newer];   // older than the buffer: the oldest sample
        return out;
    }
}

// -----------------------------------------------------------------------------
// Handlers
// -----------------------------------------------------------------------------

const lagged = { x: 0, y: 0 };

/**
 * Transform rows scoped each / targets. Rows on the same property (rare) stack: each
 * adds its offset (scale: multiplies) onto the target's rest.
 */
export function handleTransformMouseMoveTargets(
    state: AnimationTargetState,
    properties: MouseMoveProperty[],
    history: PointerHistory,
    now: number,
): void {
    const root = state.object;
    // per target, per key: the value being built this frame (written once at the end)
    const built = new Map<Object3D, Partial<Record<TransformKey, Vec3>>>();
    for (const p of properties) {
        if (!p.enabled || !p.property) continue;
        const key = p.property as TransformKey;
        if (!TRANSFORM_KEYS.includes(key)) continue;
        const scope = effectiveScope(root, p);
        if (scope === 'self') continue;
        const { axis = 'both', sensitivity = 1, inverted = false, min, max } = p.propertySettings || ({} as any);
        const isScale = key === 'scale';
        const { objs, delays } = state.targetsOf(p, scope);
        objs.forEach((target, i) => {
            const ptr = history.sample(now - delays[i], lagged);
            const off = interpolateMouseMoveProperty(undefined, min, max, ptr, axis, sensitivity, inverted);
            const d: Vec3 | null = Array.isArray(off) && off.length >= 3 ? [off[0], off[1], off[2]]
                : typeof off === 'number' ? [off, off, off] : null;
            if (!d) return;
            let rec = built.get(target);
            if (!rec) { rec = {}; built.set(target, rec); }
            const cur = rec[key] ?? [...state.transformRest(target, key)] as Vec3;
            for (let k = 0; k < 3; k++) cur[k] = isScale ? cur[k] * d[k] : cur[k] + d[k];
            rec[key] = cur;
        });
    }
    for (const [target, rec] of built) {
        for (const key of TRANSFORM_KEYS) if (rec[key]) state.writeTransform(target, key, rec[key]!);
    }
}

/** Material rows scoped each / targets: each target from min to max (absolute). */
export function handleMaterialMouseMoveTargets(
    state: AnimationTargetState,
    properties: MouseMoveProperty[],
    history: PointerHistory,
    now: number,
): void {
    const root = state.object;
    for (const p of properties) {
        if (!p.enabled || !p.property) continue;
        const scope = effectiveScope(root, p);
        if (scope === 'self') continue;
        const { axis = 'both', sensitivity = 1, inverted = false, min, max } = p.propertySettings || ({} as any);
        const { objs, delays } = state.targetsOf(p, scope);
        objs.forEach((target, i) => {
            const rest = state.materialRest(target, p.property);
            const ptr = history.sample(now - delays[i], lagged);
            const v = interpolateMouseMoveProperty(rest, min, max, ptr, axis, sensitivity, inverted);
            if (v === undefined || v === null) return;
            state.writeMaterial(target, p.property, v);
        });
    }
}
