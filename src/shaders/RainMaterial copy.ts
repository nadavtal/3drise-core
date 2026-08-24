import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
export interface RainMaterialUniforms {
    uColor: {
        value: THREE.Color;
    };
    opacity: {
        value: number;
    };
    windAngle: {
        value: number;
    };
    windTilt: {
        value: number;
    };
    streakLength: {
        value: number;
    };
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        rainMaterial: any;
    }
}

const vertexShader = /*glsl*/ `
  attribute float speed;
  varying float vSpeed;
  uniform float windAngle;
  uniform float windTilt;
  uniform float streakLength;

  void main() {
    vSpeed = speed;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 12.0 * streakLength * (200.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fragmentShader = /*glsl*/ `
  varying float vSpeed;
  uniform vec3 uColor;
  uniform float opacity;
  uniform float windAngle;
  uniform float windTilt;
  uniform float streakLength;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float angle = windAngle * windTilt;
    float ca = cos(angle);
    float sa = sin(angle);
    vec2 rotUv = vec2(
      uv.x * ca - uv.y * sa,
      uv.x * sa + uv.y * ca
    );
    float aspectRatio = max(streakLength, 1.0);
    rotUv.x *= aspectRatio;
    float dist = length(rotUv);
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow = (1.0 - smoothstep(0.1, 0.4, dist)) * 0.3;
    float alpha = (core + glow) * opacity;
    float gradient = smoothstep(-0.5, 0.2, rotUv.y) * 0.3 + 0.7;
    alpha *= gradient;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
const RainMaterial = shaderMaterial({
    uColor: new THREE.Color(0.7, 0.75, 0.85),
    opacity: 0.5,
    windAngle: 0.0,
    windTilt: 0.0,
    streakLength: 3.0,
}, vertexShader, fragmentShader);
extend({ RainMaterial });
export { RainMaterial };
