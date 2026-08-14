/**
 * MaterialCompiler - Deferred material shader compilation
 *
 * This service handles compiling material assets' shaders and registering them
 * with the MaterialRegistry. It's designed to be called lazily (e.g., when
 * entering Studio) rather than on user data fetch.
 */
import { createCustomShaderMaterial } from "../shaders/CustomShaderMaterial";
import { MaterialRegistryAPI } from "../services/MaterialRegistry";
import { uniformConverter } from "../services/UniformConverter";
import { createUniformsText } from "./utils";
import type { UniformDefinition } from "../types/types";
import type { Asset } from "../types/users";
export interface MaterialAsset extends Asset {
    uniforms: UniformDefinition[];
    vertex: string;
    fragment: string;
}


// Track which materials have been compiled to avoid recompilation
const compiledMaterials = new Set();
``;
/**
 * Check if an asset is a compilable material asset
 */
export function isMaterialAsset(asset: Asset): asset is MaterialAsset {
    return (asset.type === 'material' &&
        Array.isArray(asset.uniforms) &&
        typeof asset.vertex === 'string' &&
        typeof asset.fragment === 'string');
}
/**
 * Compile a single material asset and register it with MaterialRegistry
 * Returns true if compilation was successful, false if skipped or failed
 */
export function compileMaterialAsset(asset: MaterialAsset): boolean {
    // Skip if already compiled
    if (compiledMaterials.has(asset.id)) {
        return false;
    }
    try {
        const compiledShaders = {
            vertex: createUniformsText(asset.uniforms) + '\n' + asset.vertex,
            fragment: createUniformsText(asset.uniforms) + '\n' + asset.fragment
        };
        const settings = {};
        asset.uniforms.forEach((uniform) => {
            settings[uniform.name] = uniform.defaultValue;
        });
        const uniforms = uniformConverter.convertToUniforms(settings);
        const material = createCustomShaderMaterial({
            uniforms,
            vertexShader: compiledShaders.vertex,
            fragmentShader: compiledShaders.fragment
        });
        const variant = {
            name: asset.name,
            description: asset.description || '',
            materialClass: material,
            defaultSettings: settings,
        };
        MaterialRegistryAPI.addCustomMaterial(variant);
        compiledMaterials.add(asset.id);
        console.log(`[MaterialCompiler] Compiled material: ${asset.name}`);
        return true;
    }
    catch (error) {
        console.error(`[MaterialCompiler] Failed to compile material ${asset.name}:`, error);
        return false;
    }
}
/**
 * Compile all material assets from an array of assets
 * Returns the count of newly compiled materials
 */
export function compileAllMaterialAssets(assets: Asset[]): number {
    let compiledCount = 0;
    for (const asset of assets) {
        if (isMaterialAsset(asset)) {
            if (compileMaterialAsset(asset)) {
                compiledCount++;
            }
        }
    }
    console.log(`[MaterialCompiler] Compiled ${compiledCount} new materials`);
    return compiledCount;
}
/**
 * Check if a material has already been compiled
 */
export function isMaterialCompiled(assetId: string): boolean {
    return compiledMaterials.has(assetId);
}
/**
 * Clear compiled materials cache (useful for testing or reloading)
 */
export function clearCompiledMaterials(): void {
    compiledMaterials.clear();
}
