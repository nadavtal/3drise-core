import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// =============================================================================
// TruchetGridMaterial — Truchet Grid
// =============================================================================
//
// Smith quarter-circle Truchet tiles: arcs always meet arcs, so the plane fills with endless two-coloured loops. Tiles re-deal by turning a quarter turn, and comets travel the loops in one direction.
//
// The GLSL is the exact source the Grid Lab preview compiles (Claude outputs/
// grid-lab). The fragment shader is the shared grid tail (line / cell modes,
// composite, fade, reveal) around this grid's own tiling block, which adds an
// extraCol / extraA emissive layer before the fade.
//

export interface TruchetGridMaterialUniforms {
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
    /** Chance a tile re-deals its orientation each epoch; 0 freezes the paths */
    u_flip: number;
    /** Balance of the two tile orientations: 0.5 is a maze, the ends are stripes */
    u_bias: number;
    /** Brightness of the comets travelling the loops */
    u_pulse: number;
    /** Fill of one colour of the two-colouring */
    u_regionFill: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        truchetGridMaterial: ThreeElements['shaderMaterial'] & Partial<TruchetGridMaterialUniforms>;
    }
}

export const truchetGridMaterialDefaults: TruchetGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 3,
    u_lineWidth: 1.3,
    u_sectionSize: 4,
    u_sectionWidth: 1.2,
    u_lineColor: new THREE.Color('#a052e0'),
    u_sectionColor: new THREE.Color('#4a2a66'),
    u_cellColor: new THREE.Color('#2a0f45'),
    u_glowColor: new THREE.Color('#ff7ad9'),
    u_bgColor: new THREE.Color('#07030d'),
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
    u_flip: 0.25,
    u_bias: 0.5,
    u_pulse: 0.8,
    u_regionFill: 0.8,
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

  uniform float u_flip;
  uniform float u_bias;
  uniform float u_pulse;
  uniform float u_regionFill;

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

  // Orientation of a tile in epoch e: its own base orientation, unless this
  // epoch's roll (probability u_flip) re-deals it.
  float truchetOrient(vec2 hid, float e, float oBase){
    float dealt = step(hash21(hid + e * vec2(17.31, 9.17)), u_flip);
    return mix(oBase, step(0.5, hash21(hid * 1.37 + e * vec2(3.7, 11.3))), dealt);
  }

  // Smith's quarter-circle Truchet tile. Returns
  //   x: distance to the nearest arc (tile units)
  //   y: position along that arc, 0..1, oriented so the flow is continuous
  //   z: the region's colour in the 2-colouring of the plane (0/1)
  vec3 truchetTile(vec2 tc, float t, float salt){
    vec2  id  = floor(tc);
    vec2  hid = id + salt;
    // staggered epochs so the tiles never re-deal in unison
    float ep = t * 0.3 + hash21(hid * 0.731 + 1.3);
    float e = floor(ep), f = fract(ep);
    float oBase = step(u_bias, hash21(hid + 0.5));
    float o0 = truchetOrient(hid, e - 1.0, oBase);
    float o1 = truchetOrient(hid, e, oBase);
    // a changed tile turns a quarter turn — the two orientations are one tile
    // rotated by 90 degrees — so paths break and re-join instead of popping
    float k = o0 + abs(o1 - o0) * smoothstep(0.0, 0.4, f);
    float ang = k * PI * 0.5;
    float c = cos(ang), sn = sin(ang);
    vec2  q = mat2(c, sn, -sn, c) * (fract(tc) - 0.5) + 0.5;

    float r0 = length(q), r1 = length(q - 1.0);
    float d0 = abs(r0 - 0.5), d1 = abs(r1 - 0.5);

    // The quarter-circle tiling is 2-colourable: the band between the arcs takes
    // the checkerboard parity of the tile (flipped by its orientation), the two
    // corner lobes take the other colour.
    float mid = mod(id.x + id.y + floor(k + 0.5), 2.0);
    float lobe = max(step(r0, 0.5), step(r1, 0.5));
    float region = mix(mid, 1.0 - mid, lobe);

    // Orient every arc with colour 1 on its left: the arcs then chain into loops
    // with one consistent direction of travel.
    float u = d0 < d1 ? atan(q.y, q.x) : atan(1.0 - q.y, 1.0 - q.x);
    u /= PI * 0.5;
    u = mid < 0.5 ? u : 1.0 - u;
    return vec3(min(d0, d1), u, region);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // Truchet tiling (Smith's quarter-circle variant): every tile carries two arcs
    // joining the midpoints of adjacent edges, so arcs always meet arcs and the
    // plane fills with endless non-crossing paths. Tiles re-deal their
    // orientation over time by turning a quarter turn, which re-routes the paths.
    vec3  T = truchetTile(coord, t, 0.0);
    vec2  fc = fwidth(coord);
    float fp = max(max(fc.x, fc.y), 1e-6);
    float lines = 1.0 - clamp(T.x / (fp * max(u_lineWidth, 0.05)), 0.0, 1.0);

    // A second, coarser Truchet layer at sectionSize tiles: the multiscale accent.
    float accent = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize >= 2.0){
      vec3  S = truchetTile(coord / u_sectionSize, t * 0.5, 91.7);
      float fs = fp / u_sectionSize;
      accent = 1.0 - clamp(S.x / (fs * max(u_sectionWidth, 0.05)), 0.0, 1.0);
    }

    // Light travelling along the paths: one comet per arc, sharp head, fading
    // tail, gated by a slow travelling swell so whole stretches light up at once.
    vec2  id = floor(coord);
    float ph = fract(T.y - t * 0.6);
    float head = pow(ph, 3.0);
    float swell = smoothstep(0.35, 0.9, 0.5 + 0.5 * sin(dot(coord, vec2(0.19, 0.13)) - t * 0.35));
    float core = exp(-pow(T.x / (fp * max(u_lineWidth, 0.05) * 1.6), 2.0));
    float bloom = exp(-pow(T.x / 0.06, 2.0)) * 0.3;
    float comet = head * swell * u_pulse;

    float dmin = T.x;
    float idAcc = id.x + id.y * 7.13;
    vec2  cellPos = id + 0.5;
    float cellH = hash21(id + T.z * 13.1);
    float tone = T.z;

    // The 2-colouring itself, as a quiet fill: one colour of region is lit.
    float fill = tone * u_regionFill * smoothstep(0.0, 0.08, T.x);

    vec3  extraCol = u_glowColor * (core + bloom) * comet * 1.6 + u_cellColor * 2.2 * fill;
    float extraA = max((core + bloom * 0.6) * comet, fill * 0.9);

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

export const TruchetGridMaterial = shaderMaterial(
    {
        u_time: truchetGridMaterialDefaults.u_time,
        u_cellSize: truchetGridMaterialDefaults.u_cellSize,
        u_lineWidth: truchetGridMaterialDefaults.u_lineWidth,
        u_sectionSize: truchetGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: truchetGridMaterialDefaults.u_sectionWidth,
        u_lineColor: truchetGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: truchetGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: truchetGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: truchetGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: truchetGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: truchetGridMaterialDefaults.u_bgOpacity,
        u_lineMode: truchetGridMaterialDefaults.u_lineMode,
        u_cellMode: truchetGridMaterialDefaults.u_cellMode,
        u_animSpeed: truchetGridMaterialDefaults.u_animSpeed,
        u_animScale: truchetGridMaterialDefaults.u_animScale,
        u_animIntensity: truchetGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: truchetGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: truchetGridMaterialDefaults.u_fadeStrength,
        u_focus: truchetGridMaterialDefaults.u_focus.clone(),
        u_mouse: truchetGridMaterialDefaults.u_mouse.clone(),
        u_displace: truchetGridMaterialDefaults.u_displace,
        u_reveal: truchetGridMaterialDefaults.u_reveal,
        u_flip: truchetGridMaterialDefaults.u_flip,
        u_bias: truchetGridMaterialDefaults.u_bias,
        u_pulse: truchetGridMaterialDefaults.u_pulse,
        u_regionFill: truchetGridMaterialDefaults.u_regionFill,
    },
    vertex,
    fragment,
);

extend({ TruchetGridMaterial });
