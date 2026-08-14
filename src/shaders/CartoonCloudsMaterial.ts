import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
export interface CartoonCloudsUniforms {
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
    u_rimColor: {
        value: Vector3;
    };
    u_puffiness: {
        value: number;
    };
    u_softness: {
        value: number;
    };
}

const cartoonCloudsVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const cartoonCloudsFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_cameraPos;
  uniform vec3 u_cloudColor;
  uniform vec3 u_rimColor;
  uniform float u_puffiness;
  uniform float u_softness;

  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  ${commonNoiseFunctions}
  
  void main() {
    vec2 uv = vUv;
    vec3 spherePos = normalize(vPosition);
    
    // Create puffy cloud shapes
    float cloud = fbm(spherePos * 3.0 + vec3(u_time, 0.0, u_time * 0.5));
    cloud = smoothstep(0.3, 0.7, cloud + u_puffiness);
    
    // Add rim lighting effect
    float rim = 1.0 - dot(spherePos, vec3(0.0, 0.0, 1.0));
    rim = pow(rim, 2.0);
    
    // Soft edges
    cloud = smoothstep(0.0, u_softness, cloud);
    
    vec3 color = mix(u_cloudColor, u_rimColor, rim * 0.5);
    
    gl_FragColor = vec4(color, cloud);
  }
`;
export const CartoonCloudsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_cameraPos: new Vector3(0, 0, 0),
    u_cloudColor: new Vector3(0.95, 0.95, 1.0),
    u_rimColor: new Vector3(1.0, 0.9, 0.7),
    u_puffiness: 0.2,
    u_softness: 0.3,
}, cartoonCloudsVertex, cartoonCloudsFragment);
extend({ CartoonCloudsMaterial });
