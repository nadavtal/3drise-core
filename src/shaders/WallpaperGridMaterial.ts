import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Wallpaper-group kaleidoscope: a drifting lattice-periodic Fourier motif summed over the coset representatives of one of the 17 plane crystallographic groups. The runtime builds the group tables and crossfades from group to group.
 *
 * Shares the grid vocabulary with the other shader-plane grids (lineMode /
 * cellMode 0..4, fade, reveal, focus), so the same controller drives it.
 */
export interface WallpaperGridMaterialUniforms {
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
    /** Wallpaper group index (-1 cycles), read by the runtime */
    u_group: number;
    /** Seconds per group while cycling, read by the runtime */
    u_cycleTime: number;
    /** Motif complexity 0..1, read by the runtime */
    u_motif: number;
    /** Number of contour levels */
    u_levels: number;
    /** Motif terms: (amplitude, phase) for each of the 6 wave-vectors */
    u_wave: Float32Array;
    /** Group A: linear parts of the coset representatives, lattice coordinates (mat2[12]) */
    u_RA: Float32Array;
    /** Group A: translations of the coset representatives, lattice coordinates (vec2[12]) */
    u_TA: Float32Array;
    /** Group A: number of coset representatives */
    u_countA: number;
    /** Group A: inverse lattice basis, cell units to lattice coordinates (mat2) */
    u_basisA: Float32Array;
    /** Group A: 1 / RMS of the symmetrised field */
    u_normA: number;
    /** Group A: symmetry-axis families (normal.xy, offset, spacing) (vec4[6]) */
    u_axA: Float32Array;
    /** Group A: axis kinds for even/odd lines (1 mirror, 0.5 glide) and the glide period (vec3[6]) */
    u_axKA: Float32Array;
    /** Group A: number of axis families */
    u_axNA: number;
    /** Group B (crossfade target): linear parts (mat2[12]) */
    u_RB: Float32Array;
    /** Group B: translations (vec2[12]) */
    u_TB: Float32Array;
    /** Group B: number of coset representatives */
    u_countB: number;
    /** Group B: inverse lattice basis (mat2) */
    u_basisB: Float32Array;
    /** Group B: 1 / RMS of the symmetrised field */
    u_normB: number;
    /** Group B: symmetry-axis families (vec4[6]) */
    u_axB: Float32Array;
    /** Group B: axis kinds and glide period (vec3[6]) */
    u_axKB: Float32Array;
    /** Group B: number of axis families */
    u_axNB: number;
    /** Crossfade from group A (0) to group B (1) */
    u_mix: number;
    /** Keeps the contour spacing steady through the crossfade */
    u_mixGain: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        wallpaperGridMaterial: ThreeElements['shaderMaterial'] & Partial<WallpaperGridMaterialUniforms>;
    }
}

export const wallpaperGridMaterialDefaults: WallpaperGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 10,
    u_lineWidth: 2,
    u_sectionSize: 0,
    u_sectionWidth: 1.4,
    u_lineColor: new THREE.Color('#f3d79b'),
    u_sectionColor: new THREE.Color('#7fd6ff'),
    u_cellColor: new THREE.Color('#101c50'),
    u_glowColor: new THREE.Color('#ff9ec7'),
    u_bgColor: new THREE.Color('#05070a'),
    u_bgOpacity: 0,
    u_lineMode: 2,
    u_cellMode: 2,
    u_animSpeed: 1,
    u_animScale: 0.6,
    u_animIntensity: 0.55,
    u_fadeDistance: 25,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1.0,
    u_group: -1,
    u_cycleTime: 12,
    u_motif: 0.5,
    u_levels: 11,
    u_wave: new Float32Array(12),
    u_RA: new Float32Array(48),
    u_TA: new Float32Array(24),
    u_countA: 1,
    u_basisA: new Float32Array([1, 0, 0, 1]),
    u_normA: 1,
    u_axA: new Float32Array(24),
    u_axKA: new Float32Array(18),
    u_axNA: 0,
    u_RB: new Float32Array(48),
    u_TB: new Float32Array(24),
    u_countB: 1,
    u_basisB: new Float32Array([1, 0, 0, 1]),
    u_normB: 1,
    u_axB: new Float32Array(24),
    u_axKB: new Float32Array(18),
    u_axNB: 0,
    u_mix: 0,
    u_mixGain: 1,
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

  
  uniform vec2  u_wave[6];
  uniform mat2  u_RA[12];
  uniform vec2  u_TA[12];
  uniform float u_countA;
  uniform mat2  u_basisA;
  uniform float u_normA;
  uniform mat2  u_RB[12];
  uniform vec2  u_TB[12];
  uniform float u_countB;
  uniform mat2  u_basisB;
  uniform float u_normB;
  uniform float u_mix;
  uniform float u_mixGain;

  float wpMotif(vec2 q){
    vec2 a = TAU * q;
    return u_wave[0].x * cos(dot(a, vec2(1.0, 1.0)) + u_wave[0].y)
         + u_wave[1].x * cos(dot(a, vec2(2.0, 0.0)) + u_wave[1].y)
         + u_wave[2].x * cos(dot(a, vec2(1.0, -2.0)) + u_wave[2].y)
         + u_wave[3].x * cos(dot(a, vec2(2.0, 1.0)) + u_wave[3].y)
         + u_wave[4].x * cos(dot(a, vec2(3.0, 1.0)) + u_wave[4].y)
         + u_wave[5].x * cos(dot(a, vec2(1.0, 3.0)) + u_wave[5].y);
  }

  float wpSym(vec2 p, mat2 Bi, mat2 R[12], vec2 T[12], float n){
    vec2 q = Bi * p;
    q -= floor(q);
    float s = 0.0;
    for (int i = 0; i < 12; i++){
      if (float(i) >= n) break;
      s += wpMotif(R[i] * q + T[i]);
    }
    return s;
  }

  // unit-RMS field, crossfaded between group A and group B
  float wpField(vec2 p){
    float f = wpSym(p, u_basisA, u_RA, u_TA, u_countA) * u_normA;
    if (u_mix > 0.001){
      float g = wpSym(p, u_basisB, u_RB, u_TB, u_countB) * u_normB;
      f = mix(f, g, u_mix) * u_mixGain;
    }
    return f;
  }


  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      // the relief is the symmetric field itself
      float f = wpField(position.xy / max(u_cellSize, 1e-4));
      pos.z += clamp(f, -2.5, 2.5) * u_displace * 0.3;
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

  
  uniform vec2  u_wave[6];
  uniform mat2  u_RA[12];
  uniform vec2  u_TA[12];
  uniform float u_countA;
  uniform mat2  u_basisA;
  uniform float u_normA;
  uniform mat2  u_RB[12];
  uniform vec2  u_TB[12];
  uniform float u_countB;
  uniform mat2  u_basisB;
  uniform float u_normB;
  uniform float u_mix;
  uniform float u_mixGain;

  float wpMotif(vec2 q){
    vec2 a = TAU * q;
    return u_wave[0].x * cos(dot(a, vec2(1.0, 1.0)) + u_wave[0].y)
         + u_wave[1].x * cos(dot(a, vec2(2.0, 0.0)) + u_wave[1].y)
         + u_wave[2].x * cos(dot(a, vec2(1.0, -2.0)) + u_wave[2].y)
         + u_wave[3].x * cos(dot(a, vec2(2.0, 1.0)) + u_wave[3].y)
         + u_wave[4].x * cos(dot(a, vec2(3.0, 1.0)) + u_wave[4].y)
         + u_wave[5].x * cos(dot(a, vec2(1.0, 3.0)) + u_wave[5].y);
  }

  float wpSym(vec2 p, mat2 Bi, mat2 R[12], vec2 T[12], float n){
    vec2 q = Bi * p;
    q -= floor(q);
    float s = 0.0;
    for (int i = 0; i < 12; i++){
      if (float(i) >= n) break;
      s += wpMotif(R[i] * q + T[i]);
    }
    return s;
  }

  // unit-RMS field, crossfaded between group A and group B
  float wpField(vec2 p){
    float f = wpSym(p, u_basisA, u_RA, u_TA, u_countA) * u_normA;
    if (u_mix > 0.001){
      float g = wpSym(p, u_basisB, u_RB, u_TB, u_countB) * u_normB;
      f = mix(f, g, u_mix) * u_mixGain;
    }
    return f;
  }


  uniform float u_levels;
  uniform vec4  u_axA[6];
  uniform vec3  u_axKA[6];
  uniform float u_axNA;
  uniform vec4  u_axB[6];
  uniform vec3  u_axKB[6];
  uniform float u_axNB;

  // anti-aliased line of pixel width w at pixel distance d
  float wpLine(float d, float w){
    float hw = max(w, 1.0) * 0.5;
    return min(w, 1.0) * (1.0 - smoothstep(hw - 0.5, hw + 0.5, d));
  }

  // Symmetry axes: family i holds the lines n.p = offset + j * spacing.
  // Even and odd lines have their own kind: 1 mirror (solid), 0.5 glide (dashed).
  float wpAxes(vec2 p, vec4 ax[6], vec3 ak[6], float n, float pix, float w){
    float acc = 0.0;
    for (int i = 0; i < 6; i++){
      if (float(i) >= n) break;
      vec2 nn = ax[i].xy;
      float h = ax[i].w;
      float s = (dot(nn, p) - ax[i].z) / h;
      float j = floor(s + 0.5);
      float d = abs(s - j) * h / pix;
      float kind = mod(j, 2.0) < 0.5 ? ak[i].x : ak[i].y;
      // glide axes: dashes half a glide long
      float along = dot(vec2(-nn.y, nn.x), p) / (ak[i].z * 0.5);
      float tri = abs(fract(along) - 0.5);
      float ew = pix / (ak[i].z * 0.5);
      float dash = smoothstep(0.25 - ew, 0.25 + ew, tri);
      float on = kind > 0.75 ? 1.0 : dash * 0.75;
      // spacing in pixels: fade a family before its lines crowd together
      float keep = smoothstep(3.0, 9.0, h / pix);
      acc = max(acc, wpLine(d, w) * on * keep);
    }
    return acc;
  }

  void main(){
    float cs = max(u_cellSize, 1e-4);
    vec2 coord = vGridPos / cs;
    vec2 focus = u_focus / cs;
    float t = u_time * u_animSpeed;
    float pix = length(fwidth(coord)) * 0.7071;   // cell units per pixel

    float F = wpField(coord);

    // contour levels: v steps by one every 4 / levels RMS units
    float lv = max(u_levels, 1.0) * 0.25;
    float v = F * lv;
    float fp = max(fwidth(v), 1e-5);
    float dLine = abs(fract(v - 0.5) - 0.5) / fp;             // pixels to the nearest contour
    // contours closer than a few pixels merge into moire; fade them out first
    float crowd = 1.0 - smoothstep(0.22, 0.6, fp);
    // the whole motif aliases once a unit cell is only a few pixels wide
    float resolved = 1.0 - smoothstep(0.07, 0.2, pix);
    float lines = wpLine(dLine, u_lineWidth) * crowd * resolved;
    // the zero level is the spine of the pattern: a touch brighter
    float zeroL = wpLine(abs(F) / max(fwidth(F), 1e-5), u_lineWidth * 1.4) * resolved;
    lines = max(lines * 0.75, zeroL);

    float accent = 0.0;
    if (u_sectionWidth > 0.0){
      float axA = wpAxes(coord, u_axA, u_axKA, u_axNA, pix, u_sectionWidth);
      float axB = u_mix > 0.001 ? wpAxes(coord, u_axB, u_axKB, u_axNB, pix, u_sectionWidth) : 0.0;
      accent = mix(axA, axB, u_mix) * 0.65 * resolved;
      if (u_sectionSize > 0.0){
        // outline of every Nth unit cell of the lattice
        vec2 qa = u_basisA * coord / u_sectionSize;
        vec2 qb = u_basisB * coord / u_sectionSize;
        vec2 fa = max(fwidth(qa), vec2(1e-6));
        vec2 fb = max(fwidth(qb), vec2(1e-6));
        float ca = max(lineAt(qa.x, u_sectionWidth, fa.x), lineAt(qa.y, u_sectionWidth, fa.y));
        float cb = max(lineAt(qb.x, u_sectionWidth, fb.x), lineAt(qb.y, u_sectionWidth, fb.y));
        accent = max(accent, mix(ca, cb, u_mix) * 0.55 * (1.0 - smoothstep(0.25, 0.6, max(fa.x, fa.y))));
      }
    }

    // a band is the region between two contours; its hash is the same in
    // every symmetric copy, so the twinkle keeps the symmetry
    float band = floor(v);
    float cellH = hash21(vec2(band * 0.137 + 0.5, 3.7));
    float cellDist  = length(coord - focus) * 3.0;
    float flowCoord = v * 1.4;              // waves travel across the contour bands
    float scanCoord = (coord.x + coord.y) * 3.0;
    float edgeKeep  = smoothstep(0.5, 3.0, dLine) * resolved;
    float fadeR = length(vGridPos) / max(u_fadeDistance, 1e-4);

    // body: peaks glow warm, troughs sink into the cell colour, both soft
    float Fs = F * resolved;
    float peak = smoothstep(0.25, 2.1, Fs);
    float trough = smoothstep(0.2, 1.8, -Fs);
    // terraces: each contour band is shaded from its low edge to its high one,
    // so the pattern reads as a relief cut in steps (and it fades when the
    // bands stop being resolved)
    float terrace = mix(1.0, 0.55 + 0.7 * smoothstep(0.05, 0.95, fract(v)), crowd);
    vec3  extraCol = u_glowColor * peak * peak * 0.5 + u_cellColor * trough * 0.5 * terrace + u_lineColor * lines * peak * 0.35;
    float extraA = max(max(peak * peak * 0.75, trough * terrace * 0.4), lines * 0.5);
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

export const WallpaperGridMaterial = shaderMaterial(
    {
        u_time: wallpaperGridMaterialDefaults.u_time,
        u_cellSize: wallpaperGridMaterialDefaults.u_cellSize,
        u_lineWidth: wallpaperGridMaterialDefaults.u_lineWidth,
        u_sectionSize: wallpaperGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: wallpaperGridMaterialDefaults.u_sectionWidth,
        u_lineColor: wallpaperGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: wallpaperGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: wallpaperGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: wallpaperGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: wallpaperGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: wallpaperGridMaterialDefaults.u_bgOpacity,
        u_lineMode: wallpaperGridMaterialDefaults.u_lineMode,
        u_cellMode: wallpaperGridMaterialDefaults.u_cellMode,
        u_animSpeed: wallpaperGridMaterialDefaults.u_animSpeed,
        u_animScale: wallpaperGridMaterialDefaults.u_animScale,
        u_animIntensity: wallpaperGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: wallpaperGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: wallpaperGridMaterialDefaults.u_fadeStrength,
        u_focus: wallpaperGridMaterialDefaults.u_focus.clone(),
        u_mouse: wallpaperGridMaterialDefaults.u_mouse.clone(),
        u_displace: wallpaperGridMaterialDefaults.u_displace,
        u_reveal: wallpaperGridMaterialDefaults.u_reveal,
        u_group: wallpaperGridMaterialDefaults.u_group,
        u_cycleTime: wallpaperGridMaterialDefaults.u_cycleTime,
        u_motif: wallpaperGridMaterialDefaults.u_motif,
        u_levels: wallpaperGridMaterialDefaults.u_levels,
        u_wave: wallpaperGridMaterialDefaults.u_wave,
        u_RA: wallpaperGridMaterialDefaults.u_RA,
        u_TA: wallpaperGridMaterialDefaults.u_TA,
        u_countA: wallpaperGridMaterialDefaults.u_countA,
        u_basisA: wallpaperGridMaterialDefaults.u_basisA,
        u_normA: wallpaperGridMaterialDefaults.u_normA,
        u_axA: wallpaperGridMaterialDefaults.u_axA,
        u_axKA: wallpaperGridMaterialDefaults.u_axKA,
        u_axNA: wallpaperGridMaterialDefaults.u_axNA,
        u_RB: wallpaperGridMaterialDefaults.u_RB,
        u_TB: wallpaperGridMaterialDefaults.u_TB,
        u_countB: wallpaperGridMaterialDefaults.u_countB,
        u_basisB: wallpaperGridMaterialDefaults.u_basisB,
        u_normB: wallpaperGridMaterialDefaults.u_normB,
        u_axB: wallpaperGridMaterialDefaults.u_axB,
        u_axKB: wallpaperGridMaterialDefaults.u_axKB,
        u_axNB: wallpaperGridMaterialDefaults.u_axNB,
        u_mix: wallpaperGridMaterialDefaults.u_mix,
        u_mixGain: wallpaperGridMaterialDefaults.u_mixGain,
    },
    vertex,
    fragment,
);

extend({ WallpaperGridMaterial });
