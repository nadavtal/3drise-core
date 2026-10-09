// Property table for the space objects (type 'space'). The registry (../registry.ts) is built on these tables.
import type { OptionalProperty } from './optionalProperties';
import type { SpaceObjectType } from '../../types/spaceObjects';

// =============================================================================
// SPACE OBJECTS OPTIONAL PROPERTIES
// Order: base numbers, variant numbers, switches / ranges, colours.
// =============================================================================

export const starsSpaceProperties: OptionalProperty[] = [
  { name: 'count', description: 'Number of stars (rebuilds the field)', type: 'number', min: 500, max: 20000, step: 100 },
  { name: 'starSize', description: 'Size of every star sprite', type: 'number', min: 0.2, max: 3, step: 0.01 },
  { name: 'opacity', description: 'Overall opacity of the starfield', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'color', description: 'Tint over the stars’ own white, blue and yellow mix', type: 'color' },
];

export const earthSpaceProperties: OptionalProperty[] = [
  { name: 'radius', description: 'Globe radius (rebuilds; scale the object to size it instead)', type: 'number', min: 0.1, max: 10, step: 0.01 },
  { name: 'sunPosition', description: 'Where the sun is, relative to the globe: sets the day side and the terminator', type: 'vector3', min: -10, max: 10, step: 0.1 },
  { name: 'atmosphereDayColor', description: 'Colour of the atmosphere rim on the day side', type: 'color' },
  { name: 'atmosphereTwilightColor', description: 'Colour of the atmosphere along the terminator', type: 'color' },
];

export const solarSystemSpaceProperties: OptionalProperty[] = [
  { name: 'orbitSpeedMultiplier', description: 'Time scale of the orbits and planet spins', type: 'number', min: 0, max: 5, step: 0.01 },
  { name: 'sunRadius', description: 'Size of the sun (rebuilds)', type: 'number', min: 1, max: 20, step: 0.1 },
  { name: 'sunIntensity', description: 'Brightness of the sun and of the light it casts on the planets', type: 'number', min: 0, max: 10, step: 0.1 },
  { name: 'orbitRingOpacity', description: 'Opacity of the orbit rings', type: 'number', min: 0, max: 1, step: 0.01 },
  { name: 'enableOrbit', description: 'Planets travel along their orbits', type: 'boolean' },
  { name: 'enableSelfRotation', description: 'Planets turn on their own axes', type: 'boolean' },
  { name: 'showOrbitRings', description: 'Draw each planet’s orbit', type: 'boolean' },
  { name: 'sunColor', description: 'Tint of the sun’s surface, corona and light', type: 'color' },
  { name: 'orbitRingColor', description: 'Colour of the orbit rings', type: 'color' },
];

export const shootingStarsSpaceProperties: OptionalProperty[] = [
  { name: 'count', description: 'Meteors in flight at once (rebuilds)', type: 'number', min: 1, max: 50, step: 1 },
  { name: 'speedRange', description: 'Min and max speed of the meteors', type: 'vector2', min: 0, max: 1, step: 0.01 },
  { name: 'lengthRange', description: 'Min and max distance a meteor travels before it fades', type: 'vector2', min: 1, max: 500, step: 1 },
  { name: 'intervalRange', description: 'Min and max seconds before a finished meteor is relaunched', type: 'vector2', min: 0, max: 30, step: 0.1, unit: 's' },
  { name: 'trailLengthRange', description: 'Min and max length of the trails', type: 'vector2', min: 2, max: 300, step: 1 },
  { name: 'followMouse', description: 'Steer the meteors toward the cursor', type: 'boolean' },
  { name: 'color', description: 'Colour of the meteors and their trails', type: 'color' },
];

export const SPACE_PROPERTIES: Record<SpaceObjectType, OptionalProperty[]> = {
  stars: starsSpaceProperties,
  earth: earthSpaceProperties,
  solarSystem: solarSystemSpaceProperties,
  shootingStars: shootingStarsSpaceProperties,
};
