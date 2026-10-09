import { TERRAIN_DEFAULTS, type TerrainType } from '../environment/terrainConfigs';
import { terrainOptionalProperties } from '../properties/tables/optionalProperties';
import type { LandObjectConfig, LandObjectType } from '../types/landObjects';

// =============================================================================
// LAND OBJECTS — defaults, labels, animatable knobs
// =============================================================================
//
// DERIVED from the environment terrain, not copied: a landform's numbers, ground
// and colours are TERRAIN_DEFAULTS[type], minus what the transform owns (sea level)
// and plus the patch's own knobs. One source, so a retuned landform or a new one
// reaches the land objects without a second edit.
//
// Animatable = the surface's lighting and colour knobs, exactly what the
// environment terrain animates: TerrainPatch pushes the whole merged config into
// the material every frame (applyTerrainUniforms), and the land-shape rows are
// marked animatable: false in TERRAIN_SCHEMA, so the ground itself never moves.
//

const LAND_KEYS: LandObjectType[] = ['mountains', 'hills', 'dunes', 'canyon'];

/** Starting footprint per landform (metres a side). The catalog entries'
 *  `transform.scale` (catalogInfo.ts) must say the same. */
export const LAND_FOOTPRINT: Record<LandObjectType, number> = {
    mountains: 5,
    hills: 5,
    dunes: 5,
    canyon: 5,
};

/** How many landform features fit across a patch's shorter side. */
export const LAND_FEATURES_ACROSS = 3;

/**
 * Scales a landform to a footprint: the environment terrain's numbers are tuned
 * for kilometres of endless ground, so on a patch one feature would fill the whole
 * thing and read as a flat-topped plinth. Feature size becomes 1/3 of the shorter
 * side, and every other length that belongs to the shape (height, dune wavelength)
 * scales by the same factor, so the shape keeps its proportions.
 */
export function fitLandToFootprint<C extends { featureSize: number; elevation: number; duneWavelength?: number }>(cfg: C, footprint: number): C {
    const target = Math.max(footprint, 0.01) / LAND_FEATURES_ACROSS;
    const k = target / Math.max(cfg.featureSize, 1e-3);
    // Centimetre precision: a patch can be a 5 m tabletop as well as a 5 km range.
    const cm = (v: number, min: number) => Math.max(min, Math.round(v * 100) / 100);
    return {
        ...cfg,
        featureSize: cm(target, 0.01),
        elevation: cm(cfg.elevation * k, 0.01),
        ...(cfg.duneWavelength !== undefined ? { duneWavelength: cm(cfg.duneWavelength * k, 0.05) } : {}),
    };
}

function landDefaults(type: TerrainType): LandObjectConfig {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type: _t, terrainType: _tt, seaLevel: _s, preset: _p, ...rest } = TERRAIN_DEFAULTS[type];
    return fitLandToFootprint({
        ...rest,
        type,
        enabled: true,
        seed: 1,
        edgeFade: 0.2,
        quality: 'medium',
    }, LAND_FOOTPRINT[type]);
}

export const DEFAULT_LAND_OBJECTS: Record<LandObjectType, LandObjectConfig> = Object.fromEntries(
    LAND_KEYS.map((k) => [k, landDefaults(k)]),
) as Record<LandObjectType, LandObjectConfig>;

export const LAND_OBJECT_LABELS: Record<LandObjectType, string> = {
    mountains: 'Mountains',
    hills: 'Hills',
    dunes: 'Dunes',
    canyon: 'Canyon',
};

const label = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

export const LAND_OBJECTS_ANIMATABLE: Record<LandObjectType, { value: string; label: string }[]> = Object.fromEntries(
    LAND_KEYS.map((k) => [
        k,
        terrainOptionalProperties(k)
            .filter((p) => (p.type === 'number' || p.type === 'color') && p.animatable !== false && p.name !== 'seaLevel')
            .map((p) => ({ value: p.name, label: p.label ?? label(p.name) })),
    ]),
) as Record<LandObjectType, { value: string; label: string }[]>;

export function isLandObjectConfig(config: unknown): config is LandObjectConfig {
    const t = (config as { type?: unknown } | null | undefined)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_LAND_OBJECTS, t);
}
