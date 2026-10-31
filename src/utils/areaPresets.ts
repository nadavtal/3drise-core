// =============================================================================
// areaPresets — ready-made areas (built-in layouts of kind 'area')
// =============================================================================
//
// Starting points in groups, each a plain AreaInput — exactly what a user could have drawn: points
// [x, y, z] in metres (y is the point's height), rounding / round corners, edge noise (the curving
// API's CurveNoise), holes (each an area of its own; a hole that is a GROUND is filled with a flat
// surface at its own height that the place using the area textures). Every outline comes from THE
// shape API (utils/shape: shapePoints) — a preset is a shape spec plus what the editor adds — so
// a layout, a mesh variant and the AI agree on what a heart or a rose is.
//
// Used by the area editor ("Start from a preset"), the LayoutButton gallery (built-in areas, by
// reference 'preset:area:<id>') and the AI. One preset = one idea: never the same outline at
// another size or with other corners (size, rounding and corners are the editor's), never a
// polygon that differs only in its number of sides. `relief` marks the ones with height (the surface between the
// edges is the harmonic sheet they span — see areaShape): a flat-only consumer (water) filters them.
//
// Scenes use a preset BY REFERENCE: never change an existing preset — every scene using it would
// silently change. A better version is a new id. The noise functions' output never changes for
// given options (curveNoise), and neither does a shape's (shape API).
//
import type { CurveNoise } from './curve';
import { centerArea, withHoleIds, type AreaHole, type AreaInput } from './areaShape';
import { shapePoints, liftPts, scalePts, movePts, roundPts, waveSamples, waveValue, WAVE_KINDS, type OutlineSpec, type ShapeSpec, type WaveKind } from './shape';

type V3 = [number, number, number];

export type AreaPresetGroup = 'shapes' | 'rings' | 'relief' | 'terrain' | 'frequencies' | 'nature' | 'noise';
export const AREA_PRESET_GROUPS: ReadonlyArray<{ id: AreaPresetGroup; label: string; description: string }> = [
    { id: 'shapes', label: 'Shapes', description: 'Geometric and symbolic outlines — polygons, stars, roses, letters, hearts.' },
    { id: 'rings', label: 'Rings & frames', description: 'Outlines with holes — rings, frames, targets, courtyards, honeycombs.' },
    { id: 'relief', label: 'Relief', description: 'Surfaces with height — ramps, saddles, pyramids, bowls, roofs, stairs.' },
    { id: 'terrain', label: 'Terrain', description: 'Landforms for land — hills, volcanoes, craters, atolls, canyons, dunes.' },
    { id: 'frequencies', label: 'Frequencies', description: 'Known waveforms — sine, square, sawtooth, AM, FM, chirp, heartbeat… — as edges, rings and surfaces whose height follows the wave.' },
    { id: 'nature', label: 'Nature', description: 'Islands, peninsulas, woodland belts, marshes and canals.' },
    { id: 'noise', label: 'Noise', description: 'Organic edges — one outline per noise function and layer style.' },
];

export interface AreaPreset {
    id: string;
    name: string;
    description: string;
    group: AreaPresetGroup;
    /** Has height (points or holes off y 0): a flat-only consumer (water) leaves it out. */
    relief: boolean;
    area: AreaInput;
}

/** Does an area have height anywhere (points, holes, lifted sides)? */
export function areaIsRelief(a: AreaInput): boolean {
    const ring = (r: { points?: V3[]; segments?: Array<{ bend?: { lift?: number } } | null> }) =>
        (r.points ?? []).some((p) => Math.abs(p[1] ?? 0) > 1e-6) || (r.segments ?? []).some((s) => !!s?.bend?.lift);
    return ring(a) || (a.holes ?? []).some(ring);
}

// ---------------------------------------------------------------------------- builders (metres, centred)
/** The ring of a shape spec (the shape API). */
const S = (spec: ShapeSpec): V3[] => shapePoints(spec).points;
const rect = (w: number, d: number): V3[] => S({ kind: 'rect', size: w, depth: d });
const ellipse = (w: number, d = w, samples = 24): V3[] => S({ kind: 'ellipse', size: w, depth: d, samples });
const stadium = (w: number, d: number): V3[] => S({ kind: 'stadium', size: w, depth: d });
/** Every point at one height. */
const at = (pts: V3[], y: number): V3[] => liftPts(pts, () => y);
/** A hole: a ring (scaled about the centre by `f`, moved, at a height), a ground or empty. */
const hole = (pts: V3[], o: { f?: number; dx?: number; dz?: number; y?: number; ground?: boolean; curve?: number; smoothCorners?: number; noise?: CurveNoise; heightCurve?: 'linear' | 'smooth' } = {}): AreaHole => {
    let p = o.f !== undefined ? scalePts(pts, o.f, 1, o.f) : pts;
    p = movePts(p, o.dx ?? 0, 0, o.dz ?? 0);
    if (o.y !== undefined) p = at(p, o.y);
    const h: AreaHole = { points: p, curve: o.curve ?? 0, smoothCorners: o.smoothCorners ?? 0 };
    if (o.ground) h.ground = true;
    if (o.noise) h.noise = o.noise;
    if (o.heightCurve) h.heightCurve = o.heightCurve;
    return h;
};
/** The base an organic outline's noise is laid on. */
type Base = 'ellipse' | 'square' | 'blob';
interface Organic { noise: CurveNoise['noise']; layers?: CurveNoise['layers']; bumps: number; amp: number; octaves?: number; seed: number; width: number; depth?: number; base?: Base }
/** An organic outline: a base shape (ellipse, rounded square, lopsided blob) with edge noise `amp` × its half-size deep. */
function organic(o: Organic): AreaInput {
    const w = o.width, d = o.depth ?? o.width;
    const noise: CurveNoise = { noise: o.noise, layers: o.layers ?? 'fbm', bumps: o.bumps, depth: round2(o.amp * Math.min(w, d) / 2), octaves: o.octaves ?? 4, seed: o.seed };
    if (o.base === 'square') return { points: rect(w, d), curve: 0, smoothCorners: 0.7, noise };
    if (o.base === 'blob') return { points: S({ kind: 'egg', size: w, depth: d, samples: 16, turn: (o.seed * 37) % 360 }), curve: 1, smoothCorners: 0, noise };
    return { points: ellipse(w, d, 16), curve: 1, smoothCorners: 0, noise };
}
const round2 = (v: number) => Math.round(v * 100) / 100;
/** An open line widened into a ring `w` metres across (offset north / south — for gorges and valley floors along x). */
const band = (line: V3[], w: number): V3[] => [...line.map((p) => [p[0], 0, p[2] - w / 2] as V3), ...[...line].reverse().map((p) => [p[0], 0, p[2] + w / 2] as V3)];
/** The point's angle about the centre, 0 at north, turning clockwise seen from above (for rim heights). */
const ang = (x: number, z: number) => Math.atan2(x, -z);
/** The noise of an organic preset's hole: the same look, a different seed. */
const reseed = (n: CurveNoise | undefined, seed: number): CurveNoise | undefined => (n ? { ...n, seed, depth: round2(n.depth * 0.6) } : undefined);

// ---------------------------------------------------------------------------- the presets
function build(): AreaPreset[] {
    const out: AreaPreset[] = [];
    let group: AreaPresetGroup = 'shapes';
    /** A preset from points (+ rounding / round corners) or a whole AreaInput; stored centred on its drawn outline (holes moved with it), to the centimetre, hole ids set. */
    const add = (id: string, name: string, description: string, shape: V3[] | AreaInput, curve = 0, smoothCorners = 0) => {
        const raw: AreaInput = Array.isArray(shape) ? { points: shape, curve, smoothCorners } : shape;
        const c = withHoleIds(centerArea(raw).input);
        const area: AreaInput = { ...c, points: roundPts(c.points) };
        if (c.holes) area.holes = c.holes.map((h) => ({ ...h, points: roundPts(h.points) }));
        out.push({ id, name, description, group, relief: areaIsRelief(area), area });
    };
    /** A preset that is one shape spec (+ rounding). */
    const shape = (id: string, name: string, description: string, spec: OutlineSpec, curve = 0, smoothCorners = 0) => add(id, name, description, S(spec), curve, smoothCorners);

    // ================================================================== Shapes (flat)
    shape('rectangle', 'Rectangle', '40 × 30 m, sharp corners.', { kind: 'rect', size: 40, depth: 30 });
    shape('circle', 'Circle', 'Ø 40 m.', { kind: 'ellipse', size: 40 }, 1);
    shape('semicircle', 'Half circle', 'Ø 40 m, flat side north.', { kind: 'semicircle', size: 40 });
    shape('triangle', 'Triangle', '40 m equilateral.', { kind: 'triangle', size: 40 });
    shape('reuleaux', 'Reuleaux triangle', 'The rounded triangle, 40 m.', { kind: 'reuleaux', size: 40 }, 1);
    shape('hexagon', 'Hexagon', 'Ø 40 m.', { kind: 'polygon', sides: 6, size: 40, turn: 30 });
    shape('star-5', 'Star', 'Five points, Ø 40 m.', { kind: 'star', points: 5, size: 40, inner: 0.42 });
    shape('sparkle', 'Sparkle', 'A four-point star with curved sides, 40 m.', { kind: 'sparkle', size: 40 }, 0.5);
    shape('rose-5', 'Five-petal rose', 'A rhodonea, 40 m.', { kind: 'rose', petals: 5, size: 40 }, 1);
    shape('rose-8', 'Eight-petal rose', 'A rhodonea, 40 m.', { kind: 'rose', petals: 8, size: 40, inner: 0.3 }, 1);
    shape('flower', 'Flower', 'Six soft petals, 40 m.', { kind: 'flower', petals: 6, size: 40 }, 1);
    shape('spirograph-5', 'Spirograph · 5', 'A five-lobed hypotrochoid, 40 m.', { kind: 'spirograph', lobes: 5, size: 40 }, 1);
    shape('spirograph-7', 'Spirograph · 7', 'Seven deep lobes, 40 m.', { kind: 'spirograph', lobes: 7, bulge: 0.9, size: 40 }, 1);
    shape('superformula-star', 'Super star', 'The superformula with six spikes, 40 m.', { kind: 'superformula', size: 40 });
    shape('superformula-cog', 'Super cog', 'Eight blunt teeth, 40 m.', { kind: 'superformula', size: 40, symmetry: 8, roundness: 0.5, twist1: 0.5, twist2: 8 }, 0.5);
    shape('gear', 'Gear', 'Twelve teeth, Ø 40 m.', { kind: 'gear', teeth: 12, size: 40 });
    shape('cross', 'Cross', '40 × 40 m, arms 14 m wide.', { kind: 'cross', size: 40, thickness: 0.35 });
    shape('chevron', 'Chevron', '40 × 40 m, pointing east.', { kind: 'chevron', size: 40 });
    shape('arrow', 'Arrow', '40 × 30 m, pointing east.', { kind: 'arrow', size: 40, depth: 30 });
    shape('lightning', 'Lightning', 'A bolt, 25 × 50 m.', { kind: 'lightning', size: 25, depth: 50 });
    for (const [L, w, d] of [['L', 40, 40], ['U', 40, 35], ['T', 40, 35], ['H', 40, 40], ['S', 36, 40], ['Y', 40, 40]] as const)
        shape(`letter-${L.toLowerCase()}`, L, `A block ${L}, ${w} × ${d} m.`, { kind: 'letter', letter: L, size: w, depth: d });
    shape('heart', 'Heart', '40 × 36 m.', { kind: 'heart', size: 40 }, 0.5);
    shape('spade', 'Spade', '40 m.', { kind: 'spade', size: 40 }, 0.5);
    shape('club', 'Club', '40 m.', { kind: 'club', size: 40 }, 0.5);
    shape('droplet', 'Droplet', '24 × 50 m.', { kind: 'droplet', size: 24 }, 0.5);
    shape('shield', 'Shield', '36 × 44 m.', { kind: 'shield', size: 36 }, 0.3);
    shape('crescent', 'Crescent', 'Ø 40 m moon.', { kind: 'crescent', size: 40 }, 1);
    shape('leaf', 'Leaf', '50 × 20 m.', { kind: 'leaf', size: 50 }, 1);
    shape('cloud', 'Cloud', 'Five puffs, 44 m.', { kind: 'cloud', size: 44 }, 1);
    shape('bubble', 'Speech bubble', '40 × 36 m.', { kind: 'bubble', size: 40 }, 0.6);
    shape('house', 'House', 'A gable outline, 30 × 32 m.', { kind: 'house', size: 30 });
    shape('bell', 'Bell', '36 × 34 m.', { kind: 'bell', size: 36 }, 0.4);
    shape('fish', 'Fish', '50 × 26 m.', { kind: 'fish', size: 50 }, 0.6);

    // ================================================================== Rings & frames (flat, holes)
    group = 'rings';
    const circle40 = ellipse(40, 40, 24);
    add('ring', 'Ring', 'Ø 40 m, a Ø 24 m hole.', { points: circle40, curve: 1, holes: [hole(circle40, { f: 0.6, curve: 1 })] });
    add('square-frame', 'Square frame', '40 m, a 24 m opening.', { points: rect(40, 40), holes: [hole(rect(24, 24))] });
    add('bullseye', 'Bullseye', 'Ø 40 m with a Ø 16 m centre ground (a ground fills its whole hole, so rings need separate holes).', { points: circle40, curve: 1, holes: [hole(circle40, { f: 0.4, curve: 1, ground: true })] });
    add('infinity', 'Infinity', 'A lemniscate with its two eyes, 60 × 30 m.', { points: S({ kind: 'infinity', size: 60 }), curve: 1, holes: [hole(ellipse(14, 7, 12), { dx: -18, curve: 1 }), hole(ellipse(14, 7, 12), { dx: 18, curve: 1 })] });
    add('running-track', 'Running track', 'The 400 m track: a 176 × 92 m ring round a 108 × 68 m infield.', { points: stadium(176, 92), holes: [hole(stadium(140, 56), { ground: true })] });
    add('moat', 'Moat', 'A 50 m square of water round a 30 m island (a ground).', { points: rect(50, 50), smoothCorners: 0.2, holes: [hole(rect(30, 30), { smoothCorners: 0.2, ground: true })] });
    {
        // a hexagon with seven hexagonal cells
        const r = 12, cells: AreaHole[] = [hole(S({ kind: 'polygon', sides: 6, size: 9, turn: 30 }))];
        for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; cells.push(hole(S({ kind: 'polygon', sides: 6, size: 9, turn: 30 }), { dx: Math.cos(a) * r, dz: Math.sin(a) * r })); }
        add('honeycomb', 'Honeycomb', 'A 46 m hexagon with seven hexagonal cells.', { points: S({ kind: 'polygon', sides: 6, size: 46, turn: 30 }), holes: cells });
    }
    {
        const holes: AreaHole[] = [];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) holes.push(hole(rect(9, 8), { dx: -13 + c * 13, dz: -6 + r * 12 }));
        add('window-grid', 'Window grid', 'A 46 × 28 m slab with 3 × 2 openings.', { points: rect(46, 28), holes });
    }
    {
        const holes: AreaHole[] = [];
        for (let k = 0; k < 5; k++) holes.push(hole(stadium(40, 3), { dz: -10 + k * 5 }));
        add('grating', 'Grating', 'A 50 × 30 m slab with five long slots.', { points: rect(50, 30), smoothCorners: 0.1, holes });
    }
    {
        let seed = 3;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const holes: AreaHole[] = [];
        const spots: Array<[number, number, number]> = [[-12, -8, 7], [8, -11, 5], [14, 4, 8], [-4, 6, 4], [-15, 9, 5], [2, -1, 3], [6, 12, 4]];
        for (const [x, z, d] of spots) holes.push(hole(ellipse(d, d, 10), { dx: x + (rnd() - 0.5) * 2, dz: z + (rnd() - 0.5) * 2, curve: 1, ground: true }));
        add('swiss-cheese', 'Swiss cheese', 'A 44 × 34 m slab with seven round holes (grounds).', { points: rect(44, 34), smoothCorners: 0.4, holes });
    }
    add('lily-pad', 'Lily pad', 'Ø 40 m with a notch and three small holes.', {
        points: S({ kind: 'sector', size: 40, angle: 320, samples: 22, turn: 180 }), curve: 0.9, holes: [hole(ellipse(4, 4, 8), { dx: -8, dz: 4, curve: 1 }), hole(ellipse(3, 3, 8), { dx: 9, dz: -6, curve: 1 }), hole(ellipse(2.5, 2.5, 8), { dx: 3, dz: 10, curve: 1 })],
    });

    // ================================================================== Relief (heights; meshes: surface / extrude)
    group = 'relief';
    add('ramp', 'Ramp', '40 × 30 m, the east side 8 m up.', { points: liftPts(rect(40, 30), (x) => (x > 0 ? 8 : 0)), curve: 0 });
    add('saddle', 'Saddle', '40 × 40 m, opposite corners up and down 8 m — a hyperbolic sheet.', { points: liftPts(S({ kind: 'ellipse', size: 40, samples: 16 }), (x, z) => round2(8 * Math.cos(2 * ang(x, z)))), curve: 1, heightCurve: 'smooth' });
    add('gable-roof', 'Gable roof', '40 × 24 m, a 6 m ridge along the middle.', { points: [[-20, 0, -12], [0, 6, -12], [20, 0, -12], [20, 0, 12], [0, 6, 12], [-20, 0, 12]], curve: 0 });
    add('hip-roof', 'Hip roof', '40 × 24 m rising to a 6 m ridge (a ground).', { points: rect(40, 24), holes: [hole(rect(16, 1), { y: 6, ground: true })] });
    add('pyramid', 'Pyramid', 'A 40 m square rising 15 m to a 6 m flat top (a ground).', { points: rect(40, 40), holes: [hole(rect(6, 6), { y: 15, ground: true })] });
    add('spire', 'Spire', 'Ø 40 m rising steeply to a 25 m point.', { points: circle40, curve: 1, holes: [hole(circle40, { f: 0.05, y: 25, curve: 1 })] });
    add('mesa', 'Mesa', 'Ø 40 m, a Ø 24 m flat top 10 m up (a ground).', { points: circle40, curve: 1, holes: [hole(circle40, { f: 0.6, y: 10, curve: 1, ground: true })] });
    add('dish', 'Dish', 'Ø 40 m, a wide Ø 28 m floor 6 m down (a ground).', { points: circle40, curve: 1, holes: [hole(circle40, { f: 0.7, y: -6, curve: 1, ground: true })] });
    add('funnel', 'Funnel', 'Ø 40 m falling to a Ø 4 m throat 12 m down.', { points: circle40, curve: 1, holes: [hole(circle40, { f: 0.1, y: -12, curve: 1 })] });
    {
        const steps = (n: number, rise: number, w: number, d: number): V3[] => {
            const pts: V3[] = [];
            for (let k = 0; k <= n; k++) { const x0 = -w / 2 + (k / n) * w; if (k < n) pts.push([x0, k * rise, -d / 2]); if (k > 0) pts.push([x0, (k - 1) * rise, -d / 2]); }
            // the south side back, the same steps
            for (let k = n; k >= 0; k--) { const x0 = -w / 2 + (k / n) * w; if (k > 0) pts.push([x0, (k - 1) * rise, d / 2]); if (k < n) pts.push([x0, k * rise, d / 2]); }
            return pts.filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1] || p[2] !== a[i - 1][2]);
        };
        add('stairs', 'Stairs', '40 × 20 m: eight 1 m steps rising east.', { points: steps(8, 1, 40, 20), curve: 0 });
    }
    add('half-pipe', 'Half pipe', '40 × 24 m, the long sides 8 m up — a U across.', { points: [[-20, 8, -12], [20, 8, -12], [20, 8, 12], [-20, 8, 12]], curve: 0, holes: [hole(rect(34, 2), { y: 0, ground: true })] });
    add('amphitheatre', 'Amphitheatre', 'A half circle, Ø 60 m: the stage edge at 0, the rim 12 m up.', { points: liftPts(S({ kind: 'semicircle', size: 60, samples: 17 }), (x, z) => (z < 1 ? 0 : round2(12 * Math.min(1, (z / 30) ** 0.7)))), curve: 0.8, heightCurve: 'smooth' });
    add('stadium-bowl', 'Stadium bowl', 'A 120 × 90 m bowl 15 m high round a 100 × 64 m pitch (a ground).', { points: at(stadium(120, 90), 15), holes: [hole(stadium(100, 64), { y: 0, ground: true })] });
    add('bridge-deck', 'Bridge deck', '60 × 12 m, arching 5 m in the middle.', { points: [[-30, 0, -6], [0, 5, -6], [30, 0, -6], [30, 0, 6], [0, 5, 6], [-30, 0, 6]], curve: 0, heightCurve: 'smooth' });
    add('twisted-strip', 'Twisted strip', '80 × 16 m, its corners up and down 6 m — a twist along the length.', { points: [[-40, 6, -8], [0, 0, -8], [40, -6, -8], [40, 6, 8], [0, 0, 8], [-40, -6, 8]], curve: 0, heightCurve: 'smooth' });

    // ================================================================== Terrain (landforms; the land object)
    group = 'terrain';
    const landform = (id: string, name: string, description: string, base: Organic, peaks: Array<{ f: number; dx?: number; dz?: number; y: number; ground?: boolean; seed: number; plain?: boolean }>, rimY = 0) => {
        const o = organic(base);
        const pts = at(o.points, rimY);
        const holes = peaks.map((p) => hole(o.points, { f: p.f, dx: p.dx, dz: p.dz, y: p.y, ground: p.ground ?? true, curve: o.curve, smoothCorners: o.smoothCorners, noise: p.plain ? undefined : reseed(o.noise, p.seed) }));
        add(id, name, description, { ...o, points: pts, holes });
    };
    landform('hill', 'Hill', 'About 80 m, rising 18 m to a small summit.', { noise: 'simplex', layers: 'fbm', bumps: 3, amp: 0.2, octaves: 3, seed: 5, width: 80, depth: 64, base: 'blob' }, [{ f: 0.14, y: 18, seed: 9 }]);
    landform('twin-peaks', 'Twin peaks', 'About 120 m with two summits, 24 and 16 m.', { noise: 'perlin', layers: 'fbm', bumps: 3, amp: 0.18, octaves: 3, seed: 12, width: 120, depth: 80 }, [{ f: 0.12, dx: -24, dz: 4, y: 24, seed: 2 }, { f: 0.1, dx: 26, dz: -6, y: 16, seed: 3 }]);
    landform('volcano', 'Volcano', 'About 100 m rising 30 m to a Ø 35 m crater floor (a ground — lava, water…).', { noise: 'simplex', layers: 'fbm', bumps: 4, amp: 0.15, octaves: 3, seed: 7, width: 100, depth: 90 }, [{ f: 0.35, y: 30, seed: 4 }]);
    landform('crater', 'Crater', 'A 100 m rim 4 m up round a floor 10 m down (a ground).', { noise: 'perlin', layers: 'fbm', bumps: 5, amp: 0.08, octaves: 3, seed: 3, width: 100 }, [{ f: 0.55, y: -10, seed: 6 }], 4);
    landform('atoll', 'Atoll', 'A 100 m ring of reef 2 m up round a lagoon 4 m down (a ground).', { noise: 'simplex', layers: 'fbm', bumps: 3, amp: 0.12, octaves: 3, seed: 21, width: 100, depth: 86 }, [{ f: 0.7, y: -4, seed: 5 }], 2);
    landform('rock', 'Rock', 'A jagged 25 m outcrop rising 6 m.', { noise: 'simplex', layers: 'ridged', bumps: 6, amp: 0.3, octaves: 4, seed: 30, width: 25, depth: 20 }, [{ f: 0.3, dx: 2, y: 6, seed: 2, plain: true }]);
    add('ridge', 'Ridge', 'About 160 × 60 m, a long crest 20 m up (a ground).', (() => {
        const o = organic({ noise: 'perlin', layers: 'fbm', bumps: 4, amp: 0.15, octaves: 3, seed: 15, width: 160, depth: 60 });
        return { ...o, holes: [hole(stadium(100, 6), { y: 20, ground: true, noise: { noise: 'perlin', layers: 'fbm', bumps: 5, depth: 1.5, octaves: 2, seed: 3 } })] };
    })());
    add('canyon', 'Canyon', 'A 160 × 80 m plateau cut by a winding gorge 18 m deep (a ground).', (() => {
        const o = organic({ noise: 'value', layers: 'fbm', bumps: 4, amp: 0.1, octaves: 3, seed: 16, width: 160, depth: 80, base: 'square' });
        return { ...o, holes: [hole(band(S({ kind: 'wave', count: 2, size: 130, depth: 20, samples: 20 }), 10), { y: -18, ground: true, curve: 0.8, noise: { noise: 'simplex', layers: 'fbm', bumps: 6, depth: 2, octaves: 3, seed: 9 } })] };
    })());
    add('fjord', 'Fjord coast', '160 × 100 m: a deeply cut shore at 0 on the south, the land 30 m up on the north.', {
        points: liftPts(rect(160, 100), (x, z) => (z < 0 ? 30 : 0)), curve: 0, smoothCorners: 0.2,
        segments: [{ noise: 'none' }, { noise: 'none' }, { noise: { noise: 'simplex', layers: 'fbm', bumps: 3, depth: 26, octaves: 3, seed: 8 } }, { noise: 'none' }],
    });
    {
        const o = organic({ noise: 'perlin', layers: 'fbm', bumps: 4, amp: 0.2, octaves: 4, seed: 15, width: 150, depth: 60, base: 'blob' });
        add('headland', 'Headland cliffs', 'A 150 × 60 m peninsula, its shore rising and falling up to 20 m.', { ...o, points: liftPts(o.points, (x, z, i) => round2(10 + 10 * Math.sin(i * 1.9))), heightCurve: 'smooth' });
    }
    add('river-valley', 'River valley', '160 × 80 m: both long sides 15 m up, the valley floor along the middle.', {
        ...organic({ noise: 'perlin', layers: 'fbm', bumps: 4, amp: 0.08, octaves: 3, seed: 18, width: 160, depth: 80, base: 'square' }),
        points: liftPts(rect(160, 80), () => 15), holes: [hole(band(S({ kind: 'wave', count: 1.5, size: 150, depth: 16, samples: 16 }), 8), { y: 0, ground: true, curve: 0.8 })],
    });
    add('dunes', 'Dunes', '160 × 100 m of sand, the edges rolling 3 m up and down in five crests.', {
        points: liftPts(S({ kind: 'rect', size: 160, depth: 100 }).flatMap((p, i, a) => { const q = a[(i + 1) % a.length], out: V3[] = []; for (let k = 0; k < 8; k++) out.push([p[0] + ((q[0] - p[0]) * k) / 8, 0, p[2] + ((q[2] - p[2]) * k) / 8]); return out; }), (x, z) => round2(3 + 3 * Math.sin((x / 160) * Math.PI * 2 * 2.5) * Math.cos((z / 100) * Math.PI))),
        curve: 0.5, heightCurve: 'smooth',
    });
    add('terraced-hillside', 'Terraced hillside', '80 × 60 m: five 2.5 m rice terraces with soft edges, rising east.', {
        points: (() => { const pts: V3[] = []; for (let k = 0; k <= 5; k++) { const x = -40 + (k / 5) * 80; if (k < 5) pts.push([x, k * 2.5, -30]); if (k > 0) pts.push([x, (k - 1) * 2.5, -30]); } for (let k = 5; k >= 0; k--) { const x = -40 + (k / 5) * 80; if (k > 0) pts.push([x, (k - 1) * 2.5, 30]); if (k < 5) pts.push([x, k * 2.5, 30]); } return pts; })(),
        curve: 0.3, noise: { noise: 'perlin', layers: 'fbm', bumps: 6, depth: 3, octaves: 3, seed: 11 },
    });


    // ================================================================== Frequencies (shape API waveforms — shapeWaves)
    group = 'frequencies';
    const N = (id: string, name: string, description: string, o: Omit<Organic, 'width'>) => add(id, name, description, organic({ width: 60, ...o }));
    const waveName = (w: WaveKind) => WAVE_KINDS.find((k) => k.id === w)!;
    /** A strip whose north edge is the waveform (flat). */
    const edge = (id: string, name: string, w: WaveKind, cycles: number, amount = 0.4) =>
        add(id, name, `${waveName(w).description} An 80 × 24 m strip with the wave along its north edge.`, S({ kind: 'waveStrip', wave: w, cycles, amount, size: 80, depth: 24, samples: Math.min(160, waveSamples(w, cycles)) }));
    /** A Ø 40 m circle whose radius follows the waveform round it (flat). */
    const ringW = (id: string, name: string, description: string, w: WaveKind, cycles: number, amount: number) =>
        add(id, name, description, S({ kind: 'waveRing', wave: w, cycles, amount, size: 40, samples: Math.min(240, waveSamples(w, cycles)) }));
    /**
     * A 60 × 16 m sheet that carries the waveform across: its long edges rise and fall with it, and five hairline holes
     * (4 cm) along it hold the wave inside too — a stretched sheet alone lets a short wave fade within a quarter of its length.
     */
    const sheet = (id: string, name: string, w: WaveKind, cycles: number, amp = 4, description?: string) => {
        const n = Math.min(120, waveSamples(w, cycles)), xs = Array.from({ length: n + 1 }, (_, k) => k / n);
        const y = (t: number) => round2(amp * waveValue(w, t, cycles));
        const line = (z: number, f = 1) => xs.map((t) => [round2((-30 + t * 60) * f), y(t), round2(z)] as V3);
        const ring = (z0: number, z1: number, f = 1): V3[] => [...line(z0, f), ...line(z1, f).reverse()];
        const holes: AreaHole[] = [1, 2, 3, 4, 5].map((k) => { const z = -8 + (k / 6) * 16; return { points: ring(z - 0.02, z + 0.02, 0.985), curve: 0, smoothCorners: 0 }; });
        add(id, name, description ?? `${waveName(w).description} A 60 × 16 m sheet, ±${amp} m.`, { points: ring(-8, 8), curve: 0, holes });
    };
    // edges
    edge('sine-edge', 'Sine edge', 'sine', 5);
    edge('battlements', 'Battlements', 'square', 8, 0.35);
    edge('zigzag-edge', 'Zigzag edge', 'triangle', 8, 0.35);
    edge('ratchet', 'Ratchet', 'sawtooth', 10, 0.35);
    edge('comb', 'Comb', 'pulse', 10, 0.5);
    edge('heartbeat-edge', 'Heartbeat edge', 'heartbeat', 3, 0.6);
    // rings
    N('noise-sine', 'Sine ring', 'Harmonics round a circle, 5 lobes — a flower.', { noise: 'sine', layers: 'single', bumps: 5, amp: 0.22, seed: 15 });
    ringW('saw-blade', 'Saw blade', 'A circular saw: a sawtooth round a Ø 40 m circle, 24 teeth.', 'sawtooth', 24, 0.08);
    ringW('crown', 'Crown', 'A square wave round a Ø 40 m circle, 10 merlons.', 'square', 10, 0.12);
    ringW('beats-ring', 'Beats ring', 'Two close frequencies round a circle: lobes that swell and fade.', 'beats', 12, 0.14);
    // sheets (heights)
    sheet('wave-sheet', 'Sine sheet', 'sine', 3);
    sheet('square-sheet', 'Square sheet', 'square', 4, 3);
    sheet('triangle-sheet', 'Triangle sheet', 'triangle', 4);
    sheet('sawtooth-sheet', 'Sawtooth sheet', 'sawtooth', 4);
    sheet('damped-sheet', 'Damped sheet', 'damped', 6, 6);
    sheet('beats-sheet', 'Beats sheet', 'beats', 10);
    sheet('am-sheet', 'AM sheet', 'am', 10);
    sheet('fm-sheet', 'FM sheet', 'fm', 6);
    sheet('chirp-sheet', 'Chirp sheet', 'chirp', 6);
    sheet('sinc-sheet', 'Sinc sheet', 'sinc', 6, 6);
    sheet('packet-sheet', 'Wave packet', 'packet', 8, 5);
    sheet('harmonics-sheet', 'Harmonics sheet', 'harmonics', 3, 3);
    sheet('heartbeat-sheet', 'Heartbeat sheet', 'heartbeat', 3, 6);
    add('rippled-disc', 'Rippled disc', 'Ø 40 m, the rim rising and falling 2 m six times round.', { points: liftPts(S({ kind: 'ellipse', size: 40, samples: 36 }), (x, z) => round2(2 * Math.sin(6 * ang(x, z)))), curve: 1, heightCurve: 'smooth' });

    // ================================================================== Nature (flat outlines; canals)
    group = 'nature';
    add('island', 'Island', 'About 80 m, a ragged shore.', organic({ noise: 'simplex', layers: 'fbm', bumps: 4, amp: 0.3, octaves: 5, seed: 5, width: 80, depth: 64, base: 'blob' }));
    add('peninsula', 'Peninsula', 'A tongue of land, 150 × 50 m.', organic({ noise: 'perlin', layers: 'fbm', bumps: 4, amp: 0.2, octaves: 4, seed: 15, width: 150, depth: 50, base: 'blob' }));
    add('woodland-belt', 'Woodland belt', 'A strip of trees, 250 × 40 m.', organic({ noise: 'perlin', layers: 'fbm', bumps: 6, amp: 0.18, octaves: 4, seed: 19, width: 250, depth: 40, base: 'square' }));
    add('marsh', 'Marsh', 'Lobed and pocked, about 100 m, with three pools.', { ...organic({ noise: 'worley', layers: 'billow', bumps: 6, amp: 0.3, octaves: 3, seed: 17, width: 100, depth: 80 }), holes: [hole(ellipse(14, 10, 10), { dx: -20, dz: 8, curve: 1 }), hole(ellipse(9, 9, 10), { dx: 18, dz: -14, curve: 1 }), hole(ellipse(7, 11, 10), { dx: 12, dz: 16, curve: 1 })] });
    // canals: water channels ~12 m wide (flat), and a flight of locks (heights)
    add('canal', 'Canal', 'A straight 200 m canal, 12 m wide.', rect(200, 12));
    add('winding-canal', 'Winding canal', 'A canal swinging twice over 200 m, 12 m wide.', { points: band(S({ kind: 'wave', count: 2, size: 200, depth: 50, samples: 24 }), 12), curve: 0.8 });
    shape('canal-fork', 'Canal fork', 'Two canals joining into one, 120 m, 14 m wide.', { kind: 'letter', letter: 'Y', size: 120, depth: 120, thickness: 0.14 });
    shape('canal-crossing', 'Canal crossing', 'Two canals crossing, 160 m each, 16 m wide.', { kind: 'cross', size: 160, thickness: 0.1 });
    add('turning-basin', 'Turning basin', 'A 200 m canal widening to a Ø 40 m basin where boats turn.', [
        [-100, 0, -6], [-22, 0, -6], ...Array.from({ length: 9 }, (_, k) => { const a = Math.PI + 0.3 + (k / 8) * (Math.PI - 0.6); return [round2(Math.cos(a) * 20), 0, round2(Math.sin(a) * 20)] as V3; }), [22, 0, -6], [100, 0, -6],
        [100, 0, 6], [22, 0, 6], ...Array.from({ length: 9 }, (_, k) => { const a = 0.3 + (k / 8) * (Math.PI - 0.6); return [round2(Math.cos(a) * 20), 0, round2(Math.sin(a) * 20)] as V3; }), [-22, 0, 6], [-100, 0, 6],
    ], 0.4);
    add('canal-arc', 'Canal arc', 'A canal bending in a half ring, 240 m across, 12 m wide — a ring of canals’ one ring.', [
        ...Array.from({ length: 17 }, (_, k) => { const a = Math.PI + (k / 16) * Math.PI; return [round2(Math.cos(a) * 120), 0, round2(Math.sin(a) * 120)] as V3; }),
        ...Array.from({ length: 17 }, (_, k) => { const a = 2 * Math.PI - (k / 16) * Math.PI; return [round2(Math.cos(a) * 108), 0, round2(Math.sin(a) * 108)] as V3; }),
    ], 0.6);
    add('docks', 'Docks', 'A 200 m canal with four 40 m basins off its north side.', (() => {
        const pts: V3[] = [[-100, 0, 7]];
        for (const x of [-60, -20, 20, 60]) pts.push([x - 8, 0, 7], [x - 8, 0, 45], [x + 8, 0, 45], [x + 8, 0, 7]);
        pts.push([100, 0, 7], [100, 0, -7], [-100, 0, -7]);
        return pts.map(([x, y, z]) => [x, y, -z] as V3);
    })());
    add('lock-flight', 'Lock flight', 'A 200 m canal climbing 9 m through three locks: four level pounds.', {
        points: (() => { const pts: V3[] = [], n = 4, rise = 3, w = 200, d = 12; for (let k = 0; k <= n; k++) { const x = -w / 2 + (k / n) * w; if (k > 0) pts.push([x, (k - 1) * rise, -d / 2]); if (k < n) pts.push([x, k * rise, -d / 2]); } for (let k = n; k >= 0; k--) { const x = -w / 2 + (k / n) * w; if (k < n) pts.push([x, k * rise, d / 2]); if (k > 0) pts.push([x, (k - 1) * rise, d / 2]); } return pts.filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1] || p[2] !== a[i - 1][2]); })(),
        curve: 0,
    });

    // ================================================================== Noise: one per function, one per layer style (60 m, so they compare)
    group = 'noise';
    N('noise-value', 'Value', 'Value fBm, 5 bumps — blocky, slow.', { noise: 'value', layers: 'fbm', bumps: 5, amp: 0.3, octaves: 4, seed: 2 });
    N('noise-perlin', 'Perlin', 'Perlin fBm, 4 bumps — rolling.', { noise: 'perlin', layers: 'fbm', bumps: 4, amp: 0.3, octaves: 4, seed: 2 });
    N('noise-simplex', 'Simplex', 'Simplex fBm, 4 bumps — a coastline.', { noise: 'simplex', layers: 'fbm', bumps: 4, amp: 0.32, octaves: 5, seed: 2 });
    N('noise-worley', 'Worley', 'Cellular fBm, 6 bumps — scalloped.', { noise: 'worley', layers: 'fbm', bumps: 6, amp: 0.3, octaves: 3, seed: 12 });
    N('noise-ridged', 'Ridged', 'Ridged simplex — sharp capes.', { noise: 'simplex', layers: 'ridged', bumps: 4, amp: 0.35, octaves: 4, seed: 4 });
    N('noise-billow', 'Billow', 'Billowed simplex — round puffs.', { noise: 'simplex', layers: 'billow', bumps: 4, amp: 0.3, octaves: 3, seed: 6 });
    N('noise-warp', 'Warped', 'Domain-warped fBm — hooks and deep bays.', { noise: 'simplex', layers: 'warp', bumps: 2, amp: 0.4, octaves: 3, seed: 8 });
    N('noise-terrace', 'Terraced', 'Stepped fBm — quarried, eroded edges.', { noise: 'simplex', layers: 'terrace', bumps: 3, amp: 0.35, octaves: 4, seed: 10 });
    N('noise-coast', 'Fractal coast', 'Simplex, 8 octaves — detail at every scale.', { noise: 'simplex', layers: 'fbm', bumps: 6, amp: 0.3, octaves: 8, seed: 17 });
    return out;
}

export const AREA_PRESETS: ReadonlyArray<AreaPreset> = build();
