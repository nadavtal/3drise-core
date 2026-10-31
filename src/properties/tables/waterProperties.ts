// Property table for the moving-water variants (type 'water', config.type waterfall / fountain / stream…). The registry
// (../registry.ts) is built on these tables. Rows carry a `tab` (shape / motion / colours) the water controller groups by.
// The placed water bodies (config.type 'ocean') use OCEAN_SCHEMA instead.
import type { OptionalProperty } from './optionalProperties';
import type { WaterObjectType } from '../../types/waterObjects';

// =============================================================================
// WATER OBJECTS OPTIONAL PROPERTIES — entries appended by the integrator per object spec
// =============================================================================

export const WATER_PROPERTIES: Record<WaterObjectType, OptionalProperty[]> = {

    waterfall: [
        { name: 'width', label: 'Width', description: 'Lip width (m).', type: 'number', min: 1, max: 40, step: 0.5, tab: 'shape', animatable: false },
        { name: 'drop', label: 'Drop', description: 'Fall height from the lip to the pool (m).', type: 'number', min: 1, max: 60, step: 0.5, tab: 'shape', animatable: false },
        { name: 'throw', label: 'Throw', description: 'How far the sheet lands from the wall (m): the lip speed.', type: 'number', min: 0, max: 8, step: 0.1, tab: 'shape' },
        { name: 'flow', label: 'Flow', description: 'Speed of the fall pattern.', type: 'number', min: 0.2, max: 3, step: 0.05, tab: 'motion' },
        { name: 'volume', label: 'Volume', description: 'How much of the lip carries water: threads to a solid curtain.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'motion' },
        { name: 'aeration', label: 'Aeration', description: 'How fast the water turns white on the way down.', type: 'number', min: 0, max: 2, step: 0.01, tab: 'motion' },
        { name: 'surges', label: 'Surges', description: 'Pulses travelling down the fall.', type: 'number', min: 0, max: 1.5, step: 0.01, tab: 'motion' },
        { name: 'turbulence', label: 'Turbulence', description: 'Roughness of the surface: ripple break-up and foam.', type: 'number', min: 0, max: 1.5, step: 0.01, tab: 'motion' },
        { name: 'mist', label: 'Mist', description: 'Mist rising from the foot of the fall.', type: 'number', min: 0, max: 3, step: 0.01, tab: 'motion' },
        { name: 'spray', label: 'Spray', description: 'Droplets flung off the edges and up out of the churn.', type: 'number', min: 0, max: 2, step: 0.01, tab: 'motion' },
        { name: 'opacity', label: 'Opacity', description: 'How much the thick water hides what is behind it.', type: 'number', min: 0.2, max: 1, step: 0.01, tab: 'colours' },
        { name: 'poolDepth', label: 'Pool Depth', description: 'Plunge pool extent away from the wall (m).', type: 'number', min: 2, max: 60, step: 0.5, tab: 'shape', animatable: false },
        { name: 'waterColor', label: 'Water Color', description: 'Colour of the clear water.', type: 'color', tab: 'colours' },
        { name: 'foamColor', label: 'Foam Color', description: 'Colour of the aerated water: foam, froth, spray, mist.', type: 'color', tab: 'colours' },
    ],
    fountain: [
        { name: 'kind', label: 'Kind', description: 'The fountain: ballistic jets, laminar glass arcs, dancing jets, a geyser column, a laminar bell or tiered bowl curtains.', type: 'select', options: ['jets', 'laminar', 'dancing', 'geyser', 'bell', 'tiers'], optionLabels: ['Jets', 'Laminar', 'Dancing', 'Geyser', 'Bell', 'Tiers'], tab: 'shape', animatable: false },
        { name: 'pattern', label: 'Pattern', description: 'Nozzle layout of the jets, laminar and dancing kinds: one jet, a ring, a crown or a fan.', type: 'select', options: ['single', 'ring', 'crown', 'arc'], optionLabels: ['Single', 'Ring', 'Crown', 'Arc'], tab: 'shape', animatable: false },
        { name: 'dance', label: 'Dance', description: 'Dancing kind: how the jet heights move over time.', type: 'select', options: ['wave', 'chase', 'pulse'], optionLabels: ['Wave', 'Chase', 'Pulse'], tab: 'motion', animatable: false },
        { name: 'danceSpeed', label: 'Dance Speed', description: 'Speed of the dancing heights.', type: 'number', min: 0.1, max: 4, step: 0.05, tab: 'motion' },
        { name: 'bellRadius', label: 'Bell Radius', description: 'Bell kind: radius where the sheet lands (m).', type: 'number', min: 0.5, max: 8, step: 0.1, tab: 'shape', animatable: false },
        { name: 'nozzleHeight', label: 'Nozzle Height', description: 'Bell kind: nozzle height above the water (m).', type: 'number', min: 0.1, max: 4, step: 0.05, tab: 'shape', animatable: false },
        { name: 'tiers', label: 'Tiers', description: 'Number of stacked bowls (tiers kind).', type: 'number', min: 1, max: 5, step: 1, tab: 'shape', animatable: false },
        { name: 'tierHeight', label: 'Tier Height', description: 'Height of each tier (m).', type: 'number', min: 0.3, max: 3, step: 0.05, tab: 'shape', animatable: false },
        { name: 'topRadius', label: 'Top Radius', description: 'Tiers kind: radius of the top bowl (m).', type: 'number', min: 0.3, max: 4, step: 0.05, tab: 'shape', animatable: false },
        { name: 'spread', label: 'Spread', description: 'Tiers kind: each lower bowl is wider by this (m).', type: 'number', min: 0.3, max: 4, step: 0.05, tab: 'shape', animatable: false },
        { name: 'jets', label: 'Jets', description: 'Number of nozzles (ring, crown and fan patterns).', type: 'number', min: 1, max: 24, step: 1, tab: 'shape', animatable: false },
        { name: 'radius', label: 'Radius', description: 'Nozzle ring radius (m).', type: 'number', min: 0, max: 6, step: 0.1, tab: 'shape' },
        { name: 'height', label: 'Height', description: 'Apex height (m).', type: 'number', min: 0.5, max: 12, step: 0.1, tab: 'shape' },
        { name: 'tilt', label: 'Tilt', description: 'Outward tilt (deg).', type: 'number', min: 0, max: 60, step: 1, tab: 'shape' },
        { name: 'spin', label: 'Spin', description: 'Rotation of the pattern (turns/min).', type: 'number', min: -1, max: 1, step: 0.01, tab: 'motion' },
        { name: 'thickness', label: 'Thickness', description: 'Jet diameter.', type: 'number', min: 0.3, max: 3, step: 0.05, tab: 'shape' },
        { name: 'breakup', label: 'Breakup', description: 'Fraction of the flight at which the column breaks into drops.', type: 'number', min: 0.1, max: 0.9, step: 0.01, tab: 'motion' },
        { name: 'droplets', label: 'Droplets', description: 'How many droplets each jet breaks into.', type: 'number', min: 0.2, max: 2, step: 0.05, tab: 'motion', animatable: false },
        { name: 'splash', label: 'Splash', description: 'Strength of the splash where the water lands: crowns, foam and rings.', type: 'number', min: 0, max: 2, step: 0.01, tab: 'motion' },
        { name: 'basinSize', label: 'Basin Size', description: 'Diameter of the water body the fountain stands in (m).', type: 'number', min: 2, max: 30, step: 0.5, tab: 'shape', animatable: false },
        { name: 'basinDepth', label: 'Basin Depth', description: 'Water over the floor of the basin (m).', type: 'number', min: 0.1, max: 3, step: 0.05, tab: 'shape' },
        { name: 'floor', label: 'Floor', description: 'Draws a floor seen through the water; off, the user\'s own basin shows through.', type: 'boolean', tab: 'shape', animatable: false },
        { name: 'tile', label: 'Tile', description: 'Floor tile size (m); 0 draws pebbles.', type: 'number', min: 0, max: 2, step: 0.05, tab: 'shape' },
        { name: 'waterColor', label: 'Water Color', description: 'Colour of the clear water.', type: 'color', tab: 'colours' },
        { name: 'basinColor', label: 'Basin Color', description: 'Colour of the deep water in the basin.', type: 'color', tab: 'colours' },
        { name: 'foamColor', label: 'Foam Color', description: 'Colour of the aerated water: foam, froth, spray, mist.', type: 'color', tab: 'colours' },
    ],
    stream: [
        { name: 'points', label: 'Path', description: 'The stream path as [x, z] metres in the object space, from source to mouth; two or more points.', type: 'points', tab: 'shape', animatable: false },
        { name: 'width', label: 'Width', description: 'Water width (m).', type: 'number', min: 1, max: 30, step: 0.25, tab: 'shape', animatable: false },
        { name: 'depth', label: 'Depth', description: 'Mid-channel depth (m): the edges stay clear, the middle turns opaque.', type: 'number', min: 0.1, max: 4, step: 0.05, tab: 'shape', animatable: false },
        { name: 'curve', label: 'Curve', description: 'How rounded the path is between its points (0 straight segments .. 1 smooth).', type: 'number', min: 0, max: 1, step: 0.05, tab: 'shape', animatable: false },
        { name: 'speed', label: 'Speed', description: 'Mid-channel flow (m/s).', type: 'number', min: 0, max: 5, step: 0.05, tab: 'motion' },
        { name: 'turbulence', label: 'Turbulence', description: 'Roughness of the surface: ripple break-up and foam.', type: 'number', min: 0, max: 1.5, step: 0.01, tab: 'motion' },
        { name: 'foam', label: 'Foam', description: 'Foam along the banks, on the outer side of bends and around the rocks.', type: 'number', min: 0, max: 2, step: 0.01, tab: 'motion' },
        { name: 'rocks', label: 'Rocks', description: 'Spots where something breaks the surface: a boiling collar and a wake downstream.', type: 'number', min: 0, max: 20, step: 1, tab: 'shape', animatable: false },
        { name: 'rippleSize', label: 'Ripple Size', description: 'Size of the surface ripples (m).', type: 'number', min: 0.1, max: 2, step: 0.05, tab: 'motion' },
        { name: 'waterColor', label: 'Water Color', description: 'Colour of the clear water.', type: 'color', tab: 'colours' },
        { name: 'foamColor', label: 'Foam Color', description: 'Colour of the aerated water: foam, froth, spray, mist.', type: 'color', tab: 'colours' },
    ],
};
