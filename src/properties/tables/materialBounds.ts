// Property table (moved from the client). The registry (../registry.ts) is built on these tables.
// =============================================================================
// MATERIAL PROPERTY BOUNDS — Min/Max/Step for Slider Controls
// =============================================================================

export interface MaterialPropertyBounds {
  min: number;
  max: number;
  step: number;
  label?: string;
  accentColor?: 'cyan' | 'purple' | 'pink' | 'green' | 'yellow' | 'blue';
}

/**
 * Known bounds for standard Three.js material properties.
 * Used by MaterialControllerUi to render SliderControls with correct ranges.
 * 
 * If a property is not in this map, it falls back to a sensible default (0–1, step 0.01).
 */
export const MATERIAL_PROPERTY_BOUNDS: Record<string, MaterialPropertyBounds> = {
  // PBR core
  roughness:          { min: 0, max: 1, step: 0.01, label: 'Roughness', accentColor: 'cyan' },
  metalness:          { min: 0, max: 1, step: 0.01, label: 'Metalness', accentColor: 'blue' },
  opacity:            { min: 0, max: 1, step: 0.01, label: 'Opacity', accentColor: 'purple' },

  // Phong
  shininess:          { min: 0, max: 100, step: 1, label: 'Shininess', accentColor: 'yellow' },
  reflectivity:       { min: 0, max: 1, step: 0.01, label: 'Reflectivity', accentColor: 'cyan' },

  // Physical
  clearcoat:          { min: 0, max: 1, step: 0.01, label: 'Clearcoat', accentColor: 'cyan' },
  clearcoatRoughness: { min: 0, max: 1, step: 0.01, label: 'Clearcoat Roughness', accentColor: 'blue' },
  transmission:       { min: 0, max: 1, step: 0.01, label: 'Transmission', accentColor: 'purple' },
  ior:                { min: 1, max: 2.5, step: 0.01, label: 'IOR', accentColor: 'pink' },
  thickness:          { min: 0, max: 5, step: 0.01, label: 'Thickness', accentColor: 'green' },
  attenuationDistance: { min: 0, max: 100, step: 0.5, label: 'Attenuation Distance', accentColor: 'blue' },
  sheen:              { min: 0, max: 1, step: 0.01, label: 'Sheen', accentColor: 'pink' },
  sheenRoughness:     { min: 0, max: 1, step: 0.01, label: 'Sheen Roughness', accentColor: 'purple' },
  specularIntensity:  { min: 0, max: 2, step: 0.01, label: 'Specular Intensity', accentColor: 'yellow' },
  iridescence:        { min: 0, max: 1, step: 0.01, label: 'Iridescence', accentColor: 'pink' },
  iridescenceIOR:     { min: 1, max: 2.5, step: 0.01, label: 'Iridescence IOR', accentColor: 'purple' },

  // Maps intensity
  envMapIntensity:    { min: 0, max: 5, step: 0.1, label: 'Env Map Intensity', accentColor: 'green' },
  emissiveIntensity:  { min: 0, max: 5, step: 0.1, label: 'Emissive Intensity', accentColor: 'yellow' },
  aoMapIntensity:     { min: 0, max: 2, step: 0.01, label: 'AO Map Intensity', accentColor: 'blue' },
  bumpScale:          { min: 0, max: 2, step: 0.01, label: 'Bump Scale', accentColor: 'cyan' },
  displacementScale:  { min: 0, max: 5, step: 0.01, label: 'Displacement Scale', accentColor: 'green' },

  // Shader uniforms (common patterns)
  uOpacity:           { min: 0, max: 1, step: 0.01, label: 'Opacity', accentColor: 'purple' },
  uPointSize:         { min: 0.1, max: 20, step: 0.1, label: 'Point Size', accentColor: 'cyan' },

  // ==========================================================================
  // GENERATIVE EFFECT PROPERTIES
  // ==========================================================================

  // Base (all effects)
  intensity:          { min: 0,    max: 5,    step: 0.05, label: 'Intensity',      accentColor: 'yellow' },
  speed:              { min: 0.1,  max: 10,   step: 0.1,  label: 'Speed',          accentColor: 'cyan'   },

  // Molecules
  atomCount:          { min: 3,    max: 20,   step: 1,    label: 'Atom Count',     accentColor: 'cyan'   },
  orbitRadius:        { min: 0.5,  max: 5,    step: 0.1,  label: 'Orbit Radius',   accentColor: 'blue'   },
  atomSize:           { min: 0.01, max: 0.3,  step: 0.01, label: 'Atom Size',      accentColor: 'purple' },

  // Shockwave / smoke ring
  ringCount:          { min: 1,    max: 5,    step: 1,    label: 'Ring Count',     accentColor: 'cyan'   },
  expansionRadius:    { min: 1,    max: 6,    step: 0.1,  label: 'Expansion Radius', accentColor: 'blue' },
  intervalSeconds:    { min: 0.5,  max: 10,   step: 0.1,  label: 'Interval (s)',   accentColor: 'yellow' },

  // Aura / orb
  layerCount:         { min: 1,    max: 5,    step: 1,    label: 'Layer Count',    accentColor: 'purple' },
  fresnelPower:       { min: 1,    max: 8,    step: 0.1,  label: 'Fresnel Power',  accentColor: 'pink'   },
  pulseSpeed:         { min: 0.1,  max: 5,    step: 0.1,  label: 'Pulse Speed',    accentColor: 'pink'   },
  noiseAmount:        { min: 0,    max: 1,    step: 0.01, label: 'Noise Amount',   accentColor: 'green'  },
  sizeMultiplier:     { min: 1,    max: 3,    step: 0.1,  label: 'Size Multiplier',accentColor: 'blue'   },
  coreSize:           { min: 0.05, max: 0.5,  step: 0.01, label: 'Core Size',      accentColor: 'yellow' },
  glowLayers:         { min: 1,    max: 5,    step: 1,    label: 'Glow Layers',    accentColor: 'purple' },

  // Data stream / constellation
  particleCount:      { min: 20,   max: 500,  step: 10,   label: 'Particle Count', accentColor: 'cyan'   },
  spiralTurns:        { min: 1,    max: 12,   step: 1,    label: 'Spiral Turns',   accentColor: 'blue'   },
  streamRadius:       { min: 0.5,  max: 5,    step: 0.1,  label: 'Stream Radius',  accentColor: 'green'  },
  particleSize:       { min: 0.01, max: 0.2,  step: 0.01, label: 'Particle Size',  accentColor: 'purple' },
  connectRadius:      { min: 0.5,  max: 5,    step: 0.1,  label: 'Connect Radius', accentColor: 'cyan'   },
  twinkleSpeed:       { min: 0.1,  max: 5,    step: 0.1,  label: 'Twinkle Speed',  accentColor: 'pink'   },
  lineOpacity:        { min: 0,    max: 1,    step: 0.01, label: 'Line Opacity',   accentColor: 'purple' },
  starCount:          { min: 10,   max: 200,  step: 5,    label: 'Star Count',     accentColor: 'yellow' },
  starSize:           { min: 0.01, max: 0.2,  step: 0.01, label: 'Star Size',      accentColor: 'yellow' },

  // Hologram
  scanlineCount:      { min: 2,    max: 20,   step: 1,    label: 'Scanline Count', accentColor: 'cyan'   },
  scanSpeed:          { min: 0.1,  max: 5,    step: 0.1,  label: 'Scan Speed',     accentColor: 'green'  },
  flickerAmount:      { min: 0,    max: 1,    step: 0.01, label: 'Flicker Amount', accentColor: 'yellow' },

  // Portal
  radius:             { min: 0.5,  max: 5,    step: 0.1,  label: 'Radius',         accentColor: 'purple' },
  rotationSpeed:      { min: 0.1,  max: 5,    step: 0.1,  label: 'Rotation Speed', accentColor: 'cyan'   },

  // DNA Helix
  helixRadius:        { min: 0.2,  max: 3,    step: 0.1,  label: 'Helix Radius',   accentColor: 'blue'   },
  helixHeight:        { min: 0.5,  max: 5,    step: 0.1,  label: 'Helix Height',   accentColor: 'green'  },

  // Lightning
  boltCount:          { min: 1,    max: 8,    step: 1,    label: 'Bolt Count',     accentColor: 'yellow' },
  branchDepth:        { min: 2,    max: 6,    step: 1,    label: 'Branch Depth',   accentColor: 'blue'   },
  strikeRadius:       { min: 1,    max: 4,    step: 0.1,  label: 'Strike Radius',  accentColor: 'purple' },
  flickerRate:        { min: 2,    max: 20,   step: 1,    label: 'Flicker Rate',   accentColor: 'yellow' },
  branchProbability:  { min: 0,    max: 1,    step: 0.05, label: 'Branch Probability', accentColor: 'pink' },

  // Aurora
  ribbonCount:        { min: 3,    max: 10,   step: 1,    label: 'Ribbon Count',   accentColor: 'green'  },
  waveAmplitude:      { min: 0.1,  max: 1.5,  step: 0.05, label: 'Wave Amplitude', accentColor: 'cyan'   },
  colorShift:         { min: 0,    max: 1,    step: 0.01, label: 'Color Shift',    accentColor: 'pink'   },
  arcWidth:           { min: 0.3,  max: 1,    step: 0.05, label: 'Arc Width',      accentColor: 'blue'   },

  // Fire / smoke plume
  height:             { min: 0.5,  max: 3,    step: 0.1,  label: 'Height',         accentColor: 'yellow' },
  spread:             { min: 0.2,  max: 1.5,  step: 0.05, label: 'Spread',         accentColor: 'yellow' },
  turbulence:         { min: 0,    max: 1,    step: 0.05, label: 'Turbulence',     accentColor: 'green'  },

  // Forcefield
  hexSize:            { min: 0.02, max: 0.15, step: 0.005,label: 'Hex Size',       accentColor: 'cyan'   },

  // Neural network
  nodeCount:          { min: 8,    max: 40,   step: 1,    label: 'Node Count',     accentColor: 'blue'   },
  signalSpeed:        { min: 0.3,  max: 3,    step: 0.1,  label: 'Signal Speed',   accentColor: 'cyan'   },
  orbitSpeed:         { min: 0.1,  max: 1,    step: 0.05, label: 'Orbit Speed',    accentColor: 'purple' },

  // Black hole
  tilt:               { min: 0,    max: 45,   step: 1,    label: 'Tilt (°)',       accentColor: 'purple' },

  // Ice crystals
  spikeCount:         { min: 10,   max: 60,   step: 1,    label: 'Spike Count',    accentColor: 'blue'   },
  spikeLength:        { min: 0.3,  max: 2,    step: 0.1,  label: 'Spike Length',   accentColor: 'cyan'   },

  // Volumetric fog
  fogRadius:          { min: 0.5,  max: 3,    step: 0.1,  label: 'Fog Radius',     accentColor: 'blue'   },
  driftSpeed:         { min: 0.1,  max: 2,    step: 0.05, label: 'Drift Speed',    accentColor: 'cyan'   },
  density:            { min: 0,    max: 1,    step: 0.01, label: 'Density',        accentColor: 'purple' },

  // Smoke ring
  riseSpeed:          { min: 0.1,  max: 2,    step: 0.1,  label: 'Rise Speed',     accentColor: 'green'  },
};

/**
 * Default bounds for unknown numeric properties.
 */
export const DEFAULT_MATERIAL_BOUNDS: MaterialPropertyBounds = {
  min: 0,
  max: 1,
  step: 0.01,
  accentColor: 'cyan',
};

/**
 * Get bounds for a property, falling back to defaults.
 */
export function getMaterialBounds(key: string): MaterialPropertyBounds {
  return MATERIAL_PROPERTY_BOUNDS[key] || DEFAULT_MATERIAL_BOUNDS;
}

/**
 * Get a human-readable label for a property key.
 * Uses the bounds label if available, otherwise converts camelCase to Title Case.
 */
export function getMaterialPropertyLabel(key: string): string {
  const bounds = MATERIAL_PROPERTY_BOUNDS[key];
  if (bounds?.label) return bounds.label;

  // Convert camelCase to Title Case: "envMapIntensity" → "Env Map Intensity"
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

/**
 * Generate random values for numeric and color properties within their bounds.
 * Skips texture/mapping properties and internal fields.
 */
export function generateRandomMaterialSettings(
  currentSettings: Record<string, any>
): Record<string, any> {
  const randomized: Record<string, any> = { ...currentSettings };

  for (const [key, value] of Object.entries(currentSettings)) {
    // Skip internal fields
    if (['materialType', 'materialVariant', 'handlers', 'apply', 'uHasTexture', 'transparent', 'side', 'u_time', 'u_resolution', 'u_mouse'].includes(key)) {
      continue;
    }

    // Skip textures/maps
    const lower = key.toLowerCase();
    if (lower.includes('map') || lower.includes('texture')) continue;

    // Skip arrays (normalScale, etc.)
    if (Array.isArray(value)) continue;

    // Randomize numbers within bounds
    if (typeof value === 'number') {
      const bounds = getMaterialBounds(key);
      const range = bounds.max - bounds.min;
      const randomValue = bounds.min + Math.random() * range;
      // Round to step precision
      const precision = bounds.step < 1 ? Math.ceil(-Math.log10(bounds.step)) : 0;
      randomized[key] = Number(randomValue.toFixed(precision));
    }

    // Randomize colors
    if (typeof value === 'string' && value.startsWith('#')) {
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      randomized[key] = `#${r}${g}${b}`;
    }
  }

  return randomized;
}
