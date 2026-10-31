// =============================================================================
// Render view — post-processing, sun shadows and HDR as one keyed element
// =============================================================================
//
// The studio keeps these in three places: the post-processing list (an ordered
// array of { type, enabled, settings }), the sun's shadow switches on
// sky.sunSystem, and the HDR block on the environment. Nothing there has stable
// keys a script, an action or a clip track can address — so this file builds a
// keyed VIEW over them, and every consumer speaks the view:
//
//   toRenderView(sources)            the view the registry, env.get and clips read
//   patchPostProcessing(pp, patch)   a view patch laid over the stored list
//   patchSunShadows(sun, patch)      … over sky.sunSystem (castShadow / shadowMapSize)
//   patchHdr(hdr, patch)             … over the HDR block
//
// Storage does not change (saved projects and the panels keep working). An action
// patch on 'render' is a patch of this view; each renderer lays its own part of it
// over its own settings, so an action touching bloom re-renders only the composer.
//
// `time` gets the same treatment: the clock's settings are stored as
// TimeSettings (timeOfDay, timescale, …) and the sun / moon multipliers on
// sky.sunSystem; the view names them the way env.time.set and the live `time`
// target already do (hour, speed, intensity, …).
//
import type { PostProcessingState, PostProcessingSetting, PostProcessingType, ToneMappingType } from '../types/postprocessing';
import type { HdrSettings, BackgroundName } from '../types/environment';
import type { TimeSettings } from '../types/scene3d';

// ----------------------------------------------------------------------------- render

/** The post-processing effects the view exposes, by view key → stored type. */
export const RENDER_EFFECTS = {
    ssao: 'ssao',
    bloom: 'bloom',
    grading: 'color-correction',
    dof: 'depth-of-field',
    vignette: 'vignette',
} as const satisfies Record<string, PostProcessingType>;
export type RenderEffectKey = keyof typeof RENDER_EFFECTS;
export const RENDER_EFFECT_KEYS = Object.keys(RENDER_EFFECTS) as RenderEffectKey[];

export const TONE_MAPPING_TYPES: ToneMappingType[] = ['none', 'linear', 'reinhard', 'cineon', 'aces-filmic'];
export const HDR_NAMES: BackgroundName[] = ['apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'];
export const SUN_SHADOW_MAP_SIZES = ['512', '1024', '2048', '4096'] as const;

/** Each effect's settings when the stored list has none of it (the panel's own defaults). */
export const RENDER_EFFECT_DEFAULTS = {
    ssao: { radius: 0.1, intensity: 1, bias: 0.025 },
    bloom: { intensity: 1, threshold: 0.85, radius: 0.4 },
    grading: { brightness: 0, contrast: 0, saturation: 0, hue: 0 },
    dof: { focusDistance: 5, bokehScale: 2 },
    vignette: { offset: 0.5, darkness: 0.5 },
} as const;

export interface RenderView {
    /** Post-processing on at all (the panel's Enable). */
    enabled: boolean;
    toneMapping: ToneMappingType;
    exposure: number;
    ssao: { enabled: boolean; intensity: number; radius: number; bias: number };
    bloom: { enabled: boolean; intensity: number; threshold: number; radius: number };
    grading: { enabled: boolean; brightness: number; contrast: number; saturation: number; hue: number };
    dof: { enabled: boolean; focusDistance: number; bokehScale: number };
    vignette: { enabled: boolean; offset: number; darkness: number };
    shadows: { enabled: boolean; mapSize: string };
    hdr: { enabled: boolean; name: string; intensity: number; rotation: number; backgroundIntensity: number; backgroundBlur: number };
}

/** A patch of the view (what env.set builds, what an action stores for 'render'). */
export type RenderPatch = {
    [K in keyof RenderView]?: RenderView[K] extends object ? Partial<RenderView[K]> : RenderView[K];
};

export interface RenderSources {
    postProcessing?: Partial<PostProcessingState> | null;
    sunSystem?: { castShadow?: boolean; shadowMapSize?: number } | null;
    hdr?: HdrSettings | null;
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** First effect of a stored type (the view addresses one of each). */
export const findRenderEffect = (pp: Partial<PostProcessingState> | null | undefined, key: RenderEffectKey): PostProcessingSetting | undefined =>
    (pp?.effects ?? []).find(e => e.type === RENDER_EFFECTS[key]);

export function toRenderView(src: RenderSources): RenderView {
    const pp = src.postProcessing ?? {};
    const effect = <K extends RenderEffectKey>(key: K) => {
        const e = findRenderEffect(pp, key);
        const d = RENDER_EFFECT_DEFAULTS[key] as Record<string, number>;
        const s = (e?.settings ?? {}) as Record<string, unknown>;
        const out: Record<string, unknown> = { enabled: !!e?.enabled };
        for (const k of Object.keys(d)) out[k] = num(s[k], d[k]);
        return out as RenderView[K];
    };
    const hdr = src.hdr;
    const hs = hdr?.settings ?? ({} as HdrSettings['settings']);
    return {
        enabled: !!pp.globalEnabled,
        toneMapping: (pp.toneMapping?.type ?? 'aces-filmic') as ToneMappingType,
        exposure: num(pp.toneMapping?.exposure, 1),
        ssao: effect('ssao'),
        bloom: effect('bloom'),
        grading: effect('grading'),
        dof: effect('dof'),
        vignette: effect('vignette'),
        shadows: {
            enabled: src.sunSystem?.castShadow !== false,
            mapSize: String(src.sunSystem?.shadowMapSize ?? 2048),
        },
        hdr: {
            // As isHdrActive: a named preset shows while visible; uploaded files show regardless.
            enabled: !!((hdr?.visible && hdr?.name) || hdr?.urls?.length),
            name: hdr?.name ?? '',
            intensity: num(hs.environmentIntensity, 1),
            rotation: num(hs.environmentRotation, Math.PI / 2),
            backgroundIntensity: num(hs.backgroundIntensity, 1),
            backgroundBlur: num(hs.backgroundBlurriness, 0),
        },
    };
}

const STORED_ID = (type: PostProcessingType) => `post-${type}`;

/**
 * The post-processing state with a view patch laid over it. An effect the patch
 * touches but the list does not have is appended (with the view's defaults), so
 * `bloom.enabled: true` works on a project that never opened the panel. Returns
 * `pp` itself when the patch has nothing for post-processing.
 */
export function patchPostProcessing(pp: PostProcessingState, patch: RenderPatch | null | undefined): PostProcessingState {
    if (!patch) return pp;
    const touchesEffects = RENDER_EFFECT_KEYS.some(k => patch[k] && Object.keys(patch[k]!).length);
    if (patch.enabled === undefined && patch.toneMapping === undefined && patch.exposure === undefined && !touchesEffects) return pp;
    const out: PostProcessingState = { ...pp, effects: [...(pp.effects ?? [])] };
    if (patch.enabled !== undefined) out.globalEnabled = !!patch.enabled;
    if (patch.toneMapping !== undefined || patch.exposure !== undefined) {
        out.toneMapping = {
            type: (patch.toneMapping ?? pp.toneMapping?.type ?? 'aces-filmic') as ToneMappingType,
            exposure: patch.exposure ?? pp.toneMapping?.exposure ?? 1,
        };
    }
    for (const key of RENDER_EFFECT_KEYS) {
        const p = patch[key] as Record<string, unknown> | undefined;
        if (!p || !Object.keys(p).length) continue;
        const type = RENDER_EFFECTS[key];
        const i = out.effects.findIndex(e => e.type === type);
        const { enabled, ...settings } = p;
        if (i >= 0) {
            const e = out.effects[i];
            out.effects[i] = {
                ...e,
                ...(enabled !== undefined ? { enabled: !!enabled } : {}),
                settings: { ...(e.settings as object), ...settings },
            } as unknown as PostProcessingSetting;
        } else {
            out.effects.push({
                id: STORED_ID(type),
                name: key[0].toUpperCase() + key.slice(1),
                type,
                enabled: enabled !== undefined ? !!enabled : true,
                order: out.effects.length,
                settings: { ...RENDER_EFFECT_DEFAULTS[key], ...settings },
            } as PostProcessingSetting);
        }
    }
    return out;
}

/** sky.sunSystem with the view's shadow keys laid over it (`sun` itself when untouched). */
export function patchSunShadows<T extends { castShadow?: boolean; shadowMapSize?: number }>(sun: T, patch: RenderPatch | null | undefined): T {
    const s = patch?.shadows;
    if (!s || (s.enabled === undefined && s.mapSize === undefined)) return sun;
    return {
        ...sun,
        ...(s.enabled !== undefined ? { castShadow: !!s.enabled } : {}),
        ...(s.mapSize !== undefined ? { shadowMapSize: Number(s.mapSize) } : {}),
    };
}

/** The HDR block with the view's hdr keys laid over it (`hdr` itself when untouched). */
export function patchHdr(hdr: HdrSettings, patch: RenderPatch | null | undefined): HdrSettings {
    const h = patch?.hdr;
    if (!h || !Object.keys(h).length) return hdr;
    const settings = { ...hdr.settings };
    if (h.intensity !== undefined) settings.environmentIntensity = h.intensity;
    if (h.rotation !== undefined) { settings.environmentRotation = h.rotation; settings.backgroundRotation = h.rotation; }
    if (h.backgroundIntensity !== undefined) settings.backgroundIntensity = h.backgroundIntensity;
    if (h.backgroundBlur !== undefined) settings.backgroundBlurriness = h.backgroundBlur;
    const out: HdrSettings = { ...hdr, settings };
    if (h.name !== undefined) {
        out.name = (h.name || null) as BackgroundName | null;
        // A named preset replaces uploaded files; picking one means show it.
        if (h.name) { out.urls = undefined; out.visible = h.enabled ?? true; }
    }
    if (h.enabled !== undefined) out.visible = !!h.enabled;
    return out;
}

// ----------------------------------------------------------------------------- presets

export interface RenderPreset {
    name: string;
    description: string;
    /** Laid over the current view. Effects it does not name are switched off. */
    render: RenderPatch;
    /** Time of day the look is built for (Night only). */
    time?: { hour: number };
}

const OFF = { ssao: { enabled: false }, bloom: { enabled: false }, grading: { enabled: false }, dof: { enabled: false }, vignette: { enabled: false } };

export const RENDER_PRESETS: RenderPreset[] = [
    {
        name: 'Flat',
        description: 'No post-processing, no tone mapping — the raw render.',
        render: { ...OFF, enabled: false, toneMapping: 'none', exposure: 1 },
    },
    {
        name: 'Natural',
        description: 'Filmic tone mapping, soft contact shading and a touch of glow on bright highlights.',
        render: {
            ...OFF, enabled: true, toneMapping: 'aces-filmic', exposure: 1,
            ssao: { enabled: true, intensity: 0.8, radius: 0.08 },
            bloom: { enabled: true, intensity: 0.25, threshold: 0.9 },
        },
    },
    {
        name: 'Cinematic',
        description: 'Deeper contrast, warm grade, glow, a dark frame edge and a shallow focus.',
        render: {
            ...OFF, enabled: true, toneMapping: 'aces-filmic', exposure: 1.05,
            ssao: { enabled: true, intensity: 1, radius: 0.1 },
            bloom: { enabled: true, intensity: 0.6, threshold: 0.8 },
            grading: { enabled: true, contrast: 0.12, saturation: 0.08, brightness: 0, hue: 0.03 },
            vignette: { enabled: true, offset: 0.35, darkness: 0.55 },
            dof: { enabled: true, focusDistance: 8, bokehScale: 1.5 },
        },
    },
    {
        name: 'Night',
        description: 'Evening clock (21:00), lower exposure, strong glow on lights and windows, a cool grade.',
        render: {
            ...OFF, enabled: true, toneMapping: 'aces-filmic', exposure: 0.85,
            ssao: { enabled: true, intensity: 0.7, radius: 0.08 },
            bloom: { enabled: true, intensity: 1.2, threshold: 0.6 },
            grading: { enabled: true, contrast: 0.1, saturation: -0.15, brightness: -0.02, hue: -0.08 },
            vignette: { enabled: true, offset: 0.3, darkness: 0.6 },
        },
        time: { hour: 21 },
    },
];

export const getRenderPreset = (name: string): RenderPreset | undefined =>
    RENDER_PRESETS.find(p => p.name.toLowerCase() === String(name ?? '').trim().toLowerCase());

// ----------------------------------------------------------------------------- time

export interface TimeView {
    enabled: boolean;
    /** 0–24. Keys past 24 wrap (an eased 22 → 26 runs through midnight). */
    hour: number;
    animate: boolean;
    speed: number;
    realTime: boolean;
    moonPhase: number;
    /** The Sky System's multipliers (stored on sky.sunSystem; live-drivable). */
    intensity: number;
    moonIntensity: number;
    sunSize: number;
    moonSize: number;
}
export type TimePatch = Partial<TimeView>;

type SunSystemLike = { intensity?: number; moonIntensity?: number; sunSize?: number; moonSize?: number } | null | undefined;

export function toTimeView(t: Partial<TimeSettings> | null | undefined, sun?: SunSystemLike): TimeView {
    return {
        enabled: !!t?.enabled,
        hour: num(t?.timeOfDay, 12),
        animate: !!t?.autoAnimate,
        speed: num(t?.timescale, 60),
        realTime: !!t?.syncWithRealTime,
        moonPhase: num(t?.moonPhase, 0.5),
        intensity: num(sun?.intensity, 1),
        moonIntensity: num(sun?.moonIntensity, 1),
        sunSize: num(sun?.sunSize, 1),
        moonSize: num(sun?.moonSize, 1),
    };
}

/** TimeSettings with a time patch laid over it (`t` itself when untouched). */
export function patchTimeSettings<T extends Partial<TimeSettings>>(t: T, patch: TimePatch | null | undefined): T {
    if (!patch) return t;
    const out: Record<string, unknown> = {};
    if (patch.hour !== undefined) { out.timeOfDay = ((patch.hour % 24) + 24) % 24; if (patch.enabled === undefined) out.enabled = true; }
    if (patch.enabled !== undefined) out.enabled = !!patch.enabled;
    if (patch.animate !== undefined) out.autoAnimate = !!patch.animate;
    if (patch.speed !== undefined) out.timescale = patch.speed;
    if (patch.realTime !== undefined) out.syncWithRealTime = !!patch.realTime;
    if (patch.moonPhase !== undefined) out.moonPhase = ((patch.moonPhase % 1) + 1) % 1;
    return Object.keys(out).length ? { ...t, ...out } : t;
}

/** sky.sunSystem with the time patch's multipliers laid over it (`sun` itself when untouched). */
export function patchSunMultipliers<T extends object>(sun: T, patch: TimePatch | null | undefined): T {
    if (!patch) return sun;
    const out: Record<string, unknown> = {};
    for (const k of ['intensity', 'moonIntensity', 'sunSize', 'moonSize'] as const) if (patch[k] !== undefined) out[k] = patch[k];
    return Object.keys(out).length ? { ...sun, ...out } : sun;
}
