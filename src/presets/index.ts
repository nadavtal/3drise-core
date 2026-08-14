/**
 * Presets Index
 * Central export point for all preset collections
 */
// Sky presets
import { skyPresets } from "./skyPresets";
import type { SkyPreset } from './skyPresets';
import { oceanPresets } from "./oceanPresets";
import type { OceanPreset } from './oceanPresets';
import { cloudsPresets } from "./cloudsPresets";
import type { CloudPreset } from './cloudsPresets';
export { skyPresets, getSkyPresetByName, getSkyPresetNames, searchSkyPresetsByTags } from "./skyPresets";
// Ocean presets
export { oceanPresets, getOceanPresetByName, getOceanPresetNames, searchOceanPresetsByTags } from "./oceanPresets";
// Cloud presets
export { cloudsPresets, getCloudPresetByName, getCloudPresetNames, getCloudPresetsByMaterialType, searchCloudPresetsByTags } from "./cloudsPresets";
// Future preset exports will be added here:
// export { cloudPresets, type CloudPreset } from "./cloudPresets";
// export { rainPresets, type RainPreset } from "./rainPresets";
// export { fogPresets, type FogPreset } from "./fogPresets";
// export { starsPresets, type StarsPreset } from "./starsPresets";
// export { materialPresets, type MaterialPreset } from "./materialPresets";
// export { weatherPresets, type WeatherPreset } from "./weatherPresets";
// export { scenePresets, type ScenePreset } from "./scenePresets";
/**
 * Helper function to get all preset collections
 * Returns a map of preset type to preset arrays
 */
export function getAllPresetCollections(): {
        sky: SkyPreset[];
        ocean: OceanPreset[];
        clouds: CloudPreset[];
    } {
    return {
        sky: skyPresets,
        ocean: oceanPresets,
        clouds: cloudsPresets
        // Add more as they become available:
        // rain: rainPresets,
        // fog: fogPresets,
        // etc.
    };
}
/**
 * Get count of all available presets across all types
 */
export function getTotalPresetCount(): number {
    const collections = getAllPresetCollections();
    return Object.values(collections).reduce((total, presets) => total + presets.length, 0);
}
export const getPresetByName = (name: string): CloudPreset | OceanPreset | SkyPreset | null => {
    const collections = getAllPresetCollections();
    for (const key in collections) {
        const preset = collections[key].find((p) => p.name === name);
        if (preset)
            return preset;
    }
    return null;
};
