/**
 * Config shapes for the procedural terrain system that lives in this package.
 *
 * Declared locally rather than in `@3driseai/3drise-core`, alongside
 * `cloudConfigs.ts` and `gridConfigs.ts`, because the material and the renderer
 * are here and nothing outside the viewer needs to construct these by hand.
 *
 * Core's `TerrainSettings` is the retired flat shape (`visible` +
 * `displacementScale`) and is deliberately left alone: a saved project still
 * carries it, and `normalizeTerrain` below is what turns one into nothing rather
 * than into a mountain range the scene was never authored with.
 *
 * A terrain is ONE landform model with per-type shaping, not four renderers —
 * the same way three of the four cloud types share one marcher. What separates
 * mountains from dunes is the operator applied to the fBm and the numbers around
 * it, so the type is a config field the shader branches on.
 */

import type { ObjectAnimations, MouseMoveInteractions } from '../types/objectSettings';


/** The four landforms the height function shapes. */
export type TerrainType = 'mountains' | 'dunes' | 'hills' | 'canyon';

// -----------------------------------------------------------------------------
// Ground textures — real surfaces from the texture library
// -----------------------------------------------------------------------------

/** The four splat layers. Same four the colours have always been: low and mid by
 *  height, rock by slope, peak (snow, salt, bleached stone) at the top. */
export type TerrainLayerKey = 'low' | 'mid' | 'rock' | 'peak';
export const TERRAIN_LAYER_KEYS: readonly TerrainLayerKey[] = ['low', 'mid', 'rock', 'peak'];

/** A texture set's map URLs. Filled by the client from the texture library when a
 *  set is assigned, and stored, so an embed renders without the library. */
export interface TerrainLayerMaps {
    color?: string;
    normal?: string;
    roughness?: string;
    ao?: string;
    displacement?: string;
}

/**
 * One splat layer's surface.
 *
 * A textured layer shows the set's OWN colours and detail — so picking a
 * different set visibly changes the ground. Its exposure is automatic: scans are
 * shot at all sorts of brightness, so the texture is first brought to the
 * LUMINANCE of the layer's colour (`lowColor` … `peakColor`, set by the biome),
 * then × `tint` × `brightness`. The distant ground is the texture's mean × the
 * same factors, so near and far agree. A layer with no set is its flat colour.
 */
export interface TerrainTextureLayer {
    /** Texture-library set name (e.g. 'Grass008'). '' = no texture: the layer is
     *  drawn in its flat colour, as before textures existed. */
    set: string;
    /** Resolved map URLs for `set`. Empty until resolved. */
    maps: TerrainLayerMaps;
    /** Metres of ground one texture tile covers. */
    tileSize: number;
    /** Multiplies the texture's colour. '#ffffff' = as photographed. */
    tint: string;
    /** Multiplies the texture's brightness, on top of the automatic exposure.
     *  1 = the ground's tuned brightness. */
    brightness: number;
    /** Normal-map strength. */
    normalStrength: number;
}

export type TerrainTextures = Record<TerrainLayerKey, TerrainTextureLayer>;

/** Partial form, for presets and patches: a set name and optionally the numbers. */
export type TerrainTexturesPatch = Partial<Record<TerrainLayerKey, Partial<TerrainTextureLayer>>>;

export const defaultTerrainTextureLayer: TerrainTextureLayer = {
    set: '',
    maps: {},
    tileSize: 3,
    tint: '#ffffff',
    brightness: 1,
    normalStrength: 1,
};

/** Per-layer default tile size: rock reads right a little larger than ground. */
const LAYER_TILE: Record<TerrainLayerKey, number> = { low: 3, mid: 3, rock: 6, peak: 4 };

export function emptyTerrainTextures(): TerrainTextures {
    const out = {} as TerrainTextures;
    for (const k of TERRAIN_LAYER_KEYS) out[k] = { ...defaultTerrainTextureLayer, maps: {}, tileSize: LAYER_TILE[k] };
    return out;
}

/**
 * Layer-wise merge. A patch that changes a layer's set without restating its maps
 * clears the maps, so a stale URL from the previous set never draws under the
 * new name.
 */
export function mergeTerrainTextures(base: TerrainTextures | undefined, patch: TerrainTexturesPatch | undefined): TerrainTextures {
    const from = base ?? emptyTerrainTextures();
    const out = {} as TerrainTextures;
    for (const k of TERRAIN_LAYER_KEYS) {
        const b = from[k] ?? { ...defaultTerrainTextureLayer, tileSize: LAYER_TILE[k] };
        const p = patch?.[k];
        if (!p) { out[k] = { ...b, maps: { ...b.maps } }; continue; }
        const setChanged = p.set !== undefined && p.set !== b.set;
        out[k] = {
            ...b,
            ...p,
            maps: p.maps ? { ...p.maps } : setChanged ? {} : { ...b.maps },
        };
    }
    return out;
}

function texturesOf(sets: Partial<Record<TerrainLayerKey, string>>, tiles: Partial<Record<TerrainLayerKey, number>> = {}): TerrainTextures {
    const patch: TerrainTexturesPatch = {};
    for (const k of TERRAIN_LAYER_KEYS) {
        if (sets[k] !== undefined || tiles[k] !== undefined) patch[k] = { ...(sets[k] !== undefined ? { set: sets[k] } : {}), ...(tiles[k] !== undefined ? { tileSize: tiles[k] } : {}) };
    }
    return mergeTerrainTextures(emptyTerrainTextures(), patch);
}

/** Fields every terrain shares, whatever its landform. */
export interface TerrainSurfaceConfig {
    enabled: boolean;

    // ---- form ----
    /** Peak height above `seaLevel`, in world units. Also the denominator for
     *  every height-keyed splat threshold, so raising it does not re-shuffle the
     *  snow line. */
    elevation: number;
    /** World Y the terrain is built around. The clipmap sits here when the height
     *  field returns zero, so this is where a placed object meets flat ground. */
    seaLevel: number;
    /** Horizontal size of the primary landform, in world units. The single knob
     *  that decides whether this reads as a mountain range or a gravel pile. */
    featureSize: number;
    /** fBm octave count. Each one doubles frequency, so 8 spans a 256:1 range of
     *  detail; past ~10 the extra octaves are below the finest clipmap cell and
     *  only cost. Distant rings drop octaves automatically. */
    octaves: number;
    /** Frequency multiplier per octave. 2.0 is the textbook value; slightly above
     *  it (2.02-2.15) breaks the grid alignment that otherwise shows as a faint
     *  square lattice on large flat areas. */
    lacunarity: number;
    /** Amplitude multiplier per octave. Below 0.5 the terrain goes smooth and
     *  rolling; above it, jagged and fractal-looking. */
    gain: number;
    /** 0 gives rounded billow hills, 1 gives knife ridges. The single strongest
     *  cue for "mountain" versus "dune field". */
    ridgeSharpness: number;
    /** Domain warp amount, as a fraction of `featureSize`. This is what stops fBm
     *  looking like fBm: it bends ridge lines into the curved, branching shapes
     *  real drainage produces. Zero gives the obvious noise-blob silhouette. */
    warpStrength: number;
    /** Scale of the warp field relative to `featureSize`. Above ~1 the warp is
     *  slower than the terrain and it drifts rather than bends. */
    warpSize: number;
    /** Derivative damping. Octaves are attenuated where the accumulated slope is
     *  already steep, which flattens valley floors and sharpens flanks — the
     *  cheapest approximation of erosion there is, and the difference between
     *  "noise" and "landscape". */
    erosion: number;
    /** Number of strata steps. 0 is off. Canyon country is sedimentary, and the
     *  horizontal banding is most of what makes a mesa read as a mesa. */
    terraces: number;
    /** How hard a terrace edge is. 0 is a smooth ramp, 1 a near-vertical riser. */
    terraceSharpness: number;
    /** Orientation of the dune crests and the prevailing ridge grain, in degrees.
     *  Dunes are transverse to the wind, so this is a wind bearing. */
    bearing: number;
    /** Crest-to-crest distance of the dune train, in world units. */
    duneWavelength: number;
    /** Lee-slope steepening. Real dunes are asymmetric — a long windward ramp and
     *  a short slip face at the angle of repose. At 0 they are sine waves. */
    duneAsymmetry: number;
    /** Fraction of the height range flattened into mesa tops. */
    plateau: number;
    /** Depth of the incised channel network, as a fraction of `elevation`. */
    valleyDepth: number;
    /** Width of the incision. Narrow cuts slot canyons; wide ones cut broad washes. */
    valleyWidth: number;

    // ---- surface ----
    /** Ground at the bottom of the height range. */
    lowColor: string;
    /** Ground at mid height. */
    midColor: string;
    /** Exposed rock, splatted by slope rather than by height — which is the whole
     *  trick: rock appears wherever the surface is too steep to hold anything,
     *  at any altitude, so cliffs read as cliffs. */
    rockColor: string;
    /** Snow, salt or bleached stone at the top of the range. */
    peakColor: string;
    /** Slope (0 flat, 1 vertical) at which rock starts showing through. */
    slopeRockStart: number;
    /** Slope at which the surface is bare rock. */
    slopeRockEnd: number;
    /** Height fraction where the peak layer begins. */
    peakLevel: number;
    /** Width of the peak transition, in height fractions. A hard snow line is
     *  physically right for temperature but reads as a decal; ~0.1 is convincing. */
    peakBlend: number;
    /** Peak coverage lost per unit slope. Snow does not sit on a vertical face,
     *  and this is what keeps a summit from looking dipped in paint. */
    peakSlopeFalloff: number;
    /** Large-scale albedo break-up. Without it a splat layer is one flat colour
     *  across kilometres and the eye reads it as untextured. */
    macroVariation: number;
    /** Size of that variation, in world units. */
    macroSize: number;
    /** Strength of the high-frequency normal detail added in the fragment stage —
     *  bumps far below the mesh resolution. */
    detailStrength: number;
    /** Size of that detail, in world units. */
    detailSize: number;
    roughness: number;
    /** Specular strength. Rock is nearly matte; wet sand and snow are not. */
    specular: number;
    /** Real surfaces per splat layer, from the texture library. A layer with no set
     *  keeps its flat colour. */
    textures: TerrainTextures;
    /** Distance, in metres, out to which the textures are drawn. Past it each
     *  layer fades into its flat far colour (a textured layer's own mean colour),
     *  which costs nothing per pixel — the horizon stays as cheap as it was. */
    textureDistance: number;
    /** 0 = layers cross-fade; 1 = the layer whose own surface is higher wins, so
     *  rock pushes up through grass along its cracks instead of fading in. */
    textureHeightBlend: number;

    // ---- lighting ----
    /** Sky fill. Terrain is lit by the whole dome, not only the sun, and freezing
     *  this is what makes a night landscape glow. */
    ambient: number;
    /** Ground-bounce fill on downward-facing surfaces, tinted by the low colour. */
    bounce: number;
    /** Strength of the analytic self-shadow marched down the sun vector. This is
     *  what puts a mountain's shadow in its own valley, at any scale, with no
     *  shadow-map resolution to run out of. */
    sunShadow: number;
    /** Penumbra width of that shadow. Larger reads as a hazy day. */
    shadowSoftness: number;
    /** Rate distant terrain fades into the sky it is seen through. The main cue
     *  for how large the landscape reads, and the reason a horizon looks like a
     *  horizon rather than a cut-out. */
    aerialPerspective: number;
}

/**
 * The terrain, as stored.
 *
 * `type` is 'terrain' — the OBJECT type — with the landform kept separately in
 * `terrainType`, exactly as the clouds keep `deckType` apart from `type`.
 * Collapsing the two would make the terrain invisible to anything that routes on
 * object type.
 */
export type TerrainConfig = TerrainSurfaceConfig & {
    type: 'terrain';
    terrainType: TerrainType;
    /** Name of the preset the numbers came from, or '' once any of them is edited.
     *  Purely a UI bookmark — the renderer never reads it. */
    preset?: string;
    /** The shape (landform preset) last picked — a UI bookmark. The Basic tab's
     *  Ruggedness slider is measured against this shape's own numbers. */
    shape?: string;
    /** The biome (ground look) last picked — a UI bookmark. The Rock & snow slider
     *  is measured against this biome's snow line. */
    biome?: string;
    /** Basic-tab Ruggedness, 0..1, 0.5 = the shape as designed. A bookmark: the
     *  numbers it drives (gain, ridge sharpness, erosion) are in the config. */
    ruggedness?: number;
    /** Basic-tab Rock & snow, 0..1, 0.5 = shape and biome as designed. A bookmark
     *  for the slope-rock thresholds and the snow line it moves. */
    coverage?: number;
};

/** Cost and extent knobs. */
export interface TerrainQualityConfig {
    /** Clipmap ring count. Each ring doubles its cell size, so the visible radius
     *  is roughly `cellSize * segments * 2^(levels-1)`: 9 levels of 192 segments at
     *  2 m reaches ~98 km, which is past where haze has dissolved the ground.
     *
     *  There is no adaptive scaling of the pyramid, deliberately. Tying the cell
     *  size to camera altitude sounds right and is not: a clipmap triangle already
     *  subtends a constant angle whatever the scale, so scaling buys nothing in
     *  detail, and scaling by height above SEA LEVEL — the only height available
     *  without reading the field back off the GPU — coarsens a camera that is
     *  standing on a mountain rather than flying over one. Extra levels are cheap;
     *  a wrong guess about altitude is not. */
    levels: number;
    /** Grid resolution per ring side. Vertex cost is `levels * segments^2 * 0.75`,
     *  since every ring above the first is hollow. */
    segments: number;
    /** Finest cell, in world units, at the camera. */
    cellSize: number;
    /** 1/(2R). Drops the surface away with the square of distance so the terrain
     *  meets a real horizon instead of running flat to the far plane. Zero gives a
     *  flat world, which at these extents looks wrong long before it looks flat. */
    curvature: number;
    /** Steps in the analytic sun-shadow march, at the camera. Falls to four as the
     *  shadow fades out with distance. */
    shadowSteps: number;
    /** Distance over which the analytic self-shadow fades to nothing.
     *
     *  The march is the most expensive thing the renderer does and past a few
     *  kilometres it buys nothing — haze has already taken the contrast out of the
     *  ground and a ridge shadow is a couple of pixels wide. Cutting it here drops
     *  the outer clipmap rings, two thirds of all vertices, out of the march
     *  entirely. */
    shadowDistance: number;
    /** Distance over which fragment-stage detail fades out. Beyond it the surface
     *  is shaded from the mesh normal alone, which removes far-field shimmer and
     *  buys back most of its own cost. */
    detailFadeDistance: number;
    /** Receive the scene's directional shadow map, so objects cast onto terrain.
     *  Terrain-on-terrain shadowing is analytic and unaffected by this. */
    receiveShadows: boolean;
    /** Radiance scale, so terrain sits at the same exposure as the sky and clouds
     *  whether or not the cloud composite is the thing tonemapping the frame. */
    exposure: number;
    wireframe: boolean;
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const surfaceBase: Omit<TerrainSurfaceConfig, 'enabled'> = {
    elevation: 1200,
    seaLevel: 0,
    featureSize: 2600,
    octaves: 9,
    lacunarity: 2.06,
    gain: 0.52,
    ridgeSharpness: 0.62,
    warpStrength: 0.28,
    warpSize: 0.6,
    erosion: 0.7,
    terraces: 0,
    terraceSharpness: 0.6,
    bearing: 78,
    duneWavelength: 320,
    duneAsymmetry: 0.6,
    plateau: 0,
    valleyDepth: 0,
    valleyWidth: 0.25,

    lowColor: '#4a4636',
    midColor: '#6b6248',
    rockColor: '#6a6259',
    peakColor: '#eef1f6',
    slopeRockStart: 0.35,
    slopeRockEnd: 0.62,
    peakLevel: 0.62,
    peakBlend: 0.12,
    peakSlopeFalloff: 1.4,
    macroVariation: 0.22,
    macroSize: 2400,
    detailStrength: 0.45,
    detailSize: 9,
    roughness: 0.82,
    specular: 0.06,
    textures: texturesOf(
        { low: 'Grass001', mid: 'Gravel040', rock: 'Rock051', peak: 'Snow014' },
        { low: 2.5, mid: 3, rock: 6, peak: 4 },
    ),
    textureDistance: 4000,
    textureHeightBlend: 0.7,

    ambient: 1,
    bounce: 0.35,
    sunShadow: 1,
    shadowSoftness: 12,
    aerialPerspective: 0.00007,
};

export const defaultMountainsConfig: TerrainConfig = {
    ...surfaceBase,
    type: 'terrain',
    terrainType: 'mountains',
    preset: '',
    enabled: true,
    biome: 'Alpine meadow',
};

export const defaultHillsConfig: TerrainConfig = {
    ...surfaceBase,
    type: 'terrain',
    terrainType: 'hills',
    preset: '',
    enabled: true,
    biome: 'Green hills',
    elevation: 300,
    featureSize: 2200,
    octaves: 8,
    gain: 0.46,
    ridgeSharpness: 0.05,
    warpStrength: 0.35,
    erosion: 0.45,
    lowColor: '#3f5326',
    midColor: '#55663a',
    rockColor: '#7a7266',
    peakColor: '#8d9a6a',
    slopeRockStart: 0.5,
    slopeRockEnd: 0.78,
    peakLevel: 0.78,
    peakBlend: 0.2,
    macroVariation: 0.3,
    macroSize: 1400,
    detailStrength: 0.5,
    detailSize: 6,
    roughness: 0.9,
    specular: 0.03,
    textures: texturesOf(
        { low: 'Grass008', mid: 'Grass001', rock: 'Rock061', peak: 'Ground033' },
        { low: 2.5, mid: 2.5, rock: 5, peak: 3 },
    ),
    aerialPerspective: 0.00009,
};

export const defaultDunesConfig: TerrainConfig = {
    ...surfaceBase,
    type: 'terrain',
    terrainType: 'dunes',
    preset: '',
    enabled: true,
    biome: 'Desert sand',
    elevation: 150,
    featureSize: 3000,
    octaves: 6,
    gain: 0.42,
    ridgeSharpness: 0.15,
    warpStrength: 0.2,
    warpSize: 0.8,
    erosion: 0.2,
    duneWavelength: 340,
    duneAsymmetry: 0.62,
    lowColor: '#b08a53',
    midColor: '#d6b077',
    rockColor: '#9c7a4c',
    peakColor: '#f0dcb4',
    slopeRockStart: 0.62,
    slopeRockEnd: 0.9,
    peakLevel: 0.7,
    peakBlend: 0.24,
    peakSlopeFalloff: 0.6,
    macroVariation: 0.14,
    macroSize: 3600,
    detailStrength: 0.3,
    detailSize: 3.5,
    roughness: 0.55,
    specular: 0.16,
    textures: texturesOf(
        { low: 'Ground097', mid: 'Ground097', rock: 'Ground105', peak: 'Ground093C' },
        { low: 4, mid: 5, rock: 4, peak: 4 },
    ),
    ambient: 1.1,
    bounce: 0.55,
    shadowSoftness: 22,
    aerialPerspective: 0.00008,
};

export const defaultCanyonConfig: TerrainConfig = {
    ...surfaceBase,
    type: 'terrain',
    terrainType: 'canyon',
    preset: '',
    enabled: true,
    biome: 'Red rock',
    elevation: 700,
    featureSize: 2600,
    octaves: 8,
    gain: 0.48,
    ridgeSharpness: 0.3,
    warpStrength: 0.18,
    erosion: 0.85,
    terraces: 14,
    terraceSharpness: 0.72,
    plateau: 0.55,
    valleyDepth: 0.8,
    valleyWidth: 0.22,
    lowColor: '#7a4a30',
    midColor: '#a4643c',
    rockColor: '#c07a4a',
    peakColor: '#d9a877',
    slopeRockStart: 0.28,
    slopeRockEnd: 0.5,
    peakLevel: 0.72,
    peakBlend: 0.08,
    peakSlopeFalloff: 0.9,
    macroVariation: 0.26,
    macroSize: 1800,
    detailStrength: 0.4,
    detailSize: 7,
    roughness: 0.86,
    specular: 0.05,
    textures: texturesOf(
        { low: 'Ground105', mid: 'Ground097', rock: 'Rock029', peak: 'Ground105' },
        { low: 3, mid: 4, rock: 8, peak: 3 },
    ),
    shadowSoftness: 8,
    aerialPerspective: 0.000075,
};

export const defaultTerrainQuality: TerrainQualityConfig = {
    levels: 9,
    segments: 128,
    cellSize: 2,
    curvature: 1 / (2 * 6371000),
    shadowSteps: 12,
    shadowDistance: 5000,
    detailFadeDistance: 1200,
    receiveShadows: true,
    exposure: 1,
    wireframe: false,
};

/** Per-type defaults, for the controller's type switcher. */
export const TERRAIN_DEFAULTS: Record<TerrainType, TerrainConfig> = {
    mountains: defaultMountainsConfig,
    dunes: defaultDunesConfig,
    hills: defaultHillsConfig,
    canyon: defaultCanyonConfig,
};

// -----------------------------------------------------------------------------
// Property schema — presentation and agent metadata
// -----------------------------------------------------------------------------

export type TerrainPropertyGroup = 'form' | 'surface' | 'lighting' | 'quality';

/** Everything the controller needs to build a row and everything the AI context
 *  builder needs to know what a knob does and where it is safe. The runtime never
 *  reads this — defaults live in the config objects above. */
export interface TerrainPropertySchema {
    key: string;
    label: string;
    group: TerrainPropertyGroup;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    description: string;
    advanced?: boolean;
    /** false = structural: set only (controllers, action patches), never driven per
     *  frame (timeline, mouse-move, AI clips). Absent = numbers / colours animate. */
    animatable?: boolean;
    /** Only show for these terrain types. Absent means all. */
    types?: TerrainType[];
}

export const TERRAIN_SCHEMA: TerrainPropertySchema[] = [
    { key: 'elevation', animatable: false, label: 'Elevation', group: 'form', min: 5, max: 6000, step: 5, unit: 'm', description: 'Peak height above sea level. Every height-keyed splat threshold is a fraction of this, so raising it does not move the snow line.' },
    { key: 'seaLevel', animatable: false, label: 'Sea level', group: 'form', min: -2000, max: 2000, step: 5, unit: 'm', description: 'World Y the terrain is built around — where flat ground sits, and where a placed object meets it.' },
    { key: 'featureSize', animatable: false, label: 'Feature size', group: 'form', min: 200, max: 40000, step: 50, unit: 'm', description: 'Horizontal size of the primary landform. The one knob that decides whether this reads as a mountain range or a gravel pile.' },
    { key: 'octaves', animatable: false, label: 'Octaves', group: 'form', min: 3, max: 12, step: 1, description: 'fBm detail levels. Past ~10 the extra octaves are finer than the closest clipmap cell and only cost; distant rings drop them automatically.' },
    { key: 'lacunarity', animatable: false, label: 'Lacunarity', group: 'form', min: 1.7, max: 2.6, step: 0.01, advanced: true, description: 'Frequency step per octave. Slightly off 2.0 breaks the grid alignment that otherwise shows as a faint square lattice.' },
    { key: 'gain', animatable: false, label: 'Gain', group: 'form', min: 0.25, max: 0.72, step: 0.005, description: 'Amplitude step per octave. Below 0.5 smooth and rolling, above it jagged and fractal.' },
    { key: 'ridgeSharpness', animatable: false, label: 'Ridge sharpness', group: 'form', min: 0, max: 1, step: 0.005, description: '0 gives rounded billow hills, 1 knife ridges. The strongest single cue between a mountain and a dune field.' },
    { key: 'warpStrength', animatable: false, label: 'Domain warp', group: 'form', min: 0, max: 1, step: 0.005, description: 'Bends ridge lines into curved, branching shapes. At 0 the silhouette reads as noise rather than landscape.' },
    { key: 'warpSize', animatable: false, label: 'Warp size', group: 'form', min: 0.1, max: 2, step: 0.01, advanced: true, description: 'Scale of the warp field relative to feature size. Above ~1 it drifts the terrain instead of bending it.' },
    { key: 'erosion', animatable: false, label: 'Erosion', group: 'form', min: 0, max: 1, step: 0.005, description: 'Damps octaves where slope is already steep — flattens valley floors, sharpens flanks. The cheapest approximation of erosion there is.' },
    { key: 'terraces', animatable: false, label: 'Strata', group: 'form', min: 0, max: 40, step: 1, types: ['canyon', 'mountains'], description: 'Sedimentary banding step count. 0 is off. Most of what makes a mesa read as a mesa.' },
    { key: 'terraceSharpness', animatable: false, label: 'Strata hardness', group: 'form', min: 0, max: 1, step: 0.01, types: ['canyon', 'mountains'], description: '0 is a smooth ramp between bands, 1 a near-vertical riser.' },
    { key: 'plateau', animatable: false, label: 'Plateau', group: 'form', min: 0, max: 1, step: 0.005, types: ['canyon'], description: 'Fraction of the height range flattened into mesa tops.' },
    { key: 'valleyDepth', animatable: false, label: 'Incision depth', group: 'form', min: 0, max: 1.5, step: 0.005, types: ['canyon'], description: 'Depth of the carved channel network as a fraction of elevation. At 0 the mesas have nothing between them.' },
    { key: 'valleyWidth', animatable: false, label: 'Incision width', group: 'form', min: 0.03, max: 1, step: 0.005, types: ['canyon'], description: 'Narrow cuts slot canyons; wide ones cut broad washes.' },
    { key: 'bearing', animatable: false, label: 'Wind bearing', group: 'form', min: 0, max: 360, step: 1, unit: 'deg', types: ['dunes'], description: 'Dunes are transverse to the wind, so this rotates the whole crest train.' },
    { key: 'duneWavelength', animatable: false, label: 'Dune wavelength', group: 'form', min: 40, max: 2000, step: 5, unit: 'm', types: ['dunes'], description: 'Crest-to-crest distance of the dune train.' },
    { key: 'duneAsymmetry', animatable: false, label: 'Slip face', group: 'form', min: 0, max: 1, step: 0.005, types: ['dunes'], description: 'Lee-slope steepening. At 0 the dunes are sine waves; real ones have a long windward ramp and a short face at the angle of repose.' },

    { key: 'slopeRockStart', animatable: false, label: 'Rock from slope', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Slope at which rock starts showing through. Splatting rock by slope rather than height is what makes a cliff read as a cliff at any altitude.' },
    { key: 'slopeRockEnd', animatable: false, label: 'Bare rock at slope', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Slope at which the surface is fully bare rock.' },
    { key: 'peakLevel', animatable: false, label: 'Peak line', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Height fraction where the peak layer (snow, salt, bleached stone) begins.' },
    { key: 'peakBlend', animatable: false, label: 'Peak blend', group: 'surface', min: 0.01, max: 0.5, step: 0.005, description: 'Width of that transition. A hard line is physically right for temperature but reads as a decal.' },
    { key: 'peakSlopeFalloff', animatable: false, label: 'Peak slope falloff', group: 'surface', min: 0, max: 3, step: 0.01, description: 'Peak coverage lost per unit slope. Snow does not sit on a vertical face; without this a summit looks dipped in paint.' },
    { key: 'macroVariation', animatable: false, label: 'Macro variation', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Large-scale albedo break-up. Without it a splat layer is one flat colour across kilometres and reads as untextured.' },
    { key: 'macroSize', animatable: false, label: 'Macro size', group: 'surface', min: 200, max: 12000, step: 50, unit: 'm', description: 'Size of that variation.' },
    { key: 'detailStrength', animatable: false, label: 'Detail bump', group: 'surface', min: 0, max: 1.5, step: 0.005, description: 'High-frequency normal detail added per fragment — bumps far below the mesh resolution.' },
    { key: 'detailSize', animatable: false, label: 'Detail size', group: 'surface', min: 0.5, max: 60, step: 0.25, unit: 'm', description: 'Size of that detail. Below about a metre it aliases before it fades.' },
    { key: 'roughness', label: 'Roughness', group: 'surface', min: 0.05, max: 1, step: 0.005, description: 'Widens the specular lobe. Rock is nearly matte; wet sand and snow are not.' },
    { key: 'specular', label: 'Specular', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Specular strength. The grazing sheen on sand at low sun comes from here.' },
    { key: 'textureDistance', animatable: false, label: 'Texture distance', group: 'surface', min: 100, max: 12000, step: 50, unit: 'm', description: 'How far out the ground is drawn with real textures. Past it every layer fades to its flat far colour, so the horizon costs nothing extra.' },
    { key: 'textureHeightBlend', animatable: false, label: 'Texture height blend', group: 'surface', min: 0, max: 1, step: 0.01, description: '0 cross-fades the layers; 1 lets the layer whose own surface is higher win, so rock pushes up through grass along its cracks.' },

    { key: 'ambient', label: 'Ambient', group: 'lighting', min: 0, max: 3, step: 0.01, description: 'Sky-dome fill, taken from the same atmosphere the sky and clouds use, so it darkens and warms as the sun sets instead of freezing.' },
    { key: 'bounce', label: 'Ground bounce', group: 'lighting', min: 0, max: 2, step: 0.01, description: 'Fill on downward-facing surfaces, tinted by the low colour. Keeps overhangs and north faces off pure black.' },
    { key: 'sunShadow', label: 'Self shadow', group: 'lighting', min: 0, max: 1, step: 0.01, description: 'Strength of the analytic shadow marched down the sun vector. This is what puts a mountain shadow in its own valley, with no shadow-map resolution to run out of.' },
    { key: 'shadowSoftness', animatable: false, label: 'Shadow softness', group: 'lighting', min: 1, max: 60, step: 0.5, description: 'Penumbra width of that shadow. Larger reads as a hazier day.' },
    { key: 'aerialPerspective', label: 'Aerial perspective', group: 'lighting', min: 0, max: 0.0004, step: 0.000002, unit: '1/m', description: 'Rate distant terrain fades into the sky behind it. The main cue for how large the landscape reads, and what makes the horizon a horizon rather than a cut-out.' },
];

export const TERRAIN_QUALITY_SCHEMA: TerrainPropertySchema[] = [
    { key: 'levels', label: 'Clipmap levels', group: 'quality', min: 2, max: 12, step: 1, description: 'Each ring doubles its cell size, so visible radius is roughly cellSize x segments x 2^(levels-1). 9 levels of 192 at 2 m reaches ~98 km, which is past where haze has dissolved the ground.' },
    { key: 'segments', label: 'Ring resolution', group: 'quality', min: 32, max: 320, step: 8, description: 'Grid resolution per ring side, and the one knob that sets how polygonal the terrain looks: a clipmap triangle subtends about 2/segments radians whatever the distance, so 192 is roughly 12 px at 1080p. Vertex cost is levels x segments^2 x 0.75, since every ring above the first is hollow.' },
    { key: 'cellSize', label: 'Cell size', group: 'quality', min: 0.25, max: 32, step: 0.25, unit: 'm', description: 'Finest cell, at the camera. Lower it for a walkable scene, raise it for a flyover.' },
    { key: 'shadowSteps', label: 'Shadow steps', group: 'quality', min: 0, max: 48, step: 1, description: 'Steps in the analytic sun-shadow march, nearest the camera. 0 disables terrain self-shadowing entirely, which is the single biggest thing you can turn off; below ~12 long shadows at low sun start to leak.' },
    { key: 'shadowDistance', label: 'Shadow distance', group: 'quality', min: 0, max: 40000, step: 100, unit: 'm', description: 'Range over which the self-shadow fades out. The march runs per vertex, so lowering this drops whole clipmap rings out of it — the cheapest quality dial there is after turning shadows off.' },
    { key: 'detailFadeDistance', label: 'Detail fade distance', group: 'quality', min: 50, max: 8000, step: 25, unit: 'm', description: 'Distance over which fragment-stage bump fades out. Removes far-field shimmer and buys back most of its own cost.' },
    { key: 'curvature', label: 'Planetary curvature', group: 'quality', min: 0, max: 0.0000012, step: 0.00000001, advanced: true, description: '1/(2R). Drops the surface with the square of distance so it meets a real horizon. Zero gives a flat world, which at these extents looks wrong long before it looks flat.' },
    { key: 'exposure', label: 'Exposure', group: 'quality', min: 0.2, max: 4, step: 0.01, description: 'Radiance scale, so terrain matches the sky and clouds whether or not the cloud composite is what tonemaps the frame.' },
];

// -----------------------------------------------------------------------------
// Settings — the object the environment slice stores and the panel edits
// -----------------------------------------------------------------------------

/**
 * A terrain, as stored.
 *
 * Named `ProceduralTerrainSettings` because core already exports a
 * `TerrainSettings` — the retired flat shape — and a saved project may still
 * carry one. Same reason `VolumetricCloudsSettings` is not `CloudsSettings`.
 *
 * There is deliberately no `meshSettings` and no `materialSettings`: the clipmap
 * follows the camera so it has no transform to edit, and the material is not
 * swappable, so the Transform and Material tabs do not apply.
 */
export interface ProceduralTerrainSettings {
    id: string;
    type: 'terrain';
    /** The landform. Named `config` to match the house shape for an object's
     *  editable block. */
    config: TerrainConfig;
    quality: TerrainQualityConfig;
    /** Per-domain keyframes; the `terrain` domain drives the surface's lighting and
     *  colour knobs. The land shape is never animatable (see TERRAIN_SCHEMA). */
    animations?: ObjectAnimations;
    /** Per-domain pointer bindings; same `terrain` domain. */
    mouseMove?: MouseMoveInteractions;
}

export const defaultProceduralTerrainSettings: ProceduralTerrainSettings = {
    id: '3drise-terrain',
    type: 'terrain',
    config: { ...defaultHillsConfig, enabled: false },
    quality: { ...defaultTerrainQuality },
};

// =============================================================================
// Normalisation
// =============================================================================
//
// A published scene loads whatever was in the database the day it was saved, and
// a scene saved before this system existed carries core's flat TerrainSettings
// (`visible` + `displacementScale`) under the same key. Reading that straight
// into the renderer is how an embed dies: the clipmap sizes its rings from
// `quality.segments` on its first frame.
//
// Each block merges over its own defaults SEPARATELY, not through one merge over
// the settings object, so a quality edit does not hand the surface a new config
// object and rebuild the clipmap geometry.

const TERRAIN_TYPES: readonly TerrainType[] = ['mountains', 'dunes', 'hills', 'canyon'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

/**
 * Surface block merged over its type's defaults, or null when there is nothing to
 * render — including the retired flat shape, which has no `config` and must draw
 * nothing rather than a landscape the project was never authored with.
 *
 * An unknown or missing `terrainType` falls back to hills rather than rendering
 * nothing: a scene that says `enabled: true` should show ground.
 */
export function normalizeTerrain(raw: unknown): TerrainConfig | null {
    if (!isRecord(raw)) return null;
    const terrainType = TERRAIN_TYPES.includes(raw.terrainType as TerrainType)
        ? (raw.terrainType as TerrainType)
        : 'hills';
    const base = TERRAIN_DEFAULTS[terrainType];
    return {
        ...base,
        ...(raw as Partial<TerrainConfig>),
        // Layer-wise, not replaced: a stored or preset block may name only some
        // layers, and a partial layer must not lose the type's defaults.
        textures: mergeTerrainTextures(base.textures, isRecord(raw.textures) ? (raw.textures as TerrainTexturesPatch) : undefined),
        type: 'terrain',
        terrainType,
    };
}

export function normalizeTerrainQuality(raw: unknown): TerrainQualityConfig {
    return { ...defaultTerrainQuality, ...(isRecord(raw) ? (raw as Partial<TerrainQualityConfig>) : {}) };
}

/**
 * A whole settings blob, from a project of any age. The flat legacy shape has no
 * `config`, so it normalises to a disabled terrain rather than to a default one.
 */
export function normalizeTerrainSettings(raw: unknown): ProceduralTerrainSettings {
    const source = isRecord(raw) ? raw : {};
    const config = normalizeTerrain(source.config);
    const settings: ProceduralTerrainSettings = {
        id: typeof source.id === 'string' ? source.id : defaultProceduralTerrainSettings.id,
        type: 'terrain',
        config: config ?? { ...defaultHillsConfig, enabled: false },
        quality: normalizeTerrainQuality(source.quality),
    };
    if (isRecord(source.animations)) settings.animations = source.animations as unknown as ObjectAnimations;
    if (isRecord(source.mouseMove)) settings.mouseMove = source.mouseMove as unknown as MouseMoveInteractions;
    return settings;
}
