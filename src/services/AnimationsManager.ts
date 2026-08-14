import gsap from 'gsap';
import { applyEasing, gsapEasingMap } from '../utils/easingUtils';
import type { AnimationSequence, TransitionStep, AnimationPlaybackOptions, PathConfig } from "../types/animations";
import type { Vector3Array } from "../types/scene3d";
export type AnimationEventType = 'sequenceStart' | 'sequenceEnd' | 'stepStart' | 'stepEnd';

export interface AnimationEvent {
    type: AnimationEventType;
    sequenceId: string;
    sequence: AnimationSequence;
    step?: TransitionStep;
    stepIndex?: number;
}

type AnimationEventListener = (event: AnimationEvent) => void;


/**
 * AnimationsManager
 * Execution-only manager for animation playback.
 * Sequence data lives in Redux - this class only handles execution.
 */
class AnimationsManager {
    // Runtime state for actively playing sequences
    private activeSequences = new Map();
    private paths = new Map([]);
    private timelines = new Map();
    private eventListeners = new Map();
    constructor() {
        // Initialize event listener sets
        this.eventListeners.set('sequenceStart', new Set());
        this.eventListeners.set('sequenceEnd', new Set());
        this.eventListeners.set('stepStart', new Set());
        this.eventListeners.set('stepEnd', new Set());
    }
    /**
     * Add an event listener
     */
    on(eventType: AnimationEventType, listener: AnimationEventListener): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.add(listener);
        }
    }
    /**
     * Remove an event listener
     */
    off(eventType: AnimationEventType, listener: AnimationEventListener): void {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.delete(listener);
        }
    }
    /**
     * Emit an event
     */
    private emit(event) {
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                }
                catch (error) {
                    console.error(`Error in animation event listener for ${event.type}:`, error);
                }
            });
        }
    }
    /**
     * @deprecated Sequences are now managed in Redux. Use playSequence(sequence) directly.
     * This method is kept for backwards compatibility during migration.
     */
    addSequence(sequence: AnimationSequence): AnimationSequence {
        console.warn('AnimationsManager.addSequence is deprecated. Sequences are managed in Redux.');
        // Store for backwards compatibility
        this.activeSequences.set(sequence.id, {
            ...sequence,
            currentStep: 0,
            isPlaying: false,
            isPaused: false,
            progress: 0,
        });
        return this.activeSequences.get(sequence.id);
    }
    /**
     * @deprecated Sequences are now managed in Redux.
     */
    removeSequence(sequenceId: string): void {
        console.warn('AnimationsManager.removeSequence is deprecated. Sequences are managed in Redux.');
        this.stopSequence(sequenceId);
        this.activeSequences.delete(sequenceId);
        this.timelines.delete(sequenceId);
    }
    /**
     * Get an actively playing sequence's runtime state
     */
    getSequence(sequenceId: string): AnimationSequence | undefined {
        return this.activeSequences.get(sequenceId);
    }
    /**
     * @deprecated Sequences are now managed in Redux. Use Redux selectors instead.
     */
    getAllSequences(): AnimationSequence[] {
        console.warn('AnimationsManager.getAllSequences is deprecated. Use Redux selectors.');
        return Array.from(this.activeSequences.values());
    }
    // updateSequence(sequenceId: string, updates: Partial<AnimationSequence>): void {
    //   const sequence = this.sequences.get(sequenceId);
    //   if (sequence) {
    //     Object.assign(sequence, updates);
    //   }
    // }
    /**
     * Execute a single animation step with multiple transitions
     * Returns a GSAP timeline for this step
     */
    private executeStep(step, stepTimeline, sequence, stepIndex) {
        const { duration, ease = 'power2.out' } = step;
        const stagger = step.stagger || 0;
        // Total GSAP timeline duration must cover the last staggered transition finishing.
        // last object starts at (n-1)*stagger, runs for `duration` seconds.
        const totalDuration = duration + (step.transitions.length > 1 ? (step.transitions.length) * stagger : 0);
        // Emit step start event with step data
        stepTimeline.call(() => {
            this.emit({
                type: 'stepStart',
                sequenceId: sequence.id,
                sequence,
                step,
                stepIndex,
            });
        }, undefined, 0); // Call at the start of the step timeline
        // console.log('Executing step', stepIndex, 'of sequence', sequence.id, 'with duration', duration, 'stagger', stagger, 'totalDuration', totalDuration);
        stepTimeline.to({}, { duration: totalDuration, ease: ease });
        // Emit step end event
        stepTimeline.call(() => {
            this.emit({
                type: 'stepEnd',
                sequenceId: sequence.id,
                sequence,
                step,
                stepIndex,
            });
            if (step.onComplete) {
                step.onComplete();
            }
        });
    }
    /**
     * Play an animation sequence
     * @param sequenceOrId - Either a full AnimationSequence object or a sequence ID (for backwards compat)
     * @param options - Playback options
     */
    async playSequence(sequenceOrId: AnimationSequence | string, options: AnimationPlaybackOptions = {}): Promise<void> {
        // Support both sequence object and ID for backwards compatibility
        let sequence;
        let originalSequence; // Keep original for yoyo/loop callbacks
        let sequenceId;
        if (typeof sequenceOrId === 'string') {
            // ID passed - look up in activeSequences (backwards compat)
            const found = this.activeSequences.get(sequenceOrId);
            if (!found) {
                console.warn(`Animation sequence with ID ${sequenceOrId} not found. Pass sequence data directly.`);
                return;
            }
            originalSequence = found;
            sequence = options.reverse ? this.reverseSteps(found) : found;
            sequenceId = sequenceOrId;
        }
        else {
            // Sequence object passed directly (preferred)
            originalSequence = sequenceOrId;
            sequence = options.reverse ? this.reverseSteps(sequenceOrId) : sequenceOrId;
            sequenceId = sequence.id;
        }
        // console.log('Playing sequence:', sequenceId, options);
        // Stop existing timeline if any
        this.stopSequence(sequenceId);
        // Store in activeSequences for runtime state tracking
        const runtimeSequence = {
            ...sequence,
            isPlaying: true,
            isPaused: false,
            currentStep: options.startStep || 0,
            progress: 0,
        };
        this.activeSequences.set(sequenceId, runtimeSequence);
        // console.log({sequence});
        // Create main timeline
        // When yoyo is enabled, we handle looping manually via callbacks
        // When yoyo is disabled, we can use GSAP's repeat for loop
        const useGsapRepeat = originalSequence.loop && !originalSequence.yoyo;
        const mainTimeline = gsap.timeline({
            paused: false,
            repeat: useGsapRepeat ? -1 : 0,
            onStart: () => {
                // Emit sequence start event
                this.emit({
                    type: 'sequenceStart',
                    sequenceId,
                    sequence: runtimeSequence,
                });
            },
            onUpdate: () => {
                const progress = mainTimeline.progress();
                // console.log(progress);
                runtimeSequence.progress = progress;
            },
            onComplete: () => {
                runtimeSequence.isPlaying = false;
                runtimeSequence.currentStep = 0;
                runtimeSequence.progress = 1;
                // Emit sequence end event
                this.emit({
                    type: 'sequenceEnd',
                    sequenceId,
                    sequence: runtimeSequence,
                });
                if (originalSequence.yoyo) {
                    if (!options._isYoyoReturn) {
                        // Just finished the first pass, play the return leg (reversed)
                        this.playSequence(originalSequence, {
                            ...options,
                            reverse: true,
                            _isYoyoReturn: true,
                        });
                    }
                    else if (originalSequence.loop) {
                        // Finished the return leg and loop is true, start fresh (forward)
                        this.playSequence(originalSequence, {
                            ...options,
                            reverse: false,
                            _isYoyoReturn: false,
                        });
                    }
                    // If _isYoyoReturn and loop is false, we're done (no replay)
                }
                if (options.onComplete) {
                    options.onComplete();
                }
            },
        });
        // Add forward steps to timeline
        for (let i = 0; i < sequence.steps.length; i++) {
            const step = sequence.steps[i];
            const delay = step.delay || 0;
            // Create a nested timeline for each step
            const stepTimeline = gsap.timeline({
                onStart: () => {
                    runtimeSequence.currentStep = i;
                }
            });
            // Execute the step (this will add tweens to stepTimeline and emit events)
            this.executeStep(step, stepTimeline, sequence, i);
            // Add the step timeline to the main timeline
            if (delay > 0) {
                mainTimeline.add(stepTimeline, `+=${delay}`);
            }
            else {
                mainTimeline.add(stepTimeline);
            }
        }
        // Apply speed multiplier if provided
        if (options.speed !== undefined && options.speed > 0) {
            mainTimeline.timeScale(options.speed);
        }
        this.timelines.set(sequenceId, mainTimeline);
    }
    /**
     * Pause an animation sequence
     */
    pauseSequence(sequenceId: string): void {
        const timeline = this.timelines.get(sequenceId);
        const sequence = this.activeSequences.get(sequenceId);
        if (timeline && sequence) {
            timeline.pause();
            sequence.isPaused = true;
            sequence.isPlaying = false;
        }
    }
    /**
     * Resume a paused animation sequence
     */
    resumeSequence(sequenceId: string): void {
        const timeline = this.timelines.get(sequenceId);
        const sequence = this.activeSequences.get(sequenceId);
        if (timeline && sequence) {
            timeline.resume();
            sequence.isPaused = false;
            sequence.isPlaying = true;
        }
    }
    /**
     * Stop an animation sequence
     */
    stopSequence(sequenceId: string): void {
        const timeline = this.timelines.get(sequenceId);
        const sequence = this.activeSequences.get(sequenceId);
        if (timeline) {
            timeline.kill();
            this.timelines.delete(sequenceId);
        }
        if (sequence) {
            sequence.isPlaying = false;
            sequence.isPaused = false;
            sequence.currentStep = 0;
            sequence.progress = 0;
            // Clean up from activeSequences when stopped
            this.activeSequences.delete(sequenceId);
        }
    }
    /**
     * Stop all animation sequences
     */
    stopAllSequences(): void {
        this.activeSequences.forEach((_, sequenceId) => {
            this.stopSequence(sequenceId);
        });
    }
    /**
     * @deprecated Use Redux to update sequences. This only affects runtime state.
     */
    updateSequence(sequenceId: string, updates: Partial<AnimationSequence>): void {
        console.warn('AnimationsManager.updateSequence is deprecated. Use Redux.');
        const sequence = this.activeSequences.get(sequenceId);
        if (sequence) {
            Object.assign(sequence, updates);
        }
    }
    /**
     * Check if a sequence is playing
     */
    isSequencePlaying(sequenceId: string): boolean {
        const sequence = this.activeSequences.get(sequenceId);
        return sequence?.isPlaying || false;
    }
    /**
     * Check if a sequence is paused
     */
    isSequencePaused(sequenceId: string): boolean {
        const sequence = this.activeSequences.get(sequenceId);
        return sequence?.isPaused || false;
    }
    /**
     * Seek to a specific progress point in the animation (0-1)
     */
    seekToProgress(sequenceId: string, progress: number): void {
        const timeline = this.timelines.get(sequenceId);
        const sequence = this.activeSequences.get(sequenceId);
        if (timeline && sequence) {
            const clampedProgress = Math.max(0, Math.min(1, progress));
            timeline.progress(clampedProgress);
            sequence.progress = clampedProgress;
        }
    }
    /**
     * Go to the start of the animation
     */
    goToStart(sequenceId: string): void {
        this.seekToProgress(sequenceId, 0);
    }
    /**
     * Go to the end of the animation
     */
    goToEnd(sequenceId: string): void {
        this.seekToProgress(sequenceId, 1);
    }
    /**
     * Get the current progress of a sequence (0-1)
     */
    getProgress(sequenceId: string): number {
        const timeline = this.timelines.get(sequenceId);
        return timeline?.progress() || 0;
    }
    /**
     * Clear all active sequences and timelines
     */
    clear(): void {
        this.stopAllSequences();
        this.activeSequences.clear();
        this.timelines.clear();
    }
    reverseSteps(sequence: AnimationSequence): AnimationSequence {
        // Create a deep copy of the sequence
        const reversedSequence = {
            ...sequence,
            id: sequence.id,
            steps: [...sequence.steps].reverse().map(step => {
                // Deep copy the step
                const reversedStep = {
                    ...step,
                    transitions: step.transitions.map(transition => {
                        // Deep copy the transition
                        const { properties } = transition;
                        // Ensure we maintain the correct structure with from and to properties
                        const reversedProperties = {
                            from: properties.to || {},
                            to: properties.from || {},
                        };
                        return {
                            ...transition,
                            properties: reversedProperties,
                        };
                    }),
                };
                return reversedStep;
            }),
        };
        return reversedSequence;
    }
    /**
     * Get progress based on start time and duration (uses wall-clock time like GSAP)
     * @param startTime - The timestamp when animation started (from performance.now() or Date.now())
     * @param duration - Total animation duration in seconds
     * @param ease - Easing function name (e.g., 'linear', 'power2.out', 'easeInOut')
     * @returns Eased progress value from 0 to 1
     */
    getProgressFromTime(startTime: number, duration: number, ease: string = 'linear'): number {
        const elapsed = (performance.now() - startTime) / 1000; // Convert ms to seconds
        const linearProgress = Math.min(Math.max(elapsed / duration, 0), 1);
        // Convert GSAP ease string to easing function name if needed
        const easingName = gsapEasingMap[ease] || ease;
        // Apply easing to get the eased progress value
        return applyEasing(easingName, linearProgress);
    }
    /**
     * @deprecated Use getProgressFromTime for accurate timing that matches GSAP
     */
    getRawProgress(progress: number, delta: number, duration: number = 1): number {
        // progress: current progress (0 to 1)
        // delta: time elapsed this frame in seconds
        // duration: total animation duration in seconds
        return Math.min(progress + delta / duration, 1);
    }
    /**
     * Create a new path and return its ID
     */
    createPath(name?: string, initialPoints: Vector3Array[] = []): string {
        const pathId = `path-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const pathSettings = {
            id: pathId,
            name: name || `Path ${this.paths.size + 1}`,
            points: initialPoints,
        };
        this.paths.set(pathId, pathSettings);
        return pathId;
    }
    /**
     * Add an existing path (for loading saved paths)
     */
    addPath(pathSettings: PathConfig): void {
        this.paths.set(pathSettings.id, pathSettings);
    }
    /**
     * Get a path by ID
     */
    getPath(pathId: string): PathConfig | undefined {
        return (this.paths.get(pathId) as any);
    }
    /**
     * Get path points by ID
     */
    getPathPoints(pathId: string): Vector3Array[] | undefined {
        return (this.paths.get(pathId) as any)?.points;
    }
    /**
     * Get all paths
     */
    getAllPaths(): PathConfig[] {
        return (Array.from(this.paths.values()) as any);
    }
    /**
     * Update a path's settings
     */
    updatePath(pathId: string, updates: Partial<Omit<PathConfig, 'id'>>): void {
        const path = this.paths.get(pathId);
        if (path) {
            this.paths.set(pathId, { ...(path as any), ...updates });
        }
    }
    /**
     * Update a path's points
     */
    updatePathPoints(pathId: string, points: Vector3Array[]): void {
        const path = this.paths.get(pathId);
        if (path) {
            this.paths.set(pathId, { ...(path as any), points });
        }
    }
    /**
     * Add a point to a path
     */
    addPointToPath(pathId: string, point: Vector3Array): void {
        const path = this.paths.get(pathId);
        if (path) {
            this.paths.set(pathId, { ...(path as any), points: [...(path as any).points, point] });
        }
    }
    /**
     * Remove a point from a path by index
     */
    removePointFromPath(pathId: string, index: number): void {
        const path = this.paths.get(pathId);
        if (path) {
            this.paths.set(pathId, { ...(path as any), points: (path as any).points.filter((_, i) => i !== index) });
        }
    }
    /**
     * Delete a path
     */
    deletePath(pathId: string): void {
        this.paths.delete(pathId);
    }
    /**
     * Clear all paths
     */
    clearAllPaths(): void {
        this.paths.clear();
    }
}
// Export singleton instance
export default new AnimationsManager();
