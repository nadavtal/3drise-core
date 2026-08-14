import { Vector3, Vector2 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface BasicSkyMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    sunPosition: {
        value: Vector3;
    };
    skyColor: {
        value: Vector3;
    };
    horizonColor: {
        value: Vector3;
    };
    sunColor: {
        value: Vector3;
    };
    sunSize: {
        value: number;
    };
    sunIntensity: {
        value: number;
    };
    atmosphereThickness: {
        value: number;
    };
    scatteringStrength: {
        value: number;
    };
}

// Vertex shader
const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Simplified fragment shader
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  
  // Basic sky parameters
  uniform vec3 sunPosition;
  uniform vec3 skyColor;
  uniform vec3 horizonColor;
  uniform vec3 sunColor;
  uniform float sunSize;
  uniform float sunIntensity;
  
  // Simple atmosphere
  uniform float atmosphereThickness;
  uniform float scatteringStrength;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  #define PI 3.14159265358979323846
  
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Ray direction from camera
    vec3 rayDir = normalize(vec3(uv, -1.0));
    
    // Normalized sun direction
    vec3 sunDir = normalize(sunPosition);
    
    // Sky gradient based on ray direction
    float skyGradient = smoothstep(-0.5, 0.5, rayDir.y);
    vec3 baseColor = mix(horizonColor, skyColor, skyGradient);
    
    // Sun calculation
    float sunDot = dot(rayDir, sunDir);
    float sunDisc = smoothstep(sunSize - 0.01, sunSize, sunDot);
    float sunGlow = pow(max(sunDot, 0.0), 8.0) * 0.3;
    
    // Atmospheric scattering effect
    float scattering = pow(1.0 - abs(rayDir.y), atmosphereThickness) * scatteringStrength;
    vec3 scatterColor = sunColor * scattering;
    
    // Combine all effects
    vec3 color = baseColor;
    color += sunColor * sunDisc * sunIntensity;
    color += sunColor * sunGlow;
    color += scatterColor;
    
    // Simple tone mapping
    color = color / (color + vec3(1.0));
    
    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
// Create the basic sky material with simplified uniforms
const BasicSkyMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    // Basic sky parameters with sensible defaults
    sunPosition: new Vector3(0.5, 0.8, -0.5),
    skyColor: new Vector3(0.3, 0.6, 1.0), // Blue sky
    horizonColor: new Vector3(1.0, 0.8, 0.6), // Orange horizon
    sunColor: new Vector3(1.0, 0.9, 0.7), // Warm sun
    sunSize: 0.998, // Sun disc size
    sunIntensity: 2.0, // Sun brightness
    // Simple atmosphere
    atmosphereThickness: 2.0,
    scatteringStrength: 0.5
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ BasicSkyMaterial });
export { BasicSkyMaterial };
