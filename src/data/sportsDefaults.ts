import type { SportsObjectConfig, SportsObjectType } from "../types";

// =============================================================================
// SPORTS OBJECTS — defaults, labels, animatable knobs (type 'sports', config.type set)
// =============================================================================
//
// The only place a default lives: the viewer components, the controller, the catalog
// and the AI read it from here. Entries are appended by the integrator from each
// object spec (court, ball, equipment, goal, …).
//
// Animatable = exactly what the variant's push point applies per frame (colours, wear,
// wetness, gloss, seams, net tension…); structural knobs (sport / kind / item, sizes,
// fixtures, quality, seed) rebuild and are never listed.
//

export const DEFAULT_SPORTS_OBJECTS: Record<SportsObjectType, SportsObjectConfig> = {

    court: { type: 'court', enabled: true, sport: 'tennis', surface: 'auto', margin: 1, lineScale: 1, fixtures: true, quality: 'medium', seed: 1, wear: 0.25, wetness: 0, gloss: 1, floodlights: true, floodIntensity: 1, floodColor: '#fff1dc', lighting: 'auto', naturalColors: true, color: '#2a62a8', secondaryColor: '#ffffff', accentColor: '#3b7f44', opacity: 1 },
    ball: { type: 'ball', enabled: true, sport: 'football', quality: 'medium', seed: 1, naturalColors: true, color: '#f2f2f0', secondaryColor: '#1c1c1e', accentColor: '#2a2a2c', seamWidth: 1, seamDepth: 1, bulge: 0.5, wear: 0.2, gloss: 1, opacity: 1 },
    equipment: { type: 'equipment', enabled: true, item: 'tennisRacquet', material: 'auto', plates: 2, quality: 'medium', seed: 1, naturalColors: true, color: '#1f2a44', secondaryColor: '#1a1a1a', accentColor: '#e8e6df', wear: 0.25, gloss: 1, opacity: 1 },
    goal: { type: 'goal', enabled: true, kind: 'footballGoal', showNet: true, meshSize: 1, quality: 'medium', seed: 1, naturalColors: true, color: '#f4f4f2', secondaryColor: '#f2f2f2', accentColor: '#f4f4f2', netTension: 0.6, wear: 0.2, gloss: 1, opacity: 1 },
};

export const SPORTS_OBJECT_LABELS: Record<SportsObjectType, string> = {

    court: 'Court',
    ball: 'Ball',
    equipment: 'Equipment',
    goal: 'Goal',
};

export const SPORTS_OBJECTS_ANIMATABLE: Record<SportsObjectType, { value: string; label: string }[]> = {

    court: [
        { value: 'lineScale', label: 'Line Scale' },
        { value: 'wear', label: 'Wear' },
        { value: 'wetness', label: 'Wetness' },
        { value: 'gloss', label: 'Gloss' },
        { value: 'floodIntensity', label: 'Flood Intensity' },
        { value: 'floodColor', label: 'Flood Color' },
        { value: 'color', label: 'Color' },
        { value: 'secondaryColor', label: 'Secondary Color' },
        { value: 'accentColor', label: 'Accent Color' },
        { value: 'opacity', label: 'Opacity' },
    ],
    ball: [
        { value: 'color', label: 'Color' },
        { value: 'secondaryColor', label: 'Secondary Color' },
        { value: 'accentColor', label: 'Accent Color' },
        { value: 'seamWidth', label: 'Seam Width' },
        { value: 'seamDepth', label: 'Seam Depth' },
        { value: 'bulge', label: 'Bulge' },
        { value: 'wear', label: 'Wear' },
        { value: 'gloss', label: 'Gloss' },
        { value: 'opacity', label: 'Opacity' },
    ],
    equipment: [
        { value: 'color', label: 'Color' },
        { value: 'secondaryColor', label: 'Secondary Color' },
        { value: 'accentColor', label: 'Accent Color' },
        { value: 'wear', label: 'Wear' },
        { value: 'gloss', label: 'Gloss' },
        { value: 'opacity', label: 'Opacity' },
    ],
    goal: [
        { value: 'color', label: 'Color' },
        { value: 'secondaryColor', label: 'Secondary Color' },
        { value: 'accentColor', label: 'Accent Color' },
        { value: 'netTension', label: 'Net Tension' },
        { value: 'wear', label: 'Wear' },
        { value: 'gloss', label: 'Gloss' },
        { value: 'opacity', label: 'Opacity' },
    ],
};

/** True when the config is one of the sports variants (type 'sports', config.type set). */
export function isSportsObjectConfig(config: unknown): config is SportsObjectConfig {
    const t = (config as { type?: unknown } | null)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_SPORTS_OBJECTS, t);
}
