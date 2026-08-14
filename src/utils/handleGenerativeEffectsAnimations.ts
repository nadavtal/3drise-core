// =============================================================================
// HANDLE GENERATIVE EFFECTS ANIMATIONS — per-effect utility
// =============================================================================
//
// Called from inside each generative effect component's own useFrame loop.
// Each effect component holds direct refs to its ShaderMaterials and passes
// them here, avoiding fragile scene-graph traversal.
//
// Usage (inside an effect component's useFrame):
//
//   useFrame((state) => {
//     const t = state.clock.getElapsedTime();
//     mat.uniforms.u_time.value = t;
//
//     if (animations?.length) {
//       applyGenerativeAnimations([mat], animations, startValuesCacheRef.current, Date.now(), hovered ?? false);
//     }
//   });
//
import * as THREE from 'three';
import { MathUtils } from 'three';
import { calculateTimeProgress } from './materialUtils';
import { applyEasing, gsapEasingMap } from './animationsUtils';
import { AnimationOptions } from '../types';


// =============================================================================
// DEBUG
// =============================================================================
export const DEBUG_GENERATIVE_EFFECTS = false;
const log = (message, ...args) => {
    if (DEBUG_GENERATIVE_EFFECTS) {
        console.log(`[GenerativeEffectsAnimations] ${message}`, ...args);
    }
};
// Always-on log: prints once per unique key, not every frame
const _loggedOnce = new Set();
const logOnce = (key, message, ...args) => {
    if (_loggedOnce.has(key))
        return;
    _loggedOnce.add(key);
    console.log(`[GenerativeEffectsAnimations] ${message}`, ...args);
};
const warnOnce = (key, message, ...args) => {
    if (_loggedOnce.has(key))
        return;
    _loggedOnce.add(key);
    console.warn(`[GenerativeEffectsAnimations] ${message}`, ...args);
};
// =============================================================================
// HELPERS
// =============================================================================
/**
 * Returns candidate uniform names for a given config property name.
 * Handles both conventions found across effect shaders:
 *   intensity  → uIntensity   (camelCase prefix)
 *   speed      → u_speed      (underscore prefix, used in several shaders)
 */
function candidateUniformNames(property) {
    const capitalized = property.charAt(0).toUpperCase() + property.slice(1);
    return [`u${capitalized}`, `u_${property}`];
}
/**
 * Find which uniform name actually exists on the provided materials.
 */
function findUniformName(materials, property) {
    const candidates = candidateUniformNames(property);
    for (const candidate of candidates) {
        for (const mat of materials) {
            if (mat.uniforms[candidate] !== undefined) {
                return candidate;
            }
        }
    }
    return null;
}
/**
 * Read the current value of a uniform across materials (returns the first match).
 * For Color / Vector3 uniforms, returns a hex string so it can be used as a start value.
 */
function readUniformValue(materials, uniformName) {
    for (const mat of materials) {
        const u = mat.uniforms[uniformName];
        if (u !== undefined) {
            if (u.value instanceof THREE.Color) {
                return '#' + u.value.getHexString();
            }
            // Vector3 color uniforms (e.g. uColor stored as vec3 r/g/b)
            if (u.value instanceof THREE.Vector3) {
                _colorFrom.setRGB(u.value.x, u.value.y, u.value.z);
                return '#' + _colorFrom.getHexString();
            }
            return u.value;
        }
    }
    return undefined;
}
// Reusable Color instances — avoid per-frame allocation
const _colorFrom = new THREE.Color();
const _colorTo = new THREE.Color();
/**
 * Write an animated numeric value to all materials that carry the uniform.
 */
function applyNumericToMaterials(materials, uniformName, value) {
    for (const mat of materials) {
        const u = mat.uniforms[uniformName];
        if (u !== undefined) {
            u.value = value;
        }
    }
}
/**
 * Write a linearly interpolated color to all materials that carry the uniform.
 * Handles both THREE.Color values and Vector3-style uniforms.
 */
function applyColorToMaterials(materials, uniformName, from, to, t) {
    _colorFrom.set(from);
    _colorTo.set(to);
    const r = MathUtils.lerp(_colorFrom.r, _colorTo.r, t);
    const g = MathUtils.lerp(_colorFrom.g, _colorTo.g, t);
    const b = MathUtils.lerp(_colorFrom.b, _colorTo.b, t);
    for (const mat of materials) {
        const u = mat.uniforms[uniformName];
        if (u !== undefined) {
            const val = u.value;
            if (val instanceof THREE.Color) {
                val.setRGB(r, g, b);
            }
            else if (val && typeof val === 'object' && 'x' in val) {
                // THREE.Vector3 uniform
                val.set(r, g, b);
            }
        }
    }
}
function isColorValue(value) {
    return typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb'));
}
// =============================================================================
// MAIN EXPORT
// =============================================================================
/**
 * Animate config properties of a generative effect by directly mutating
 * its ShaderMaterial uniforms — no React re-renders, runs at 60fps.
 *
 * @param materials        - All ShaderMaterial instances belonging to this effect.
 * @param animations       - Keyframe animations from GenerativeEffectSettings.animations.
 * @param startValuesCache - Ref-backed cache to hold initial values (reset externally when config changes).
 * @param currentTime      - Milliseconds since epoch (Date.now()), consistent with other handlers.
 * @param hovered          - Whether the parent object is currently hovered.
 */
export function applyGenerativeAnimations(materials: THREE.ShaderMaterial[], animations: AnimationOptions[] | undefined, startValuesCache: Record<string, any>, currentTime: number, hovered: boolean): void {
    if (!animations || animations.length === 0)
        return;
    if (materials.length === 0)
        return;
    logOnce('called', `Processing ${animations.length} animation(s) across ${materials.length} material(s)`);
    for (const animation of animations) {
        try {
            const { property, to, duration, ease, loop = false, yoyo = false, active, triggerMode = 'always', } = animation;
            // active===undefined means not explicitly disabled — treat as active
            if (active === false) {
                log(`Skipping "${property}": active=false`);
                continue;
            }
            if (triggerMode === 'hover' && !hovered) {
                log(`Skipping "${property}": triggerMode=hover but not hovered`);
                continue;
            }
            if (to === undefined) {
                warnOnce(`no-to-${property}`, `Skipping "${property}": no 'to' value defined`);
                continue;
            }
            // Find the uniform that corresponds to this property
            const uniformName = findUniformName(materials, property);
            if (!uniformName) {
                warnOnce(`no-uniform-${property}`, `No uniform found for property "${property}" (tried: ${candidateUniformNames(property).join(', ')}) — available uniforms on mat[0]: ${Object.keys(materials[0]?.uniforms ?? {}).join(', ')}`);
                continue;
            }
            // Initialize start value from the current uniform value (once per animation lifetime)
            if (!(property in startValuesCache)) {
                const currentVal = readUniformValue(materials, uniformName);
                startValuesCache[property] = animation.from !== undefined ? animation.from : currentVal;
                log('cached start value', { property, uniformName, startValue: startValuesCache[property] });
            }
            const from = startValuesCache[property];
            if (from === undefined || from === null)
                continue;
            // Calculate progress
            let timeProgress = calculateTimeProgress(currentTime, duration, yoyo, loop);
            if (ease) {
                const easingFunctionName = gsapEasingMap[ease] || ease;
                timeProgress = applyEasing(easingFunctionName, timeProgress);
            }
            // Apply — guard against type mismatches between 'from' and the actual uniform
            if (isColorValue(from)) {
                if (typeof to !== 'string') {
                    warnOnce(`bad-to-${property}`, `Color property "${property}" has non-string 'to' value:`, to);
                    continue;
                }
                applyColorToMaterials(materials, uniformName, from, to, timeProgress);
            }
            else if (typeof from === 'number') {
                if (typeof to !== 'number') {
                    warnOnce(`bad-to-num-${property}`, `Numeric property "${property}" has non-numeric 'to' value:`, to);
                    continue;
                }
                const interpolated = MathUtils.lerp(from, to, timeProgress);
                applyNumericToMaterials(materials, uniformName, interpolated);
            }
            else {
                warnOnce(`bad-from-${property}`, `Unhandled 'from' type for property "${property}":`, typeof from, from);
                continue;
            }
            log('animated', { property, uniformName, from, to, timeProgress });
        }
        catch (err) {
            console.error(`[GenerativeEffectsAnimations] Error animating property "${animation.property}":`, err);
        }
    }
}
