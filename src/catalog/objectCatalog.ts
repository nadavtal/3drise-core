// =============================================================================
// objectCatalog — every object type and variant, from the registry
// =============================================================================
//
// The one list the studio's Add menu and the AI read. It holds no data of its
// own: variants come from the registry's defaults tables (a key added there shows
// up here), words and starting transform / material from ./catalogInfo.
//
//   registry families  effect, particles, grid, light, environment, space, text
//                      → one variant per key of the defaults table (config = that default)
//   curated families   mesh, gallery → the entries in catalogInfo (configs there); text is both: its curated 2d / 3d
//                      entries (they carry a config) stay, then one variant per animated look in the registry
//   no variants        group, model, path
//
// Output keeps the shapes the client already uses (ObjectTypeItem /
// ObjectVariantItem), plus a permanent `key` on each variant.

import { DEFAULT_GENERATIVE_EFFECTS, GENERATIVE_EFFECT_LABELS } from '../data/effectsDefaults';
import { DEFAULT_GENERATIVE_PARTICLES, GENERATIVE_PARTICLES_LABELS } from '../data/particlesDefaults';
import { DEFAULT_GRIDS, GRID_LABELS } from '../data/gridsDefaults';
import { DEFAULT_LIGHTS, LIGHT_LABELS } from '../data/lightsDefaults';
import { DEFAULT_SPACE_OBJECTS, SPACE_OBJECT_LABELS } from '../data/spaceDefaults';
import { DEFAULT_ENVIRONMENT_OBJECTS, ENVIRONMENT_OBJECT_LABELS } from '../data/environmentDefaults';
import { DEFAULT_LAND_OBJECTS, LAND_OBJECT_LABELS } from '../data/landDefaults';
import { DEFAULT_TEXT_OBJECTS, TEXT_OBJECT_LABELS } from '../data/textDefaults';
import { CATALOG_TYPES, CATALOG_VARIANTS, type CatalogVariantInfo } from './catalogInfo';

export interface CatalogObjectType {
    id: string;
    objectTypeName: string;
    description: string;
    defaultVariant: string | null;
    iconName: string;
    order: number;
    enabled: boolean;
}

export interface CatalogObjectVariant {
    id: string;
    /** Permanent: what scenes store in config.type / shapeType / layout. */
    key: string;
    objectTypeId: string;
    objectTypeName: string;
    /** Display name. */
    name: string;
    description: string;
    tags: string[];
    /** Other names it was known by (the DB catalog's names), for old callers like the v2 AI. */
    aliases?: string[];
    defaultSettings: { config: Record<string, unknown>; transform?: Record<string, unknown>; material?: Record<string, unknown> };
}

/** `keepCurated`: catalog entries that carry their own config (the legacy 2d / 3d text) stay ahead of the registry's keys. */
type Family = { defaults: Record<string, Record<string, unknown>>; labels: Record<string, string>; keepCurated?: boolean };

/** Families whose variants ARE the keys of a registry defaults table. */
const REGISTRY_FAMILIES: Record<string, Family> = {
    effect: { defaults: DEFAULT_GENERATIVE_EFFECTS as any, labels: GENERATIVE_EFFECT_LABELS },
    particles: { defaults: DEFAULT_GENERATIVE_PARTICLES as any, labels: GENERATIVE_PARTICLES_LABELS },
    grid: { defaults: DEFAULT_GRIDS, labels: GRID_LABELS },
    light: { defaults: DEFAULT_LIGHTS, labels: LIGHT_LABELS },
    space: { defaults: DEFAULT_SPACE_OBJECTS as any, labels: SPACE_OBJECT_LABELS },
    environment: { defaults: DEFAULT_ENVIRONMENT_OBJECTS as any, labels: ENVIRONMENT_OBJECT_LABELS },
    land: { defaults: DEFAULT_LAND_OBJECTS as any, labels: LAND_OBJECT_LABELS },
    text: { defaults: DEFAULT_TEXT_OBJECTS as any, labels: TEXT_OBJECT_LABELS, keepCurated: true },
};

/** 'paw print' → 'Paw Print', 'tunnelPyramid' → 'Tunnel Pyramid'. */
const titleCase = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/(^|\s)\S/g, c => c.toUpperCase());
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

let cache: { types: CatalogObjectType[]; variants: CatalogObjectVariant[] } | null = null;

/** Every type and variant. Built once; treat the result as read-only. */
export function objectCatalog(): { types: CatalogObjectType[]; variants: CatalogObjectVariant[] } {
    if (cache) return cache;

    const types: CatalogObjectType[] = [...CATALOG_TYPES]
        .sort((a, b) => a.order - b.order)
        .map(t => ({
            id: t.legacyId ?? t.key,
            objectTypeName: t.key,
            description: t.description,
            defaultVariant: t.defaultVariant ?? null,
            iconName: t.icon,
            order: t.order,
            enabled: t.enabled,
        }));
    const typeId = new Map(types.map(t => [t.objectTypeName, t.id]));

    const variants: CatalogObjectVariant[] = [];
    const push = (type: string, key: string, name: string, info: CatalogVariantInfo | undefined, config: Record<string, unknown>) => {
        variants.push({
            id: info?.legacyId ?? `${type}/${key}`,
            key,
            objectTypeId: typeId.get(type) ?? type,
            objectTypeName: type,
            name,
            description: info?.description ?? name,
            tags: info?.tags ?? [],
            ...(info?.name && info.name !== name && info.name !== key ? { aliases: [info.name] } : {}),
            defaultSettings: {
                config: clone(config),
                ...(info?.transform ? { transform: clone(info.transform) } : {}),
                ...(info?.material ? { material: clone(info.material) } : {}),
            },
        });
    };

    for (const t of types) {
        const type = t.objectTypeName;
        const infos = CATALOG_VARIANTS[type] ?? [];
        const infoBy = new Map(infos.map(i => [i.key, i]));
        const family = REGISTRY_FAMILIES[type];
        if (family) {
            if (family.keepCurated) for (const info of infos) if (info.config && !(info.key in family.defaults)) push(type, info.key, titleCase(info.name), info, info.config);
            // Catalog order first (what was curated), then any key only the registry has.
            const keys = [...infos.map(i => i.key).filter(k => k in family.defaults),
                ...Object.keys(family.defaults).filter(k => !infoBy.has(k))];
            for (const key of keys) {
                push(type, key, family.labels[key] ?? titleCase(infoBy.get(key)?.name ?? key), infoBy.get(key), family.defaults[key]);
            }
        } else {
            for (const info of infos) push(type, info.key, titleCase(info.name), info, info.config ?? {});
        }
    }

    cache = { types, variants };
    return cache;
}
