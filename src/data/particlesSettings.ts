import type { Use3driseShaderEffects, WaveEffect, VortexEffect, RippleEffect, ScaleEffect, GrayscaleEffect, GlowEffect, ColorShiftEffect } from "../types/shaderEffects";
import type { ParticlesSettings } from "../types/particles";

export const defaultShape = 'square';
// ─── Per-effect defaults (used by UI when user picks a new effect type) ───────
export const defaultWaveEffect: WaveEffect = {
    effectType: 'wave',
    enabled: true,
    intensity: 0.3,
    speed: 1.0,
    frequency: 3.0,
    direction: 'horizontal',
};
export const defaultVortexEffect: VortexEffect = {
    effectType: 'vortex',
    enabled: true,
    intensity: 0.5,
    speed: 0.5,
    centerX: 0,
    centerY: 0,
};
export const defaultRippleEffect: RippleEffect = {
    effectType: 'ripple',
    enabled: true,
    intensity: 0.3,
    speed: 2.0,
    frequency: 5.0,
    centerX: 0,
    centerY: 0,
};
export const defaultScaleEffect: ScaleEffect = {
    effectType: 'scale',
    enabled: true,
    intensity: 0.5,
    speed: 1.0,
    minScale: 0.5,
    maxScale: 2.0,
};
export const defaultGrayscaleEffect: GrayscaleEffect = {
    effectType: 'grayscale',
    enabled: true,
    intensity: 1.0,
    speed: 1.0,
    mode: 'static',
    contrast: 1.0,
    brightness: 0.0,
    direction: 'horizontal',
    pulseSpeed: 2.0,
    rippleSpeed: 2.0,
    centerX: 0,
    centerY: 0,
    waveFrequency: 3.0,
    waveSpeed: 1.0,
};
export const defaultGlowEffect: GlowEffect = {
    effectType: 'glow',
    enabled: true,
    intensity: 0.5,
    speed: 1.0,
    color: '#ffffff',
};
export const defaultColorShiftEffect: ColorShiftEffect = {
    effectType: 'colorShift',
    enabled: true,
    intensity: 0.5,
    speed: 1.0,
    targetColor: '#ff6600',
};
export const default3driseShaderEffects: Use3driseShaderEffects = [];
export const defaultParticlesSettings: ParticlesSettings = {
    id: 'default-particles-settings',
    name: "Default Particles Settings",
    type: 'particles',
    config: {
        count: 1000,
        shapeType: defaultShape,
        outlines: false,
        texture: null,
        particles: true,
        paths: true
    },
    meshSettings: {
        id: 'default-particles-settings',
        name: "Default Particles Settings",
        visible: true,
        position: [0, 5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        anchor: null
    },
    materialSettings: {
        materialType: 'particles',
        materialVariant: '3dRiseShader',
        color: '#ffffff',
        opacity: 1.0,
    },
};
