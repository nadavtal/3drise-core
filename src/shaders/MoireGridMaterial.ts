import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface MoireGridMaterialUniforms {
    u_time: number;
    /** base lattice spacing, in world units */
    u_cellSize: number;
    /** line thickness, in pixels */
    u_lineWidth: number;
    /** spacing of the beat lattice drawn over the interference (square shape only) */
    u_sectionSize: number;
    /** beat-lattice thickness, in pixels; 0 hides it */
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
    /**
     * 0..1 assemble/dissolve. The build boundary sweeps outward from u_focus
     * with a bright leading edge; 1 is fully built, 0 is gone. Animate it
     * downward to dissolve.
     */
    u_reveal: number;
    /** lattice shape for both layers: 0 square, 1 hex, 2 concentric rings */
    u_shape: number;
    /** fixed angle between the two layers, in radians */
    u_layerAngle: number;
    /** spacing ratio of the second layer; near 1 gives long, slow beats */
    u_layerScale: number;
    /** counter-rotation speed; 0 freezes the pattern at u_layerAngle */
    u_spin: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        moireGridMaterial: ThreeElements['shaderMaterial'] & Partial<MoireGridMaterialUniforms>;
    }
}

export const moireGridMaterialDefaults: MoireGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 2.8,
    u_lineWidth: 1.4,
    u_sectionSize: 12.0,
    u_sectionWidth: 0.0,
    u_lineColor: new THREE.Color(0.13, 0.42, 0.85),
    u_sectionColor: new THREE.Color(0.95, 0.35, 0.62),
    u_cellColor: new THREE.Color(0.05, 0.1, 0.25),
    u_glowColor: new THREE.Color(0.6, 0.85, 1.0),
    u_bgColor: new THREE.Color(0.01, 0.02, 0.05),
    u_bgOpacity: 0.0,
    u_lineMode: 0,
    u_cellMode: 2,
    u_animSpeed: 1.0,
    u_animScale: 1.0,
    u_animIntensity: 1.0,
    u_fadeDistance: 25.0,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0.0,
    u_reveal: 1.0,
    u_shape: 0.0,
    u_layerAngle: 0.05,
    u_layerScale: 1.06,
    u_spin: 1.0,
};

const moireCommon = /*glsl*/ `
  const float TAU = 6.28318530718;
  const vec2  HEX_R = vec2(1.0, 1.73205081);

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec2 rot2(vec2 p, float a){
    float c = cos(a), s = sin(a);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  ${moireCommon}

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
  uniform float u_shape;
  uniform float u_layerAngle;
  uniform float u_layerScale;
  uniform float u_spin;

  varying vec2 vGridPos;

  ${moireCommon}

  float hexDist(vec2 p){
    p = abs(p);
    return max(dot(p, normalize(HEX_R)), p.x);
  }

  vec2 hexLocal(vec2 p){
    vec2 h = HEX_R * 0.5;
    vec2 a = mod(p, HEX_R) - h;
    vec2 b = mod(p - h, HEX_R) - h;
    return dot(a, a) < dot(b, b) ? a : b;
  }

  float squareLattice(vec2 c, float width){
    vec2 d = fwidth(c);
    vec2 g = abs(fract(c - 0.5) - 0.5) / max(d * width, 1e-5);
    return 1.0 - clamp(min(g.x, g.y), 0.0, 1.0);
  }

  float hexLattice(vec2 c, float width){
    float px = max(length(fwidth(c)), 1e-6);
    float d = 0.5 - hexDist(hexLocal(c));
    return 1.0 - smoothstep(0.0, px * max(width, 0.05), d);
  }

  float ringLattice(vec2 c, float width){
    float r = length(c);
    float fp = max(fwidth(r), 1e-6);
    float d = abs(fract(r - 0.5) - 0.5);
    return 1.0 - clamp(d / max(fp * max(width, 0.05), 1e-6), 0.0, 1.0);
  }

  /** one layer, in whichever shape u_shape selects */
  float layer(vec2 c, float width){
    if (u_shape < 0.5)  return squareLattice(c, width);
    if (u_shape < 1.5)  return hexLattice(c, width);
    return ringLattice(c, width);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // Two lattices, counter-rotated by half the layer angle each. The
    // interference is not drawn — it emerges from where the two line sets
    // nearly coincide, which is what makes the beat pattern read as physical.
    // The angle oscillates rather than accumulating. A steadily growing offset
    // leaves the small-angle regime within seconds and never comes back, and
    // the wide-angle cross-hatch it lands in is the least interesting part of
    // the range; swinging keeps it cycling through the long, slow beats.
    float spin = u_spin * sin(t * 0.04 * u_animScale) * 0.10;
    float a1 =  u_layerAngle * 0.5 + spin;
    float a2 = -u_layerAngle * 0.5 - spin;

    // Rings have no orientation, so for that shape the two layers are offset
    // from each other instead of rotated — otherwise they would sit identical.
    vec2 cA = u_shape < 1.5 ? rot2(coord, a1) : coord - vec2(u_layerAngle, 0.0) * 4.0;
    vec2 cB = (u_shape < 1.5 ? rot2(coord, a2) : coord + vec2(u_layerAngle, 0.0) * 4.0)
              / max(u_layerScale, 1e-3);

    float A = layer(cA, u_lineWidth);
    float B = layer(cB, u_lineWidth);
    float nodes = A * B; // both layers lit at once = an interference node

    // The difference coordinate carries the beat frequency, so drawing a
    // lattice on it draws the moire pattern itself rather than its symptom.
    float beat = 0.0;
    if (u_shape < 0.5 && u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      beat = squareLattice((cA - cB) / u_sectionSize, u_sectionWidth);
    }

    // ---- line animation --------------------------------------------------
    float lineAnim = 1.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      lineAnim = 0.5 + 0.5 * sin(length(coord - focus) * u_animScale - t);
    } else if (u_lineMode < 2.5){
      lineAnim = 0.5 + 0.5 * sin(dot(coord, vec2(0.5, 0.5)) * u_animScale - t);
    } else if (u_lineMode < 3.5){
      float s = fract((coord.x + coord.y) * 0.05 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    // ---- node highlight --------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5){
      vec2 nid = floor(cA);
      if (u_cellMode < 1.5){
        cell = 0.5 + 0.5 * sin(dot(nid, vec2(0.7, 0.3)) * u_animScale - t);
      } else if (u_cellMode < 2.5){
        cell = 1.0; // steady: let the interference alone carry the motion
      } else if (u_cellMode < 3.5){
        cell = smoothstep(0.6, 1.0, sin(length(coord - focus) * u_animScale - t));
      } else if (u_cellMode < 4.5){
        cell = 0.5 + 0.5 * sin(t);
      }
      cell *= u_animIntensity;
    }

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    float Ai = A * lineAnim;
    float Bi = B * lineAnim;
    col += u_lineColor * Ai * 0.9;        a = max(a, Ai * 0.9);
    col += u_sectionColor * Bi * 0.9;     a = max(a, Bi * 0.9);

    float nodeI = nodes * cell;
    col += u_glowColor * nodeI * 2.0;     a = max(a, nodeI);
    col += u_cellColor * nodes * 0.6;

    float beatI = beat * lineAnim;
    col += u_glowColor * beatI * 0.7;     a = max(a, beatI * 0.7);

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

export const MoireGridMaterial = shaderMaterial(
    {
        u_time: moireGridMaterialDefaults.u_time,
        u_cellSize: moireGridMaterialDefaults.u_cellSize,
        u_lineWidth: moireGridMaterialDefaults.u_lineWidth,
        u_sectionSize: moireGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: moireGridMaterialDefaults.u_sectionWidth,
        u_lineColor: moireGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: moireGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: moireGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: moireGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: moireGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: moireGridMaterialDefaults.u_bgOpacity,
        u_lineMode: moireGridMaterialDefaults.u_lineMode,
        u_cellMode: moireGridMaterialDefaults.u_cellMode,
        u_animSpeed: moireGridMaterialDefaults.u_animSpeed,
        u_animScale: moireGridMaterialDefaults.u_animScale,
        u_animIntensity: moireGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: moireGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: moireGridMaterialDefaults.u_fadeStrength,
        u_focus: moireGridMaterialDefaults.u_focus.clone(),
        u_mouse: moireGridMaterialDefaults.u_mouse.clone(),
        u_displace: moireGridMaterialDefaults.u_displace,
        u_reveal: moireGridMaterialDefaults.u_reveal,
        u_shape: moireGridMaterialDefaults.u_shape,
        u_layerAngle: moireGridMaterialDefaults.u_layerAngle,
        u_layerScale: moireGridMaterialDefaults.u_layerScale,
        u_spin: moireGridMaterialDefaults.u_spin,
    },
    vertex,
    fragment,
);

extend({ MoireGridMaterial });
