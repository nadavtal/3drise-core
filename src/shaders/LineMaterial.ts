import { Vector3, Vector2, Color } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface LineMaterialUniforms {
    u_time: {
        value: number;
    };
    u_pointer: {
        value: Vector2;
    };
    uColor: {
        value: Color;
    };
    intersectionPoint: {
        value: Vector3;
    };
    targetPoint: {
        value: Vector3;
    };
    rippleRadius: {
        value: number;
    };
    animationProgress: {
        value: number;
    };
}

// Vertex shader
// Tutorial: https://www.youtube.com/watch?v=f4s1h2YETNY
const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  uniform vec3 u_pointer;
  uniform float u_time;
  uniform float animationProgress;
  attribute vec3 targetPoint;
  uniform vec3 intersectionPoint;
  uniform float rippleRadius;
  varying float vProgress;
  varying float vDistance;

  void main() {
    vUv = uv;     
    vProgress = smoothstep(-1., 1., sin(vUv.x*10. + u_time));    
    float smoothFactor =  0.5;
    vec3 displacedPosition = position;
    if (animationProgress < 1.0) { 
      displacedPosition = mix(position, targetPoint, animationProgress);
    } else {
      displacedPosition = targetPoint;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);

    
  }
`;
// Fragment shader
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec3 u_pointer;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vProgress;
  varying float vDistance;
  void main() {    
    float maxDist = 0.05;      
    float hideCorners1 = smoothstep(0.0, 0.1, vUv.x);
    float hideCorners2 = smoothstep(1., 0.9, vUv.x);
    vec3 finalColor = mix(uColor, uColor*0.5, vProgress);

    
    gl_FragColor.rgba = vec4(finalColor.x + (u_pointer.x * 1.), finalColor.y , finalColor.z + (u_pointer.y * 1.), hideCorners1*hideCorners2 );

  }
`;
// Create the shader material with uniforms
const LineMaterial = shaderMaterial({
    u_time: 0,
    u_pointer: new Vector2(),
    uColor: new Color(0.1, 0.5, 0.6),
    intersectionPoint: new Vector3(),
    targetPoint: new Vector3(),
    rippleRadius: 1,
    animationProgress: 0.0,
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ LineMaterial });
export { LineMaterial };
