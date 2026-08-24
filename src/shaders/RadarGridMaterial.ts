import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface RadarGridMaterialUniforms {
    u_time: number;
    /** spacing between rings, in world units */
    u_cellSize: number;
    /** ring/spoke thickness, in pixels */
    u_lineWidth: number;
    /** every Nth ring is drawn as a major ring */
    u_sectionSize: number;
    /** major-ring, bezel and crosshair thickness, in pixels; 0 hides them */
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
    /** doubles as the disc radius — the surface is masked to it */
    u_fadeDistance: number;
    u_fadeStrength: number;
    u_focus: THREE.Vector2;
    u_mouse: THREE.Vector2;
    u_displace: number;
    /**
     * 0..1 assemble/dissolve. The build boundary sweeps outward from u_focus
     * with a bright leading edge; 1 is fully built, 0 is gone. Animate it
     * downward to dissolve.
     */
    u_reveal: number;
    /** number of radial spokes; 0 disables them */
    u_spokes: number;
    /** angular length of the sweep trail, as a fraction of a turn; 0 disables the sweep */
    u_sweepWidth: number;
    /** 0..1 — chance that a ring/spoke sector holds a blip */
    u_blipDensity: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        radarGridMaterial: ThreeElements['shaderMaterial'] & Partial<RadarGridMaterialUniforms>;
    }
}

export const radarGridMaterialDefaults: RadarGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 2.5,
    u_lineWidth: 1.0,
    u_sectionSize: 4.0,
    u_sectionWidth: 1.8,
    u_lineColor: new THREE.Color(0.1, 0.5, 0.34),
    u_sectionColor: new THREE.Color(0.5, 1.0, 0.72),
    u_cellColor: new THREE.Color(0.05, 0.2, 0.14),
    u_glowColor: new THREE.Color(0.35, 1.0, 0.6),
    u_bgColor: new THREE.Color(0.01, 0.05, 0.03),
    u_bgOpacity: 0.25,
    u_lineMode: 1,
    u_cellMode: 0,
    u_animSpeed: 1.0,
    u_animScale: 0.5,
    u_animIntensity: 1.0,
    u_fadeDistance: 25.0,
    u_fadeStrength: 0.25,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0.0,
    u_reveal: 1.0,
    u_spokes: 24.0,
    u_sweepWidth: 0.13,
    u_blipDensity: 0.08,
};

const radarCommon = /*glsl*/ `
  const float TAU = 6.28318530718;

  vec2 hash22(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  ${radarCommon}

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

const fragment = /*glsl*/ `
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
  uniform float u_spokes;
  uniform float u_sweepWidth;
  uniform float u_blipDensity;

  varying vec2 vGridPos;

  ${radarCommon}

  /** antialiased line wherever c crosses an integer; fp = footprint of c */
  float lineAt(float c, float width, float fp){
    float d = abs(fract(c - 0.5) - 0.5);
    return 1.0 - clamp(d / max(fp * max(width, 0.05), 1e-6), 0.0, 1.0);
  }

  void main(){
    vec2  p = vGridPos;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float radius = max(u_fadeDistance, 1e-4);
    float rn = r / radius;
    float t  = u_time * u_animSpeed;
    float px = max(length(fwidth(p)), 1e-6);

    // ---- rings -----------------------------------------------------------
    float rc  = r / max(u_cellSize, 1e-4);
    float rings = lineAt(rc, u_lineWidth, max(fwidth(rc), 1e-6));

    float major = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      float mc = rc / u_sectionSize;
      major = lineAt(mc, u_sectionWidth, max(fwidth(mc), 1e-6));
    }

    // ---- spokes ----------------------------------------------------------
    // fwidth of an angle blows up at the atan seam and at the origin, so it is
    // clamped and the spokes are faded out of the hub.
    float sc = 0.0;
    float spokes = 0.0;
    if (u_spokes >= 1.0){
      sc = (ang / TAU + 0.5) * u_spokes;
      float spx = clamp(fwidth(sc), 1e-6, 0.3);
      spokes = lineAt(sc, u_lineWidth, spx) * smoothstep(0.0, u_cellSize * 0.7, r);
    }

    // ---- sweep arm -------------------------------------------------------
    float sweepA = t * 0.5;
    float sweep = 0.0;
    float sweepEdge = 0.0;
    if (u_sweepWidth > 0.0){
      float age = fract((sweepA - ang) / TAU); // 0 right at the arm, 1 just before it
      sweep = exp(-age / max(u_sweepWidth, 1e-3));
      sweepEdge = 1.0 - smoothstep(0.0, 0.006, age);
    }

    // ---- contact blips ---------------------------------------------------
    float blip = 0.0;
    if (u_blipDensity > 0.0 && u_spokes >= 1.0){
      vec2 pid = floor(vec2(rc, sc));
      vec2 hh = hash22(pid);
      float br = (pid.x + 0.25 + 0.5 * hh.y) * u_cellSize;
      if (hh.x < u_blipDensity && br > u_cellSize * 1.5 && br < radius * 0.97){
        float bs = pid.y + 0.25 + 0.5 * fract(hh.y * 13.71);
        float ba = (bs / u_spokes - 0.5) * TAU;
        vec2  bp = vec2(cos(ba), sin(ba)) * br;
        float bRad = u_cellSize * 0.07;
        float dot0 = 1.0 - smoothstep(bRad, bRad + px * 2.0, length(p - bp));
        // a contact glows when the arm crosses it, then decays until it returns
        float age = fract((sweepA - ba) / TAU);
        blip = dot0 * (u_sweepWidth > 0.0 ? exp(-age * 5.0) : 1.0);
      }
    }

    // ---- ring / spoke animation -----------------------------------------
    float lineAnim = 1.0;
    float ping = 0.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      // ping rings expanding from the focus point
      float pd = length(p - u_focus);
      for (int i = 0; i < 2; i++){
        float phase = fract(t * 0.25 + float(i) * 0.5);
        float pr = phase * radius;
        ping += (1.0 - smoothstep(0.0, px * 2.0 + radius * 0.003, abs(pd - pr))) * (1.0 - phase);
      }
    } else if (u_lineMode < 2.5){
      lineAnim = 0.4 + 0.6 * (0.5 + 0.5 * sin(rc * u_animScale - t));
    } else if (u_lineMode < 3.5){
      // spokes lighting in sequence, like a sector scan
      float s = fract(sc / max(u_spokes, 1.0) - t * 0.12);
      lineAnim = 0.3 + smoothstep(0.0, 0.1, s) * (1.0 - smoothstep(0.1, 0.3, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);
    ping *= u_animIntensity;

    // ---- sector fill -----------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5 && u_spokes >= 1.0){
      vec2 pid = floor(vec2(rc, sc));
      vec2 hh = hash22(pid);
      if (u_cellMode < 1.5){
        cell = 0.5 + 0.5 * sin(dot(pid, vec2(0.7, 0.3)) * u_animScale - t);
      } else if (u_cellMode < 2.5){
        cell = 0.5 + 0.5 * sin(t * (0.6 + hh.x) + hh.y * TAU);
      } else if (u_cellMode < 3.5){
        float d = length(p - u_focus) / max(u_cellSize, 1e-4);
        cell = smoothstep(0.6, 1.0, sin(d * u_animScale - t));
      } else if (u_cellMode < 4.5){
        cell = mod(pid.x + pid.y, 2.0) * (0.5 + 0.5 * sin(t));
      }
      cell *= u_animIntensity;
      float fr = abs(fract(rc) - 0.5);
      float fs = abs(fract(sc) - 0.5);
      cell *= smoothstep(0.5, 0.35, max(fr, fs));
    }

    // ---- bezel, crosshair, ticks ----------------------------------------
    float bezel = 0.0, crosshair = 0.0, ticks = 0.0;
    if (u_sectionWidth > 0.0){
      float bw = max(px * u_sectionWidth * 1.5, 1e-6);
      bezel = 1.0 - clamp(abs(r - radius * 0.99) / bw, 0.0, 1.0);

      vec2 cd = abs(p) / max(px * u_sectionWidth, 1e-6);
      crosshair = (1.0 - clamp(min(cd.x, cd.y), 0.0, 1.0)) * step(r, radius * 0.99);

      float tc = (ang / TAU + 0.5) * 72.0;
      ticks = lineAt(tc, 1.0, clamp(fwidth(tc), 1e-6, 0.3))
            * smoothstep(radius * 0.93, radius * 0.955, r)
            * (1.0 - smoothstep(radius * 0.975, radius * 0.99, r));
    }

    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, rn);
    float disc = 1.0 - smoothstep(0.995, 1.005, rn);

    // ---- compose ---------------------------------------------------------
    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    float ringI  = rings * lineAnim;
    float majorI = major * lineAnim;
    float spokeI = spokes * lineAnim;

    col += u_cellColor * cell;                     a = max(a, cell * 0.9);
    col += u_lineColor * (ringI + spokeI);         a = max(a, max(ringI, spokeI));
    col += u_sectionColor * majorI;                a = max(a, majorI);
    col += u_glowColor * sweep * 0.55;             a = max(a, sweep * 0.55);
    col += u_sectionColor * sweepEdge * 1.2;       a = max(a, sweepEdge);
    col += u_glowColor * blip * 2.0;               a = max(a, blip);
    col += u_glowColor * ping * 1.4;               a = max(a, ping);

    col *= fade;
    a   *= fade;

    // the instrument frame does not fade out with the field it contains
    col += u_sectionColor * (bezel + ticks + crosshair * 0.55);
    a = max(a, max(bezel, max(ticks, crosshair * 0.55)));

    col *= disc;
    a   *= disc;

    // ---- reveal ----------------------------------------------------------
    // The build boundary sweeps outward from the focus point. Its leading band
    // mostly brightens whatever is already there rather than painting a solid
    // disc, so the grid reads as assembling itself rather than fading in.
    if (u_reveal < 0.999){
      float rd = length(vGridPos - u_focus) / max(u_fadeDistance, 1e-4);
      // 1.1, not 1.25: the boundary has to clear the fade radius by just the
      // width of its own soft edge. Overshooting further finishes the build
      // before reveal reaches 1 and leaves the tail of the range doing nothing.
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

export const RadarGridMaterial = shaderMaterial(
    {
        u_time: radarGridMaterialDefaults.u_time,
        u_cellSize: radarGridMaterialDefaults.u_cellSize,
        u_lineWidth: radarGridMaterialDefaults.u_lineWidth,
        u_sectionSize: radarGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: radarGridMaterialDefaults.u_sectionWidth,
        u_lineColor: radarGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: radarGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: radarGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: radarGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: radarGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: radarGridMaterialDefaults.u_bgOpacity,
        u_lineMode: radarGridMaterialDefaults.u_lineMode,
        u_cellMode: radarGridMaterialDefaults.u_cellMode,
        u_animSpeed: radarGridMaterialDefaults.u_animSpeed,
        u_animScale: radarGridMaterialDefaults.u_animScale,
        u_animIntensity: radarGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: radarGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: radarGridMaterialDefaults.u_fadeStrength,
        u_focus: radarGridMaterialDefaults.u_focus.clone(),
        u_mouse: radarGridMaterialDefaults.u_mouse.clone(),
        u_displace: radarGridMaterialDefaults.u_displace,
    u_reveal: radarGridMaterialDefaults.u_reveal,
        u_spokes: radarGridMaterialDefaults.u_spokes,
        u_sweepWidth: radarGridMaterialDefaults.u_sweepWidth,
        u_blipDensity: radarGridMaterialDefaults.u_blipDensity,
    },
    vertex,
    fragment,
);

extend({ RadarGridMaterial });
