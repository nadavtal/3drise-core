import type { EffectDescriptor } from "../types";

export const grayscaleEffect: EffectDescriptor = {
    id: 'grayscale',
    label: 'Grayscale',
    stage: 'fragment',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Intensity', min: 0, max: 1, step: 0.01 },
        },
        contrast: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Contrast', min: 0, max: 3, step: 0.01 },
        },
        brightness: {
            glslType: 'float',
            default: 0.0,
            control: { kind: 'slider', label: 'Brightness', min: -1, max: 1, step: 0.01 },
        },
        mode: {
            glslType: 'float',
            default: 0,
            control: {
                kind: 'select',
                label: 'Mode',
                options: [
                    { value: 0, label: 'Static' },
                    { value: 1, label: 'Wave' },
                    { value: 2, label: 'Pulse' },
                    { value: 3, label: 'Ripple' },
                ],
            },
        },
        waveFrequency: {
            glslType: 'float',
            default: 3.0,
            control: { kind: 'slider', label: 'Wave frequency', min: 0, max: 20, step: 0.1 },
        },
        waveSpeed: {
            glslType: 'float',
            default: 1.0,
            control: { kind: 'slider', label: 'Wave speed', min: 0, max: 5, step: 0.05 },
        },
        waveDirection: {
            glslType: 'float',
            default: 0,
            control: {
                kind: 'select',
                label: 'Wave direction',
                options: [
                    { value: 0, label: 'Horizontal' },
                    { value: 1, label: 'Vertical' },
                    { value: 2, label: 'Diagonal' },
                ],
            },
        },
        pulseSpeed: {
            glslType: 'float',
            default: 2.0,
            control: { kind: 'slider', label: 'Pulse speed', min: 0, max: 10, step: 0.1 },
        },
        rippleSpeed: {
            glslType: 'float',
            default: 2.0,
            control: { kind: 'slider', label: 'Ripple speed', min: 0, max: 10, step: 0.1 },
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
    fragmentBody: /*glsl*/ `
    {
      float grayscaleFactor = 0.0;
      if ({{prefix}}mode < 0.5) {
        grayscaleFactor = {{prefix}}intensity;
      } else if ({{prefix}}mode < 1.5) {
        float wavePos =
          ({{prefix}}waveDirection < 0.5) ? vTexCoords.x :
          ({{prefix}}waveDirection < 1.5) ? vTexCoords.y :
                                            vTexCoords.x + vTexCoords.y;
        grayscaleFactor = (sin(wavePos * {{prefix}}waveFrequency + u_time * {{prefix}}waveSpeed) * 0.5 + 0.5)
                        * {{prefix}}intensity;
      } else if ({{prefix}}mode < 2.5) {
        grayscaleFactor = (sin(u_time * {{prefix}}pulseSpeed) * 0.5 + 0.5) * {{prefix}}intensity;
      } else {
        vec2 grayscaleRippleCenter = vec2({{prefix}}centerX, {{prefix}}centerY);
        float rd = distance(vTexCoords, grayscaleRippleCenter);
        grayscaleFactor = (sin(rd * 5.0 - u_time * {{prefix}}rippleSpeed) * 0.5 + 0.5) * {{prefix}}intensity;
      }
      float gray = dot(outColor.rgb, vec3(0.299, 0.587, 0.114));
      gray = (gray - 0.5) * {{prefix}}contrast + 0.5 + {{prefix}}brightness;
      vec3 grayscaleColor = vec3(gray);
      outColor.rgb = mix(outColor.rgb, grayscaleColor, grayscaleFactor * effectScopeFactor);
    }
  `,
};
