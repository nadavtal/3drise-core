// =============================================================================
// shape — THE shape API: one spec, one function, every outline and curve in 3drise
// =============================================================================
//
// shapePoints(spec) → { points, closed }: the authoring points of a shape, in metres, centred.
// They feed the curving API (utils/curve) and the layouts (area / path / grid):
//
//   shape → curve → layout → apply
//
//   shapePoints({ kind: 'rose', petals: 5, size: 40 })                 a flat ring (an area, a loop path)
//   shapePoints({ kind: 'helix', size: 20, height: 30, turns: 3 })     a climbing line (a path)
//   shapePoints({ kind: 'letter', letter: 'L', size: 40 })             block letters
//   shapePoints({ kind: 'superformula', symmetry: 5, size: 40 })       a family of shapes from six numbers
//
// Rules: deterministic (the same spec always gives the same points — presets depend on it; a
// better version of a shape is a new kind or a new option, never a change to an old one's output);
// rings are simple polygons (never self-crossing) so every outline can be an area; open lines run
// west → east. Point counts are editor-sized by default (`samples` for more).
//
import { outlinePoints, OUTLINES } from './shapeOutlines';
import { curvePoints, CURVES } from './shapeCurves';
import type { CurveShapeSpec, OutlineSpec, ShapeKind, ShapeResult, ShapeSpec } from './shapeTypes';

export * from './shapeTypes';
export * from './shapeWaves';
export { movePts, scalePts, turnY, mirrorX, liftPts, roundPts } from './shapeMath';

/** Every outline kind (closed rings; areas, loop paths, mesh outlines). */
export const OUTLINE_KINDS = Object.keys(OUTLINES) as OutlineSpec['kind'][];
/** Every line / 3D curve kind (open lines, climbing rings; paths). */
export const CURVE_KINDS = Object.keys(CURVES) as CurveShapeSpec['kind'][];
/** Every shape kind the API draws. */
export const SHAPE_KINDS: ShapeKind[] = [...OUTLINE_KINDS, ...CURVE_KINDS];

export const isOutlineSpec = (spec: ShapeSpec): spec is OutlineSpec => (OUTLINE_KINDS as string[]).includes(spec.kind);

/** The points a shape spec describes. Throws on an unknown kind or a size that is not a positive number. */
export function shapePoints(spec: ShapeSpec): ShapeResult {
    if (!spec || typeof spec !== 'object' || !(SHAPE_KINDS as string[]).includes(spec.kind)) throw new Error(`shapePoints: unknown shape kind ${JSON.stringify((spec as { kind?: unknown })?.kind)} — one of ${SHAPE_KINDS.join(', ')}.`);
    if (!(typeof spec.size === 'number' && Number.isFinite(spec.size) && spec.size > 0)) throw new Error(`shapePoints: ${spec.kind} needs a positive size (metres).`);
    return isOutlineSpec(spec) ? outlinePoints(spec) : curvePoints(spec);
}

/** The ring of an outline (a shortcut for presets: the points only). */
export const outline = (spec: OutlineSpec): ShapeResult['points'] => outlinePoints(spec).points;
