// =============================================================================
// SceneCommand — one thing to trigger, in the one shape every trigger uses.
// =============================================================================
//
// Triggers (interactions, actions, clip / sequence cues, code, the agent) store and
// fire SceneCommands; the viewer's triggers engine (viewer/src/triggers) runs them.
// See the project doc claude/triggers-engine-plan.md.
//
import type { EffectClipUse, OperationEffect } from './objectSettings';

/** Switch something on / off: an action, an effect clip, a held effect. */
export type SceneStateCommand = 'apply' | 'revert' | 'toggle';
/** Drive a timeline: an animation clip or sequence. */
export type ScenePlaybackCommand = 'play' | 'pause' | 'stop' | 'toggle';

export interface ScenePlayOptions {
    /** Seconds from the start. */
    from?: number;
    speed?: number;
    reverse?: boolean;
}

export type SceneCommand =
    /** `trigger`: toggle when the operation can be undone, else play it (an interaction's click). */
    | { id: string; kind: 'effect'; effect: OperationEffect; command: 'trigger' | SceneStateCommand }
    | { id: string; kind: 'effectClip'; use: EffectClipUse; command: SceneStateCommand }
    /** `ref`: ActionSequence id. */
    | { id: string; kind: 'action'; ref: string; command: SceneStateCommand }
    /** `ref`: AnimationClip id. */
    | { id: string; kind: 'animationClip'; ref: string; command: ScenePlaybackCommand; options?: ScenePlayOptions }
    /** `ref`: AnimationSequence id. */
    | { id: string; kind: 'animationSequence'; ref: string; command: ScenePlaybackCommand; options?: ScenePlayOptions };

export type SceneCommandKind = SceneCommand['kind'];

/** A stored list of commands (versioned, so an older viewer can tell it is newer than it knows). */
export interface SceneCommandList {
    v: 1;
    commands: SceneCommand[];
}

/** What fired a command. */
export type TriggerHost = 'interaction' | 'action' | 'sequence' | 'clip' | 'code' | 'agent' | 'studio';

export interface TriggerSource {
    host: TriggerHost;
    /** The interaction (`<objectId>:<event>`), action, sequence, clip… id; for code, the caller's name. */
    id: string;
}
