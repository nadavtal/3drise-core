import { Vector2, Color } from "three";
export interface EffectsUniforms {
    u_pointer: {
        value: Vector2;
    };
    uPointerEffectRadius: {
        value: number;
    };
    uGeneralWaveEnabled: {
        value: boolean;
    };
    uGeneralWaveIntensity: {
        value: number;
    };
    uGeneralWaveFrequency: {
        value: number;
    };
    uGeneralWaveSpeed: {
        value: number;
    };
    uGeneralWaveDirection: {
        value: number;
    };
    uGeneralVortexEnabled: {
        value: boolean;
    };
    uGeneralVortexIntensity: {
        value: number;
    };
    uGeneralVortexSpeed: {
        value: number;
    };
    uGeneralVortexCenterX: {
        value: number;
    };
    uGeneralVortexCenterY: {
        value: number;
    };
    uGeneralRippleEnabled: {
        value: boolean;
    };
    uGeneralRippleIntensity: {
        value: number;
    };
    uGeneralRippleSpeed: {
        value: number;
    };
    uGeneralRippleFrequency: {
        value: number;
    };
    uGeneralRippleCenterX: {
        value: number;
    };
    uGeneralRippleCenterY: {
        value: number;
    };
    uRippleEnabled: {
        value: boolean;
    };
    uRippleIntensity: {
        value: number;
    };
    uRippleSpeed: {
        value: number;
    };
    uDisplacementEnabled: {
        value: boolean;
    };
    uDisplacementIntensity: {
        value: number;
    };
    uVortexEnabled: {
        value: boolean;
    };
    uVortexIntensity: {
        value: number;
    };
    uVortexSpeed: {
        value: number;
    };
    uWaveEnabled: {
        value: boolean;
    };
    uWaveIntensity: {
        value: number;
    };
    uWaveFrequency: {
        value: number;
    };
    uGeneralGrayscaleEnabled: {
        value: boolean;
    };
    uGeneralGrayscaleMode: {
        value: number;
    };
    uGeneralGrayscaleIntensity: {
        value: number;
    };
    uGeneralGrayscaleContrast: {
        value: number;
    };
    uGeneralGrayscaleBrightness: {
        value: number;
    };
    uGeneralGrayscaleWaveFreq: {
        value: number;
    };
    uGeneralGrayscaleWaveSpeed: {
        value: number;
    };
    uGeneralGrayscaleWaveDir: {
        value: number;
    };
    uGeneralGrayscalePulseSpeed: {
        value: number;
    };
    uGeneralGrayscaleRippleSpeed: {
        value: number;
    };
    uGeneralGrayscaleRippleCenterX: {
        value: number;
    };
    uGeneralGrayscaleRippleCenterY: {
        value: number;
    };
    uGlowEnabled: {
        value: boolean;
    };
    uGlowIntensity: {
        value: number;
    };
    uGlowColor: {
        value: Color;
    };
    uColorShiftEnabled: {
        value: boolean;
    };
    uColorShiftIntensity: {
        value: number;
    };
    uColorShiftTarget: {
        value: Color;
    };
    uBrightnessEnabled: {
        value: boolean;
    };
    uBrightnessIntensity: {
        value: number;
    };
    uPulseEnabled: {
        value: boolean;
    };
    uPulseIntensity: {
        value: number;
    };
    uPulseSpeed: {
        value: number;
    };
    uPointerGrayscaleEnabled: {
        value: boolean;
    };
    uPointerGrayscaleIntensity: {
        value: number;
    };
    uPointerGrayscaleContrast: {
        value: number;
    };
    uPointerGrayscaleBrightness: {
        value: number;
    };
}

// Shared uniform definitions for all shader effects
export const effectsUniforms = {
    // Pointer tracking
    u_pointer: new Vector2(0, 0),
    // Pointer effects global settings
    uPointerEffectRadius: 2.5,
    // Vertex effects - General (always active when enabled)
    uGeneralWaveEnabled: false,
    uGeneralWaveIntensity: 0.3,
    uGeneralWaveFrequency: 3.0,
    uGeneralWaveSpeed: 1.0,
    uGeneralWaveDirection: 0.0, // 0=horizontal, 1=vertical, 2=diagonal
    uGeneralVortexEnabled: false,
    uGeneralVortexIntensity: 0.5,
    uGeneralVortexSpeed: 0.5,
    uGeneralVortexCenterX: 0.0,
    uGeneralVortexCenterY: 0.0,
    uGeneralRippleEnabled: false,
    uGeneralRippleIntensity: 0.3,
    uGeneralRippleSpeed: 2.0,
    uGeneralRippleFrequency: 5.0,
    uGeneralRippleCenterX: 0.0,
    uGeneralRippleCenterY: 0.0,
    // Vertex effects - Pointer (interactive)
    uRippleEnabled: false,
    uRippleIntensity: 0.5,
    uRippleSpeed: 2.0,
    uDisplacementEnabled: false,
    uDisplacementIntensity: 0.5,
    uVortexEnabled: false,
    uVortexIntensity: 0.5,
    uVortexSpeed: 1.0,
    uWaveEnabled: false,
    uWaveIntensity: 0.5,
    uWaveFrequency: 5.0,
    // Fragment effects - General
    uGeneralGrayscaleEnabled: false,
    uGeneralGrayscaleMode: 0.0, // 0=static, 1=wave, 2=pulse, 3=ripple
    uGeneralGrayscaleIntensity: 1.0,
    uGeneralGrayscaleContrast: 1.0,
    uGeneralGrayscaleBrightness: 0.0,
    uGeneralGrayscaleWaveFreq: 3.0,
    uGeneralGrayscaleWaveSpeed: 1.0,
    uGeneralGrayscaleWaveDir: 0.0, // 0=horizontal, 1=vertical, 2=diagonal
    uGeneralGrayscalePulseSpeed: 2.0,
    uGeneralGrayscaleRippleSpeed: 2.0,
    uGeneralGrayscaleRippleCenterX: 0.0,
    uGeneralGrayscaleRippleCenterY: 0.0,
    // Fragment effects - Pointer
    uGlowEnabled: false,
    uGlowIntensity: 0.5,
    uGlowColor: new Color(1.0, 1.0, 1.0),
    uColorShiftEnabled: false,
    uColorShiftIntensity: 0.5,
    uColorShiftTarget: new Color(1.0, 0.4, 0.0),
    uBrightnessEnabled: false,
    uBrightnessIntensity: 0.5,
    uPulseEnabled: false,
    uPulseIntensity: 0.5,
    uPulseSpeed: 2.0,
    uPointerGrayscaleEnabled: false,
    uPointerGrayscaleIntensity: 1.0,
    uPointerGrayscaleContrast: 1.0,
    uPointerGrayscaleBrightness: 0.0,
};
