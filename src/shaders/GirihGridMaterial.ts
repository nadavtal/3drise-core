import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * An Islamic star pattern drawn by Hankin polygons-in-contact. One ray per dihedral sector, from the edge midpoint to the sector bisector, generates the whole interlaced star-and-rosette strapwork over an octagon-square, hexagonal or trihexagonal tiling.
 *
 * Shares the grid vocabulary with the other shader-plane grids (lineMode /
 * cellMode 0..4, fade, reveal, focus), so the same controller drives it.
 */
export interface GirihGridMaterialUniforms {
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
    /** base tiling: 0 = 4.8.8, 1 = regular hexagons, 2 = 3.6.3.6 (trihexagonal) */
    u_tiling: number;
    /** Hankin contact angle in degrees (20..85); 67.5 is the classic 8-point star */
    u_contactAngle: number;
    /** width of the strapwork band, in cell units */
    u_strapWidth: number;
    /** degrees the contact angle drifts around its value, morphing the pattern */
    u_angleDrift: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        girihGridMaterial: ThreeElements['shaderMaterial'] & Partial<GirihGridMaterialUniforms>;
    }
}

export const girihGridMaterialDefaults: GirihGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 4,
    u_lineWidth: 1.2,
    u_sectionSize: 3,
    u_sectionWidth: 0.8,
    u_lineColor: new THREE.Color('#f2c469'),
    u_sectionColor: new THREE.Color('#3f6fc4'),
    u_cellColor: new THREE.Color('#12616f'),
    u_glowColor: new THREE.Color('#38c4c8'),
    u_bgColor: new THREE.Color('#05070a'),
    u_bgOpacity: 0,
    u_lineMode: 2,
    u_cellMode: 2,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.25,
    u_fadeDistance: 25,
    u_fadeStrength: 0.65,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1.0,
    u_tiling: 0,
    u_contactAngle: 67.5,
    u_strapWidth: 0.07,
    u_angleDrift: 5,
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

  
  uniform float u_tiling;
  uniform float u_contactAngle;
  uniform float u_strapWidth;
  uniform float u_angleDrift;

  const float SQ3  = 1.7320508;
  const float SQ3H = 0.8660254;

  vec2 girihRot(vec2 v, float a){
    float c = cos(a), s = sin(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  float girihSeg(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-9), 0.0, 1.0);
    return length(pa - ba * h);
  }

  // nearest centre of the unit triangular lattice (neighbours at 0, 60, ... degrees)
  vec2 girihHex(vec2 p){
    vec2 s = vec2(1.0, SQ3);
    vec4 hc = floor(vec4(p, p - vec2(0.5, SQ3H)) / s.xyxy) + 0.5;
    vec2 a = p - hc.xy * s;
    vec2 b = p - (hc.zw + 0.5) * s;
    return dot(a, a) < dot(b, b) ? p - a : p - b;
  }

  // Which polygon of the base tiling covers p, and the Hankin strands in it.
  //   dU, dL    distance to the strand passing over / under at the edge midpoint
  //   inStar    signed distance into the star interior (positive inside)
  //   dEdge     distance to the polygon edge (the construction line)
  //   pc        polygon centre, cellId  lattice index of the cell it belongs to
  //   sAlong    distance travelled along the strand from the edge midpoint
  void girihPattern(vec2 p, float th, out float dU, out float dL, out float inStar,
                    out float dEdge, out vec2 pc, out vec2 cellId, out float sAlong){
    float n = 8.0, apo = 0.5, rot = 0.0;
    vec2 local = vec2(0.0);
    if (u_tiling < 0.5){
      // 4.8.8: octagons on the integers, 45-degree squares at the half integers
      vec2 c = floor(p + 0.5);
      vec2 d = p - c;
      if ((abs(d.x) + abs(d.y)) * 0.70710678 <= 0.5){
        pc = c; local = d; n = 8.0; apo = 0.5; rot = 0.0;
      } else {
        pc = floor(p) + 0.5; local = p - pc; n = 4.0; apo = 0.20710678; rot = PI * 0.25;
      }
      cellId = floor(pc);
    } else if (u_tiling < 1.5){
      // regular hexagons: the Voronoi cells of the triangular lattice
      pc = girihHex(p); local = p - pc; n = 6.0; apo = 0.5; rot = 0.0;
      float j = floor(pc.y / SQ3H + 0.5);
      cellId = vec2(floor(pc.x - 0.5 * j + 0.5), j);
    } else {
      // 3.6.3.6: smaller hexagons on the same lattice, triangles in the gaps
      vec2 hc = girihHex(p);
      vec2 hl = p - hc;
      float j = floor(hc.y / SQ3H + 0.5);
      cellId = vec2(floor(hc.x - 0.5 * j + 0.5), j);
      vec2 qh = girihRot(hl, -PI / 6.0);
      float kh = floor(atan(qh.y, qh.x) / (PI / 3.0) + 0.5);
      float inHex = girihRot(qh, -kh * PI / 3.0).x;
      if (inHex <= SQ3 * 0.25){
        pc = hc; local = hl; n = 6.0; apo = SQ3 * 0.25; rot = PI / 6.0;
      } else {
        // the triangle sits on the Voronoi vertex of the sector the point is in
        float b = PI / 6.0 + floor(mod(atan(hl.y, hl.x), TAU) / (PI / 3.0)) * (PI / 3.0);
        pc = hc + vec2(cos(b), sin(b)) / SQ3;
        local = p - pc; n = 3.0; apo = SQ3 / 12.0; rot = b + PI;
      }
    }

    // fold into the sector of the nearest edge: midpoint at (apo, 0)
    float alpha = PI / n;
    vec2 q = girihRot(local, -rot);
    float k = floor(atan(q.y, q.x) / (2.0 * alpha) + 0.5);
    q = girihRot(q, -k * 2.0 * alpha);

    float t2 = clamp(th, radians(12.0), alpha + radians(78.0));
    vec2  M  = vec2(apo, 0.0);
    vec2  dir = vec2(-sin(t2), cos(t2));
    float s  = apo * sin(alpha) / max(cos(t2 - alpha), 0.04);
    vec2  P  = M + s * dir;
    dU = girihSeg(q, M, P);
    dL = girihSeg(q, M, vec2(P.x, -P.y));
    // the star interior is the centre side of the strand line
    vec2 qa = vec2(q.x, abs(q.y));
    inStar = -dir.y * (qa.x - apo) + dir.x * qa.y;
    dEdge  = apo - q.x;
    sAlong = clamp(dot(qa - M, dir), 0.0, s);
  }


  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      float cs = max(u_cellSize, 1e-4);
      float t  = u_time * u_animSpeed;
      float th = radians(u_contactAngle + u_angleDrift * sin(t * 0.21));
      float dU, dL, inStar, dEdge, sAlong;
      vec2 pc, cellId;
      girihPattern(position.xy / cs, th, dU, dL, inStar, dEdge, pc, cellId, sAlong);
      // carved relief: the star interiors stand proud of the strapwork, with a
      // transition wide enough for the mesh to resolve smoothly
      float hw = max(u_strapWidth, 0.01) * 0.5;
      float relief = smoothstep(-0.02, hw + 0.12, inStar);
      float breath = 0.5 + 0.5 * sin(length(position.xy) / cs * u_animScale - t);
      pos.z += u_displace * (0.6 * relief + 0.4 * breath);
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

  
  uniform float u_tiling;
  uniform float u_contactAngle;
  uniform float u_strapWidth;
  uniform float u_angleDrift;

  const float SQ3  = 1.7320508;
  const float SQ3H = 0.8660254;

  vec2 girihRot(vec2 v, float a){
    float c = cos(a), s = sin(a);
    return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
  }

  float girihSeg(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-9), 0.0, 1.0);
    return length(pa - ba * h);
  }

  // nearest centre of the unit triangular lattice (neighbours at 0, 60, ... degrees)
  vec2 girihHex(vec2 p){
    vec2 s = vec2(1.0, SQ3);
    vec4 hc = floor(vec4(p, p - vec2(0.5, SQ3H)) / s.xyxy) + 0.5;
    vec2 a = p - hc.xy * s;
    vec2 b = p - (hc.zw + 0.5) * s;
    return dot(a, a) < dot(b, b) ? p - a : p - b;
  }

  // Which polygon of the base tiling covers p, and the Hankin strands in it.
  //   dU, dL    distance to the strand passing over / under at the edge midpoint
  //   inStar    signed distance into the star interior (positive inside)
  //   dEdge     distance to the polygon edge (the construction line)
  //   pc        polygon centre, cellId  lattice index of the cell it belongs to
  //   sAlong    distance travelled along the strand from the edge midpoint
  void girihPattern(vec2 p, float th, out float dU, out float dL, out float inStar,
                    out float dEdge, out vec2 pc, out vec2 cellId, out float sAlong){
    float n = 8.0, apo = 0.5, rot = 0.0;
    vec2 local = vec2(0.0);
    if (u_tiling < 0.5){
      // 4.8.8: octagons on the integers, 45-degree squares at the half integers
      vec2 c = floor(p + 0.5);
      vec2 d = p - c;
      if ((abs(d.x) + abs(d.y)) * 0.70710678 <= 0.5){
        pc = c; local = d; n = 8.0; apo = 0.5; rot = 0.0;
      } else {
        pc = floor(p) + 0.5; local = p - pc; n = 4.0; apo = 0.20710678; rot = PI * 0.25;
      }
      cellId = floor(pc);
    } else if (u_tiling < 1.5){
      // regular hexagons: the Voronoi cells of the triangular lattice
      pc = girihHex(p); local = p - pc; n = 6.0; apo = 0.5; rot = 0.0;
      float j = floor(pc.y / SQ3H + 0.5);
      cellId = vec2(floor(pc.x - 0.5 * j + 0.5), j);
    } else {
      // 3.6.3.6: smaller hexagons on the same lattice, triangles in the gaps
      vec2 hc = girihHex(p);
      vec2 hl = p - hc;
      float j = floor(hc.y / SQ3H + 0.5);
      cellId = vec2(floor(hc.x - 0.5 * j + 0.5), j);
      vec2 qh = girihRot(hl, -PI / 6.0);
      float kh = floor(atan(qh.y, qh.x) / (PI / 3.0) + 0.5);
      float inHex = girihRot(qh, -kh * PI / 3.0).x;
      if (inHex <= SQ3 * 0.25){
        pc = hc; local = hl; n = 6.0; apo = SQ3 * 0.25; rot = PI / 6.0;
      } else {
        // the triangle sits on the Voronoi vertex of the sector the point is in
        float b = PI / 6.0 + floor(mod(atan(hl.y, hl.x), TAU) / (PI / 3.0)) * (PI / 3.0);
        pc = hc + vec2(cos(b), sin(b)) / SQ3;
        local = p - pc; n = 3.0; apo = SQ3 / 12.0; rot = b + PI;
      }
    }

    // fold into the sector of the nearest edge: midpoint at (apo, 0)
    float alpha = PI / n;
    vec2 q = girihRot(local, -rot);
    float k = floor(atan(q.y, q.x) / (2.0 * alpha) + 0.5);
    q = girihRot(q, -k * 2.0 * alpha);

    float t2 = clamp(th, radians(12.0), alpha + radians(78.0));
    vec2  M  = vec2(apo, 0.0);
    vec2  dir = vec2(-sin(t2), cos(t2));
    float s  = apo * sin(alpha) / max(cos(t2 - alpha), 0.04);
    vec2  P  = M + s * dir;
    dU = girihSeg(q, M, P);
    dL = girihSeg(q, M, vec2(P.x, -P.y));
    // the star interior is the centre side of the strand line
    vec2 qa = vec2(q.x, abs(q.y));
    inStar = -dir.y * (qa.x - apo) + dir.x * qa.y;
    dEdge  = apo - q.x;
    sAlong = clamp(dot(qa - M, dir), 0.0, s);
  }


  void main(){
    float cs = max(u_cellSize, 1e-4);
    vec2 coord = vGridPos / cs;
    vec2 focus = u_focus / cs;
    float t = u_time * u_animSpeed;
    vec2  fw  = fwidth(coord);
    float pix = length(fw) * 0.7071;         // cell units per pixel
    float pixMax = max(fw.x, fw.y);

    // the contact angle drifts slowly, morphing the stars between patterns
    float th = radians(u_contactAngle + u_angleDrift * sin(t * 0.21));
    float dU, dL, inStar, dEdge, sAlong;
    vec2 pc, cellId;
    girihPattern(coord, th, dU, dL, inStar, dEdge, pc, cellId, sAlong);

    // --- strapwork: a band with two thin edge lines, drawn in pixels -------
    float hw  = max(u_strapWidth, 0.01) * 0.5 / pix;    // half band width, px
    float ow  = max(u_lineWidth, 0.1) * 0.9;           // outline half width, px
    float du  = dU / pix;
    float dl  = dL / pix;
    // interlace: the strand on the +y side of an edge midpoint passes over,
    // so the other one is cut where it runs under the band
    float gap   = max(0.2 * hw, 1.0);                  // the over strand casts a clear gap
    float under = smoothstep(hw + gap, hw + gap + 1.0, du);
    float outU  = 1.0 - smoothstep(ow - 0.5, ow + 0.5, abs(du - hw));
    float outL  = (1.0 - smoothstep(ow - 0.5, ow + 0.5, abs(dl - hw))) * under;
    float fillU = 1.0 - smoothstep(hw - 0.5, hw + 0.5, du);
    float fillL = (1.0 - smoothstep(hw - 0.5, hw + 0.5, dl)) * under;
    float lines = max(max(outU, outL), max(fillU, fillL) * 0.36);

    // --- the tiling underneath: faint construction lines ------------------
    float accent = 0.0;
    if (u_sectionWidth > 0.0){
      float aw = u_sectionWidth * 0.5;
      float con = 1.0 - smoothstep(aw - 0.5, aw + 0.5, dEdge / pix);
      float band = 1.0;
      if (u_sectionSize > 0.5){
        float ss = floor(u_sectionSize + 0.5);
        band = max(step(mod(cellId.x, ss), 0.5), step(mod(cellId.y, ss), 0.5));
      }
      accent = con * mix(0.3, 1.0, band);
    }

    // once a strand is finer than about 1.5 px the pattern can only alias,
    // so its contrast falls away into the distance instead
    float res = 1.0 - 0.85 * smoothstep(0.045, 0.14, pixMax);
    lines *= res;
    accent *= res;

    // --- the tilework between the straps ----------------------------------
    // The strands cut every polygon into the star interior and the kite-shaped
    // regions around it; the two take different glazes, as they would in zellij.
    float off  = smoothstep(0.0, 1.5, min(du, dl) - hw);
    float star = off * step(0.0, inStar);
    float kite = off - star;

    float cellH = hash21(pc * 3.7 + 0.21);
    float edgeKeep = star * res;
    float cellDist  = length(coord - focus) * 3.0;
    float flowCoord = sAlong * 20.0;         // light runs out from every crossing
    float scanCoord = (coord.x + coord.y) * 6.0;
    float fadeR = length(vGridPos) / max(u_fadeDistance, 1e-4);

    vec3  extraCol = (u_cellColor * star * 0.8 + u_sectionColor * kite * 0.3) * res;
    float extraA = (star * 0.6 + kite * 0.3) * res;
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

export const GirihGridMaterial = shaderMaterial(
    {
        u_time: girihGridMaterialDefaults.u_time,
        u_cellSize: girihGridMaterialDefaults.u_cellSize,
        u_lineWidth: girihGridMaterialDefaults.u_lineWidth,
        u_sectionSize: girihGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: girihGridMaterialDefaults.u_sectionWidth,
        u_lineColor: girihGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: girihGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: girihGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: girihGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: girihGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: girihGridMaterialDefaults.u_bgOpacity,
        u_lineMode: girihGridMaterialDefaults.u_lineMode,
        u_cellMode: girihGridMaterialDefaults.u_cellMode,
        u_animSpeed: girihGridMaterialDefaults.u_animSpeed,
        u_animScale: girihGridMaterialDefaults.u_animScale,
        u_animIntensity: girihGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: girihGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: girihGridMaterialDefaults.u_fadeStrength,
        u_focus: girihGridMaterialDefaults.u_focus.clone(),
        u_mouse: girihGridMaterialDefaults.u_mouse.clone(),
        u_displace: girihGridMaterialDefaults.u_displace,
        u_reveal: girihGridMaterialDefaults.u_reveal,
        u_tiling: girihGridMaterialDefaults.u_tiling,
        u_contactAngle: girihGridMaterialDefaults.u_contactAngle,
        u_strapWidth: girihGridMaterialDefaults.u_strapWidth,
        u_angleDrift: girihGridMaterialDefaults.u_angleDrift,
    },
    vertex,
    fragment,
);

extend({ GirihGridMaterial });
