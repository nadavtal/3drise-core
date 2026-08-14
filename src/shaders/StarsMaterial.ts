import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
export interface StarsMaterialUniforms {
    time: {
        value: number;
    };
    opacity: {
        value: number;
    };
    uColor: {
        value: THREE.Color;
    };
    targetColor: {
        value: THREE.Color;
    };
    colorMix: {
        value: number;
    };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            starsMaterial: any;
        }
    }
}

// Vertex shader with twinkling effect
const vertexShader = /*glsl*/ `
  attribute float size;
  attribute vec3 color;
  attribute float phase;
  attribute float freq;
  
  varying vec3 vColor;
  varying float vDepth;
  
  uniform float time;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = mvPosition.z;

    // Twinkling effect based on time, frequency, and phase
    float twinkle = sin(time * freq + phase) * 0.2 + 0.8;
    gl_PointSize = size * twinkle;

    // Position stars at far depth to appear behind everything
    vec4 pos = projectionMatrix * mvPosition;
    pos.z = pos.w * 0.999999;
    gl_Position = pos;
  }
`;
// Fragment shader with star glow effect and color transitions
const fragmentShader = /*glsl*/ `
  varying vec3 vColor;
  varying float vDepth;
  
  uniform float opacity;
  uniform vec3 uColor;
  uniform vec3 targetColor;
  uniform float colorMix;

  void main() {
    // Calculate distance from center of point
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center) * 2.0;

    // Core brightness with sharp center
    float core = (1.0 - smoothstep(0.0, 0.2, dist)) * 0.8;
    
    // Soft glow around core
    float glow = (1.0 - smoothstep(0.2, 0.5, dist)) * 0.1;

    float brightness = core + glow;

    // Interpolate between base color and target color
    vec3 transitionColor = mix(uColor, targetColor, colorMix);
    
    // Mix white with interpolated color for realistic appearance
    vec3 finalColor = mix(vec3(1.0), transitionColor * vColor, 0.8) * 0.6;

    // Apply global opacity for fade in/out transitions
    gl_FragColor = vec4(finalColor, brightness * opacity);
  }
`;
// Create the shader material with uniforms
const StarsMaterial = shaderMaterial({
    time: 0,
    opacity: 1.0,
    uColor: new THREE.Color(1.0, 1.0, 1.0),
    targetColor: new THREE.Color(1.0, 1.0, 1.0),
    colorMix: 0.0
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ StarsMaterial });
export { StarsMaterial };
