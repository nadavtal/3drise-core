import type { EffectDescriptor } from "../types";

export const rippleEffect: EffectDescriptor = {
    id: 'ripple',
    label: 'Ripple',
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
            default: 5.0,
            control: { kind: 'slider', label: 'Frequency', min: 0, max: 20, step: 0.1 },
        },
        speed: {
            glslType: 'float',
            default: 2.0,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 10, step: 0.1 },
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
    vec2 rippleCenter = vec2({{prefix}}centerX, {{prefix}}centerY);
    float rippleDist = distance(morphedPos.xy, rippleCenter);
    morphedPos.z += sin(rippleDist * {{prefix}}frequency - u_time * {{prefix}}speed)
                  * {{prefix}}intensity * effectScopeFactor;
  `,
};
