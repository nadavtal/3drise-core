import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
export interface CirrusCloudsUniforms {
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
    u_windSpeed: {
        value: number;
    };
    u_transparency: {
        value: number;
    };
    u_streakiness: {
        value: number;
    };
}

const cirrusCloudsVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const cirrusCloudsFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_cameraPos;
  uniform vec3 u_cloudColor;
  uniform float u_windSpeed;
  uniform float u_transparency;
  uniform float u_streakiness;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  ${commonNoiseFunctions}
  
  void main() {
    vec3 spherePos = normalize(vPosition);
    
    // Create streaky, wispy patterns
    vec3 windOffset = vec3(u_time * u_windSpeed, 0.0, u_time * u_windSpeed * 0.3);
    float cirrus = noise(spherePos * 4.0 + windOffset);
    
    // Add streakiness
    float streaks = noise(vec3(spherePos.x * u_streakiness, spherePos.y * 2.0, spherePos.z) + windOffset);
    cirrus *= streaks;
    
    // Very thin, transparent clouds
    float alpha = smoothstep(0.3, 0.7, cirrus) * u_transparency;
    
    gl_FragColor = vec4(u_cloudColor, alpha);
  }
`;
export const CirrusCloudsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_cameraPos: new Vector3(0, 0, 0),
    u_cloudColor: new Vector3(1.0, 1.0, 1.0),
    u_windSpeed: 0.05,
    u_transparency: 0.4,
    u_streakiness: 8.0,
}, cirrusCloudsVertex, cirrusCloudsFragment);
extend({ CirrusCloudsMaterial });
