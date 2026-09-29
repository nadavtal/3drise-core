// Output shapes of the generator. Structurally the viewer's AnimationClip /
// AnimationSequence (animationsV2/types) — core can't import the viewer, so they're
// mirrored here; the studio adds them to its slices as they are.
import type { V3 } from './types';

export type DraftEase =
    | 'linear' | 'step'
    | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad'
    | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'
    | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart'
    | 'easeInSine' | 'easeOutSine' | 'easeInOutSine'
    | 'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo'
    | 'easeInBack' | 'easeOutBack' | 'easeInOutBack'
    | 'easeOutElastic' | 'easeOutBounce';

export type DraftValue = number | V3 | number[] | string | boolean;

export interface DraftKey { id: string; t: number; value: DraftValue; ease?: DraftEase }
export interface DraftTrack { id: string; state: string; node?: string; path: string; keys: DraftKey[] }
export interface DraftClip {
    id: string; name: string; key: string; description?: string;
    duration: number; fps: number; loop: boolean; yoyo: boolean; endMode: 'hold' | 'restore';
    tracks: DraftTrack[];
}
export interface DraftStepClip { id: string; clipId: string; delay: number; speed: number }
export interface DraftSequence {
    id: string; name: string; key: string; description?: string;
    steps: Array<{ id: string; clips: DraftStepClip[] }>;
    cues: [];
    loop: boolean; yoyo: boolean; reverse: boolean; endMode: 'hold' | 'restore';
    driver: 'time' | 'mouseWheel' | 'mouseX' | 'mouseY';
    driverSettings: { sensitivity: number; smoothing: number; invert: boolean };
    autoplay: boolean;
}

/** Eases that feel wrong when an input scrubs them backwards (wheel / mouse drivers). */
export const OVERSHOOT_EASES = new Set<DraftEase>(['easeInBack', 'easeOutBack', 'easeInOutBack', 'easeOutElastic', 'easeOutBounce']);
