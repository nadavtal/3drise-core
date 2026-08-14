import type { EffectDescriptor } from "../types";

export const hueShiftEffect: EffectDescriptor = {
    id: 'hueShift',
    label: 'Hue shift',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    helpers: /*glsl*/ `
    // Cheap hue rotation matrix (no full HSV conversion). amount is in radians.
    vec3 rotateHue(vec3 color, float amount) {
      const vec3 k = vec3(0.57735);
      float c = cos(amount);
      vec3 rotated = color * c
                   + cross(k, color) * sin(amount)
                   + k * dot(k, color) * (1.0 - c);
      return rotated;
    }
  `,
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 1, step: 0.01 },
        },
        speed: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Speed', min: -5, max: 5, step: 0.05 },
        },
        spatial: {
            glslType: 'float',
            default: 0.0,
            control: { kind: 'slider', label: 'Spatial', min: 0, max: 5, step: 0.05 },
        },
    },
    fragmentBody: /*glsl*/ `
    float hueAngle = u_time * {{prefix}}speed
                   + (vTexCoords.x + vTexCoords.y) * {{prefix}}spatial;
    vec3 shifted = rotateHue(outColor.rgb, hueAngle);
    outColor.rgb = mix(outColor.rgb, shifted, {{prefix}}intensity * effectScopeFactor);
  `,
};
