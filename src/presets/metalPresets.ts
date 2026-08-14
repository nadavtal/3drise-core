export interface MetalPreset {
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
 * Metal preset definitions
 * Using MeshStandardMaterial for physically-based metallic surfaces
 */
export const metalPresets: MetalPreset[] = [
    {
        name: "Aluminum",
        type: "metal",
        category: "material",
        description: "Bright, lightweight aluminum with high reflectivity and slight surface roughness",
        tags: ["aluminum", "light", "silver", "bright", "reflective", "modern", "industrial", "metallic"],
        settings: {
            color: "#C0C0C8",
            metalness: 1.0,
            roughness: 0.3,
            envMapIntensity: 1.2,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Steel",
        type: "metal",
        category: "material",
        description: "Dark polished steel with medium roughness, ideal for industrial and mechanical objects",
        tags: ["steel", "dark", "industrial", "strong", "durable", "grey", "metallic", "iron"],
        settings: {
            color: "#8C8C8C",
            metalness: 1.0,
            roughness: 0.4,
            envMapIntensity: 1.0,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Gold",
        type: "metal",
        category: "material",
        description: "Luxurious warm gold with high reflectivity and smooth finish, perfect for jewelry and decorative items",
        tags: ["gold", "luxury", "precious", "yellow", "shiny", "jewelry", "expensive", "rich"],
        settings: {
            color: "#FFD700",
            metalness: 1.0,
            roughness: 0.2,
            envMapIntensity: 1.5,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Copper",
        type: "metal",
        category: "material",
        description: "Reddish-brown copper with warm tones, great for pipes, wiring, and decorative elements",
        tags: ["copper", "red", "brown", "warm", "conductive", "industrial", "rustic", "metallic"],
        settings: {
            color: "#B87333",
            metalness: 1.0,
            roughness: 0.35,
            envMapIntensity: 1.1,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Bronze",
        type: "metal",
        category: "material",
        description: "Aged bronze with darker tones and patina effect, perfect for statues and antique objects",
        tags: ["bronze", "aged", "antique", "dark", "patina", "statue", "historical", "ancient"],
        settings: {
            color: "#8B6914",
            metalness: 1.0,
            roughness: 0.5,
            envMapIntensity: 0.9,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Chrome",
        type: "metal",
        category: "material",
        description: "Mirror-like chrome with maximum reflectivity, ideal for modern and futuristic designs",
        tags: ["chrome", "mirror", "reflective", "shiny", "polished", "modern", "sleek", "futuristic"],
        settings: {
            color: "#E8E8E8",
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 2.0,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "BrushedMetal",
        type: "metal",
        category: "material",
        description: "Brushed metal with directional surface texture, common in appliances and modern architecture",
        tags: ["brushed", "textured", "anisotropic", "modern", "appliance", "architectural", "matte", "directional"],
        settings: {
            color: "#A8A8A8",
            metalness: 1.0,
            roughness: 0.6,
            envMapIntensity: 0.8,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "RustyMetal",
        type: "metal",
        category: "material",
        description: "Corroded rusty metal with orange-brown oxidation, perfect for aged and weathered objects",
        tags: ["rust", "corroded", "aged", "weathered", "oxidized", "orange", "old", "deteriorated"],
        settings: {
            color: "#A0522D",
            metalness: 0.7,
            roughness: 0.8,
            envMapIntensity: 0.5,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Titanium",
        type: "metal",
        category: "material",
        description: "Cool grey titanium with medium reflectivity, strong and lightweight aerospace material",
        tags: ["titanium", "grey", "aerospace", "strong", "lightweight", "modern", "technical", "premium"],
        settings: {
            color: "#878681",
            metalness: 1.0,
            roughness: 0.25,
            envMapIntensity: 1.3,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Silver",
        type: "metal",
        category: "material",
        description: "Bright silver with high reflectivity and cool tone, excellent for jewelry and luxury items",
        tags: ["silver", "bright", "shiny", "precious", "jewelry", "reflective", "cool", "metallic"],
        settings: {
            color: "#C0C0C0",
            metalness: 1.0,
            roughness: 0.15,
            envMapIntensity: 1.6,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Brass",
        type: "metal",
        category: "material",
        description: "Warm yellowish brass alloy, commonly used for fixtures, instruments, and decorative hardware",
        tags: ["brass", "yellow", "warm", "alloy", "fixture", "instrument", "decorative", "golden"],
        settings: {
            color: "#B5A642",
            metalness: 1.0,
            roughness: 0.3,
            envMapIntensity: 1.2,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Iron",
        type: "metal",
        category: "material",
        description: "Dark raw iron with rough surface, ideal for industrial, medieval, and rustic applications",
        tags: ["iron", "dark", "rough", "industrial", "medieval", "heavy", "raw", "strong"],
        settings: {
            color: "#4A4A4A",
            metalness: 1.0,
            roughness: 0.7,
            envMapIntensity: 0.7,
            transparent: false,
            opacity: 1.0
        }
    }
];
/**
 * Get a metal preset by name
 */
export function getMetalPresetByName(name: string): MetalPreset | undefined {
    return metalPresets.find(preset => preset.name === name);
}
/**
 * Get all metal preset names
 */
export function getMetalPresetNames(): string[] {
    return metalPresets.map(preset => preset.name);
}
/**
 * Search metal presets by tags
 */
export function searchMetalPresetsByTags(tags: string[]): MetalPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return metalPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
