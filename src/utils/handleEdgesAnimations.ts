// =============================================================================
// HANDLE EDGES ANIMATIONS � Edges Material Animations Handler
// =============================================================================
//
// Pure functions for handling keyframe animations that target the edges group
// of an object (edge material color, opacity, and other material properties).
//
// Property paths use the `materialSettings.` prefix to mirror the UI:
//   e.g.  "materialSettings.color", "materialSettings.opacity"
// Geometric properties (tubeRadius, cubeSize) require a geometry rebuild and
// are intentionally skipped for per-frame animation.
//
import { applyEasing, gsapEasingMap } from './animationsUtils';
import { calculateTimeProgress, getMaterialPropertyValue, interpolateValue, applyMaterialPropertyToObject, } from './materialUtils';
import { EDGES_GROUP_KEY } from './materialApplicationUtils';
import { Object3D } from "three";
import { AnimationOptions } from "../types";
export interface EdgesAnimationContext {
    /** Main scene object � edges group is searched among its direct children */
    object: Object3D;
    /** Cache for start values so we only resolve them once per animation */
    startValuesCache: Record<string, any>;
}


// =============================================================================
// DEBUG
// =============================================================================
export const DEBUG_EDGES_ANIMATIONS = false;
const log = (message, ...args) => {
    if (DEBUG_EDGES_ANIMATIONS) {
        console.log(`[EdgesAnimations] ${message}`, ...args);
    }
};
// =============================================================================
// HELPERS
// =============================================================================
/**
 * Strip the "materialSettings." prefix that the UI uses for clarity.
 * Returns the bare Three.js material property name, or null for non-material
 * properties that cannot be animated per-frame (tubeRadius, cubeSize).
 */
function resolveMaterialKey(property) {
    if (property.startsWith('materialSettings.')) {
        return property.slice('materialSettings.'.length);
    }
    // Geometric properties require geometry rebuild � skip
    if (property === 'tubeRadius' || property === 'cubeSize') {
        return null;
    }
    // Bare property name (fallback)
    return property;
}
/**
 * Find the edges group attached to the main object.
 */
function findEdgesGroup(object) {
    for (const child of object.children) {
        if (child.userData[EDGES_GROUP_KEY]) {
            return child;
        }
    }
    return null;
}
/**
 * Resolve start value for an animation.
 * Priority: animation.from ? startValuesCache ? current edges material value
 */
function getStartValue(ctx, matKey, animation) {
    const cacheKey = `edges.${matKey}`;
    if (animation.from !== undefined)
        return animation.from;
    if (cacheKey in ctx.startValuesCache)
        return ctx.startValuesCache[cacheKey];
    const edgesGroup = findEdgesGroup(ctx.object);
    if (!edgesGroup)
        return null;
    const value = getMaterialPropertyValue(edgesGroup, matKey);
    ctx.startValuesCache[cacheKey] = value;
    return value;
}
// =============================================================================
// SINGLE PROPERTY ANIMATION
// =============================================================================
function animateEdgesProperty(ctx, edgesGroup, matKey, animation, currentTime, hovered) {
    const { to, duration, ease, loop = false, yoyo = false, active, triggerMode = 'always' } = animation;
    if (!active || to === undefined)
        return;
    if (triggerMode === 'hover' && !hovered)
        return;
    const from = getStartValue(ctx, matKey, animation);
    if (from === null || from === undefined) {
        log('skipping � no start value', { matKey });
        return;
    }
    let timeProgress = calculateTimeProgress(currentTime, duration, yoyo, loop);
    if (ease) {
        const fn = gsapEasingMap[ease] || ease;
        timeProgress = applyEasing(fn, timeProgress);
    }
    const interpolated = interpolateValue(matKey, from, to, timeProgress);
    applyMaterialPropertyToObject(edgesGroup, matKey, interpolated);
    log('animated edges property', { matKey, from, to, interpolated, progress: timeProgress });
}
// =============================================================================
// MAIN HANDLER
// =============================================================================
/**
 * Process all active edge animations for an object.
 * Finds the edges group on the object and animates material properties on it.
 *
 * @param ctx         - Animation context (main object + start-value cache)
 * @param animations  - Array of AnimationOptions from animations.edges.animations
 * @param currentTime - Current timestamp (Date.now())
 * @param hovered     - Whether the object is currently hovered
 */
export function handleEdgesAnimations(ctx: EdgesAnimationContext, animations: AnimationOptions[], currentTime: number, hovered: boolean): void {
    if (animations.length === 0)
        return;
    const edgesGroup = findEdgesGroup(ctx.object);
    if (!edgesGroup) {
        log('no edges group found on object');
        return;
    }
    for (const animation of animations) {
        if (!animation.active)
            continue;
        const matKey = resolveMaterialKey(animation.property);
        if (!matKey) {
            log('skipping non-animatable edges property', { property: animation.property });
            continue;
        }
        animateEdgesProperty(ctx, edgesGroup, matKey, animation, currentTime, hovered);
    }
}
