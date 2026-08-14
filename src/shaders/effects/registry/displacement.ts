import type { EffectDescriptor } from "../types";

export const displacementEffect: EffectDescriptor = {
    id: 'displacement',
    label: 'Displacement (push from pointer)',
    stage: 'vertex',
    allowedScopes: ['pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 5, step: 0.01 },
        },
    },
    vertexBody: /*glsl*/ `
    vec2 dir = normalize(morphedPos.xy - scaledPointer);
    morphedPos.xy += dir * {{prefix}}intensity * effectScopeFactor * 2.0;
  `,
};
