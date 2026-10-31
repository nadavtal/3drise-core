// =============================================================================
// Render / time property specs — the registry rows for the two keyed views
// =============================================================================
//
// Keys are paths on RenderView / TimeView (./renderView). `animatable: true` means
// the viewer has a per-frame applier for it (clip tracks ease it, data-set sliders
// drag it); everything else is structural — set through the settings path (env.set,
// an action, a clip's discrete track), which re-renders the part it belongs to.
//
import type { PropertySpec } from '../properties/types';
import { RENDER_EFFECT_DEFAULTS, TONE_MAPPING_TYPES, HDR_NAMES, SUN_SHADOW_MAP_SIZES } from './renderView';

const opts = (values: readonly string[]) => values.map(value => ({ value }));

type Row = Omit<PropertySpec, 'name' | 'label' | 'domain'> & { label?: string };
const spec = (domain: 'render' | 'time', r: Row): PropertySpec => {
    const name = r.key.split('.').pop()!;
    const group = r.key.includes('.') ? r.key.split('.')[0] : undefined;
    return { name, label: r.label ?? name, domain, ...(group ? { group } : {}), ...r };
};
const R = (r: Row) => spec('render', r);
const T = (r: Row) => spec('time', r);

const D = RENDER_EFFECT_DEFAULTS;

export const RENDER_SPECS: PropertySpec[] = [
    R({ key: 'enabled', label: 'Post-processing', kind: 'boolean', animatable: false, default: false, description: 'Post-processing on at all. The effects below and tone mapping only render while this is on.' }),
    R({ key: 'toneMapping', label: 'Tone mapping', kind: 'select', options: opts(TONE_MAPPING_TYPES), animatable: false, default: 'aces-filmic', description: 'Applied at the end of the post-processing chain (needs enabled).' }),
    R({ key: 'exposure', label: 'Exposure', kind: 'number', min: 0, max: 4, step: 0.01, animatable: true, default: 1, description: 'Tone-mapping exposure (needs a toneMapping other than none).' }),

    R({ key: 'ssao.enabled', label: 'Ambient occlusion', kind: 'boolean', animatable: false, default: false, description: 'Screen-space ambient occlusion: contact shading in corners and where objects meet.' }),
    R({ key: 'ssao.intensity', kind: 'number', min: 0, max: 5, step: 0.01, animatable: true, default: D.ssao.intensity }),
    R({ key: 'ssao.radius', kind: 'number', min: 0.005, max: 1, step: 0.005, animatable: true, default: D.ssao.radius, description: 'Sampling radius (screen-relative).' }),
    R({ key: 'ssao.bias', kind: 'number', min: 0, max: 0.1, step: 0.001, animatable: false, default: D.ssao.bias }),

    R({ key: 'bloom.enabled', label: 'Bloom', kind: 'boolean', animatable: false, default: false, description: 'Glow around bright pixels — lamps, emissive windows, the sun.' }),
    R({ key: 'bloom.intensity', kind: 'number', min: 0, max: 5, step: 0.01, animatable: true, default: D.bloom.intensity }),
    R({ key: 'bloom.threshold', kind: 'number', min: 0, max: 1, step: 0.01, animatable: true, default: D.bloom.threshold, description: 'Luminance above which pixels glow: lower = more glows.' }),
    R({ key: 'bloom.radius', kind: 'number', min: 0, max: 1, step: 0.01, animatable: false, default: D.bloom.radius }),

    R({ key: 'grading.enabled', label: 'Colour grading', kind: 'boolean', animatable: false, default: false }),
    R({ key: 'grading.brightness', kind: 'number', min: -1, max: 1, step: 0.01, animatable: true, default: D.grading.brightness }),
    R({ key: 'grading.contrast', kind: 'number', min: -1, max: 1, step: 0.01, animatable: true, default: D.grading.contrast }),
    R({ key: 'grading.saturation', kind: 'number', min: -1, max: 1, step: 0.01, animatable: true, default: D.grading.saturation }),
    R({ key: 'grading.hue', kind: 'number', min: -3.1416, max: 3.1416, step: 0.01, unit: 'rad', animatable: true, default: D.grading.hue, description: 'Hue rotation: small values warm (+) or cool (−) the image.' }),

    R({ key: 'dof.enabled', label: 'Depth of field', kind: 'boolean', animatable: false, default: false }),
    R({ key: 'dof.focusDistance', kind: 'number', min: 0, max: 500, step: 0.1, unit: 'm', animatable: true, default: D.dof.focusDistance, description: 'Distance from the camera that stays sharp.' }),
    R({ key: 'dof.bokehScale', kind: 'number', min: 0, max: 10, step: 0.1, animatable: true, default: D.dof.bokehScale, description: 'Blur size away from the focus.' }),

    R({ key: 'vignette.enabled', label: 'Vignette', kind: 'boolean', animatable: false, default: false }),
    R({ key: 'vignette.offset', kind: 'number', min: 0, max: 1, step: 0.01, animatable: true, default: D.vignette.offset }),
    R({ key: 'vignette.darkness', kind: 'number', min: 0, max: 1, step: 0.01, animatable: true, default: D.vignette.darkness }),

    R({ key: 'shadows.enabled', label: 'Sun shadows', kind: 'boolean', animatable: false, default: true, description: 'The sun / moon light casts shadows (Sky System).' }),
    R({ key: 'shadows.mapSize', label: 'Shadow map size', kind: 'select', options: opts(SUN_SHADOW_MAP_SIZES), animatable: false, default: '2048', description: 'Shadow resolution: sharper and more expensive as it grows.' }),

    R({ key: 'hdr.enabled', label: 'HDR', kind: 'boolean', animatable: false, default: false, description: 'Show the HDR environment (background and image lighting). Needs hdr.name.' }),
    R({ key: 'hdr.name', label: 'HDR', kind: 'select', options: opts(HDR_NAMES), animatable: false, description: 'One of the library HDRs. Setting it switches the HDR on.' }),
    R({ key: 'hdr.intensity', kind: 'number', min: 0, max: 5, step: 0.01, animatable: true, default: 1, description: 'How strongly the HDR lights the scene.' }),
    R({ key: 'hdr.rotation', kind: 'number', min: 0, max: 6.2832, step: 0.01, unit: 'rad', animatable: true, default: Math.PI / 2, description: 'Turns the HDR (lighting and background) around the vertical axis.' }),
    R({ key: 'hdr.backgroundIntensity', kind: 'number', min: 0, max: 5, step: 0.01, animatable: true, default: 1 }),
    R({ key: 'hdr.backgroundBlur', kind: 'number', min: 0, max: 1, step: 0.01, animatable: true, default: 0 }),
];

export const TIME_SPECS: PropertySpec[] = [
    T({ key: 'hour', label: 'Hour', kind: 'number', min: 0, max: 48, step: 0.01, unit: 'h', animatable: true, default: 12, description: 'Time of day 0–24: sun and moon position, sky colours, sunlight. Setting it switches the clock on. Values past 24 wrap, so clip keys 22 → 26 ease through midnight.' }),
    T({ key: 'intensity', label: 'Sun intensity', kind: 'number', min: 0, max: 5, step: 0.01, animatable: true, default: 1 }),
    T({ key: 'moonIntensity', label: 'Moon intensity', kind: 'number', min: 0, max: 5, step: 0.01, animatable: true, default: 1 }),
    T({ key: 'sunSize', label: 'Sun size', kind: 'number', min: 0, max: 10, step: 0.01, animatable: true, default: 1 }),
    T({ key: 'moonSize', label: 'Moon size', kind: 'number', min: 0, max: 10, step: 0.01, animatable: true, default: 1 }),
    T({ key: 'enabled', label: 'Clock on', kind: 'boolean', animatable: false, default: false, description: 'The clock drives the sun. Off = the sky’s own elevation / azimuth.' }),
    T({ key: 'animate', label: 'Clock runs', kind: 'boolean', animatable: false, default: false }),
    T({ key: 'speed', label: 'Clock speed', kind: 'number', min: 0, max: 3600, step: 1, animatable: false, default: 60, description: 'Scene seconds per real second while the clock runs.' }),
    T({ key: 'realTime', label: 'Real time', kind: 'boolean', animatable: false, default: false }),
    T({ key: 'moonPhase', label: 'Moon phase', kind: 'number', min: 0, max: 1, step: 0.01, animatable: false, default: 0.5, description: '0 new, 0.5 full.' }),
];
