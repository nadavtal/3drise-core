// Property table for the land objects (type 'land'). The registry (../registry.ts) is built on these tables.
import { terrainOptionalProperties, type OptionalProperty } from './optionalProperties';
import type { LandObjectType } from '../../types/landObjects';

// =============================================================================
// LAND OBJECTS OPTIONAL PROPERTIES
// The environment terrain's rows for the landform (one schema, TERRAIN_SCHEMA),
// minus what a land object's transform owns or the panel row already switches
// (`enabled`, `seaLevel`), plus the patch's own knobs.
// =============================================================================

const TRANSFORM_OWNED = new Set(['enabled', 'seaLevel']);

export const landOwnProperties: OptionalProperty[] = [
    { name: 'edgeFade', label: 'Edge fade', description: 'How far in from the border the land eases down to its base, as a fraction of the shorter side. 0 ends in a cliff.', type: 'number', min: 0, max: 0.5, step: 0.01, animatable: false },
    { name: 'seed', label: 'Seed', description: 'Which piece of the endless land this patch shows. Same shape, different seed: different land.', type: 'number', min: 1, max: 9999, step: 1, animatable: false },
    { name: 'quality', label: 'Quality', description: 'Grid resolution of the patch (rebuilds): low 128, medium 256, high 384 cells a side.', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'], animatable: false },
];

const rowsFor = (type: LandObjectType): OptionalProperty[] => [
    ...terrainOptionalProperties(type).filter((p) => !TRANSFORM_OWNED.has(p.name)),
    ...landOwnProperties,
];

export const LAND_PROPERTIES: Record<LandObjectType, OptionalProperty[]> = {
    mountains: rowsFor('mountains'),
    hills: rowsFor('hills'),
    dunes: rowsFor('dunes'),
    canyon: rowsFor('canyon'),
};
