export interface PlasticPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    settings: {
        color: string;
        metalness: number;
        roughness: number;
        clearcoat?: number;
        clearcoatRoughness?: number;
        envMapIntensity: number;
        transparent: boolean;
        opacity: number;
    };
}
/**
 * Plastic preset definitions
 * Using MeshStandardMaterial and MeshPhysicalMaterial for various plastic surfaces
 */
export const plasticPresets: PlasticPreset[] = [
    {
        name: "GlossyPlastic",
        type: "plastic",
        category: "material",
        description: "Smooth glossy plastic with high shine, perfect for modern products and toys",
        tags: ["glossy", "shiny", "smooth", "polished", "modern", "product", "toy", "reflective"],
        settings: {
            color: "#FF4444",
            metalness: 0,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.8,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "MattePlastic",
        type: "plastic",
        category: "material",
        description: "Flat matte plastic with no reflection, ideal for understated designs and functional parts",
        tags: ["matte", "flat", "dull", "non-reflective", "functional", "simple", "understated", "soft"],
        settings: {
            color: "#3A3A3A",
            metalness: 0,
            roughness: 0.9,
            envMapIntensity: 0.1,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Rubber",
        type: "plastic",
        category: "material",
        description: "Dark rubber material with high roughness and soft appearance, typical for tires and grips",
        tags: ["rubber", "dark", "soft", "grip", "tire", "flexible", "textured", "matte"],
        settings: {
            color: "#1A1A1A",
            metalness: 0,
            roughness: 0.95,
            envMapIntensity: 0.05,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Silicone",
        type: "plastic",
        category: "material",
        description: "Smooth silicone with slight translucency and soft feel, common in phone cases and kitchen items",
        tags: ["silicone", "smooth", "soft", "flexible", "translucent", "modern", "grip", "phone"],
        settings: {
            color: "#88CCFF",
            metalness: 0,
            roughness: 0.4,
            envMapIntensity: 0.6,
            transparent: true,
            opacity: 0.95
        }
    },
    {
        name: "ABS",
        type: "plastic",
        category: "material",
        description: "Standard ABS plastic with medium finish, typical 3D printing and manufacturing material",
        tags: ["abs", "3d print", "manufacturing", "standard", "durable", "common", "industrial", "medium"],
        settings: {
            color: "#E8E8E8",
            metalness: 0,
            roughness: 0.5,
            envMapIntensity: 0.4,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "PVC",
        type: "plastic",
        category: "material",
        description: "Industrial PVC plastic with slight shine, used in pipes, vinyl, and construction",
        tags: ["pvc", "industrial", "pipe", "vinyl", "construction", "durable", "white", "common"],
        settings: {
            color: "#F5F5F5",
            metalness: 0,
            roughness: 0.45,
            envMapIntensity: 0.5,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Acrylic",
        type: "plastic",
        category: "material",
        description: "Clear acrylic plastic with glass-like appearance but more lightweight, used in displays and signs",
        tags: ["acrylic", "clear", "transparent", "glass-like", "display", "sign", "lightweight", "modern"],
        settings: {
            color: "#FFFFFF",
            metalness: 0,
            roughness: 0.1,
            clearcoat: 0.8,
            clearcoatRoughness: 0.05,
            envMapIntensity: 1.0,
            transparent: true,
            opacity: 0.9
        }
    },
    {
        name: "Vinyl",
        type: "plastic",
        category: "material",
        description: "Flexible vinyl plastic with slight sheen, common in upholstery and flooring",
        tags: ["vinyl", "flexible", "sheen", "upholstery", "flooring", "durable", "leather-like", "smooth"],
        settings: {
            color: "#2C2C2C",
            metalness: 0,
            roughness: 0.35,
            clearcoat: 0.3,
            clearcoatRoughness: 0.2,
            envMapIntensity: 0.6,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Polycarbonate",
        type: "plastic",
        category: "material",
        description: "Tough transparent polycarbonate with high impact resistance, used in safety glasses and shields",
        tags: ["polycarbonate", "tough", "transparent", "impact", "safety", "durable", "clear", "strong"],
        settings: {
            color: "#F8F8F8",
            metalness: 0,
            roughness: 0.15,
            envMapIntensity: 0.9,
            transparent: true,
            opacity: 0.92
        }
    },
    {
        name: "Nylon",
        type: "plastic",
        category: "material",
        description: "Semi-glossy nylon with smooth surface, used in fabrics, gears, and mechanical parts",
        tags: ["nylon", "smooth", "semi-glossy", "fabric", "gear", "mechanical", "durable", "engineered"],
        settings: {
            color: "#FFFACD",
            metalness: 0,
            roughness: 0.3,
            envMapIntensity: 0.6,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "Polypropylene",
        type: "plastic",
        category: "material",
        description: "Lightweight polypropylene with matte to semi-gloss finish, common in containers and packaging",
        tags: ["polypropylene", "lightweight", "container", "packaging", "versatile", "recyclable", "common", "durable"],
        settings: {
            color: "#D3D3D3",
            metalness: 0,
            roughness: 0.6,
            envMapIntensity: 0.3,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "FrostedPlastic",
        type: "plastic",
        category: "material",
        description: "Translucent frosted plastic with diffused appearance, popular in modern design and lighting",
        tags: ["frosted", "translucent", "diffused", "modern", "lighting", "soft", "milky", "elegant"],
        settings: {
            color: "#FFFFFF",
            metalness: 0,
            roughness: 0.7,
            envMapIntensity: 0.4,
            transparent: true,
            opacity: 0.7
        }
    },
    {
        name: "HighGlossWhite",
        type: "plastic",
        category: "material",
        description: "High-gloss white plastic with mirror-like finish, used in premium appliances and automotive",
        tags: ["high-gloss", "white", "mirror", "premium", "appliance", "automotive", "shiny", "reflective"],
        settings: {
            color: "#FFFFFF",
            metalness: 0,
            roughness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            envMapIntensity: 1.2,
            transparent: false,
            opacity: 1.0
        }
    },
    {
        name: "ColoredAcrylic",
        type: "plastic",
        category: "material",
        description: "Vibrant colored transparent acrylic, perfect for modern art and colorful displays",
        tags: ["acrylic", "colored", "vibrant", "transparent", "art", "display", "modern", "bright"],
        settings: {
            color: "#FF6B9D",
            metalness: 0,
            roughness: 0.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.05,
            envMapIntensity: 1.0,
            transparent: true,
            opacity: 0.85
        }
    }
];
/**
 * Get a plastic preset by name
 */
export function getPlasticPresetByName(name: string): PlasticPreset | undefined {
    return plasticPresets.find(preset => preset.name === name);
}
/**
 * Get all plastic preset names
 */
export function getPlasticPresetNames(): string[] {
    return plasticPresets.map(preset => preset.name);
}
/**
 * Search plastic presets by tags
 */
export function searchPlasticPresetsByTags(tags: string[]): PlasticPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return plasticPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
