import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import type { AnimationClip, Material, Object3D } from 'three';
import { gltfLoader } from './loadingManager';

/**
 * URL-keyed model cache.
 *
 * One fetch per URL for the life of the page, shared by every consumer: the project
 * loaders, the object API, and any model leaf that mounts without a preload pass. The
 * cached value is the *master* — it is never mounted into a scene. Consumers take a clone.
 *
 * Loading goes through the `gltfLoader` singleton in `loadingManager.ts`, so the Draco
 * decoder configuration and the LoadingManager progress events stay in one place.
 */

export interface ModelAsset {
    /** The master scene. Never mount this — clone it. */
    scene: Object3D;
    /** Clips shipped with the GLTF, to bind against a clone's root. */
    animations: AnimationClip[];
}

export interface ModelCacheEntry {
    url: string;
    promise: Promise<ModelAsset>;
    /** Set once the load resolves. */
    asset?: ModelAsset;
    /** Set once the load rejects. */
    error?: unknown;
}

export interface ModelInstance {
    object: Object3D;
    animations: AnimationClip[];
}

/** Marks a material this instance owns and may dispose. */
const OWNED_MATERIAL = '__3driseOwnedMaterial';

const entries = new Map<string, ModelCacheEntry>();

/**
 * Start (or join) the load of a model URL. Safe to call from anywhere, any number of
 * times — concurrent callers share one request and one master.
 */
export const loadModelAsset = (url: string): ModelCacheEntry => {
    const existing = entries.get(url);
    if (existing) return existing;

    const entry: ModelCacheEntry = {
        url,
        promise: gltfLoader
            .loadAsync(url)
            .then((gltf: any) => {
                const asset: ModelAsset = {
                    scene: gltf.scene,
                    animations: gltf.animations ?? [],
                };
                entry.asset = asset;
                return asset;
            })
            .catch((error: unknown) => {
                console.error(`[modelCache] Failed to load model: ${url}`, error);
                entry.error = error;
                throw error;
            }),
    };

    entries.set(url, entry);
    return entry;
};

/**
 * Suspense-flavoured read: returns the asset if it is already here, otherwise throws the
 * promise (React suspends) or the error (the nearest error boundary catches it).
 *
 * Call this from render, never from an effect.
 */
export const readModelAsset = (url: string): ModelAsset => {
    const entry = loadModelAsset(url);
    if (entry.error) throw entry.error;
    if (!entry.asset) throw entry.promise;
    return entry.asset;
};

/** The resolved asset if the URL is already cached, otherwise null. Never suspends. */
export const peekModelAsset = (url: string): ModelAsset | null =>
    entries.get(url)?.asset ?? null;

/**
 * Warm the cache. Never rejects — a model that fails to load is reported by the leaf that
 * needs it, not by the preload.
 */
export const preloadModels = async (urls: string[]): Promise<void> => {
    const unique = [...new Set(urls.filter(Boolean))];
    await Promise.all(
        unique.map(url => loadModelAsset(url).promise.catch(() => undefined)),
    );
};

/**
 * Clone a master for mounting.
 *
 * `SkeletonUtils.clone` rather than `Object3D.clone` so skinned meshes and their bones are
 * rebound to the copy. Geometry stays shared with the master — cheap, and never disposed by
 * an instance. Materials are cloned per instance because `useMaterialApplication` mutates
 * them per scene object; sharing them would make one object's colour change repaint every
 * instance of the same URL.
 */
export const cloneModelAsset = (asset: ModelAsset): ModelInstance => {
    const object = cloneSkeleton(asset.scene) as Object3D;

    object.traverse(child => {
        const material = (child as any).material as Material | Material[] | undefined;
        if (!material) return;
        if (Array.isArray(material)) {
            (child as any).material = material.map(m => {
                const copy = m.clone();
                copy.userData[OWNED_MATERIAL] = true;
                return copy;
            });
        } else {
            const copy = material.clone();
            copy.userData[OWNED_MATERIAL] = true;
            (child as any).material = copy;
        }
    });

    return { object, animations: asset.animations };
};

/**
 * Release what a single mounted instance owns.
 *
 * Only the per-instance material clones. Geometry and textures are reached from the cache
 * master and are shared by every other instance of that URL — disposing them here is how
 * you make every other copy of the model turn black.
 */
export const disposeModelInstance = (object: Object3D | null | undefined): void => {
    if (!object) return;
    object.traverse(child => {
        const material = (child as any).material as Material | Material[] | undefined;
        if (!material) return;
        const list = Array.isArray(material) ? material : [material];
        list.forEach(m => {
            if (m?.userData?.[OWNED_MATERIAL]) m.dispose();
        });
    });
};

/**
 * Mount/unmount bookkeeping for cloned instances.
 *
 * An instance can be mounted by one component at a time, but the *component* mounting it
 * changes more often than you would think: React StrictMode double-mounts, a re-parent in
 * the object tree remounts, and adopting a saved object's real id in place of its temp id
 * changes the React key, which unmounts one leaf and mounts another around the same
 * Object3D in a single commit.
 *
 * Disposing on the unmount half of any of those turns a model that is still on screen
 * black. So disposal is refcounted and deferred by a tick: whoever mounts next cancels it,
 * and only a release that is never followed by a retain actually frees anything.
 */
const instanceRefCounts = new Map<Object3D, number>();
const pendingDisposals = new Map<Object3D, ReturnType<typeof setTimeout>>();

/** Claim a mounted instance. Cancels a disposal another component scheduled for it. */
export const retainModelInstance = (object: Object3D | null | undefined): void => {
    if (!object) return;
    const pending = pendingDisposals.get(object);
    if (pending !== undefined) {
        clearTimeout(pending);
        pendingDisposals.delete(object);
    }
    instanceRefCounts.set(object, (instanceRefCounts.get(object) ?? 0) + 1);
};

/** Give up a mounted instance. Frees it a tick later if nothing else claims it first. */
export const releaseModelInstance = (object: Object3D | null | undefined): void => {
    if (!object) return;
    const next = (instanceRefCounts.get(object) ?? 1) - 1;
    if (next > 0) {
        instanceRefCounts.set(object, next);
        return;
    }
    instanceRefCounts.delete(object);
    if (pendingDisposals.has(object)) return;
    pendingDisposals.set(
        object,
        setTimeout(() => {
            pendingDisposals.delete(object);
            disposeModelInstance(object);
        }, 0),
    );
};

/** Drop cache entries. For tests and debugging — masters are not disposed. */
export const clearModelCache = (url?: string): void => {
    if (url) entries.delete(url);
    else entries.clear();
};

/** Diagnostics: what the cache is holding right now. */
export const modelCacheStats = (): { url: string; state: 'loading' | 'ready' | 'error' }[] =>
    [...entries.values()].map(entry => ({
        url: entry.url,
        state: entry.error ? 'error' : entry.asset ? 'ready' : 'loading',
    }));
