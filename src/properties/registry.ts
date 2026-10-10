// =============================================================================
// Property registry — every property of every element, one answer for everyone
// =============================================================================
//
//   getPropertySpecs(element, settings)    every property that applies to this element
//   getAnimatableSpecs(element, settings)  the ones that can be driven per frame right now
//   getTrackSpecs(element, settings)       the ones an animation clip keys (timeline, AI)
//   getDiscreteTrackSpecs(element, settings) structural ones a clip sets at its keys
//   getPropertySpec(element, settings, key)
//   describeProperties(element, settings)  specs + current values (scene analysis, AI)
//   isPropertyLive(element, spec, settings) its layer is on (edges, cloud deck / cirrus)
//
// Nothing is re-typed here. Each provider adapts a list that already exists:
//
//   transform        meshSettings position / rotation / scale / visible
//   material         the object's own materialSettings keys + MATERIAL_PROPERTY_BOUNDS
//   edges            edgesSettings (tube radius / cube size) + its material keys
//   light            LIGHT_PROPERTIES[type] + SHADOW_PROPERTIES[type]; animatable = LIGHTS_ANIMATABLE
//   particles        PARTICLES_PROPERTIES[type];  animatable = GENERATIVE_PARTICLES_ANIMATABLE
//   effect           EFFECT_PROPERTIES[type];     animatable = EFFECTS_ANIMATABLE
//   grid             GRID_PROPERTIES[type];       animatable = GRIDS_ANIMATABLE
//   environment      ENVIRONMENT_PROPERTIES[type]; animatable = ENVIRONMENT_OBJECTS_ANIMATABLE (snow, rain…)
//   land             LAND_PROPERTIES[type];       animatable = LAND_OBJECTS_ANIMATABLE (mountains, hills, dunes, canyon)
//   space            SPACE_PROPERTIES[type];      animatable = SPACE_OBJECTS_ANIMATABLE (stars, earth, solarSystem, shootingStars)
//   text             TEXT_PROPERTIES[type];       animatable = TEXT_OBJECTS_ANIMATABLE (plain, handwriting, neonTube, …)
//   rain / clouds    the scene-level rain element (RainSettings) / legacy clouds object;  animatable = RAIN_ANIMATABLE_KEYS / CLOUD_ANIMATABLE_PROPERTIES
//   text/plain/path  their controller lists (config knobs, structural)
//   mesh (shapes)    SHAPE_CONTROLS[config.type] + MODE_CONTROLS[modeConfig.mode] (structural)
//   camera           position / target / fov
//   sky              skyOptionalProperties
//   clouds           cloud deck (by deckType) + cirrus, from the core cloud schemas
//   ocean            ocean surface (by waterType / host), from OCEAN_SCHEMA
//   terrain          terrain (by terrainType), from TERRAIN_SCHEMA
//
// The animatable rule:
//   - generative families, lights, rain, legacy clouds objects: the generated /
//     listed table decides (a knob is listed only when the renderer pushes it per frame);
//   - environment: numbers and colours, except what the schema marks
//     `animatable: false` (cloud altitudes and sizes, ocean mesh, terrain land shape)
//     and the on/off switches;
//   - material / edges material: numbers, colours, booleans and vec3s the object
//     carries, minus internal keys and render-state switches;
//   - transform and camera: always; edges switches / sizes, shadows, text / plain /
//     path / shape / display-mode knobs: never.
//
import type { CreatedObjectSettings } from '../types/scene3d';
import { LIGHTS_ANIMATABLE } from '../data/lightsDefaults';
import { GENERATIVE_PARTICLES_ANIMATABLE } from '../data/particlesDefaults';
import { EFFECTS_ANIMATABLE } from '../data/effectsDefaults';
import { GRIDS_ANIMATABLE } from '../data/gridsDefaults';
import { ENVIRONMENT_OBJECTS_ANIMATABLE } from '../data/environmentDefaults';
import { LAND_OBJECTS_ANIMATABLE } from '../data/landDefaults';
import { SPACE_OBJECTS_ANIMATABLE } from '../data/spaceDefaults';
import { TEXT_OBJECTS_ANIMATABLE } from '../data/textDefaults';
import { CLOUD_ANIMATABLE_PROPERTIES } from '../environment/cloudConfigs';
import {
    type OptionalProperty,
    skyOptionalProperties, skyStarsOptionalProperties, cloudDeckOptionalProperties, cirrusOptionalProperties, thunderOptionalProperties,
    oceanSurfaceOptionalProperties, terrainOptionalProperties,
    rainOptionalProperties, cloudsOptionalProperties,
    plainOptionalProperties,
    pathOptionalProperties, edgesOptionalProperties,
} from './tables/optionalProperties';
import { SHAPE_CONTROLS, MODE_CONTROLS, type ControlOf } from './tables/geometryProperties';
import { LIGHT_PROPERTIES, SHADOW_PROPERTIES, type LightProperty } from './tables/lightProperties';
import { PARTICLES_PROPERTIES } from './tables/particlesProperties';
import { EFFECT_PROPERTIES } from './tables/effectsProperties';
import { GRID_PROPERTIES } from './tables/gridProperties';
import { ENVIRONMENT_PROPERTIES } from './tables/environmentProperties';
import { LAND_PROPERTIES } from './tables/landProperties';
import { SPACE_PROPERTIES } from './tables/spaceProperties';
import { TEXT_PROPERTIES } from './tables/textProperties';
import { MATERIAL_PROPERTY_BOUNDS } from './tables/materialBounds';
import type {
    DescribedProperty, PropertyDomain, PropertyElement, PropertyKind, PropertyOption, PropertySpec,
} from './types';

// =============================================================================
// Data owned here (was inline in getAnimatableProperties / the timeline)
// =============================================================================

/** Rain object knobs driven per frame. */
export const RAIN_ANIMATABLE_KEYS = ['color', 'size', 'opacity', 'speed', 'windStrength', 'windDirection', 'turbulence'] as const;

/** Material keys that are engine bookkeeping, never a property. */
const MATERIAL_INTERNAL = new Set(['handlers', 'apply', 'uHasTexture', 'u_time', 'u_mouse', 'u_resolution']);
/** Material keys that are settable but never per frame (identity, render state). */
const MATERIAL_STRUCTURAL = new Set([
    'materialType', 'materialVariant', 'materialName', 'name', 'side', 'visible', 'map',
    'wireframe', 'transparent', 'flatShading',
]);

/**
 * Objects that own their shader: their materialSettings (if any) never reach the
 * renderer, so they have no material properties. They animate through config.
 */
export const SELF_MANAGED_MATERIAL_TYPES = new Set(['effect', 'grid', 'light', 'particles', 'environment', 'space', 'land', 'text']);

/** True when the object draws with its own shaders (the object types above): it gets no material specs. */
export const selfManagesMaterial = (obj: { type?: string; config?: unknown } | null | undefined): boolean =>
    !!obj && SELF_MANAGED_MATERIAL_TYPES.has(obj.type as string);

const CAMERA_SPECS: PropertySpec[] = [
    { key: 'position', name: 'position', label: 'Position', kind: 'vec3', domain: 'camera', animatable: true },
    { key: 'controls.target', name: 'target', label: 'Target', kind: 'vec3', domain: 'camera', animatable: true },
    { key: 'fov', name: 'fov', label: 'Field of view', kind: 'number', domain: 'camera', min: 10, max: 120, step: 1, unit: 'deg', animatable: true },
];

const TRANSFORM_SPECS: PropertySpec[] = [
    { key: 'meshSettings.position', name: 'position', label: 'Position', kind: 'vec3', domain: 'transform', animatable: true },
    { key: 'meshSettings.rotation', name: 'rotation', label: 'Rotation', kind: 'vec3', domain: 'transform', animatable: true },
    { key: 'meshSettings.scale', name: 'scale', label: 'Scale', kind: 'vec3', domain: 'transform', animatable: true },
    { key: 'meshSettings.visible', name: 'visible', label: 'Visible', kind: 'boolean', domain: 'transform', animatable: true },
];

// =============================================================================
// Helpers
// =============================================================================

/** camelCase → "Title Case" (same as toAnimatableLabel). */
export const propertyLabel = (key: string): string =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();

export function getSettingAtPath(obj: unknown, path: string): unknown {
    let cur: any = obj;
    for (const part of path.split('.')) {
        if (cur === null || cur === undefined) return undefined;
        cur = cur[part];
    }
    return cur;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Kind of a value found on settings (material keys and table-only knobs have no spec to say). */
export function kindOfValue(key: string, v: unknown): PropertyKind | null {
    if (Array.isArray(v)) {
        if (v.every(n => typeof n === 'number')) return v.length === 3 ? 'vec3' : v.length === 2 ? 'vec2' : null;
        return null;
    }
    if (typeof v === 'number') return 'number';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'string') {
        if (HEX.test(v)) return 'color';
        return /map$|texture/i.test(key) ? 'texture' : 'string';
    }
    if (v === null && /map$|texture/i.test(key)) return 'texture';
    return null;
}

const OPTIONAL_KIND: Record<OptionalProperty['type'], PropertyKind> = {
    number: 'number', string: 'string', boolean: 'boolean', color: 'color',
    vector3: 'vec3', vector2: 'vec2', select: 'select',
};

const toOptions = (p: OptionalProperty): PropertyOption[] | undefined =>
    p.options?.length ? p.options.map((value, i) => (p.optionLabels?.[i] ? { value, label: p.optionLabels[i] } : { value })) : undefined;

/** One controller row → spec. `animatable` is decided by the caller's rule. */
function fromOptional(p: OptionalProperty & { tab?: string }, prefix: string, domain: PropertyDomain, animatable: boolean): PropertySpec {
    const spec: PropertySpec = {
        key: `${prefix}${p.name}`,
        name: p.name,
        label: p.label ?? propertyLabel(p.name),
        kind: OPTIONAL_KIND[p.type] ?? 'number',
        domain,
        animatable,
    };
    if (p.description) spec.description = p.description;
    if (p.min !== undefined) spec.min = p.min;
    if (p.max !== undefined) spec.max = p.max;
    if (p.step !== undefined) spec.step = p.step;
    if (p.unit) spec.unit = p.unit;
    if (p.default !== undefined) spec.default = p.default;
    const options = toOptions(p);
    if (options) spec.options = options;
    if (p.tab) spec.group = p.tab;
    return spec;
}

/**
 * Controller rows → specs, for panels whose element is not in the registry's
 * element list (stars, fog, rain environment, gallery…). Numbers / colours count
 * as animatable unless the row says otherwise; panels ignore the flag.
 */
export function toPropertySpecs(list: OptionalProperty[], prefix = '', domain: PropertyDomain = 'config'): PropertySpec[] {
    return list.map(p => fromOptional(p, prefix, domain, envAnimatable(p)));
}

/** Environment rule: numbers / colours animate unless the schema says otherwise; switches never. */
const envAnimatable = (p: OptionalProperty): boolean =>
    p.name !== 'enabled' && (p.type === 'number' || p.type === 'color') && p.animatable !== false;

const envSpecs = (list: OptionalProperty[], prefix: string, domain: PropertyDomain): PropertySpec[] =>
    list.map(p => fromOptional(p, prefix, domain, envAnimatable(p)));

// =============================================================================
// Object providers
// =============================================================================

function materialSpecs(material: Record<string, unknown> | undefined, prefix: string, domain: 'material' | 'edges'): PropertySpec[] {
    if (!material || typeof material !== 'object') return [];
    const out: PropertySpec[] = [];
    for (const [name, value] of Object.entries(material)) {
        if (MATERIAL_INTERNAL.has(name)) continue;
        const kind = kindOfValue(name, value);
        if (!kind) continue;
        const bounds = MATERIAL_PROPERTY_BOUNDS[name];
        const spec: PropertySpec = {
            key: `${prefix}${name}`,
            name,
            label: bounds?.label ?? propertyLabel(name),
            kind,
            domain,
            animatable: !MATERIAL_STRUCTURAL.has(name) && (kind === 'number' || kind === 'color' || kind === 'boolean' || kind === 'vec3'),
        };
        if (bounds && kind === 'number') {
            spec.min = bounds.min;
            spec.max = bounds.max;
            spec.step = bounds.step;
        }
        out.push(spec);
    }
    return out;
}

function edgesSpecs(obj: any): PropertySpec[] {
    const edges = obj?.edgesSettings;
    if (!edges) return [];
    const out: PropertySpec[] = [];
    for (const p of edgesOptionalProperties) {
        // A size knob only exists for the edge type that draws it.
        if (p.name === 'tubeRadius' && edges.type !== 'tube') continue;
        if (p.name === 'cubeSize' && edges.type !== 'cube') continue;
        out.push(fromOptional(p, 'edgesSettings.', 'edges', false));
    }
    out.push(...materialSpecs(edges.materialSettings, 'edgesSettings.materialSettings.', 'edges'));
    return out;
}

/** Geometry shape / display mode controls → structural specs. */
function controlSpecs(controls: ControlOf<string>[] | undefined, prefix: string, group: string): PropertySpec[] {
    return (controls ?? []).map(c => {
        const spec: PropertySpec = {
            key: `${prefix}${c.key}`,
            name: c.key,
            label: c.label,
            kind: c.type === 'range' ? 'number' : c.type === 'toggle' ? 'boolean' : 'string',
            domain: 'config',
            group,
            animatable: false,
            default: c.default,
        };
        if (c.type === 'select') spec.options = c.options.map((value, i) => (c.optionLabels?.[i] ? { value, label: c.optionLabels[i] } : { value }));
        if (c.type === 'range') {
            spec.min = c.min;
            spec.max = c.max;
            spec.step = c.step;
            if (c.unit) spec.unit = c.unit;
        }
        return spec;
    });
}

type Family = {
    domain: PropertyDomain;
    list: OptionalProperty[];
    /** Animatable knob → label, or null when the family has no per-frame knobs. */
    animatable: Map<string, string> | null;
    /** Where the knobs live on the settings. 'config.' for every object family; ''
     *  for the sky, whose six knobs sit at the root of SkySettings. */
    prefix?: string;
};

/** Environment families animate by the environment rule (numbers and colours unless the schema opts out). */
const envFamily = (domain: PropertyDomain, list: OptionalProperty[], prefix: string): Family => ({
    domain,
    list,
    prefix,
    animatable: new Map(list.filter(envAnimatable).map(p => [p.name, p.label ?? propertyLabel(p.name)])),
});

const tableOf = (rows: Array<{ value: string; label: string }> | undefined) =>
    new Map((rows ?? []).map(r => [r.value, r.label]));

/** The config family of an object: by object type, else by config.type (as getAnimatableProperties does). */
function familyOf(obj: any): Family | null {
    const t: string | undefined = obj?.config?.type;
    const type: string | undefined = obj?.type;
    const light = () => ({ domain: 'light' as const, list: (LIGHT_PROPERTIES as Record<string, LightProperty[]>)[t!] ?? [], animatable: tableOf((LIGHTS_ANIMATABLE as Record<string, any>)[t!]) });
    const particles = () => ({ domain: 'particles' as const, list: (PARTICLES_PROPERTIES as Record<string, OptionalProperty[]>)[t!] ?? [], animatable: tableOf((GENERATIVE_PARTICLES_ANIMATABLE as Record<string, any>)[t!]) });
    const effect = () => ({ domain: 'effect' as const, list: (EFFECT_PROPERTIES as Record<string, OptionalProperty[]>)[t!] ?? [], animatable: tableOf((EFFECTS_ANIMATABLE as Record<string, any>)[t!]) });
    const grid = () => ({ domain: 'grid' as const, list: GRID_PROPERTIES[t!] ?? [], animatable: tableOf(GRIDS_ANIMATABLE[t!]) });
    const environment = () => ({ domain: 'environment' as const, list: (ENVIRONMENT_PROPERTIES as Record<string, OptionalProperty[]>)[t!] ?? [], animatable: tableOf((ENVIRONMENT_OBJECTS_ANIMATABLE as Record<string, any>)[t!]) });
    const space = () => ({ domain: 'space' as const, list: (SPACE_PROPERTIES as Record<string, OptionalProperty[]>)[t!] ?? [], animatable: tableOf((SPACE_OBJECTS_ANIMATABLE as Record<string, any>)[t!]) });
    const land = () => ({ domain: 'land' as const, list: (LAND_PROPERTIES as Record<string, OptionalProperty[]>)[t!] ?? [], animatable: tableOf((LAND_OBJECTS_ANIMATABLE as Record<string, any>)[t!]) });
    const text = () => ({ domain: 'text' as const, list: (TEXT_PROPERTIES as Record<string, OptionalProperty[]>)[t!] ?? [], animatable: tableOf((TEXT_OBJECTS_ANIMATABLE as Record<string, any>)[t!]) });

    // Environment elements seen through the object view, so the Animation and
    // MouseMove panels (getAnimatableProperties) work on them like on any object.
    // The sky is flat — no config block — so it is keyed before the config.type gate.
    if (type === 'sky') return envFamily('sky', skyOptionalProperties, '');
    if (type === 'ocean' && obj?.config) return envFamily('ocean', oceanSurfaceOptionalProperties(obj.config.waterType, obj.config.host), 'config.');
    if (type === 'terrain' && obj?.config) return envFamily('terrain', terrainOptionalProperties(obj.config.terrainType), 'config.');

    if (t) {
        if (type === 'light') return light();
        if (type === 'particles') return particles();
        if (type === 'effect') return effect();
        if (type === 'grid') return grid();
        // Before the rain branch: the rain *object* is a family member; the branch below is the scene-level rain element.
        if (type === 'environment' && (ENVIRONMENT_OBJECTS_ANIMATABLE as Record<string, unknown>)[t]) return environment();
        // Space objects only under their own object type: their keys ('stars', 'earth'…) are too generic to match by config.type alone.
        if (type === 'space' && (SPACE_OBJECTS_ANIMATABLE as Record<string, unknown>)[t]) return space();
        // Land objects only under their own object type: their keys are landform names ('hills'…).
        if (type === 'land' && (LAND_OBJECTS_ANIMATABLE as Record<string, unknown>)[t]) return land();
        // Text looks only under the text object type (plain, handwriting, …).
        if (type === 'text' && (TEXT_OBJECTS_ANIMATABLE as Record<string, unknown>)[t]) return text();
        if (t === 'rain') return { domain: 'rain', list: rainOptionalProperties, animatable: new Map(RAIN_ANIMATABLE_KEYS.map(k => [k, propertyLabel(k)])) };
        if (t === 'clouds') return { domain: 'clouds', list: cloudsOptionalProperties, animatable: new Map(CLOUD_ANIMATABLE_PROPERTIES.map(k => [k, propertyLabel(k)])) };
        // Older objects carry a generative config under another object type.
        if ((LIGHTS_ANIMATABLE as Record<string, unknown>)[t]) return light();
        if ((EFFECTS_ANIMATABLE as Record<string, unknown>)[t]) return effect();
        if (GRIDS_ANIMATABLE[t]) return grid();
        if ((GENERATIVE_PARTICLES_ANIMATABLE as Record<string, unknown>)[t]) return particles();
    }
    if (type === 'plain') return { domain: 'config', list: plainOptionalProperties, animatable: null };
    if (type === 'path') return { domain: 'config', list: pathOptionalProperties, animatable: null };
    return null;
}

function configSpecs(obj: any): PropertySpec[] {
    // Created shapes: the shape's own knobs (by config.type) and its display mode's.
    if (obj?.type === 'mesh' && obj.config?.type && (SHAPE_CONTROLS as Record<string, unknown>)[obj.config.type]) {
        return [
            ...controlSpecs((SHAPE_CONTROLS as Record<string, ControlOf<string>[]>)[obj.config.type], 'config.', 'shape'),
            ...controlSpecs((MODE_CONTROLS as Record<string, ControlOf<string>[]>)[obj.modeConfig?.mode ?? 'solid'], 'modeConfig.', 'mode'),
        ];
    }
    const family = familyOf(obj);
    if (!family) return [];
    const { domain, list, animatable, prefix = 'config.' } = family;
    const out: PropertySpec[] = [];
    const seen = new Set<string>();
    for (const p of list) {
        const spec = fromOptional(p, prefix, domain, !!animatable?.has(p.name));
        out.push(spec);
        seen.add(p.name);
    }
    // Knobs the renderer drives per frame that the panel does not list.
    for (const [name, label] of animatable ?? []) {
        if (seen.has(name)) continue;
        const kind = kindOfValue(name, obj?.config?.[name]) ?? 'number';
        out.push({ key: `${prefix}${name}`, name, label: label || propertyLabel(name), kind, domain, animatable: true });
    }
    // Text's draw / erase trigger (config.shown: on plays the draw animation, off the erase).
    // Its controller shows it as the Shown button; the per-look tables don't list it.
    if (domain === 'text' && !seen.has('shown')) {
        out.push({
            key: `${prefix}shown`, name: 'shown', label: 'Shown',
            description: 'The draw / erase trigger: switching it on plays the draw animation, off plays the erase animation (the text then stays hidden)',
            kind: 'boolean', domain, animatable: false, default: true,
        });
    }
    if (domain === 'light') {
        for (const p of (SHADOW_PROPERTIES as Record<string, OptionalProperty[]>)[obj.config.type] ?? []) {
            out.push({ ...fromOptional(p, 'config.shadow.', 'shadow', false), group: 'shadow' });
        }
    }
    return out;
}

function objectSpecs(obj: CreatedObjectSettings | any): PropertySpec[] {
    if (!obj) return [];
    const ownsMaterial = !selfManagesMaterial(obj);
    return [
        ...TRANSFORM_SPECS,
        ...(ownsMaterial ? materialSpecs(obj.materialSettings, 'materialSettings.', 'material') : []),
        ...edgesSpecs(obj),
        ...configSpecs(obj),
    ];
}

// =============================================================================
// Environment providers
// =============================================================================

function environmentSpecs(element: Exclude<PropertyElement, 'object' | 'camera'>, settings: any): PropertySpec[] {
    switch (element) {
        case 'sky':
            return [
                ...envSpecs(skyOptionalProperties, '', 'sky'),
                ...envSpecs(skyStarsOptionalProperties, 'stars.', 'stars'),
            ];
        case 'clouds':
            return [
                ...envSpecs(cloudDeckOptionalProperties(settings?.config?.deckType), 'config.', 'clouds'),
                ...envSpecs(cirrusOptionalProperties, 'cirrus.', 'cirrus'),
                ...envSpecs(thunderOptionalProperties, 'thunder.', 'thunder'),
            ];
        case 'ocean':
            return envSpecs(oceanSurfaceOptionalProperties(settings?.config?.waterType, settings?.config?.host), 'config.', 'ocean');
        case 'terrain':
            return envSpecs(terrainOptionalProperties(settings?.config?.terrainType), 'config.', 'terrain');
        default:
            return [];
    }
}

// =============================================================================
// API
// =============================================================================

/** Every property that applies to this element (structural and animatable). */
export function getPropertySpecs(element: PropertyElement, settings: any): PropertySpec[] {
    if (element === 'object') return objectSpecs(settings);
    if (element === 'camera') return CAMERA_SPECS.map(s => ({ ...s }));
    return environmentSpecs(element, settings);
}

/**
 * The property's layer is on: a hidden layer's knobs change nothing, so nothing
 * offers them for animation (edges switched off, cloud deck / cirrus disabled).
 */
export function isPropertyLive(element: PropertyElement, spec: PropertySpec, settings: any): boolean {
    if (spec.domain === 'edges') return settings?.edgesSettings?.enabled !== false;
    if (element === 'clouds') {
        if (spec.domain === 'cirrus') return !!settings?.cirrus?.enabled;
        // Lightning needs cloud to strike in: the deck, and the thunder block itself.
        if (spec.domain === 'thunder') return !!settings?.config?.enabled && (spec.name === 'enabled' || !!settings?.thunder?.enabled);
        return !!settings?.config?.enabled;
    }
    if (spec.domain === 'stars') return settings?.stars?.visible !== false;
    return true;
}

/** Properties that can be driven per frame on this element right now. */
export function getAnimatableSpecs(element: PropertyElement, settings: any): PropertySpec[] {
    return getPropertySpecs(element, settings).filter(s => s.animatable && isPropertyLive(element, s, settings));
}

/**
 * Object config families the animation timeline keys. The V2 applier drives
 * `config.*` through the object's live config handle, which these seven register;
 * rain and the legacy cloud object have per-frame knobs for the keyframe /
 * mouse-move systems only.
 */
export const TRACK_CONFIG_DOMAINS: ReadonlySet<PropertyDomain> = new Set<PropertyDomain>(['light', 'particles', 'effect', 'grid', 'environment', 'space', 'land', 'text']);

/** What an animation clip can key on this element (timeline track picker, AI clips). */
export function getTrackSpecs(element: PropertyElement, settings: any): PropertySpec[] {
    const specs = getAnimatableSpecs(element, settings);
    if (element !== 'object') return specs;
    return specs.filter(s => s.domain === 'transform' || s.domain === 'material' || s.domain === 'edges' || TRACK_CONFIG_DOMAINS.has(s.domain));
}

/**
 * Text settings that configure HOW it draws / erases / replays — read only when a draw or
 * erase starts, so keying them changes nothing you'd see. The timeline drives text with
 * Shown (config.enabled) instead; these stay panel settings.
 */
const TEXT_LIFECYCLE = new Set([
    'drawMethod', 'drawDuration', 'drawEase', 'drawStagger', 'drawAngle',
    'eraseMethod', 'eraseDuration', 'eraseEase', 'eraseStagger', 'eraseAngle',
    'autoPlay', 'loop', 'yoyo', 'holdTime', 'hiddenTime',
]);

/** Kinds a structural (discrete) track can hold: a key value the timeline can edit. */
const DISCRETE_KINDS: ReadonlySet<PropertyKind> = new Set<PropertyKind>(['number', 'boolean', 'string', 'select', 'color', 'vec3', 'vec2']);

/**
 * Structural properties a clip can key as DISCRETE tracks (timeline): not writable per
 * frame, so the clip sets them at its keys — the runtime lays the values at the playhead
 * over the element's settings through the SceneActions patch layer, like an action, and
 * the element re-renders. Every domain qualifies (it goes through the settings path, not
 * a live handle); textures don't (no key editor for them). Not filtered by
 * isPropertyLive: the switch that turns a layer on is itself one of these.
 */
export function getDiscreteTrackSpecs(element: PropertyElement, settings: any): PropertySpec[] {
    return getPropertySpecs(element, settings).filter(s =>
        !s.animatable && DISCRETE_KINDS.has(s.kind) && !(s.domain === 'text' && TEXT_LIFECYCLE.has(s.name)));
}

export function getPropertySpec(element: PropertyElement, settings: any, key: string): PropertySpec | undefined {
    return getPropertySpecs(element, settings).find(s => s.key === key);
}

/** Specs with the element's current values. */
export function describeProperties(element: PropertyElement, settings: any): DescribedProperty[] {
    return getPropertySpecs(element, settings).map(s => ({ ...s, value: getSettingAtPath(settings, s.key) }));
}

/** The registry element for an animation / timeline state: env keys and camera as-is, anything else is an object id. */
export const elementOfState = (state: string): PropertyElement =>
    state === 'camera' || state === 'sky' || state === 'clouds' || state === 'ocean' || state === 'terrain' ? state : 'object';
