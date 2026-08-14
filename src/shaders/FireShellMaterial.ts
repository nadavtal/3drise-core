import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
export interface FireShellUniforms {
    u_time: number;
    u_intensity: number;
    u_speed: number;
    u_turbulence: number;
    u_freq: number;
    u_shell: number;
    u_coverage: number;
    u_baseY: number;
    u_spanY: number;
    u_tint: THREE.Color;
}

export type FireShellMaterialImpl = THREE.ShaderMaterial & FireShellUniforms;

declare module '@react-three/fiber' {
    interface ThreeElements {
        fireShellMaterial: ThreeElements['shaderMaterial'] & Partial<FireShellUniforms>;
    }
}

const defaults = {
    u_time: 0,
    u_intensity: 1.0,
    u_speed: 1.0,
    u_turbulence: 1.5,
    u_freq: 2.2,
    u_shell: 0.05,
    u_coverage: 0.8,
    u_baseY: 0,
    u_spanY: 1,
    u_tint: new THREE.Color(1, 1, 1),
};
const vertexShader = /*glsl*/ `
  uniform float u_time;
  uniform float u_speed;
  uniform float u_shell;

  varying vec3  vWorldPos;
  varying vec3  vWorldNormal;
  varying float vWobble;

  void main() {
    vec3 wn = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);

    // Low-frequency lick: the shell breathes and drags upward.
    float wob = 0.5 + 0.5 * sin(wp.y * 3.1 + u_time * u_speed * 4.0 + wp.x * 2.3 + wp.z * 1.7);

    vec3 displaced = wp.xyz
      + wn * u_shell * (0.7 + 0.6 * wob)          // inflate along normal
      + vec3(0.0, u_shell * 1.6 * wob, 0.0);      // convective upward drag

    vWorldPos = displaced;
    vWorldNormal = wn;
    vWobble = wob;

    gl_Position = projectionMatrix * viewMatrix * vec4(displaced, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  precision highp float;

  uniform float u_time;
  uniform float u_intensity;
  uniform float u_speed;
  uniform float u_turbulence;
  uniform float u_freq;
  uniform float u_coverage;
  uniform float u_baseY;
  uniform float u_spanY;
  uniform vec3  u_tint;

  varying vec3  vWorldPos;
  varying vec3  vWorldNormal;
  varying float vWobble;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.13));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), u.x),
          mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), u.x), u.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), u.x),
          mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), u.x), u.y),
      u.z
    );
  }

  float fbm3(vec3 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * noise3(p);
      p = p * 2.04 + vec3(1.7);
      a *= 0.5;
    }
    return s;
  }

  vec3 blackbody(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c = mix(vec3(0.015, 0.0, 0.0), vec3(0.85, 0.16, 0.01), smoothstep(0.00, 0.32, t));
    c = mix(c, vec3(1.0, 0.55, 0.06), smoothstep(0.28, 0.62, t));
    c = mix(c, vec3(1.0, 0.93, 0.55), smoothstep(0.58, 0.88, t));
    c = mix(c, vec3(1.0, 1.0, 0.98),  smoothstep(0.85, 1.00, t));
    return c;
  }

  void main() {
    // Rising, domain-warped temperature field in world space.
    vec3 p = vWorldPos * u_freq;
    p.y -= u_time * u_speed * 1.6;
    float q = fbm3(p);
    float n = fbm3(p + u_turbulence * vec3(q, q * 0.7, q));

    // Fresnel: flames live on the silhouette → reads as a volume.
    vec3 V = normalize(cameraPosition - vWorldPos);
    float fres = pow(1.0 - abs(dot(V, normalize(vWorldNormal))), 1.5);

    // Top-down coverage gate, eaten by noise so the burn line is ragged.
    float hNorm = clamp((vWorldPos.y - u_baseY) / u_spanY, 0.0, 1.0);
    float gate = smoothstep(
      1.0 - u_coverage - 0.25,
      1.0 - u_coverage + 0.25,
      hNorm + (n - 0.5) * 0.7
    );

    float T = n * (0.35 + 0.65 * fres) * gate;
    T = pow(clamp(T * 1.6, 0.0, 1.0), 1.7);
    T *= u_intensity * (0.8 + 0.4 * vWobble);

    vec3 col = blackbody(T) * u_tint;

    // Faint ember glow on the burning region even where flames are thin.
    col += vec3(0.5, 0.08, 0.0) * gate * fres * 0.18 * u_intensity;

    float alpha = clamp(T * 1.5 + gate * fres * 0.12, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;
export const FireShellMaterial = shaderMaterial({ ...defaults, u_tint: defaults.u_tint.clone() }, vertexShader, fragmentShader, (m) => {
    if (!m)
        return;
    m.transparent = true;
    m.blending = THREE.AdditiveBlending;
    m.depthWrite = false;
    m.side = THREE.FrontSide;
});
extend({ FireShellMaterial });
