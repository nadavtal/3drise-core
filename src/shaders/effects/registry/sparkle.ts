import type { EffectDescriptor } from "../types";

export const sparkleEffect: EffectDescriptor = {
    id: 'sparkle',
    label: 'Sparkle',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 5, step: 0.01 },
        },
        density: {
            glslType: 'float',
            default: 0.05,
            control: { kind: 'slider', label: 'Density', min: 0, max: 0.5, step: 0.005 },
        },
        speed: {
            glslType: 'float',
            default: 4.0,
            control: { kind: 'slider', label: 'Speed', min: 0, max: 20, step: 0.1 },
        },
    },
    fragmentBody: /*glsl*/ `
    // Per-particle random twinkle. Uses vTexCoords as a stable per-particle seed
    // and steps time in chunks so flashes feel discrete instead of smeared.
    float sparkleStep = floor(u_time * {{prefix}}speed);
    float sparkleSeed = dot(vTexCoords, vec2(12.9898, 78.233)) + sparkleStep * 17.31;
    float sparkleRand = fract(sin(sparkleSeed) * 43758.5453);
    float sparkleAlive = step(1.0 - {{prefix}}density, sparkleRand);
    float sparkleFade = smoothstep(0.0, 0.5, fract(u_time * {{prefix}}speed));
    sparkleFade = sparkleFade * (1.0 - sparkleFade) * 4.0; // 0→1→0 within step
    outColor.rgb += vec3(sparkleAlive * sparkleFade * {{prefix}}intensity * effectScopeFactor);
  `,
};
