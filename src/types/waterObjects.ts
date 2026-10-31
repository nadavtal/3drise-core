// =============================================================================
// WATER OBJECTS — moving water (object type 'water', config.type picks the variant)
// =============================================================================
//
// The `water` object type has two kinds of member. The placed BODIES (pool, pond, lake, canal)
// are the ocean surface's object host: one shader, OCEAN_SCHEMA rows, config.type 'ocean'
// (core/environment/oceanConfigs, data/oceanDefaults). The VARIANTS below are the moving
// water — a waterfall, a fountain, a stream — each its own construction in the viewer
// (components/water/core/<key>.ts, emitted from Claude outputs/water-lab), lit by the scene sun
// and sky read-only (useCloudSun), self-owned shaders (no Material tab), premultiplied blending.
//
// Size contract: REAL metres (a waterfall's lip width and drop, a fountain's apex height and
// basin diameter, a stream's width and path); the transform starts at scale 1 and places the
// water. Knobs describe the water, never move it. The variant interfaces and the unions are
// appended by the integrator from each object spec (Claude outputs/integrate).
//

export interface BaseWaterObjectConfig {
    enabled: boolean;
    /** Colour of the clear water (thin sheets, columns, the body). */
    waterColor: string;
    /** Colour of the aerated water: foam, froth, spray, mist. */
    foamColor: string;
}

export type WaterObjectType = 'waterfall' | 'fountain' | 'stream';

/** An aerated sheet of water falling from a lip into a plunge pool: ropes and surges that stretch as the water accelerates, glassy at the lip and white with foam at the foot, a boiling pool streaking foam outward, mist rising from the base and spray off the edges, lit by the scene sun and sky. Use for cliffs, gardens, hotel atriums and fantasy scenes. */
export interface WaterfallWaterConfig extends BaseWaterObjectConfig {
    type: 'waterfall';
    /** Lip width (m). */
    width: number;
    /** Fall height from the lip to the pool (m). */
    drop: number;
    /** How far the sheet lands from the wall (m): the lip speed. */
    throw: number;
    /** Speed of the fall pattern. */
    flow: number;
    /** How much of the lip carries water: threads to a solid curtain. */
    volume: number;
    /** How fast the water turns white on the way down. */
    aeration: number;
    /** Pulses travelling down the fall. */
    surges: number;
    /** Roughness of the surface: ripple break-up and foam. */
    turbulence: number;
    /** Mist rising from the foot of the fall. */
    mist: number;
    /** Droplets flung off the edges and up out of the churn. */
    spray: number;
    /** How much the thick water hides what is behind it. */
    opacity: number;
    /** Plunge pool extent away from the wall (m). */
    poolDepth: number;
}

/** Fountain water of six kinds — ballistic jets (single, ring, crown, fan), laminar glass arcs, dancing jets, a geyser column, a laminar bell and tiered bowl curtains — splashing with crowns, foam and rings into a water body, lit by the scene sun and sky. Use for plazas, hotel courtyards, gardens and parks. */
export interface FountainWaterConfig extends BaseWaterObjectConfig {
    type: 'fountain';
    /** The fountain: ballistic jets, laminar glass arcs, dancing jets, a geyser column, a laminar bell or tiered bowl curtains. */
    kind: 'jets' | 'laminar' | 'dancing' | 'geyser' | 'bell' | 'tiers';
    /** Nozzle layout of the jets, laminar and dancing kinds: one jet, a ring, a crown or a fan. */
    pattern: 'single' | 'ring' | 'crown' | 'arc';
    /** Dancing kind: how the jet heights move over time. */
    dance: 'wave' | 'chase' | 'pulse';
    /** Speed of the dancing heights. */
    danceSpeed: number;
    /** Bell kind: radius where the sheet lands (m). */
    bellRadius: number;
    /** Bell kind: nozzle height above the water (m). */
    nozzleHeight: number;
    /** Number of stacked bowls (tiers kind). */
    tiers: number;
    /** Height of each tier (m). */
    tierHeight: number;
    /** Tiers kind: radius of the top bowl (m). */
    topRadius: number;
    /** Tiers kind: each lower bowl is wider by this (m). */
    spread: number;
    /** Number of nozzles (ring, crown and fan patterns). */
    jets: number;
    /** Nozzle ring radius (m). */
    radius: number;
    /** Apex height (m). */
    height: number;
    /** Outward tilt (deg). */
    tilt: number;
    /** Rotation of the pattern (turns/min). */
    spin: number;
    /** Jet diameter. */
    thickness: number;
    /** Fraction of the flight at which the column breaks into drops. */
    breakup: number;
    /** How many droplets each jet breaks into. */
    droplets: number;
    /** Strength of the splash where the water lands: crowns, foam and rings. */
    splash: number;
    /** Diameter of the water body the fountain stands in (m). */
    basinSize: number;
    /** Water over the floor of the basin (m). */
    basinDepth: number;
    /** Draws a floor seen through the water; off, the user's own basin shows through. */
    floor: boolean;
    /** Floor tile size (m); 0 draws pebbles. */
    tile: number;
    /** Colour of the deep water in the basin. */
    basinColor: string;
}

/** Flowing water along a path of points, drawn over the user's own bed or terrain: clear at the edges and deep mid-stream, ripples advected with a channel velocity profile, foam on the banks, the outer side of bends and around rocks, lit by the scene sun and sky. Use for parks, gardens, landscapes and village scenes. */
export interface StreamWaterConfig extends BaseWaterObjectConfig {
    type: 'stream';
    /** The stream path as [x, z] metres in the object space, from source to mouth; two or more points. */
    points: [number, number][];
    /** Water width (m). */
    width: number;
    /** Mid-channel depth (m): the edges stay clear, the middle turns opaque. */
    depth: number;
    /** How rounded the path is between its points (0 straight segments .. 1 smooth). */
    curve: number;
    /** Mid-channel flow (m/s). */
    speed: number;
    /** Roughness of the surface: ripple break-up and foam. */
    turbulence: number;
    /** Foam along the banks, on the outer side of bends and around the rocks. */
    foam: number;
    /** Spots where something breaks the surface: a boiling collar and a wake downstream. */
    rocks: number;
    /** Size of the surface ripples (m). */
    rippleSize: number;
}

export type WaterObjectConfig = ({ type: 'waterfall' } & WaterfallWaterConfig) | ({ type: 'fountain' } & FountainWaterConfig) | ({ type: 'stream' } & StreamWaterConfig);
