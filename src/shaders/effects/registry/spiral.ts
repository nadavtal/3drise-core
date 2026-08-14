import type { EffectDescriptor } from "../types";

export const spiralEffect: EffectDescriptor = {
    id: 'spiral',
    label: 'Spiral',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Rotation', min: -5, max: 5, step: 0.05 },
        },
        radialSpeed: {
            glslType: 'float',
            default: 0.2,
            control: { kind: 'slider', label: 'Radial drift', min: -3, max: 3, step: 0.01 },
        },
        speed: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Speed', min: -5, max: 5, step: 0.05 },
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
    },
    vertexBody: /*glsl*/ `
    // Rotation around (centerX, centerY) plus radial drift over time.
    // Positive radial → outward like a galaxy arm; negative → inward like a drain.
    vec2 spiralCenter = vec2({{prefix}}centerX, {{prefix}}centerY);
    vec2 toCenter = morphedPos.xy - spiralCenter;
    float r = length(toCenter);
    float a = atan(toCenter.y, toCenter.x);
    float deltaA = u_time * {{prefix}}speed * {{prefix}}intensity * effectScopeFactor;
    float deltaR = u_time * {{prefix}}radialSpeed * effectScopeFactor;
    a += deltaA;
    r = max(0.0, r + deltaR);
    morphedPos.xy = spiralCenter + r * vec2(cos(a), sin(a));
  `,
};
