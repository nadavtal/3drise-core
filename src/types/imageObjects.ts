// =============================================================================
// IMAGE OBJECTS — one picture as a scene object (object type 'image', config.type picks the variant)
// =============================================================================
//
// An image object shows ONE picture at a time through a variant's construction (shards, …). Its pictures are
// `config.imageUrls`: with one, it stays; with more, each stays `interval` seconds after its change lands,
// then the variant animates the change to the next (looping). Changing the list (the controller, an action or
// change, a timeline cue, the agent's scene.set) plays the change to the new list's picture; a gallery sending
// a clicked frame (the displayImage operation finds `root.userData.applyTexture`) shows that picture and the
// cycle carries on from there. The component keeps the outgoing picture itself while the change plays; only
// the list is stored. Saved objects from before the list carried `config.url` (migrateImageObject).
// No thumbnails, no navigation: a set of pictures you browse is a gallery object, not this.
//
// Size: 2 units wide at scale 1, the height from the picture's own aspect ratio. Everything is internal:
// moving, turning or scaling the image is the parent's transform. Rendered by ImageObject.tsx.
//

export type ImageObjectType = 'shards' | 'projector' | 'relief' | 'pinscreen' | 'prism' | 'lenticular' | 'frost' | 'roll' | 'contour' | 'engraving';

/** The cursor's role over the picture; each variant names its own modes, 'none' switches it off. */
export type ImagePointerMode = string;

export interface BaseImageObjectConfig {
    enabled: boolean;
    /** The pictures, shown one at a time in this order (structural: loads textures). Changing it plays the change. */
    imageUrls: string[];
    /** Seconds each picture stays after its change lands before the next change starts; 0 = no automatic change. */
    interval: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** What the cursor does over the picture ('none' = nothing). */
    pointerMode: ImagePointerMode;
    pointerStrength: number;
    /** Reach of the cursor, in image units (the picture is 2 units wide at scale 1). */
    pointerRadius: number;
    /** Tint of what the cursor touches. */
    pointerColor: string;
}

/** A picture tessellated into shards that lift, flip edge-on and land as the next picture in a travelling wave whenever the image changes; the cursor tilts, lifts or ripples the shards. */
export interface ShardsImageConfig extends BaseImageObjectConfig {
    /** Shards across the slab (structural: rebuilds). */
    cols: number;
    /** Shards down the slab (structural: rebuilds). */
    rows: number;
    /** Irregularity of the shard tiling, 0 = a regular grid, 1 = strongly jittered polygons (structural). */
    tiling: number;
    /** Slab width / height; 0 = the first picture's own aspect ratio (structural). */
    aspect: number;
    /** Seed of the tiling (structural). */
    seed: number;
    /** Seconds a picture change takes. */
    duration: number;
    /** Width of the travelling front: how much of the slab is in flight at once. */
    spread: number;
    /** Which shards go first: a linear sweep, rings from the centre, or at random. */
    order: 'sweep' | 'radial' | 'random';
    /** Direction of the sweep in degrees (0 = left to right). */
    sweepAngle: number;
    /** Per-shard randomness of the departure time. */
    delayJitter: number;
    /** How far shards rise off the slab (the slab is 2 units wide). */
    lift: number;
    /** Sideways scatter while in flight. */
    drift: number;
    /** Tumble while in flight (radians). */
    spin: number;
    /** Slow relief of the slab at rest. */
    breathe: number;
    /** Slow zoom and drift of the picture inside the shards. */
    kenBurns: number;
    /** Visibility of the gaps between shards at rest. */
    seams: number;
    /** Light caught on tilted shards. */
    rim: number;
    /** Colour of the seams and bevels. */
    edgeColor: string;
    /** Colour of the light caught on tilted shards. */
    rimColor: string;
    /** Colour of the slab's backing, seen where shards have left. */
    backColor: string;
}

/** The picture as projected light on a matte screen, thrown from a lens above, with a visible haze beam and dust lit by the image; a change racks focus and slides the next slide through the gate. */
export interface ProjectorImageConfig extends BaseImageObjectConfig {
    /** stir: the dust swirls where the cursor's ray crosses the beam · hotspot: the lamp's hotspot leans toward the cursor. */
    pointerMode: 'none' | 'stir' | 'hotspot';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Dust motes in the beam (rebuilds). */
    dustCount: number;
    /** How far in front of the screen the lens hangs. */
    throw: number;
    /** How high above the screen's centre the lens hangs. */
    lensHeight: number;
    /** How much the beam shows in the air. */
    haze: number;
    /** Brightness of the dust. */
    dust: number;
    /** How fast the dust drifts. */
    dustDrift: number;
    /** How far the lens racks out of focus during a change. */
    defocus: number;
    /** The small overshoot as focus comes back. */
    hunt: number;
    /** Fall-off of the lamp toward the screen's edges. */
    vignette: number;
    /** Lamp flicker. */
    flicker: number;
    /** Colour of the lamp. */
    lampColor: string;
    /** Brightness of the screen. */
    screenGain: number;
}

/** The picture embossed into paper by its own local contrast and lit by the scene; a change is a soft press travelling across the sheet, flattening the old impression and raising the new one as its ink lays down. */
export interface ReliefImageConfig extends BaseImageObjectConfig {
    /** press: dents the paper under the cursor · rake: deepens the relief around it. */
    pointerMode: 'none' | 'press' | 'rake';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Subdivisions across the sheet (rebuilds). More = finer relief. */
    detail: number;
    /** How deep the picture is pressed into the paper. */
    depth: number;
    /** Height of the soft crest that travels across during a change. */
    crest: number;
    /** Width of the travelling front: how much of the sheet changes at once. */
    spread: number;
    /** Direction the press travels (degrees, 0 = left to right). */
    sweepAngle: number;
    /** Paper finish: low = satin, high = matte. */
    roughness: number;
    /** The blank paper (seen in the entrance and under light inks). */
    paperColor: string;
    /** A little of the picture's own colour on top of the scene light, so it reads in dim scenes. */
    selfLight: number;
}

/** The picture as a pinscreen of fine metal pins, each standing out by the brightness under it with a domed head in the picture's colour; a change is a pressure wave that sinks the pins and raises the new relief. */
export interface PinscreenImageConfig extends BaseImageObjectConfig {
    /** press: pins sink under the cursor · lift: pins rise toward it. */
    pointerMode: 'none' | 'press' | 'lift';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Pins across (rebuilds). The rows follow the frame. */
    cols: number;
    /** How far the brightest pins stand out of the plate. */
    depth: number;
    /** How far the change wave sinks the pins before they rise to the new picture. */
    dip: number;
    /** Width of the travelling wave. */
    spread: number;
    /** Direction the wave travels (degrees, 0 = left to right). */
    sweepAngle: number;
    /** Head diameter as a share of the pin spacing. */
    pinSize: number;
    /** Metalness of the shafts. */
    metal: number;
    /** Polish of the heads and shafts. */
    roughness: number;
    /** A little of the picture's own colour on the heads, so dark pictures still read. */
    selfLight: number;
    /** Colour of the metal shafts. */
    pinColor: string;
    /** Colour of the plate the pins go through. */
    plateColor: string;
}

/** The picture printed across a row of slim triangular prisms; a change turns each prism a third of a turn in a travelling wave, its faces passing through the scene light, to show the next picture. */
export interface PrismImageConfig extends BaseImageObjectConfig {
    /** tilt: prisms turn toward the cursor · wave: a ripple of turns spreads from it. */
    pointerMode: 'none' | 'tilt' | 'wave';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Prisms across the picture (rebuilds). */
    count: number;
    /** Prisms stand upright (off: they lie horizontally and turn top to bottom) (structural: rebuilds). */
    vertical: boolean;
    /** Width of the travelling wave: how many prisms turn at once. */
    spread: number;
    /** Direction of the wave (degrees, 0 = left to right). */
    sweepAngle: number;
    /** How much each prism overshoots and settles at the end of its turn. */
    settle: number;
    /** Gap between neighbouring prisms. */
    gap: number;
    /** Finish of the faces: low = glossy print, high = matte. */
    roughness: number;
    /** Colour of the third face (seen edge-on during a turn). */
    slatColor: string;
    /** A little of the picture's own colour on top of the scene light. */
    selfLight: number;
}

/** A lenticular print: fine lenses over interleaved strips of the old and new picture; a change sweeps the flip across the sheet and depends on the viewing angle, with ribbed clearcoat highlights from the scene light. */
export interface LenticularImageConfig extends BaseImageObjectConfig {
    /** peek: lenses near the cursor flip back to the previous picture · bend: the sheet bows toward the cursor. */
    pointerMode: 'none' | 'peek' | 'bend';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Lenses across the print. */
    lenses: number;
    /** How much the viewing angle shifts what a lens shows (the lens depth). */
    thickness: number;
    /** How crisp the flip between the two pictures is. */
    sharpness: number;
    /** Faint colour fringes at the flip line, as real lenticular prints have. */
    ghost: number;
    /** How much the lens ridges show in the highlights. */
    ridge: number;
    /** Width of the sweep across the sheet. */
    spread: number;
    /** Direction of the sweep (degrees, 0 = left to right). */
    sweepAngle: number;
    /** Finish of the print under the lenses. */
    roughness: number;
    /** Roughness of the lens surface: 0 = mirror-sharp highlights. */
    gloss: number;
    /** A little of the picture's own colour on top of the scene light. */
    selfLight: number;
}

/** A print behind a pane of real glass; a change is a breath of frost that feathers in from the edges, blurs the print through the glass, and clears from the centre to reveal the new picture; the cursor wipes the glass. */
export interface FrostImageConfig extends BaseImageObjectConfig {
    /** wipe: a finger clears the glass along its path · fog: the cursor breathes frost onto it. */
    pointerMode: 'none' | 'wipe' | 'fog';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Distance between the print and the glass (parallax and refraction). */
    gap: number;
    /** How frosted the glass gets during a change. */
    frost: number;
    /** How white the frost scatters (0 = clear blur only). */
    whiteness: number;
    /** How feathery the frost front is. */
    feather: number;
    /** Frost that stays at the edges of the glass at rest. */
    rim: number;
    /** Seconds a wiped trail takes to frost over again. */
    refrost: number;
    /** Colour of the frost. */
    frostColor: string;
    /** A little of the print's own colour on top of the scene light. */
    selfLight: number;
}

/** A print on paper; a change is a slim paper roll travelling across it, winding up the old print and laying down the new one, lit and shadowed by the scene. */
export interface RollImageConfig extends BaseImageObjectConfig {
    /** lift: the paper rises toward the cursor · press: it dents under it. */
    pointerMode: 'none' | 'lift' | 'press';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Subdivisions of the sheet (rebuilds). More = a rounder roll. */
    detail: number;
    /** Radius of the roll at its widest. */
    rollSize: number;
    /** Direction the roll travels (degrees, 0 = left to right). */
    sweepAngle: number;
    /** One end of the roll leads the other. */
    skew: number;
    /** Paper finish: low = satin, high = matte. */
    roughness: number;
    /** The back of the paper (the outside of the roll). */
    paperColor: string;
    /** A little of the print's own colour on top of the scene light. */
    selfLight: number;
}

/** The picture as a topographic map of itself: a change opens it into hairline contour lines that lift into a floating stack in depth and flow continuously into the new picture's contours before it fills back in. */
export interface ContourImageConfig extends BaseImageObjectConfig {
    /** open: the picture opens into contours around the cursor · ripple: the levels bend in a ring. */
    pointerMode: 'none' | 'open' | 'ripple';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Contour levels over the full brightness range. */
    levels: number;
    /** Line width in pixels. */
    lineWidth: number;
    /** How far the contour stack opens into depth during a change. */
    depth: number;
    /** How far the picture darkens away under the front. */
    open: number;
    /** Calmer, longer contours (higher) or finer detail (lower). */
    smoothing: number;
    /** Contours left visible on the picture at rest. */
    idleLines: number;
    /** Line colour: 0 = the picture's own colour under the line, 1 = the line colour. */
    tint: number;
    /** Width of the travelling front. */
    spread: number;
    /** Direction of the front (degrees, 0 = left to right). */
    sweepAngle: number;
    /** Colour the lines lean toward (see tint). */
    lineColor: string;
}

/** The picture as an ink engraving on paper, fine strokes laid along its own isophotes, dense where it is dark, at a depth set by brightness; a change lifts and turns every stroke to the new picture's flow like filings in a field. */
export interface EngravingImageConfig extends BaseImageObjectConfig {
    /** comb: strokes align with the cursor's motion · swirl: they wind around it. */
    pointerMode: 'none' | 'comb' | 'swirl';
    /** Seconds a picture change takes. */
    duration: number;
    /** Frame width / height; 0 = each picture's own (the frame eases between them). */
    aspect: number;
    /** The idle life: a slow, barely-there movement at rest. */
    breathe: number;
    /** Strokes across the picture (rebuilds). */
    cols: number;
    /** Stroke length, in cells (overlap makes continuous lines). */
    length: number;
    /** Stroke width at full brightness. */
    weight: number;
    /** Brighter strokes stand closer: the plate's depth. */
    relief: number;
    /** Direction of the hatching where the picture has no strong form to follow. */
    hatch: number;
    /** How far strokes lift off the plate while they turn. */
    lift: number;
    /** How calm the stroke directions are (higher = longer, smoother flow). */
    flow: number;
    /** The picture's hue washed into the paper. */
    fill: number;
    /** Ink colour: 0 = the ink colour, 1 = the picture's own hue. */
    tint: number;
    /** Width of the travelling front. */
    spread: number;
    /** Direction of the front (degrees, 0 = left to right). */
    sweepAngle: number;
    /** The paper. */
    plateColor: string;
    /** The ink. */
    inkColor: string;
}

export type ImageObjectConfig = ({ type: 'shards' } & ShardsImageConfig) | ({ type: 'projector' } & ProjectorImageConfig) | ({ type: 'relief' } & ReliefImageConfig) | ({ type: 'pinscreen' } & PinscreenImageConfig) | ({ type: 'prism' } & PrismImageConfig) | ({ type: 'lenticular' } & LenticularImageConfig) | ({ type: 'frost' } & FrostImageConfig) | ({ type: 'roll' } & RollImageConfig) | ({ type: 'contour' } & ContourImageConfig) | ({ type: 'engraving' } & EngravingImageConfig);
