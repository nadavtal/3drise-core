import { Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface SerpentFlowMaterialUniforms {
    u_time: {
        value: number;
    };
    u_colorA: {
        value: Vector3;
    };
    u_colorB: {
        value: Vector3;
    };
    u_colorC: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_width: {
        value: number;
    };
    u_shimmer: {
        value: number;
    };
}

const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;
  uniform float u_speed;
  uniform float u_width;
  uniform float u_shimmer;
  varying vec2 vUv;
  varying vec3 vPosition;

  float sn(float x) {
    return sin(x) * 0.5 + 0.5;
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5);
    float b = fract(sin(dot(i + vec2(1,0), vec2(127.1, 311.7))) * 43758.5);
    float c = fract(sin(dot(i + vec2(0,1), vec2(127.1, 311.7))) * 43758.5);
    float d = fract(sin(dot(i + vec2(1,1), vec2(127.1, 311.7))) * 43758.5);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x;
    float across = vUv.y - 0.5;

    // Undulating centerline — the "serpent" body
    float wave1 = sin(along * 6.28 * 2.0 - t * 2.5) * 0.15;
    float wave2 = sin(along * 6.28 * 3.7 + t * 1.3) * 0.08;
    float wave3 = sin(along * 6.28 * 0.8 - t * 0.7) * 0.12;
    float center = wave1 + wave2 + wave3;

    float dist = abs(across - center);

    float beam = smoothstep(u_width, 0.0, dist);
    float innerBeam = smoothstep(u_width * 0.4, 0.0, dist);

    // Iridescent color shift — three hues 120° out of phase
    float hueShift = along * 3.0 - t * 1.5;
    float colorMix1 = sn(hueShift);
    float colorMix2 = sn(hueShift + 2.094);
    float colorMix3 = sn(hueShift + 4.189);

    float total = colorMix1 + colorMix2 + colorMix3;
    vec3 iridescent = (u_colorA * colorMix1 + u_colorB * colorMix2 + u_colorC * colorMix3) / total;

    // Shimmer — fast noise riding on the beam
    float shimNoise = smoothNoise(vec2(along * 12.0 - t * 4.0, across * 8.0));
    float shimmer = (shimNoise * 0.5 + 0.5) * u_shimmer;

    // Bright caustic highlights
    float caustic = pow(max(0.0, 1.0 - dist / (u_width * 0.2)), 3.0);
    caustic *= sn(along * 20.0 - t * 6.0) * sn(along * 13.3 + t * 2.1);

    vec3 col = iridescent * beam;
    col += iridescent * shimmer * innerBeam;
    col += vec3(1.0) * caustic * 0.8;

    float alpha = beam + caustic * 0.5;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;
const SerpentFlowMaterial = shaderMaterial({
    u_time: 0,
    u_colorA: new Vector3(1.0, 0.2, 0.8), // Magenta
    u_colorB: new Vector3(0.1, 0.9, 1.0), // Cyan
    u_colorC: new Vector3(0.8, 1.0, 0.2), // Chartreuse
    u_speed: 0.6,
    u_width: 0.35,
    u_shimmer: 0.7,
}, vertexShader, fragmentShader);
extend({ SerpentFlowMaterial });
export { SerpentFlowMaterial };
