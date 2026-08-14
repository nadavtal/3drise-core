// =============================================================================
// mouseMoveUtils — shared pointer-based interpolation primitives
// =============================================================================
//
// Extracted from useMouseHandlers (viewer) so all four per-domain mouseMove
// handlers (transform / material / edges / light) share one math implementation.
//
import { Color, MathUtils } from 'three';
export type PointerAxis = 'x' | 'y' | 'both';

/**
 * Lerp between min/max based on a normalized [-1, 1] multiplier. Handles
 * numbers, hex color strings, and Vector3-like arrays.
 */
export function getInterpolatedValue(baseValue: any, minValue: any, maxValue: any, multiplier: number, sensitivity: number = 1): any {
    const normalizedMultiplier = (multiplier + 1) / 2;
    const finalMultiplier = Math.max(0, Math.min(1, normalizedMultiplier * sensitivity));
    if ((typeof minValue === 'string' && minValue.startsWith('#')) ||
        (typeof maxValue === 'string' && maxValue.startsWith('#'))) {
        const minColor = new Color(minValue);
        const maxColor = new Color(maxValue);
        const minArr = minColor.toArray();
        const maxArr = maxColor.toArray();
        const interpolated = minArr.map((min, i) => MathUtils.lerp(min, maxArr[i], finalMultiplier));
        return new Color().fromArray(interpolated);
    }
    if (Array.isArray(minValue) && Array.isArray(maxValue) && minValue.length === 3) {
        return [
            MathUtils.lerp(minValue[0], maxValue[0], finalMultiplier),
            MathUtils.lerp(minValue[1], maxValue[1], finalMultiplier),
            MathUtils.lerp(minValue[2], maxValue[2], finalMultiplier),
        ];
    }
    if (typeof minValue === 'number' && typeof maxValue === 'number') {
        return MathUtils.lerp(minValue, maxValue, finalMultiplier);
    }
    return baseValue;
}
/**
 * Combine pointer + axis + sensitivity + inverted into a single interpolated
 * value. Convenience wrapper for the four mouseMove handlers.
 */
export function interpolateMouseMoveProperty(baseValue: any, minValue: any, maxValue: any, pointer: {
            x: number;
            y: number;
        }, axis: PointerAxis = 'both', sensitivity: number = 1, inverted: boolean = false): any {
    let multiplier = 0;
    if (axis === 'x')
        multiplier = pointer.x;
    if (axis === 'y')
        multiplier = pointer.y;
    if (axis === 'both')
        multiplier = (pointer.x + pointer.y) / 2;
    if (inverted)
        multiplier *= -1;
    return getInterpolatedValue(baseValue, minValue, maxValue, multiplier, sensitivity);
}
