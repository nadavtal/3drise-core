/**
 * Config shapes for the volumetric cloud system that lives in this package.
 *
 * Declared locally rather than in `@3driseai/3drise-core`, alongside
 * `gridConfigs.ts`, because the materials and the renderer are here and nothing
 * outside the viewer needs to construct these by hand.
 *
 * A sky is a deck PLUS an optional ice layer, not one of four things — cirrus
 * coexists with every other type in nature and in the renderer. So a cloud
 * settings object carries two independent layer blocks.
 */

/** The three types the volumetric marcher renders. Cirrus has its own model. */
export type CloudDeckType = 'cumulus' | 'stratocumulus' | 'cumulonimbus';

/** Fields every deck shares, whatever its vertical profile. */
export interface CloudDeckSurfaceConfig {
    enabled: boolean;
    /** Fraction of sky the deck occupies. The threshold window slides and narrows,
     *  so 1.0 really is overcast rather than the ~0.5 a naive remap tops out at. */
    coverage: number;
    /** Multiplies the density field. Aim for optical depth 4-6 through a core;
     *  past ~10 the multi-scatter octaves stop lifting the interior and it muddies. */
    density: number;
    /** Blends the three archetypal vertical profiles: 0 stratus, 0.5 cumulus,
     *  1 cumulonimbus. The weather map biases it +/-0.15 per cell, so one sky
     *  holds a spread of shapes rather than one repeated silhouette. */
    profile: number;
    /** Cloud base, in world units. */
    baseAltitude: number;
    /** Cloud top. Also sets the march's fine step, which is derived from depth
     *  rather than from ray length — halving the depth roughly halves the cost. */
    topAltitude: number;
    /** Size of the primary cauliflower lobes, in world units. */
    featureSize: number;
    /** Size of the erosion detail that breaks up edges. Below ~2x the march step
     *  this beats against the sampling and the far field speckles. */
    detailSize: number;
    /** How deeply the detail volume eats into the base shape. */
    detailStrength: number;
    /** Divergence-free warp on the erosion, strongest at the base where a cloud
     *  shears out into wisps. */
    curlStrength: number;
    /** Size of the coverage cells that decide where clouds are at all. Too large
     *  and a whole viewport sits inside one cell. */
    weatherCellSize: number;
    /** Downwind displacement per unit height — tilts the column so the top leads
     *  the base, as it does under real shear. */
    shear: number;
    /** Lateral coverage growth above 70% height. Gated on profile, so a
     *  fair-weather cumulus can never grow an anvil. */
    anvil: number;
    /** Drops scattering albedo toward the base. Large rain drops absorb far more
     *  than small droplets, which is why a storm base is charcoal while its top
     *  is white — extinction alone will not do it. */
    precipitation: number;

    // ---- animation ----
    /** Wind bearing in degrees. Drives advection, shear and the cirrus streak axis. */
    windBearing: number;
    windSpeed: number;
    /** Vertical motion of the shape volume. Decoupling it from wind is what makes
     *  clouds boil rather than slide. */
    rise: number;
    /** Independent vertical motion of the erosion layer — the third timescale. */
    churn: number;
    /** Slow oscillation of the coverage threshold. Cells genuinely appear and
     *  dissipate rather than only drifting past. */
    evolution: number;

    // ---- scattering ----
    /** Extinction coefficient, per world unit. Physically ~0.045 for cloud, but a
     *  3-octave scattering approximation cannot carry that optical depth, so it is
     *  tuned down and density scaled up to match. */
    extinction: number;
    /** Anisotropy of the forward Henyey-Greenstein lobe. This is the silver lining. */
    forwardLobe: number;
    /** Anisotropy of the small backward lobe. The glow when the sun is behind you. */
    backLobe: number;
    /** Per-octave extinction / energy / anisotropy scale in the multiple-scattering
     *  approximation. Drop `msEnergy` to 0.15 and the cloud collapses to the flat
     *  black of a single-scatter implementation. */
    msExtinction: number;
    msEnergy: number;
    msPhase: number;
    /** Dark-edge term. Applied only when looking away from the sun, or it
     *  double-darkens the backlit rims that should be brightest. */
    powder: number;
    /** Extra forward-scatter boost near the sun disc, on top of the phase function. */
    silverLining: number;
    /** Weight of sky-above and ground-bounce fill. Too high and the cloud goes
     *  flat; too low and shadowed sides crush to black. */
    ambient: number;
    /** Rate at which distant cloud fades into the sky it is seen through. The main
     *  cue for how large the sky reads. */
    aerialPerspective: number;
}

/**
 * The deck, as the animation system sees it.
 *
 * `type` is 'clouds' — the OBJECT type — because that is the discriminant
 * getAnimatableProperties() and detectAnimatableDomain() route on, exactly like
 * light and rain configs. The meteorological model is `deckType`, which is what
 * CloudsGenerator switches on. Collapsing the two onto one field would make the
 * deck invisible to the keyframe and mouse-move panels.
 */
export type CloudDeckConfig = CloudDeckSurfaceConfig & {
    type: 'clouds';
    deckType: CloudDeckType;
    /** Name of the preset the numbers came from, or '' once any of them is edited.
     *  Purely a UI bookmark — the renderer never reads it. */
    preset?: string;
};

/**
 * High ice cloud. Not a volume: three samples through a thin slab, stretched hard
 * along the shear vector, lit by a near-pure forward lobe.
 */
export interface CirrusLayerConfig {
    enabled: boolean;
    altitude: number;
    thickness: number;
    coverage: number;
    /** Calibrated so 1.0 gives vertical optical depth around 0.5 — cirrus you can
     *  see the sun through, which is the point. */
    opticalDepth: number;
    featureSize: number;
    /** Compression along the wind axis. 1.0 gives round blobs; 0.1 gives the
     *  drawn-out fibratus streaks cirrus is recognised by. */
    anisotropy: number;
    windBearing: number;
    windSpeed: number;
    /** Refraction minimum of a 60-degree hexagonal ice prism, visible within a few
     *  degrees of 22 from the sun. The strongest single cue that this is ice. */
    halo: number;
    forwardLobe: number;
    secondaryLobe: number;
    ambient: number;
    aerialPerspective: number;
    /** Name of the preset the numbers came from, or '' once any of them is edited. */
    preset?: string;
}

/**
 * Lightning.
 *
 * Modelled as light emitted *inside* the volume, not as a screen flash: a bolt is a
 * point source buried in the deck, so the cloud around it lights from within and the
 * glow falls off both with distance and with the cloud it has to push through. That
 * is the whole difference between lightning and someone toggling the exposure.
 *
 * Cumulus and stratocumulus can carry it, but the defaults are tuned for a
 * cumulonimbus and it ships disabled — a thunderstorm over a fair-weather cumulus
 * field is wrong. Cirrus cannot: three samples through a thin ice slab is not a
 * volume, and there is nothing for a flash to scatter through.
 */
export interface ThunderConfig {
    enabled: boolean;
    /** Mean flashes per minute. Actual spacing is exponential around this, because
     *  storms do not fire on a metronome. */
    rate: number;
    /** Peak radiance of the bolt. */
    intensity: number;
    /** Bolt colour. Real lightning is a blue-tinged white from ionised nitrogen. */
    color: string;
    /** Softening radius of the inverse-square falloff, in metres. Larger reads as a
     *  sheet lighting a whole cell; smaller as a single localised strike. */
    radius: number;
    /** Sub-strokes per event. A real flash flickers 2-5 times over ~200 ms, and that
     *  flicker is most of what separates lightning from a light bulb. */
    strokes: number;
    /** Length of one sub-stroke, seconds. */
    strokeDuration: number;
    /** Multiplies extinction between bolt and sample — how far the glow pushes through
     *  cloud. Low values light the whole cell, high values keep it local to the bolt. */
    scatter: number;
    /** How much the rest of the scene brightens, 0..1. Zero lights only the cloud,
     *  which looks broken: a real flash lights the ground too. */
    sceneFlash: number;
    /** Where in the deck the bolt sits, 0 at the base and 1 at the top. Real strikes
     *  originate low, in the charge separation region. */
    originHeight: number;
    /** How far away lightning can strike, in metres. Bolts are placed where a ray
     *  through a random on-screen point meets the deck, so this caps the distance
     *  rather than scattering blindly around the origin. */
    spread: number;
}

/** Cost knobs. Shared by both layers, since they share the pipeline. */
export interface CloudsQualityConfig {
    /** Fraction of full resolution the march runs at. 0.5 is the sweet spot. */
    resolutionScale: number;
    /** History weight when the camera is still. Higher converges further, ghosts more. */
    temporalBlend: number;
    /** Sets the fine step as depth/steps*2. Empty space is skipped 2.8x coarser
     *  regardless, so this costs less than the number suggests. */
    steps: number;
    /** Samples toward the sun per shaded point, spread inside a cone so
     *  self-shadowing is soft rather than banded. */
    lightSteps: number;
    /** First shadow step as a fraction of cloud depth, growing 1.62x each sample.
     *  A fraction, not world units, so one value works for a shallow deck and a
     *  9 km tower alike. */
    lightStep: number;
    /** Step size as a fraction of distance — the actual meaning of "constant
     *  screen-space error". A near-horizontal ray can span a hundred kilometres
     *  inside the deck; a fixed step exhausts the budget and the deck stops along a
     *  straight line short of the horizon. */
    stepGrowth: number;
    /** Hard cap on how far one ray marches. Aerial perspective should hide the
     *  cut-off before it is reached. */
    maxSpan: number;
    /** Distance over which high-frequency erosion fades out. Removes far-field
     *  speckle and buys back most of its own cost. */
    detailFadeDistance: number;
    /** 1/(2R). Bends the ray so the deck meets a real horizon instead of running to
     *  infinity as a flat slab would. Zero gives a flat deck. */
    curvature: number;
    exposure: number;
    /** Set false when something downstream will tonemap instead. */
    tonemap: boolean;
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const deckBase: Omit<CloudDeckSurfaceConfig, 'enabled'> = {
    coverage: 0.52,
    density: 2.6,
    profile: 0.52,
    baseAltitude: 1500,
    topAltitude: 3400,
    featureSize: 2600,
    detailSize: 400,
    detailStrength: 0.5,
    curlStrength: 0.55,
    weatherCellSize: 24000,
    shear: 0.08,
    anvil: 0,
    precipitation: 0,
    windBearing: 78,
    windSpeed: 6,
    rise: 1.4,
    churn: 4.5,
    evolution: 0.45,
    extinction: 0.013,
    forwardLobe: 0.8,
    backLobe: 0.32,
    msExtinction: 0.55,
    msEnergy: 0.58,
    msPhase: 0.6,
    powder: 0.85,
    silverLining: 0.9,
    ambient: 1,
    aerialPerspective: 0.000026,
};

export const defaultCumulusConfig: CloudDeckConfig = {
    ...deckBase,
    type: 'clouds',
    deckType: 'cumulus',
    preset: '',
    enabled: true,
};

export const defaultStratocumulusConfig: CloudDeckConfig = {
    ...deckBase,
    type: 'clouds',
    deckType: 'stratocumulus',
    preset: '',
    enabled: true,
    coverage: 0.86,
    density: 4.5,
    profile: 0.22,
    baseAltitude: 900,
    topAltitude: 1700,
    featureSize: 2200,
    detailSize: 450,
    detailStrength: 0.36,
    curlStrength: 0.42,
    weatherCellSize: 17000,
    shear: 0.16,
    windSpeed: 9,
    rise: 0.6,
    churn: 2.2,
    evolution: 0.35,
    extinction: 0.017,
    forwardLobe: 0.72,
    powder: 1,
    silverLining: 0.5,
    ambient: 1.15,
    aerialPerspective: 0.000034,
};

export const defaultCumulonimbusConfig: CloudDeckConfig = {
    ...deckBase,
    type: 'clouds',
    deckType: 'cumulonimbus',
    preset: '',
    enabled: true,
    coverage: 0.52,
    density: 3.2,
    profile: 0.96,
    baseAltitude: 1100,
    topAltitude: 9500,
    featureSize: 5200,
    detailSize: 1200,
    curlStrength: 0.85,
    weatherCellSize: 46000,
    shear: 0.42,
    anvil: 0.95,
    precipitation: 0.75,
    windSpeed: 11,
    rise: 3.2,
    churn: 7,
    evolution: 0.55,
    extinction: 0.019,
    forwardLobe: 0.83,
    powder: 1.05,
    silverLining: 1.35,
    ambient: 0.85,
    aerialPerspective: 0.00002,
};

export const defaultCirrusConfig: CirrusLayerConfig = {
    preset: '',
    enabled: true,
    altitude: 8200,
    thickness: 700,
    coverage: 0.62,
    opticalDepth: 0.95,
    featureSize: 44000,
    anisotropy: 0.11,
    windBearing: 78,
    windSpeed: 16,
    halo: 1.1,
    forwardLobe: 0.9,
    secondaryLobe: 0.2,
    ambient: 1,
    aerialPerspective: 0.000026,
};

export const defaultThunderConfig: ThunderConfig = {
    enabled: false,
    rate: 8,
    intensity: 9,
    color: '#cfe0ff',
    radius: 900,
    strokes: 3,
    strokeDuration: 0.055,
    scatter: 0.35,
    sceneFlash: 0.55,
    originHeight: 0.35,
    spread: 40000,
};

export const defaultCloudsQuality: CloudsQualityConfig = {
    resolutionScale: 0.5,
    temporalBlend: 0.9,
    steps: 96,
    lightSteps: 6,
    lightStep: 0.024,
    stepGrowth: 0.0045,
    maxSpan: 120000,
    detailFadeDistance: 16000,
    curvature: 1 / (2 * 6371000),
    exposure: 1,
    tonemap: true,
};

/** Per-type deck defaults, for the controller's type switcher. */
export const CLOUD_DECK_DEFAULTS: Record<CloudDeckType, CloudDeckConfig> = {
    cumulus: defaultCumulusConfig,
    stratocumulus: defaultStratocumulusConfig,
    cumulonimbus: defaultCumulonimbusConfig,
};

// -----------------------------------------------------------------------------
// Property schema — presentation and agent metadata
// -----------------------------------------------------------------------------

export type CloudPropertyGroup =
    | 'shape'
    | 'animation'
    | 'scattering'
    | 'lighting'
    | 'quality';

/**
 * Everything the controller needs to build a row and everything the AI context
 * builder needs to know what a knob does and where it is safe. The runtime never
 * reads this — defaults live in the config objects above.
 */
export interface CloudPropertySchema {
    key: string;
    label: string;
    group: CloudPropertyGroup;
    /** Widget kind. Absent means a number, which almost everything is. */
    valueType?: 'number' | 'color';
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    description: string;
    advanced?: boolean;
    /** false = structural: set only (controllers, action patches), never driven per
     *  frame (timeline, mouse-move, AI clips). Absent = numbers / colours animate. */
    animatable?: boolean;
    /** Only show for these deck types. Absent means all. */
    types?: CloudDeckType[];
}

export const CLOUD_DECK_SCHEMA: CloudPropertySchema[] = [
    { key: 'coverage', label: 'Coverage', group: 'shape', min: 0, max: 1, step: 0.005, description: 'How much of the sky is filled with cloud. Low leaves scattered puffs, high closes it into solid overcast.' },
    { key: 'profile', label: 'Vertical profile', group: 'shape', min: 0, max: 1, step: 0.005, description: 'The overall shape, from flat sheets through classic puffy clouds to towering storm clouds.' },
    { key: 'density', label: 'Density', group: 'shape', min: 0, max: 9, step: 0.02, description: 'How thick and solid the cloud looks. Too high and it turns into a grey mass.' },
    { key: 'baseAltitude', animatable: false, label: 'Base altitude', group: 'shape', min: 200, max: 6000, step: 10, unit: 'm', description: 'How high the bottom of the clouds sits.' },
    { key: 'topAltitude', animatable: false, label: 'Top altitude', group: 'shape', min: 600, max: 14000, step: 10, unit: 'm', description: 'How high the tops reach. The gap between this and the base is how tall the clouds are.' },
    { key: 'featureSize', animatable: false, label: 'Feature size', group: 'shape', min: 600, max: 9000, step: 10, unit: 'm', description: 'How big individual clouds are. Small makes a busy sky of many clouds, large makes a few huge ones.' },
    { key: 'detailSize', animatable: false, label: 'Detail size', group: 'shape', min: 150, max: 2000, step: 10, unit: 'm', description: 'The size of the fine bumps and wisps on the cloud surface.' },
    { key: 'detailStrength', label: 'Detail erosion', group: 'shape', min: 0, max: 1, step: 0.005, description: 'How much the edges are eaten away into wisps. Low gives smooth blobs, high gives ragged, torn edges.' },
    { key: 'curlStrength', label: 'Curl warp', group: 'shape', min: 0, max: 2, step: 0.01, description: 'Adds a swirling twist to the wisps, like cloud caught in a breeze.' },
    { key: 'weatherCellSize', animatable: false, label: 'Weather cell size', group: 'shape', min: 4000, max: 90000, step: 250, unit: 'm', description: 'How large an area shares the same weather. Big values give one huge system, small gives patchy skies.' },
    { key: 'shear', label: 'Wind shear', group: 'shape', min: 0, max: 1.2, step: 0.005, description: 'Leans the clouds over as they rise, like wind pushing the tops sideways.' },
    { key: 'anvil', label: 'Anvil spread', group: 'shape', min: 0, max: 1, step: 0.01, types: ['cumulonimbus'], description: 'Spreads the top of a storm cloud out flat, the classic anvil shape. Storm clouds only.' },
    { key: 'precipitation', label: 'Precipitation', group: 'shape', min: 0, max: 1, step: 0.01, types: ['cumulonimbus'], description: 'Darkens the underside to a heavy rain-bearing grey. Storm clouds only.' },

    { key: 'windBearing', label: 'Wind bearing', group: 'animation', min: 0, max: 360, step: 1, unit: 'deg', description: 'The compass direction the clouds drift towards.' },
    { key: 'windSpeed', label: 'Wind speed', group: 'animation', min: 0, max: 40, step: 0.1, unit: 'm/s', description: 'How fast the clouds drift across the sky.' },
    { key: 'rise', label: 'Convective rise', group: 'animation', min: 0, max: 12, step: 0.05, unit: 'm/s', description: 'How fast the clouds boil upwards, as warm air lifts through them.' },
    { key: 'churn', label: 'Detail churn', group: 'animation', min: 0, max: 24, step: 0.1, unit: 'm/s', description: 'How quickly the fine surface detail shifts and bubbles.' },
    { key: 'evolution', label: 'Formation / decay', group: 'animation', min: 0, max: 1, step: 0.01, description: 'How fast clouds form and fade away over time. Zero freezes the sky.' },

    { key: 'extinction', label: 'Extinction', group: 'scattering', min: 0.002, max: 0.06, step: 0.0005, unit: '1/m', description: 'How much light the cloud blocks. Higher makes it more opaque and its shadows deeper.' },
    { key: 'forwardLobe', label: 'Forward lobe', group: 'scattering', min: 0, max: 0.97, step: 0.005, description: 'The bright halo when you look towards the sun through cloud.' },
    { key: 'backLobe', label: 'Back lobe', group: 'scattering', min: 0, max: 0.9, step: 0.005, description: 'A soft glow when the sun is behind you.' },
    { key: 'msExtinction', label: 'MS extinction decay', group: 'scattering', min: 0.1, max: 0.95, step: 0.005, advanced: true, description: 'Fine tuning for how deep light reaches into the cloud. Lower brightens the interior.' },
    { key: 'msEnergy', label: 'MS energy decay', group: 'scattering', min: 0.1, max: 0.95, step: 0.005, advanced: true, description: 'Fine tuning for how much bounced light survives. Higher lifts the shadowed side.' },
    { key: 'msPhase', label: 'MS phase decay', group: 'scattering', min: 0.1, max: 0.95, step: 0.005, advanced: true, description: 'Fine tuning for how the glow spreads as light bounces around inside.' },
    { key: 'powder', label: 'Powder', group: 'scattering', min: 0, max: 1.5, step: 0.01, description: 'Darkens the edges facing away from the sun, which gives clouds their sense of bulk.' },
    { key: 'silverLining', label: 'Silver lining', group: 'scattering', min: 0, max: 4, step: 0.01, description: 'The bright rim on a cloud with the sun directly behind it.' },
    { key: 'ambient', label: 'Ambient', group: 'scattering', min: 0, max: 3, step: 0.01, description: 'How much light the cloud picks up from the sky and ground around it. Lifts the shadows.' },
    { key: 'aerialPerspective', label: 'Aerial perspective', group: 'lighting', min: 0, max: 0.00012, step: 0.000001, unit: '1/m', description: 'How quickly distant clouds fade into the haze.' },
];

export const CIRRUS_SCHEMA: CloudPropertySchema[] = [
    { key: 'altitude', animatable: false, label: 'Altitude', group: 'shape', min: 4000, max: 14000, step: 50, unit: 'm', description: 'How high the ice sheet floats. Real cirrus sits far above ordinary cloud.' },
    { key: 'thickness', animatable: false, label: 'Thickness', group: 'shape', min: 100, max: 2500, step: 25, unit: 'm', description: 'How deep the ice layer is.' },
    { key: 'coverage', label: 'Coverage', group: 'shape', min: 0, max: 1, step: 0.005, description: 'How much of the sky is filled with cloud. Low leaves scattered puffs, high closes it into solid overcast.' },
    { key: 'opticalDepth', label: 'Optical depth', group: 'shape', min: 0, max: 2, step: 0.01, description: 'How solid the ice looks. Keep it low — you should be able to see the sun through cirrus.' },
    { key: 'featureSize', animatable: false, label: 'Feature size', group: 'shape', min: 8000, max: 120000, step: 500, unit: 'm', description: 'How big individual clouds are. Small makes a busy sky of many clouds, large makes a few huge ones.' },
    { key: 'anisotropy', label: 'Anisotropy', group: 'shape', min: 0.03, max: 1, step: 0.005, description: 'How stretched the streaks are. Low gives long drawn-out fibres, high gives rounder patches.' },
    { key: 'windBearing', label: 'Wind bearing', group: 'animation', min: 0, max: 360, step: 1, unit: 'deg', description: 'The compass direction the clouds drift towards.' },
    { key: 'windSpeed', label: 'Drift speed', group: 'animation', min: 0, max: 60, step: 0.5, unit: 'm/s', description: 'How fast the clouds drift across the sky.' },
    { key: 'halo', label: '22 degree halo', group: 'lighting', min: 0, max: 2, step: 0.01, description: 'The ring of light that appears around the sun when it shines through ice crystals.' },
    { key: 'forwardLobe', label: 'Forward lobe', group: 'scattering', min: 0, max: 0.97, step: 0.005, description: 'The bright halo when you look towards the sun through cloud.' },
    { key: 'secondaryLobe', label: 'Secondary lobe', group: 'scattering', min: 0, max: 0.9, step: 0.005, description: 'Widens the glow around the sun rather than adding brightness behind you.' },
    { key: 'ambient', label: 'Ambient', group: 'scattering', min: 0, max: 3, step: 0.01, description: 'How much light the cloud picks up from the sky and ground around it. Lifts the shadows.' },
    { key: 'aerialPerspective', label: 'Aerial perspective', group: 'lighting', min: 0, max: 0.00012, step: 0.000001, unit: '1/m', description: 'How quickly distant clouds fade into the haze.' },
];

export const THUNDER_SCHEMA: CloudPropertySchema[] = [
    { key: 'rate', label: 'Flash rate', group: 'animation', min: 0.5, max: 60, step: 0.5, unit: '/min', description: 'How often lightning strikes, in flashes per minute.' },
    { key: 'intensity', label: 'Intensity', group: 'lighting', min: 0, max: 40, step: 0.1, description: 'How bright each flash is.' },
    { key: 'color', label: 'Bolt colour', group: 'lighting', valueType: 'color', description: 'The colour of the lightning. Real bolts are a cold blue-white.' },
    { key: 'radius', label: 'Glow radius', group: 'lighting', min: 100, max: 6000, step: 25, unit: 'm', description: 'How wide the glow spreads from the bolt. Large lights up a whole cloud, small keeps it to one spot.' },
    { key: 'scatter', label: 'Scatter depth', group: 'scattering', min: 0, max: 2, step: 0.01, description: 'How deep the light pushes through the cloud. Low lights the whole cloud, high keeps a tight bright core.' },
    { key: 'strokes', label: 'Strokes', group: 'animation', min: 1, max: 6, step: 1, description: 'How many times each bolt flickers. Real lightning stutters two to five times rather than flashing once.' },
    { key: 'strokeDuration', label: 'Stroke length', group: 'animation', min: 0.01, max: 0.3, step: 0.005, unit: 's', description: 'How long each flicker lasts. Longer stops feeling electric.' },
    { key: 'sceneFlash', label: 'Scene flash', group: 'lighting', min: 0, max: 1, step: 0.01, description: 'How much the rest of the scene lights up. At zero only the cloud flashes, which looks wrong.' },
    { key: 'originHeight', label: 'Origin height', group: 'shape', min: 0, max: 1, step: 0.01, description: 'How high up in the cloud the bolt sits. Low is where real lightning starts.' },
    { key: 'spread', label: 'Spread', group: 'shape', min: 500, max: 40000, step: 100, unit: 'm', description: 'How far away lightning can strike. Bolts always appear somewhere you can see.' },
];

export const CLOUD_QUALITY_SCHEMA: CloudPropertySchema[] = [
    { key: 'resolutionScale', label: 'Render scale', group: 'quality', min: 0.25, max: 1, step: 0.05, description: 'How sharply the clouds are drawn. Lower is faster but softer. 0.5 is the sweet spot.' },
    { key: 'temporalBlend', label: 'Temporal blend', group: 'quality', min: 0, max: 0.97, step: 0.005, description: 'Smooths the clouds by blending with the previous frame. Higher is cleaner but can smear when you move.' },
    { key: 'steps', label: 'Step budget', group: 'quality', min: 24, max: 176, step: 1, description: 'How carefully the clouds are traced. Higher looks better and costs more.' },
    { key: 'lightSteps', label: 'Light steps', group: 'quality', min: 2, max: 6, step: 1, advanced: true, description: 'How carefully shadows inside the cloud are worked out. Lower flattens them.' },
    { key: 'lightStep', label: 'Light step', group: 'quality', min: 0.004, max: 0.09, step: 0.001, advanced: true, description: 'How far apart those shadow checks are spread through the cloud.' },
    { key: 'stepGrowth', label: 'Distance step scale', group: 'quality', min: 0.0005, max: 0.03, step: 0.0005, advanced: true, description: 'Lets distant clouds be traced more coarsely, since they cover fewer pixels anyway.' },
    { key: 'maxSpan', label: 'Max march span', group: 'quality', min: 4000, max: 250000, step: 1000, unit: 'm', description: 'How far into the distance clouds are still drawn.' },
    { key: 'detailFadeDistance', label: 'Detail fade distance', group: 'quality', min: 2000, max: 80000, step: 500, unit: 'm', description: 'How far away clouds keep their fine detail before smoothing out.' },
    { key: 'curvature', label: 'Planetary curvature', group: 'quality', min: 0, max: 0.0000005, step: 0.00000001, advanced: true, description: 'Bends the cloud layer with the curve of the earth so it meets a real horizon.' },
    { key: 'exposure', label: 'Exposure', group: 'quality', min: 0.2, max: 4, step: 0.01, description: 'Overall brightness of the clouds.' },
];

// -----------------------------------------------------------------------------
// Settings — the object the environment slice stores and the panel edits
// -----------------------------------------------------------------------------

import type { ObjectAnimations, MouseMoveInteractions } from '../types/objectSettings';

/**
 * A sky, as stored. Two independent layers, because that is what a sky is:
 * a deck, and an ice layer that coexists with any deck.
 *
 * There is deliberately no `meshSettings` and no `materialSettings`. A layer has
 * no transform — altitude and thickness are config, not position — and its
 * material is not swappable, so the Transform and Material tabs do not apply.
 * `animations` and `mouseMove` reuse the existing `clouds` domain, so
 * AminationsPanel and MouseMoveManagerPanel work unchanged.
 */
export interface VolumetricCloudsSettings {
    id: string;
    type: 'clouds';
    /** The convective / stratiform deck. Named `config` because that is where the
     *  animation and mouse-move systems look for an object's animatable domain. */
    config: CloudDeckConfig;
    /** High ice layer. Independent — it sits above whatever the deck is doing. */
    cirrus: CirrusLayerConfig;
    thunder: ThunderConfig;
    quality: CloudsQualityConfig;
    /** Per-domain keyframe animations; the `clouds` domain drives deck properties. */
    animations?: ObjectAnimations;
    /** Per-domain mouse-move interactions; same `clouds` domain. */
    mouseMove?: MouseMoveInteractions;
}

export const defaultVolumetricCloudsSettings: VolumetricCloudsSettings = {
    id: '3drise-clouds',
    type: 'clouds',
    config: { ...defaultCumulusConfig, enabled: false },
    cirrus: { ...defaultCirrusConfig, enabled: false },
    thunder: { ...defaultThunderConfig },
    quality: { ...defaultCloudsQuality },
};

/**
 * Deck properties the `clouds` animation and mouse-move domains may target.
 * Everything here is a scalar that can be interpolated per frame without
 * rebuilding anything — altitudes and feature sizes are deliberately excluded,
 * since changing them mid-animation restretches the whole density field.
 */
export const CLOUD_ANIMATABLE_PROPERTIES = [
    'coverage',
    'density',
    'profile',
    'detailStrength',
    'curlStrength',
    'shear',
    'anvil',
    'precipitation',
    'windBearing',
    'windSpeed',
    'rise',
    'churn',
    'evolution',
    'extinction',
    'powder',
    'silverLining',
    'ambient',
    'forwardLobe',
    'backLobe',
    'aerialPerspective',
] as const;

export type CloudAnimatableProperty = (typeof CLOUD_ANIMATABLE_PROPERTIES)[number];

// =============================================================================
// Normalisation
// =============================================================================
//
// A published scene loads whatever was in the database the day it was saved, and
// a scene saved a year ago will not have the knobs added since. Reading those
// straight into the renderer is how an embed dies: VolumetricCloudsPass sizes its
// half-res targets from `quality.resolutionScale` on its first frame, so a blob
// with no `quality` block throws before anything is drawn.
//
// So every entry point normalises. Each block is merged over its defaults
// separately, which matters as much as the merge itself: the pass keys its
// temporal accumulation off the identity of the deck config, so folding all three
// blocks through one object would restart the cloud history every time somebody
// nudged a cirrus slider.

const DECK_TYPES: readonly CloudDeckType[] = ['cumulus', 'stratocumulus', 'cumulonimbus'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

/** Deck block merged over its type's defaults. Returns null when there is no deck
 *  to render — including the retired flat CloudsSettings shape, which has no
 *  `config` and should draw nothing rather than half a sky. */
export function normalizeCloudDeck(raw: unknown): CloudDeckConfig | null {
    if (!isRecord(raw)) return null;
    // An unknown or missing deckType falls back rather than rendering nothing: a
    // scene that says `enabled: true` should show a sky, and stratocumulus is the
    // least surprising thing to show.
    const deckType = DECK_TYPES.includes(raw.deckType as CloudDeckType)
        ? (raw.deckType as CloudDeckType)
        : 'stratocumulus';
    return {
        ...CLOUD_DECK_DEFAULTS[deckType],
        ...(raw as Partial<CloudDeckConfig>),
        type: 'clouds',
        deckType,
    };
}

/** Cirrus block merged over its defaults, or null when the scene has no cirrus
 *  block at all. Null rather than the defaults, because `defaultCirrusConfig` is
 *  enabled: a project saved before this layer existed must not gain an ice sheet
 *  it was never authored with. A block that exists but omits `enabled` is a
 *  deliberate one and takes the default. */
export function normalizeCirrus(raw: unknown): CirrusLayerConfig | null {
    if (!isRecord(raw)) return null;
    return { ...defaultCirrusConfig, ...(raw as Partial<CirrusLayerConfig>) };
}

/** Thunder merged over defaults. Unlike cirrus this returns a config even when the
 *  block is absent, because the default is `enabled: false` — nothing appears, and a
 *  scene saved before thunder existed simply has it switched off. */
export function normalizeThunder(raw: unknown): ThunderConfig {
    return { ...defaultThunderConfig, ...(isRecord(raw) ? (raw as Partial<ThunderConfig>) : {}) };
}

/**
 * A complete settings object from whatever was saved.
 *
 * Use this at the boundary where a stored blob enters the app — the Redux reducer,
 * a project load — so that everything downstream can read `settings.thunder.enabled`
 * without a guard. The per-block normalisers above are for the renderer, which can
 * meaningfully treat an absent block as "draw nothing"; the settings panel cannot,
 * because it has to render a control for it either way.
 *
 * A missing deck becomes a disabled one rather than null, which renders the same
 * nothing while still giving the panel an object to bind to.
 */
export function normalizeVolumetricClouds(raw: unknown): VolumetricCloudsSettings {
    const r = (isRecord(raw) ? raw : {}) as Partial<VolumetricCloudsSettings>;
    return {
        id: typeof r.id === 'string' && r.id ? r.id : defaultVolumetricCloudsSettings.id,
        type: 'clouds',
        config: normalizeCloudDeck(r.config) ?? { ...defaultCumulusConfig, enabled: false },
        cirrus: normalizeCirrus(r.cirrus) ?? { ...defaultCirrusConfig, enabled: false },
        thunder: normalizeThunder(r.thunder),
        quality: normalizeCloudQuality(r.quality),
        animations: r.animations,
        mouseMove: r.mouseMove,
    };
}

export function normalizeCloudQuality(raw: unknown): CloudsQualityConfig {
    return { ...defaultCloudsQuality, ...(isRecord(raw) ? (raw as Partial<CloudsQualityConfig>) : {}) };
}
