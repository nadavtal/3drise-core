import type { SpaceObjectConfig, SpaceObjectType } from "../types";

// =============================================================================
// SPACE OBJECTS — defaults, labels, animatable knobs
// =============================================================================
//
// The animatable list of each type is what its component's push point applies
// per frame (Galaxy.tsx -> Stars / Earth / SolarSystem / ShootingStars). Structural
// knobs (counts, radii), switches and ranges are never listed.
//

export const DEFAULT_SPACE_OBJECTS: Record<SpaceObjectType, SpaceObjectConfig> = {
    stars: { type: 'stars', enabled: true, count: 5000, starSize: 1, color: '#ffffff', opacity: 1 },
    earth: { type: 'earth', enabled: true, radius: 1, sunPosition: [5, 5, 5], atmosphereDayColor: '#4db2ff', atmosphereTwilightColor: '#bc490b' },
    solarSystem: { type: 'solarSystem', enabled: true, enableOrbit: true, enableSelfRotation: true, showOrbitRings: true, orbitSpeedMultiplier: 1, sunColor: '#ffd27a', sunRadius: 8, sunIntensity: 3, orbitRingColor: '#444444', orbitRingOpacity: 0.35 },
    shootingStars: { type: 'shootingStars', enabled: true, count: 10, color: '#ffffff', speedRange: [0.05, 0.15], lengthRange: [50, 150], intervalRange: [2, 5], trailLengthRange: [10, 100], followMouse: false },
};

export const SPACE_OBJECT_LABELS: Record<SpaceObjectType, string> = {
    stars: 'Stars',
    earth: 'Earth',
    solarSystem: 'Solar System',
    shootingStars: 'Shooting Stars',
};

export const SPACE_OBJECTS_ANIMATABLE: Record<SpaceObjectType, { value: string; label: string }[]> = {
    stars: [
        { value: 'color', label: 'Color' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'starSize', label: 'Star Size' },
    ],
    earth: [
        { value: 'atmosphereDayColor', label: 'Atmosphere Day Color' },
        { value: 'atmosphereTwilightColor', label: 'Atmosphere Twilight Color' },
    ],
    solarSystem: [
        { value: 'orbitSpeedMultiplier', label: 'Orbit Speed Multiplier' },
        { value: 'sunColor', label: 'Sun Color' },
        { value: 'sunIntensity', label: 'Sun Intensity' },
        { value: 'orbitRingColor', label: 'Orbit Ring Color' },
        { value: 'orbitRingOpacity', label: 'Orbit Ring Opacity' },
    ],
    shootingStars: [
        { value: 'color', label: 'Color' },
    ],
};

/** True when the config is one of the space objects (type 'space'). */
export function isSpaceObjectConfig(config: unknown): config is SpaceObjectConfig {
    const t = (config as { type?: unknown } | null | undefined)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_SPACE_OBJECTS, t);
}
