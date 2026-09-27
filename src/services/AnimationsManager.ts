import { applyEasing, gsapEasingMap } from '../utils/easingUtils';
import type { PathConfig } from "../types/animations";
import type { Vector3Array } from "../types/scene3d";

/**
 * AnimationsManager — the path registry (PathCreator, path animation) and the
 * progress helpers per-object animations use.
 *
 * Sequence playback moved to Animations V2 (viewer `animationsV2/ClipsRuntime`);
 * the V1 sequence player, its GSAP timelines and its step events are gone.
 */
class AnimationsManager {
    private paths = new Map([]);
    /**
     * Get progress based on start time and duration (uses wall-clock time like GSAP)
     * @param startTime - The timestamp when animation started (from performance.now() or Date.now())
     * @param duration - Total animation duration in seconds
     * @param ease - Easing function name (e.g., 'linear', 'power2.out', 'easeInOut')
     * @returns Eased progress value from 0 to 1
     */
    getProgressFromTime(startTime: number, duration: number, ease: string = 'linear'): number {
        // Zero-length steps (actions) are complete immediately. Without this, elapsed/0 is
        // NaN on the first frame (elapsed 0) and every lerp downstream goes NaN.
        if (!(duration > 0))
            return 1;
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
