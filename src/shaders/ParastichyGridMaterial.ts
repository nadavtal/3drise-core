import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// =============================================================================
// ParastichyGridMaterial — Parastichy Grid
// =============================================================================
//
// The sunflower's crossed Fibonacci spiral families as a grid of their own: sectionSize spirals one way, sectionSize/φ the other, every crossing a seed, and the difference family cutting each cell into triangles. Light runs inward along the spirals.
//
// The GLSL is the exact source the Grid Lab preview compiles (Claude outputs/
// grid-lab). The fragment shader is the shared grid tail (line / cell modes,
// composite, fade, reveal) around this grid's own tiling block, which adds an
// extraCol / extraA emissive layer before the fade.
//

export interface ParastichyGridMaterialUniforms {
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
    /** Angle between successive seeds, degrees; 137.508 is the golden angle */
    u_divergence: number;
    /** Weight of the third spiral family that splits cells into triangles */
    u_third: number;
    /** Brightness of the light running inward along the spirals */
    u_sap: number;
    /** Strength of the faceted cell fill */
    u_fill: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        parastichyGridMaterial: ThreeElements['shaderMaterial'] & Partial<ParastichyGridMaterialUniforms>;
    }
}

export const parastichyGridMaterialDefaults: ParastichyGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 1.2,
    u_lineWidth: 1.1,
    u_sectionSize: 21,
    u_sectionWidth: 0.9,
    u_lineColor: new THREE.Color('#d4ac4e'),
    u_sectionColor: new THREE.Color('#7fb8a8'),
    u_cellColor: new THREE.Color('#0f3a33'),
    u_glowColor: new THREE.Color('#fff0b8'),
    u_bgColor: new THREE.Color('#03080a'),
    u_bgOpacity: 0,
    u_lineMode: 0,
    u_cellMode: 0,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.6,
    u_fadeDistance: 25,
    u_fadeStrength: 0.5,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1,
    u_divergence: 137.508,
    u_third: 0.45,
    u_sap: 0.9,
    u_fill: 0.35,
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

  uniform float u_divergence;
  uniform float u_third;
  uniform float u_sap;
  uniform float u_fill;

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

  // Coordinate across one parastichy family, and its screen derivative. Seeds of
  // a Vogel head sit at radius c*sqrt(s), angle s*g turns. The q spirals of one
  // family string together slots that differ by q; along them the angle advances
  // by delta = (q g - round(q g)) / q turns per slot, so u = q (theta - s delta)
  // is constant along each spiral and steps by one from spiral to spiral. At a
  // seed u is exactly an integer, for every family at once.
  vec2 family(vec2 x, float sT, float g, float q){
    float delta = (q * g - floor(q * g + 0.5)) / q;
    float ua = (atan(x.y, x.x) / TAU - sT * delta) * q;
    // a second branch cut, so the derivative never sees the atan seam
    float ub = (atan(-x.y, -x.x) / TAU + 0.5 - sT * delta) * q;
    return vec2(ua, max(min(fwidth(ua), fwidth(ub)), 1e-6));
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // The parastichies of a phyllotactic head as a grid in their own right. Two
    // consecutive Fibonacci families (sectionSize spirals, and sectionSize/phi
    // the other way) cross into the curved quadrilateral net a sunflower is read
    // by; every crossing is a seed. Their difference family runs through every
    // crossing too and cuts each cell into two triangles. Nothing here turns: the
    // motion is light travelling inward along the spirals.
    const float C = 0.5641896;
    float g  = u_divergence / 360.0;
    float rp = length(coord);
    float sT = (rp / C) * (rp / C);
    float Rmax = u_fadeDistance / max(u_cellSize, 1e-4);

    float q1 = max(floor(u_sectionSize + 0.5), 3.0);
    float q2 = max(floor(q1 * 0.618034 + 0.5), 1.0);
    float q3 = max(q1 - q2, 1.0);
    vec2  F1 = family(coord, sT, g, q1);
    vec2  F2 = family(coord, sT, g, q2);
    vec2  F3 = family(coord, sT, g, q3);
    // where a family converges faster than it can be drawn, it lets go
    float k1 = 1.0 - smoothstep(0.18, 0.45, F1.y);
    float k2 = 1.0 - smoothstep(0.18, 0.45, F2.y);
    float k3 = 1.0 - smoothstep(0.18, 0.45, F3.y);
    float inR = 1.0 - smoothstep(Rmax * 0.98, Rmax * 1.05, rp);

    float lines  = lineAt(F1.x, u_lineWidth, F1.y) * k1 * inR;
    float accent = u_sectionWidth > 0.0 ? lineAt(F2.x, u_sectionWidth, F2.y) * k2 * inR : 0.0;
    float third  = lineAt(F3.x, u_lineWidth * 0.7, F3.y) * k3 * u_third * inR;

    // ---- cells ----------------------------------------------------------------
    vec2  id   = vec2(floor(F1.x), floor(F2.x));
    vec2  fr   = vec2(fract(F1.x), fract(F2.x));
    // The difference family is u3 = u1 - u2 exactly (round(q3 g) = round(q1 g) -
    // round(q2 g) for consecutive Fibonacci q), so inside a cell its line is the
    // diagonal fract(u1) = fract(u2): which side of it picks the triangle.
    float side = step(fr.y, fr.x);
    float dmin = min(min(fr.x, 1.0 - fr.x), min(fr.y, 1.0 - fr.y)) * k1 * k2 * inR;
    float age  = clamp(rp / max(Rmax, 1e-3), 0.0, 1.0);
    vec3  ageCol = mix(u_glowColor, u_lineColor, smoothstep(0.0, 0.5, age));
    ageCol = mix(ageCol, u_cellColor, smoothstep(0.5, 1.0, age));
    // a soft two-tone over the triangles, so the net reads as facets
    float facet = mix(0.55, 1.0, mix(side, 1.0 - side, mod(id.x + id.y, 2.0)));
    float body  = facet * u_fill * smoothstep(0.0, 0.12, dmin) * (1.0 - smoothstep(0.3, 0.6, max(F1.y, F2.y)));

    // ---- sap --------------------------------------------------------------------
    // Light runs inward along the main family toward the young centre, each
    // spiral on its own clock, with a sharp head and a long fading tail.
    float sk   = mod(floor(F1.x + 0.5), q1);
    float off  = hash21(vec2(sk * 0.731, q1));
    float ph   = fract(rp / 7.0 + t * 0.06 + off);
    float head = pow(ph, 7.0);
    float d1   = abs(fract(F1.x - 0.5) - 0.5);
    float core = exp(-pow(d1 / (F1.y * max(u_lineWidth, 0.05) * 1.8), 2.0));
    float sap  = head * core * u_sap * k1 * inR;

    float idAcc = id.x + id.y * 7.13;
    vec2  cellPos = coord;
    float cellH = hash21(id * 0.173 + side);
    float tone = side;

    vec3  extraCol = ageCol * body + u_sectionColor * third * 0.8 + u_glowColor * sap * 1.5;
    float extraA = max(max(body, third * 0.8), sap);

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

export const ParastichyGridMaterial = shaderMaterial(
    {
        u_time: parastichyGridMaterialDefaults.u_time,
        u_cellSize: parastichyGridMaterialDefaults.u_cellSize,
        u_lineWidth: parastichyGridMaterialDefaults.u_lineWidth,
        u_sectionSize: parastichyGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: parastichyGridMaterialDefaults.u_sectionWidth,
        u_lineColor: parastichyGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: parastichyGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: parastichyGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: parastichyGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: parastichyGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: parastichyGridMaterialDefaults.u_bgOpacity,
        u_lineMode: parastichyGridMaterialDefaults.u_lineMode,
        u_cellMode: parastichyGridMaterialDefaults.u_cellMode,
        u_animSpeed: parastichyGridMaterialDefaults.u_animSpeed,
        u_animScale: parastichyGridMaterialDefaults.u_animScale,
        u_animIntensity: parastichyGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: parastichyGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: parastichyGridMaterialDefaults.u_fadeStrength,
        u_focus: parastichyGridMaterialDefaults.u_focus.clone(),
        u_mouse: parastichyGridMaterialDefaults.u_mouse.clone(),
        u_displace: parastichyGridMaterialDefaults.u_displace,
        u_reveal: parastichyGridMaterialDefaults.u_reveal,
        u_divergence: parastichyGridMaterialDefaults.u_divergence,
        u_third: parastichyGridMaterialDefaults.u_third,
        u_sap: parastichyGridMaterialDefaults.u_sap,
        u_fill: parastichyGridMaterialDefaults.u_fill,
    },
    vertex,
    fragment,
);

extend({ ParastichyGridMaterial });
