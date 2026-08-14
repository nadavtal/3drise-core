import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
export interface FireUniforms {
    u_time: number;
    u_intensity: number;
    u_speed: number;
    u_turbulence: number;
    u_sway: number;
    u_radius: number;
    u_height: number;
    u_tint: THREE.Color;
}

export type FireMaterialImpl = THREE.ShaderMaterial & FireUniforms;

declare module '@react-three/fiber' {
    interface ThreeElements {
        fireMaterial: ThreeElements['shaderMaterial'] & Partial<FireUniforms>;
    }
}

const defaults = {
    u_time: 0,
    u_intensity: 1.0,
    u_speed: 1.0,
    u_turbulence: 1.5,
    u_sway: 1.0,
    u_radius: 1.0,
    u_height: 2.5,
    u_tint: new THREE.Color(1, 1, 1),
};
const vertexShader = /*glsl*/ `
  attribute vec3 a_offset;
  attribute vec2 a_size;
  attribute float a_seed;

  uniform float u_radius;
  uniform float u_height;

  varying vec2 vUv;
  varying float vSeed;

  void main() {
    // x in [-1,1], y in [0,1] — flame-space coordinates, geometry-size independent.
    vUv = vec2(uv.x * 2.0 - 1.0, uv.y);
    vSeed = a_seed;

    // Cylindrical world-space billboard around this tongue's anchor.
    vec3 center   = (modelMatrix * vec4(a_offset, 1.0)).xyz;
    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 right    = normalize(vec3(camRight.x, 0.0, camRight.z) + vec3(1e-5));

    vec3 world = center
      + right * vUv.x * (a_size.x * u_radius)
      + vec3(0.0, 1.0, 0.0) * vUv.y * (a_size.y * u_height);

    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  precision highp float;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_speed;
  uniform float u_turbulence;
  uniform float u_sway;
  uniform vec3  u_tint;

  varying vec2  vUv;
  varying float vSeed;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),                  hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p = ROT * p * 2.03 + vec2(1.7);
      a *= 0.5;
    }
    return s;
  }

  // Blackbody-style temperature ramp.
  vec3 blackbody(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c = mix(vec3(0.015, 0.0, 0.0), vec3(0.85, 0.16, 0.01), smoothstep(0.00, 0.32, t));
    c = mix(c, vec3(1.0, 0.55, 0.06), smoothstep(0.28, 0.62, t));
    c = mix(c, vec3(1.0, 0.93, 0.55), smoothstep(0.58, 0.88, t));
    c = mix(c, vec3(1.0, 1.0, 0.98),  smoothstep(0.85, 1.00, t));
    return c;
  }

  // One advected, domain-warped flame layer. Returns occupancy in [0,1].
  float flameLayer(vec2 uv, float t, float widthMul, float speedMul, vec2 seed, out float nOut) {
    vec2 p = vec2(uv.x * 2.4, uv.y * 3.2 - t * speedMul) + seed;

    float q = fbm(p);
    vec2 r = vec2(
      fbm(p + q + vec2(1.7, 9.2) - t * 0.25),
      fbm(p + q + vec2(8.3, 2.8) - t * 0.45)
    );
    float n = fbm(p + u_turbulence * r);
    nOut = n;

    // Tapered half-width and tip sway that grows with height.
    float w = mix(0.46, 0.05, pow(uv.y, 1.35)) * widthMul;
    float x = uv.x + (n - 0.5) * (0.25 + uv.y * 1.15) * u_sway;

    float body = 1.0 - smoothstep(0.0, w, abs(x));
    float env  = smoothstep(-0.02, 0.12, uv.y)
               * (1.0 - smoothstep(0.30, 0.98, uv.y - (n - 0.5) * 0.85));

    return clamp(body * env, 0.0, 1.0);
  }

  void main() {
    vec2 uv = vUv;

    // Decorrelate tongues: each gets its own phase, speed, and noise seed.
    float t = u_time * u_speed * (0.85 + 0.30 * fract(vSeed * 0.137));
    vec2 sd = vec2(fract(vSeed * 0.731) * 19.0, fract(vSeed * 0.317) * 23.0);

    float nA, nB;
    float outer = flameLayer(uv, t, 1.0, 2.0, sd, nA);
    float core  = flameLayer(vec2(uv.x, (uv.y - 0.02) * 1.25), t, 0.42, 2.6, sd + vec2(4.7, 1.3), nB);

    // Temperature field
    float T = pow(outer, 1.55) * (0.78 + 0.45 * nA);
    T += pow(core, 1.8) * 0.85;
    T *= u_intensity;

    vec3 col = blackbody(T) * u_tint;

    // Soft radiant halo around the body
    float halo = (1.0 - smoothstep(0.0, 1.0, length(vec2(uv.x, (uv.y - 0.22) * 1.4)))) * 0.10;
    col += vec3(0.55, 0.16, 0.02) * halo * u_intensity;

    // Faint premixed-gas blue at the base
    float blue = (1.0 - smoothstep(0.0, 0.16, uv.y)) * smoothstep(0.0, 0.25, outer);
    col += vec3(0.10, 0.25, 0.90) * blue * 0.35 * u_intensity;

    float alpha = clamp(T * 1.4 + halo, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;
export const FireMaterial = shaderMaterial({ ...defaults, u_tint: defaults.u_tint.clone() }, vertexShader, fragmentShader, (m) => {
    if (!m)
        return;
    m.transparent = true;
    m.blending = THREE.AdditiveBlending;
    m.depthWrite = false;
    m.side = THREE.DoubleSide;
});
extend({ FireMaterial });
