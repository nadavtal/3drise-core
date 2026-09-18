import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

/**
 * A spacetime lattice around a binary black-hole inspiral. The Newtonian wells pinch the lines, and quadrupole waves, evaluated at the retarded time, spiral outward and chirp toward the merger before the remnant rings down.
 *
 * Shares the grid vocabulary with the other shader-plane grids (lineMode /
 * cellMode 0..4, fade, reveal, focus), so the same controller drives it.
 */
export interface GravWaveGridMaterialUniforms {
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
    /** wave amplitude multiplier; 0 leaves only the static wells */
    u_strain: number;
    /** seconds per inspiral-merger-ringdown cycle (clamped to at least 4 in the shader) */
    u_chirpTime: number;
    /** wave speed c in cells per second; sets the wavelength and the retardation delay */
    u_waveSpeed: number;
    /** mass ratio q = m2/m1 in 0.1..1; sets the orbit offsets, well depths and wave strength */
    u_massRatio: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        gravWaveGridMaterial: ThreeElements['shaderMaterial'] & Partial<GravWaveGridMaterialUniforms>;
    }
}

export const gravWaveGridMaterialDefaults: GravWaveGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 1,
    u_lineWidth: 1,
    u_sectionSize: 5,
    u_sectionWidth: 1.4,
    u_lineColor: new THREE.Color('#3d6fc9'),
    u_sectionColor: new THREE.Color('#9cc2ff'),
    u_cellColor: new THREE.Color('#1b3a7a'),
    u_glowColor: new THREE.Color('#8fd8ff'),
    u_bgColor: new THREE.Color('#03050b'),
    u_bgOpacity: 0,
    u_lineMode: 0,
    u_cellMode: 0,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.7,
    u_fadeDistance: 25,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1.0,
    u_strain: 1,
    u_chirpTime: 14,
    u_waveSpeed: 6.5,
    u_massRatio: 0.6,
};

const vertex = /* glsl */ `
  
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  uniform vec2  u_focus;
  
  const float PI  = 3.14159265359;
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  
  uniform float u_strain;
  uniform float u_chirpTime;
  uniform float u_waveSpeed;
  uniform float u_massRatio;

  const float GW_A0  = 3.2;     // separation when a cycle starts, cells
  const float GW_R   = 0.0256;  // tau at merger / tau at start = (a_merge / a0)^4, a_merge = 0.4 a0
  const float GW_W0  = 1.3;     // orbital angular frequency at the start, rad/s
  const float GW_QNM = 1.3;     // ringdown frequency / orbital frequency at merger
  const float GW_TD  = 0.4;     // ringdown e-folding time, s
  const float GW_H0  = 0.24;     // strain at the source at the start (strain knob = 1)
  const float GW_RF  = 10.0;    // softening of the 1/r fall-off, cells
  const float GW_G   = 0.45;    // well strength (G M), cells^3; folds only past ~5 eps^3
  const float GW_EPS = 0.6;     // well softening, cells

  float gwCycle(){ return max(u_chirpTime, 4.0); }

  // State of the binary s seconds into a cycle: orbital phase, orbital
  // angular frequency, separation, wave envelope (~ omega^(2/3)), and how
  // present the new binary is (it fades in while the old remnant fades out).
  void gwState(float s, out float phi, out float w, out float a, out float env, out float live){
    float T  = gwCycle();
    float Ti = 0.7 * T;                    // inspiral; merger at Ti
    float ts = Ti / (1.0 - GW_R);          // tau when the cycle starts
    float fadeIn = smoothstep(0.0, 0.12 * T, s);
    if (s < Ti){
      float u = (ts - s) / ts;             // tau / tau_start, 1 -> GW_R
      a    = GW_A0 * pow(u, 0.25);
      w    = GW_W0 * pow(u, -0.375);
      phi  = 1.6 * GW_W0 * ts * (1.0 - pow(u, 0.625));
      env  = pow(u, -0.25) * fadeIn;
      live = fadeIn;
    } else {
      // ringdown: the remnant's quadrupole mode, frequency easing up to the
      // quasi-normal value and decaying exponentially
      float x  = s - Ti;
      float wm = GW_W0 * pow(GW_R, -0.375);
      float wq = wm * GW_QNM;
      float e  = 1.0 - exp(-x / 0.15);
      phi  = 1.6 * GW_W0 * ts * (1.0 - pow(GW_R, 0.625)) + wq * x - (wq - wm) * 0.15 * e;
      w    = mix(wm, wq, e);
      a    = GW_A0 * pow(GW_R, 0.25) * exp(-x / 0.12);
      env  = pow(GW_R, -0.25) * exp(-x / GW_TD) * (1.0 - smoothstep(0.9 * T, T, s));
      live = 1.0;
    }
  }

  void gwMasses(out float m1, out float m2){
    float q = clamp(u_massRatio, 0.1, 1.0);
    m1 = 1.0 / (1.0 + q);
    m2 = q / (1.0 + q);
  }

  // Outgoing wave at x (cells from the binary) and time t.
  // Returns the displacement in xy, the signed strain in z, and the
  // brightness of the two spiral arms (the crests of h+) in w.
  vec4 gwWave(vec2 x, float t, float pix){
    float T = gwCycle();
    float c = max(u_waveSpeed, 0.5);
    float r = length(x);
    float phi, w, a, env, live;
    gwState(mod(t - r / c, T), phi, w, a, env, live);
    float m1, m2;
    gwMasses(m1, m2);
    float k = 2.0 * w / c;
    float h = u_strain * GW_H0 * 4.0 * m1 * m2 * env * GW_RF / (r + GW_RF);
    h *= smoothstep(0.4, 2.2, r);          // no wave inside the near zone
    h /= sqrt(1.0 + h * h / 0.42);         // soft limit keeps the lattice from folding
    // a wavelength shorter than a few pixels would only alias: let it go
    h *= smoothstep(3.0, 8.0, (TAU / k) / max(pix, 1e-5));
    vec2 rh = x / max(r, 1e-4);
    float psi = 2.0 * (phi - atan(x.y, x.x));
    float cp = cos(psi);
    vec2 D = (h / k) * (cp * rh + sin(psi) * vec2(-rh.y, rh.x));
    // the crests of h+ drawn as light: the two trailing arms of the
    // quadrupole emission pattern, kept legible far from the source
    float amp = clamp(u_strain, 0.0, 2.0) * 4.0 * m1 * m2 * env
              * pow(GW_RF / (r + GW_RF), 0.75) * smoothstep(0.4, 2.2, r);
    float cpp = max(cp, 0.0);
    cpp *= cpp;                      // a narrow ridge along each crest
    return vec4(D, h * sin(psi), amp * cpp * cpp * cpp);
  }

  // pull of a softened point mass: grad of m / sqrt(r^2 + eps^2)
  vec2 gwPull(vec2 x, vec2 p, float m){
    vec2 d = x - p;
    float q = dot(d, d) + GW_EPS * GW_EPS;
    return d * (GW_G * m / (q * sqrt(q)));
  }


  float gwWell(vec2 x, vec2 p, float m){
    return m * 1.2 / sqrt(dot(x - p, x - p) + 1.44);
  }

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      float cs = max(u_cellSize, 1e-4);
      float t  = u_time * u_animSpeed;
      vec2  x  = (position.xy - u_focus) / cs;
      float phi, w, a, env, live;
      gwState(mod(t, gwCycle()), phi, w, a, env, live);
      float m1, m2;
      gwMasses(m1, m2);
      vec2 e = vec2(cos(phi), sin(phi)) * a;
      // the wells sink the sheet (rubber-sheet picture of the potential)
      float depth = live * (gwWell(x, -e * m2, m1) + gwWell(x, e * m1, m2))
                  + (1.0 - live) * gwWell(x, vec2(0.0), 1.0);
      vec4 wave = gwWave(x, t, 0.02);
      pos.z += u_displace * (-depth + wave.z * 0.6);
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

  
  uniform float u_strain;
  uniform float u_chirpTime;
  uniform float u_waveSpeed;
  uniform float u_massRatio;

  const float GW_A0  = 3.2;     // separation when a cycle starts, cells
  const float GW_R   = 0.0256;  // tau at merger / tau at start = (a_merge / a0)^4, a_merge = 0.4 a0
  const float GW_W0  = 1.3;     // orbital angular frequency at the start, rad/s
  const float GW_QNM = 1.3;     // ringdown frequency / orbital frequency at merger
  const float GW_TD  = 0.4;     // ringdown e-folding time, s
  const float GW_H0  = 0.24;     // strain at the source at the start (strain knob = 1)
  const float GW_RF  = 10.0;    // softening of the 1/r fall-off, cells
  const float GW_G   = 0.45;    // well strength (G M), cells^3; folds only past ~5 eps^3
  const float GW_EPS = 0.6;     // well softening, cells

  float gwCycle(){ return max(u_chirpTime, 4.0); }

  // State of the binary s seconds into a cycle: orbital phase, orbital
  // angular frequency, separation, wave envelope (~ omega^(2/3)), and how
  // present the new binary is (it fades in while the old remnant fades out).
  void gwState(float s, out float phi, out float w, out float a, out float env, out float live){
    float T  = gwCycle();
    float Ti = 0.7 * T;                    // inspiral; merger at Ti
    float ts = Ti / (1.0 - GW_R);          // tau when the cycle starts
    float fadeIn = smoothstep(0.0, 0.12 * T, s);
    if (s < Ti){
      float u = (ts - s) / ts;             // tau / tau_start, 1 -> GW_R
      a    = GW_A0 * pow(u, 0.25);
      w    = GW_W0 * pow(u, -0.375);
      phi  = 1.6 * GW_W0 * ts * (1.0 - pow(u, 0.625));
      env  = pow(u, -0.25) * fadeIn;
      live = fadeIn;
    } else {
      // ringdown: the remnant's quadrupole mode, frequency easing up to the
      // quasi-normal value and decaying exponentially
      float x  = s - Ti;
      float wm = GW_W0 * pow(GW_R, -0.375);
      float wq = wm * GW_QNM;
      float e  = 1.0 - exp(-x / 0.15);
      phi  = 1.6 * GW_W0 * ts * (1.0 - pow(GW_R, 0.625)) + wq * x - (wq - wm) * 0.15 * e;
      w    = mix(wm, wq, e);
      a    = GW_A0 * pow(GW_R, 0.25) * exp(-x / 0.12);
      env  = pow(GW_R, -0.25) * exp(-x / GW_TD) * (1.0 - smoothstep(0.9 * T, T, s));
      live = 1.0;
    }
  }

  void gwMasses(out float m1, out float m2){
    float q = clamp(u_massRatio, 0.1, 1.0);
    m1 = 1.0 / (1.0 + q);
    m2 = q / (1.0 + q);
  }

  // Outgoing wave at x (cells from the binary) and time t.
  // Returns the displacement in xy, the signed strain in z, and the
  // brightness of the two spiral arms (the crests of h+) in w.
  vec4 gwWave(vec2 x, float t, float pix){
    float T = gwCycle();
    float c = max(u_waveSpeed, 0.5);
    float r = length(x);
    float phi, w, a, env, live;
    gwState(mod(t - r / c, T), phi, w, a, env, live);
    float m1, m2;
    gwMasses(m1, m2);
    float k = 2.0 * w / c;
    float h = u_strain * GW_H0 * 4.0 * m1 * m2 * env * GW_RF / (r + GW_RF);
    h *= smoothstep(0.4, 2.2, r);          // no wave inside the near zone
    h /= sqrt(1.0 + h * h / 0.42);         // soft limit keeps the lattice from folding
    // a wavelength shorter than a few pixels would only alias: let it go
    h *= smoothstep(3.0, 8.0, (TAU / k) / max(pix, 1e-5));
    vec2 rh = x / max(r, 1e-4);
    float psi = 2.0 * (phi - atan(x.y, x.x));
    float cp = cos(psi);
    vec2 D = (h / k) * (cp * rh + sin(psi) * vec2(-rh.y, rh.x));
    // the crests of h+ drawn as light: the two trailing arms of the
    // quadrupole emission pattern, kept legible far from the source
    float amp = clamp(u_strain, 0.0, 2.0) * 4.0 * m1 * m2 * env
              * pow(GW_RF / (r + GW_RF), 0.75) * smoothstep(0.4, 2.2, r);
    float cpp = max(cp, 0.0);
    cpp *= cpp;                      // a narrow ridge along each crest
    return vec4(D, h * sin(psi), amp * cpp * cpp * cpp);
  }

  // pull of a softened point mass: grad of m / sqrt(r^2 + eps^2)
  vec2 gwPull(vec2 x, vec2 p, float m){
    vec2 d = x - p;
    float q = dot(d, d) + GW_EPS * GW_EPS;
    return d * (GW_G * m / (q * sqrt(q)));
  }


  // a lattice line that dissolves into its average coverage before it gets
  // finer than about 1.5 px, so the far field never turns into moire
  float gwLine(float c, float width, float fp){
    float l = lineAt(c, width, fp);
    return mix(l, min(width * fp, 1.0) * 0.45, smoothstep(0.3, 0.65, fp));
  }

  void main(){
    float cs = max(u_cellSize, 1e-4);
    vec2 coord = vGridPos / cs;
    vec2 focus = u_focus / cs;
    float t = u_time * u_animSpeed;
    float pix = length(fwidth(coord)) * 0.7071;
    float T = gwCycle();

    vec2  x = coord - focus;               // cells from the binary's centre of mass
    float r = length(x);

    float phi, w, sep, env, live;
    float s = mod(t, T);
    gwState(s, phi, w, sep, env, live);
    float m1, m2;
    gwMasses(m1, m2);
    vec2 e  = vec2(cos(phi), sin(phi)) * sep;
    vec2 p1 = -e * m2;
    vec2 p2 =  e * m1;

    // Lattice coordinates: the wells pull the lines in, the wave displaces them.
    vec4 wave = gwWave(x, t, pix);
    vec2 pull = live * (gwPull(x, p1, m1) + gwPull(x, p2, m2))
              + (1.0 - live) * gwPull(x, vec2(0.0), 1.0);
    vec2 g  = coord + pull - wave.xy;
    vec2 fw = max(fwidth(g), vec2(1e-5));

    float lx = gwLine(g.x, u_lineWidth, fw.x);
    float ly = gwLine(g.y, u_lineWidth, fw.y);
    float lines = max(lx, ly);

    float accent = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      float ss = u_sectionSize;
      accent = max(gwLine(g.x / ss, u_sectionWidth, fw.x / ss),
                   gwLine(g.y / ss, u_sectionWidth, fw.y / ss));
    }

    vec2  fr = abs(fract(g - 0.5) - 0.5);
    float cellH = hash21(floor(g) + 0.37);
    float edgeKeep = smoothstep(0.02, 0.16, min(fr.x, fr.y));
    float cellDist  = length(x + pull - wave.xy);   // ripples bend into the wells
    float flowCoord = (g.x + g.y) * 0.7071;
    float scanCoord = r * 2.0;
    float fadeR = length(vGridPos) / max(u_fadeDistance, 1e-4);

    // The masses: white-hot cores that stay at least a pixel wide, with a
    // faint accretion glow, and a soft flash as they merge.
    float core = 0.0;
    float halo = 0.0;
    float d1 = length(x - p1), d2 = length(x - p2), d0 = r;
    float r1 = max(0.18 * pow(m1, 0.333), pix * 1.4);
    float r2 = max(0.18 * pow(m2, 0.333), pix * 1.4);
    float r0 = max(0.18, pix * 1.4);
    core += live * (exp(-d1 * d1 / (r1 * r1)) + exp(-d2 * d2 / (r2 * r2)));
    core += (1.0 - live) * exp(-d0 * d0 / (r0 * r0));
    halo += live * (m1 * exp(-d1 / 0.6) + m2 * exp(-d2 / 0.6));
    halo += (1.0 - live) * exp(-d0 / 0.6);
    float xm = s - 0.7 * T;
    float flash = xm > 0.0 ? exp(-xm / 0.5) : exp(xm / 0.6) * 0.25;
    float bloom = flash * exp(-r * r / 6.0);

    // The crests of h+ are the two trailing arms of the emission pattern;
    // they glow, the lines light up where the strain is large, and the
    // stretched strips take a faint tint, so the spiral reads between lines.
    float arms = wave.w;
    vec3 extraCol = u_glowColor * (arms * 0.7 + lines * arms * 0.8)
                  + u_cellColor * max(wave.z, 0.0) * 1.6 * edgeKeep
                  + mix(u_glowColor, vec3(1.0), 0.75) * core * 1.8
                  + u_glowColor * (halo * 0.4 + bloom * 0.4);
    float extraA = clamp(max(max(core, arms * 0.75), halo * 0.4 + bloom * 0.3), 0.0, 1.0);
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

export const GravWaveGridMaterial = shaderMaterial(
    {
        u_time: gravWaveGridMaterialDefaults.u_time,
        u_cellSize: gravWaveGridMaterialDefaults.u_cellSize,
        u_lineWidth: gravWaveGridMaterialDefaults.u_lineWidth,
        u_sectionSize: gravWaveGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: gravWaveGridMaterialDefaults.u_sectionWidth,
        u_lineColor: gravWaveGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: gravWaveGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: gravWaveGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: gravWaveGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: gravWaveGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: gravWaveGridMaterialDefaults.u_bgOpacity,
        u_lineMode: gravWaveGridMaterialDefaults.u_lineMode,
        u_cellMode: gravWaveGridMaterialDefaults.u_cellMode,
        u_animSpeed: gravWaveGridMaterialDefaults.u_animSpeed,
        u_animScale: gravWaveGridMaterialDefaults.u_animScale,
        u_animIntensity: gravWaveGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: gravWaveGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: gravWaveGridMaterialDefaults.u_fadeStrength,
        u_focus: gravWaveGridMaterialDefaults.u_focus.clone(),
        u_mouse: gravWaveGridMaterialDefaults.u_mouse.clone(),
        u_displace: gravWaveGridMaterialDefaults.u_displace,
        u_reveal: gravWaveGridMaterialDefaults.u_reveal,
        u_strain: gravWaveGridMaterialDefaults.u_strain,
        u_chirpTime: gravWaveGridMaterialDefaults.u_chirpTime,
        u_waveSpeed: gravWaveGridMaterialDefaults.u_waveSpeed,
        u_massRatio: gravWaveGridMaterialDefaults.u_massRatio,
    },
    vertex,
    fragment,
);

extend({ GravWaveGridMaterial });
