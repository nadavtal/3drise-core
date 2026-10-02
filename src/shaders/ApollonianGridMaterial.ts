import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// =============================================================================
// ApollonianGridMaterial — Apollonian Grid
// =============================================================================
//
// An Apollonian gasket by circle inversion: a point is walked out of nested gaps through the four dual circles, so every tangent circle gets a pixel-true rim. A slow Möbius disk flow re-balances the packing while every tangency holds.
//
// The GLSL is the exact source the Grid Lab preview compiles (Claude outputs/
// grid-lab). The fragment shader is the shared grid tail (line / cell modes,
// composite, fade, reveal) around this grid's own tiling block, which adds an
// extraCol / extraA emissive layer before the fade.
//

export interface ApollonianGridMaterialUniforms {
    /** elapsed seconds (useGridSurface) */
    u_time: number;
    /** size of one cell, in world units */
    u_cellSize: number;
    /** line thickness, in pixels */
    u_lineWidth: number;
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
    /** ripple / reveal origin; stays at the origin */
    u_focus: THREE.Vector2;
    u_mouse: THREE.Vector2;
    u_displace: number;
    /** 0..1 assemble / dissolve */
    u_reveal: number;
    /** Inversion levels: how deep the packing nests */
    u_depth: number;
    /** Strength of the Möbius flow that re-balances the packing; 0 holds it symmetric */
    u_morph: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        apollonianGridMaterial: ThreeElements['shaderMaterial'] & Partial<ApollonianGridMaterialUniforms>;
    }
}

export const apollonianGridMaterialDefaults: ApollonianGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 2,
    u_lineWidth: 1.1,
    u_sectionSize: 2,
    u_sectionWidth: 2,
    u_lineColor: new THREE.Color('#6a90c8'),
    u_sectionColor: new THREE.Color('#c9e4ff'),
    u_cellColor: new THREE.Color('#1a2f5c'),
    u_glowColor: new THREE.Color('#8fb8ff'),
    u_bgColor: new THREE.Color('#03050c'),
    u_bgOpacity: 0,
    u_lineMode: 0,
    u_cellMode: 1,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.6,
    u_fadeDistance: 25,
    u_fadeStrength: 0.15,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1,
    u_depth: 12,
    u_morph: 0.25,
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
      pos.z += sin(d * u_animScale - t) * u_displace;
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

  uniform float u_depth;
  uniform float u_morph;

  varying vec2 vGridPos;

  
  const float PI  = 3.14159265359;
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }


  float lineAt(float c, float width, float fp){
    float d = abs(fract(c - 0.5) - 0.5);
    return 1.0 - clamp(d / max(fp * max(width, 0.05), 1e-6), 0.0, 1.0);
  }

  vec2 cmul(vec2 a, vec2 b){ return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
  vec2 cdiv(vec2 a, vec2 b){ return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / max(dot(b, b), 1e-8); }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // Apollonian gasket by circle inversion. Inside the unit circle sit three
    // mutually tangent circles of radius 2*sqrt(3)-3. Each of the four
    // curvilinear gaps between the circles is cut out by a "dual" circle through
    // its three tangency points, orthogonal to the circles that bound it.
    // Inverting in a gap's dual circle keeps those circles fixed and maps the
    // fourth circle onto the gap's inscribed circle, so a point is walked out of
    // nested gaps one inversion per level until it lands in a base circle. The
    // number of inversions is its depth; the product of their scale factors takes
    // distances back to the plane, so every circle gets a pixel-true stroke.
    float R  = u_fadeDistance * 0.9;
    vec2  z  = vGridPos / R;
    float fpz = max(max(fwidth(z.x), fwidth(z.y)), 1e-6);

    // A Mobius automorphism of the disk, z -> (z - a) / (1 - conj(a) z), maps the
    // gasket onto another Apollonian gasket. Orbiting a slowly makes the packing
    // flow and re-balance while every circle stays a circle and every tangency holds.
    vec2  am  = u_morph * 0.8 * vec2(cos(t * 0.13), sin(t * 0.19));
    vec2  den = vec2(1.0, 0.0) - cmul(vec2(am.x, -am.y), z);
    vec2  w   = cdiv(z - am, den);
    float J   = (1.0 - dot(am, am)) / max(dot(den, den), 1e-8);   // |dw/dz|

    const float RHO = 0.46410161514;   // 2 sqrt(3) - 3
    const float DC  = 0.53589838486;   // 1 - RHO: centre distance of the three
    const float SQ3 = 1.73205080757;
    float maxD  = clamp(floor(u_depth + 0.5), 1.0, 24.0);
    float depth = 0.0;
    float path  = 0.37;
    float term  = -1.0;
    vec2  cc = vec2(0.0);
    float cr = 1.0;
    for (int i = 0; i < 25; i++){
      // landed in one of the three base circles (centres at 90, 210, 330 deg)?
      for (int k = 0; k < 3; k++){
        float ak = PI * 0.5 + float(k) * TAU / 3.0;
        vec2  ck = DC * vec2(cos(ak), sin(ak));
        if (length(w - ck) < RHO){ term = float(k) + 1.0; cc = ck; cr = RHO; }
      }
      if (term > 0.0) break;
      if (length(w) > 1.0){ term = 0.0; cc = vec2(0.0); cr = 1.0; break; }
      if (depth >= maxD) break;
      // which gap: the central one, or the outer gap facing 30, 150 or 270 deg
      vec2  dcen; float drad; float gap;
      if (length(w) < DC * 0.5){
        dcen = vec2(0.0); drad = DC * 0.5; gap = 0.0;
      } else {
        float ang = atan(w.y, w.x);
        float kk = floor(mod(ang - PI / 6.0 + PI / 3.0, TAU) / (TAU / 3.0));
        float ag = PI / 6.0 + kk * TAU / 3.0;
        dcen = 2.0 * vec2(cos(ag), sin(ag)); drad = SQ3; gap = kk + 1.0;
      }
      vec2  v  = w - dcen;
      float v2 = max(dot(v, v), 1e-10);
      w = dcen + drad * drad * v / v2;
      J *= drad * drad / v2;
      depth += 1.0;
      path = hash21(vec2(path * 17.0 + gap, depth));
    }

    float found = step(-0.5, term);
    float outside = found * step(term, 0.5) * step(depth, 0.5);  // beyond the outer circle
    float dz = abs(length(w - cc) - cr) / max(J, 1e-12);           // distance to this circle, z units
    // this circle's radius, z units. Inside an image of the outer circle the point
    // can sit near the pole of the inversion, where cr/J collapses; the distance
    // to the rim is the safe lower bound there.
    float rz = max(cr / max(J, 1e-12), dz);
    float dens = smoothstep(1.0, 3.0, rz / fpz) * found;           // circles under ~2px fade out

    float lines = (1.0 - clamp(dz / (fpz * max(u_lineWidth, 0.05)), 0.0, 1.0)) * dens;
    float accent = 0.0;
    if (u_sectionWidth > 0.0 && depth < u_sectionSize){
      accent = (1.0 - clamp(dz / (fpz * max(u_sectionWidth, 0.05)), 0.0, 1.0)) * dens;
    }

    float dmin = clamp(dz / max(rz, 1e-9), 0.0, 1.0) * dens * (1.0 - outside);
    // fills are per circle, so the wave and the ripple both step down the levels
    float idAcc = depth * 20.0;
    vec2  cellPos = focus + vec2(depth * 2.0, 0.0);
    float cellH = hash21(vec2(path, term + 1.0));
    float tone = step(0.55, cellH);

    // a soft inner bevel along every rim, brightest on the shallow circles
    float bevel = exp(-pow(dz / max(rz * 0.12, fpz), 2.0)) * dens * (1.0 - outside);
    float lvl = 1.0 / (1.0 + depth * 0.45);
    vec3  extraCol = u_glowColor * (bevel * 0.35 + lines * 0.5) * lvl;
    float extraA = bevel * 0.3 * lvl;

    // ---- line animation --------------------------------------------------
    float lineAnim = 1.0;
    // Mode 0 is static: the chain starts at 0.5 so 0 never falls into flow.
    if (u_lineMode < 0.5){
    } else if (u_lineMode < 1.5){
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

    // ---- cell fill -------------------------------------------------------
    float cell = 0.0;
    if (u_cellMode < 0.5){
    } else if (u_cellMode < 1.5){
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
    col += extraCol;                        a = max(a, extraA);

    col *= fade;
    a   *= fade;

    // ---- reveal ----------------------------------------------------------
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

export const ApollonianGridMaterial = shaderMaterial(
    {
        u_time: apollonianGridMaterialDefaults.u_time,
        u_cellSize: apollonianGridMaterialDefaults.u_cellSize,
        u_lineWidth: apollonianGridMaterialDefaults.u_lineWidth,
        u_sectionSize: apollonianGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: apollonianGridMaterialDefaults.u_sectionWidth,
        u_lineColor: apollonianGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: apollonianGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: apollonianGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: apollonianGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: apollonianGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: apollonianGridMaterialDefaults.u_bgOpacity,
        u_lineMode: apollonianGridMaterialDefaults.u_lineMode,
        u_cellMode: apollonianGridMaterialDefaults.u_cellMode,
        u_animSpeed: apollonianGridMaterialDefaults.u_animSpeed,
        u_animScale: apollonianGridMaterialDefaults.u_animScale,
        u_animIntensity: apollonianGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: apollonianGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: apollonianGridMaterialDefaults.u_fadeStrength,
        u_focus: apollonianGridMaterialDefaults.u_focus.clone(),
        u_mouse: apollonianGridMaterialDefaults.u_mouse.clone(),
        u_displace: apollonianGridMaterialDefaults.u_displace,
        u_reveal: apollonianGridMaterialDefaults.u_reveal,
        u_depth: apollonianGridMaterialDefaults.u_depth,
        u_morph: apollonianGridMaterialDefaults.u_morph,
    },
    vertex,
    fragment,
);

extend({ ApollonianGridMaterial });
