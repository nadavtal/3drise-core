import type { EffectDescriptor } from "../types";

export const saturationEffect: EffectDescriptor = {
    id: 'saturation',
    label: 'Saturation',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: -1, max: 2, step: 0.01 },
        },
    },
    fragmentBody: /*glsl*/ `
    // intensity = 0 → unchanged, -1 → grayscale, +1 → +100% chroma boost.
    float satGray = dot(outColor.rgb, vec3(0.299, 0.587, 0.114));
    float satAmount = 1.0 + {{prefix}}intensity * effectScopeFactor;
    outColor.rgb = mix(vec3(satGray), outColor.rgb, satAmount);
  `,
};
