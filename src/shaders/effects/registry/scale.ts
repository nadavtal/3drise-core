import type { EffectDescriptor } from "../types";

export const scaleEffect: EffectDescriptor = {
    id: 'scale',
    label: 'Scale (point size)',
    stage: 'vertex',
    allowedScopes: ['pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 1, step: 0.01 },
        },
        minScale: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Min scale', min: 0, max: 5, step: 0.05 },
        },
        maxScale: {
            glslType: 'float',
            default: 2.0,
            control: { kind: 'slider', label: 'Max scale', min: 0, max: 10, step: 0.05 },
        },
    },
    vertexBody: /*glsl*/ `
    sizeMultiplier *= mix({{prefix}}minScale, {{prefix}}maxScale, effectScopeFactor * {{prefix}}intensity);
  `,
};
