import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
export interface SmokeUniforms {
    u_time: number;
    u_colorDark: THREE.Color;
    u_colorLight: THREE.Color;
    u_lightColor: THREE.Color;
    u_lightDir: THREE.Vector3;
    u_speed: number;
    u_turbulence: number;
    u_transition: number;
    u_density: number;
    u_dissipation: number;
    u_spread: number;
    u_sway: number;
    u_windDir: THREE.Vector2;
    u_radius: number;
    u_height: number;
    u_mouse: THREE.Vector3;
    u_mouseStrength: number;
}

export type SmokeMaterialImpl = THREE.ShaderMaterial & SmokeUniforms;

declare module '@react-three/fiber' {
    interface ThreeElements {
        smokeMaterial: ThreeElements['shaderMaterial'] & Partial<SmokeUniforms>;
    }
}

const defaults = {
    u_time: 0,
    u_colorDark: new THREE.Color(0.06, 0.06, 0.07),
    u_colorLight: new THREE.Color(0.58, 0.58, 0.62),
    u_lightColor: new THREE.Color(1.0, 0.95, 0.85),
    u_lightDir: new THREE.Vector3(-0.6, 0.7, 0.0),
    u_speed: 0.35,
    u_turbulence: 1.6,
    u_transition: 0.32,
    u_density: 1.0,
    u_dissipation: 0.45,
    u_spread: 0.9,
    u_sway: 0.5,
    u_windDir: new THREE.Vector2(0.3, 0.0),
    u_radius: 1.0,
    u_height: 3.0,
    u_mouse: new THREE.Vector3(0, -1000, 0),
    u_mouseStrength: 0.0,
};
const vertexShader = /*glsl*/ `
  uniform float u_radius;
  uniform float u_height;

  varying vec2 vUv;

  void main() {
    // x in [-1,1], y in [0,1] — smoke-space, geometry-size independent.
    vUv = vec2(uv.x * 2.0 - 1.0, uv.y);

    // Cylindrical world-space billboard around the mesh origin, rising on +Y.
    vec3 center   = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 right    = normalize(vec3(camRight.x, 0.0, camRight.z) + vec3(1e-5));

    vec3 world = center
      + right * vUv.x * u_radius
      + vec3(0.0, 1.0, 0.0) * vUv.y * u_height;

    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  precision highp float;

  uniform float u_time;
  uniform vec3  u_colorDark;
  uniform vec3  u_colorLight;
  uniform vec3  u_lightColor;
  uniform vec3  u_lightDir;
  uniform float u_speed;
  uniform float u_turbulence;
  uniform float u_transition;
  uniform float u_density;
  uniform float u_dissipation;
  uniform float u_spread;
  uniform float u_sway;
  uniform vec2  u_windDir;
  uniform vec3  u_mouse;
  uniform float u_mouseStrength;

  varying vec2 vUv;

  float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i),                hash21(i+vec2(1,0)), u.x),
               mix(hash21(i+vec2(0,1)),      hash21(i+vec2(1,1)), u.x), u.y);
  }
  const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
  float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=ROT*p*2.03+vec2(1.7); a*=0.5; } return s; }

  // Density of the smoke column at a smoke-space point. Real smoke rises as a
  // coherent LAMINAR thread near the source, then crosses a transition height
  // (u_transition) where it rolls up into TURBULENT vortices — modelled with
  // curl noise (a divergence-free swirl field) whose strength ramps in with
  // height — widening and breaking into puffs before it dissipates.
  float smokeField(vec2 uv){
    float y = clamp(uv.y, 0.0, 1.0);
    float gust = clamp(u_mouseStrength, 0.0, 1.0);

    // laminar below the transition, turbulent above; the cursor breaks it sooner
    float turbRamp = smoothstep(u_transition, min(u_transition + 0.4, 1.0), y);
    turbRamp = clamp(turbRamp + gust * 0.4, 0.0, 1.0);

    // thin & coherent at the base, billows out only once it goes turbulent
    float w = 0.16 + u_spread * (0.12 * y + 0.88 * turbRamp * y);

    // coherent sway (wind + cursor lean) plus a laminar wobble that amplifies
    float lateral = u_windDir.x + u_mouse.x * gust * 1.5;
    float meander = sin(y * 6.0 - u_time * u_speed * 1.2) * 0.05 * turbRamp;
    float x = uv.x + lateral * pow(y, 1.4) * u_sway + meander;
    float lx = x / w;

    // rising sampling coords; detail enlarges & slows higher up (buoyant)
    float freq = mix(3.4, 1.5, y);
    vec2 p = vec2(lx * freq, y * freq * 1.2 - u_time * u_speed);

    // curl noise: stream function psi -> perpendicular gradient = a swirling,
    // roughly divergence-free flow. Displace the sample by it to roll up vortices.
    float e = 0.15;
    float psi0 = fbm(p);
    float psiX = fbm(p + vec2(e, 0.0));
    float psiY = fbm(p + vec2(0.0, e));
    vec2 curl = vec2(psiY - psi0, -(psiX - psi0)) / e;
    vec2 ps = p + curl * (u_turbulence * turbRamp) * 0.35;

    // density from the swirled field, with a light secondary warp for richness
    float q = fbm(ps);
    vec2 r = vec2(fbm(ps + q + vec2(2.1, 5.7)), fbm(ps + q + vec2(7.4, 1.3)));
    float n = fbm(ps + (0.4 + 0.7 * turbRamp) * r);

    float lat  = 1.0 - smoothstep(0.5, 1.05, abs(lx));         // soft round column
    float base = smoothstep(0.0, 0.10, y);                     // emerge at the source
    float top  = 1.0 - smoothstep(1.0 - u_dissipation, 1.0, y);// dissolve into air

    float dens = n * lat * base * top;
    dens *= mix(0.9, 1.18, turbRamp);   // turbulent region reads as discrete billows
    return clamp(dens, 0.0, 1.0);
  }

  void main() {
    float d = smokeField(vUv);
    if (d <= 0.002) discard;

    // Soft self-shadow: compare density toward the light. Denser ahead = occluded.
    vec2 lo = normalize(u_lightDir.xy + vec2(1e-4)) * 0.06;
    float dL = smokeField(vUv + lo);
    float shadow = clamp((dL - d) * 3.0, 0.0, 1.0);

    vec3 lit = u_colorLight * u_lightColor;
    vec3 col = mix(lit, u_colorDark, shadow);

    float alpha = clamp(d * u_density, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;
export const SmokeMaterial = shaderMaterial({
    ...defaults,
    u_colorDark: defaults.u_colorDark.clone(),
    u_colorLight: defaults.u_colorLight.clone(),
    u_lightColor: defaults.u_lightColor.clone(),
    u_lightDir: defaults.u_lightDir.clone(),
    u_windDir: defaults.u_windDir.clone(),
    u_mouse: defaults.u_mouse.clone(),
}, vertexShader, fragmentShader, (m) => {
    if (!m)
        return;
    // Absorptive translucent smoke: normal alpha blend, no depth write, two-sided.
    m.transparent = true;
    m.blending = THREE.NormalBlending;
    m.depthWrite = false;
    m.side = THREE.DoubleSide;
    // No derivatives extension needed — edges are soft from smoothstep, not bump.
});
extend({ SmokeMaterial });
