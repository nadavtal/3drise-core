// =============================================================================
// HANDLE LIGHT ANIMATIONS — Keyframe animations on a THREE.Light
// =============================================================================
//
// Reads AnimationOptions[] and applies interpolated values directly to a light
// instance. Properties are written to the light itself (intensity, color) or
// to type-specific fields (distance, decay on PointLight/SpotLight; angle,
// penumbra on SpotLight). Unknown properties are skipped silently.
//
// Sibling of handleTransformAnimations / handleMaterialAnimations /
// handleEdgesAnimations. Same interpolation primitives (calculateTimeProgress,
// applyEasing, interpolateValue) so easing / loop / yoyo semantics match.
//
import { Color } from 'three';
import type { Light } from 'three';
import { applyEasing, gsapEasingMap } from './easingUtils';
import { calculateTimeProgress, interpolateValue } from './materialUtils';
import type { AnimationOptions } from "../types";
export interface LightAnimationContext {
    light: Light;
    startValuesCache: Record<string, any>;
}


// =============================================================================
// DEBUG
// =============================================================================
export const DEBUG_LIGHT_ANIMATIONS = false;
const log = (message, ...args) => {
    if (DEBUG_LIGHT_ANIMATIONS) {
        console.log(`[LightAnimations] ${message}`, ...args);
    }
};
// Properties that can be animated per-frame on a light.
const ANIMATABLE_LIGHT_PROPERTIES = new Set([
    'intensity',
    'color',
    'distance',
    'decay',
    'angle',
    'penumbra',
]);
// =============================================================================
// HELPERS
// =============================================================================
function readLightProperty(light, property) {
    if (property === 'color') {
        return `#${light.color?.getHexString?.() ?? 'ffffff'}`;
    }
    return light[property];
}
function applyLightProperty(light, property, value) {
    if (property === 'color') {
        const target = light.color;
        if (!target)
            return;
        if (value instanceof Color) {
            target.copy(value);
        }
        else {
            target.set(value);
        }
        return;
    }
    // Numeric properties — only assign if the light actually has the field.
    if (property in light) {
        light[property] = value;
    }
}
function getStartValue(ctx, property, animation) {
    if (animation.from !== undefined)
        return animation.from;
    if (property in ctx.startValuesCache)
        return ctx.startValuesCache[property];
    const value = readLightProperty(ctx.light, property);
    ctx.startValuesCache[property] = value;
    return value;
}
// =============================================================================
// SINGLE PROPERTY ANIMATION
// =============================================================================
function animateLightProperty(ctx, animation, currentTime, hovered) {
    const { property, to, duration, ease, loop = false, yoyo = false, active, triggerMode = 'always' } = animation;
    if (!active || to === undefined)
        return;
    if (triggerMode === 'hover' && !hovered)
        return;
    if (!ANIMATABLE_LIGHT_PROPERTIES.has(property)) {
        log('skipping non-animatable light property', { property });
        return;
    }
    // Type-specific properties: only apply if this light actually has them.
    if ((property === 'distance' || property === 'decay' || property === 'angle' || property === 'penumbra') && !(property in ctx.light)) {
        log('skipping property not present on this light type', { property, lightType: ctx.light.type });
        return;
    }
    const from = getStartValue(ctx, property, animation);
    if (from === null || from === undefined) {
        log('skipping — no start value', { property });
        return;
    }
    let timeProgress = calculateTimeProgress(currentTime, duration, yoyo, loop);
    if (ease) {
        const fn = gsapEasingMap[ease] || ease;
        timeProgress = applyEasing(fn, timeProgress);
    }
    const interpolated = interpolateValue(property, from, to, timeProgress);
    applyLightProperty(ctx.light, property, interpolated);
    log('animated light property', { property, from, to, interpolated, progress: timeProgress });
}
// =============================================================================
// MAIN HANDLER
// =============================================================================
/**
 * Process all active light animations for a single light instance.
 *
 * @param ctx         - Animation context (light + start-value cache)
 * @param animations  - AnimationOptions[] from animations.light.animations (or
 *                       SceneLightConfig.ambient.animations / .sun.animations)
 * @param currentTime - Current timestamp (Date.now())
 * @param hovered     - Whether the light is currently hovered (for triggerMode='hover')
 */
export function handleLightAnimations(ctx: LightAnimationContext, animations: AnimationOptions[], currentTime: number, hovered: boolean): void {
    if (animations.length === 0)
        return;
    for (const animation of animations) {
        if (!animation.active)
            continue;
        animateLightProperty(ctx, animation, currentTime, hovered);
    }
}
