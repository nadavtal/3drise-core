// =============================================================================
// SPACE OBJECTS — celestial bodies and sky backdrops (object type 'space')
// =============================================================================
//
// Object type 'space'; config.type picks the variant. Rendered by Galaxy.tsx (the
// space dispatch). Every knob here is internal to the object: spinning or moving
// the whole thing is the parent's transform (a transform 'spin' effect), never a
// config knob — that is why the old stars `rotateSpeed` became a transform effect
// (migrateSpaceObject in ../utils/spaceMigration).
//

export type SpaceObjectType = 'stars' | 'earth' | 'solarSystem' | 'shootingStars';

export interface BaseSpaceObjectConfig {
    enabled: boolean;
}

/** A starfield on a unit sphere seen from inside; the transform scale sizes it. */
export interface StarsSpaceConfig extends BaseSpaceObjectConfig {
    /** Number of stars (structural: rebuilds the field). */
    count: number;
    /** Multiplier on every star's sprite size. */
    starSize: number;
    /** Tint over the stars' own white / blue / yellow mix. */
    color: string;
    opacity: number;
}

/** The textured Earth with a day / night terminator and an atmosphere rim. */
export interface EarthSpaceConfig extends BaseSpaceObjectConfig {
    /** Globe radius (structural; the transform scale is the usual way to size it). */
    radius: number;
    /** Where the sun is, relative to the globe (direction only). */
    sunPosition: [number, number, number];
    atmosphereDayColor: string;
    atmosphereTwilightColor: string;
}

/** Sun, eight planets on circular orbits, optional orbit rings. */
export interface SolarSystemSpaceConfig extends BaseSpaceObjectConfig {
    enableOrbit: boolean;
    enableSelfRotation: boolean;
    showOrbitRings: boolean;
    /** Time scale of the orbits and planet spins (integrated, so animating it never jumps). */
    orbitSpeedMultiplier: number;
    /** Tint of the sun's surface, corona and light. */
    sunColor: string;
    /** Sun radius (structural). */
    sunRadius: number;
    /** Brightness of the sun's surface and of the light it casts on the planets. */
    sunIntensity: number;
    orbitRingColor: string;
    orbitRingOpacity: number;
}

/** Meteors streaking across the sky, each relaunched after a random pause. */
export interface ShootingStarsSpaceConfig extends BaseSpaceObjectConfig {
    /** Meteors in flight at once (structural). */
    count: number;
    color: string;
    /** Min / max distance per frame. */
    speedRange: [number, number];
    /** Min / max distance a meteor travels before it fades. */
    lengthRange: [number, number];
    /** Min / max seconds before a finished meteor is relaunched. */
    intervalRange: [number, number];
    /** Min / max points in the trail. */
    trailLengthRange: [number, number];
    /** Steer the meteors toward the cursor. */
    followMouse: boolean;
}

export type SpaceObjectConfig =
    | ({ type: 'stars' } & StarsSpaceConfig)
    | ({ type: 'earth' } & EarthSpaceConfig)
    | ({ type: 'solarSystem' } & SolarSystemSpaceConfig)
    | ({ type: 'shootingStars' } & ShootingStarsSpaceConfig);
