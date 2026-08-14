import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
export interface GlyphRingMaterialUniforms {
    uTime: {
        value: number;
    };
    uRotation: {
        value: number;
    };
    uGlyphCount: {
        value: number;
    };
    uMorphSpeed: {
        value: number;
    };
    uIntensity: {
        value: number;
    };
    uOpacity: {
        value: number;
    };
    uRingColor: {
        value: THREE.Color;
    };
    uGlyphsColor: {
        value: THREE.Color;
    };
    uShadesMultiplier: {
        value: number;
    };
    /** Color a glyph shifts toward when the cursor is hovering near it. */
    uHoverColor: {
        value: THREE.Color;
    };
    /** Radius of the hover-glow falloff, in NDC units (0..~1.4). */
    uHoverRadius: {
        value: number;
    };
    /** Strength of the hover effect. 0 = off; 1 = full color swap + glow; higher = brighter. */
    uHoverIntensity: {
        value: number;
    };
    /** Auto-populated each frame by animateUniforms (NDC pointer, -1..1). */
    u_mouse: {
        value: THREE.Vector2;
    };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            glyphRingMaterial: any;
        }
    }
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec4 vClipPos;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vClipPos = gl_Position;
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uRotation;
  uniform float uGlyphCount;
  uniform float uMorphSpeed;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform vec3  uRingColor;
  uniform vec3  uGlyphsColor;
  uniform float uShadesMultiplier;
  uniform vec3  uHoverColor;
  uniform float uHoverRadius;
  uniform float uHoverIntensity;
  uniform vec2  u_mouse;
  varying vec2  vUv;
  varying vec4  vClipPos;

  float glyph(vec2 p, float seed) {
    vec2 ap = abs(p);
    float bar    = step(ap.x, 0.18) * step(ap.y, 0.78);
    float ring   = step(abs(length(p) - 0.55), 0.07);
    float diag   = step(abs(p.x - p.y * sign(seed * 7.0 - 1.0)), 0.12);
    float cross  = step(ap.y, 0.10) * step(ap.x, 0.78);
    float spoke  = step(abs(p.y), 0.10) + step(abs(p.x), 0.10);
    spoke = clamp(spoke, 0.0, 1.0);
    float s1 = fract(sin(seed * 12.9898) * 43758.5453);
    float s2 = fract(sin(seed * 78.233)  * 12345.6789);
    float s3 = fract(sin(seed * 4.821)   * 91812.234);
    float s4 = fract(sin(seed * 22.1)    * 5532.111);
    float g = 0.0;
    g = max(g, bar   * step(0.5, s1));
    g = max(g, ring  * step(0.4, s2));
    g = max(g, diag  * step(0.5, s3));
    g = max(g, cross * step(0.6, s4));
    g = max(g, spoke * step(0.7, s1 * s4));
    return g;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float theta = atan(p.y, p.x);
    float a = theta / (2.0 * 3.141592653589793) + 0.5 + uRotation;
    a = fract(a);

    float bandWidth = 0.16;
    float ringR = 0.55;
    float ringMask = smoothstep(ringR - bandWidth, ringR - 0.02, r) * (1.0 - smoothstep(ringR + 0.02, ringR + bandWidth, r));
    if (ringMask < 0.01) discard;

    float cell = floor(a * uGlyphCount);
    float local = fract(a * uGlyphCount) * 2.0 - 1.0;
    float radial = (r - ringR) / bandWidth;

    // Discrete morph with crossfade. Each cell picks a new random seed every
    // tick; we then evaluate the glyph at both the current and next seed and
    // smoothly mix between them over the back half of the tick. Smooth
    // interpolation in *seed* space is chaotic (the hash isn't continuous),
    // but mixing the resulting glyph *masks* gives clean dissolves.
    // Per-cell phase prevents all cells from morphing in sync.
    float cellPhase = fract(sin(cell * 91.23) * 5471.31);
    float morphT = uTime * uMorphSpeed + cellPhase;
    float morphTick = floor(morphT);
    float morphMix = smoothstep(0.35, 0.85, fract(morphT));

    float seedA = cell + 1.0 + fract(sin(morphTick * 17.31 + cell * 1.79) * 4391.27) * 7.0;
    float seedB = cell + 1.0 + fract(sin((morphTick + 1.0) * 17.31 + cell * 1.79) * 4391.27) * 7.0;
    float gA = glyph(vec2(local, radial * 0.8), seedA);
    float gB = glyph(vec2(local, radial * 0.8), seedB);
    float g = mix(gA, gB, morphMix);

    float underline = smoothstep(ringR - 0.06, ringR - 0.02, r) * (1.0 - smoothstep(ringR + 0.02, ringR + 0.06, r));

    // Per-cell shade modulation. Each cell gets three independent signed
    // offsets per RGB channel (±0.5), scaled by uShadesMultiplier. At 0
    // there's no variation; at 1 each channel deviates up to ±50% from
    // glyphsColor; higher values push the tint further. Crucially, the
    // intensity multiplier is also attenuated proportional to
    // uShadesMultiplier so the per-cell hue actually survives additive
    // blending (otherwise everything clamps to white).
    float dR = (fract(sin(cell * 12.9898 + 1.3) * 43758.5453) - 0.5) * uShadesMultiplier;
    float dG = (fract(sin(cell * 78.233  + 5.1) * 12345.6789) - 0.5) * uShadesMultiplier;
    float dB = (fract(sin(cell * 39.346  + 9.7) * 91812.234)  - 0.5) * uShadesMultiplier;
    vec3 tint = clamp(vec3(1.0) + vec3(dR, dG, dB), 0.0, 1.5);
    vec3 glyphCol = uGlyphsColor * tint;

    // Hover: per-fragment NDC distance to the cursor with a smoothstep
    // falloff — 1.0 at the cursor, 0.0 at the radius edge. The color blend
    // and the brightness boost both use this gradient, so glyphs near the
    // cursor are fully uHoverColor + bright, glyphs at the radius edge are
    // fully original. NDC mouse is auto-fed by animateUniforms.
    vec2 fragNdc = vClipPos.xy / vClipPos.w;
    float mouseDist = length(fragNdc - u_mouse);
    float radius = max(uHoverRadius, 0.0001);
    float hoverActive = step(0.0001, uHoverIntensity);
    float hoverFalloff = (1.0 - smoothstep(0.0, radius, mouseDist)) * hoverActive;
    float hoverEffect = hoverFalloff * uHoverIntensity;
    vec3 hoveredGlyphCol = mix(glyphCol, uHoverColor, hoverFalloff);

    // Color composition: glyph strokes contribute hoveredGlyphCol; the soft
    // underline contributes uRingColor (unmodulated). Weight by their masks
    // and normalize.
    float wG = g;
    float wR = underline * 0.18;
    float wTotal = max(wG + wR, 0.0001);
    vec3 baseColor = (hoveredGlyphCol * wG + uRingColor * wR) / wTotal;

    // Damp the intensity blowout when shades are on so per-cell tints stay
    // visible instead of saturating to white. Strength scales with
    // uShadesMultiplier (0 = no damping → normal glow; 1 = ~70% damping).
    float shadeStrength = clamp(uShadesMultiplier, 0.0, 1.0);
    float intensityBoost = uIntensity * mix(1.0, 0.3, shadeStrength);

    // Hover boosts the glyph weight (not the underline) so the highlight
    // reads as "that glyph is lit up" rather than a halo over the ring.
    float intensity = g * (1.0 + hoverEffect * 2.0) + underline * 0.18;
    float alpha = ringMask * intensity * uOpacity;
    if (alpha < 0.005) discard;

    vec3 col = baseColor * (1.0 + intensity * intensityBoost);
    gl_FragColor = vec4(col, alpha);
  }
`;
const GlyphRingMaterial = shaderMaterial({
    uTime: 0,
    uRotation: 0,
    uGlyphCount: 12,
    uMorphSpeed: 0.4,
    uIntensity: 1.5,
    uOpacity: 1.0,
    uRingColor: new THREE.Color('#88ccff'),
    uGlyphsColor: new THREE.Color('#88ccff'),
    uShadesMultiplier: 0.0,
    uHoverColor: new THREE.Color('#ffffff'),
    uHoverRadius: 0.3,
    uHoverIntensity: 0.0,
    u_mouse: new THREE.Vector2(0, 0),
}, vertexShader, fragmentShader);
extend({ GlyphRingMaterial });
export { GlyphRingMaterial };
