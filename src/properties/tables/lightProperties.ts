// Moved from client (client/app/utils/lightProperties.ts). Property tables — the registry (../registry) is built on these.
// =============================================================================
// lightProperties — the knobs LightControllerUi shows, per light type
// =============================================================================
//
// OptionalProperty arrays in the same shape as PARTICLES_PROPERTIES, so the
// light panel renders with BaseControllerUi's PropertiesTab / ColorsTab and
// looks like every other controller.
//
// `tab` groups a knob; only the bulb has more than one ('light' + 'bulb').
// LIGHT_DEFAULTS fills in a knob a saved config does not carry yet (every
// light saved before the bulb existed has no `temperature`, for one), so the
// control still shows instead of silently disappearing.
//
import { DEFAULT_LIGHTS } from '../../data/lightsDefaults';
import type { LightType } from '../../types/lights';
import type { OptionalProperty } from './optionalProperties';

export type LightTab = 'light' | 'bulb' | 'beam' | 'array' | 'tube' | 'flame' | 'candle';
export type LightProperty = OptionalProperty & { tab?: LightTab };

const enabled: LightProperty = { name: 'enabled', label: 'Enabled', type: 'boolean', description: 'Switch the light off without deleting it' };
const color: LightProperty = { name: 'color', type: 'color', description: 'Light colour' };
const intensity = (max: number): LightProperty => ({ name: 'intensity', type: 'number', min: 0, max, step: 0.01, description: 'Brightness of the light' });
const distance: LightProperty = { name: 'distance', type: 'number', min: 0, max: 100, step: 0.1, description: 'Range of the light. 0 = unlimited' };
const decay: LightProperty = { name: 'decay', type: 'number', min: 0, max: 2, step: 0.01, description: 'How fast the light dims with distance. 2 is physically correct' };

export const LIGHT_PROPERTIES: Record<LightType, LightProperty[]> = {
  ambient: [enabled, intensity(5), color],
  directional: [enabled, intensity(10), color],
  point: [enabled, intensity(20), distance, decay, color],
  spot: [
    enabled, intensity(20), distance, decay,
    { name: 'angle', type: 'number', min: 0.01, max: Math.PI / 2, step: 0.01, description: 'Cone half-angle, radians' },
    { name: 'penumbra', type: 'number', min: 0, max: 1, step: 0.01, description: 'Softness of the cone edge' },
    color,
  ],
  lightBulb: [
    // Light tab
    { ...enabled, tab: 'light' },
    { name: 'on', label: 'Power', type: 'boolean', tab: 'light', description: 'Switch the bulb on or off. Runs the warm-up / cool-down' },
    { name: 'colorMode', label: 'Colour', type: 'select', tab: 'light', options: ['temperature', 'color'], optionLabels: ['Temperature', 'Custom colour'], description: 'Drive the colour from a Kelvin temperature, or pick one' },
    { ...intensity(20), tab: 'light' },
    { name: 'temperature', label: 'Temperature (K)', type: 'number', min: 1000, max: 10000, step: 50, tab: 'light', description: '2700K warm incandescent, 4000K neutral, 6500K daylight' },
    { ...distance, tab: 'light' },
    { ...decay, tab: 'light' },
    { ...color, tab: 'light' },
    // Bulb tab
    { name: 'shape', type: 'select', tab: 'bulb', options: ['classic', 'globe', 'edison', 'tube'], optionLabels: ['Classic', 'Globe', 'Edison', 'Tube'], description: 'Glass silhouette and matching filament' },
    { name: 'glass', type: 'select', tab: 'bulb', options: ['clear', 'frosted', 'tinted'], optionLabels: ['Clear', 'Frosted', 'Tinted'], description: 'Glass finish' },
    { name: 'warmup', label: 'Warm-up (s)', type: 'number', min: 0, max: 3, step: 0.05, tab: 'bulb', description: 'Time for the filament to heat up. Cooling takes ~2.5x longer. 0 = instant' },
    { name: 'flicker', type: 'number', min: 0, max: 1, step: 0.01, tab: 'bulb', description: 'Random dips in brightness' },
    { name: 'halo', type: 'number', min: 0, max: 2, step: 0.01, tab: 'bulb', description: 'Strength of the glow around the bulb' },
    { name: 'glassTint', label: 'Glass tint', type: 'color', tab: 'bulb', description: 'Glass colour when the glass is Tinted' },
  ],
  spotBeam: [
    // Light tab
    { ...enabled, tab: 'light' },
    { name: 'on', label: 'Power', type: 'boolean', tab: 'light', description: 'Switch the lamp on or off. Runs the warm-up' },
    { name: 'colorMode', label: 'Colour', type: 'select', tab: 'light', options: ['temperature', 'color'], optionLabels: ['Temperature', 'Custom colour'], description: 'Drive the colour from a Kelvin temperature, or pick one' },
    { ...intensity(50), tab: 'light' },
    { name: 'temperature', label: 'Temperature (K)', type: 'number', min: 1000, max: 10000, step: 50, tab: 'light', description: '3200K tungsten stage lamp, 5600K daylight' },
    { name: 'angle', type: 'number', min: 0.01, max: Math.PI / 2, step: 0.01, tab: 'light', description: 'Cone half-angle, radians' },
    { name: 'penumbra', type: 'number', min: 0, max: 1, step: 0.01, tab: 'light', description: 'Softness of the cone edge' },
    { ...distance, tab: 'light' },
    { ...decay, tab: 'light' },
    { ...color, tab: 'light' },
    // Beam tab
    { name: 'pattern', label: 'Gobo', type: 'select', tab: 'beam', options: ['round', 'slot', 'bars', 'blinds', 'window', 'leaves'], optionLabels: ['Round', 'Slot', 'Bars', 'Blinds', 'Window', 'Leaves'], description: 'Shapes both the pool on the floor and the haze in the air' },
    { name: 'patternSoftness', label: 'Gobo softness', type: 'number', min: 0, max: 1, step: 0.01, tab: 'beam', description: 'Edge softness of the gobo' },
    { name: 'patternRotation', label: 'Gobo rotation', type: 'number', min: 0, max: Math.PI * 2, step: 0.01, tab: 'beam', description: 'Turns the gobo, radians' },
    { name: 'beamMode', label: 'Beam quality', type: 'select', tab: 'beam', options: ['none', 'soft', 'layered', 'volumetric'], optionLabels: ['None', 'Soft', 'Layered', 'Volumetric'], description: 'How the beam in the air is drawn. Volumetric carries the gobo through the haze and costs the most' },
    { name: 'beam', label: 'Beam', type: 'number', min: 0, max: 3, step: 0.01, tab: 'beam', description: 'Brightness of the beam in the air. 0 hides it' },
    { name: 'beamLength', label: 'Beam length', type: 'number', min: 0.05, max: 1, step: 0.01, tab: 'beam', description: 'How far down the throw the beam reaches' },
    { name: 'beamNoise', label: 'Haze', type: 'number', min: 0, max: 1, step: 0.01, tab: 'beam', description: 'Breakup in the beam, like smoke drifting through it' },
    { name: 'beamSteps', label: 'Beam steps', type: 'number', min: 8, max: 48, step: 1, tab: 'beam', description: 'Raymarch samples for the Volumetric beam. Higher is smoother and slower' },
    { name: 'emitter', label: 'Source', type: 'select', tab: 'beam', options: ['none', 'dot', 'lens'], optionLabels: ['Hidden', 'Dot', 'Lens'], description: 'The bit of visible geometry at the light itself' },
    { name: 'warmup', label: 'Warm-up (s)', type: 'number', min: 0, max: 3, step: 0.05, tab: 'beam', description: 'Time for the lamp to come up to full. 0 = instant' },
    { name: 'flicker', type: 'number', min: 0, max: 1, step: 0.01, tab: 'beam', description: 'Random dips in brightness' },
    { name: 'halo', type: 'number', min: 0, max: 2, step: 0.01, tab: 'beam', description: 'Strength of the glow around the source' },
  ],
  ledArray: [
    // Light tab
    { ...enabled, tab: 'light' },
    { name: 'on', label: 'Power', type: 'boolean', tab: 'light', description: 'Switch the array on or off. An LED has no thermal lag, so this is instant unless Warm-up says otherwise' },
    { name: 'colorMode', label: 'Colour', type: 'select', tab: 'light', options: ['temperature', 'color', 'rgb'], optionLabels: ['Temperature', 'Custom colour', 'RGB'], description: 'Kelvin, one colour, or a hue running across the array' },
    { ...intensity(40), tab: 'light' },
    { name: 'temperature', label: 'Temperature (K)', type: 'number', min: 1800, max: 10000, step: 50, tab: 'light', description: '2700K warm white, 4000K neutral, 6500K cool daylight' },
    { name: 'rgbSpread', label: 'Hue spread', type: 'number', min: 0, max: 2, step: 0.01, tab: 'light', description: 'How many turns of hue fit across the array' },
    { name: 'rgbSpeed', label: 'Chase', type: 'number', min: -2, max: 2, step: 0.01, tab: 'light', description: 'How fast the hue runs along the array' },
    { ...distance, tab: 'light' },
    { ...decay, tab: 'light' },
    { ...color, tab: 'light' },
    // Array tab
    { name: 'layout', type: 'select', tab: 'array', options: ['single', 'strip', 'panel', 'ring'], optionLabels: ['Single', 'Strip', 'Panel', 'Ring'], description: 'How the dies are arranged' },
    { name: 'count', label: 'Dies', type: 'number', min: 1, max: 64, step: 1, tab: 'array', description: 'Dies along the main axis' },
    { name: 'rows', type: 'number', min: 1, max: 12, step: 1, tab: 'array', description: 'Rows of dies. Panel only' },
    { name: 'spacing', type: 'number', min: 0.005, max: 0.5, step: 0.005, tab: 'array', description: 'Distance between dies' },
    { name: 'dieSize', label: 'Die size', type: 'number', min: 0.002, max: 0.1, step: 0.001, tab: 'array', description: 'Size of one die' },
    { name: 'emitter', label: 'Source', type: 'select', tab: 'array', options: ['dies', 'none'], optionLabels: ['Dies', 'Hidden'], description: 'Hide the dies to leave only the light' },
    { name: 'diffuser', type: 'number', min: 0, max: 1, step: 0.01, tab: 'array', description: 'Sheet over the dies. A bigger source, so it softens the shadow too' },
    { name: 'pwm', label: 'PWM', type: 'number', min: 0, max: 1, step: 0.01, tab: 'array', description: 'The high-frequency chop a dimmed LED runs on. Reads as a slow strobe, the way a camera sees it' },
    { name: 'warmup', label: 'Warm-up (s)', type: 'number', min: 0, max: 3, step: 0.05, tab: 'array', description: 'Fade-up time. 0 = instant, which is what an LED actually does' },
    { name: 'flicker', type: 'number', min: 0, max: 1, step: 0.01, tab: 'array', description: 'Random dips in brightness' },
    { name: 'halo', type: 'number', min: 0, max: 2, step: 0.01, tab: 'array', description: 'Strength of the glow around the array' },
  ],
  fluorescentTube: [
    // Light tab
    { ...enabled, tab: 'light' },
    { name: 'on', label: 'Power', type: 'boolean', tab: 'light', description: 'Switch the fixture on or off' },
    { name: 'colorMode', label: 'Colour', type: 'select', tab: 'light', options: ['temperature', 'color'], optionLabels: ['Temperature', 'Custom colour'], description: 'Drive the colour from a Kelvin temperature, or pick one' },
    { ...intensity(60), tab: 'light' },
    { name: 'temperature', label: 'Temperature (K)', type: 'number', min: 2700, max: 8000, step: 50, tab: 'light', description: '3000K warm white, 4000K cool white, 6500K daylight' },
    { name: 'greenShift', label: 'Green spike', type: 'number', min: 0, max: 1, step: 0.01, tab: 'light', description: "The phosphor's green cast. Real halophosphate tubes read distinctly green next to daylight" },
    { name: 'shadowStrength', label: 'Shadow core', type: 'number', min: 0, max: 1, step: 0.01, tab: 'light', description: 'Share of the output coming from a point at the middle of the fixture. A rect-area light cannot cast a shadow, so only this part does. 0 = pure soft area light, no shadow' },
    { ...color, tab: 'light' },
    // Tube tab
    { name: 'tubes', type: 'number', min: 1, max: 4, step: 1, tab: 'tube', description: 'Tubes in the fixture' },
    { name: 'tubeSpacing', label: 'Tube spacing', type: 'number', min: 0.02, max: 0.6, step: 0.005, tab: 'tube', description: 'Distance between tubes' },
    { name: 'length', type: 'number', min: 0.1, max: 4, step: 0.05, tab: 'tube', description: 'Tube length' },
    { name: 'diameter', type: 'number', min: 0.006, max: 0.12, step: 0.002, tab: 'tube', description: 'Tube diameter' },
    { name: 'emitter', label: 'Source', type: 'select', tab: 'tube', options: ['tubes', 'none'], optionLabels: ['Tubes', 'Hidden'], description: 'Hide the tubes to leave only the light' },
    { name: 'startup', type: 'select', tab: 'tube', options: ['instant', 'stutter'], optionLabels: ['Instant', 'Stutter'], description: 'Stutter strikes the arc with false starts first, the way a magnetic ballast does' },
    { name: 'warmup', label: 'Warm-up (s)', type: 'number', min: 0, max: 5, step: 0.05, tab: 'tube', description: 'Time for the mercury vapour to reach full output' },
    { name: 'hum', label: 'Ballast hum', type: 'number', min: 0, max: 1, step: 0.01, tab: 'tube', description: 'Depth of the 100 Hz ripple a magnetic ballast leaves in the light' },
    { name: 'age', type: 'number', min: 0, max: 1, step: 0.01, tab: 'tube', description: 'Wear: dimmer, blackened ends, a longer strike and more flicker' },
    // The rect-area light has neither; these govern the shadow core only.
    { ...distance, tab: 'tube', description: 'Range of the shadow core. 0 = unlimited' },
    { ...decay, tab: 'tube', description: 'How fast the shadow core dims with distance. 2 is physically correct' },
    { name: 'flicker', type: 'number', min: 0, max: 1, step: 0.01, tab: 'tube', description: 'Random dips in brightness, on top of whatever Age adds' },
    { name: 'halo', type: 'number', min: 0, max: 2, step: 0.01, tab: 'tube', description: 'Strength of the wash around the fixture' },
  ],
  candle: [
    // Light tab
    { ...enabled, tab: 'light' },
    { name: 'on', label: 'Lit', type: 'boolean', tab: 'light', description: 'Lighting it runs the ignition; putting it out snuffs the flame and leaves a thread of smoke' },
    { name: 'colorMode', label: 'Colour', type: 'select', tab: 'light', options: ['temperature', 'color'], optionLabels: ['Temperature', 'Custom colour'], description: 'Drive the colour from a Kelvin temperature, or pick one' },
    { ...intensity(6), tab: 'light' },
    { name: 'temperature', label: 'Temperature (K)', type: 'number', min: 1200, max: 3200, step: 10, tab: 'light', description: 'A candle is about 1850K' },
    { ...distance, tab: 'light' },
    { ...decay, tab: 'light' },
    { ...color, tab: 'light' },
    // Flame tab
    { name: 'flameMode', label: 'Flame quality', type: 'select', tab: 'flame', options: ['volumetric', 'billboard'], optionLabels: ['Volumetric', 'Billboard'], description: 'Volumetric raymarches the flame, so it has real depth from every angle. Billboard is the same flame on one quad — for scenes full of candles' },
    { name: 'flameHeight', label: 'Flame height', type: 'number', min: 0.008, max: 0.2, step: 0.001, tab: 'flame', description: 'A real candle flame is 3-6 cm' },
    { name: 'flameWidth', label: 'Flame width', type: 'number', min: 0.2, max: 2, step: 0.01, tab: 'flame', description: 'Width relative to the height' },
    { name: 'movement', type: 'number', min: 0, max: 1, step: 0.01, tab: 'flame', description: 'How much the flame moves at all. 0 holds it perfectly still — it can still flicker in brightness' },
    { name: 'flicker', type: 'number', min: 0, max: 1, step: 0.01, tab: 'flame', description: 'Depth of the brightness dip. This is the light’s output, not its shape' },
    { name: 'flickerHz', label: 'Flicker rate (Hz)', type: 'number', min: 4, max: 20, step: 0.1, tab: 'flame', description: 'Real candle flames oscillate near 11 Hz almost regardless of size' },
    { name: 'draught', type: 'number', min: 0, max: 1, step: 0.01, tab: 'flame', description: 'Air movement: lean, stretch, turbulence, and guttering once it is strong' },
    { name: 'blue', label: 'Blue base', type: 'number', min: 0, max: 1, step: 0.01, tab: 'flame', description: 'The blue cone at the wick, where there is plenty of oxygen' },
    { name: 'blueBasePercentage', label: 'Blue base height', type: 'number', min: 0, max: 100, step: 1, tab: 'flame', description: 'How much of the flame’s height reads blue, as a percentage. Past about 40 it fills in rather than staying a collar' },
    { name: 'soot', type: 'number', min: 0, max: 1, step: 0.01, tab: 'flame', description: 'How much the soot absorbs: gives the flame a body instead of a ghost' },
    { name: 'flameSteps', label: 'Raymarch steps', type: 'number', min: 8, max: 40, step: 1, tab: 'flame', description: 'Volumetric only. Higher is smoother and slower' },
    { name: 'flameGain', label: 'Flame gain', type: 'number', min: 1, max: 20, step: 0.1, tab: 'flame', description: 'Emission scale. Raise for a hotter, whiter flame' },
    { name: 'flameWhite', label: 'White point', type: 'number', min: 1.5, max: 10, step: 0.1, tab: 'flame', description: 'Where the flame\u2019s own knee clips to white. Lower blows the core out sooner' },
    { name: 'ignite', label: 'Ignition (s)', type: 'number', min: 0, max: 5, step: 0.05, tab: 'flame', description: 'Time for the wick to catch and the flame to establish. 0 = instant' },
    { name: 'smoke', label: 'Smoke when snuffed', type: 'boolean', tab: 'flame', description: 'A thread of smoke for a few seconds after it goes out' },
    { name: 'halo', type: 'number', min: 0, max: 2, step: 0.01, tab: 'flame', description: 'Strength of the wash around the flame' },
    // Candle tab
    { name: 'body', type: 'select', tab: 'candle', options: ['pillar', 'taper', 'tealight', 'none'], optionLabels: ['Pillar', 'Taper', 'Tealight', 'None'], description: 'None leaves the flame and the light on their own, to drop into your own candle' },
    { name: 'height', type: 'number', min: 0.01, max: 1, step: 0.005, tab: 'candle', description: 'Candle height, before the body style\u2019s own proportions' },
    { name: 'radius', type: 'number', min: 0.004, max: 0.15, step: 0.001, tab: 'candle', description: 'Candle radius' },
    { name: 'melt', type: 'number', min: 0, max: 1, step: 0.01, tab: 'candle', description: 'How far it has burned down: the depth of the well round the wick' },
    { name: 'waxGlow', label: 'Wax glow', type: 'number', min: 0, max: 1, step: 0.01, tab: 'candle', description: 'How much the wax is lit from inside' },
    { name: 'waxColor', label: 'Wax colour', type: 'color', tab: 'candle', description: 'Wax colour' },
  ],
};

/** Re-export under the name the controller already uses; the table itself lives in core. */
export const LIGHT_DEFAULTS: Record<LightType, Record<string, unknown>> = DEFAULT_LIGHTS;

/** Knobs hidden by another knob's value (colour vs temperature, tint only when tinted). */
export function isLightPropertyHidden(name: string, values: Record<string, unknown>): boolean {
  const type = values.type;
  if (type === 'ledArray') {
    const mode = values.colorMode ?? 'temperature';
    if (name === 'color') return mode !== 'color';
    if (name === 'temperature') return mode === 'rgb';
    if (name === 'rgbSpread' || name === 'rgbSpeed') return mode !== 'rgb';
    if (name === 'rows') return (values.layout ?? 'panel') !== 'panel';
    if (name === 'count') return (values.layout ?? 'panel') === 'single';
    return false;
  }
  if (type === 'candle') {
    const mode = values.colorMode ?? 'temperature';
    if (name === 'color') return mode !== 'color';
    if (name === 'temperature') return mode !== 'temperature';
    // Only the raymarched flame has steps, and the wax knobs mean nothing
    // when there is no wax.
    if (name === 'flameSteps') return (values.flameMode ?? 'volumetric') !== 'volumetric';
    if (name === 'height' || name === 'radius' || name === 'melt' || name === 'waxGlow' || name === 'waxColor')
      return (values.body ?? 'pillar') === 'none';
    return false;
  }
  if (type === 'fluorescentTube') {
    const mode = values.colorMode ?? 'temperature';
    if (name === 'color') return mode !== 'color';
    if (name === 'temperature') return mode !== 'temperature';
    if (name === 'tubeSpacing') return (typeof values.tubes === 'number' ? values.tubes : 1) < 2;
    return false;
  }
  if (type !== 'lightBulb' && type !== 'spotBeam') return false;
  const mode = values.colorMode ?? 'temperature';
  if (name === 'color') return mode !== 'color';
  if (name === 'temperature') return mode !== 'temperature';
  if (type === 'lightBulb') {
    if (name === 'glassTint') return (values.glass ?? 'clear') !== 'tinted';
    return false;
  }
  // spotBeam: the beam knobs mean nothing with the beam off, and the step count
  // only drives the raymarched mode.
  const beamMode = values.beamMode ?? 'soft';
  if (name === 'beamSteps') return beamMode !== 'volumetric';
  if (name === 'beam' || name === 'beamLength' || name === 'beamNoise') return beamMode === 'none';
  return false;
}

// -----------------------------------------------------------------------------
// Shadow
// -----------------------------------------------------------------------------

export const SHADOW_MAP_SIZES = ['256', '512', '1024', '2048', '4096'];

const common: OptionalProperty[] = [
  { name: 'enabled', label: 'Cast shadows', type: 'boolean', description: 'A point light / bulb shadow costs six extra renders' },
  { name: 'mapSize', label: 'Resolution', type: 'select', options: SHADOW_MAP_SIZES, description: 'Shadow map size. Higher is sharper and slower' },
  { name: 'intensity', type: 'number', min: 0, max: 1, step: 0.01, description: 'How dark the shadow is' },
  { name: 'radius', label: 'Softness', type: 'number', min: 0, max: 10, step: 0.1, description: 'Blur radius of the shadow edge (PCF shadows)' },
  { name: 'bias', type: 'number', min: -0.01, max: 0.01, step: 0.0001, description: 'Fixes shadow acne. Too far and shadows detach from objects' },
  { name: 'normalBias', label: 'Normal bias', type: 'number', min: 0, max: 0.1, step: 0.001, description: 'Acne fix along the surface normal; better on curved surfaces' },
  { name: 'cameraNear', label: 'Near', type: 'number', min: 0.01, max: 10, step: 0.01, description: 'Closest distance that casts a shadow' },
  { name: 'cameraFar', label: 'Far', type: 'number', min: 1, max: 1000, step: 1, description: 'Farthest distance that casts a shadow' },
];

const spotShadow: OptionalProperty[] = [
  ...common,
  { name: 'cameraFov', label: 'Shadow FOV', type: 'number', min: 1, max: 120, step: 1, description: 'Field of view of the shadow camera' },
  { name: 'focus', type: 'number', min: 0, max: 1, step: 0.01, description: 'Tightens the shadow camera around the cone' },
];

export const SHADOW_PROPERTIES: Record<LightType, OptionalProperty[]> = {
  ambient: [],
  point: common,
  lightBulb: common,
  spot: spotShadow,
  spotBeam: spotShadow,
  ledArray: common,
  candle: common,
  // The shadow belongs to the point light at the fixture's centre, so the point
  // light's settings are the ones that matter.
  fluorescentTube: common,
  directional: [
    ...common,
    { name: 'cameraLeft', label: 'Left', type: 'number', min: -200, max: 0, step: 1, description: 'Shadow area, left edge' },
    { name: 'cameraRight', label: 'Right', type: 'number', min: 0, max: 200, step: 1, description: 'Shadow area, right edge' },
    { name: 'cameraTop', label: 'Top', type: 'number', min: 0, max: 200, step: 1, description: 'Shadow area, top edge' },
    { name: 'cameraBottom', label: 'Bottom', type: 'number', min: -200, max: 0, step: 1, description: 'Shadow area, bottom edge' },
  ],
};
