/**
 * Config shapes for the ocean that lives in this package.
 *
 * Declared locally rather than in `@3driseai/3drise-core`, alongside
 * `terrainConfigs.ts` and `cloudConfigs.ts`, because the material and the
 * renderer are here and nothing outside the viewer needs to construct these by
 * hand.
 *
 * Core's `OceanSettings` is the retired shape — a flat plane with a
 * `materialSettings` block picked out of the water material registry — and is
 * deliberately left alone: a saved project still carries one. Unlike terrain,
 * where a legacy blob normalises to NOTHING, a legacy ocean normalises to a real
 * ocean: a project saved before this system existed very possibly had water, and
 * dropping it would delete it. See `normalizeOcean` at the bottom.
 *
 * An ocean is ONE wave model in two containers, not two renderers — the same way
 * three of the four cloud types share one marcher and all four landforms share
 * one height field. `waterType` shapes the spectrum; `host` chooses the mesh.
 */

import type { ObjectAnimations, MouseMoveInteractions } from '../types/objectSettings';

/** The four water bodies the spectrum is shaped for. */
export type WaterType = 'sea' | 'lake' | 'storm' | 'shore';

/**
 * Where the water lives.
 *
 * `world` is the sea: a camera-following clipmap at `seaLevel`, one per scene,
 * mounted by the environment. `object` is a placed body of water — a pool, a
 * pond, a canal — a bounded grid with its own transform, any number of them,
 * mounted as ordinary scene objects. The clouds' `object` / `layer` split, and
 * for the same reason: a deck that stops at a sphere is not a deck, and a pool
 * that follows the camera is not a pool.
 */
export type WaterHost = 'world' | 'object';

/** Gerstner today; the FFT cascades land behind the same interface. */
export type WaveModel = 'gerstner' | 'fft';

export type ReflectionMode = 'planar' | 'env' | 'off';

export type TerrainInteraction = 'auto' | 'on' | 'off';

/** Fields every water body shares, whatever its type or host. */
export interface OceanSurfaceConfig {
    enabled: boolean;
    host: WaterHost;
    /** `gerstner` sums analytic trochoids in the vertex shader. `fft` swaps the
     *  height field for Tessendorf cascades and changes nothing above it — the
     *  material, the shading, the panel and the saved shape are identical. */
    waveModel: WaveModel;

    // ---- form ----
    /** World Y the surface sits at. **World host only** — a placed body takes its
     *  level from its own transform, which is what makes two water bodies at
     *  different heights in one scene work without either knowing about the
     *  other. Nothing here is tied to the terrain's `seaLevel`: the shoreline is
     *  computed from the difference, never configured. */
    seaLevel: number;
    /** Extent of a placed body, in world units. **Object host only.** */
    size: [number, number];
    /** Grid resolution of a placed body. **Object host only.** */
    segments: number;
    /** Fraction of the half-extent over which displacement tapers to zero at the
     *  rim of a placed body. **Object host only.** Without it the boundary is a
     *  sawn-off cliff of water. */
    edgeFade: number;

    /** Wind speed at 10 m, in m/s. The whole sea state comes off this: peak
     *  wavelength goes as U squared and significant wave height with it, so this
     *  is the one knob that decides whether this is a millpond or a gale. */
    windSpeed: number;
    /** Compass bearing the wind blows toward, in degrees. Waves travel with it. */
    windBearing: number;
    /** Open water upwind, in km. Short fetch means small, short, steep waves
     *  however hard it blows — which is exactly why a lake in a storm does not
     *  look like an ocean in one. */
    fetch: number;
    /** Angular spread of the wave train about the wind bearing, in degrees. Zero
     *  gives a corduroy of parallel crests; real seas run 25-40. */
    directionalSpread: number;
    /** Number of trochoidal components summed. Cost is linear in it, and every
     *  component is a sin and a cos per vertex. */
    waveComponents: number;
    /** Artistic multiplier over the physically derived wave height. 1 is the
     *  Pierson-Moskowitz fit for the given wind and fetch. */
    amplitudeScale: number;
    /** Horizontal displacement, as a fraction of the limit where a crest folds
     *  through itself. This is what makes crests peaked rather than sinusoidal —
     *  and it is what generates the Jacobian that foam is read from, so at 0
     *  there are no whitecaps to find. */
    choppiness: number;
    /** Energy pushed toward the long, low, narrow-band end of the spectrum.
     *  Swell is what has travelled out of the weather that made it. */
    swell: number;
    /** Extra steepening of the shorter components. Above ~1 the surface starts to
     *  self-intersect and the wave folds inside out; clamped in the uniforms. */
    steepness: number;

    // ---- foam ----
    /** How much of the compressing surface reads as whitecap. */
    foamAmount: number;
    /** How far foam trails behind the crest that made it. A real whitecap
     *  persists after the crest has moved on; at 0 it flickers on and off with
     *  the crest and reads as sparkle rather than as foam. */
    foamDecay: number;
    /** Size of the break-up noise in the foam, in world units. */
    foamSize: number;

    // ---- surface ----
    /** Water seen at depth — the body colour. */
    deepColor: string;
    /** Water seen over something close behind it. Until the refraction grab
     *  exists this is the grazing tint; after it, it is the shallow end of the
     *  absorption ramp. */
    shallowColor: string;
    foamColor: string;
    /** Beer-Lambert absorption per metre. Higher swallows the bottom sooner. */
    absorption: number;
    /** Suspended matter. Lifts the shallow colour and softens the refraction. */
    clarity: number;
    /** Widens the specular lobe. Water is smooth; this is fine detail below the
     *  mesh, not surface finish. */
    roughness: number;
    /** Specular strength. The sun glitter path from horizon to camera is most of
     *  what says "water" at distance, and it comes from here. */
    specular: number;
    /** Sun scattering through the body of a wave — crests glowing when the sun is
     *  behind them. The second-most recognisable water cue after glitter. */
    sssStrength: number;
    sssColor: string;
    /** High-frequency normal detail added per fragment, below mesh resolution.
     *  This is where the energy lost to the per-ring wave LOD goes. */
    detailStrength: number;
    /** Size of that detail, in world units. */
    detailSize: number;

    // ---- lighting and integration ----
    reflection: ReflectionMode;
    /** Strength of the refracted (see-through) term once the grab exists. */
    refraction: number;
    /** Sky-dome fill, from the same atmosphere the sky and clouds use. */
    ambient: number;
    /** Rate distant water fades into the sky behind it. Water needs more of this
     *  than ground, because most of what you see looking at the sea IS the sky. */
    aerialPerspective: number;
    /** Radiance scale, so water sits at the same exposure as sky, clouds and
     *  terrain whether or not the cloud composite is tonemapping the frame. */
    exposure: number;

    // ---- terrain ----
    /** `auto` turns on when the scene has terrain enabled. Off costs nothing:
     *  every terrain branch in the shader early-outs on one uniform. */
    terrainInteraction: TerrainInteraction;
    /** Strength of the terrain shadow marched down the sun vector. Terrain does
     *  not write into the scene shadow map — its shadow camera is framed around
     *  objects — so this is the only way a headland shadows the water beside it. */
    terrainShadow: number;
    /** Depth over which the shallow colour and the shore foam ramp in. */
    shoreDepth: number;
    /** Strength of the foam line where the ground comes up through the surface. */
    shoreFoam: number;
}

/**
 * A water body, as stored.
 *
 * `type` is 'ocean' — the OBJECT type anything routing on object type reads —
 * with the model kept separately in `waterType` and the container in `host`,
 * exactly as the clouds keep `deckType` and the terrain keeps `terrainType` apart
 * from `type`.
 */
export type OceanConfig = OceanSurfaceConfig & {
    type: 'ocean';
    waterType: WaterType;
    /** Name of the preset the numbers came from, or '' once any of them is
     *  edited. Purely a UI bookmark — the renderer never reads it. */
    preset?: string;
};

/** Cost and extent knobs. World-host geometry lives here; a placed body sizes
 *  itself from its own config, because its extent is a design decision rather
 *  than a performance one. */
export interface OceanQualityConfig {
    /** Clipmap ring count. Each doubles its cell size, so visible radius is
     *  roughly `cellSize * segments * 2^(levels-1)`. */
    levels: number;
    /** Grid resolution per ring side. */
    segments: number;
    /** Finest cell, in world units, at the camera. Water is smooth, so this
     *  matters more than reach: waves are metres, not kilometres. */
    cellSize: number;
    /** 1/(2R). Drops the surface away with the square of distance so the sea
     *  meets a real horizon instead of running flat to the far plane. */
    curvature: number;
    /** Resolution of the planar reflection target, as a fraction of the frame.
     *  0 disables the pass and falls back to `scene.environment`. */
    reflectionScale: number;
    /** Resolution of the refraction/depth grab, as a fraction of the frame. */
    refractionScale: number;
    /** Steps in the terrain shadow march, nearest the camera. 0 disables it. */
    terrainShadowSteps: number;
    /** Range over which that march fades out. It runs per vertex, so lowering
     *  this drops whole clipmap rings out of it. */
    terrainShadowDistance: number;
    /** Distance over which the fragment-stage ripple detail fades out. */
    detailFadeDistance: number;
    /** Receive the scene's directional shadow map, so objects cast onto water. */
    receiveShadows: boolean;
    wireframe: boolean;
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const surfaceBase: Omit<OceanSurfaceConfig, 'enabled'> = {
    host: 'world',
    waveModel: 'gerstner',

    seaLevel: 0,
    size: [40, 40],
    segments: 128,
    edgeFade: 0.15,

    windSpeed: 9,
    windBearing: 210,
    fetch: 300,
    directionalSpread: 32,
    waveComponents: 20,
    amplitudeScale: 1,
    choppiness: 0.85,
    swell: 0.35,
    steepness: 0.6,

    foamAmount: 0.8,
    foamDecay: 0.5,
    foamSize: 6,

    deepColor: '#052539',
    shallowColor: '#1b7f8c',
    foamColor: '#eef6f8',
    absorption: 0.06,
    clarity: 0.25,
    roughness: 0.09,
    specular: 1,
    sssStrength: 0.7,
    sssColor: '#2f8f74',
    detailStrength: 0.55,
    detailSize: 2.2,

    reflection: 'planar',
    refraction: 1,
    ambient: 1,
    aerialPerspective: 0.00009,
    exposure: 1,

    terrainInteraction: 'auto',
    terrainShadow: 1,
    shoreDepth: 3,
    shoreFoam: 1,
};

/** Open ocean. The reference case: long swell under a wind sea, deep colour. */
export const defaultSeaConfig: OceanConfig = {
    ...surfaceBase,
    type: 'ocean',
    waterType: 'sea',
    preset: '',
    enabled: true,
};

/**
 * Inland water. Short fetch is doing all the work here — a lake in a gale still
 * has small, short, steep waves, because there is no room upwind to build
 * anything longer. Greener and murkier, because inland water is.
 */
export const defaultLakeConfig: OceanConfig = {
    ...surfaceBase,
    type: 'ocean',
    waterType: 'lake',
    preset: '',
    enabled: true,
    windSpeed: 3.5,
    fetch: 2,
    directionalSpread: 22,
    waveComponents: 12,
    choppiness: 0.5,
    swell: 0.05,
    foamAmount: 0.2,
    deepColor: '#0d2c2a',
    shallowColor: '#2c7d6b',
    absorption: 0.14,
    clarity: 0.45,
    detailStrength: 0.7,
    detailSize: 1.2,
    aerialPerspective: 0.00006,
};

/** Storm sea. Steep, broken, and mostly foam at the top of the range. */
export const defaultStormConfig: OceanConfig = {
    ...surfaceBase,
    type: 'ocean',
    waterType: 'storm',
    preset: '',
    enabled: true,
    windSpeed: 22,
    fetch: 600,
    directionalSpread: 45,
    waveComponents: 28,
    choppiness: 1.1,
    swell: 0.5,
    steepness: 0.8,
    foamAmount: 1.5,
    foamDecay: 0.75,
    foamSize: 12,
    deepColor: '#0a1c26',
    shallowColor: '#2b5f66',
    clarity: 0.6,
    roughness: 0.16,
    sssStrength: 0.35,
    aerialPerspective: 0.00016,
};

/**
 * Coastal water. Narrow spread, because waves refract into alignment with the
 * beach as they shoal, and a much stronger shoreline because that is the whole
 * point of the type.
 */
export const defaultShoreConfig: OceanConfig = {
    ...surfaceBase,
    type: 'ocean',
    waterType: 'shore',
    preset: '',
    enabled: true,
    windSpeed: 7,
    fetch: 80,
    directionalSpread: 14,
    waveComponents: 16,
    choppiness: 0.95,
    swell: 0.8,
    foamAmount: 1,
    foamDecay: 0.8,
    deepColor: '#0a3a4a',
    shallowColor: '#3fb5b0',
    absorption: 0.09,
    clarity: 0.35,
    shoreDepth: 6,
    shoreFoam: 1.4,
};

export const defaultOceanQuality: OceanQualityConfig = {
    levels: 8,
    segments: 96,
    cellSize: 1.5,
    curvature: 1 / (2 * 6371000),
    reflectionScale: 0.5,
    refractionScale: 0.5,
    terrainShadowSteps: 10,
    terrainShadowDistance: 4000,
    detailFadeDistance: 900,
    receiveShadows: true,
    wireframe: false,
};

/** Per-type defaults, for the controller's type switcher. */
export const OCEAN_DEFAULTS: Record<WaterType, OceanConfig> = {
    sea: defaultSeaConfig,
    lake: defaultLakeConfig,
    storm: defaultStormConfig,
    shore: defaultShoreConfig,
};

/** Object-host bodies are small, still and shallow by default — a pool, not a
 *  shrunken sea. Applied on top of the type when the host is switched. */
export const OBJECT_HOST_OVERRIDES: Partial<OceanSurfaceConfig> = {
    host: 'object',
    windSpeed: 2,
    fetch: 0.05,
    waveComponents: 10,
    directionalSpread: 40,
    choppiness: 0.35,
    swell: 0,
    foamAmount: 0.05,
    detailStrength: 0.85,
    detailSize: 0.4,
    absorption: 0.25,
    shoreDepth: 0.6,
};

// -----------------------------------------------------------------------------
// Property schema — presentation and agent metadata
// -----------------------------------------------------------------------------

export type OceanPropertyGroup = 'form' | 'waves' | 'surface' | 'shore' | 'quality';

/**
 * Everything the controller needs to build a row and everything the AI context
 * builder needs to know what a knob does and where it is safe. The runtime never
 * reads this — defaults live in the config objects above.
 *
 * `kind` exists here and not in the terrain schema because the ocean exposes
 * colours and choices, not only numbers.
 */
export interface OceanPropertySchema {
    key: string;
    label: string;
    group: OceanPropertyGroup;
    /** How the value is edited and what can carry it. Absent means a ranged
     *  number, which is the common case. Anything that is not a number cannot
     *  ride in the agent's numeric changes list, so the agent filters on this
     *  too — see the ocean catalog in aiAgent. */
    kind?: 'number' | 'color' | 'boolean' | 'select' | 'vector2';
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    description: string;
    advanced?: boolean;
    /** false = structural: set only (controllers, action patches), never driven per
     *  frame (timeline, mouse-move, AI clips). Absent = numbers / colours animate. */
    animatable?: boolean;
    /** Only show for these water types. Absent means all. */
    types?: WaterType[];
    /** Only show on these hosts. A placed pool has no sea level and the sea has
     *  no size; showing either is worse than hiding it, because a row that does
     *  nothing reads as a bug in the renderer. */
    hosts?: WaterHost[];
}

export const OCEAN_SCHEMA: OceanPropertySchema[] = [
    { key: 'seaLevel', animatable: false, label: 'Sea level', group: 'form', min: -2000, max: 2000, step: 0.5, unit: 'm', hosts: ['world'], description: 'World height of the surface. Independent of the terrain sea level — the shoreline is computed from the difference, so two water bodies at different heights in one scene are fine.' },
    { key: 'size', animatable: false, label: 'Size', group: 'form', kind: 'vector2', hosts: ['object'], advanced: true, description: 'Extent of this body of water, in world units.' },
    { key: 'segments', animatable: false, label: 'Resolution', group: 'form', min: 16, max: 512, step: 8, hosts: ['object'], description: 'Grid resolution of this body. A wave shorter than two cells cannot be drawn, so this is what limits how fine the ripples can be.' },
    { key: 'edgeFade', label: 'Edge fade', group: 'form', min: 0, max: 0.5, step: 0.005, hosts: ['object'], description: 'Fraction of the half-extent over which the waves taper to nothing at the rim. Without it the boundary is a sawn-off cliff of water.' },

    { key: 'windSpeed', label: 'Wind speed', group: 'waves', min: 0, max: 40, step: 0.1, unit: 'm/s', description: 'Wind at 10 m. The whole sea state comes off this: peak wavelength and wave height both go as the square of it.' },
    { key: 'windBearing', label: 'Wind bearing', group: 'waves', min: 0, max: 360, step: 1, unit: 'deg', description: 'Direction the wind blows toward. The waves travel with it.' },
    { key: 'fetch', label: 'Fetch', group: 'waves', min: 0.01, max: 2000, step: 0.5, unit: 'km', description: 'Open water upwind. Short fetch means small, short, steep waves however hard it blows — which is why a lake in a gale looks nothing like an ocean in one.' },
    { key: 'directionalSpread', label: 'Spread', group: 'waves', min: 0, max: 90, step: 0.5, unit: 'deg', description: 'Angular spread of the wave train about the wind. At 0 the sea is corduroy; real seas run 25-40.' },
    { key: 'waveComponents', animatable: false, label: 'Wave count', group: 'waves', min: 4, max: 32, step: 1, description: 'Trochoids summed per vertex. Cost is linear in it. Past ~24 the extra components are shorter than the finest cell can carry and are faded out anyway.' },
    { key: 'amplitudeScale', label: 'Wave height', group: 'waves', min: 0, max: 3, step: 0.01, description: 'Multiplier over the physically derived height. 1 is the Pierson-Moskowitz fit for this wind and fetch.' },
    { key: 'choppiness', label: 'Choppiness', group: 'waves', min: 0, max: 1.5, step: 0.005, description: 'Horizontal displacement. Peaked crests and flat troughs instead of sine waves — and the source of the Jacobian that whitecaps are found from, so at 0 there is no foam to find.' },
    { key: 'swell', label: 'Swell', group: 'waves', min: 0, max: 1, step: 0.005, description: 'Energy pushed toward the long, low, narrow-band end. Swell is what has travelled out of the weather that made it.' },
    { key: 'steepness', label: 'Steepness', group: 'waves', min: 0, max: 1, step: 0.005, description: 'Extra steepening of the shorter components. Clamped below the point where a trochoid folds through itself.' },
    { key: 'foamAmount', label: 'Whitecaps', group: 'waves', min: 0, max: 2, step: 0.01, description: 'How much of the compressing surface reads as foam. Needs choppiness above zero.' },
    { key: 'foamDecay', label: 'Foam persistence', group: 'waves', min: 0, max: 1, step: 0.01, description: 'How far foam trails behind the crest that made it. At 0 it flickers on and off with the crest and reads as sparkle rather than foam.' },
    { key: 'foamSize', label: 'Foam texture', group: 'waves', min: 0.2, max: 40, step: 0.1, unit: 'm', advanced: true, description: 'Size of the break-up noise in the foam.' },

    { key: 'deepColor', label: 'Deep colour', group: 'surface', kind: 'color', description: 'The body colour of the water — what you see where there is nothing behind it.' },
    { key: 'shallowColor', label: 'Shallow colour', group: 'surface', kind: 'color', description: 'Water over something close behind it. The grazing tint, and the shallow end of the shoreline ramp.' },
    { key: 'foamColor', label: 'Foam colour', group: 'surface', kind: 'color', description: 'Whitecaps and shore foam.' },
    { key: 'absorption', label: 'Absorption', group: 'surface', min: 0, max: 1, step: 0.005, unit: '1/m', description: 'Beer-Lambert absorption per metre. Higher swallows the bottom sooner.' },
    { key: 'clarity', label: 'Turbidity', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Suspended matter. Lifts the shallow colour and softens what is seen through the surface.' },
    { key: 'roughness', label: 'Roughness', group: 'surface', min: 0.01, max: 0.6, step: 0.005, description: 'Widens the specular lobe. This is sub-mesh ripple, not surface finish — water itself is smooth.' },
    { key: 'specular', label: 'Glitter', group: 'surface', min: 0, max: 3, step: 0.01, description: 'Specular strength. The sun path from horizon to camera is most of what says "water" at distance.' },
    { key: 'sssStrength', label: 'Subsurface', group: 'surface', min: 0, max: 2, step: 0.01, description: 'Sun scattering through the body of a wave — crests glowing when the sun is behind them.' },
    { key: 'sssColor', label: 'Subsurface colour', group: 'surface', kind: 'color', advanced: true, description: 'Colour of that glow. Green in coastal water, blue offshore.' },
    { key: 'detailStrength', label: 'Ripple detail', group: 'surface', min: 0, max: 2, step: 0.01, description: 'Per-fragment normal detail below mesh resolution. This is where the energy lost to the per-ring wave LOD goes.' },
    { key: 'detailSize', label: 'Ripple size', group: 'surface', min: 0.1, max: 20, step: 0.05, unit: 'm', description: 'Size of that detail.' },
    { key: 'ambient', label: 'Ambient', group: 'surface', min: 0, max: 3, step: 0.01, advanced: true, description: 'Sky-dome fill, from the same atmosphere the sky and clouds use.' },
    { key: 'aerialPerspective', label: 'Aerial perspective', group: 'surface', min: 0, max: 0.0006, step: 0.000002, unit: '1/m', description: 'Rate distant water fades into the sky behind it. Water needs more of this than ground, because most of what you see looking at the sea is the sky.' },
    { key: 'exposure', label: 'Exposure', group: 'surface', min: 0.2, max: 4, step: 0.01, advanced: true, description: 'Radiance scale, so water matches sky, clouds and terrain whether or not the cloud composite tonemaps the frame.' },

    { key: 'terrainShadow', label: 'Terrain shadow', group: 'shore', min: 0, max: 1, step: 0.01, description: 'Strength of the shadow marched down the sun vector against the terrain height field. Terrain does not write into the scene shadow map, so this is the only way a headland shadows the water beside it.' },
    { key: 'shoreDepth', label: 'Shore depth', group: 'shore', min: 0.05, max: 60, step: 0.05, unit: 'm', description: 'Depth over which the shallow colour and the shore foam ramp in.' },
    { key: 'shoreFoam', label: 'Shore foam', group: 'shore', min: 0, max: 2, step: 0.01, description: 'Foam where the ground comes up through the surface.' },
];

export const OCEAN_QUALITY_SCHEMA: OceanPropertySchema[] = [
    { key: 'levels', label: 'Clipmap levels', group: 'quality', min: 2, max: 12, step: 1, description: 'Each ring doubles its cell size, so visible radius is roughly cellSize x segments x 2^(levels-1). Levels only buy reach; there is no point past where haze has dissolved the surface.' },
    { key: 'segments', label: 'Ring resolution', group: 'quality', min: 32, max: 320, step: 8, description: 'Grid resolution per ring side. Vertex cost is levels x segments^2 x 0.75, since every ring above the first is hollow.' },
    { key: 'cellSize', label: 'Cell size', group: 'quality', min: 0.1, max: 32, step: 0.1, unit: 'm', description: 'Finest cell, at the camera, and the shortest wave that can be drawn anywhere. Waves are metres, not kilometres, so on water this matters more than reach does.' },
    { key: 'curvature', label: 'Planetary curvature', group: 'quality', min: 0, max: 0.0000012, step: 0.00000001, advanced: true, description: '1/(2R). Drops the surface with the square of distance so it meets a real horizon.' },
    { key: 'detailFadeDistance', label: 'Detail fade distance', group: 'quality', min: 50, max: 8000, step: 25, unit: 'm', description: 'Distance over which the fragment-stage ripple fades out. Removes far-field shimmer and buys back most of its own cost.' },
    { key: 'terrainShadowSteps', label: 'Terrain shadow steps', group: 'quality', min: 0, max: 32, step: 1, description: 'Steps in the terrain shadow march, nearest the camera. 0 turns it off entirely — the biggest single saving when the scene has terrain.' },
    { key: 'terrainShadowDistance', label: 'Terrain shadow distance', group: 'quality', min: 0, max: 40000, step: 100, unit: 'm', description: 'Range over which that march fades out. It runs per vertex, so lowering this drops whole rings out of it.' },
    { key: 'reflectionScale', label: 'Reflection resolution', group: 'quality', min: 0, max: 1, step: 0.05, description: 'Planar reflection target size, as a fraction of the frame. 0 disables the pass and falls back to the environment map.' },
    { key: 'refractionScale', label: 'Refraction resolution', group: 'quality', min: 0, max: 1, step: 0.05, description: 'Refraction and depth grab size, as a fraction of the frame. The shoreline reads its depth from this.' },
];

// -----------------------------------------------------------------------------
// Settings — the object the environment slice stores and the panel edits
// -----------------------------------------------------------------------------

/** Transform of a placed body. Same shape the rest of the app uses. */
export interface OceanMeshSettings {
    name?: string;
    visible: boolean;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

/**
 * A water body, as stored.
 *
 * Named `OceanWaterSettings` because core already exports an `OceanSettings` —
 * the retired flat-plane-plus-material shape — and a saved project may still
 * carry one. Same reason `ProceduralTerrainSettings` is not `TerrainSettings`.
 *
 * `meshSettings` is present only on the object host. The world ocean has no
 * transform to edit: its clipmap follows the camera, and its one positional
 * degree of freedom is `config.seaLevel`.
 */
export interface OceanWaterSettings {
    id: string;
    type: 'ocean';
    parentid?: string;
    config: OceanConfig;
    quality: OceanQualityConfig;
    /** Object host only. */
    meshSettings?: OceanMeshSettings;
    /** Per-domain keyframes; the `ocean` domain drives the water's config knobs. */
    animations?: ObjectAnimations;
    /** Per-domain pointer bindings; same `ocean` domain. */
    mouseMove?: MouseMoveInteractions;
}

export const defaultOceanWaterSettings: OceanWaterSettings = {
    id: '3drise-water',
    type: 'ocean',
    config: { ...defaultSeaConfig, enabled: false },
    quality: { ...defaultOceanQuality },
};

// =============================================================================
// Normalisation
// =============================================================================
//
// A published scene loads whatever was in the database the day it was saved.
//
// **This is where the ocean deliberately differs from the terrain.**
// `normalizeTerrain` returns null for a legacy blob, because a project saved
// before terrain existed never had ground and defaulting one in would give it a
// landscape it was never authored with. A project saved before THIS system very
// possibly had water — the old ocean is a visible flat plane with a water
// material — so returning null would DELETE it. A legacy blob is therefore
// mapped, not dropped.
//
// Each block still merges over its own defaults separately, so editing quality
// does not hand the surface a new config object and rebuild the clipmap.

const WATER_TYPES: readonly WaterType[] = ['sea', 'lake', 'storm', 'shore'];
const WATER_HOSTS: readonly WaterHost[] = ['world', 'object'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

/**
 * The five water material variants the old ocean shipped with, onto the closest
 * new type and the numbers that make it read the same way. This is why the
 * preset list is seeded from the same five names: they were already the
 * vocabulary.
 */
const LEGACY_VARIANTS: Record<string, { waterType: WaterType; settings: Partial<OceanSurfaceConfig> }> = {
    Lake: { waterType: 'lake', settings: {} },
    Ocean: { waterType: 'sea', settings: {} },
    Storm: { waterType: 'storm', settings: {} },
    Tropical: {
        waterType: 'sea',
        settings: {
            windSpeed: 5,
            fetch: 120,
            deepColor: '#0a5a7a',
            shallowColor: '#4fd6c8',
            absorption: 0.04,
            clarity: 0.12,
            sssColor: '#39c8b0',
        },
    },
    Arctic: {
        waterType: 'sea',
        settings: {
            windSpeed: 13,
            deepColor: '#0b2436',
            shallowColor: '#7fb6c9',
            sssColor: '#8fd0e0',
            clarity: 0.15,
            foamAmount: 1.1,
        },
    },
};

/**
 * A blob in the retired shape: `meshSettings` + `materialSettings` + a
 * `config` of `{ planeSize, planeSegments }`. Recognised by the absence of
 * `waveModel`, which every new config has.
 *
 * The plane it was authored with decides the host. The default was 10 000, so
 * every existing scene becomes the world ocean — which is what those scenes
 * look like today. A small plane was somebody placing a pond, and becomes one.
 */
function fromLegacy(raw: Record<string, unknown>): OceanConfig {
    const mesh = isRecord(raw.meshSettings) ? raw.meshSettings : {};
    const material = isRecord(raw.materialSettings) ? raw.materialSettings : {};
    const legacyConfig = isRecord(raw.config) ? raw.config : {};

    const variantName = typeof material.materialVariant === 'string' ? material.materialVariant : 'Ocean';
    const variant = LEGACY_VARIANTS[variantName] ?? LEGACY_VARIANTS.Ocean;

    const planeSize = Array.isArray(legacyConfig.planeSize) ? Number(legacyConfig.planeSize[0]) : 10000;
    const host: WaterHost = Number.isFinite(planeSize) && planeSize < 2000 ? 'object' : 'world';

    const position = Array.isArray(mesh.position) ? mesh.position : [0, 0, 0];
    const level = Number(position[1]);

    const base = OCEAN_DEFAULTS[variant.waterType];
    return {
        ...base,
        ...(host === 'object' ? OBJECT_HOST_OVERRIDES : {}),
        ...variant.settings,
        type: 'ocean',
        waterType: variant.waterType,
        host,
        enabled: mesh.visible !== false,
        seaLevel: Number.isFinite(level) ? level : 0,
        size: host === 'object' && Number.isFinite(planeSize) ? [planeSize, planeSize] : base.size,
        preset: variantName in LEGACY_VARIANTS ? variantName : '',
    };
}

/**
 * Surface block merged over its type's defaults, or null when there is nothing
 * to render. Unlike the terrain, a legacy blob is mapped rather than dropped —
 * see the note above.
 */
export function normalizeOcean(raw: unknown, whole?: unknown): OceanConfig | null {
    if (!isRecord(raw)) {
        // No config block. If the surrounding blob is the retired shape, it is a
        // real ocean that predates this system; map it.
        if (isRecord(whole) && (isRecord(whole.materialSettings) || isRecord(whole.meshSettings))) {
            return fromLegacy(whole);
        }
        return null;
    }
    if (typeof raw.waveModel !== 'string' && isRecord(whole) && isRecord(whole.materialSettings)) {
        return fromLegacy(whole);
    }

    const waterType = WATER_TYPES.includes(raw.waterType as WaterType)
        ? (raw.waterType as WaterType)
        : 'sea';
    const host = WATER_HOSTS.includes(raw.host as WaterHost)
        ? (raw.host as WaterHost)
        : 'world';

    return {
        ...OCEAN_DEFAULTS[waterType],
        ...(host === 'object' ? OBJECT_HOST_OVERRIDES : {}),
        ...(raw as Partial<OceanConfig>),
        type: 'ocean',
        waterType,
        host,
    };
}

export function normalizeOceanQuality(raw: unknown): OceanQualityConfig {
    return { ...defaultOceanQuality, ...(isRecord(raw) ? (raw as Partial<OceanQualityConfig>) : {}) };
}

/** A whole settings blob, from a project of any age. */
export function normalizeOceanSettings(raw: unknown): OceanWaterSettings {
    const source = isRecord(raw) ? raw : {};
    const config = normalizeOcean(source.config, source);
    const settings: OceanWaterSettings = {
        id: typeof source.id === 'string' ? source.id : defaultOceanWaterSettings.id,
        type: 'ocean',
        config: config ?? { ...defaultSeaConfig, enabled: false },
        quality: normalizeOceanQuality(source.quality),
    };
    if (settings.config.host === 'object') {
        const mesh = isRecord(source.meshSettings) ? source.meshSettings : {};
        settings.meshSettings = {
            visible: mesh.visible !== false,
            position: (Array.isArray(mesh.position) ? mesh.position : [0, settings.config.seaLevel, 0]) as [number, number, number],
            rotation: (Array.isArray(mesh.rotation) ? mesh.rotation : [0, 0, 0]) as [number, number, number],
            scale: (Array.isArray(mesh.scale) ? mesh.scale : [1, 1, 1]) as [number, number, number],
        };
    }
    if (isRecord(source.animations)) settings.animations = source.animations as unknown as ObjectAnimations;
    if (isRecord(source.mouseMove)) settings.mouseMove = source.mouseMove as unknown as MouseMoveInteractions;
    return settings;
}
