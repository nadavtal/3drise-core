import type { EffectDescriptor } from "../types";

export const depthFadeEffect: EffectDescriptor = {
    id: 'depthFade',
    label: 'Depth fade',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 1, step: 0.01 },
        },
        near: {
            glslType: 'float',
            default: 0.95,
            control: { kind: 'slider', label: 'Near (full alpha)', min: 0, max: 1, step: 0.005 },
        },
        far: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Far (zero alpha)', min: 0, max: 1, step: 0.005 },
        },
    },
    fragmentBody: /*glsl*/ `
    // Fade alpha based on NDC depth (gl_FragCoord.z ∈ [0,1] from near to far plane).
    // Particles further from the camera fade out — atmospheric / fog effect.
    float depthFadeT = smoothstep({{prefix}}near, {{prefix}}far, gl_FragCoord.z);
    outColor.a *= mix(1.0, 1.0 - depthFadeT, {{prefix}}intensity * effectScopeFactor);
  `,
};
