export interface WoodPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    settings: {
        color: string;
        metalness: number;
        roughness: number;
        envMapIntensity: number;
        transparent: boolean;
        opacity: number;
    };
}
/**
 * Wood preset definitions
 * Using MeshStandardMaterial for realistic wood surfaces
 */
export const woodPresets: WoodPreset[] = [
    {
        name: "Oak",
        type: "wood",
        category: "material",
        description: "Medium brown oak with visible grain and classic appearance, strong and durable hardwood",
        tags: ["oak", "brown", "hardwood", "grain", "classic", "durable", "furniture", "natural"],
        settings: {
            color: "#8B6F47",
            metalness: 0,
            roughness: 0.7,
            envMapIntensity: 0.3,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Pine",
        type: "wood",
        category: "material",
        description: "Light colored pine with soft wood characteristics, common for construction and furniture",
        tags: ["pine", "light", "softwood", "pale", "construction", "affordable", "natural", "simple"],
        settings: {
            color: "#E1C699",
            metalness: 0,
            roughness: 0.75,
            envMapIntensity: 0.25,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Mahogany",
        type: "wood",
        category: "material",
        description: "Rich dark reddish-brown mahogany with fine grain, luxury hardwood for fine furniture",
        tags: ["mahogany", "dark", "red", "brown", "luxury", "fine", "hardwood", "elegant"],
        settings: {
            color: "#5C3317",
            metalness: 0,
            roughness: 0.5,
            envMapIntensity: 0.4,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Walnut",
        type: "wood",
        category: "material",
        description: "Rich dark brown walnut with beautiful grain patterns, premium hardwood for fine woodworking",
        tags: ["walnut", "dark", "brown", "rich", "premium", "hardwood", "grain", "sophisticated"],
        settings: {
            color: "#4A3728",
            metalness: 0,
            roughness: 0.6,
            envMapIntensity: 0.35,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Maple",
        type: "wood",
        category: "material",
        description: "Light cream maple with fine uniform grain, versatile hardwood with clean appearance",
        tags: ["maple", "light", "cream", "fine", "clean", "hardwood", "uniform", "versatile"],
        settings: {
            color: "#D4BFA7",
            metalness: 0,
            roughness: 0.65,
            envMapIntensity: 0.3,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Cherry",
        type: "wood",
        category: "material",
        description: "Warm reddish-brown cherry wood with smooth grain, ages beautifully to deeper red tones",
        tags: ["cherry", "red", "brown", "warm", "smooth", "hardwood", "elegant", "aged"],
        settings: {
            color: "#8B4513",
            metalness: 0,
            roughness: 0.55,
            envMapIntensity: 0.4,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Ebony",
        type: "wood",
        category: "material",
        description: "Very dark, almost black ebony with dense structure, exotic luxury hardwood",
        tags: ["ebony", "black", "dark", "dense", "exotic", "luxury", "rare", "premium"],
        settings: {
            color: "#1C1C1C",
            metalness: 0,
            roughness: 0.4,
            envMapIntensity: 0.5,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Bamboo",
        type: "wood",
        category: "material",
        description: "Light bamboo with distinctive node patterns, sustainable and eco-friendly material",
        tags: ["bamboo", "light", "sustainable", "eco", "natural", "asian", "modern", "green"],
        settings: {
            color: "#C9A86A",
            metalness: 0,
            roughness: 0.6,
            envMapIntensity: 0.35,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "PolishedWood",
        type: "wood",
        category: "material",
        description: "High-gloss polished wood with clear finish and shine, refined and elegant appearance",
        tags: ["polished", "glossy", "shiny", "finish", "refined", "elegant", "smooth", "varnished"],
        settings: {
            color: "#8B6F47",
            metalness: 0,
            roughness: 0.2,
            envMapIntensity: 0.8,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Teak",
        type: "wood",
        category: "material",
        description: "Golden-brown teak with natural oils, weather-resistant tropical hardwood",
        tags: ["teak", "golden", "brown", "tropical", "durable", "outdoor", "resistant", "premium"],
        settings: {
            color: "#A0826D",
            metalness: 0,
            roughness: 0.5,
            envMapIntensity: 0.4,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Birch",
        type: "wood",
        category: "material",
        description: "Very light almost white birch with subtle grain, bright and modern appearance",
        tags: ["birch", "white", "light", "pale", "bright", "modern", "scandinavian", "clean"],
        settings: {
            color: "#EDE8DC",
            metalness: 0,
            roughness: 0.7,
            envMapIntensity: 0.25,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Ash",
        type: "wood",
        category: "material",
        description: "Light tan ash with prominent grain, strong and flexible hardwood",
        tags: ["ash", "tan", "light", "grain", "strong", "flexible", "hardwood", "natural"],
        settings: {
            color: "#C2B280",
            metalness: 0,
            roughness: 0.65,
            envMapIntensity: 0.3,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Rosewood",
        type: "wood",
        category: "material",
        description: "Deep reddish-brown rosewood with rich color, exotic and aromatic hardwood",
        tags: ["rosewood", "red", "brown", "exotic", "aromatic", "luxury", "deep", "rich"],
        settings: {
            color: "#65000B",
            metalness: 0,
            roughness: 0.5,
            envMapIntensity: 0.45,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Cedar",
        type: "wood",
        category: "material",
        description: "Warm reddish cedar with aromatic properties, naturally resistant to decay and insects",
        tags: ["cedar", "red", "aromatic", "resistant", "outdoor", "warm", "natural", "protection"],
        settings: {
            color: "#A3654A",
            metalness: 0,
            roughness: 0.7,
            envMapIntensity: 0.3,
            transparent: false,
            opacity: 1.0
        }
    }
];
/**
 * Get a wood preset by name
 */
export function getWoodPresetByName(name: string): WoodPreset | undefined {
    return woodPresets.find(preset => preset.name === name);
}
/**
 * Get all wood preset names
 */
export function getWoodPresetNames(): string[] {
    return woodPresets.map(preset => preset.name);
}
/**
 * Search wood presets by tags
 */
export function searchWoodPresetsByTags(tags: string[]): WoodPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return woodPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
