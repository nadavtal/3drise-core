import type { AnimationOptions, Vector3 } from "./scene3d";
import type { SceneCommand } from "./commands";
import type { MaterialSettings } from "./materials";
import type { ShaderEffect } from "./shaderEffects";
import type { ColorEffectType, EffectTriggerMode, TransformEffectType } from "./effects";
export type PositionEffectType = Extract<TransformEffectType, 'wave' | 'float' | 'shake' | 'bounce'>;

export type RotationEffectType = Extract<TransformEffectType, 'rotate3d' | 'spin' | 'sway' | 'flip'>;

export type ScaleEffectType = Extract<TransformEffectType, 'pulse' | 'scale'>;

export type OpacityEffectType = Extract<TransformEffectType, 'fade'>;

export type { WaveEffectOptions, FloatEffectOptions, PulseEffectOptions, ShakeEffectOptions, BounceEffectOptions, Rotate3DEffectOptions, FadeEffectOptions, SpinEffectOptions, SwayEffectOptions, FlipEffectOptions, ScaleEffectOptions, TransformEffectOptions, ColorTransitionOptions, PulseColorOptions, GradientColorOptions, ColorEffectOptions, } from './effects';

export interface ColorEffectV2 {
    type: ColorEffectType;
    enabled: boolean;
    intensity?: number;
    speed?: number;
    targetColor: string;
    targetProperties?: string[];
    options?: import('./effects').ColorEffectOptions;
}

export interface TransformEffectV2 {
    type: TransformEffectType;
    triggerMode?: EffectTriggerMode;
    enabled: boolean;
    intensity?: number;
    speed?: number;
    options?: import('./effects').TransformEffectOptions;
}

export interface TransformEffects {
    /** Keyframe animations for position, rotation, scale */
    animations?: AnimationOptions[];
    /** Transform effects (wave, float, pulse...) - one per category (position, rotation, scale) */
    effects?: TransformEffectV2[];
}

export interface BorderEffect {
    type: 'default' | 'outline' | 'glow' | 'particles' | 'scan' | 'electric';
    enabled: boolean;
    config: Record<string, any>;
    materialSettings?: MaterialSettings;
}

export type UseObjectAnimationOptions = {
    objectId: string;
    enabled?: boolean;
};

export interface MaterialEffects {
    /** Keyframe animations for color, opacity */
    animations?: AnimationOptions[];
    /** Color effects (pulse-color, transition...) - take precedence over animations */
    effects?: ColorEffectV2[];
    shaderEffects?: ShaderEffect[];
}

export interface EdgesEffects {
    /** Keyframe animations for edge material/geometry properties */
    animations?: AnimationOptions[];
}

export interface LightEffects {
    /** Keyframe animations for light properties */
    animations?: AnimationOptions[];
}

export interface CloudsEffects {
    /** Keyframe animations for cloud config properties */
    animations?: AnimationOptions[];
}

export interface ParticlesEffects {
    /** Keyframe animations for a generative particle object's config properties */
    animations?: AnimationOptions[];
}

export interface EffectConfigEffects {
    /** Keyframe animations for a standalone effect object's config properties (type 'effect'). */
    animations?: AnimationOptions[];
}

export interface GridConfigEffects {
    /** Keyframe animations for a grid object's config properties (type 'grid'). */
    animations?: AnimationOptions[];
}

/** Keyframe animations for the sky's Preetham / sun knobs (SkySettings, root level). */
export interface SkyEffects {
    animations?: AnimationOptions[];
}

/** Keyframe animations for the water's own config knobs (OceanWaterSettings.config). */
export interface OceanEffects {
    animations?: AnimationOptions[];
}

/** Keyframe animations for the terrain surface's lighting / colour knobs (ProceduralTerrainSettings.config). */
export interface TerrainEffects {
    animations?: AnimationOptions[];
}

/** Keyframe animations for an environment object's config knobs (type 'environment': snow…). */
export interface EnvironmentObjectEffects {
    animations?: AnimationOptions[];
}

/** Keyframe animations for a land object's surface knobs (type 'land'). */
export interface LandObjectEffects {
    animations?: AnimationOptions[];
}

/** Keyframe animations for a space object's config knobs (type 'space': stars, earth, solarSystem, shootingStars). */
export interface SpaceObjectEffects {
    animations?: AnimationOptions[];
}

/** Keyframe animations for a text look's config knobs (type 'text', config.type set: handwriting, neonTube, fourierSketch). */
export interface TextObjectEffects {
    animations?: AnimationOptions[];
}

export interface RainEffects {
    /** Keyframe animations for rain config properties */
    animations?: AnimationOptions[];
}

export interface ObjectAnimations {
    enabled: boolean;
    /** Transform domain: position, rotation, scale */
    transform?: TransformEffects;
    /** Material domain: color, opacity */
    material?: MaterialEffects;
    /** Edges domain: edge material and geometry properties */
    edges?: EdgesEffects;
    /** Light domain: light source properties (intensity, color, distance, decay, angle, penumbra) */
    light?: LightEffects;
    /** Clouds domain: cloud-specific config properties (e.g. speed). Only populated on CloudsSettings. */
    clouds?: CloudsEffects;
    /** Rain domain: rain-specific config properties. Only populated on RainSettings. */
    rain?: RainEffects;
    /** Particles domain: a generative particle object's own config knobs (type 'particles'). */
    particles?: ParticlesEffects;
    /** Effect domain: a standalone effect object's own config knobs (type 'effect'). */
    effect?: EffectConfigEffects;
    /** Grid domain: a grid object's own config knobs (type 'grid'). */
    grid?: GridConfigEffects;
    /** Environment domain: a weather object's own config knobs (type 'environment': snow…). */
    environment?: EnvironmentObjectEffects;
    /** Space domain: a space object's own config knobs (type 'space': stars, earth…). */
    space?: SpaceObjectEffects;
    /** Land domain: a land object's surface knobs (type 'land': mountains, hills, dunes, canyon). */
    land?: LandObjectEffects;
    /** Text domain: an animated text look's own config knobs (type 'text', config.type set). */
    text?: TextObjectEffects;
    /** Sky domain: the sky's turbidity / rayleigh / mie / elevation / azimuth. */
    sky?: SkyEffects;
    /** Ocean domain: the water's config knobs (OceanWaterSettings). */
    ocean?: OceanEffects;
    /** Terrain domain: the surface's lighting and colour knobs. */
    terrain?: TerrainEffects;
}

export interface PropertyMutation {
    /** Property path: 'position' | 'rotation' | 'scale' | 'material.color' | ... */
    property: string;
    /** Settings: axis, sensitivity, min, max, value, etc. */
    from: any;
    to: any;
}

/**
 * An object interaction: a trigger on this object and what it does — effects on
 * objects, commands to animations, commands to actions. Stored in
 * `CreatedObjectSettings.actions` (the object's interaction list).
 */
export type InteractionTrigger = 'click' | 'mouseEnter' | 'mouseLeave';

/**
 * What an effect does to its targets. zoom / focus / moveToFront take ONE target;
 * glow / fade / visibility take many; displayImage is a gallery's own.
 * See the viewer's INTERACTION_OPERATIONS catalogue.
 */
/**
 * An operation's name. The built-ins are listed; the viewer's operations registry
 * (packages/viewer/src/operations) is the source of truth and can grow.
 */
export type OperationName =
    | 'jelly' | 'flip' | 'spin' | 'swirl' | 'moveToFront'
    | 'float' | 'sway' | 'bounce' | 'wobble' | 'pulse' | 'shake' | 'rotate' | 'grow'
    | 'glow' | 'rimLight' | 'dissolve' | 'emberAsh' | 'particleSwarm' | 'hologram' | 'shatter'
    | 'sandErosion' | 'teleport' | 'inkBloom' | 'flock' | 'metalize' | 'liquidMetal' | 'frost' | 'heatCracks' | 'petrify' | 'portal' | 'voxelize' | 'unweave' | 'petalPeel' | 'fade' | 'visibility' | 'displayImage'
    | 'zoom' | 'frame' | 'focus' | 'orbit'
    | (string & {});

/**
 * What an operation acts on. An interaction holds at most one effect per channel,
 * so effects in one card never fight over the same thing.
 *   transform  the object's own position / rotation / scale
 *   visual     how the object is drawn (material, shader, visibility) — never its transform
 *   camera     the camera (zoom, look at)
 *   effects    the object's own effects (its Effects tab): play / stop / toggle them
 */
export type OperationChannel = 'transform' | 'visual' | 'camera';

/** A value of an operation parameter (duration, distance, colour…). */
export type OperationParamValue = number | string | boolean;

/**
 * One operation on its targets — shared by interactions and actions.
 * Only regular scene objects (and their model nodes) are targets.
 */
export interface OperationEffect {
    id: string;
    operation: OperationName;
    /** The operation's channel (copied from its definition when the effect is made). */
    channel: OperationChannel;
    /** Scene object ids; interactions may also use 'self' (the object the interaction is on). */
    targets: string[];
    /** Narrows a `model` target to named nodes, keyed by that model's object id. */
    meshNames?: Record<string, string[]>;
    /** Overrides of the operation's parameter defaults. */
    params?: Record<string, OperationParamValue>;
    /**
     * Reverse / loop / yoyo, for operations that can also be object effects (the object's effects
     * controller runs them). Autoplay and visible do not apply to a triggered effect.
     */
    playback?: EffectPlayback;
    /** Targeting a group: a physical effect moves the whole group ('group', default) or each child on its own spot ('each'). Visual effects on a group always go to each child. */
    scope?: 'group' | 'each';
    /** false = switched off in its list: kept, but the command is skipped. Absent = on. */
    enabled?: boolean;
}

/**
 * An effect that stays on the object (`CreatedObject.effects`) — the same
 * operations interactions use, layered over the object's own geometry and
 * materials. Switching `enabled` plays the operation's in / out transition;
 * while on, the effect holds its finished state (with its own motion running).
 * Only operations whose finished state keeps the object visible qualify
 * (the viewer's definitions list 'object' in `usableIn`). Always on the object
 * itself — no targets, no channel.
 */
/**
 * How an effect plays. All optional; with none set it plays in once and holds.
 *   autoplay  plays when the scene starts / the effect is switched on (default true).
 *             Off: it waits at its start until something plays it.
 *   reverse   starts at its end and plays back to the original
 *   loop      when a pass ends, jumps back to its start and plays again
 *   yoyo      plays there and back (once, or over and over with loop)
 */
export interface EffectPlayback {
    autoplay?: boolean;
    reverse?: boolean;
    loop?: boolean;
    yoyo?: boolean;
}

export interface ObjectEffect {
    id: string;
    operation: OperationName;
    enabled: boolean;
    /** Autoplay / reverse / loop / yoyo — see EffectPlayback. */
    playback?: EffectPlayback;
    /** Narrows a model to named nodes. */
    meshNames?: string[];
    /** Overrides of the operation's parameter defaults. */
    params?: Record<string, OperationParamValue>;
    /**
     * On a group, a physical effect moves the whole group as one piece ('group', the default) or
     * every child on its own spot ('each', staggered by the clip's `spread`). Visual effects on a
     * group always go to each child.
     */
    scope?: 'group' | 'each';
}

/**
 * How a group's effects reach its children one after another (see claude/group-effects-plan.md).
 * Defaults: core `DEFAULT_EFFECT_SPREAD`.
 */
export interface EffectSpread {
    /** Who goes first: scene-tree order, along an axis of the group, centre → out, or random (seeded by the group). */
    order?: 'tree' | 'x' | 'y' | 'z' | 'radial' | 'random';
    /** Seconds from the first child to the last (a fixed total, whatever the number of children). 0 = together. */
    total?: number;
    /** Going off: last in, first out ('reverse'), or the same order. */
    out?: 'reverse' | 'same';
}

/**
 * Effects that take turns on an object. The object's own `effects` run the whole time; on top
 * of them one step is on at a time. A step holds effects that go together and owns the timing.
 */
export interface EffectStep {
    id: string;
    /** Effects that go together (one take-over at most). Their own playback is not used: looks play in and hold, motions run while the step is on. */
    effects: ObjectEffect[];
    /** Seconds the step's looks take to play in — and out, when the step ends. Default 1. */
    in?: number;
    /** Seconds the step stays once its looks are on. Default 1. */
    hold?: number;
    /**
     * How the step ends. Default: directly — the next step's take-over sweeps over this one,
     * the plain object never shows. True: this step plays out first, back to the object, and
     * only then does the next step start.
     */
    playOut?: boolean;
}

export interface EffectSteps {
    steps: EffectStep[];
    /** After the last step, start again from the first. Off: it stays on the last step. */
    loop?: boolean;
    /** Through the steps there and back. */
    yoyo?: boolean;
}

/**
 * What an object's Effects tab holds — the object's own effect clip, stored as one value in
 * `CreatedObject.effects`: Base effects (on the whole time), steps that take turns, the model
 * parts they apply to, and the saved template it came from. Same shape as a template (EffectClip)
 * plus what only an object has (parts, source). Read it with core `objectEffectClipOf`.
 */
export interface ObjectEffectClip {
    /** Base: on the whole time. */
    effects: ObjectEffect[];
    /** Effects that take turns on top of the Base ones. */
    steps?: EffectStep[];
    loop?: boolean;
    yoyo?: boolean;
    /**
     * The effects (Base and steps) follow the object's visibility: shown → they play in (the steps
     * from the first), hidden → they play out first and then the object goes. Off: hiding cuts them.
     */
    visible?: boolean;
    /** Groups: how the effects reach the children one after another. */
    spread?: EffectSpread;
    /** Model parts (node names) the effects apply to; none = the whole object. */
    parts?: string[];
    /** The saved effect clip (template) these effects were copied from / saved to. */
    source?: { id: string };
}

/**
 * A saved effect clip — a TEMPLATE: always-on effects and steps, with no target inside.
 * What an object's Effects tab holds is that object's own clip (ObjectEffectClip);
 * importing a template copies it into the object. Interactions and actions point at a
 * template by id and apply it to their targets (EffectClipUse).
 */
export interface EffectClip {
    id: string;
    name: string;
    effects: ObjectEffect[];
    steps?: EffectStep[];
    loop?: boolean;
    yoyo?: boolean;
    /** Imported into an object, its effects follow the object's visibility (applied by a command: not used). */
    visible?: boolean;
    /** Imported into a group: how its effects reach the children. */
    spread?: EffectSpread;
    /** Preview image (the asset's url), when one was taken. */
    previewUrl?: string;
    /** The asset's owner and privacy (only a private clip of your own is updated in place). */
    creatorId?: string;
    privacy?: string;
}

/** A template applied to targets: by an action (applied / reverted with it) or an interaction. */
export interface EffectClipUse {
    id: string;
    /** EffectClip id. */
    clip: string;
    /** Scene object ids; interactions may also use 'self'. */
    targets: string[];
    /** Narrows a `model` target to named nodes, keyed by that model's object id. */
    meshNames?: Record<string, string[]>;
}

export type InteractionAnimationCommand = 'play' | 'pause' | 'stop' | 'toggle';

/** toggle: apply, then revert, … */
export type InteractionActionCommand = 'apply' | 'revert' | 'toggle';

export interface Interaction {
    mouseEvent: InteractionTrigger;
    enabled: boolean;
    /** What happens, in order — run by the viewer's triggers engine. */
    commands: SceneCommand[];
}

export interface ClickInteraction {
    interactions: Interaction[];
}

export interface PropertySettings {
    axis: 'x' | 'y' | 'both';
    sensitivity: number;
    inverted?: boolean;
    min?: number | Vector3 | string;
    max?: number | Vector3 | string;
}

export interface MouseMoveProperty {
    property: string;
    enabled: boolean;
    propertySettings: PropertySettings;
}

export interface MouseMoveInteraction {
    enabled: boolean;
    /** Properties to animate based on mouse position */
    properties: MouseMoveProperty[];
}

export interface MouseMoveDomain {
    enabled: boolean;
    properties: MouseMoveProperty[];
}

export interface MouseMoveInteractions {
    enabled: boolean;
    transform?: MouseMoveDomain;
    material?: MouseMoveDomain;
    edges?: MouseMoveDomain;
    light?: MouseMoveDomain;
    clouds?: MouseMoveDomain;
    rain?: MouseMoveDomain;
    /** Particles domain: a generative particle object's own config knobs. */
    particles?: MouseMoveDomain;
    /** Effect domain: a standalone effect object's own config knobs. */
    effect?: MouseMoveDomain;
    /** Grid domain: a grid object's own config knobs. */
    grid?: MouseMoveDomain;
    /** Environment domain: a weather object's own config knobs. */
    environment?: MouseMoveDomain;
    /** Space domain: a space object's own config knobs. */
    space?: MouseMoveDomain;
    /** Land domain: a land object's surface knobs. */
    land?: MouseMoveDomain;
    /** Text domain: an animated text look's own config knobs. */
    text?: MouseMoveDomain;
    /** Sky domain: the sky's Preetham / sun knobs. */
    sky?: MouseMoveDomain;
    /** Ocean domain: the water's config knobs. */
    ocean?: MouseMoveDomain;
    /** Terrain domain: the surface's lighting and colour knobs. */
    terrain?: MouseMoveDomain;
}


// =============================================================================
// UNIFIED OBJECT SETTINGS TYPE DEFINITIONS
// =============================================================================
// New structure for GeneralObjectSettings that separates:
// 1. Continuous effects (always running)
// 2. Interactions (user-triggered: hover, click, mouseMove)
// 3. Shader effects (particles only)
/**
 * Check if settings use the new structure
 */
export function isNewStructure(settings: any): boolean {
    return Boolean(settings?.effects || settings?.actions || settings?.mouseMove || settings?.shaderEffects);
}
/**
 * Check if settings use the legacy structure
 */
export function isLegacyStructure(settings: any): boolean {
    return Boolean(settings?.transformEffects ||
        settings?.colorEffects ||
        settings?.handlers ||
        settings?.clickHandlers ||
        settings?.actions ||
        settings?.hoverSettings ||
        settings?.effects);
}
