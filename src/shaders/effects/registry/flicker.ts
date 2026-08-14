import type { EffectDescriptor } from "../types";

export const flickerEffect: EffectDescriptor = {
    id: 'flicker',
    label: 'Flicker',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.4,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 1, step: 0.01 },
        },
        speed: {
            glslType: 'float',
            default: 12.0,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 60, step: 0.5 },
        },
    },
    fragmentBody: /*glsl*/ `
    // Chaotic per-particle brightness flicker (firefly / failing-bulb feel).
    // Time stepped so flickers feel discrete; per-particle seed via vTexCoords.
    float flickStep = floor(u_time * {{prefix}}speed);
    float flickSeed = dot(vTexCoords, vec2(45.31, 12.83)) + flickStep * 7.91;
    float flickRand = fract(sin(flickSeed) * 18472.831);
    // Map [0,1] → [-1,1] so flicker dims AND brightens
    outColor.rgb *= 1.0 + (flickRand * 2.0 - 1.0) * {{prefix}}intensity * effectScopeFactor;
  `,
};
