import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * Potential flow past a cylinder with circulation, drawn as a flow net: streamlines and equipotentials that cross at right angles everywhere and bend around the obstacle.
 *
 * Shares the grid vocabulary with the other shader-plane grids (lineMode /
 * cellMode 0..4, fade, reveal, focus), so the same controller drives it.
 */
export interface FlowNetGridMaterialUniforms {
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
    /** cylinder radius, in cells */
    u_obstacleRadius: number;
    /** circulation around the cylinder, in whole units; shifts the flow to one side (lift) */
    u_circulation: number;
    /** direction of the free-stream flow, in radians */
    u_flowAngle: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        flowNetGridMaterial: ThreeElements['shaderMaterial'] & Partial<FlowNetGridMaterialUniforms>;
    }
}

export const flowNetGridMaterialDefaults: FlowNetGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 1.5,
    u_lineWidth: 1,
    u_sectionSize: 5,
    u_sectionWidth: 1.6,
    u_lineColor: new THREE.Color('#3f8fbf'),
    u_sectionColor: new THREE.Color('#9fe3ff'),
    u_cellColor: new THREE.Color('#0c3148'),
    u_glowColor: new THREE.Color('#5fd0ff'),
    u_bgColor: new THREE.Color('#02070b'),
    u_bgOpacity: 0,
    u_lineMode: 2,
    u_cellMode: 1,
    u_animSpeed: 1,
    u_animScale: 0.6,
    u_animIntensity: 0.8,
    u_fadeDistance: 25,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1.0,
    u_obstacleRadius: 3,
    u_circulation: 2,
    u_flowAngle: 0,
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


  uniform float u_obstacleRadius;
  uniform float u_circulation;
  uniform float u_flowAngle;

  void main(){
    float cs = max(u_cellSize, 1e-4);
    vec2 coord = vGridPos / cs;
    vec2 focus = u_focus / cs;
    float t = u_time * u_animSpeed;
    float pix = length(fwidth(coord)) * 0.7071;

    // Potential flow past a cylinder with circulation (Kutta-Joukowski):
    //   W(z) = z + R^2/z - i*G/(2*pi) * log z
    // Re W is the velocity potential and Im W the stream function. They are
    // harmonic conjugates, so their level sets cross at right angles
    // everywhere: a true flow net that bends around the obstacle.
    vec2 z = coord - focus;
    float ca = cos(u_flowAngle), sa = sin(u_flowAngle);
    z = vec2(ca * z.x + sa * z.y, -sa * z.x + ca * z.y);
    float R  = max(u_obstacleRadius, 0.05);
    float r2 = max(dot(z, z), 1e-6);
    float r  = sqrt(r2);
    float th = atan(z.y, z.x);
    // Whole numbers only: the potential jumps by G across the branch cut of
    // log z, and fract() hides a whole-number jump.
    float G  = floor(u_circulation + 0.5);
    float phi = z.x * (1.0 + R * R / r2) - G * th / TAU;
    float psi = z.y * (1.0 - R * R / r2) + G * log(r / R) / TAU;

    // |W'(z)| is the local flow speed, and also how fast both families change
    // per pixel. Using it instead of fwidth() keeps the lines clean across the
    // branch cut.
    vec2 z2 = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y);
    vec2 dW = vec2(1.0, 0.0) - R * R * vec2(z2.x, -z2.y) / (r2 * r2) + (G / TAU) * vec2(z.y, z.x) / r2;
    float speed = length(dW);
    float fp = max(speed * pix, 1e-6);

    float outside = smoothstep(R - pix, R + pix, r);

    float streams = lineAt(psi, u_lineWidth, fp);
    float equip   = lineAt(phi, u_lineWidth * 0.6, fp) * 0.55;
    float lines   = max(streams, equip) * outside;

    float accent = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      float ss = u_sectionSize;
      accent = max(lineAt(psi / ss, u_sectionWidth, fp / ss),
                   lineAt(phi / ss, u_sectionWidth, fp / ss) * 0.6) * outside;
    }
    // the cylinder wall is itself a streamline (psi = 0)
    float wall = 1.0 - clamp(abs(r - R) / (pix * max(u_sectionWidth, 1.0) * 1.2), 0.0, 1.0);
    accent = max(accent, wall);

    float cellH = hash21(vec2(floor(phi), floor(psi)) + 0.37);
    float f1 = fract(phi), f2 = fract(psi);
    float dmin = min(min(f1, 1.0 - f1), min(f2, 1.0 - f2));
    float edgeKeep = smoothstep(0.0, 0.16, dmin) * outside;

    float cellDist  = r;        // ripples radiate from the cylinder
    float flowCoord = phi;      // waves ride the potential, so they speed up where the flow does
    float scanCoord = coord.x + coord.y;
    float fadeR = length(vGridPos) / max(u_fadeDistance, 1e-4);

    // Fast flow glows: the stagnation points (speed 0) stay dark and the
    // shoulders of the cylinder, where the flow runs twice as fast, light up.
    vec3  extraCol = u_glowColor * lines * smoothstep(1.0, 2.0, speed) * 0.6;
    float extraA = 0.0;
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

export const FlowNetGridMaterial = shaderMaterial(
    {
        u_time: flowNetGridMaterialDefaults.u_time,
        u_cellSize: flowNetGridMaterialDefaults.u_cellSize,
        u_lineWidth: flowNetGridMaterialDefaults.u_lineWidth,
        u_sectionSize: flowNetGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: flowNetGridMaterialDefaults.u_sectionWidth,
        u_lineColor: flowNetGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: flowNetGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: flowNetGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: flowNetGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: flowNetGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: flowNetGridMaterialDefaults.u_bgOpacity,
        u_lineMode: flowNetGridMaterialDefaults.u_lineMode,
        u_cellMode: flowNetGridMaterialDefaults.u_cellMode,
        u_animSpeed: flowNetGridMaterialDefaults.u_animSpeed,
        u_animScale: flowNetGridMaterialDefaults.u_animScale,
        u_animIntensity: flowNetGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: flowNetGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: flowNetGridMaterialDefaults.u_fadeStrength,
        u_focus: flowNetGridMaterialDefaults.u_focus.clone(),
        u_mouse: flowNetGridMaterialDefaults.u_mouse.clone(),
        u_displace: flowNetGridMaterialDefaults.u_displace,
        u_reveal: flowNetGridMaterialDefaults.u_reveal,
        u_obstacleRadius: flowNetGridMaterialDefaults.u_obstacleRadius,
        u_circulation: flowNetGridMaterialDefaults.u_circulation,
        u_flowAngle: flowNetGridMaterialDefaults.u_flowAngle,
    },
    vertex,
    fragment,
);

extend({ FlowNetGridMaterial });
