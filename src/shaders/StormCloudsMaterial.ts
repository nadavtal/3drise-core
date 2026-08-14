import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
export interface StormCloudsUniforms {
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
    u_stormIntensity: {
        value: number;
    };
    u_lightningFreq: {
        value: number;
    };
    u_darkColor: {
        value: Vector3;
    };
    u_lightColor: {
        value: Vector3;
    };
    u_turbulence: {
        value: number;
    };
}

const stormCloudsVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const stormCloudsFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_cameraPos;
  uniform vec3 u_cloudColor;
  uniform float u_stormIntensity;
  uniform float u_lightningFreq;
  uniform vec3 u_darkColor;
  uniform vec3 u_lightColor;
  uniform float u_turbulence;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  ${commonNoiseFunctions}
  
  void main() {
    vec3 spherePos = normalize(vPosition);
    
    // Heavy, turbulent cloud formation
    float storm = fbm(spherePos * 2.0 + vec3(u_time * 0.3, u_time * 0.1, 0.0));
    storm += noise(spherePos * 8.0 + vec3(u_time * u_turbulence)) * 0.3;
    
    // Lightning flashes
    float lightning = sin(u_time * u_lightningFreq) * sin(u_time * u_lightningFreq * 1.7);
    lightning = max(0.0, lightning);
    lightning *= noise(spherePos * 10.0 + vec3(u_time * 2.0));
    
    // Dark storm clouds with bright lightning
    vec3 stormColor = mix(u_darkColor, u_lightColor, lightning * 0.8);
    float density = smoothstep(0.2, 0.8, storm * u_stormIntensity);
    
    gl_FragColor = vec4(stormColor, density);
  }
`;
export const StormCloudsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_cameraPos: new Vector3(0, 0, 0),
    u_cloudColor: new Vector3(0.3, 0.3, 0.4),
    u_stormIntensity: 1.2,
    u_lightningFreq: 3.0,
    u_darkColor: new Vector3(0.1, 0.1, 0.2),
    u_lightColor: new Vector3(0.9, 0.9, 1.0),
    u_turbulence: 0.5
}, stormCloudsVertex, stormCloudsFragment);
extend({ StormCloudsMaterial });
