import { Vector2, Vector3 } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
export interface PainterlyCloudsUniforms {
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
    u_brushSize: {
        value: number;
    };
    u_paintTexture: {
        value: Texture | null;
    };
    u_baseColor: {
        value: Vector3;
    };
    u_highlightColor: {
        value: Vector3;
    };
    u_brushStrokes: {
        value: number;
    };
    u_hasText: {
        value: number;
    };
}

const painterlyCloudsVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const painterlyCloudsFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_cameraPos;
  uniform vec3 u_cloudColor;
  uniform float u_brushSize;
  uniform sampler2D u_paintTexture;
  uniform vec3 u_baseColor;
  uniform vec3 u_highlightColor;
  uniform float u_brushStrokes;
  uniform float u_hasText;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  ${commonNoiseFunctions}
  
  void main() {
    vec3 spherePos = normalize(vPosition);
    
    // Create painterly brush stroke patterns
    vec2 brushUV = vUv * u_brushSize + vec2(u_time * 0.02, 0.0);
    float brushPattern = noise(vec3(brushUV * u_brushStrokes, u_time * 0.1));
    
    // Cloud formation with artistic distortion
    float cloud = fbm(spherePos * 2.0 + vec3(u_time * 0.05));
    cloud = smoothstep(0.3, 0.8, cloud + brushPattern * 0.3);
    
    // Paint texture sampling (if available)
    vec3 paintColor = u_baseColor;
    if (u_hasText > 0.5) {
      vec4 paint = texture2D(u_paintTexture, brushUV);
      paintColor = mix(u_baseColor, u_highlightColor, paint.r);
    }
    
    // Artistic color variation
    vec3 color = mix(paintColor, u_highlightColor, brushPattern * 0.5);
    
    gl_FragColor = vec4(color, cloud);
  }
`;
export const PainterlyCloudsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_cameraPos: new Vector3(0, 0, 0),
    u_cloudColor: new Vector3(0.9, 0.9, 0.95),
    u_brushSize: 2.0,
    u_paintTexture: null,
    u_baseColor: new Vector3(0.9, 0.9, 0.95),
    u_highlightColor: new Vector3(1.0, 0.95, 0.8),
    u_brushStrokes: 8.0,
    u_hasText: 0.0
}, painterlyCloudsVertex, painterlyCloudsFragment);
extend({ PainterlyCloudsMaterial });
