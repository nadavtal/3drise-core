// =============================================================================
// HANDLE EDGES MOUSE MOVE — pointer-driven edges material property updates
// =============================================================================
//
// Sibling of handleEdgesAnimations. Finds the edges group attached to the
// object and applies pointer-interpolated values to its material. Geometric
// properties (tubeRadius, cubeSize) require a geometry rebuild and are
// intentionally skipped for per-frame application.
//
import { applyMaterialPropertyToObject } from './materialUtils';
import { EDGES_GROUP_KEY } from './materialApplicationUtils';
import { interpolateMouseMoveProperty } from './mouseMoveUtils';
import { Object3D } from "three";
import type { MouseMoveProperty } from "../types/objectSettings";
export interface EdgesMouseMoveContext {
    object: Object3D;
    /** Optional pre-resolved edges materialSettings used for base-value lookup. */
    edgesMaterialSettings?: Record<string, any>;
}


function findEdgesGroup(object) {
    for (const child of object.children) {
        if (child.userData?.[EDGES_GROUP_KEY])
            return child;
    }
    return null;
}
export function handleEdgesMouseMove(ctx: EdgesMouseMoveContext, properties: MouseMoveProperty[], pointer: {
            x: number;
            y: number;
        }): void {
    if (!properties.length)
        return;
    const edgesGroup = findEdgesGroup(ctx.object);
    if (!edgesGroup)
        return;
    for (const { property, enabled, propertySettings } of properties) {
        if (!property || !enabled)
            continue;
        if (property === 'tubeRadius' || property === 'cubeSize')
            continue;
        const { axis = 'both', sensitivity = 1, inverted = false, min, max } = propertySettings || {};
        const baseValue = ctx.edgesMaterialSettings?.[property];
        if (baseValue === undefined)
            continue;
        const next = interpolateMouseMoveProperty(baseValue, min, max, pointer, axis, sensitivity, inverted);
        applyMaterialPropertyToObject(edgesGroup, property, next);
    }
}
