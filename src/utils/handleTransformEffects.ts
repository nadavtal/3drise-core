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
export interface TransformAnimationContext {
    object: Object3D;
    meshSettings: any;
    pathIsActive: boolean;
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
export function animateTransformProperty(object: Object3D, property: "position" | "rotation" | "scale", start: Vector3Array, to: Vector3Array, timeProgress: number, animationType: string, animationSpeed: number): void {
    if (animationType === "keyframe") {
        // Keyframe mode: add incremental change
        const currentValue = object[property].toArray();
        const newValue = [
            currentValue[0] + to[0] * animationSpeed * 0.001,
            currentValue[1] + to[1] * animationSpeed * 0.001,
            currentValue[2] + to[2] * animationSpeed * 0.001,
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
export function handleTransformAnimations(ctx: TransformAnimationContext, animations: AnimationOptions[], currentTime: number, hovered: boolean): void {
    const { object, meshSettings, pathIsActive } = ctx;
    // console.log("handleTransformAnimations called with animations:", animations);
    animations.forEach((animation) => {
        const { property, ease, duration, loop = false, to, yoyo = false, active, type = "interpolation", objectIds, triggerMode = "always", } = animation;
        if (!active)
            return;
        if (triggerMode === "hover" && !hovered)
            return;
        // Skip position/rotation if path animation is active (path controls these)
        if (pathIsActive &&
            (property === "position" || property === "rotation") &&
            (!objectIds || objectIds.length === 0)) {
            return;
        }
        // Only handle transform properties
        if (property !== "position" && property !== "rotation" && property !== "scale") {
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
        // Determine which objects to animate
        const targetsToAnimate = [];
        if (objectIds && objectIds.length > 0) {
            // Animate specific children by name
            objectIds.forEach((name) => {
                const child = object.getObjectByName(name);
                if (child) {
                    targetsToAnimate.push(child);
                }
            });
            log("animating specific targets", { objectIds, found: targetsToAnimate.length });
        }
        else {
            // Animate the parent object
            targetsToAnimate.push(object);
        }
        // Get start value from meshSettings
        const start = meshSettings[property];
        if (!start || !to)
            return;
        // Apply animation to each target
        targetsToAnimate.forEach((target) => {
            animateTransformProperty(target, property, start, (to as any), timeProgress, type, animationSpeed);
        });
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
