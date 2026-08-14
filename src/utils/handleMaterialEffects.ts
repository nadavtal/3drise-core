// =============================================================================
// HANDLE MATERIAL EFFECTS — Material Animations & Effects Handler
// =============================================================================
//
// Pure functions for handling material-related animations and effects.
// Supports animating any material property (color, opacity, roughness, metalness, etc.)
// Uses getType for property type detection and applySingleProperty for application.
//
import { calculateTimeProgress, getMaterialPropertyValue, interpolateValue, applyMaterialPropertyToObject, } from "./materialUtils";
import { applyEasing, gsapEasingMap } from "./animationsUtils";
import { createDefaultEffectState, } from "./utils";
import { applyAllColorEffects } from "./frameAnimations";
import { Object3D } from "three";
import { AnimationOptions, ColorEffectV2, EffectState, MaterialSettings } from "../types";
export interface MaterialAnimationContext {
    object: Object3D;
    materialSettings: MaterialSettings;
    /** Cache of start values for animations (property -> value) */
    startValuesCache: Record<string, any>;
}


// =============================================================================
// DEBUG
// =============================================================================
export const DEBUG_MATERIAL_EFFECTS = false;
const log = (message, ...args) => {
    if (DEBUG_MATERIAL_EFFECTS) {
        console.log(`[MaterialEffects] ${message}`, ...args);
    }
};
// =============================================================================
// MATERIAL PROPERTY ANIMATION
// =============================================================================
/**
 * Get the start value for a material animation.
 * Priority: animation.from > startValuesCache > materialSettings > current material value
 */
function getStartValue(ctx, animation) {
    const { object, materialSettings, startValuesCache } = ctx;
    const property = animation.property;
    // 1. Explicit 'from' value in animation
    if (animation.from !== undefined) {
        return animation.from;
    }
    // 2. Check cache (already computed start value)
    if (property in startValuesCache) {
        return startValuesCache[property];
    }
    // 3. Check materialSettings
    if (property in materialSettings) {
        const value = materialSettings[property];
        startValuesCache[property] = value;
        return value;
    }
    // 4. Get from current material (fallback)
    const currentValue = getMaterialPropertyValue(object, property);
    startValuesCache[property] = currentValue;
    return currentValue;
}
/**
 * Animate a single material property.
 * Supports any material property type (number, color, vector2, etc.)
 */
export function animateMaterialProperty(ctx: MaterialAnimationContext, animation: AnimationOptions, currentTime: number, hovered: boolean): void {
    // console.log("Animating material property:", {
    //     ctx,
    //     animation,
    // });
    const { object } = ctx;
    const { property, to, duration, ease, loop = false, yoyo = false, active, } = animation;
    if (!active || to === undefined)
        return;
    if (animation.triggerMode === "hover" && !hovered)
        return;
    // Get start value
    const from = getStartValue(ctx, animation);
    if (from === null || from === undefined) {
        log("skipping animation - no start value", { property });
        return;
    }
    // Calculate animation progress
    let timeProgress = calculateTimeProgress(currentTime, duration, yoyo, loop);
    // Apply easing if specified
    if (ease) {
        const easingFunctionName = gsapEasingMap[ease] || ease;
        timeProgress = applyEasing(easingFunctionName, timeProgress);
    }
    // Interpolate value based on property type
    const interpolated = interpolateValue(property, from, to, timeProgress);
    // Apply to object (handles shader uniforms + standard materials)
    applyMaterialPropertyToObject(object, property, interpolated);
    log("animated property", { property, from, to, interpolated, progress: timeProgress });
}
// =============================================================================
// HANDLE MATERIAL ANIMATIONS
// =============================================================================
/**
 * Process all active material animations for an object.
 * Supports any material property (color, opacity, roughness, metalness, emissive, etc.)
 */
export function handleMaterialAnimations(ctx: MaterialAnimationContext, animations: AnimationOptions[], currentTime: number, hovered: boolean): void {
    animations.forEach((animation) => {
        if (!animation.active)
            return;
        // Skip transform properties (handled by handleTransformEffects)
        const property = animation.property;
        if (property === "position" || property === "rotation" || property === "scale") {
            return;
        }
        animateMaterialProperty(ctx, animation, currentTime, hovered);
    });
}
// =============================================================================
// HANDLE MATERIAL EFFECTS (COLOR EFFECTS)
// =============================================================================
/**
 * Apply continuous color effects (pulse-color, transition, gradient, etc.).
 * @param object - The 3D object to apply effects to
 * @param effects - Array of color effects
 * @param time - Elapsed time for animation
 * @param delta - Frame delta time
 * @param effectStateRef - Reference to effect state (will be initialized if null)
 * @param applyToChildren - Whether to traverse and apply to children
 */
export function handleMaterialEffects(object: Object3D, effects: ColorEffectV2[], time: number, delta: number, effectStateRef: {
            current: EffectState | null;
        }, applyToChildren: boolean = false): void {
    const enabledEffects = effects.filter((e) => e.enabled);
    if (enabledEffects.length === 0)
        return;
    // Initialize effect state if needed
    if (!effectStateRef.current) {
        effectStateRef.current = createDefaultEffectState(object);
    }
    log("applying color effects", { count: enabledEffects.length });
    applyAllColorEffects(object, enabledEffects, time, delta, {}, // baseColors
    false, // hovered (not relevant for continuous)
    false, // clicked (not relevant for continuous)
    applyToChildren, 1 // sensitivity: full intensity for continuous effects
    );
}
