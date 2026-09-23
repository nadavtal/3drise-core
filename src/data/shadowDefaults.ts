// =============================================================================
// shadowDefaults — what castShadow / receiveShadow mean when nothing says
// =============================================================================
//
// `meshSettings.castShadow` / `receiveShadow` are optional, and most saved
// objects have neither: `MeshSettings` never carried them (only BaseMeshOptions
// / ModelData do), so nothing writes them until someone toggles them by hand.
// Reading them as `false` switched shadows off for every object in every saved
// project — a GLB even had the loader's own flags reset out from under it.
//
// So an unset flag falls back per object type: the things a scene expects to
// light each other default to on, and the ones that own their shadow behaviour
// (or cost too much) default to off. An explicit value in meshSettings always
// wins, so nothing overrides a deliberate choice.
//
export interface ShadowFlags {
    castShadow: boolean;
    receiveShadow: boolean;
}

const ON: ShadowFlags = { castShadow: true, receiveShadow: true };
const OFF: ShadowFlags = { castShadow: false, receiveShadow: false };

export const DEFAULT_OBJECT_SHADOWS: Record<string, ShadowFlags> = {
    // Solid objects: the scene's shadow casters and catchers.
    mesh: ON,
    model: ON,
    text: ON,
    gallery: ON,
    // Shader planes, generative systems and volumes own their look; a shader
    // plane in a shadow map is a large black slab and costs a full extra pass.
    grid: OFF,
    effect: OFF,
    particles: OFF,
    space: OFF,
    path: OFF,
    // The landscape has its own quality.castShadows switch; the light object's
    // fixture decides for itself (LightBulb: only the screw base casts).
    landscape: OFF,
    light: OFF,
    // Water catches shadows but casting from the surface reads as dirt.
    ocean: { castShadow: false, receiveShadow: true },
};

const FALLBACK: ShadowFlags = ON;

/** The flags to apply for this object: explicit values win, then the type's default. */
export function resolveShadowFlags(
    type: string | undefined,
    meshSettings: { castShadow?: boolean; receiveShadow?: boolean } | undefined | null,
): ShadowFlags {
    const defaults = (type && DEFAULT_OBJECT_SHADOWS[type]) || FALLBACK;
    return {
        castShadow: meshSettings?.castShadow ?? defaults.castShadow,
        receiveShadow: meshSettings?.receiveShadow ?? defaults.receiveShadow,
    };
}
