// =============================================================================
// HANDLE TRANSFORM MOUSE MOVE — pointer-driven transform property updates
// =============================================================================
//
// Sibling of handleEdgesMouseMove / handleMaterialMouseMove / handleLightMouseMove.
// Mutates object.position / rotation / scale based on pointer + min/max settings
// stored in each MouseMoveProperty.
//
import { interpolateMouseMoveProperty } from './mouseMoveUtils';
import { Object3D } from "three";
import type { MouseMoveProperty } from "../types/objectSettings";
export interface TransformMouseMoveContext {
    object: Object3D;
    meshSettings?: Record<string, any>;
}


export const TRANSFORM_PROPS: readonly ["position", "rotation", "scale"] = ['position', 'rotation', 'scale'];
export function isTransformProperty(property: string): boolean {
    const head = property.split('.')[0];
    return TRANSFORM_PROPS.includes((head as any));
}
function applyTransformProperty(object, property, value) {
    const [prop, axis] = property.split('.');
    const target = object[prop];
    if (!target)
        return;
    if (axis) {
        target[axis] = value;
        return;
    }
    if (Array.isArray(value) && value.length >= 3) {
        target.set(value[0], value[1], value[2]);
        return;
    }
    if (typeof value === 'number') {
        target.set(value, value, value);
    }
}
export function handleTransformMouseMove(ctx: TransformMouseMoveContext, properties: MouseMoveProperty[], pointer: {
            x: number;
            y: number;
        }): void {
    if (!properties.length)
        return;
    const { object, meshSettings } = ctx;
    for (const { property, enabled, propertySettings } of properties) {
        if (!property || !enabled)
            continue;
        if (!isTransformProperty(property))
            continue;
        const { axis = 'both', sensitivity = 1, inverted = false, min, max } = propertySettings || {};
        const head = property.split('.')[0];
        const baseValue = meshSettings?.[property] ?? object[head];
        if (baseValue === undefined)
            continue;
        const next = interpolateMouseMoveProperty(baseValue, min, max, pointer, axis, sensitivity, inverted);
        applyTransformProperty(object, property, next);
    }
}
