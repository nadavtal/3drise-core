import { noiseLibGLSL, NOISE_TYPE_OPTIONS } from '../noiseLib.glsl';
import type { EffectDescriptor } from "../types";

export const noiseEffect: EffectDescriptor = {
    id: 'noise',
    label: 'Noise displacement',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    helpers: noiseLibGLSL,
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.3,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 5, step: 0.01 },
        },
        frequency: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Frequency', min: 0.01, max: 10, step: 0.05 },
        },
        speed: {
            glslType: 'float',
            default: 0.3,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 3, step: 0.01 },
        },
        noiseType: {
            glslType: 'float',
            default: 1, // simplex by default — smoother than perlin
            control: { kind: 'select', label: 'Noise type', options: NOISE_TYPE_OPTIONS },
        },
        axis: {
            glslType: 'float',
            default: 2, // 0=X 1=Y 2=Z 3=all
            control: {
                kind: 'select',
                label: 'Axis',
                options: [
                    { value: 0, label: 'X' },
                    { value: 1, label: 'Y' },
                    { value: 2, label: 'Z' },
                    { value: 3, label: 'All' },
                ],
            },
        },
    },
    vertexBody: /*glsl*/ `
    vec2 noisePos = morphedPos.xy * {{prefix}}frequency + vec2(u_time * {{prefix}}speed);
    float n = sampleNoise({{prefix}}noiseType, noisePos);
    float push = n * {{prefix}}intensity * effectScopeFactor;
    if ({{prefix}}axis < 0.5) {
      morphedPos.x += push;
    } else if ({{prefix}}axis < 1.5) {
      morphedPos.y += push;
    } else if ({{prefix}}axis < 2.5) {
      morphedPos.z += push;
    } else {
      // All axes — sample three offset noise positions for variety
      morphedPos.x += sampleNoise({{prefix}}noiseType, noisePos) * {{prefix}}intensity * effectScopeFactor;
      morphedPos.y += sampleNoise({{prefix}}noiseType, noisePos + vec2(31.7, 5.2)) * {{prefix}}intensity * effectScopeFactor;
      morphedPos.z += sampleNoise({{prefix}}noiseType, noisePos + vec2(11.3, 27.1)) * {{prefix}}intensity * effectScopeFactor;
    }
  `,
};
