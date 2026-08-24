import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
export type MyGridLineMode = 0 | 1 | 2 | 3 | 4;

export type MyGridCellMode = 0 | 1 | 2 | 3 | 4;

export interface MyGridMaterialUniforms {
    u_time: number;
    u_cellSize: number;
    u_lineWidth: number;
    u_sectionSize: number;
    u_sectionWidth: number;
    u_lineColor: THREE.Color;
    u_sectionColor: THREE.Color;
    u_cellColor: THREE.Color;
    u_glowColor: THREE.Color;
    u_bgColor: THREE.Color;
    u_bgOpacity: number;
    u_lineMode: number;
    u_cellMode: number;
    u_animSpeed: number;
    u_animScale: number;
    u_animIntensity: number;
    u_fadeDistance: number;
    u_fadeStrength: number;
    /** ripple/pulse origin in local grid coords */
    u_focus: THREE.Vector2;
    /** mouse in NDC (Vector2) — 3drize convention; host may map it into u_focus */
    u_mouse: THREE.Vector2;
    /** vertex displacement amount along the plane normal (needs a segmented plane) */
    u_displace: number;
    /**
     * 0..1 assemble/dissolve. The build boundary sweeps outward from u_focus
     * with a bright leading edge; 1 is fully built, 0 is gone. Animate it
     * downward to dissolve.
     */
    u_reveal: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        myGridMaterial: ThreeElements['shaderMaterial'] & Partial<MyGridMaterialUniforms>;
    }
}

export const myGridMaterialDefaults: MyGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 1.0,
    u_lineWidth: 1.0,
    u_sectionSize: 5.0,
    u_sectionWidth: 1.6,
    u_lineColor: new THREE.Color(0.28, 0.5, 0.72),
    u_sectionColor: new THREE.Color(0.5, 0.78, 1.0),
    u_cellColor: new THREE.Color(0.1, 0.35, 0.6),
    u_glowColor: new THREE.Color(0.2, 0.62, 1.0),
    u_bgColor: new THREE.Color(0.02, 0.03, 0.05),
    u_bgOpacity: 0.0,
    u_lineMode: 0,
    u_cellMode: 0,
    u_animSpeed: 1.0,
    u_animScale: 0.5,
    u_animIntensity: 1.0,
    u_fadeDistance: 20.0,
    u_fadeStrength: 0.65,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0.0,
    u_reveal: 1.0,
};
const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  float gridHeight(vec2 p){
    float t = u_time * u_animSpeed;
    float d = length(p) / max(u_cellSize, 1e-4);
    return sin(d * u_animScale - t);
  }

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      pos.z += gridHeight(position.xy) * u_displace;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const fragment = /*glsl*/ `
  precision highp float;

  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_lineWidth;
  uniform float u_sectionSize;
  uniform float u_sectionWidth;
  uniform vec3  u_lineColor;
  uniform vec3  u_sectionColor;
  uniform vec3  u_cellColor;
  uniform vec3  u_glowColor;
  uniform vec3  u_bgColor;
  uniform float u_bgOpacity;
  uniform float u_lineMode;
  uniform float u_cellMode;
  uniform float u_animSpeed;
  uniform float u_animScale;
  uniform float u_animIntensity;
  uniform float u_fadeDistance;
  uniform float u_fadeStrength;
  uniform vec2  u_focus;
  uniform float u_reveal;

  varying vec2 vGridPos;

  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float gridLines(vec2 coord, float width){
    vec2 d = fwidth(coord);
    vec2 g = abs(fract(coord - 0.5) - 0.5) / max(d * width, 1e-5);
    return 1.0 - clamp(min(g.x, g.y), 0.0, 1.0);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    float t = u_time * u_animSpeed;

    float minor = gridLines(coord, u_lineWidth);
    float major = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      major = gridLines(coord / u_sectionSize, u_sectionWidth);
    }

    float lineAnim = 1.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      float dist = length(vGridPos - u_focus) / max(u_cellSize, 1e-4);
      lineAnim = 0.5 + 0.5 * sin(dist * u_animScale - t);
    } else if (u_lineMode < 2.5){
      float fx = 0.5 + 0.5 * sin(coord.y * u_animScale - t);
      float fy = 0.5 + 0.5 * sin(coord.x * u_animScale - t);
      lineAnim = max(fx, fy);
    } else if (u_lineMode < 3.5){
      float s = fract((coord.x + coord.y) * 0.05 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    vec2 cellId = floor(coord);
    float cell = 0.0;
    if (u_cellMode > 0.5 && u_cellMode < 1.5){
      cell = 0.5 + 0.5 * sin(dot(cellId, vec2(0.7, 0.3)) * u_animScale - t);
    } else if (u_cellMode < 2.5){
      float h = hash21(cellId);
      cell = 0.5 + 0.5 * sin(t * (0.6 + h) + h * TAU);
    } else if (u_cellMode < 3.5){
      float d = length((cellId + 0.5) * u_cellSize - u_focus) / max(u_cellSize, 1e-4);
      cell = smoothstep(0.6, 1.0, sin(d * u_animScale - t));
    } else if (u_cellMode < 4.5){
      cell = mod(cellId.x + cellId.y, 2.0) * (0.5 + 0.5 * sin(t));
    }
    cell *= u_animIntensity;
    vec2 f = abs(fract(coord) - 0.5);
    cell *= smoothstep(0.5, 0.35, max(f.x, f.y));

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += u_cellColor * cell;            a = max(a, cell * 0.9);
    float minorI = minor * lineAnim;
    col += u_lineColor * minorI;          a = max(a, minorI);
    float majorI = major * lineAnim;
    col += u_sectionColor * majorI;       a = max(a, majorI);
    col += u_glowColor * (minorI + cell) * 0.25 * u_animIntensity;

    col *= fade;
    a   *= fade;

    // ---- reveal ----------------------------------------------------------
    // The build boundary sweeps outward from the focus point. Its leading band
    // mostly brightens whatever is already there rather than painting a solid
    // disc, so the grid reads as assembling itself rather than fading in.
    if (u_reveal < 0.999){
      float rd = length(vGridPos - u_focus) / max(u_fadeDistance, 1e-4);
      // 1.1, not 1.25: the boundary has to clear the fade radius by just the
      // width of its own soft edge. Overshooting further finishes the build
      // before reveal reaches 1 and leaves the tail of the range doing nothing.
      float edge = u_reveal * 1.1;
      float mask = 1.0 - smoothstep(edge - 0.05, edge, rd);
      float front = mask * smoothstep(edge - 0.22, edge - 0.05, rd);
      col = col * mask + u_glowColor * front * (a * 1.8 + 0.08);
      a   = max(a * mask, front * 0.10);
    }

    if (a < 0.002) discard;
    gl_FragColor = vec4(col, a);
  }
`;
export const MyGridMaterial = shaderMaterial({
    u_time: myGridMaterialDefaults.u_time,
    u_cellSize: myGridMaterialDefaults.u_cellSize,
    u_lineWidth: myGridMaterialDefaults.u_lineWidth,
    u_sectionSize: myGridMaterialDefaults.u_sectionSize,
    u_sectionWidth: myGridMaterialDefaults.u_sectionWidth,
    u_lineColor: myGridMaterialDefaults.u_lineColor.clone(),
    u_sectionColor: myGridMaterialDefaults.u_sectionColor.clone(),
    u_cellColor: myGridMaterialDefaults.u_cellColor.clone(),
    u_glowColor: myGridMaterialDefaults.u_glowColor.clone(),
    u_bgColor: myGridMaterialDefaults.u_bgColor.clone(),
    u_bgOpacity: myGridMaterialDefaults.u_bgOpacity,
    u_lineMode: myGridMaterialDefaults.u_lineMode,
    u_cellMode: myGridMaterialDefaults.u_cellMode,
    u_animSpeed: myGridMaterialDefaults.u_animSpeed,
    u_animScale: myGridMaterialDefaults.u_animScale,
    u_animIntensity: myGridMaterialDefaults.u_animIntensity,
    u_fadeDistance: myGridMaterialDefaults.u_fadeDistance,
    u_fadeStrength: myGridMaterialDefaults.u_fadeStrength,
    u_focus: myGridMaterialDefaults.u_focus.clone(),
    u_mouse: myGridMaterialDefaults.u_mouse.clone(),
    u_displace: myGridMaterialDefaults.u_displace,
    u_reveal: myGridMaterialDefaults.u_reveal,
}, vertex, fragment);
extend({ MyGridMaterial });
