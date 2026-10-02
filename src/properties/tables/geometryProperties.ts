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

export type ControlOf<K extends string> =
  | { type: 'range'; key: K; label: string; min: number; max: number; step: number; default: number; digits?: number; unit?: string; format?: (v: number) => string }
  | { type: 'toggle'; key: K; label: string; default: boolean }
  | { type: 'text'; key: K; label: string; default: string };

const int = <K extends string>(key: K, label: string, min: number, max: number, def: number): ControlOf<K> =>
  ({ type: 'range', key, label, min, max, step: 1, default: def });
const num = <K extends string>(key: K, label: string, min: number, max: number, step: number, def: number): ControlOf<K> =>
  ({ type: 'range', key, label, min, max, step, default: def, digits: 2 });
const ang = <K extends string>(key: K, label: string, def: number): ControlOf<K> =>
  ({ type: 'range', key, label, min: 0, max: Math.PI * 2, step: 0.05, default: def, digits: 2, unit: 'rad' });
const str = <K extends string>(key: K, label: string, def: string): ControlOf<K> => ({ type: 'text', key, label, default: def });

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
  text: [str('text', 'Text', 'Hello'), num('size', 'Size', 0.2, 3, 0.01, 1), num('height', 'Depth', 0.05, 1, 0.01, 0.2)],
  point: [num('size', 'Size', 0.02, 0.5, 0.01, 0.1)],
  custom: [],
};

export const ALL_SHAPES = Object.keys(SHAPE_CONTROLS) as ShapeName[];

export function defaultShapeOptions(type: ShapeName = 'heart'): GeometryShapeConfig {
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
