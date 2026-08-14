import type { EffectDescriptor } from "../types";

export const rainbowEffect: EffectDescriptor = {
    id: 'rainbow',
    label: 'Rainbow',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    helpers: /*glsl*/ `
    // Cheap HSV → RGB conversion (Sam Hocevar style).
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
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
            default: 0.3,
            control: { kind: 'slider', label: 'Speed', min: -3, max: 3, step: 0.01 },
        },
        spatial: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Spatial', min: 0, max: 5, step: 0.05 },
        },
        direction: {
            glslType: 'float',
            default: 0,
            control: {
                kind: 'select',
                label: 'Direction',
                options: [
                    { value: 0, label: 'Horizontal' },
                    { value: 1, label: 'Vertical' },
                    { value: 2, label: 'Diagonal' },
                    { value: 3, label: 'Radial' },
                ],
            },
        },
    },
    fragmentBody: /*glsl*/ `
    float rainbowAxis =
      ({{prefix}}direction < 0.5) ? vTexCoords.x :
      ({{prefix}}direction < 1.5) ? vTexCoords.y :
      ({{prefix}}direction < 2.5) ? (vTexCoords.x + vTexCoords.y) :
                                     length(vTexCoords);
    float hue = fract(rainbowAxis * {{prefix}}spatial + u_time * {{prefix}}speed);
    vec3 rainbowColor = hsv2rgb(vec3(hue, 1.0, 1.0));
    outColor.rgb = mix(outColor.rgb, rainbowColor, {{prefix}}intensity * effectScopeFactor);
  `,
};
