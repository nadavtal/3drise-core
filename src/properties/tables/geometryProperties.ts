// =============================================================================
// Geometry shape + display mode controls (moved from client GeometryShapeController.shared)
// =============================================================================
//
// The knobs of a created shape (createdObject type 'mesh': `config.*`, keyed by
// config.type) and of its display mode (`modeConfig.*`, keyed by modeConfig.mode).
// All structural: changing one rebuilds the geometry / the point set, so the
// property registry lists them as set-only.
//
import type { ShapeName, GeometryShapeConfig, DisplayMode, ModeConfig, ModeGroup } from '../../types/scene3d';
import { TEXT_FONTS } from '../../data/textDefaults';
import type { OptionalProperty } from './optionalProperties';
import { PARAMETRIC_SHAPE_DEFAULTS, isParametricShape, type ParametricShapeName } from '../../geometry/parametricGeometry';
import { DEFAULT_SCRIPT_CONFIG, isScriptShape } from '../../geometry/scriptGeometry';

export type ControlOf<K extends string> =
  | { type: 'range'; key: K; label: string; min: number; max: number; step: number; default: number; digits?: number; unit?: string; format?: (v: number) => string }
  | { type: 'toggle'; key: K; label: string; default: boolean }
  | { type: 'text'; key: K; label: string; default: string }
  | { type: 'select'; key: K; label: string; options: string[]; optionLabels?: string[]; default: string };

const int = <K extends string>(key: K, label: string, min: number, max: number, def: number): ControlOf<K> =>
  ({ type: 'range', key, label, min, max, step: 1, default: def });
const num = <K extends string>(key: K, label: string, min: number, max: number, step: number, def: number): ControlOf<K> =>
  ({ type: 'range', key, label, min, max, step, default: def, digits: 2 });
const ang = <K extends string>(key: K, label: string, def: number): ControlOf<K> =>
  ({ type: 'range', key, label, min: 0, max: Math.PI * 2, step: 0.05, default: def, digits: 2, unit: 'rad' });
const str = <K extends string>(key: K, label: string, def: string): ControlOf<K> => ({ type: 'text', key, label, default: def });
const sel = <K extends string>(key: K, label: string, options: string[], optionLabels: string[], def: string): ControlOf<K> => ({ type: 'select', key, label, options, optionLabels, default: def });
const tog = <K extends string>(key: K, label: string, def: boolean): ControlOf<K> => ({ type: 'toggle', key, label, default: def });

type OptKey = keyof GeometryShapeConfig & string;
const CURVE = int<OptKey>('curveSegments', 'Curve detail', 6, 160, 64);

export const SHAPE_CONTROLS: Record<ShapeName, ControlOf<OptKey>[]> = {
  heart: [CURVE],
  star: [int('points', 'Points', 2, 12, 5), num('outer', 'Outer radius', 0.1, 0.6, 0.01, 0.5), num('inner', 'Inner radius', 0.05, 0.5, 0.01, 0.2), CURVE],
  polygon: [int('sides', 'Sides', 3, 12, 6), CURVE],
  gear: [int('teeth', 'Teeth', 4, 32, 12), num('outer', 'Outer', 0.2, 0.6, 0.01, 0.5), num('inner', 'Root', 0.15, 0.55, 0.01, 0.38), num('hole', 'Bore', 0.05, 0.35, 0.01, 0.16), CURVE],
  flower: [int('petals', 'Petals', 3, 16, 6), num('outer', 'Outer', 0.2, 0.6, 0.01, 0.5), num('inner', 'Inner', 0.05, 0.5, 0.01, 0.26), num('sharp', 'Sharpness', 0.2, 3, 0.05, 0.7), CURVE],
  spade: [CURVE],
  club: [CURVE],
  diamond: [CURVE],
  droplet: [num('width', 'Width', 0.2, 0.8, 0.01, 0.5), num('taper', 'Taper', 0.4, 1.8, 0.01, 1), CURVE],
  lightning: [num('width', 'Width', 0.3, 1, 0.01, 0.6), num('height', 'Height', 0.5, 1.4, 0.01, 1), CURVE],
  sparkle: [int('points', 'Points', 3, 12, 4), num('outer', 'Outer', 0.2, 0.6, 0.01, 0.5), num('inner', 'Pinch', 0.02, 0.4, 0.01, 0.14), CURVE],
  shield: [num('width', 'Width', 0.4, 1.2, 0.01, 0.8), CURVE],
  pawPrint: [CURVE],
  superformula: [
    int('symmetry', 'Symmetry', 1, 20, 6), num('roundness', 'Roundness', 0.1, 2, 0.05, 0.3),
    num('twist1', 'Twist 1', 0.1, 4, 0.05, 0.3), num('twist2', 'Twist 2', 0.1, 4, 0.05, 0.3),
    num('stretchX', 'Stretch X', 0.3, 2, 0.05, 1), num('stretchY', 'Stretch Y', 0.3, 2, 0.05, 1),
    int('samples', 'Resolution', 32, 512, 256), CURVE,
  ],
  infinity: [num('waist', 'Waist', 0.04, 0.3, 0.01, 0.14), num('thickness', 'Ribbon', 0.05, 0.25, 0.01, 0.12), int('samples', 'Resolution', 64, 512, 220), CURVE],
  box: [int('subdivisions', 'Subdivisions', 1, 24, 1)],
  sphere: [num('radius', 'Radius', 0.1, 2, 0.01, 0.5), int('segments', 'Segments', 3, 64, 32), int('rings', 'Rings', 2, 64, 32)],
  cylinder: [num('radiusTop', 'Top radius', 0, 2, 0.01, 0.5), num('radiusBottom', 'Bottom radius', 0, 2, 0.01, 0.5), num('height', 'Height', 0.1, 3, 0.01, 1), int('radialSegments', 'Radial segments', 3, 64, 32)],
  cone: [num('radius', 'Radius', 0.1, 2, 0.01, 0.5), num('height', 'Height', 0.1, 3, 0.01, 1), int('radialSegments', 'Radial segments', 3, 64, 32)],
  torus: [num('radius', 'Radius', 0.1, 2, 0.01, 0.5), num('tube', 'Tube', 0.02, 0.6, 0.01, 0.2), int('radialSegments', 'Radial segments', 3, 64, 16), int('tubularSegments', 'Tubular segments', 3, 200, 100)],
  capsule: [num('radius', 'Radius', 0.05, 1.5, 0.01, 0.3), num('length', 'Length', 0.1, 3, 0.01, 1), int('capSegments', 'Cap segments', 1, 16, 4), int('radialSegments', 'Radial segments', 3, 64, 8)],
  icosahedron: [num('radius', 'Radius', 0.1, 2, 0.01, 0.5), int('detail', 'Detail', 0, 5, 0)],
  octahedron: [num('radius', 'Radius', 0.1, 2, 0.01, 0.5), int('detail', 'Detail', 0, 5, 0)],
  tetrahedron: [num('radius', 'Radius', 0.1, 2, 0.01, 0.5), int('detail', 'Detail', 0, 5, 0)],
  dodecahedron: [num('radius', 'Radius', 0.1, 2, 0.01, 0.5), int('detail', 'Detail', 0, 5, 0)],
  plane: [num('width', 'Width', 0.2, 3, 0.01, 1), num('height', 'Height', 0.2, 3, 0.01, 1), int('widthSegments', 'Width segments', 1, 64, 1), int('heightSegments', 'Height segments', 1, 64, 1)],
  ring: [num('innerRadius', 'Inner radius', 0.05, 1.5, 0.01, 0.3), num('outerRadius', 'Outer radius', 0.1, 2, 0.01, 0.8), int('thetaSegments', 'Theta segments', 3, 64, 32), int('phiSegments', 'Phi segments', 1, 32, 8)],
  arcPlane: [num('radius', 'Radius', 0.2, 3, 0.01, 1), num('width', 'Band width', 0.02, 1, 0.01, 0.2), ang('startAngle', 'Start angle', 0), ang('endAngle', 'End angle', Math.PI), int('segments', 'Segments', 3, 128, 32)],
  bentPlane: [num('radius', 'Radius', 0.2, 5, 0.01, 2), num('height', 'Height', 0.1, 3, 0.01, 1), ang('arc', 'Arc', Math.PI / 2), int('widthSegments', 'Width segments', 1, 64, 32), int('heightSegments', 'Height segments', 1, 64, 1)],
  bentPlaneInverse: [num('radius', 'Radius', 0.2, 5, 0.01, 2), num('height', 'Height', 0.1, 3, 0.01, 1), ang('arc', 'Arc', Math.PI / 2), int('widthSegments', 'Width segments', 1, 64, 32), int('heightSegments', 'Height segments', 1, 64, 1)],
  // the string extruded into a solid from the packed outline fonts (the text looks' font list)
  text: [
    str('text', 'Text', 'Hello'), sel('font', 'Font', TEXT_FONTS.map((f) => f.id), TEXT_FONTS.map((f) => f.label), 'inter'),
    num('size', 'Size', 0.2, 3, 0.01, 1), num('height', 'Depth', 0.02, 1, 0.01, 0.2), num('letterSpacing', 'Letter spacing', -0.1, 0.5, 0.005, 0),
    tog('bevelEnabled', 'Bevel', true), num('bevelThickness', 'Bevel depth', 0, 0.1, 0.002, 0.02), num('bevelSize', 'Bevel size', 0, 0.1, 0.002, 0.015), int('bevelSegments', 'Bevel segments', 1, 8, 3),
  ],
  point: [num('size', 'Size', 0.02, 0.5, 0.01, 0.1)],
  custom: [],
  torusKnot: [num('radius', 'Radius', 0.1, 5, 0.01, 1), num('tube', 'Tube', 0.02, 2, 0.01, 0.3), int('p', 'Winds (p)', 1, 12, 2), int('q', 'Turns (q)', 1, 12, 3), int('radialSegments', 'Radial segments', 3, 32, 12), int('tubularSegments', 'Tubular segments', 16, 400, 128)],
  // the parametric recipes keep their knobs as property rows (PARAMETRIC_SHAPE_PROPERTIES); scripts carry their own schema
  outline: [], extrude: [], lathe: [], sweep: [], svg: [], superellipsoid: [], script: [],
};

// ---------------------------------------------------------------------------- parametric recipes
// The knobs of the six recipe variants (core geometry/parametricGeometry.ts), as property rows: the registry turns
// them into config.* specs (structural) and the Shape tab renders them (tabs shape / form / detail). Ranges are
// metres and degrees; the builder's validator (validateParametricShape) says what is wrong with a point list.
const n = (name: string, label: string, description: string, min: number, max: number, step: number, tab: string, unit?: string): OptionalProperty =>
  ({ name, label, description, type: 'number', min, max, step, tab, animatable: false, ...(unit ? { unit } : {}) });
const CURVE_ROW = n('curve', 'Rounding', 'How much the point list is rounded: 0 keeps straight segments, 1 is a smooth spline through the points.', 0, 1, 0.01, 'shape');
const BEVEL_ROWS = [n('bevelSize', 'Bevel', 'Bevel size on the edges (m). 0 = sharp.', 0, 0.5, 0.005, 'form', 'm'), n('bevelSegments', 'Bevel segments', 'Bevel roundness.', 1, 6, 1, 'detail')];
const CREASE_ROW = n('crease', 'Crease angle', 'Faces meeting below this angle are smoothed, above it stay sharp.', 0, 90, 1, 'detail', '°');
const SEGMENTS_ROW = (min: number, max: number, def: string) => n('segments', 'Segments', def, min, max, 1, 'detail');
const ORIENTATION_ROW: OptionalProperty = { name: 'orientation', label: 'Orientation', description: 'flat: the outline lies on the ground and rises along Y. upright: the points are [x, y] in a standing plane, the thickness along Z.', type: 'select', options: ['flat', 'upright'], optionLabels: ['Flat (ground)', 'Upright'], tab: 'form', animatable: false };

export const PARAMETRIC_SHAPE_PROPERTIES: Record<ParametricShapeName, OptionalProperty[]> = {
  outline: [
    { name: 'points', label: 'Outline', description: 'The outline as [x, z] metres, counter-clockwise, 3–200 points, no self-intersections.', type: 'points', tab: 'shape', animatable: false },
    CURVE_ROW,
    n('thickness', 'Thickness', 'Slab thickness (m). 0 = a single flat face.', 0, 5, 0.01, 'form', 'm'),
    ...BEVEL_ROWS, SEGMENTS_ROW(2, 32, 'Spline samples per point when rounded.'), CREASE_ROW,
  ],
  extrude: [
    { name: 'points', label: 'Outline', description: 'The outline as [x, z] metres ([x, y] when upright), counter-clockwise, 3–200 points, no self-intersections.', type: 'points', tab: 'shape', animatable: false },
    { name: 'holes', label: 'Holes', description: 'Hole outlines inside the outline, each 3 or more points.', type: 'points', list: true, tab: 'shape', animatable: false },
    CURVE_ROW,
    n('height', 'Height', 'Extrusion height (m).', 0.01, 100, 0.01, 'form', 'm'),
    n('twist', 'Twist', 'Total twist over the height (flat orientation).', -360, 360, 1, 'form', '°'),
    n('taper', 'Taper', 'Scale at the top relative to the bottom (1 = straight sides).', 0.1, 3, 0.01, 'form'),
    ORIENTATION_ROW,
    ...BEVEL_ROWS, SEGMENTS_ROW(2, 32, 'Spline samples per point when rounded; height steps when twisted or tapered.'), CREASE_ROW,
  ],
  lathe: [
    { name: 'profile', label: 'Profile', description: 'The profile as [radius, y] metres from the bottom up; radius ≥ 0 (never crosses the axis).', type: 'points', tab: 'shape', animatable: false },
    CURVE_ROW,
    n('angle', 'Angle', 'Swept angle; less than 360 cuts a slice closed by two flat walls.', 1, 360, 1, 'form', '°'),
    { name: 'cap', label: 'Caps', description: 'Close the open ends (where the profile does not reach the axis).', type: 'boolean', tab: 'form', animatable: false },
    SEGMENTS_ROW(3, 128, 'Radial segments.'), CREASE_ROW,
  ],
  sweep: [
    { name: 'path', label: 'Path', description: 'The path as [x, y, z] metres, 2 or more points. The pipe is where the path is (no base shift).', type: 'points', dims: 3, tab: 'shape', animatable: false },
    { name: 'profile', label: 'Profile', description: 'Cross-section as [u, v] metres around the path (v up on a level path). Empty = a circle of Radius.', type: 'points', tab: 'shape', animatable: false },
    n('radius', 'Radius', 'Tube radius (m) when no profile is given.', 0.005, 10, 0.005, 'form', 'm'),
    CURVE_ROW,
    n('scaleEnd', 'End scale', 'Cross-section scale at the end of the path (1 = constant).', 0, 5, 0.01, 'form'),
    { name: 'cap', label: 'Caps', description: 'Close both ends of an open sweep.', type: 'boolean', tab: 'form', animatable: false },
    { name: 'closed', label: 'Closed loop', description: 'Join the end of the path back to its start.', type: 'boolean', tab: 'form', animatable: false },
    SEGMENTS_ROW(3, 64, 'Radial segments of the circle profile and spline samples per path point.'), CREASE_ROW,
  ],
  svg: [
    { name: 'svg', label: 'SVG path', description: 'An SVG path `d` string, or whole SVG markup. Holes follow the fill rule (even-odd for a bare path).', type: 'string', multiline: true, tab: 'shape', animatable: false },
    { name: 'svgUrl', label: 'SVG file', description: 'An uploaded .svg; when set it replaces the pasted path.', type: 'string', tab: 'shape', animatable: false },
    n('width', 'Width', 'The drawing is fitted to this width (m); the height follows.', 0.05, 100, 0.01, 'form', 'm'),
    n('height', 'Depth', 'Extrusion depth (m).', 0.005, 20, 0.005, 'form', 'm'),
    ORIENTATION_ROW,
    ...BEVEL_ROWS, SEGMENTS_ROW(2, 24, 'Samples per curve span.'), CREASE_ROW,
  ],
  superellipsoid: [
    n('width', 'Width', 'Full extent along X (m).', 0.05, 100, 0.01, 'form', 'm'),
    n('height', 'Height', 'Full extent along Y (m).', 0.05, 100, 0.01, 'form', 'm'),
    n('depth', 'Depth', 'Full extent along Z (m).', 0.05, 100, 0.01, 'form', 'm'),
    n('e1', 'Roundness N–S', 'North–south exponent: 1 = ellipsoid, → 0 = box, > 1 = pinched.', 0.05, 4, 0.01, 'shape'),
    n('e2', 'Roundness E–W', 'East–west exponent: 1 = ellipsoid, → 0 = box, > 1 = pinched.', 0.05, 4, 0.01, 'shape'),
    SEGMENTS_ROW(8, 96, 'Segments around; half as many up.'), CREASE_ROW,
  ],
};

export const ALL_SHAPES = Object.keys(SHAPE_CONTROLS) as ShapeName[];

export function defaultShapeOptions(type: ShapeName = 'heart'): GeometryShapeConfig {
  if (isParametricShape(type)) return { ...PARAMETRIC_SHAPE_DEFAULTS[type] } as unknown as GeometryShapeConfig;
  if (isScriptShape(type)) return { ...DEFAULT_SCRIPT_CONFIG, params: { ...DEFAULT_SCRIPT_CONFIG.params }, schema: { ...DEFAULT_SCRIPT_CONFIG.schema } } as unknown as GeometryShapeConfig;
  const opts: GeometryShapeConfig = { type };
  for (const c of SHAPE_CONTROLS[type]) (opts as unknown as Record<string, unknown>)[c.key] = c.default;
  return opts;
}

export function defaultShapeConfig(type: ShapeName = 'heart'): GeometryShapeConfig {
  return defaultShapeOptions(type);
}

export function defaultModeConfig(mode: DisplayMode = 'solid'): ModeConfig {
  return { mode, count: 1000, symmetry: 6, spacing: 1, slices: 24, linkRadius: 0.18, angle: 18, lineWidth: 2.5 };
}

type CfgKey = keyof ModeConfig & string;
const cnt: ControlOf<CfgKey> = { type: 'range', key: 'count', label: 'Count', min: 1000, max: 40000, step: 500, default: 1000, format: (v) => v.toLocaleString() };
const lw: ControlOf<CfgKey> = { type: 'range', key: 'lineWidth', label: 'Line weight', min: 0.5, max: 8, step: 0.1, default: 2.5, digits: 1 };

export const MODE_CONTROLS: Record<DisplayMode, ControlOf<CfgKey>[]> = {
  solid: [],
  volume: [cnt],
  surface: [cnt],
  symmetric: [cnt, int('symmetry', 'Symmetry', 2, 16, 6)],
  evenScatter: [cnt, num('spacing', 'Spacing', 0.5, 3, 0.05, 1)],
  vertices: [],
  edges3d: [int('angle', 'Edge angle', 0, 80, 18), lw],
  profile2d: [lw],
  wireframe: [lw],
  contourSlices: [int('slices', 'Slices', 4, 60, 24), lw],
  plexus: [cnt, num('linkRadius', 'Link radius', 0.05, 0.5, 0.01, 0.18), lw],
};

export const MODE_GROUPS: { label: ModeGroup; modes: DisplayMode[] }[] = [
  { label: 'mesh', modes: ['solid'] },
  { label: 'points', modes: ['volume', 'surface', 'symmetric', 'evenScatter', 'vertices'] },
  { label: 'lines', modes: ['edges3d', 'profile2d', 'wireframe', 'contourSlices', 'plexus'] },
];


export const MODE_LABEL: Record<DisplayMode, string> = {
  solid: 'Solid',
  volume: 'Volume',
  surface: 'Surface',
  symmetric: 'Symmetric',
  evenScatter: 'Even',
  vertices: 'Vertices',
  edges3d: 'Edges',
  profile2d: 'Profile',
  wireframe: 'Wireframe',
  contourSlices: 'Contours',
  plexus: 'Plexus',
};
