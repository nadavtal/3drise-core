// =============================================================================
// lightShadowDefaults — what a light object's shadow is when its config says nothing
// =============================================================================
//
// One table for the renderer (viewer useLightShadow) and the studio (Shadow tab,
// Transform tab toggle), so what the panel shows is what renders. A saved light
// usually has no `config.shadow`, or only the keys someone changed: the rest comes
// from here, per light type (`resolveLightShadow`).
//
// Point-type lights (point, bulb, LED array, tube, candle) are OFF by default: a
// point shadow renders every caster in range six more times per frame (one per cube
// face), and lights like these come in groups. When switched on they start at a
// 256 map — enough for a fixture's soft shadow. Directional and spot shadows are one
// extra pass each and stay on.
//
import type { DirectionalShadowSettings, LightType, PointShadowSettings, ShadowSettings, SpotShadowSettings } from '../types/lights';

export const DEFAULT_DIRECTIONAL_SHADOW: DirectionalShadowSettings = {
    enabled: true,
    mapSize: 2048,
    bias: -0.0001,
    normalBias: 0,
    radius: 1,
    intensity: 1,
    cameraNear: 0.5,
    cameraFar: 500,
    cameraLeft: -50,
    cameraRight: 50,
    cameraTop: 50,
    cameraBottom: -50,
};

export const DEFAULT_SPOT_SHADOW: SpotShadowSettings = {
    enabled: true,
    mapSize: 1024,
    bias: -0.0001,
    normalBias: 0,
    radius: 1,
    intensity: 1,
    cameraNear: 0.5,
    cameraFar: 500,
    cameraFov: 50,
    focus: 1,
};

export const DEFAULT_POINT_SHADOW: PointShadowSettings = {
    enabled: false,
    mapSize: 256,
    bias: -0.0001,
    normalBias: 0,
    radius: 1,
    intensity: 1,
    cameraNear: 0.5,
    cameraFar: 100,
};

// A bulb's screw base sits a few centimetres from the light: the point
// light's default near (0.5) would clip it out of the shadow map.
export const DEFAULT_LIGHT_BULB_SHADOW: PointShadowSettings = {
    ...DEFAULT_POINT_SHADOW,
    cameraNear: 0.05,
};

// A candle's own wax is centimetres from the flame, so the shadow camera has to
// start almost at the light.
export const DEFAULT_CANDLE_SHADOW: PointShadowSettings = {
    ...DEFAULT_POINT_SHADOW,
    cameraNear: 0.01,
    cameraFar: 6,
    radius: 4,
};

// The dies sit millimetres from the light.
export const DEFAULT_LED_ARRAY_SHADOW: PointShadowSettings = {
    ...DEFAULT_POINT_SHADOW,
    cameraNear: 0.02,
};

// The shadow comes from the point light at the middle of the fixture. A source
// that size never casts a hard edge, hence the radius.
export const DEFAULT_FLUORESCENT_SHADOW: PointShadowSettings = {
    ...DEFAULT_POINT_SHADOW,
    cameraNear: 0.05,
    radius: 5,
};

// The beam's emitter sits right on the light, so the shadow camera has to start
// closer than the spot default of 0.5 or the source clips itself out.
export const DEFAULT_SPOT_BEAM_SHADOW: SpotShadowSettings = {
    ...DEFAULT_SPOT_SHADOW,
    cameraNear: 0.05,
    cameraFov: 60,
};

const BY_TYPE: Partial<Record<LightType, ShadowSettings>> = {
    directional: DEFAULT_DIRECTIONAL_SHADOW,
    spot: DEFAULT_SPOT_SHADOW,
    point: DEFAULT_POINT_SHADOW,
    lightBulb: DEFAULT_LIGHT_BULB_SHADOW,
    spotBeam: DEFAULT_SPOT_BEAM_SHADOW,
    ledArray: DEFAULT_LED_ARRAY_SHADOW,
    fluorescentTube: DEFAULT_FLUORESCENT_SHADOW,
    candle: DEFAULT_CANDLE_SHADOW,
    // ambient: no shadow
};

/** The type's shadow defaults; null for a light that casts none (ambient). */
export function getDefaultLightShadow(type: LightType | string | undefined): ShadowSettings | null {
    return (type && BY_TYPE[type as LightType]) || null;
}

/** The shadow a light renders with: its saved keys over its type's defaults (unset keys skipped). */
export function resolveLightShadow(type: LightType | string | undefined, shadow: ShadowSettings | Record<string, unknown> | undefined | null): ShadowSettings & Record<string, unknown> {
    const out: Record<string, unknown> = { ...(getDefaultLightShadow(type) ?? { enabled: false }) };
    for (const [k, v] of Object.entries(shadow ?? {})) if (v !== undefined) out[k] = v;
    return out as ShadowSettings & Record<string, unknown>;
}
