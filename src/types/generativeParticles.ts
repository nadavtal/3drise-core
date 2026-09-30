// =============================================================================
// GENERATIVE PARTICLES — standalone particle objects (type 'particles') rendered by
// ParticlesGenerator. Each has three mouse modes (pointerMode, plus 'none') and three
// trail types (trailMode, plus 'none'); see the 3drise-particles skill.
// =============================================================================

import type { ObjectAnimations } from "./objectSettings";

export type GenerativeParticlesType = 'tidalStream' | 'brownianDust' | 'bioluminescentWake' | 'electronOrbitals' | 'grinderSparks' | 'chladniSand' | 'faradayPowder' | 'neonRain' | 'magneticBottle' | 'shapeBurst' | 'shapeFlow';

/** Shared by every particle object: 'none' turns trails off. */
export type ParticleTrailMode = 'none' | 'streak' | 'comet' | 'echo';

/** Closed solids a shape-driven particle object can take (the core mesh builders make them). */
export type ParticleShapeType = 'cone' | 'cylinder' | 'sphere' | 'capsule' | 'torus' | 'box' | 'tetrahedron' | 'octahedron' | 'icosahedron' | 'dodecahedron';

/**
 * The `shape` of a shape-driven particle object: a mesh-builder geometry config ({ type, ...params },
 * the same object createMeshByType takes). Sizes are in mesh-builder units; the shape keeps its real size.
 * Each type reads only its own parameters.
 */
export interface ParticleShapeConfig {
    type: ParticleShapeType;
    /** cone, sphere, capsule, torus, tetrahedron, octahedron, icosahedron, dodecahedron. */
    radius?: number;
    /** cone, cylinder. */
    height?: number;
    /** cylinder. */
    radiusTop?: number;
    /** cylinder. */
    radiusBottom?: number;
    /** capsule: length of the straight middle section. */
    length?: number;
    /** torus: tube radius. */
    tube?: number;
    /** box: [width, height, depth]. */
    size?: [number, number, number];
    /** cone, cylinder, capsule, torus. */
    radialSegments?: number;
    /** torus. */
    tubularSegments?: number;
    /** capsule. */
    capSegments?: number;
    /** sphere. */
    segments?: number;
    /** sphere. */
    rings?: number;
    /** polyhedra: subdivision level. */
    detail?: number;
}

export interface BaseGenerativeParticlesConfig {
    enabled: boolean;
    intensity: number;
    speed: number;
    color: string;
    opacity: number;
    /** World size of the object (units), 0.2..4. */
    size: number;
    /** How strongly the cursor acts (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Reach / size of the cursor's influence, 0.2..3. */
    pointerRadius?: number;
    /** Tint of the light or flare the object produces in response to the cursor. */
    pointerColor?: string;
    trailMode?: ParticleTrailMode;
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour the trails cool toward. */
    trailColor?: string;
    /** Fraction of particles that leave trails, 0.02..1. */
    trailShare?: number;
}

export interface TidalStreamParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Stars in the satellites and their streams (CPU simulated), 3000..40000. */
    particleCount?: number;
    /** Dwarf galaxies being torn apart: arcs, radial shells, a polar ring, 1..3. */
    satelliteCount?: number;
    /** Dwarf mass: heavier dwarfs hold their stars longer, 0.0001..0.003. */
    satelliteMass?: number;
    /** Elongation of the main dwarf's orbit (the others are set relative to it), 0..0.8. */
    orbitEccentricity?: number;
    /** Orbits already completed when the object appears, 0..5. */
    streamAge?: number;
    /** Strength of the Doppler shift, 0..6. */
    dopplerScale?: number;
    /** Red-shift tint (stars moving away from the camera). */
    redshiftColor?: string;
    /** Stars in the host spiral galaxy (GPU, analytic), 0..200000. */
    discStars?: number;
    /** Spiral arms of the density wave, 1..4. */
    armCount?: number;
    /** Emission nebulae along the arm crests (H-alpha). */
    nebulaColor?: string;
    /** Star sprite size, 0.2..3. */
    starSize?: number;
    /** What the cursor is: off, a dark subhalo, a spinning black hole, or a spectroscope loupe. */
    pointerMode?: 'none' | 'subhalo' | 'blackHole' | 'spectroscope';
    /** Mass / spin / magnification of the cursor (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Einstein radius, horizon size or loupe size, 0.2..3. */
    pointerRadius?: number;
    /** Colour of the photon ring / loupe reticle. */
    pointerColor?: string;
    /** Long exposure, comet tails or stardust afterglow. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of stars that leave trails, 0.02..1. */
    trailShare?: number;
}

export interface BrownianDustParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Dust motes (CPU simulated), 1000..20000. */
    particleCount?: number;
    /** Air temperature: strength of the Brownian jitter, 0..4. */
    temperature?: number;
    /** Strength of the slow turbulent air currents, 0..4. */
    turbulence?: number;
    /** Sun elevation in degrees, 10..80. */
    beamAngle?: number;
    /** Width of the window, 0.1..0.7. */
    beamWidth?: number;
    /** Window columns: mullions cast shadow lines through the beam, 1..5. */
    windowPanes?: number;
    /** Forward-scattering strength g of the dust (Henyey–Greenstein), 0..0.95. */
    anisotropy?: number;
    /** Density of the fine haze that makes the light shaft visible, 0..2. */
    hazeDensity?: number;
    /** Lens aperture: out-of-focus motes become bokeh discs (0 = pinhole), 0..2. */
    aperture?: number;
    /** Skylight tint of motes outside the beam. */
    ambientColor?: string;
    /** What the cursor is: off, a hand in the air, a torch, or a charged rod. */
    pointerMode?: 'none' | 'hand' | 'torch' | 'charge';
    /** Strength of the air push / light / charge (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Size of the hand, reach of the light, or reach of the charge, 0.2..3. */
    pointerRadius?: number;
    /** Torch light colour / corona glow colour. */
    pointerColor?: string;
    /** Shutter drag, swirl threads or afterglow. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of motes that leave trails, 0.02..1. */
    trailShare?: number;
}

export interface BioluminescentWakeParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Plankton cells (CPU simulated), 4000..60000. */
    particleCount?: number;
    /** Swell amplitude: bigger waves shear the surface and light the crests, 0..3. */
    swellHeight?: number;
    /** Drift speed of the water, 0..2. */
    current?: number;
    /** How easily cells flash (lower thresholds), 0.2..4. */
    sensitivity?: number;
    /** Seconds a cell needs to recharge after flashing, 0.5..30. */
    recovery?: number;
    /** Flash duration, 0.3..4. */
    glowTime?: number;
    /** How far light travels in the water before it is absorbed, 0.2..3. */
    waterClarity?: number;
    /** Colour light shifts toward when it comes from deeper water. */
    deepColor?: string;
    /** Moon glitter on the surface (0 = none), 0..2. */
    moonlight?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor is: off, a hand in the water, falling pebbles, or a fish that hunts it. */
    pointerMode?: 'none' | 'hand' | 'pebble' | 'fish';
    /** Stroke force / pebble size / fish speed (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Size of the hand, the pebbles or the fish, 0.2..3. */
    pointerRadius?: number;
    /** Splash colour. */
    pointerColor?: string;
    /** Long exposure, glow threads or afterglow. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of cells that can leave trails, 0.02..1. */
    trailShare?: number;
}

export interface ElectronOrbitalsParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Bohmian particles (CPU simulated), 2000..60000. */
    particleCount?: number;
    /** First orbital (n, l, m). */
    stateA?: '1s' | '2s' | '2p0' | '2p+1' | '3s' | '3p0' | '3p+1' | '3d0' | '3d+1' | '3d+2' | '4s' | '4p+1' | '4d+1' | '4d+2' | '4f0' | '4f+1' | '4f+2' | '4f+3';
    /** Second orbital (n, l, m). */
    stateB?: '1s' | '2s' | '2p0' | '2p+1' | '3s' | '3p0' | '3p+1' | '3d0' | '3d+1' | '3d+2' | '4s' | '4p+1' | '4d+1' | '4d+2' | '4f0' | '4f+1' | '4f+2' | '4f+3';
    /** Share of the second orbital in the superposition, 0..1. */
    mix?: number;
    /** Atomic time per second: speed of the breathing and circulation, 0..4. */
    timeScale?: number;
    /** Colour at phase pi (the cycle runs through both colours). */
    phaseColor?: string;
    /** Brightness of the |psi|^2 probability haze, 0..2. */
    cloudDensity?: number;
    /** Glow of the wavefronts (surfaces of constant phase) inside the cloud, 0..3. */
    phaseFronts?: number;
    /** Particle size, 0.3..3. */
    pointSize?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor is: off, a resonant photon source, a magnet, or a position detector. */
    pointerMode?: 'none' | 'photon' | 'magnet' | 'measure';
    /** Drive strength / field strength / detector efficiency (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Reach of the light, or the detector window size, 0.2..3. */
    pointerRadius?: number;
    /** Colour of emitted photons and detector clicks. */
    pointerColor?: string;
    /** Long exposure, Bohm trajectories or afterglow. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of particles that leave trails, 0.02..1. */
    trailShare?: number;
}

export interface GrinderSparksParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Spark pool size (CPU simulated), 1000..20000. */
    particleCount?: number;
    /** Sparks per second, 0..3. */
    sparkRate?: number;
    /** Rim speed in m/s: launch speed of the sparks, 10..80. */
    wheelSpeed?: number;
    /** Fan spread in degrees, 2..40. */
    sprayAngle?: number;
    /** Carbon content: how often sparks burst into stars (spark test), 0..1. */
    carbon?: number;
    /** Launch temperature in kelvin, 1400..2600. */
    temperature?: number;
    /** Camera exposure: how long cooling sparks stay visible, 0.3..3. */
    exposure?: number;
    /** Floor reflection strength (0 = matte), 0..1. */
    floorReflect?: number;
    /** Tint of the coolest, dull-red sparks. */
    emberColor?: string;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor does: off, moves the grinder, aims the spray, or sweeps the air through the sparks. */
    pointerMode?: 'none' | 'wheel' | 'aim' | 'sweep';
    /** Grinding pressure / aim pressure / strength of the air sweep (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Size of the air sweep, 0.2..3. */
    pointerRadius?: number;
    /** Tint of the oxygen flare in the air sweep. */
    pointerColor?: string;
    /** Long exposure, tracer arcs or smoulder. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Shutter: length of the streaks, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of sparks that leave trails, 0.02..1. */
    trailShare?: number;
}

/** Chladni Sand — Sand on an invisible vibrating plate: resonant plate modes throw grains onto the nodal lines, drawing Chladni figures that form and re-form; the cursor bows, touches or taps the plate. Use for science, sound and abstract scenes. */
export interface ChladniSandParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Sand grains (CPU simulated), 4000..60000. */
    particleCount?: number;
    /** Drive frequency (mode number): each value rings a different figure, 1.5..10. */
    frequency?: number;
    /** Slow glide of the drive frequency through neighbouring resonances (octaves; 0 = hold), 0..1. */
    sweep?: number;
    /** Resonance width: low = sharp, pure figures; high = blended figures, 0.01..0.3. */
    damping?: number;
    /** Drive strength: thinner or thicker nodal lines, livelier hops, 0..3. */
    amplitude?: number;
    /** Colour of grains in flight, catching the light. */
    hopColor?: string;
    /** Elevation of the raking light in degrees: low = strong relief, 5..70. */
    lightAngle?: number;
    /** Grain sprite size, 0.3..3. */
    grainSize?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor does: off, bows the plate edge, touches it with a finger, or taps it. */
    pointerMode?: 'none' | 'bow' | 'finger' | 'tap';
    /** Bow pressure / finger pressure / tap force (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Bow width / fingertip size / tap size, 0.2..3. */
    pointerRadius?: number;
    /** Rosin dust colour. */
    pointerColor?: string;
    /** Long exposure, migration paths or dust haze. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of grains that leave trails, 0.02..1. */
    trailShare?: number;
}

/** Faraday Powder — Glowing powder on an invisible vibrating plate: acoustic streaming gathers it into swirling heaps at the antinodes, hotter where the plate moves most; the cursor bows, touches or taps the plate. Use for abstract, sound and fire-like scenes. */
export interface FaradayPowderParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Powder particles (CPU simulated), 2000..40000. */
    particleCount?: number;
    /** Drive frequency (mode number): each value rings a different figure, 1.5..10. */
    frequency?: number;
    /** Slow glide of the drive frequency through neighbouring resonances (octaves; 0 = hold), 0..1. */
    sweep?: number;
    /** Resonance width: low = sharp, pure figures; high = blended figures, 0.01..0.3. */
    damping?: number;
    /** Drive strength: how hard the plate shakes the powder, 0..3. */
    amplitude?: number;
    /** Colour of powder churning in the strongest antinodes. */
    glowColor?: string;
    /** How high the heaps float above the plate, 0..3. */
    hover?: number;
    /** Spin of the heaps (acoustic streaming cells), 0..3. */
    swirl?: number;
    /** Powder puff size, 0.3..3. */
    puffSize?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor does: off, bows the plate edge, touches it with a finger, or taps it. */
    pointerMode?: 'none' | 'bow' | 'finger' | 'tap';
    /** Bow pressure / finger pressure / tap force (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Bow width / fingertip size / tap size, 0.2..3. */
    pointerRadius?: number;
    /** Rosin dust colour. */
    pointerColor?: string;
    /** Long exposure, swirl threads or smoke haze. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of powder that leaves trails, 0.02..1. */
    trailShare?: number;
}

/** Neon Rain — Night rain lit by neon: Marshall–Palmer drops at terminal velocity, gusting sheets, splash crowns and rim drips, each drop lit like a tiny lens; the cursor is an umbrella, a gust or a headlight. Use for city, noir and cinematic scenes. */
export interface NeonRainParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Raindrop pool (CPU simulated; splash droplets come on top), 1000..20000. */
    particleCount?: number;
    /** Rain rate in mm/h: more drops, and bigger ones, 1..80. */
    rainRate?: number;
    /** Breeze across the street in m/s (negative = from the other side), -6..6. */
    windSpeed?: number;
    /** Strength of the gust fronts that sweep sheets of rain through, 0..2. */
    gustiness?: number;
    /** Second neon light colour. */
    neonColor2?: string;
    /** Sodium streetlamp light from above. */
    lampColor?: string;
    /** Strength of the neon light falling on the rain (the lights themselves stay off-screen), 0..2. */
    neonLight?: number;
    /** Lens aperture: out-of-focus drops become bokeh discs (0 = pinhole), 0..2. */
    aperture?: number;
    /** Drop sprite size, 0.3..3. */
    dropSize?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor is: off, an umbrella, a gust of wind, or an oncoming headlight. */
    pointerMode?: 'none' | 'umbrella' | 'gust' | 'headlight';
    /** Umbrella size / gust force / headlight power (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Umbrella radius / gust size / beam width, 0.2..3. */
    pointerRadius?: number;
    /** Headlight colour, and the tint of canopy splashes. */
    pointerColor?: string;
    /** Shutter streaks, wet threads or splash afterglow. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Shutter: length of the streaks, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour trails cool toward. */
    trailColor?: string;
    /** Fraction of drops that leave trails, 0.02..1. */
    trailShare?: number;
}

/** Magnetic Bottle — Charged particles woven over any mesh shape: counter-rotating constant-bearing spirals that tighten into glowing tips, in two exact family colours; the cursor pinches, drifts or heats the orbits. Use for sci-fi and tech scenes. */
export interface MagneticBottleParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Particles on the surface (each draws one woven line), 4..200. */
    particleCount?: number;
    /** Mesh the orbits wind over (the mesh builder config: type + its parameters). */
    shape?: ParticleShapeConfig;
    /** Field strength: turns per unit climb (denser weave), 0.2..5. */
    windings?: number;
    /** Spread of pitch angles: how far up the shape the orbits reach before they mirror, 0..1. */
    pitchSpread?: number;
    /** Seconds a drawn line lingers, 0.5..20. */
    lineLife?: number;
    /** Points per unit of line, 0.3..3. */
    lineDensity?: number;
    /** Colour of the negative (counter-rotating) family. */
    counterColor?: string;
    /** Brightness of the mirror rings and heads, 0..3. */
    glow?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor is: off, a magnet (pinch), an electric field (drift) or an RF antenna (heat). */
    pointerMode?: 'none' | 'pinch' | 'drift' | 'heat';
    /** Field / drift / heating strength (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Reach of the cursor, 0.2..3. */
    pointerRadius?: number;
    /** Colour of heated particles. */
    pointerColor?: string;
    /** Motion blur, gyro tails or afterglow. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Trail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Trail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour the tails fade into, from the family colour at the head. */
    trailColor?: string;
    /** Fraction of particles that leave trails, 0.02..1. */
    trailShare?: number;
}

/** Shape Burst — Bursts of charged particles that spiral out in a magnetic field and land exactly on a mesh shape, white-hot cooling to two family colours, then dissolve; the cursor detonates, curls or pulls them. Use for reveals, logos and impact moments. */
export interface ShapeBurstParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Particles per burst, 60..3000. */
    particleCount?: number;
    /** Mesh the burst lands on (the mesh builder config: type + its parameters). */
    shape?: ParticleShapeConfig;
    /** Seconds between bursts, 0.6..8. */
    interval?: number;
    /** Drag rate: how fast the burst settles into the shape, 0.5..8. */
    formSpeed?: number;
    /** Magnetic field: how far the paths curl on the way out, 0..3. */
    fieldStrength?: number;
    /** Seconds the shape holds before it dissolves, 0..6. */
    holdTime?: number;
    /** Outward drift while the shape fades, 0..1. */
    dissolve?: number;
    /** Colour of the negative family once it has landed. */
    counterColor?: string;
    /** White-hot colour at launch. */
    heatColor?: string;
    /** Particle size, 0.2..3. */
    headSize?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor does: off, detonates bursts, curls them (magnet) or pulls them (gravity). */
    pointerMode?: 'none' | 'detonate' | 'magnet' | 'gravity';
    /** Burst size / field / pull (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Size of cursor bursts / reach of the field or pull, 0.2..3. */
    pointerRadius?: number;
    /** Glow of particles the cursor is acting on. */
    pointerColor?: string;
    /** Motion blur, spiral tails or embers. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Tail duration in seconds, 0.2..6. */
    trailLength?: number;
    /** Tail brightness, 0..1. */
    trailOpacity?: number;
    /** Colour the tails fade into. */
    trailColor?: string;
    /** Fraction of particles that leave tails, 0.02..1. */
    trailShare?: number;
}

/** Shape Flow — A wind tunnel of particle streams flowing round an invisible mesh shape: divergence-free flow, wake eddies, streaklines coloured by pressure; the cursor is a second obstacle, a jet or a vortex. Use for tech, aero and product scenes. */
export interface ShapeFlowParticlesConfig extends BaseGenerativeParticlesConfig {
    /** Tracer particles, 300..8000. */
    particleCount?: number;
    /** The invisible body in the wind (the mesh builder config: type + its parameters). */
    shape?: ParticleShapeConfig;
    /** Wind speed, 0..3. */
    flowSpeed?: number;
    /** Angle of the wind to the horizontal (degrees): the shape meets it tilted, -60..60. */
    windPitch?: number;
    /** Where the streams are released: a ring round the body, one vertical sheet, or a cross. */
    rake?: 'tube' | 'sheet' | 'cross';
    /** Number of stream lanes in the rake, 6..128. */
    lanes?: number;
    /** Size of the rake compared with the tunnel, 0.2..1. */
    streamWidth?: number;
    /** Strength of the wake eddies behind the shape, 0..2. */
    turbulence?: number;
    /** Colour of low pressure (fast flow round the sides). */
    fastColor?: string;
    /** Tracer size, 0.2..3. */
    headSize?: number;
    /** Layout seed: a different arrangement with the same character, 1..999. */
    seed?: number;
    /** Detail level: scales particle counts and trail caps. */
    quality?: 'low' | 'medium' | 'high';
    /** What the cursor is: off, a second obstacle, a jet or a vortex. */
    pointerMode?: 'none' | 'obstacle' | 'jet' | 'vortex';
    /** Obstacle size / jet force / vortex circulation (0 = no interaction), 0..3. */
    pointerStrength?: number;
    /** Reach of the cursor, 0.2..3. */
    pointerRadius?: number;
    /** Glow of tracers the cursor is acting on. */
    pointerColor?: string;
    /** Motion blur, streaklines or smoke. */
    trailMode?: 'none' | 'streak' | 'comet' | 'echo';
    /** Streakline length in seconds, 0.2..6. */
    trailLength?: number;
    /** Streakline brightness, 0..1. */
    trailOpacity?: number;
    /** Colour the streaklines fade into. */
    trailColor?: string;
    /** Fraction of tracers that leave streaklines, 0.02..1. */
    trailShare?: number;
}

export type GenerativeParticlesConfig = ({
    type: 'tidalStream';
} & TidalStreamParticlesConfig) | ({
    type: 'brownianDust';
} & BrownianDustParticlesConfig) | ({
    type: 'bioluminescentWake';
} & BioluminescentWakeParticlesConfig) | ({
    type: 'electronOrbitals';
} & ElectronOrbitalsParticlesConfig) | ({
    type: 'grinderSparks';
} & GrinderSparksParticlesConfig) | ({
    type: 'chladniSand';
} & ChladniSandParticlesConfig) | ({
    type: 'faradayPowder';
} & FaradayPowderParticlesConfig) | ({
    type: 'neonRain';
} & NeonRainParticlesConfig) | ({
    type: 'magneticBottle';
} & MagneticBottleParticlesConfig) | ({
    type: 'shapeBurst';
} & ShapeBurstParticlesConfig) | ({
    type: 'shapeFlow';
} & ShapeFlowParticlesConfig);

export interface GenerativeParticlesSettings {
    /** Scene object id (the controller's live-edit path finds the object by it). */
    id?: string;
    config: GenerativeParticlesConfig;
    /** Per-domain animations; the `particles` domain drives config knobs (intensity, pointerStrength, trailOpacity, ...). */
    animations?: ObjectAnimations;
}
