import type { SkySettings } from "../types/environment";
export interface SkyPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    settings: Omit<SkySettings, 'handlers'>;
}


/**
 * Sky preset definitions
 * Converted from effectsController.ts with enhanced metadata for LLM context
 */
export const skyPresets: SkyPreset[] = [
    {
        name: "Initial",
        type: "sky",
        category: "environment",
        description: "Default clear sky state with minimal atmospheric effects, creating a neutral starting point for scene development",
        tags: ["default", "clear", "neutral", "starting", "basic", "clean", "minimal"],
        settings: {
            visible: true,
            turbidity: 0,
            rayleigh: 0,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: -5,
            azimuth: -90,
            sunSystem: null,
        }
    },
    {
        name: "Sunset",
        type: "sky",
        category: "environment",
        description: "Warm sunset with vibrant orange and pink tones, creating a romantic and peaceful atmosphere perfect for evening scenes",
        tags: ["sunset", "warm", "orange", "evening", "romantic", "peaceful", "dusk", "golden hour", "dramatic", "colorful"],
        settings: {
            visible: true,
            turbidity: 2.8,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 2,
            azimuth: -90,
            sunSystem: null,
        }
    },
    {
        name: "Day",
        type: "sky",
        category: "environment",
        description: "Bright daytime sky with clear blue tones and strong sunlight, ideal for outdoor scenes with high visibility",
        tags: ["day", "daytime", "bright", "blue", "clear", "sunny", "midday", "noon", "outdoor", "vibrant"],
        settings: {
            visible: true,
            turbidity: 0.7,
            rayleigh: 0.54,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 8,
            azimuth: -40,
            sunSystem: null,
        }
    },
    {
        name: "Night",
        type: "sky",
        category: "environment",
        description: "Dark night sky with minimal atmospheric scattering, perfect for starry scenes or moonlit environments",
        tags: ["night", "dark", "evening", "starry", "moonlight", "nocturnal", "midnight", "darkness", "stars"],
        settings: {
            visible: true,
            turbidity: 1,
            rayleigh: 0,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 10,
            azimuth: -90,
            sunSystem: null,
        }
    }
];
/**
 * Get a sky preset by name
 */
export function getSkyPresetByName(name: string): SkyPreset | undefined {
    return skyPresets.find(preset => preset.name === name);
}
/**
 * Get all sky preset names
 */
export function getSkyPresetNames(): string[] {
    return skyPresets.map(preset => preset.name);
}
/**
 * Search sky presets by tags
 */
export function searchSkyPresetsByTags(tags: string[]): SkyPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return skyPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
