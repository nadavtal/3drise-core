// =============================================================================
// FRAME ANIMATIONS - Centralized Transform and Color Effects
// =============================================================================
// All per-frame animation effects for 3D objects
// Used with useFrame() hook in React Three Fiber components
import { easing } from "maath";
import { Color } from "three";
import type { Object3D } from 'three';
import type { TransformEffect, ColorEffect, EffectState } from "../types/effects";

// =============================================================================
// LEGACY FUNCTIONS (for backward compatibility)
// =============================================================================
export function applyRotationEffects(group: Object3D, effects: string[], hovered: boolean, isActive: boolean, dt: number, spinSpeed: number, flipSpeed: number, originalRotation: [number, number, number], name: string): void {
    let targetRotY = originalRotation[1];
    const shouldSpin = effects.includes('spin') && !isActive && hovered;
    const shouldFlip = effects.includes('flip') && !isActive && hovered;
    if (shouldSpin) {
        group.rotation.y += dt * spinSpeed;
    }
    else if (shouldFlip) {
        targetRotY = originalRotation[1] + Math.PI;
        easing.damp(group.rotation, 'y', targetRotY, flipSpeed, dt);
    }
    else {
        easing.damp(group.rotation, 'y', originalRotation[1], 0.3, dt);
    }
}
export function applyScaleEffects(object: Object3D, effects: string[], hovered: boolean, isActive: boolean, hoverScale: number, dt: number, originalScale: [number, number, number]): void {
    const shouldScale = effects.includes('scale') && !isActive && hovered;
    console.log("applyScaleEffects - shouldScale:", object);
    if (shouldScale) {
        easing.damp3(object.scale, [originalScale[0] * hoverScale, originalScale[1] * hoverScale, originalScale[2] * hoverScale], 0.1, dt);
    }
    else {
        easing.damp3(object.scale, originalScale, 0.1, dt);
    }
}
export function applyColorEffects(object: Object3D, effects: string[], hovered: boolean, baseColor: string, hoverColor: string, dt: number): void {
    const shouldColor = effects.includes('color');
    const targetColor = hoverColor;
    if (shouldColor) {
        if (hovered) {
            object.traverse((child) => {
                if ((child as any).material && (child as any).material.color) {
                    easing.dampC((child as any).material.color, targetColor, 0.1, dt);
                }
            });
        }
        else {
            object.traverse((child) => {
                if ((child as any).material && (child as any).material.color) {
                    easing.dampC((child as any).material.color, baseColor, 0.1, dt);
                }
            });
        }
    }
}
// =============================================================================
// NEW UNIFIED EFFECT SYSTEM
// =============================================================================
/**
 * Check if an effect should be active based on trigger mode and current state
 * NOTE: V2 effects don't have triggerMode - they're organized by location:
 *   - effects.transform = always active
 *   - interactions.hover.effects.transform = hover-triggered
 * When triggerMode is undefined, default to 'always' (V2 continuous effects)
 */
export function shouldEffectBeActive(effect: TransformEffect | ColorEffect, hovered: boolean, clicked: boolean): boolean {
    if (!effect.enabled)
        return false;
    // V2 effects don't have triggerMode - default to always active
    const mode = effect.triggerMode ?? 'always';
    switch (mode) {
        case 'always':
            return true;
        case 'hover':
            return hovered;
        case 'click':
            return clicked;
        default:
            return true; // Safe default: run the effect
    }
}
/**
 * Get enabled effects filtered by trigger state
 */
export function getActiveEffects<T extends TransformEffect | ColorEffect>(effects: T[], hovered: boolean, clicked: boolean): T[] {
    return effects.filter(effect => shouldEffectBeActive(effect, hovered, clicked));
}
// =============================================================================
// TRANSFORM EFFECT IMPLEMENTATIONS
// =============================================================================
/**
 * Apply wave effect - oscillating Y position
 */
export function applyWaveEffect(object: Object3D, effect: TransformEffect, time: number, originalY: number): void {
    const options = effect.options;
    const amplitude = (options as any)?.amplitude ?? 0.1;
    const frequency = (options as any)?.frequency ?? 2;
    const speed = effect.speed ?? 1;
    const intensity = effect.intensity ?? 1;
    object.position.y = originalY + Math.sin(time * frequency * speed) * amplitude * intensity;
}
/**
 * Apply float effect - gentle floating in multiple directions
 */
export function applyFloatEffect(object: Object3D, effect: TransformEffect, time: number, originalPosition: {
            x: number;
            y: number;
            z: number;
        }): void {
    const options = effect.options;
    const speed = effect.speed ?? 1;
    const intensity = effect.intensity ?? 1;
    const ampX = ((options as any)?.amplitudeX ?? 0.05) * intensity;
    const ampY = ((options as any)?.amplitudeY ?? 0.1) * intensity;
    const ampZ = ((options as any)?.amplitudeZ ?? 0.03) * intensity;
    object.position.x = originalPosition.x + Math.cos(time * speed * 0.5) * ampX;
    object.position.y = originalPosition.y + Math.sin(time * speed) * ampY;
    object.position.z = originalPosition.z + Math.sin(time * speed * 0.3) * ampZ;
}
/**
 * Apply pulse effect - rhythmic scale animation
 */
export function applyPulseEffect(object: Object3D, effect: TransformEffect, time: number, originalScale: {
            x: number;
            y: number;
            z: number;
        }): void {
    const options = effect.options;
    const speed = effect.speed ?? 2;
    const minScale = (options as any)?.minScale ?? 0.95;
    const maxScale = (options as any)?.maxScale ?? 1.05;
    const range = maxScale - minScale;
    const scaleFactor = minScale + (Math.sin(time * speed) + 1) * 0.5 * range;
    object.scale.set(originalScale.x * scaleFactor, originalScale.y * scaleFactor, originalScale.z * scaleFactor);
}
/**
 * Apply shake effect - random vibration
 */
export function applyShakeEffect(object: Object3D, effect: TransformEffect, originalPosition: {
            x: number;
            y: number;
        }): void {
    const options = effect.options;
    const intensity = effect.intensity ?? 1;
    const ampX = ((options as any)?.amplitudeX ?? 0.02) * intensity;
    const ampY = ((options as any)?.amplitudeY ?? 0.02) * intensity;
    object.position.x = originalPosition.x + (Math.random() - 0.5) * ampX;
    object.position.y = originalPosition.y + (Math.random() - 0.5) * ampY;
}
/**
 * Apply bounce effect - bouncing motion
 */
export function applyBounceEffect(object: Object3D, effect: TransformEffect, time: number, originalY: number): void {
    const options = effect.options;
    const speed = effect.speed ?? 3;
    const bounceHeight = (options as any)?.bounceHeight ?? 0.2;
    const intensity = effect.intensity ?? 1;
    object.position.y = originalY + Math.abs(Math.sin(time * speed)) * bounceHeight * intensity;
}
/**
 * Apply rotate3d effect - subtle 3D rotation
 */
export function applyRotate3DEffect(object: Object3D, effect: TransformEffect, time: number, originalRotation: {
            x: number;
            y: number;
            z: number;
        }): void {
    const options = effect.options;
    const speed = effect.speed ?? 1;
    const intensity = (effect.intensity ?? 1) * 0.1;
    if ((options as any)?.axisX !== false) {
        object.rotation.x = originalRotation.x + Math.cos(time * speed * 0.7) * intensity * 0.5;
    }
    if ((options as any)?.axisY !== false) {
        object.rotation.y = originalRotation.y + Math.sin(time * speed) * intensity;
    }
    if ((options as any)?.axisZ) {
        object.rotation.z = originalRotation.z + Math.sin(time * speed * 0.5) * intensity * 0.3;
    }
}
/**
 * Apply fade effect - pulsing opacity
 * Returns the calculated opacity value
 */
export function applyFadeEffect(effect: TransformEffect, time: number): number {
    const options = effect.options;
    const speed = effect.speed ?? 1;
    const fadeMin = (options as any)?.fadeMin ?? 0.3;
    const fadeMax = (options as any)?.fadeMax ?? 1;
    const range = fadeMax - fadeMin;
    return fadeMin + (Math.sin(time * speed) + 1) * 0.5 * range;
}
/**
 * Apply spin effect - continuous rotation
 */
export function applySpinEffect(object: Object3D, effect: TransformEffect, dt: number): void {
    const options = effect.options;
    const speed = effect.speed ?? 1;
    const axis = (options as any)?.axis ?? 'y';
    object.rotation[axis] += dt * speed;
}
/**
 * Apply sway effect - pendulum-like rotation
 */
export function applySwayEffect(object: Object3D, effect: TransformEffect, time: number, originalRotation: {
            x: number;
            y: number;
            z: number;
        }): void {
    const options = effect.options;
    const speed = effect.speed ?? 1;
    const angle = (options as any)?.angle ?? 0.2;
    const axis = (options as any)?.axis ?? 'z';
    const intensity = effect.intensity ?? 1;
    object.rotation[axis] = originalRotation[axis] + Math.sin(time * speed) * angle * intensity;
}
/**
 * Apply flip effect - 180° rotation on trigger (with easing)
 */
export function applyFlipEffect(object: Object3D, effect: TransformEffect, isActive: boolean, dt: number, originalRotation: {
            x: number;
            y: number;
            z: number;
        }, sensitivity: number = 0.5): void {
    const options = effect.options;
    const axis = (options as any)?.axis ?? 'y';
    const speed = effect.speed ?? 0.3;
    const dampSpeed = speed * (1 - sensitivity * 0.5); // Lower sensitivity = slower
    const targetRotation = isActive
        ? originalRotation[axis] + Math.PI
        : originalRotation[axis];
    easing.damp(object.rotation, axis, targetRotation, dampSpeed, dt);
}
/**
 * Apply scale effect - scale up/down on trigger (with easing)
 */
export function applyScaleEffect(object: Object3D, effect: TransformEffect, isActive: boolean, dt: number, originalScale: {
            x: number;
            y: number;
            z: number;
        }, sensitivity: number = 0.5): void {
    const options = effect.options;
    const targetScale = (options as any)?.targetScale ?? 1.2;
    const speed = effect.speed ?? 0.1;
    const dampSpeed = speed * (1 - sensitivity * 0.5);
    const scale = isActive
        ? [originalScale.x * targetScale, originalScale.y * targetScale, originalScale.z * targetScale]
        : [originalScale.x, originalScale.y, originalScale.z];
    easing.damp3(object.scale, (scale as any), dampSpeed, dt);
}
// =============================================================================
// COLOR EFFECT IMPLEMENTATIONS
// =============================================================================
/**
 * Get color value from material at a given property path
 */
function getColorFromPath(material, path) {
    const parts = path.split('.');
    let current = material;
    for (const part of parts) {
        if (current === null || current === undefined)
            return null;
        current = current[part];
    }
    if (current?.value instanceof Color)
        return current.value;
    if (current instanceof Color)
        return current;
    return null;
}
/**
 * Apply color transition effect - smooth transition to target color
 */
export function applyColorTransitionEffect(object: Object3D, effect: ColorEffect, isActive: boolean, dt: number, baseColors: Record<string, string>, applyToChildren: boolean = true, sensitivity: number = 0.5): void {
    const targetProperties = effect.targetProperties ?? ['color'];
    const targetColor = isActive ? effect.targetColor : null;
    const dampSpeed = 0.1 * (1 - sensitivity * 0.5);
    const applyToMaterial = (material) => {
        for (const propPath of targetProperties) {
            const color = getColorFromPath(material, propPath);
            if (color) {
                const baseColor = baseColors[propPath] || '#ffffff';
                easing.dampC(color, targetColor || baseColor, dampSpeed, dt);
            }
        }
    };
    if (applyToChildren) {
        object.traverse((child) => {
            if ((child as any).material) {
                applyToMaterial((child as any).material);
            }
        });
    }
    else {
        const mesh = object;
        if ((mesh as any).material) {
            applyToMaterial((mesh as any).material);
        }
    }
}
/**
 * Apply pulse color effect - pulsing between base and target color
 */
export function applyPulseColorEffect(object: Object3D, effect: ColorEffect, time: number, baseColors: Record<string, string>, applyToChildren: boolean = true): void {
    const targetProperties = effect.targetProperties ?? ['color'];
    const speed = effect.speed ?? 1;
    const intensity = effect.intensity ?? 1;
    // Calculate blend factor (0-1 oscillating)
    const blend = (Math.sin(time * speed * 2) + 1) * 0.5 * intensity;
    const baseColorObj = new Color();
    const targetColorObj = new Color(effect.targetColor);
    const resultColor = new Color();
    const applyToMaterial = (material) => {
        for (const propPath of targetProperties) {
            const color = getColorFromPath(material, propPath);
            if (color) {
                const baseColor = baseColors[propPath] || '#ffffff';
                baseColorObj.set(baseColor);
                resultColor.copy(baseColorObj).lerp(targetColorObj, blend);
                color.copy(resultColor);
            }
        }
    };
    if (applyToChildren) {
        object.traverse((child) => {
            if ((child as any).material) {
                applyToMaterial((child as any).material);
            }
        });
    }
    else {
        const mesh = object;
        if ((mesh as any).material) {
            applyToMaterial((mesh as any).material);
        }
    }
}
// =============================================================================
// ORCHESTRATORS - Apply multiple effects
// =============================================================================
/**
 * Apply all transform effects to an object
 */
export function applyTransformEffects(object: Object3D, effects: TransformEffect[], time: number, dt: number, state: EffectState, hovered: boolean, clicked: boolean, sensitivity: number = 0.5): {
        opacity?: number;
    } {
    let result = {};
    // console.log(hovered)
    for (const effect of effects) {
        const isActive = shouldEffectBeActive(effect, hovered, clicked);
        // console.log(`Effect ${effect.type} is ${isActive ? 'active' : 'inactive'} (hovered: ${hovered}, clicked: ${clicked})`);
        // Continuous effects (triggerMode doesn't affect animation, only whether it runs)
        if (!isActive)
            continue;
        switch (effect.type) {
            case 'wave':
                applyWaveEffect(object, effect, time, state.originalPosition.y);
                break;
            case 'float':
                applyFloatEffect(object, effect, time, state.originalPosition);
                break;
            case 'pulse':
                applyPulseEffect(object, effect, time, state.originalScale);
                break;
            case 'shake':
                applyShakeEffect(object, effect, state.originalPosition);
                break;
            case 'bounce':
                applyBounceEffect(object, effect, time, state.originalPosition.y);
                break;
            case 'rotate3d':
                applyRotate3DEffect(object, effect, time, state.originalRotation);
                break;
            case 'fade':
                (result as any).opacity = applyFadeEffect(effect, time);
                break;
            case 'spin':
                applySpinEffect(object, effect, dt);
                break;
            case 'sway':
                applySwayEffect(object, effect, time, state.originalRotation);
                break;
        }
    }
    // Triggered effects (need to run even when not active to ease back)
    for (const effect of effects) {
        if (!effect.enabled)
            continue;
        const isActive = shouldEffectBeActive(effect, hovered, clicked);
        switch (effect.type) {
            case 'flip':
                applyFlipEffect(object, effect, isActive, dt, state.originalRotation, sensitivity);
                break;
            case 'scale':
                applyScaleEffect(object, effect, isActive, dt, state.originalScale, sensitivity);
                break;
        }
    }
    return result;
}
/**
 * Apply all color effects to an object
 */
export function applyAllColorEffects(object: Object3D, effects: ColorEffect[], time: number, dt: number, baseColors: Record<string, string>, hovered: boolean, clicked: boolean, applyToChildren: boolean = true, sensitivity: number = 0.5): void {
    for (const effect of effects) {
        if (!effect.enabled)
            continue;
        const isActive = shouldEffectBeActive(effect, hovered, clicked);
        switch (effect.type) {
            case 'color-transition':
                applyColorTransitionEffect(object, effect, isActive, dt, baseColors, applyToChildren, sensitivity);
                break;
            case 'pulse-color':
                if (isActive) {
                    applyPulseColorEffect(object, effect, time, baseColors, applyToChildren);
                }
                break;
            // gradient-color would need shader support
        }
    }
}
// =============================================================================
// EFFECT STATE UTILITIES
// =============================================================================
/**
 * Create effect state from an Object3D
 */
export function createEffectStateFromObject(object: Object3D): EffectState {
    return {
        originalPosition: {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z
        },
        originalScale: {
            x: object.scale.x,
            y: object.scale.y,
            z: object.scale.z
        },
        originalRotation: {
            x: object.rotation.x,
            y: object.rotation.y,
            z: object.rotation.z
        },
        originalOpacity: 1,
        originalColors: {},
        time: 0,
        isTriggered: false,
    };
}
/**
 * Extract base colors from an object's materials
 */
export function extractBaseColors(object: Object3D, targetProperties: string[] = ['color'], applyToChildren: boolean = true): Record<string, string> {
    const colors = {};
    const extractFromMaterial = (material) => {
        for (const propPath of targetProperties) {
            const color = getColorFromPath(material, propPath);
            if (color && !colors[propPath]) {
                colors[propPath] = '#' + color.getHexString();
            }
        }
    };
    if (applyToChildren) {
        object.traverse((child) => {
            if ((child as any).material) {
                extractFromMaterial((child as any).material);
            }
        });
    }
    else {
        const mesh = object;
        if ((mesh as any).material) {
            extractFromMaterial((mesh as any).material);
        }
    }
    return colors;
}
