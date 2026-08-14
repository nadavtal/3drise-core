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
export const effectsPresets: CloudPreset[] = [
    // ===== NEBULA CLOUDS (3 variations) =====
    {
        name: "Nebula Cosmic Purple",
        type: "effects",
        category: "environment",
        description: "Vibrant cosmic nebula with purple and pink tones, creating a mystical space-like atmosphere",
        tags: ["nebula", "cosmic", "space", "purple", "pink", "mystical", "colorful", "galaxy", "ethereal"],
        materialType: "Nebula",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.6, 0.3, 0.8],
            u_color1: [0.8, 0.2, 0.9],
            u_color2: [0.2, 0.6, 1.0],
            u_color3: [1.0, 0.4, 0.2],
            u_glowIntensity: 1.5,
            u_complexity: 3.0
        }
    },
    {
        name: "Nebula Emerald Dream",
        type: "effects",
        category: "environment",
        description: "Ethereal green and teal nebula clouds with a dreamy, otherworldly quality",
        tags: ["nebula", "green", "teal", "emerald", "dreamy", "ethereal", "space", "mystical", "fantasy"],
        materialType: "Nebula",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.3, 0.8, 0.6],
            u_color1: [0.2, 0.9, 0.6],
            u_color2: [0.1, 0.7, 0.8],
            u_color3: [0.3, 1.0, 0.4],
            u_glowIntensity: 2.0,
            u_complexity: 2.5
        }
    },
    {
        name: "Nebula Fire",
        type: "effects",
        category: "environment",
        description: "Intense fiery nebula with orange and red hues, evoking cosmic flames and stellar birth",
        tags: ["nebula", "fire", "orange", "red", "intense", "hot", "stellar", "dramatic", "bright"],
        materialType: "Nebula",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 0.5, 0.2],
            u_color1: [1.0, 0.3, 0.1],
            u_color2: [1.0, 0.6, 0.0],
            u_color3: [0.9, 0.1, 0.1],
            u_glowIntensity: 2.5,
            u_complexity: 3.5
        }
    },
    // ===== DRAMATIC CLOUDS (3 variations) =====
    {
        name: "Storm Brewing",
        type: "effects",
        category: "environment",
        description: "Dark dramatic clouds with deep purple tones and electric lightning effects, perfect for stormy scenes",
        tags: ["dramatic", "storm", "dark", "purple", "lightning", "electric", "ominous", "threatening", "moody"],
        materialType: "Clouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_mouse: [0, 0],
            u_noise: 'https://3d-rise.sfo3.digitaloceanspaces.com/app/images/textures/height-maps/heightmap1.png',
            u_texture: defaultCloudsUrl,
            u_scroll: 0.0,
            u_cloudColor: [0.07, 0.0, 0.24],
            u_lightColor: [0.25, 0.6, 1.0],
            u_useOriginalImage: 0.0
        }
    },
    {
        name: "Sunset Dramatic",
        type: "effects",
        category: "environment",
        description: "Warm dramatic clouds with golden and orange tones, illuminated by sunset light",
        tags: ["dramatic", "sunset", "warm", "golden", "orange", "evening", "glowing", "beautiful", "scenic"],
        materialType: "Clouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_mouse: [0, 0],
            u_noise: 'https://3d-rise.sfo3.digitaloceanspaces.com/app/images/textures/height-maps/heightmap1.png',
            u_texture: defaultCloudsUrl,
            u_scroll: 0.0,
            u_cloudColor: [0.4, 0.2, 0.1],
            u_lightColor: [1.0, 0.7, 0.3],
            u_useOriginalImage: 0.0
        }
    },
    {
        name: "Mystical Purple",
        type: "effects",
        category: "environment",
        description: "Enchanting purple dramatic clouds with soft blue-violet lighting, creating a magical atmosphere",
        tags: ["dramatic", "purple", "mystical", "magical", "enchanting", "fantasy", "soft", "ethereal", "dreamy"],
        materialType: "Clouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_mouse: [0, 0],
            u_noise: 'https://3d-rise.sfo3.digitaloceanspaces.com/app/images/textures/height-maps/heightmap1.png',
            u_texture: defaultCloudsUrl,
            u_scroll: 0.0,
            u_cloudColor: [0.15, 0.05, 0.25],
            u_lightColor: [0.4, 0.3, 0.8],
            u_useOriginalImage: 0.0
        }
    },
    // ===== VOLUMETRIC CLOUDS (3 variations) =====
    {
        name: "Volumetric Realistic",
        type: "effects",
        category: "environment",
        description: "Realistic 3D volumetric clouds with natural density and lighting, ideal for photorealistic scenes",
        tags: ["volumetric", "realistic", "3d", "natural", "photorealistic", "dense", "detailed", "soft"],
        materialType: "VolumetricClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 1.0, 1.0],
            u_lightDirection: [0.5, 1.0, 0.5],
            u_cloudDensity: 0.8,
            u_cloudCoverage: 0.4,
            u_cloudScale: 0.5,
            u_lightColor: [1.0, 0.95, 0.8],
            u_shadowColor: [0.3, 0.4, 0.6],
            u_absorption: 1.0,
            u_scattering: 0.5
        }
    },
    {
        name: "Volumetric Dense",
        type: "effects",
        category: "environment",
        description: "Heavy, dense volumetric clouds with high coverage, creating an overcast atmosphere",
        tags: ["volumetric", "dense", "heavy", "overcast", "thick", "cloudy", "gray", "moody"],
        materialType: "VolumetricClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.9, 0.9, 0.95],
            u_lightDirection: [0.3, 0.8, 0.4],
            u_cloudDensity: 1.2,
            u_cloudCoverage: 0.7,
            u_cloudScale: 0.4,
            u_lightColor: [0.9, 0.9, 0.95],
            u_shadowColor: [0.2, 0.25, 0.3],
            u_absorption: 1.5,
            u_scattering: 0.3
        }
    },
    {
        name: "Volumetric Light",
        type: "effects",
        category: "environment",
        description: "Light, wispy volumetric clouds with sparse coverage and bright illumination",
        tags: ["volumetric", "light", "wispy", "sparse", "bright", "airy", "soft", "delicate"],
        materialType: "VolumetricClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 1.0, 0.95],
            u_lightDirection: [0.6, 1.0, 0.6],
            u_cloudDensity: 0.5,
            u_cloudCoverage: 0.25,
            u_cloudScale: 0.6,
            u_lightColor: [1.0, 1.0, 0.9],
            u_shadowColor: [0.5, 0.6, 0.7],
            u_absorption: 0.7,
            u_scattering: 0.7
        }
    },
    // ===== CARTOON CLOUDS (3 variations) =====
    {
        name: "Cartoon Fluffy",
        type: "effects",
        category: "environment",
        description: "Soft, puffy cartoon-style clouds with gentle edges and pleasant colors",
        tags: ["cartoon", "fluffy", "puffy", "soft", "stylized", "cute", "friendly", "light"],
        materialType: "CartoonClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.95, 0.95, 1.0],
            u_rimColor: [1.0, 0.9, 0.7],
            u_puffiness: 0.2,
            u_softness: 0.3
        }
    },
    {
        name: "Cartoon Bouncy",
        type: "effects",
        category: "environment",
        description: "Highly stylized bouncy cartoon clouds with exaggerated puffiness and vibrant colors",
        tags: ["cartoon", "bouncy", "exaggerated", "vibrant", "playful", "fun", "bright", "cheerful"],
        materialType: "CartoonClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 0.98, 1.0],
            u_rimColor: [1.0, 0.8, 0.5],
            u_puffiness: 0.4,
            u_softness: 0.2
        }
    },
    {
        name: "Cartoon Dreamy",
        type: "effects",
        category: "environment",
        description: "Soft pastel cartoon clouds with dreamy colors and smooth transitions",
        tags: ["cartoon", "dreamy", "pastel", "soft", "smooth", "gentle", "peaceful", "serene"],
        materialType: "CartoonClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.98, 0.95, 1.0],
            u_rimColor: [0.95, 0.85, 0.9],
            u_puffiness: 0.15,
            u_softness: 0.5
        }
    },
    // ===== STORM CLOUDS (3 variations) =====
    {
        name: "Storm Intense",
        type: "effects",
        category: "environment",
        description: "Intense dark storm clouds with high turbulence and frequent lightning strikes",
        tags: ["storm", "intense", "dark", "turbulent", "lightning", "dramatic", "dangerous", "threatening"],
        materialType: "StormClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.3, 0.3, 0.4],
            u_stormIntensity: 1.2,
            u_lightningFreq: 3.0,
            u_darkColor: [0.1, 0.1, 0.2],
            u_lightColor: [0.9, 0.9, 1.0],
            u_turbulence: 0.5
        }
    },
    {
        name: "Storm Brewing",
        type: "effects",
        category: "environment",
        description: "Gathering storm clouds with moderate intensity and building tension",
        tags: ["storm", "brewing", "gathering", "moderate", "ominous", "approaching", "moody", "gray"],
        materialType: "StormClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.4, 0.4, 0.45],
            u_stormIntensity: 0.8,
            u_lightningFreq: 1.5,
            u_darkColor: [0.2, 0.2, 0.25],
            u_lightColor: [0.8, 0.8, 0.9],
            u_turbulence: 0.35
        }
    },
    {
        name: "Storm Violent",
        type: "effects",
        category: "environment",
        description: "Extremely violent storm clouds with maximum turbulence and constant lightning",
        tags: ["storm", "violent", "extreme", "chaotic", "wild", "intense", "apocalyptic", "fierce"],
        materialType: "StormClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.2, 0.2, 0.3],
            u_stormIntensity: 1.8,
            u_lightningFreq: 5.0,
            u_darkColor: [0.05, 0.05, 0.15],
            u_lightColor: [1.0, 1.0, 1.0],
            u_turbulence: 0.8
        }
    },
    // ===== CIRRUS CLOUDS (3 variations) =====
    {
        name: "Cirrus Gentle",
        type: "effects",
        category: "environment",
        description: "Thin, wispy high-altitude cirrus clouds with gentle movement and high transparency",
        tags: ["cirrus", "wispy", "thin", "high", "gentle", "delicate", "transparent", "subtle"],
        materialType: "CirrusClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 1.0, 1.0],
            u_windSpeed: 0.05,
            u_transparency: 0.4,
            u_streakiness: 8.0
        }
    },
    {
        name: "Cirrus Fast",
        type: "effects",
        category: "environment",
        description: "Fast-moving cirrus clouds with pronounced streaks and dynamic appearance",
        tags: ["cirrus", "fast", "dynamic", "moving", "streaky", "wind", "flowing", "swift"],
        materialType: "CirrusClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [1.0, 0.98, 0.95],
            u_windSpeed: 0.15,
            u_transparency: 0.35,
            u_streakiness: 12.0
        }
    },
    {
        name: "Cirrus Thick",
        type: "effects",
        category: "environment",
        description: "Thicker cirrus clouds with reduced transparency and more visible cloud structure",
        tags: ["cirrus", "thick", "dense", "visible", "substantial", "prominent", "defined"],
        materialType: "CirrusClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.95, 0.95, 0.98],
            u_windSpeed: 0.03,
            u_transparency: 0.25,
            u_streakiness: 6.0
        }
    },
    // ===== PAINTERLY CLOUDS (3 variations) =====
    {
        name: "Painterly Impressionist",
        type: "effects",
        category: "environment",
        description: "Artistic clouds with visible brush strokes and impressionistic style, warm tones",
        tags: ["painterly", "artistic", "impressionist", "brush", "painted", "stylized", "warm", "creative"],
        materialType: "PainterlyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.9, 0.9, 0.95],
            u_brushSize: 2.0,
            u_paintTexture: null,
            u_baseColor: [0.9, 0.9, 0.95],
            u_highlightColor: [1.0, 0.95, 0.8],
            u_brushStrokes: 8.0,
            u_hasText: 0.0
        }
    },
    {
        name: "Painterly Bold",
        type: "effects",
        category: "environment",
        description: "Bold painterly clouds with large brush strokes and vibrant colors",
        tags: ["painterly", "bold", "large", "vibrant", "expressive", "dramatic", "striking", "colorful"],
        materialType: "PainterlyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.85, 0.88, 1.0],
            u_brushSize: 3.5,
            u_paintTexture: null,
            u_baseColor: [0.85, 0.88, 1.0],
            u_highlightColor: [1.0, 0.9, 0.7],
            u_brushStrokes: 6.0,
            u_hasText: 0.0
        }
    },
    {
        name: "Painterly Soft",
        type: "effects",
        category: "environment",
        description: "Soft painterly clouds with delicate brush work and subtle pastel colors",
        tags: ["painterly", "soft", "delicate", "pastel", "gentle", "subtle", "refined", "elegant"],
        materialType: "PainterlyClouds",
        settings: {
            u_time: 0,
            u_resolution: [800, 600],
            u_cameraPos: [0, 0, 0],
            u_cloudColor: [0.95, 0.92, 0.95],
            u_brushSize: 1.5,
            u_paintTexture: null,
            u_baseColor: [0.95, 0.92, 0.95],
            u_highlightColor: [0.98, 0.96, 0.92],
            u_brushStrokes: 10.0,
            u_hasText: 0.0
        }
    },
];
/**
 * Get a cloud preset by name
 */
export function getCloudPresetByName(name: string): CloudPreset | undefined {
    return effectsPresets.find(preset => preset.name === name);
}
/**
 * Get all cloud preset names
 */
export function getCloudPresetNames(): string[] {
    return effectsPresets.map(preset => preset.name);
}
/**
 * Get cloud presets by material type
 */
export function getCloudPresetsByMaterialType(materialType: string): CloudPreset[] {
    return effectsPresets.filter(preset => preset.materialType === materialType);
}
/**
 * Search cloud presets by tags
 */
export function searchCloudPresetsByTags(tags: string[]): CloudPreset[] {
    const lowerTags = tags.map(tag => tag.toLowerCase());
    return effectsPresets.filter(preset => preset.tags.some(tag => lowerTags.includes(tag.toLowerCase())));
}
