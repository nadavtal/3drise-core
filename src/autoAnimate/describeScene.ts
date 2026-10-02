// =============================================================================
// describeScene — the ONE description of the scene every AI request carries.
// =============================================================================
//
// analyzeScene (layout, roles, groups, hero) + the property registry (every
// element's keyable tracks and settable properties, with current values and
// bounds) in one compact, rounded shape. The client sends it as the request's
// `scene`; the aiAgent mirrors these types (utils/v2/sceneAnalysis.ts — keep them
// in step).
//
//   scene        scale / ground / bounds / hero / counts — size every magnitude by `scale`
//   camera       pose, viewport at ground, keyable paths
//   environment  sky / clouds / ocean / terrain: present? on? kind / preset, and — when
//                on — current values as tracks (keyable) + patch (action-only)
//   background   HDRI preset name
//   groups       cascade orders
//   objects      EVERY object (each consumer filters): role, saved, visible, hierarchy,
//                transform, world bounds, material, and
//                  tracks  what a clip can key (getTrackSpecs) with value / range
//                  patch   config / environment properties only an instant change can set
//
// Pure like analyzeScene: live bounds and the viewport are injected by the caller.
// Model nodes are left out (node animation has its own path).
//
import { analyzeScene } from './sceneAnalyzer';
import type { AnalyzeOptions, SceneInput } from './types';
import { describeProperties, getTrackSpecs } from '../properties/registry';
import type { DescribedProperty, PropertyElement } from '../properties/types';

export type PropKind = 'vec3' | 'number' | 'color' | 'boolean' | 'select' | 'string';

export interface PropContext {
    path: string;
    kind: PropKind;
    /** Authored value. */
    value?: unknown;
    min?: number;
    max?: number;
    options?: string[];
}

export interface ElementContext {
    tracks: PropContext[];
    patch: PropContext[];
}

export interface ObjectContext extends ElementContext {
    id: string;
    name: string;
    type: string;
    /** config.type (light / particles / effect / grid kind, shape name). */
    subType?: string;
    role: string;
    /** Has a real (saved) id — only saved objects can be referenced by animations. */
    saved: boolean;
    visible: boolean;
    groupId?: string;
    parentId?: string;
    childIds?: string[];
    /** Authored local transform. */
    position: number[];
    rotation: number[];
    scale: number[];
    /** World bounds. */
    center: number[];
    size: number[];
    fadeable: boolean;
    material?: { type?: string; variant?: string; color?: string };
}

export type EnvironmentKey = 'sky' | 'clouds' | 'ocean' | 'terrain';

export interface EnvironmentContext extends ElementContext {
    /** The element exists in the scene (configured), on or off. */
    present: boolean;
    on: boolean;
    /** deckType / waterType / terrainType. */
    kind?: string;
    preset?: string;
    /** Ocean: 'world' | 'object'… */
    host?: string;
    /** Clouds: the high ice layer. */
    cirrus?: { on: boolean; preset?: string };
}

export interface SceneAnalysis {
    version: 2;
    scene: {
        scale: number;
        ground: number;
        center: number[];
        size: number[];
        heroId: string | null;
        countsByType: Record<string, number>;
    };
    camera: ElementContext & {
        position: number[];
        target: number[];
        fov: number;
        distance: number;
        /** Visible area on the ground plane (y = 0), 0 when no camera is mounted. */
        viewport: { visibleWidth: number; visibleHeight: number };
    };
    environment: Record<EnvironmentKey, EnvironmentContext>;
    background: { hdri: string | null };
    groups: Array<{ id: string; kind: string; axis: string; order: string[]; radialOrder: string[] }>;
    objects: ObjectContext[];
}

export interface DescribeSceneInput extends SceneInput {
    /** HDR background settings (`name` is the preset). */
    hdr?: any;
}

export interface DescribeOptions extends AnalyzeOptions {
    /** Visible area on the ground plane (viewer camera), when mounted. */
    viewport?: { visibleWidth: number; visibleHeight: number } | null;
}

// --- helpers --------------------------------------------------------------------

const r = (n: unknown): number => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : 0;
};
const rv = (v: readonly number[] | undefined): number[] => (v ?? []).map(r);
const roundValue = (v: unknown): unknown => (Array.isArray(v) ? v.map(r) : typeof v === 'number' ? r(v) : v);

/** Registry kinds the AI can write; strings, vec2 and textures are not offered. */
const PROP_KINDS = new Set<PropKind>(['vec3', 'number', 'color', 'boolean', 'select']);

/** Families whose set-only properties go out as patch (transform / material / edges / shadow are not offered). */
const PATCH_DOMAINS = new Set(['light', 'particles', 'effect', 'grid', 'rain', 'clouds', 'config', 'sky', 'cirrus', 'ocean', 'terrain']);

const toProp = (p: DescribedProperty): PropContext | null => {
    if (!PROP_KINDS.has(p.kind as PropKind)) return null;
    const out: PropContext = { path: p.key, kind: p.kind as PropKind, value: roundValue(p.value) };
    if (p.min !== undefined) out.min = p.min;
    if (p.max !== undefined) out.max = p.max;
    if (p.options?.length) out.options = p.options.map(o => o.value);
    return out;
};

/** tracks = what a clip keys (with values and bounds); patch = the element's other settable properties. */
function elementProps(element: PropertyElement, settings: any): ElementContext {
    const described = new Map(describeProperties(element, settings).map(p => [p.key, p]));
    const trackPaths = getTrackSpecs(element, settings).map(s => s.key);
    const keyed = new Set(trackPaths);
    const tracks: PropContext[] = [];
    for (const path of trackPaths) {
        const p = described.get(path);
        const prop = p && toProp(p);
        if (prop) tracks.push(prop);
    }
    const patch: PropContext[] = [];
    for (const p of described.values()) {
        if (keyed.has(p.key) || !PATCH_DOMAINS.has(p.domain)) continue;
        const prop = toProp(p);
        if (prop) patch.push(prop);
    }
    return { tracks, patch };
}

/** One environment element: always its identity; values only when it is on (they are what an animation / change can touch). */
function environmentOf(key: EnvironmentKey, settings: any, on: boolean): EnvironmentContext {
    const cfg = key === 'sky' ? settings : settings?.config;
    const present =
        key === 'sky' ? !!settings
            : key === 'ocean' ? !!(cfg && typeof cfg === 'object' && cfg.waveModel)
                : !!(cfg && typeof cfg === 'object');
    const kind = key === 'clouds' ? cfg?.deckType : key === 'ocean' ? cfg?.waterType : key === 'terrain' ? cfg?.terrainType : undefined;
    const values = on ? elementProps(key, settings) : { tracks: [], patch: [] };
    return {
        present,
        on,
        ...(kind ? { kind } : {}),
        ...(cfg?.preset ? { preset: cfg.preset } : {}),
        ...(key === 'ocean' && cfg?.host ? { host: cfg.host } : {}),
        ...(key === 'clouds' && settings?.cirrus ? { cirrus: { on: settings.cirrus.enabled !== false, ...(settings.cirrus.preset ? { preset: settings.cirrus.preset } : {}) } } : {}),
        ...values,
    };
}

function materialOf(obj: any): ObjectContext['material'] {
    const ms = obj?.materialSettings;
    if (!ms?.materialType && !ms?.color) return undefined;
    return {
        ...(ms.materialType ? { type: ms.materialType } : {}),
        ...(ms.materialVariant ? { variant: ms.materialVariant } : {}),
        ...(typeof ms.color === 'string' ? { color: ms.color } : {}),
    };
}

// --- main ---------------------------------------------------------------------------

export function describeScene(input: DescribeSceneInput, options: DescribeOptions = {}): SceneAnalysis {
    // Live bounds, no model nodes.
    const profile = analyzeScene(input, { measure: options.measure });
    const byId = new Map((input.objects ?? []).filter((o: any) => o && typeof o.id === 'string').map((o: any) => [o.id, o]));

    const objects: ObjectContext[] = [];
    for (const p of profile.objects) {
        const obj = byId.get(p.id);
        if (!obj) continue;
        const material = materialOf(obj);
        objects.push({
            id: p.id,
            name: p.name,
            type: p.type,
            ...(obj.config?.type ? { subType: obj.config.type } : {}),
            role: p.role,
            saved: p.saved,
            visible: p.visible,
            ...(p.groupId ? { groupId: p.groupId } : {}),
            ...(p.parentId ? { parentId: p.parentId } : {}),
            ...(p.childIds.length ? { childIds: p.childIds } : {}),
            position: rv(p.position),
            rotation: rv(p.rotation),
            scale: rv(p.scale),
            center: rv(p.bounds.center),
            size: rv(p.bounds.size),
            fadeable: p.capabilities.fadeable,
            ...(material ? { material } : {}),
            ...elementProps('object', obj),
        });
    }

    const countsByType: Record<string, number> = {};
    Object.entries(profile.countsByType).forEach(([k, v]) => { if (v) countsByType[k] = v; });

    const vp = options.viewport;
    return {
        version: 2,
        scene: {
            scale: r(profile.scale),
            ground: r(profile.ground),
            center: rv(profile.bounds.center),
            size: rv(profile.bounds.size),
            heroId: profile.heroId,
            countsByType,
        },
        camera: {
            position: rv(profile.camera.position),
            target: rv(profile.camera.target),
            fov: r(profile.camera.fov),
            distance: r(profile.camera.distance),
            viewport: vp ? { visibleWidth: r(vp.visibleWidth), visibleHeight: r(vp.visibleHeight) } : { visibleWidth: 0, visibleHeight: 0 },
            tracks: elementProps('camera', input.camera ?? {}).tracks,
            patch: [],
        },
        environment: {
            sky: environmentOf('sky', input.sky, profile.environment.sky),
            clouds: environmentOf('clouds', input.clouds, profile.environment.clouds),
            ocean: environmentOf('ocean', input.ocean, profile.environment.ocean),
            terrain: environmentOf('terrain', input.terrain, profile.environment.terrain),
        },
        background: { hdri: input.hdr?.name ?? null },
        groups: profile.groups.map(g => ({ id: g.id, kind: g.kind, axis: g.axis, order: g.order, radialOrder: g.radialOrder })),
        objects,
    };
}
