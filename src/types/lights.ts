import type { Vector3Array } from "./common";
import { AnimationOptions, MouseMoveInteraction } from ".";
export type LightType = 'ambient' | 'directional' | 'point' | 'spot';

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

export type LightObjectConfig = BaseLightConfig | SpotLightConfig | PointLightConfig;

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
