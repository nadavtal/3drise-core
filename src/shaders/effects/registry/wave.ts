import type { EffectDescriptor } from "../types";

export const waveEffect: EffectDescriptor = {
    id: 'wave',
    label: 'Wave',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.3,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 2, step: 0.01 },
        },
        frequency: {
            glslType: 'float',
            default: 3.0,
            control: { kind: 'slider', label: 'Frequency', min: 0, max: 20, step: 0.1 },
        },
        speed: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 5, step: 0.05 },
        },
        direction: {
            glslType: 'float',
            default: 0,
            control: {
                kind: 'select',
                label: 'Direction',
                options: [
                    { value: 0, label: 'Horizontal' },
                    { value: 1, label: 'Vertical' },
                    { value: 2, label: 'Diagonal' },
                ],
            },
        },
    },
    vertexBody: /*glsl*/ `
    float waveInput =
      ({{prefix}}direction < 0.5) ? morphedPos.x :
      ({{prefix}}direction < 1.5) ? morphedPos.y :
                                    morphedPos.x + morphedPos.y;
    morphedPos.z += sin(waveInput * {{prefix}}frequency + u_time * {{prefix}}speed)
                  * {{prefix}}intensity * effectScopeFactor;
  `,
};
