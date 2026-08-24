import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface HexGridMaterialUniforms {
    u_time: number;
    /** flat-to-flat width of one hex, in world units */
    u_cellSize: number;
    /** edge thickness, in pixels */
    u_lineWidth: number;
    /** how many hexes make one super-hex */
    u_sectionSize: number;
    /** super-hex edge thickness, in pixels; 0 disables the layer */
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
    /** ripple origin in local grid coords */
    u_focus: THREE.Vector2;
    /** mouse in NDC (Vector2) — 3drise convention; the host maps it into u_focus */
    u_mouse: THREE.Vector2;
    /** vertex displacement along the plane normal (needs a segmented plane) */
    u_displace: number;
    /**
     * 0..1 assemble/dissolve. The build boundary sweeps outward from u_focus
     * with a bright leading edge; 1 is fully built, 0 is gone. Animate it
     * downward to dissolve.
     */
    u_reveal: number;
    /** 1 = each hex lifts to its own flat height, 0 = smooth wave */
    u_plateau: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        hexGridMaterial: ThreeElements['shaderMaterial'] & Partial<HexGridMaterialUniforms>;
    }
}

export const hexGridMaterialDefaults: HexGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 1.0,
    u_lineWidth: 1.2,
    u_sectionSize: 4.0,
    u_sectionWidth: 2.0,
    u_lineColor: new THREE.Color(0.16, 0.62, 0.78),
    u_sectionColor: new THREE.Color(0.45, 0.92, 1.0),
    u_cellColor: new THREE.Color(0.06, 0.28, 0.42),
    u_glowColor: new THREE.Color(0.3, 0.95, 1.0),
    u_bgColor: new THREE.Color(0.01, 0.03, 0.05),
    u_bgOpacity: 0.0,
    u_lineMode: 1,
    u_cellMode: 2,
    u_animSpeed: 1.0,
    u_animScale: 0.6,
    u_animIntensity: 1.0,
    u_fadeDistance: 25.0,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0.0,
    u_reveal: 1.0,
    u_plateau: 1.0,
};

/**
 * Shared by both stages.
 *
 * The lattice is the standard pointy-top honeycomb: hex centres sit on a
 * triangular lattice of spacing 1 in normalised coords, so `hexDist` returns
 * 0.5 exactly on an edge and 0 at the centre. Because `hexDist` is 1-Lipschitz
 * in those coords, the *continuous* input's pixel footprint is a valid
 * antialiasing width — which matters, since `fwidth` of the per-hex local
 * coordinate spikes along every hex boundary and would erase the very lines we
 * are trying to draw.
 */
const hexCommon = /*glsl*/ `
  const float TAU = 6.28318530718;
  const vec2  HEX_R = vec2(1.0, 1.73205081);

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // 0.5 exactly on a flat edge, 0 at the centre. The hexes are pointy-top:
  // vertical flats at x = +/-0.5, vertices at (0, +/-0.577).
  float hexDist(vec2 p){
    p = abs(p);
    float c = dot(p, normalize(HEX_R));
    return max(c, p.x);
  }

  /** xy = position inside the hex, zw = hex centre in the same coords */
  vec4 hexCoords(vec2 p){
    vec2 h = HEX_R * 0.5;
    vec2 a = mod(p, HEX_R) - h;
    vec2 b = mod(p - h, HEX_R) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    return vec4(gv, p - gv);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;
  uniform float u_plateau;

  varying vec2 vGridPos;

  ${hexCommon}

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;

    if (u_displace > 0.0){
      float t = u_time * u_animSpeed;
      vec2 coord = position.xy / max(u_cellSize, 1e-4);
      float smoothLift = 0.5 + 0.5 * sin(length(coord) * u_animScale - t);
      float lift = smoothLift;

      if (u_plateau > 0.5){
        vec4 hc = hexCoords(coord);
        vec2 id = hc.zw;
        float h = hash21(id);
        // The plate height comes from a smooth field sampled at the hex centre,
        // not from the hash alone: uncorrelated neighbours shred the mesh into
        // spikes. The hash only nudges each plate off the wave.
        float plate = clamp(smoothLift + (h - 0.5) * 0.5, 0.0, 1.0);
        // Flat across the middle of the hex, ramping back to the smooth field
        // at the rim. A hard step would have to be resolved by whatever
        // triangles happen to straddle the boundary, which reads as sawtooth;
        // the ramp turns those walls into clean bevels instead.
        float flatness = smoothstep(0.5, 0.26, hexDist(hc.xy));
        lift = mix(smoothLift, plate, flatness);
      }

      pos.z += lift * u_displace;
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

  varying vec2 vGridPos;

  ${hexCommon}

  /** hexagonal edge mask for a lattice scaled by the scale argument */
  float hexEdge(vec2 coord, float scale, float width, float px){
    vec2 c = coord / scale;
    float d = 0.5 - hexDist(hexCoords(c).xy);
    return 1.0 - smoothstep(0.0, max(px / scale, 1e-6) * max(width, 0.05), d);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;
    float px = max(length(fwidth(coord)), 1e-6);

    vec4 hc = hexCoords(coord);
    vec2 gv = hc.xy;
    vec2 id = hc.zw;
    float hd = hexDist(gv);

    float minor = hexEdge(coord, 1.0, u_lineWidth, px);
    float major = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      major = hexEdge(coord, u_sectionSize, u_sectionWidth, px);
    }

    // ---- edge animation -------------------------------------------------
    float lineAnim = 1.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      // ripple: hexagonal rings, so the wavefront keeps the lattice's shape
      float ring = hexDist(id - focus);
      lineAnim = 0.5 + 0.5 * sin(ring * u_animScale - t);
    } else if (u_lineMode < 2.5){
      // flow: a wave travelling along one lattice axis
      lineAnim = 0.5 + 0.5 * sin(dot(id, vec2(0.5, 0.866)) * u_animScale - t);
    } else if (u_lineMode < 3.5){
      // scan: a bright band sweeping across
      float s = fract((id.x + id.y * 0.5) * 0.05 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t);
    }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);

    // ---- cell fill ------------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5 && u_cellMode < 1.5){
      cell = 0.5 + 0.5 * sin(dot(id, vec2(0.7, 0.3)) * u_animScale - t);
    } else if (u_cellMode < 2.5){
      float h = hash21(id);
      cell = 0.5 + 0.5 * sin(t * (0.6 + h) + h * TAU);
    } else if (u_cellMode < 3.5){
      float ring = hexDist(id - focus);
      cell = smoothstep(0.6, 1.0, sin(ring * u_animScale - t));
    } else if (u_cellMode < 4.5){
      // the honeycomb's answer to a checkerboard: a proper 3-colouring. Column
      // index alone works here — every neighbour differs by 1 or 2 columns.
      float tri = mod(floor(id.x * 2.0 + 0.5), 3.0);
      cell = step(1.5, tri) * (0.5 + 0.5 * sin(t));
    }
    cell *= u_animIntensity;
    // keep the fill inside the hex, clear of its own edge
    cell *= smoothstep(0.5, 0.34, hd);

    // charged hexes glow brightest at the rim, which reads as depth
    float rim = smoothstep(0.24, 0.46, hd);

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += u_cellColor * cell;              a = max(a, cell * 0.9);
    float minorI = minor * lineAnim;
    col += u_lineColor * minorI;            a = max(a, minorI);
    float majorI = major * lineAnim;
    col += u_sectionColor * majorI;         a = max(a, majorI);
    col += u_glowColor * (minorI * 0.2 + cell * rim * 0.6) * u_animIntensity;

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

export const HexGridMaterial = shaderMaterial(
    {
        u_time: hexGridMaterialDefaults.u_time,
        u_cellSize: hexGridMaterialDefaults.u_cellSize,
        u_lineWidth: hexGridMaterialDefaults.u_lineWidth,
        u_sectionSize: hexGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: hexGridMaterialDefaults.u_sectionWidth,
        u_lineColor: hexGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: hexGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: hexGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: hexGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: hexGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: hexGridMaterialDefaults.u_bgOpacity,
        u_lineMode: hexGridMaterialDefaults.u_lineMode,
        u_cellMode: hexGridMaterialDefaults.u_cellMode,
        u_animSpeed: hexGridMaterialDefaults.u_animSpeed,
        u_animScale: hexGridMaterialDefaults.u_animScale,
        u_animIntensity: hexGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: hexGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: hexGridMaterialDefaults.u_fadeStrength,
        u_focus: hexGridMaterialDefaults.u_focus.clone(),
        u_mouse: hexGridMaterialDefaults.u_mouse.clone(),
        u_displace: hexGridMaterialDefaults.u_displace,
    u_reveal: hexGridMaterialDefaults.u_reveal,
        u_plateau: hexGridMaterialDefaults.u_plateau,
    },
    vertex,
    fragment,
);

extend({ HexGridMaterial });
