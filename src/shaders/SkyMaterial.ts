import { Vector3, Vector2 } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface SkyMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_pointer: {
        value: Vector2;
    };
    iChannel0: {
        value: Texture | null;
    };
    R0: {
        value: number;
    };
    Ra: {
        value: number;
    };
    I: {
        value: number;
    };
    SI: {
        value: number;
    };
    g: {
        value: number;
    };
    Hr: {
        value: number;
    };
    Hm: {
        value: number;
    };
    bR: {
        value: Vector3;
    };
    bM: {
        value: Vector3;
    };
    cloudy: {
        value: number;
    };
    haze: {
        value: number;
    };
    rainmulti: {
        value: number;
    };
    cameraheight: {
        value: number;
    };
    mincloudheight: {
        value: number;
    };
    maxcloudheight: {
        value: number;
    };
    xaxiscloud: {
        value: number;
    };
    yaxiscloud: {
        value: number;
    };
    zaxiscloud: {
        value: number;
    };
    cloudnoise: {
        value: number;
    };
    steps: {
        value: number;
    };
    stepss: {
        value: number;
    };
    fov: {
        value: number;
    };
    enableRain: {
        value: number;
    };
    simpleSun: {
        value: number;
    };
    nicehackSun: {
        value: number;
    };
    softSun: {
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
// Fragment shader - simplified and working version
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform sampler2D iChannel0;
  
  // Environment constants
  uniform float R0; // planet radius
  uniform float Ra; // atmosphere radius
  uniform float I; // sun light power
  uniform float SI; // sun intensity
  uniform float g; // light concentration
  uniform float Hr; // Rayleigh scattering top
  uniform float Hm; // Mie scattering top
  
  // Scattering coefficients
  uniform vec3 bR; // Rayleigh scattering
  uniform vec3 bM; // Mie scattering
  
  // Cloud parameters
  uniform float cloudy;
  uniform float haze;
  uniform float rainmulti;
  uniform float cameraheight;
  uniform float mincloudheight;
  uniform float maxcloudheight;
  uniform float xaxiscloud;
  uniform float yaxiscloud;
  uniform float zaxiscloud;
  uniform float cloudnoise;
  
  // Rendering parameters
  uniform float steps;
  uniform float stepss;
  
  // Sun parameters
  uniform float fov;
  
  // Feature toggles
  uniform float enableRain;
  uniform float simpleSun;
  uniform float nicehackSun;
  uniform float softSun;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  #define PI 3.14159265358979323846
  
  // Simple noise function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), 
                   hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), 
                   hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  
  // Fractal noise
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  // Simple atmospheric scattering
  vec3 atmosphere(vec3 rayDir, vec3 sunDir) {
    float sunDot = dot(rayDir, sunDir);
    
    // Sky gradient
    float skyGradient = 1.0 - abs(rayDir.y);
    vec3 skyColor = mix(vec3(0.1, 0.3, 0.8), vec3(0.8, 0.9, 1.0), skyGradient);
    
    // Sun
    float sunSize = 1.0 - distance(rayDir, sunDir);
    sunSize = max(sunSize, 0.0);
    vec3 sunColor = vec3(1.0, 0.8, 0.6) * pow(sunSize, 256.0) * 50.0;
    
    // Sun glow
    float sunGlow = 1.0 - distance(rayDir, sunDir);
    sunGlow = max(sunGlow, 0.0);
    vec3 glowColor = vec3(1.0, 0.6, 0.3) * pow(sunGlow, 8.0) * 0.5;
    
    return skyColor + sunColor + glowColor;
  }
  
  // Simple cloud generation
  vec3 clouds(vec2 uv, float time) {
    vec2 cloudUV = uv * 2.0 + vec2(time * 0.1, 0.0);
    float cloudNoise = fbm(cloudUV * 3.0);
    cloudNoise = smoothstep(0.4, 0.8, cloudNoise);
    
    vec3 cloudColor = vec3(1.0) * cloudNoise * cloudy;
    return cloudColor;
  }
  
  // Simple star field
  vec3 stars(vec2 uv) {
    vec2 starUV = uv * 100.0;
    float starNoise = hash(floor(starUV));
    starNoise = step(0.99, starNoise);
    
    vec3 starColor = vec3(1.0) * starNoise * 0.5;
    return starColor;
  }
  
  // Aurora effect
  vec3 aurora(vec2 uv, float time) {
    vec2 auroraUV = uv + vec2(sin(time * 0.5) * 0.1, 0.0);
    float auroraPattern = sin(auroraUV.x * 10.0 + time) * sin(auroraUV.y * 5.0);
    auroraPattern = max(auroraPattern, 0.0);
    auroraPattern = pow(auroraPattern, 3.0);
    
    vec3 auroraColor = vec3(0.2, 1.0, 0.5) * auroraPattern * 0.3;
    return auroraColor;
  }
  
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Mouse position for sun direction
    vec2 mouse = u_pointer.xy / u_resolution.xy;
    if (mouse.x == 0.0 && mouse.y == 0.0) {
      mouse = vec2(0.5, 0.7); // Default sun position
    }
    
    // Ray direction
    vec3 rayDir = normalize(vec3(uv, -1.0));
    
    // Sun direction
    vec3 sunDir = normalize(vec3(
      (mouse.x - 0.5) * 2.0,
      (mouse.y - 0.5) * 2.0,
      -0.5
    ));
    
    // Base atmosphere
    vec3 color = atmosphere(rayDir, sunDir);
    
    // Add clouds
    if (cloudy > 0.0) {
      vec3 cloudColor = clouds(uv, u_time);
      color = mix(color, color + cloudColor, 0.5);
    }
    
    // Add stars (only visible when looking up and sun is low)
    if (rayDir.y > 0.0 && mouse.y < 0.3) {
      vec3 starColor = stars(uv);
      color += starColor;
    }
    
    // Add aurora (only when sun is very low)
    if (mouse.y < 0.2 && rayDir.y > 0.2) {
      vec3 auroraColor = aurora(uv, u_time);
      color += auroraColor;
    }
    
    // Tone mapping and gamma correction
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
// Create the shader material with uniforms
const SkyMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_pointer: new Vector2(0, 0),
    iChannel0: null,
    // Environment constants
    R0: 6360e3, // planet radius
    Ra: 6380e3, // atmosphere radius
    I: 10.0, // sun light power
    SI: 5.0, // sun intensity
    g: 0.45, // light concentration
    Hr: 8e3, // Rayleigh scattering top
    Hm: 1.2e3, // Mie scattering top
    // Scattering coefficients
    bR: new Vector3(5.8e-6, 13.5e-6, 33.1e-6), // Rayleigh scattering (normal earth)
    bM: new Vector3(21e-6, 21e-6, 21e-6), // Mie scattering
    // Cloud parameters
    cloudy: 0.5,
    haze: 0.01,
    rainmulti: 5.0,
    cameraheight: 5e1,
    mincloudheight: 5e3,
    maxcloudheight: 8e3,
    xaxiscloud: 0, // Will be set to t*5e2 in animation
    yaxiscloud: 0.0,
    zaxiscloud: 0, // Will be set to t*6e2 in animation
    cloudnoise: 2e-4,
    // Rendering parameters
    steps: 16,
    stepss: 16,
    // Sun parameters
    fov: Math.tan(Math.PI / 3), // 60 degrees
    // Feature toggles
    enableRain: 0,
    simpleSun: 0,
    nicehackSun: 1,
    softSun: 1
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ SkyMaterial });
export { SkyMaterial };
