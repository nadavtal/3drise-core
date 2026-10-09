// =============================================================================
// LAND OBJECTS — bounded, placeable patches of terrain
// =============================================================================
//
// Object type 'land'; config.type is the LANDFORM ('mountains' | 'hills' | 'dunes'
// | 'canyon'), the same landforms as the environment terrain, rendered by the same
// height field and material (TERRAIN_PATCH). The environment terrain is the
// scene's one endless ground; a land object is a piece of land you place, move,
// rotate and size like any object, as many as you like.
//
// Transform vs knobs:
//   base       the object's position.y (there is no sea level)
//   footprint  scale.x / scale.z, in metres - a window onto the land: a wider patch
//              shows MORE land, it never stretches it
//   height     the `elevation` knob (metres); scale.y multiplies it (default 1)
//
import type { TerrainConfig, TerrainType } from '../environment/terrainConfigs';

export type LandObjectType = TerrainType;

export type LandQuality = 'low' | 'medium' | 'high';

export type LandObjectConfig = Omit<TerrainConfig, 'type' | 'terrainType' | 'seaLevel' | 'preset'> & {
    /** The landform. Picking a shape of another landform switches it. */
    type: LandObjectType;
    /** Which piece of the endless field this patch shows (structural). */
    seed: number;
    /** How far in from the border the land eases down to its base, as a fraction
     *  of the shorter side. 0 ends in a cliff. */
    edgeFade: number;
    /** Grid resolution: low 128, medium 256, high 384 cells a side (structural). */
    quality: LandQuality;
};
