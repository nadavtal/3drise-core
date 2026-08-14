import { Vector3, Matrix4 } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface ReflectorMaterialUniforms {
    u_envMap: {
        value: Texture | null;
    };
    u_reflectionTexture: {
        value: Texture | null;
    };
    u_textureMatrix: {
        value: Matrix4 | null;
    };
    u_useReflectionTexture: {
        value: boolean;
    };
    u_reflectivity: {
        value: number;
    };
    u_roughness: {
        value: number;
    };
    u_metalness: {
        value: number;
    };
    u_color: {
        value: Vector3;
    };
    u_fresnelPower: {
        value: number;
    };
    u_fresnelScale: {
        value: number;
    };
    u_time: {
        value: number;
    };
    u_mirror: {
        value: number;
    };
    u_mixContrast: {
        value: number;
    };
}

// Vertex shader - calculate view and normal vectors
const vertexShader = /*glsl*/ `
  uniform mat4 u_textureMatrix;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec4 vProjectedUv;
  
  void main() {
    vUv = uv;
    
    // Transform normal to world space
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vNormal = normalize(normalMatrix * normal);
    
    // Calculate world position
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Calculate view position
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    // Calculate projected UV coordinates for planar reflection
    vProjectedUv = u_textureMatrix * vec4(position, 1.0);
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;
// Fragment shader - calculate reflections with Fresnel effect
const fragmentShader = /*glsl*/ `
  uniform samplerCube u_envMap;
  uniform sampler2D u_reflectionTexture;
  uniform bool u_useReflectionTexture;
  uniform float u_reflectivity;
  uniform float u_roughness;
  uniform float u_metalness;
  uniform vec3 u_color;
  uniform float u_fresnelPower;
  uniform float u_fresnelScale;
  uniform float u_time;
  uniform float u_mirror;
  uniform float u_mixContrast;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec4 vProjectedUv;
  
  // Simple noise function for roughness simulation
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    
    return mix(
      mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
          mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
          mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }
  
  void main() {
    // Normalize vectors
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    
    // Calculate reflection vector for environment map
    vec3 reflectVec = reflect(-viewDir, normal);
    
    // Add roughness perturbation
    if (u_roughness > 0.0) {
      float noiseScale = 5.0;
      vec3 noiseVec = vec3(
        noise(vWorldPosition * noiseScale + u_time * 0.1),
        noise(vWorldPosition * noiseScale * 1.3 + u_time * 0.1),
        noise(vWorldPosition * noiseScale * 1.7 + u_time * 0.1)
      );
      noiseVec = (noiseVec - 0.5) * 2.0;
      reflectVec = normalize(reflectVec + noiseVec * u_roughness * 0.5);
    }
    
    // Sample environment map
    vec4 envColor = textureCube(u_envMap, reflectVec);
    
    // Sample planar reflection if available
    vec4 planarReflection = vec4(0.0);
    if (u_useReflectionTexture) {
      planarReflection = texture2DProj(u_reflectionTexture, vProjectedUv);
      
      // Apply contrast adjustment
      planarReflection.rgb = (planarReflection.rgb - 0.5) * u_mixContrast + 0.5;
    }
    
    // Calculate Fresnel effect
    float fresnel = u_fresnelScale + (1.0 - u_fresnelScale) * pow(1.0 - max(dot(viewDir, normal), 0.0), u_fresnelPower);
    
    // Base color
    vec3 baseColor = u_color;
    
    // Choose reflection source based on availability
    vec3 reflectionColor;
    if (u_useReflectionTexture) {
      // Blend planar reflection with environment map
      reflectionColor = mix(envColor.rgb, planarReflection.rgb, u_mirror);
      reflectionColor *= u_reflectivity;
    } else {
      // Use only environment map
      reflectionColor = envColor.rgb * u_reflectivity;
    }
    
    // Mix between base color and reflection based on metalness
    vec3 diffuseColor = mix(baseColor, vec3(0.0), u_metalness);
    
    // Apply Fresnel to reflections
    reflectionColor *= fresnel;
    
    // Combine diffuse and reflection
    vec3 finalColor = diffuseColor + reflectionColor;
    
    // Add some rim lighting for better definition
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = pow(rim, 3.0) * 0.3;
    finalColor += vec3(rim);
    
    // Apply subtle tone mapping
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(0.4545)); // Gamma correction
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
// Create the shader material with default uniforms
const ReflectorMaterial = shaderMaterial({
    u_envMap: null,
    u_reflectionTexture: null,
    u_textureMatrix: new Matrix4(),
    u_useReflectionTexture: false,
    u_reflectivity: 1.0,
    u_roughness: 0.1,
    u_metalness: 0.9,
    u_color: new Vector3(0.2, 0.2, 0.2),
    u_fresnelPower: 2.0,
    u_fresnelScale: 0.1,
    u_time: 0,
    u_mirror: 0.5,
    u_mixContrast: 1.0
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ ReflectorMaterial });
export { ReflectorMaterial };
