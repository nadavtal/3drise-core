/**
 * Animation Step Types
 * Defines the structure for animation sequences
 */

import type { CreatedObjectSettings, Vector3Array } from "./scene3d";
export type Transition = {
    state: string;
    pathId?: string;
    properties: {
        to: Record<string, any>;
        from?: Record<string, any>;
    };
};

export interface TransitionStep {
    /** Duration of this animation step in seconds */
    duration: number;
    /** Properties to pass to the dispatcher for this state */
    transitions: Transition[];
    /** Optional delay before this step starts (in seconds) */
    delay?: number;
    /** Optional stagger between each transition in seconds (0 = all simultaneous) */
    stagger?: number;
    /** Optional easing function name */
    ease?: string;
    /** Optional callback when this step completes */
    onComplete?: () => void;
}

export interface AnimationSequence {
    /** Unique identifier for this sequence */
    id: string;
    /** Name of the animation sequence */
    name: string;
    /** Description of the animation sequence */
    description?: string;
    /** Array of animation steps to execute */
    steps: TransitionStep[];
    /** Whether this sequence should loop */
    loop?: boolean;
    /** Whether this sequence should yoyo (play forwards then backwards) */
    yoyo?: boolean;
    /** Current step index being executed */
    currentStep?: number;
    /** Whether this sequence is currently playing */
    isPlaying?: boolean;
    /** Whether this sequence is paused */
    isPaused?: boolean;
    /** Progress of the animation (0-1) */
    progress?: number;
    assetId?: string | null;
    isDirty?: boolean;
}

export interface PathGeometrySettings {
    /** Type of geometry to render */
    type: 'none' | 'road' | 'tube' | 'walls' | 'line' | 'particles';
    /** Width for road geometry */
    width?: number;
    /** Radius for tube geometry */
    radius?: number;
    /** Number of radial segments for tube */
    segments?: number;
    /** Number of lanes on each side (0 = no lane dividers) */
    numLanes?: number;
    /** Color of the geometry */
    color?: string;
    /** Color of lane divider lines */
    dividerColor?: string;
}

export interface PathConfig {
    /** Unique identifier for this sequence */
    id: string;
    /** Name of the animation sequence */
    name: string;
    /** Description of the animation sequence */
    description?: string;
    /** Array of animation steps to execute */
    points: Vector3Array[];
    /** Progress of the path animation (0-1) */
    progress?: number;
    /** Curve smoothness percentage (0-100). 0 = sharp corners, 100 = maximum smoothing */
    curve?: number;
    /** Corner smoothing radius (0-100). Higher values create more rounded corners */
    smoothCorners?: number;
    /** 3D geometry settings for rendering road/tube along path */
    geometry?: PathGeometrySettings;
    /** Whether to apply rotation to face movement direction (default: true) */
    applyRotation?: boolean;
    /** Position offset to add to the calculated path position [x, y, z] */
    offset?: Vector3Array;
    pointSize?: number;
    lineWidth?: number;
}

export type PathSettings = CreatedObjectSettings & {
    config: PathConfig;
};

export interface AnimationPlaybackOptions {
    /** Start from a specific step index */
    startStep?: number;
    /** Whether to loop the sequence */
    loop?: boolean;
    /** Speed multiplier (1.0 = normal speed) */
    speed?: number;
    reverse?: boolean;
    /** Callback when sequence completes */
    onComplete?: () => void;
    /** Internal flag to track yoyo return pass (do not set manually) */
    _isYoyoReturn?: boolean;
}


export {};
