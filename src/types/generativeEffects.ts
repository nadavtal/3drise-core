// =============================================================================
// GENERATIVE EFFECTS — Visual effects that ADD geometry around objects
// (atoms, shockwaves, auras, portals, etc.)
// =============================================================================

import type { AnimationOptions } from "./scene3d";
export type GenerativeEffectType = 'molecules' | 'shockwave' | 'aura' | 'dataStream' | 'constellation' | 'hologram' | 'portal' | 'dnaHelix' | 'orb' | 'lightning' | 'aurora' | 'fire' | 'forcefield' | 'neuralNetwork' | 'blackHole' | 'iceCrystals' | 'smokePlume' | 'volumetricFog' | 'smokeRing' | 'flares' | 'sparklesBurst' | 'bubbles' | 'glyphs' | 'smokeRibbon' | 'fire';

export interface BaseGenerativeEffectConfig {
    enabled: boolean;
    intensity: number;
    speed: number;
    color: string;
    opacity: number;
}

export interface MoleculesConfig extends BaseGenerativeEffectConfig {
    atomCount: number;
    orbitRadius: number;
    atomSize: number;
    showBonds: boolean;
    bondColor: string;
    randomizeAxes: boolean;
}

export interface ShockwaveConfig extends BaseGenerativeEffectConfig {
    ringCount: number;
    expansionRadius: number;
    thickness: number;
    intervalSeconds: number;
    rimColor: string;
}

export interface AuraConfig extends BaseGenerativeEffectConfig {
    layerCount: number;
    fresnelPower: number;
    pulseSpeed: number;
    innerColor: string;
    outerColor: string;
    noiseAmount: number;
    sizeMultiplier: number;
}

export interface DataStreamConfig extends BaseGenerativeEffectConfig {
    particleCount: number;
    spiralTurns: number;
    streamRadius: number;
    inward: boolean;
    particleSize: number;
}

export interface ConstellationConfig extends BaseGenerativeEffectConfig {
    starCount: number;
    connectRadius: number;
    orbitRadius: number;
    twinkleSpeed: number;
    lineOpacity: number;
    starSize: number;
}

export interface HologramConfig extends BaseGenerativeEffectConfig {
    scanlineCount: number;
    scanSpeed: number;
    scanColor: string;
    gridEnabled: boolean;
    flickerAmount: number;
    glitchEnabled: boolean;
}

export interface PortalConfig extends BaseGenerativeEffectConfig {
    radius: number;
    spiralTurns: number;
    innerGlowColor: string;
    outerGlowColor: string;
    rotationSpeed: number;
    particleRingEnabled: boolean;
    particleCount: number;
}

export interface DnaHelixConfig extends BaseGenerativeEffectConfig {
    particleCount: number;
    strandCount: 2 | 3;
    helixRadius: number;
    helixHeight: number;
    basePairColor: string;
    runningLightEnabled: boolean;
}

export interface LightningConfig extends BaseGenerativeEffectConfig {
    boltCount: number;
    branchDepth: number;
    branchProbability: number;
    glowColor: string;
    flickerRate: number;
    strikeRadius: number;
}

export interface OrbConfig extends BaseGenerativeEffectConfig {
    coreSize: number;
    glowLayers: number;
    innerColor: string;
    outerColor: string;
    coronaEnabled: boolean;
    coronaColor: string;
    noiseAmount: number;
    pulseSpeed: number;
}

export interface AuroraConfig extends BaseGenerativeEffectConfig {
    ribbonCount: number;
    waveAmplitude: number;
    colorShift: number;
    arcWidth: number;
}

export interface ForcefieldConfig extends BaseGenerativeEffectConfig {
    hexSize: number;
    rippleEnabled: boolean;
    shieldColor: string;
    rimColor: string;
}

export interface NeuralNetworkConfig extends BaseGenerativeEffectConfig {
    nodeCount: number;
    signalSpeed: number;
    nodeColor: string;
    pulseColor: string;
    orbitSpeed: number;
}

export interface BlackHoleConfig extends BaseGenerativeEffectConfig {
    diskColor: string;
    jetEnabled: boolean;
    jetColor: string;
    rotationSpeed: number;
    tilt: number;
}

export interface IceCrystalsConfig extends BaseGenerativeEffectConfig {
    spikeCount: number;
    spikeLength: number;
    frostEnabled: boolean;
    iceColor: string;
    pulseSpeed: number;
}

export interface SmokePlumeConfig extends BaseGenerativeEffectConfig {
    particleCount: number;
    height: number;
    spread: number;
    smokeColor: string;
    turbulence: number;
}

export interface VolumetricFogConfig extends BaseGenerativeEffectConfig {
    particleCount: number;
    fogRadius: number;
    driftSpeed: number;
    fogColor: string;
    density: number;
}

export interface SmokeRingConfig extends BaseGenerativeEffectConfig {
    ringCount: number;
    expansionRadius: number;
    riseSpeed: number;
    intervalSeconds: number;
    smokeColor: string;
    thickness: number;
}

export interface FlaresConfig extends BaseGenerativeEffectConfig {
    shooting: boolean;
    maskResolution: number;
    maskLayer: number;
    radius: number;
    padding: number;
    fitKey?: string;
}

export interface BubblesConfig extends BaseGenerativeEffectConfig {
    /** Three colors cycled by the thin-film iridescence shader. */
    colors: [string, string, string];
    scale: number;
    opacity: number;
    spawnRate: number;
    floatSpeed: number;
    iridescence: number;
    lifetimeMs: number;
    /** Time multiplier applied to upward float and shader shimmer. */
    speed: number;
}

export interface GlyphsConfig extends BaseGenerativeEffectConfig {
    /** Color of the soft underline ring beneath the glyphs. */
    ringColor: string;
    /** Color of the glyph strokes themselves. */
    glyphsColor: string;
    /** Strength of per-glyph RGB shade variation. 0 = uniform color, 1 = ±50% per channel, higher pushes further. */
    shadesMultiplier: number;
    /** Color a glyph shifts toward when the cursor is hovering near it. */
    hoverColor: string;
    /** Radius of the hover-glow falloff in NDC units (0..~1.4). */
    hoverRadius: number;
    /** Strength of the hover effect. 0 = off; 1 = full color swap + glow boost; higher = brighter. */
    hoverIntensity: number;
    /** Visible radius of the ring (drives the plane mesh size). */
    ringRadius: number;
    /** How many glyphs are arranged around the ring (>= 3). */
    glyphCount: number;
    /** Angular rotation speed of the ring (radians/sec multiplier). */
    rotationSpeed: number;
    /** How fast the glyph shapes morph between seeds. 0 = static. */
    morphSpeed: number;
    /** Glow intensity multiplier on top of the base color. */
    intensity: number;
    /** Global opacity of the effect. */
    opacity: number;
}

export interface SparklesBurstConfig extends BaseGenerativeEffectConfig {
    /** Hot inner color of the burst core. */
    coreColor: string;
    /** Outer color of the rays and wavefront ring. */
    burstColor: string;
    /** Whether the burst loops continuously or plays once on mount. */
    loop: boolean;
    /** Duration of one full burst cycle, in milliseconds. */
    durationMs: number;
    /** Number of rays radiating from center. */
    rayCount: number;
    /** Plane size in world units. */
    scale: number;
    /** Brightness multiplier. */
    intensity: number;
    /** Global opacity. */
    opacity: number;
    /** Color a burst shifts toward when the cursor hovers near it. */
    hoverColor: string;
    /** NDC radius of the hover-glow falloff. */
    hoverRadius: number;
    /** Strength of hover effect. 0 = off. */
    hoverIntensity: number;
}

export interface FireConfig extends BaseGenerativeEffectConfig {
    radius?: number;
    height?: number;
    radiusScale?: number;
    heightScale?: number;
    turbulence?: number;
    sway?: number;
    tint?: string;
    light?: boolean;
    mode?: 'crown' | 'tongues';
    coverage?: number;
    tongues?: number;
}

export interface SmokeRibbonConfig {
    enabled?: boolean;
    /** Ribbon width. */
    width?: number;
    /** Ribbon height (rises from the mesh origin on local +Y). */
    height?: number;
    /** Height/width segments per world unit — needs to be high (~10–12) so the
     *  vertex twist bends smoothly instead of faceting. */
    segmentsPerLength?: number;
    /** Number of crossed planes for volume: 1 (flat), 2 (90° cross), 3 (60°). */
    planes?: 1 | 2 | 3;
    intensity?: number;
    color?: string;
    colorTop?: string;
    speed?: number;
    detail?: number;
    remapLow?: number;
    remapHigh?: number;
    edgeX?: number;
    edgeY?: number;
    density?: number;
    twistStrength?: number;
    twistSpeed?: number;
    twistScale?: number;
    twistStart?: number;
    wind?: [number, number];
    /** Advance u_time. Default true. */
    animate?: boolean;
    /** Lean toward the pointer on hover (drives u_mouse from NDC). Default false. */
    interactive?: boolean;
}

export type GenerativeEffectConfig = ({
    type: 'molecules';
} & MoleculesConfig) | ({
    type: 'shockwave';
} & ShockwaveConfig) | ({
    type: 'aura';
} & AuraConfig) | ({
    type: 'dataStream';
} & DataStreamConfig) | ({
    type: 'constellation';
} & ConstellationConfig) | ({
    type: 'hologram';
} & HologramConfig) | ({
    type: 'portal';
} & PortalConfig) | ({
    type: 'dnaHelix';
} & DnaHelixConfig) | ({
    type: 'orb';
} & OrbConfig) | ({
    type: 'lightning';
} & LightningConfig) | ({
    type: 'aurora';
} & AuroraConfig) | ({
    type: 'fire';
} & FireConfig) | ({
    type: 'forcefield';
} & ForcefieldConfig) | ({
    type: 'neuralNetwork';
} & NeuralNetworkConfig) | ({
    type: 'blackHole';
} & BlackHoleConfig) | ({
    type: 'iceCrystals';
} & IceCrystalsConfig) | ({
    type: 'smokePlume';
} & SmokePlumeConfig) | ({
    type: 'volumetricFog';
} & VolumetricFogConfig) | ({
    type: 'smokeRing';
} & SmokeRingConfig) | ({
    type: 'flares';
} & FlaresConfig) | ({
    type: 'sparklesBurst';
} & SparklesBurstConfig) | ({
    type: 'bubbles';
} & BubblesConfig) | ({
    type: 'glyphs';
} & GlyphsConfig) | ({
    type: 'smokeRibbon';
} & SmokeRibbonConfig);

export interface GenerativeEffectSettings {
    config: GenerativeEffectConfig;
    /** Keyframe animations targeting config properties (intensity, speed, opacity, etc.) */
    animations?: AnimationOptions[];
}


export {};
