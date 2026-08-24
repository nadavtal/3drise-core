import { Color } from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
declare module '@react-three/fiber' {
    interface ThreeElements {
        shootingStarMaterial: any;
    }
}

const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying float vProgress;
  attribute float progress;

  void main() {
    vUv = uv;
    vProgress = progress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;
  varying float vProgress;

  void main() {
    float alpha = opacity * (1.0 - vProgress) * (1.0 - vProgress);
    float glow = 1.0 - vProgress;
    vec3 glowColor = color * (1.0 + glow * 0.5);
    gl_FragColor = vec4(glowColor, alpha);
  }
`;
const ShootingStarMaterial = shaderMaterial({
    color: new Color(1.0, 1.0, 1.0),
    opacity: 1.0,
}, vertexShader, fragmentShader);
extend({ ShootingStarMaterial });
export { ShootingStarMaterial };
