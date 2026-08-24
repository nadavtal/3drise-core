import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface ContourGridMaterialUniforms {
    u_time: number;
    /** horizontal scale of the terrain, in world units per noise cell */
    u_cellSize: number;
    /** minor contour thickness, in pixels */
    u_lineWidth: number;
    /** every Nth contour is an index contour */
    u_sectionSize: number;
    /** index-contour thickness, in pixels; 0 disables the layer */
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
    /**
     * vertex displacement. Unlike the other grids this is literal: the surface
     * rises to exactly the elevation its contours describe.
     */
    u_displace: number;
    /**
     * 0..1 assemble/dissolve. The build boundary sweeps outward from u_focus
     * with a bright leading edge; 1 is fully built, 0 is gone. Animate it
     * downward to dissolve.
     */
    u_reveal: number;
    /** number of contour steps across the full height range */
    u_levels: number;
    /** fbm gain, 0.35 rolling to 0.65 craggy */
    u_roughness: number;
    /** domain warp; bends the contours into ridges and valleys */
    u_warp: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        contourGridMaterial: ThreeElements['shaderMaterial'] & Partial<ContourGridMaterialUniforms>;
    }
}

export const contourGridMaterialDefaults: ContourGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 14.0,
    u_lineWidth: 1.0,
    u_sectionSize: 5.0,
    u_sectionWidth: 2.2,
    u_lineColor: new THREE.Color(0.35, 0.85, 0.7),
    u_sectionColor: new THREE.Color(0.75, 0.95, 0.6),
    u_cellColor: new THREE.Color(0.1, 0.36, 0.32),
    u_glowColor: new THREE.Color(0.55, 1.0, 0.75),
    u_bgColor: new THREE.Color(0.01, 0.04, 0.04),
    u_bgOpacity: 0.0,
    u_lineMode: 0,
    u_cellMode: 1,
    u_animSpeed: 1.0,
    u_animScale: 0.5,
    u_animIntensity: 1.0,
    u_fadeDistance: 25.0,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0.0,
    u_reveal: 1.0,
    u_levels: 16.0,
    u_roughness: 0.5,
    u_warp: 0.35,
};

/**
 * Shared by both stages — and it has to be, exactly. The vertex stage displaces
 * to `terrain()` and the fragment stage draws contours of the same function, so
 * any divergence between the two would slide the lines off the landform they
 * are supposed to be describing.
 */
const contourCommon = /*glsl*/ `
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p, float gain){
    float sum = 0.0;
    float amp = 0.5;
    float tot = 0.0;
    for (int i = 0; i < 5; i++){
      sum += amp * vnoise(p);
      tot += amp;
      p *= 2.02;
      amp *= gain;
    }
    return sum / max(tot, 1e-5);
  }

  /** 0..1 elevation at a point, drifting with time */
  float terrain(vec2 p, float t, float gain, float warp){
    vec2 q = p;
    if (warp > 0.0){
      q += warp * vec2(
        fbm(p + vec2(1.7, 9.2), gain),
        fbm(p + vec2(8.3, 2.8), gain)
      );
    }
    // Value-noise fbm clusters hard around 0.5, which would leave most of the
    // contour range unused and only a handful of lines on screen. Stretching it
    // about the midpoint spreads the elevation across the full 0..1 band set.
    float h = fbm(q + vec2(0.0, t * 0.05), gain);
    return clamp((h - 0.5) * 2.2 + 0.5, 0.0, 1.0);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_roughness;
  uniform float u_warp;

  varying vec2 vGridPos;

  ${contourCommon}

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      float t = u_time * u_animSpeed;
      vec2 coord = position.xy / max(u_cellSize, 1e-4);
      pos.z += terrain(coord, t, u_roughness, u_warp) * u_displace;
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
  uniform float u_levels;
  uniform float u_roughness;
  uniform float u_warp;

  varying vec2 vGridPos;

  ${contourCommon}

  float lineAt(float c, float width, float fp){
    float d = abs(fract(c - 0.5) - 0.5);
    return 1.0 - clamp(d / max(fp * max(width, 0.05), 1e-6), 0.0, 1.0);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    float h = terrain(coord, t, u_roughness, u_warp);

    // Contours are just iso-lines of the height field: bands crosses an integer
    // once per elevation step, and fwidth turns that into a screen-space width,
    // so lines stay one pixel thick on a steep slope and on a flat plain alike.
    float bands = h * max(u_levels, 1.0);
    float fp    = max(fwidth(bands), 1e-6);
    float minor = lineAt(bands, u_lineWidth, fp);

    float major = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      float mb = bands / u_sectionSize;
      major = lineAt(mb, u_sectionWidth, max(fwidth(mb), 1e-6));
    }

    // ---- contour animation -----------------------------------------------
    float lineAnim = 1.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      lineAnim = 0.5 + 0.5 * sin(length(coord - focus) * u_animScale * 6.0 - t);
    } else if (u_lineMode < 2.5){
      // elevation sweep: a band of contours lights as it rises through the range
      lineAnim = 0.3 + 0.7 * pow(fract(h - t * 0.1), 8.0);
    } else if (u_lineMode < 3.5){
      float s = fract((coord.x + coord.y) * 0.3 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    // ---- hypsometric fill ------------------------------------------------
    float cell = 0.0;
    float bandId = floor(bands);
    if (u_cellMode > 0.5 && u_cellMode < 1.5){
      cell = h; // straight elevation tint
    } else if (u_cellMode < 2.5){
      float bh = hash21(vec2(bandId, 3.7));
      cell = 0.5 + 0.5 * sin(t * (0.6 + bh) + bh * TAU);
    } else if (u_cellMode < 3.5){
      cell = smoothstep(0.6, 1.0, sin(length(coord - focus) * u_animScale * 6.0 - t));
    } else if (u_cellMode < 4.5){
      cell = mod(bandId, 2.0) * (0.5 + 0.5 * sin(t));
    }
    cell *= u_animIntensity;

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += u_cellColor * cell;              a = max(a, cell * 0.8);
    float minorI = minor * lineAnim;
    col += u_lineColor * minorI;            a = max(a, minorI);
    float majorI = major * lineAnim;
    col += u_sectionColor * majorI;         a = max(a, majorI);
    // peaks glow, so the eye reads height without needing a legend
    col += u_glowColor * (minorI * 0.15 + majorI * 0.3) * h * u_animIntensity;

    col *= fade;
    a   *= fade;

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

export const ContourGridMaterial = shaderMaterial(
    {
        u_time: contourGridMaterialDefaults.u_time,
        u_cellSize: contourGridMaterialDefaults.u_cellSize,
        u_lineWidth: contourGridMaterialDefaults.u_lineWidth,
        u_sectionSize: contourGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: contourGridMaterialDefaults.u_sectionWidth,
        u_lineColor: contourGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: contourGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: contourGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: contourGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: contourGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: contourGridMaterialDefaults.u_bgOpacity,
        u_lineMode: contourGridMaterialDefaults.u_lineMode,
        u_cellMode: contourGridMaterialDefaults.u_cellMode,
        u_animSpeed: contourGridMaterialDefaults.u_animSpeed,
        u_animScale: contourGridMaterialDefaults.u_animScale,
        u_animIntensity: contourGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: contourGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: contourGridMaterialDefaults.u_fadeStrength,
        u_focus: contourGridMaterialDefaults.u_focus.clone(),
        u_mouse: contourGridMaterialDefaults.u_mouse.clone(),
        u_displace: contourGridMaterialDefaults.u_displace,
        u_reveal: contourGridMaterialDefaults.u_reveal,
        u_levels: contourGridMaterialDefaults.u_levels,
        u_roughness: contourGridMaterialDefaults.u_roughness,
        u_warp: contourGridMaterialDefaults.u_warp,
    },
    vertex,
    fragment,
);

extend({ ContourGridMaterial });
