import { Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface BasicWaterMaterialUniforms {
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
    u_reflectionColor: {
        value: Vector3;
    };
}

// Vertex shader - pass world position for mesh sync
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
// Fragment shader - simplified water with mesh coordinate sync
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform float u_seaHeight;
  uniform float u_seaChoppy;
  uniform float u_seaSpeed;
  uniform float u_seaFreq;
  uniform vec3 u_seaBaseColor;
  uniform vec3 u_seaWaterColor;
  uniform vec3 u_reflectionColor;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

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

  // Simplified sea wave function
  float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);        
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
  }

  // Generate water height using world position (syncs with mesh rotation)
  float getWaterHeight(vec2 worldPos) {
    float freq = u_seaFreq;
    float amp = u_seaHeight;
    float choppy = u_seaChoppy;
    
    // Use world position for wave calculations - this makes waves move with mesh
    vec2 uv = worldPos; 
    uv.x *= 0.75;
    
    float SEA_TIME = 1.0 + u_time * u_seaSpeed;
    mat2 octave_m = mat2(1.6, 1.2, -1.2, 1.6);
    
    float d, h = 0.0;    
    for(int i = 0; i < 3; i++) {        
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

  // Lighting calculation
  float diffuse(vec3 n, vec3 l, float p) {
    return pow(dot(n, l) * 0.4 + 0.6, p);
  }
  
  float specular(vec3 n, vec3 l, vec3 e, float s) {    
    float nrm = (s + 8.0) / (3.141592 * 8.0);
    return pow(max(dot(reflect(e, n), l), 0.0), s) * nrm;
  }

  void main() {
    // Use world position for wave calculations (syncs with mesh rotation)
    vec2 waterPos = vWorldPosition.xz;
    
    // Calculate water height and normal
    float waterHeight = getWaterHeight(waterPos);
    vec3 normal = getWaterNormal(waterPos, 0.1);
    
    // Calculate view direction
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    
    // Calculate Fresnel effect
    float fresnel = clamp(1.0 - dot(normal, viewDir), 0.0, 1.0);
    fresnel = fresnel * fresnel * fresnel;
    fresnel = min(fresnel, 0.5);
    
    // Base water color
    vec3 waterColor = u_seaBaseColor + u_seaWaterColor * 0.12;
    
    // Mix water color with reflection
    vec3 color = mix(waterColor, u_reflectionColor, fresnel);
    
    // Add depth variation based on wave height
    color += u_seaWaterColor * waterHeight * 0.18;
    
    // Add specular highlights
    vec3 lightDir = normalize(vec3(0.0, 1.0, 0.8));
    float spec = specular(normal, lightDir, viewDir, 60.0);
    color += vec3(spec * 0.5);
    
    // Apply lighting
    float lighting = diffuse(normal, lightDir, 1.0);
    color *= lighting;
    
    // Add some surface foam based on wave activity
    float foam = smoothstep(0.0, 0.1, abs(waterHeight)) * 0.3;
    color = mix(color, vec3(1.0), foam);
    
    gl_FragColor = vec4(pow(color, vec3(0.65)), 1.0);
  }
`;
// Create the shader material with uniforms
const BasicWaterMaterial = shaderMaterial({
    u_time: 0,
    u_seaHeight: 0.6,
    u_seaChoppy: 4.0,
    u_seaSpeed: 0.8,
    u_seaFreq: 0.16,
    u_seaBaseColor: new Vector3(0.0, 0.09, 0.18),
    u_seaWaterColor: new Vector3(0.8 * 0.6, 0.9 * 0.6, 0.6 * 0.6),
    u_reflectionColor: new Vector3(0.5, 0.7, 1.0)
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ BasicWaterMaterial });
export { BasicWaterMaterial };
