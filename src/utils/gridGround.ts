// =============================================================================
// gridGround — a grid's grounds as outlines (the shape of the plane under each ground)
// =============================================================================
//
// A ground is a set of cells (layout.grounds). Its shape is the union of those cells: one or more
// closed outlines (several when its cells are apart), with holes where cells inside it are not in
// the ground. An outline runs along the street centre lines between the cells — bends, round
// corners and heights included — so the plane meets the middle of every street round it and the
// street is drawn on top. Where there is no street (cut, or inside a merge) it runs straight
// between the nodes, at the heights of gridSegmentHeight.
//
// The editor's preview, the gallery thumbnails and every consumer that builds a ground use this
// one function, so what is drawn is what is built. What a ground looks like (its texture) is the
// consumer's, keyed by ground id.
//
import { gridCornerPoints, gridNodeId, gridSegmentHeight, gridStreetId, gridStreetPoints3d, type GridNode, type GridPlan, type GridStreet } from './gridLayout';

type V3 = [number, number, number];

export interface GridGroundOutline {
    /** Closed (the last point is not repeated), [x, y, z] metres. Outlines run clockwise seen from above; holes the other way. */
    points: V3[];
    /** A hole: cells inside the ground that are not in it. */
    hole: boolean;
}
export interface GridGroundShape {
    id: string;
    cells: string[];
    outlines: GridGroundOutline[];
    /** Its area seen from above (outlines minus holes), m². */
    area: number;
}

/** Every ground of the plan's layout, as outlines. */
export function gridGroundPolygons(plan: GridPlan, step = 4): GridGroundShape[] {
    return (plan.layout.grounds ?? []).map((g) => {
        const outlines = groundOutlines(plan, g.cells, step);
        const area = outlines.reduce((s, o) => s + (o.hole ? -1 : 1) * Math.abs(signedArea(o.points)), 0);
        return { id: g.id, cells: [...g.cells], outlines, area };
    });
}

// ---------------------------------------------------------------------------- outlines
/** A node by its line indices. */
const nodeAt = (plan: GridPlan, i: number, j: number): GridNode => plan.nodes[j * (plan.layout.columns.length + 1) + i];

function groundOutlines(plan: GridPlan, cells: string[], step: number): GridGroundOutline[] {
    const nc = plan.layout.columns.length, nr = plan.layout.rows.length;
    const inGround = new Set(cells);
    // Each cell's four edges round it (NW → NE → SE → SW, clockwise seen from above with x east,
    // z south); an edge two cells share runs both ways and cancels — what is left is the outline.
    const key = (a: string, b: string) => `${a}>${b}`;
    const edges = new Map<string, [number, number, number, number]>();
    for (const id of inGround) {
        const [c, r] = id.split(',').map(Number);
        if (!(c >= 0 && r >= 0 && c < nc && r < nr)) continue;
        const ring: Array<[number, number]> = [[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]];
        for (let k = 0; k < 4; k++) {
            const [i0, j0] = ring[k], [i1, j1] = ring[(k + 1) % 4];
            const a = gridNodeId(i0, j0), b = gridNodeId(i1, j1);
            if (edges.has(key(b, a))) edges.delete(key(b, a));
            else edges.set(key(a, b), [i0, j0, i1, j1]);
        }
    }
    // chain the edges into closed loops of node indices
    const from = new Map<string, Array<[number, number, number, number]>>();
    for (const e of edges.values()) {
        const k = gridNodeId(e[0], e[1]);
        (from.get(k) ?? from.set(k, []).get(k)!).push(e);
    }
    const used = new Set<[number, number, number, number]>();
    const loops: Array<Array<[number, number]>> = [];
    for (const e0 of edges.values()) {
        if (used.has(e0)) continue;
        const loop: Array<[number, number]> = [];
        let e: [number, number, number, number] | undefined = e0;
        while (e && !used.has(e)) {
            used.add(e);
            loop.push([e[0], e[1]]);
            const next: Array<[number, number, number, number]> = from.get(gridNodeId(e[2], e[3])) ?? [];
            // at a pinch (two cells touching only at a corner) take the sharpest right turn, so loops stay simple
            const free: Array<[number, number, number, number]> = next.filter((q) => !used.has(q));
            e = free.length <= 1 ? free[0] : free.sort((p, q) => turn(e!, q) - turn(e!, p))[0];
        }
        if (loop.length >= 3) loops.push(loop);
    }
    const streets = new Map(plan.streets.map((s) => [s.id, s]));
    return loops.map((loop) => {
        const points = loopPoints(plan, loop, streets, step);
        return { points, hole: signedArea(points) < 0 };
    });
}

/** How far edge q turns right after edge e (grid directions; bigger = sharper right). */
function turn(e: [number, number, number, number], q: [number, number, number, number]): number {
    const ax = e[2] - e[0], az = e[3] - e[1], bx = q[2] - q[0], bz = q[3] - q[1];
    return Math.atan2(ax * bz - az * bx, ax * bx + az * bz);
}

/**
 * A loop of nodes as points: each stretch between two nodes along its street's centre line (bends,
 * heights; trimmed at round corners), straight where there is no street; where the outline turns a
 * round corner along both its streets, the corner's round replaces the node.
 */
function loopPoints(plan: GridPlan, loop: Array<[number, number]>, streets: Map<string, GridStreet>, step: number): V3[] {
    const n = loop.length;
    const curvy = plan.layout.heightCurve === 'smooth' || plan.streets.some((st) => !!st.bend.lift);
    // the stretch from loop[k] to loop[k + 1]: its points (both ends included) and whether a street runs there
    const stretch = (k: number): { pts: V3[]; street: boolean } => {
        const [i0, j0] = loop[k], [i1, j1] = loop[(k + 1) % n];
        const axis: 'x' | 'z' = j0 === j1 ? 'x' : 'z';
        const fwd = i1 > i0 || j1 > j0;
        const [si, sj] = fwd ? [i0, j0] : [i1, j1];
        const st = streets.get(gridStreetId(axis, si, sj));
        if (st) {
            const trim = (id: string) => { const q = plan.nodes.find((m) => m.id === id); return q?.turn ? q.cornerRadius : 0; };
            const pts = gridStreetPoints3d(plan, st, trim(st.from), trim(st.to), step) as V3[];
            return { pts: fwd ? pts : pts.reverse(), street: true };
        }
        const a = nodeAt(plan, i0, j0), b = nodeAt(plan, i1, j1);
        const pts: V3[] = [[a.x, a.y, a.z]];
        if (curvy) for (let q = 1; q < 6; q++) {
            const t = q / 6;
            pts.push([a.x + (b.x - a.x) * t, gridSegmentHeight(plan, axis, si, sj, fwd ? t : 1 - t), a.z + (b.z - a.z) * t]);
        }
        pts.push([b.x, b.y, b.z]);
        return { pts, street: false };
    };
    const parts = Array.from({ length: n }, (_, k) => stretch(k));
    // a vertex is rounded when it is a corner node and the outline arrives and leaves along its two streets
    const rounded = (k: number) => {
        const [i, j] = loop[k], node = nodeAt(plan, i, j);
        return node.turn && node.cornerRadius > 0 && parts[k].street && parts[(k - 1 + n) % n].street;
    };
    // inside a round corner's reach the stretch is replaced by the round: drop its points there
    const near = (k: number) => { const [i, j] = loop[k % n], q = nodeAt(plan, i, j); return (p: V3) => Math.hypot(p[0] - q.x, p[2] - q.z) < q.cornerRadius * 0.999; };
    const kept = parts.map((part, k) => {
        let pts = part.pts;
        if (rounded(k)) { const inside = near(k); let s = 0; while (s < pts.length - 1 && inside(pts[s])) s++; pts = pts.slice(s); }
        if (rounded((k + 1) % n)) { const inside = near(k + 1); let e = pts.length; while (e > 1 && inside(pts[e - 1])) e--; pts = pts.slice(0, e); }
        return pts;
    });
    const out: V3[] = [];
    const push = (p: V3) => { const l = out[out.length - 1]; if (!l || Math.hypot(l[0] - p[0], l[2] - p[2]) > 0.01) out.push(p); };
    for (let k = 0; k < n; k++) {
        const pts = kept[k];
        if (rounded(k)) {
            // the corner's round: from where the last stretch stopped, through the node, to where this one starts
            const prev = kept[(k - 1 + n) % n], a = prev[prev.length - 1], b = pts[0];
            const [i, j] = loop[k], node = nodeAt(plan, i, j);
            const round = gridCornerPoints([a[0], a[2]], [node.x, node.z], [b[0], b[2]]);
            for (let t = 1; t < round.length - 1; t++) push([round[t][0], node.y, round[t][1]]);
        }
        // the end node (when not rounded) is the next stretch's start
        const last = rounded((k + 1) % n) ? pts.length : pts.length - 1;
        for (let q = 0; q < last; q++) push(pts[q]);
    }
    const f = out[0], l = out[out.length - 1];
    if (out.length > 1 && Math.hypot(f[0] - l[0], f[2] - l[2]) < 0.01) out.pop();
    return out;
}

/** Signed area seen from above, x east / z south: positive for a clockwise outline (as cells run). */
function signedArea(p: V3[]): number {
    let s = 0;
    for (let k = 0; k < p.length; k++) { const a = p[k], b = p[(k + 1) % p.length]; s += a[0] * b[2] - b[0] * a[2]; }
    return s / 2;
}
