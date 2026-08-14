export type TransformEffectType = 'wave' | 'float' | 'pulse' | 'shake' | 'bounce' | 'rotate3d' | 'fade' | 'spin' | 'sway' | 'flip' | 'scale';

export type EffectTriggerMode = 'always' | 'hover' | 'click';

export interface WaveEffectOptions {
    amplitude?: number;
    frequency?: number;
}

export interface FloatEffectOptions {
    amplitudeX?: number;
    amplitudeY?: number;
    amplitudeZ?: number;
}

export interface PulseEffectOptions {
    minScale?: number;
    maxScale?: number;
}

export interface ShakeEffectOptions {
    amplitudeX?: number;
    amplitudeY?: number;
}

export interface BounceEffectOptions {
    bounceHeight?: number;
}

export interface Rotate3DEffectOptions {
    axisX?: boolean;
    axisY?: boolean;
    axisZ?: boolean;
}

export interface FadeEffectOptions {
    fadeMin?: number;
    fadeMax?: number;
}

export interface SpinEffectOptions {
    axis?: 'x' | 'y' | 'z';
}

export interface SwayEffectOptions {
    angle?: number;
    axis?: 'x' | 'y' | 'z';
}

export interface FlipEffectOptions {
    axis?: 'x' | 'y' | 'z';
}

export interface ScaleEffectOptions {
    targetScale?: number;
}

export type TransformEffectOptions = WaveEffectOptions | FloatEffectOptions | PulseEffectOptions | ShakeEffectOptions | BounceEffectOptions | Rotate3DEffectOptions | FadeEffectOptions | SpinEffectOptions | SwayEffectOptions | FlipEffectOptions | ScaleEffectOptions;

export interface TransformEffect {
    type: TransformEffectType;
    enabled: boolean;
    triggerMode?: EffectTriggerMode;
    intensity?: number;
    speed?: number;
    options?: TransformEffectOptions;
}

export type ColorEffectType = 'color-transition' | 'pulse-color' | 'gradient-color';

export interface ColorTransitionOptions {
    duration?: number;
}

export interface PulseColorOptions {
    frequency?: number;
}

export interface GradientColorOptions {
    colors?: string[];
    angle?: number;
}

export type ColorEffectOptions = ColorTransitionOptions | PulseColorOptions | GradientColorOptions;

export interface ColorEffect {
    type: ColorEffectType;
    enabled: boolean;
    triggerMode?: EffectTriggerMode;
    intensity?: number;
    speed?: number;
    targetColor: string;
    targetProperties?: string[];
    options?: ColorEffectOptions;
}

export interface EffectState {
    originalPosition: {
        x: number;
        y: number;
        z: number;
    };
    originalScale: {
        x: number;
        y: number;
        z: number;
    };
    originalRotation: {
        x: number;
        y: number;
        z: number;
    };
    originalOpacity: number;
    originalColors: Record<string, string>;
    time: number;
    isTriggered: boolean;
}

export type AnyEffectType = TransformEffectType | ColorEffectType;

export type AnyEffect = TransformEffect | ColorEffect;
export {};
