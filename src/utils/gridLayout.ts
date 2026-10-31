// =============================================================================
// gridLayout — a city-style grid as plain data, and the ONE function that reads it
// =============================================================================
//
// A GridLayout is lines and cells, nothing visual: uneven column / row sizes, merged cells
// (a central park is a 2x2 merge), removed streets, a sideways bend per street, an edge mode,
// and an optional fill per cell. GridCreator (client) edits it; it is saved as a `layout` asset
// (or is a built-in preset) and used BY REFERENCE (gridLayoutRefs.ts: a street grid's `layoutId`);
// the object that uses it draws it — the urban streetGrid today; blocks / fences / paths later.
//
// gridLayoutPlan(layout) turns it into nodes (with the arms that meet there), streets (centre
// lines between nodes) and cells (rectangles, merged ones as one). Every consumer and the
// editor preview use this function, so they cannot disagree about where a street is.
//
// Coordinates: metres, x east, z south, centred on the grid's middle. Node (i, j) sits on
// column line i (0..columns.length) and row line j (0..rows.length).
// Street ids: 'x:i,j' runs along x from node (i, j) to (i + 1, j); 'z:i,j' runs along z from
// node (i, j) to (i, j + 1). Cell ids: 'col,row'; a merged rectangle is named by its first cell.
// Node ids: 'i,j' (column line, row line).
//
// Line ends (optional `ends`): a line need not be straight up the grid. Each column line can
// move its north end and its south end along x on their own (a row line its west and east ends
// along z), so lines slant and cells become four-sided. A node is where its column line crosses
// its row line, so merges, cuts, bends, corners, junctions and fills keep working unchanged.
//
// A node can also move off where its lines cross (`offsets`, [dx, dz] metres): the lines bend
// there, the cells round it follow.
//
// Height (optional): every node can have its own height (`heights`, metres). Between two nodes a
// street climbs straight, or on a smooth curve through its neighbours (`heightCurve: 'smooth'`),
// plus its own lift (its curve's `bend.lift`). A roundabout is a level platform at its
// junction's height (island + ring): its streets reach that height at its edge, arriving level.
// A four-way junction can be a bridge
// ('bridgeX': the x street passes over, 'bridgeY': the z street does), its upper street ramping
// up to `clearance` metres there. gridSegmentHeight is the one height reader.
//
// Grounds (optional `grounds`): sets of cells that get a ground under them (a shaped plane, so
// the area is not a hole). Any cells, not only a rectangle; the streets between them stay. A cell
// is in one ground at most. The grid holds only the shape (gridGroundPolygons, gridGround.ts);
// what the ground looks like (its texture) is set where the grid is used, by ground id.
//
// Curves: every street is a side of the ONE curving API (utils/curve): `curves[streetId]` is a
// CurveSegment — its bend sideways (`side`, metres to the right of travel from its lower-index
// node: + south for an x street, + west for a z street), up (`lift`), where it peaks and how
// sharp it is — drawn by curveSidePoints / curveBulge, and a corner's round is curveCornerPoints.
// Grids never curve lines with their own maths.

import { CURVE_LIMITS, curveBulge, curveCornerCut, curveCornerPoints, curveDensity, curveHermite, curvePeak, curveSharpness, curveSidePoints, type CurveBend, type CurveSegment } from './curve';

/**
 * How the border streets end. loop: they close on themselves round the grid (tees on the edge,
 * rounded corners). open: every street runs on past the edge as a short stub (GridNode.stubs,
 * gridStubs), so edge junctions are crossings and corners are not rounded.
 */
export type GridEdgeMode = 'loop' | 'open';
/** How far an open edge's street stub runs past the grid (metres) — what the editor draws; a consumer builds its own arm length. */
export const GRID_STUB_LENGTH = 45;
export type GridCellKind = 'block' | 'park' | 'parking' | 'plaza' | 'empty';
export const GRID_CELL_KINDS: readonly GridCellKind[] = ['block', 'park', 'parking', 'plaza', 'empty'];

/** Cells joined into one: the cell at (col, row) and `cols` x `rows` from there. */
export interface GridRect { col: number; row: number; cols: number; rows: number }
/** What a cell holds (consumers decide what it means; streetGrid ignores it). */
export interface GridCellFill { kind: GridCellKind; mix?: string; seed?: number }

export type GridJunctionKind = 'crossing' | 'roundabout' | 'bridgeX' | 'bridgeY';
/** How a node where 3 or 4 streets meet is built. Absent = a crossing (a cross or a T). */
export interface GridJunction {
    kind: GridJunctionKind;
    /** Roundabout island radius, metres. */
    radius?: number;
    /** Bridge: how far the upper street passes over the lower one, metres. */
    clearance?: number;
}
export const GRID_BRIDGE = { minClearance: 3, maxClearance: 30, defaultClearance: 7 } as const;
/** A bridge's clearance (metres), clamped. */
export function gridBridgeClearance(j: GridJunction | null | undefined): number {
    const c = j?.clearance ?? GRID_BRIDGE.defaultClearance;
    return Math.min(GRID_BRIDGE.maxClearance, Math.max(GRID_BRIDGE.minClearance, c));
}
/** The axis a bridge junction carries over the other, or null (not a bridge). */
export const gridBridgeOver = (j: GridJunction | null | undefined): 'x' | 'z' | null => (j?.kind === 'bridgeX' ? 'x' : j?.kind === 'bridgeY' ? 'z' : null);
export const GRID_ROUNDABOUT = { minRadius: 4, maxRadius: 40, defaultRadius: 10 } as const;
/** About the ring road round a roundabout's island (metres); the consumer's lanes decide the real width. */
export const GRID_RING_WIDTH = 7;

/**
 * One line's two ends moved off the straight grid. For a column line: `a` / `b` are metres along
 * x at its north / south end; for a row line: metres along z at its west / east end. Missing = 0.
 */
export interface GridLineEnds { a?: number; b?: number }

/** A ground: cells ('col,row', single cells — a merge's cells are listed one by one) with a plane under them. `id` stays when cells change: uses key their texture by it. */
export interface GridGround { id: string; cells: string[] }

export interface GridLayout {
    version: 1;
    /** Cell widths along x (metres), west to east. */
    columns: number[];
    /** Cell depths along z (metres), north to south. */
    rows: number[];
    /** loop: the outer streets close on themselves (tees on the edge, rounded corners); open: streets run out past the edge. */
    edge: GridEdgeMode;
    merged?: GridRect[];
    /** Street ids taken out (dead ends, pedestrian cuts). */
    removed?: string[];
    /** Street id -> its curve (the curving API's CurveSegment: bend sideways / up, peak, sharpness). */
    curves?: Record<string, CurveSegment>;
    /** Cell id ('col,row', a merged rect by its first cell) -> fill. */
    cells?: Record<string, GridCellFill>;
    /** Node id -> turn radius in metres where a street turns a corner (absent = automatic). */
    corners?: Record<string, number>;
    /** Node id -> how the junction there is built (absent = a crossing). */
    junctions?: Record<string, GridJunction>;
    /** Line index ('0'..columns.length / '0'..rows.length) -> its ends off the straight grid. */
    ends?: { cols?: Record<string, GridLineEnds>; rows?: Record<string, GridLineEnds> };
    /** Node id -> its height in metres (absent = 0). */
    heights?: Record<string, number>;
    /** Node id -> [dx, dz] metres off where its lines cross. */
    offsets?: Record<string, [number, number]>;
    /** 'smooth': streets ease through their nodes' heights (the curving API's heightCurve); absent = straight ramps. */
    heightCurve?: 'smooth';
    /** Grounds: cells with a plane under them (see GridGround). */
    grounds?: GridGround[];
}

export interface GridArms { n: boolean; e: boolean; s: boolean; w: boolean }
export interface GridNode {
    id: string; i: number; j: number; x: number; z: number;
    /** Height in metres (layout.heights; 0 when not set). */
    y: number;
    /** Streets that meet here — and, on an open edge, the stubs running out of the grid. */
    arms: GridArms;
    /** Open edge: the arms that are stubs running out past the grid (no street, nothing beyond). */
    stubs: GridArms;
    /** How many arms meet here (0..4, stubs included). */
    degree: number;
    /** On the outer border of the grid. */
    border: boolean;
    /** Two streets meeting at a right angle (a corner the street turns round). */
    turn: boolean;
    /** Where it turns: the radius of the round (gridCornerRadius), else 0. */
    cornerRadius: number;
    /** 3 or 4 streets meet: how the junction is built. */
    junction: GridJunction | null;
}
export interface GridStreet {
    id: string; axis: 'x' | 'z'; i: number; j: number;
    from: string; to: string;
    a: [number, number]; b: [number, number];
    length: number;
    /** Its bend, filled in: side (metres to the right of travel, clamped to the street), lift (metres up), peak, sharpness. */
    bend: Required<CurveBend>;
}
export interface GridCell {
    id: string; col: number; row: number; cols: number; rows: number;
    /** The box around it (between the street centre lines). */
    x0: number; z0: number; x1: number; z1: number;
    /** Its four corners, [x, z], north-west, north-east, south-east, south-west (a rectangle unless lines slant). */
    corners: Array<[number, number]>;
    merged: boolean;
    fill?: GridCellFill;
}
export interface GridPlan {
    layout: GridLayout;
    /** Straight column line x positions (columns.length + 1) and row line z positions (rows.length + 1), before line ends. */
    xs: number[]; zs: number[];
    nodes: GridNode[];
    streets: GridStreet[];
    cells: GridCell[];
    /** The extent of the nodes. */
    width: number; depth: number;
    minX: number; minZ: number; maxX: number; maxZ: number;
}

export const GRID_LIMITS = { maxLines: 40, minSize: 40, maxSize: 2000 } as const;

export const gridStreetId = (axis: 'x' | 'z', i: number, j: number): string => `${axis}:${i},${j}`;
export const gridNodeId = (i: number, j: number): string => `${i},${j}`;
export const gridCellId = (col: number, row: number): string => `${col},${row}`;

/** The quick grid: `columns` x `rows` STREETS (nodes) a `pitch` apart — what streetGrid's knobs describe. */
export function uniformGridLayout(columns: number, rows: number, pitch: number, edge: GridEdgeMode = 'loop'): GridLayout {
    const nc = Math.max(1, Math.round(columns) - 1), nr = Math.max(1, Math.round(rows) - 1);
    const p = clampSize(pitch);
    return { version: 1, columns: Array(nc).fill(p), rows: Array(nr).fill(p), edge };
}

/** The merged rectangle holding cell (col, row), or null. */
export function gridMergedAt(layout: GridLayout, col: number, row: number): GridRect | null {
    for (const r of layout.merged ?? []) if (col >= r.col && col < r.col + r.cols && row >= r.row && row < r.row + r.rows) return r;
    return null;
}

/** True when a street is drawn: not removed and not inside a merged rectangle. */
export function gridStreetExists(layout: GridLayout, axis: 'x' | 'z', i: number, j: number): boolean {
    const nc = layout.columns.length, nr = layout.rows.length;
    if (axis === 'x' ? (i < 0 || i >= nc || j < 0 || j > nr) : (i < 0 || i > nc || j < 0 || j >= nr)) return false;
    if (layout.removed?.includes(gridStreetId(axis, i, j))) return false;
    // The two cells on either side: inside one merged rectangle -> the street is inside it.
    const [c1, r1, c2, r2] = axis === 'x' ? [i, j - 1, i, j] : [i - 1, j, i, j];
    const m1 = gridMergedAt(layout, c1, r1), m2 = gridMergedAt(layout, c2, r2);
    return !(m1 && m1 === m2);
}

/** Read a grid layout: lines, cells, streets, nodes. */
export function gridLayoutPlan(layout: GridLayout): GridPlan {
    const xs = linePositions(layout.columns), zs = linePositions(layout.rows);
    const nc = layout.columns.length, nr = layout.rows.length;
    const pos = gridNodePositions(layout, xs, zs);
    const P = (i: number, j: number) => pos[j * (nc + 1) + i];
    const streets: GridStreet[] = [];
    const has = new Set<string>();
    for (let j = 0; j <= nr; j++) for (let i = 0; i < nc; i++) if (gridStreetExists(layout, 'x', i, j)) has.add(gridStreetId('x', i, j));
    for (let i = 0; i <= nc; i++) for (let j = 0; j < nr; j++) if (gridStreetExists(layout, 'z', i, j)) has.add(gridStreetId('z', i, j));
    for (const id of has) {
        const axis = id[0] as 'x' | 'z';
        const [i, j] = id.slice(2).split(',').map(Number);
        const pa = P(i, j), pb = axis === 'x' ? P(i + 1, j) : P(i, j + 1);
        const a: [number, number] = [pa[0], pa[2]];
        const b: [number, number] = [pb[0], pb[2]];
        const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const cb = layout.curves?.[id]?.bend;
        const lim = length * CURVE_LIMITS.maxBendShare;
        streets.push({
            id, axis, i, j, a, b, length,
            from: gridNodeId(i, j), to: axis === 'x' ? gridNodeId(i + 1, j) : gridNodeId(i, j + 1),
            bend: { side: Math.max(-lim, Math.min(lim, Number(cb?.side ?? 0) || 0)), lift: Number(cb?.lift ?? 0) || 0, peak: curvePeak(cb?.peak), sharpness: curveSharpness(cb?.sharpness) },
        });
    }
    const nodes: GridNode[] = [];
    for (let j = 0; j <= nr; j++) for (let i = 0; i <= nc; i++) {
        const arms: GridArms = {
            n: has.has(gridStreetId('z', i, j - 1)), s: has.has(gridStreetId('z', i, j)),
            w: has.has(gridStreetId('x', i - 1, j)), e: has.has(gridStreetId('x', i, j)),
        };
        // an open edge: a border node that has streets gets a stub out of the grid on each outer side
        const stubs: GridArms = { n: false, e: false, s: false, w: false };
        if (layout.edge === 'open' && (arms.n || arms.s || arms.e || arms.w)) {
            if (j === 0) stubs.n = true; if (j === nr) stubs.s = true;
            if (i === 0) stubs.w = true; if (i === nc) stubs.e = true;
            arms.n ||= stubs.n; arms.s ||= stubs.s; arms.w ||= stubs.w; arms.e ||= stubs.e;
        }
        const degree = (arms.n ? 1 : 0) + (arms.s ? 1 : 0) + (arms.w ? 1 : 0) + (arms.e ? 1 : 0);
        const id = gridNodeId(i, j);
        const turn = degree === 2 && !(arms.n && arms.s) && !(arms.e && arms.w);
        let cornerRadius = 0;
        if (turn) {
            const legs: number[] = [];
            const leg = (p: [number, number, number]) => Math.hypot(p[0] - P(i, j)[0], p[2] - P(i, j)[2]);
            if (arms.n) legs.push(leg(P(i, j - 1))); if (arms.s) legs.push(leg(P(i, j + 1)));
            if (arms.w) legs.push(leg(P(i - 1, j))); if (arms.e) legs.push(leg(P(i + 1, j)));
            cornerRadius = gridCornerRadius(Math.min(...legs), layout.corners?.[id]);
        }
        const jn = degree >= 3 ? (layout.junctions?.[id] ?? { kind: 'crossing' as const }) : null;
        const p = P(i, j);
        nodes.push({ id, i, j, x: p[0], z: p[2], y: p[1], arms, stubs, degree, border: i === 0 || j === 0 || i === nc || j === nr, turn, cornerRadius, junction: jn });
    }
    const cellOf = (col: number, row: number, cols: number, rows: number) => {
        const corners: Array<[number, number]> = [P(col, row), P(col + cols, row), P(col + cols, row + rows), P(col, row + rows)].map((q) => [q[0], q[2]]);
        const X = corners.map((q) => q[0]), Z = corners.map((q) => q[1]);
        return { corners, x0: Math.min(...X), z0: Math.min(...Z), x1: Math.max(...X), z1: Math.max(...Z) };
    };
    const cells: GridCell[] = [];
    const seen = new Set<GridRect>();
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
        const m = gridMergedAt(layout, c, r);
        if (m) {
            if (seen.has(m)) continue;
            seen.add(m);
            const id = gridCellId(m.col, m.row);
            cells.push({ id, col: m.col, row: m.row, cols: m.cols, rows: m.rows, ...cellOf(m.col, m.row, m.cols, m.rows), merged: true, fill: layout.cells?.[id] });
        } else {
            const id = gridCellId(c, r);
            cells.push({ id, col: c, row: r, cols: 1, rows: 1, ...cellOf(c, r, 1, 1), merged: false, fill: layout.cells?.[id] });
        }
    }
    let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
    for (const q of pos) { minX = Math.min(minX, q[0]); maxX = Math.max(maxX, q[0]); minZ = Math.min(minZ, q[2]); maxZ = Math.max(maxZ, q[2]); }
    return { layout, xs, zs, nodes, streets, cells, width: maxX - minX, depth: maxZ - minZ, minX, minZ, maxX, maxZ };
}

/**
 * Where every node is ([x, y, z], row by row: index j * (columns + 1) + i): where its column line
 * crosses its row line, at its height. A column line runs straight from its north end
 * (x = xs[i] + a) to its south end (xs[i] + b) over the grid's depth; a row line from its west
 * end (z = zs[j] + a) to its east end over its width. With no `ends` a node is (xs[i], y, zs[j]).
 */
export function gridNodePositions(layout: GridLayout, xs = linePositions(layout.columns), zs = linePositions(layout.rows)): Array<[number, number, number]> {
    const nc = layout.columns.length, nr = layout.rows.length;
    const X0 = xs[0], X1 = xs[nc], Z0 = zs[0], Z1 = zs[nr];
    const W = X1 - X0 || 1, D = Z1 - Z0 || 1;
    const col = (i: number) => layout.ends?.cols?.[String(i)];
    const row = (j: number) => layout.ends?.rows?.[String(j)];
    const out: Array<[number, number, number]> = [];
    for (let j = 0; j <= nr; j++) for (let i = 0; i <= nc; i++) {
        const c = col(i), r = row(j);
        const id = gridNodeId(i, j);
        const y = layout.heights?.[id] ?? 0;
        const [ox, oz] = layout.offsets?.[id] ?? [0, 0];
        if (!c && !r) { out.push([xs[i] + ox, y, zs[j] + oz]); continue; }
        // column line: x = xN + q (z - Z0);  row line: z = zW + w (x - X0)
        const xN = xs[i] + (c?.a ?? 0), q = ((c?.b ?? 0) - (c?.a ?? 0)) / D;
        const zW = zs[j] + (r?.a ?? 0), w = ((r?.b ?? 0) - (r?.a ?? 0)) / W;
        const det = 1 - q * w;
        const x = Math.abs(det) > 1e-6 ? (xN + q * (zW - Z0 - w * X0)) / det : xs[i];
        const z = zW + w * (x - X0);
        out.push([x + ox, y, z + oz]);
    }
    return out;
}

/**
 * The height at fraction t (0..1) along the stretch of line from node (i, j) to the next node
 * along `axis` ('x': to (i + 1, j); 'z': to (i, j + 1)): straight between the two heights, or a
 * smooth curve through the neighbours on the same line (heightCurve 'smooth': curveHermite), plus
 * the street's lift (its bend's lift, curveBulge: level at both ends). Streets, cell edges and
 * handles all read this.
 */
export function gridSegmentHeight(plan: GridPlan, axis: 'x' | 'z', i: number, j: number, t: number): number {
    const nc = plan.layout.columns.length, nr = plan.layout.rows.length;
    const N = (a: number, b: number): GridNode | null => (a < 0 || b < 0 || a > nc || b > nr ? null : plan.nodes[b * (nc + 1) + a]);
    const [di, dj] = axis === 'x' ? [1, 0] : [0, 1];
    const A = N(i, j), B = N(i + di, j + dj);
    if (!A || !B) return A?.y ?? 0;
    const dist = (p: GridNode, q: GridNode) => Math.hypot(q.x - p.x, q.z - p.z);
    const L = dist(A, B) || 1;
    // roundabout platforms at either end: level out to their edge; the street climbs between them
    let rA = gridPlatformRadius(A), rB = gridPlatformRadius(B);
    if (rA + rB > 0.9 * L) { const k = (0.9 * L) / (rA + rB); rA *= k; rB *= k; }
    const Le = L - rA - rB;
    const d = t * L;
    const te = Math.min(1, Math.max(0, (d - rA) / Le));   // t on the climbing stretch
    let y: number;
    if (plan.layout.heightCurve === 'smooth') {
        // Hermite with Catmull-Rom slopes (uneven spacing), level into a platform
        const P = N(i - di, j - dj), Q = N(i + 2 * di, j + 2 * dj);
        y = curveHermite(A.y, B.y, te, L, P ? { y: P.y, d: dist(P, A) } : null, Q ? { y: Q.y, d: dist(B, Q) } : null, rA > 0, rB > 0, Le);
    } else y = A.y + (B.y - A.y) * te;
    t = te;   // an arch and a bridge ramp also live on the climbing stretch, off the platforms
    const bend = plan.layout.curves?.[gridStreetId(axis, i, j)]?.bend;
    const lift = Number(bend?.lift ?? 0) || 0;
    // a bridge carrying this street at either end: up to its clearance there, level at both ends
    const deck = (n: GridNode) => (gridBridgeOver(n.junction) === axis ? gridBridgeClearance(n.junction) : 0);
    const ca = deck(A), cb = deck(B);
    const shape = lift ? curveBulge(t, curvePeak(bend?.peak), curveSharpness(bend?.sharpness)) : 0;
    return y + lift * shape + ca * (1 + Math.cos(Math.PI * t)) / 2 + cb * (1 - Math.cos(Math.PI * t)) / 2;
}

/**
 * A street's centre line in 3D, [x, y, z] from a to b: gridStreetPoints (bends, trims) at the
 * heights of gridSegmentHeight; when its height curves (smooth heights / a lift) it is sampled every
 * `step` metres so the curve shows.
 */
export function gridStreetPoints3d(plan: GridPlan, street: GridStreet, trimA = 0, trimB = 0, step = 4): Array<[number, number, number]> {
    const L = street.length || 1;
    const dx = (street.b[0] - street.a[0]) / L, dz = (street.b[1] - street.a[1]) / L;
    let pts = gridStreetPoints(street, trimA, trimB, step);
    const A = plan.nodes.find((n) => n.id === street.from), B = plan.nodes.find((n) => n.id === street.to);
    const curved = (plan.layout.heightCurve === 'smooth' && A && B && (A.y !== 0 || B.y !== 0)) || !!street.bend.lift
        || gridBridgeOver(A?.junction) === street.axis || gridBridgeOver(B?.junction) === street.axis;
    if (curved) {
        const dense: Array<[number, number]> = [pts[0]];
        for (let k = 1; k < pts.length; k++) {
            const [x0, z0] = pts[k - 1], [x1, z1] = pts[k];
            const n = Math.max(1, Math.ceil((Math.hypot(x1 - x0, z1 - z0) / step) * curveDensity(street.bend.sharpness)));
            for (let q = 1; q <= n; q++) dense.push([x0 + ((x1 - x0) * q) / n, z0 + ((z1 - z0) * q) / n]);
        }
        pts = dense;
    }
    return pts.map(([x, z]) => {
        const t = Math.min(1, Math.max(0, ((x - street.a[0]) * dx + (z - street.a[1]) * dz) / L));
        return [x, gridSegmentHeight(plan, street.axis, street.i, street.j, t), z];
    });
}

/** How far a node's level platform reaches (metres): a roundabout's island and ring; 0 for anything else. */
export function gridPlatformRadius(n: GridNode | null | undefined): number {
    return n?.junction?.kind === 'roundabout' ? gridRoundaboutRadius(n.junction) + GRID_RING_WIDTH : 0;
}

/** One open-edge stub: from its node out past the grid, along its line, `length` metres. */
export interface GridStub { node: string; side: 'n' | 'e' | 's' | 'w'; a: [number, number, number]; b: [number, number, number] }

/** The open edge's stubs (none on a loop edge): each runs on from its node in the direction its line comes in. */
export function gridStubs(plan: GridPlan, length = GRID_STUB_LENGTH): GridStub[] {
    const nc = plan.layout.columns.length, nr = plan.layout.rows.length;
    const N = (i: number, j: number) => plan.nodes[j * (nc + 1) + i];
    const out: GridStub[] = [];
    for (const n of plan.nodes) {
        if (!n.stubs) continue;
        // the neighbour inside the grid on the same line: the stub continues away from it
        const inner = { n: [n.i, n.j + 1], s: [n.i, n.j - 1], w: [n.i + 1, n.j], e: [n.i - 1, n.j] } as const;
        const fallback = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] } as const;
        for (const side of ['n', 'e', 's', 'w'] as const) {
            if (!n.stubs[side]) continue;
            const [ii, jj] = inner[side];
            const m = ii >= 0 && jj >= 0 && ii <= nc && jj <= nr ? N(ii, jj) : null;
            let dx = m ? n.x - m.x : fallback[side][0], dz = m ? n.z - m.z : fallback[side][1];
            const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
            out.push({ node: n.id, side, a: [n.x, n.y, n.z], b: [n.x + dx * length, n.y, n.z + dz * length] });
        }
    }
    return out;
}

/** The single (unmerged) cell under a point, as [col, row], or null outside the grid. */
export function gridCellAt(plan: GridPlan, x: number, z: number): [number, number] | null {
    const nc = plan.layout.columns.length, nr = plan.layout.rows.length;
    if (x < plan.minX || x > plan.maxX || z < plan.minZ || z > plan.maxZ) return null;
    const N = (i: number, j: number) => plan.nodes[j * (nc + 1) + i];
    for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
        const q = [N(c, r), N(c + 1, r), N(c + 1, r + 1), N(c, r + 1)];
        let inside = false;
        for (let k = 0, l = 3; k < 4; l = k++) {
            if ((q[k].z > z) !== (q[l].z > z) && x < ((q[l].x - q[k].x) * (z - q[k].z)) / (q[l].z - q[k].z) + q[k].x) inside = !inside;
        }
        if (inside) return [c, r];
    }
    return null;
}

/**
 * How far a street's corner round reaches (the curving API's curveCornerCut): the user's value
 * (layout.corners) or automatic (60 m), never more than 45% of the shorter leg so two rounds on
 * one street never meet. `shortLeg` = the shorter of the two streets at the corner.
 */
export function gridCornerRadius(shortLeg: number, wanted?: number): number {
    return curveCornerCut(shortLeg, wanted === undefined || !Number.isFinite(wanted) ? 60 : wanted);
}

/** A roundabout's island radius (metres), clamped. */
export function gridRoundaboutRadius(j: GridJunction | null | undefined): number {
    const r = j?.radius ?? GRID_ROUNDABOUT.defaultRadius;
    return Math.min(GRID_ROUNDABOUT.maxRadius, Math.max(GRID_ROUNDABOUT.minRadius, r));
}

/**
 * A street's centre line as [x, z] points from a to b, `step` metres apart: the curving API's
 * curveSidePoints — its bend is a smooth bulge that is zero within `trimA` of a and `trimB` of b,
 * so a junction arm or a rounded corner at either end stays straight.
 */
export function gridStreetPoints(street: GridStreet, trimA = 0, trimB = 0, step = 4): Array<[number, number]> {
    // the street's sideways bend only: its lift is a height (gridSegmentHeight)
    const { side, peak, sharpness } = street.bend;
    return curveSidePoints(street.a, street.b, { side, peak, sharpness }, trimA, trimB, step);
}

/** A corner's round on the grid: the curving API's quadratic through the node, `steps` steps (10 everywhere on grids). */
export const gridCornerPoints = <T extends number[]>(a: T, node: T, b: T, steps = 10): T[] => curveCornerPoints(a, node, b, steps);

// ---------------------------------------------------------------------------- validation
/** Check and normalise a layout from anywhere (a script, a preset, the editor). Fatal problems -> layout null. */
export function validateGridLayout(raw: unknown): { layout: GridLayout | null; errors: string[] } {
    const errors: string[] = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { layout: null, errors: ['A grid layout must be an object { columns, rows, edge, merged?, removed?, curves?, cells? }.'] };
    const o = raw as Record<string, unknown>;
    const sizes = (key: 'columns' | 'rows'): number[] | null => {
        const v = o[key];
        if (!Array.isArray(v) || v.length < 1 || v.length > GRID_LIMITS.maxLines - 1 || !v.every((x) => typeof x === 'number' && Number.isFinite(x))) {
            errors.push(`${key} must be 1-${GRID_LIMITS.maxLines - 1} cell sizes in metres, e.g. [150, 150, 300, 150].`);
            return null;
        }
        return (v as number[]).map(clampSize);
    };
    const columns = sizes('columns'), rows = sizes('rows');
    if (!columns || !rows) return { layout: null, errors };
    const edge: GridEdgeMode = o.edge === 'open' ? 'open' : 'loop';
    if (o.edge !== undefined && o.edge !== 'open' && o.edge !== 'loop') errors.push(`edge must be 'loop' or 'open' (got ${JSON.stringify(o.edge)}); using 'loop'.`);
    const layout: GridLayout = { version: 1, columns, rows, edge };
    const nc = columns.length, nr = rows.length;
    if (Array.isArray(o.merged)) {
        const merged: GridRect[] = [];
        for (const m of o.merged as unknown[]) {
            const r = m as Record<string, unknown>;
            const ok = r && [r.col, r.row, r.cols, r.rows].every((x) => Number.isInteger(x));
            const rect = ok ? { col: r.col as number, row: r.row as number, cols: r.cols as number, rows: r.rows as number } : null;
            if (!rect || rect.col < 0 || rect.row < 0 || rect.cols < 1 || rect.rows < 1 || rect.col + rect.cols > nc || rect.row + rect.rows > nr) {
                errors.push(`merged ${JSON.stringify(m)} must be { col, row, cols, rows } inside the ${nc} x ${nr} cells; skipped.`);
                continue;
            }
            if (rect.cols * rect.rows < 2) continue;   // a single cell is already one cell
            if (merged.some((q) => rect.col < q.col + q.cols && q.col < rect.col + rect.cols && rect.row < q.row + q.rows && q.row < rect.row + rect.rows)) {
                errors.push(`merged ${JSON.stringify(m)} overlaps another merged rectangle; skipped.`);
                continue;
            }
            merged.push(rect);
        }
        if (merged.length) layout.merged = merged;
    }
    if (Array.isArray(o.removed)) {
        const removed = (o.removed as unknown[]).filter((id): id is string => typeof id === 'string' && validStreetId(id, nc, nr));
        if (removed.length !== (o.removed as unknown[]).length) errors.push(`removed: street ids are 'x:i,j' (along x from node i,j) or 'z:i,j' (along z) inside the grid; unknown ones skipped.`);
        if (removed.length) layout.removed = [...new Set(removed)];
    }
    if (o.cells && typeof o.cells === 'object' && !Array.isArray(o.cells)) {
        const cells: Record<string, GridCellFill> = {};
        for (const [id, v] of Object.entries(o.cells as Record<string, unknown>)) {
            const [c, r] = id.split(',').map(Number);
            const f = v as Record<string, unknown>;
            if (!Number.isInteger(c) || !Number.isInteger(r) || c < 0 || r < 0 || c >= nc || r >= nr || !f || !GRID_CELL_KINDS.includes(f.kind as GridCellKind)) {
                errors.push(`cells.${id} skipped (a 'col,row' id -> { kind: ${GRID_CELL_KINDS.join(' | ')}, mix?, seed? }).`);
                continue;
            }
            const fill: GridCellFill = { kind: f.kind as GridCellKind };
            if (typeof f.mix === 'string') fill.mix = f.mix;
            if (typeof f.seed === 'number' && Number.isFinite(f.seed)) fill.seed = f.seed;
            cells[id] = fill;
        }
        if (Object.keys(cells).length) layout.cells = cells;
    }
    const nodeOk = (id: string) => { const m = /^(\d+),(\d+)$/.exec(id); return !!m && Number(m[1]) <= nc && Number(m[2]) <= nr; };
    if (o.corners && typeof o.corners === 'object' && !Array.isArray(o.corners)) {
        const corners: Record<string, number> = {};
        for (const [id, v] of Object.entries(o.corners as Record<string, unknown>)) {
            if (!nodeOk(id) || typeof v !== 'number' || !Number.isFinite(v) || v < 0) { errors.push(`corners.${id} skipped (a node id 'i,j' -> radius in metres).`); continue; }
            corners[id] = v;
        }
        if (Object.keys(corners).length) layout.corners = corners;
    }
    if (o.junctions && typeof o.junctions === 'object' && !Array.isArray(o.junctions)) {
        const junctions: Record<string, GridJunction> = {};
        for (const [id, v] of Object.entries(o.junctions as Record<string, unknown>)) {
            const j = v as Record<string, unknown>;
            if (!nodeOk(id) || !j || !['crossing', 'roundabout', 'bridgeX', 'bridgeY'].includes(j.kind as string)) { errors.push(`junctions.${id} skipped (a node id 'i,j' -> { kind: 'crossing' | 'roundabout' | 'bridgeX' | 'bridgeY', radius?, clearance? }).`); continue; }
            if (j.kind === 'crossing') continue;   // the default
            if (j.kind === 'roundabout') junctions[id] = { kind: 'roundabout', ...(typeof j.radius === 'number' && Number.isFinite(j.radius) ? { radius: gridRoundaboutRadius({ kind: 'roundabout', radius: j.radius }) } : {}) };
            else junctions[id] = { kind: j.kind as GridJunctionKind, ...(typeof j.clearance === 'number' && Number.isFinite(j.clearance) ? { clearance: gridBridgeClearance({ kind: 'bridgeX', clearance: j.clearance }) } : {}) };
        }
        if (Object.keys(junctions).length) layout.junctions = junctions;
    }
    if (o.ends && typeof o.ends === 'object' && !Array.isArray(o.ends)) {
        const e = o.ends as Record<string, unknown>;
        const read = (key: 'cols' | 'rows', lines: number): Record<string, GridLineEnds> | null => {
            const v = e[key];
            if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
            const out: Record<string, GridLineEnds> = {};
            for (const [id, raw] of Object.entries(v as Record<string, unknown>)) {
                const k = Number(id), q = raw as Record<string, unknown>;
                if (!Number.isInteger(k) || k < 0 || k > lines || !q || typeof q !== 'object') { errors.push(`ends.${key}.${id} skipped (a line index 0-${lines} -> { a?, b? } in metres).`); continue; }
                const ends = cleanEnds(q);
                if (ends) out[String(k)] = ends;
            }
            return Object.keys(out).length ? out : null;
        };
        const cols = read('cols', nc), rows = read('rows', nr);
        if (cols || rows) layout.ends = { ...(cols ? { cols } : {}), ...(rows ? { rows } : {}) };
    }
    if (o.heights && typeof o.heights === 'object' && !Array.isArray(o.heights)) {
        const heights: Record<string, number> = {};
        for (const [id, v] of Object.entries(o.heights as Record<string, unknown>)) {
            if (!nodeOk(id) || typeof v !== 'number' || !Number.isFinite(v)) { errors.push(`heights.${id} skipped (a node id 'i,j' -> metres).`); continue; }
            const h = Math.round(Math.max(-GRID_LIMITS.maxSize, Math.min(GRID_LIMITS.maxSize, v)) * 100) / 100;
            if (Math.abs(h) >= 0.01) heights[id] = h;
        }
        if (Object.keys(heights).length) layout.heights = heights;
    }
    if (o.heightCurve === 'smooth' || o.smooth === true) layout.heightCurve = 'smooth';   // `smooth: true`: grids saved before the curving API
    if (o.offsets && typeof o.offsets === 'object' && !Array.isArray(o.offsets)) {
        const offsets: Record<string, [number, number]> = {};
        for (const [id, v] of Object.entries(o.offsets as Record<string, unknown>)) {
            if (!nodeOk(id) || !Array.isArray(v) || v.length !== 2 || !v.every((x) => typeof x === 'number' && Number.isFinite(x))) { errors.push(`offsets.${id} skipped (a node id 'i,j' -> [dx, dz] metres).`); continue; }
            const q = (v as number[]).map((x) => Math.round(Math.max(-GRID_LIMITS.maxSize, Math.min(GRID_LIMITS.maxSize, x)) * 100) / 100) as [number, number];
            if (Math.abs(q[0]) >= 0.01 || Math.abs(q[1]) >= 0.01) offsets[id] = q;
        }
        if (Object.keys(offsets).length) layout.offsets = offsets;
    }
    const curves = readCurves(o, nc, nr, errors);
    if (curves) layout.curves = curves;
    if (Array.isArray(o.grounds)) {
        const grounds: GridGround[] = [], taken = new Set<string>(), ids = new Set<string>();
        for (const g of o.grounds as unknown[]) {
            const q = g as Record<string, unknown>;
            if (!q || typeof q.id !== 'string' || !q.id || ids.has(q.id) || !Array.isArray(q.cells)) { errors.push(`grounds: ${JSON.stringify(g)?.slice(0, 60)} skipped (each ground is { id, cells: ['col,row', …] } with its own id).`); continue; }
            const cells: string[] = [];
            for (const id of q.cells as unknown[]) {
                const m = typeof id === 'string' ? /^(\d+),(\d+)$/.exec(id) : null;
                if (!m || Number(m[1]) >= nc || Number(m[2]) >= nr) { errors.push(`grounds.${q.id}: cell ${JSON.stringify(id)} skipped (a 'col,row' inside the ${nc} x ${nr} cells).`); continue; }
                if (taken.has(id as string)) continue;   // a cell is in one ground at most: the first keeps it
                taken.add(id as string); cells.push(id as string);
            }
            if (cells.length) { ids.add(q.id); grounds.push({ id: q.id, cells }); }
        }
        if (grounds.length) layout.grounds = grounds;
    }
    return { layout, errors };
}

const END_KEYS = ['a', 'b'] as const;
/** Only the finite, non-zero end values (rounded to cm, within ±GRID_LIMITS.maxSize); null when nothing is left. */
function cleanEnds(q: Record<string, unknown>): GridLineEnds | null {
    const out: GridLineEnds = {};
    for (const k of END_KEYS) {
        const v = q[k];
        if (typeof v !== 'number' || !Number.isFinite(v)) continue;
        const r = Math.round(Math.max(-GRID_LIMITS.maxSize, Math.min(GRID_LIMITS.maxSize, v)) * 100) / 100;
        if (Math.abs(r) >= 0.01) out[k] = r;
    }
    return Object.keys(out).length ? out : null;
}

// ---------------------------------------------------------------------------- editing
// Pure edits (each returns a new layout). Inserting or removing a column / row renumbers every
// id after it — streets, merges, bends, fills — so they live here, next to the plan, and the
// editor, the agent and any later tool edit grids the same way.

type Axis = 'col' | 'row';
const keyOf = (axis: Axis) => (axis === 'col' ? 'columns' : 'rows') as 'columns' | 'rows';

/** Re-key a layout's line / cell indices on one axis. cell(k) -> new cell index or null (dropped); line(k) likewise. */
function remap(layout: GridLayout, axis: Axis, cell: (k: number) => number | null, line: (k: number) => number | null, sizes: number[], rect: (start: number, span: number) => [number, number] | null): GridLayout {
    const out: GridLayout = { version: 1, columns: axis === 'col' ? sizes : [...layout.columns], rows: axis === 'row' ? sizes : [...layout.rows], edge: layout.edge };
    // A street along the axis is indexed by a CELL on that axis and a LINE on the other; across it, the reverse.
    const street = (id: string): string | null => {
        const m = /^([xz]):(\d+),(\d+)$/.exec(id);
        if (!m) return null;
        let i = Number(m[2]), j = Number(m[3]);
        const along = (m[1] === 'x') === (axis === 'col');      // x streets are indexed by column cell i
        if (axis === 'col') { const n = along ? cell(i) : line(i); if (n === null) return null; i = n; }
        else { const n = along ? cell(j) : line(j); if (n === null) return null; j = n; }
        // along === street index on this axis is a cell; for axis 'row' an x street's j is a LINE, a z street's j a CELL
        return `${m[1]}:${i},${j}`;
    };
    // Where each merged rectangle's first cell goes (its fill follows the merge even when that cell is removed).
    const movedOrigin = new Map<string, string>();
    if (layout.merged) {
        const merged: GridRect[] = [];
        for (const r of layout.merged) {
            const [start, span] = axis === 'col' ? [r.col, r.cols] : [r.row, r.rows];
            const nr = rect(start, span);
            if (!nr) continue;
            const q = axis === 'col' ? { ...r, col: nr[0], cols: nr[1] } : { ...r, row: nr[0], rows: nr[1] };
            movedOrigin.set(gridCellId(r.col, r.row), gridCellId(q.col, q.row));
            if (q.cols * q.rows >= 2) merged.push(q);
        }
        if (merged.length) out.merged = merged;
    }
    if (layout.removed) {
        const removed = layout.removed.map(street).filter((x): x is string => !!x);
        if (removed.length) out.removed = removed;
    }
    if (layout.curves) {
        const curves: Record<string, CurveSegment> = {};
        for (const [id, v] of Object.entries(layout.curves)) { const n = street(id); if (n) curves[n] = JSON.parse(JSON.stringify(v)); }
        if (Object.keys(curves).length) out.curves = curves;
    }
    // Nodes sit on lines: 'i,j' = column line i, row line j.
    const node = (id: string): string | null => {
        const m = /^(\d+),(\d+)$/.exec(id);
        if (!m) return null;
        let i = Number(m[1]), j = Number(m[2]);
        const n = line(axis === 'col' ? i : j);
        if (n === null) return null;
        if (axis === 'col') i = n; else j = n;
        return gridNodeId(i, j);
    };
    if (layout.corners) {
        const corners: Record<string, number> = {};
        for (const [id, v] of Object.entries(layout.corners)) { const n = node(id); if (n) corners[n] = v; }
        if (Object.keys(corners).length) out.corners = corners;
    }
    if (layout.junctions) {
        const junctions: Record<string, GridJunction> = {};
        for (const [id, v] of Object.entries(layout.junctions)) { const n = node(id); if (n) junctions[n] = { ...v }; }
        if (Object.keys(junctions).length) out.junctions = junctions;
    }
    if (layout.heights) {
        const heights: Record<string, number> = {};
        for (const [id, v] of Object.entries(layout.heights)) { const n = node(id); if (n) heights[n] = v; }
        if (Object.keys(heights).length) out.heights = heights;
    }
    if (layout.offsets) {
        const offsets: Record<string, [number, number]> = {};
        for (const [id, v] of Object.entries(layout.offsets)) { const n = node(id); if (n) offsets[n] = [v[0], v[1]]; }
        if (Object.keys(offsets).length) out.offsets = offsets;
    }
    if (layout.heightCurve) out.heightCurve = layout.heightCurve;
    if (layout.ends) {
        const own = axis === 'col' ? 'cols' : 'rows', other = axis === 'col' ? 'rows' : 'cols';
        const moved: Record<string, GridLineEnds> = {};
        for (const [id, v] of Object.entries(layout.ends[own] ?? {})) { const n = line(Number(id)); if (n !== null) moved[String(n)] = { ...v }; }
        const ends: GridLayout['ends'] = {};
        if (Object.keys(moved).length) ends[own] = moved;
        if (layout.ends[other]) ends[other] = { ...layout.ends[other] };
        if (ends.cols || ends.rows) out.ends = ends;
    }
    if (layout.cells) {
        const cells: Record<string, GridCellFill> = {};
        for (const [id, f] of Object.entries(layout.cells)) {
            const moved = movedOrigin.get(id);
            if (moved) { cells[moved] = { ...f }; continue; }
            let [c, r] = id.split(',').map(Number);
            const n = cell(axis === 'col' ? c : r);
            if (n === null) continue;
            if (axis === 'col') c = n; else r = n;
            cells[gridCellId(c, r)] = { ...f };
        }
        if (Object.keys(cells).length) out.cells = cells;
    }
    if (layout.grounds) {
        const grounds: GridGround[] = [];
        for (const g of layout.grounds) {
            const cells: string[] = [];
            for (const id of g.cells) {
                let [c, r] = id.split(',').map(Number);
                const n = cell(axis === 'col' ? c : r);
                if (n === null) continue;
                if (axis === 'col') c = n; else r = n;
                cells.push(gridCellId(c, r));
            }
            if (cells.length) grounds.push({ id: g.id, cells });
        }
        if (grounds.length) out.grounds = grounds;
    }
    return out;
}

/** Insert a column / row of `size` metres at cell index `at` (0 = first; the new cell sits west / north of the old cell `at`). A merge spanning `at` grows. */
export function gridInsertLine(layout: GridLayout, axis: Axis, at: number, size?: number): GridLayout {
    const old = layout[keyOf(axis)];
    if (old.length >= GRID_LIMITS.maxLines - 1) return layout;
    const k = Math.max(0, Math.min(old.length, Math.round(at)));
    const sizes = [...old]; sizes.splice(k, 0, clampSize(size ?? old[Math.min(k, old.length - 1)] ?? 150));
    const out = remap(layout, axis, (c) => (c >= k ? c + 1 : c), (l) => (l >= k ? l + 1 : l), sizes,
        (start, span) => (start >= k ? [start + 1, span] : start + span > k ? [start, span + 1] : [start, span]));
    // a ground on both sides of the new column / row takes the new cells between them (as a merge grows)
    if (out.grounds) {
        const across = axis === 'col' ? out.rows.length : out.columns.length;
        out.grounds = out.grounds.map((g) => {
            const has = new Set(g.cells), add: string[] = [];
            for (let q = 0; q < across; q++) {
                const id = (a: number) => (axis === 'col' ? gridCellId(a, q) : gridCellId(q, a));
                if (has.has(id(k - 1)) && has.has(id(k + 1))) add.push(id(k));
            }
            return add.length ? { id: g.id, cells: [...g.cells, ...add] } : g;
        });
    }
    return out;
}

/** Remove the column / row at cell index `at`: its cells, fills and the line on its far side go; a merge loses one cell. */
export function gridRemoveLine(layout: GridLayout, axis: Axis, at: number): GridLayout {
    const old = layout[keyOf(axis)];
    if (old.length <= 1) return layout;
    const k = Math.max(0, Math.min(old.length - 1, Math.round(at)));
    const sizes = [...old]; sizes.splice(k, 1);
    return remap(layout, axis, (c) => (c === k ? null : c > k ? c - 1 : c), (l) => (l === k + 1 ? null : l > k + 1 ? l - 1 : l), sizes,
        (start, span) => (start > k ? [start - 1, span] : start + span > k ? (span > 1 ? [start, span - 1] : null) : [start, span]));
}

/** Set one column / row size (metres). */
export function gridSetSize(layout: GridLayout, axis: Axis, at: number, size: number): GridLayout {
    const sizes = [...layout[keyOf(axis)]];
    if (at < 0 || at >= sizes.length) return layout;
    sizes[at] = clampSize(size);
    return { ...layout, [keyOf(axis)]: sizes };
}

/** Merge the cells of `rect` into one. Merges fully inside it are absorbed; a merge that only partly overlaps blocks it (returns the layout unchanged). */
export function gridMerge(layout: GridLayout, rect: GridRect): GridLayout {
    if (rect.cols * rect.rows < 2) return layout;
    const inside = (q: GridRect) => q.col >= rect.col && q.row >= rect.row && q.col + q.cols <= rect.col + rect.cols && q.row + q.rows <= rect.row + rect.rows;
    const touches = (q: GridRect) => rect.col < q.col + q.cols && q.col < rect.col + rect.cols && rect.row < q.row + q.rows && q.row < rect.row + rect.rows;
    const merged = layout.merged ?? [];
    if (merged.some((q) => touches(q) && !inside(q))) return layout;
    // Fills of the absorbed cells: the first one found becomes the merged cell's fill.
    const cells = { ...(layout.cells ?? {}) };
    let fill: GridCellFill | undefined;
    for (let r = rect.row; r < rect.row + rect.rows; r++) for (let c = rect.col; c < rect.col + rect.cols; c++) {
        const id = gridCellId(c, r);
        if (cells[id] && !fill) fill = cells[id];
        delete cells[id];
    }
    if (fill) cells[gridCellId(rect.col, rect.row)] = fill;
    const out: GridLayout = { ...layout, merged: [...merged.filter((q) => !inside(q)), { ...rect }] };
    if (Object.keys(cells).length) out.cells = cells; else delete out.cells;
    return out;
}

/** Undo every merge that overlaps `rect` (its fill stays on its first cell). */
export function gridSplit(layout: GridLayout, rect: GridRect): GridLayout {
    const merged = (layout.merged ?? []).filter((q) => !(rect.col < q.col + q.cols && q.col < rect.col + rect.cols && rect.row < q.row + q.rows && q.row < rect.row + rect.rows));
    const out = { ...layout };
    if (merged.length) out.merged = merged; else delete out.merged;
    return out;
}

/** Take a street out, or put it back. */
export function gridToggleStreet(layout: GridLayout, id: string): GridLayout {
    const removed = new Set(layout.removed ?? []);
    if (removed.has(id)) removed.delete(id); else removed.add(id);
    const out = { ...layout };
    if (removed.size) out.removed = [...removed]; else delete out.removed;
    return out;
}

/**
 * Change a street's curve (the curving API's CurveBend — side, lift, peak, sharpness), merged into
 * what it has; null straightens it. Values are tidied as the editor shows them (side / lift to
 * 0.1 m, below 0.5 m / 0.05 m none; peak / sharpness to 0.01, the defaults dropped).
 */
export function gridSetCurve(layout: GridLayout, id: string, patch: CurveBend | null): GridLayout {
    const curves = { ...(layout.curves ?? {}) };
    const bend: CurveBend = patch === null ? {} : { ...(curves[id]?.bend ?? {}), ...patch };
    // tidy like a user would set it: below these it is no bend; rounded to what the editor shows
    const clean: CurveBend = {};
    if (Math.abs(bend.side ?? 0) >= 0.5) clean.side = Math.round((bend.side as number) * 10) / 10;
    if (Math.abs(bend.lift ?? 0) >= 0.05) clean.lift = Math.round((bend.lift as number) * 10) / 10;
    if (bend.peak !== undefined && Math.abs(curvePeak(bend.peak) - 0.5) >= 1e-3) clean.peak = Math.round(curvePeak(bend.peak) * 100) / 100;
    if (bend.sharpness !== undefined && Math.abs(curveSharpness(bend.sharpness) - 1) >= 1e-3) clean.sharpness = Math.round(curveSharpness(bend.sharpness) * 100) / 100;
    const rest: CurveSegment = { ...(curves[id] ?? {}) };
    delete rest.bend;
    if (Object.keys(clean).length) rest.bend = clean;
    if (Object.keys(rest).length) curves[id] = rest; else delete curves[id];
    const out = { ...layout };
    if (Object.keys(curves).length) out.curves = curves; else delete out.curves;
    return out;
}

/** Set a corner's turn radius in metres (null = automatic). */
export function gridSetCorner(layout: GridLayout, nodeId: string, radius: number | null): GridLayout {
    const corners = { ...(layout.corners ?? {}) };
    if (radius === null) delete corners[nodeId]; else corners[nodeId] = Math.max(0, Math.round(radius));
    const out = { ...layout };
    if (Object.keys(corners).length) out.corners = corners; else delete out.corners;
    return out;
}

/** Set how a junction is built (a crossing is the default and is not stored). */
export function gridSetJunction(layout: GridLayout, nodeId: string, junction: GridJunction): GridLayout {
    const junctions = { ...(layout.junctions ?? {}) };
    if (junction.kind === 'crossing') delete junctions[nodeId];
    else if (junction.kind === 'roundabout') junctions[nodeId] = { kind: 'roundabout', radius: gridRoundaboutRadius(junction) };
    else junctions[nodeId] = { kind: junction.kind, clearance: gridBridgeClearance(junction) };
    const out = { ...layout };
    if (Object.keys(junctions).length) out.junctions = junctions; else delete out.junctions;
    return out;
}

/**
 * Move one line's ends off the straight grid (merged into what it has; 0 / missing = straight,
 * flat). `null` straightens the line. axis 'col' = a column line (ends move along x), 'row' = a
 * row line (ends move along z); `at` is the line index.
 */
export function gridSetLineEnds(layout: GridLayout, axis: Axis, at: number, ends: GridLineEnds | null): GridLayout {
    const key = axis === 'col' ? 'cols' : 'rows';
    const lines = { ...(layout.ends?.[key] ?? {}) };
    const merged = ends ? cleanEnds({ ...lines[String(at)], ...ends }) : null;
    if (merged) lines[String(at)] = merged; else delete lines[String(at)];
    const next = { ...(layout.ends ?? {}), [key]: lines };
    if (!Object.keys(lines).length) delete next[key];
    const out = { ...layout };
    if (next.cols || next.rows) out.ends = next; else delete out.ends;
    return out;
}

/** Move one node off where its lines cross ([dx, dz] metres; null = back on the crossing). */
export function gridSetOffset(layout: GridLayout, nodeId: string, offset: [number, number] | null): GridLayout {
    const offsets = { ...(layout.offsets ?? {}) };
    if (!offset || (Math.abs(offset[0]) < 0.01 && Math.abs(offset[1]) < 0.01)) delete offsets[nodeId];
    else offsets[nodeId] = [Math.round(offset[0] * 10) / 10, Math.round(offset[1] * 10) / 10];
    const out = { ...layout };
    if (Object.keys(offsets).length) out.offsets = offsets; else delete out.offsets;
    return out;
}

/** Set one node's height in metres (null / 0 = on the ground). */
export function gridSetHeight(layout: GridLayout, nodeId: string, metres: number | null): GridLayout {
    const heights = { ...(layout.heights ?? {}) };
    if (metres === null || Math.abs(metres) < 0.01) delete heights[nodeId]; else heights[nodeId] = Math.round(metres * 100) / 100;
    const out = { ...layout };
    if (Object.keys(heights).length) out.heights = heights; else delete out.heights;
    return out;
}

/**
 * Lift a whole line: its nodes get an even ramp from `from` (north / west end) to `to` (south /
 * east end), by distance along the line. It replaces the heights already on that line.
 */
export function gridLiftLine(layout: GridLayout, axis: Axis, at: number, from: number, to: number): GridLayout {
    const sizes = axis === 'col' ? layout.rows : layout.columns;   // a column line runs across the rows
    const total = sizes.reduce((s, v) => s + v, 0) || 1;
    let out = layout, run = 0;
    for (let k = 0; k <= sizes.length; k++) {
        const id = axis === 'col' ? gridNodeId(at, k) : gridNodeId(k, at);
        out = gridSetHeight(out, id, from + ((to - from) * run) / total);
        run += sizes[k] ?? 0;
    }
    return out;
}

/** Set (or clear with null) the fill of cells, by cell id. */
export function gridSetFill(layout: GridLayout, ids: string[], fill: GridCellFill | null): GridLayout {
    const cells = { ...(layout.cells ?? {}) };
    for (const id of ids) { if (fill) cells[id] = { ...fill }; else delete cells[id]; }
    const out = { ...layout };
    if (Object.keys(cells).length) out.cells = cells; else delete out.cells;
    return out;
}

/** The ground holding a cell ('col,row'), or null. */
export function gridGroundOf(layout: GridLayout, cellId: string): GridGround | null {
    return layout.grounds?.find((g) => g.cells.includes(cellId)) ?? null;
}

/** Every single cell of a rectangle, as 'col,row' ids. */
export function gridRectCells(rect: GridRect): string[] {
    const out: string[] = [];
    for (let r = rect.row; r < rect.row + rect.rows; r++) for (let c = rect.col; c < rect.col + rect.cols; c++) out.push(gridCellId(c, r));
    return out;
}

/**
 * Put a ground under cells. When they touch exactly one ground already (share a cell with it), that
 * ground grows to take them; otherwise they become a new ground (id 'g1', 'g2'…, never reused).
 * Cells always leave any other ground they were in.
 */
export function gridGround(layout: GridLayout, cells: string[]): GridLayout {
    const want = new Set(cells);
    if (!want.size) return layout;
    const grounds = layout.grounds ?? [];
    const touched = grounds.filter((g) => g.cells.some((c) => want.has(c)));
    const into = touched.length === 1 ? touched[0].id : null;
    const next: GridGround[] = [];
    for (const g of grounds) {
        if (g.id === into) { next.push({ id: g.id, cells: [...g.cells.filter((c) => !want.has(c)), ...cells] }); continue; }
        const left = g.cells.filter((c) => !want.has(c));
        if (left.length) next.push(left.length === g.cells.length ? g : { id: g.id, cells: left });
    }
    if (!into) {
        const n = grounds.reduce((m, g) => Math.max(m, Number(/^g(\d+)$/.exec(g.id)?.[1] ?? 0)), 0);
        next.push({ id: `g${n + 1}`, cells: [...want] });
    }
    return { ...layout, grounds: next };
}

/** Take cells out of their grounds (a ground with no cells left goes). */
export function gridUnground(layout: GridLayout, cells: string[]): GridLayout {
    if (!layout.grounds) return layout;
    const drop = new Set(cells);
    const grounds = layout.grounds.map((g) => ({ id: g.id, cells: g.cells.filter((c) => !drop.has(c)) })).filter((g) => g.cells.length);
    const out = { ...layout };
    if (grounds.length) out.grounds = grounds; else delete out.grounds;
    return out;
}

// ---------------------------------------------------------------------------- helpers
function clampSize(v: number): number {
    return Math.min(GRID_LIMITS.maxSize, Math.max(GRID_LIMITS.minSize, Number(v) || GRID_LIMITS.minSize));
}
/** The straight line positions for cell sizes (centred on 0): sizes.length + 1 values. */
export const linePositionsOf = (sizes: number[]): number[] => linePositions(sizes);
function linePositions(sizes: number[]): number[] {
    const total = sizes.reduce((s, v) => s + v, 0);
    const out = [-total / 2];
    for (const v of sizes) out.push(out[out.length - 1] + v);
    return out;
}
function validStreetId(id: string, nc: number, nr: number): boolean {
    const m = /^([xz]):(\d+),(\d+)$/.exec(id);
    if (!m) return false;
    const i = Number(m[2]), j = Number(m[3]);
    return m[1] === 'x' ? i < nc && j <= nr : i <= nc && j < nr;
}

/**
 * A layout's street curves, checked: `curves` (street id → CurveSegment) and, for grids saved before
 * the curving API, `bends` / `arcs` / `peaks` / `sharpness` (a z street's old bend pointed east,
 * the API's side is to the right of travel: west for a z street, so it flips).
 */
function readCurves(o: Record<string, unknown>, nc: number, nr: number, errors: string[]): Record<string, CurveSegment> | null {
    const out: Record<string, CurveBend> = {};
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
    const put = (id: string, k: keyof CurveBend, v: number) => { (out[id] ??= {})[k] = v; };
    if (o.curves && typeof o.curves === 'object' && !Array.isArray(o.curves)) {
        for (const [id, c] of Object.entries(o.curves as Record<string, unknown>)) {
            const b = (c as CurveSegment | null)?.bend as Record<string, unknown> | undefined;
            if (!validStreetId(id, nc, nr) || !b || typeof b !== 'object') { errors.push(`curves.${id} skipped (a street id -> { bend: { side?, lift?, peak?, sharpness? } }).`); continue; }
            const side = num(b.side), lift = num(b.lift), peak = num(b.peak), sharp = num(b.sharpness);
            if (side !== undefined && Math.abs(side) > 1e-3) put(id, 'side', side);
            if (lift !== undefined && Math.abs(lift) >= 0.01) put(id, 'lift', Math.round(lift * 100) / 100);
            if (peak !== undefined && Math.abs(curvePeak(peak) - 0.5) > 1e-3) put(id, 'peak', Math.round(curvePeak(peak) * 100) / 100);
            if (sharp !== undefined && Math.abs(curveSharpness(sharp) - 1) > 1e-3) put(id, 'sharpness', Math.round(curveSharpness(sharp) * 100) / 100);
        }
    }
    const legacy = (key: string, f: (id: string, v: number) => void) => {
        const rec = o[key];
        if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return;
        for (const [id, v] of Object.entries(rec as Record<string, unknown>)) {
            const x = num(v);
            if (!validStreetId(id, nc, nr) || x === undefined) { errors.push(`${key}.${id} skipped.`); continue; }
            f(id, x);
        }
    };
    legacy('bends', (id, v) => { if (Math.abs(v) > 1e-3) put(id, 'side', id[0] === 'z' ? -v : v); });
    legacy('arcs', (id, v) => { if (Math.abs(v) >= 0.01) put(id, 'lift', Math.round(v * 100) / 100); });
    legacy('peaks', (id, v) => { const c = curvePeak(v); if (Math.abs(c - 0.5) > 1e-3) put(id, 'peak', Math.round(c * 100) / 100); });
    legacy('sharpness', (id, v) => { const c = curveSharpness(v); if (Math.abs(c - 1) > 1e-3) put(id, 'sharpness', Math.round(c * 100) / 100); });
    const ids = Object.keys(out);
    return ids.length ? Object.fromEntries(ids.map((id) => [id, { bend: out[id] }])) : null;
}
