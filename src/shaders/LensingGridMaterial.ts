import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// =============================================================================
// LensingGridMaterial — Lensing Grid
// =============================================================================
//
// A square lattice seen through a point-mass gravitational lens: the thin-lens equation bends it into an Einstein ring, an inverted inner image and a dark shadow at the core.
//
// The GLSL is the exact source the Grid Lab preview compiles (Claude outputs/
// grid-lab). The fragment shader is the shared grid tail (line / cell modes,
// composite, fade, reveal) around this grid's own tiling block, which adds an
// extraCol / extraA emissive layer before the fade.
//

export interface LensingGridMaterialUniforms {
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
    /** Einstein radius of the lens, in cells; 0 leaves the lattice undistorted */
    u_mass: number;
    /** Radius the lens circles the centre on, in cells; 0 holds it at the centre */
    u_orbit: number;
    /** Brightness of the Einstein ring and its halo */
    u_ringGlow: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        lensingGridMaterial: ThreeElements['shaderMaterial'] & Partial<LensingGridMaterialUniforms>;
    }
}

export const lensingGridMaterialDefaults: LensingGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 2,
    u_lineWidth: 1.1,
    u_sectionSize: 5,
    u_sectionWidth: 1.8,
    u_lineColor: new THREE.Color('#2b4f80'),
    u_sectionColor: new THREE.Color('#9fd0ff'),
    u_cellColor: new THREE.Color('#0b1a33'),
    u_glowColor: new THREE.Color('#ffcf8a'),
    u_bgColor: new THREE.Color('#02040a'),
    u_bgOpacity: 0,
    u_lineMode: 1,
    u_cellMode: 2,
    u_animSpeed: 1,
    u_animScale: 0.6,
    u_animIntensity: 0.6,
    u_fadeDistance: 25,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1,
    u_mass: 4,
    u_orbit: 0,
    u_ringGlow: 0.8,
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

  uniform float u_mass;
  uniform float u_orbit;
  uniform float u_ringGlow;

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

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // Gravitational lensing by a point mass. The thin-lens equation
    //   beta = theta - thetaE^2 (theta - L) / |theta - L|^2
    // says the ray seen at theta left the source plane at beta, so every pixel
    // samples a plain square lattice at beta. On the Einstein ring |theta - L| =
    // thetaE every ray lands on L itself: the point behind the mass is smeared
    // into a ring. Inside the ring the image is inverted, and toward the mass the
    // lattice is compressed without bound — it fades out, and that is the shadow.
    float thetaE = max(u_mass, 0.0);
    float oa = t * 0.12;
    vec2  L = focus + u_orbit * vec2(cos(oa), sin(oa));
    vec2  rel = coord - L;
    float r2 = max(dot(rel, rel), 1e-4);
    float rr = sqrt(r2);
    vec2  beta = coord - thetaE * thetaE * rel / r2;

    // Once a source cell is smaller than a pixel it cannot be drawn any more.
    vec2  fb = max(fwidth(beta), vec2(1e-6));
    float dens = 1.0 - smoothstep(0.2, 0.7, max(fb.x, fb.y));

    // Per-image magnification 1 / |1 - (thetaE/r)^4|: lines brighten where the
    // lens stretches the source, peaking along the ring.
    float q4 = pow(thetaE / rr, 4.0);
    float mag = clamp(1.0 / max(abs(1.0 - q4), 1e-3), 1.0, 4.0);

    float lines = max(lineAt(beta.x, u_lineWidth, fb.x), lineAt(beta.y, u_lineWidth, fb.y));
    lines *= dens * mix(1.0, sqrt(mag), 0.7);

    float accent = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      vec2 sb = beta / u_sectionSize;
      vec2 fs = max(fwidth(sb), vec2(1e-6));
      accent = max(lineAt(sb.x, u_sectionWidth, fs.x), lineAt(sb.y, u_sectionWidth, fs.y));
      accent *= 1.0 - smoothstep(0.3, 0.9, max(fs.x, fs.y));
    }

    vec2  id = floor(beta);
    vec2  fr = fract(beta);
    float dmin = min(min(fr.x, 1.0 - fr.x), min(fr.y, 1.0 - fr.y)) * dens;
    float idAcc = id.x + id.y * 7.13;
    vec2  cellPos = id + 0.5;
    float cellH = hash21(id * 0.137 + 7.7);
    float tone = step(0.55, cellH);

    // The Einstein ring itself: a thin bright ring on a soft photon halo.
    float on = smoothstep(0.0, 0.3, thetaE);
    float ring = exp(-pow((rr - thetaE) / (0.035 * thetaE + 0.08), 2.0)) * on;
    float halo = exp(-pow((rr - thetaE) / (0.4 * thetaE + 0.4), 2.0)) * 0.12 * on;
    vec3  extraCol = (u_glowColor * (ring + halo) + u_sectionColor * ring * 0.3) * u_ringGlow;
    float extraA = (ring + halo) * u_ringGlow;

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

export const LensingGridMaterial = shaderMaterial(
    {
        u_time: lensingGridMaterialDefaults.u_time,
        u_cellSize: lensingGridMaterialDefaults.u_cellSize,
        u_lineWidth: lensingGridMaterialDefaults.u_lineWidth,
        u_sectionSize: lensingGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: lensingGridMaterialDefaults.u_sectionWidth,
        u_lineColor: lensingGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: lensingGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: lensingGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: lensingGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: lensingGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: lensingGridMaterialDefaults.u_bgOpacity,
        u_lineMode: lensingGridMaterialDefaults.u_lineMode,
        u_cellMode: lensingGridMaterialDefaults.u_cellMode,
        u_animSpeed: lensingGridMaterialDefaults.u_animSpeed,
        u_animScale: lensingGridMaterialDefaults.u_animScale,
        u_animIntensity: lensingGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: lensingGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: lensingGridMaterialDefaults.u_fadeStrength,
        u_focus: lensingGridMaterialDefaults.u_focus.clone(),
        u_mouse: lensingGridMaterialDefaults.u_mouse.clone(),
        u_displace: lensingGridMaterialDefaults.u_displace,
        u_reveal: lensingGridMaterialDefaults.u_reveal,
        u_mass: lensingGridMaterialDefaults.u_mass,
        u_orbit: lensingGridMaterialDefaults.u_orbit,
        u_ringGlow: lensingGridMaterialDefaults.u_ringGlow,
    },
    vertex,
    fragment,
);

extend({ LensingGridMaterial });
