// =============================================================================
// linkedInstances — objects that are another object's look at their own place
// =============================================================================
//
// A linked instance (meshSettings.instanceOf = the source's id) is an ordinary scene
// object row that owns only what is about WHERE it is and what it DOES:
//   name, parentId, meshSettings (transform, visible, anchor), actions (interactions),
//   mouseMove and animations on its transform, physical object effects.
// Everything about how it LOOKS is the source's: config, materialSettings, modeConfig,
// edgesSettings, visual effects, shadow flags. The viewer draws the source and all its
// linked instances in one go (utils/sharedParts — one draw per part, or mirrors for
// vegetation). The row keeps `config: { type }` (the variant key, for icons and the
// catalog) and an empty materialSettings.
//
// Rules: only mesh, model and vegetation link; a source is not itself linked and has
// no layout (layouts are the generated version of the same thing); same type and variant.
// Saved projects without the field are plain objects.
import type { CreatedObjectSettings } from "../types/scene3d";

export const LINK_CAPABLE_TYPES: ReadonlySet<string> = new Set(['mesh', 'model', 'vegetation']);

type Obj = CreatedObjectSettings;
const ms = (o: Obj | null | undefined): Record<string, any> => ((o?.meshSettings ?? {}) as Record<string, any>);

/** The source id of a linked instance, or null. */
export const linkSourceId = (o: Obj | null | undefined): string | null => {
    const id = ms(o).instanceOf;
    return typeof id === 'string' && id ? id : null;
};

/** Whether `source` can be linked to (why not, in words, otherwise). */
export function linkSourceProblem(source: Obj | null | undefined): string | null {
    if (!source) return 'The source object does not exist.';
    if (!LINK_CAPABLE_TYPES.has(source.type)) return `Only mesh, model and vegetation objects can have linked instances (this is a ${source.type}).`;
    if (linkSourceId(source)) return 'That object is itself a linked instance — link to its source instead.';
    if (ms(source).layout?.enabled) return 'An object with a layout cannot have linked instances — turn its layout off, or add copies to the layout.';
    return null;
}

/** The transform / identity fields a linked instance owns (everything else comes from its source). */
const OWN_MESH_KEYS = ['position', 'rotation', 'scale', 'visible', 'anchor', 'id', 'name', 'pivotPreset'] as const;

/** A new linked instance of `source`: its own id / name / place, the look left to the source. */
export function makeLinkedInstance(source: Obj, own: { id: string; name: string; parentId?: string | null; position?: number[]; rotation?: number[]; scale?: number[] }): Obj {
    const sm = ms(source);
    return {
        id: own.id,
        name: own.name,
        type: source.type,
        parentId: own.parentId === undefined ? source.parentId ?? null : own.parentId,
        config: { type: (source.config as any)?.type } as Obj['config'],
        materialSettings: {} as Obj['materialSettings'],
        meshSettings: {
            position: own.position ?? sm.position ?? [0, 0, 0],
            rotation: own.rotation ?? sm.rotation ?? [0, 0, 0],
            scale: own.scale ?? sm.scale ?? [1, 1, 1],
            visible: sm.visible !== false,
            id: own.id,
            name: own.name,
            instanceOf: source.id,
        } as Obj['meshSettings'],
    };
}

/**
 * The full object a linked instance draws as: the source's look at the instance's place,
 * with the instance's own identity and behaviour. Used to render it on its own (the
 * fallback when the source cannot share its drawing) and by "make unique".
 */
export function resolveLinkedLook(linked: Obj, source: Obj): Obj {
    const lm = ms(linked), sm = ms(source);
    const meshSettings: Record<string, any> = { ...sm };
    for (const k of OWN_MESH_KEYS) if (lm[k] !== undefined) meshSettings[k] = lm[k];
    delete meshSettings.instanceOf;
    delete meshSettings.layout;
    return {
        ...source,
        id: linked.id,
        name: linked.name,
        parentId: linked.parentId ?? null,
        meshSettings: meshSettings as Obj['meshSettings'],
        actions: linked.actions,
        mouseMove: linked.mouseMove,
        animations: linked.animations ?? source.animations,
        isDirty: true,
    };
}

/** "Make unique": the instance becomes a full object with the source's current look. */
export const makeUnique = (linked: Obj, source: Obj): Obj => resolveLinkedLook(linked, source);

/**
 * The source is being deleted: its first linked instance takes over as the source (it gets
 * the look), the others are re-pointed to it. Returns the objects to update (empty when
 * nothing was linked to it).
 */
export function promoteLinkedOnDelete(objects: Obj[], sourceId: string): Obj[] {
    const source = objects.find(o => o.id === sourceId);
    const linked = objects.filter(o => linkSourceId(o) === sourceId);
    if (!source || !linked.length) return [];
    const [heir, ...rest] = linked;
    const promoted = makeUnique(heir, source);
    return [
        promoted,
        ...rest.map(o => ({ ...o, meshSettings: { ...ms(o), instanceOf: heir.id } as Obj['meshSettings'], isDirty: true })),
    ];
}

/** An existing object becomes a linked instance of `source`, keeping its own name, place, parent and behaviour. */
export function linkToSource(obj: Obj, source: Obj): Obj {
    const own = ms(obj);
    const meshSettings: Record<string, any> = {};
    for (const k of OWN_MESH_KEYS) if (own[k] !== undefined) meshSettings[k] = own[k];
    meshSettings.instanceOf = source.id;
    return {
        id: obj.id,
        name: obj.name,
        type: source.type,
        parentId: obj.parentId ?? null,
        config: { type: (source.config as any)?.type } as Obj['config'],
        materialSettings: {} as Obj['materialSettings'],
        meshSettings: meshSettings as Obj['meshSettings'],
        actions: obj.actions,
        mouseMove: obj.mouseMove,
        animations: obj.animations,
        userData: obj.userData,
        isDirty: true,
    };
}

/** Whether `o` can become a linked instance (of a source with the same look): a plain object of a
 *  linkable type — not linked already, no layout, no children (`parents` = ids that have children). */
export const canBecomeInstance = (o: Obj, parents: ReadonlySet<string>): boolean =>
    LINK_CAPABLE_TYPES.has(o.type) && !linkSourceId(o) && !ms(o).layout?.enabled && !parents.has(o.id);

/** For "link identical": every object with the same look as `source` that can become its linked instance. */
export function identicalTo(source: Obj, objects: Obj[]): Obj[] {
    if (linkSourceProblem(source)) return [];
    const parents = new Set(objects.map(o => o.parentId).filter(Boolean) as string[]);
    const key = lookKey(source);
    return objects.filter(o => o.id !== source.id && canBecomeInstance(o, parents) && lookKey(o) === key);
}

/** For the tree: per object that can be a source, how many objects "link identical" would link (0s left out). */
export function identicalCounts(objects: Obj[]): Map<string, number> {
    const parents = new Set(objects.map(o => o.parentId).filter(Boolean) as string[]);
    const byLook = new Map<string, number>();
    const keyOf = new Map<string, string>();
    for (const o of objects) {
        if (!canBecomeInstance(o, parents)) continue;
        const k = lookKey(o);
        keyOf.set(o.id, k);
        byLook.set(k, (byLook.get(k) ?? 0) + 1);
    }
    const out = new Map<string, number>();
    for (const o of objects) {
        if (!LINK_CAPABLE_TYPES.has(o.type) || linkSourceProblem(o)) continue;
        const k = keyOf.get(o.id) ?? lookKey(o);
        const n = (byLook.get(k) ?? 0) - (keyOf.has(o.id) ? 1 : 0);
        if (n > 0) out.set(o.id, n);
    }
    return out;
}

/** The look of an object as one string: type, config, material, mode, edges, shadow flags — and for a
 *  model its file (userData.url: two different GLBs with default materials are not identical). */
export const lookKey = (o: Obj): string =>
    JSON.stringify([o.type, o.type === 'model' ? (o.userData as any)?.url ?? null : null, o.config ?? null, o.layout?.shape ?? null, o.materialSettings ?? null, o.modeConfig ?? null, o.edgesSettings ?? null, ms(o).castShadow ?? null, ms(o).receiveShadow ?? null]);

/** The look fields of two objects match (same type, variant, config, material, mode) — "link identical". */
export function sameLook(a: Obj, b: Obj): boolean {
    return LINK_CAPABLE_TYPES.has(a.type) && lookKey(a) === lookKey(b);
}
