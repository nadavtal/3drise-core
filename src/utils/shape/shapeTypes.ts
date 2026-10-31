// =============================================================================
// shapeTypes — THE shape API's vocabulary: one spec, one result
// =============================================================================
//
// Every outline and every 3D curve in 3drise is described by a ShapeSpec and drawn by shapePoints
// (shape/index.ts) — layout presets, the mesh variants' outlines, particle layouts, whatever the
// AI makes. The result is authoring points: a ring (`closed`) or a line, in metres, centred on
// x 0 / z 0 (the middle of its bounds), flat (y 0) unless the shape has height. The points then go
// through the curving API (utils/curve: rounding, corners, bends, noise, heights) and on into a
// layout (area / path / grid) — shape → curve → layout → apply.
//
// Sizes: `size` is the shape's width (x extent) in metres; `depth` its z extent (default: size,
// or the shape's own proportion); `height` its y extent for the ones that climb. Point counts
// (`samples`) default to what an editor can still handle (a ring of 24–48 points with `curve 1`
// draws smooth); a consumer that wants a dense outline (a mesh) asks for more.
//
import type { WaveKind } from './shapeWaves';

type V3 = [number, number, number];

export interface ShapeResult {
    /** The authoring points, [x, y, z] metres, centred on their x / z bounds. */
    points: V3[];
    /** A ring (the last point joins the first) or an open line. */
    closed: boolean;
}

/** Common to every spec. */
interface Sized {
    /** Width (x extent), metres. */
    size: number;
    /** z extent, metres (default: the shape's own proportion of `size`). */
    depth?: number;
    /** Turn about y, degrees (default 0: the shape's natural orientation, "up" = north = −z). */
    turn?: number;
    /** Point count for the sampled shapes (default per shape). */
    samples?: number;
}

export type OutlineSpec =
    // ---- geometric
    | ({ kind: 'rect' } & Sized)
    | ({ kind: 'ellipse' } & Sized)
    | ({ kind: 'stadium' } & Sized)                                   // a rectangle with half-circle ends (capsule)
    | ({ kind: 'semicircle' } & Sized)                                // flat side north
    | ({ kind: 'sector'; angle?: number } & Sized)                    // a pie slice (angle degrees, default 90), tip at the centre
    | ({ kind: 'polygon'; sides: number } & Sized)                    // regular, a corner north
    | ({ kind: 'star'; points: number; inner?: number } & Sized)      // inner 0..1: the inner radius as a share (default 0.45)
    | ({ kind: 'sparkle'; points?: number; inner?: number } & Sized)  // a star with curved-in sides (default 4 points)
    | ({ kind: 'superellipse'; n?: number } & Sized)                  // n 2 ellipse · 4 squircle · 1 diamond · 0.7 astroid-ish
    | ({ kind: 'superformula'; symmetry?: number; roundness?: number; twist1?: number; twist2?: number; stretchX?: number; stretchY?: number } & Sized)
    | ({ kind: 'rose'; petals: number; inner?: number } & Sized)      // rhodonea petals; inner 0..1 keeps a core (default 0.15)
    | ({ kind: 'flower'; petals: number; inner?: number; sharp?: number } & Sized) // the mesh variant's flower (inner 0.52, sharp 0.7)
    | ({ kind: 'spirograph'; lobes: number; bulge?: number } & Sized) // a hypotrochoid; bulge 0..1 (default 0.6), never self-crossing
    | ({ kind: 'gear'; teeth: number; inner?: number } & Sized)       // inner 0..1: the valley radius share (default 0.76)
    | ({ kind: 'reuleaux' } & Sized)                                  // the rounded triangle
    | ({ kind: 'triangle' } & Sized)                                  // equilateral, point north
    | ({ kind: 'rightTriangle' } & Sized)
    | ({ kind: 'diamond' } & Sized)                                   // a rhombus
    | ({ kind: 'kite' } & Sized)
    | ({ kind: 'trapezoid'; top?: number } & Sized)                   // top 0..1: the north side's share of the width (default 0.6)
    | ({ kind: 'parallelogram'; slant?: number } & Sized)             // slant 0..1 of the depth (default 0.4)
    | ({ kind: 'chevron'; thickness?: number } & Sized)               // pointing east
    | ({ kind: 'arrow'; thickness?: number } & Sized)                 // pointing east; thickness 0..1 the shaft's share (default 0.4)
    | ({ kind: 'cross'; thickness?: number } & Sized)                 // thickness 0..1 (default 0.34)
    | ({ kind: 'letter'; letter: ShapeLetter; thickness?: number } & Sized) // block letters, thickness 0..1 of the size (default 0.3)
    // ---- symbolic (the mesh variants' outlines)
    | ({ kind: 'heart' } & Sized)
    | ({ kind: 'spade' } & Sized)
    | ({ kind: 'club' } & Sized)
    | ({ kind: 'droplet'; taper?: number } & Sized)
    | ({ kind: 'lightning' } & Sized)
    | ({ kind: 'shield' } & Sized)
    | ({ kind: 'infinity'; waist?: number } & Sized)                  // the lemniscate silhouette (solid; holes are the preset's)
    // ---- organic
    | ({ kind: 'teardrop' } & Sized)                                  // pointed west
    | ({ kind: 'egg' } & Sized)
    | ({ kind: 'leaf' } & Sized)
    | ({ kind: 'kidney' } & Sized)
    | ({ kind: 'crescent'; thickness?: number } & Sized)              // thickness 0..1 (default 0.38)
    | ({ kind: 'cloud'; puffs?: number } & Sized)
    | ({ kind: 'bubble' } & Sized)                                    // a speech bubble, tail south-west
    | ({ kind: 'house' } & Sized)
    | ({ kind: 'bell' } & Sized)
    | ({ kind: 'fish' } & Sized)
    // ---- frequencies (shapeWaves)
    | ({ kind: 'waveStrip'; wave: WaveKind; cycles?: number; amount?: number } & Sized)  // a strip whose north edge is the waveform; amount 0..1 of the depth (default 0.35)
    | ({ kind: 'waveRing'; wave: WaveKind; cycles?: number; amount?: number } & Sized); // a circle whose radius follows the waveform round it; amount 0..0.6 (default 0.15)

export type ShapeLetter = 'L' | 'U' | 'T' | 'H' | 'S' | 'Z' | 'Y' | 'E' | 'C' | 'I' | 'X' | 'F' | 'N';

export type CurveShapeSpec =
    | ({ kind: 'line' } & Sized)                                      // along x
    | ({ kind: 'arc'; angle?: number } & Sized)                       // an open arc (angle degrees, default 180), opening north
    | ({ kind: 'zigzag'; count: number } & Sized)                     // along x, `count` teeth, `depth` the swing
    | ({ kind: 'wave'; count: number } & Sized)                       // a sine along x, `count` crests
    | ({ kind: 'spiral'; turns: number; inner?: number; growth?: 'linear' | 'golden' } & Sized) // flat; inner 0..1 start radius share
    | ({ kind: 'helix'; turns: number; height: number; taper?: number; axis?: 'y' | 'x' } & Sized) // taper: the end radius as a share of the start (1 cylinder, 0 cone, 2 widening); height may be negative
    | ({ kind: 'stairs'; steps: number; height: number } & Sized)     // along x, each step a flat tread + a riser
    | ({ kind: 'figureEight' } & Sized)                               // a lemniscate line (self-crossing; a path, never an area)
    | ({ kind: 'lissajous'; a?: number; b?: number; c?: number; height?: number } & Sized) // x = sin(a t), z = sin(b t + π/2), y = sin(c t) · height / 2
    | ({ kind: 'torusKnot'; p?: number; q?: number; tube?: number; height?: number } & Sized) // the (p, q) torus knot's centre line, tube 0..1 of the radius
    | ({ kind: 'wavyRing'; waves: number; height: number } & Sized)   // a circle whose height runs y = sin(waves θ) · height / 2
    | ({ kind: 'waveform'; wave: WaveKind; cycles?: number; height?: number } & Sized); // a waveform along x: sideways (z, `depth`) or, with `height`, up and down (y)

export type ShapeSpec = OutlineSpec | CurveShapeSpec;
export type ShapeKind = ShapeSpec['kind'];
