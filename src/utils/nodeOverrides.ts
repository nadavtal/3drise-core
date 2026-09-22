// =============================================================================
// nodeOverrides — per-mesh overrides for `type: 'model'` objects
// =============================================================================
//
// Pure helpers shared by the viewer (applying overrides to a mounted model) and the
// client (editing them in ModelTree).
//
// Node keys:
//  - named node   → its name. GLB names are unique per file (GLTFLoader dedupes) and a
//                   name matches the same node in every layout copy.
//  - unnamed node → its child-index path from the model root, e.g. "/0/3/1".
//                   GLTFLoader strips '/' from names (PropertyBinding.sanitizeNodeName),
//                   so a key starting with '/' can never collide with a real name.
//                   Paths are stable across loads (the clone keeps the GLB child order)
//                   but break if the GLB is re-exported with a different hierarchy.
// The model root itself is never a key (it is transformed by meshSettings).
//
import type { Material, Object3D } from 'three';
import type { CreatedObjectSettings, ModelObjectConfig, NodeMaterialTweak, NodeOverride, NodeOverrides } from '../types/scene3d';
import { applySingleProperty } from './materialApplicationUtils';

/** Marks a material created by a node override (so it is never mistaken for a base). */
export const NODE_OVERRIDE_MATERIAL_KEY = '__nodeOverrideMaterial';

export const NODE_PATH_PREFIX = '/';

// ── Storage: createdObject.config.nodeOverrides (models only) ───────────────

/** The object's node overrides — only models have them. */
export function getNodeOverrides(createdObject: CreatedObjectSettings | null | undefined): NodeOverrides | undefined {
    if (!createdObject || createdObject.type !== 'model') return undefined;
    return (createdObject.config as ModelObjectConfig | undefined)?.nodeOverrides;
}

/** A copy of `createdObject` with `overrides` stored in its config (key dropped when empty). */
export function withNodeOverrides<T extends CreatedObjectSettings>(createdObject: T, overrides: NodeOverrides): T {
    const config: ModelObjectConfig = { ...(createdObject.config ?? {}) };
    if (Object.keys(overrides).length) config.nodeOverrides = overrides;
    else delete config.nodeOverrides;
    return { ...createdObject, config };
}


/** True for an index-path key ("/0/3/1"), false for a name key. */
export function isNodePathKey(key: string): boolean {
    return key.startsWith(NODE_PATH_PREFIX);
}

/** Key for `node` inside `root`: its name, or its index path when unnamed. Null for the root / outside nodes. */
export function nodeKeyOf(node: Object3D, root: Object3D): string | null {
    if (node === root) return null;
    if (node.name) return node.name;
    const indices: number[] = [];
    let current: Object3D | null = node;
    while (current && current !== root) {
        const parent: Object3D | null = current.parent;
        if (!parent) return null;
        indices.unshift(parent.children.indexOf(current));
        current = parent;
    }
    return current === root ? NODE_PATH_PREFIX + indices.join('/') : null;
}

/** Nodes addressed by `key` inside `root` (a path resolves to at most one node). */
export function resolveNodeKey(root: Object3D, key: string): Object3D[] {
    if (!key) return [];
    if (isNodePathKey(key)) {
        let node: Object3D | undefined = root;
        for (const part of key.slice(NODE_PATH_PREFIX.length).split('/')) {
            node = node?.children[Number(part)];
            if (!node) return [];
        }
        return node === root ? [] : [node];
    }
    return findNodesByName(root, key).filter(n => n !== root);
}

const depthIn = (node: Object3D, root: Object3D): number => {
    let d = 0;
    let n: Object3D | null = node;
    while (n && n !== root) {
        d++;
        n = n.parent;
    }
    return d;
};

/** All descendants of `root` (root included) whose name is `name`. */
export function findNodesByName(root: Object3D, name: string): Object3D[] {
    const found: Object3D[] = [];
    if (!name) return found;
    root.traverse((child) => {
        if (child.name === name) found.push(child);
    });
    return found;
}

/**
 * Map of key -> nodes for every override key, ordered shallowest first so an ancestor's
 * override is applied before a descendant's (the descendant wins).
 */
export function collectOverrideTargets(root: Object3D, overrides: NodeOverrides | undefined): Map<string, Object3D[]> {
    const found = new Map<string, Object3D[]>();
    if (!overrides) return found;
    const keys = Object.keys(overrides);
    if (keys.length === 0) return found;

    // Names in one traversal; paths resolve directly.
    const names = new Set(keys.filter(k => !isNodePathKey(k)));
    if (names.size) {
        root.traverse((child) => {
            if (child === root || !child.name || !names.has(child.name)) return;
            const list = found.get(child.name);
            if (list) list.push(child);
            else found.set(child.name, [child]);
        });
    }
    keys.filter(isNodePathKey).forEach(key => {
        const nodes = resolveNodeKey(root, key);
        if (nodes.length) found.set(key, nodes);
    });

    const ordered = [...found.entries()].sort(
        ([, a], [, b]) => depthIn(a[0], root) - depthIn(b[0], root),
    );
    return new Map(ordered);
}

/** Apply tweak params to a material in place. Keys the material does not have are skipped. */
export function applyMaterialTweak(material: Material, tweak: NodeMaterialTweak | undefined): void {
    if (!material || !tweak) return;
    for (const [key, value] of Object.entries(tweak)) {
        if (value === undefined || value === null) continue;
        if (key === 'opacity' && typeof value === 'number') {
            material.transparent = value < 1;
        }
        applySingleProperty(material, key, value);
    }
}

/** Read the tweakable params off a material (for UI defaults). */
export function readMaterialTweak(material: Material | null | undefined): NodeMaterialTweak {
    if (!material) return {};
    const m = material as any;
    const out: NodeMaterialTweak = {};
    if (m.color?.getHexString) out.color = `#${m.color.getHexString()}`;
    if (typeof m.opacity === 'number') out.opacity = m.opacity;
    if (typeof m.roughness === 'number') out.roughness = m.roughness;
    if (typeof m.metalness === 'number') out.metalness = m.metalness;
    if (m.emissive?.getHexString) out.emissive = `#${m.emissive.getHexString()}`;
    if (typeof m.emissiveIntensity === 'number') out.emissiveIntensity = m.emissiveIntensity;
    return out;
}

const isEmptyValue = (v: unknown): boolean =>
    v === undefined || (typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length === 0);

/** Drop undefined / empty fields so an override only ever stores real differences. */
function pruneOverride(override: NodeOverride): NodeOverride | null {
    const out: NodeOverride = {};
    for (const [k, v] of Object.entries(override)) {
        if (!isEmptyValue(v)) (out as any)[k] = v;
    }
    return Object.keys(out).length ? out : null;
}

/**
 * Return a new overrides record with `patch` merged into `name`'s override.
 * A patch field set to `undefined` removes that field (= back to the GLB value).
 */
export function setNodeOverride(overrides: NodeOverrides | undefined, name: string, patch: Partial<NodeOverride>): NodeOverrides {
    const next: NodeOverrides = { ...(overrides ?? {}) };
    const merged = pruneOverride({ ...(next[name] ?? {}), ...patch });
    if (merged) next[name] = merged;
    else delete next[name];
    return next;
}

/** Return a new overrides record without `name` (full reset of that mesh). */
export function removeNodeOverride(overrides: NodeOverrides | undefined, name: string): NodeOverrides {
    const next: NodeOverrides = { ...(overrides ?? {}) };
    delete next[name];
    return next;
}
