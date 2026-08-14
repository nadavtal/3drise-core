import { Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface GlowMaterialUniforms {
    u_time: {
        value: number;
    };
    u_intensity: {
        value: number;
    };
    u_falloff: {
        value: number;
    };
    u_pulseSpeed: {
        value: number;
    };
    u_pulseAmount: {
        value: number;
    };
    u_shellScale: {
        value: number;
    };
    u_innerColor: {
        value: Vector3;
    };
    u_outerColor: {
        value: Vector3;
    };
}

// Vertex shader
const vertexShader = /*glsl*/ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
// Fragment shader
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform float u_intensity;
  uniform float u_falloff;
  uniform float u_pulseSpeed;
  uniform float u_pulseAmount;
  uniform float u_shellScale;
  uniform vec3 u_innerColor;
  uniform vec3 u_outerColor;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    // Rendered on a BackSide shell: visible fragments face AWAY from the
    // camera, so the dot is negative. -dot is 0 at the outer silhouette and
    // maximal at the core limb. The max depends on the shell scale, so it is
    // derived from u_shellScale: sqrt(1 - 1/scale^2).
    float facing = -dot(normalize(vNormal), normalize(vViewDir));
    float maxFacing = sqrt(max(1.0 - 1.0 / (u_shellScale * u_shellScale), 0.05));
    float t2 = clamp(facing / maxFacing, 0.0, 1.0);
    float intensity = pow(t2, u_falloff);
    intensity *= (1.0 - u_pulseAmount) + u_pulseAmount * (0.5 + 0.5 * sin(u_time * u_pulseSpeed));
    vec3 col = mix(u_innerColor, u_outerColor, t2);
    gl_FragColor = vec4(col * intensity * u_intensity, intensity);
  }
`;
// Create the shader material with uniforms
const GlowMaterial = shaderMaterial({
    u_time: 0,
    u_intensity: 1.5,
    u_falloff: 1.8,
    u_pulseSpeed: 0.7,
    u_pulseAmount: 0.3,
    u_shellScale: 1.25,
    u_innerColor: new Vector3(1.0, 0.3, 0.03),
    u_outerColor: new Vector3(1.0, 0.62, 0.22)
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ GlowMaterial });
export { GlowMaterial };
