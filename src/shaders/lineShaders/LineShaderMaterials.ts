import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface TeslaArcMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_arcColor: {
        value: Vector3;
    };
    u_glowColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_intensity: {
        value: number;
    };
    u_forkDensity: {
        value: number;
    };
}

export interface SerpentFlowMaterialUniforms {
    u_time: {
        value: number;
    };
    u_colorA: {
        value: Vector3;
    };
    u_colorB: {
        value: Vector3;
    };
    u_colorC: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_width: {
        value: number;
    };
    u_shimmer: {
        value: number;
    };
}

export interface GhostSignalMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_signalColor: {
        value: Vector3;
    };
    u_trailColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_packetCount: {
        value: number;
    };
    u_trailLength: {
        value: number;
    };
    u_glitchIntensity: {
        value: number;
    };
}

export interface SolarFilamentMaterialUniforms {
    u_time: {
        value: number;
    };
    u_coreColor: {
        value: Vector3;
    };
    u_midColor: {
        value: Vector3;
    };
    u_coolColor: {
        value: Vector3;
    };
    u_flareColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_turbulence: {
        value: number;
    };
}

export interface VoidRiftMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_riftColor: {
        value: Vector3;
    };
    u_radiationColor: {
        value: Vector3;
    };
    u_lensColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_riftWidth: {
        value: number;
    };
    u_radiationDensity: {
        value: number;
    };
}

const teslaArcVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vPosition = position;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const teslaArcFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_arcColor;
  uniform vec3 u_glowColor;
  uniform float u_speed;
  uniform float u_intensity;
  uniform float u_forkDensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPos;

  // Hash for randomness
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // 1D value noise
  float vnoise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
  }

  // Fractal noise — the core of the lightning texture
  float fbm(float x, int octaves) {
    float v = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      v += amp * vnoise(x * freq);
      amp *= 0.5;
      freq *= 2.17;
    }
    return v;
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x; // 0→1 along the segment
    float across = vUv.y - 0.5; // -0.5→0.5 perpendicular

    // Primary arc displacement — wiggles the bolt left/right
    float phase = along * 8.0 - t * 3.0;
    float arc = fbm(phase, 6) - 0.5;
    arc += fbm(phase * 2.3 + 17.4, 4) * 0.3;

    // Fast flicker — mimics real discharge instability
    float flicker = hash(floor(t * 12.0) + floor(along * u_forkDensity));
    arc *= 0.9 + flicker * 0.2;

    // Distance from the displaced centerline
    float dist = abs(across - arc * 0.3);

    // Core bolt: very thin, very bright
    float core = exp(-dist * 80.0) * u_intensity;

    // Inner glow: slightly wider
    float innerGlow = exp(-dist * 25.0) * u_intensity * 0.6;

    // Outer plasma halo
    float halo = exp(-dist * 8.0) * u_intensity * 0.25;

    // Micro-forks — secondary branches that shoot off at intervals
    float forkT = floor(along * u_forkDensity * 2.0);
    float forkPhase = hash2(vec2(forkT, floor(t * 8.0)));
    float forkAlong = fract(along * u_forkDensity * 2.0);
    float forkDisplace = (forkPhase - 0.5) * 0.4;
    float forkDist = abs(across - forkDisplace * forkAlong);
    float fork = exp(-forkDist * 60.0) * (1.0 - forkAlong) * step(0.3, forkPhase) * u_intensity * 0.7;

    // Combine: core white-hot center, color glow, halo
    vec3 col = vec3(0.0);
    col += u_arcColor * (innerGlow + fork);
    col += u_glowColor * halo;
    col += vec3(1.0) * core; // White-hot core overrides color

    // Pulse the whole thing with a rapid flicker
    float pulse = 0.7 + 0.3 * sin(t * 30.0 + along * 20.0);
    col *= pulse;

    // Alpha: glow radius for additive blending
    float alpha = clamp(innerGlow + halo + core * 0.5 + fork * 0.3, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
export const TeslaArcMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_arcColor: new Vector3(0.4, 0.8, 1.0), // Electric cyan
    u_glowColor: new Vector3(0.1, 0.3, 0.9), // Deep blue plasma
    u_speed: 1.0,
    u_intensity: 1.5,
    u_forkDensity: 6.0,
}, teslaArcVertex, teslaArcFragment);
extend({ TeslaArcMaterial });
const serpentFlowVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const serpentFlowFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;
  uniform float u_speed;
  uniform float u_width;
  uniform float u_shimmer;
  varying vec2 vUv;
  varying vec3 vPosition;

  // Smooth periodic noise
  float sn(float x) {
    return sin(x) * 0.5 + 0.5;
  }

  // 2D smooth noise
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5);
    float b = fract(sin(dot(i + vec2(1,0), vec2(127.1, 311.7))) * 43758.5);
    float c = fract(sin(dot(i + vec2(0,1), vec2(127.1, 311.7))) * 43758.5);
    float d = fract(sin(dot(i + vec2(1,1), vec2(127.1, 311.7))) * 43758.5);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x;
    float across = vUv.y - 0.5;

    // Undulating centerline — the "serpent" body
    float wave1 = sin(along * 6.28 * 2.0 - t * 2.5) * 0.15;
    float wave2 = sin(along * 6.28 * 3.7 + t * 1.3) * 0.08;
    float wave3 = sin(along * 6.28 * 0.8 - t * 0.7) * 0.12;
    float center = wave1 + wave2 + wave3;

    float dist = abs(across - center);

    // Beam falloff — soft ribbon
    float beam = smoothstep(u_width, 0.0, dist);
    float innerBeam = smoothstep(u_width * 0.4, 0.0, dist);

    // Iridescent color shift along the segment + time
    float hueShift = along * 3.0 - t * 1.5;
    float colorMix1 = sn(hueShift);
    float colorMix2 = sn(hueShift + 2.094); // 120 degrees out of phase
    float colorMix3 = sn(hueShift + 4.189); // 240 degrees out of phase

    // Normalize to sum to 1
    float total = colorMix1 + colorMix2 + colorMix3;
    vec3 iridescent = (u_colorA * colorMix1 + u_colorB * colorMix2 + u_colorC * colorMix3) / total;

    // Shimmer — fast noise riding on the beam
    float shimNoise = smoothNoise(vec2(along * 12.0 - t * 4.0, across * 8.0));
    float shimmer = (shimNoise * 0.5 + 0.5) * u_shimmer;

    // Bright caustic highlights
    float caustic = pow(max(0.0, 1.0 - dist / (u_width * 0.2)), 3.0);
    caustic *= sn(along * 20.0 - t * 6.0) * sn(along * 13.3 + t * 2.1);

    vec3 col = iridescent * beam;
    col += iridescent * shimmer * innerBeam;
    col += vec3(1.0) * caustic * 0.8;

    float alpha = beam + caustic * 0.5;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;
export const SerpentFlowMaterial = shaderMaterial({
    u_time: 0,
    u_colorA: new Vector3(1.0, 0.2, 0.8), // Magenta
    u_colorB: new Vector3(0.1, 0.9, 1.0), // Cyan
    u_colorC: new Vector3(0.8, 1.0, 0.2), // Chartreuse
    u_speed: 0.6,
    u_width: 0.35,
    u_shimmer: 0.7,
}, serpentFlowVertex, serpentFlowFragment);
extend({ SerpentFlowMaterial });
const ghostSignalVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ghostSignalFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_signalColor;
  uniform vec3 u_trailColor;
  uniform float u_speed;
  uniform float u_packetCount;
  uniform float u_trailLength;
  uniform float u_glitchIntensity;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    float along = vUv.x;
    float across = vUv.y - 0.5;

    float totalLight = 0.0;
    vec3 col = vec3(0.0);

    // Multiple packets racing along the line
    for (float i = 0.0; i < 8.0; i++) {
      if (i >= u_packetCount) break;

      // Each packet has a unique phase offset and speed variation
      float offset = hash(i * 7.3 + 0.5);
      float speedVar = 0.8 + hash(i * 13.7) * 0.4;
      float pos = fract(offset + u_time * u_speed * speedVar);

      // Distance of this fragment from the packet head
      float d = along - pos;

      // Trail: exponential decay behind the packet
      float trail = 0.0;
      if (d < 0.0 && d > -u_trailLength) {
        trail = exp(d / (u_trailLength * 0.3));
      }

      // Head: sharp bright front
      float head = exp(-abs(d) * 120.0) * 3.0;

      // Perpendicular falloff
      float perp = exp(-abs(across) * 40.0);

      // Accumulate contribution
      col += u_trailColor * trail * perp;
      col += u_signalColor * head * perp;
      totalLight += (trail + head) * perp;
    }

    // Scan-line / glitch interference pattern
    float scanLine = step(0.97, fract(vUv.y * 20.0 + u_time * 0.3));
    float glitchTime = floor(u_time * 8.0);
    float glitchStrip = step(0.92, hash(floor(vUv.x * 15.0) + glitchTime));
    float glitch = scanLine * glitchStrip * u_glitchIntensity;

    // Noise flicker on glitch bands
    float noiseFlicker = hash(vUv.x * 100.0 + u_time * 50.0);
    col += u_signalColor * glitch * noiseFlicker;

    // Base wire glow — very subtle so the line is always slightly visible
    float wireGlow = exp(-abs(across) * 25.0) * 0.04;
    col += u_trailColor * wireGlow;

    float alpha = clamp(totalLight + glitch * 0.5 + wireGlow, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
export const GhostSignalMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_signalColor: new Vector3(0.2, 1.0, 0.5), // Phosphor green
    u_trailColor: new Vector3(0.05, 0.4, 0.15), // Dim green
    u_speed: 0.4,
    u_packetCount: 3.0,
    u_trailLength: 0.25,
    u_glitchIntensity: 0.6,
}, ghostSignalVertex, ghostSignalFragment);
extend({ GhostSignalMaterial });
const solarFilamentVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const solarFilamentFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec3 u_coreColor;
  uniform vec3 u_midColor;
  uniform vec3 u_coolColor;
  uniform vec3 u_flareColor;
  uniform float u_speed;
  uniform float u_turbulence;
  varying vec2 vUv;
  varying vec3 vPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash(i), b = hash(i+vec2(1,0));
    float c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0; float amp = 0.5; float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      v += amp * smoothNoise(p * freq);
      amp *= 0.5; freq *= 2.1;
    }
    return v;
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x;
    float across = vUv.y - 0.5;

    // Convective turbulence — large scale rolls
    vec2 turbUV = vec2(along * 3.0 - t * 0.8, across * 2.0 + t * 0.3);
    float turb = fbm(turbUV) * u_turbulence;

    // Secondary smaller eddies
    float eddy = fbm(turbUV * 3.0 + vec2(t * 0.5, -t * 0.2)) * u_turbulence * 0.4;

    float displacement = (turb + eddy - 0.5) * 0.2;
    float dist = abs(across - displacement);

    // Temperature gradient from center outward — maps to color
    float tempGrad = 1.0 - smoothstep(0.0, 0.3, dist);
    float coreGrad = 1.0 - smoothstep(0.0, 0.08, dist);
    float midGrad = 1.0 - smoothstep(0.05, 0.2, dist);
    float coolGrad = 1.0 - smoothstep(0.1, 0.35, dist);

    // Spicules — thin jets shooting off the surface
    float spiculePhase = floor(along * 20.0 + t * 2.0);
    float spiculeSeed = hash(vec2(spiculePhase, 0.0));
    float spiculeActive = step(0.6, spiculeSeed);
    float spiculeX = fract(along * 20.0 + t * 2.0);
    float spiculeY = across - 0.2; // Shoot outward
    float spicule = exp(-abs(spiculeX - 0.5) * 30.0) * exp(-abs(spiculeY) * 15.0)
                   * spiculeActive * (1.0 - spiculeX);

    // Flare — occasional intense brightening at a random spot
    float flareTime = floor(t * 0.3);
    float flareSeed = hash(vec2(flareTime, 1.0));
    float flarePos = flareSeed;
    float flareIntensity = smoothstep(0.95, 1.0, fract(t * 0.3)) * 8.0; // sharp burst
    float flare = exp(-abs(along - flarePos) * 15.0) * exp(-dist * 10.0) * flareIntensity;

    // Assemble color by temperature zone
    vec3 col = u_coolColor * coolGrad;
    col = mix(col, u_midColor, midGrad);
    col = mix(col, u_coreColor, coreGrad);
    col += u_flareColor * flare;
    col += u_coreColor * spicule * 0.6;

    // Brightness pulsing — magnetic reconnection events
    float pulse = 0.85 + 0.15 * sin(t * 2.3 + along * 4.0) * sin(t * 1.7);
    col *= pulse;

    float alpha = clamp(coolGrad * 0.8 + flare * 0.5 + spicule * 0.4, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
export const SolarFilamentMaterial = shaderMaterial({
    u_time: 0,
    u_coreColor: new Vector3(1.0, 0.98, 0.7), // White-hot
    u_midColor: new Vector3(1.0, 0.55, 0.05), // Solar orange
    u_coolColor: new Vector3(0.7, 0.08, 0.02), // Deep plasma red
    u_flareColor: new Vector3(1.0, 0.9, 0.3), // Bright yellow flare
    u_speed: 0.5,
    u_turbulence: 1.2,
}, solarFilamentVertex, solarFilamentFragment);
extend({ SolarFilamentMaterial });
const voidRiftVertex = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const voidRiftFragment = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_riftColor;
  uniform vec3 u_radiationColor;
  uniform vec3 u_lensColor;
  uniform float u_speed;
  uniform float u_riftWidth;
  uniform float u_radiationDensity;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n) * 43758.5453); }
  float hash2d(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
    float a = hash2d(i), b = hash2d(i+vec2(1,0));
    float c = hash2d(i+vec2(0,1)), d = hash2d(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  // Domain-warped fbm for the rift edge
  float riftNoise(vec2 p, float t) {
    vec2 q = vec2(smoothNoise(p + vec2(t*0.3, t*0.2)),
                  smoothNoise(p + vec2(t*0.2, -t*0.4)));
    vec2 r = vec2(smoothNoise(p + 4.0*q + vec2(1.7, 9.2)),
                  smoothNoise(p + 4.0*q + vec2(8.3, 2.8)));
    return smoothNoise(p + 4.0*r);
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x;
    float across = vUv.y - 0.5;

    // Rift edge — domain-warped so it breathes and writhes
    vec2 riftUV = vec2(along * 4.0 - t * 0.5, across * 2.0);
    float riftWarp = riftNoise(riftUV, t) - 0.5;
    float riftEdge = abs(across - riftWarp * 0.1);

    // The void interior
    float insideRift = 1.0 - smoothstep(0.0, u_riftWidth, riftEdge);

    // Edge shimmer — lensing distortion halo
    float lensing = exp(-riftEdge * 12.0) * (1.0 - insideRift * 0.7);
    lensing *= 0.5 + 0.5 * sin(along * 30.0 - t * 5.0 + riftWarp * 10.0);

    // Hawking radiation — sparse bright sparks ejected from the event horizon
    vec3 radCol = vec3(0.0);
    for (float i = 0.0; i < 12.0; i++) {
      if (i >= u_radiationDensity) break;
      float seed = hash(i * 3.7 + floor(t * 2.0));
      float pos = seed; // Position along segment
      float birth = fract(hash(i * 5.3 + floor(t * 4.0)) + t * 0.8);
      float life = 1.0 - birth; // 0=just born, 1=dying
      
      // Spark drifts perpendicular to the rift as it ages
      float drift = (hash(i * 9.1) - 0.5) * life * 0.4;
      float sparkDist = length(vec2((along - pos) * 6.0, (across - drift) * 8.0));
      float spark = exp(-sparkDist * sparkDist * 20.0) * life * (1.0 - life) * 4.0;

      // Sparks glow warmer near the rift, cool and fade as they escape
      vec3 sparkColor = mix(u_radiationColor, vec3(1.0, 0.6, 0.2), life * 0.6);
      radCol += sparkColor * spark;
    }

    // Dimensional bleed — strands of an alternate reality bleeding through
    float bleedPhase = along * 15.0 + t * 1.5;
    float bleed = 0.0;
    bleed += sin(bleedPhase) * sin(bleedPhase * 1.618) * 0.5 + 0.5;
    bleed *= insideRift * 0.3;
    bleed *= smoothNoise(vec2(along * 8.0, t * 0.7));

    // Dark matter texture inside the rift — not nothing, but OTHER
    float darkMatter = smoothNoise(vec2(along * 20.0 - t, across * 10.0)) * insideRift;
    float antimatter = smoothNoise(vec2(along * 35.0 + t * 1.3, across * 20.0 - t * 0.5)) * insideRift;

    // Assemble
    vec3 col = vec3(0.0);

    // The void: darker than dark, but with subtle structure
    col += u_riftColor * insideRift * (0.3 + darkMatter * 0.3 + antimatter * 0.15);

    // Lensing halo
    col += u_lensColor * lensing * 0.8;

    // Dimensional bleed
    col += vec3(0.6, 0.1, 0.9) * bleed;

    // Hawking radiation sparks
    col += radCol;

    // Edge singularity line — ultra-bright thin line at the rift boundary
    float singularity = exp(-riftEdge * 60.0) * 2.0;
    singularity *= 0.7 + 0.3 * sin(along * 50.0 - t * 8.0);
    col += mix(u_lensColor, vec3(1.0), 0.5) * singularity;

    float alpha = clamp(insideRift * 0.7 + lensing * 0.6 + singularity * 0.8 + (radCol.r + radCol.g + radCol.b) * 0.4, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
export const VoidRiftMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_riftColor: new Vector3(0.02, 0.0, 0.06), // Near-void purple-black
    u_radiationColor: new Vector3(0.9, 0.95, 1.0), // Cool white radiation
    u_lensColor: new Vector3(0.5, 0.2, 1.0), // Violet gravitational lens
    u_speed: 0.4,
    u_riftWidth: 0.12,
    u_radiationDensity: 8.0,
}, voidRiftVertex, voidRiftFragment);
extend({ VoidRiftMaterial });
// ============================================================
// USAGE GUIDE
// ============================================================
//
// 1. Import desired material and its interface from this file.
//
// 2. In your component:
//    import { TeslaArcMaterial } from './LineShaderMaterials.js';
//
// 3. In your geometry setup — LineSegments require UV coordinates!
//    const geo = new THREE.BufferGeometry();
//    // ... add positions
//    // Add UVs: x=0 at segment start, x=1 at end; y=0 at bottom, y=1 at top
//    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
//
// 4. In JSX:
//    <lineSegments geometry={geo}>
//      <teslaArcMaterial
//        u_time={clock.getElapsedTime()}
//        u_arcColor={new Vector3(0.4, 0.8, 1.0)}
//        transparent
//        depthWrite={false}
//        blending={THREE.AdditiveBlending}
//      />
//    </lineSegments>
//
// 5. Animate in useFrame:
//    useFrame(({ clock }) => {
//      mat.current.u_time = clock.getElapsedTime();
//    });
//
// NOTE: For additive glow effects, set:
//   blending={THREE.AdditiveBlending}
//   transparent={true}
//   depthWrite={false}
