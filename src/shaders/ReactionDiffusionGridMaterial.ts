import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * A Gray-Scott reaction-diffusion field simulated on the GPU and sampled by the plane: coral, labyrinths and dividing spots grow, merge and keep evolving, wrapped seamlessly as a torus.
 *
 * Shares the grid vocabulary with the other shader-plane grids (lineMode /
 * cellMode 0..4, fade, reveal, focus), so the same controller drives it.
 */
export interface ReactionDiffusionGridMaterialUniforms {
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
    /** Gray-Scott feed rate F. */
    u_feed: number;
    /** Gray-Scott kill rate k. */
    u_kill: number;
    /** Periodic spatial spread of F and k across the tile, so several morphologies coexist. */
    u_variation: number;
    /** Cells covered by one simulation tile before it repeats. */
    u_tileCells: number;
    /** Latest simulation state; r = u, g = v. Written by the simulation each frame. */
    u_field: THREE.Texture | null;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        reactionDiffusionGridMaterial: ThreeElements['shaderMaterial'] & Partial<ReactionDiffusionGridMaterialUniforms>;
    }
}

export const reactionDiffusionGridMaterialDefaults: ReactionDiffusionGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 3,
    u_lineWidth: 1.1,
    u_sectionSize: 5,
    u_sectionWidth: 1.2,
    u_lineColor: new THREE.Color('#7ff0d4'),
    u_sectionColor: new THREE.Color('#f0a26a'),
    u_cellColor: new THREE.Color('#0d4b52'),
    u_glowColor: new THREE.Color('#2fd9c8'),
    u_bgColor: new THREE.Color('#03080a'),
    u_bgOpacity: 0,
    u_lineMode: 0,
    u_cellMode: 0,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.6,
    u_fadeDistance: 25,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1.0,
    u_feed: 0.037,
    u_kill: 0.06,
    u_variation: 0.55,
    u_tileCells: 7,
    u_field: null,
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


  uniform sampler2D u_field;
  uniform float u_tileCells;

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      // the relief is the pattern: v stands proud of the substrate
      vec2 uv = position.xy / max(u_cellSize, 1e-4) / max(u_tileCells, 1.0);
      float v = texture2D(u_field, uv).g;
      pos.z += smoothstep(0.08, 0.45, v) * u_displace;
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


  uniform sampler2D u_field;
  uniform float u_tileCells;

  void main(){
    float cs = max(u_cellSize, 1e-4);
    vec2 coord = vGridPos / cs;
    vec2 focus = u_focus / cs;
    float t = u_time * u_animSpeed;

    vec2 uv = coord / max(u_tileCells, 1.0);
    float v = texture2D(u_field, uv).g;
    float fw = max(length(vec2(dFdx(v), dFdy(v))), 1e-5);

    // the fronts: the contour where the autocatalyst takes over
    float lines = 1.0 - clamp(abs(v - 0.25) / (fw * max(u_lineWidth, 0.05) * 1.6), 0.0, 1.0);
    // dissolve the contour into its average coverage before it gets thinner than a pixel
    lines = mix(lines, clamp(u_lineWidth * 0.5, 0.0, 1.0) * 0.5, smoothstep(0.08, 0.3, fw));

    float accent = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      // a second contour deeper inside each front, so the fronts read as ridges
      float level = clamp(0.25 + 0.035 * u_sectionSize, 0.28, 0.62);
      accent = 1.0 - clamp(abs(v - level) / (fw * max(u_sectionWidth, 0.05) * 1.6), 0.0, 1.0);
      accent *= 1.0 - smoothstep(0.08, 0.3, fw);
    }

    float cellH = hash21(floor(coord) + 0.31);
    float cellDist  = length(coord - focus);
    float flowCoord = (coord.x + coord.y) * 0.7071;
    float scanCoord = coord.x + coord.y;
    float edgeKeep = smoothstep(0.02, 0.14, abs(v - 0.25));
    float fadeR = length(vGridPos) / max(u_fadeDistance, 1e-4);

    // the pattern body itself, so it is visible whatever cellMode is set to
    float body = smoothstep(0.06, 0.42, v);
    vec3  extraCol = mix(u_cellColor, u_glowColor, smoothstep(0.18, 0.5, v)) * body * 1.1;
    float extraA = body * 0.7;
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

export const ReactionDiffusionGridMaterial = shaderMaterial(
    {
        u_time: reactionDiffusionGridMaterialDefaults.u_time,
        u_cellSize: reactionDiffusionGridMaterialDefaults.u_cellSize,
        u_lineWidth: reactionDiffusionGridMaterialDefaults.u_lineWidth,
        u_sectionSize: reactionDiffusionGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: reactionDiffusionGridMaterialDefaults.u_sectionWidth,
        u_lineColor: reactionDiffusionGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: reactionDiffusionGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: reactionDiffusionGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: reactionDiffusionGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: reactionDiffusionGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: reactionDiffusionGridMaterialDefaults.u_bgOpacity,
        u_lineMode: reactionDiffusionGridMaterialDefaults.u_lineMode,
        u_cellMode: reactionDiffusionGridMaterialDefaults.u_cellMode,
        u_animSpeed: reactionDiffusionGridMaterialDefaults.u_animSpeed,
        u_animScale: reactionDiffusionGridMaterialDefaults.u_animScale,
        u_animIntensity: reactionDiffusionGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: reactionDiffusionGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: reactionDiffusionGridMaterialDefaults.u_fadeStrength,
        u_focus: reactionDiffusionGridMaterialDefaults.u_focus.clone(),
        u_mouse: reactionDiffusionGridMaterialDefaults.u_mouse.clone(),
        u_displace: reactionDiffusionGridMaterialDefaults.u_displace,
        u_reveal: reactionDiffusionGridMaterialDefaults.u_reveal,
        u_feed: reactionDiffusionGridMaterialDefaults.u_feed,
        u_kill: reactionDiffusionGridMaterialDefaults.u_kill,
        u_variation: reactionDiffusionGridMaterialDefaults.u_variation,
        u_tileCells: reactionDiffusionGridMaterialDefaults.u_tileCells,
        u_field: reactionDiffusionGridMaterialDefaults.u_field,
    },
    vertex,
    fragment,
);

extend({ ReactionDiffusionGridMaterial });
