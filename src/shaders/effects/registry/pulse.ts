import type { EffectDescriptor } from "../types";

export const pulseEffect: EffectDescriptor = {
    id: 'pulse',
    label: 'Pulse',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 5, step: 0.01 },
        },
        speed: {
            glslType: 'float',
            default: 2.0,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 10, step: 0.1 },
        },
    },
    fragmentBody: /*glsl*/ `
    // Bidirectional multiplicative pulse so it's visible on any base color
    // (additive pulse on white particles saturates and is invisible).
    float pulseValue = sin(u_time * {{prefix}}speed);
    outColor.rgb *= 1.0 + pulseValue * {{prefix}}intensity * effectScopeFactor;
  `,
};
