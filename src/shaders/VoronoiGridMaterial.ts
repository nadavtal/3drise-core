import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface VoronoiGridMaterialUniforms {
    u_time: number;
    /** average cell width, in world units */
    u_cellSize: number;
    /** cell-edge thickness, in pixels */
    u_lineWidth: number;
    /** how many cells make one accent group */
    u_sectionSize: number;
    /** nucleus size; 0 hides the nuclei */
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
    /** 0 = regular square lattice, 1 = fully scattered seeds */
    u_jitter: number;
    /** how far the seeds wander over time; 0 freezes the lattice */
    u_drift: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        voronoiGridMaterial: ThreeElements['shaderMaterial'] & Partial<VoronoiGridMaterialUniforms>;
    }
}

export const voronoiGridMaterialDefaults: VoronoiGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 2.0,
    u_lineWidth: 1.4,
    u_sectionSize: 4.0,
    u_sectionWidth: 1.0,
    u_lineColor: new THREE.Color(0.35, 0.2, 0.62),
    u_sectionColor: new THREE.Color(0.85, 0.6, 1.0),
    u_cellColor: new THREE.Color(0.12, 0.05, 0.28),
    u_glowColor: new THREE.Color(0.7, 0.4, 1.0),
    u_bgColor: new THREE.Color(0.02, 0.01, 0.05),
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
    u_jitter: 0.9,
    u_drift: 0.5,
};

/**
 * Shared by both stages.
 *
 * One 3x3 pass yields both the nearest seed distance (F1) and the runner-up
 * (F2). `F2 - F1` goes to zero exactly on a cell boundary, which is the edge
 * field — cheaper than a second pass and stable under animation, since it never
 * has to decide which of two equidistant seeds "won".
 */
const voronoiCommon = /*glsl*/ `
  const float TAU = 6.28318530718;

  vec2 hash22(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  /** x = F1, y = F2, zw = the winning cell's id */
  vec4 voronoi(vec2 x, float jitter, float drift, float t){
    vec2 n = floor(x);
    vec2 f = x - n;
    float f1 = 8.0;
    float f2 = 8.0;
    vec2 winner = n;

    for (int j = -1; j <= 1; j++){
      for (int i = -1; i <= 1; i++){
        vec2 g = vec2(float(i), float(j));
        vec2 h = hash22(n + g);
        vec2 off = (h - 0.5) * clamp(jitter, 0.0, 1.0);
        if (drift > 0.0){
          off += drift * 0.22 * vec2(
            sin(t * (0.4 + h.x * 0.8) + h.y * TAU),
            cos(t * (0.4 + h.y * 0.8) + h.x * TAU)
          );
        }
        // Keeping every seed inside its own cell is what makes the 3x3
        // neighbourhood sufficient — without the clamp, jitter plus drift can
        // push a seed far enough out that the true nearest one is never tested.
        vec2 o = vec2(0.5) + clamp(off, vec2(-0.49), vec2(0.49));
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < f1){ f2 = f1; f1 = d; winner = n + g; }
        else if (d < f2){ f2 = d; }
      }
    }
    return vec4(sqrt(f1), sqrt(f2), winner);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;
  uniform float u_jitter;
  uniform float u_drift;

  varying vec2 vGridPos;

  ${voronoiCommon}

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      float t = u_time * u_animSpeed;
      vec2 coord = position.xy / max(u_cellSize, 1e-4);
      vec4 v = voronoi(coord, u_jitter, u_drift, t);
      vec2 h = hash22(v.zw);
      // One height per cell, so the surface breaks into irregular plates. The
      // height rides a smooth field with only a hashed nudge per cell —
      // uncorrelated neighbours would shred the mesh — and the plate ramps back
      // to that field near the membrane, so the walls bevel instead of
      // sawtoothing across whatever triangles straddle the boundary.
      float smoothLift = 0.5 + 0.5 * sin(length(coord) * u_animScale - t);
      float plate = clamp(smoothLift + (h.x - 0.5) * 0.5, 0.0, 1.0);
      float flatness = smoothstep(0.0, 0.3, v.y - v.x);
      pos.z += mix(smoothLift, plate, flatness) * u_displace;
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
  uniform float u_jitter;
  uniform float u_drift;

  varying vec2 vGridPos;

  ${voronoiCommon}

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;
    float px = max(length(fwidth(coord)), 1e-6);

    vec4 v = voronoi(coord, u_jitter, u_drift, t);
    float f1 = v.x;
    float f2 = v.y;
    vec2 id = v.zw;
    vec2 h  = hash22(id);

    // membrane between cells
    float edge = 1.0 - smoothstep(0.0, px * max(u_lineWidth, 0.05) * 2.0, f2 - f1);

    // accent membranes: whole clusters of cells share one group id
    float group = 0.0;
    if (u_sectionSize > 0.0){
      vec2 gid = floor(id / u_sectionSize);
      group = step(0.5, hash22(gid).x);
    }

    // ---- membrane animation ---------------------------------------------
    float lineAnim = 1.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      lineAnim = 0.5 + 0.5 * sin(length(id + 0.5 - focus) * u_animScale - t);
    } else if (u_lineMode < 2.5){
      // charge running along the membranes
      lineAnim = 0.35 + 0.65 * pow(fract(dot(coord, vec2(0.35, 0.2)) * u_animScale - t * 0.25), 6.0);
    } else if (u_lineMode < 3.5){
      float s = fract((coord.x + coord.y) * 0.05 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    // ---- cell fill ------------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5 && u_cellMode < 1.5){
      cell = 0.5 + 0.5 * sin(dot(id, vec2(0.7, 0.3)) * u_animScale - t);
    } else if (u_cellMode < 2.5){
      cell = 0.5 + 0.5 * sin(t * (0.6 + h.x) + h.y * TAU);
    } else if (u_cellMode < 3.5){
      // cells fire in rings out from the focus, like a signal propagating
      cell = smoothstep(0.6, 1.0, sin(length(id + 0.5 - focus) * u_animScale - t));
    } else if (u_cellMode < 4.5){
      cell = step(0.5, h.x) * (0.5 + 0.5 * sin(t));
    }
    cell *= u_animIntensity;
    // brighten the fill toward the nucleus, so each cell reads as a volume
    // rather than a flat patch
    cell *= mix(0.45, 1.0, 1.0 - smoothstep(0.0, 0.7, f1));

    // ---- nuclei ---------------------------------------------------------
    float nucleus = 0.0;
    if (u_sectionWidth > 0.0){
      float nr = 0.05 * u_sectionWidth;
      nucleus = 1.0 - smoothstep(nr, nr + px * 2.0, f1);
    }

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += u_cellColor * cell;                        a = max(a, cell * 0.9);
    float edgeI = edge * lineAnim;
    col += mix(u_lineColor, u_sectionColor, group) * edgeI;
    a = max(a, edgeI);
    float nucI = nucleus * (0.4 + 0.6 * cell + 0.4 * lineAnim);
    col += u_sectionColor * nucI;                     a = max(a, nucI);
    col += u_glowColor * (edgeI * 0.25 + nucI * 0.8 + cell * 0.2) * u_animIntensity;

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

export const VoronoiGridMaterial = shaderMaterial(
    {
        u_time: voronoiGridMaterialDefaults.u_time,
        u_cellSize: voronoiGridMaterialDefaults.u_cellSize,
        u_lineWidth: voronoiGridMaterialDefaults.u_lineWidth,
        u_sectionSize: voronoiGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: voronoiGridMaterialDefaults.u_sectionWidth,
        u_lineColor: voronoiGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: voronoiGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: voronoiGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: voronoiGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: voronoiGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: voronoiGridMaterialDefaults.u_bgOpacity,
        u_lineMode: voronoiGridMaterialDefaults.u_lineMode,
        u_cellMode: voronoiGridMaterialDefaults.u_cellMode,
        u_animSpeed: voronoiGridMaterialDefaults.u_animSpeed,
        u_animScale: voronoiGridMaterialDefaults.u_animScale,
        u_animIntensity: voronoiGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: voronoiGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: voronoiGridMaterialDefaults.u_fadeStrength,
        u_focus: voronoiGridMaterialDefaults.u_focus.clone(),
        u_mouse: voronoiGridMaterialDefaults.u_mouse.clone(),
        u_displace: voronoiGridMaterialDefaults.u_displace,
    u_reveal: voronoiGridMaterialDefaults.u_reveal,
        u_jitter: voronoiGridMaterialDefaults.u_jitter,
        u_drift: voronoiGridMaterialDefaults.u_drift,
    },
    vertex,
    fragment,
);

extend({ VoronoiGridMaterial });
