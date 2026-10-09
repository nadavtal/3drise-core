// Property table for the environment objects (type 'environment'). The registry (../registry.ts) is built on these tables.
import type { OptionalProperty } from './optionalProperties';
import type { EnvironmentObjectType } from '../../types/environmentObjects';

// =============================================================================
// ENVIRONMENT OBJECTS OPTIONAL PROPERTIES (generated: gen_family.mjs)
// Order: selects, base, variant, wind, colours, pointer (pointer* -> Pointer tab).
// =============================================================================

export const snowEnvironmentProperties: OptionalProperty[] = [
  { name: 'quality', description: 'Detail level: scales the number of flakes (rebuilds)', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'] },
  { name: 'intensity', description: 'Overall brightness of the snow', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'speed', description: 'Time scale of the whole fall: flakes, gusts and eddies', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'opacity', description: 'Overall opacity', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'density', description: 'How heavily it snows (rebuilds)', type: 'number', min: 0.1, max: 3, step: 0.05 },
  { name: 'flakeSize', description: 'Mean flake diameter; bigger flakes fall faster', type: 'number', min: 0.01, max: 0.12, step: 0.001, unit: 'm' },
  { name: 'flutter', description: 'Side-to-side spiral of the falling flakes', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'tumble', description: 'How much the crystals rock and flip as they fall', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'glint', description: 'Sparkle of sunlight off the tumbling crystals', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'windStrength', description: 'Mean wind (1 = 8 m/s)', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'windDirection', description: 'Compass direction the wind blows toward', type: 'number', min: 0, max: 360, step: 1, unit: '°' },
  { name: 'turbulence', description: 'Swirling eddies on top of the wind', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'gustiness', description: 'Strength of the gust waves that sweep downwind', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'bands', description: 'How strongly the gusts gather the snow into sweeping curtains', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'seed', description: 'Random layout of the flakes (rebuilds)', type: 'number', min: 1, max: 999, step: 1 },
  { name: 'followCamera', description: 'Keep snowing around the camera wherever it goes, ignoring the sides of the volume', type: 'boolean' },
  { name: 'color', description: 'Colour of the snow, lit by the sun and the sky', type: 'color' },
  { name: 'shadeColor', description: 'Sky-lit shade on the side away from the sun', type: 'color' },
  { name: 'pointerMode', description: 'What the cursor is: off, a gust of air, a shelter the snow slides off, or a warm hand that melts it', type: 'select', options: ['none', 'gust', 'shelter', 'warmth'], optionLabels: ['Off', 'Gust', 'Shelter', 'Warmth'] },
  { name: 'pointerStrength', description: 'Force of the gust, width of the clearing, heat of the hand', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'pointerRadius', description: 'Reach of the cursor (1 = 2 m)', type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'pointerColor', description: 'Warm glow of the melting droplets (Warmth)', type: 'color' },
];

export const sandstormEnvironmentProperties: OptionalProperty[] = [
  { name: 'quality', description: 'Detail level: scales the counts and the volume samples (rebuilds)', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'] },
  { name: 'intensity', description: 'Overall brightness', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'speed', description: 'Time scale of the storm: billows, gust fronts and grains', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'opacity', description: 'Overall opacity', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'density', description: 'How thick the dust is (rebuilds)', type: 'number', min: 0.1, max: 3, step: 0.05 },
  { name: 'height', description: 'Scale height of the dust, as a share of the volume height', type: 'number', min: 0.05, max: 1, step: 0.01 },
  { name: 'walls', description: 'Strength of the gust fronts: towering walls of dust rolling downwind', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'haze', description: 'Fine dust hanging everywhere between the walls', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'grains', description: 'Sand grains hopping along the ground', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'grainSize', description: 'Size and hop length of the grains', type: 'number', min: 0.3, max: 3, step: 0.01 },
  { name: 'windStrength', description: 'Mean wind (1 = 8 m/s)', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'windDirection', description: 'Compass direction the wind blows toward', type: 'number', min: 0, max: 360, step: 1, unit: '°' },
  { name: 'turbulence', description: 'How strongly the billows are warped and torn', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'seed', description: 'Random layout (rebuilds)', type: 'number', min: 1, max: 999, step: 1 },
  { name: 'followCamera', description: 'Keep the weather around the camera wherever it goes, ignoring the sides of the volume', type: 'boolean' },
  { name: 'color', description: 'Colour of the dust (its albedo: thick dust tints everything behind it)', type: 'color' },
  { name: 'shadeColor', description: 'Sky-lit colour of the dust in shadow', type: 'color' },
  { name: 'pointerMode', description: 'What the cursor is: off, a windbreak with still air behind it, a dust devil, or a gust', type: 'select', options: ['none', 'windbreak', 'devil', 'gust'], optionLabels: ['Off', 'Windbreak', 'Dust devil', 'Gust'] },
  { name: 'pointerStrength', description: 'How still the lee, how strong the devil, how hard the gust', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'pointerRadius', description: 'Reach of the cursor (1 = 3 m)', type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'pointerColor', description: 'Glow of the dust lifted by the dust devil', type: 'color' },
];

export const rainbowEnvironmentProperties: OptionalProperty[] = [
  { name: 'intensity', description: 'Brightness of the bow', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'opacity', description: 'Overall opacity', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'dropSize', description: 'Raindrop diameter: big drops give a narrow, vivid bow; small ones pale fringes inside it; fog drops a white fogbow', type: 'number', min: 0.03, max: 3, step: 0.01, unit: 'mm' },
  { name: 'secondary', description: 'Strength of the secondary bow outside the primary (reversed colours, ~51°); 0 = a single rainbow', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color', description: 'Tint of the bow (white = the pure spectrum)', type: 'color' },
  { name: 'pointerMode', description: 'What the cursor is: off, a mist spray that brightens the bow, a clearing that wipes it, or a polarising filter that fades it as it turns', type: 'select', options: ['none', 'spray', 'clear', 'polarizer'], optionLabels: ['Off', 'Mist spray', 'Clearing', 'Polarising filter'] },
  { name: 'pointerStrength', description: 'Brightness of the sprayed stretch, depth of the clearing, strength of the filter', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'pointerRadius', description: 'Reach of the spray or clearing (1 = 6 m)', type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'pointerColor', description: 'Tint of the bow in the sprayed mist', type: 'color' },
];

export const tornadoEnvironmentProperties: OptionalProperty[] = [
  { name: 'quality', description: 'Detail level: scales the counts and the volume samples (rebuilds)', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'] },
  { name: 'intensity', description: 'Overall brightness', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'speed', description: 'Time scale of the whole vortex', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'opacity', description: 'Overall opacity', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'density', description: 'How opaque the funnel and dust are (rebuilds)', type: 'number', min: 0.1, max: 3, step: 0.05 },
  { name: 'rotation', description: 'Spin rate of the vortex', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'coreRadius', description: 'Radius of the core, and so the width of the funnel', type: 'number', min: 0.3, max: 3, step: 0.01 },
  { name: 'reach', description: 'How far down the condensation funnel reaches (1 = touchdown)', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'wander', description: 'How much the axis wanders and bends like a rope', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'lift', description: 'Updraft: how fast the streaks and dust climb', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'dust', description: 'Ground dust drawn in and swirled up around the funnel', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'dustSpread', description: 'How far out the dust swirls', type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'windStrength', description: 'Mean wind (1 = 8 m/s)', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'windDirection', description: 'Compass direction the wind blows toward', type: 'number', min: 0, max: 360, step: 1, unit: '°' },
  { name: 'turbulence', description: 'Raggedness of the flow', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'seed', description: 'Random layout (rebuilds)', type: 'number', min: 1, max: 999, step: 1 },
  { name: 'followCamera', description: 'Keep the volume centred on the camera horizontally', type: 'boolean' },
  { name: 'color', description: 'Colour of the condensation funnel', type: 'color' },
  { name: 'shadeColor', description: 'Storm-light colour in shadow', type: 'color' },
  { name: 'dustColor', description: 'Colour of the swirling dust', type: 'color' },
  { name: 'pointerMode', description: 'What the cursor does: off, steers the foot of the tornado, feeds its inflow, or bends it with a gust', type: 'select', options: ['none', 'steer', 'feed', 'gust'], optionLabels: ['Off', 'Steer', 'Feed', 'Gust'] },
  { name: 'pointerStrength', description: 'How far it steers, how much it feeds, how hard it bends', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'pointerRadius', description: 'Height span of the bend (Gust)', type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'pointerColor', description: 'Colour of the dust the cursor feeds in', type: 'color' },
];

export const thunderstormEnvironmentProperties: OptionalProperty[] = [
  { name: 'quality', description: 'Detail level: scales the counts and the volume samples (rebuilds)', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'] },
  { name: 'intensity', description: 'Overall brightness', type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'speed', description: 'Time scale of the drifting curtains and the flashes', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'opacity', description: 'Overall opacity', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'density', description: 'How thick the storm curtains are (rebuilds)', type: 'number', min: 0.1, max: 3, step: 0.05 },
  { name: 'shafts', description: 'Visibility of the dark storm curtains', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'flashRate', description: 'Lightning flashes per minute (random intervals)', type: 'number', min: 0, max: 30, step: 0.1 },
  { name: 'flashIntensity', description: 'Brightness of a flash, on the curtains and on the scene', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'windStrength', description: 'Mean wind (1 = 8 m/s)', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'windDirection', description: 'Compass direction the wind blows toward', type: 'number', min: 0, max: 360, step: 1, unit: '°' },
  { name: 'turbulence', description: 'How ragged the curtains are', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'seed', description: 'Random layout (rebuilds)', type: 'number', min: 1, max: 999, step: 1 },
  { name: 'followCamera', description: 'Keep the weather around the camera wherever it goes, ignoring the sides of the volume', type: 'boolean' },
  { name: 'color', description: 'Colour of the curtains in the light', type: 'color' },
  { name: 'shadeColor', description: 'Storm-dark tint of the curtains', type: 'color' },
  { name: 'flashColor', description: 'Colour of the lightning', type: 'color' },
  { name: 'pointerMode', description: 'What the cursor is: off, calls a strike where you sweep, or a clearing swept through the murk', type: 'select', options: ['none', 'strike', 'clear'], optionLabels: ['Off', 'Call a strike', 'Clearing'] },
  { name: 'pointerStrength', description: 'How easily a sweep calls a strike, how deep the clearing', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'pointerRadius', description: 'Reach of the clearing (1 = 2 m)', type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'pointerColor', description: 'Colour of the strikes the cursor calls', type: 'color' },
];

export const ENVIRONMENT_PROPERTIES: Record<EnvironmentObjectType, OptionalProperty[]> = {
  snow: snowEnvironmentProperties,
  sandstorm: sandstormEnvironmentProperties,
  rainbow: rainbowEnvironmentProperties,
  tornado: tornadoEnvironmentProperties,
  thunderstorm: thunderstormEnvironmentProperties,
  rain: [
      { name: 'color', description: 'Colour of the drops', type: 'color' },
      { name: 'size', description: 'Streak size', type: 'number', min: 0.01, max: 1, step: 0.01 },
      { name: 'opacity', description: 'Opacity of the drops', type: 'number', min: 0, max: 1, step: 0.01 },
      { name: 'speed', description: 'Fall speed', type: 'number', min: 0.1, max: 5, step: 0.1, unit: 'x' },
      { name: 'density', description: 'How many drops fill the volume (rebuilds)', type: 'number', min: 1, max: 200, step: 1 },
      { name: 'windStrength', description: 'How hard the wind pushes the drops sideways', type: 'number', min: 0, max: 1, step: 0.01 },
      { name: 'windDirection', description: 'Compass direction the wind blows toward', type: 'number', min: 0, max: 360, step: 1, unit: '°' },
      { name: 'turbulence', description: 'Random sway of the drops', type: 'number', min: 0, max: 1, step: 0.01 },
  ],
};
