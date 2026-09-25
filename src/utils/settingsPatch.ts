// =============================================================================
// settingsPatch — deep partials over a settings object
// =============================================================================
//
// A *patch* is a deep partial of a scene element's settings: the same shape as the
// settings themselves, holding only what differs. Actions store one per target and
// SceneActions layers them over the authored settings at runtime (never persisted
// into the settings, never written to Redux).
//
// Rules, kept deliberately small:
//   - plain objects merge key by key, recursively;
//   - everything else (numbers, strings, booleans, arrays, null) replaces;
//   - untouched branches keep their identity, so renderers that memoise per block
//     (CloudsGenerator's deck / cirrus / quality, material application keyed on
//     materialSettings) only redo the block a patch actually changed.
//

export type SettingsPatch = Record<string, any>;

export function isPlainObject(value: unknown): value is Record<string, any> {
    if (value === null || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/** `base` with `patch` laid over it. Returns `base` itself when the patch is empty. */
export function applySettingsPatch<T>(base: T, patch: SettingsPatch | undefined | null): T {
    if (!patch || Object.keys(patch).length === 0) return base;
    if (!isPlainObject(base)) return (isPlainObject(patch) ? { ...patch } : patch) as T;
    const out: Record<string, any> = { ...(base as Record<string, any>) };
    for (const key of Object.keys(patch)) {
        const next = patch[key];
        const prev = out[key];
        out[key] = isPlainObject(next) && isPlainObject(prev) ? applySettingsPatch(prev, next) : next;
    }
    return out as T;
}

/** Several patches composed into one, later ones winning. */
export function composeSettingsPatches(patches: SettingsPatch[]): SettingsPatch | undefined {
    if (patches.length === 0) return undefined;
    return patches.reduce<SettingsPatch>((acc, p) => applySettingsPatch(acc, p), {});
}

function valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
}

/**
 * The patch that turns `base` into `next`: every leaf of `next` that differs from
 * `base`. Keys `next` dropped are ignored — a patch sets values, it does not delete.
 * `exclude` applies to top-level keys only (identity and behaviour fields).
 */
export function diffSettings(base: unknown, next: unknown, exclude: ReadonlySet<string> = new Set()): SettingsPatch {
    const out: SettingsPatch = {};
    if (!isPlainObject(next)) return out;
    const b = isPlainObject(base) ? base : {};
    for (const key of Object.keys(next)) {
        if (exclude.has(key)) continue;
        const nv = next[key];
        const bv = b[key];
        if (nv === undefined || valuesEqual(nv, bv)) continue;
        if (isPlainObject(nv) && isPlainObject(bv)) {
            const sub = diffSettings(bv, nv);
            if (Object.keys(sub).length > 0) out[key] = sub;
        } else {
            out[key] = nv;
        }
    }
    return out;
}

/** Number of leaf values a patch sets (for UI summaries). */
export function countPatchLeaves(patch: SettingsPatch | undefined | null): number {
    if (!patch) return 0;
    let n = 0;
    for (const v of Object.values(patch)) n += isPlainObject(v) ? countPatchLeaves(v) : 1;
    return n;
}
