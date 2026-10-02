import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

// =============================================================================
// PhyllotaxisGridMaterial — Phyllotaxis Grid
// =============================================================================
//
// Vogel's sunflower: florets at the golden angle, each a lit dome coloured by age and carrying a mark aligned to the head's radius. Bloom rings travel from the rim to the centre and open the marks; the head itself never turns.
//
// The GLSL is the exact source the Grid Lab preview compiles (Claude outputs/
// grid-lab). The fragment shader is the shared grid tail (line / cell modes,
// composite, fade, reveal) around this grid's own tiling block, which adds an
// extraCol / extraA emissive layer before the fade.
//

export interface PhyllotaxisGridMaterialUniforms {
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
    /** Speed of the bloom rings travelling rim to centre; negative reverses them */
    u_bloomRate: number;
    /** Depth of the lit dome on each floret */
    u_relief: number;
    /** The mark each floret carries (0 draws only the domes) */
    u_shape: number;
    /** Size of the mark relative to its floret */
    u_shapeSize: number;
    /** Brightness of the marks */
    u_shapeGlow: number;
    /** accumulated on the CPU from bloomRate (never multiplied by time in the shader) */
    u_bloomPhase: number;
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        phyllotaxisGridMaterial: ThreeElements['shaderMaterial'] & Partial<PhyllotaxisGridMaterialUniforms>;
    }
}

export const phyllotaxisGridMaterialDefaults: PhyllotaxisGridMaterialUniforms = {
    u_time: 0,
    u_cellSize: 1.6,
    u_lineWidth: 0.6,
    u_sectionSize: 2,
    u_sectionWidth: 1.4,
    u_lineColor: new THREE.Color('#a8661c'),
    u_sectionColor: new THREE.Color('#ffcf70'),
    u_cellColor: new THREE.Color('#3a1a08'),
    u_glowColor: new THREE.Color('#e4ee8a'),
    u_bgColor: new THREE.Color('#070402'),
    u_bgOpacity: 0,
    u_lineMode: 0,
    u_cellMode: 0,
    u_animSpeed: 1,
    u_animScale: 0.5,
    u_animIntensity: 0.6,
    u_fadeDistance: 25,
    u_fadeStrength: 0.6,
    u_focus: new THREE.Vector2(0, 0),
    u_mouse: new THREE.Vector2(0, 0),
    u_displace: 0,
    u_reveal: 1,
    u_divergence: 137.508,
    u_bloomRate: 0.04,
    u_relief: 0.8,
    u_shape: 1,
    u_shapeSize: 0.85,
    u_shapeGlow: 0.9,
    u_bloomPhase: 0,
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
  uniform float u_bloomPhase;
  uniform float u_relief;
  uniform float u_shape;
  uniform float u_shapeSize;
  uniform float u_shapeGlow;

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

  // The floret's own mark, in a frame aligned to the head's radius (x points
  // away from the centre), so every mark across the head is oriented the way
  // its spiral grows. q is in units of a little under half a cell; op (0..1) is
  // how far the bloom wave has opened this floret. Returns a signed distance
  // (negative inside) for filled shapes; strokes return |d| - halfWidth.
  mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
  float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
  float sdSegment(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a, ba = b - a;
    return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
  }
  // The exact 2D distances below are Inigo Quilez's.
  float sdStar5(vec2 p, float r, float rf){
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x, k1.y);
    p.x = abs(p.x);
    p -= 2.0 * max(dot(k1, p), 0.0) * k1;
    p -= 2.0 * max(dot(k2, p), 0.0) * k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
    float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
    return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
  }
  float sdHexagon(vec2 p, float r){
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
  }
  float sdEqTri(vec2 p, float r){
    const float k = 1.7320508;
    p.x = abs(p.x) - r;
    p.y = p.y + r / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
    p.x -= clamp(p.x, -2.0 * r, 0.0);
    return -length(p) * sign(p.y);
  }
  float dot2(vec2 v){ return dot(v, v); }
  float sdHeart(vec2 p){
    p.x = abs(p.x);
    if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - 0.35355339;
    return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
  }
  float sdVesica(vec2 p, float r, float d){
    p = abs(p);
    float b = sqrt(r * r - d * d);
    return ((p.y - b) * d > p.x * b) ? length(p - vec2(0.0, b)) : length(p - vec2(-d, 0.0)) - r;
  }
  float floretShape(float shape, vec2 q, float op, float hh, out float stroke){
    stroke = 0.0;
    float r = length(q);
    float an = atan(q.y, q.x);
    if (shape < 1.5){
      // 1 Seed: the achene of a real sunflower, an almond (vesica) lying along
      // the radius, fattening as the floret matures
      return sdVesica(q.yx, 1.0, mix(0.82, 0.55, op));
    } else if (shape < 2.5){
      // 2 Ring: a bokeh annulus that widens as it opens
      stroke = 1.0;
      return abs(r - mix(0.45, 0.78, op)) - 0.07;
    } else if (shape < 3.5){
      // 3 Crescent: a moon whose phase is the bloom — a sliver on the rising
      // edge of the wave, a full disc behind it. Lit limb faces the rim.
      float dd = r - 0.8;
      float cut = length(q + vec2(mix(0.28, 1.65, op), 0.0)) - 0.8;
      return max(dd, -cut);
    } else if (shape < 4.5){
      // 4 Sparkle: an astroid, |x|^(2/3) + |y|^(2/3) = R^(2/3) — the four-point
      // glint of a caustic, long rays along the radius
      vec2 a = abs(q) / vec2(1.0, 0.62);
      float R = mix(0.55, 1.0, op);
      return (pow(a.x, 0.6667) + pow(a.y, 0.6667) - pow(R, 0.6667)) * 0.9;
    } else if (shape < 5.5){
      // 5 Reuleaux: the constant-width triangle — the intersection of three
      // discs centred on an equilateral triangle's corners. It turns a third of
      // a revolution inside its cell as the floret opens.
      float rot = op * TAU / 3.0;
      float d = -1e9;
      for (int k = 0; k < 3; k++){
        float ak = rot + float(k) * TAU / 3.0;
        vec2 vk = 0.52 * vec2(cos(ak), sin(ak));
        d = max(d, length(q + vk) - 0.9);
      }
      return d;
    } else if (shape < 6.5){
      // 6 Spiral: a logarithmic spiral r = a e^(b theta), the fiddlehead of a
      // fern — tightly curled in bud, unrolling as it opens
      stroke = 1.0;
      float b = mix(0.11, 0.24, op);
      float t = (an - log(max(r, 1e-3) / 0.05) / b) / TAU;
      float gap = abs(fract(t) - 0.5) * TAU * b * r;   // distance to the nearest turn
      float d = gap - 0.05;
      return max(d, r - 0.92);
    } else if (shape < 7.5){
      // 7 Target: concentric rings that ripple outward through each floret
      stroke = 1.0;
      float w = abs(fract(r * 2.6 - op * 1.5) - 0.5) / 2.6;
      return max(w - 0.035, r - 0.95);
    } else if (shape < 8.5){
      // 8 Pebble: a superellipse |x|^n + |y|^n = 1 that swells from a diamond
      // (n = 1) through a circle (n = 2) to a soft square as it opens
      float n = mix(1.0, 3.5, op);
      vec2 a = abs(q) / 0.78;
      return (pow(pow(a.x, n) + pow(a.y, n), 1.0 / n) - 1.0) * 0.78;
    } else if (shape < 9.5){
      // 9 Dot: a plain disc that swells as it opens
      return r - mix(0.32, 0.62, op);
    } else if (shape < 10.5){
      // 10 Dots: a sunflower inside every floret — 13 dots at the golden angle
      // (Vogel again, one level down). The dots appear one by one, centre
      // first, as the floret opens, so the head is self-similar.
      float d = 1e9;
      float shown = 1.0 + op * 12.0;
      for (int k = 0; k < 13; k++){
        float sk = float(k) + 0.5;
        if (float(k) >= shown) break;
        float ak = sk * 2.39996323;
        vec2  pk = 0.235 * sqrt(sk) * vec2(cos(ak), sin(ak));
        d = min(d, length(q - pk) - 0.105);
      }
      return d;
    } else if (shape < 11.5){
      // 11 Square: a rounded square that turns from square to diamond (45 deg)
      // as it opens
      vec2 p = rot2(op * PI * 0.25) * q;
      return sdBox(p, vec2(0.56)) - 0.07;
    } else if (shape < 12.5){
      // 12 Star: a five-pointed star with one point down the radius; soft and
      // round in bud, sharp when open
      return sdStar5(q.yx, 0.88, mix(0.85, 0.4, op));
    } else if (shape < 13.5){
      // 13 Hexagon: a hex tile with a hex window that opens in it — a
      // honeycomb cell in every floret
      float outer = sdHexagon(q, 0.66);
      float inner = sdHexagon(q, mix(0.0, 0.46, op));
      return max(outer, -inner);
    } else if (shape < 14.5){
      // 14 Triangle: an equilateral triangle pointing out along the radius
      return sdEqTri(q.yx, mix(0.48, 0.66, op)) - 0.06;
    } else if (shape < 15.5){
      // 15 Cross: a plus that turns into an X as it opens
      vec2 p = rot2(op * PI * 0.25) * q;
      return min(sdBox(p, vec2(0.74, 0.17)), sdBox(p, vec2(0.17, 0.74))) - 0.04;
    } else if (shape < 16.5){
      // 16 Heart: Inigo Quilez's exact heart, lobes out, tip to the centre
      float s = mix(1.35, 1.7, op);
      vec2 p = vec2(q.y, q.x + 0.8 * s / 1.7) / s;
      return sdHeart(p) * s;
    } else if (shape < 17.5){
      // 17 Chevron: an arrowhead pointing out along the radius — a field of
      // them reads as the head's own outward growth. It flattens into a bar
      // as it opens.
      stroke = 1.0;
      float w = mix(0.62, 0.15, op);
      vec2 tip = vec2(0.42, 0.0);
      float d = min(sdSegment(q, tip, vec2(-0.3, w)), sdSegment(q, tip, vec2(-0.3, -w)));
      return d - 0.1;
    } else if (shape < 18.5){
      // 18 Infinity: the lemniscate of Bernoulli (x^2 + y^2)^2 = a^2 (x^2 - y^2),
      // drawn by its implicit distance F / |grad F|
      stroke = 1.0;
      float a = mix(0.62, 0.86, op);
      vec2  p = q;
      float rr = dot(p, p);
      float F = rr * rr - a * a * (p.x * p.x - p.y * p.y);
      vec2  G = 4.0 * rr * p - 2.0 * a * a * vec2(p.x, -p.y);
      return abs(F) / max(length(G), 1e-3) - 0.055;
    } else if (shape < 19.5){
      // 19 Gear: a cog with eight teeth around an axle hole; it turns half a
      // tooth as it opens
      float n  = 8.0;
      float tooth = smoothstep(-0.25, 0.25, cos(n * an + op * PI));
      float R  = 0.56 + 0.16 * tooth;
      float d  = (r - R) * 0.8;
      return max(d, -(r - 0.2));
    } else if (shape < 20.5){
      // 20 Atom: a nucleus and three elliptical orbits 60 deg apart, each with
      // its electron; the electrons move round as the floret opens
      float d = r - 0.15;
      for (int k = 0; k < 3; k++){
        float ak = float(k) * PI / 3.0;
        vec2  p  = rot2(ak) * q;
        vec2  ab = vec2(0.84, 0.3);
        vec2  pn = p / ab;
        float f  = length(pn) - 1.0;
        vec2  g  = pn / (ab * max(length(pn), 1e-4));
        d = min(d, abs(f) / max(length(g), 1e-4) - 0.035);
        float ae = op * TAU + float(k) * 2.1 + hh * TAU;
        vec2  e  = rot2(-ak) * (ab * vec2(cos(ae), sin(ae)));
        d = min(d, length(q - e) - 0.085);
      }
      return d;
    } else {
      // 21 Sunburst: a small sun, twelve rays that lengthen as it opens
      float n  = 12.0;
      float aw = (fract(an * n / TAU + 0.5) - 0.5) * TAU / n;
      float ray = abs(r * sin(aw)) - 0.045 * (1.0 - r * 0.6);
      ray = max(ray, max(0.3 - r, r - mix(0.55, 0.95, op)));
      return min(ray, r - 0.2);
    }
  }

  void main(){
    vec2 coord = vGridPos / max(u_cellSize, 1e-4);
    vec2 focus = u_focus / max(u_cellSize, 1e-4);
    float t  = u_time * u_animSpeed;

    // Vogel's model of a sunflower head: seed n sits at radius c*sqrt(n) and angle
    // n * divergence. At the golden angle (137.508 deg) no two seeds ever line up,
    // so each takes an almost equal share of the disk and the florets pack with
    // no gaps and no rings. The head itself never moves — any turning or drifting
    // of the whole is the parent object's transform. What moves is the bloom.
    const float C = 0.5641896;               // 1/sqrt(pi): one cell of area per seed
    float g   = u_divergence / 360.0;         // turns per seed
    vec2  fc  = fwidth(coord);
    float fp  = max(max(fc.x, fc.y), 1e-6);

    float rp  = length(coord);
    float thp = atan(coord.y, coord.x) / TAU;
    float sT  = (rp / C) * (rp / C);
    float Rmax = u_fadeDistance / max(u_cellSize, 1e-4);
    float sMax = pow(Rmax * 1.05 / C, 2.0);
    // slots whose radius lies within ~1.2 cells of this pixel's radius
    float W  = 2.0 * sqrt(sT) * 1.25 / C + 3.0;
    float m0 = max(0.0, floor(sT - W));
    float m1 = min(floor(sT + W), sMax);

    // pass 1: the nearest seed, plus a short list of close ones for the cell edges
    vec2  cand[16];
    int   nc = 0;
    float d1 = 1e9;
    vec2  p1 = vec2(0.0);
    float id1 = 0.0;
    for (int i = 0; i < 256; i++){
      float m = m0 + float(i);
      if (m > m1) break;
      float rs = C * sqrt(m);
      if (abs(rs - rp) > 1.25) continue;
      float dth = fract(m * g - thp + 0.5) - 0.5;          // angular gap, turns
      if (abs(dth) * TAU * max(rp, rs) > 1.7) continue;   // cheap reject before trig
      float a = m * g * TAU;
      vec2  p = rs * vec2(cos(a), sin(a));
      float dd = length(coord - p);
      if (dd < d1){ d1 = dd; p1 = p; id1 = m; }
      if (nc < 16){ cand[nc] = p; nc++; }
    }
    // pass 2: distance to the Voronoi edge = nearest bisector against p1
    float e = 1e9;
    for (int i = 0; i < 16; i++){
      if (i >= nc) break;
      vec2  dq = cand[i] - p1;
      float L2 = dot(dq, dq);
      if (L2 < 1e-6) continue;
      e = min(e, dot(0.5 * (p1 + cand[i]) - coord, dq) * inversesqrt(L2));
    }
    float have = step(d1, 2.0);
    e = max(e, 0.0);
    float hh = hash21(vec2(id1 * 0.0137, 3.7));

    // Voronoi edges stay hairline: the grooves below do the separating.
    float lines = (1.0 - clamp(e / (fp * max(u_lineWidth, 0.05)), 0.0, 1.0)) * have;

    // ---- age and bloom ------------------------------------------------------
    // Florets open in rings that travel from the rim toward the centre
    // (centripetal, as in a real capitulum). sectionSize rings cross the head
    // at once; each floret opens with its own small delay, so a ring's edge is
    // ragged like a living one rather than a ruled circle.
    float age = clamp(length(p1) / max(Rmax, 1e-3), 0.0, 1.0);
    vec3  ageCol = mix(u_glowColor, u_lineColor, smoothstep(0.0, 0.45, age));
    ageCol = mix(ageCol, u_cellColor, smoothstep(0.45, 1.0, age));
    float rings = max(floor(u_sectionSize + 0.5), 1.0);
    float wave  = sin(TAU * (age * rings + u_bloomPhase) + hh * 1.2);
    float open  = smoothstep(-0.25, 0.65, wave);

    // the opening front gets its outline lit: that is the accent
    float front = open * (1.0 - open) * 4.0;
    float accent = (1.0 - clamp(e / (fp * max(u_sectionWidth, 0.05)), 0.0, 1.0)) * front * have;
    if (u_sectionWidth <= 0.0) accent = 0.0;

    // ---- relief ---------------------------------------------------------------
    // Each floret is a soft dome over its own Voronoi cell. tr runs 0 at the seed
    // to 1 at the cell wall whatever the cell's shape, so the dome follows the
    // cell, lit by a low key light from the upper left.
    float tr  = clamp(d1 / max(d1 + e, 1e-4), 0.0, 1.0);
    vec2  dir = (coord - p1) / max(d1, 1e-4);
    float hz  = sqrt(max(1.0 - tr * tr, 0.0));
    vec3  nrm = normalize(vec3(dir * tr * 1.2, hz));
    float lit = max(dot(nrm, normalize(vec3(-0.55, 0.45, 0.70))), 0.0);
    float shade = mix(0.75, 0.25 + 1.05 * lit, u_relief);
    float groove = smoothstep(0.0, 0.14, e);
    float body = shade * groove * have * (0.55 + 0.45 * open);

    // ---- the floret's mark ---------------------------------------------------
    // shape 0 draws only the lit domes; 1..8 add a mark in each floret,
    // oriented along the head's radius and opened by the bloom wave.
    float shape = floor(u_shape + 0.5);
    vec2  rad = length(p1) > 1e-3 ? normalize(p1) : vec2(1.0, 0.0);
    vec2  lp  = coord - p1;
    float sc  = 0.42 * max(u_shapeSize, 0.05);
    vec2  q   = vec2(dot(lp, rad), dot(lp, vec2(-rad.y, rad.x))) / sc;
    float fq  = fp / sc;
    float stroke = 0.0;
    float sd  = shape > 0.5 ? floretShape(shape, q, open, hh, stroke) : 1e3;
    // filled shapes: solid body with a bright rim; strokes: just the line
    float fill = (1.0 - smoothstep(-fq, fq, sd)) * (1.0 - stroke);
    float rim  = 1.0 - smoothstep(0.0, fq * 1.6, abs(sd));
    if (stroke > 0.5) rim = 1.0 - smoothstep(-fq, fq, sd);
    float mark = (fill * 0.55 * (0.4 + 0.8 * lit) + rim * 0.9) * (0.35 + 0.65 * open) * u_shapeGlow * have;
    // the mark sits inside its floret: never across the groove
    mark *= smoothstep(0.02, 0.08, e);

    float dmin = e * have;
    float idAcc = id1;
    vec2  cellPos = p1;
    float cellH = hh;
    float tone = step(0.55, cellH);

    vec3  markCol = mix(u_sectionColor, u_glowColor, 1.0 - age);
    vec3  extraCol = ageCol * body * 0.6 + markCol * mark;
    float extraA = max(body * 0.55, mark * 0.9);

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

export const PhyllotaxisGridMaterial = shaderMaterial(
    {
        u_time: phyllotaxisGridMaterialDefaults.u_time,
        u_cellSize: phyllotaxisGridMaterialDefaults.u_cellSize,
        u_lineWidth: phyllotaxisGridMaterialDefaults.u_lineWidth,
        u_sectionSize: phyllotaxisGridMaterialDefaults.u_sectionSize,
        u_sectionWidth: phyllotaxisGridMaterialDefaults.u_sectionWidth,
        u_lineColor: phyllotaxisGridMaterialDefaults.u_lineColor.clone(),
        u_sectionColor: phyllotaxisGridMaterialDefaults.u_sectionColor.clone(),
        u_cellColor: phyllotaxisGridMaterialDefaults.u_cellColor.clone(),
        u_glowColor: phyllotaxisGridMaterialDefaults.u_glowColor.clone(),
        u_bgColor: phyllotaxisGridMaterialDefaults.u_bgColor.clone(),
        u_bgOpacity: phyllotaxisGridMaterialDefaults.u_bgOpacity,
        u_lineMode: phyllotaxisGridMaterialDefaults.u_lineMode,
        u_cellMode: phyllotaxisGridMaterialDefaults.u_cellMode,
        u_animSpeed: phyllotaxisGridMaterialDefaults.u_animSpeed,
        u_animScale: phyllotaxisGridMaterialDefaults.u_animScale,
        u_animIntensity: phyllotaxisGridMaterialDefaults.u_animIntensity,
        u_fadeDistance: phyllotaxisGridMaterialDefaults.u_fadeDistance,
        u_fadeStrength: phyllotaxisGridMaterialDefaults.u_fadeStrength,
        u_focus: phyllotaxisGridMaterialDefaults.u_focus.clone(),
        u_mouse: phyllotaxisGridMaterialDefaults.u_mouse.clone(),
        u_displace: phyllotaxisGridMaterialDefaults.u_displace,
        u_reveal: phyllotaxisGridMaterialDefaults.u_reveal,
        u_divergence: phyllotaxisGridMaterialDefaults.u_divergence,
        u_bloomRate: phyllotaxisGridMaterialDefaults.u_bloomRate,
        u_relief: phyllotaxisGridMaterialDefaults.u_relief,
        u_shape: phyllotaxisGridMaterialDefaults.u_shape,
        u_shapeSize: phyllotaxisGridMaterialDefaults.u_shapeSize,
        u_shapeGlow: phyllotaxisGridMaterialDefaults.u_shapeGlow,
        u_bloomPhase: phyllotaxisGridMaterialDefaults.u_bloomPhase,
    },
    vertex,
    fragment,
);

extend({ PhyllotaxisGridMaterial });
