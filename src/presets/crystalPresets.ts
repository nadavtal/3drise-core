export interface CrystalPreset {
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
    };
}
/**
 * Crystal/Gem preset definitions
 * Using MeshPhysicalMaterial for realistic gemstone refraction and brilliance
 */
export const crystalPresets: CrystalPreset[] = [
    {
        name: "Diamond",
        type: "crystal",
        category: "material",
        description: "Brilliant diamond with maximum refraction and sparkle, the hardest natural gemstone",
        tags: ["diamond", "brilliant", "sparkle", "precious", "clear", "luxury", "gem", "expensive"],
        settings: {
            color: "#ffffff",
            metalness: 0,
            roughness: 0,
            transmission: 1.0,
            thickness: 0.3,
            envMapIntensity: 2.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0,
            ior: 2.42,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Ruby",
        type: "crystal",
        category: "material",
        description: "Deep red ruby with rich color and high brilliance, one of the most valuable gemstones",
        tags: ["ruby", "red", "precious", "gem", "brilliant", "jewel", "luxury", "corundum"],
        settings: {
            color: "#E0115F",
            metalness: 0,
            roughness: 0.02,
            transmission: 0.7,
            thickness: 0.4,
            envMapIntensity: 2.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0,
            ior: 1.76,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Sapphire",
        type: "crystal",
        category: "material",
        description: "Deep blue sapphire with clarity and brilliance, symbol of wisdom and royalty",
        tags: ["sapphire", "blue", "precious", "gem", "royal", "brilliant", "jewel", "corundum"],
        settings: {
            color: "#0F52BA",
            metalness: 0,
            roughness: 0.02,
            transmission: 0.75,
            thickness: 0.4,
            envMapIntensity: 2.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0,
            ior: 1.77,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Emerald",
        type: "crystal",
        category: "material",
        description: "Vibrant green emerald with rich color, highly prized precious gemstone",
        tags: ["emerald", "green", "precious", "gem", "brilliant", "beryl", "luxury", "jewel"],
        settings: {
            color: "#50C878",
            metalness: 0,
            roughness: 0.02,
            transmission: 0.8,
            thickness: 0.4,
            envMapIntensity: 1.8,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            ior: 1.58,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Amethyst",
        type: "crystal",
        category: "material",
        description: "Purple amethyst quartz with mystical appearance, popular semi-precious stone",
        tags: ["amethyst", "purple", "violet", "quartz", "mystical", "gem", "spiritual", "crystal"],
        settings: {
            color: "#9966CC",
            metalness: 0,
            roughness: 0.05,
            transmission: 0.85,
            thickness: 0.5,
            envMapIntensity: 1.5,
            clearcoat: 0.9,
            clearcoatRoughness: 0.05,
            ior: 1.54,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Topaz",
        type: "crystal",
        category: "material",
        description: "Golden yellow topaz with warm brilliance, stone of strength and wisdom",
        tags: ["topaz", "yellow", "golden", "amber", "gem", "warm", "brilliant", "precious"],
        settings: {
            color: "#FFC87C",
            metalness: 0,
            roughness: 0.03,
            transmission: 0.8,
            thickness: 0.4,
            envMapIntensity: 1.7,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            ior: 1.62,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Quartz",
        type: "crystal",
        category: "material",
        description: "Clear quartz crystal with transparency and natural facets, versatile mineral",
        tags: ["quartz", "clear", "crystal", "transparent", "natural", "mineral", "pure", "glass"],
        settings: {
            color: "#F0F0F0",
            metalness: 0,
            roughness: 0.08,
            transmission: 0.95,
            thickness: 0.6,
            envMapIntensity: 1.3,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            ior: 1.54,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Opal",
        type: "crystal",
        category: "material",
        description: "Iridescent opal with play-of-color effect, mystical and unique gemstone",
        tags: ["opal", "iridescent", "rainbow", "mystical", "unique", "colorful", "gem", "precious"],
        settings: {
            color: "#E8F2F7",
            metalness: 0,
            roughness: 0.15,
            transmission: 0.6,
            thickness: 0.5,
            envMapIntensity: 2.2,
            clearcoat: 0.9,
            clearcoatRoughness: 0.1,
            ior: 1.45,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Jade",
        type: "crystal",
        category: "material",
        description: "Green jade with semi-translucent quality, symbol of purity and serenity in Asian culture",
        tags: ["jade", "green", "translucent", "oriental", "pure", "serene", "gem", "stone"],
        settings: {
            color: "#00A86B",
            metalness: 0,
            roughness: 0.25,
            transmission: 0.5,
            thickness: 0.7,
            envMapIntensity: 1.2,
            clearcoat: 0.7,
            clearcoatRoughness: 0.2,
            ior: 1.66,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Aquamarine",
        type: "crystal",
        category: "material",
        description: "Light blue aquamarine with water-like clarity, calming sea-colored gemstone",
        tags: ["aquamarine", "blue", "cyan", "water", "clear", "calm", "gem", "beryl"],
        settings: {
            color: "#7FFFD4",
            metalness: 0,
            roughness: 0.02,
            transmission: 0.9,
            thickness: 0.4,
            envMapIntensity: 1.6,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            ior: 1.57,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "Citrine",
        type: "crystal",
        category: "material",
        description: "Yellow-orange citrine quartz with warm sunny glow, stone of abundance and positivity",
        tags: ["citrine", "yellow", "orange", "sunny", "warm", "quartz", "gem", "golden"],
        settings: {
            color: "#E4D00A",
            metalness: 0,
            roughness: 0.05,
            transmission: 0.85,
            thickness: 0.5,
            envMapIntensity: 1.5,
            clearcoat: 0.9,
            clearcoatRoughness: 0.05,
            ior: 1.54,
            transparent: true,
            opacity: 1.0
        }
    },
    {
        name: "BlackOnyx",
        type: "crystal",
        category: "material",
        description: "Deep black onyx with subtle translucency, protective and grounding stone",
        tags: ["onyx", "black", "dark", "mysterious", "protective", "stone", "gem", "elegant"],
        settings: {
            color: "#0F0F0F",
            metalness: 0,
            roughness: 0.1,
            transmission: 0.3,
            thickness: 0.8,
            envMapIntensity: 1.0,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            ior: 1.54,
            transparent: true,
            opacity: 1.0
        }
    }
];
/**
 * Get a crystal preset by name
 */
export function getCrystalPresetByName(name: string): CrystalPreset | undefined {
    return crystalPresets.find(preset => preset.name === name);
}
/**
 * Get all crystal preset names
 */
export function getCrystalPresetNames(): string[] {
    return crystalPresets.map(preset => preset.name);
}
/**
 * Search crystal presets by tags
 */
export function searchCrystalPresetsByTags(tags: string[]): CrystalPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return crystalPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
