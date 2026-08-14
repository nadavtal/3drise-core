import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface TeslaArcMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_arcColor: {
        value: Vector3;
    };
    u_glowColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_intensity: {
        value: number;
    };
    u_forkDensity: {
        value: number;
    };
}

const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vPosition = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_arcColor;
  uniform vec3 u_glowColor;
  uniform float u_speed;
  uniform float u_intensity;
  uniform float u_forkDensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPos;

  float hash(float n)  { return fract(sin(n) * 43758.5453123); }
  float hash2(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float vnoise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
  }

  float fbm(float x) {
    float v = 0.0; float amp = 0.5; float freq = 1.0;
    for (int i = 0; i < 7; i++) {
      v += amp * vnoise(x * freq);
      amp *= 0.5; freq *= 2.17;
    }
    return v;
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x;
    float across = vUv.y - 0.5; // -0.5 → +0.5 across the quad

    vec3 col = vec3(0.0);
    float totalAlpha = 0.0;

    // ── 3 simultaneous arcs at staggered Y offsets ──────────────
    // Each arc has its own base position, speed variation, and color tint
    // so they look like independent discharge channels, not copies.

    float arcBaseY[3];
    arcBaseY[0] = -0.15;
    arcBaseY[1] =  0.0;
    arcBaseY[2] =  0.15;

    vec3 arcTint[3];
    arcTint[0] = vec3(0.3, 0.7, 1.0);   // cooler blue
    arcTint[1] = vec3(0.6, 0.9, 1.0);   // bright cyan (brightest, center)
    arcTint[2] = vec3(0.1, 0.5, 0.9);   // deeper blue

    for (int k = 0; k < 3; k++) {
      float kf = float(k);

      // Each arc travels at a slightly different speed so they desync over time
      float speed = t * (2.5 + kf * 0.4);

      float phase = along * 8.0 + kf * 3.7 - speed;
      float arc   = fbm(phase) - 0.5;
      arc        += fbm(phase * 2.3 + 17.4) * 0.3;

      // Per-arc flicker — different seeds so they don't strobe together
      float flicker = hash(floor(t * 12.0) + floor(along * u_forkDensity) + kf * 31.0);
      arc *= 0.9 + flicker * 0.2;

      float baseY = arcBaseY[k];
      float dist  = abs((across - baseY) - arc * 0.28);

      float core      = exp(-dist * 90.0) * u_intensity * 2.0;
      float innerGlow = exp(-dist * 28.0) * u_intensity * 0.7;
      float halo      = exp(-dist * 9.0)  * u_intensity * 0.2;

      // Micro-forks per arc
      float forkT     = floor(along * u_forkDensity * 2.0);
      float forkPhase = hash2(vec2(forkT + kf * 10.0, floor(t * 8.0)));
      float forkAlong = fract(along * u_forkDensity * 2.0);
      float forkDist  = abs((across - baseY) - (forkPhase - 0.5) * 0.4 * forkAlong);
      float fork      = exp(-forkDist * 65.0) * (1.0 - forkAlong)
                        * step(0.35, forkPhase) * u_intensity * 1.2;

      // Rapid pulse — each arc has its own phase so they don't all dim at once
      float pulse = 0.75 + 0.25 * sin(t * 28.0 + along * 18.0 + kf * 2.1);

      col += arcTint[k] * (innerGlow + fork) * pulse;
      col += u_glowColor * halo * pulse;
      col += vec3(1.0) * core * pulse;   // white-hot core

      totalAlpha += innerGlow + halo + core * 0.5 + fork * 0.3;
    }

    // Faint background glow connecting the three arcs — looks like
    // the electric field between channels
    float bgGlow = exp(-abs(across) * 8.0) * 0.04;
    col += vec3(0.02, 0.05, 0.15) * bgGlow;

    gl_FragColor = vec4(col, clamp(totalAlpha + bgGlow, 0.0, 1.0));
  }
`;
const TeslaArcMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_arcColor: new Vector3(0.4, 0.8, 1.0), // Electric cyan
    u_glowColor: new Vector3(0.1, 0.3, 0.9), // Deep blue plasma
    u_speed: 1.0,
    u_intensity: 1.5,
    u_forkDensity: 6.0,
}, vertexShader, fragmentShader);
extend({ TeslaArcMaterial });
export { TeslaArcMaterial };
