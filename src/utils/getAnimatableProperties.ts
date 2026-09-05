import type { MouseMoveInteraction, MouseMoveInteractions, ObjectAnimations } from "../types/objectSettings";
export type AnimatableDomain = 'transform' | 'material' | 'edges' | 'light' | 'clouds' | 'rain';

export interface AnimatableProperty {
    value: string;
    label: string;
}

export interface AnimatableTarget {
    id?: string;
    meshSettings?: Record<string, any>;
    materialSettings?: Record<string, any>;
    edgesSettings?: {
        type?: 'tube' | 'cube';
        materialSettings?: Record<string, any>;
    };
    config?: ({
        type?: string;
    } & Record<string, any>);
    animations?: ObjectAnimations;
    mouseMove?: MouseMoveInteractions | MouseMoveInteraction;
}


// =============================================================================
// getAnimatableProperties — canonical per-domain property discovery
// =============================================================================
//
// Single source of truth for "what properties can the animations / mouseMove
// system target on a given domain?". Both *PropsSection (keyframe animations UI)
// and *MouseMoveSection (mouse-move UI) read from here, so the two systems
// never drift.
//
// Accepts any AnimatableTarget — CreatedObjectSettings, CloudsSettings, and
// future env components (Sky/Ocean/...) all satisfy the structural interface.
//
// Domain rules:
//   - transform: hardcoded ['position', 'rotation', 'scale']
//   - material : keys of settings.materialSettings minus an excluded list
//   - edges    : geometry props by edgesSettings.type + filtered material keys
//   - light    : per-light-type allowlist driven by settings.config.type
//   - clouds   : ['speed'] when settings.config.type === 'clouds'
//
// =============================================================================
// CONSTANTS
// =============================================================================
const TRANSFORM_PROPS = [
    { value: 'position', label: 'Position' },
    { value: 'rotation', label: 'Rotation' },
    { value: 'scale', label: 'Scale' },
];
const EXCLUDED_MATERIAL_KEYS = new Set([
    'materialType', 'materialVariant', 'side',
    'u_time', 'u_mouse',
    'apply', 'visible', 'map', 'uHasTexture',
]);
const LIGHT_COMMON = [
    { value: 'intensity', label: 'Intensity' },
    { value: 'color', label: 'Color' },
];
const LIGHT_POINT_EXTRA = [
    { value: 'distance', label: 'Distance' },
    { value: 'decay', label: 'Decay' },
];
const LIGHT_SPOT_EXTRA = [
    ...LIGHT_POINT_EXTRA,
    { value: 'angle', label: 'Angle' },
    { value: 'penumbra', label: 'Penumbra' },
];
// Volumetric cloud deck properties. Only scalars that can be interpolated per
// frame without rebuilding the density field: altitudes and feature sizes are
// deliberately absent, because the vertical profile is measured as a fraction of
// base-to-top, so animating an altitude restretches the whole field and the deck
// appears to pump rather than move.
const CLOUDS_PROPS = [
    { value: 'coverage', label: 'Coverage' },
    { value: 'density', label: 'Density' },
    { value: 'profile', label: 'Vertical profile' },
    { value: 'detailStrength', label: 'Detail erosion' },
    { value: 'curlStrength', label: 'Curl warp' },
    { value: 'shear', label: 'Wind shear' },
    { value: 'anvil', label: 'Anvil spread' },
    { value: 'precipitation', label: 'Precipitation' },
    { value: 'windBearing', label: 'Wind bearing' },
    { value: 'windSpeed', label: 'Wind speed' },
    { value: 'rise', label: 'Convective rise' },
    { value: 'churn', label: 'Detail churn' },
    { value: 'evolution', label: 'Formation / decay' },
    { value: 'extinction', label: 'Extinction' },
    { value: 'powder', label: 'Powder' },
    { value: 'silverLining', label: 'Silver lining' },
    { value: 'ambient', label: 'Ambient' },
];
const RAIN_PROPS = [
    { value: 'color', label: 'Color' },
    { value: 'size', label: 'Size' },
    { value: 'opacity', label: 'Opacity' },
    { value: 'speed', label: 'Speed' },
    { value: 'windStrength', label: 'Wind Strength' },
    { value: 'windDirection', label: 'Wind Direction' },
    { value: 'turbulence', label: 'Turbulence' },
];
// =============================================================================
// HELPERS
// =============================================================================
/** camelCase / kebab-ish → "Title Case". */
export function toAnimatableLabel(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
}
function getMaterialProperties(materialSettings) {
    if (!materialSettings)
        return [];
    return Object.keys(materialSettings)
        .filter(k => !EXCLUDED_MATERIAL_KEYS.has(k))
        .map(k => ({ value: k, label: k }));
}
function getEdgesProperties(edgesSettings) {
    if (!edgesSettings)
        return [];
    const props = [];
    if (edgesSettings.type === 'tube')
        props.push({ value: 'tubeRadius', label: 'Tube Radius' });
    if (edgesSettings.type === 'cube')
        props.push({ value: 'cubeSize', label: 'Cube Size' });
    if (edgesSettings.materialSettings) {
        for (const k of Object.keys(edgesSettings.materialSettings)) {
            if (EXCLUDED_MATERIAL_KEYS.has(k))
                continue;
            props.push({ value: k, label: toAnimatableLabel(k) });
        }
    }
    return props;
}
function getLightProperties(config) {
    switch (config?.type) {
        case 'point':
            return [...LIGHT_COMMON, ...LIGHT_POINT_EXTRA];
        case 'spot':
            return [...LIGHT_COMMON, ...LIGHT_SPOT_EXTRA];
        case 'ambient':
        case 'directional':
        default:
            return [...LIGHT_COMMON];
    }
}
function getCloudsProperties() {
    return [...CLOUDS_PROPS];
}
function getRainProperties() {
    return [...RAIN_PROPS];
}
function isLightConfig(config) {
    const t = config?.type;
    return t === 'ambient' || t === 'directional' || t === 'point' || t === 'spot';
}
function isCloudsConfig(config) {
    return config?.type === 'clouds';
}
function isRainConfig(config) {
    return config?.type === 'rain';
}
// =============================================================================
// MAIN
// =============================================================================
export function getAnimatableProperties(settings: AnimatableTarget, domain: AnimatableDomain): AnimatableProperty[] {
    switch (domain) {
        case 'transform':
            return [...TRANSFORM_PROPS];
        case 'material':
            return getMaterialProperties(settings.materialSettings);
        case 'edges':
            return getEdgesProperties(settings.edgesSettings);
        case 'light':
            return isLightConfig(settings.config) ? getLightProperties(settings.config) : [];
        case 'clouds':
            return isCloudsConfig(settings.config) ? getCloudsProperties() : [];
        case 'rain':
            return isRainConfig(settings.config) ? getRainProperties() : [];
        default:
            return [];
    }
}
/**
 * Detect which domain a property name belongs to, for a given target. Used by
 * the runtime + UI to migrate flat MouseMove arrays into the new per-domain
 * shape, and to route the runtime's combined dispatch.
 */
export function detectAnimatableDomain(settings: AnimatableTarget, propertyName: string): AnimatableDomain | null {
    const head = propertyName.split('.')[0];
    if (head === 'position' || head === 'rotation' || head === 'scale') {
        return 'transform';
    }
    const edges = getEdgesProperties(settings.edgesSettings).map(p => p.value);
    if (edges.includes(propertyName))
        return 'edges';
    if (isLightConfig(settings.config)) {
        if (getLightProperties(settings.config).some(p => p.value === propertyName))
            return 'light';
    }
    if (isCloudsConfig(settings.config)) {
        if (getCloudsProperties().some(p => p.value === propertyName))
            return 'clouds';
    }
    if (isRainConfig(settings.config)) {
        if (getRainProperties().some(p => p.value === propertyName))
            return 'rain';
    }
    const material = getMaterialProperties(settings.materialSettings).map(p => p.value);
    if (material.includes(propertyName))
        return 'material';
    return null;
}
