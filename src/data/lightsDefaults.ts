// =============================================================================
// lightsDefaults — defaults, labels and animatable knobs per light type
// =============================================================================
//
// One table per light type (`config.type` of a createdObject of type 'light'),
// the light family's counterpart of particlesDefaults.
//
// LIGHTS_ANIMATABLE lists the knobs a light's own applyLightConfig pushes onto
// the THREE light (or into its visuals) every frame. A knob that needs a rebuild
// — a bulb's shape or glass, a shadow map size — is never listed, so the
// animations panel can only offer what the renderer can actually drive.
//
import type { LightType } from '../types/lights';

export const LIGHT_LABELS: Record<LightType, string> = {
    ambient: 'Ambient Light',
    directional: 'Directional Light',
    point: 'Point Light',
    spot: 'Spot Light',
    lightBulb: 'Light Bulb',
    spotBeam: 'Spot Beam',
    ledArray: 'LED Array',
    fluorescentTube: 'Fluorescent Tube',
    candle: 'Candle',
};

/** Config defaults per light type — what the renderer falls back to, and what Reset restores. */
export const DEFAULT_LIGHTS: Record<LightType, Record<string, unknown>> = {
    ambient: { type: 'ambient', enabled: true, intensity: 1, color: '#ffffff' },
    directional: { type: 'directional', enabled: true, intensity: 1, color: '#ffffff' },
    point: { type: 'point', enabled: true, intensity: 1, color: '#ffffff', distance: 0, decay: 1 },
    spot: {
        type: 'spot', enabled: true, intensity: 1, color: '#ffffff', distance: 0, decay: 1,
        angle: Math.PI / 4, penumbra: 0.1, targetPosition: [0, 0, 0],
    },
    lightBulb: {
        type: 'lightBulb', enabled: true, intensity: 1, color: '#ffffff', distance: 0, decay: 1,
        on: true, colorMode: 'temperature', temperature: 2700,
        shape: 'classic', glass: 'clear', glassTint: '#ffb070',
        warmup: 0.25, flicker: 0, halo: 1,
    },
    spotBeam: {
        type: 'spotBeam', enabled: true, intensity: 1, color: '#ffffff', distance: 0, decay: 1,
        angle: Math.PI / 6, penumbra: 0.3, targetPosition: [0, 0, 0],
        on: true, colorMode: 'temperature', temperature: 3600,
        pattern: 'round', patternSoftness: 0.25, patternRotation: 0,
        beamMode: 'soft', beam: 1, beamLength: 1, beamNoise: 0.35, beamSteps: 28,
        emitter: 'lens', warmup: 0.3, flicker: 0, halo: 1,
    },
    ledArray: {
        type: 'ledArray', enabled: true, intensity: 1, color: '#ffffff', distance: 0, decay: 1,
        on: true, colorMode: 'temperature', temperature: 5000,
        layout: 'panel', count: 8, rows: 4, spacing: 0.06, dieSize: 0.022, emitter: 'dies',
        diffuser: 0, pwm: 0, rgbSpread: 1, rgbSpeed: 0.2,
        warmup: 0, flicker: 0, halo: 1,
    },
    fluorescentTube: {
        type: 'fluorescentTube', enabled: true, intensity: 1, color: '#ffffff', distance: 0, decay: 1,
        on: true, colorMode: 'temperature', temperature: 4000,
        tubes: 1, tubeSpacing: 0.14, length: 1.2, diameter: 0.026, emitter: 'tubes',
        greenShift: 0.35, startup: 'stutter', warmup: 1.2, hum: 0.3, age: 0.15,
        shadowStrength: 0.4, flicker: 0, halo: 1,
    },
    candle: {
        type: 'candle', enabled: true, intensity: 1, color: '#ffb46b', distance: 0, decay: 2,
        on: true, colorMode: 'temperature', temperature: 1850,
        flameMode: 'volumetric', flameHeight: 0.055, flameWidth: 1,
        flicker: 0.5, movement: 1, flickerHz: 11, draught: 0.08,
        blue: 0.7, blueBasePercentage: 16, soot: 0.25, flameSteps: 24, flameGain: 5, flameWhite: 3.5,
        ignite: 1.6, smoke: true, halo: 1,
        body: 'pillar', waxColor: '#f3e7d2', height: 0.14, radius: 0.028,
        melt: 0.45, waxGlow: 0.3,
    },
};

export interface AnimatableLightProperty {
    value: string;
    label: string;
}

const COMMON: AnimatableLightProperty[] = [
    { value: 'intensity', label: 'Intensity' },
    { value: 'color', label: 'Color' },
];
const FALLOFF: AnimatableLightProperty[] = [
    { value: 'distance', label: 'Distance' },
    { value: 'decay', label: 'Decay' },
];

export const LIGHTS_ANIMATABLE: Record<LightType, AnimatableLightProperty[]> = {
    ambient: [...COMMON],
    directional: [...COMMON],
    point: [...COMMON, ...FALLOFF],
    spot: [
        ...COMMON, ...FALLOFF,
        { value: 'angle', label: 'Angle' },
        { value: 'penumbra', label: 'Penumbra' },
    ],
    // `color` drives the light only in 'color' mode, `temperature` only in
    // 'temperature' mode; both are offered and the renderer applies the one its
    // colorMode selects. on / shape / glass / colorMode rebuild, so they are out.
    lightBulb: [
        ...COMMON, ...FALLOFF,
        { value: 'temperature', label: 'Temperature' },
        { value: 'flicker', label: 'Flicker' },
        { value: 'halo', label: 'Halo' },
        { value: 'warmup', label: 'Warm-up' },
    ],
    // pattern / patternSoftness / patternRotation redraw the gobo and beamMode /
    // emitter rebuild geometry, so they stay out; beamSteps is a quality knob.
    spotBeam: [
        ...COMMON, ...FALLOFF,
        { value: 'angle', label: 'Angle' },
        { value: 'penumbra', label: 'Penumbra' },
        { value: 'temperature', label: 'Temperature' },
        { value: 'beam', label: 'Beam' },
        { value: 'beamLength', label: 'Beam Length' },
        { value: 'beamNoise', label: 'Beam Noise' },
        { value: 'flicker', label: 'Flicker' },
        { value: 'halo', label: 'Halo' },
        { value: 'warmup', label: 'Warm-up' },
    ],
    // layout / count / rows / spacing / dieSize rebuild the array and colorMode
    // switches how the colour is read, so they stay out.
    ledArray: [
        ...COMMON, ...FALLOFF,
        { value: 'temperature', label: 'Temperature' },
        { value: 'diffuser', label: 'Diffuser' },
        { value: 'pwm', label: 'PWM' },
        { value: 'rgbSpread', label: 'RGB Spread' },
        { value: 'rgbSpeed', label: 'RGB Speed' },
        { value: 'flicker', label: 'Flicker' },
        { value: 'halo', label: 'Halo' },
        { value: 'warmup', label: 'Warm-up' },
    ],
    // The tube geometry (tubes / spacing / length / diameter) and the startup mode
    // rebuild; everything the ballast does every frame is drivable.
    fluorescentTube: [
        ...COMMON,
        { value: 'temperature', label: 'Temperature' },
        { value: 'greenShift', label: 'Green Spike' },
        { value: 'hum', label: 'Ballast Hum' },
        { value: 'age', label: 'Age' },
        { value: 'shadowStrength', label: 'Shadow Core' },
        { value: 'flicker', label: 'Flicker' },
        { value: 'halo', label: 'Halo' },
        { value: 'warmup', label: 'Warm-up' },
    ],
    // The wax, the flame's size and the flame mode all rebuild; everything the
    // flame does per frame is drivable, including the air moving past it.
    candle: [
        ...COMMON, ...FALLOFF,
        { value: 'temperature', label: 'Temperature' },
        { value: 'flicker', label: 'Flicker' },
        { value: 'movement', label: 'Movement' },
        { value: 'flickerHz', label: 'Flicker Rate' },
        { value: 'draught', label: 'Draught' },
        { value: 'blue', label: 'Blue Base' },
        { value: 'blueBasePercentage', label: 'Blue Base Height' },
        { value: 'soot', label: 'Soot' },
        { value: 'halo', label: 'Halo' },
        { value: 'waxGlow', label: 'Wax Glow' },
        { value: 'ignite', label: 'Ignition' },
    ],
};

/** True when this config is a light config the tables above cover. */
export function isLightConfigType(config: { type?: string } | undefined | null): boolean {
    return !!config?.type && Object.prototype.hasOwnProperty.call(LIGHTS_ANIMATABLE, config.type);
}
