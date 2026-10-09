/**
 * THE sun direction convention for 3drise. Every piece that turns an
 * elevation/azimuth pair into a direction — the Preetham sky, the key light,
 * the day-cycle clock, the clouds, the ocean, the terrain, the lighting rig —
 * goes through `sunDirectionFromAngles`, so the sun that is drawn and the sun
 * that lights the scene cannot disagree.
 *
 *   elevation  degrees above the horizon (90 = straight up, negative = below)
 *   azimuth    degrees around +Y, measured from +X towards +Z
 *              (0 → +X, 90 → +Z, 180 → −X, −90 → −Z)
 *
 * There used to be two conventions: this one (Preetham sky, LightsManager) and
 * x = sin(az), z = cos(az) (the clock, the skybox shader, useCloudSun), which
 * mirrored the lit sun across the x = z plane — up to 137° away from the disc.
 */

export interface Vec3Like {
    x: number;
    y: number;
    z: number;
}

const DEG = Math.PI / 180;

/** Unit vector toward the sun. Writes into `out` when given (a THREE.Vector3
 *  works), so per-frame callers allocate nothing. */
export function sunDirectionFromAngles<T extends Vec3Like = Vec3Like>(elevation: number, azimuth: number, out?: T): T {
    const el = elevation * DEG;
    const az = azimuth * DEG;
    const c = Math.cos(el);
    const target = (out ?? { x: 0, y: 0, z: 0 }) as T;
    target.x = c * Math.cos(az);
    target.y = Math.sin(el);
    target.z = c * Math.sin(az);
    return target;
}

/** Inverse of `sunDirectionFromAngles`. The vector need not be normalised. */
export function sunAnglesFromDirection(dir: Vec3Like): { elevation: number; azimuth: number } {
    const r = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
    return {
        elevation: Math.asin(Math.max(-1, Math.min(1, dir.y / r))) / DEG,
        azimuth: Math.atan2(dir.z, dir.x) / DEG,
    };
}

/** Kept for existing callers; same convention. */
export function createSunPosition(elevation: number, azimuth: number): Vec3Like {
    return sunDirectionFromAngles(elevation, azimuth);
}
