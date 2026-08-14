export interface CloudPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    materialType: string;
    settings: Record<string, any>;
}
/**
 * Cloud preset definitions
 * 3 variations for each of the 7 cloud types from MaterialRegistry (21 presets total)
 */
export const defaultCloudsUrl = "https://3d-rise.sfo3.digitaloceanspaces.com/app/images/clouds/clouds.jpg";
export const cloudsPresets: CloudPreset[] = [
    {
        name: "Sky Clouds Bright",
        type: "clouds",
        category: "environment",
        description: "Bright white procedural sky clouds with natural parallax movement",
        tags: ["sky", "bright", "white", "procedural", "natural", "realistic", "daytime", "clear"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 1.0, 1.0],
            u_ambientColor: [0.7, 0.7, 0.8],
            u_sunPosition: [0.0, 1.0, 0.0],
            u_cloudCoverage: 0.5,
            u_cloudScale: 6.0,
            u_softness: 0.5,
            u_windDirection: [1.0, 0.0],
            u_silverLining: 0.0,
            u_selfShading: 0.0,
            u_godRays: 0.0,
            u_storminess: 0.0,
            u_bloomIntensity: 0.0,
        }
    },
    {
        name: "Sky Clouds Sunset",
        type: "clouds",
        category: "environment",
        description: "Warm sunset-tinted procedural sky clouds with golden hues",
        tags: ["sky", "sunset", "warm", "golden", "orange", "evening", "romantic", "scenic"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 0.85, 0.7],
            u_ambientColor: [0.5, 0.3, 0.4],
            u_sunPosition: [0.5, 0.15, -0.3],
            u_cloudCoverage: 0.55,
            u_cloudScale: 6.0,
            u_softness: 0.6,
            u_windDirection: [0.8, 0.3],
            u_silverLining: 0.7,
            u_selfShading: 0.6,
            u_godRays: 0.4,
            u_storminess: 0.0,
            u_bloomIntensity: 0.3,
        }
    },
    {
        name: "Sky Clouds Dawn",
        type: "clouds",
        category: "environment",
        description: "Soft pink and purple dawn sky clouds for early morning scenes",
        tags: ["sky", "dawn", "morning", "pink", "purple", "soft", "early", "peaceful"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.95, 0.85, 0.9],
            u_ambientColor: [0.4, 0.35, 0.55],
            u_sunPosition: [-0.5, 0.1, 0.3],
            u_cloudCoverage: 0.45,
            u_cloudScale: 6.0,
            u_softness: 0.65,
            u_windDirection: [0.5, 0.5],
            u_silverLining: 0.5,
            u_selfShading: 0.4,
            u_godRays: 0.2,
            u_storminess: 0.0,
            u_bloomIntensity: 0.2,
        }
    },
    {
        name: "Sky Clouds Silver Lining",
        type: "clouds",
        category: "environment",
        description: "Dramatic sun-lit clouds with bright silver edges and deep self-shading",
        tags: ["sky", "silver", "dramatic", "sun", "lining", "lit", "contrast", "cinematic"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 0.95, 0.9],
            u_ambientColor: [0.3, 0.3, 0.45],
            u_sunPosition: [0.3, 0.6, -0.5],
            u_cloudCoverage: 0.55,
            u_cloudScale: 5.0,
            u_softness: 0.4,
            u_windDirection: [0.7, 0.2],
            u_silverLining: 1.0,
            u_selfShading: 0.8,
            u_godRays: 0.0,
            u_storminess: 0.0,
            u_bloomIntensity: 0.5,
        }
    },
    {
        name: "Sky Clouds God Rays",
        type: "clouds",
        category: "environment",
        description: "Heavenly clouds with radial light shafts breaking through gaps",
        tags: ["sky", "god", "rays", "light", "shafts", "heavenly", "divine", "epic"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 0.98, 0.9],
            u_ambientColor: [0.5, 0.5, 0.6],
            u_sunPosition: [0.0, 0.8, -0.3],
            u_cloudCoverage: 0.6,
            u_cloudScale: 5.5,
            u_softness: 0.5,
            u_windDirection: [0.6, 0.1],
            u_silverLining: 0.6,
            u_selfShading: 0.5,
            u_godRays: 0.8,
            u_storminess: 0.0,
            u_bloomIntensity: 0.4,
        }
    },
    {
        name: "Sky Clouds Stormy",
        type: "clouds",
        category: "environment",
        description: "Dark turbulent storm clouds with distorted noise and heavy coverage",
        tags: ["sky", "storm", "dark", "turbulent", "ominous", "dramatic", "rain", "thunder"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.45, 0.45, 0.5],
            u_ambientColor: [0.15, 0.15, 0.2],
            u_sunPosition: [0.0, 0.2, -0.5],
            u_cloudCoverage: 0.8,
            u_cloudScale: 4.5,
            u_softness: 0.3,
            u_windDirection: [1.5, 0.8],
            u_silverLining: 0.2,
            u_selfShading: 0.9,
            u_godRays: 0.0,
            u_storminess: 0.8,
            u_bloomIntensity: 0.0,
        }
    },
    {
        name: "Sky Clouds Overcast",
        type: "clouds",
        category: "environment",
        description: "Thick overcast blanket with soft diffuse lighting, no breaks",
        tags: ["sky", "overcast", "grey", "flat", "diffuse", "soft", "cloudy", "muted"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.75, 0.75, 0.78],
            u_ambientColor: [0.55, 0.55, 0.6],
            u_sunPosition: [0.0, 0.9, 0.0],
            u_cloudCoverage: 0.85,
            u_cloudScale: 7.0,
            u_softness: 0.85,
            u_windDirection: [0.3, 0.1],
            u_silverLining: 0.1,
            u_selfShading: 0.3,
            u_godRays: 0.0,
            u_storminess: 0.1,
            u_bloomIntensity: 0.0,
        }
    },
    {
        name: "Sky Clouds Wispy",
        type: "clouds",
        category: "environment",
        description: "Light scattered wisps with minimal coverage for a clear airy sky",
        tags: ["sky", "wispy", "light", "thin", "clear", "airy", "minimal", "serene"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 1.0, 1.0],
            u_ambientColor: [0.8, 0.8, 0.9],
            u_sunPosition: [0.0, 1.0, 0.0],
            u_cloudCoverage: 0.25,
            u_cloudScale: 8.0,
            u_softness: 0.8,
            u_windDirection: [1.2, 0.4],
            u_silverLining: 0.3,
            u_selfShading: 0.2,
            u_godRays: 0.0,
            u_storminess: 0.0,
            u_bloomIntensity: 0.1,
        }
    },
    {
        name: "Sky Clouds Dramatic",
        type: "clouds",
        category: "environment",
        description: "High-contrast dramatic clouds with all lighting features for cinematic scenes",
        tags: ["sky", "dramatic", "cinematic", "contrast", "epic", "movie", "intense", "beautiful"],
        materialType: "SkyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 0.92, 0.85],
            u_ambientColor: [0.2, 0.2, 0.35],
            u_sunPosition: [0.4, 0.4, -0.5],
            u_cloudCoverage: 0.6,
            u_cloudScale: 5.0,
            u_softness: 0.35,
            u_windDirection: [0.9, 0.3],
            u_silverLining: 0.9,
            u_selfShading: 0.85,
            u_godRays: 0.6,
            u_storminess: 0.15,
            u_bloomIntensity: 0.6,
        }
    },
];
/**
 * Get a cloud preset by name
 */
export function getCloudPresetByName(name: string): CloudPreset | undefined {
    return cloudsPresets.find(preset => preset.name === name);
}
/**
 * Get all cloud preset names
 */
export function getCloudPresetNames(): string[] {
    return cloudsPresets.map(preset => preset.name);
}
/**
 * Get cloud presets by material type
 */
export function getCloudPresetsByMaterialType(materialType: string): CloudPreset[] {
    return cloudsPresets.filter(preset => preset.materialType === materialType);
}
/**
 * Search cloud presets by tags
 */
export function searchCloudPresetsByTags(tags: string[]): CloudPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return cloudsPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
