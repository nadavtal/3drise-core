import { Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { NOISE_GLSL } from "./sunNoise";
export interface LavaMaterialUniforms {
    u_time: {
        value: number;
    };
    u_speed: {
        value: number;
    };
    u_cellScale: {
        value: number;
    };
    u_warpStrength: {
        value: number;
    };
    u_boilAmplitude: {
        value: number;
    };
    u_crackIntensity: {
        value: number;
    };
    u_spotIntensity: {
        value: number;
    };
    u_rimIntensity: {
        value: number;
    };
    u_brightness: {
        value: number;
    };
    u_rimColor: {
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
    u_color4: {
        value: Vector3;
    };
    u_color5: {
        value: Vector3;
    };
}

// Vertex shader
const vertexShader = /*glsl*/ `
  uniform float u_time;
  uniform float u_speed;
  uniform float u_boilAmplitude;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  ${NOISE_GLSL}

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);

    float t = u_time * u_speed;
    float boil = fbm(position * 1.1 + vec3(0.0, t * 0.04, t * 0.03));
    vec3 displaced = position + normal * boil * u_boilAmplitude;

    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
// Fragment shader
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform float u_speed;
  uniform float u_cellScale;
  uniform float u_warpStrength;
  uniform float u_crackIntensity;
  uniform float u_spotIntensity;
  uniform float u_rimIntensity;
  uniform float u_brightness;
  uniform vec3 u_rimColor;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform vec3 u_color4;
  uniform vec3 u_color5;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  ${NOISE_GLSL}

  vec3 sunRamp(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 col = mix(u_color1, u_color2, smoothstep(0.00, 0.28, t));
    col = mix(col, u_color3, smoothstep(0.28, 0.55, t));
    col = mix(col, u_color4, smoothstep(0.55, 0.78, t));
    col = mix(col, u_color5, smoothstep(0.78, 1.00, t));
    return col;
  }

  void main() {
    float t = u_time * u_speed;

    vec3 p = vPosition * u_cellScale;

    // Double domain warp: plasma smears and curls instead of scrolling.
    vec3 q = vec3(
      fbm(p + vec3(0.0, 0.0,  t * 0.07)),
      fbm(p + vec3(5.2, 1.3,  t * 0.06)),
      fbm(p + vec3(2.8, 8.3, -t * 0.06))
    );

    vec3 r = vec3(
      fbm(p + 1.8 * u_warpStrength * q + vec3(1.7, 9.2, t * 0.12)),
      fbm(p + 1.8 * u_warpStrength * q + vec3(8.3, 2.8, t * 0.11)),
      fbm(p + 1.8 * u_warpStrength * q + vec3(4.1, 5.6, t * 0.10))
    );

    float flow = fbm(p + 2.0 * u_warpStrength * r + vec3(0.0, 0.0, t * 0.04));
    flow = flow * 0.5 + 0.5;

    // Bright filament cracks between convection cells.
    float cracks = ridgedFbm(p * 0.9 + r * 1.2 + vec3(0.0, t * 0.05, 0.0));
    cracks = smoothstep(1.05, 1.55, cracks);

    // Sunspots: rare dark patches with a dimmed penumbra ring.
    float spotField = fbm(vPosition * 1.1 + vec3(13.7, 7.1, t * 0.015));
    float spots = smoothstep(0.42, 0.72, spotField);
    float penumbra = smoothstep(0.30, 0.42, spotField) - spots;

    float temp = flow * 0.85 + length(q) * 0.18;
    temp += cracks * u_crackIntensity;
    temp -= spots * 0.85 * u_spotIntensity;
    temp -= penumbra * 0.35 * u_spotIntensity;

    vec3 col = sunRamp(temp);

    float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0), 2.5);
    col += u_rimColor * fresnel * u_rimIntensity;
    col += vec3(1.0, 0.85, 0.55) * cracks * u_crackIntensity * 0.6;

    col *= u_brightness;
    col = col / (1.0 + 0.18 * col);

    gl_FragColor = vec4(col, 1.0);
  }
`;
// Create the shader material with uniforms
const LavaMaterial = shaderMaterial({
    u_time: 0,
    u_speed: 0.1,
    u_cellScale: 1.3,
    u_warpStrength: 1.0,
    u_boilAmplitude: 0.028,
    u_crackIntensity: 0.3,
    u_spotIntensity: 1.0,
    u_rimIntensity: 1.6,
    u_brightness: 1.0,
    u_rimColor: new Vector3(1.0, 0.45, 0.08),
    u_color1: new Vector3(0.18, 0.005, 0.0),
    u_color2: new Vector3(0.62, 0.07, 0.005),
    u_color3: new Vector3(1.0, 0.34, 0.02),
    u_color4: new Vector3(1.0, 0.72, 0.18),
    u_color5: new Vector3(1.0, 0.97, 0.78)
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ LavaMaterial });
export { LavaMaterial };
