import type { EffectDescriptor } from "../types";

export const glowEffect: EffectDescriptor = {
    id: 'glow',
    label: 'Glow',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 5, step: 0.01 },
        },
        color: {
            glslType: 'vec3',
            default: '#ffffff',
            control: { kind: 'color', label: 'Color' },
        },
    },
    fragmentBody: /*glsl*/ `
    outColor.rgb += {{prefix}}color * {{prefix}}intensity * effectScopeFactor;
  `,
};
