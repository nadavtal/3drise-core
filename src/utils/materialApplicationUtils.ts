// =============================================================================
// MATERIAL APPLICATION UTILITIES — Shared Pure Functions
// =============================================================================
//
// Core material manipulation functions used by both:
// - useMaterialApplication (React render cycle, full material replacement)
// - useMaterialUniforms (direct ref manipulation, live property tweaking)
//
// These are pure utility functions — no React hooks, no state.
//
import { Color, Vector2 } from 'three';
import type { Object3D, Material } from 'three';
import MaterialRegistryAPI, { MaterialInstance } from '../services/MaterialRegistry';
import { textureResolver } from '../services/TextureResolver';
import { uniformConverter } from '../services/UniformConverter';
import { getType } from './dataUtils';
// Key stored on userData to track material instances
export const MATERIAL_INSTANCE_KEY = '_3driseMaterialInstance';
// Key placed on edges group userData to prevent material bleed-through
export const EDGES_GROUP_KEY = '__isEdgesGroup';
export const GEREATIVE_EFFECTS_KEY = '__isGenerativeEffectsGroup';
/**
 * Traverses obj and its descendants, skipping subtrees whose root is marked
 * with EDGES_GROUP_KEY or GEREATIVE_EFFECTS_KEY — unless obj itself carries that mark (so an edges group
 * or generative effects group can still apply its own material via useMaterialApplication).
 */
export function traverseSkippingEdgesAndEffects(obj: Object3D, isRoot: boolean, callback: (node: Object3D) => void): void {
    if (!isRoot && (obj.userData[EDGES_GROUP_KEY] || obj.userData[GEREATIVE_EFFECTS_KEY]))
        return;
    callback(obj);
    for (const child of obj.children) {
        traverseSkippingEdgesAndEffects(child, false, callback);
    }
}
// Known color property names on Three.js materials
const COLOR_PROPERTIES = new Set([
    'color', 'emissive', 'specular', 'sheenColor', 'specularColor', 'attenuationColor'
]);
/**
 * Create a fresh material instance for a variant and apply settings to it.
 */
export function createAndApplyMaterial(variant: string, resolvedSettings: Record<string, any>): MaterialInstance {
    const materialInstance = MaterialRegistryAPI.createMaterial(variant);
    MaterialRegistryAPI.applySettings(materialInstance.material, resolvedSettings);
    return materialInstance;
}
/**
 * Resolve texture URLs in settings to Three.js Texture objects.
 * Wraps TextureResolver.resolveSettings() with error handling.
 */
export async function resolveTextures(variant: string, settings: Record<string, any>): Promise<Record<string, any>> {
    try {
        return await textureResolver.resolveSettings(variant, settings);
    }
    catch (error) {
        console.error('[materialApplicationUtils] Failed to resolve textures:', error);
        return { ...settings };
    }
}
export function applySingleProperty(material: Material, key: string, value: any): void {
    const isShader = !!(material as any).uniforms;
    if (isShader) {
        const uniforms = (material as any).uniforms;
        if (uniforms[key]) {
            // console.log(`[applySingleProperty] Applying to shader uniform: ${key} =`, value);
            // For shader uniforms, use uniformConverter for proper type conversion
            const converted = uniformConverter.convertToUniforms({ [key]: value });
            // console.log(`[applySingleProperty] Converted uniform value:`, converted[key]);
            uniforms[key].value = converted[key] ?? value;
        }
    }
    else {
        // Standard material — need to convert types properly
        if (COLOR_PROPERTIES.has(key) && typeof value === 'string') {
            // Color property: must use Color object, not raw string
            const matProp = material[key];
            if (matProp && typeof matProp.set === 'function') {
                matProp.set(value); // Use .set() to preserve the Color instance
            }
            else {
                material[key] = new Color(value);
            }
        }
        else if (key === 'normalScale' && Array.isArray(value) && value.length === 2) {
            const matProp = material[key];
            if (matProp && typeof matProp.set === 'function') {
                matProp.set(value[0], value[1]);
            }
            else {
                material[key] = new Vector2(value[0], value[1]);
            }
        }
        else if (key in material) {
            material[key] = value;
        }
    }
    material.needsUpdate = true;
}
/**
 * Apply a color value to a material property.
 * Converts hex string to Color object and applies correctly.
 */
export function applyColorProperty(material: Material, key: string, hexValue: string): void {
    applySingleProperty(material, key, hexValue);
}
/**
 * Check if a settings key is a color property.
 */
export function isColorProperty(key: string): boolean {
    return COLOR_PROPERTIES.has(key);
}
/**
 * Check if a settings key is a texture/map property.
 */
export function isTextureProperty(key: string): boolean {
    const lower = key.toLowerCase();
    return lower.includes('map') || lower.includes('texture');
}
/**
 * Check if a settings key is a boolean property.
 */
export function isBooleanProperty(key: string, value: any): boolean {
    return typeof value === 'boolean';
}
/**
 * Check if a settings key is a numeric property suitable for a slider.
 */
export function isNumericProperty(key: string, value: any): boolean {
    return typeof value === 'number';
}
/**
 * Internal/meta fields that should never be shown in UI or applied to materials.
 */
export const INTERNAL_FIELDS: Set<string> = new Set([
    'materialType', 'materialVariant', 'handlers', 'apply',
    'uHasTexture', 'u_time', 'u_resolution', 'u_mouse',
]);
/**
 * Categorize a variant's settings into numeric, color, texture, boolean, and other groups.
 */
export function categorizeSettings(settings: Record<string, any>): {
        numeric: Array<{
            key: string;
            value: number;
        }>;
        colors: Array<{
            key: string;
            value: string;
        }>;
        textures: Array<{
            key: string;
            value: any;
        }>;
        booleans: Array<{
            key: string;
            value: boolean;
        }>;
        other: Array<{
            key: string;
            value: any;
        }>;
    } {
    const result = {
        numeric: [],
        colors: [],
        textures: [],
        booleans: [],
        other: [],
    };
    for (const [key, value] of Object.entries(settings)) {
        if (INTERNAL_FIELDS.has(key))
            continue;
        const type = getType(key, value);
        if (type === 'color') {
            result.colors.push({ key, value });
        }
        else if (type === 'texture') {
            result.textures.push({ key, value });
        }
        else if (type === 'checkbox') {
            result.booleans.push({ key, value });
        }
        else if (type === 'number') {
            result.numeric.push({ key, value });
        }
        else {
            result.other.push({ key, value });
        }
    }
    return result;
}
