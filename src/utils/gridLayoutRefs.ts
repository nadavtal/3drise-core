// =============================================================================
// gridLayoutRefs — a grid used by reference: 'preset:<id>' or a layout asset id
// =============================================================================
//
// A place that uses a grid (the street grid's `layoutId`) stores only a reference:
//   'preset:grid:<id>' (or the older 'preset:<id>')  a built-in grid (GRID_PRESETS — utils/layoutPresets):
//                  no asset, no project link, nothing to copy on a fork;
//   <asset id>     a saved `layout` asset (kind 'grid'): the studio registers it here when the
//                  project loads it, when it is picked, and again when it is edited or re-saved.
// resolveGridLayout reads either; subscribeGridLayouts tells a consumer that waits (load order is
// not guaranteed) or follows edits that something changed. A grid-only runtime lookup for now; a
// shared registry for every layout kind comes later.
//
import type { GridLayout } from './gridLayout';
import { LAYOUT_PRESET_PREFIX, layoutPresetOfRef, layoutPresetRef } from './layoutPresets';

export const GRID_PRESET_PREFIX = LAYOUT_PRESET_PREFIX;
/** The reference to a built-in grid ('preset:grid:<id>'; the older 'preset:<id>' resolves too). */
export const gridPresetRef = (presetId: string): string => layoutPresetRef('grid', presetId);
/** The grid preset a reference names, or null (an asset id, another kind's preset, or nothing). */
export const gridPresetOfRef = (ref: string | null | undefined) => {
    const p = layoutPresetOfRef(ref);
    return p?.kind === 'grid' ? p.preset : null;
};

interface Registered { layout: GridLayout; name: string }
const assets = new Map<string, Registered>();
const listeners = new Set<() => void>();
let version = 0;
const changed = () => { version++; for (const l of [...listeners]) l(); };

/** Give the runtime a saved grid (a `layout` asset), or its new version after an edit. */
export function registerGridLayout(assetId: string, layout: GridLayout, name = 'Grid'): void {
    const had = assets.get(assetId);
    if (had && had.name === name && JSON.stringify(had.layout) === JSON.stringify(layout)) return;
    assets.set(assetId, { layout, name });
    changed();
}
export function unregisterGridLayout(assetId: string): void {
    if (assets.delete(assetId)) changed();
}
/** Is this saved grid known to the runtime (the scene uses it)? */
export const hasGridLayout = (assetId: string): boolean => assets.has(assetId);

/** The grid a reference names: a preset's layout, a registered asset's, or null (unknown or not loaded yet). */
export function resolveGridLayout(ref: string | null | undefined): GridLayout | null {
    if (!ref) return null;
    const preset = gridPresetOfRef(ref);
    if (preset) return preset.layout;
    return assets.get(ref)?.layout ?? null;
}
/** Its display name ('Classic 4 × 4', or the saved grid's name), or null. */
export function gridLayoutName(ref: string | null | undefined): string | null {
    if (!ref) return null;
    return gridPresetOfRef(ref)?.name ?? assets.get(ref)?.name ?? null;
}

/** Called after any registration change; returns the unsubscribe. */
export function subscribeGridLayouts(fn: () => void): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}
/** Bumped on every change (for useSyncExternalStore-style snapshots). */
export const gridLayoutsVersion = (): number => version;
