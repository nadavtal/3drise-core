// =============================================================================
// layoutRefs — any layout (area, path or grid) used by reference, as resolved data
// =============================================================================
//
// A place that uses a layout stores only a reference:
//   'preset:<kind>:<id>'  a built-in layout of any kind (utils/layoutPresets; 'preset:<id>' is a grid);
//   <asset id>     a saved `layout` asset — the studio registers it here when the project loads it,
//                  when it is picked, and again when it is edited or re-saved.
// Grids keep their own lookup (gridLayoutRefs: the street grid reads it); areas and paths are
// registered here. resolveLayout reads all three kinds; subscribeLayouts / layoutsVersion tell a
// consumer that waits (load order is not guaranteed) or follows edits that something changed.
//
import type { AreaInput } from './areaShape';
import type { PathLineInput } from './pathLine';
import type { GridLayout } from './gridLayout';
import { gridLayoutsVersion, resolveGridLayout, subscribeGridLayouts } from './gridLayoutRefs';
import { layoutPresetName, layoutPresetOfRef } from './layoutPresets';

/** A layout as data: what a reference resolves to. */
export type ResolvedLayout =
    | { kind: 'area'; area: AreaInput }
    | { kind: 'path'; path: PathLineInput }
    | { kind: 'grid'; grid: GridLayout };
export type LayoutKind = ResolvedLayout['kind'];

interface Registered { layout: ResolvedLayout; name: string; json: string }
const assets = new Map<string, Registered>();
const listeners = new Set<() => void>();
let version = 0;
const changed = () => { version++; for (const l of [...listeners]) l(); };

/** Give the runtime a saved area or path (a `layout` asset), or its new version after an edit. Grids go to registerGridLayout. */
export function registerLayoutData(assetId: string, layout: ResolvedLayout, name = 'Layout'): void {
    const json = JSON.stringify(layout);
    const had = assets.get(assetId);
    if (had && had.name === name && had.json === json) return;
    assets.set(assetId, { layout, name, json });
    changed();
}
export function unregisterLayoutData(assetId: string): void {
    if (assets.delete(assetId)) changed();
}
/** Is this saved area / path known to the runtime (the scene uses it)? */
export const hasLayoutData = (assetId: string): boolean => assets.has(assetId);

/** The layout a reference names (a built-in layout of any kind, a saved grid, a saved area or path), or null (unknown or not loaded yet). */
export function resolveLayout(ref: string | null | undefined): ResolvedLayout | null {
    if (!ref) return null;
    const preset = layoutPresetOfRef(ref);
    if (preset) {
        if (preset.kind === 'area') return { kind: 'area', area: preset.preset.area };
        if (preset.kind === 'path') return { kind: 'path', path: preset.preset.path };
        return { kind: 'grid', grid: preset.preset.layout };
    }
    const grid = resolveGridLayout(ref);
    if (grid) return { kind: 'grid', grid };
    return assets.get(ref)?.layout ?? null;
}
/** The built-in layout's or saved area's / path's name, or null (saved grids: gridLayoutName). */
export const layoutDataName = (ref: string | null | undefined): string | null => (ref ? layoutPresetName(ref) ?? assets.get(ref)?.name ?? null : null);

/** Called after any registration change (areas, paths and grids); returns the unsubscribe. */
export function subscribeLayouts(fn: () => void): () => void {
    listeners.add(fn);
    const offGrids = subscribeGridLayouts(fn);
    return () => { listeners.delete(fn); offGrids(); };
}
/** Changes on every registration of any kind (for useSyncExternalStore-style snapshots). */
export const layoutsVersion = (): number => version * 100003 + gridLayoutsVersion();
