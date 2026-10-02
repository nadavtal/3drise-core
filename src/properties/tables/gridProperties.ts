// Property table (moved from the client). The registry (../registry.ts) is built on these tables.
import type { OptionalProperty } from './optionalProperties';

// =============================================================================
// GRID OPTIONAL PROPERTIES
// The configurable inputs of each shader-plane grid (createdObject type 'grid'),
// keyed by config.type. Every grid shares the surface vocabulary below; each adds
// its own knobs. Rendered by ConfigControllerUi, so a grid slider looks and behaves
// like every other slider in the app.
//
// Each entry must be a real config key of that grid (viewer types/gridConfigs.ts).
// =============================================================================

const LINE_MODES = ['0', '1', '2', '3', '4'];
const LINE_MODE_LABELS = ['Static', 'Ripple', 'Flow', 'Scan', 'Pulse'];
const CELL_MODES = ['0', '1', '2', '3', '4'];
const CELL_MODE_LABELS = ['Off', 'Wave', 'Twinkle', 'Ripple', 'Alternate'];

/** Knobs every shader-plane grid shares. */
export const GRID_SURFACE_PROPERTIES: OptionalProperty[] = [
  { name: 'cellSize',      description: 'Size of one tile, in world units',                          type: 'number', min: 0.1, max: 40,  step: 0.1 },
  { name: 'lineWidth',     description: 'Line thickness, in pixels',                                 type: 'number', min: 0,   max: 6,   step: 0.05 },
  { name: 'sectionSize',   description: 'How many tiles make one accent group',                      type: 'number', min: 0,   max: 20,  step: 1 },
  { name: 'sectionWidth',  description: 'Accent line thickness, in pixels; 0 hides the accents',     type: 'number', min: 0,   max: 6,   step: 0.05 },
  { name: 'lineMode',      description: 'How the lines animate',                                     type: 'select', options: LINE_MODES, optionLabels: LINE_MODE_LABELS },
  { name: 'cellMode',      description: 'How the cells light up',                                    type: 'select', options: CELL_MODES, optionLabels: CELL_MODE_LABELS },
  { name: 'animSpeed',     description: 'Animation speed',                                           type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'animScale',     description: 'Spatial scale of the animation',                            type: 'number', min: 0,   max: 3,   step: 0.05 },
  { name: 'animIntensity', description: 'Strength of the animation',                                 type: 'number', min: 0,   max: 3,   step: 0.05 },
  { name: 'fadeDistance',  description: 'Radius at which the grid fades out',                        type: 'number', min: 1,   max: 200, step: 0.5 },
  { name: 'fadeStrength',  description: 'How hard the edge fades',                                   type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'displace',      description: 'Lift the surface along its normal (subdivides the plane)',  type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'size',          description: 'Size of the plane, per side',                               type: 'number', min: 5,   max: 400, step: 1 },
  { name: 'lineColor',     description: 'Line colour',                                               type: 'color' },
  { name: 'sectionColor',  description: 'Accent colour',                                             type: 'color' },
  { name: 'cellColor',     description: 'Cell fill colour',                                          type: 'color' },
  { name: 'glowColor',     description: 'Glow colour of the animated highlights',                    type: 'color' },
  { name: 'bgColor',       description: 'Background colour',                                         type: 'color' },
  { name: 'bgOpacity',     description: 'Background opacity; 0 leaves only the lines',               type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'flat',          description: 'Lie flat (on) or stand upright (off)',                      type: 'boolean' },
  { name: 'followMouse',   description: 'Ripples and focus follow the pointer',                      type: 'boolean' },
  { name: 'reveal',        description: 'How much of the grid is built (0 gone, 1 complete)',        type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'revealDuration',description: 'Seconds to build or dissolve; 0 applies instantly',         type: 'number', min: 0,   max: 10,  step: 0.1 },
];

const own: Record<string, OptionalProperty[]> = {
  advancedGrid: [],
  quasiGrid: [
    { name: 'symmetry', description: 'Line families, 3..9. 5 is Penrose; 4 and 6 come out periodic', type: 'number', min: 3, max: 9, step: 1 },
    { name: 'phase',    description: 'Slides the pattern through itself',                         type: 'number', min: 0, max: 1, step: 0.01 },
  ],
  hexGrid: [
    { name: 'plateau',  description: 'With displacement, each hex lifts as a flat plate',          type: 'boolean' },
  ],
  circuitGrid: [
    { name: 'powered',    description: 'Fraction of tiles carrying a powered trace',               type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'chipChance', description: 'Fraction of tiles replaced by a chip; 0 disables chips',   type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'padSize',    description: 'Solder-pad size; 0 disables pads',                         type: 'number', min: 0, max: 2, step: 0.01 },
  ],
  voronoiGrid: [
    { name: 'jitter', description: '0 regular lattice, 1 fully scattered seeds',                   type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'drift',  description: 'How far the seeds wander; 0 freezes the cells',                type: 'number', min: 0, max: 2, step: 0.01 },
  ],
  radarGrid: [
    { name: 'spokes',      description: 'Radial spokes; 0 disables them',                          type: 'number', min: 0, max: 72, step: 1 },
    { name: 'sweepWidth',  description: 'Length of the sweep trail, as a fraction of a turn',      type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'blipDensity', description: 'Chance a sector holds a blip',                            type: 'number', min: 0, max: 1, step: 0.01 },
  ],
  moireGrid: [
    { name: 'shape',      description: 'Lattice shape of both layers',                             type: 'select', options: ['square', 'hex', 'rings'], optionLabels: ['Square', 'Hex', 'Rings'] },
    { name: 'layerAngle', description: 'Angle between the layers, in radians; small values beat slowly', type: 'number', min: 0, max: 0.5, step: 0.001 },
    { name: 'layerScale', description: 'Spacing ratio of the second layer; near 1 gives long beats', type: 'number', min: 0.8, max: 1.25, step: 0.001 },
    { name: 'spin',       description: 'Counter-rotation speed; 0 freezes the pattern',            type: 'number', min: -5, max: 5, step: 0.05 },
  ],
  fractalGrid: [
    { name: 'depth',       description: 'Maximum subdivision levels',                              type: 'number', min: 1, max: 6, step: 1 },
    { name: 'splitRadius', description: 'Radius around the focus inside which cells subdivide',    type: 'number', min: 0, max: 10, step: 0.05 },
    { name: 'splitJitter', description: 'Wobble of the split edge',                                type: 'number', min: 0, max: 1, step: 0.01 },
  ],
  contourGrid: [
    { name: 'levels',    description: 'Contour steps across the height range',                     type: 'number', min: 2, max: 64, step: 1 },
    { name: 'roughness', description: 'Terrain roughness: 0.35 rolling, 0.65 craggy',             type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'warp',      description: 'Bends the contours into ridges and valleys',                type: 'number', min: 0, max: 2, step: 0.01 },
  ],
  flowNetGrid: [
    { name: 'obstacleRadius', description: 'Cylinder radius, in cells',                            type: 'number', min: 0, max: 10, step: 0.05 },
    { name: 'circulation',    description: 'Circulation around the cylinder (lift)',               type: 'number', min: -6, max: 6, step: 1 },
    { name: 'flowAngle',      description: 'Free-stream direction, in radians',                    type: 'number', min: -3.1416, max: 3.1416, step: 0.01 },
  ],
  chladniGrid: [
    { name: 'modeN', description: 'First mode number of the standing wave',                        type: 'number', min: 1, max: 12, step: 1 },
    { name: 'modeM', description: 'Second mode number of the standing wave',                       type: 'number', min: 1, max: 12, step: 1 },
    { name: 'morph', description: 'Drift to the neighbouring resonance; 0 holds the pattern',      type: 'number', min: 0, max: 2, step: 0.01 },
    { name: 'grain', description: 'Amount of sand on the plate',                                   type: 'number', min: 0, max: 1, step: 0.01 },
  ],
  hyperbolicGrid: [
    { name: 'sides',   description: 'Sides of each polygon (p)',                                   type: 'number', min: 3, max: 12, step: 1 },
    { name: 'valence', description: 'Polygons around each vertex (q)',                             type: 'number', min: 3, max: 12, step: 1 },
    { name: 'drift',   description: 'How far the tiling glides through itself',                    type: 'number', min: 0, max: 1, step: 0.01 },
  ],
  gravWaveGrid: [
    { name: 'strain',    description: 'Wave amplitude; 0 leaves only the static wells',            type: 'number', min: 0, max: 3, step: 0.01 },
    { name: 'chirpTime', description: 'Seconds per inspiral-merger-ringdown cycle',                type: 'number', min: 4, max: 60, step: 0.5 },
    { name: 'waveSpeed', description: 'Wave speed, in cells per second',                           type: 'number', min: 0.5, max: 20, step: 0.1 },
    { name: 'massRatio', description: 'Mass ratio m2/m1',                                          type: 'number', min: 0.1, max: 1, step: 0.01 },
  ],
  girihGrid: [
    { name: 'tiling',       description: 'Base tiling',                                            type: 'select', options: ['0', '1', '2'], optionLabels: ['4.8.8', 'Hexagons', '3.6.3.6'] },
    { name: 'contactAngle', description: 'Hankin contact angle, degrees; 67.5 is the classic 8-point star', type: 'number', min: 20, max: 85, step: 0.5 },
    { name: 'strapWidth',   description: 'Width of the strapwork band, in cells',                  type: 'number', min: 0, max: 0.3, step: 0.005 },
    { name: 'angleDrift',   description: 'Degrees the contact angle drifts, morphing the pattern',  type: 'number', min: 0, max: 30, step: 0.5 },
  ],
  wallpaperGrid: [
    { name: 'group',     description: 'Wallpaper group (-1 cycles through all 17)',                type: 'number', min: -1, max: 16, step: 1 },
    { name: 'cycleTime', description: 'Seconds per group while cycling',                           type: 'number', min: 1, max: 60, step: 0.5 },
    { name: 'motif',     description: 'Motif complexity',                                          type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'levels',    description: 'Number of contour levels',                                  type: 'number', min: 2, max: 32, step: 1 },
  ],
  reactionDiffusionGrid: [
    { name: 'feed',      description: 'Gray-Scott feed rate F',                                    type: 'number', min: 0.01, max: 0.08, step: 0.0005 },
    { name: 'kill',      description: 'Gray-Scott kill rate k',                                    type: 'number', min: 0.04, max: 0.075, step: 0.0005 },
    { name: 'variation', description: 'Spread of F and k across the tile, so morphologies coexist', type: 'number', min: 0, max: 1, step: 0.01 },
    { name: 'tileCells', description: 'Cells covered by one simulation tile',                      type: 'number', min: 1, max: 20, step: 1 },
  ],
};

/**
 * Grids that always lie flat (the parent object's transform orients them) and
 * leave pointer behaviour to the Pointer tab: their surface rows have no `flat`
 * and no `followMouse`. `section` re-describes `sectionSize` where the grid
 * gives it its own meaning (spiral count, bloom rings, inversion levels).
 */
const SURFACE_PARENT_ORIENTED = GRID_SURFACE_PROPERTIES.filter((p) => p.name !== 'flat' && p.name !== 'followMouse');
const surfaceFor = (section?: Partial<OptionalProperty>): OptionalProperty[] =>
  section ? SURFACE_PARENT_ORIENTED.map((p) => (p.name === 'sectionSize' ? { ...p, ...section } : p)) : SURFACE_PARENT_ORIENTED;

const parentOriented: Record<string, { own: OptionalProperty[]; section?: Partial<OptionalProperty> }> = {
  lensingGrid: {
    own: [
      { name: 'mass', description: "Einstein radius of the lens, in cells; 0 leaves the lattice undistorted", type: 'number', min: 0, max: 12, step: 0.1 },
      { name: 'orbit', description: "Radius the lens circles the centre on, in cells; 0 holds it at the centre", type: 'number', min: 0, max: 15, step: 0.1 },
      { name: 'ringGlow', description: "Brightness of the Einstein ring and its halo", type: 'number', min: 0, max: 3, step: 0.05 },
    ],
  },
  conformalGrid: {
    own: [
      { name: 'flowMap', description: "The flow: 0 source + sink, 1 spiral vortex, 2 spinning cylinder, 3 corner", type: 'select', options: ['0','1','2','3'], optionLabels: ['Source + sink','Spiral vortex','Spinning cylinder','Corner'] },
      { name: 'poleSpread', description: "Distance from the centre to the poles, or the cylinder radius, in world units", type: 'number', min: 1, max: 25, step: 0.1 },
      { name: 'spokes', description: "Lattice lines per turn round a pole (whole number, so the log seam closes)", type: 'number', min: 4, max: 64, step: 1 },
      { name: 'arms', description: "Spiral arms of the vortex flow; 0 gives a plain polar web", type: 'number', min: -8, max: 8, step: 1 },
      { name: 'circulation', description: "Circulation round the cylinder (lift); at ±2 both stagnation points meet", type: 'number', min: -3, max: 3, step: 0.01 },
      { name: 'drift', description: "How fast the lattice streams along the flow; negative reverses it", type: 'number', min: -1, max: 1, step: 0.01 },
      { name: 'fill', description: "Strength of the speed-coloured stream-tube fill", type: 'number', min: 0, max: 1, step: 0.01 },
      { name: 'dye', description: "Brightness of the dashes carried along the streamlines", type: 'number', min: 0, max: 2, step: 0.01 },
    ],
    section: { description: "Streamlines per accent streamline" },
  },
  truchetGrid: {
    own: [
      { name: 'flip', description: "Chance a tile re-deals its orientation each epoch; 0 freezes the paths", type: 'number', min: 0, max: 1, step: 0.01 },
      { name: 'bias', description: "Balance of the two tile orientations: 0.5 is a maze, the ends are stripes", type: 'number', min: 0, max: 1, step: 0.01 },
      { name: 'pulse', description: "Brightness of the comets travelling the loops", type: 'number', min: 0, max: 2, step: 0.01 },
      { name: 'regionFill', description: "Fill of one colour of the two-colouring", type: 'number', min: 0, max: 1, step: 0.01 },
    ],
    section: { description: "Tiles per tile of the coarser Truchet accent layer" },
  },
  phyllotaxisGrid: {
    own: [
      { name: 'divergence', description: "Angle between successive seeds, degrees; 137.508 is the golden angle", type: 'number', min: 130, max: 145, step: 0.001 },
      { name: 'bloomRate', description: "Speed of the bloom rings travelling rim to centre; negative reverses them", type: 'number', min: -0.3, max: 0.3, step: 0.001 },
      { name: 'relief', description: "Depth of the lit dome on each floret", type: 'number', min: 0, max: 1, step: 0.01 },
      { name: 'shape', description: "The mark each floret carries (0 draws only the domes)", type: 'select', options: ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21'], optionLabels: ['Domes only','Seed','Ring','Crescent','Sparkle','Reuleaux','Spiral','Target','Pebble','Dot','Dots (sunflower)','Square','Star','Hexagon','Triangle','Cross','Heart','Chevron','Infinity','Gear','Atom','Sunburst'] },
      { name: 'shapeSize', description: "Size of the mark relative to its floret", type: 'number', min: 0.3, max: 1.2, step: 0.01 },
      { name: 'shapeGlow', description: "Brightness of the marks", type: 'number', min: 0, max: 2, step: 0.01 },
    ],
    section: { description: "Bloom rings across the head at once", min: 1, max: 6, step: 1 },
  },
  parastichyGrid: {
    own: [
      { name: 'divergence', description: "Angle between successive seeds, degrees; 137.508 is the golden angle", type: 'number', min: 135, max: 140, step: 0.001 },
      { name: 'third', description: "Weight of the third spiral family that splits cells into triangles", type: 'number', min: 0, max: 1, step: 0.01 },
      { name: 'sap', description: "Brightness of the light running inward along the spirals", type: 'number', min: 0, max: 2, step: 0.01 },
      { name: 'fill', description: "Strength of the faceted cell fill", type: 'number', min: 0, max: 1, step: 0.01 },
    ],
    section: { description: "Spirals in the main family (a Fibonacci number: 13, 21, 34, 55)", min: 3, max: 55, step: 1 },
  },
  apollonianGrid: {
    own: [
      { name: 'depth', description: "Inversion levels: how deep the packing nests", type: 'number', min: 1, max: 24, step: 1 },
      { name: 'morph', description: "Strength of the Möbius flow that re-balances the packing; 0 holds it symmetric", type: 'number', min: 0, max: 0.9, step: 0.01 },
    ],
    section: { description: "Circles shallower than this many levels get the accent rim", min: 0, max: 12, step: 1 },
  },
  hilbertGrid: {
    own: [
      { name: 'order', description: "Curve order: the loop covers 2^order cells per side", type: 'number', min: 2, max: 8, step: 1 },
      { name: 'signals', description: "Signals circulating round the loop", type: 'number', min: 1, max: 32, step: 1 },
      { name: 'trail', description: "Length of each signal trail, in cells", type: 'number', min: 1, max: 128, step: 0.5 },
      { name: 'signalSpeed', description: "Signal speed, in cells per second", type: 'number', min: 0, max: 40, step: 0.1 },
    ],
    section: { description: "Cells per cell of the coarser accent curve (a power of two)", min: 0, max: 32, step: 1 },
  },
};

/** Every shader-plane grid's inputs: its own knobs first, then the shared surface. */
export const GRID_PROPERTIES: Record<string, OptionalProperty[]> = Object.fromEntries(
  Object.entries(own).map(([type, props]) => [type, [...props, ...GRID_SURFACE_PROPERTIES]]),
);
for (const [type, { own: props, section }] of Object.entries(parentOriented)) {
  GRID_PROPERTIES[type] = [...props, ...surfaceFor(section)];
}
