export interface OceanPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    settings: {
        visible: boolean;
        u_time?: number;
        u_seaHeight: number;
        u_seaChoppy: number;
        u_seaSpeed: number;
        u_seaFreq: number;
        u_seaBaseColor: [number, number, number];
        u_seaWaterColor: [number, number, number];
        u_iterFragment: number;
        u_reflectionColor: [number, number, number];
    };
}
/**
 * Ocean preset definitions
 * Converted from MaterialRegistry water variants with enhanced metadata for LLM context
 */
export const oceanPresets: OceanPreset[] = [
    {
        name: "Lake",
        type: "ocean",
        category: "environment",
        description: "Crystal clear, calm lake water with subtle ripples and gentle movement, perfect for peaceful lakeside scenes",
        tags: ["lake", "calm", "clear", "peaceful", "still", "gentle", "tranquil", "serene", "glassy", "smooth"],
        settings: {
            visible: true,
            u_time: 0,
            u_seaHeight: 0.05,
            u_seaChoppy: 0.5,
            u_seaSpeed: 0.1,
            u_seaFreq: 0.4,
            u_seaBaseColor: [0.0, 0.15, 0.25],
            u_seaWaterColor: [0.2, 0.4, 0.6],
            u_iterFragment: 3,
            u_reflectionColor: [0.7, 0.8, 1.0]
        }
    },
    {
        name: "Ocean",
        type: "ocean",
        category: "environment",
        description: "Deep ocean water with moderate waves and rich blue colors, ideal for realistic open sea environments",
        tags: ["ocean", "sea", "deep", "blue", "waves", "moderate", "realistic", "open water", "deep blue", "marine"],
        settings: {
            visible: true,
            u_time: 0,
            u_seaHeight: 0.4,
            u_seaChoppy: 2.5,
            u_seaSpeed: 0.6,
            u_seaFreq: 0.2,
            u_seaBaseColor: [0.0, 0.08, 0.2],
            u_seaWaterColor: [0.1, 0.3, 0.5],
            u_iterFragment: 4,
            u_reflectionColor: [0.4, 0.6, 0.9]
        }
    },
    {
        name: "Storm",
        type: "ocean",
        category: "environment",
        description: "Turbulent stormy water with high waves and dark colors, creating a dramatic and intense atmosphere",
        tags: ["storm", "stormy", "turbulent", "rough", "dramatic", "dark", "intense", "dangerous", "wild", "tempest", "choppy"],
        settings: {
            visible: true,
            u_time: 0,
            u_seaHeight: 0.8,
            u_seaChoppy: 6.0,
            u_seaSpeed: 1.2,
            u_seaFreq: 0.12,
            u_seaBaseColor: [0.05, 0.05, 0.15],
            u_seaWaterColor: [0.2, 0.25, 0.3],
            u_iterFragment: 6,
            u_reflectionColor: [0.3, 0.4, 0.6]
        }
    },
    {
        name: "Tropical",
        type: "ocean",
        category: "environment",
        description: "Clear tropical water with turquoise and emerald tones, perfect for paradise beach and island scenes",
        tags: ["tropical", "turquoise", "emerald", "clear", "paradise", "beach", "island", "caribbean", "exotic", "pristine", "azure"],
        settings: {
            visible: true,
            u_time: 0,
            u_seaHeight: 0.2,
            u_seaChoppy: 1.5,
            u_seaSpeed: 0.3,
            u_seaFreq: 0.25,
            u_seaBaseColor: [0.0, 0.2, 0.2],
            u_seaWaterColor: [0.2, 0.6, 0.5],
            u_iterFragment: 4,
            u_reflectionColor: [0.5, 0.9, 0.8]
        }
    },
    {
        name: "Arctic",
        type: "ocean",
        category: "environment",
        description: "Cold arctic water with icy blue tones and gentle waves, ideal for polar and winter scenes",
        tags: ["arctic", "cold", "icy", "polar", "winter", "frozen", "glacial", "frigid", "northern", "ice", "cool"],
        settings: {
            visible: true,
            u_time: 0,
            u_seaHeight: 0.3,
            u_seaChoppy: 2.0,
            u_seaSpeed: 0.4,
            u_seaFreq: 0.18,
            u_seaBaseColor: [0.1, 0.15, 0.2],
            u_seaWaterColor: [0.3, 0.5, 0.7],
            u_iterFragment: 5,
            u_reflectionColor: [0.8, 0.9, 1.0]
        }
    }
];
/**
 * Get an ocean preset by name
 */
export function getOceanPresetByName(name: string): OceanPreset | undefined {
    return oceanPresets.find(preset => preset.name === name);
}
/**
 * Get all ocean preset names
 */
export function getOceanPresetNames(): string[] {
    return oceanPresets.map(preset => preset.name);
}
/**
 * Search ocean presets by tags
 */
export function searchOceanPresetsByTags(tags: string[]): OceanPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return oceanPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
