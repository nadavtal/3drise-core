import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
export interface NebulaCloudsUniforms {
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
    u_color1: {
        value: Vector3;
    };
    u_color2: {
        value: Vector3;
    };
    u_color3: {
        value: Vector3;
    };
    u_glowIntensity: {
        value: number;
    };
    u_complexity: {
        value: number;
    };
}

const nebulaCloudsVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const nebulaCloudsFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_cameraPos;
  uniform vec3 u_cloudColor;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_glowIntensity;
  uniform float u_complexity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  ${commonNoiseFunctions}
  
  void main() {
    vec3 spherePos = normalize(vPosition);
    
    // Multi-layered nebula effect
    float nebula1 = fbm(spherePos * u_complexity + vec3(u_time * 0.1));
    float nebula2 = fbm(spherePos * u_complexity * 0.5 + vec3(u_time * 0.05, u_time * 0.08, 0.0));
    float nebula3 = fbm(spherePos * u_complexity * 2.0 + vec3(0.0, u_time * 0.03, u_time * 0.07));
    
    // Color mixing based on noise layers
    vec3 color = u_color1 * nebula1;
    color += u_color2 * nebula2 * 0.7;
    color += u_color3 * nebula3 * 0.5;
    
    // Add glow effect
    color *= u_glowIntensity;
    
    float alpha = (nebula1 + nebula2 * 0.7 + nebula3 * 0.5) / 2.2;
    
    gl_FragColor = vec4(color, alpha);
  }
`;
export const NebulaCloudsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_cameraPos: new Vector3(0, 0, 0),
    u_cloudColor: new Vector3(0.6, 0.3, 0.8),
    u_color1: new Vector3(0.8, 0.2, 0.9),
    u_color2: new Vector3(0.2, 0.6, 1.0),
    u_color3: new Vector3(1.0, 0.4, 0.2),
    u_glowIntensity: 1.5,
    u_complexity: 3.0
}, nebulaCloudsVertex, nebulaCloudsFragment);
extend({ NebulaCloudsMaterial });
