import type { EffectDescriptor } from "../types";

export const explodeEffect: EffectDescriptor = {
    id: 'explode',
    label: 'Explode / implode',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.3,
            control: { kind: 'slider', label: 'Intensity', min: -3, max: 3, step: 0.01 },
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
        speed: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Speed', min: -5, max: 5, step: 0.05 },
        },
    },
    vertexBody: /*glsl*/ `
    // Pulses particles outward (positive intensity) or inward (negative)
    // along the radial direction from the center, oscillating with sin(u_time).
    vec3 explodeCenter = vec3({{prefix}}centerX, {{prefix}}centerY, {{prefix}}centerZ);
    vec3 fromCenter = morphedPos - explodeCenter;
    float dist = length(fromCenter);
    vec3 dir = (dist > 0.0001) ? (fromCenter / dist) : vec3(0.0, 1.0, 0.0);
    float wave = sin(u_time * {{prefix}}speed) * 0.5 + 0.5;
    morphedPos += dir * {{prefix}}intensity * wave * effectScopeFactor;
  `,
};
