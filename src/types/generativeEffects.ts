// =============================================================================
// GENERATIVE EFFECTS — Visual effects that ADD geometry around objects
// (atoms, shockwaves, auras, portals, etc.)
// =============================================================================

import type { AnimationOptions } from "./scene3d";
export type GenerativeEffectType = 'molecules' | 'shockwave' | 'aura' | 'dataStream' | 'constellation' | 'hologram' | 'portal' | 'dnaHelix' | 'orb' | 'lightning' | 'aurora' | 'fire' | 'forcefield' | 'neuralNetwork' | 'blackHole' | 'iceCrystals' | 'smokePlume' | 'volumetricFog' | 'smokeRing' | 'flares' | 'sparklesBurst' | 'bubbles' | 'glyphs' | 'smokeRibbon' | 'fire' | 'fieldLines' | 'strangeAttractor' | 'harmonicShell' | 'galaxy' | 'fireflySwarm' | 'murmuration' | 'planetaryRings' | 'waterCaustics' | 'iceHalo' | 'fallingLeaves' | 'lichtenberg' | 'dandelionSeeds';

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
    /** Central orbital: -1 cycles, 0 1s, 1 2p, 2 3d z², 3 3d xy, 4 4f z³, 5 4f xyz. */
    orbital?: number;
    /** Colour of the negative-phase lobes; `color` is the positive phase. */
    phaseColor?: string;
    /** Number of points in the electron clouds, 0.25..2. */
    cloudDensity?: number;
}

export interface ShockwaveConfig extends BaseGenerativeEffectConfig {
    ringCount: number;
    expansionRadius: number;
    thickness: number;
    intervalSeconds: number;
    rimColor: string;
    /** Ground ring (0) or spherical shell for mid-air blasts (1), 0..1. */
    shape?: number;
    /** How the front slows: 0 constant speed, 1 true Sedov–Taylor (fast burst, long coast), 0..1. */
    deceleration?: number;
    /** Slow lobes that grow on the front as the shell thins (Vishniac instability), 0..1. */
    instability?: number;
    /** Debris kicked up where the front sweeps past, 0..1. */
    dust?: number;
    /** Brief Wilson-cloud haze just behind the front, 0..1. */
    condensation?: number;
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
    coldColor: string;
    midColor: string;
    hotColor: string;
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
    /** Throat radius, as a fraction of the portal radius. */
    throatSize?: number;
    /** Depth of the funnel, as a fraction of the portal radius. */
    funnelDepth?: number;
    /** Nebula colour seen through the throat. */
    otherSideColor?: string;
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
    /** Point-sprite size multiplier for traveling electrical signals. */
    pulseSize?: number;
    /** Number of independently launched signals per second. */
    pulseRate?: number;
    /** Length of the fading dot trail, as a fraction of an edge. */
    trailLength?: number;
    /** Likelihood that an arriving signal branches to a neighboring node. */
    branchChance?: number;
    /** Brightness and scale response when a node receives a signal. */
    nodeActivation?: number;
    /** Number of spontaneous network-wide activation waves per second. */
    activationRate?: number;
}

export interface BlackHoleConfig extends BaseGenerativeEffectConfig {
    diskColor: string;
    jetEnabled: boolean;
    jetColor: string;
    rotationSpeed: number;
    tilt: number;
    /** Event-horizon radius, as a multiple of the bounding radius. */
    horizonSize?: number;
    /** Outer edge of the accretion disk, as a multiple of the bounding radius. */
    diskOuter?: number;
    /** Strength of light bending; 1 is physical. */
    lensing?: number;
    /** Relativistic brightening of the approaching side; 1 is physical. */
    beaming?: number;
}

export interface IceCrystalsConfig extends BaseGenerativeEffectConfig {
    spikeCount: number;
    spikeLength: number;
    frostEnabled: boolean;
    iceColor: string;
    pulseSpeed: number;
    /** Crystal habit: 0 hexagonal plates, 1 feathery dendrites. */
    habit?: number;
    /** Side branches per arm, 0..7. */
    branches?: number;
    /** Strength of facet glints and diamond-dust flashes. */
    sparkle?: number;
}

export interface SmokePlumeConfig extends BaseGenerativeEffectConfig {
    particleCount: number;
    height: number;
    spread: number;
    smokeColor: string;
    turbulence: number;
    /** Glowing, fire-lit base, 0..1. */
    heat?: number;
    /** Crosswind that bends the plume; negative blows the other way. */
    wind?: number;
}

export interface VolumetricFogConfig extends BaseGenerativeEffectConfig {
    particleCount: number;
    fogRadius: number;
    driftSpeed: number;
    fogColor: string;
    density: number;
    /** Height of the fog layer, as a multiple of the bounding radius. */
    layerHeight?: number;
    /** Henyey-Greenstein forward scattering, 0..0.9. */
    anisotropy?: number;
    /** Size of the fog banks; higher is finer. */
    noiseScale?: number;
}

export interface SmokeRingConfig extends BaseGenerativeEffectConfig {
    ringCount: number;
    expansionRadius: number;
    riseSpeed: number;
    intervalSeconds: number;
    smokeColor: string;
    thickness: number;
    /** Launch rings in pairs that pass through each other. */
    leapfrog?: boolean;
    /** How strongly rings wobble as they age. */
    wobble?: number;
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

export interface FieldLinesConfig extends BaseGenerativeEffectConfig {
    /** Number of nested L-shells, 1..8. */
    shells?: number;
    /** Field lines around each shell, 2..32. */
    linesPerShell?: number;
    /** Outermost shell, as a multiple of the bounding radius. */
    extent?: number;
    /** Twists the lines around the dipole axis, like a flux rope. */
    twist?: number;
    /** Tilt of the dipole axis, in degrees. */
    tilt?: number;
    /** Trapped particles bouncing along each field line, 0..40. */
    particleCount?: number;
    /** Particle sprite size. */
    particleSize?: number;
    /** Colour at the top of each arc, where the field is weakest. `color` is the footpoint colour. */
    apexColor?: string;
}

export interface StrangeAttractorConfig extends BaseGenerativeEffectConfig {
    /** 0 Lorenz, 1 Aizawa, 2 Thomas. */
    system?: number;
    /** Number of trajectories, 1..12. They start 0.001 apart and drift apart. */
    strands?: number;
    /** 0..1 nudge on the system parameter; 0.5 is the textbook value. */
    chaos?: number;
    /** Length of the bright trail, as a fraction of the path. */
    trailLength?: number;
    /** Size as a multiple of the bounding radius. */
    scale?: number;
    /** Opacity of the full path behind the trail. */
    ghostOpacity?: number;
    /** Size of the glowing beads at the head. */
    particleSize?: number;
    /** Colour of the hot head of each trail. `color` is the cool tail. */
    headColor?: string;
}

export interface HarmonicShellConfig extends BaseGenerativeEffectConfig {
    /** Highest spherical-harmonic band, 1..4; higher means more lobes. */
    degree?: number;
    /** How far the harmonics push the shell in and out. */
    amplitude?: number;
    /** Shell radius as a multiple of the bounding radius. */
    sizeMultiplier?: number;
    /** Soap-film thickness in nanometres; sets the interference colour bands. */
    filmThickness?: number;
    /** 0..1 brightness of the lines where the harmonic field crosses zero. */
    nodalLines?: number;
    /** Rim and nodal-line colour. */
    rimColor?: string;
}

export interface GalaxyConfig extends BaseGenerativeEffectConfig {
    /** Number of stars, 2000..40000. */
    starCount?: number;
    /** Galaxy radius, as a multiple of the bounding radius, 1..8. */
    radius?: number;
    /** How tightly the arms wind; 0 gives a barred ellipse, 0..12. */
    armTwist?: number;
    /** How elongated the orbits are; stronger arms when higher, 0..0.6. */
    ellipticity?: number;
    /** Size of the central bulge, as a fraction of the radius, 0..0.5. */
    bulgeSize?: number;
    /** Darkness of the dust lanes along the arms, 0..1. */
    dust?: number;
    /** Tilt of the galactic disk, in degrees, -90..90. */
    tilt?: number;
    /** Colour of the old stars in the bulge. */
    coreColor?: string;
}

export interface FireflySwarmConfig extends BaseGenerativeEffectConfig {
    /** Number of fireflies, 20..400. */
    count?: number;
    /** How strongly neighbours pull each other into step; 0 never syncs, 0..3. */
    coupling?: number;
    /** Flashes per second, 0.1..2. */
    frequency?: number;
    /** Outer radius of the swarm, as a multiple of the bounding radius, 1.4..6. */
    spread?: number;
    /** How fast the fireflies wander, 0..4. */
    driftSpeed?: number;
    /** Size of the flash glow, 0.2..3. */
    glowSize?: number;
    /** Colour of the bioluminescent flash. */
    flashColor?: string;
}

export interface MurmurationConfig extends BaseGenerativeEffectConfig {
    /** Number of birds, 100..4000. */
    count?: number;
    /** Size of the airspace the flock uses, as a multiple of the bounding radius, 1.5..8. */
    flockRadius?: number;
    /** Pull toward the centre of the nearest neighbours; high values give tight balls, 0..3. */
    cohesion?: number;
    /** How strongly a bird matches its neighbours heading; drives the travelling waves, 0..3. */
    alignment?: number;
    /** Push away from the nearest neighbours; high values thin the flock out, 0..3. */
    separation?: number;
    /** Size of each bird, 0.2..4. */
    birdSize?: number;
}

export interface PlanetaryRingsConfig extends BaseGenerativeEffectConfig {
    /** Inner edge of the rings, as a multiple of the bounding radius, 1.02..4. */
    innerRadius?: number;
    /** Outer edge of the rings, as a multiple of the bounding radius, 1.2..8. */
    outerRadius?: number;
    /** Tilt of the ring plane, in degrees, -90..90. */
    tilt?: number;
    /** Resonant moons: each one opens gaps and starts spiral density waves, 0..3. */
    moons?: number;
    /** Faint radial dust streaks that turn with the planet, not with the orbits, 0..1. */
    spokes?: number;
    /** How much fine dust there is; dusty rings blaze when lit from behind, 0..1. */
    forwardScatter?: number;
    /** Direction of the sun around the planet, in degrees, 0..360. */
    sunAngle?: number;
    /** Height of the sun above the world horizon, in degrees, -60..60. */
    sunElevation?: number;
    /** Colour of the thin material inside the divisions. */
    gapColor?: string;
    /** Colour of the fine dust that scatters light forward. */
    dustColor?: string;
}

export interface WaterCausticsConfig extends BaseGenerativeEffectConfig {
    /** Height of the water surface above the floor, in bounding radii; deeper water gives a coarser, softer web, 0.2..6. */
    waterDepth?: number;
    /** Wavelength of the ripples, in bounding radii, 0.2..3. */
    waveScale?: number;
    /** Steepness of the ripples; higher focuses the light into sharper filaments, 0..3. */
    waveHeight?: number;
    /** Spread of the refractive index across red, green and blue (1 is real water, n = 1.327 to 1.336), 0..1. */
    dispersion?: number;
    /** Radius of the lit floor disc, in bounding radii, 1..8. */
    radius?: number;
    /** Also project the caustics onto the object itself. */
    showOnHost?: boolean;
}

export interface IceHaloConfig extends BaseGenerativeEffectConfig {
    /** Angular size of the halo; 1 is the physical 22°, which fills a normal lens, 0.1..1. */
    haloScale?: number;
    /** Bright spots left and right of the source, on its own level, 0..1. */
    sunDogs?: number;
    /** The wider, fainter 46° halo from the 90° prism faces, 0..1. */
    outerHalo?: number;
    /** Faint white circle running horizontally through the source, 0..1. */
    parhelicCircle?: number;
    /** Vertical streak above and below the source, 0..1. */
    pillar?: number;
    /** Soft glow right around the source, 0..2. */
    glare?: number;
}

export interface FallingLeavesConfig extends BaseGenerativeEffectConfig {
    /** Number of leaves in the air at once, 4..400. */
    leafCount?: number;
    /** Size of a leaf, as a fraction of the bounding radius, 0.2..3. */
    leafSize?: number;
    /** Height of the column the leaves fall through, in bounding radii, 1..8. */
    fallHeight?: number;
    /** Radius of the column the leaves fall through, in bounding radii, 1..6. */
    spread?: number;
    /** Share of leaves in the tumbling regime rather than the fluttering one, 0..1. */
    tumble?: number;
    /** Strength of the sideways breeze, 0..3. */
    wind?: number;
    /** Colour of the turned leaves; each leaf is mixed between the two. */
    autumnColor?: string;
}

export interface LichtenbergConfig extends BaseGenerativeEffectConfig {
    /** Number of sites the discharge can grow through; more gives finer branches, 800..8000. */
    nodeCount?: number;
    /** Growth exponent η: low values give dense bushy ferns, high values sparse lightning, 0.5..5. */
    branching?: number;
    /** Seconds for one grow, hold and fade cycle, 2..30. */
    growthTime?: number;
    /** Width of the channels on screen, 0.2..4. */
    lineWidth?: number;
    /** Strength of the slow pulses running outward along the channels, 0..2. */
    pulse?: number;
    /** Colour of the hot core inside the thickest channels. */
    coreColor?: string;
}

export interface DandelionSeedsConfig extends BaseGenerativeEffectConfig {
    /** Number of seeds on the head and in the air, 10..260. */
    seedCount?: number;
    /** Mean wind speed; also how quickly seeds are pulled loose, 0..2. */
    windSpeed?: number;
    /** Wind direction, in degrees around the vertical, 0..360. */
    windDirection?: number;
    /** Strength of the swirling gusts on top of the mean wind, 0..2. */
    turbulence?: number;
    /** Size of each seed, 0.3..3. */
    seedSize?: number;
    /** Updraft strength; at 1 it about cancels the seeds slow fall, 0..3. */
    lift?: number;
    /** Colour of the beak and the seed body hanging below. */
    stemColor?: string;
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
} & SmokeRibbonConfig) | ({
    type: 'fieldLines';
} & FieldLinesConfig) | ({
    type: 'strangeAttractor';
} & StrangeAttractorConfig) | ({
    type: 'harmonicShell';
} & HarmonicShellConfig) | ({
    type: 'galaxy';
} & GalaxyConfig) | ({
    type: 'fireflySwarm';
} & FireflySwarmConfig) | ({
    type: 'murmuration';
} & MurmurationConfig) | ({
    type: 'planetaryRings';
} & PlanetaryRingsConfig) | ({
    type: 'waterCaustics';
} & WaterCausticsConfig) | ({
    type: 'iceHalo';
} & IceHaloConfig) | ({
    type: 'fallingLeaves';
} & FallingLeavesConfig) | ({
    type: 'lichtenberg';
} & LichtenbergConfig) | ({
    type: 'dandelionSeeds';
} & DandelionSeedsConfig);

export interface GenerativeEffectSettings {
    config: GenerativeEffectConfig;
    /** Keyframe animations targeting config properties (intensity, speed, opacity, etc.) */
    animations?: AnimationOptions[];
}


export {};
