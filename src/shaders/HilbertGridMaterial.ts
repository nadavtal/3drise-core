import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// =============================================================================
// HilbertGridMaterial — Hilbert Grid
// =============================================================================
//
// A closed Moore curve — four Hilbert curves joined into one loop — threads every cell once while keeping neighbours on the line neighbours on the plane. Signals with exponential trails circulate along it; the accent is the same curve one level coarser.
//
// The GLSL is the exact source the Grid Lab preview compiles (Claude outputs/
// grid-lab). The fragment shader is the shared grid tail (line / cell modes,
// composite, fade, reveal) around this grid's own tiling block, which adds an
// extraCol / extraA emissive layer before the fade.
//

export interface HilbertGridMaterialUniforms {
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
    /** Curve order: the loop covers 2^order cells per side */
    u_order: number;
    /** Signals circulating round the loop */
    u_signals: number;
    /** Length of each signal trail, in cells */
    u_trail: number;
    /** Signal speed, in cells per second */
    u_signalSpeed: number;
    /** accumulated on the CPU from signalSpeed (never multiplied by time in the shader) */
    u_signalPhase: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        hilbertGridMaterial: ThreeElements['shaderMaterial'] & Partial<HilbertGridMaterialUniforms>;
    }
}

export const hilbertGridMaterialDefaults: HilbertGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 0.8,
    u_lineWidth: 1.2,
    u_sectionSize: 8,
    u_sectionWidth: 3,
    u_lineColor: new THREE.Color('#2a8a5c'),
    u_sectionColor: new THREE.Color('#1d4d37'),
    u_cellColor: new THREE.Color('#082016'),
    u_glowColor: new THREE.Color('#5dffb0'),
    u_bgColor: new THREE.Color('#020805'),
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
    u_reveal: 1,
    u_order: 6,
    u_signals: 12,
    u_trail: 40,
    u_signalSpeed: 10,
    u_signalPhase: 0,
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

  uniform float u_order;
  uniform float u_signals;
  uniform float u_trail;
  uniform float u_signalPhase;

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

  // Hilbert index of cell (x, y) on an n x n grid (n a power of two); the curve
  // starts at (0, 0) and ends at (n - 1, 0).
  int hilbertXY2D(int n, int x, int y){
    int d = 0;
    for (int s = n / 2; s > 0; s /= 2){
      int rx = (x & s) > 0 ? 1 : 0;
      int ry = (y & s) > 0 ? 1 : 0;
      d += s * s * ((3 * rx) ^ ry);
      if (ry == 0){
        if (rx == 1){ x = n - 1 - x; y = n - 1 - y; }
        int tt = x; x = y; y = tt;
      }
    }
    return d;
  }
  ivec2 hilbertD2XY(int n, int d){
    int x = 0, y = 0, t = d;
    for (int s = 1; s < n; s *= 2){
      int rx = 1 & (t / 2);
      int ry = 1 & (t ^ rx);
      if (ry == 0){
        if (rx == 1){ x = s - 1 - x; y = s - 1 - y; }
        int tt = x; x = y; y = tt;
      }
      x += s * rx; y += s * ry;
      t /= 4;
    }
    return ivec2(x, y);
  }
  // The Moore curve: four order-(n-1) Hilbert curves turned so they join into
  // one closed loop, so signals circulate forever with no end points.
  int mooreXY2D(int N, ivec2 c){
    int h = N / 2;
    if (c.x < h){
      int q = c.y < h ? 0 : 1;
      ivec2 l = ivec2(c.x, c.y - q * h);
      return q * h * h + hilbertXY2D(h, l.y, h - 1 - l.x);
    }
    int q = c.y >= h ? 2 : 3;
    ivec2 l = ivec2(c.x - h, c.y - (q == 2 ? h : 0));
    return q * h * h + hilbertXY2D(h, h - 1 - l.y, l.x);
  }
  ivec2 mooreD2XY(int N, int d){
    int h = N / 2, hh = h * h, L = N * N;
    d = ((d % L) + L) % L;
    int q = d / hh;
    ivec2 s = hilbertD2XY(h, d - q * hh);
    if (q < 2) return ivec2(h - 1 - s.y, s.x + q * h);
    return ivec2(s.y + h, h - 1 - s.x + (q == 2 ? h : 0));
  }
  float cross2(vec2 a, vec2 b){ return a.x * b.y - a.y * b.x; }
  // Distance to the curve through cell cc of an N x N Moore curve, and the
  // curve parameter there (cells along the loop). Straight runs are segments;
  // turns are quarter arcs, so the curve reads as one smooth line.
  vec2 mooreCurve(vec2 cc, int N, out int dIdx){
    ivec2 ci = ivec2(floor(cc));
    vec2  f  = fract(cc) - 0.5;
    int   d  = mooreXY2D(N, ci);
    dIdx = d;
    vec2 dp = vec2(mooreD2XY(N, d - 1) - ci);
    vec2 dn = vec2(mooreD2XY(N, d + 1) - ci);
    if (dot(dp, dn) < -0.5){
      return vec2(abs(dot(f, vec2(-dn.y, dn.x))), float(d) + dot(f, dn));
    }
    vec2 k  = 0.5 * (dp + dn);
    vec2 v  = f - k;
    vec2 a0 = 0.5 * dp - k;
    float fr = clamp(abs(atan(cross2(a0, v), dot(a0, v))) / (PI * 0.5), 0.0, 1.0);
    return vec2(abs(length(v) - 0.5), float(d) - 0.5 + fr);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // A Hilbert curve is a single line that visits every cell exactly once while
    // keeping neighbours on the line neighbours on the plane — the most local way
    // to string a 2D grid onto 1D. Four of them joined make the closed Moore
    // curve. Signals run along it at a constant speed in cells, so they wind
    // through every corner of the floor like data through a board.
    int   ord = int(clamp(floor(u_order + 0.5), 2.0, 8.0));
    int   N   = 1 << ord;
    float Nf  = float(N);
    vec2  cc  = coord + Nf * 0.5;
    vec2  fc  = fwidth(coord);
    float fp  = max(max(fc.x, fc.y), 1e-6);
    float inside = step(0.0, cc.x) * step(cc.x, Nf) * step(0.0, cc.y) * step(cc.y, Nf);
    vec2  ccl = clamp(cc, vec2(0.0), vec2(Nf - 1e-3));

    int   dIdx;
    vec2  cv = mooreCurve(ccl, N, dIdx);
    float lw = fp * max(u_lineWidth, 0.05);
    float lines = (1.0 - clamp(cv.x / lw, 0.0, 1.0)) * inside;

    // The accent is the same curve sectionSize times coarser — the shape the
    // fine curve is built from, one recursion level up.
    float accent = 0.0;
    int   kS = int(floor(log2(max(u_sectionSize, 1.0)) + 0.5));
    if (u_sectionWidth > 0.0 && kS >= 1 && ord - kS >= 1){
      float sc = float(1 << kS);
      int   d2;
      vec2  cv2 = mooreCurve(ccl / sc, N >> kS, d2);
      accent = (1.0 - clamp(cv2.x / (fp / sc * max(u_sectionWidth, 0.05)), 0.0, 1.0)) * inside;
    }

    // Signals: S heads spaced evenly round the loop, each dragging an
    // exponential trail behind it.
    float Lc = Nf * Nf;
    float S  = max(floor(u_signals + 0.5), 1.0);
    float period = Lc / S;
    float behind = mod(u_signalPhase - cv.y, period);
    float sig  = exp(-behind / max(u_trail, 0.01));
    float core = exp(-pow(cv.x / (lw * 1.6), 2.0));
    float bloom = exp(-pow(cv.x / 0.16, 2.0)) * 0.35;

    vec2  fl = fract(ccl) - 0.5;
    float dmin = (0.5 - max(abs(fl.x), abs(fl.y))) * inside;
    float idAcc = float(dIdx);
    vec2  cellPos = floor(ccl) + 0.5 - Nf * 0.5;
    float cellH = hash21(floor(ccl) * 0.37 + 1.1);
    float tone = step(0.55, cellH);

    vec3  extraCol = u_glowColor * (core + bloom) * sig * 1.6 * inside;
    float extraA = (core + bloom * 0.6) * sig * inside;

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

export const HilbertGridMaterial = shaderMaterial(
    {
        u_time: hilbertGridMaterialDefaults.u_time,
        u_cellSize: hilbertGridMaterialDefaults.u_cellSize,
        u_lineWidth: hilbertGridMaterialDefaults.u_lineWidth,
        u_sectionSize: hilbertGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: hilbertGridMaterialDefaults.u_sectionWidth,
        u_lineColor: hilbertGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: hilbertGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: hilbertGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: hilbertGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: hilbertGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: hilbertGridMaterialDefaults.u_bgOpacity,
        u_lineMode: hilbertGridMaterialDefaults.u_lineMode,
        u_cellMode: hilbertGridMaterialDefaults.u_cellMode,
        u_animSpeed: hilbertGridMaterialDefaults.u_animSpeed,
        u_animScale: hilbertGridMaterialDefaults.u_animScale,
        u_animIntensity: hilbertGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: hilbertGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: hilbertGridMaterialDefaults.u_fadeStrength,
        u_focus: hilbertGridMaterialDefaults.u_focus.clone(),
        u_mouse: hilbertGridMaterialDefaults.u_mouse.clone(),
        u_displace: hilbertGridMaterialDefaults.u_displace,
        u_reveal: hilbertGridMaterialDefaults.u_reveal,
        u_order: hilbertGridMaterialDefaults.u_order,
        u_signals: hilbertGridMaterialDefaults.u_signals,
        u_trail: hilbertGridMaterialDefaults.u_trail,
        u_signalSpeed: hilbertGridMaterialDefaults.u_signalSpeed,
        u_signalPhase: hilbertGridMaterialDefaults.u_signalPhase,
    },
    vertex,
    fragment,
);

extend({ HilbertGridMaterial });
