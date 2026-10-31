// =============================================================================
// Parametric geometry — shapes built from parameters, never from stored vertices
// =============================================================================
//
// Six mesh variants whose config is a recipe: `outline` (a filled polygon), `extrude`
// (outline × height), `lathe` (a profile revolved about Y), `sweep` (a profile along a
// 3D path), `svg` (an SVG extruded) and `superellipsoid`. The viewer's mesh builder
// (viewer utils/shapes.ts `shapeGenerators`) and the core mesh builder
// (utils/meshUtils.ts `createMeshByType`, used for particle shapes) both call
// `buildParametricGeometry` here, so there is one builder. The agent and the
// controllers validate with `validateParametricShape` — the same messages everywhere.
//
// Conventions (every variant):
//   - lengths in metres; outlines are [x, z] (plan view), profiles [radius, y],
//     paths [x, y, z]; up to MAX_POINTS points per list;
//   - the geometry stands on its base: y = 0 at the bottom (sweeps keep their path
//     coordinates — a pipe is where its path says);
//   - UVs in metres (library textures tile at their real size), normals by crease
//     angle (smooth curves, sharp edges), closed geometry, `segments` as the one
//     quality knob.
//
// Recovered from aiAgent v2 `meshGeometryTools.ts` (retired 9 Oct 2026): the
// superellipsoid parametrisation and the parallel-transport frames of the tube
// builder (here generalised from a circle to any profile). Outlines, extrusions and
// SVG go through THREE's Shape / ExtrudeGeometry instead of v2's fan triangulation,
// which only holds for convex outlines (a pond is not convex).
//

import {
    BufferAttribute, BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, Path, Shape,
    ShapeGeometry, ShapeUtils, Vector2, Vector3,
} from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export type Pt2 = [number, number];
export type Pt3 = [number, number, number];

export const PARAMETRIC_SHAPES = ['outline', 'extrude', 'lathe', 'sweep', 'svg', 'superellipsoid'] as const;
export type ParametricShapeName = (typeof PARAMETRIC_SHAPES)[number];

export const isParametricShape = (type: unknown): type is ParametricShapeName =>
    typeof type === 'string' && (PARAMETRIC_SHAPES as readonly string[]).includes(type);

/** The most points a list may carry (an outline of 60 is already a few hundred triangles). */
export const MAX_POINTS = 200;

/** The knobs of the six variants (all optional on GeometryShapeConfig; the defaults table fills them). */
export interface ParametricShapeConfig {
    type: ParametricShapeName;
    /** outline / extrude / svg: the plan outline as [x, z] metres, counter-clockwise, no self-intersections. */
    points?: Pt2[];
    /** extrude: hole outlines inside `points`, each ≥ 3 points. */
    holes?: Pt2[][];
    /** lathe / sweep: the profile. Lathe: [radius, y] bottom → top, radius ≥ 0. Sweep: the cross-section [u, v] around the path (metres). */
    profile?: Pt2[];
    /** sweep: the path as [x, y, z] metres, ≥ 2 points. */
    path?: Pt3[];
    /** Rounding of the point list 0–1 (0 = straight segments, 1 = a smooth spline through the points). */
    curve?: number;
    /** outline: slab thickness (0 = a single face); extrude / svg: the height (depth) of the extrusion. */
    thickness?: number;
    height?: number;
    /** superellipsoid: full extents. */
    width?: number;
    depth?: number;
    bevelSize?: number;
    bevelSegments?: number;
    /** extrude: total twist over the height (degrees) and the top/bottom scale. */
    twist?: number;
    taper?: number;
    /** lathe: the swept angle (degrees, 360 = full); sweep / lathe: `cap` closes the open ends. */
    angle?: number;
    cap?: boolean;
    /** sweep: the tube radius when no profile is given; the scale at the path's end; closed loop. */
    radius?: number;
    scaleEnd?: number;
    closed?: boolean;
    /** svg: an SVG `d` path string or whole SVG markup; or an uploaded .svg asset url (loaded by the viewer). */
    svg?: string;
    svgUrl?: string;
    /** extrude / svg: `flat` lies in the ground plane and rises along Y; `upright` stands in the XY plane. */
    orientation?: 'flat' | 'upright';
    /** superellipsoid: the exponents — 1 = an ellipsoid, → 0 = a box, > 1 = pinched. e1 north–south, e2 east–west. */
    e1?: number;
    e2?: number;
    /** Quality: curve samples per point, radial / path subdivisions. */
    segments?: number;
    /** Crease angle (degrees): faces meeting below it are smoothed, above it stay sharp. */
    crease?: number;
}

const SQUARE: Pt2[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const POND: Pt2[] = [[-3, -1.6], [-1.2, -2.6], [1.4, -2.2], [3.1, -0.6], [2.6, 1.6], [0.4, 2.7], [-2, 2.1], [-3.2, 0.4]];

export const PARAMETRIC_SHAPE_DEFAULTS: Record<ParametricShapeName, ParametricShapeConfig> = {
    outline: { type: 'outline', points: POND, curve: 0.8, thickness: 0.1, bevelSize: 0, bevelSegments: 2, segments: 8, crease: 30 },
    extrude: { type: 'extrude', points: SQUARE, holes: [], curve: 0, height: 2, bevelSize: 0.05, bevelSegments: 2, twist: 0, taper: 1, orientation: 'flat', segments: 8, crease: 30 },
    lathe: { type: 'lathe', profile: [[0.3, 0], [0.9, 0.3], [0.7, 1.2], [0.35, 1.8], [0.45, 2.3]], curve: 0.6, angle: 360, cap: true, segments: 32, crease: 30 },
    sweep: { type: 'sweep', path: [[-3, 0.5, 0], [-1, 0.5, 1.5], [1, 1.5, -1], [3, 0.5, 0]], profile: [], radius: 0.15, curve: 1, scaleEnd: 1, cap: true, closed: false, segments: 12, crease: 30 },
    svg: { type: 'svg', svg: 'M 0 0 L 80 0 L 80 20 L 60 20 L 60 60 L 80 60 L 80 80 L 0 80 L 0 60 L 20 60 L 20 20 L 0 20 Z', svgUrl: '', width: 2, height: 0.2, bevelSize: 0.01, bevelSegments: 2, orientation: 'upright', segments: 8, crease: 30 },
    superellipsoid: { type: 'superellipsoid', width: 1, height: 1, depth: 1, e1: 0.4, e2: 0.4, segments: 32, crease: 30 },
};

// ----------------------------------------------------------------------------- validation

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isPt = (p: unknown, dims: number): boolean => Array.isArray(p) && p.length >= dims && p.slice(0, dims).every(isNum);

/** Signed area of a plan outline (positive = counter-clockwise in [x, z]). */
export function outlineArea(points: Pt2[]): number {
    let a = 0;
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
        a += x1 * y2 - x2 * y1;
    }
    return a / 2;
}

function segmentsCross(a: Pt2, b: Pt2, c: Pt2, d: Pt2): boolean {
    const o = (p: Pt2, q: Pt2, r: Pt2) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
    return o1 * o2 < 0 && o3 * o4 < 0;
}

/** The index of the first pair of non-adjacent edges that cross, or -1. */
export function selfIntersection(points: Pt2[], closed = true): [number, number] | null {
    const n = points.length;
    const edges = closed ? n : n - 1;
    for (let i = 0; i < edges; i++) {
        for (let j = i + 2; j < edges; j++) {
            if (closed && i === 0 && j === edges - 1) continue;
            if (segmentsCross(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) return [i, j];
        }
    }
    return null;
}

function checkList(out: string[], name: string, list: unknown, dims: number, min: number, what: string): list is number[][] {
    if (!Array.isArray(list) || !list.every((p) => isPt(p, dims))) {
        out.push(`${name} must be a list of ${what} numbers in metres, e.g. ${dims === 3 ? '[[0, 0, 0], [2, 1, 0]]' : '[[0, 0], [2, 0], [2, 2]]'}.`);
        return false;
    }
    if (list.length < min) { out.push(`${name} needs at least ${min} points (has ${list.length}).`); return false; }
    if (list.length > MAX_POINTS) { out.push(`${name} has ${list.length} points — keep it under ${MAX_POINTS} (use \`curve\` for smoothness instead of more points).`); return false; }
    for (let i = 1; i < list.length; i++) {
        const a = list[i - 1] as number[], b = list[i] as number[];
        if (a.slice(0, dims).every((v: number, k: number) => Math.abs(v - b[k]) < 1e-6)) { out.push(`${name}: points ${i} and ${i + 1} are the same — remove one.`); return false; }
    }
    return true;
}

function checkOutline(out: string[], name: string, list: unknown): list is Pt2[] {
    if (!checkList(out, name, list, 2, 3, '[x, z]')) return false;
    const pts = list as Pt2[];
    const x = selfIntersection(pts);
    if (x) { out.push(`${name} crosses itself (edge ${x[0] + 1} crosses edge ${x[1] + 1}) — reorder the points so the outline is a simple loop.`); return false; }
    if (Math.abs(outlineArea(pts)) < 1e-6) { out.push(`${name} has no area — its points lie on a line.`); return false; }
    return true;
}

/**
 * Everything wrong with a parametric shape config, as sentences that say what to fix.
 * Empty = buildable. Unknown types and non-parametric shapes return [].
 */
export function validateParametricShape(cfg: Partial<ParametricShapeConfig> & { type?: string }): string[] {
    const out: string[] = [];
    if (!cfg || !isParametricShape(cfg.type)) return out;
    const c = { ...PARAMETRIC_SHAPE_DEFAULTS[cfg.type], ...cfg } as ParametricShapeConfig;
    const pos = (key: keyof ParametricShapeConfig, label = key as string) => {
        const v = c[key];
        if (!isNum(v) || v <= 0) out.push(`${label} must be a positive number (metres).`);
    };
    switch (c.type) {
        case 'outline':
            checkOutline(out, 'points', c.points);
            if (!isNum(c.thickness) || c.thickness < 0) out.push('thickness must be 0 (a flat face) or a positive number.');
            break;
        case 'extrude': {
            const ok = checkOutline(out, 'points', c.points);
            pos('height');
            if (c.holes !== undefined && c.holes.length) {
                if (!Array.isArray(c.holes)) out.push('holes must be a list of outlines: [[[x, z], …], …].');
                else c.holes.forEach((h, i) => {
                    if (!checkOutline(out, `holes[${i}]`, h)) return;
                    if (ok && !(h as Pt2[]).every((p) => pointInOutline(p, c.points as Pt2[]))) out.push(`holes[${i}] must lie inside the outline.`);
                });
            }
            if (!isNum(c.taper) || c.taper <= 0) out.push('taper must be a positive scale (1 = straight sides).');
            if (c.twist !== undefined && !isNum(c.twist)) out.push('twist must be a number of degrees.');
            break;
        }
        case 'lathe': {
            if (checkList(out, 'profile', c.profile, 2, 2, '[radius, y]')) {
                const p = c.profile as Pt2[];
                if (p.some(([r]) => r < 0)) out.push('profile radii must be ≥ 0 — a profile never crosses the axis (radius is the distance from Y).');
                const ys = p.map(([, y]) => y);
                if (Math.max(...ys) - Math.min(...ys) < 1e-6 && Math.max(...p.map(([r]) => r)) - Math.min(...p.map(([r]) => r)) < 1e-6) out.push('profile needs some extent.');
                if (selfIntersection(p, false)) out.push('profile crosses itself — order the points from the bottom up.');
            }
            if (!isNum(c.angle) || c.angle <= 0 || c.angle > 360) out.push('angle must be 1–360 degrees.');
            break;
        }
        case 'sweep': {
            if (checkList(out, 'path', c.path, 3, 2, '[x, y, z]')) {
                const p = c.path as Pt3[];
                let len = 0;
                for (let i = 1; i < p.length; i++) len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]);
                if (len < 0.01) out.push('path is too short — its points are all in one place.');
            }
            const prof = c.profile ?? [];
            if (prof.length) checkOutline(out, 'profile', prof);
            else pos('radius');
            if (!isNum(c.scaleEnd) || c.scaleEnd < 0) out.push('scaleEnd must be ≥ 0 (1 = the same size all along).');
            break;
        }
        case 'svg': {
            const hasText = typeof c.svg === 'string' && c.svg.trim().length > 0;
            const hasUrl = typeof c.svgUrl === 'string' && c.svgUrl.trim().length > 0;
            if (!hasText && !hasUrl) out.push('svg needs a path string (the `d` of an SVG path, or whole SVG markup) or an uploaded .svg in svgUrl.');
            pos('width');
            pos('height');
            break;
        }
        case 'superellipsoid':
            pos('width'); pos('height'); pos('depth');
            for (const k of ['e1', 'e2'] as const) if (!isNum(c[k]) || (c[k] as number) <= 0 || (c[k] as number) > 4) out.push(`${k} must be 0.05–4 (1 = an ellipsoid, small = a box).`);
            break;
    }
    if (c.curve !== undefined && (!isNum(c.curve) || c.curve < 0 || c.curve > 1)) out.push('curve must be 0–1.');
    if (!isNum(c.segments) || c.segments < 1) out.push('segments must be a positive integer.');
    if (c.bevelSize !== undefined && (!isNum(c.bevelSize) || c.bevelSize < 0)) out.push('bevelSize must be ≥ 0.');
    return out;
}

/** Even-odd point-in-polygon. */
export function pointInOutline(p: Pt2, poly: Pt2[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

// ----------------------------------------------------------------------------- point-list helpers

/**
 * Rounds a point list: a centripetal Catmull-Rom spline through the points, blended
 * with the straight polyline by `curve` (0 = the polyline, 1 = the spline). The spline
 * is sampled `per` times per segment; the polyline is sampled at the same parameters,
 * so the blend never pulls corners sideways.
 */
export function roundPoints<T extends Pt2 | Pt3>(points: T[], curve: number, per: number, closed: boolean): T[] {
    if (!(curve > 0) || points.length < 3 || per < 2) return points;
    const dims = points[0].length;
    const v3 = points.map((p) => new Vector3(p[0], p[1], dims === 3 ? (p as Pt3)[2] : 0));
    const spline = new CatmullRomCurve3(v3, closed, 'centripetal');
    const n = points.length;
    const segs = closed ? n : n - 1;
    const total = segs * per;
    const out: T[] = [];
    const tmp = new Vector3();
    for (let k = 0; k < (closed ? total : total + 1); k++) {
        const t = k / total;
        // CatmullRomCurve3.getPoint: p = (closed ? n : n - 1) * t, segment = floor(p), weight = p - segment
        const p = segs * t;
        const i = Math.min(Math.floor(p), segs - 1);
        const w = p - i;
        const a = v3[i], b = v3[(i + 1) % n];
        spline.getPoint(Math.min(t, 1), tmp);
        const lx = a.x + (b.x - a.x) * w, ly = a.y + (b.y - a.y) * w, lz = a.z + (b.z - a.z) * w;
        const x = lx + (tmp.x - lx) * curve, y = ly + (tmp.y - ly) * curve, z = lz + (tmp.z - lz) * curve;
        out.push((dims === 3 ? [x, y, z] : [x, y]) as T);
    }
    return out;
}

/** Samples per segment for a `curve` of this strength: more rounding, more samples; capped so a list never explodes. */
function samplesPer(curve: number, segments: number, count: number): number {
    if (!(curve > 0)) return 1;
    return Math.max(2, Math.min(Math.round(segments), Math.floor(400 / Math.max(count, 1))));
}

/** A THREE.Shape from a plan outline [x, z] (and holes), drawn in shape space (x, -z) so that a later rotateX(-π/2) lands it back on the ground plane. */
function planShape(points: Pt2[], holes: Pt2[][] = []): Shape {
    const toV = (list: Pt2[]) => list.map(([x, z]) => new Vector2(x, -z));
    const shape = new Shape(toV(points));
    for (const h of holes) if (h.length >= 3) shape.holes.push(new Path(toV(h)));
    return shape;
}

/** Puts the geometry's lowest point on y = 0. */
function standOnBase(geo: BufferGeometry): BufferGeometry {
    geo.computeBoundingBox();
    const minY = geo.boundingBox?.min.y ?? 0;
    if (Math.abs(minY) > 1e-9) geo.translate(0, -minY, 0);
    return geo;
}

/** Crease-angle normals (smooth below, sharp above), then bounds. The result is non-indexed. */
function finish(geo: BufferGeometry, creaseDeg: number): BufferGeometry {
    const out = toCreasedNormals(geo, (Math.max(0, Math.min(180, creaseDeg)) * Math.PI) / 180);
    if (out !== geo) geo.dispose();
    out.computeBoundingBox();
    out.computeBoundingSphere();
    return out;
}

const deg = (d: number) => (d * Math.PI) / 180;

// ----------------------------------------------------------------------------- outline / extrude

function extrudeOptions(c: ParametricShapeConfig, depth: number, steps = 1) {
    const bevel = Math.max(0, c.bevelSize ?? 0);
    return {
        depth,
        steps,
        curveSegments: 1,          // the outline is already sampled (roundPoints)
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelOffset: 0,
        bevelSegments: Math.max(1, Math.round(c.bevelSegments ?? 2)),
    };
}

function buildOutline(c: ParametricShapeConfig): BufferGeometry {
    const pts = roundPoints(c.points as Pt2[], c.curve ?? 0, samplesPer(c.curve ?? 0, c.segments ?? 8, (c.points as Pt2[]).length), true);
    const shape = planShape(pts);
    const t = Math.max(0, c.thickness ?? 0);
    let geo: BufferGeometry;
    if (t > 0) geo = new ExtrudeGeometry(shape, extrudeOptions(c, t));
    else geo = new ShapeGeometry(shape, 1);
    geo.rotateX(-Math.PI / 2);
    // ShapeGeometry's uvs are the shape coordinates (metres); ExtrudeGeometry's WorldUVGenerator too.
    return standOnBase(geo);
}

/** Twist (degrees over the height) and taper (top scale) applied to a standing extrusion: a vertex at height fraction t turns by twist·t and scales by lerp(1, taper, t). */
function twistTaper(geo: BufferGeometry, height: number, twistDeg: number, taper: number): void {
    if (!twistDeg && taper === 1) return;
    const pos = geo.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const t = Math.max(0, Math.min(1, y / height));
        const s = 1 + (taper - 1) * t;
        const a = deg(twistDeg) * t;
        const cs = Math.cos(a), sn = Math.sin(a);
        pos.setXYZ(i, (x * cs - z * sn) * s, y, (x * sn + z * cs) * s);
    }
    pos.needsUpdate = true;
}

function buildExtrude(c: ParametricShapeConfig): BufferGeometry {
    const per = samplesPer(c.curve ?? 0, c.segments ?? 8, (c.points as Pt2[]).length);
    const pts = roundPoints(c.points as Pt2[], c.curve ?? 0, per, true);
    const holes = (c.holes ?? []).map((h) => roundPoints(h, c.curve ?? 0, samplesPer(c.curve ?? 0, c.segments ?? 8, h.length), true));
    const height = Math.max(1e-4, c.height ?? 1);
    const deform = (c.twist ?? 0) !== 0 || (c.taper ?? 1) !== 1;
    const steps = deform ? Math.max(2, Math.round(c.segments ?? 8)) : 1;
    const upright = c.orientation === 'upright';
    // upright: the points are [x, y] in the standing plane; flat: [x, z] on the ground
    const shape = upright ? new Shape(pts.map(([x, y]) => new Vector2(x, y))) : planShape(pts, holes);
    if (upright) for (const h of holes) shape.holes.push(new Path(h.map(([x, y]) => new Vector2(x, y))));
    const geo = new ExtrudeGeometry(shape, extrudeOptions(c, height, steps));
    if (upright) {
        geo.translate(0, 0, -height / 2);     // thickness centred on the drawn line
    } else {
        geo.rotateX(-Math.PI / 2);
    }
    standOnBase(geo);
    if (!upright) twistTaper(geo, height, c.twist ?? 0, c.taper ?? 1);
    return geo;
}

// ----------------------------------------------------------------------------- lathe

function buildLathe(c: ParametricShapeConfig): BufferGeometry {
    const raw = c.profile as Pt2[];
    // the profile is sampled a few times per span (the radial count is the quality knob)
    const per = c.curve ? Math.max(2, Math.min(8, Math.round((c.segments ?? 32) / 4))) : 1;
    const prof = roundPoints(raw, c.curve ?? 0, per, false).map(([r, y]) => [Math.max(0, r), y] as Pt2);
    const segments = Math.max(3, Math.round(c.segments ?? 32));
    const angle = deg(Math.max(1, Math.min(360, c.angle ?? 360)));
    const full = angle >= Math.PI * 2 - 1e-6;
    const lathe = new LatheGeometry(prof.map(([r, y]) => new Vector2(r, y)), segments, 0, angle);
    // UVs in metres: u = arc length around at this ring's radius, v = arc length along the profile.
    {
        const pos = lathe.getAttribute('position');
        const uv = lathe.getAttribute('uv') as BufferAttribute;
        const along: number[] = [0];
        for (let i = 1; i < prof.length; i++) along.push(along[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
        // LatheGeometry orders its vertices segment-major: index = segment · profile.length + profile point
        for (let i = 0; i < pos.count; i++) {
            const j = i % prof.length;
            uv.setXY(i, uv.getX(i) * angle * prof[j][0], along[j]);
        }
        uv.needsUpdate = true;
    }
    // LatheGeometry puts the ring point of angle θ at (r·sin θ, y, r·cos θ): θ = 0 is +Z, θ grows toward +X.
    const parts: BufferGeometry[] = [lathe];
    const discSegs = Math.max(3, Math.round((segments * angle) / (Math.PI * 2)));
    const disc = (r: number, y: number, up: boolean) => {
        if (r <= 1e-6) return;
        const shape = new Shape();
        // drawn in XY, then laid flat: the top turns by rotateX(-π/2) → (x, y, 0) ↦ (x, 0, -y), so the arc runs
        // t = θ - π/2; the bottom by rotateX(+π/2) → (x, 0, y), t = π/2 - θ. ShapeGeometry always faces +Z, so the
        // top faces +Y and the bottom -Y whatever the arc direction.
        if (up) shape.absarc(0, 0, r, -Math.PI / 2, angle - Math.PI / 2, false);
        else shape.absarc(0, 0, r, Math.PI / 2, Math.PI / 2 - angle, true);
        if (!full) shape.lineTo(0, 0);
        shape.closePath();
        const g = new ShapeGeometry(shape, discSegs);
        g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
        g.translate(0, y, 0);
        parts.push(g);
    };
    if (c.cap !== false) {
        disc(prof[0][0], prof[0][1], false);
        disc(prof[prof.length - 1][0], prof[prof.length - 1][1], true);
    }
    if (!full) {
        // two flat walls closing the slice: the profile polygon closed along the axis, stood in the
        // plane of θ = 0 (x ↦ z by rotateY(-π/2), facing -X = outward) and θ = angle (mirrored, turned by angle)
        const wall = new Shape(prof.map(([r, y]) => new Vector2(r, y)));
        const a0 = prof[0], a1 = prof[prof.length - 1];
        if (a1[0] > 1e-6) wall.lineTo(0, a1[1]);
        if (a0[0] > 1e-6) wall.lineTo(0, a0[1]);
        wall.closePath();
        const w0 = new ShapeGeometry(wall, 1);
        w0.rotateY(-Math.PI / 2);
        const w1 = new ShapeGeometry(wall, 1);
        w1.scale(1, 1, -1);
        w1.rotateY(-Math.PI / 2);
        w1.rotateY(angle);
        parts.push(w0, w1);
    }
    const geo = parts.length > 1 ? mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g), false) ?? lathe : lathe;
    if (geo !== lathe) parts.forEach((g) => g.dispose());
    return standOnBase(geo);
}

// ----------------------------------------------------------------------------- sweep (v2 parallel-transport frames)

type V3 = [number, number, number];
const vsub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vdot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vnorm = (v: V3): V3 => { const l = Math.hypot(v[0], v[1], v[2]); return l < 1e-10 ? [0, 1, 0] : [v[0] / l, v[1] / l, v[2] / l]; };
function rotateAround(v: V3, axis: V3, angle: number): V3 {
    const c = Math.cos(angle), s = Math.sin(angle), d = vdot(v, axis);
    return [
        v[0] * c + (axis[1] * v[2] - axis[2] * v[1]) * s + axis[0] * d * (1 - c),
        v[1] * c + (axis[2] * v[0] - axis[0] * v[2]) * s + axis[1] * d * (1 - c),
        v[2] * c + (axis[0] * v[1] - axis[1] * v[0]) * s + axis[2] * d * (1 - c),
    ];
}

/** Parallel-transport frames along a spine (v2 `buildTubeFromSpine`): tangents from neighbours, the normal carried by the minimal rotation between consecutive tangents, so the profile never flips. */
export function transportFrames(spine: V3[], closed: boolean): { tangents: V3[]; normals: V3[]; binormals: V3[] } {
    const N = spine.length - 1;
    const tangents: V3[] = [];
    for (let i = 0; i <= N; i++) {
        const prev = spine[closed ? (i - 1 + N) % N : Math.max(0, i - 1)];
        const next = spine[closed ? (i + 1) % N : Math.min(N, i + 1)];
        tangents.push(vnorm(vsub(next, prev)));
    }
    const normals: V3[] = [];
    const binormals: V3[] = [];
    // n = up × t puts the binormal (t × n) upward for a level path, so a profile's +v is "up"; vertical paths fall back to +X
    const init = Math.abs(tangents[0][1]) < 0.9 ? vnorm(vcross([0, 1, 0], tangents[0])) : vnorm(vcross([1, 0, 0], tangents[0]));
    normals.push(init);
    binormals.push(vnorm(vcross(tangents[0], init)));
    for (let i = 1; i <= N; i++) {
        const t0 = tangents[i - 1], t1 = tangents[i];
        const b = vcross(t0, t1);
        if (Math.hypot(b[0], b[1], b[2]) < 1e-10) {
            normals.push(normals[i - 1]);
            binormals.push(binormals[i - 1]);
        } else {
            const axis = vnorm(b);
            const angle = Math.acos(Math.max(-1, Math.min(1, vdot(t0, t1))));
            const n = rotateAround(normals[i - 1], axis, angle);
            normals.push(n);
            binormals.push(vnorm(vcross(t1, n)));
        }
    }
    if (closed) {
        // spread the mismatch between the first and the (transported) last frame over the loop
        const theta = Math.acos(Math.max(-1, Math.min(1, vdot(normals[0], normals[N]))));
        const sign = vdot(vcross(normals[N], normals[0]), tangents[0]) > 0 ? 1 : -1;
        for (let i = 1; i <= N; i++) {
            const n = rotateAround(normals[i], tangents[i], (sign * theta * i) / N);
            normals[i] = n;
            binormals[i] = vnorm(vcross(tangents[i], n));
        }
    }
    return { tangents, normals, binormals };
}

function buildSweep(c: ParametricShapeConfig): BufferGeometry {
    const segments = Math.max(3, Math.round(c.segments ?? 12));
    const closed = !!c.closed;
    const rawPath = c.path as Pt3[];
    const per = c.curve ? Math.max(2, Math.min(8, Math.floor(600 / rawPath.length))) : 1;
    let spine = roundPoints(rawPath, c.curve ?? 0, per, closed) as V3[];
    if (closed && spine.length > 1) {
        const a = spine[0], b = spine[spine.length - 1];
        if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 1e-9) spine = [...spine, [a[0], a[1], a[2]]];
    }
    // the cross-section: the profile [u, v] in metres, or a circle of `radius`
    let prof: Pt2[];
    if (c.profile && c.profile.length >= 3) prof = c.profile;
    else {
        const r = Math.max(1e-4, c.radius ?? 0.1);
        prof = [];
        for (let j = 0; j < segments; j++) { const a = (j / segments) * Math.PI * 2; prof.push([Math.cos(a) * r, Math.sin(a) * r]); }
    }
    if (outlineArea(prof) < 0) prof = [...prof].reverse();   // counter-clockwise in (n, b) → outward faces
    const M = prof.length;
    const perim: number[] = [0];
    for (let j = 1; j <= M; j++) perim.push(perim[j - 1] + Math.hypot(prof[j % M][0] - prof[j - 1][0], prof[j % M][1] - prof[j - 1][1]));
    const N = spine.length - 1;
    const { normals, binormals } = transportFrames(spine, closed);
    const along: number[] = [0];
    for (let i = 1; i <= N; i++) along.push(along[i - 1] + Math.hypot(spine[i][0] - spine[i - 1][0], spine[i][1] - spine[i - 1][1], spine[i][2] - spine[i - 1][2]));
    const total = along[N] || 1;
    const scaleEnd = c.scaleEnd ?? 1;
    const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (let i = 0; i <= N; i++) {
        const s = 1 + (scaleEnd - 1) * (along[i] / total);
        const o = spine[i], n = normals[i], b = binormals[i];
        for (let j = 0; j <= M; j++) {
            const [u, v] = prof[j % M];
            vertices.push(o[0] + (n[0] * u + b[0] * v) * s, o[1] + (n[1] * u + b[1] * v) * s, o[2] + (n[2] * u + b[2] * v) * s);
            uvs.push(along[i], perim[j]);
        }
    }
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
            const a = i * (M + 1) + j, bb = a + (M + 1);
            indices.push(a, a + 1, bb + 1, a, bb + 1, bb);
        }
    }
    const tube = new BufferGeometry();
    tube.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    tube.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    tube.setIndex(indices);
    const parts: BufferGeometry[] = [tube.toNonIndexed()];
    tube.dispose();
    if (!closed && c.cap !== false) {
        const tris = ShapeUtils.triangulateShape(prof.map(([u, v]) => new Vector2(u, v)), []);
        const cap = (i: number, flip: boolean) => {
            const s = 1 + (scaleEnd - 1) * (along[i] / total);
            const o = spine[i], n = normals[i], b = binormals[i];
            const pos: number[] = [], uv: number[] = [];
            for (const tri of tris) {
                const order = flip ? [tri[0], tri[2], tri[1]] : tri;
                for (const k of order) {
                    const [u, v] = prof[k];
                    pos.push(o[0] + (n[0] * u + b[0] * v) * s, o[1] + (n[1] * u + b[1] * v) * s, o[2] + (n[2] * u + b[2] * v) * s);
                    uv.push(u, v);
                }
            }
            const g = new BufferGeometry();
            g.setAttribute('position', new Float32BufferAttribute(pos, 3));
            g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
            parts.push(g);
        };
        cap(0, true);
        cap(N, false);
    }
    const geo = parts.length > 1 ? (mergeGeometries(parts, false) ?? parts[0]) : parts[0];
    if (parts.length > 1) parts.forEach((g) => g.dispose());
    return geo;
}

// ----------------------------------------------------------------------------- svg

/** Bare `d` data → a whole SVG document; whole markup passes through. */
export function svgMarkup(text: string): string {
    const t = text.trim();
    if (/^<svg[\s>]/i.test(t) || /^<\?xml/i.test(t)) return t;
    return `<svg xmlns="http://www.w3.org/2000/svg"><path d="${t.replace(/"/g, "'")}"/></svg>`;
}

/** The SVG's fills as shapes (holes by the path's fill rule, even-odd for a bare `d`), in SVG user units, y down. */
export function svgShapes(text: string): Shape[] {
    const data = new SVGLoader().parse(svgMarkup(text));
    const shapes: Shape[] = [];
    const bare = !/^<svg[\s>]/i.test(text.trim()) && !/^<\?xml/i.test(text.trim());
    for (const p of data.paths) {
        const ud = (p.userData ?? {}) as { style?: Record<string, unknown> };
        if (bare) p.userData = { ...ud, style: { ...(ud.style ?? {}), fill: '#000', fillRule: 'evenodd' } };
        const style = ((p.userData as { style?: Record<string, unknown> })?.style ?? {}) as Record<string, unknown>;
        if (style.fill === 'none' && style.stroke && style.stroke !== 'none') continue;   // stroke-only paths have no fill to extrude
        shapes.push(...SVGLoader.createShapes(p));
    }
    return shapes;
}

/** `svgText` is the resolved markup when the config names an uploaded .svg (the viewer fetches it); otherwise the config's `svg`. */
function buildSvg(c: ParametricShapeConfig, svgText?: string): BufferGeometry {
    const text = (svgText && svgText.trim()) || c.svg || '';
    const shapes = text ? svgShapes(text) : [];
    if (!shapes.length) return fallbackGeometry();
    // fit the drawing to `width` metres, flip y (SVG is y-down), centre x, base at 0
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of shapes) for (const p of s.getPoints(4)) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
    const w = maxX - minX || 1;
    const k = (c.width ?? 2) / w;
    const cx = (minX + maxX) / 2;
    const depth = Math.max(1e-4, c.height ?? 0.2);
    // Resample the drawing into metres (fit to `width`, y up, centred on x, standing on y = 0) before extruding,
    // so the UVs the extrusion writes are metres too. Curves are sampled `segments` times per span.
    const segs = Math.max(2, Math.round(c.segments ?? 8));
    const toPoly = (path: Path) => path.getPoints(segs).map((p) => new Vector2((p.x - cx) * k, (maxY - p.y) * k));
    const metric = shapes.map((s) => { const out = new Shape(toPoly(s)); out.holes = s.holes.map((h) => new Path(toPoly(h))); return out; });
    const geo = new ExtrudeGeometry(metric, extrudeOptions(c, depth));
    if (c.orientation === 'flat') geo.rotateX(-Math.PI / 2);
    else geo.translate(0, 0, -depth / 2);
    return standOnBase(geo);
}

// ----------------------------------------------------------------------------- superellipsoid (v2)

function buildSuperellipsoid(c: ParametricShapeConfig): BufferGeometry {
    const rx = (c.width ?? 1) / 2, ry = (c.height ?? 1) / 2, rz = (c.depth ?? 1) / 2;
    const n1 = Math.max(0.05, c.e1 ?? 0.4), n2 = Math.max(0.05, c.e2 ?? 0.4);
    const uSeg = Math.max(8, Math.round(c.segments ?? 32)), vSeg = Math.max(4, Math.round((c.segments ?? 32) / 2));
    const sgnPow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);
    const W = uSeg + 1;
    const px = new Float64Array(W * (vSeg + 1)), py = new Float64Array(W * (vSeg + 1)), pz = new Float64Array(W * (vSeg + 1));
    for (let v = 0; v <= vSeg; v++) {
        const phi = -Math.PI / 2 + (v / vSeg) * Math.PI;
        const cphi = Math.cos(phi), sphi = Math.sin(phi);
        for (let u = 0; u <= uSeg; u++) {
            const theta = -Math.PI + (u / uSeg) * Math.PI * 2;
            const k = v * W + u;
            px[k] = rx * sgnPow(cphi, n1) * sgnPow(Math.cos(theta), n2);
            py[k] = ry * sgnPow(sphi, n1);
            pz[k] = rz * sgnPow(cphi, n1) * sgnPow(Math.sin(theta), n2);
        }
    }
    // UVs in metres by box projection: each vertex takes the two coordinates across its dominant face
    // (x/rx, y/ry, z/rz decide the face), so the flat faces of a rounded box tile exactly and the seams
    // sit in the fillets; a parametric uv would bunch at the corners for small exponents.
    const uvs = new Float32Array(W * (vSeg + 1) * 2);
    for (let k = 0; k < W * (vSeg + 1); k++) {
        const ax = Math.abs(px[k]) / rx, ay = Math.abs(py[k]) / ry, az = Math.abs(pz[k]) / rz;
        let u: number, v: number;
        if (ay >= ax && ay >= az) { u = px[k]; v = py[k] > 0 ? pz[k] : -pz[k]; }
        else if (ax >= az) { u = px[k] > 0 ? -pz[k] : pz[k]; v = py[k]; }
        else { u = pz[k] > 0 ? px[k] : -px[k]; v = py[k]; }
        uvs[k * 2] = u; uvs[k * 2 + 1] = v;
    }
    const vertices = new Float32Array(W * (vSeg + 1) * 3);
    for (let k = 0; k < W * (vSeg + 1); k++) { vertices[k * 3] = px[k]; vertices[k * 3 + 1] = py[k]; vertices[k * 3 + 2] = pz[k]; }
    const indices: number[] = [];
    for (let v = 0; v < vSeg; v++) for (let u = 0; u < uSeg; u++) {
        const a = v * W + u, b = a + 1, cc = a + W, d = cc + 1;
        indices.push(a, cc, d, a, d, b);   // outward-facing (v2 order)
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return standOnBase(geo.toNonIndexed());
}

// ----------------------------------------------------------------------------- entry

function fallbackGeometry(): BufferGeometry {
    const g = new ShapeGeometry(planShape(SQUARE.map(([x, z]) => [x * 0.5, z * 0.5] as Pt2)), 1);
    g.rotateX(-Math.PI / 2);
    return g;
}

/**
 * The geometry of a parametric shape config. Invalid recipes (see validateParametricShape)
 * build a small flat square and warn — the viewer never throws on a saved object.
 * `svgText`: the markup of an uploaded .svg, when the caller has fetched it.
 */
export function buildParametricGeometry(cfg: Partial<ParametricShapeConfig> & { type: ParametricShapeName }, svgText?: string): BufferGeometry {
    const c = { ...PARAMETRIC_SHAPE_DEFAULTS[cfg.type], ...cfg } as ParametricShapeConfig;
    const problems = validateParametricShape(c);
    if (problems.length && !(c.type === 'svg' && svgText)) {
        console.warn(`[3drise] ${c.type} shape not buildable: ${problems.join(' ')}`);
        return finish(fallbackGeometry(), 30);
    }
    let geo: BufferGeometry;
    switch (c.type) {
        case 'outline': geo = buildOutline(c); break;
        case 'extrude': geo = buildExtrude(c); break;
        case 'lathe': geo = buildLathe(c); break;
        case 'sweep': geo = buildSweep(c); break;
        case 'svg': geo = buildSvg(c, svgText); break;
        case 'superellipsoid': geo = buildSuperellipsoid(c); break;
        default: geo = fallbackGeometry();
    }
    return finish(geo, c.crease ?? 30);
}
