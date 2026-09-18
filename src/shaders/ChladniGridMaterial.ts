import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Chladni plates: the nodal lines of a standing wave on a square plate, with sand settling on them, drifting slowly between two neighbouring resonances.
 *
 * Shares the grid vocabulary with the other shader-plane grids (lineMode /
 * cellMode 0..4, fade, reveal, focus), so the same controller drives it.
 */
export interface ChladniGridMaterialUniforms {
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
    u_focus: THREE.Vector2;
    u_mouse: THREE.Vector2;
    u_displace: number;
    /** 0..1 assemble/dissolve. The build boundary sweeps outward from u_focus with a bright leading edge; 1 is fully built, 0 is gone. */
    u_reveal: number;
    /** first mode number of the standing wave, 1..12 */
    u_modeN: number;
    /** second mode number of the standing wave, 1..12 */
    u_modeM: number;
    /** how fast the plate drifts to the neighbouring resonance; 0 holds the pattern */
    u_morph: number;
    /** 0..1 amount of sand on the plate */
    u_grain: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        chladniGridMaterial: ThreeElements['shaderMaterial'] & Partial<ChladniGridMaterialUniforms>;
    }
}

export const chladniGridMaterialDefaults: ChladniGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 8,
    u_lineWidth: 1.2,
    u_sectionSize: 1,
    u_sectionWidth: 0.8,
    u_lineColor: new THREE.Color('#d9c7a3'),
    u_sectionColor: new THREE.Color('#4d5d6e'),
    u_cellColor: new THREE.Color('#16222e'),
    u_glowColor: new THREE.Color('#ffe2a8'),
    u_bgColor: new THREE.Color('#06080b'),
    u_bgOpacity: 0,
    u_lineMode: 0,
    u_cellMode: 2,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.6,
    u_fadeDistance: 25,
    u_fadeStrength: 0.6,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1.0,
    u_modeN: 3,
    u_modeM: 5,
    u_morph: 0.4,
    u_grain: 0.8,
};

const vertex = /* glsl */ `
  
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  
  const float PI  = 3.14159265359;
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  
  uniform float u_modeN;
  uniform float u_modeM;
  uniform float u_morph;

  // Chladni's plate. A standing wave on a square plate is a superposition of
  // two degenerate modes, cos(n*pi*x)cos(m*pi*y) - cos(m*pi*x)cos(n*pi*y).
  // Sand collects where it is zero: the nodal lines.
  float chladniMode(vec2 x, float n, float m){
    m += step(abs(n - m), 0.5);   // n == m is the trivial zero field
    return cos(n * x.x) * cos(m * x.y) - cos(m * x.x) * cos(n * x.y);
  }

  float chladniField(vec2 coord, float t){
    float n = floor(clamp(u_modeN, 1.0, 12.0) + 0.5);
    float m = floor(clamp(u_modeM, 1.0, 12.0) + 0.5);
    vec2 x = coord * PI;
    // Drift between two neighbouring resonances: the nodal lines slide
    // continuously from one pattern into the next.
    float a = t * u_morph * 0.35;
    return cos(a) * chladniMode(x, n, m) + sin(a) * chladniMode(x, n + 1.0, m);
  }


  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      // the plate itself vibrates: the displacement is the standing wave
      float t = u_time * u_animSpeed;
      float f = chladniField(position.xy / max(u_cellSize, 1e-4), t);
      pos.z += f * u_displace * 0.5 * sin(t * 3.0);
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragment = /* glsl */ `
  
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

  float lineAt(float c, float width, float fp){
    float d = abs(fract(c - 0.5) - 0.5);
    return 1.0 - clamp(d / max(fp * max(width, 0.05), 1e-6), 0.0, 1.0);
  }

  
  const float PI  = 3.14159265359;
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  
  uniform float u_modeN;
  uniform float u_modeM;
  uniform float u_morph;

  // Chladni's plate. A standing wave on a square plate is a superposition of
  // two degenerate modes, cos(n*pi*x)cos(m*pi*y) - cos(m*pi*x)cos(n*pi*y).
  // Sand collects where it is zero: the nodal lines.
  float chladniMode(vec2 x, float n, float m){
    m += step(abs(n - m), 0.5);   // n == m is the trivial zero field
    return cos(n * x.x) * cos(m * x.y) - cos(m * x.x) * cos(n * x.y);
  }

  float chladniField(vec2 coord, float t){
    float n = floor(clamp(u_modeN, 1.0, 12.0) + 0.5);
    float m = floor(clamp(u_modeM, 1.0, 12.0) + 0.5);
    vec2 x = coord * PI;
    // Drift between two neighbouring resonances: the nodal lines slide
    // continuously from one pattern into the next.
    float a = t * u_morph * 0.35;
    return cos(a) * chladniMode(x, n, m) + sin(a) * chladniMode(x, n + 1.0, m);
  }


  uniform float u_grain;

  void main(){
    float cs = max(u_cellSize, 1e-4);
    vec2 coord = vGridPos / cs;           // one plate per cell
    vec2 focus = u_focus / cs;
    float t = u_time * u_animSpeed;

    float f  = chladniField(coord, t);
    float fp = max(fwidth(f), 1e-5);
    float nodal = 1.0 - clamp(abs(f) / (fp * max(u_lineWidth, 0.05)), 0.0, 1.0);

    // Sand: one grain slot per small cell. A grain sits in its slot with a
    // probability that falls off exponentially with the local amplitude |f|,
    // so grains pile up on the nodal lines and thin out towards antinodes.
    vec2  gq  = coord * 72.0;
    vec2  gid = floor(gq);
    float gh  = hash21(gid);
    vec2  go  = vec2(hash21(gid + 3.1), hash21(gid + 7.7)) - 0.5;
    float gd  = length(fract(gq) - 0.5 - go * 0.4);
    float gpx = 1.0 / max(length(fwidth(gq)) * 0.7071, 1e-4);   // pixels per slot
    float settle  = exp(-abs(f) * 7.0);
    float grainOn = step(gh, u_grain * settle);
    float disk = 1.0 - smoothstep(0.22 - 0.5 / gpx, 0.22 + 0.5 / gpx, gd);
    // when a slot is smaller than a couple of pixels, draw the average density instead
    float resolved = clamp((gpx - 1.5) / 3.0, 0.0, 1.0);
    float sand = mix(u_grain * settle * 0.35,
                     grainOn * disk * (0.55 + 0.45 * hash21(gid + 1.3)),
                     resolved);

    float lines = max(nodal, sand);

    float accent = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      vec2 sc  = coord / u_sectionSize;
      vec2 sfp = max(fwidth(sc), vec2(1e-6));
      accent = max(lineAt(sc.x, u_sectionWidth, sfp.x), lineAt(sc.y, u_sectionWidth, sfp.y));
    }

    vec2  plate = floor(coord);
    float cellH = hash21(plate + 0.5);
    float cellDist  = length(coord - focus) * 6.0;
    float flowCoord = (coord.x + coord.y) * 6.0;
    float scanCoord = (coord.x + coord.y) * 8.0;
    // the fill shimmers on the antinodes and stays off the sand
    float edgeKeep = smoothstep(0.15, 0.9, abs(f));
    float fadeR = length(vGridPos) / max(u_fadeDistance, 1e-4);

    vec3  extraCol = u_glowColor * nodal * 0.25;
    float extraA = 0.0;
    float regionMask = 1.0;

    // ---- line animation --------------------------------------------------
    float lineAnim = 1.0;
    if (u_lineMode > 0.5){
      if (u_lineMode < 1.5){
        lineAnim = 0.5 + 0.5 * sin(cellDist * u_animScale - t);
      } else if (u_lineMode < 2.5){
        lineAnim = 0.5 + 0.5 * sin(flowCoord * u_animScale - t);
      } else if (u_lineMode < 3.5){
        float s = fract(scanCoord * 0.05 * u_animScale - t * 0.15);
        lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
      } else {
        lineAnim = 0.5 + 0.5 * sin(t);
      }
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    // ---- cell fill -------------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5){
      if (u_cellMode < 1.5){
        cell = 0.5 + 0.5 * sin(flowCoord * 0.5 * u_animScale - t);
      } else if (u_cellMode < 2.5){
        cell = 0.5 + 0.5 * sin(t * (0.6 + cellH) + cellH * TAU);
      } else if (u_cellMode < 3.5){
        cell = smoothstep(0.6, 1.0, sin(cellDist * u_animScale - t));
      } else {
        cell = step(0.5, cellH) * (0.5 + 0.5 * sin(t));
      }
    }
    cell *= u_animIntensity * edgeKeep;

    float tone = step(0.55, cellH);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += mix(u_cellColor, u_cellColor * 2.2, tone) * cell;
    a = max(a, cell * 0.9);
    float linesI = lines * lineAnim;
    col += u_lineColor * linesI;            a = max(a, linesI);
    float accentI = accent * lineAnim;
    col += u_sectionColor * accentI;        a = max(a, accentI);
    col += u_glowColor * (linesI * 0.2 + cell * 0.35) * u_animIntensity;

    col = col * regionMask + extraCol;
    a   = max(a * regionMask, extraA);

    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, fadeR);
    col *= fade;
    a   *= fade;

    // ---- reveal ----------------------------------------------------------
    // The build boundary sweeps outward from the focus point with a bright
    // leading edge, so the grid reads as assembling itself.
    if (u_reveal < 0.999){
      float rd = length(vGridPos - u_focus) / max(u_fadeDistance, 1e-4);
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

export const ChladniGridMaterial = shaderMaterial(
    {
        u_time: chladniGridMaterialDefaults.u_time,
        u_cellSize: chladniGridMaterialDefaults.u_cellSize,
        u_lineWidth: chladniGridMaterialDefaults.u_lineWidth,
        u_sectionSize: chladniGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: chladniGridMaterialDefaults.u_sectionWidth,
        u_lineColor: chladniGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: chladniGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: chladniGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: chladniGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: chladniGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: chladniGridMaterialDefaults.u_bgOpacity,
        u_lineMode: chladniGridMaterialDefaults.u_lineMode,
        u_cellMode: chladniGridMaterialDefaults.u_cellMode,
        u_animSpeed: chladniGridMaterialDefaults.u_animSpeed,
        u_animScale: chladniGridMaterialDefaults.u_animScale,
        u_animIntensity: chladniGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: chladniGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: chladniGridMaterialDefaults.u_fadeStrength,
        u_focus: chladniGridMaterialDefaults.u_focus.clone(),
        u_mouse: chladniGridMaterialDefaults.u_mouse.clone(),
        u_displace: chladniGridMaterialDefaults.u_displace,
        u_reveal: chladniGridMaterialDefaults.u_reveal,
        u_modeN: chladniGridMaterialDefaults.u_modeN,
        u_modeM: chladniGridMaterialDefaults.u_modeM,
        u_morph: chladniGridMaterialDefaults.u_morph,
        u_grain: chladniGridMaterialDefaults.u_grain,
    },
    vertex,
    fragment,
);

extend({ ChladniGridMaterial });
