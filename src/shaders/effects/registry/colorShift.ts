import type { EffectDescriptor } from "../types";

export const colorShiftEffect: EffectDescriptor = {
    id: 'colorShift',
    label: 'Color shift',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 1, step: 0.01 },
        },
        targetColor: {
            glslType: 'vec3',
            default: '#ff6600',
            control: { kind: 'color', label: 'Target color' },
        },
    },
    fragmentBody: /*glsl*/ `
    outColor.rgb = mix(outColor.rgb, {{prefix}}targetColor, {{prefix}}intensity * effectScopeFactor);
  `,
};
