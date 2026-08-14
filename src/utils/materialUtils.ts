import * as THREE from "three";
import { Color, MathUtils, Vector2, Vector3 } from "three";
import type { Object3D } from 'three';
import { getType } from "./dataUtils";
import { applySingleProperty } from "./materialApplicationUtils";
import type { MaterialSettings } from "../types/materials";

/**
 * Updates materials on a mesh to use environment mapping
 */
export const updateMeshMaterials = (mesh: THREE.Mesh, environment: THREE.Texture | null, envMapIntensity: number = 1): void => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach(material => {
        if (material instanceof THREE.MeshStandardMaterial ||
            material instanceof THREE.MeshPhysicalMaterial) {
            material.envMap = environment;
            material.envMapIntensity = envMapIntensity;
            material.needsUpdate = true;
        }
    });
};
/**
 * Sets up reflective properties on materials
 */
export const setupReflectiveMaterial = (material: THREE.Material): void => {
    if (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial) {
        // Set metalness and roughness for better reflections if not already set
        if (material.metalness === undefined || material.metalness === 0) {
            material.metalness = 0.5;
        }
        if (material.roughness === undefined || material.roughness === 1) {
            material.roughness = 0.3;
        }
        // Increase environment map intensity
        material.envMapIntensity = 1.5;
        material.needsUpdate = true;
    }
};
/**
 * Traverses scene and updates all materials with environment mapping
 */
export const updateSceneMaterials = (scene: THREE.Scene, environment: THREE.Texture | null, setupReflective: boolean = false): void => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            updateMeshMaterials(child, environment);
            if (setupReflective) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(setupReflectiveMaterial);
            }
        }
    });
};
/**
 * Checks if a material supports environment mapping
 */
export const supportsEnvironmentMapping = (material: THREE.Material): boolean => {
    return material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhysicalMaterial;
};
/**
 * Known color property names on Three.js materials.
 * These must be converted from hex strings to Color objects.
 */
const COLOR_PROPERTIES = new Set([
    'color', 'emissive', 'specular', 'sheenColor', 'specularColor', 'attenuationColor'
]);
/**
 * Known Vector2 property names on Three.js materials.
 * These must be converted from [x, y] arrays to Vector2 objects.
 */
const VECTOR2_PROPERTIES = new Set([
    'normalScale'
]);
export const settingsToProps = (settings: MaterialSettings): any => {
    const props = {};
    Object.keys(settings).forEach(key => {
        if (key === 'materialName' || key === 'varianName') {
            return; // Skip UI-only properties
        }
        const value = settings[key];
        // Convert color strings to Three.js Color objects
        if (COLOR_PROPERTIES.has(key) && typeof value === 'string') {
            props[key] = new Color(value);
        }
        // Convert [x, y] arrays to Vector2 for normalScale etc.
        else if (VECTOR2_PROPERTIES.has(key) && Array.isArray(value) && value.length === 2) {
            props[key] = new THREE.Vector2(value[0], value[1]);
        }
        else {
            props[key] = value;
        }
    });
    return props;
};
// =============================================================================
// ANIMATION UTILITIES
// =============================================================================
// Pure utility functions for animation calculations and material property access.
// Used by both handleTransformEffects and handleMaterialEffects.
export const DEBUG_MATERIAL_ANIMATION = false;
const logAnim = (message, ...args) => {
    if (DEBUG_MATERIAL_ANIMATION) {
        console.log(`[MaterialAnimation] ${message}`, ...args);
    }
};
/**
 * Calculate animation progress with yoyo/loop support.
 * @param currentTime - Current timestamp (Date.now())
 * @param duration - Animation duration in milliseconds
 * @param yoyo - Whether to reverse direction at end
 * @param loop - Whether to loop continuously
 * @returns Progress value between 0 and 1
 */
export const calculateTimeProgress = (currentTime: number, duration: number, yoyo: boolean, loop: boolean): number => {
    const animationSpeed = 1000 / duration;
    const rawProgress = currentTime * animationSpeed * 0.001;
    if (yoyo) {
        const cycleProgress = rawProgress % 1;
        return Math.sin(cycleProgress * Math.PI * 2) * 0.5 + 0.5;
    }
    if (loop) {
        return rawProgress % 1;
    }
    return Math.min(rawProgress, 1);
};
/**
 * Animate system uniforms (u_time, u_mouse, u_camera_position) on children with materials.
 */
export const animateUniforms = (children: any[], time: number, mouse: {
            x: number;
            y: number;
        }, cameraPosition?: {
            x: number;
            y: number;
            z: number;
        }): void => {
    // console.log("animateUniforms", { time, mouse, cameraPosition });
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.material?.uniforms?.u_time) {
            child.material.uniforms.u_time.value = time;
            // console.log("u_time", child.material.uniforms.u_time.value);
        }
        if (child.material?.uniforms?.u_mouse) {
            child.material.uniforms.u_mouse.value = new Vector2(mouse.x, mouse.y);
        }
        if (child.material?.uniforms?.u_camera_position && cameraPosition) {
            const val = child.material.uniforms.u_camera_position.value;
            if (val && typeof val.set === "function") {
                val.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
            }
            else {
                child.material.uniforms.u_camera_position.value = new Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
            }
        }
    }
};
/**
 * Get current value of a material property from an object.
 * Traverses children to find first material with the property.
 */
export function getMaterialPropertyValue(object: Object3D, property: string): any {
    let value = null;
    object.traverse((child) => {
        if ((child as any).material && value === null) {
            // Check shader uniforms first
            if ((child as any).material.uniforms?.[property]) {
                value = (child as any).material.uniforms[property].value;
            }
            // Then check direct material properties
            else if (property in (child as any).material) {
                const matValue = (child as any).material[property];
                // Convert Color to hex string for consistency
                if (matValue instanceof Color) {
                    value = "#" + matValue.getHexString();
                }
                else if (matValue instanceof Vector2) {
                    value = [matValue.x, matValue.y];
                }
                else if (matValue instanceof Vector3) {
                    value = [matValue.x, matValue.y, matValue.z];
                }
                else {
                    value = matValue;
                }
            }
        }
    });
    logAnim("getMaterialPropertyValue", { property, value });
    return value;
}
/**
 * Interpolate between two color values.
 * Accepts hex strings or Color objects.
 */
export function interpolateColor(from: string | Color, to: string | Color, progress: number): string {
    const fromColor = from instanceof Color ? from : new Color(from);
    const toColor = to instanceof Color ? to : new Color(to);
    const r = MathUtils.lerp(fromColor.r, toColor.r, progress);
    const g = MathUtils.lerp(fromColor.g, toColor.g, progress);
    const b = MathUtils.lerp(fromColor.b, toColor.b, progress);
    return "#" + new Color(r, g, b).getHexString();
}
/**
 * Interpolate between two Vector2 values.
 */
export function interpolateVector2(from: [number, number], to: [number, number], progress: number): [number, number] {
    return [
        MathUtils.lerp(from[0], to[0], progress),
        MathUtils.lerp(from[1], to[1], progress),
    ];
}
/**
 * Interpolate between two Vector3 values.
 */
export function interpolateVector3(from: [number, number, number], to: [number, number, number], progress: number): [number, number, number] {
    return [
        MathUtils.lerp(from[0], to[0], progress),
        MathUtils.lerp(from[1], to[1], progress),
        MathUtils.lerp(from[2], to[2], progress),
    ];
}
/**
 * Interpolate value based on detected type using getType.
 * @param property - Property name for type detection
 * @param from - Start value
 * @param to - End value
 * @param progress - Interpolation progress (0-1)
 * @returns Interpolated value
 */
export function interpolateValue(property: string, from: any, to: any, progress: number): any {
    // Use getType to detect property type
    const type = getType(property, from);
    logAnim("interpolateValue", { property, type, from, to, progress });
    switch (type) {
        case "color":
            return interpolateColor(from, to, progress);
        case "vector2":
            if (Array.isArray(from) && Array.isArray(to)) {
                return interpolateVector2((from as any), (to as any), progress);
            }
            return MathUtils.lerp(Number(from), Number(to), progress);
        case "vector3":
            if (Array.isArray(from) && Array.isArray(to)) {
                return interpolateVector3((from as any), (to as any), progress);
            }
            return MathUtils.lerp(Number(from), Number(to), progress);
        case "number":
        default:
            return MathUtils.lerp(Number(from), Number(to), progress);
    }
}
/**
 * Apply a material property value to all children with materials.
 * Uses applySingleProperty from materialApplicationUtils.
 */
export function applyMaterialPropertyToObject(object: Object3D, property: string, value: any): void {
    object.traverse((child) => {
        if ((child as any).material) {
            applySingleProperty((child as any).material, property, value);
        }
    });
    logAnim("applyMaterialPropertyToObject", { property, value });
}
/**
 * Cache all children with materials to avoid traverse() every frame.
 */
export function cacheChildrenWithMaterials(object: Object3D): any[] {
    const children = [];
    object.traverse((child) => {
        if ((child as any).material) {
            children.push(child);
        }
    });
    return children;
}
