import type { Vector3Array } from "./common";
import { AnimationOptions, MouseMoveInteraction } from ".";
export type LightType = 'ambient' | 'directional' | 'point' | 'spot' | 'lightBulb';

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
export type LightObjectConfig = BaseLightConfig | SpotLightConfig | PointLightConfig | LightBulbConfig;

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
