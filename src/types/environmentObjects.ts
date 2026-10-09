// =============================================================================
// ENVIRONMENT OBJECTS — world-scale weather / atmosphere that fills a volume
// =============================================================================
//
// Object type 'environment'; config.type picks the variant. The volume is the
// object's transform: x / z span the scale, y rises from the object's origin
// (the ground) to scale.y. Knobs describe the weather, never the box.
// Generated from Claude outputs/environment-lab (gen_family.mjs).
//

export type EnvironmentObjectType = 'snow' | 'sandstorm' | 'rainbow' | 'tornado' | 'thunderstorm' | 'rain';

export type EnvironmentQuality = 'low' | 'medium' | 'high';

export interface BaseEnvironmentObjectConfig {
    enabled: boolean;
    intensity: number;
    /** Time scale of the whole phenomenon (integrated, so animating it never jumps). */
    speed: number;
    color: string;
    opacity: number;
    /** How much of it there is (structural: rebuilds). */
    density: number;
    /** Detail level, scales counts and volume samples (structural). */
    quality: EnvironmentQuality;
    /** Random layout (structural). */
    seed: number;
    /** Wrap the volume around the camera instead of the object's box (in the shader; the object never moves). */
    followCamera?: boolean;
    /** Mean wind, 0..1 (Rain's range; 1 = 8 m/s). */
    windStrength?: number;
    /** Compass direction the wind blows toward, degrees. */
    windDirection?: number;
    /** Eddies on top of the wind, 0..1. */
    turbulence?: number;
    /** What the cursor is; 'none' = off. */
    pointerMode: string;
    pointerStrength: number;
    pointerRadius: number;
    pointerColor: string;
    /** Shade / storm-light colour. */
    shadeColor: string;
}

export interface SnowEnvironmentConfig extends BaseEnvironmentObjectConfig {
    pointerMode: 'none' | 'gust' | 'shelter' | 'warmth';
    /** Mean flake diameter; bigger flakes fall faster (0.01..0.12 m). */
    flakeSize: number;
    /** Side-to-side spiral of the falling flakes (0..1). */
    flutter: number;
    /** How much the crystals rock and flip as they fall (0..1). */
    tumble: number;
    /** Sparkle of sunlight off the tumbling crystals (0..2). */
    glint: number;
    /** Strength of the gust waves that sweep downwind (0..1). */
    gustiness: number;
    /** How strongly the gusts gather the snow into sweeping curtains (0..1). */
    bands: number;
    /** Sky-lit shade on the side away from the sun. */
    shadeColor: string;
}

export interface SandstormEnvironmentConfig extends BaseEnvironmentObjectConfig {
    pointerMode: 'none' | 'windbreak' | 'devil' | 'gust';
    /** Scale height of the dust, as a share of the volume height (0.05..1). */
    height: number;
    /** Strength of the gust fronts: towering walls of dust rolling downwind (0..1). */
    walls: number;
    /** Fine dust hanging everywhere between the walls (0..1). */
    haze: number;
    /** Sand grains hopping along the ground (0..2). */
    grains: number;
    /** Size and hop length of the grains (0.3..3). */
    grainSize: number;
    /** Sky-lit colour of the dust in shadow. */
    shadeColor: string;
}

/** A single rainbow on its own, seen through the object's volume. Its own small knob set: no weather around it (the shower is the mist object). */
export interface RainbowEnvironmentConfig {
    enabled: boolean;
    pointerMode: 'none' | 'spray' | 'clear' | 'polarizer';
    /** Brightness of the bow (0..2). */
    intensity: number;
    /** Overall opacity (0..1). */
    opacity: number;
    /** Raindrop diameter: big drops give a narrow, vivid bow; small ones pale fringes inside it; fog drops a white fogbow (0.03..3 mm). */
    dropSize: number;
    /** Strength of the secondary bow outside the primary (reversed colours, ~51°); 0 = a single rainbow (0..1). */
    secondary: number;
    /** Tint of the bow (white = the pure spectrum). */
    color: string;
    /** Brightness of the sprayed stretch, depth of the clearing, strength of the filter (0..3). */
    pointerStrength: number;
    /** Reach of the spray or clearing (1 = 6 m) (0.2..3). */
    pointerRadius: number;
    /** Tint of the bow in the sprayed mist. */
    pointerColor: string;
}

export interface TornadoEnvironmentConfig extends BaseEnvironmentObjectConfig {
    pointerMode: 'none' | 'steer' | 'feed' | 'gust';
    /** Spin rate of the vortex (0..3). */
    rotation: number;
    /** Radius of the core, and so the width of the funnel (0.3..3). */
    coreRadius: number;
    /** How far down the condensation funnel reaches (1 = touchdown) (0..1). */
    reach: number;
    /** How much the axis wanders and bends like a rope (0..1). */
    wander: number;
    /** Updraft: how fast the streaks and dust climb (0..3). */
    lift: number;
    /** Ground dust drawn in and swirled up around the funnel (0..2). */
    dust: number;
    /** How far out the dust swirls (0.2..3). */
    dustSpread: number;
    /** Storm-light colour in shadow. */
    shadeColor: string;
    /** Colour of the swirling dust. */
    dustColor: string;
}

export interface ThunderstormEnvironmentConfig extends BaseEnvironmentObjectConfig {
    pointerMode: 'none' | 'strike' | 'clear';
    /** Visibility of the dark storm curtains (0..1). */
    shafts: number;
    /** Lightning flashes per minute (random intervals) (0..30). */
    flashRate: number;
    /** Brightness of a flash, on the curtains and on the scene (0..3). */
    flashIntensity: number;
    /** Storm-dark tint of the curtains. */
    shadeColor: string;
    /** Colour of the lightning. */
    flashColor: string;
}

/** Rain: streaks falling through the object's volume at a steady rate, carried by the wind and scattered by turbulence. Its own small knob set (no pointer modes, quality or seed). */
export interface RainEnvironmentConfig {
    enabled: boolean;
    /** Colour of the drops. */
    color: string;
    /** Streak size (0.01..1). */
    size: number;
    /** Opacity of the drops (0..1). */
    opacity: number;
    /** Fall speed multiplier (0.1..5; 1 = 60 m/s across the volume's own metres). */
    speed: number;
    /** Drops in the volume, in hundreds (1..200; rebuilds). */
    density: number;
    /** Sideways push of the wind (0..1). */
    windStrength: number;
    /** Compass direction the wind blows toward (0..360°). */
    windDirection: number;
    /** Random sway of the drops (0..1). */
    turbulence: number;
}

export type EnvironmentObjectConfig =
    | ({ type: 'snow' } & SnowEnvironmentConfig)
    | ({ type: 'sandstorm' } & SandstormEnvironmentConfig)
    | ({ type: 'rainbow' } & RainbowEnvironmentConfig)
    | ({ type: 'tornado' } & TornadoEnvironmentConfig)
    | ({ type: 'thunderstorm' } & ThunderstormEnvironmentConfig)
    | ({ type: 'rain' } & RainEnvironmentConfig);
