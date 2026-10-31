// =============================================================================
// layoutPresets — the built-in layouts of every kind, by reference
// =============================================================================
//
// A built-in layout (a preset) is used by reference, like a saved one, but with no asset, no
// project link and nothing to copy on a fork:
//   'preset:area:<id>'   an area (AREA_PRESETS)
//   'preset:path:<id>'   a path (PATH_PRESETS)
//   'preset:grid:<id>'   a grid (GRID_PRESETS)
//   'preset:<id>'        a grid too — the form the street grid stored first ('preset:classic'); kept
// Ids are unique within a kind only ('diamond' is an area and a grid), hence the kind in the ref.
// An existing preset never changes (scenes would silently change); a better version is a new id.
//
import { AREA_PRESETS, type AreaPreset } from './areaPresets';
import { PATH_PRESETS, type PathPreset } from './pathPresets';
import { GRID_PRESETS, type GridPreset } from './gridLayoutPresets';

export type LayoutPresetKind = 'area' | 'path' | 'grid';
export const LAYOUT_PRESET_KINDS: LayoutPresetKind[] = ['area', 'path', 'grid'];
export const LAYOUT_PRESET_PREFIX = 'preset:';

export type LayoutPresetOf = { kind: 'area'; preset: AreaPreset } | { kind: 'path'; preset: PathPreset } | { kind: 'grid'; preset: GridPreset };

/** The reference to a built-in layout. */
export const layoutPresetRef = (kind: LayoutPresetKind, presetId: string): string => `${LAYOUT_PRESET_PREFIX}${kind}:${presetId}`;
/** Is this a preset reference at all (whether or not it names one)? */
export const isLayoutPresetRef = (ref: string | null | undefined): boolean => !!ref && ref.startsWith(LAYOUT_PRESET_PREFIX);

/** The built-in layouts of a kind. */
export function layoutPresetsOf(kind: 'area'): readonly AreaPreset[];
export function layoutPresetsOf(kind: 'path'): readonly PathPreset[];
export function layoutPresetsOf(kind: 'grid'): readonly GridPreset[];
export function layoutPresetsOf(kind: LayoutPresetKind): readonly (AreaPreset | PathPreset | GridPreset)[];
export function layoutPresetsOf(kind: LayoutPresetKind): readonly (AreaPreset | PathPreset | GridPreset)[] {
    return kind === 'area' ? AREA_PRESETS : kind === 'path' ? PATH_PRESETS : GRID_PRESETS;
}

/** The preset a reference names (its kind and the preset), or null (an asset id, or no such preset). */
export function layoutPresetOfRef(ref: string | null | undefined): LayoutPresetOf | null {
    if (!ref || !ref.startsWith(LAYOUT_PRESET_PREFIX)) return null;
    const rest = ref.slice(LAYOUT_PRESET_PREFIX.length);
    const colon = rest.indexOf(':');
    const kind = colon > 0 ? rest.slice(0, colon) : 'grid';
    const id = colon > 0 ? rest.slice(colon + 1) : rest;
    if (kind === 'area') { const preset = AREA_PRESETS.find((p) => p.id === id); return preset ? { kind, preset } : null; }
    if (kind === 'path') { const preset = PATH_PRESETS.find((p) => p.id === id); return preset ? { kind, preset } : null; }
    if (kind === 'grid') { const preset = GRID_PRESETS.find((p) => p.id === id); return preset ? { kind, preset } : null; }
    return null;
}

/** A preset reference's display name, or null. */
export const layoutPresetName = (ref: string | null | undefined): string | null => layoutPresetOfRef(ref)?.preset.name ?? null;

/** The ids a kind offers, as references — for error messages ("one of …"). */
export const layoutPresetRefsOf = (kind: LayoutPresetKind): string[] => layoutPresetsOf(kind).map((p) => layoutPresetRef(kind, p.id));
