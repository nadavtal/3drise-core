import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface QuasiGridMaterialUniforms {
    u_time: number;
    /** spacing between the lines of each family, in world units */
    u_cellSize: number;
    /** line thickness, in pixels */
    u_lineWidth: number;
    /** every Nth line of each family is an accent line */
    u_sectionSize: number;
    /** accent thickness, in pixels; 0 disables the layer */
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
    u_focus: THREE.Vector2;
    u_mouse: THREE.Vector2;
    u_displace: number;
    /**
     * 0..1 assemble/dissolve. The build boundary sweeps outward from u_focus
     * with a bright leading edge; 1 is fully built, 0 is gone. Animate it
     * downward to dissolve.
     */
    u_reveal: number;
    /**
     * How many line families, 3..9. 5 is Penrose. 4 and 6 divide the half-turn
     * evenly and so come out periodic; everything else is quasiperiodic.
     */
    u_symmetry: number;
    /** shifts every family's offset together, sliding the pattern through itself */
    u_phase: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        quasiGridMaterial: ThreeElements['shaderMaterial'] & Partial<QuasiGridMaterialUniforms>;
    }
}

export const quasiGridMaterialDefaults: QuasiGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 3.0,
    u_lineWidth: 1.2,
    u_sectionSize: 5.0,
    u_sectionWidth: 2.0,
    u_lineColor: new THREE.Color(0.55, 0.3, 0.12),
    u_sectionColor: new THREE.Color(1.0, 0.78, 0.35),
    u_cellColor: new THREE.Color(0.22, 0.1, 0.03),
    u_glowColor: new THREE.Color(1.0, 0.65, 0.25),
    u_bgColor: new THREE.Color(0.05, 0.02, 0.01),
    u_bgOpacity: 0.0,
    u_lineMode: 1,
    u_cellMode: 2,
    u_animSpeed: 1.0,
    u_animScale: 0.5,
    u_animIntensity: 1.0,
    u_fadeDistance: 25.0,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0.0,
    u_reveal: 1.0,
    u_symmetry: 5.0,
    u_phase: 0.2,
};

const quasiCommon = /*glsl*/ `
  const float PI  = 3.14159265359;
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  ${quasiCommon}

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      float t = u_time * u_animSpeed;
      float d = length(position.xy) / max(u_cellSize, 1e-4);
      pos.z += sin(d * u_animScale - t) * u_displace;
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
  uniform float u_symmetry;
  uniform float u_phase;

  varying vec2 vGridPos;

  ${quasiCommon}

  float lineAt(float c, float width, float fp){
    float d = abs(fract(c - 0.5) - 0.5);
    return 1.0 - clamp(d / max(fp * max(width, 0.05), 1e-6), 0.0, 1.0);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // de Bruijn's multigrid: N families of evenly spaced parallel lines, spread
    // over a half turn. Where the angles do not divide the half turn evenly the
    // intersections never repeat, so the tiling is genuinely aperiodic — pan as
    // far as you like and the pattern never comes back around.
    float n = clamp(u_symmetry, 3.0, 9.0);

    float lines  = 0.0;
    float accent = 0.0;
    float dmin   = 1e9;   // distance to the nearest line, in line-spacing units
    float idAcc  = 0.0;   // the cell's integer coordinates, folded into one number
    vec2  cpos   = vec2(0.0);

    for (int j = 0; j < 9; j++){
      float fj = float(j);
      float on = step(fj, n - 0.5);

      float ang = PI * fj / n;
      vec2  e   = vec2(cos(ang), sin(ang));
      float d   = dot(coord, e) + u_phase + fj * 0.2;
      float fp  = max(fwidth(d), 1e-6);

      lines = max(lines, lineAt(d, u_lineWidth, fp) * on);

      if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
        float md = d / u_sectionSize;
        accent = max(accent, lineAt(md, u_sectionWidth, max(fwidth(md), 1e-6)) * on);
      }

      float k = floor(d);
      idAcc += on * k * (1.0 + fj * 7.13);
      cpos  += on * (k + 0.5) * e;

      float fr = fract(d);
      dmin = min(dmin, mix(1e9, min(fr, 1.0 - fr), on));
    }

    // Summing dot(p, e_j) * e_j over evenly spread directions returns n/2 times
    // the original point, so scaling by 2/n puts the cell centre back into the
    // same units as coord and the ripple distances stay meaningful.
    vec2 cellPos = cpos * (2.0 / n);
    float cellH  = hash21(vec2(idAcc * 0.137, idAcc * 0.041 + 7.7));

    // ---- line animation --------------------------------------------------
    float lineAnim = 1.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      lineAnim = 0.5 + 0.5 * sin(length(cellPos - focus) * u_animScale - t);
    } else if (u_lineMode < 2.5){
      lineAnim = 0.5 + 0.5 * sin(dot(cellPos, vec2(0.5, 0.5)) * u_animScale - t);
    } else if (u_lineMode < 3.5){
      float s = fract((coord.x + coord.y) * 0.05 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    // ---- rhomb fill ------------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5 && u_cellMode < 1.5){
      cell = 0.5 + 0.5 * sin(idAcc * 0.05 * u_animScale - t);
    } else if (u_cellMode < 2.5){
      cell = 0.5 + 0.5 * sin(t * (0.6 + cellH) + cellH * TAU);
    } else if (u_cellMode < 3.5){
      cell = smoothstep(0.6, 1.0, sin(length(cellPos - focus) * u_animScale - t));
    } else if (u_cellMode < 4.5){
      cell = step(0.5, cellH) * (0.5 + 0.5 * sin(t));
    }
    cell *= u_animIntensity;
    cell *= smoothstep(0.0, 0.16, dmin); // keep the fill off its own edges

    // two rhomb tones, the fat/thin split a Penrose tiling reads by
    float tone = step(0.55, cellH);

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += mix(u_cellColor, u_cellColor * 2.2, tone) * cell;
    a = max(a, cell * 0.9);
    float linesI = lines * lineAnim;
    col += u_lineColor * linesI;            a = max(a, linesI);
    float accentI = accent * lineAnim;
    col += u_sectionColor * accentI;        a = max(a, accentI);
    col += u_glowColor * (linesI * 0.2 + cell * 0.35) * u_animIntensity;

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

export const QuasiGridMaterial = shaderMaterial(
    {
        u_time: quasiGridMaterialDefaults.u_time,
        u_cellSize: quasiGridMaterialDefaults.u_cellSize,
        u_lineWidth: quasiGridMaterialDefaults.u_lineWidth,
        u_sectionSize: quasiGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: quasiGridMaterialDefaults.u_sectionWidth,
        u_lineColor: quasiGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: quasiGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: quasiGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: quasiGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: quasiGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: quasiGridMaterialDefaults.u_bgOpacity,
        u_lineMode: quasiGridMaterialDefaults.u_lineMode,
        u_cellMode: quasiGridMaterialDefaults.u_cellMode,
        u_animSpeed: quasiGridMaterialDefaults.u_animSpeed,
        u_animScale: quasiGridMaterialDefaults.u_animScale,
        u_animIntensity: quasiGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: quasiGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: quasiGridMaterialDefaults.u_fadeStrength,
        u_focus: quasiGridMaterialDefaults.u_focus.clone(),
        u_mouse: quasiGridMaterialDefaults.u_mouse.clone(),
        u_displace: quasiGridMaterialDefaults.u_displace,
        u_reveal: quasiGridMaterialDefaults.u_reveal,
        u_symmetry: quasiGridMaterialDefaults.u_symmetry,
        u_phase: quasiGridMaterialDefaults.u_phase,
    },
    vertex,
    fragment,
);

extend({ QuasiGridMaterial });
