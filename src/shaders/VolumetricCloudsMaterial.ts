import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
export interface VolumetricCloudsUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_cameraPos: {
        value: Vector3;
    };
    u_cloudColor: {
        value: Vector3;
    };
    u_lightDirection: {
        value: Vector3;
    };
    u_cloudDensity: {
        value: number;
    };
    u_cloudCoverage: {
        value: number;
    };
    u_cloudScale: {
        value: number;
    };
    u_lightColor: {
        value: Vector3;
    };
    u_shadowColor: {
        value: Vector3;
    };
    u_absorption: {
        value: number;
    };
    u_scattering: {
        value: number;
    };
}

const volumetricCloudsVertex = /*glsl*/ `
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
const volumetricCloudsFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_cameraPos;
  uniform vec3 u_cloudColor;
  uniform vec3 u_lightDirection;
  uniform float u_cloudDensity;
  uniform float u_cloudCoverage;
  uniform float u_cloudScale;
  uniform vec3 u_lightColor;
  uniform vec3 u_shadowColor;
  uniform float u_absorption;
  uniform float u_scattering;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  ${commonNoiseFunctions}
  
  float cloudDensity(vec3 pos) {
    vec3 p = pos * u_cloudScale + vec3(u_time * 0.1, 0.0, u_time * 0.05);
    float density = fbm(p) - u_cloudCoverage;
    return max(0.0, density) * u_cloudDensity;
  }
  
  vec3 rayMarch(vec3 rayOrigin, vec3 rayDir, float maxDist) {
    vec3 color = vec3(0.0);
    float transmittance = 1.0;
    float stepSize = maxDist / 32.0;
    
    for (int i = 0; i < 32; i++) {
      vec3 pos = rayOrigin + rayDir * float(i) * stepSize;
      float density = cloudDensity(pos);
      
      if (density > 0.01) {
        // Light scattering calculation
        float lightDensity = cloudDensity(pos + u_lightDirection * stepSize);
        float scattering = exp(-lightDensity * u_scattering);
        
        vec3 lightContrib = u_lightColor * scattering * density * transmittance;
        color += lightContrib * stepSize;
        
        transmittance *= exp(-density * u_absorption * stepSize);
        
        if (transmittance < 0.01) break;
      }
    }
    
    return color + u_shadowColor * (1.0 - transmittance);
  }
  
  void main() {
    vec3 rayDir = normalize(vWorldPosition - u_cameraPos);
    vec3 color = rayMarch(vWorldPosition, rayDir, 10.0);
    
    // Mix with cloud color
    color = mix(color, u_cloudColor, 0.3);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;
export const VolumetricCloudsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_cameraPos: new Vector3(0, 0, 0),
    u_cloudColor: new Vector3(1.0, 1.0, 1.0),
    u_lightDirection: new Vector3(0.5, 1.0, 0.5),
    u_cloudDensity: 0.8,
    u_cloudCoverage: 0.4,
    u_cloudScale: 0.5,
    u_lightColor: new Vector3(1.0, 0.95, 0.8),
    u_shadowColor: new Vector3(0.3, 0.4, 0.6),
    u_absorption: 1.0,
    u_scattering: 0.5
}, volumetricCloudsVertex, volumetricCloudsFragment);
extend({ VolumetricCloudsMaterial });
