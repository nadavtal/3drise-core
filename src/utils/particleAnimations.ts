import type { Points } from "three";

/** A ref box — React's RefObject satisfies it, so React callers pass their refs as-is. */
type RefBox<T> = { current: T };
export const handleShapeAnimation = (delta: number, speed: number, animationProgress: RefBox<number>, pointsRef: RefBox<Points | null>, basePositions: RefBox<Float32Array | null>, targetPositions: RefBox<Float32Array | null>): void => {
    if (!pointsRef.current || !basePositions.current)
        return;
    const progress = Math.min(animationProgress.current + delta * speed, 1);
    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position;
    if (targetPositions.current) {
        const galPos = targetPositions.current;
        for (let i = 0; i < basePositions.current.length; i += 3) {
            posAttr.array[i] = basePositions.current[i] + (galPos[i] - basePositions.current[i]) * progress;
            posAttr.array[i + 1] = basePositions.current[i + 1] + (galPos[i + 1] - basePositions.current[i + 1]) * progress;
            posAttr.array[i + 2] = basePositions.current[i + 2] + (galPos[i + 2] - basePositions.current[i + 2]) * progress;
        }
    }
    animationProgress.current = progress;
    posAttr.needsUpdate = true;
};
