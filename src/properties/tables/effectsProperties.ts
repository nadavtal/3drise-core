// Property table (moved from the client). The registry (../registry.ts) is built on these tables.
import type { OptionalProperty } from './optionalProperties';
import type { GenerativeEffectType } from '../../types/generativeEffects';

// =============================================================================
// EFFECTS OPTIONAL PROPERTIES
// Describes the configurable inputs for each generative effect type.
// Used by BaseControllerUi to drive slider bounds, toggles, and color pickers.
// Only properties listed here will render — everything else is silently skipped.
// The `description` field is shown as a tooltip on each control label.
//
// Each effect declares ONLY the properties its component actually reads.
// =============================================================================

export const moleculesEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall brightness',                                                          type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',         description: 'Animation speed multiplier',                                                  type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',       description: 'Overall opacity',                                                             type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',         description: 'Positive-phase lobe colour',                                                  type: 'color' },
  { name: 'atomCount',     description: 'Atoms around the centre; they spread out to minimise repulsion',              type: 'number', min: 0, max: 20, step: 1 },
  { name: 'orbitRadius',   description: 'Bond length, as a multiple of the bounding radius',                           type: 'number', min: 0.5, max: 5, step: 0.05 },
  { name: 'atomSize',      description: 'Size of the outer atoms’ electron clouds',                                    type: 'number', min: 0.02, max: 0.3, step: 0.005 },
  { name: 'showBonds',     description: 'Show the bonding density between the atoms',                                  type: 'boolean' },
  { name: 'bondColor',     description: 'Bond density colour',                                                         type: 'color' },
  { name: 'randomizeAxes', description: 'Tumble about a tilted axis',                                                  type: 'boolean' },
  { name: 'orbital',       description: 'Central orbital: −1 cycles, 0 1s, 1 2p, 2 3d z², 3 3d xy, 4 4f z³, 5 4f xyz', type: 'number', min: -1, max: 5, step: 1 },
  { name: 'phaseColor',    description: 'Negative-phase lobe colour',                                                  type: 'color' },
  { name: 'cloudDensity',  description: 'Number of points in the electron clouds',                                     type: 'number', min: 0.25, max: 2, step: 0.05 },
];

export const shockwaveEffectProperties: OptionalProperty[] = [
  { name: 'intensity',       description: 'Overall brightness',                                                                  type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',           description: 'Animation speed multiplier',                                                          type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',         description: 'Overall opacity',                                                                     type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',           description: 'Colour of the birth flash and the hottest part of the front',                         type: 'color' },
  { name: 'rimColor',        description: 'Colour the front cools to as it slows down',                                          type: 'color' },
  { name: 'ringCount',       description: 'How many shock fronts are alive at once',                                             type: 'number', min: 1, max: 4, step: 1 },
  { name: 'expansionRadius', description: 'Largest radius a front reaches, as a multiple of the bounding radius',                type: 'number', min: 1.2, max: 10, step: 0.05 },
  { name: 'thickness',       description: 'Thickness of the bright front, relative to the bounding radius',                      type: 'number', min: 0.005, max: 0.2, step: 0.005 },
  { name: 'intervalSeconds', description: 'Seconds between two launches',                                                        type: 'number', min: 0.2, max: 10, step: 0.1 },
  { name: 'shapeNum',        description: 'Ground ring (0) or spherical shell for mid-air blasts (1)',                           type: 'number', min: 0, max: 1, step: 1 },
  { name: 'deceleration',    description: 'How the front slows: 0 constant speed, 1 true Sedov–Taylor (fast burst, long coast)', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'instability',     description: 'Slow lobes that grow on the front as the shell thins (Vishniac instability)',         type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'dust',            description: 'Debris kicked up where the front sweeps past',                                        type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'condensation',    description: 'Brief Wilson-cloud haze just behind the front',                                       type: 'number', min: 0, max: 1, step: 0.01 },
];

export const auraEffectProperties: OptionalProperty[] = [
  { name: 'intensity',      description: 'Overall glow brightness multiplier',                  type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'speed',          description: 'Pulse animation speed multiplier',                    type: 'number', min: 0.1, max: 10,  step: 0.1  },
  { name: 'opacity',        description: 'Transparency of the shell layers',                    type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'layerCount',     description: 'Number of concentric shell layers',                   type: 'number', min: 1,   max: 5,   step: 1    },
  { name: 'fresnelPower',   description: 'Edge glow sharpness — higher = thinner rim',          type: 'number', min: 1,   max: 8,   step: 0.1  },
  { name: 'pulseSpeed',     description: 'Speed of the breathe/pulse animation',                type: 'number', min: 0.1, max: 5,   step: 0.1  },
  { name: 'noiseAmount',    description: 'FBM surface noise blend amount',                      type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'sizeMultiplier', description: 'Shell radius as a multiplier of the bounding radius', type: 'number', min: 1,   max: 3,   step: 0.1  },
  { name: 'innerColor',     description: 'Core hue — drives the iridescent color cycle',        type: 'color'   },
  { name: 'outerColor',     description: 'Outer diffuse glow color (mixed with iridescence)',   type: 'color'   },
];

export const dataStreamEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Particle glow size multiplier',                        type: 'number', min: 0,    max: 5,   step: 0.05 },
  { name: 'speed',         description: 'Stream flow speed multiplier',                         type: 'number', min: 0.1,  max: 10,  step: 0.1  },
  { name: 'opacity',       description: 'Transparency of stream particles',                     type: 'number', min: 0,    max: 1,   step: 0.01 },
  { name: 'particleCount', description: 'Number of stream particles (doubled for dual helix)',  type: 'number', min: 50,   max: 500, step: 10   },
  { name: 'spiralTurns',   description: 'Number of helix turns along the stream height',        type: 'number', min: 1,    max: 8,   step: 1    },
  { name: 'streamRadius',  description: 'Helix radius as a multiplier of the bounding radius',  type: 'number', min: 0.5,  max: 5,   step: 0.1  },
  { name: 'particleSize',  description: 'Base size of individual stream particles',             type: 'number', min: 0.01, max: 0.2, step: 0.01 },
  { name: 'inward',        description: 'Reverse flow direction — stream flows toward object',  type: 'boolean' },
  { name: 'color',         description: 'Tint laid over the whole palette',                      type: 'color'   },
  { name: 'coldColor',     description: 'Palette start color (t = 0 along the stream)',          type: 'color'   },
  { name: 'midColor',      description: 'Palette midpoint color',                                type: 'color'   },
  { name: 'hotColor',      description: 'Palette end color (t = 1 along the stream)',             type: 'color'   },
];

export const constellationEffectProperties: OptionalProperty[] = [
  { name: 'speed',         description: 'Rotation speed of the star cloud',                    type: 'number', min: 0.1,  max: 10,  step: 0.1  },
  { name: 'opacity',       description: 'Transparency of stars and connecting lines',          type: 'number', min: 0,    max: 1,   step: 0.01 },
  { name: 'starCount',     description: 'Number of stars distributed on a sphere',             type: 'number', min: 10,   max: 200, step: 5    },
  { name: 'connectRadius', description: 'Max star distance for drawing a connecting line',     type: 'number', min: 0.5,  max: 5,   step: 0.1  },
  { name: 'orbitRadius',   description: 'Star cloud radius as a multiplier of bounding radius',type: 'number', min: 0.5,  max: 5,   step: 0.1  },
  { name: 'twinkleSpeed',  description: 'Speed of the per-star twinkle animation',             type: 'number', min: 0.1,  max: 5,   step: 0.1  },
  { name: 'lineOpacity',   description: 'Opacity of constellation connecting lines',           type: 'number', min: 0,    max: 1,   step: 0.01 },
  { name: 'starSize',      description: 'Base size of individual star sprites',                type: 'number', min: 0.01, max: 0.2, step: 0.01 },
  { name: 'color',         description: 'Star and line tint color',                            type: 'color'   },
];

export const hologramEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall brightness of the hologram planes',           type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'speed',         description: 'Scanline sweep speed multiplier',                     type: 'number', min: 0.1, max: 10,  step: 0.1  },
  { name: 'opacity',       description: 'Transparency of the scan planes',                     type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'scanlineCount', description: 'Number of horizontal scan planes stacked vertically', type: 'number', min: 2,   max: 20,  step: 1    },
  { name: 'scanSpeed',     description: 'Speed of the scanline sweep across each plane',       type: 'number', min: 0.1, max: 5,   step: 0.1  },
  { name: 'flickerAmount', description: 'Probability of random brightness flicker events',     type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'gridEnabled',   description: 'Overlay a fine grid pattern on the scan planes',      type: 'boolean' },
  { name: 'glitchEnabled', description: 'Enable random block-shift glitch distortions',        type: 'boolean' },
  { name: 'scanColor',     description: 'Tint color for scanlines, grid, and interference',    type: 'color'   },
];

export const portalEffectProperties: OptionalProperty[] = [
  { name: 'intensity',           description: 'Overall brightness',                                      type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',               description: 'Animation speed multiplier',                              type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',             description: 'Overall opacity',                                         type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'radius',              description: 'Portal radius, as a multiple of the bounding radius',     type: 'number', min: 0.5, max: 4, step: 0.05 },
  { name: 'spiralTurns',         description: 'Tightness of the spiral arms',                            type: 'number', min: 0, max: 12, step: 0.1 },
  { name: 'innerGlowColor',      description: 'Hot inner glow',                                          type: 'color' },
  { name: 'outerGlowColor',      description: 'Cool outer glow',                                         type: 'color' },
  { name: 'rotationSpeed',       description: 'Swirl and infall speed',                                  type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'particleRingEnabled', description: 'Show matter falling into the throat',                     type: 'boolean' },
  { name: 'particleCount',       description: 'Infalling particles',                                     type: 'number', min: 0, max: 400, step: 5 },
  { name: 'throatSize',          description: 'Throat radius, as a fraction of the portal radius',       type: 'number', min: 0.15, max: 0.7, step: 0.01 },
  { name: 'funnelDepth',         description: 'Depth of the funnel, as a fraction of the portal radius', type: 'number', min: 0, max: 1.5, step: 0.01 },
  { name: 'otherSideColor',      description: 'Nebula colour on the other side',                         type: 'color' },
];

export const dnaHelixEffectProperties: OptionalProperty[] = [
  { name: 'intensity',           description: 'Backbone glow and bolt brightness multiplier',          type: 'number', min: 0,   max: 3,   step: 0.05 },
  { name: 'speed',               description: 'Rotation and energy bolt travel speed',                 type: 'number', min: 0.1, max: 10,  step: 0.1  },
  { name: 'opacity',             description: 'Transparency of rung lines and junction dots',          type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'particleCount',       description: 'Backbone vertex density per strand (more = smoother)', type: 'number', min: 60,  max: 300, step: 10   },
  { name: 'strandCount',         description: 'Number of helix strands (2 = double helix)',            type: 'number', min: 2,   max: 3,   step: 1    },
  { name: 'helixRadius',         description: 'Helix radius as a multiplier of the bounding radius',  type: 'number', min: 0.2, max: 3,   step: 0.1  },
  { name: 'helixHeight',         description: 'Helix height as a multiplier of the bounding radius',  type: 'number', min: 0.5, max: 5,   step: 0.1  },
  { name: 'runningLightEnabled', description: 'Show energy bolts traveling up the helix strands',     type: 'boolean' },
  { name: 'basePairColor',       description: 'Color of the horizontal rung lines and junction dots', type: 'color'   },
];

export const orbEffectProperties: OptionalProperty[] = [
  { name: 'intensity',    description: 'Overall glow brightness multiplier',                    type: 'number', min: 0,    max: 5,   step: 0.05 },
  { name: 'speed',        description: 'Pulse and corona rotation speed multiplier',            type: 'number', min: 0.1,  max: 10,  step: 0.1  },
  { name: 'opacity',      description: 'Transparency of all orb layers',                        type: 'number', min: 0,    max: 1,   step: 0.01 },
  { name: 'coreSize',     description: 'Core sphere radius as a multiplier of bounding radius', type: 'number', min: 0.05, max: 0.5, step: 0.01 },
  { name: 'glowLayers',   description: 'Number of layered plasma shell spheres',                type: 'number', min: 1,    max: 5,   step: 1    },
  { name: 'noiseAmount',  description: 'FBM surface boiling noise blend intensity',             type: 'number', min: 0,    max: 1,   step: 0.01 },
  { name: 'pulseSpeed',   description: 'Speed of the breathe/pulse animation',                  type: 'number', min: 0.1,  max: 5,   step: 0.1  },
  { name: 'coronaEnabled',description: 'Show the tilted equatorial corona ring',                type: 'boolean' },
  { name: 'innerColor',   description: 'Hot core color (solar surface)',                        type: 'color'   },
  { name: 'outerColor',   description: 'Outer atmospheric diffuse glow color',                  type: 'color'   },
  { name: 'coronaColor',  description: 'Equatorial corona ring tint color',                     type: 'color'   },
];

export const lightningEffectProperties: OptionalProperty[] = [
  { name: 'intensity',   description: 'Overall bolt brightness and glow sprite size',            type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'speed',       description: 'Bolt travel and cycle speed multiplier',                  type: 'number', min: 0.1, max: 10,  step: 0.1  },
  { name: 'opacity',     description: 'Transparency of the effect',                              type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'boltCount',   description: 'Number of simultaneous lightning bolts',                  type: 'number', min: 1,   max: 8,   step: 1    },
  { name: 'branchDepth', description: 'Fractal midpoint depth — higher = more jagged detail',   type: 'number', min: 2,   max: 6,   step: 1    },
  { name: 'strikeRadius',description: 'Distance of bolt origin from the object center',          type: 'number', min: 1,   max: 4,   step: 0.1  },
  { name: 'color',       description: 'Bolt core color (head and corona)',                       type: 'color'   },
  { name: 'glowColor',   description: 'Outer electric halo glow color',                          type: 'color'   },
];

export const auroraEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall ribbon brightness multiplier',                  type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'speed',         description: 'Ribbon wave deformation and slow rotation speed',       type: 'number', min: 0.1, max: 10,  step: 0.1  },
  { name: 'opacity',       description: 'Transparency of the ribbon planes',                     type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'ribbonCount',   description: 'Number of aurora ribbon panels in the fan arc',         type: 'number', min: 3,   max: 10,  step: 1    },
  { name: 'waveAmplitude', description: 'Horizontal wave deformation amplitude',                 type: 'number', min: 0.1, max: 1.5, step: 0.05 },
  { name: 'colorShift',    description: 'Base hue offset into aurora spectrum (0=green, 1=full cycle)', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'arcWidth',      description: 'Fan spread — 0=narrow column, 1=full circle arc',       type: 'number', min: 0.3, max: 1,   step: 0.05 },
];

export const fireEffectProperties: OptionalProperty[] = [
  { name: 'intensity',   description: 'Flame brightness (and the light it casts)',                          type: 'number', min: 0,    max: 5,   step: 0.05 },
  { name: 'speed',       description: 'How fast the flames rise and flicker',                               type: 'number', min: 0,    max: 5,   step: 0.05 },
  { name: 'turbulence',  description: 'How much the flame breaks up into licks',                            type: 'number', min: 0,    max: 4,   step: 0.05 },
  { name: 'sway',        description: 'Side-to-side lean of the flame',                                     type: 'number', min: 0,    max: 4,   step: 0.05 },
  { name: 'tint',        description: 'Colour multiplied over the blackbody flame',                          type: 'color' },
  { name: 'mode',        description: 'Tongues scatter flames over the host; Crown sits one flame on top',  type: 'select', options: ['tongues', 'crown'], optionLabels: ['Tongues', 'Crown'] },
  { name: 'coverage',    description: 'How far down the host the tongues reach (0 top only, 1 all over)',   type: 'number', min: 0,    max: 1,   step: 0.01 },
  { name: 'tongues',     description: 'Number of flame tongues over the host',                             type: 'number', min: 1,    max: 120, step: 1 },
  { name: 'radius',      description: 'Flame radius when there is no host',                                  type: 'number', min: 0.1,  max: 5,   step: 0.05 },
  { name: 'height',      description: 'Flame height when there is no host',                                  type: 'number', min: 0.1,  max: 10,  step: 0.05 },
  { name: 'radiusScale', description: 'Flame radius as a multiple of the fitted size',                       type: 'number', min: 0.1,  max: 3,   step: 0.05 },
  { name: 'heightScale', description: 'Flame height as a multiple of the fitted size',                       type: 'number', min: 0.1,  max: 4,   step: 0.05 },
  { name: 'light',       description: 'Cast a flickering point light',                                       type: 'boolean' },
];

export const forcefieldEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Hex edge glow and fresnel rim brightness',              type: 'number', min: 0,    max: 5,    step: 0.05  },
  { name: 'speed',         description: 'Ripple fire rate — higher = more frequent impacts',    type: 'number', min: 0.1,  max: 10,   step: 0.1   },
  { name: 'opacity',       description: 'Overall transparency of the shield sphere',             type: 'number', min: 0,    max: 1,    step: 0.01  },
  { name: 'hexSize',       description: 'Hex cell size — smaller = denser grid',                type: 'number', min: 0.02, max: 0.15, step: 0.005 },
  { name: 'rippleEnabled', description: 'Show expanding wave ripples from random impact points', type: 'boolean' },
  { name: 'shieldColor',   description: 'Primary hex grid line color',                           type: 'color'   },
  { name: 'rimColor',      description: 'Fresnel edge glow color',                               type: 'color'   },
];

export const neuralNetworkEffectProperties: OptionalProperty[] = [
  { name: 'intensity',   description: 'Node sphere size and glow sprite size multiplier',        type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'speed',       description: 'Animation speed multiplier for orbit and pulses',         type: 'number', min: 0.1, max: 10,  step: 0.1  },
  { name: 'opacity',     description: 'Transparency of nodes, edges, and pulse sprites',         type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'nodeCount',   description: 'Number of neural nodes distributed on a sphere cloud',    type: 'number', min: 8,   max: 40,  step: 1    },
  { name: 'signalSpeed', description: 'Speed at which synapse pulse sprites travel along edges', type: 'number', min: 0.3, max: 3,   step: 0.1  },
  { name: 'orbitSpeed',  description: 'Speed of individual node orbit rotation',                 type: 'number', min: 0.1, max: 1,   step: 0.05 },
  { name: 'nodeColor',   description: 'Node sphere and edge line tint color',                    type: 'color'   },
  { name: 'pulseColor',  description: 'Traveling signal pulse sprite color',                     type: 'color'   },
];

export const blackHoleEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall brightness',                                              type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',         description: 'Animation speed multiplier',                                      type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',       description: 'Overall opacity',                                                 type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',         description: 'Photon-ring glow colour',                                         type: 'color' },
  { name: 'diskColor',     description: 'Colour of the cooler outer disk; the inner disk runs white-hot',  type: 'color' },
  { name: 'jetEnabled',    description: 'Show the relativistic jets along the spin axis',                  type: 'boolean' },
  { name: 'jetColor',      description: 'Jet colour',                                                      type: 'color' },
  { name: 'rotationSpeed', description: 'Disk rotation speed',                                             type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'tilt',          description: 'Tilt of the disk, in degrees',                                    type: 'number', min: -90, max: 90, step: 0.5 },
  { name: 'horizonSize',   description: 'Event-horizon radius as a multiple of the bounding radius',       type: 'number', min: 0.15, max: 1, step: 0.01 },
  { name: 'diskOuter',     description: 'Outer edge of the disk, as a multiple of the bounding radius',    type: 'number', min: 1.5, max: 6, step: 0.05 },
  { name: 'lensing',       description: 'Strength of light bending; 1 is physical',                        type: 'number', min: 0, max: 1.5, step: 0.01 },
  { name: 'beaming',       description: 'Relativistic brightening of the approaching side; 1 is physical', type: 'number', min: 0, max: 1, step: 0.01 },
];

export const iceCrystalsEffectProperties: OptionalProperty[] = [
  { name: 'intensity',    description: 'Overall brightness',                                      type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',        description: 'Animation speed multiplier',                              type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',      description: 'Overall opacity',                                         type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'spikeCount',   description: 'Number of crystals',                                      type: 'number', min: 10, max: 60, step: 1 },
  { name: 'spikeLength',  description: 'Crystal size, relative to the bounding radius',           type: 'number', min: 0.3, max: 3, step: 0.05 },
  { name: 'frostEnabled', description: 'Show drifting diamond dust around the crystals',          type: 'boolean' },
  { name: 'iceColor',     description: 'Ice colour',                                              type: 'color' },
  { name: 'pulseSpeed',   description: 'How fast crystals grow, hold and sublimate',              type: 'number', min: 0, max: 3, step: 0.05 },
  { name: 'habit',        description: 'Crystal habit: 0 hexagonal plates, 1 feathery dendrites', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'branches',     description: 'Side branches per arm',                                   type: 'number', min: 0, max: 7, step: 1 },
  { name: 'sparkle',      description: 'Strength of facet glints and diamond-dust flashes',       type: 'number', min: 0, max: 2, step: 0.05 },
];

export const smokePlumeEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall brightness',                                        type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',         description: 'Animation speed multiplier',                                type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',       description: 'Overall opacity',                                           type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'particleCount', description: 'Number of smoke puffs',                                     type: 'number', min: 40, max: 600, step: 10 },
  { name: 'height',        description: 'Plume height, as a multiple of the bounding radius',        type: 'number', min: 0.5, max: 6, step: 0.05 },
  { name: 'spread',        description: 'Width of the source, as a multiple of the bounding radius', type: 'number', min: 0.1, max: 2, step: 0.01 },
  { name: 'smokeColor',    description: 'Smoke colour',                                              type: 'color' },
  { name: 'turbulence',    description: 'Strength of the billowing swirl',                           type: 'number', min: 0, max: 1.5, step: 0.01 },
  { name: 'heat',          description: 'Glowing, fire-lit base',                                    type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'wind',          description: 'Crosswind that bends the plume',                            type: 'number', min: -2, max: 2, step: 0.01 },
];

export const volumetricFogEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall brightness',                                                  type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',         description: 'Animation speed multiplier',                                          type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',       description: 'Overall opacity',                                                     type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',         description: 'Light colour',                                                        type: 'color' },
  { name: 'particleCount', description: 'Quality: ray-march samples are half this number',                     type: 'number', min: 24, max: 128, step: 1 },
  { name: 'fogRadius',     description: 'Fog bank radius, as a multiple of the bounding radius',               type: 'number', min: 0.5, max: 5, step: 0.05 },
  { name: 'driftSpeed',    description: 'How fast the fog rolls',                                              type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'fogColor',      description: 'Fog colour',                                                          type: 'color' },
  { name: 'density',       description: 'Fog density',                                                         type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'layerHeight',   description: 'Height of the fog layer, as a multiple of the bounding radius',       type: 'number', min: 0.3, max: 4, step: 0.05 },
  { name: 'anisotropy',    description: 'Forward scattering: higher glows more when looking toward the light', type: 'number', min: 0, max: 0.9, step: 0.01 },
  { name: 'noiseScale',    description: 'Size of the fog banks; higher is finer',                              type: 'number', min: 0.3, max: 4, step: 0.05 },
];

export const smokeRingEffectProperties: OptionalProperty[] = [
  { name: 'intensity',       description: 'Overall brightness',                                                       type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',           description: 'Animation speed multiplier',                                               type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',         description: 'Overall opacity',                                                          type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'ringCount',       description: 'Rings alive at once',                                                      type: 'number', min: 1, max: 4, step: 1 },
  { name: 'expansionRadius', description: 'How far rings travel before fading, as a multiple of the bounding radius', type: 'number', min: 1.2, max: 6, step: 0.05 },
  { name: 'riseSpeed',       description: 'Launch speed of each ring',                                                type: 'number', min: 0.1, max: 2, step: 0.01 },
  { name: 'intervalSeconds', description: 'Seconds between launches',                                                 type: 'number', min: 0.3, max: 10, step: 0.1 },
  { name: 'smokeColor',      description: 'Smoke colour',                                                             type: 'color' },
  { name: 'thickness',       description: 'Core thickness of each ring',                                              type: 'number', min: 0.05, max: 0.5, step: 0.01 },
  { name: 'leapfrog',        description: 'Launch rings in pairs that pass through each other',                       type: 'boolean' },
  { name: 'wobble',          description: 'How strongly rings wobble as they age',                                    type: 'number', min: 0, max: 2, step: 0.01 },
];

export const fieldLinesEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall brightness of lines and particles',            type: 'number', min: 0,   max: 5,  step: 0.05 },
  { name: 'speed',         description: 'Rotation, bounce and drift speed multiplier',          type: 'number', min: 0,   max: 5,  step: 0.05 },
  { name: 'opacity',       description: 'Transparency of the field',                            type: 'number', min: 0,   max: 1,  step: 0.01 },
  { name: 'shells',        description: 'Number of nested field shells',                        type: 'number', min: 1,   max: 8,  step: 1    },
  { name: 'linesPerShell', description: 'Field lines around each shell',                        type: 'number', min: 2,   max: 32, step: 1    },
  { name: 'extent',        description: 'Outermost shell as a multiplier of the bounding radius', type: 'number', min: 1.5, max: 6, step: 0.05 },
  { name: 'twist',         description: 'Twists the lines around the axis, like a flux rope',   type: 'number', min: -2,  max: 2,  step: 0.01 },
  { name: 'tilt',          description: 'Tilt of the magnetic axis, in degrees',                type: 'number', min: 0,   max: 45, step: 0.5  },
  { name: 'particleCount', description: 'Trapped particles bouncing along each line',           type: 'number', min: 0,   max: 40, step: 1    },
  { name: 'particleSize',  description: 'Particle sprite size',                                 type: 'number', min: 0,   max: 4,  step: 0.05 },
  { name: 'color',         description: 'Footpoint colour, where the field is strongest',       type: 'color'   },
  { name: 'apexColor',     description: 'Colour at the top of each arc, where the field is weakest', type: 'color' },
];

export const strangeAttractorEffectProperties: OptionalProperty[] = [
  { name: 'intensity',    description: 'Overall brightness of the trails',                      type: 'number', min: 0,    max: 5,   step: 0.05  },
  { name: 'speed',        description: 'Speed of the comet heads and rotation',                 type: 'number', min: 0,    max: 5,   step: 0.05  },
  { name: 'opacity',      description: 'Transparency of the trails',                            type: 'number', min: 0,    max: 1,   step: 0.01  },
  { name: 'system',       description: 'Attractor: 0 Lorenz, 1 Aizawa, 2 Thomas',              type: 'number', min: 0,    max: 2,   step: 1     },
  { name: 'strands',      description: 'Number of trajectories; they start together and drift apart', type: 'number', min: 1, max: 12, step: 1 },
  { name: 'chaos',        description: 'Pushes the system parameter; 0.5 is the textbook value', type: 'number', min: 0,   max: 1,   step: 0.01  },
  { name: 'trailLength',  description: 'Length of the bright trail, as a fraction of the path', type: 'number', min: 0.02, max: 0.6, step: 0.01  },
  { name: 'scale',        description: 'Size as a multiplier of the bounding radius',           type: 'number', min: 0.5,  max: 3,   step: 0.05  },
  { name: 'ghostOpacity', description: 'Opacity of the full path behind the trail',             type: 'number', min: 0,    max: 0.3, step: 0.005 },
  { name: 'particleSize', description: 'Size of the glowing beads at the head',                 type: 'number', min: 0,    max: 6,   step: 0.1   },
  { name: 'color',        description: 'Colour of the cool, older part of the trail',           type: 'color'   },
  { name: 'headColor',    description: 'Colour of the hot head of each trail',                  type: 'color'   },
];

export const harmonicShellEffectProperties: OptionalProperty[] = [
  { name: 'intensity',      description: 'Overall brightness of the shell',                     type: 'number', min: 0,   max: 5,    step: 0.05 },
  { name: 'speed',          description: 'How fast the harmonics morph',                        type: 'number', min: 0,   max: 5,    step: 0.05 },
  { name: 'opacity',        description: 'Transparency of the shell',                           type: 'number', min: 0,   max: 1,    step: 0.01 },
  { name: 'degree',         description: 'Highest harmonic band; higher means more lobes',     type: 'number', min: 1,   max: 4,    step: 1    },
  { name: 'amplitude',      description: 'How far the harmonics push the shell in and out',     type: 'number', min: 0,   max: 0.6,  step: 0.01 },
  { name: 'sizeMultiplier', description: 'Shell radius as a multiplier of the bounding radius', type: 'number', min: 1,   max: 3,    step: 0.05 },
  { name: 'filmThickness',  description: 'Soap-film thickness in nanometres; sets the colour bands', type: 'number', min: 100, max: 1000, step: 5 },
  { name: 'nodalLines',     description: 'Brightness of the lines where the harmonic crosses zero', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',          description: 'Base tint under the iridescence',                     type: 'color'   },
  { name: 'rimColor',       description: 'Rim and nodal-line colour',                           type: 'color'   },
];

// =============================================================================
// LOOKUP MAP — keyed by GenerativeEffectType
// =============================================================================

export const galaxyEffectProperties: OptionalProperty[] = [
  { name: 'intensity',   description: 'Overall brightness',                                      type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',       description: 'Rotation speed multiplier',                               type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',     description: 'Overall opacity',                                         type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',       description: 'Colour of the young stars that light the arms',           type: 'color' },
  { name: 'starCount',   description: 'Number of stars',                                         type: 'number', min: 2000, max: 40000, step: 500 },
  { name: 'radius',      description: 'Galaxy radius, as a multiple of the bounding radius',     type: 'number', min: 1, max: 8, step: 0.05 },
  { name: 'armTwist',    description: 'How tightly the arms wind; 0 gives a barred ellipse',     type: 'number', min: 0, max: 12, step: 0.05 },
  { name: 'ellipticity', description: 'How elongated the orbits are; stronger arms when higher', type: 'number', min: 0, max: 0.6, step: 0.01 },
  { name: 'bulgeSize',   description: 'Size of the central bulge, as a fraction of the radius',  type: 'number', min: 0, max: 0.5, step: 0.01 },
  { name: 'dust',        description: 'Darkness of the dust lanes along the arms',               type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'tilt',        description: 'Tilt of the galactic disk, in degrees',                   type: 'number', min: -90, max: 90, step: 0.5 },
  { name: 'coreColor',   description: 'Colour of the old stars in the bulge',                    type: 'color' },
];

export const fireflySwarmEffectProperties: OptionalProperty[] = [
  { name: 'intensity',  description: 'Overall brightness',                                               type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',      description: 'Simulation speed multiplier (drift and flashing)',                 type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',    description: 'Overall opacity',                                                  type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',      description: 'Colour of the faint firefly bodies between flashes',               type: 'color' },
  { name: 'count',      description: 'Number of fireflies',                                              type: 'number', min: 20, max: 400, step: 1 },
  { name: 'coupling',   description: 'How strongly neighbours pull each other into step; 0 never syncs', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'frequency',  description: 'Flashes per second',                                               type: 'number', min: 0.1, max: 2, step: 0.01 },
  { name: 'spread',     description: 'Outer radius of the swarm, as a multiple of the bounding radius',  type: 'number', min: 1.4, max: 6, step: 0.05 },
  { name: 'driftSpeed', description: 'How fast the fireflies wander',                                    type: 'number', min: 0, max: 4, step: 0.05 },
  { name: 'glowSize',   description: 'Size of the flash glow',                                           type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'flashColor', description: 'Colour of the bioluminescent flash',                               type: 'color' },
];

export const murmurationEffectProperties: OptionalProperty[] = [
  { name: 'intensity',   description: 'Overall brightness of the birds',                                                 type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',       description: 'Flight speed multiplier',                                                         type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',     description: 'Overall opacity',                                                                 type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',       description: 'Colour of the birds; dense folds of the flock read darker and denser',            type: 'color' },
  { name: 'count',       description: 'Number of birds',                                                                 type: 'number', min: 100, max: 4000, step: 10 },
  { name: 'flockRadius', description: 'Size of the airspace the flock uses, as a multiple of the bounding radius',       type: 'number', min: 1.5, max: 8, step: 0.05 },
  { name: 'cohesion',    description: 'Pull toward the centre of the nearest neighbours; high values give tight balls',  type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'alignment',   description: 'How strongly a bird matches its neighbours heading; drives the travelling waves', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'separation',  description: 'Push away from the nearest neighbours; high values thin the flock out',           type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'birdSize',    description: 'Size of each bird',                                                               type: 'number', min: 0.2, max: 4, step: 0.01 },
];

export const planetaryRingsEffectProperties: OptionalProperty[] = [
  { name: 'intensity',      description: 'Overall brightness',                                                       type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',          description: 'How fast the rings orbit',                                                 type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',        description: 'Overall opacity',                                                          type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',          description: 'Colour of the icy ring particles',                                         type: 'color' },
  { name: 'gapColor',       description: 'Colour of the thin material inside the divisions',                         type: 'color' },
  { name: 'dustColor',      description: 'Colour of the fine dust that scatters light forward',                      type: 'color' },
  { name: 'innerRadius',    description: 'Inner edge of the rings, as a multiple of the bounding radius',            type: 'number', min: 1.02, max: 4, step: 0.01 },
  { name: 'outerRadius',    description: 'Outer edge of the rings, as a multiple of the bounding radius',            type: 'number', min: 1.2, max: 8, step: 0.01 },
  { name: 'tilt',           description: 'Tilt of the ring plane, in degrees',                                       type: 'number', min: -90, max: 90, step: 0.5 },
  { name: 'moons',          description: 'Resonant moons: each one opens gaps and starts spiral density waves',      type: 'number', min: 0, max: 3, step: 1 },
  { name: 'spokes',         description: 'Faint radial dust streaks that turn with the planet, not with the orbits', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'forwardScatter', description: 'How much fine dust there is; dusty rings blaze when lit from behind',      type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'sunAngle',       description: 'Direction of the sun around the planet, in degrees',                       type: 'number', min: 0, max: 360, step: 1 },
  { name: 'sunElevation',   description: 'Height of the sun above the world horizon, in degrees',                    type: 'number', min: -60, max: 60, step: 0.5 },
];

export const waterCausticsEffectProperties: OptionalProperty[] = [
  { name: 'intensity',  description: 'Overall brightness of the caustic light',                                                                  type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',      description: 'Speed of the waves',                                                                                       type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',    description: 'Overall opacity',                                                                                          type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',      description: 'Tint of the light coming through the water',                                                               type: 'color' },
  { name: 'waterDepth', description: 'Height of the water surface above the floor, in bounding radii; deeper water gives a coarser, softer web', type: 'number', min: 0.2, max: 6, step: 0.05 },
  { name: 'waveScale',  description: 'Wavelength of the ripples, in bounding radii',                                                             type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'waveHeight', description: 'Steepness of the ripples; higher focuses the light into sharper filaments',                                type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'dispersion', description: 'Spread of the refractive index across red, green and blue (1 is real water, n = 1.327 to 1.336)',          type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'radius',     description: 'Radius of the lit floor disc, in bounding radii',                                                          type: 'number', min: 1, max: 8, step: 0.05 },
  { name: 'showOnHost', description: 'Also project the caustics onto the object itself',                                                         type: 'boolean' },
];

export const iceHaloEffectProperties: OptionalProperty[] = [
  { name: 'intensity',      description: 'Overall brightness',                                                         type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',          description: 'How fast the crystals drift',                                                type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',        description: 'Overall opacity',                                                            type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',          description: 'Tint of the light itself; the halo keeps its own refracted colours',         type: 'color' },
  { name: 'haloScale',      description: 'Angular size of the halo; 1 is the physical 22°, which fills a normal lens', type: 'number', min: 0.1, max: 1, step: 0.01 },
  { name: 'sunDogs',        description: 'Bright spots left and right of the source, on its own level',                type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'outerHalo',      description: 'The wider, fainter 46° halo from the 90° prism faces',                       type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'parhelicCircle', description: 'Faint white circle running horizontally through the source',                 type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'pillar',         description: 'Vertical streak above and below the source',                                 type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'glare',          description: 'Soft glow right around the source',                                          type: 'number', min: 0, max: 2, step: 0.01 },
];

export const fallingLeavesEffectProperties: OptionalProperty[] = [
  { name: 'intensity',   description: 'Brightness of the light on the leaves',                                 type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',       description: 'Speed of the fall',                                                     type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',     description: 'Overall opacity',                                                       type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',       description: 'Colour of the greener leaves',                                          type: 'color' },
  { name: 'leafCount',   description: 'Number of leaves in the air at once',                                   type: 'number', min: 4, max: 400, step: 2 },
  { name: 'leafSize',    description: 'Size of a leaf, as a fraction of the bounding radius',                  type: 'number', min: 0.2, max: 3, step: 0.05 },
  { name: 'fallHeight',  description: 'Height of the column the leaves fall through, in bounding radii',       type: 'number', min: 1, max: 8, step: 0.05 },
  { name: 'spread',      description: 'Radius of the column the leaves fall through, in bounding radii',       type: 'number', min: 1, max: 6, step: 0.05 },
  { name: 'tumble',      description: 'Share of leaves in the tumbling regime rather than the fluttering one', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'wind',        description: 'Strength of the sideways breeze',                                       type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'autumnColor', description: 'Colour of the turned leaves; each leaf is mixed between the two',       type: 'color' },
];

export const lichtenbergEffectProperties: OptionalProperty[] = [
  { name: 'intensity',  description: 'Overall brightness',                                                                 type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',      description: 'Animation speed multiplier',                                                         type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',    description: 'Overall opacity',                                                                    type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',      description: 'Colour of the glow around the channels',                                             type: 'color' },
  { name: 'nodeCount',  description: 'Number of sites the discharge can grow through; more gives finer branches',          type: 'number', min: 800, max: 8000, step: 100 },
  { name: 'branching',  description: 'Growth exponent η: low values give dense bushy ferns, high values sparse lightning', type: 'number', min: 0.5, max: 5, step: 0.05 },
  { name: 'growthTime', description: 'Seconds for one grow, hold and fade cycle',                                          type: 'number', min: 2, max: 30, step: 0.5 },
  { name: 'lineWidth',  description: 'Width of the channels on screen',                                                    type: 'number', min: 0.2, max: 4, step: 0.05 },
  { name: 'pulse',      description: 'Strength of the slow pulses running outward along the channels',                     type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'coreColor',  description: 'Colour of the hot core inside the thickest channels',                                type: 'color' },
];

export const dandelionSeedsEffectProperties: OptionalProperty[] = [
  { name: 'intensity',     description: 'Overall brightness',                                          type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'speed',         description: 'Simulation speed multiplier',                                 type: 'number', min: 0, max: 5, step: 0.05 },
  { name: 'opacity',       description: 'Overall opacity',                                             type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color',         description: 'Colour of the pappus filaments',                              type: 'color' },
  { name: 'seedCount',     description: 'Number of seeds on the head and in the air',                  type: 'number', min: 10, max: 260, step: 1 },
  { name: 'windSpeed',     description: 'Mean wind speed; also how quickly seeds are pulled loose',    type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'windDirection', description: 'Wind direction, in degrees around the vertical',              type: 'number', min: 0, max: 360, step: 1 },
  { name: 'turbulence',    description: 'Strength of the swirling gusts on top of the mean wind',      type: 'number', min: 0, max: 2, step: 0.01 },
  { name: 'seedSize',      description: 'Size of each seed',                                           type: 'number', min: 0.3, max: 3, step: 0.01 },
  { name: 'lift',          description: 'Updraft strength; at 1 it about cancels the seeds slow fall', type: 'number', min: 0, max: 3, step: 0.01 },
  { name: 'stemColor',     description: 'Colour of the beak and the seed body hanging below',          type: 'color' },
];

export const flaresEffectProperties: OptionalProperty[] = [
  { name: 'intensity',      description: 'Flare brightness',                                                   type: 'number', min: 0,   max: 5,    step: 0.05 },
  { name: 'speed',          description: 'How fast the bursts erupt and fade',                                type: 'number', min: 0,   max: 5,    step: 0.05 },
  { name: 'opacity',        description: 'Overall strength (additive: scales the brightness)',                type: 'number', min: 0,   max: 1,    step: 0.01 },
  { name: 'color',          description: 'Colour of the flare tips (the roots burn white-hot)',               type: 'color' },
  { name: 'radius',         description: 'Size of the flare disc, as a multiple of the host radius',          type: 'number', min: 0.1, max: 5,    step: 0.05 },
  { name: 'padding',        description: 'Extra room around the limb for the bursts to reach into',           type: 'number', min: 0.1, max: 3,    step: 0.05 },
  { name: 'shooting',       description: 'Bursts shoot out from the centre instead of rooting on the limb',  type: 'boolean' },
  { name: 'maskResolution', description: 'Resolution of the host silhouette mask, in pixels',                type: 'number', min: 128, max: 2048, step: 128 },
];

export const sparklesBurstEffectProperties: OptionalProperty[] = [
  { name: 'intensity',      description: 'Burst brightness',                          type: 'number', min: 0,   max: 5,     step: 0.05 },
  { name: 'opacity',        description: 'Overall opacity',                           type: 'number', min: 0,   max: 1,     step: 0.01 },
  { name: 'coreColor',      description: 'Colour of the bright core',                 type: 'color' },
  { name: 'burstColor',     description: 'Colour of the rays',                        type: 'color' },
  { name: 'rayCount',       description: 'Number of rays',                            type: 'number', min: 3,   max: 32,    step: 1 },
  { name: 'scale',          description: 'Size of the burst',                         type: 'number', min: 0.1, max: 20,    step: 0.1 },
  { name: 'durationMs',     description: 'Length of one burst, in milliseconds',      type: 'number', min: 200, max: 10000, step: 50 },
  { name: 'loop',           description: 'Repeat the burst',                          type: 'boolean' },
  { name: 'hoverColor',     description: 'Colour where the pointer hovers',           type: 'color' },
  { name: 'hoverRadius',    description: 'Size of the hover highlight',               type: 'number', min: 0,   max: 1.4,   step: 0.01 },
  { name: 'hoverIntensity', description: 'Strength of the hover highlight',           type: 'number', min: 0,   max: 5,     step: 0.05 },
];

export const bubblesEffectProperties: OptionalProperty[] = [
  { name: 'speed',       description: 'Time multiplier for the rise and the shimmer',  type: 'number', min: 0.05, max: 5,     step: 0.05 },
  { name: 'opacity',     description: 'Overall opacity',                               type: 'number', min: 0,    max: 1,     step: 0.01 },
  { name: 'colors',      description: 'Three thin-film colours the bubbles cycle through', type: 'color' },
  { name: 'iridescence', description: 'Strength of the thin-film colour shift',        type: 'number', min: 0,    max: 1,     step: 0.01 },
  { name: 'scale',       description: 'Bubble size',                                   type: 'number', min: 0.05, max: 10,    step: 0.05 },
  { name: 'spawnRate',   description: 'Bubbles per second',                            type: 'number', min: 0,    max: 60,    step: 1 },
  { name: 'floatSpeed',  description: 'Rise speed',                                    type: 'number', min: 0,    max: 3,     step: 0.05 },
  { name: 'lifetimeMs',  description: 'How long a bubble lives, in milliseconds',      type: 'number', min: 500,  max: 15000, step: 100 },
];

export const glyphsEffectProperties: OptionalProperty[] = [
  { name: 'intensity',        description: 'Glow brightness',                          type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'opacity',          description: 'Overall opacity',                          type: 'number', min: 0,   max: 1,   step: 0.01 },
  { name: 'ringColor',        description: 'Colour of the ring',                       type: 'color' },
  { name: 'glyphsColor',      description: 'Colour of the glyphs',                     type: 'color' },
  { name: 'shadesMultiplier', description: 'Depth of the shading inside the glyphs',   type: 'number', min: 0,   max: 3,   step: 0.05 },
  { name: 'glyphCount',       description: 'Number of glyphs around the ring',         type: 'number', min: 3,   max: 48,  step: 1 },
  { name: 'ringRadius',       description: 'Ring radius when there is no host',        type: 'number', min: 0.1, max: 20,  step: 0.1 },
  { name: 'rotationSpeed',    description: 'Ring rotation speed (negative reverses)',  type: 'number', min: -5,  max: 5,   step: 0.05 },
  { name: 'morphSpeed',       description: 'How fast the glyphs change shape',         type: 'number', min: 0,   max: 5,   step: 0.05 },
  { name: 'hoverColor',       description: 'Colour where the pointer hovers',          type: 'color' },
  { name: 'hoverRadius',      description: 'Size of the hover highlight',              type: 'number', min: 0,   max: 1.4, step: 0.01 },
  { name: 'hoverIntensity',   description: 'Strength of the hover highlight',          type: 'number', min: 0,   max: 5,   step: 0.05 },
];

export const smokeRibbonEffectProperties: OptionalProperty[] = [
  { name: 'speed',             description: 'How fast the smoke rises',                                   type: 'number', min: 0,    max: 3,  step: 0.01 },
  { name: 'density',           description: 'Smoke thickness',                                            type: 'number', min: 0,    max: 3,  step: 0.05 },
  { name: 'color',             description: 'Smoke colour at the base',                                   type: 'color' },
  { name: 'colorTop',          description: 'Smoke colour at the top',                                    type: 'color' },
  { name: 'detail',            description: 'Scale of the noise that breaks the smoke up',                type: 'number', min: 0.1,  max: 5,  step: 0.05 },
  { name: 'remapLow',          description: 'Noise floor: raise it for thinner, wispier smoke',           type: 'number', min: 0,    max: 1,  step: 0.01 },
  { name: 'remapHigh',         description: 'Noise ceiling: lower it for denser cores',                   type: 'number', min: 0,    max: 1.5, step: 0.01 },
  { name: 'edgeX',             description: 'Soft fade at the sides',                                     type: 'number', min: 0,    max: 0.5, step: 0.01 },
  { name: 'edgeY',             description: 'Soft fade at the top and bottom',                            type: 'number', min: 0,    max: 0.5, step: 0.01 },
  { name: 'twistStrength',     description: 'How far the column twists as it rises',                      type: 'number', min: 0,    max: 20, step: 0.1 },
  { name: 'twistSpeed',        description: 'How fast the twist travels',                                 type: 'number', min: 0,    max: 3,  step: 0.01 },
  { name: 'twistScale',        description: 'Vertical scale of the twist noise',                          type: 'number', min: 0.1,  max: 5,  step: 0.05 },
  { name: 'twistStart',        description: 'Height where the twist begins (0 base, 1 top)',              type: 'number', min: 0,    max: 1,  step: 0.01 },
  { name: 'width',             description: 'Ribbon width',                                               type: 'number', min: 0.1,  max: 10, step: 0.05 },
  { name: 'height',            description: 'Ribbon height',                                              type: 'number', min: 0.5,  max: 20, step: 0.1 },
  { name: 'planes',            description: 'Crossed planes for volume: 1 flat, 2 cross, 3 star',        type: 'number', min: 1,    max: 3,  step: 1 },
  { name: 'segmentsPerLength', description: 'Mesh density; keep it high so the twist bends smoothly',     type: 'number', min: 2,    max: 24, step: 1 },
  { name: 'interactive',       description: 'Lean away from the pointer on hover',                        type: 'boolean' },
];

export const EFFECT_PROPERTIES: Record<GenerativeEffectType, OptionalProperty[]> = {
  molecules:     moleculesEffectProperties,
  shockwave:     shockwaveEffectProperties,
  aura:          auraEffectProperties,
  dataStream:    dataStreamEffectProperties,
  constellation: constellationEffectProperties,
  hologram:      hologramEffectProperties,
  portal:        portalEffectProperties,
  dnaHelix:      dnaHelixEffectProperties,
  orb:           orbEffectProperties,
  lightning:     lightningEffectProperties,
  aurora:        auroraEffectProperties,
  fire:          fireEffectProperties,
  forcefield:    forcefieldEffectProperties,
  neuralNetwork: neuralNetworkEffectProperties,
  blackHole:     blackHoleEffectProperties,
  iceCrystals:   iceCrystalsEffectProperties,
  smokePlume:    smokePlumeEffectProperties,
  volumetricFog: volumetricFogEffectProperties,
  smokeRing:     smokeRingEffectProperties,
  fieldLines:       fieldLinesEffectProperties,
  strangeAttractor: strangeAttractorEffectProperties,
  harmonicShell:    harmonicShellEffectProperties,
  galaxy:           galaxyEffectProperties,
  fireflySwarm:     fireflySwarmEffectProperties,
  murmuration:      murmurationEffectProperties,
  planetaryRings:   planetaryRingsEffectProperties,
  waterCaustics:    waterCausticsEffectProperties,
  iceHalo:          iceHaloEffectProperties,
  fallingLeaves:    fallingLeavesEffectProperties,
  lichtenberg:      lichtenbergEffectProperties,
  dandelionSeeds:   dandelionSeedsEffectProperties,
  flares:           flaresEffectProperties,
  sparklesBurst:    sparklesBurstEffectProperties,
  bubbles:          bubblesEffectProperties,
  glyphs:           glyphsEffectProperties,
  smokeRibbon:      smokeRibbonEffectProperties,
};
