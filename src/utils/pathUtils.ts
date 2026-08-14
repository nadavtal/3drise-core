import * as THREE from 'three';
import type { Vector3Array } from "../types/scene3d";

export const createCurves = (paths?: number[][] | null, pointsPaths?: THREE.Vector3[][] | null): THREE.CatmullRomCurve3[] => {
    const curves = [];
    if (paths && paths.length > 0) {
        paths.forEach((path) => {
            const points = [];
            for (let i = 0; i < path.length; i += 3) {
                points.push(new THREE.Vector3(path[i], path[i + 1], path[i + 2]));
            }
            curves.push(new THREE.CatmullRomCurve3(points));
        });
    }
    else if (pointsPaths && pointsPaths.length > 0) {
        pointsPaths.forEach((points) => {
            curves.push(new THREE.CatmullRomCurve3(points));
        });
    }
    return curves;
};
export const randomRange = (min: number, max: number): number => Math.random() * (max - min) + min;
/**
 * Smooths corners by adding interpolated points around each corner using quadratic bezier curves.
 * smoothness 0-100: 0 = sharp corners, 100 = maximum rounding
 */
export const smoothPathCorners = (points: Vector3Array[], smoothness: number): Vector3Array[] => {
    if (points.length < 3 || smoothness <= 0)
        return points;
    const result = [];
    const cutRatio = (smoothness / 100) * 0.4;
    result.push(points[0]);
    for (let i = 1; i < points.length - 1; i++) {
        const prev = new THREE.Vector3(...points[i - 1]);
        const curr = new THREE.Vector3(...points[i]);
        const next = new THREE.Vector3(...points[i + 1]);
        const distPrev = curr.distanceTo(prev);
        const distNext = curr.distanceTo(next);
        const cut = Math.min(distPrev * cutRatio, distNext * cutRatio);
        const dirToPrev = new THREE.Vector3().subVectors(prev, curr).normalize();
        const dirToNext = new THREE.Vector3().subVectors(next, curr).normalize();
        const beforeCorner = new THREE.Vector3().copy(curr).addScaledVector(dirToPrev, cut);
        const afterCorner = new THREE.Vector3().copy(curr).addScaledVector(dirToNext, cut);
        const numArcPoints = Math.max(3, Math.floor(smoothness / 10));
        for (let j = 0; j <= numArcPoints; j++) {
            const t = j / numArcPoints;
            const u = 1 - t;
            result.push([
                u * u * beforeCorner.x + 2 * u * t * curr.x + t * t * afterCorner.x,
                u * u * beforeCorner.y + 2 * u * t * curr.y + t * t * afterCorner.y,
                u * u * beforeCorner.z + 2 * u * t * curr.z + t * t * afterCorner.z,
            ]);
        }
    }
    result.push(points[points.length - 1]);
    return result;
};
/**
 * Creates a CatmullRomCurve3 spline from points.
 * curve 1-100: 1 = sharp/tight, 100 = smoothest
 */
export const createPathSpline = (points: Vector3Array[], curve: number): THREE.CatmullRomCurve3 | null => {
    if (points.length < 2)
        return null;
    const threePoints = points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    const tension = curve > 1 ? 0.5 - ((curve - 1) / 99) * 0.5 : 0.5;
    return new THREE.CatmullRomCurve3(threePoints, false, 'catmullrom', tension);
};
/**
 * Samples evenly-spaced points along a spline for rendering.
 */
export const sampleSplinePoints = (spline: THREE.CatmullRomCurve3, numPoints: number): Vector3Array[] => {
    const divisions = Math.max(numPoints * 10, 50);
    return spline.getPoints(divisions).map(p => [p.x, p.y, p.z]);
};
