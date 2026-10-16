// =============================================================================
// HANDLE TRANSFORM EFFECTS — Transform Animations & Effects Handler
// =============================================================================
//
// Pure functions for handling transform-related animations and effects.
// Extracted from useContinuousEffects for better separation of concerns.
//
import { MathUtils } from "three";
import type { Object3D } from 'three';
import { applyEasing, gsapEasingMap } from "./animationsUtils";
import { applyTransformEffects } from "../utils/frameAnimations";
import { calculateTimeProgress } from "./materialUtils";
import { createDefaultEffectState } from "./utils";
import type { AnimationOptions, Vector3Array } from "../types/scene3d";
import type { TransformEffectV2 } from "../types/objectSettings";
import type { EffectState } from "../types/effects";
import { effectiveScope, type AnimationTargetState } from "./animationTargets";
export interface TransformAnimationContext {
    object: Object3D;
    meshSettings: any;
    pathIsActive: boolean;
    /** Groups / models: rows scoped each / targets run through it (see animationTargets.ts). Absent = every row on the object itself. */
    targets?: AnimationTargetState;
    /**
     * A timeline clip driving a row's `to` (by its index in the list): laid over the authored value
     * while the clip runs — live, never written to the settings. Absent / undefined = the row's own.
     */
    liveTo?: (index: number) => Vector3Array | undefined;
    /**
     * A timeline clip has taken this property over (the object itself: target null; a group's /
     * model's child: that child). The clip has full control while it is active: the row stops on
     * that target — nothing is added, nothing is restored — and runs again once the clip ends.
     */
    takenOver?: (target: Object3D | null, property: 'position' | 'rotation' | 'scale') => boolean;
}


// =============================================================================
// DEBUG
// =============================================================================
export const DEBUG_TRANSFORM_EFFECTS = false;
const log = (message, ...args) => {
    if (DEBUG_TRANSFORM_EFFECTS) {
        console.log(`[TransformEffects] ${message}`, ...args);
    }
};
// =============================================================================
// TRANSFORM PROPERTY ANIMATION
// =============================================================================
/**
 * Animate a single transform property (position, rotation, scale).
 */
export function animateTransformProperty(object: Object3D, property: "position" | "rotation" | "scale", start: Vector3Array, to: Vector3Array, timeProgress: number, animationType: string, animationSpeed: number, frames = 1): void {
    if (animationType === "keyframe") {
        // Keyframe (continuous) mode: add an incremental change. `frames` is the
        // frame's duration in 60 Hz frames, so the speed is per SECOND — what a
        // 60 fps screen always showed — instead of per rendered frame, which made
        // a phone at 30-40 fps spin slower and stutter on every dropped frame, and
        // a 120 Hz screen spin twice as fast.
        const currentValue = object[property].toArray();
        const k = animationSpeed * 0.001 * frames;
        const newValue = [
            currentValue[0] + to[0] * k,
            currentValue[1] + to[1] * k,
            currentValue[2] + to[2] * k,
        ];
        object[property].set(...(newValue as [number, number, number]));
    }
    else {
        // Interpolation mode: lerp from start to target
        const interpolated = start.map((startValue, index) => {
            const targetValue = to[index];
            return MathUtils.lerp(startValue, targetValue, timeProgress);
        });
        object[property].set(interpolated[0], interpolated[1], interpolated[2]);
    }
}
// =============================================================================
// HANDLE TRANSFORM ANIMATIONS
// =============================================================================
/**
 * Process all active transform animations for an object.
 * Handles position, rotation, and scale animations.
 */
export function handleTransformAnimations(ctx: TransformAnimationContext, animations: AnimationOptions[], currentTime: number, hovered: boolean, delta?: number): void {
    const { object, meshSettings, pathIsActive } = ctx;
    // Frame duration in 60 Hz frames, for continuous (keyframe) animations. Capped
    // at 0.1 s so a backgrounded tab does not jump a whole spin when it returns.
    // Without a delta (older callers) one frame, the old per-frame behaviour.
    const frames = delta === undefined ? 1 : Math.min(Math.max(delta, 0), 0.1) * 60;
    // console.log("handleTransformAnimations called with animations:", animations);
    animations.forEach((row, index) => {
        const live = ctx.liveTo?.(index);
        const animation = live ? { ...row, to: live } : row;
        const { property, ease, duration, loop = false, to, yoyo = false, active, type = "interpolation", triggerMode = "always", } = animation;
        if (!active)
            return;
        // Only handle transform properties
        if (property !== "position" && property !== "rotation" && property !== "scale") {
            return;
        }
        const scope = ctx.targets ? effectiveScope(object, animation) : 'self';
        if (scope !== 'self') {
            animateTargets(ctx.targets!, animation, property, scope, currentTime, hovered, frames, ctx.takenOver);
            return;
        }
        if (ctx.takenOver?.(null, property)) return;   // a clip drives it: the clip has full control
        if (triggerMode === "hover" && !hovered)
            return;
        // Skip position/rotation if path animation is active (path controls these)
        if (pathIsActive && (property === "position" || property === "rotation")) {
            return;
        }
        // Calculate animation progress
        let timeProgress = calculateTimeProgress(currentTime, duration, yoyo, loop);
        // Apply easing if specified
        if (ease) {
            const easingFunctionName = gsapEasingMap[ease] || ease;
            timeProgress = applyEasing(easingFunctionName, timeProgress);
        }
        const animationSpeed = 1000 / duration;
        // Get start value from meshSettings
        const start = meshSettings[property];
        if (!start || !to)
            return;
        animateTransformProperty(object, property, start, (to as any), timeProgress, type, animationSpeed, frames);
    });
}

/**
 * A row scoped each / targets: every target on its own, `to` relative to the target's rest
 * (position / rotation added, scale multiplied), each target `delay` later (stagger).
 */
function animateTargets(state: AnimationTargetState, animation: AnimationOptions, property: "position" | "rotation" | "scale", scope: 'each' | 'targets', currentTime: number, hovered: boolean, frames: number, takenOver?: TransformAnimationContext['takenOver']): void {
    const { ease, duration, loop = false, to, yoyo = false, type = "interpolation", triggerMode = "always" } = animation;
    const { objs, delays } = state.targetsOf(animation, scope);
    if (triggerMode === "hover" && !hovered) {
        for (const o of objs) state.hold(o, 't', property);
        return;
    }
    if (!Array.isArray(to) || to.length < 3)
        return;
    const isScale = property === "scale";
    const animationSpeed = 1000 / duration;
    const easing = ease ? (gsapEasingMap[ease] || ease) : null;
    objs.forEach((target, i) => {
        // a clip drives this target: leave it to the clip (held — not put back to its rest either)
        if (takenOver?.(target, property)) { state.hold(target, 't', property); return; }
        if (type === "keyframe") {
            // Continuous: the same increment per frame on each target (a stagger has nothing to offset).
            state.touchTransform(target, property);
            animateTransformProperty(target, property, [0, 0, 0], to as Vector3Array, 0, "keyframe", animationSpeed, frames);
            return;
        }
        let t = calculateTimeProgress(currentTime - delays[i] * 1000, duration, yoyo, loop);
        if (easing) t = applyEasing(easing, t);
        const rest = state.transformRest(target, property);
        const v = rest.map((r, k) => {
            const d = Number(to[k]) || 0;
            return isScale ? r * MathUtils.lerp(1, d, t) : r + MathUtils.lerp(0, d, t);
        }) as [number, number, number];
        state.writeTransform(target, property, v);
    });
}

// =============================================================================
// HANDLE TRANSFORM EFFECT
// =============================================================================
/**
 * Apply continuous transform effect (wave, float, spin, etc.).
 * @param object - The 3D object to apply effects to
 * @param effect - The transform effect configuration (single or array)
 * @param time - Elapsed time for animation
 * @param delta - Frame delta time
 * @param effectStateRef - Reference to effect state (will be initialized if null)
 */
export function handleTransformEffect(object: Object3D, effect: TransformEffectV2 | TransformEffectV2[] | undefined, time: number, delta: number, effectStateRef: {
            current: EffectState | null;
        }, hovered: boolean): void {
    // console.log("handleTransformEffect called with effect:", object);
    if (!effect)
        return;
    // Normalize to array
    const effects = Array.isArray(effect) ? effect : [effect];
    // Filter to enabled effects
    const enabledEffects = effects.filter(e => e.enabled);
    if (enabledEffects.length === 0)
        return;
    // Initialize effect state if needed
    if (!effectStateRef.current) {
        effectStateRef.current = createDefaultEffectState(object);
    }
    // log("applying transform effects", { count: enabledEffects.length, types: enabledEffects.map(e => e.type) });
    // Apply transform effects
    applyTransformEffects(object, enabledEffects, // applyTransformEffects expects array
    time, delta, effectStateRef.current, hovered, // hovered (relevant for hover-based effects)
    false, // clicked (not relevant for continuous)
    1 // sensitivity: full intensity for continuous effects
    );
}
