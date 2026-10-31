import type { WaterObjectConfig, WaterObjectType } from "../types";

// =============================================================================
// WATER OBJECTS — defaults, labels, animatable knobs (type 'water', config.type set)
// =============================================================================
//
// The only place a default lives: the viewer components, the controller, the catalog
// and the AI read it from here. Entries are appended by the integrator from each
// object spec (waterfall, fountain, stream, …). The placed water BODIES (pool, pond, …)
// live in oceanDefaults.ts — same object type, the ocean surface's schema.
//
// Animatable = exactly what the variant's push point applies per frame (flow, aeration,
// mist, splash, colours…); structural knobs (sizes, counts, kinds, the path) rebuild and
// are never listed.
//

export const DEFAULT_WATER_OBJECTS: Record<WaterObjectType, WaterObjectConfig> = {

    waterfall: { type: 'waterfall', enabled: true, width: 7, drop: 10, throw: 1.8, flow: 1, volume: 0.6, aeration: 1, surges: 0.6, turbulence: 0.6, mist: 1, spray: 0.7, opacity: 0.85, poolDepth: 9, waterColor: '#2a8a9c', foamColor: '#f1f6f8' },
    fountain: { type: 'fountain', enabled: true, kind: 'jets', pattern: 'ring', jets: 8, radius: 1.4, height: 3, tilt: 10, spin: 0, thickness: 1, breakup: 0.45, droplets: 1, splash: 1, dance: 'wave', danceSpeed: 1, bellRadius: 2.2, nozzleHeight: 0.6, tiers: 3, tierHeight: 0.9, topRadius: 0.9, spread: 1.1, basinSize: 9, basinDepth: 0.5, floor: false, tile: 0.4, waterColor: '#cfe9f2', basinColor: '#1f6f8e', foamColor: '#eef6f8' },
    stream: { type: 'stream', enabled: true, points: [[-30, -22], [-14, -14], [-2, -2], [8, 10], [22, 14], [36, 28]], width: 4.5, depth: 0.7, curve: 0.5, speed: 1, turbulence: 0.5, foam: 0.8, rocks: 4, rippleSize: 0.35, waterColor: '#2a6f6a', foamColor: '#eef6f8' },
};

export const WATER_OBJECT_LABELS: Record<WaterObjectType, string> = {

    waterfall: 'Waterfall',
    fountain: 'Fountain',
    stream: 'Stream',
};

export const WATER_OBJECTS_ANIMATABLE: Record<WaterObjectType, { value: string; label: string }[]> = {

    waterfall: [
        { value: 'throw', label: 'Throw' },
        { value: 'flow', label: 'Flow' },
        { value: 'volume', label: 'Volume' },
        { value: 'aeration', label: 'Aeration' },
        { value: 'surges', label: 'Surges' },
        { value: 'turbulence', label: 'Turbulence' },
        { value: 'mist', label: 'Mist' },
        { value: 'spray', label: 'Spray' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'waterColor', label: 'Water Color' },
        { value: 'foamColor', label: 'Foam Color' },
    ],
    fountain: [
        { value: 'danceSpeed', label: 'Dance Speed' },
        { value: 'radius', label: 'Radius' },
        { value: 'height', label: 'Height' },
        { value: 'tilt', label: 'Tilt' },
        { value: 'spin', label: 'Spin' },
        { value: 'thickness', label: 'Thickness' },
        { value: 'breakup', label: 'Breakup' },
        { value: 'splash', label: 'Splash' },
        { value: 'basinDepth', label: 'Basin Depth' },
        { value: 'tile', label: 'Tile' },
        { value: 'waterColor', label: 'Water Color' },
        { value: 'basinColor', label: 'Basin Color' },
        { value: 'foamColor', label: 'Foam Color' },
    ],
    stream: [
        { value: 'speed', label: 'Speed' },
        { value: 'turbulence', label: 'Turbulence' },
        { value: 'foam', label: 'Foam' },
        { value: 'rippleSize', label: 'Ripple Size' },
        { value: 'waterColor', label: 'Water Color' },
        { value: 'foamColor', label: 'Foam Color' },
    ],
};

/** True when the config is one of the moving-water variants (type 'water', config.type waterfall / fountain / stream…) — not a placed body (config.type 'ocean'). */
export function isWaterObjectConfig(config: unknown): config is WaterObjectConfig {
    const t = (config as { type?: unknown } | null)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_WATER_OBJECTS, t);
}
