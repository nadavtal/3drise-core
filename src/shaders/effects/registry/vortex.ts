import type { EffectDescriptor } from "../types";

export const vortexEffect: EffectDescriptor = {
    id: 'vortex',
    label: 'Vortex',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 5, step: 0.01 },
        },
        speed: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 5, step: 0.05 },
        },
        centerX: {
            glslType: 'float',
            default: 0,
            control: { kind: 'slider', label: 'Center X', min: -5, max: 5, step: 0.1 },
        },
        centerY: {
            glslType: 'float',
            default: 0,
            control: { kind: 'slider', label: 'Center Y', min: -5, max: 5, step: 0.1 },
        },
    },
    vertexBody: /*glsl*/ `
    vec2 vortexCenter = vec2({{prefix}}centerX, {{prefix}}centerY);
    vec2 toCenter = morphedPos.xy - vortexCenter;
    float angle = {{prefix}}intensity * u_time * {{prefix}}speed * effectScopeFactor;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    morphedPos.xy = vortexCenter + rotation * toCenter;
  `,
};
