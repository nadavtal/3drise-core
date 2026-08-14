import { Color } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
// Vertex shader for the shooting star trail
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
// Fragment shader with gradient fade effect
const fragmentShader = /*glsl*/ `
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;
  varying float vProgress;
  
  void main() {
    // Create gradient fade from bright (head) to transparent (tail)
    float alpha = opacity * (1.0 - vProgress) * (1.0 - vProgress);
    
    // Add glow effect
    float glow = 1.0 - vProgress;
    vec3 glowColor = color * (1.0 + glow * 0.5);
    
    gl_FragColor = vec4(glowColor, alpha);
  }
`;
// Create the shader material
const ShootingStarMaterial = shaderMaterial({
    color: new Color(1.0, 1.0, 1.0),
    opacity: 1.0,
}, vertexShader, fragmentShader);
// Extend for React Three Fiber
extend({ ShootingStarMaterial });
export { ShootingStarMaterial };
