import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface FractalGridMaterialUniforms {
    u_time: number;
    /** size of a level-0 cell, in world units */
    u_cellSize: number;
    /** line thickness at level 0, in pixels; deeper levels thin out */
    u_lineWidth: number;
    /** how many level-0 cells make one accent group */
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
    /** maximum subdivision levels, 1..6 */
    u_depth: number;
    /** radius around the focus, in level-0 cells, inside which cells subdivide */
    u_splitRadius: number;
    /** 0..1 — how much the split radius wobbles per cell, for an organic edge */
    u_splitJitter: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        fractalGridMaterial: ThreeElements['shaderMaterial'] & Partial<FractalGridMaterialUniforms>;
    }
}

export const fractalGridMaterialDefaults: FractalGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 4.0,
    u_lineWidth: 1.6,
    u_sectionSize: 4.0,
    u_sectionWidth: 2.2,
    u_lineColor: new THREE.Color(0.35, 0.75, 1.0),
    u_sectionColor: new THREE.Color(0.6, 0.9, 1.0),
    u_cellColor: new THREE.Color(0.12, 0.38, 0.62),
    u_glowColor: new THREE.Color(0.4, 0.9, 1.0),
    u_bgColor: new THREE.Color(0.01, 0.03, 0.06),
    u_bgOpacity: 0.0,
    u_lineMode: 0,
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
    u_depth: 5.0,
    u_splitRadius: 3.5,
    u_splitJitter: 0.5,
};

const fractalCommon = /*glsl*/ `
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
`;

// Fragment-only: derivatives do not exist in the vertex stage, so anything
// calling fwidth has to stay out of the shared chunk.
const fractalLines = /*glsl*/ `
  float gridLines(vec2 c, float width){
    vec2 d = fwidth(c);
    vec2 g = abs(fract(c - 0.5) - 0.5) / max(d * width, 1e-5);
    return 1.0 - clamp(min(g.x, g.y), 0.0, 1.0);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  ${fractalCommon}

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
  uniform float u_depth;
  uniform float u_splitRadius;
  uniform float u_splitJitter;

  varying vec2 vGridPos;

  ${fractalCommon}
  ${fractalLines}

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // Walk the quadtree from the root. the alive flag stays 1 only along the chain of
    // cells that have subdivided so far, so a level's lines are drawn exactly
    // where its parent split — no explicit tree, no recursion.
    float lines = 0.0;
    float alive = 1.0;
    float depthReached = 0.0;
    vec2  c  = coord;
    float sc = 1.0; // 2^level

    for (int i = 0; i < 6; i++){
      float fi = float(i);

      float lw  = max(u_lineWidth * (1.0 - fi * 0.1), 0.35);
      float dim = pow(0.84, fi);
      lines = max(lines, gridLines(c, lw) * dim * alive);

      // Does the cell we are standing in at this level subdivide? The radius
      // halves with depth, which is what makes the refinement self-similar
      // rather than just one big blurred blob around the focus.
      vec2  id     = floor(c);
      vec2  centre = (id + 0.5) / sc;
      float d      = length(centre - focus);
      float h      = hash21(id + fi * 17.3);
      float rad    = (u_splitRadius / sc) * (1.0 + (h - 0.5) * u_splitJitter);

      float want = step(d, rad) * step(fi + 1.0, u_depth);
      alive *= want;
      depthReached += alive;

      c  *= 2.0;
      sc *= 2.0;
    }

    // the leaf cell this fragment actually landed in
    vec2 leafC  = coord * exp2(depthReached);
    vec2 leafId = floor(leafC);
    float leafH = hash21(leafId + depthReached * 3.7);

    float major = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      major = gridLines(coord / u_sectionSize, u_sectionWidth);
    }

    // ---- line animation --------------------------------------------------
    float lineAnim = 1.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      lineAnim = 0.5 + 0.5 * sin(length(coord - focus) * u_animScale - t);
    } else if (u_lineMode < 2.5){
      lineAnim = 0.5 + 0.5 * sin(dot(coord, vec2(0.5, 0.5)) * u_animScale - t);
    } else if (u_lineMode < 3.5){
      float s = fract((coord.x + coord.y) * 0.05 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    // ---- leaf-cell fill --------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5 && u_cellMode < 1.5){
      cell = 0.5 + 0.5 * sin(dot(leafId, vec2(0.7, 0.3)) * u_animScale - t);
    } else if (u_cellMode < 2.5){
      cell = 0.5 + 0.5 * sin(t * (0.6 + leafH) + leafH * TAU);
    } else if (u_cellMode < 3.5){
      cell = smoothstep(0.6, 1.0, sin(length(coord - focus) * u_animScale - t));
    } else if (u_cellMode < 4.5){
      cell = mod(leafId.x + leafId.y, 2.0) * (0.5 + 0.5 * sin(t));
    }
    cell *= u_animIntensity;
    vec2 lf = abs(fract(leafC) - 0.5);
    cell *= smoothstep(0.5, 0.32, max(lf.x, lf.y));

    // deeper cells lean toward the accent colour, so refinement is legible
    float depthT = depthReached / max(u_depth, 1.0);

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += u_cellColor * cell * 0.55;                    a = max(a, cell * 0.5);
    float linesI = lines * lineAnim;
    col += mix(u_lineColor, u_sectionColor, depthT) * linesI * 1.35;
    a = max(a, linesI);
    float majorI = major * lineAnim;
    col += u_sectionColor * majorI;                     a = max(a, majorI);
    col += u_glowColor * (linesI * depthT * 0.5 + cell * 0.2) * u_animIntensity;

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

export const FractalGridMaterial = shaderMaterial(
    {
        u_time: fractalGridMaterialDefaults.u_time,
        u_cellSize: fractalGridMaterialDefaults.u_cellSize,
        u_lineWidth: fractalGridMaterialDefaults.u_lineWidth,
        u_sectionSize: fractalGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: fractalGridMaterialDefaults.u_sectionWidth,
        u_lineColor: fractalGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: fractalGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: fractalGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: fractalGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: fractalGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: fractalGridMaterialDefaults.u_bgOpacity,
        u_lineMode: fractalGridMaterialDefaults.u_lineMode,
        u_cellMode: fractalGridMaterialDefaults.u_cellMode,
        u_animSpeed: fractalGridMaterialDefaults.u_animSpeed,
        u_animScale: fractalGridMaterialDefaults.u_animScale,
        u_animIntensity: fractalGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: fractalGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: fractalGridMaterialDefaults.u_fadeStrength,
        u_focus: fractalGridMaterialDefaults.u_focus.clone(),
        u_mouse: fractalGridMaterialDefaults.u_mouse.clone(),
        u_displace: fractalGridMaterialDefaults.u_displace,
        u_reveal: fractalGridMaterialDefaults.u_reveal,
        u_depth: fractalGridMaterialDefaults.u_depth,
        u_splitRadius: fractalGridMaterialDefaults.u_splitRadius,
        u_splitJitter: fractalGridMaterialDefaults.u_splitJitter,
    },
    vertex,
    fragment,
);

extend({ FractalGridMaterial });
