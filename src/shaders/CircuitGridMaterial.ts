import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

export interface CircuitGridMaterialUniforms {
    u_time: number;
    /** size of one Truchet tile, in world units */
    u_cellSize: number;
    /** trace thickness, in pixels */
    u_lineWidth: number;
    /** unused by the tiling; kept so the section knobs line up with the other grids */
    u_sectionSize: number;
    /** pad/chip outline thickness, in pixels */
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
    /** 0..1 — fraction of tiles carrying a powered trace */
    u_powered: number;
    /** 0..1 — fraction of tiles replaced by an IC package */
    u_chipChance: number;
    /** solder-pad radius as a fraction of a tile; 0 disables pads */
    u_padSize: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        circuitGridMaterial: ThreeElements['shaderMaterial'] & Partial<CircuitGridMaterialUniforms>;
    }
}

export const circuitGridMaterialDefaults: CircuitGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 1.0,
    u_lineWidth: 1.6,
    u_sectionSize: 5.0,
    u_sectionWidth: 1.4,
    u_lineColor: new THREE.Color(0.09, 0.42, 0.36),
    u_sectionColor: new THREE.Color(0.55, 0.95, 0.7),
    u_cellColor: new THREE.Color(0.03, 0.14, 0.12),
    u_glowColor: new THREE.Color(0.35, 1.0, 0.72),
    u_bgColor: new THREE.Color(0.01, 0.04, 0.03),
    u_bgOpacity: 0.0,
    u_lineMode: 2,
    u_cellMode: 0,
    u_animSpeed: 1.0,
    u_animScale: 0.5,
    u_animIntensity: 1.0,
    u_fadeDistance: 25.0,
    u_fadeStrength: 0.7,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0.0,
    u_reveal: 1.0,
    u_powered: 0.65,
    u_chipChance: 0.06,
    u_padSize: 1.0,
};

const circuitCommon = /*glsl*/ `
  const float PI  = 3.14159265359;
  const float TAU = 6.28318530718;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
`;

const vertex = /*glsl*/ `
  uniform float u_time;
  uniform float u_cellSize;
  uniform float u_displace;
  uniform float u_animSpeed;
  uniform float u_animScale;

  varying vec2 vGridPos;

  ${circuitCommon}

  void main(){
    vGridPos = position.xy;
    vec3 pos = position;
    if (u_displace > 0.0){
      float t = u_time * u_animSpeed;
      vec2 coord = position.xy / max(u_cellSize, 1e-4);
      // board flex: a slow low-frequency swell rather than per-tile steps, so
      // traces stay continuous across tile borders
      float h = sin(coord.x * u_animScale * 0.5 - t) * cos(coord.y * u_animScale * 0.5 + t * 0.7);
      pos.z += h * u_displace;
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
  uniform float u_powered;
  uniform float u_chipChance;
  uniform float u_padSize;

  varying vec2 vGridPos;

  ${circuitCommon}

  /** signed distance to a rounded box of half-extent b and corner radius r */
  float sdRoundBox(vec2 p, vec2 b, float r){
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  /** straight axis-aligned lines on a lattice, same maths as the square grid */
  float gridLines(vec2 c, float width){
    vec2 d = fwidth(c);
    vec2 g = abs(fract(c - 0.5) - 0.5) / max(d * width, 1e-5);
    return 1.0 - clamp(min(g.x, g.y), 0.0, 1.0);
  }

  /** IC legs: short lines bridging the package edge to the tile edge */
  float chipPins(vec2 gv, float hw, float px){
    float dy = abs(fract(gv.y * 4.0) - 0.5) * 0.25;
    float dx = abs(fract(gv.x * 4.0) - 0.5) * 0.25;
    float horiz = (1.0 - smoothstep(hw, hw + px, dy)) * step(0.30, abs(gv.x));
    float vert  = (1.0 - smoothstep(hw, hw + px, dx)) * step(0.30, abs(gv.y));
    return max(horiz, vert);
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;
    float px = max(length(fwidth(coord)), 1e-6);

    vec2 id = floor(coord);
    vec2 gv = fract(coord) - 0.5;

    float seed = hash21(id);
    // Mirroring half the tiles is what turns isolated quarter-arcs into long
    // meandering paths: the two orientations chain across tile borders.
    if (seed < 0.5) gv.x = -gv.x;

    bool isChip = hash21(id + 7.77) < u_chipChance;
    bool powered = hash21(id + 11.31) < u_powered;

    float hw = px * max(u_lineWidth, 0.05) * 0.5;

    // ---- Truchet traces --------------------------------------------------
    vec2 c1 = vec2( 0.5,  0.5);
    vec2 c2 = vec2(-0.5, -0.5);
    float d1 = abs(length(gv - c1) - 0.5);
    float d2 = abs(length(gv - c2) - 0.5);
    float traceDist = min(d1, d2);
    float trace = isChip ? 0.0 : 1.0 - smoothstep(hw, hw + px, traceDist);

    // Position along whichever arc we are nearest, normalised over its quarter
    // turn. Arc 1 spans atan in [-PI, -PI/2]; arc 2 spans [0, PI/2].
    bool onA = d1 < d2;
    vec2 rel = onA ? (gv - c1) : (gv - c2);
    float ang = atan(rel.y, rel.x);
    float along = onA ? (ang + PI) / (PI * 0.5) : ang / (PI * 0.5);
    // per-arc offset so the whole board does not pulse in lockstep
    float arcSeed = hash21(id + (onA ? vec2(0.0) : vec2(3.71, 1.09)));

    // ---- trace animation -------------------------------------------------
    float lineAnim = 1.0;
    float head = 0.0;
    if (u_lineMode > 0.5 && u_lineMode < 1.5){
      float dist = length(coord - focus);
      lineAnim = 0.5 + 0.5 * sin(dist * u_animScale - t);
    } else if (u_lineMode < 2.5){
      // signal pulses running along the traces themselves
      lineAnim = 0.6;
      float phase = fract(arcSeed + along * 0.25 - t * 0.18 * max(u_animScale, 0.05));
      head = pow(phase, 16.0);
    } else if (u_lineMode < 3.5){
      // a data wavefront crossing the board diagonally
      float s = fract((coord.x + coord.y) * 0.05 * u_animScale - t * 0.15);
      lineAnim = 0.25 + smoothstep(0.0, 0.15, s) * (1.0 - smoothstep(0.15, 0.35, s));
    } else if (u_lineMode < 4.5){
      lineAnim = 0.5 + 0.5 * sin(t + seed * TAU);
    }
    if (!powered){ lineAnim *= 0.25; head = 0.0; }
    lineAnim = mix(1.0, lineAnim, u_animIntensity);
    head *= u_animIntensity;

    // ---- bus lines -------------------------------------------------------
    // Straight power/data buses every sectionSize tiles, cutting across the
    // Truchet weave the way a real board's supply rails do.
    float bus = 0.0;
    if (u_sectionWidth > 0.0 && u_sectionSize > 0.0){
      bus = gridLines(coord / u_sectionSize, u_sectionWidth);
    }

    // ---- solder pads / vias ---------------------------------------------
    // Every arc terminates on an edge midpoint, so that is where the pads go.
    // Neighbouring tiles draw the same pad twice at the same point, which is
    // exactly right — it is one via shared by both.
    // A via on every junction turns the board into a dot field that drowns out
    // the traces, so only a minority of tiles get one.
    float pad = 0.0;
    if (u_padSize > 0.0 && !isChip && hash21(id + 21.73) < 0.3){
      float dp = min(
        min(length(gv - vec2(0.5, 0.0)), length(gv + vec2(0.5, 0.0))),
        min(length(gv - vec2(0.0, 0.5)), length(gv + vec2(0.0, 0.5)))
      );
      float pr = 0.05 * u_padSize;
      pad = 1.0 - smoothstep(pr, pr + px * 1.5, dp);
      pad *= smoothstep(pr * 0.30, pr * 0.50, dp); // punch the drill hole
    }

    // ---- IC packages -----------------------------------------------------
    float chipBody = 0.0, chipEdge = 0.0, chipCore = 0.0, pins = 0.0;
    if (isChip){
      float b = sdRoundBox(gv, vec2(0.30), 0.06);
      chipBody = 1.0 - smoothstep(0.0, px * 2.0, b);
      chipEdge = 1.0 - smoothstep(hw, hw + px, abs(b));
      pins = chipPins(gv, hw, px);
      float beat = 0.5 + 0.5 * sin(t * (1.0 + hash21(id + 2.3) * 2.0));
      chipCore = (1.0 - smoothstep(0.0, px * 2.0, sdRoundBox(gv, vec2(0.10), 0.02))) * beat;
    }

    // ---- substrate fill --------------------------------------------------
    float cell = 0.0;
    if (u_cellMode > 0.5 && u_cellMode < 1.5){
      cell = 0.5 + 0.5 * sin(dot(id, vec2(0.7, 0.3)) * u_animScale - t);
    } else if (u_cellMode < 2.5){
      cell = 0.5 + 0.5 * sin(t * (0.6 + seed) + seed * TAU);
    } else if (u_cellMode < 3.5){
      float d = length(id + 0.5 - focus);
      cell = smoothstep(0.6, 1.0, sin(d * u_animScale - t));
    } else if (u_cellMode < 4.5){
      cell = mod(id.x + id.y, 2.0) * (0.5 + 0.5 * sin(t));
    }
    cell *= u_animIntensity;
    vec2 f = abs(gv);
    cell *= smoothstep(0.5, 0.4, max(f.x, f.y));

    float r = length(vGridPos) / max(u_fadeDistance, 1e-4);
    float fade = 1.0 - smoothstep(1.0 - u_fadeStrength, 1.0, r);

    vec3 col = u_bgColor * u_bgOpacity;
    float a  = u_bgOpacity;

    col += u_cellColor * (cell + chipBody * 0.8);
    a = max(a, max(cell * 0.9, chipBody * 0.85));

    float traceI = trace * lineAnim;
    float busI   = bus * lineAnim;
    col += u_lineColor * traceI;                       a = max(a, traceI);
    col += u_glowColor * trace * head * 2.2;           a = max(a, trace * head);
    col += u_sectionColor * busI * 0.8;                a = max(a, busI * 0.8);
    float padI = pad * 0.7;
    col += u_sectionColor * (padI + chipEdge + pins);  a = max(a, max(padI, max(chipEdge, pins)));
    col += u_glowColor * chipCore * 1.5;               a = max(a, chipCore);
    col += u_glowColor * traceI * 0.15 * u_animIntensity;

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

export const CircuitGridMaterial = shaderMaterial(
    {
        u_time: circuitGridMaterialDefaults.u_time,
        u_cellSize: circuitGridMaterialDefaults.u_cellSize,
        u_lineWidth: circuitGridMaterialDefaults.u_lineWidth,
        u_sectionSize: circuitGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: circuitGridMaterialDefaults.u_sectionWidth,
        u_lineColor: circuitGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: circuitGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: circuitGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: circuitGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: circuitGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: circuitGridMaterialDefaults.u_bgOpacity,
        u_lineMode: circuitGridMaterialDefaults.u_lineMode,
        u_cellMode: circuitGridMaterialDefaults.u_cellMode,
        u_animSpeed: circuitGridMaterialDefaults.u_animSpeed,
        u_animScale: circuitGridMaterialDefaults.u_animScale,
        u_animIntensity: circuitGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: circuitGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: circuitGridMaterialDefaults.u_fadeStrength,
        u_focus: circuitGridMaterialDefaults.u_focus.clone(),
        u_mouse: circuitGridMaterialDefaults.u_mouse.clone(),
        u_displace: circuitGridMaterialDefaults.u_displace,
    u_reveal: circuitGridMaterialDefaults.u_reveal,
        u_powered: circuitGridMaterialDefaults.u_powered,
        u_chipChance: circuitGridMaterialDefaults.u_chipChance,
        u_padSize: circuitGridMaterialDefaults.u_padSize,
    },
    vertex,
    fragment,
);

extend({ CircuitGridMaterial });
