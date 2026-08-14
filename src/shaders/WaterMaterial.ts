import { Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { effectsUniforms } from "./effects/EffectsUniforms";
import type { EffectsUniforms } from './effects/EffectsUniforms';
import { effectsVertexGLSL } from "./effects/EffectsVertexFunctions.glsl";
import { effectsFragmentGLSL } from "./effects/EffectsFragmentFunctions.glsl";
export interface WaterMaterialUniforms extends EffectsUniforms {
    u_time: {
        value: number;
    };
    u_seaHeight: {
        value: number;
    };
    u_seaChoppy: {
        value: number;
    };
    u_seaSpeed: {
        value: number;
    };
    u_seaFreq: {
        value: number;
    };
    u_seaBaseColor: {
        value: Vector3;
    };
    u_seaWaterColor: {
        value: Vector3;
    };
    u_iterFragment: {
        value: number;
    };
    u_reflectionColor: {
        value: Vector3;
    };
    envMap: {
        value: any;
    };
    envMapIntensity: {
        value: number;
    };
}

// Vertex shader - pass world position for mesh sync
const vertexShader = /*glsl*/ `
${effectsVertexGLSL}
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Apply general ripple effect to deform water surface
    if (uGeneralRippleEnabled) {
      pos = applyGeneralRipple(pos);
    }
    
    vPosition = pos;
    
    // Calculate world position using the ripple-modified position
    vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    
    vWorldPosition = worldPos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
// Fragment shader - high-quality mesh-based water that reacts to scene lighting
const fragmentShader = /*glsl*/ `
${effectsFragmentGLSL}

  uniform float u_seaHeight;
  uniform float u_seaChoppy;
  uniform float u_seaSpeed;
  uniform float u_seaFreq;
  uniform vec3 u_seaBaseColor;
  uniform vec3 u_seaWaterColor;
  uniform float u_iterFragment;
  uniform vec3 u_reflectionColor;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  // Include Three.js lighting and environment mapping
  #include <common>
  #include <lights_pars_begin>
  
  // Manual environment mapping uniforms
  uniform samplerCube envMap;
  uniform float envMapIntensity;

  float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));	
    return fract(sin(h) * 43758.5453123);
  }
  
  float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);	
    vec2 u = f * f * (3.0 - 2.0 * f);
    return -1.0 + 2.0 * mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), 
      u.y
    );
  }

  // High-quality sea wave function from OceanMaterial
  float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);        
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
  }

  // Generate detailed water height using world position (5 iterations for quality)
  float getWaterHeight(vec2 worldPos) {
    float freq = u_seaFreq;
    float amp = u_seaHeight;
    float choppy = u_seaChoppy;
    
    vec2 uv = worldPos; 
    uv.x *= 0.75;
    
    float SEA_TIME = 1.0 + u_time * u_seaSpeed;
    mat2 octave_m = mat2(1.6, 1.2, -1.2, 1.6);
    
    float d, h = 0.0;    
    for(int i = 0; i < 5; i++) {        
      if(float(i) >= u_iterFragment) break;
      d = sea_octave((uv + SEA_TIME) * freq, choppy);
      d += sea_octave((uv - SEA_TIME) * freq, choppy);
      h += d * amp;        
      uv *= octave_m; 
      freq *= 1.9; 
      amp *= 0.22;
      choppy = mix(choppy, 1.0, 0.2);
    }
    return h;
  }

  // Calculate water normal using world position
  vec3 getWaterNormal(vec2 worldPos, float eps) {
    float h = getWaterHeight(worldPos);
    float hx = getWaterHeight(worldPos + vec2(eps, 0.0)) - h;
    float hz = getWaterHeight(worldPos + vec2(0.0, eps)) - h;
    return normalize(vec3(-hx, eps, -hz));
  }

  // Sky color calculation using environment mapping
  vec3 getSkyColor(vec3 reflectedDir) {
    // Use envMapIntensity to check if environment mapping is enabled
    if (envMapIntensity > 0.0) {
      vec4 envColor = textureCube(envMap, reflectedDir);
      return envColor.rgb * envMapIntensity;
    } else {
      // Fallback sky color
      vec3 e = normalize(reflectedDir);
      e.y = (max(e.y, 0.0) * 0.8 + 0.2) * 0.8;
      return vec3(pow(1.0 - e.y, 2.0), 1.0 - e.y, 0.6 + (1.0 - e.y) * 0.4) * 1.1;
    }
  }

  // Lighting from OceanMaterial
  float diffuse(vec3 n, vec3 l, float p) {
    return pow(dot(n, l) * 0.4 + 0.6, p);
  }
  
  float specular(vec3 n, vec3 l, vec3 e, float s) {    
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e, n), l), 0.0), s) * nrm;
  }

  void main() {
    // Use world position for wave calculations (syncs with mesh)
    vec2 waterPos = vWorldPosition.xz;
    
    // Calculate water height and normal with high detail
    float waterHeight = getWaterHeight(waterPos);
    vec3 normal = getWaterNormal(waterPos, 0.1);
    
    // Calculate view direction
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    
    // Fresnel effect
    float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
    fresnel = min(fresnel * fresnel * fresnel, 0.5);
    
    // Simple default lighting for now - will be enhanced with scene lights
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
    float NdotL = max(dot(normal, lightDir), 0.0);
    vec3 totalLight = vec3(0.3, 0.4, 0.5) + vec3(1.0, 0.95, 0.8) * NdotL * 0.7;
    
    // Add environment-based lighting if available
    if (envMapIntensity > 0.0) {
      vec3 envAmbient = textureCube(envMap, normal).rgb * 0.2 * envMapIntensity;
      totalLight += envAmbient;
    }
    
    // Calculate reflections using environment map or fallback to sky color
    vec3 reflectedDir = reflect(-viewDir, normal);
    vec3 reflected;
    
    if (envMapIntensity > 0.0) {
      // Use environment map for reflections (captures scene objects)
      // Transform reflection direction to world space for cube texture sampling
      vec3 worldReflectedDir = normalize(reflectedDir);
      reflected = textureCube(envMap, worldReflectedDir).rgb;
      
      // Apply intensity and ensure we see the reflection
      reflected *= envMapIntensity;
    } else {
      // Fallback to sky color
      reflected = getSkyColor(reflectedDir);
    }
    
    // Base refracted color
    vec3 refracted = u_seaBaseColor + u_seaWaterColor * 0.12;
    
    // Mix refracted and reflected based on fresnel
    // Boost reflection visibility for testing
    float reflectionStrength = envMapIntensity > 0.0 ? max(fresnel, 0.3) : fresnel;
    vec3 color = mix(refracted, reflected, reflectionStrength);
    
    // Add depth variation based on wave height
    color += u_seaWaterColor * waterHeight * 0.18;
    
    // Apply lighting
    color *= totalLight;
    
    // Apply fragment effects ONLY (no vortex effects in this shader)
    // Use world position directly - effects functions will handle pointer scaling
    color = applyAllFragmentEffects(color, waterPos, u_pointer);
    
    // Post processing (gamma correction like OceanMaterial)
    gl_FragColor = vec4(pow(color, vec3(0.65)), 1.0);
  }
`;
// Create the shader material with uniforms
const WaterMaterial = shaderMaterial({
    // Spread effects uniforms
    ...effectsUniforms,
    uGeneralRippleEnabled: false,
    // Water-specific uniforms
    u_time: 0,
    u_seaHeight: 0.6,
    u_seaChoppy: 4.0,
    u_seaSpeed: 0.8,
    u_seaFreq: 0.16,
    u_iterFragment: 5,
    u_seaBaseColor: new Vector3(0.0, 0.09, 0.18),
    u_seaWaterColor: new Vector3(0.8 * 0.6, 0.9 * 0.6, 0.6 * 0.6),
    u_reflectionColor: new Vector3(0.5, 0.7, 1.0),
    // Environment mapping uniforms
    envMap: null,
    envMapIntensity: 0.0
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ WaterMaterial });
export { WaterMaterial };
