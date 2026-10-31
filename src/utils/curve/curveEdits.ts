// =============================================================================
// curveEdits — editing a CurveSpec so its sides and corners stay with their points
// =============================================================================
//
// Part of the ONE curving API (utils/curve). `segments[i]` belongs to the side from point i to
// point i + 1 and `corners[i]` to point i, so adding or removing a point must move them too. Every
// editor (the area editor, the Layouts scene tool, path editing) and the AI edit lines with these
// pure functions (each returns a new spec), so a side never ends up with another side's shape.
//   insert a point into a side   both halves keep that side's shape
//   remove a point               its two sides join and keep the first one's shape
//
import type { CurveSegment, CurveSpec } from './curveLine';
import type { CurveBend } from './curveShape';

type V3 = [number, number, number];
type Editable = Pick<CurveSpec, 'points' | 'segments' | 'corners' | 'closed'>;

const empty = (s: CurveSegment | null | undefined) => !s || (s.curve === undefined && !s.bend && s.noise === undefined && !s.hold);
/** The arrays without trailing / all-empty entries (absent when nothing is left). */
function tidy<T extends Editable>(spec: T): T {
    const out = { ...spec };
    if (out.segments && out.segments.every(empty)) delete out.segments;
    if (out.corners && out.corners.every((c) => c === null || c === undefined)) delete out.corners;
    return out;
}

/**
 * Where a new point belongs (the index to insert it at): on a closed line, between the two neighbours
 * whose side it lengthens least (|a p| + |p b| − |a b|) — a click on a side goes into that side, a
 * click inside or outside between the points it is nearest along the outline, so the order stays a
 * ring and the outline does not cross itself. An open line, or fewer than 3 points: at the end.
 */
export function curveInsertIndex(points: V3[], p: V3, closed: boolean): number {
    const n = points.length;
    if (!closed || n < 3) return n;
    let best = n, bestCost = Infinity;
    for (let i = 0; i < n; i++) {
        const a = points[i], b = points[(i + 1) % n];
        const cost = Math.hypot(p[0] - a[0], p[2] - a[2]) + Math.hypot(b[0] - p[0], b[2] - p[2]) - Math.hypot(b[0] - a[0], b[2] - a[2]);
        if (cost < bestCost) { bestCost = cost; best = i + 1; }
    }
    return best;
}

/** Insert point `p` at index `at` (0 … points.length): it splits the side it lands on; both halves keep that side's shape. */
export function curveInsertPoint<T extends Editable>(spec: T, at: number, p: V3): T {
    const n = spec.points.length;
    const k = Math.max(0, Math.min(n, Math.round(at)));
    const points = [...spec.points]; points.splice(k, 0, p);
    const out: T = { ...spec, points };
    if (spec.segments) {
        const segs = Array.from({ length: n }, (_, i) => spec.segments?.[i] ?? null);
        // the side split: (k - 1) → k; on a closed line inserting at 0 or n splits the closing side
        const split = spec.closed ? (k - 1 + n) % n : Math.max(0, k - 1);
        const copy = segs[split] ? structuredCloneSafe(segs[split]) : null;
        segs.splice(k, 0, copy);
        out.segments = segs;
    }
    if (spec.corners) {
        const c = Array.from({ length: n }, (_, i) => spec.corners?.[i] ?? null);
        c.splice(k, 0, null);
        out.corners = c;
    }
    return tidy(out);
}

/** Remove point `i`: its two sides join and keep the first one's shape (the side that ran into it). */
export function curveRemovePoint<T extends Editable>(spec: T, i: number): T {
    const n = spec.points.length;
    if (i < 0 || i >= n) return spec;
    const out: T = { ...spec, points: spec.points.filter((_, k) => k !== i) };
    if (spec.segments) {
        const segs = Array.from({ length: n }, (_, k) => spec.segments?.[k] ?? null);
        // side i - 1 runs into point i and keeps its shape; side i (out of point i) goes. An open line's
        // first point has no side before it: its own side goes.
        segs.splice(i, 1);
        out.segments = segs;
    }
    if (spec.corners) out.corners = spec.corners.filter((_, k) => k !== i);
    return tidy(out);
}

/** Change sides' shapes: `patch` merged into each (null clears them back to the whole line's). */
export function curveSetSegments<T extends Editable>(spec: T, indices: number[], patch: CurveSegment | null): T {
    const n = spec.points.length, sides = spec.closed ? n : n - 1;
    const segs = Array.from({ length: n }, (_, i) => spec.segments?.[i] ?? null);
    for (const i of indices) {
        if (i < 0 || i >= sides) continue;
        if (patch === null) { segs[i] = null; continue; }
        const next: CurveSegment = { ...(segs[i] ?? {}), ...patch };
        if (patch.bend !== undefined) next.bend = patch.bend ? { ...(segs[i]?.bend ?? {}), ...patch.bend } : undefined;
        for (const k of Object.keys(next) as Array<keyof CurveSegment>) if (next[k] === undefined) delete next[k];
        if (next.bend) { for (const k of Object.keys(next.bend) as Array<keyof CurveBend>) if (next.bend[k] === undefined) delete next.bend[k]; if (!Object.keys(next.bend).length) delete next.bend; }
        segs[i] = empty(next) ? null : next;
    }
    return tidy({ ...spec, segments: segs });
}

/** Give point `i` a round corner reaching `metres` along its legs (null: back to the whole line's smoothCorners). */
export function curveSetCorner<T extends Editable>(spec: T, i: number, metres: number | null): T {
    const n = spec.points.length;
    if (i < 0 || i >= n) return spec;
    const c = Array.from({ length: n }, (_, k) => spec.corners?.[k] ?? null);
    c[i] = metres === null || !(metres > 0) ? null : Math.round(metres * 100) / 100;
    return tidy({ ...spec, corners: c });
}

/** Does a bend do anything (a side or a lift)? Peak / sharpness alone shape nothing. */
export function curveBendSet(b: CurveBend | null | undefined): boolean {
    return !!b && (Math.abs(b.side ?? 0) > 1e-6 || Math.abs(b.lift ?? 0) > 1e-6);
}

function structuredCloneSafe<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }
