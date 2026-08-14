import type { EffectDescriptor } from "../types";

export const brightnessEffect: EffectDescriptor = {
    id: 'brightness',
    label: 'Brightness',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: -1, max: 5, step: 0.01 },
        },
    },
    fragmentBody: /*glsl*/ `
    outColor.rgb *= 1.0 + {{prefix}}intensity * effectScopeFactor;
  `,
};
