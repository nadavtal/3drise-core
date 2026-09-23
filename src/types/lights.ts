import type { Vector3Array } from "./common";
import { AnimationOptions, MouseMoveInteraction } from ".";
export type LightType = 'ambient' | 'directional' | 'point' | 'spot' | 'lightBulb' | 'spotBeam' | 'ledArray' | 'fluorescentTube';

export type BaseLightConfig = {
    enabled: boolean;
    name: string;
    type: LightType;
    position?: Vector3Array;
    color: string;
    intensity: number;
    castShadow?: boolean;
    shadow?: ShadowSettings;
    animations?: AnimationOptions[];
    mouseMove?: MouseMoveInteraction;
};

export type SpotLightConfig = BaseLightConfig & {
    angle: number;
    penumbra: number;
    decay: number;
    distance: number;
    enabled: boolean;
    targetPosition?: Vector3Array;
    shadow?: SpotShadowSettings;
};

export type PointLightConfig = BaseLightConfig & {
    distance: number;
    decay: number;
    shadow?: PointShadowSettings;
};

export type LightBulbShape = 'classic' | 'globe' | 'edison' | 'tube';
export type LightBulbGlass = 'clear' | 'frosted' | 'tinted';
export type LightBulbColorMode = 'temperature' | 'color';
/**
 * A point light that is also a visible bulb: glass, filament, screw base and a
 * self-drawn glow. The object origin is the filament centre, where the light sits.
 */
export type LightBulbConfig = Omit<PointLightConfig, 'type'> & {
    type: 'lightBulb';
    /** Glass silhouette + matching filament. Default 'classic'. */
    shape?: LightBulbShape;
    /** Default 'clear'. */
    glass?: LightBulbGlass;
    /** Glass colour when glass is 'tinted'. Default '#ffb070'. */
    glassTint?: string;
    /** 'temperature' drives the light colour from `temperature`; 'color' uses `color`. Default 'temperature'. */
    colorMode?: LightBulbColorMode;
    /** Colour temperature in Kelvin, 1000–10000. Default 2700 (warm incandescent). */
    temperature?: number;
    /** Power switch. Toggling runs the warm-up / cool-down. Default true. */
    on?: boolean;
    /** Seconds for the filament to heat up; cooling takes ~2.5x longer. 0 = instant. Default 0.25. */
    warmup?: number;
    /** Flicker amount 0–1. Default 0. */
    flicker?: number;
    /** Strength of the camera-facing halo, 0–2. Default 1. */
    halo?: number;
};
export type BeamPattern = 'round' | 'slot' | 'bars' | 'blinds' | 'window' | 'leaves';
export type BeamMode = 'none' | 'soft' | 'layered' | 'volumetric';
export type SpotBeamEmitter = 'none' | 'dot' | 'lens';
export type SpotBeamColorMode = 'temperature' | 'color';
/**
 * A spot light you can see: a procedural gobo shapes the pool on the floor and
 * the haze in the air, so both carry the same pattern. The visible geometry is
 * only a small emitter (and can be switched off) — the object is meant to be
 * dropped inside whatever fixture the scene already has. The object origin is
 * the light; it aims at `targetPosition` in world space.
 */
export type SpotBeamConfig = Omit<SpotLightConfig, 'type'> & {
    type: 'spotBeam';
    /** Gobo shaping the pool and the beam. Default 'round'. */
    pattern?: BeamPattern;
    /** Edge softness of the pattern, 0–1. Default 0.25. */
    patternSoftness?: number;
    /** Pattern rotation in radians. Default 0. */
    patternRotation?: number;
    /** How the beam in the air is drawn. 'volumetric' raymarches the gobo and costs the most. Default 'soft'. */
    beamMode?: BeamMode;
    /** Beam brightness, 0–3. 0 hides it. Default 1. */
    beam?: number;
    /** Beam length as a fraction of the throw to the target, 0–1. Default 1. */
    beamLength?: number;
    /** Haze breakup in the beam, 0–1. Default 0.35. */
    beamNoise?: number;
    /** Raymarch steps for the 'volumetric' mode, 8–48. Default 24. */
    beamSteps?: number;
    /** Visible source at the origin. Default 'lens'. */
    emitter?: SpotBeamEmitter;
    /** 'temperature' drives the light colour from `temperature`; 'color' uses `color`. Default 'temperature'. */
    colorMode?: SpotBeamColorMode;
    /** Colour temperature in Kelvin, 1000–10000. Default 3600. */
    temperature?: number;
    /** Power switch. Toggling runs the warm-up / cool-down. Default true. */
    on?: boolean;
    /** Seconds for the lamp to come up to full. 0 = instant. Default 0.25. */
    warmup?: number;
    /** Flicker amount 0–1. Default 0. */
    flicker?: number;
    /** Strength of the camera-facing halo at the source, 0–2. Default 1. */
    halo?: number;
};
export type LedLayout = 'single' | 'strip' | 'panel' | 'ring';
export type LedColorMode = 'temperature' | 'color' | 'rgb';
/**
 * A point light drawn as the array of dies that makes it. Instant on, with the
 * PWM ripple of a dimmed LED, a diffuser that softens the shadow as it fades the
 * dies into one sheet, and an RGB mode where the hue runs across the array.
 * The object origin is the light, in the plane of the dies.
 */
export type LedArrayConfig = Omit<PointLightConfig, 'type'> & {
    type: 'ledArray';
    /** How the dies are arranged. Default 'panel'. */
    layout?: LedLayout;
    /** Dies along the main axis, 1–64. Default 8. */
    count?: number;
    /** Rows, 1–12; only a panel uses more than one. Default 4. */
    rows?: number;
    /** Distance between dies. Default 0.06. */
    spacing?: number;
    /** Size of one die. Default 0.022. */
    dieSize?: number;
    /** 'none' hides the dies and leaves only the light. Default 'dies'. */
    emitter?: 'dies' | 'none';
    /** 'rgb' runs a hue across the array; the light takes their mean. Default 'temperature'. */
    colorMode?: LedColorMode;
    /** Colour temperature in Kelvin, 2200–6500. Default 5000. */
    temperature?: number;
    /** Turns of hue across the array in 'rgb' mode, 0–2. Default 1. */
    rgbSpread?: number;
    /** How fast the hue chases along the array, -2–2. Default 0.2. */
    rgbSpeed?: number;
    /** Sheet over the dies, 0–1. Also widens the light's shadow radius. Default 0. */
    diffuser?: number;
    /** Depth of the PWM chop a dimmed LED runs on, 0–1. Default 0. */
    pwm?: number;
    /** Power switch. Default true. */
    on?: boolean;
    /** Seconds to fade up. An LED has no thermal lag, so the default is 0 — instant. */
    warmup?: number;
    /** Flicker amount 0–1. Default 0. */
    flicker?: number;
    /** Strength of the glow around the array, 0–2. Default 1. */
    halo?: number;
};

export type FluorescentStartup = 'instant' | 'stutter';
/**
 * A bank of fluorescent tubes lit by a THREE.RectAreaLight, so the light is as
 * long and as soft as the tubes are. A rect-area light cannot cast a shadow, so
 * `shadowStrength` of the output comes from a point light at the middle of the
 * fixture, which is the part that casts; 0 gives a pure area light.
 *
 * A rect-area light only lights MeshStandardMaterial and MeshPhysicalMaterial.
 */
export type FluorescentTubeConfig = Omit<BaseLightConfig, 'type'> & {
    type: 'fluorescentTube';
    /** Tubes in the fixture, 1–4. Default 1. */
    tubes?: number;
    /** Distance between tubes. Default 0.14. */
    tubeSpacing?: number;
    /** Tube length. Default 1.2. */
    length?: number;
    /** Tube diameter. Default 0.026. */
    diameter?: number;
    /** 'none' hides the tubes and leaves only the light. Default 'tubes'. */
    emitter?: 'tubes' | 'none';
    /** 'temperature' drives the light colour from `temperature`; 'color' uses `color`. Default 'temperature'. */
    colorMode?: 'temperature' | 'color';
    /** Colour temperature in Kelvin, 2700–6500. Default 4000. */
    temperature?: number;
    /** The phosphor's green spike, 0–1. Default 0.35. */
    greenShift?: number;
    /** 'stutter' strikes the arc with false starts first. Default 'stutter'. */
    startup?: FluorescentStartup;
    /** Seconds for the mercury vapour to reach full output. Default 1.2. */
    warmup?: number;
    /** Depth of the ballast's 100 Hz ripple, 0–1. Default 0.3. */
    hum?: number;
    /** Wear, 0–1: dimmer, blackened ends, a longer strike and more flicker. Default 0.15. */
    age?: number;
    /** Share of the output carried by the shadow-casting point at the fixture's centre, 0–1. Default 0.4. */
    shadowStrength?: number;
    /** Power switch. Default true. */
    on?: boolean;
    /** Falloff of the shadow-casting point source. Default 1 / 0. */
    decay?: number;
    distance?: number;
    /** Flicker amount 0–1, on top of whatever `age` adds. Default 0. */
    flicker?: number;
    /** Strength of the wash around the fixture, 0–2. Default 1. */
    halo?: number;
    shadow?: PointShadowSettings;
};
export type LightObjectConfig = BaseLightConfig | SpotLightConfig | PointLightConfig | LightBulbConfig | SpotBeamConfig | LedArrayConfig | FluorescentTubeConfig;

export type ShadowSettings = {
    enabled?: boolean;
    mapSize?: number;
    bias?: number;
    normalBias?: number;
    radius?: number;
    intensity?: number;
    cameraNear?: number;
    cameraFar?: number;
};

export type DirectionalShadowSettings = ShadowSettings & {
    cameraLeft?: number;
    cameraRight?: number;
    cameraTop?: number;
    cameraBottom?: number;
};

export type SpotShadowSettings = ShadowSettings & {
    cameraFov?: number;
    focus?: number;
};

export type PointShadowSettings = ShadowSettings;

export interface SceneLightConfig {
    id?: string;
    name: string;
    isDirty?: boolean;
    enabled: boolean;
    ambient: {
        enabled: boolean;
        color: string;
        intensity: number;
        animations?: AnimationOptions[];
        mouseMove?: MouseMoveInteraction;
    };
    sun?: {
        enabled: boolean;
        elevation?: number;
        azimuth?: number;
        intensity?: number;
        color?: string;
        shadow?: DirectionalShadowSettings;
        animations?: AnimationOptions[];
        mouseMove?: MouseMoveInteraction;
    };
    enableShadows?: boolean;
    showHelpers?: boolean;
    followSun?: boolean;
}


export {};
