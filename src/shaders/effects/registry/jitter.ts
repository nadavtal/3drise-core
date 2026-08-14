import type { EffectDescriptor } from "../types";

export const jitterEffect: EffectDescriptor = {
    id: 'jitter',
    label: 'Jitter',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.05,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 1, step: 0.005 },
        },
        speed: {
            glslType: 'float',
            default: 10.0,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 60, step: 0.5 },
        },
    },
    vertexBody: /*glsl*/ `
    // Per-particle pseudo-random vibration. Uses the unmodified position as a
    // stable seed so each particle gets its own distinct jitter direction, with
    // u_time stepped by 'speed' for the temporal frequency.
    float jitterT = floor(u_time * {{prefix}}speed);
    vec3 jitterSeed = position + vec3(jitterT * 0.137);
    vec3 jitterOffset = vec3(
      fract(sin(dot(jitterSeed, vec3(12.9898, 78.233, 37.719))) * 43758.5453) - 0.5,
      fract(sin(dot(jitterSeed, vec3(93.9898, 47.233, 12.719))) * 43758.5453) - 0.5,
      fract(sin(dot(jitterSeed, vec3(54.9898, 31.233, 89.719))) * 43758.5453) - 0.5
    );
    morphedPos += jitterOffset * {{prefix}}intensity * 2.0 * effectScopeFactor;
  `,
};
