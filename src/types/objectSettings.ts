import type { AnimationOptions, Vector3 } from "./scene3d";
import type { MaterialSettings } from "./materials";
import type { ShaderEffect } from "./shaderEffects";
import type { ColorEffectType, EffectTriggerMode, TransformEffectType } from "./effects";
import { GenerativeEffectSettings } from "./generativeEffects";
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
    /** Generative domain: additive geometry effects (aura, molecules, portal...) */
    effects?: GenerativeEffectSettings;
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
    | 'zoom' | 'focus' | 'moveToFront' | 'glow' | 'fade' | 'visibility' | 'displayImage'
    | (string & {});

/** A value of an operation parameter (duration, distance, colour…). */
export type OperationParamValue = number | string | boolean;

/**
 * One operation on its targets — shared by interactions and actions.
 * Only regular scene objects (and their model nodes) are targets.
 */
export interface OperationEffect {
    id: string;
    operation: OperationName;
    /** Scene object ids; interactions may also use 'self' (the object the interaction is on). */
    targets: string[];
    /** Narrows a `model` target to named nodes, keyed by that model's object id. */
    meshNames?: Record<string, string[]>;
    /** Overrides of the operation's parameter defaults. */
    params?: Record<string, OperationParamValue>;
}

export type InteractionAnimationCommand = 'play' | 'pause' | 'stop' | 'toggle';

export interface InteractionAnimation {
    id: string;
    kind: 'clip' | 'sequence';
    /** Clip or sequence id. */
    ref: string;
    command: InteractionAnimationCommand;
}

/** toggle: apply, then revert, … */
export type InteractionActionCommand = 'apply' | 'revert' | 'toggle';

export interface InteractionAction {
    id: string;
    /** Action sequence id. */
    ref: string;
    command: InteractionActionCommand;
}

export interface Interaction {
    mouseEvent: InteractionTrigger;
    enabled: boolean;
    effects: OperationEffect[];
    animations: InteractionAnimation[];
    actions: InteractionAction[];
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
