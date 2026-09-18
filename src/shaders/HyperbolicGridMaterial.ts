import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * An Escher-style {p,q} tiling of the Poincare disk. A slow Mobius translation glides the tiling through itself, and the tiles shrink without end toward the rim.
 *
 * Shares the grid vocabulary with the other shader-plane grids (lineMode /
 * cellMode 0..4, fade, reveal, focus), so the same controller drives it.
 */
export interface HyperbolicGridMaterialUniforms {
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
    /** sides of each polygon (p), 3..12 */
    u_sides: number;
    /** polygons around each vertex (q), 3..12; raised in the shader until (p-2)(q-2) > 4 */
    u_valence: number;
    /** 0..1, how far the tiling glides through itself */
    u_drift: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        hyperbolicGridMaterial: ThreeElements['shaderMaterial'] & Partial<HyperbolicGridMaterialUniforms>;
    }
}

export const hyperbolicGridMaterialDefaults: HyperbolicGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 22,
    u_lineWidth: 1.4,
    u_sectionSize: 3,
    u_sectionWidth: 1,
    u_lineColor: new THREE.Color('#c9a4ff'),
    u_sectionColor: new THREE.Color('#ffd9f2'),
    u_cellColor: new THREE.Color('#2a1446'),
    u_glowColor: new THREE.Color('#b07cff'),
    u_bgColor: new THREE.Color('#07030c'),
    u_bgOpacity: 0,
    u_lineMode: 1,
    u_cellMode: 2,
    u_animSpeed: 1,
    u_animScale: 1.2,
    u_animIntensity: 0.7,
    u_fadeDistance: 25,
    u_fadeStrength: 0.2,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1.0,
    u_sides: 7,
    u_valence: 3,
    u_drift: 0.5,
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


  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      float t = u_time * u_animSpeed;
      float d = length(position.xy) / max(u_cellSize, 1e-4);
      pos.z += sin(d * 6.0 * u_animScale - t) * u_displace * smoothstep(1.0, 0.6, d);
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


  uniform float u_sides;
  uniform float u_valence;
  uniform float u_drift;

  vec2 cmul(vec2 a, vec2 b){ return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
  vec2 cdiv(vec2 a, vec2 b){ return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / max(dot(b, b), 1e-12); }
  vec2 rot2(vec2 v, float an){ float c = cos(an), s = sin(an); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

  void main(){
    float Rd = max(u_cellSize, 1e-3);         // Poincare disk radius, world units
    float t  = u_time * u_animSpeed;
    vec2  zw = vGridPos / Rd;
    float rr = length(zw);
    float pixD = length(fwidth(vGridPos)) * 0.7071 / Rd;   // one pixel, in disk units
    float inDisk = 1.0 - smoothstep(1.0 - pixD, 1.0, rr);

    // {p,q}: regular p-gons, q of them around every vertex. The tiling is
    // hyperbolic only when (p-2)(q-2) > 4, so q is raised until it is.
    float p = floor(clamp(u_sides, 3.0, 12.0) + 0.5);
    float q = floor(clamp(u_valence, 3.0, 12.0) + 0.5);
    q = max(q, floor(4.0 / (p - 2.0)) + 3.0);

    // Fundamental triangle: angle pi/p at the centre, pi/q at a polygon
    // vertex, a right angle at an edge midpoint. Its third side is a geodesic,
    // a circle orthogonal to the unit circle (d^2 = 1 + r^2) that meets the
    // ray at angle pi/p at angle pi/q.
    float al = PI / p;
    float sa = sin(al), cb = cos(PI / q);
    float rc = 1.0 / sqrt(max(cb * cb / (sa * sa) - 1.0, 1e-4));
    vec2  C  = vec2(rc * cb / sa, 0.0);

    // A Mobius translation is a hyperbolic isometry: it glides the whole
    // tiling through itself without distorting a single tile.
    vec2 mob = u_focus / Rd * 0.9 + u_drift * 0.45 * vec2(cos(t * 0.11), sin(t * 0.07));
    mob *= min(1.0, 0.92 / max(length(mob), 1e-6));
    vec2 den = vec2(1.0, 0.0) - cmul(vec2(mob.x, -mob.y), zw);
    vec2 z = rot2(cdiv(zw - mob, den), t * 0.02 * u_drift);
    // |dz/dzw|, carried through every fold so widths can be measured in pixels
    float scale = (1.0 - dot(mob, mob)) / max(dot(den, den), 1e-9);

    // Fold into the central polygon: reflect into the fundamental sector, and
    // whenever the point lies beyond the polygon's edge, invert it through
    // that edge's circle, which steps one polygon closer to the centre.
    float depth = 0.0;
    float idAcc = 0.0;
    for (int i = 0; i < 48; i++){
      float k = floor(atan(z.y, z.x) / (2.0 * al) + 0.5);
      z = rot2(z, -k * 2.0 * al);
      float mir = step(z.y, 0.0);
      z.y = abs(z.y);
      vec2 v = z - C;
      float l2 = dot(v, v);
      if (l2 >= rc * rc) break;
      z = C + v * (rc * rc / l2);
      scale *= rc * rc / l2;
      depth += 1.0;
      // the fold choices made before each inversion name the polygon
      idAcc = fract(idAcc * 1.6180339 + (k + p) * 0.0731 + mir * 0.3713);
    }

    float toPx = 1.0 / max(scale * pixD, 1e-9);   // folded units -> pixels

    // Widths are constant in hyperbolic length, so tiles thin out towards the
    // rim exactly as the tiling does. Coverage fades once a line is sub-pixel.
    float dEdge = (length(z - C) - rc) * toPx;
    float wEdge = u_lineWidth * 0.0045 * toPx;
    float hw = max(wEdge, 1.0) * 0.5;
    float edgeLine = min(wEdge, 1.0) * (1.0 - smoothstep(hw, hw + 1.0, dEdge));

    // the polygon's mirror axes: radii to its vertices and edge midpoints
    float spoke = 0.0;
    if (u_sectionWidth > 0.0){
      float dSpoke = min(z.y, abs(dot(z, vec2(-sin(al), cos(al))))) * toPx;
      float wSpoke = u_sectionWidth * 0.0025 * toPx;
      float hs = max(wSpoke, 1.0) * 0.5;
      spoke = min(wSpoke, 1.0) * (1.0 - smoothstep(hs, hs + 1.0, dSpoke));
    }
    // every Nth generation of polygons draws its edges as accents
    float isSection = u_sectionSize > 0.0 ? step(mod(depth, max(floor(u_sectionSize + 0.5), 1.0)), 0.5) : 0.0;

    float lines  = edgeLine;
    float accent = max(spoke * 0.5, edgeLine * isSection);

    float cellH = hash21(vec2(idAcc * 91.7, depth + 0.5));
    float cellDist  = depth;
    float flowCoord = depth + atan(zw.y, zw.x) * 0.95;
    float scanCoord = rr * 40.0;
    float edgeKeep  = smoothstep(0.0, 3.0, dEdge - wEdge);
    float fadeR = rr * Rd / max(u_fadeDistance, 1e-4);

    // The boundary circle is infinitely far away; a thin rim and a faint
    // glow mark where the plane ends.
    float rim = 1.0 - smoothstep(0.0, pixD * 1.5, abs(rr - 1.0));
    float halo = smoothstep(0.7, 1.0, rr) * inDisk * 0.06;
    vec3  extraCol = u_sectionColor * rim * 0.9 + u_glowColor * halo;
    float extraA = max(rim * 0.9, halo);
    float regionMask = inDisk;

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

export const HyperbolicGridMaterial = shaderMaterial(
    {
        u_time: hyperbolicGridMaterialDefaults.u_time,
        u_cellSize: hyperbolicGridMaterialDefaults.u_cellSize,
        u_lineWidth: hyperbolicGridMaterialDefaults.u_lineWidth,
        u_sectionSize: hyperbolicGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: hyperbolicGridMaterialDefaults.u_sectionWidth,
        u_lineColor: hyperbolicGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: hyperbolicGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: hyperbolicGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: hyperbolicGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: hyperbolicGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: hyperbolicGridMaterialDefaults.u_bgOpacity,
        u_lineMode: hyperbolicGridMaterialDefaults.u_lineMode,
        u_cellMode: hyperbolicGridMaterialDefaults.u_cellMode,
        u_animSpeed: hyperbolicGridMaterialDefaults.u_animSpeed,
        u_animScale: hyperbolicGridMaterialDefaults.u_animScale,
        u_animIntensity: hyperbolicGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: hyperbolicGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: hyperbolicGridMaterialDefaults.u_fadeStrength,
        u_focus: hyperbolicGridMaterialDefaults.u_focus.clone(),
        u_mouse: hyperbolicGridMaterialDefaults.u_mouse.clone(),
        u_displace: hyperbolicGridMaterialDefaults.u_displace,
        u_reveal: hyperbolicGridMaterialDefaults.u_reveal,
        u_sides: hyperbolicGridMaterialDefaults.u_sides,
        u_valence: hyperbolicGridMaterialDefaults.u_valence,
        u_drift: hyperbolicGridMaterialDefaults.u_drift,
    },
    vertex,
    fragment,
);

extend({ HyperbolicGridMaterial });
