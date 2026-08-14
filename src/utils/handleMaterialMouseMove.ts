// =============================================================================
// HANDLE MATERIAL MOUSE MOVE — pointer-driven material property updates
// =============================================================================
import { applyMaterialPropertyToObject } from './materialUtils';
import { interpolateMouseMoveProperty } from './mouseMoveUtils';
import { Object3D } from "three";
import type { MouseMoveProperty } from "../types/objectSettings";
export interface MaterialMouseMoveContext {
    object: Object3D;
    materialSettings?: Record<string, any>;
}


export function handleMaterialMouseMove(ctx: MaterialMouseMoveContext, properties: MouseMoveProperty[], pointer: {
            x: number;
            y: number;
        }): void {
    if (!properties.length)
        return;
    const { object, materialSettings } = ctx;
    for (const { property, enabled, propertySettings } of properties) {
        if (!property || !enabled)
            continue;
        const { axis = 'both', sensitivity = 1, inverted = false, min, max } = propertySettings || {};
        const baseValue = materialSettings?.[property];
        if (baseValue === undefined)
            continue;
        const next = interpolateMouseMoveProperty(baseValue, min, max, pointer, axis, sensitivity, inverted);
        applyMaterialPropertyToObject(object, property, next);
    }
}
