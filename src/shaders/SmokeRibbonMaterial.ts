import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
export interface SmokeRibbonUniforms {
    u_time: number;
    u_color: THREE.Color;
    u_colorTop: THREE.Color;
    u_speed: number;
    u_detail: number;
    u_remapLow: number;
    u_remapHigh: number;
    u_edgeX: number;
    u_edgeY: number;
    u_density: number;
    u_twistStrength: number;
    u_twistSpeed: number;
    u_twistScale: number;
    u_twistStart: number;
    u_windDir: THREE.Vector2;
    u_mouse: THREE.Vector2;
    u_mouseStrength: number;
}

export type SmokeRibbonMaterialImpl = THREE.ShaderMaterial & SmokeRibbonUniforms;

declare module '@react-three/fiber' {
    interface ThreeElements {
        smokeRibbonMaterial: ThreeElements['shaderMaterial'] & Partial<SmokeRibbonUniforms>;
    }
}

const defaults = {
    u_time: 0,
    u_color: new THREE.Color(0.95, 0.95, 0.97),
    u_colorTop: new THREE.Color(0.7, 0.72, 0.78),
    u_speed: 0.18,
    u_detail: 1.4,
    u_remapLow: 0.38,
    u_remapHigh: 1.0,
    u_edgeX: 0.4,
    u_edgeY: 0.32,
    u_density: 1.0,
    u_twistStrength: 9.0,
    u_twistSpeed: 0.4,
    u_twistScale: 0.9,
    u_twistStart: 0.18,
    u_windDir: new THREE.Vector2(0.15, 0.0),
    u_mouse: new THREE.Vector2(0, 0),
    u_mouseStrength: 0.0,
};
// Shared GLSL noise (kept identical in both stages so twist & density agree).
const noiseGLSL = /*glsl*/ `
  float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i),           hash21(i+vec2(1,0)), u.x),
               mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x), u.y);
  }
`;
const vertexShader = /*glsl*/ `
  uniform float u_time;
  uniform float u_twistStrength;
  uniform float u_twistSpeed;
  uniform float u_twistScale;
  uniform float u_twistStart;
  uniform vec2  u_windDir;
  uniform vec2  u_mouse;
  uniform float u_mouseStrength;

  varying vec2 vUv;

  ${noiseGLSL}

  vec2 rotate2D(vec2 v, float a){ float s = sin(a), c = cos(a); return mat2(c, s, -s, c) * v; }

  void main() {
    vUv = uv;
    float y = uv.y;                                   // 0 at the source, 1 at the tip
    float gust = clamp(u_mouseStrength, 0.0, 1.0);

    // twist ramps in with height -> coherent stem, spiralling top
    float ramp = smoothstep(u_twistStart, 1.0, y);
    float nv = vnoise(vec2(0.37, y * u_twistScale - u_time * u_twistSpeed));
    float angle = (nv - 0.5) * u_twistStrength * (ramp + gust * 0.5);

    vec3 pos = position;
    pos.xz = rotate2D(pos.xz, angle);

    // lateral drift: wind + a lean toward the cursor, growing toward the top
    float lean = u_windDir.x + u_mouse.x * gust * 1.5;
    pos.x += lean * pow(y, 1.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  precision highp float;

  uniform float u_time;
  uniform vec3  u_color;
  uniform vec3  u_colorTop;
  uniform float u_speed;
  uniform float u_detail;
  uniform float u_remapLow;
  uniform float u_remapHigh;
  uniform float u_edgeX;
  uniform float u_edgeY;
  uniform float u_density;

  varying vec2 vUv;

  ${noiseGLSL}

  const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);
  float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=ROT*p*2.03+vec2(1.7); a*=0.5; } return s; }

  void main() {
    // procedural density, scrolling upward; detail enlarges a touch with height
    vec2 p = vec2(vUv.x * u_detail * 4.0, vUv.y * u_detail * 3.4 - u_time * u_speed);
    float n = fbm(p);
    n = smoothstep(u_remapLow, u_remapHigh, n);

    // fade all four edges so the ribbon dissolves at its borders
    float fade = smoothstep(0.0, u_edgeX, vUv.x) * smoothstep(1.0, 1.0 - u_edgeX, vUv.x)
               * smoothstep(0.0, u_edgeY, vUv.y) * smoothstep(1.0, 1.0 - u_edgeY, vUv.y);

    float alpha = clamp(n * fade * u_density, 0.0, 1.0);
    vec3 col = mix(u_color, u_colorTop, vUv.y);

    gl_FragColor = vec4(col, alpha);
  }
`;
export const SmokeRibbonMaterial = shaderMaterial({
    ...defaults,
    u_color: defaults.u_color.clone(),
    u_colorTop: defaults.u_colorTop.clone(),
    u_windDir: defaults.u_windDir.clone(),
    u_mouse: defaults.u_mouse.clone(),
}, vertexShader, fragmentShader, (m) => {
    if (!m)
        return;
    m.transparent = true;
    m.blending = THREE.NormalBlending;
    m.depthWrite = false;
    m.side = THREE.DoubleSide;
});
extend({ SmokeRibbonMaterial });
