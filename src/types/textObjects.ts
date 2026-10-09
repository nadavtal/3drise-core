// =============================================================================
// TEXT OBJECTS — animated text looks (object type 'text', config.type picks the look)
// =============================================================================
//
// Object type 'text' also hosts the legacy bitmap / 3D text (config.renderMode, no config.type). The looks
// here are told apart by config.type (isTextObjectConfig): handwriting, neonTube, fourierSketch, frostGrowth, plasmaDischarge, burnAway, lightPainting, constellation, inkBleed, liquidMetal, embroidery, chalkboard.
// Rendered by TextGenerator.tsx. Every look shares one font list, one set of draw / erase animations and
// one playback model; only the look knobs differ. Everything is internal: moving, turning or scaling the
// text is the parent's transform.
//
// The text is a constant running object (idle effects run on real time). `enabled` is the trigger:
// false -> true plays the draw animation, true -> false plays the erase animation and the text stays hidden.
//

export type TextObjectType = 'handwriting' | 'neonTube' | 'fourierSketch' | 'frostGrowth' | 'plasmaDischarge' | 'burnAway' | 'lightPainting' | 'constellation' | 'inkBleed' | 'liquidMetal' | 'embroidery' | 'chalkboard';

export type TextDrawMethod = 'pen' | 'trace' | 'epicycle' | 'bothEnds' | 'wipe' | 'radial' | 'scatter' | 'dissolve' | 'fade' | 'none'
    // look-native draw methods
    | 'stitch' | 'grow' | 'flow' | 'strike';
export type TextEraseMethod = 'fade' | 'undraw' | 'wipe' | 'radial' | 'scatter' | 'dissolve' | 'trace' | 'bothEnds' | 'pen' | 'cut' | 'none'
    // look-native erase methods
    | 'burn' | 'smudge' | 'sublimate' | 'unpick' | 'melt' | 'beads';
export type TextEase = 'easeInOut' | 'linear' | 'easeOut' | 'easeIn';

export interface BaseTextObjectConfig {
    /** The trigger: on plays the draw animation, off plays the erase animation and keeps the text hidden. */
    enabled: boolean;
    /** The words; a new line starts a second line (structural: rebuilds). */
    text: string;
    /** Typeface id (TEXT_FONTS); shared by every look (structural: rebuilds). */
    font: string;
    /** How the text appears (structural: rebuilds). */
    drawMethod: TextDrawMethod;
    drawDuration: number;
    drawEase: TextEase;
    /** Letter stagger of Trace and Both ends, 0..0.95 (structural). */
    drawStagger: number;
    /** Direction of the Wipe sweep in degrees (structural). */
    drawAngle: number;
    /** How the text disappears (structural: rebuilds). */
    eraseMethod: TextEraseMethod;
    eraseDuration: number;
    eraseEase: TextEase;
    eraseStagger: number;
    eraseAngle: number;
    /** Play the draw animation when the scene starts. */
    autoPlay: boolean;
    /** Repeat hidden, draw, hold, erase, hidden. */
    loop: boolean;
    /** Play the whole cycle forward, then backward. */
    yoyo: boolean;
    /** Seconds the finished text stays before it is erased (loop). */
    holdTime: number;
    /** Seconds with nothing shown between cycles (loop). */
    hiddenTime: number;
}

/** A pen writes the text in single strokes, slowing in tight curves where the ink pools and drying from wet sheen to rest colour; a faint sheen drifts over the dry ink. */
export interface HandwritingTextConfig extends BaseTextObjectConfig {
    /** Thickness of the pen line. */
    weight: number;
    /** Colour of the dry ink. */
    color: string;
    /** Colour of the ink while it is still wet. */
    color2: string;
    /** How long the ink takes to dry. */
    wetTime: number;
    /** A faint glint that drifts over the dry ink. */
    sheen: number;
    /** Glow at the pen tip while writing. */
    penGlow: number;
    /** Overall opacity. */
    opacity: number;
}

/** Letter outlines as glass neon tubing: a gas discharge ignites each contour, stuttering before it settles into a steady hum with slow breathing and the odd micro-dip. */
export interface NeonTubeTextConfig extends BaseTextObjectConfig {
    /** Colour of the glowing gas. */
    color: string;
    /** Strength of the halo. */
    glow: number;
    /** Thickness of the glass tube. */
    tube: number;
    /** Stutter on ignition, mains hum and the odd micro-dip. */
    flicker: number;
    /** Colour of the hot core. */
    color2: string;
    /** Width of the bright core. */
    core: number;
    /** How visible the tube is before it ignites. */
    offLevel: number;
    /** Overall opacity. */
    opacity: number;
}

/** Each letter is traced by a chain of rotating circles whose radii are its Fourier coefficients; more terms sharpen the form, and glints keep circling the finished contours. */
export interface FourierSketchTextConfig extends BaseTextObjectConfig {
    /** Colour of the traced letters. */
    color: string;
    /** Number of circles per letter: more is sharper (structural: rebuilds). */
    terms: number;
    /** How visible the rotating circles are while drawing. */
    circles: number;
    /** Glints that keep circling the finished letters. */
    glint: number;
    /** Colour of fresh strokes and glints. */
    color2: string;
    /** Thickness of the traced line. */
    line: number;
    /** How long fresh strokes stay hot. */
    trail: number;
    /** Visibility of the lines joining outlines to counters. */
    bridges: number;
    /** Overall opacity. */
    opacity: number;
}

/** Dendritic hoarfrost nucleates in competing crystal grains on the letter outlines, each with its own six-fold lattice and bright boundary seams, then throws prismatic glints. */
export interface FrostGrowthTextConfig extends BaseTextObjectConfig {
    /** How far the frost spreads from the letters (structural: rebuilds). */
    reach: number;
    /** Side-branch density of the ice ferns (structural: rebuilds). */
    branching: number;
    /** Number of crystal grains; each has its own lattice orientation (structural: rebuilds). */
    grains: number;
    /** Sharp glints travelling over the crystal facets. */
    sparkle: number;
    /** Thickness of the ice arms. */
    thickness: number;
    /** Brightness of the boundary lines where grains meet. */
    seams: number;
    /** Soft frosted glow around the ice. */
    haze: number;
    /** Pale colour of thin edges and tips. */
    color: string;
    /** Cooler deeper tone of thick spines. */
    color2: string;
    /** Overall opacity. */
    opacity: number;
    /** Random seed of the crystal pattern (structural: rebuilds). */
    seed: number;
}

/** Electrical breakdown along the letter contours: a white-hot arc channel with a violet halo, fractal streamers forking outward, current pulses and breathing branches. */
export interface PlasmaDischargeTextConfig extends BaseTextObjectConfig {
    /** How many streamers fork off the letters. */
    branches: number;
    /** How far the streamers reach from the letters. */
    reach: number;
    /** Low: straight streamers that follow the field closely. High: wandering, bushy, more forks (structural: rebuilds). */
    branchiness: number;
    /** Brightness and size of the plasma halo. */
    glow: number;
    /** Strength of the current pulses travelling along the channels. */
    pulse: number;
    /** Orange-red atomic-line tinge in the hottest channel and the faint recombination afterglow. */
    spectrum: number;
    /** Thickness of the white-hot arc core. */
    core: number;
    /** Colour of the plasma halo and cooling channels. */
    color: string;
    /** Colour of the hottest, freshly struck channel. */
    color2: string;
    /** Overall opacity. */
    opacity: number;
    /** Different streamer layout (structural: rebuilds). */
    seed: number;
}

/** Letters cut from singed cream paper with smouldering embers; the erase is a combustion front travelling along the strokes leaving glowing edge, cracked char and ash. */
export interface BurnAwayTextConfig extends BaseTextObjectConfig {
    /** How much cracked char and ash is left behind the fire (0 = clean burn). */
    char: number;
    /** Speed of the fire front; faster fronts leave their remains lingering longer. */
    spread: number;
    /** Brightness and size of the embers, sparks and the glowing front. */
    ember: number;
    /** Colour of the paper. */
    color: string;
    /** Hue of the glowing embers (tints the blackbody ramp). */
    color2: string;
    /** How unevenly the fire spreads and how ragged the front is. */
    roughness: number;
    /** Width and depth of the scorched brown rim at rest. */
    singe: number;
    /** How much of the writing stays as a fragile ash skeleton before it flakes away. */
    ashLace: number;
    /** How strongly the charring paper edge curls up toward the viewer. */
    curl: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the fire starts and how it spreads (structural: rebuilds). */
    seed: number;
}

/** A long-exposure photograph of a handheld light writing in the dark: trail brightness follows 1/pen speed, colour cools from hot to warm, and a sparkler throws ballistic sparks. */
export interface LightPaintingTextConfig extends BaseTextObjectConfig {
    /** How long the shutter stayed open: trail brightness, bleaching towards white and persistence. */
    exposure: number;
    /** Colour temperature of the light source: low is ember red, high is cold white. Fresh trail is hotter and cools to this. */
    temperature: number;
    /** The light pulses while writing: the trail becomes dots whose spacing shows pen speed (dense where slow). 0 is continuous. */
    strobe: number;
    /** Sparkler mode: sparks thrown per second by the pen tip while writing. 0 is a plain LED torch. */
    sparks: number;
    /** Width of the light trail (the source image on the sensor). */
    width: number;
    /** Film halation: a wide dim red-orange glow bleeding around the brightest exposure. */
    halation: number;
    /** Physiological 8-12 Hz tremor of the hand: a faint fine ripple on the lines, smaller where the pen is slow (structural: rebuilds). */
    tremor: number;
    /** How violently the sparks are thrown out; low sparks drip, high sparks fan out wide. */
    spread: number;
    /** Lens bloom and thin streak cross on the glowing pen tip. */
    bloom: number;
    /** Resting colour of the trail (gel over the source), balanced by the temperature. */
    color: string;
    /** Colour of the fresh, hot trail and the tip. */
    color2: string;
    /** Overall opacity of the light. */
    opacity: number;
}

/** Pen strokes become a planetarium star plate: blackbody-coloured stars with Kepler binaries, tapered chart lines and faint dust stars. */
export interface ConstellationTextConfig extends BaseTextObjectConfig {
    /** Stars per em of pen stroke (density along the figure) (structural: rebuilds). */
    stars: number;
    /** Limiting magnitude shift: brighter, larger stars and more of the faint dust show. */
    brightness: number;
    /** Shifts the whole star population cooler (amber) or hotter (blue-white). */
    temperature: number;
    /** Visibility of the lines joining the stars. */
    lines: number;
    /** Scintillation strength (0 = steady stars). */
    twinkle: number;
    /** Colour of the chart lines. */
    color: string;
    /** Pulse highlight on the lines and a soft tint on the stars. */
    color2: string;
    /** Overall opacity. */
    opacity: number;
    /** Which sky: star positions, magnitudes and colours (structural: rebuilds). */
    seed: number;
}

/** Fountain-pen ink soaking into fibrous paper: a wetting front feathers along the fibres, dye separates into a coloured fringe and dries to a darker rim. */
export interface InkBleedTextConfig extends BaseTextObjectConfig {
    /** How far the ink feathers into the paper. */
    bleed: number;
    /** Colour of the dense dye (the dark core). */
    color: string;
    /** Thickness of the pen line. */
    weight: number;
    /** 0 = ink only, 1 = a sheet of paper behind the text. */
    paper: number;
    /** Colour of the lighter dye that separates into the halo. */
    color2: string;
    /** How long the ink keeps wicking before it dries. */
    dryTime: number;
    /** How strongly the paper fibres guide and rag the feathering. */
    fibre: number;
    /** Dark rim where the ink collects as it dries. */
    pooling: number;
    /** Seconds the ink takes to darken from pale blue-grey to its final colour (iron-gall oxidation). */
    oxidation: number;
    /** Slow browning of the paper around the lines, strongest where the pen pressed hard. */
    burn: number;
    /** How much cracked char and ash the fire leaves behind (0 = clean burn); used by the Burn erase. */
    char: number;
    /** Speed of the fire front; faster fronts leave their remains lingering longer (Burn erase). */
    spread: number;
    /** Overall opacity. */
    opacity: number;
}

/** Letters as puddles of mercury: a surface-tension meniscus mirrors a drifting studio with Fresnel chrome reflections and slow ripples. */
export interface LiquidMetalTextConfig extends BaseTextObjectConfig {
    /** Puddle depth: the radius of the rounded meniscus at the rim of every letter. */
    thickness: number;
    /** Contrast and brightness of the studio the metal mirrors. */
    environment: number;
    /** Colour of the metal at normal incidence (silver, gold, copper, blue-steel). */
    color: string;
    /** How strongly the metal colours its reflection (0 = neutral chrome, 1 = full colour). */
    tint: number;
    /** Erase: how long the metal stays liquid and runs before it dewets (0 = dewets early, 1 = long liquid phase). */
    melt: number;
    /** Erase: density of gravity-fed rivulets and falling drops under the strokes. */
    drips: number;
    /** Magnetic field: the pool breaks into a hexagonal lattice of sharp cones (Rosensweig instability). */
    spikes: number;
    /** Nanometre oxide film: thin-film interference tint and fine creases where the skin is compressed. */
    oxide: number;
    /** Normal-incidence reflectance of the metal (mercury and chrome are ~0.6-0.9). */
    reflectivity: number;
    /** Amplitude of the surface swells and capillary ripples that tilt the mirror. */
    roughness: number;
    /** Speed of the travelling surface waves. */
    rippleSpeed: number;
    /** Colour of the reflection at grazing angles and on the rim. */
    color2: string;
    /** Overall opacity. */
    opacity: number;
}

/** Hand-embroidered lettering that picks satin, stem stitch, couching and French knots per stroke, with silk thread sheen under a moving light on puckered linen. */
export interface EmbroideryTextConfig extends BaseTextObjectConfig {
    /** Main satin thread colour. */
    color: string;
    /** Strength of the silk highlight that sweeps over the stitching. */
    sheen: number;
    /** Stitches per em along the stroke (structural: rebuilds). */
    density: number;
    /** Width of the satin column relative to the pen stroke (structural: rebuilds). */
    thickness: number;
    /** Border running-stitch thread. */
    color2: string;
    /** Raised look: thread height, groove shadows and stitch ends diving under neighbours. */
    relief: number;
    /** Visibility of the contrast running-stitch border. */
    outline: number;
    /** Faint linen weave behind the stitching. */
    fabric: number;
    /** Dense stitching gathers the cloth: soft wrinkles around the stitching, deeper tight counters (fabric layer only). */
    pucker: number;
    /** Automatic picks per stroke: satin, stem stitch, couching, French knots. Or force one (structural: rebuilds). */
    style: string;
    /** Satin stitch angle to the stroke direction (structural: rebuilds). */
    slant: number;
    /** Overall opacity. */
    opacity: number;
}

/** Single-stroke chalk on slate: pressure-dependent deposit on a fixed grainy board with powdery halo, falling dust at the pen and a felt-smudge erase leaving ghosts. */
export interface ChalkboardTextConfig extends BaseTextObjectConfig {
    /** How hard the chalk is pressed: light = broken grainy line, heavy = nearly solid. */
    pressure: number;
    /** Stick-slip skipping: fast, light strokes break into dashes whose spacing follows pen speed. */
    chatter: number;
    /** Contrast of the board relief the chalk catches on. */
    grain: number;
    /** Falling chalk dust at the tip while writing. */
    dust: number;
    /** Thickness of the chalk stick. */
    weight: number;
    /** Curvature of the felt swipe: 0 = straight band, 1 = tight arc about the elbow. */
    swing: number;
    /** Chalk residue left by the smudge erase before it fades out. */
    ghost: number;
    /** Slate board behind the text with faint old writing. */
    board: number;
    /** Overall opacity. */
    opacity: number;
    /** Chalk colour. */
    color: string;
    /** Tint of the dense deposit. */
    color2: string;
}

export type TextObjectConfig = ({ type: 'handwriting' } & HandwritingTextConfig) | ({ type: 'neonTube' } & NeonTubeTextConfig) | ({ type: 'fourierSketch' } & FourierSketchTextConfig) | ({ type: 'frostGrowth' } & FrostGrowthTextConfig) | ({ type: 'plasmaDischarge' } & PlasmaDischargeTextConfig) | ({ type: 'burnAway' } & BurnAwayTextConfig) | ({ type: 'lightPainting' } & LightPaintingTextConfig) | ({ type: 'constellation' } & ConstellationTextConfig) | ({ type: 'inkBleed' } & InkBleedTextConfig) | ({ type: 'liquidMetal' } & LiquidMetalTextConfig) | ({ type: 'embroidery' } & EmbroideryTextConfig) | ({ type: 'chalkboard' } & ChalkboardTextConfig);
