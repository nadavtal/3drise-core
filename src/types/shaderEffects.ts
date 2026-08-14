import type { ShaderEffect } from "../shaders/effects/types";
export type { ShaderEffect, EffectScope, EffectValue, ShaderEffectsConfig } from '../shaders/effects/types';

export type Use3driseShaderEffects = ShaderEffect[];

type ShaderEffectBase = {
    enabled: boolean;
    intensity: number;
    speed: number;
};

export type WaveEffect = ShaderEffectBase & {
    effectType: 'wave';
    direction: 'horizontal' | 'vertical' | 'diagonal';
    frequency: number;
};

export type VortexEffect = ShaderEffectBase & {
    effectType: 'vortex';
    centerX?: number;
    centerY?: number;
};

export type RippleEffect = ShaderEffectBase & {
    effectType: 'ripple';
    frequency: number;
    centerX?: number;
    centerY?: number;
};

export type ScaleEffect = ShaderEffectBase & {
    effectType: 'scale';
    minScale: number;
    maxScale: number;
};

export type VertexEffect = WaveEffect | VortexEffect | RippleEffect | ScaleEffect;

export type GrayscaleEffect = ShaderEffectBase & {
    effectType: 'grayscale';
    mode: 'static' | 'wave' | 'pulse' | 'ripple';
    contrast: number;
    brightness: number;
    direction: 'horizontal' | 'vertical' | 'diagonal';
    pulseSpeed: number;
    rippleSpeed: number;
    centerX: number;
    centerY: number;
    waveFrequency: number;
    waveSpeed: number;
};

export type GlowEffect = ShaderEffectBase & {
    effectType: 'glow';
    color: string;
};

export type ColorShiftEffect = ShaderEffectBase & {
    effectType: 'colorShift';
    targetColor: string;
};

export type FragmentEffect = GrayscaleEffect | GlowEffect | ColorShiftEffect;

export type GeneralEffect = {
    vertex?: VertexEffect;
    fragment?: FragmentEffect;
};

export type PointerEffect = GeneralEffect & {
    radius: number;
};


export {};
