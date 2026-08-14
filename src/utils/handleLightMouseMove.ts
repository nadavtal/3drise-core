// =============================================================================
// HANDLE LIGHT MOUSE MOVE — pointer-driven light property updates
// =============================================================================
//
// Sibling of handleLightAnimations. Same allowlist + per-light-type guards.
// Writes directly to the Three.js light instance.
//
import { Color } from 'three';
import type { Light } from 'three';
import { interpolateMouseMoveProperty } from './mouseMoveUtils';
import type { MouseMoveProperty } from "../types/objectSettings";
export interface LightMouseMoveContext {
    light: Light;
    /** Optional base values (e.g. config.intensity) used as fallback if we can't
     *  read the property off the live light. */
    lightConfig?: Record<string, any>;
}


const ANIMATABLE = new Set(['intensity', 'color', 'distance', 'decay', 'angle', 'penumbra']);
function readBase(light, property, config) {
    if (property === 'color') {
        return `#${light.color?.getHexString?.() ?? config?.color?.replace?.('#', '') ?? 'ffffff'}`;
    }
    const live = light[property];
    return live ?? config?.[property];
}
function applyLightProperty(light, property, value) {
    if (property === 'color') {
        const target = light.color;
        if (!target)
            return;
        if (value instanceof Color)
            target.copy(value);
        else
            target.set(value);
        return;
    }
    if (property in light) {
        light[property] = value;
    }
}
export function handleLightMouseMove(ctx: LightMouseMoveContext, properties: MouseMoveProperty[], pointer: {
            x: number;
            y: number;
        }): void {
    if (!properties.length)
        return;
    const { light, lightConfig } = ctx;
    for (const { property, enabled, propertySettings } of properties) {
        if (!property || !enabled)
            continue;
        if (!ANIMATABLE.has(property))
            continue;
        if ((property === 'distance' || property === 'decay' || property === 'angle' || property === 'penumbra') && !(property in light))
            continue;
        const { axis = 'both', sensitivity = 1, inverted = false, min, max } = propertySettings || {};
        const baseValue = readBase(light, property, lightConfig);
        if (baseValue === undefined)
            continue;
        const next = interpolateMouseMoveProperty(baseValue, min, max, pointer, axis, sensitivity, inverted);
        applyLightProperty(light, property, next);
    }
}
