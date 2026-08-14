import type { AnimationOptions, Vector3 } from "./scene3d";
import type { MaterialSettings } from "./materials";
import type { ShaderEffect } from "./shaderEffects";
import type { OperationTypes } from "./actions";
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
    /** Generative domain: additive geometry effects (aura, molecules, portal...) */
    effects?: import('./generativeEffects').GenerativeEffectSettings;
}

export interface PropertyMutation {
    /** Property path: 'position' | 'rotation' | 'scale' | 'material.color' | ... */
    property: string;
    /** Settings: axis, sensitivity, min, max, value, etc. */
    from: any;
    to: any;
}

export interface Interaction {
    mouseEvent: 'click' | 'mouseEnter' | 'mouseLeave';
    enabled: boolean;
    /** Operation types: 'zoom' | 'glow' | 'vanish' | 'focus' | ... */
    operations?: OperationTypes[];
    /** Target multiple objects (for cross-object interactions) */
    targetIds?: string[];
    /** How targets are affected: 'replace' = only targets, 'add' = clicked + targets */
    targetMode?: 'replace' | 'add';
    /** Animation sequence IDs to trigger */
    animationIds?: string[];
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
