/**
 * Config shapes for the landscape system — a bounded, authored ground tile built
 * from a heightmap and textured through splat maps.
 *
 * This is NOT a mode of the procedural terrain and does not share a config with
 * it. Terrain is an infinite camera-following clipmap generated from noise; a
 * landscape is a finite tile whose shape and materials the user supplies. Both
 * may be enabled in one scene; nothing here reads `terrainConfigs`.
 *
 * Declared in the viewer, next to the material that consumes it, for the same
 * reason `terrainConfigs` and `oceanConfigs` are.
 */

/** Where a landscape is mounted. */
export type LandscapeHost = 'ground' | 'object'

/** How the heightmap's pixels encode elevation. */
export type HeightEncoding =
    /** 8-bit red channel, 0..1. The common PNG export. */
    | 'grayscale'
    /** Mapbox / AWS Terrain-RGB: (r*65536 + g*256 + b) / 10 - 10000, in metres. */
    | 'terrain-rgb'
    /** Red and green as a 16-bit big-endian pair, 0..1. */
    | 'rg16'

/** Where surface weights come from. */
export type SplatSource =
    /** Authored splat maps, up to two, RGBA = four surfaces each. */
    | 'maps'
    /** Generated from the heightmap's own height and slope. */
    | 'auto'

/**
 * One material layer on the ground.
 *
 * `displacement` is the layer's own height map and it is what makes transitions
 * read as material rather than as a cross-fade: at a boundary the higher surface
 * wins per texel, so gravel comes through grass along the gravel's own grain.
 * The reference project accepts this texture and never samples it.
 */
export interface LandscapeSurface {
    /** Panel label only; the renderer never reads it. */
    name: string
    /** Albedo. Required — a surface with no diffuse is skipped. */
    diffuse: string
    /** Tangent-space normal map. Optional. */
    normal?: string
    /** Height map for the height blend and, later, parallax. Optional; absent
     *  layers blend linearly, which is what the reference always does. */
    displacement?: string
    /** How many times the texture tiles across the whole landscape. */
    repeat: number
    /** Normal map strength. */
    normalStrength: number
    /** 0 desaturates to luma, 1 leaves it alone, above 1 pushes. A luma lerp, not
     *  an HSV round trip — the reference does two colour-space conversions per
     *  sampled surface per pixel for this. */
    saturation: number
    /** Multiplied into the albedo. */
    tint: string
    /** Per-surface roughness. The reference has one value for the whole ground,
     *  so wet mud and dry rock shade identically. */
    roughness: number
    /** Per-surface metalness. Almost always 0; wet rock is the exception. */
    metalness: number
    /** 0 blends linearly, 1 lets the layer's own height decide the transition. */
    heightBlend: number
    /** Break the repeat grid with stochastic tiling. Three fetches instead of
     *  one for this surface, and the difference between authored ground and
     *  wallpaper. Requires quality.stochastic. */
    aperiodic: boolean
    /** Project on world axes instead of the tile's UV. Cliffs only — it doubles
     *  the fetches for this surface. Requires quality.triplanar. */
    triplanar: boolean
    /** Flip the normal map's green channel (DirectX vs OpenGL convention). */
    flipNormalY: boolean
}

/** Height and slope rule for `splatSource: 'auto'`. */
export interface AutoSplatConfig {
    /** Height fraction each surface is centred on, in surface order. The last
     *  surface is the rock layer and is placed by slope instead. */
    bands: number[]
    /** Width of each band, in height fractions. */
    bandWidth: number
    /** Slope (0 flat, 1 vertical) where rock starts showing through. */
    slopeStart: number
    /** Slope where the surface is bare rock. */
    slopeEnd: number
    /** Break-up applied to the height before banding, so the bands are not
     *  contour lines. */
    noise: number
    /** World size of that break-up. */
    noiseSize: number
}

export interface LandscapeConfig {
    enabled: boolean
    host: LandscapeHost

    // ---- maps ----
    /** Required. Nothing renders without it. */
    heightMap: string
    heightEncoding: HeightEncoding
    splatSource: SplatSource
    /** 0, 1 or 2 maps — 4 or 8 surfaces. */
    splatMaps: string[]
    autoSplat: AutoSplatConfig
    /** Baked ambient occlusion over the whole tile. Optional. */
    aoMap?: string

    // ---- form ----
    /** World units across the tile. */
    size: number
    /** Heightmap 0..1 (or metres, for terrain-rgb) to world units. */
    elevationScale: number
    /** World Y added after scaling. */
    elevationBias: number
    /** Ground host only — the object host uses its transform. */
    origin: [number, number, number]
    /** Ground host only, in degrees. */
    rotationY: number
    /** 0 samples the heightmap raw; above it, a bicubic filter over a widened
     *  footprint, which is what keeps an 8-bit heightmap off visible terracing. */
    smoothness: number

    // ---- surface ----
    surfaces: LandscapeSurface[]
    /** How many of the heaviest surface weights are sampled per pixel, 1..4.
     *  The single most effective cost dial in the material. */
    surfaceSamples: number
    /** Large-scale albedo break-up, generated rather than sampled from a macro
     *  texture — the reference ships a 2.7 MB one for this. */
    macroVariation: number
    /** World size of that break-up. */
    macroSize: number
    aoIntensity: number
    envMapIntensity: number

    /** UI bookmarks. The renderer never reads any of these — they are what the
     *  Basic tab shows as the current selection, and what the AI agent will set
     *  when it learns to. */
    preset?: string
    /** Biome id from `landscapeTypes.ts`. */
    landscapeType?: string
    /** Terrain-shape folder the heightmap came from. */
    shape?: string
}

export interface LandscapeQualityConfig {
    /** RTIN error budget in world units — the maximum height a triangle may be
     *  wrong by. 0 puts a vertex on every heightmap texel. */
    meshError: number
    /** The same budget on a slow GPU or a phone. */
    mobileMeshError: number
    /** N x N index-buffer chunks over one shared vertex buffer, so the tile
     *  frustum-culls. Neighbouring chunks share vertices exactly, so there is no
     *  crack risk. */
    chunks: number
    /** Edge of the square texture arrays every surface is resized into. 2048
     *  costs four times the memory of 1024 for detail you will not see past a
     *  few metres. */
    arrayResolution: 512 | 1024 | 2048
    anisotropy: number
    /** Stochastic tiling for every surface flagged aperiodic. A material define,
     *  so turning it off compiles the code out. */
    stochastic: boolean
    /** Enable the biplanar path for surfaces flagged triplanar. Also a define. */
    triplanar: boolean
    castShadows: boolean
    receiveShadows: boolean
    wireframe: boolean
}

export interface LandscapeSettings {
    id: string
    type: 'landscape'
    config: LandscapeConfig
    quality: LandscapeQualityConfig
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

export const defaultLandscapeSurface: LandscapeSurface = {
    name: 'Surface',
    diffuse: '',
    normal: '',
    displacement: '',
    repeat: 200,
    normalStrength: 0.6,
    saturation: 1,
    tint: '#ffffff',
    roughness: 0.9,
    metalness: 0,
    heightBlend: 0.6,
    aperiodic: true,
    triplanar: false,
    flipNormalY: false,
}

export const defaultAutoSplat: AutoSplatConfig = {
    bands: [0, 0.35, 0.75],
    bandWidth: 0.45,
    slopeStart: 0.35,
    slopeEnd: 0.62,
    noise: 0.12,
    noiseSize: 400,
}

export const defaultLandscapeConfig: LandscapeConfig = {
    enabled: false,
    host: 'ground',

    heightMap: '',
    heightEncoding: 'grayscale',
    splatSource: 'auto',
    splatMaps: [],
    autoSplat: { ...defaultAutoSplat, bands: [...defaultAutoSplat.bands] },
    aoMap: '',

    size: 2048,
    elevationScale: 300,
    elevationBias: 0,
    origin: [0, 0, 0],
    rotationY: 0,
    smoothness: 1,

    surfaces: [],
    surfaceSamples: 3,
    macroVariation: 0.25,
    macroSize: 900,
    aoIntensity: 0.8,
    envMapIntensity: 0.9,

    preset: '',
}

export const defaultLandscapeQuality: LandscapeQualityConfig = {
    meshError: 1.5,
    mobileMeshError: 6,
    chunks: 4,
    arrayResolution: 1024,
    anisotropy: 4,
    stochastic: true,
    triplanar: true,
    castShadows: true,
    receiveShadows: true,
    wireframe: false,
}

export const defaultLandscapeSettings: LandscapeSettings = {
    id: '3drise-landscape',
    type: 'landscape',
    config: { ...defaultLandscapeConfig },
    quality: { ...defaultLandscapeQuality },
}

/** Hard ceiling. Two splat maps carry four channels each, and the index is packed
 *  as `i / MAX_SURFACES` in the weight pair. */
export const MAX_LANDSCAPE_SURFACES = 8
/** The object host keeps the same material with a shorter list. */
export const MAX_OBJECT_SURFACES = 4

// -----------------------------------------------------------------------------
// Property schema — presentation and agent metadata
// -----------------------------------------------------------------------------

export type LandscapePropertyGroup = 'maps' | 'form' | 'surface' | 'quality'

export interface LandscapePropertySchema {
    key: string
    label: string
    group: LandscapePropertyGroup
    type?: 'number' | 'boolean' | 'texture' | 'select'
    min?: number
    max?: number
    step?: number
    unit?: string
    options?: string[]
    description: string
    advanced?: boolean
    /** false = structural: set only, never driven per frame. Absent = numbers / colours animate. */
    animatable?: boolean
    /** Absent means both hosts. */
    hosts?: LandscapeHost[]
}

export const LANDSCAPE_SCHEMA: LandscapePropertySchema[] = [
    { key: 'size', label: 'Size', group: 'form', min: 4, max: 40000, step: 4, unit: 'm', description: 'World units across the tile. The heightmap is square, so this is both sides.' },
    { key: 'elevationScale', label: 'Elevation', group: 'form', min: 0, max: 4000, step: 1, unit: 'm', description: 'World height of the heightmap’s full range. This is the knob that turns a relief map into mountains.' },
    { key: 'elevationBias', label: 'Base height', group: 'form', min: -2000, max: 2000, step: 1, unit: 'm', description: 'World Y added after scaling — where the lowest point of the heightmap sits.' },
    { key: 'rotationY', label: 'Rotation', group: 'form', min: 0, max: 360, step: 1, unit: 'deg', hosts: ['ground'], description: 'Turns the tile about its centre. The placed host uses its own transform instead.' },
    { key: 'smoothness', label: 'Smoothness', group: 'form', min: 0, max: 8, step: 0.05, description: 'Bicubic filtering of the heightmap over a widened footprint. Above 0 it is what keeps an 8-bit heightmap from rendering as terraced steps.' },

    { key: 'surfaceSamples', label: 'Surface samples', group: 'surface', min: 1, max: 4, step: 1, description: 'How many of the heaviest surface weights are blended per pixel. The strongest cost dial in the material — 2 is enough almost everywhere, and artefacts only show where three splat channels genuinely overlap.' },
    { key: 'macroVariation', label: 'Macro variation', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Large-scale albedo break-up, generated rather than sampled. Without it a splat layer is one flat colour across hundreds of metres and the eye reads it as untextured.' },
    { key: 'macroSize', label: 'Macro size', group: 'surface', min: 50, max: 8000, step: 10, unit: 'm', description: 'World size of that break-up.' },
    { key: 'aoIntensity', label: 'AO intensity', group: 'surface', min: 0, max: 2, step: 0.01, description: 'Strength of the baked ambient occlusion map, when one is supplied.' },
    { key: 'envMapIntensity', label: 'Environment', group: 'surface', min: 0, max: 3, step: 0.01, description: 'How much the scene’s HDR environment lights the ground.' },
]

export const LANDSCAPE_AUTOSPLAT_SCHEMA: LandscapePropertySchema[] = [
    { key: 'bandWidth', label: 'Band width', group: 'surface', min: 0.05, max: 1.5, step: 0.01, description: 'How far each surface reaches either side of its height band. Wide bands cross-fade; narrow ones stripe.' },
    { key: 'slopeStart', label: 'Rock from slope', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Slope at which the last surface (rock) starts showing through. Splatting rock by slope rather than height is what makes a cliff read as a cliff at any altitude.' },
    { key: 'slopeEnd', label: 'Bare rock at slope', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Slope at which the surface is fully rock.' },
    { key: 'noise', label: 'Band break-up', group: 'surface', min: 0, max: 1, step: 0.005, description: 'Jitters the height before banding, so the boundaries are not contour lines.' },
    { key: 'noiseSize', label: 'Break-up size', group: 'surface', min: 10, max: 4000, step: 5, unit: 'm', description: 'World size of that jitter.' },
]

export const LANDSCAPE_QUALITY_SCHEMA: LandscapePropertySchema[] = [
    { key: 'meshError', label: 'Mesh error', group: 'quality', min: 0, max: 60, step: 0.1, unit: 'm', description: 'The most a triangle may be wrong by, vertically. Lower spends triangles on cliffs; 0 puts a vertex on every heightmap texel. Changing it rebuilds the mesh, so it commits on release.' },
    { key: 'chunks', label: 'Culling chunks', group: 'quality', min: 1, max: 12, step: 1, description: 'The tile is split into this many chunks per side over one shared vertex buffer, so it frustum-culls instead of drawing whole. More chunks cull better and cost more draw calls.' },
    { key: 'anisotropy', label: 'Anisotropy', group: 'quality', min: 1, max: 16, step: 1, description: 'Sharpness of ground textures at grazing angles — which on a landscape is most of the screen.' },
    { key: 'stochastic', label: 'Stochastic tiling', group: 'quality', type: 'boolean', description: 'Breaks the repeat grid on surfaces flagged for it, with a variance-preserving three-tap blend. Doubles the fetches for those surfaces and is the difference between authored ground and wallpaper.' },
    { key: 'triplanar', label: 'Triplanar', group: 'quality', type: 'boolean', description: 'Enables world-axis projection for surfaces flagged for it, so a cliff face is not a smear of stretched pixels. Biplanar in practice — two planes, not three.' },
    { key: 'castShadows', label: 'Cast shadows', group: 'quality', type: 'boolean', description: 'The landscape casts into the scene’s shadow map. It is bounded, so the sun’s shadow camera actually covers it — which is why this is possible here and not for the procedural terrain.' },
    { key: 'receiveShadows', label: 'Receive shadows', group: 'quality', type: 'boolean', description: 'Objects standing on the landscape cast onto it.' },
    { key: 'wireframe', label: 'Wireframe', group: 'quality', type: 'boolean', description: 'Draw the adaptive mesh itself. The fastest way to see what the error budget is buying.' },
]

// -----------------------------------------------------------------------------
// What can be driven live, and what cannot
// -----------------------------------------------------------------------------
//
// A slider drag fires on every pointer-move. Everything that is only a uniform
// can be written straight into the renderer at that rate; everything that
// rebuilds something cannot, and has to wait for the pointer to come up.
//
// These sets are the single statement of that split. The controller passes every
// key it has and the renderer's live handle drops the ones that are not here, so
// a rebuild key cannot half-apply — which is what `size` did before this existed:
// the triplanar scale is a uniform and moved during the drag while the mesh,
// built at the committed size, did not.

/** Config keys that are uniforms and nothing else. */
export const LANDSCAPE_LIVE_CONFIG_KEYS: readonly string[] = [
    'elevationScale',
    'elevationBias',
    'smoothness',
    'macroVariation',
    'macroSize',
    'aoIntensity',
    'envMapIntensity',
    'rotationY',
]

/** Quality keys that are uniforms, material flags or texture state. */
export const LANDSCAPE_LIVE_QUALITY_KEYS: readonly string[] = [
    'wireframe',
    'castShadows',
    'receiveShadows',
    'anisotropy',
]

/**
 * Keys that rebuild something, listed for the panel to explain itself with.
 *
 *   meshError, chunks   re-run RTIN and rebuild every index buffer
 *   arrayResolution     repacks up to sixteen textures
 *   surfaceSamples      changes a #define, so the shader recompiles
 *   stochastic, triplanar   likewise
 *   size, heightMap, splatMaps, heightEncoding, splatSource, surfaces
 *                       change the mesh or the arrays
 */
export const LANDSCAPE_REBUILD_KEYS: readonly string[] = [
    'meshError',
    'mobileMeshError',
    'chunks',
    'arrayResolution',
    'surfaceSamples',
    'stochastic',
    'triplanar',
    'size',
    'heightMap',
    'heightEncoding',
    'splatSource',
    'splatMaps',
    'surfaces',
]

/** Every surface field except the three texture slots is a uniform. */
export const LANDSCAPE_LIVE_SURFACE_KEYS: readonly string[] = [
    'repeat',
    'normalStrength',
    'saturation',
    'tint',
    'roughness',
    'metalness',
    'heightBlend',
    'aperiodic',
    'triplanar',
    'flipNormalY',
]

/** Auto-splat is entirely uniforms — all four rows plus the band list. */
export const LANDSCAPE_LIVE_AUTOSPLAT_KEYS: readonly string[] = [
    'bandWidth',
    'slopeStart',
    'slopeEnd',
    'noise',
    'noiseSize',
]

// =============================================================================
// Normalisation
// =============================================================================
//
// Same rule as the terrain, not the ocean: a blob with no heightMap renders
// nothing. There is no legacy landscape shape to migrate, and a landscape with
// no heightmap is not a landscape.
//
// Each block merges over its own defaults SEPARATELY, so a quality edit does not
// hand the mesh a new config object and re-run RTIN.

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null

export function normalizeLandscapeSurface(raw: unknown, index = 0): LandscapeSurface {
    const src = isRecord(raw) ? raw : {}
    return {
        ...defaultLandscapeSurface,
        name: typeof src.name === 'string' ? src.name : `Surface ${index + 1}`,
        ...(src as Partial<LandscapeSurface>),
    }
}

export function normalizeLandscape(raw: unknown): LandscapeConfig | null {
    if (!isRecord(raw)) return null
    if (typeof raw.heightMap !== 'string' || raw.heightMap.length === 0) return null

    const host: LandscapeHost = raw.host === 'object' ? 'object' : 'ground'
    const limit = host === 'object' ? MAX_OBJECT_SURFACES : MAX_LANDSCAPE_SURFACES
    const surfaces = Array.isArray(raw.surfaces)
        ? raw.surfaces.slice(0, limit).map((s, i) => normalizeLandscapeSurface(s, i))
        : []

    return {
        ...defaultLandscapeConfig,
        ...(raw as Partial<LandscapeConfig>),
        host,
        surfaces,
        splatMaps: Array.isArray(raw.splatMaps)
            ? (raw.splatMaps.filter((s) => typeof s === 'string') as string[]).slice(0, 2)
            : [],
        autoSplat: {
            ...defaultAutoSplat,
            ...(isRecord(raw.autoSplat) ? (raw.autoSplat as Partial<AutoSplatConfig>) : {}),
            bands: Array.isArray((raw.autoSplat as AutoSplatConfig | undefined)?.bands)
                ? ((raw.autoSplat as AutoSplatConfig).bands as number[])
                : [...defaultAutoSplat.bands],
        },
        origin: Array.isArray(raw.origin) && raw.origin.length === 3
            ? ([...(raw.origin as number[])] as [number, number, number])
            : [...defaultLandscapeConfig.origin],
    }
}

export function normalizeLandscapeQuality(raw: unknown): LandscapeQualityConfig {
    return {
        ...defaultLandscapeQuality,
        ...(isRecord(raw) ? (raw as Partial<LandscapeQualityConfig>) : {}),
    }
}

export function normalizeLandscapeSettings(raw: unknown): LandscapeSettings {
    const source = isRecord(raw) ? raw : {}
    const config = normalizeLandscape(source.config)
    return {
        id: typeof source.id === 'string' ? source.id : defaultLandscapeSettings.id,
        type: 'landscape',
        config: config ?? { ...defaultLandscapeConfig },
        quality: normalizeLandscapeQuality(source.quality),
    }
}
