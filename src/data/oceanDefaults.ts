import type { OceanConfig } from '../environment/oceanConfigs';
import { defaultLakeConfig, OBJECT_HOST_OVERRIDES } from '../environment/oceanConfigs';

/**
 * Placed water bodies — the `water` object type's variants (pool, pond, lake,
 * canal). The object host of the water surface (`claude/ocean-flow-plan.md` §5):
 * one shader, one wave field, a bounded grid sized by the transform.
 *
 * Each body is the lake type with the object-host overrides, then the look that
 * names it. They are patches over `defaultLakeConfig`, so a knob added to the
 * water surface reaches every body without being listed here. `size` is the grid
 * before the transform's scale — a 1 x 1 grid, so the Transform tab's scale IS
 * the body's extent in metres (the catalogue transform sets the starting one).
 */
const body = (patch: Partial<OceanConfig>): OceanConfig => ({
    ...defaultLakeConfig,
    ...OBJECT_HOST_OVERRIDES,
    host: 'object',
    waterType: 'lake',
    preset: '',
    size: [1, 1],
    edgeFade: 0.08,
    reflection: 'env',
    ...patch,
});

export const DEFAULT_WATER_BODIES: Record<string, OceanConfig> = {
    // Livelier since 27 Oct 2026 (Nadav: "all water objects are static?"): the
    // first defaults were real-world calm, and at viewing distance calm reads as
    // still. Tuned in the studio until each moves visibly at 2-3x its own size
    // (mean frame-to-frame change over the water ~25 grey levels per second, was
    // ~4 for the pool). claude/water-current-built.md.
    /** A swimming pool: clear, sunlit water with fine moving ripples and a faint
     *  circulation (tropical-shallows colour). */
    pool: body({
        segments: 64,
        windSpeed: 2, windBearing: 90, directionalSpread: 50, choppiness: 0.4, foamAmount: 0,
        flowSpeed: 0.05, flowDirection: 90,
        roughness: 0.025, specular: 1.5, detailStrength: 1, detailSize: 0.35,
        deepColor: '#1a7ea6', shallowColor: '#4fd6c8', sssColor: '#39c8b0',
        absorption: 0.08, clarity: 0.1,
    }),
    /** A garden pond: wind ripples drifting across murky green water. */
    pond: body({
        segments: 96,
        windSpeed: 3, windBearing: 120, directionalSpread: 45, amplitudeScale: 0.75, choppiness: 0.5, foamAmount: 0.03,
        flowSpeed: 0.08, flowDirection: 120,
        roughness: 0.05, detailStrength: 1, detailSize: 0.6,
        absorption: 0.25, clarity: 0.5,
    }),
    /** A lake: real wind over inland water (the lake type's own defaults), on a
     *  finer grid because it is big. */
    // Tuned in the studio on a 120 x 80 m body: the long components that survive
    // the grid's LOD are near-parallel (the model narrows the spread at the long
    // end), so a big body reads as corduroy from above unless the wind is spread,
    // the amplitude halved and the glitter softened. Low views read as a lake.
    lake: body({
        segments: 256,
        windSpeed: 5.5, fetch: 2, waveComponents: 16, directionalSpread: 35,
        amplitudeScale: 0.55, choppiness: 0.6, swell: 0.05, foamAmount: 0.15,
        flowSpeed: 0.05, flowDirection: 210,
        specular: 0.7, detailStrength: 0.9, detailSize: 1.2,
        absorption: 0.14, clarity: 0.45,
        shoreDepth: 3,
    }),
    /** A canal: dark water running slowly along its length (local z — the
     *  catalogue canal is 6 x 60 m), the waves travelling with the current. */
    canal: body({
        segments: 96,
        windSpeed: 2.2, windBearing: 0, directionalSpread: 25, amplitudeScale: 0.45, choppiness: 0.35, foamAmount: 0,
        flowSpeed: 0.35, flowDirection: 0,
        roughness: 0.06, specular: 0.5, detailStrength: 0.75, detailSize: 0.6,
        deepColor: '#13343a', shallowColor: '#2f6f6a',
        absorption: 0.2, clarity: 0.55,
    }),
};

export const WATER_BODY_LABELS: Record<string, string> = {
    pool: 'Pool',
    pond: 'Pond',
    lake: 'Lake',
    canal: 'Canal',
};

export type WaterBodyKey = keyof typeof DEFAULT_WATER_BODIES;
