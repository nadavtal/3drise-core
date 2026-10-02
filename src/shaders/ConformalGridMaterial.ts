import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// =============================================================================
// ConformalGridMaterial — Conformal Grid
// =============================================================================
//
// A square lattice pulled back through an ideal-flow complex potential. Cauchy–Riemann keeps every cell square; colour is the flow speed, alternate stream tubes carry dye and hydrogen-bubble dashes ride the flow.
//
// The GLSL is the exact source the Grid Lab preview compiles (Claude outputs/
// grid-lab). The fragment shader is the shared grid tail (line / cell modes,
// composite, fade, reveal) around this grid's own tiling block, which adds an
// extraCol / extraA emissive layer before the fade.
//

export interface ConformalGridMaterialUniforms {
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
    /** The flow: 0 source + sink, 1 spiral vortex, 2 spinning cylinder, 3 corner */
    u_flowMap: number;
    /** Distance from the centre to the poles, or the cylinder radius, in world units */
    u_poleSpread: number;
    /** Lattice lines per turn round a pole (whole number, so the log seam closes) */
    u_spokes: number;
    /** Spiral arms of the vortex flow; 0 gives a plain polar web */
    u_arms: number;
    /** Circulation round the cylinder (lift); at ±2 both stagnation points meet */
    u_circulation: number;
    /** How fast the lattice streams along the flow; negative reverses it */
    u_drift: number;
    /** Strength of the speed-coloured stream-tube fill */
    u_fill: number;
    /** Brightness of the dashes carried along the streamlines */
    u_dye: number;
    /** accumulated on the CPU from drift (never multiplied by time in the shader) */
    u_flowPhase: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        conformalGridMaterial: ThreeElements['shaderMaterial'] & Partial<ConformalGridMaterialUniforms>;
    }
}

export const conformalGridMaterialDefaults: ConformalGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 2,
    u_lineWidth: 1,
    u_sectionSize: 4,
    u_sectionWidth: 1.4,
    u_lineColor: new THREE.Color('#2fb6c9'),
    u_sectionColor: new THREE.Color('#c8fff4'),
    u_cellColor: new THREE.Color('#1a2a78'),
    u_glowColor: new THREE.Color('#9ff0ff'),
    u_bgColor: new THREE.Color('#020a0f'),
    u_bgOpacity: 0,
    u_lineMode: 0,
    u_cellMode: 0,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.8,
    u_fadeDistance: 25,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1,
    u_flowMap: 2,
    u_poleSpread: 6,
    u_spokes: 24,
    u_arms: 3,
    u_circulation: 1.2,
    u_drift: 0.35,
    u_fill: 0.5,
    u_dye: 0.8,
    u_flowPhase: 0,
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

  uniform float u_flowMap;
  uniform float u_poleSpread;
  uniform float u_spokes;
  uniform float u_arms;
  uniform float u_circulation;
  uniform float u_fill;
  uniform float u_dye;
  uniform float u_flowPhase;

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
  vec2 clog(vec2 z){ return vec2(log(max(length(z), 1e-8)), atan(z.y, z.x)); }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // Ideal (potential) flow. Any analytic complex potential W(z) = phi + i psi
    // gives equipotentials (phi) and streamlines (psi) that cross at right angles
    // everywhere — the Cauchy–Riemann equations — so the lattice pulled back
    // through W is a mesh of tiny squares however hard the map bends it. Four flows:
    //   0 source + sink   W = log((z-1)/(z+1))     bipolar circles, a Smith-chart look
    //   1 spiral vortex   W = log z, rotated so the 2*pi*i period lands on (arms, spokes)
    //   2 cylinder        W = z + 1/z + i G log z  flow past a spinning cylinder (Magnus lift)
    //   3 corner          W = z^2 / 2              stagnation-point flow
    // The colouring is the physics: |W'| is the flow speed, so fast water is lit
    // and stagnation points go dark (Bernoulli: low pressure where it is fast).
    // u_flowPhase slides the mesh along phi, so the dye moves with the flow and
    // runs faster exactly where the streamlines crowd together.
    float A  = max(u_poleSpread, 1e-3);
    vec2  z  = vGridPos / A;
    float fz = max(max(fwidth(z.x), fwidth(z.y)), 1e-6);
    float N  = max(2.0, floor(u_spokes + 0.5));
    float M  = floor(u_arms + 0.5);
    float s  = A / max(u_cellSize, 1e-4);
    float mode = floor(u_flowMap + 0.5);

    vec2  g;             // (phi, psi) in lattice units
    float sp;            // flow speed |W'|, 1 = the reference speed of the flow
    vec2  P = vec2(0.0); // lattice jump across the log branch cut (none: 0)
    float inside = 1.0;
    float pole = 0.0;
    float pr = 0.45 / s; // pole glow radius in z units

    if (mode < 0.5){
      vec2 a = z - vec2(1.0, 0.0), b = z + vec2(1.0, 0.0);
      float k = N / TAU;
      g  = clog(cdiv(a, b)) * k;
      sp = 2.0 * k / s / max(length(a) * length(b), 1e-6);   // |dg/dz| / s
      g.x -= u_flowPhase;
      P = vec2(0.0, N);
      pole = exp(-dot(a, a) / (pr * pr)) + exp(-dot(b, b) / (pr * pr));
    } else if (mode < 1.5){
      float k  = length(vec2(M, N)) / TAU;
      float al = atan(-M, N);
      vec2  w  = clog(z);
      w.x -= u_flowPhase / k;
      g  = k * vec2(cos(al) * w.x - sin(al) * w.y, sin(al) * w.x + cos(al) * w.y);
      sp = k / s / max(length(z), 1e-6);
      P  = vec2(M, N);
      pole = exp(-dot(z, z) / (pr * pr));
    } else if (mode < 2.5){
      // u_circulation is G in W = z + 1/z + i G log z: at |G| = 2 the two
      // stagnation points meet under the cylinder. It is quantised to whole
      // lattice cells (steps of 1/(2 pi s)) so the log seam closes up.
      float nc = floor(u_circulation * TAU * s + 0.5);
      float G  = nc / (TAU * s);
      vec2  lz = clog(z);
      g  = (z + cdiv(vec2(1.0, 0.0), z)) * s + nc / TAU * vec2(-lz.y, lz.x);
      vec2 dW = vec2(1.0, 0.0) - cdiv(vec2(1.0, 0.0), cmul(z, z)) + cdiv(vec2(0.0, G), z);
      sp = length(dW);
      g.x -= u_flowPhase;
      P  = vec2(nc, 0.0);
      float rz = length(z);
      inside = smoothstep(1.0, 1.0 + 2.0 * fz, rz);
      pole = exp(-pow((rz - 1.0) * s / 0.12, 2.0)) * 0.7;
    } else {
      g  = 0.5 * cmul(z, z) * s;
      sp = length(z);
      g.x -= u_flowPhase;
      pole = exp(-dot(z, z) / (pr * pr)) * 0.5;
    }

    float fp   = max(sp * s * fz, 1e-6);           // lattice units per pixel
    float dens = (1.0 - smoothstep(0.2, 0.7, fp)) * inside;

    // Streamlines lead; equipotentials sit behind them at a third of the weight.
    float sl = lineAt(g.y, u_lineWidth, fp);
    float ep = lineAt(g.x, u_lineWidth * 0.75, fp) * 0.35;
    float lines = max(sl, ep) * dens;

    float accent = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      float fs = fp / u_sectionSize;
      accent = lineAt(g.y / u_sectionSize, u_sectionWidth, fs) * (1.0 - smoothstep(0.2, 0.7, fs)) * inside;
    }

    // ---- the flow's own colouring ------------------------------------------
    // speed ramp: slow water in cellColor, fast in lineColor, the fastest
    // (round the poles, over the cylinder's shoulders) toward sectionColor
    float sv = 1.0 - exp(-sp * 0.9);
    vec3  flowCol = mix(u_cellColor, u_lineColor, smoothstep(0.15, 0.75, sv));
    flowCol = mix(flowCol, u_sectionColor, smoothstep(0.75, 1.0, sv) * 0.6);
    // stream tubes: every other tube carries dye, with soft walls
    float tube = smoothstep(-0.55, 0.55, sin(PI * g.y));
    tube = mix(0.5, tube, dens);                   // tubes thinner than a pixel go neutral
    float body = (0.3 + 0.7 * tube) * u_fill * inside * (1.0 - smoothstep(0.5, 1.2, fp));

    // hydrogen-bubble timelines: short dashes on every streamline, carried by
    // the flow — they stretch where it speeds up and bunch where it stalls
    float head = pow(fract(g.x * 0.5), 5.0);
    float core = exp(-pow(abs(fract(g.y - 0.5) - 0.5) / (fp * max(u_lineWidth, 0.05) * 1.8), 2.0));
    float dye  = head * core * u_dye * dens;

    vec2  id = floor(g);
    vec2  fr = fract(g);
    float dmin = min(min(fr.x, 1.0 - fr.x), min(fr.y, 1.0 - fr.y)) * dens;
    vec2  key = id;
    if (dot(P, P) > 0.5) key = vec2(id.x * P.y - id.y * P.x, mod(dot(id, P), dot(P, P)));
    float cellH = hash21(key * 0.0173 + 3.1);
    float idAcc = id.x * 10.0;
    vec2  cellPos = coord;
    float tone = step(0.5, tube);

    // additive output is col * a, so the fill carries its alpha in full
    vec3  extraCol = flowCol * body + u_glowColor * (dye * 1.4 + pole * 1.1);
    float extraA = max(body, dye) + pole * 0.8;

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

export const ConformalGridMaterial = shaderMaterial(
    {
        u_time: conformalGridMaterialDefaults.u_time,
        u_cellSize: conformalGridMaterialDefaults.u_cellSize,
        u_lineWidth: conformalGridMaterialDefaults.u_lineWidth,
        u_sectionSize: conformalGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: conformalGridMaterialDefaults.u_sectionWidth,
        u_lineColor: conformalGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: conformalGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: conformalGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: conformalGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: conformalGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: conformalGridMaterialDefaults.u_bgOpacity,
        u_lineMode: conformalGridMaterialDefaults.u_lineMode,
        u_cellMode: conformalGridMaterialDefaults.u_cellMode,
        u_animSpeed: conformalGridMaterialDefaults.u_animSpeed,
        u_animScale: conformalGridMaterialDefaults.u_animScale,
        u_animIntensity: conformalGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: conformalGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: conformalGridMaterialDefaults.u_fadeStrength,
        u_focus: conformalGridMaterialDefaults.u_focus.clone(),
        u_mouse: conformalGridMaterialDefaults.u_mouse.clone(),
        u_displace: conformalGridMaterialDefaults.u_displace,
        u_reveal: conformalGridMaterialDefaults.u_reveal,
        u_flowMap: conformalGridMaterialDefaults.u_flowMap,
        u_poleSpread: conformalGridMaterialDefaults.u_poleSpread,
        u_spokes: conformalGridMaterialDefaults.u_spokes,
        u_arms: conformalGridMaterialDefaults.u_arms,
        u_circulation: conformalGridMaterialDefaults.u_circulation,
        u_drift: conformalGridMaterialDefaults.u_drift,
        u_fill: conformalGridMaterialDefaults.u_fill,
        u_dye: conformalGridMaterialDefaults.u_dye,
        u_flowPhase: conformalGridMaterialDefaults.u_flowPhase,
    },
    vertex,
    fragment,
);

extend({ ConformalGridMaterial });
