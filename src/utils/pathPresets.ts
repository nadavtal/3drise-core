// =============================================================================
// pathPresets — ready-made paths (built-in layouts of kind 'path')
// =============================================================================
//
// Starting points in groups, each a plain PathLineInput — exactly what a user could have drawn:
// points [x, y, z] in metres (y is the point's height), rounding, round corners, loop, and the
// curving API's extras (a side's bend / lift, noise). Every curve comes from THE shape API
// (utils/shape: shapePoints) or a handful of clicked points, so a preset is a shape spec plus
// what the editor adds.
//
// Used by the path editor / Paths tab ("Start from a preset"), the LayoutButton gallery (built-in
// paths, by reference 'preset:path:<id>' — animations, ribbons, placing copies) and the AI. One
// preset = one idea (never another's reverse, size or turn count — the editor has Reverse); `relief` marks the ones that climb (the Flights are camera and object motion
// at height; a ribbon consumer may lay them flat with `heights: false`).
//
// Scenes use a preset BY REFERENCE: never change an existing preset — every scene using it would
// silently change. A better version is a new id.
//
import type { PathLineInput } from './pathLine';
import { shapePoints, liftPts, roundPts, waveSamples, WAVE_KINDS, type ShapeSpec, type WaveKind } from './shape';

type V3 = [number, number, number];

export type PathPresetGroup = 'lines' | 'loops' | 'spirals' | 'climbs' | 'flights' | 'frequencies' | 'knots';
export const PATH_PRESET_GROUPS: ReadonlyArray<{ id: PathPresetGroup; label: string; description: string }> = [
    { id: 'lines', label: 'Lines', description: 'Open lines on the ground — bends, hairpins, waves, meanders.' },
    { id: 'loops', label: 'Loops', description: 'Closed loops on the ground — rings, tracks, roses, figure-8s.' },
    { id: 'spirals', label: 'Spirals & helices', description: 'Spirals flat and climbing — helices, springs, ramps, staircases.' },
    { id: 'climbs', label: 'Climbs', description: 'Lines with height — ramps, stairs, switchbacks, bridges, jumps.' },
    { id: 'flights', label: 'Flights', description: 'Camera and object motion in the air — orbits, swoops, fly-bys, surveys.' },
    { id: 'frequencies', label: 'Frequencies', description: 'Known waveforms as signals rising and falling along the line — for bobbing, pulsing, a trace.' },
    { id: 'knots', label: 'Knots & math', description: 'Closed 3D curves — knots, Lissajous figures, wavy rings.' },
];

export interface PathPreset {
    id: string;
    name: string;
    description: string;
    group: PathPresetGroup;
    /** Has height (points off y 0 or a lifted side). */
    relief: boolean;
    path: PathLineInput;
}

/** Does a path have height anywhere (points, lifted sides)? */
export function pathIsRelief(p: PathLineInput): boolean {
    return (p.points ?? []).some((q) => Math.abs(q[1] ?? 0) > 1e-6) || (p.segments ?? []).some((s) => !!s?.bend?.lift);
}

// ---------------------------------------------------------------------------- builders
const S = (spec: ShapeSpec): V3[] => shapePoints(spec).points;
const r2 = (v: number) => Math.round(v * 100) / 100;
/** Points along x from `pts` [x, z] pairs (y 0). */
const P = (pts: Array<[number, number]>): V3[] => pts.map(([x, z]) => [x, 0, z]);
/** Points with heights: [x, y, z] triples typed loosely. */
const H = (pts: Array<[number, number, number]>): V3[] => pts.map(([x, y, z]) => [x, y, z]);
/** A straight line along x with `n` points (for heights that vary along it). */
const along = (length: number, n: number, y: (t: number, x: number) => number, z: (t: number, x: number) => number = () => 0): V3[] =>
    Array.from({ length: n + 1 }, (_, k) => { const t = k / n, x = -length / 2 + t * length; return [r2(x), r2(y(t, x)), r2(z(t, x))] as V3; });

// ---------------------------------------------------------------------------- the presets
function build(): PathPreset[] {
    const out: PathPreset[] = [];
    let group: PathPresetGroup = 'lines';
    const add = (id: string, name: string, description: string, path: PathLineInput) => {
        const p: PathLineInput = { curve: 0, smoothCorners: 0, ...path, points: roundPts(path.points as V3[]) as PathLineInput['points'] };
        out.push({ id, name, description, group, relief: pathIsRelief(p), path: p });
    };
    const shape = (id: string, name: string, description: string, spec: ShapeSpec, extra: Partial<PathLineInput> = {}) => {
        const { points, closed } = shapePoints(spec);
        add(id, name, description, { points, loop: closed, ...extra });
    };

    // ================================================================== Lines (flat, open)
    add('straight', 'Straight', '60 m, west to east.', { points: P([[-30, 0], [30, 0]]) });
    add('bend', 'L bend', '40 m east, a round corner, 40 m south.', { points: P([[-20, -20], [20, -20], [20, 20]]), smoothCorners: 0.5 });
    add('s-curve', 'S-curve', '80 m with two gentle bends.', { points: P([[-40, -12], [-12, -14], [12, 14], [40, 12]]), curve: 0.9 });
    add('u-turn', 'U-turn', '40 m out, round, 40 m back.', { points: P([[-30, -10], [20, -10], [20, 10], [-30, 10]]), smoothCorners: 0.9 });
    add('hairpin', 'Hairpin', 'A tight 180° turn at the end of a 50 m approach.', { points: P([[-30, -4], [20, -4], [26, 0], [20, 4], [-30, 4]]), curve: 0.8 });
    add('chicane', 'Chicane', '80 m straight with a left-right jink.', { points: P([[-40, 0], [-8, 0], [0, -8], [8, 0], [40, 0]]), smoothCorners: 0.8 });
    shape('zigzag', 'Zigzag', 'Five teeth over 60 m.', { kind: 'zigzag', count: 5, size: 60, depth: 16 });
    shape('wave', 'Wave', 'Three crests over 60 m.', { kind: 'wave', count: 3, size: 60, depth: 16, samples: 24 }, { curve: 1 });
    add('swoosh', 'Swoosh', 'A long easy curve that tightens at the end, 80 m.', { points: P([[-40, 20], [0, 16], [30, 0], [40, -20]]), curve: 1 });
    add('hook', 'Hook', 'Straight, then a half circle back, 60 m.', { points: [...P([[-30, 10], [10, 10]]), ...Array.from({ length: 7 }, (_, k) => { const a = Math.PI / 2 - (k / 6) * Math.PI; return [r2(10 + Math.cos(a) * 10), 0, r2(Math.sin(a) * 10)] as V3; }), ...P([[0, -10]])], curve: 0.9 });
    add('meander', 'Meander', 'A river over 120 m, loops and all.', { points: P([[-60, 0], [-40, -14], [-22, 12], [-4, -16], [14, 14], [32, -12], [48, 10], [60, 0]]), curve: 1, noise: { noise: 'simplex', layers: 'fbm', bumps: 6, depth: 1.5, octaves: 2, seed: 3 } });
    add('lightning-line', 'Lightning', 'A bolt of five sharp strokes, 60 m.', { points: P([[-30, -16], [-8, -6], [-14, 2], [10, 8], [4, 14], [30, 18]]) });

    // ================================================================== Loops (flat, closed)
    group = 'loops';
    shape('circle', 'Circle', 'Ø 40 m.', { kind: 'ellipse', size: 40, samples: 16 }, { curve: 1 });
    shape('racetrack', 'Racetrack', '80 × 36 m: two straights, two round ends.', { kind: 'stadium', size: 80, depth: 36, samples: 12 }, { curve: 0.6 });
    shape('figure-8', 'Figure-8', '60 × 30 m, crossing in the middle.', { kind: 'figureEight', size: 60, depth: 30, samples: 24 }, { curve: 1 });
    shape('trefoil', 'Trefoil', 'A three-petal rose, 40 m.', { kind: 'rose', petals: 3, size: 40, inner: 0.1, samples: 30 }, { curve: 1 });
    shape('spirograph-loop', 'Spirograph', 'Five lobes, 40 m.', { kind: 'spirograph', lobes: 5, size: 40, samples: 30 }, { curve: 1 });
    shape('kidney-loop', 'Kidney', '40 × 26 m.', { kind: 'kidney', size: 40 }, { curve: 1 });
    add('kart-track', 'Kart track', 'A 100 × 60 m circuit: hairpin, chicane, sweeper.', { points: P([[-50, -30], [20, -30], [40, -22], [44, -4], [30, 4], [18, 0], [10, 10], [26, 26], [50, 30], [-30, 30], [-50, 14], [-30, 0], [-50, -14]]), loop: true, curve: 0.85 });
    shape('infinity-loop', 'Infinity', 'A lemniscate, 60 × 20 m.', { kind: 'infinity', size: 60, samples: 24 }, { curve: 1 });

    // ================================================================== Spirals & helices
    group = 'spirals';
    shape('spiral', 'Spiral', 'Three turns out to Ø 40 m, flat.', { kind: 'spiral', turns: 3, size: 40, inner: 0.08 }, { curve: 1 });
    shape('golden-spiral', 'Golden spiral', 'A logarithmic spiral, three turns to Ø 40 m.', { kind: 'spiral', turns: 3, size: 40, growth: 'golden', inner: 0.05 }, { curve: 1 });
    shape('helix', 'Helix', 'Three turns of Ø 20 m, climbing 30 m.', { kind: 'helix', turns: 3, size: 20, height: 30 }, { curve: 1 });
    shape('tornado', 'Tornado', 'A conical spiral: Ø 40 m at the top, a point at the ground, 40 m tall.', { kind: 'helix', turns: 5, size: 40, height: 40, taper: 0 }, { curve: 1 });
    add('square-ramp', 'Square spiral ramp', 'Four square turns of 30 m climbing 20 m, round corners.', {
        points: (() => { const pts: V3[] = []; const c = [[-15, -15], [15, -15], [15, 15], [-15, 15]]; for (let k = 0; k < 17; k++) { const [x, z] = c[k % 4]; pts.push([x, r2((k / 16) * 20), z]); } return pts; })(),
        smoothCorners: 0.5,
    });
    shape('corkscrew', 'Corkscrew', 'A helix lying along the ground, Ø 16 m, 60 m long.', { kind: 'helix', turns: 4, size: 16, height: 60, axis: 'x' }, { curve: 1 });
    add('spiral-staircase', 'Spiral staircase', 'Two turns of Ø 8 m: 24 steps of 25 cm.', {
        points: (() => { const pts: V3[] = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 4; pts.push([r2(Math.cos(a) * 4), r2(k * 0.25), r2(-Math.sin(a) * 4)]); if (k < 24) { const b = ((k + 1) / 24) * Math.PI * 4; pts.push([r2(Math.cos(b) * 4), r2(k * 0.25), r2(-Math.sin(b) * 4)]); } } return pts; })(),
    });

    // ================================================================== Climbs (open, heights)
    group = 'climbs';
    add('ramp', 'Ramp', '40 m rising 10 m.', { points: H([[-20, 0, 0], [20, 10, 0]]) });
    shape('stairs', 'Stairs', 'Ten steps over 20 m, 2 m up.', { kind: 'stairs', steps: 10, size: 20, height: 2 });
    add('switchbacks', 'Switchbacks', 'Five hairpins up a 60 × 24 m slope, 30 m of climb.', {
        points: H([[-30, 0, 12], [30, 5, 12], [30, 7, 7], [-30, 12, 7], [-30, 14, 2], [30, 19, 2], [30, 21, -3], [-30, 26, -3], [-30, 28, -8], [30, 30, -8]]), curve: 0.4, smoothCorners: 0.7,
    });
    add('mountain-pass', 'Mountain pass', '100 m up over a 25 m pass and down again, smooth.', { points: along(100, 8, (t) => 25 * Math.sin(t * Math.PI) ** 2), curve: 0.6, heightCurve: 'smooth' });
    add('bridge-arch', 'Bridge arch', '60 m with the middle 40 m arching 8 m up.', { points: H([[-30, 0, 0], [-20, 0, 0], [20, 0, 0], [30, 0, 0]]), segments: [null, { bend: { lift: 8 } }, null] });
    add('suspension', 'Suspension cable', '80 m sagging 6 m between two 20 m towers.', { points: H([[-40, 20, 0], [40, 20, 0]]), segments: [{ bend: { lift: -6 } }] });
    add('rolling-road', 'Rolling road', '100 m of gentle hills, ±4 m.', { points: along(100, 12, (t) => 4 * Math.sin(t * Math.PI * 2 * 2.5)), curve: 1, heightCurve: 'smooth' });
    add('jump', 'Jump', 'A run-up, a kicker and a 20 m parabola.', { points: H([[-30, 0, 0], [-6, 0, 0], [0, 3, 0], [6, 7, 0], [12, 8, 0], [18, 6, 0], [24, 0, 0], [34, 0, 0]]), curve: 0.7, heightCurve: 'smooth' });
    add('bounce', 'Bounce', 'Three decaying bounces over 60 m: 10, 6 and 3 m.', { points: H([[-30, 10, 0], [-22, 0, 0], [-12, 6, 0], [-2, 0, 0], [6, 3, 0], [14, 0, 0], [20, 1.2, 0], [26, 0, 0], [30, 0, 0]]), curve: 0.8, heightCurve: 'smooth' });
    add('slalom', 'Slalom descent', 'Seven gates down a 25 m drop over 80 m.', { points: along(80, 7, (t) => 25 * (1 - t), (t, x) => 8 * Math.sin(t * Math.PI * 7)), curve: 0.9 });
    add('river-descent', 'River descent', 'A meander falling 18 m over 120 m.', { points: H([[-60, 18, 0], [-40, 15, -14], [-22, 12, 12], [-4, 9, -16], [14, 6, 14], [32, 3, -12], [48, 1, 10], [60, 0, 0]]), curve: 1, heightCurve: 'smooth' });
    add('half-pipe-line', 'Half pipe', 'A U in the vertical plane: 20 m across, 8 m deep.', { points: H([[-10, 8, 0], [-8, 2, 0], [-4, 0, 0], [4, 0, 0], [8, 2, 0], [10, 8, 0]]), curve: 1, heightCurve: 'smooth' });

    // ================================================================== Flights (camera / object motion, in the air)
    group = 'flights';
    add('orbit', 'Orbit', 'A Ø 40 m circle 20 m up — round the subject.', { points: liftPts(S({ kind: 'ellipse', size: 40, samples: 12 }), () => 20), loop: true, curve: 1 });
    add('descending-orbit', 'Descending orbit', 'Two turns of Ø 40 m from 30 m down to 6 m.', { points: S({ kind: 'helix', turns: 2, size: 40, height: -24 }).map((p) => [p[0], r2(p[1] + 30), p[2]] as V3), curve: 1 });
    add('fly-in', 'Fly-in swoop', 'From 80 m out and 40 m up down to 4 m at the subject, easing.', { points: H([[-80, 40, 30], [-50, 30, 14], [-24, 14, 2], [-6, 4, 0]]), curve: 1, heightCurve: 'smooth' });
    add('fly-by', 'Fly-by', 'A 120 m pass at 10 m with a gentle S.', { points: H([[-60, 10, 20], [-20, 10, 6], [20, 10, -6], [60, 10, -20]]), curve: 1 });
    add('crane-up', 'Crane up', 'From 2 m to 18 m while pulling back 12 m.', { points: H([[0, 2, 0], [-4, 8, 0], [-12, 18, 0]]), curve: 1 });
    add('reveal-arc', 'Reveal arc', 'A quarter circle of 40 m rising from 3 m to 15 m.', { points: S({ kind: 'arc', size: 40, depth: 40, angle: 90, samples: 8 }).map((p, i, a) => [p[0], r2(3 + (12 * i) / (a.length - 1)), p[2]] as V3), curve: 1 });
    add('drone-survey', 'Drone survey', 'A lawnmower pattern at 25 m over 100 × 60 m.', {
        points: (() => { const pts: V3[] = []; for (let k = 0; k < 5; k++) { const z = -30 + k * 15, l = k % 2 === 0; pts.push([l ? -50 : 50, 25, z], [l ? 50 : -50, 25, z]); } return pts; })(), smoothCorners: 0.6,
    });
    add('take-off', 'Take-off', 'A 60 m runway, then a climb to 40 m.', { points: H([[-60, 0, 0], [-10, 0, 0], [10, 4, 0], [30, 14, 0], [50, 28, 0], [70, 40, 0]]), curve: 0.8, heightCurve: 'smooth' });
    add('chase', 'Chase', 'A low fast S at 2 m over 100 m.', { points: H([[-50, 2, 10], [-20, 2, -10], [10, 2, 10], [50, 2, -8]]), curve: 1 });
    add('orbit-and-dive', 'Orbit and dive', 'One turn of Ø 40 m at 20 m, then a spiral in to 2 m.', { points: S({ kind: 'helix', turns: 2.5, size: 40, height: -18, taper: 0.1 }).map((p) => [p[0], r2(p[1] + 20), p[2]] as V3), curve: 1 });

    // ================================================================== Frequencies (signals: the waveform up and down along 80 m — shapeWaves)
    group = 'frequencies';
    const signal = (w: WaveKind, cycles: number, height = 8, name?: string) => {
        const k = WAVE_KINDS.find((x) => x.id === w)!;
        shape(`signal-${w}`, name ?? k.label, `${k.description} 80 m long, ${height} m from trough to crest.`, { kind: 'waveform', wave: w, cycles, size: 80, height, samples: Math.min(240, waveSamples(w, cycles)) });
    };
    signal('sine', 4); signal('square', 4); signal('triangle', 5); signal('sawtooth', 5); signal('pulse', 5);
    signal('damped', 6, 10); signal('beats', 12); signal('am', 12); signal('fm', 8); signal('chirp', 6);
    signal('sinc', 8, 10); signal('packet', 8); signal('harmonics', 3); signal('heartbeat', 3, 10);

    // ================================================================== Knots & math (closed, 3D)
    group = 'knots';
    shape('trefoil-knot', 'Trefoil knot', 'The (2, 3) torus knot, 40 m, 8 m tall.', { kind: 'torusKnot', p: 2, q: 3, size: 40, height: 8, samples: 36 }, { curve: 1 });
    shape('torus-knot-25', 'Torus knot (2, 5)', 'Five crossings, 40 m, 8 m tall.', { kind: 'torusKnot', p: 2, q: 5, size: 40, height: 8, samples: 50 }, { curve: 1 });
    shape('lissajous', 'Lissajous', 'A 3 : 2 : 1 figure, 40 m, 10 m tall.', { kind: 'lissajous', a: 3, b: 2, c: 1, size: 40, height: 10, samples: 48 }, { curve: 1 });
    shape('saddle-ring', 'Saddle ring', 'A Ø 40 m circle rising and falling twice, ±6 m.', { kind: 'wavyRing', waves: 2, size: 40, height: 12, samples: 16 }, { curve: 1 });
    shape('wobble-ring', 'Wobble ring', 'A Ø 40 m circle rising and falling three times, ±4 m.', { kind: 'wavyRing', waves: 3, size: 40, height: 8, samples: 24 }, { curve: 1 });
    shape('wave-ring', 'Wave ring', 'A Ø 40 m circle with six waves of ±2 m.', { kind: 'wavyRing', waves: 6, size: 40, height: 4, samples: 36 }, { curve: 1 });
    return out;
}

export const PATH_PRESETS: ReadonlyArray<PathPreset> = build();
