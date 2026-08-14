import type { EffectDescriptor } from "../types";

export const twistEffect: EffectDescriptor = {
    id: 'twist',
    label: 'Twist',
    stage: 'vertex',
    allowedScopes: ['global', 'pointer'],
    uniforms: {
        intensity: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Intensity', min: -5, max: 5, step: 0.01 },
        },
        speed: {
            glslType: 'float',
            default: 0.5,
            control: { kind: 'slider', label: 'Speed', min: -5, max: 5, step: 0.05 },
        },
        axis: {
            glslType: 'float',
            default: 1, // Y axis — classic tornado look
            control: {
                kind: 'select',
                label: 'Axis',
                options: [
                    { value: 0, label: 'X' },
                    { value: 1, label: 'Y' },
                    { value: 2, label: 'Z' },
                ],
            },
        },
    },
    vertexBody: /*glsl*/ `
    // Rotation angle increases with the position along the chosen axis,
    // producing a tornado/DNA-helix look. Optional time-based spin too.
    float twistCoord =
      ({{prefix}}axis < 0.5) ? morphedPos.x :
      ({{prefix}}axis < 1.5) ? morphedPos.y :
                               morphedPos.z;
    float twistAngle = (twistCoord * {{prefix}}intensity + u_time * {{prefix}}speed) * effectScopeFactor;
    float ts = sin(twistAngle);
    float tc = cos(twistAngle);
    if ({{prefix}}axis < 0.5) {
      // Rotate YZ around X
      vec2 yz = vec2(tc * morphedPos.y - ts * morphedPos.z, ts * morphedPos.y + tc * morphedPos.z);
      morphedPos.y = yz.x; morphedPos.z = yz.y;
    } else if ({{prefix}}axis < 1.5) {
      // Rotate XZ around Y
      vec2 xz = vec2(tc * morphedPos.x + ts * morphedPos.z, -ts * morphedPos.x + tc * morphedPos.z);
      morphedPos.x = xz.x; morphedPos.z = xz.y;
    } else {
      // Rotate XY around Z
      vec2 xy = vec2(tc * morphedPos.x - ts * morphedPos.y, ts * morphedPos.x + tc * morphedPos.y);
      morphedPos.x = xy.x; morphedPos.y = xy.y;
    }
  `,
};
