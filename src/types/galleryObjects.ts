// =============================================================================
// GALLERY OBJECTS — a set of pictures as a scene object (object type 'gallery', config.type picks the variant)
// =============================================================================
//
// Every gallery is a set of pictures (`config.imageUrls`) shown through a variant's construction, told apart by
// config.type (isGalleryObjectConfig) and rendered by GalleryObject.tsx:
//   layout   the layout gallery — frames of one shape placed on a layout (tiles, circular, spiral, tunnel…),
//            driven by the shared transform effects; its frames take the object's material.
//   …        each further variant is its own construction with its own motion and navigation (carousel…),
//            drawing with its own shaders, and registers its controls (next / prev / goTo) with the viewer's
//            GalleryRuntime — SceneHandle.galleries, the 'gallery' trigger, the agent and the studio panel.
// One picture with an animated change is an image object, not a gallery. Everything is internal: moving,
// turning or scaling the gallery is the parent's transform.
//

import type { GalleryLayoutSettings } from './gallery';

export type GalleryObjectType = 'layout' | 'lightThreads' | 'silk' | 'particleShift' | 'glassPanes' | 'halo' | 'loom' | 'basicCarousel' | 'paperLanterns' | 'pinscreen' | 'depthLayers' | 'contourLines' | 'prismSplit' | 'engraving' | 'slats' | 'fold' | 'wireRelief' | 'terraces' | 'shadowBox' | 'popUp' | 'ridgelines' | 'flowLines' | 'strata';

export interface BaseGalleryObjectConfig {
    enabled: boolean;
    /** The pictures, in order (structural: rebuilds). */
    imageUrls: string[];
}

/** Frames of one shape placed on a layout (tiles, circular, spiral, tunnel…); the layout's own fields are GalleryLayoutSettings. */
export interface LayoutGalleryConfig extends BaseGalleryObjectConfig, Omit<GalleryLayoutSettings, 'imageUrls'> {
    type: 'layout';
}

/** Pictures as curtains of fine vertical threads of light, one column of the image each; inactive curtains hang grey and faint, the arriving one fills with colour as light runs down its threads; the cursor brings colour back. */
export interface LightThreadsGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Threads per picture, one column of the image each (structural: rebuilds). */
    threads: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the light takes to run down the threads of the arriving picture. */
    restring: number;
    /** How far each thread’s light runs behind its left neighbour’s, so the light sweeps across. */
    sweep: number;
    /** Brightness of the light’s leading edge as it runs down. */
    headGlow: number;
    /** Bead pattern along each thread. */
    beads: number;
    /** Show the rail the threads hang from. */
    rail: boolean;
    /** Colour of the light’s leading edge. */
    threadColor: string;
    /** Colour of the rail. */
    railColor: string;
    /** What the cursor does: off, or a soft light that brings colour back to the faded curtains. */
    pointerMode: 'none' | 'reveal';
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Colour the cursor effect adds. */
    pointerColor: string;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures printed on sheets of silk, each a cloth simulation hanging in a light breeze and lit by the scene with a soft sheen; the cursor is a breath of air on the cloth. */
export interface SilkGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Cloth resolution across a sheet (structural: rebuilds). */
    resolution: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Strength of the breeze. */
    wind: number;
    /** Weight of the cloth. */
    gravity: number;
    /** Air resistance of the cloth: higher keeps it moving longer. */
    drag: number;
    /** Cloth stiffness passes per frame (higher is stiffer, costs more). */
    iterations: number;
    /** Seconds a let-go sheet takes to fall away. */
    fallTime: number;
    /** Silk sheen along the folds. */
    sheen: number;
    /** What the cursor does: off, a breath of air that follows its movement, or a touch that presses the cloth. */
    pointerMode: 'none' | 'breath' | 'touch';
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Colour the cursor effect adds. */
    pointerColor: string;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures made of particles: inactive ones are a faint grey stipple, the active one fuses into the solid picture in full colour as a small soft wave crosses it; the cursor turns the area it passes back into particles. */
export interface ParticleShiftGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Particles across a picture (structural: rebuilds). */
    grains: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the wave takes to cross a picture. */
    changeTime: number;
    /** Width of the soft wave. */
    wave: number;
    /** How diagonal the wave is. */
    slant: number;
    /** How far the particles rise off the picture as the wave passes. */
    lift: number;
    /** Size of the resting particles. */
    particleSize: number;
    /** Brightness of the inactive particles. */
    faded: number;
    /** Overall particle size. */
    grain: number;
    /** What the cursor does: off, or turns the area it passes back into particles. */
    pointerMode: 'none' | 'shift';
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Radius of the area the cursor turns back into particles. */
    pointerRadius: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures sealed behind thick panes of physical glass that refract the room and are lit by the scene; the front pane steps forward, the others stand back dimmer. */
export interface GlassPanesGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Thickness of the glass slab (structural: rebuilds). */
    thickness: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** How far the front pane steps forward. */
    focusLift: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Frosting of the glass. */
    roughness: number;
    /** Index of refraction of the glass. */
    ior: number;
    /** Tint of the glass. */
    tint: string;
    /** What the cursor does: off, or the panes near it tilt toward it. */
    pointerMode: 'none' | 'tilt';
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Colour the cursor effect adds. */
    pointerColor: string;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Scene-lit prints on a tilted ring; the picture that comes round to the front steps out toward the viewer, grows and comes to full colour while the others ride the ring faded and grey. */
export interface HaloGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** How far the front picture steps out toward the viewer. */
    stepOut: number;
    /** How much the front picture grows. */
    focusScale: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds a picture takes to step out and come to colour. */
    changeTime: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Roughness of the prints under the scene’s light. */
    roughness: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures woven on a loom: inactive ones are a sparse grey weave of thin threads over a fine warp, the active one is woven closed in full colour by a soft diagonal wave; the cursor reveals colour on the weave. */
export interface LoomGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Warp threads across a picture (structural: rebuilds). */
    warp: number;
    /** Weft rows down a picture (structural: rebuilds). */
    weft: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the weaving wave takes to close the active picture. */
    weaveTime: number;
    /** Seconds a leaving picture takes to unravel back to grey. */
    unravelTime: number;
    /** Softness of the weaving wave. */
    wave: number;
    /** How diagonal the weaving wave is. */
    slant: number;
    /** Thickness of the inactive weft threads. */
    thread: number;
    /** A faint brightening on the wave while it weaves. */
    shuttle: number;
    /** Over / under offset of the weft rows. */
    weave: number;
    /** Brightness of the warp threads. */
    warpGlow: number;
    /** Colour of the warp threads. */
    warpColor: string;
    /** Colour of the brightening on the wave. */
    shuttleColor: string;
    /** What the cursor does: off, or reveals colour on the grey weave. */
    pointerMode: 'none' | 'reveal';
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Colour the cursor effect adds. */
    pointerColor: string;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** A coverflow carousel of framed pictures on a damped scroll with drag, throw and snap, a lifted centre frame and a soft floor reflection; the cursor tilts or lifts the frames. */
export interface BasicCarouselGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Distance between neighbouring frames, in frame widths. */
    spacing: number;
    /** Shape of the carousel: 0 = a flat row, 1 = a circle. */
    curve: number;
    /** Coverflow turn of the neighbours (radians). */
    tilt: number;
    /** How far the neighbours recede. */
    depth: number;
    /** Frames on each side before they fade out. */
    visible: number;
    /** Scale of the centre frame. */
    focusScale: number;
    /** How far the centre frame comes forward. */
    focusLift: number;
    /** Extra forward travel when the centre frame is focused. */
    focusAmount: number;
    /** Darkening of the neighbours. */
    dim: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Slow idle float of the frames. */
    breathe: number;
    /** Strength of the floor reflection. */
    reflection: number;
    /** Gap between the frames and the reflecting floor. */
    floorGap: number;
    /** Frame border width, in frame units. */
    border: number;
    /** Colour of the frame border. */
    borderColor: string;
    /** Colour of the frames’ backs. */
    backColor: string;
    /** What the cursor does: off, tilts the frames near it toward it, or lifts the frame under it. */
    pointerMode: 'none' | 'tilt' | 'lift';
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Colour the cursor effect adds. */
    pointerColor: string;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Paper lanterns hanging from a sagging rope, one picture printed around each, swinging as real pendulums in a breeze; the front lantern hangs lower and glows from inside. */
export interface PaperLanternsGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Radius of a lantern (structural: rebuilds). */
    radius: number;
    /** Distance between lanterns along the rope. */
    spacing: number;
    /** Sag of the rope between its posts. */
    sag: number;
    /** Length of the rope. */
    span: number;
    /** Length of each lantern’s cord. */
    cord: number;
    /** How much lower the front lantern hangs. */
    focusDrop: number;
    /** How far the front lantern comes toward the viewer. */
    focusLift: number;
    /** Lanterns on each side before they fade out. */
    visible: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Gravity of the pendulums: higher swings faster. */
    gravity: number;
    /** How quickly a swing dies down. */
    swingDamping: number;
    /** Strength of the breeze through the lanterns. */
    wind: number;
    /** How strongly a change tugs the rope (a wave of swings). */
    tug: number;
    /** Soft glow around the front lantern. */
    glow: number;
    /** Brightness of the lamp inside the front lantern. */
    lamp: number;
    /** Colour of the lamp. */
    lampColor: string;
    /** Colour of the lantern paper. */
    paperColor: string;
    /** Colour of the paper’s lit rim. */
    rimColor: string;
    /** Colour of the lantern rings. */
    ringColor: string;
    /** What the cursor does: off, a breeze that sets the lanterns near it swinging, or a glow on the lantern under it. */
    pointerMode: 'none' | 'breeze' | 'glow';
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Colour the cursor effect adds. */
    pointerColor: string;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as beds of fine pins lit by the scene: inactive ones are a flat grey bed, the active one is pushed out by a soft wave into a relief in full colour; the cursor presses the pins in. */
export interface PinscreenGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Pins across a picture (structural: rebuilds). */
    pins: number;
    /** How far the brightest pins stand out. */
    relief: number;
    /** Pin width, as a share of the spacing. */
    pinSize: number;
    /** Relief of the darkest pins, as a share of the brightest. */
    base: number;
    /** Roughness of the pins under the scene’s light. */
    roughness: number;
    /** Metalness of the pins. */
    metalness: number;
    /** Colour of the board the pins stand in. */
    boardColor: string;
    /** What the cursor does: off, or presses the pins in. */
    pointerMode: 'none' | 'press';
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures split by brightness into thin sheets floating in depth: inactive ones are collapsed into one faint grey sheet, the active one opens into depth in full colour and its sheets slide past each other with real parallax. */
export interface DepthLayersGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Sheets per picture (structural: rebuilds). */
    layers: number;
    /** Distance between the sheets when open. */
    separation: number;
    /** Softness of each sheet’s brightness threshold. */
    softness: number;
    /** Brightness of the fine edge along each sheet. */
    edge: number;
    /** What the cursor does: off, or opens the sheets further where it passes. */
    pointerMode: 'none' | 'open';
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures drawn as the contour lines of their own brightness, like a topographic map: inactive ones are a few thin grey lines, the active one fills in as a soft wave thickens the lines into the solid picture; the cursor lifts the contours into relief. */
export interface ContourLinesGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Contour levels over the full brightness range. */
    levels: number;
    /** An inactive picture shows every n-th level. */
    sparse: number;
    /** Width of an inactive line, as a share of the level spacing. */
    lineWidth: number;
    /** How much the brightness is smoothed before the contours are drawn. */
    smoothing: number;
    /** What the cursor does: off, or lifts the contours into relief. */
    pointerMode: 'none' | 'lift';
    /** Height of the cursor’s relief. */
    lift: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as their red, green and blue channels on three planes of light: inactive ones stand apart in depth, dim with soft colour fringes, the active one slides together into the true picture behind a soft wave; the cursor splits it again. */
export interface PrismSplitGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Depth between the colour planes of an inactive picture. */
    split: number;
    /** Sideways offset of the planes, as a share of the split. */
    dispersion: number;
    /** Colour of an inactive picture. */
    saturation: number;
    /** What the cursor does: off, or splits the colour planes apart again. */
    pointerMode: 'none' | 'split';
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures drawn as banknote engraving, fine parallel lines bent and widened by the picture’s tone: inactive ones are a faint grey hatch, the active one thickens into full colour behind a soft wave; the cursor turns the hatching under it. */
export interface EngravingGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Lines across the picture. */
    lines: number;
    /** Angle of the hatching (degrees). */
    angle: number;
    /** How much the picture’s tone bends the lines. */
    bend: number;
    /** Width of an inactive line, as a share of a bright line. */
    hairline: number;
    /** What the cursor does: off, or turns the hatching under it. */
    pointerMode: 'none' | 'turn';
    /** How far the cursor turns the hatching (radians). */
    turn: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures cut into thin vertical slats lit by the scene: inactive ones stand nearly edge-on as fine grey lines, the active one turns its slats to face you in a soft wave, closing into the picture; the cursor turns the slats near it. */
export interface SlatsGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Slats across a picture (structural: rebuilds). */
    slats: number;
    /** How far an inactive picture’s slats are turned (degrees). */
    turn: number;
    /** Thickness of a slat. */
    thickness: number;
    /** Gap between slats, as a share of a slat. */
    gap: number;
    /** Roughness of the slats under the scene’s light. */
    roughness: number;
    /** Metalness of the slats. */
    metalness: number;
    /** Colour of the slats’ backs and edges. */
    backColor: string;
    /** What the cursor does: off, or turns the slats near it. */
    pointerMode: 'none' | 'turn';
    /** How far the cursor turns the slats (degrees). */
    pointerTurn: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures printed on paper folded in one of six ways (accordion, herringbone, fan, scroll, page curl, crumple) and lit by the scene: inactive ones are folded tight and grey, the active one unfolds flat into full colour; the cursor presses a dent into it. */
export interface FoldGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Panels across a picture — the fold’s scale (structural: rebuilds). */
    panels: number;
    /** How the paper is folded: accordion, herringbone, hand fan, scroll, page curl or crumpled. */
    foldType: 'accordion' | 'miura' | 'fan' | 'roll' | 'curl' | 'crumple';
    /** Fold angle of an inactive picture (degrees; accordion, herringbone, hand fan). */
    folded: number;
    /** The soft creases an unfolded sheet keeps (degrees). */
    creases: number;
    /** Radius of the scroll and the page curl. */
    rollRadius: number;
    /** Depth of the crumpled creases. */
    crumple: number;
    /** Roughness of the paper under the scene’s light. */
    roughness: number;
    /** Colour of the paper’s back. */
    paperColor: string;
    /** What the cursor does: off, or presses a dent into the paper. */
    pointerMode: 'none' | 'press';
    /** Depth of the cursor’s dent. */
    press: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as a fine wire mesh lifted by their own brightness: inactive ones are a flat grey wire grid, the active one rises into relief and fills with colour panels behind a soft wave; near the cursor the panels lift away to the wire. */
export interface WireReliefGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Grid cells across a picture (structural: rebuilds). */
    cells: number;
    /** Height of the relief at the brightest point. */
    relief: number;
    /** Brightness of the wires. */
    wire: number;
    /** Colour of the wires. */
    wireColor: string;
    /** What the cursor does: off, or lifts the panels away to the bare wire. */
    pointerMode: 'none' | 'reveal';
    /** How far the panels lift away under the cursor. */
    lift: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as topographic models of stacked card lit by the scene: inactive ones are a flat grey contour map, the active one rises into terraces of its own brightness in full colour behind a soft wave; the cursor lifts the terraces higher. */
export interface TerracesGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Grid resolution across a picture (structural: rebuilds). */
    resolution: number;
    /** Number of terraces. */
    levels: number;
    /** Height of the top terrace. */
    relief: number;
    /** How crisp the terrace walls are. */
    sharpness: number;
    /** How much the brightness is smoothed before it is cut into terraces. */
    smoothing: number;
    /** Brightness of the thin card edge along each terrace. */
    edges: number;
    /** Roughness of the card under the scene’s light. */
    roughness: number;
    /** What the cursor does: off, or lifts the terraces near it. */
    pointerMode: 'none' | 'lift';
    /** How far the cursor lifts the terraces. */
    lift: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as cut-paper layers in a shadow box, lit by the scene so each sheet casts a real soft shadow on the one behind: inactive ones are pressed flat and grey, the active one opens into depth in full colour. */
export interface ShadowBoxGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Paper sheets per picture (structural: rebuilds). */
    sheets: number;
    /** Distance between the sheets when open. */
    separation: number;
    /** How much the brightness is smoothed before the sheets are cut (rounder cuts). */
    smoothing: number;
    /** Roughness of the paper under the scene’s light. */
    roughness: number;
    /** What the cursor does: off, or opens the sheets further. */
    pointerMode: 'none' | 'open';
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as pop-up book spreads lit by the scene: cut-paper sheets hinged to a page lie folded down and grey when inactive, and stand up one after another into the picture in full colour when it becomes active. */
export interface PopUpGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Pop-up sheets per picture (structural: rebuilds). */
    sheets: number;
    /** Which way an inactive picture’s sheets lie: back, away from the viewer, or forward, folded down toward the viewer. */
    direction: 'back' | 'forward';
    /** Depth between the sheets’ hinges. */
    separation: number;
    /** How far an inactive picture’s sheets lie down (degrees from upright). */
    closed: number;
    /** How much the sheets stand up one after another. */
    stagger: number;
    /** How much the brightness is smoothed before the sheets are cut. */
    smoothing: number;
    /** Roughness of the paper under the scene’s light. */
    roughness: number;
    /** The sheets cast shadows (on each other and on the scene). */
    shadows: boolean;
    /** Show the paper page the sheets are hinged to. */
    page: boolean;
    /** Colour of the page and of the sheets’ plain backs. */
    pageColor: string;
    /** What the cursor does: off, or tilts the sheets near it. */
    pointerMode: 'none' | 'tilt';
    /** How far the cursor tilts the sheets (degrees, the way they lie). */
    tilt: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as stacked horizontal hairlines lifted by their brightness, each ridge hiding the lines behind it: inactive ones are flat grey lines, the active one rises into ridges and fills with the picture’s colour behind a soft wave; the cursor raises the ridges. */
export interface RidgelinesGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Ridgelines down a picture (structural: rebuilds). */
    rows: number;
    /** How high the brightest point lifts its ridge. */
    relief: number;
    /** Width of a ridgeline. */
    lineWidth: number;
    /** How much the brightness is smoothed before it lifts the ridges. */
    smoothing: number;
    /** Colour of the ridgelines. */
    lineColor: string;
    /** Colour of an inactive picture’s fill. */
    fillColor: string;
    /** Opacity of an inactive picture’s fill (what hides the lines behind). */
    fillOpacity: number;
    /** What the cursor does: off, or raises the ridges near it. */
    pointerMode: 'none' | 'raise';
    /** How far the cursor raises the ridges. */
    raise: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as fine lines flowing like water around their own forms: inactive ones are thin grey dashed lines drifting, the active one closes the dashes and thickens the lines into the picture in full colour behind a soft wave; the cursor parts the lines. */
export interface FlowLinesGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Lines across the picture. */
    lines: number;
    /** How much the picture’s forms bend the lines. */
    bend: number;
    /** Slow meander of the lines. */
    meander: number;
    /** Speed of the flow along the lines. */
    flow: number;
    /** Dashes per picture width along an inactive line (0 = solid). */
    dashes: number;
    /** Width of an inactive line, as a share of a bright line. */
    hairline: number;
    /** How much the brightness is smoothed before it bends the lines. */
    smoothing: number;
    /** What the cursor does: off, or parts the lines around it. */
    pointerMode: 'none' | 'part';
    /** How strongly the cursor parts the lines. */
    part: number;
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

/** Pictures as stacks of thin horizontal plates lit by the scene, each plate’s front following the picture’s brightness like a laser-cut relief: inactive ones are a flat grey stack, the active one slides forward into relief in full colour; the cursor pushes plates back. */
export interface StrataGalleryConfig extends BaseGalleryObjectConfig {
    /** Seconds between automatic changes; 0 = off (held while the cursor is over the gallery). */
    autoplay: number;
    /** Overall brightness. */
    intensity: number;
    /** Overall opacity. */
    opacity: number;
    /** Where the pictures sit: a row, a wave, a ring, a helix around the viewer, a tunnel into depth, a stack, a fan or a constellation. */
    layout: 'row' | 'wave' | 'ring' | 'helix' | 'tunnel' | 'stack' | 'fan' | 'constellation';
    /** Distance between neighbouring pictures, in picture widths. */
    spacing: number;
    /** How far the inactive pictures stand back. */
    depth: number;
    /** How many neighbours show on each side before they fade out. */
    visible: number;
    /** The layout’s own shape: wave height, ring tilt, helix rise, tunnel drift, stack offset, fan spread or constellation scatter. */
    shape: number;
    /** Stiffness of the scroll spring: how briskly the gallery moves to the next picture. */
    stiffness: number;
    /** Damping of the scroll spring: higher settles without overshoot. */
    damping: number;
    /** How far a drag release throws the gallery before it snaps. */
    throwing: number;
    /** Seconds the change takes to cross a picture. */
    changeTime: number;
    /** Width of the soft change wave. */
    wave: number;
    /** How diagonal the change wave is. */
    slant: number;
    /** Brightness of the inactive pictures. */
    dim: number;
    /** Strength of the cursor effect. */
    pointerStrength: number;
    /** Reach of the cursor effect around the cursor. */
    pointerRadius: number;
    /** Width / height of every picture; pictures are cover-fitted (structural: rebuilds). */
    aspect: number;
    /** Plates down a picture (structural: rebuilds). */
    plates: number;
    /** How far the brightest part of a plate stands forward. */
    relief: number;
    /** Depth of the darkest part, as a share of the brightest. */
    base: number;
    /** Gap between plates, as a share of a plate. */
    gap: number;
    /** How much the brightness is smoothed before it shapes the plates. */
    smoothing: number;
    /** Roughness of the plates under the scene’s light. */
    roughness: number;
    /** Colour of the plates’ tops and edges. */
    plateColor: string;
    /** What the cursor does: off, or pushes the plates near it back. */
    pointerMode: 'none' | 'push';
    /** What the pointer does: off; click right / left of the centre for next / previous; or also drag and throw the gallery. */
    navigation: 'none' | 'click' | 'drag';
    /** Objects that show the active picture too: image objects play their own change to it, meshes take it as their texture; their own pictures come back when the feed ends. */
    feeds: string[];
}

export type GalleryObjectConfig = LayoutGalleryConfig | ({ type: 'lightThreads' } & LightThreadsGalleryConfig) | ({ type: 'silk' } & SilkGalleryConfig) | ({ type: 'particleShift' } & ParticleShiftGalleryConfig) | ({ type: 'glassPanes' } & GlassPanesGalleryConfig) | ({ type: 'halo' } & HaloGalleryConfig) | ({ type: 'loom' } & LoomGalleryConfig) | ({ type: 'basicCarousel' } & BasicCarouselGalleryConfig) | ({ type: 'paperLanterns' } & PaperLanternsGalleryConfig) | ({ type: 'pinscreen' } & PinscreenGalleryConfig) | ({ type: 'depthLayers' } & DepthLayersGalleryConfig) | ({ type: 'contourLines' } & ContourLinesGalleryConfig) | ({ type: 'prismSplit' } & PrismSplitGalleryConfig) | ({ type: 'engraving' } & EngravingGalleryConfig) | ({ type: 'slats' } & SlatsGalleryConfig) | ({ type: 'fold' } & FoldGalleryConfig) | ({ type: 'wireRelief' } & WireReliefGalleryConfig) | ({ type: 'terraces' } & TerracesGalleryConfig) | ({ type: 'shadowBox' } & ShadowBoxGalleryConfig) | ({ type: 'popUp' } & PopUpGalleryConfig) | ({ type: 'ridgelines' } & RidgelinesGalleryConfig) | ({ type: 'flowLines' } & FlowLinesGalleryConfig) | ({ type: 'strata' } & StrataGalleryConfig);
