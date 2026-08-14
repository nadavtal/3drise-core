import { Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface SolarFilamentMaterialUniforms {
    u_time: {
        value: number;
    };
    u_coreColor: {
        value: Vector3;
    };
    u_midColor: {
        value: Vector3;
    };
    u_coolColor: {
        value: Vector3;
    };
    u_flareColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_turbulence: {
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
  uniform vec3 u_coreColor;
  uniform vec3 u_midColor;
  uniform vec3 u_coolColor;
  uniform vec3 u_flareColor;
  uniform float u_speed;
  uniform float u_turbulence;
  varying vec2 vUv;
  varying vec3 vPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0; float amp = 0.5; float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      v += amp * smoothNoise(p * freq);
      amp *= 0.5; freq *= 2.1;
    }
    return v;
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x;
    float across = vUv.y - 0.5;

    // Convective turbulence — large scale rolls
    vec2 turbUV = vec2(along * 3.0 - t * 0.8, across * 2.0 + t * 0.3);
    float turb = fbm(turbUV) * u_turbulence;

    // Secondary smaller eddies
    float eddy = fbm(turbUV * 3.0 + vec2(t * 0.5, -t * 0.2)) * u_turbulence * 0.4;

    float displacement = (turb + eddy - 0.5) * 0.2;
    float dist = abs(across - displacement);

    // Temperature gradient from center outward — maps to color
    float coreGrad = 1.0 - smoothstep(0.0, 0.08, dist);
    float midGrad  = 1.0 - smoothstep(0.05, 0.2, dist);
    float coolGrad = 1.0 - smoothstep(0.1, 0.35, dist);

    // Spicules — thin jets shooting off the surface
    float spiculePhase  = floor(along * 20.0 + t * 2.0);
    float spiculeSeed   = hash(vec2(spiculePhase, 0.0));
    float spiculeActive = step(0.6, spiculeSeed);
    float spiculeX      = fract(along * 20.0 + t * 2.0);
    float spiculeY      = across - 0.2;
    float spicule = exp(-abs(spiculeX - 0.5) * 30.0) * exp(-abs(spiculeY) * 15.0)
                    * spiculeActive * (1.0 - spiculeX);

    // Flare — occasional intense brightening at a random spot
    float flareTime      = floor(t * 0.3);
    float flareSeed      = hash(vec2(flareTime, 1.0));
    float flarePos       = flareSeed;
    float flareIntensity = smoothstep(0.95, 1.0, fract(t * 0.3)) * 8.0;
    float flare = exp(-abs(along - flarePos) * 15.0) * exp(-dist * 10.0) * flareIntensity;

    vec3 col = u_coolColor * coolGrad;
    col = mix(col, u_midColor, midGrad);
    col = mix(col, u_coreColor, coreGrad);
    col += u_flareColor * flare;
    col += u_coreColor * spicule * 0.6;

    // Brightness pulsing — magnetic reconnection events
    float pulse = 0.85 + 0.15 * sin(t * 2.3 + along * 4.0) * sin(t * 1.7);
    col *= pulse;

    float alpha = clamp(coolGrad * 0.8 + flare * 0.5 + spicule * 0.4, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
const SolarFilamentMaterial = shaderMaterial({
    u_time: 0,
    u_coreColor: new Vector3(1.0, 0.98, 0.7), // White-hot
    u_midColor: new Vector3(1.0, 0.55, 0.05), // Solar orange
    u_coolColor: new Vector3(0.7, 0.08, 0.02), // Deep plasma red
    u_flareColor: new Vector3(1.0, 0.9, 0.3), // Bright yellow flare
    u_speed: 0.5,
    u_turbulence: 1.2,
}, vertexShader, fragmentShader);
extend({ SolarFilamentMaterial });
export { SolarFilamentMaterial };
