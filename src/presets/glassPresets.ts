/**
 * Glass preset definitions
 * Using Three.js MeshPhysicalMaterial with enhanced metadata for LLM context
 */
import { FrontSide } from 'three';
export interface GlassPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    settings: {
        color: string;
        metalness: number;
        roughness: number;
        transmission: number;
        thickness: number;
        envMapIntensity: number;
        clearcoat: number;
        clearcoatRoughness: number;
        ior: number;
        transparent: boolean;
        opacity: number;
        reflectivity?: number;
        side?: number;
    };
}

export const glassPresets: GlassPreset[] = [
    {
        name: "ClearGlass",
        type: "glass",
        category: "material",
        description: "Crystal clear glass with high transparency and realistic refraction, perfect for windows and containers",
        tags: ["clear", "transparent", "window", "crystal", "clean", "pristine", "see-through", "sharp"],
        settings: {
            color: "#ffffff",
            metalness: 0,
            roughness: 0,
            transmission: 1,
            thickness: 0.5,
            envMapIntensity: 1,
            clearcoat: 1,
            clearcoatRoughness: 0,
            ior: 1.5,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "FrostedGlass",
        type: "glass",
        category: "material",
        description: "Frosted glass with diffused transparency, ideal for privacy screens and decorative elements",
        tags: ["frosted", "matte", "diffused", "privacy", "translucent", "soft", "blurred", "opaque"],
        settings: {
            color: "#ffffff",
            metalness: 0,
            roughness: 0.4,
            transmission: 0.9,
            thickness: 0.5,
            envMapIntensity: 0.8,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3,
            ior: 1.5,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "TintedGlass",
        type: "glass",
        category: "material",
        description: "Colored tinted glass with slight blue tone, great for modern architecture and automotive applications",
        tags: ["tinted", "colored", "blue", "modern", "sleek", "automotive", "architectural", "shaded"],
        settings: {
            color: "#d0e8ff",
            metalness: 0,
            roughness: 0.05,
            transmission: 0.95,
            thickness: 0.6,
            envMapIntensity: 1,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            ior: 1.52,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "Diamond",
        type: "glass",
        category: "material",
        description: "Brilliant diamond-like material with high refraction and sparkle, perfect for jewelry and gems",
        tags: ["diamond", "gem", "jewel", "brilliant", "sparkle", "luxury", "precious", "crystalline"],
        settings: {
            color: "#ffffff",
            metalness: 0,
            roughness: 0,
            transmission: 1,
            thickness: 0.3,
            envMapIntensity: 2,
            clearcoat: 1,
            clearcoatRoughness: 0,
            ior: 2.42,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "StainedGlass",
        type: "glass",
        category: "material",
        description: "Richly colored stained glass with artistic appearance, ideal for decorative and religious contexts",
        tags: ["stained", "colored", "artistic", "decorative", "vibrant", "church", "medieval", "colorful"],
        settings: {
            color: "#ff6b35",
            metalness: 0,
            roughness: 0.15,
            transmission: 0.7,
            thickness: 0.4,
            envMapIntensity: 0.9,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            ior: 1.5,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "Ice",
        type: "glass",
        category: "material",
        description: "Ice-like material with cold blue tint and slight roughness, perfect for frozen and winter scenes",
        tags: ["ice", "frozen", "cold", "winter", "crystalline", "icy", "frost", "glacial"],
        settings: {
            color: "#e0f4ff",
            metalness: 0,
            roughness: 0.2,
            transmission: 0.85,
            thickness: 0.7,
            envMapIntensity: 1.2,
            clearcoat: 0.9,
            clearcoatRoughness: 0.2,
            ior: 1.31,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "Water",
        type: "glass",
        category: "material",
        description: "Water-like glass material with subtle refraction, ideal for liquid containers and aquatic objects",
        tags: ["water", "liquid", "aqua", "fluid", "clear", "natural", "flowing", "wet"],
        settings: {
            color: "#d4f1f9",
            metalness: 0,
            roughness: 0.1,
            transmission: 0.98,
            thickness: 0.8,
            envMapIntensity: 1,
            clearcoat: 0.5,
            clearcoatRoughness: 0.1,
            ior: 1.33,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "SmokeyGlass",
        type: "glass",
        category: "material",
        description: "Dark smokey glass with reduced transparency, perfect for mystery and dramatic effects",
        tags: ["smokey", "dark", "gray", "mysterious", "dramatic", "opaque", "shadowy", "dim"],
        settings: {
            color: "#4a4a4a",
            metalness: 0,
            roughness: 0.1,
            transmission: 0.6,
            thickness: 0.5,
            envMapIntensity: 0.7,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            ior: 1.5,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "Amber",
        type: "glass",
        category: "material",
        description: "Warm amber-colored glass with rich golden tones, ideal for vintage and natural aesthetics",
        tags: ["amber", "golden", "warm", "honey", "vintage", "natural", "organic", "fossilized"],
        settings: {
            color: "#ffbf00",
            metalness: 0,
            roughness: 0.08,
            transmission: 0.8,
            thickness: 0.6,
            envMapIntensity: 1.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.05,
            ior: 1.54,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    },
    {
        name: "Emerald",
        type: "glass",
        category: "material",
        description: "Emerald green gemstone material with vibrant color, perfect for luxury jewelry and magical objects",
        tags: ["emerald", "green", "gem", "jewel", "luxury", "precious", "vibrant", "magical"],
        settings: {
            color: "#50c878",
            metalness: 0,
            roughness: 0.02,
            transmission: 0.85,
            thickness: 0.4,
            envMapIntensity: 1.8,
            clearcoat: 1,
            clearcoatRoughness: 0.02,
            ior: 1.58,
            transparent: true,
            opacity: 1,
            side: FrontSide,
        }
    }
];
/**
 * Get a glass preset by name
 */
export function getGlassPresetByName(name: string): GlassPreset | undefined {
    return glassPresets.find(preset => preset.name === name);
}
/**
 * Get all glass preset names
 */
export function getGlassPresetNames(): string[] {
    return glassPresets.map(preset => preset.name);
}
/**
 * Search glass presets by tags
 */
export function searchGlassPresetsByTags(tags: string[]): GlassPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return glassPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
