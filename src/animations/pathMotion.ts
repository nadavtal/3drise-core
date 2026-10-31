// =============================================================================
// pathMotion — a path baked into an ordinary position track (keys you edit like any others)
// =============================================================================
//
// A path's authoring points become the track's keys, timed by where each point sits along the
// finished line (core buildPathLine knots), so the object moves at an even speed; the track
// carries the path's `curve` / `smoothCorners`, and the clip runtime draws the same line through
// its keys (viewer clipUtils: curved position tracks). Nothing stays linked to the layout: edit
// the keys, slow a stretch down, apply the track to other objects.
//
// The same call serves the timeline's Generate › Path and the AI ("move the car along this route
// in 6 s"): points in, keys out.
//
import { buildRunLine, type PathLineInput } from '../utils/pathLine';
import type { GenKeyframe } from './trackGenerators';
import type { Vector3Array } from '../types/scene3d';

export type PathRunEase = 'linear' | 'in' | 'out' | 'inOut';

export interface PathMotionOptions {
    /** Window inside the clip, seconds. */
    start: number;
    end: number;
    /**
     * How the run speeds up / slows down: 'linear' (default) an even speed; 'in' gathers speed over
     * the first stretch, 'out' slows to a stop over the last one, 'inOut' both. The ramps are the
     * first / last key's own ease (quad), timed so the speed is continuous where they meet the even
     * part — every other key stays linear, so the speed never jumps at a key.
     */
    ease?: PathRunEase | null;
    /** World metres added to every point (where the path sits for this object). */
    offset?: Vector3Array | null;
    /** Run the path from its end to its start. */
    reverse?: boolean;
    /** Each point into the track's space (an object's parent), after the offset. Default: unchanged. */
    toLocal?: (p: Vector3Array) => Vector3Array;
    makeId?: () => string;
}

export interface PathMotion {
    /** Position keys, sorted by t. */
    keys: GenKeyframe[];
    /** The rounding the track draws through its keys (Track.curve / smoothCorners). */
    curve: number;
    smoothCorners: number;
}

const round = (n: number) => Math.round(n * 10000) / 10000;
let idCounter = 0;
const defaultId = () => `temp-key-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

/**
 * A path as position keys over [start, end]: its points in travel order, timed by distance along
 * the line the track will draw through them (buildRunLine — the clip runtime's own), so the speed
 * is even (or ramps per `ease`). A loop ends where it began (its first point again) and the track
 * draws it closed. Null when the path has fewer than two points or no length.
 */
export function pathMotionKeys(path: PathLineInput, opts: PathMotionOptions): PathMotion | null {
    const pts = path.points ?? [];
    if (pts.length < 2) return null;
    const loop = !!path.loop && pts.length > 2;
    let order = pts.map((_, i) => i);
    if (loop) order.push(0);
    if (opts.reverse) order = order.slice().reverse();
    const curve = path.curve ?? 0, smoothCorners = path.smoothCorners ?? 0;
    // distances on the track's own line (a rigid offset / parent move keeps them)
    const run = buildRunLine(order.map((i) => pts[i]), { curve, smoothCorners });
    if (!run) return null;
    const n = order.length;
    const d0 = run.at[0], D = run.at[n - 1] - d0;
    const start = Math.max(0, opts.start);
    const T = Math.max(0, opts.end - start);
    // ramps: the first / last stretch eased (quad) at twice the time an even pass would take,
    // which makes the eased stretch leave / arrive at exactly the cruise speed
    const ease = opts.ease ?? 'linear';
    const rampIn = (ease === 'in' || ease === 'inOut') && n > 2 ? run.at[1] - d0 : 0;
    const rampOut = (ease === 'out' || ease === 'inOut') && n > 2 ? run.at[n - 1] - run.at[n - 2] : 0;
    const cruise = (D + rampIn + rampOut) / (T || 1);   // metres per second on the even part
    const timeAt = (k: number): number => {
        if (k === 0) return 0;
        if (k === n - 1) return T;
        const d = run.at[k] - d0;
        return rampIn > 0 ? (2 * rampIn + (d - rampIn)) / cruise : d / cruise;
    };
    const off = opts.offset ?? [0, 0, 0];
    const makeId = opts.makeId ?? defaultId;
    const keys: GenKeyframe[] = order.map((i, k) => {
        const p = pts[i];
        const world: Vector3Array = [p[0] + (off[0] ?? 0), p[1] + (off[1] ?? 0), p[2] + (off[2] ?? 0)];
        const local = opts.toLocal ? opts.toLocal(world) : world;
        const key: GenKeyframe = { id: makeId(), t: round(start + Math.min(T, timeAt(k))), value: local.map(round) };
        if (k < n - 1) {
            const single = n === 2;   // one stretch: ease it whole
            key.ease = single
                ? (ease === 'inOut' ? 'easeInOutQuad' : ease === 'in' ? 'easeInQuad' : ease === 'out' ? 'easeOutQuad' : 'linear')
                : k === 0 && rampIn > 0 ? 'easeInQuad' : k === n - 2 && rampOut > 0 ? 'easeOutQuad' : 'linear';
        }
        return key;
    });
    return { keys, curve, smoothCorners };
}
