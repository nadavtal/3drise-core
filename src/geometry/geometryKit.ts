// =============================================================================
// Geometry kit — what a geometry script can build with (`g` in `build(p, g)`)
// =============================================================================
//
// Pure three.js, no DOM: it runs in the viewer's geometry worker, in the studio's
// dry runs and in node tests alike. Every function returns a BufferGeometry the
// caller owns; lengths are metres; nothing here moves the finished object (the
// parent CreatedObject owns the transform) — `move / rotate / scale` shape the
// geometry itself.
//
// The script contract:  `build(p, g)` returns a BufferGeometry or an array of them
// (merged). The docs topic `geometry` (client agentLink/docsGeometry.ts) is
// generated from KIT_DOCS below, so a kit change is a docs change.
//

import * as THREE from 'three';
import { BoxGeometry, BufferAttribute, BufferGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry, Matrix4, PlaneGeometry, RingGeometry, SphereGeometry, TorusGeometry, TorusKnotGeometry, Vector3 } from 'three';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';
import { buildParametricGeometry, type ParametricShapeConfig, type Pt2, type Pt3 } from './parametricGeometry';

export const MAX_TRIANGLES = 200_000;

const deg = (d: number) => (d * Math.PI) / 180;

/** A geometry ready for merging and CSG: non-indexed, with position / normal / uv only. */
function plain(geo: BufferGeometry): BufferGeometry {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    if (!g.getAttribute('uv')) {
        const n = g.getAttribute('position').count;
        g.setAttribute('uv', new Float32BufferAttribute(new Float32Array(n * 2), 2));
    }
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    g.clearGroups();
    if (g !== geo) geo.dispose();
    return g;
}

function triangles(geo: BufferGeometry): number {
    return Math.floor((geo.index ? geo.index.count : geo.getAttribute('position').count) / 3);
}

function assertBudget(geo: BufferGeometry, what: string): BufferGeometry {
    const t = triangles(geo);
    if (t > MAX_TRIANGLES) throw new Error(`${what} has ${t.toLocaleString()} triangles — the limit is ${MAX_TRIANGLES.toLocaleString()}. Lower the segments.`);
    return geo;
}

const evaluator = new Evaluator();
evaluator.useGroups = false;
evaluator.attributes = ['position', 'normal', 'uv'];

function csg(a: BufferGeometry, b: BufferGeometry, op: number, what: string): BufferGeometry {
    const ba = new Brush(plain(a)), bb = new Brush(plain(b));
    ba.updateMatrixWorld(); bb.updateMatrixWorld();
    const out = evaluator.evaluate(ba, bb, op);
    const geo = out.geometry as BufferGeometry;
    geo.computeBoundingBox(); geo.computeBoundingSphere();
    return assertBudget(geo, what);
}

// ----------------------------------------------------------------------------- noise / random

/** mulberry32 — the same seed gives the same sequence everywhere. */
export function random(seed = 1): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// 3D simplex noise (Stefan Gustavson's reference, seeded permutation), -1..1
const GRAD3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
export function noiseMaker(seed = 1): (x: number, y?: number, z?: number) => number {
    const rnd = random(seed);
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    const perm = new Uint8Array(512), pm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm[i] = perm[i] % 12; }
    const F3 = 1 / 3, G3 = 1 / 6;
    const dot3 = (g: number[], x: number, y: number, z: number) => g[0] * x + g[1] * y + g[2] * z;
    return (x: number, y = 0, z = 0) => {
        const s = (x + y + z) * F3;
        const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
        const t = (i + j + k) * G3;
        const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
        let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
        if (x0 >= y0) {
            if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
            if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }
        const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
        const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
        const ii = i & 255, jj = j & 255, kk = k & 255;
        let n = 0;
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 > 0) { t0 *= t0; n += t0 * t0 * dot3(GRAD3[pm[ii + perm[jj + perm[kk]]]], x0, y0, z0); }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 > 0) { t1 *= t1; n += t1 * t1 * dot3(GRAD3[pm[ii + i1 + perm[jj + j1 + perm[kk + k1]]]], x1, y1, z1); }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 > 0) { t2 *= t2; n += t2 * t2 * dot3(GRAD3[pm[ii + i2 + perm[jj + j2 + perm[kk + k2]]]], x2, y2, z2); }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 > 0) { t3 *= t3; n += t3 * t3 * dot3(GRAD3[pm[ii + 1 + perm[jj + 1 + perm[kk + 1]]]], x3, y3, z3); }
        return 32 * n;
    };
}
const defaultNoise = noiseMaker(1);

// ----------------------------------------------------------------------------- the kit

export type Kit = ReturnType<typeof createGeometryKit>;

type ParamOpts<T extends ParametricShapeConfig['type']> = Omit<Partial<ParametricShapeConfig>, 'type'> & { type?: T };

export function createGeometryKit() {
    const parametric = <T extends ParametricShapeConfig['type']>(type: T, cfg: ParamOpts<T>) => assertBudget(buildParametricGeometry({ ...cfg, type } as ParametricShapeConfig), type);
    const g = {
        THREE,
        // --- primitives (metres; centred like THREE's, use standOnBase to sit on y = 0)
        box: (width = 1, height = 1, depth = 1, segments = 1) => new BoxGeometry(width, height, depth, segments, segments, segments),
        sphere: (radius = 0.5, segments = 32) => new SphereGeometry(radius, segments, Math.max(2, Math.round(segments / 2))),
        cylinder: (radiusTop = 0.5, radiusBottom = 0.5, height = 1, segments = 32, open = false) => new CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, open),
        cone: (radius = 0.5, height = 1, segments = 32) => new ConeGeometry(radius, height, segments),
        torus: (radius = 1, tube = 0.3, segments = 32, tubular = 64) => new TorusGeometry(radius, tube, segments, tubular),
        torusKnot: (radius = 1, tube = 0.3, p = 2, q = 3, segments = 12, tubular = 128) => new TorusKnotGeometry(radius, tube, tubular, segments, p, q),
        capsule: (radius = 0.3, length = 1, segments = 16) => new CapsuleGeometry(radius, length, Math.max(1, Math.round(segments / 2)), segments),
        plane: (width = 1, height = 1, segments = 1) => new PlaneGeometry(width, height, segments, segments),
        ring: (inner = 0.5, outer = 1, segments = 32) => new RingGeometry(inner, outer, segments),
        icosphere: (radius = 0.5, detail = 2) => new IcosahedronGeometry(radius, detail),
        // --- parametric (the six mesh variants; options as their configs)
        outline: (points: Pt2[], opts: ParamOpts<'outline'> = {}) => parametric('outline', { ...opts, points }),
        extrude: (points: Pt2[], opts: ParamOpts<'extrude'> = {}) => parametric('extrude', { ...opts, points }),
        lathe: (profile: Pt2[], opts: ParamOpts<'lathe'> = {}) => parametric('lathe', { ...opts, profile }),
        sweep: (path: Pt3[], opts: ParamOpts<'sweep'> = {}) => parametric('sweep', { ...opts, path }),
        svg: (svg: string, opts: ParamOpts<'svg'> = {}) => parametric('svg', { ...opts, svg }),
        superellipsoid: (opts: ParamOpts<'superellipsoid'> = {}) => parametric('superellipsoid', opts),
        // --- transforms (in place, return the geometry)
        move: (geo: BufferGeometry, x = 0, y = 0, z = 0) => geo.translate(x, y, z),
        rotate: (geo: BufferGeometry, xDeg = 0, yDeg = 0, zDeg = 0) => { if (xDeg) geo.rotateX(deg(xDeg)); if (yDeg) geo.rotateY(deg(yDeg)); if (zDeg) geo.rotateZ(deg(zDeg)); return geo; },
        scale: (geo: BufferGeometry, x = 1, y = x, z = x) => geo.scale(x, y, z),
        mirror: (geo: BufferGeometry, axis: 'x' | 'y' | 'z' = 'x') => {
            const out = plain(geo);
            out.scale(axis === 'x' ? -1 : 1, axis === 'y' ? -1 : 1, axis === 'z' ? -1 : 1);
            // a mirror flips the winding: swap two vertices of every triangle so faces still point out
            const pos = out.getAttribute('position') as BufferAttribute;
            const nrm = out.getAttribute('normal') as BufferAttribute;
            const uv = out.getAttribute('uv') as BufferAttribute;
            for (let i = 0; i < pos.count; i += 3) {
                for (const att of [pos, nrm, uv]) {
                    const size = att.itemSize;
                    for (let c = 0; c < size; c++) { const a = att.array[(i + 1) * size + c]; (att.array as Float32Array)[(i + 1) * size + c] = att.array[(i + 2) * size + c]; (att.array as Float32Array)[(i + 2) * size + c] = a; }
                }
            }
            out.computeVertexNormals();
            return out;
        },
        standOnBase: (geo: BufferGeometry) => { geo.computeBoundingBox(); geo.translate(0, -(geo.boundingBox!.min.y), 0); return geo; },
        center: (geo: BufferGeometry) => geo.center(),
        clone: (geo: BufferGeometry) => geo.clone(),
        /** Copies of a geometry placed by `place(i) → { position?, rotation? (degrees), scale? }`, merged. */
        repeat: (geo: BufferGeometry, count: number, place: (i: number) => { position?: [number, number, number]; rotation?: [number, number, number]; scale?: number | [number, number, number] }) => {
            const parts: BufferGeometry[] = [];
            for (let i = 0; i < count; i++) {
                const t = place(i) ?? {};
                const c = plain(geo.clone());
                const s = typeof t.scale === 'number' ? [t.scale, t.scale, t.scale] : (t.scale ?? [1, 1, 1]);
                const r = t.rotation ?? [0, 0, 0];
                const m = new Matrix4().compose(new Vector3(...(t.position ?? [0, 0, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(deg(r[0]), deg(r[1]), deg(r[2]))), new Vector3(s[0], s[1], s[2]));
                c.applyMatrix4(m);
                parts.push(c);
            }
            return assertBudget(mergeGeometries(parts, false) ?? new BufferGeometry(), 'repeat');
        },
        // --- combine
        merge: (geos: BufferGeometry[]) => assertBudget(mergeGeometries(geos.map(plain), false) ?? new BufferGeometry(), 'merge'),
        union: (a: BufferGeometry, b: BufferGeometry) => csg(a, b, ADDITION, 'union'),
        subtract: (a: BufferGeometry, b: BufferGeometry) => csg(a, b, SUBTRACTION, 'subtract'),
        intersect: (a: BufferGeometry, b: BufferGeometry) => csg(a, b, INTERSECTION, 'intersect'),
        // --- normals / uvs
        creased: (geo: BufferGeometry, angleDeg = 30) => { const out = toCreasedNormals(plain(geo), deg(angleDeg)); if (out !== geo) geo.dispose(); return out; },
        smooth: (geo: BufferGeometry) => { const out = mergeVertices(plain(geo)); out.computeVertexNormals(); return out; },
        flat: (geo: BufferGeometry) => { const out = plain(geo); out.computeVertexNormals(); return out; },
        /** Box-projected UVs in metres: each face takes the two coordinates across its dominant normal axis. */
        uvBox: (geo: BufferGeometry) => {
            const out = plain(geo);
            const pos = out.getAttribute('position'), nrm = out.getAttribute('normal');
            const uv = new Float32Array(pos.count * 2);
            for (let i = 0; i < pos.count; i++) {
                const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i)), nz = Math.abs(nrm.getZ(i));
                const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                if (ny >= nx && ny >= nz) { uv[i * 2] = x; uv[i * 2 + 1] = nrm.getY(i) > 0 ? z : -z; }
                else if (nx >= nz) { uv[i * 2] = nrm.getX(i) > 0 ? -z : z; uv[i * 2 + 1] = y; }
                else { uv[i * 2] = nrm.getZ(i) > 0 ? x : -x; uv[i * 2 + 1] = y; }
            }
            out.setAttribute('uv', new BufferAttribute(uv, 2));
            return out;
        },
        /** Displace vertices along their normals by `fn(x, y, z) → metres` (after smooth() for a continuous surface). */
        displace: (geo: BufferGeometry, fn: (x: number, y: number, z: number) => number) => {
            if (!geo.getAttribute('normal')) geo.computeVertexNormals();
            const pos = geo.getAttribute('position') as BufferAttribute, nrm = geo.getAttribute('normal');
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                const d = fn(x, y, z);
                pos.setXYZ(i, x + nrm.getX(i) * d, y + nrm.getY(i) * d, z + nrm.getZ(i) * d);
            }
            pos.needsUpdate = true;
            geo.computeVertexNormals();
            return geo;
        },
        // --- measure / maths
        bounds: (geo: BufferGeometry) => { geo.computeBoundingBox(); const b = geo.boundingBox!; return { min: b.min.toArray() as [number, number, number], max: b.max.toArray() as [number, number, number], size: b.getSize(new Vector3()).toArray() as [number, number, number] }; },
        triangles,
        random,
        noise: defaultNoise,
        noiseMaker,
        lerp: (a: number, b: number, t: number) => a + (b - a) * t,
        clamp: (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v)),
        deg,
        /** A circle outline (points, CCW) — for extrude / sweep profiles. */
        circle: (radius = 0.5, segments = 32, cx = 0, cz = 0): Pt2[] => Array.from({ length: segments }, (_, i) => { const a = (i / segments) * Math.PI * 2; return [cx + Math.cos(a) * radius, cz + Math.sin(a) * radius] as Pt2; }),
        /** A rectangle outline (CCW). */
        rect: (width = 1, depth = 1, cx = 0, cz = 0): Pt2[] => [[cx - width / 2, cz - depth / 2], [cx + width / 2, cz - depth / 2], [cx + width / 2, cz + depth / 2], [cx - width / 2, cz + depth / 2]],
        /** A helix path [x, y, z]: `turns` around Y, rising `height`, `radius` (taper to `radiusEnd`). */
        helix: (radius = 1, height = 2, turns = 3, samples = 96, radiusEnd = radius): Pt3[] => Array.from({ length: samples + 1 }, (_, i) => { const t = i / samples; const a = t * turns * Math.PI * 2; const r = radius + (radiusEnd - radius) * t; return [Math.cos(a) * r, t * height, Math.sin(a) * r] as Pt3; }),
    };
    return g;
}

/** The final geometry of a script's return value: one geometry or an array (merged), checked. */
export function finishScriptResult(result: unknown, g: Kit): BufferGeometry {
    let geo: BufferGeometry;
    if (Array.isArray(result)) {
        if (!result.length || !result.every((x) => x && (x as BufferGeometry).isBufferGeometry)) throw new Error('build() returned an array that is not all geometries.');
        geo = g.merge(result as BufferGeometry[]);
    } else if (result && (result as BufferGeometry).isBufferGeometry) {
        geo = result as BufferGeometry;
    } else {
        throw new Error('build(p, g) must return a BufferGeometry (or an array of them) — it returned ' + (result === undefined ? 'nothing' : typeof result) + '.');
    }
    geo = plain(geo);
    const pos = geo.getAttribute('position');
    if (!pos || pos.count < 3) throw new Error('build() returned an empty geometry.');
    for (let i = 0; i < pos.array.length; i++) if (!Number.isFinite(pos.array[i])) throw new Error('The geometry has NaN / infinite vertex positions — check divisions by zero and sqrt of negatives.');
    assertBudget(geo, 'The geometry');
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
}

/** One line per kit function — the docs topic lists these. */
export const KIT_DOCS: Array<[string, string]> = [
    ['g.THREE', 'the three.js namespace (any THREE geometry / Shape / Path / Vector / Matrix works)'],
    ['g.box(w, h, d, segments?)  g.sphere(r, segments?)  g.cylinder(rTop, rBottom, h, segments?, open?)  g.cone(r, h, segments?)', 'solids, centred on the origin like THREE\'s'],
    ['g.torus(r, tube, segments?, tubular?)  g.torusKnot(r, tube, p?, q?, segments?, tubular?)  g.capsule(r, length, segments?)  g.plane(w, h)  g.ring(inner, outer)  g.icosphere(r, detail?)', ''],
    ['g.outline(points, { curve, thickness, bevelSize })', 'a filled plan outline [x, z] (pond, patio)'],
    ['g.extrude(points, { height, holes, curve, bevelSize, bevelSegments, twist, taper, orientation })', 'outline × height, holes = [[[x, z], …]], orientation "flat" (ground, default) | "upright" ([x, y] in the standing plane)'],
    ['g.lathe(profile, { curve, angle, cap, segments })', 'profile [radius, y] bottom → top revolved about Y; angle < 360 cuts a slice with closing walls'],
    ['g.sweep(path, { radius | profile, curve, scaleEnd, cap, closed, segments })', 'a tube (or any [u, v] profile) along a path [[x, y, z], …]'],
    ['g.svg(text, { width, height, bevelSize, orientation })', 'an SVG `d` string or whole markup extruded (even-odd holes), fitted to `width` metres'],
    ['g.superellipsoid({ width, height, depth, e1, e2, segments })', 'rounded boxes and pills (e → 0 box, 1 ellipsoid)'],
    ['g.move(geo, x, y, z)  g.rotate(geo, xDeg, yDeg, zDeg)  g.scale(geo, x, y?, z?)  g.mirror(geo, "x"|"y"|"z")  g.standOnBase(geo)  g.center(geo)  g.clone(geo)', 'in place; return the geometry'],
    ['g.repeat(geo, count, i => ({ position, rotation, scale }))', 'copies placed by a function, merged (columns, steps, teeth)'],
    ['g.merge([a, b, …])', 'one geometry, faces kept (fast; overlapping volumes stay overlapping)'],
    ['g.union(a, b)  g.subtract(a, b)  g.intersect(a, b)', 'CSG booleans: welded solids, holes, overlaps. Closed inputs; a few thousand triangles each; chain them, do not union fifty parts'],
    ['g.creased(geo, angleDeg = 30)  g.smooth(geo)  g.flat(geo)', 'normals: by crease angle (the default finish), all smooth, all faceted'],
    ['g.uvBox(geo)', 'box-projected UVs in metres, so library textures tile at real size (do this last, after transforms)'],
    ['g.displace(geo, (x, y, z) => metres)', 'push vertices along their normals (rocks, terrain; smooth() first)'],
    ['g.bounds(geo) → { min, max, size }  g.triangles(geo)', 'measure, for placing parts against each other'],
    ['g.random(seed)() → 0..1  g.noise(x, y, z) → -1..1  g.noiseMaker(seed)  g.lerp  g.clamp  g.deg', 'deterministic randomness — same seed, same shape'],
    ['g.circle(r, segments)  g.rect(w, d)  g.helix(r, height, turns, samples, rEnd?)', 'ready point lists for extrude / sweep'],
];
