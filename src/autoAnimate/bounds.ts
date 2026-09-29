import type { Bounds, V3 } from './types';

export function makeBounds(min: V3, max: V3): Bounds {
    const size: V3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    const center: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    return { min, max, center, size, radius: Math.hypot(size[0], size[1], size[2]) / 2 };
}

export function boundsAround(center: V3, half: V3): Bounds {
    return makeBounds(
        [center[0] - half[0], center[1] - half[1], center[2] - half[2]],
        [center[0] + half[0], center[1] + half[1], center[2] + half[2]],
    );
}

export function unionBounds(list: Bounds[]): Bounds | null {
    if (!list.length) return null;
    const min: V3 = [Infinity, Infinity, Infinity];
    const max: V3 = [-Infinity, -Infinity, -Infinity];
    for (const b of list) {
        for (let i = 0; i < 3; i++) {
            min[i] = Math.min(min[i], b.min[i]);
            max[i] = Math.max(max[i], b.max[i]);
        }
    }
    return makeBounds(min, max);
}

export const distance = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export const EMPTY_BOUNDS: Bounds = makeBounds([-1, -1, -1], [1, 1, 1]);
