// Moved from client (client/app/utils/optionalProperties.ts). Property tables — the registry (../registry) is built on these.
export interface OptionalProperty {
    name: string;
    description: string;
    type: 'number' | 'string' | 'boolean' | 'color' | 'vector3' | 'vector2' | 'select';
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    /** Display labels for `options` (same order); the values are what is stored. */
    optionLabels?: string[];
    /** Display label; defaults to the name split at capitals ("pointerStrength" -> "Pointer Strength"). */
    label?: string;
    /** false = structural: set only, never driven per frame. Absent = numbers / colours
     *  animate. Carried from the env schemas; read by the property registry. */
    animatable?: boolean;
    /** Display unit ('°', 'm', 's'…), shown after the value. */
    unit?: string;
    /** Value the panel shows when the settings do not carry one yet. */
    default?: unknown;
}

// The sky panel's own ranges (SkyControllerUi renders from these). Elevation goes
// below the horizon for dusk / night; azimuth is signed around north.
export const skyOptionalProperties: OptionalProperty[] = [
    { name: 'turbidity', label: 'Turbidity', description: 'Atmospheric haze, affects sky color and sun intensity', type: 'number', min: 0, max: 20, step: 0.1 },
    { name: 'rayleigh', label: 'Rayleigh', description: 'Rayleigh scattering coefficient for blue light', type: 'number', min: 0, max: 4, step: 0.1 },
    { name: 'mieCoefficient', label: 'Mie Coefficient', description: 'Mie scattering coefficient for particles in atmosphere', type: 'number', min: 0, max: 0.1, step: 0.001 },
    { name: 'mieDirectionalG', label: 'Mie Directional G', description: 'Directional intensity of Mie scattering', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'elevation', label: 'Elevation', description: 'Height of the sun above the horizon (negative = below it)', type: 'number', min: -90, max: 90, step: 1, unit: '°' },
    { name: 'azimuth', label: 'Azimuth', description: 'Compass direction of the sun', type: 'number', min: -180, max: 180, step: 1, unit: '°' },
];

export const oceanOptionalProperties: OptionalProperty[] = [
    {
        name: 'sunColor',
        description: 'Color of the sun reflection on water',
        type: 'color',
    },
    {
        name: 'waterColor',
        description: 'Base color of the water',
        type: 'color',
    },
    {
        name: 'distortionScale',
        description: 'Intensity of water surface distortion',
        type: 'number',
        min: 0,
        max: 20,
        step: 0.1,
    },
    {
        name: 'waveHeight',
        description: 'Height of the water waves',
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
    },
    {
        name: 'speed',
        description: 'Speed of water movement animation',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
    }
];

// Procedural terrain. Built from the renderer's schema the same way the cloud rows
// are, so a knob added to the shader shows up in the panel with its bounds and its
// description without anything here being touched.
import {
    TERRAIN_SCHEMA,
    TERRAIN_QUALITY_SCHEMA,
    type TerrainPropertySchema,
    type TerrainType,
    OCEAN_SCHEMA,
    OCEAN_QUALITY_SCHEMA,
    type OceanPropertySchema,
    type WaterHost,
    type WaterType,
    LANDSCAPE_SCHEMA,
    LANDSCAPE_AUTOSPLAT_SCHEMA,
    LANDSCAPE_QUALITY_SCHEMA,
    type LandscapePropertySchema,
    type LandscapeHost,
} from '../../environment/index';

function toTerrainOptional(schema: TerrainPropertySchema[], type?: TerrainType): OptionalProperty[] {
    return schema
        .filter((p) => !p.advanced)
        // A property scoped to a landform is not merely hidden elsewhere - the shader
        // gates it on the type, so it would do nothing.
        .filter((p) => !p.types || !type || p.types.includes(type))
        .map((p) => ({
            name: p.key,
            description: p.unit ? `${p.description} (${p.unit})` : p.description,
            type: 'number' as const,
            min: p.min,
            max: p.max,
            step: p.step,
            ...(p.animatable === false ? { animatable: false } : {}),
            ...(p.unit ? { unit: p.unit } : {}),
        }));
}

// The on/off switch is UI state rather than a shader parameter, so it is not in the
// schema; BaseControllerUi renders a listed boolean as a toggle and persists it
// immediately, which is the right behaviour for a switch.
const terrainEnabled: OptionalProperty = {
    name: 'enabled',
    description: 'Render the terrain',
    type: 'boolean',
};

/** Terrain properties for a given landform. Strata, plateau, incision and the dune
 *  terms only appear on the types whose shader branch reads them. */
export const terrainOptionalProperties = (type?: TerrainType): OptionalProperty[] => [
    terrainEnabled,
    ...toTerrainOptional(TERRAIN_SCHEMA, type),
];

/**
 * Ocean rows from the renderer's schema.
 *
 * Same mapping as the terrain's with two extra filters, because the ocean has
 * two hosts and a property that is meaningless on one of them is worse than
 * hidden — a row that does nothing reads as a bug in the renderer. The world
 * ocean has no size and no rim; a placed pool has no sea level of its own beyond
 * its transform.
 */
function toOceanOptional(schema: OceanPropertySchema[], type?: WaterType, host?: WaterHost): OptionalProperty[] {
    return schema
        .filter((p) => !p.advanced)
        .filter((p) => !p.types || !type || p.types.includes(type))
        .filter((p) => !p.hosts || !host || p.hosts.includes(host))
        // Only ranged numbers and colours have a row. `size` is a vector2 the
        // Transform tab already owns for a placed body.
        .filter((p) => !p.kind || p.kind === 'number' || p.kind === 'color' || p.kind === 'boolean')
        .map((p) => ({
            name: p.key,
            description: p.unit ? `${p.description} (${p.unit})` : p.description,
            type: (p.kind ?? 'number') as OptionalProperty['type'],
            min: p.min,
            max: p.max,
            step: p.step,
            options: p.options,
            ...(p.animatable === false ? { animatable: false } : {}),
            ...(p.unit ? { unit: p.unit } : {}),
        }));
}

// The on/off switch is UI state rather than a shader parameter, so it is not in
// the schema; BaseControllerUi renders a listed boolean as a toggle and persists
// it immediately, which is the right behaviour for a switch.
const oceanEnabled: OptionalProperty = {
    name: 'enabled',
    description: 'Render the water',
    type: 'boolean',
};

/** Ocean properties for a given water type and host. */
export const oceanSurfaceOptionalProperties = (type?: WaterType, host?: WaterHost): OptionalProperty[] => [
    oceanEnabled,
    ...toOceanOptional(OCEAN_SCHEMA, type, host),
];

export const oceanQualityOptionalProperties: OptionalProperty[] = [
    {
        name: 'receiveShadows',
        description: 'Receive the scene shadow map, so objects cast onto the water',
        type: 'boolean',
    },
    {
        name: 'wireframe',
        description: 'Draw the water surface as wireframe',
        type: 'boolean',
    },
    ...toOceanOptional(OCEAN_QUALITY_SCHEMA),
];

export const terrainQualityOptionalProperties: OptionalProperty[] = [
    {
        name: 'receiveShadows',
        description: 'Receive the scene shadow map, so objects cast onto the ground. Terrain-on-terrain shadowing is analytic and unaffected by this',
        type: 'boolean',
    },
    {
        name: 'wireframe',
        description: 'Draw the clipmap rings as wireframe',
        type: 'boolean',
    },
    ...toTerrainOptional(TERRAIN_QUALITY_SCHEMA),
];

// Landscape rows, from the renderer's schema like everything else here. The
// surface LIST is not in the schema and cannot be: it is an array of objects with
// their own texture slots, which BaseControllerUi's flat whitelist has no shape
// for. LandscapeSurfaceList renders it and uses landscapeSurfaceOptionalProperties
// for the rows inside one surface.
function toLandscapeOptional(schema: LandscapePropertySchema[], host?: LandscapeHost): OptionalProperty[] {
    return schema
        .filter((p) => !p.advanced)
        .filter((p) => !p.hosts || !host || p.hosts.includes(host))
        .map((p) => ({
            name: p.key,
            description: p.unit ? `${p.description} (${p.unit})` : p.description,
            type: (p.type ?? 'number') as OptionalProperty['type'],
            min: p.min,
            max: p.max,
            step: p.step,
            options: p.options,
            ...(p.animatable === false ? { animatable: false } : {}),
            ...(p.unit ? { unit: p.unit } : {}),
        }));
}

const landscapeEnabled: OptionalProperty = {
    name: 'enabled',
    description: 'Render the landscape',
    type: 'boolean',
};

export const landscapeOptionalProperties = (host?: LandscapeHost): OptionalProperty[] => [
    landscapeEnabled,
    ...toLandscapeOptional(LANDSCAPE_SCHEMA, host),
];

/** Height and slope rules for a generated splat. Only shown when splatSource is
 *  'auto' — with authored maps they would do nothing, and a row that does nothing
 *  reads as a bug in the renderer. */
export const landscapeAutoSplatOptionalProperties: OptionalProperty[] =
    toLandscapeOptional(LANDSCAPE_AUTOSPLAT_SCHEMA);

export const landscapeQualityOptionalProperties: OptionalProperty[] =
    toLandscapeOptional(LANDSCAPE_QUALITY_SCHEMA);

/** One surface's rows. Hand-written rather than schema-driven because a surface
 *  is not a shader parameter block — it is a material, and its texture slots are
 *  rendered by the surface list itself. */
export const landscapeSurfaceOptionalProperties: OptionalProperty[] = [
    { name: 'repeat', description: 'How many times this texture tiles across the whole landscape. The single knob that decides whether the ground reads at the right scale.', type: 'number', min: 1, max: 2000, step: 1 },
    { name: 'normalStrength', description: 'Normal map strength.', type: 'number', min: 0, max: 2, step: 0.01 },
    { name: 'roughness', description: 'Per-surface roughness. Wet mud and dry rock are not the same material.', type: 'number', min: 0.04, max: 1, step: 0.01 },
    { name: 'metalness', description: 'Almost always 0 for ground; wet rock is the exception.', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'saturation', description: 'A luma lerp: 0 is greyscale, 1 leaves the texture alone, above 1 pushes.', type: 'number', min: 0, max: 2, step: 0.01 },
    { name: 'heightBlend', description: 'How hard this surface pushes through its neighbours at a transition, using its own height map. 0 cross-fades; 1 lets the texture\u2019s own grain decide.', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'tint', description: 'Multiplied into the albedo.', type: 'color' },
    { name: 'aperiodic', description: 'Stochastic tiling: breaks the repeat grid at three fetches instead of one. Worth it on anything the camera gets close to.', type: 'boolean' },
    { name: 'triplanar', description: 'Project on world axes instead of the tile UV, so a vertical face is not a smear. Doubles the fetches for this surface \u2014 cliffs and rock only.', type: 'boolean' },
    { name: 'flipNormalY', description: 'Flip the normal map green channel (DirectX vs OpenGL).', type: 'boolean' },
];

export const textOptionalProperties: OptionalProperty[] = [
    {
        name: 'text',
        description: 'Text content to display',
        type: 'string',
    },
    
    {
        name: 'height',
        description: 'Extrusion depth of the 3D text',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'position',
        description: 'Position of the text in 3D space',
        type: 'vector3',
    },
    {
        name: 'scale',
        description: 'Scale of the text object',
        type: 'vector3',
    },
    {
        name: 'bevelSize',
        description: 'Size of the text bevel',
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
    },
    {
        name: 'bevelSegments',
        description: 'Number of bevel segments for smoother edges',
        type: 'number',
        min: 1,
        max: 20,
        step: 1,
    },
    {
        name: 'curveSegments',
        description: 'Number of segments for text curves',
        type: 'number',
        min: 1,
        max: 256,
        step: 1,
    },
    {
        name: 'bevelThickness',
        description: 'Thickness of the text bevel',
        type: 'number',
        min: 0,
        max: 0.1,
        step: 0.001,
    },
    {
        name: 'letterSpacing',
        description: 'Spacing between letters',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    }
];

export const plainOptionalProperties: OptionalProperty[] = [
    {
        name: 'materialType',
        description: 'Type of material for the plane',
        type: 'select',
        options: ['reflector', 'refraction', 'transmission', 'wobble', 'distort', 'standard', 'physical', 'basic', 'lambert', 'phong', 'toon', 'normal', 'matcap'],
    },
    {
        name: 'position',
        description: 'Position of the plane in 3D space',
        type: 'vector3',
    },
    {
        name: 'rotation',
        description: 'Rotation of the plane',
        type: 'vector3',
    },
    {
        name: 'scale',
        description: 'Scale of the plane',
        type: 'vector3',
    },
    {
        name: 'size',
        description: 'Width and height of the plane',
        type: 'vector2',
    },
    {
        name: 'color',
        description: 'Base color of the plane',
        type: 'color',
    },
    {
        name: 'blur',
        description: 'Blur amount for reflective materials',
        type: 'vector2',
    },
    {
        name: 'resolution',
        description: 'Resolution for reflective materials',
        type: 'number',
        min: 256,
        max: 4096,
        step: 256,
    },
    {
        name: 'mixBlur',
        description: 'Mix factor for blur effect',
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
    },
    {
        name: 'mixStrength',
        description: 'Strength of the reflection mix',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
    },
    {
        name: 'roughness',
        description: 'Surface roughness of the material',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'metalness',
        description: 'Metallic property of the material',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'depthScale',
        description: 'Scale factor for depth-based effects',
        type: 'number',
        min: 0,
        max: 5,
        step: 0.1,
    },
    {
        name: 'minDepthThreshold',
        description: 'Minimum depth threshold for effects',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'maxDepthThreshold',
        description: 'Maximum depth threshold for effects',
        type: 'number',
        min: 0,
        max: 5,
        step: 0.01,
    }
];

export const meshOptionalProperties: OptionalProperty[] = [
    {
        name: 'position',
        description: 'Position of the mesh in 3D space',
        type: 'vector3',
    },
    {
        name: 'rotation',
        description: 'Rotation of the mesh in radians',
        type: 'vector3',
    },
    {
        name: 'scale',
        description: 'Scale factor for each axis',
        type: 'vector3',
    },
    {
        name: 'color',
        description: 'Base color of the mesh material',
        type: 'color',
    },
    {
        name: 'opacity',
        description: 'Transparency of the mesh material',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    }
];

// The rain panel's knobs (RainControllerUi renders from these).
export const rainOptionalProperties: OptionalProperty[] = [
    { name: 'color', label: 'Color', description: 'Color of rain particles', type: 'color' },
    { name: 'size', label: 'Size', description: 'Size of individual rain particles', type: 'number', min: 0.01, max: 1, step: 0.01 },
    { name: 'opacity', label: 'Opacity', description: 'Transparency of rain particles', type: 'number', min: 0, max: 1, step: 0.01, default: 0.5 },
    { name: 'speed', label: 'Speed', description: 'Speed of falling rain', type: 'number', min: 0.1, max: 5, step: 0.1, unit: 'x', default: 1 },
    { name: 'density', label: 'Density', description: 'Number of rain particles', type: 'number', min: 1, max: 200, step: 1, default: 100 },
    { name: 'windStrength', label: 'Wind Strength', description: 'How hard the wind pushes the drops sideways', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
    { name: 'windDirection', label: 'Wind Direction', description: 'Compass direction the wind blows toward', type: 'number', min: 0, max: 360, step: 1, unit: '°', default: 0 },
    { name: 'turbulence', label: 'Turbulence', description: 'Random sway of the drops', type: 'number', min: 0, max: 1, step: 0.01, default: 0 },
];

// A path object's knobs (PathControllerUi renders from these). Structural: they rebuild the line.
export const pathOptionalProperties: OptionalProperty[] = [
    { name: 'pointSize', label: 'Point Size', description: 'Size of the path points', type: 'number', min: 0.05, max: 1, step: 0.05, default: 0.1 },
    { name: 'lineWidth', label: 'Line Width', description: 'Width of the path line', type: 'number', min: 1, max: 10, step: 0.5, default: 2 },
    { name: 'curve', label: 'Curve Smoothness', description: 'Samples per segment of the curve', type: 'number', min: 1, max: 100, step: 1, default: 1 },
    { name: 'smoothCorners', label: 'Smooth Corners', description: 'How much the corners are rounded', type: 'number', min: 0, max: 100, step: 1, default: 0 },
];

// An object's edges (EdgesControllerUi). Tube radius / cube size are in world units
// (the panel shows millimetres) and rebuild the edge geometry, so they are structural.
export const edgesOptionalProperties: OptionalProperty[] = [
    { name: 'enabled', label: 'Enable Edges', description: 'Draw the object\'s edges', type: 'boolean', default: false },
    { name: 'type', label: 'Type', description: 'How the edges are drawn', type: 'select', options: ['line', 'tube', 'cube', 'particles'], optionLabels: ['Line', 'Tube', 'Cube', 'Particles'], default: 'line' },
    { name: 'tubeRadius', label: 'Tube Radius', description: 'Radius of the edge tubes (type tube)', type: 'number', min: 0.001, max: 0.1, step: 0.001, unit: 'm', default: 0.01 },
    { name: 'cubeSize', label: 'Cube Size', description: 'Size of the edge cubes (type cube)', type: 'number', min: 0.001, max: 0.1, step: 0.001, unit: 'm', default: 0.02 },
];

export const fogOptionalProperties: OptionalProperty[] = [
    {
        name: 'color',
        description: 'Color of the fog',
        type: 'color',
    },
    {
        name: 'near',
        description: 'Distance where fog starts to appear',
        type: 'number',
        min: 0.1,
        max: 100,
        step: 0.1,
    },
    {
        name: 'far',
        description: 'Distance where fog reaches maximum density',
        type: 'number',
        min: 1,
        max: 1000,
        step: 1,
    }
];

export const starsOptionalProperties: OptionalProperty[] = [
    {
        name: 'rotateSpeed',
        description: 'Speed of stars rotation',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
    },
    {
        name: 'count',
        description: 'Number of stars to display',
        type: 'number',
        min: 10,
        max: 1000,
        step: 10,
    },
    {
        name: 'sep',
        description: 'Separation distance between stars',
        type: 'number',
        min: 1,
        max: 20,
        step: 0.1,
    },
    {
        name: 'color',
        description: 'Color of the stars',
        type: 'color',
    },
    {
        name: 'size',
        description: 'Size of individual stars',
        type: 'number',
        min: 0.01,
        max: 1,
        step: 0.01,
    }
];

export const shootingStarsOptionalProperties: OptionalProperty[] = [
    {
        name: 'count',
        description: 'Number of shooting stars active at once',
        type: 'number',
        min: 1,
        max: 50,
        step: 1,
    },
    {
        name: 'speedRange',
        description: 'Min and max speed of shooting stars',
        type: 'vector2',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'lengthRange',
        description: 'Min and max length of shooting star trails',
        type: 'vector2',
        min: 1,
        max: 500,
        step: 1,
    },
    {
        name: 'intervalRange',
        description: 'Min and max seconds between new shooting stars',
        type: 'vector2',
        min: 0.1,
        max: 30,
        step: 0.1,
    },
    {
        name: 'trailLengthRange',
        description: 'Min and max trail fade length',
        type: 'vector2',
        min: 1,
        max: 300,
        step: 1,
    },
    {
        name: 'followMouse',
        description: 'Shooting stars aim toward mouse cursor',
        type: 'boolean',
    },
];

export const hdrOptionalProperties: OptionalProperty[] = [
    {
        name: 'name',
        description: 'HDR environment name',
        type: 'select',
        options: ['apartment', 'city', 'forest', 'dawn', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'],
    },
    {
        name: 'url',
        description: 'Custom HDR environment URL',
        type: 'string',
    }
];

export const cloudsOptionalProperties: OptionalProperty[] = [
    {
        name: 'cloudColor',
        description: 'Color of the clouds',
        type: 'color',
    },
    {
        name: 'lightColor',
        description: 'Color of the lightning',
        type: 'color',
    },
    {
        name: 'speed',
        description: 'Speed of cloud movement',
        type: 'number',
    },
    {
        name: 'scroll',
        description: 'Scroll factor for cloud texture',
        type: 'number',
    }
];

// =============================================================================
// Volumetric clouds
// =============================================================================
//
// Derived, not re-typed. The ranges and descriptions live next to the shader in
// @3driseai/3drise-viewer, so a knob added to the renderer reaches this panel and
// the AI agent's context without either being edited here. Advanced entries are
// dropped: they are per-octave scattering constants that are not useful to drag.

import {
    CIRRUS_SCHEMA,
    CLOUD_DECK_SCHEMA,
    CLOUD_QUALITY_SCHEMA,
    THUNDER_SCHEMA,
    type CloudPropertySchema,
    type CloudDeckType,
} from '../../environment/index';

function toOptional(schema: CloudPropertySchema[], deckType?: CloudDeckType): OptionalProperty[] {
    return schema
        .filter((p) => !p.advanced)
        // A property scoped to a type is not merely hidden elsewhere — the shader
        // gates it on the vertical profile, so it would do nothing.
        .filter((p) => !p.types || !deckType || p.types.includes(deckType))
        .map((p) => ({
            name: p.key,
            description: p.unit ? `${p.description} (${p.unit})` : p.description,
            type: (p.valueType ?? 'number') as OptionalProperty['type'],
            min: p.min,
            max: p.max,
            step: p.step,
            ...(p.animatable === false ? { animatable: false } : {}),
            ...(p.unit ? { unit: p.unit } : {}),
        }));
}

// The on/off switches are UI state rather than shader parameters, so they are not in
// the schema; BaseControllerUi renders a listed boolean as a toggle and persists it
// immediately, which is the right behaviour for a switch.
const deckEnabled: OptionalProperty = {
    name: 'enabled',
    description: 'Show the main cloud layer',
    type: 'boolean',
};

/** Deck properties for a given type. Anvil and precipitation only appear on a storm. */
export const cloudDeckOptionalProperties = (deckType?: CloudDeckType): OptionalProperty[] => [
    deckEnabled,
    ...toOptional(CLOUD_DECK_SCHEMA, deckType),
];

export const cirrusOptionalProperties: OptionalProperty[] = [
    { name: 'enabled', description: 'Show the high wispy ice layer', type: 'boolean' },
    ...toOptional(CIRRUS_SCHEMA),
];

export const thunderOptionalProperties: OptionalProperty[] = [
    { name: 'enabled', description: 'Turn lightning on', type: 'boolean' },
    ...toOptional(THUNDER_SCHEMA),
];

export const cloudQualityOptionalProperties: OptionalProperty[] = [
    {
        name: 'tonemap',
        description: 'Let the clouds handle their own final colour balance. Turn this off if you are using post-processing effects, or the image gets processed twice and looks washed out',
        type: 'boolean',
    },
    ...toOptional(CLOUD_QUALITY_SCHEMA),
];

// =============================================================================
// Gallery layout
// =============================================================================
//
// createdObject.config for a 'gallery' object is one flat GalleryLayoutSettings
// bag that every layout algorithm in GalleryCreator.ts can read from, but each
// layout only reads a handful of its fields (see GALLERY_LAYOUT_CONFIGS in
// GalleryLayouts.ts). A row for a field the active layout ignores does nothing,
// so the whitelist is built per-layout from that same config.

import { getLayoutSettingsFields } from '../../utils/GalleryLayouts';
import type { GalleryLayout } from '../../types/gallery';

const GALLERY_FIELD_DEFS: Record<string, OptionalProperty> = {
    columns: { name: 'columns', description: 'Number of columns in the grid', type: 'number', min: 1, max: 12, step: 1 },
    spacing: { name: 'spacing', description: 'Distance between adjacent frames', type: 'number', min: 0.5, max: 10, step: 0.1 },
    startX: { name: 'startX', description: 'Horizontal offset of the first frame', type: 'number', min: -20, max: 20, step: 0.5 },
    startY: { name: 'startY', description: 'Vertical offset of the first frame', type: 'number', min: -20, max: 20, step: 0.5 },
    radius: { name: 'radius', description: 'Radius of the layout', type: 'number', min: 0.5, max: 30, step: 0.5 },
    size: { name: 'size', description: 'Half-size of the box the frames are placed on', type: 'number', min: 1, max: 20, step: 0.5 },
    rotations: { name: 'rotations', description: 'Number of full turns the layout makes', type: 'number', min: 1, max: 10, step: 1 },
    heightIncrement: { name: 'heightIncrement', description: 'Vertical rise per image', type: 'number', min: 0, max: 2, step: 0.05 },
    arcAngle: { name: 'arcAngle', description: 'Total arc the frames are spread across, in radians', type: 'number', min: 0, max: Math.PI * 2, step: 0.05 },
    amplitude: { name: 'amplitude', description: 'Height of the wave motion', type: 'number', min: 0, max: 10, step: 0.1 },
    frequency: { name: 'frequency', description: 'Number of wave oscillations across the gallery', type: 'number', min: 0.1, max: 10, step: 0.1 },
    layers: { name: 'layers', description: 'Number of stacked layers', type: 'number', min: 1, max: 10, step: 1 },
    depth: { name: 'depth', description: 'Total distance the layout recedes into the screen', type: 'number', min: 1, max: 60, step: 1 },
    scaleFactor: { name: 'scaleFactor', description: 'Per-frame shrink factor going into the tunnel', type: 'number', min: 0.1, max: 1, step: 0.01 },
    bounds: { name: 'bounds', description: 'Half-extent of the random placement volume', type: 'number', min: 1, max: 30, step: 0.5 },
    seed: { name: 'seed', description: 'Change to reshuffle the random layout', type: 'number', min: 1, max: 999, step: 1 },
};

/** Defaults mirror getInitialLayoutSettings, so a row left blank by a previous
 *  layout still shows a sane starting value instead of disappearing. */
export const GALLERY_FIELD_DEFAULTS: Record<string, number> = {
    columns: 3,
    width: 1,
    height: 1,
    spacing: 3.5,
    startX: 0,
    startY: 0,
    radius: 5,
    size: 5,
    rotations: 2,
    heightIncrement: 0.5,
    arcAngle: Math.PI,
    amplitude: 2,
    frequency: 2,
    layers: 3,
    depth: 20,
    scaleFactor: 0.8,
    bounds: 8,
    seed: 1,
    outerFrameScale: 1,
    numImages: 20,
};

export const galleryCommonProperties: OptionalProperty[] = [
    { name: 'outerFrameScale', description: 'Scale of the frame relative to the image', type: 'number', min: 0.1, max: 3, step: 0.05 },
    { name: 'width', description: 'Frame width', type: 'number', min: 0.1, max: 10, step: 0.1 },
    { name: 'height', description: 'Frame height', type: 'number', min: 0.1, max: 10, step: 0.1 },
    { name: 'numImages', description: 'Placeholder image count used only while no images are assigned', type: 'number', min: 1, max: 100, step: 1 },
];

/** Only the layout-math fields the given layout actually reads (LayoutCreator). */
export const layoutFieldOptionalProperties = (layout: GalleryLayout): OptionalProperty[] => [
    ...getLayoutSettingsFields(layout)
        .map((field) => GALLERY_FIELD_DEFS[field as string])
        .filter((def): def is OptionalProperty => !!def),
    ...(layout === 'random' ? [GALLERY_FIELD_DEFS.seed] : []),
];

/** Only the fields GalleryCreator.generateGallery actually reads for this layout. */
export const galleryLayoutOptionalProperties = (layout: GalleryLayout): OptionalProperty[] => [
    ...galleryCommonProperties,
    ...layoutFieldOptionalProperties(layout),
];

/** meshSettings.layout — the rows above the per-layout fields in the Transform tab. */
export const objectLayoutCommonProperties: OptionalProperty[] = [
    { name: 'enabled', description: 'Repeat this object across the selected layout', type: 'boolean' },
    { name: 'count', description: 'Number of copies', type: 'number', min: 1, max: 100, step: 1 },
];

// Export all optional properties as a collection for easy access
export const environmentOptionalProperties = {
    sky: skyOptionalProperties,
    ocean: oceanOptionalProperties,
    terrain: terrainOptionalProperties(),
    text: textOptionalProperties,
    plain: plainOptionalProperties,
    mesh: meshOptionalProperties,
    rain: rainOptionalProperties,
    fog: fogOptionalProperties,
    stars: starsOptionalProperties,
    hdr: hdrOptionalProperties,
    clouds: cloudsOptionalProperties
} as const;

// Type for accessing specific environment optional properties
export type EnvironmentType = keyof typeof environmentOptionalProperties;
