import type { EffectDescriptor } from "../types";

export const magnetEffect: EffectDescriptor = {
    id: 'magnet',
    label: 'Magnet (attract)',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 5, step: 0.01 },
        },
        centerX: {
            glslType: 'float',
            default: 0,
            control: { kind: 'slider', label: 'Center X', min: -5, max: 5, step: 0.05 },
        },
        centerY: {
            glslType: 'float',
            default: 0,
            control: { kind: 'slider', label: 'Center Y', min: -5, max: 5, step: 0.05 },
        },
        centerZ: {
            glslType: 'float',
            default: 0,
            control: { kind: 'slider', label: 'Center Z', min: -5, max: 5, step: 0.05 },
        },
        falloffPower: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Falloff power', min: 0, max: 3, step: 0.05 },
        },
    },
    vertexBody: /*glsl*/ `
    // Pull each particle toward a center point. Power=0 → constant pull,
    // power=1 → linear distance, power=2 → 1/r² (inverse-square).
    vec3 magCenter = vec3({{prefix}}centerX, {{prefix}}centerY, {{prefix}}centerZ);
    vec3 toCenter = magCenter - morphedPos;
    float dist = max(length(toCenter), 0.001);
    vec3 dir = toCenter / dist;
    float strength = {{prefix}}intensity * effectScopeFactor / pow(dist, {{prefix}}falloffPower);
    morphedPos += dir * min(strength, dist); // clamp to not overshoot center
  `,
};
