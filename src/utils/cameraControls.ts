// =============================================================================
// Orbit controls angle limits — one normaliser for the studio and the viewer
// =============================================================================
//
// The limits used to default to ±Infinity ("no limit"). JSON has no Infinity, so a
// save stored them as null: on load they replaced the defaults, the camera panel
// (which renders by value type) hid the four fields, and nothing could set them again.
//
// "No limit" is now the full finite range — exactly what OrbitControls does with
// ±Infinity: polar 0 … π (straight down … straight up; three keeps it just inside),
// azimuth −π … π (all the way round, no wrap clamp). Radians, as OrbitControls takes them.
// Anything missing, null or not finite falls back to that range.
//
import type { ControlsConfig } from '../types/scene3d';

export const ORBIT_ANGLE_DEFAULTS = {
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    minAzimuthAngle: -Math.PI,
    maxAzimuthAngle: Math.PI,
} as const;

const finiteOr = (v: unknown, fallback: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/** The four angle limits, always finite (saved nulls and ±Infinity become the full range). */
export function orbitAngleLimits(controls: Partial<ControlsConfig> | null | undefined) {
    return {
        minPolarAngle: finiteOr(controls?.minPolarAngle, ORBIT_ANGLE_DEFAULTS.minPolarAngle),
        maxPolarAngle: finiteOr(controls?.maxPolarAngle, ORBIT_ANGLE_DEFAULTS.maxPolarAngle),
        minAzimuthAngle: finiteOr(controls?.minAzimuthAngle, ORBIT_ANGLE_DEFAULTS.minAzimuthAngle),
        maxAzimuthAngle: finiteOr(controls?.maxAzimuthAngle, ORBIT_ANGLE_DEFAULTS.maxAzimuthAngle),
    };
}

/** Controls with finite angle limits — for the store and the renderer. */
export function normalizeControls<T extends Partial<ControlsConfig>>(controls: T): T {
    return { ...controls, ...orbitAngleLimits(controls) };
}
