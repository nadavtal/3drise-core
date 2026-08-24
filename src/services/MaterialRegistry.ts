// =============================================================================
// MATERIAL REGISTRY - UNIFIED MATERIAL MANAGEMENT SYSTEM
// =============================================================================
import { FrontSide, ShaderMaterial } from 'three';
import type { Material } from 'three';
import { uniformConverter } from './UniformConverter';
import { settingsToProps } from '../utils/materialUtils';
import { compileShaders } from '../utils/utils';
import materials from '../data/allMaterials';
import type { UniformDefinition } from "../types/types";
import { MaterialType } from "../types";
export interface ShaderSource {
    vertex: string;
    fragment: string;
    uniforms: UniformDefinition[];
}

export interface MaterialVariant {
    name: string;
    description: string;
    materialClass: any;
    defaultSettings?: Record<string, any>;
    useCases?: string[];
    textureProperties?: string[];
    _shaderSource?: ShaderSource;
}

export interface MaterialDefinition {
    name: string;
    description: string;
    defaultVariant: string;
    useCases?: string[];
    variants: Record<string, MaterialVariant>;
}

export interface UniformInfo {
    value: any;
    type: 'float' | 'vec2' | 'vec3' | 'color' | 'texture' | 'boolean' | 'int';
    min?: number;
    max?: number;
    step?: number;
}

export interface MaterialInstance {
    material: Material;
    settings: Record<string, any>;
    uniforms: Record<string, UniformInfo>;
    type: MaterialType;
    variant: string;
}


// =============================================================================
// MATERIAL REGISTRY
// =============================================================================
const MaterialRegistry: Record<MaterialType, MaterialDefinition> = materials;
// =============================================================================
// UNIFORM DISCOVERY UTILITIES
// =============================================================================
/**
 * Discover uniforms from a material instance
 */
function getUniforms(material) {
    const uniforms = {};
    if (material.uniforms) {
        const shaderUniforms = material.uniforms;
        Object.keys(shaderUniforms).forEach(key => {
            const uniform = shaderUniforms[key];
            uniforms[key] = {
                value: uniform.value,
                type: inferUniformType(key, uniform.value)
            };
        });
    }
    // Handle standard Three.js materials
    return uniforms;
}
/**
 * Infer uniform type from key name and value
 */
function inferUniformType(key, value) {
    // Type inference based on key name patterns
    if (key.toLowerCase().includes('color'))
        return 'color';
    if (key.toLowerCase().includes('texture') || key.toLowerCase().includes('map'))
        return 'texture';
    if (typeof value === 'boolean')
        return 'boolean';
    if (typeof value === 'number')
        return 'float';
    if (value && typeof value === 'object') {
        if (value.x !== undefined && value.y !== undefined) {
            if (value.z !== undefined)
                return 'vec3';
            return 'vec2';
        }
    }
    return 'float';
}
// =============================================================================
// MATERIAL FACTORY — Direct Creation (No Pool)
// =============================================================================
//
// Materials are created fresh each time. This is intentional:
// - `new MeshStandardMaterial()` is very cheap (just sets JS properties)
// - Three.js internally caches compiled shader programs (WebGLPrograms)
// - A pool with settings-based keys almost never gets cache hits in practice
// - Shared pooled materials cause mutation bugs when settings differ per object
// - Disposal is handled by the consumer (useMaterialApplication cleanup)
//
/**
 * Create a fresh Three.js material instance for the given type + variant.
 * The material gets `transparent: true` and `side: DoubleSide` by default.
 */
function createMaterialInstance(type, variant) {
    const actualVariant = variant || MaterialRegistry[type].defaultVariant;
    const variantDef = MaterialRegistry[type].variants[actualVariant];
    if (!variantDef) {
        throw new Error(`Unknown variant "${actualVariant}" for material type "${type}"`);
    }
    let material;
    // Handle user shader variants (no materialClass, has _shaderSource)
    if (!variantDef.materialClass && variantDef._shaderSource) {
        const { vertex, fragment, uniforms: uniformDefs } = variantDef._shaderSource;
        const compiled = compileShaders(uniformDefs, vertex, fragment);
        // Build default settings from uniform definitions
        const defaultSettings = {};
        uniformDefs.forEach((u) => {
            defaultSettings[u.name] = u.defaultValue;
        });
        const convertedUniforms = uniformConverter.convertToUniforms(defaultSettings);
        const threeUniforms = {};
        Object.keys(convertedUniforms).forEach(key => {
            threeUniforms[key] = { value: convertedUniforms[key] };
        });
        material = new ShaderMaterial({
            vertexShader: compiled.vertex,
            fragmentShader: compiled.fragment,
            uniforms: threeUniforms,
            transparent: true,
            side: FrontSide,
        });
    }
    else {
        material = new variantDef.materialClass();
    }
    material.transparent = true;
    material.side = FrontSide;
    return material;
}
// =============================================================================
// EXPORTS
// =============================================================================
export const MaterialRegistryAPI = {
    // Get available types
    getTypes() {
        return Object.keys(MaterialRegistry);
    },
    // Get variants for a type
    getVariants(type) {
        if (type) {
            return Object.keys(MaterialRegistry[type].variants);
        }
        const allVariants = [];
        for (const typeKey in MaterialRegistry) {
            const typeVariants = Object.keys(MaterialRegistry[typeKey].variants);
            allVariants.push(...typeVariants);
        }
        return allVariants;
    },
    getMaterialByMaterialClass(materialClass) {
        for (const typeKey in MaterialRegistry) {
            const type = typeKey;
            const variants = MaterialRegistry[type].variants;
            for (const variantKey in variants) {
                const variant = variants[variantKey];
                const typeOfVariant = typeof variant.materialClass;
                if (typeOfVariant === materialClass) {
                    return variant;
                }
            }
        }
        return null;
    },
    // Get type definition
    getTypeDefinition(type) {
        return MaterialRegistry[type];
    },
    // Get variant definition
    getVariantDefinition(variant) {
        const type = this.getTypeFromVariantName(variant);
        if (!type) {
            throw new Error(`Unknown material variant "${variant}"`);
        }
        return MaterialRegistry[type].variants[variant];
    },
    getTypeFromVariantName(variantName) {
        for (const typeKey in MaterialRegistry) {
            const type = typeKey;
            if (Object.prototype.hasOwnProperty.call(MaterialRegistry[type].variants, variantName)) {
                return type;
            }
        }
        return null;
    },
    /**
     * Get texture properties for a material variant from the registry definition.
     * Returns the explicitly defined textureProperties array, or falls back to
     * heuristic detection from defaultSettings keys containing 'map' or 'texture'.
     */
    getTextureProperties(variant) {
        const type = this.getTypeFromVariantName(variant);
        if (!type) {
            return [];
        }
        const variantDef = MaterialRegistry[type].variants[variant];
        if (!variantDef) {
            return [];
        }
        // Prefer explicitly defined textureProperties
        if (variantDef.textureProperties && variantDef.textureProperties.length > 0) {
            return variantDef.textureProperties;
        }
        // Fallback: infer from defaultSettings keys
        if (!variantDef.defaultSettings) {
            return [];
        }
        return Object.keys(variantDef.defaultSettings).filter(key => {
            const lowerKey = key.toLowerCase();
            return lowerKey.includes('map') || lowerKey.includes('texture');
        });
    },
    /**
     * Get available color properties for a material variant
     * Returns property paths like ['color'], ['color', 'specular', 'emissive'], or ['uniforms.uColor']
     */
    getColorProperties(variant) {
        const type = this.getTypeFromVariantName(variant);
        if (!type) {
            return ['color']; // Default fallback
        }
        const variantDef = MaterialRegistry[type].variants[variant];
        if (!variantDef?.defaultSettings) {
            return ['color'];
        }
        const colorProps = [];
        const settings = variantDef.defaultSettings;
        for (const key in settings) {
            const lowerKey = key.toLowerCase();
            // Check for color-related keys
            if (lowerKey.includes('color') && !lowerKey.includes('colormap')) {
                // For shader materials with uniforms (keys starting with 'u')
                if (key.startsWith('u') && key.length > 1 && key[1] === key[1].toUpperCase()) {
                    colorProps.push(`uniforms.${key}`);
                }
                else {
                    colorProps.push(key);
                }
            }
            // Also check for specular and emissive which are color properties
            if (lowerKey === 'specular' || lowerKey === 'emissive') {
                colorProps.push(key);
            }
        }
        // Ensure at least 'color' is returned
        if (colorProps.length === 0) {
            colorProps.push('color');
        }
        return colorProps;
    },
    // Create a fresh material instance with uniform discovery.
    // Each call creates a new material — no pooling, no shared state.
    // Disposal is the caller's responsibility (e.g., useMaterialApplication cleanup).
    createMaterial(variant) {
        const type = this.getTypeFromVariantName(variant);
        if (!type) {
            throw new Error(`Unknown material variant "${variant}"`);
        }
        const material = createMaterialInstance(type, variant);
        const uniforms = getUniforms(material);
        const materialSettings = this.getVariantDefinition(variant).defaultSettings || {};
        return {
            material,
            uniforms,
            settings: materialSettings,
            type,
            variant
        };
    },
    // Update material uniforms
    updateUniforms(materialInstance, newUniforms) {
        const { material } = materialInstance;
        Object.keys(newUniforms).forEach(key => {
            // Skip internal MaterialRegistry properties
            if (key === 'materialType' || key === 'materialVariant' || key === 'handlers') {
                return;
            }
            if (material.uniforms && material.uniforms[key]) {
                material.uniforms[key].value = newUniforms[key];
            }
            else if (key in material) {
                // Standard material property - check if property exists on material
                material[key] = newUniforms[key];
            }
        });
        material.needsUpdate = true;
    },
    applySettings(material, settings) {
        const isShader = !!material.uniforms;
        let converted = { ...settings };
        if (isShader) {
            converted = uniformConverter.convertToUniforms(settings);
        }
        else {
            converted = settingsToProps(settings);
        }
        Object.keys(converted).forEach(key => {
            // Skip internal MaterialRegistry properties
            if (key === 'materialType' || key === 'materialVariant' || key === 'handlers') {
                return;
            }
            if (isShader && material.uniforms[key]) {
                material.uniforms[key].value = converted[key];
                if (key.toLowerCase().includes('texture') && converted[key] !== null && material.uniforms.uHasTexture) {
                    material.uniforms.uHasTexture.value = true;
                }
            }
            else if (key in material) {
                material[key] = converted[key];
            }
        });
        material.needsUpdate = true;
    },
    // Dispose a material directly. No pool — just call dispose().
    releaseMaterial(materialInstance) {
        if (materialInstance?.material) {
            materialInstance.material.dispose();
        }
    },
    addCustomMaterial(variant) {
        if (MaterialRegistry.particles.variants[variant.name]) {
            throw new Error(`Custom material variant "${variant.name}" already exists.`);
        }
        MaterialRegistry.particles.variants[variant.name] = {
            name: variant.name,
            description: `Custom shader material "${variant.name}"`,
            materialClass: variant.materialClass,
            defaultSettings: variant.defaultSettings
        };
    },
    /**
     * Register a user-created shader asset as a variant under the 'shaders' type.
     * If a variant with the same name already exists, it will be updated.
     */
    registerUserShader(asset) {
        if (!asset.name || !asset.vertex || !asset.fragment || !asset.uniforms) {
            console.warn(`[MaterialRegistry] Cannot register shader "${asset.name}" — missing vertex, fragment, or uniforms.`);
            return;
        }
        // Build defaultSettings from uniform definitions
        const defaultSettings = {};
        asset.uniforms.forEach((u) => {
            defaultSettings[u.name] = u.defaultValue;
        });
        MaterialRegistry.shaders.variants[asset.name] = {
            name: asset.name,
            description: asset.description || `User shader "${asset.name}"`,
            materialClass: null,
            defaultSettings,
            _shaderSource: {
                vertex: asset.vertex,
                fragment: asset.fragment,
                uniforms: asset.uniforms,
            }
        };
        // Set as default variant if it's the first one
        if (!MaterialRegistry.shaders.defaultVariant) {
            MaterialRegistry.shaders.defaultVariant = asset.name;
        }
        console.log(`[MaterialRegistry] Registered user shader: "${asset.name}"`);
    },
    /**
     * Unregister a user-created shader variant by name.
     */
    unregisterUserShader(name) {
        if (MaterialRegistry.shaders.variants[name]) {
            delete MaterialRegistry.shaders.variants[name];
            // Update defaultVariant if we removed it
            if (MaterialRegistry.shaders.defaultVariant === name) {
                const remaining = Object.keys(MaterialRegistry.shaders.variants);
                MaterialRegistry.shaders.defaultVariant = remaining.length > 0 ? remaining[0] : '';
            }
            console.log(`[MaterialRegistry] Unregistered user shader: "${name}"`);
        }
    },
    /**
     * Get all registered user shader variant names.
     */
    getUserShaderVariants() {
        return Object.keys(MaterialRegistry.shaders.variants);
    },
    // =========================================================================
    // DATABASE-BACKED SHADERS
    // =========================================================================
    /**
     * Register (or update) a material type bucket from the `material_types` table.
     * Types whose variants are implemented in code keep the variants they already
     * have — only the metadata is refreshed.
     */
    registerMaterialType(type) {
        const slug = type.slug;
        if (!slug) {
            console.warn('[MaterialRegistry] Cannot register material type without a slug.');
            return;
        }
        const existing = MaterialRegistry[slug];
        MaterialRegistry[slug] = {
            name: type.name || existing?.name || slug,
            description: type.description || existing?.description || '',
            defaultVariant: type.defaultVariant || existing?.defaultVariant || '',
            useCases: type.useCases || existing?.useCases || [],
            variants: existing?.variants || {},
        };
    },
    /**
     * Register a shader row from the `shaders` table as a variant of its material type.
     *
     * `chunks` are the resolved `shader_chunks` rows the shader includes; their code
     * is prepended to the matching stage in the order the server returned them.
     * The material type bucket is created on demand, so a shader can be registered
     * before its type metadata arrives.
     *
     * Neither the shader source nor the chunks contain `uniform ...;` declarations —
     * those are generated from `uniforms` by compileShaders() when the material is
     * built, exactly as for a shader authored in MaterialCreator. Final stage source
     * is therefore: generated declarations, then chunk functions, then the body.
     */
    registerDbShader(shader, chunks = []) {
        if (!shader?.name || !shader.vertex || !shader.fragment) {
            console.warn(`[MaterialRegistry] Cannot register shader "${shader?.name}" — missing name, vertex, or fragment.`);
            return;
        }
        const typeSlug = shader.materialTypeSlug;
        if (!typeSlug) {
            console.warn(`[MaterialRegistry] Shader "${shader.name}" has no materialTypeSlug.`);
            return;
        }
        if (!MaterialRegistry[typeSlug]) {
            MaterialRegistry[typeSlug] = {
                name: typeSlug,
                description: '',
                defaultVariant: shader.name,
                variants: {},
            };
        }
        // Prepend chunk code to the stage it belongs to.
        let vertex = shader.vertex;
        let fragment = shader.fragment;
        for (const chunk of chunks) {
            if (!chunk?.code)
                continue;
            if (chunk.stage === 'vertex' || chunk.stage === 'both') {
                vertex = chunk.code + '\n' + vertex;
            }
            if (chunk.stage === 'fragment' || chunk.stage === 'both') {
                fragment = chunk.code + '\n' + fragment;
            }
        }
        const uniformDefs = shader.uniforms || [];
        const defaultSettings = shader.defaultSettings && Object.keys(shader.defaultSettings).length > 0
            ? { ...shader.defaultSettings }
            : uniformDefs.reduce((acc, u) => {
                acc[u.name] = u.defaultValue;
                return acc;
            }, {});
        MaterialRegistry[typeSlug].variants[shader.name] = {
            name: shader.name,
            description: shader.description || '',
            materialClass: null,
            defaultSettings,
            useCases: shader.useCases || [],
            textureProperties: uniformDefs
                .filter((u) => u.type === 'sampler2D' || u.type === 'samplerCube')
                .map((u) => u.name),
            _shaderSource: {
                vertex,
                fragment,
                uniforms: uniformDefs,
            },
        };
        if (!MaterialRegistry[typeSlug].defaultVariant) {
            MaterialRegistry[typeSlug].defaultVariant = shader.name;
        }
        console.log(`[MaterialRegistry] Registered DB shader "${shader.name}" under type "${typeSlug}"`);
    },
    /**
     * True when a variant for this shader name is already registered.
     * Lets the client skip a source fetch it has already made.
     */
    hasVariant(variantName) {
        return this.getTypeFromVariantName(variantName) !== null;
    },
};
// Export the registry for direct access if needed
export { MaterialRegistry };
// Export default API
export default MaterialRegistryAPI;
