// =============================================================================
// Property registry — parity tests
// =============================================================================
//
// The registry (src/properties) must give the same answers as the lists it was
// built from, so moving consumers onto it changes nothing by accident. Where the
// registry deliberately differs (one animatable rule instead of three), the
// difference is asserted exactly, so it is a decision, not a drift.
//
// Run:  npx tsx packages/core/tests/properties.parity.ts
// (outside src: not part of the core build or typecheck)
//
import assert from 'node:assert/strict';
import {
    getPropertySpecs, getAnimatableSpecs, getAnimatableProperties, getGenerativeAnimatable, detectAnimatableDomain,
    CLOUD_ANIMATABLE_PROPERTIES,
    DEFAULT_LIGHTS, DEFAULT_GENERATIVE_PARTICLES, DEFAULT_GENERATIVE_EFFECTS, GRIDS_ANIMATABLE,
    DEFAULT_ENVIRONMENT_OBJECTS, ENVIRONMENT_PROPERTIES,
    DEFAULT_SPACE_OBJECTS, SPACE_PROPERTIES,
    DEFAULT_LAND_OBJECTS, LAND_PROPERTIES,
    DEFAULT_TEXT_OBJECTS, TEXT_PROPERTIES,
    LIGHT_PROPERTIES, SHADOW_PROPERTIES, PARTICLES_PROPERTIES, EFFECT_PROPERTIES, GRID_PROPERTIES,
    skyOptionalProperties, cloudDeckOptionalProperties, cirrusOptionalProperties,
    oceanSurfaceOptionalProperties, terrainOptionalProperties, rainOptionalProperties, cloudsOptionalProperties,
    plainOptionalProperties, pathOptionalProperties, edgesOptionalProperties,
    SHAPE_CONTROLS, MODE_CONTROLS,
    MATERIAL_PROPERTY_BOUNDS,
    type OptionalProperty, type PropertySpec, type PropertyElement,
} from '../src/index';

let passed = 0;
const failures: string[] = [];
function check(name: string, fn: () => void) {
    try { fn(); passed++; } catch (e: any) { failures.push(`${name}\n    ${String(e?.message ?? e).split('\n').join('\n    ')}`); }
}
const sorted = (a: Iterable<string>) => [...a].sort();
const names = (specs: PropertySpec[], prefix: string) =>
    sorted(specs.filter(s => s.key.startsWith(prefix)).map(s => s.key.slice(prefix.length)));

/** Every controller row is in the registry under `prefix`, with the same kind / bounds / options. */
function rowsMatch(label: string, element: PropertyElement, settings: any, rows: OptionalProperty[], prefix: string) {
    check(`${label}: controller rows`, () => {
        const specs = new Map(getPropertySpecs(element, settings).map(s => [s.key, s]));
        for (const p of rows) {
            const s = specs.get(`${prefix}${p.name}`);
            assert.ok(s, `missing ${prefix}${p.name}`);
            assert.equal(s!.min, p.min, `${p.name} min`);
            assert.equal(s!.max, p.max, `${p.name} max`);
            assert.equal(s!.step, p.step, `${p.name} step`);
            assert.deepEqual(s!.options?.map(o => o.value), p.options?.length ? p.options : undefined, `${p.name} options`);
            const kind = { vector3: 'vec3', vector2: 'vec2' }[p.type as string] ?? p.type;
            assert.equal(s!.kind, kind, `${p.name} kind`);
        }
    });
}

// -----------------------------------------------------------------------------
// Generative families + lights: animatable == the generated tables (getGenerativeAnimatable)
// -----------------------------------------------------------------------------

const families: Array<[string, 'light' | 'particles' | 'effect' | 'grid' | 'environment' | 'space' | 'land' | 'text', Record<string, any>, Record<string, OptionalProperty[]>]> = [
    ['light', 'light', DEFAULT_LIGHTS, LIGHT_PROPERTIES as any],
    ['particles', 'particles', DEFAULT_GENERATIVE_PARTICLES, PARTICLES_PROPERTIES as any],
    ['effect', 'effect', DEFAULT_GENERATIVE_EFFECTS, EFFECT_PROPERTIES as any],
    ['grid', 'grid', Object.fromEntries(Object.keys({ ...GRIDS_ANIMATABLE, ...GRID_PROPERTIES }).map(t => [t, {}])), GRID_PROPERTIES],
    ['environment', 'environment', DEFAULT_ENVIRONMENT_OBJECTS, ENVIRONMENT_PROPERTIES as any],
    ['space', 'space', DEFAULT_SPACE_OBJECTS, SPACE_PROPERTIES as any],
    ['land', 'land', DEFAULT_LAND_OBJECTS, LAND_PROPERTIES as any],
    ['text', 'text', DEFAULT_TEXT_OBJECTS, TEXT_PROPERTIES as any],
];

for (const [objType, domain, defaults, lists] of families) {
    for (const t of Object.keys(defaults)) {
        const obj = { id: 'x', type: objType, meshSettings: {}, config: { ...(defaults[t] ?? {}), type: t } };
        const family = ({ light: 'lights', particles: 'particles', effect: 'effects', grid: 'grids', environment: 'environment', space: 'space', land: 'land', text: 'text' } as const)[domain];
        check(`${objType}/${t}: animatable config == generated table`, () => {
            const expected = sorted(getGenerativeAnimatable(family, obj.config).map(p => p.value));
            assert.deepEqual(names(getAnimatableSpecs('object', obj), 'config.'), expected);
            assert.deepEqual(sorted(getAnimatableProperties(obj as any, domain).map(p => p.value)), expected);
        });
        rowsMatch(`${objType}/${t}`, 'object', obj, lists[t] ?? [], 'config.');
        if (objType === 'light') rowsMatch(`light/${t} shadow`, 'object', obj, (SHADOW_PROPERTIES as any)[t] ?? [], 'config.shadow.');
    }
}

// Rain / legacy cloud objects (lists frozen from getAnimatableProperties at P0)
const LEGACY_RAIN = ['color', 'size', 'opacity', 'speed', 'windStrength', 'windDirection', 'turbulence'];
for (const [t, domain, rows, legacy] of [['rain', 'rain', rainOptionalProperties, LEGACY_RAIN], ['clouds', 'clouds', cloudsOptionalProperties, [...CLOUD_ANIMATABLE_PROPERTIES]]] as const) {
    const obj = { id: 'x', type: 'mesh-like', meshSettings: {}, config: { type: t } };
    check(`${t} object: animatable == legacy list`, () => {
        assert.deepEqual(names(getAnimatableSpecs('object', obj), 'config.'), sorted(legacy));
        assert.deepEqual(sorted(getAnimatableProperties(obj as any, domain).map(p => p.value)), sorted(legacy));
    });
    rowsMatch(`${t} object`, 'object', obj, rows as OptionalProperty[], 'config.');
}

// Plain / path: controller rows, nothing animatable through config
for (const [t, rows] of [['plain', plainOptionalProperties], ['path', pathOptionalProperties]] as const) {
    const obj = { id: 'x', type: t, meshSettings: {}, config: {} };
    rowsMatch(`${t} object`, 'object', obj, rows, 'config.');
    check(`${t} object: no animatable config`, () => assert.deepEqual(names(getAnimatableSpecs('object', obj), 'config.'), []));
}

// Created shapes: every shape / display-mode control, structural
for (const shape of Object.keys(SHAPE_CONTROLS)) {
    for (const mode of Object.keys(MODE_CONTROLS)) {
        const obj = { id: 'x', type: 'mesh', meshSettings: {}, config: { type: shape }, modeConfig: { mode } };
        check(`mesh/${shape}/${mode}: shape + mode controls`, () => {
            const specs = new Map(getPropertySpecs('object', obj).map(s => [s.key, s]));
            for (const c of [...(SHAPE_CONTROLS as any)[shape].map((c: any) => ['config.', c]), ...(MODE_CONTROLS as any)[mode].map((c: any) => ['modeConfig.', c])]) {
                const s = specs.get(c[0] + c[1].key);
                assert.ok(s, `missing ${c[0]}${c[1].key}`);
                assert.equal(s!.animatable, false);
                if (c[1].type === 'range') { assert.equal(s!.min, c[1].min); assert.equal(s!.max, c[1].max); }
            }
        });
    }
}

// Edges switches / sizes: structural, scoped by type
check('edges: switch, type and the size of the drawn type', () => {
    const tube = { type: 'mesh', edgesSettings: { enabled: true, type: 'tube', materialSettings: {} } };
    const keys = getPropertySpecs('object', tube).filter(s => s.domain === 'edges').map(s => s.key);
    assert.deepEqual(sorted(keys), ['edgesSettings.enabled', 'edgesSettings.tubeRadius', 'edgesSettings.type']);
    const tr = getPropertySpecs('object', tube).find(s => s.key === 'edgesSettings.tubeRadius')!;
    const row = edgesOptionalProperties.find(p => p.name === 'tubeRadius')!;
    assert.equal(tr.min, row.min); assert.equal(tr.max, row.max);
});

// -----------------------------------------------------------------------------
// Material / edges: the timeline rule (frozen copy of trackCatalog.trackOptionsFor at P0)
// -----------------------------------------------------------------------------

const LEGACY_EXCLUDED = new Set(['materialType', 'materialVariant', 'side', 'u_time', 'u_mouse', 'apply', 'visible', 'map', 'uHasTexture']);
const LEGACY_SKIP = new Set(['wireframe', 'transparent', 'flatShading', 'materialName', 'name']);
const legacyKeyable = (v: unknown) =>
    typeof v === 'number' || typeof v === 'boolean' ||
    (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) ||
    (Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number'));
const legacyMaterial = (m: Record<string, unknown>) =>
    sorted(Object.keys(m).filter(k => !LEGACY_EXCLUDED.has(k) && !LEGACY_SKIP.has(k) && legacyKeyable(m[k])));

const SAMPLE_MATERIALS: Record<string, Record<string, unknown>> = {
    standard: { materialType: 'standard', materialVariant: 'default', color: '#ff0000', roughness: 0.5, metalness: 0.2, opacity: 1, transparent: false, wireframe: false, side: 0, map: null, emissive: '#000000', emissiveIntensity: 1, envMapIntensity: 1, flatShading: false, normalScale: [1, 1] },
    physical: { materialType: 'physical', materialVariant: 'glass', color: '#ffffff', roughness: 0, metalness: 0, transmission: 1, ior: 1.5, thickness: 0.5, clearcoat: 1, clearcoatRoughness: 0, sheenColor: '#ffffff', iridescence: 0, specularColor: '#ffffff', attenuationColor: '#ffffff', attenuationDistance: 1, normalMap: null },
    shader: { materialType: 'lava', materialVariant: 'default', u_time: 0, u_mouse: [0, 0], uHasTexture: false, apply: true, speed: 1, intensity: 2, colorA: '#ff3300', colorB: '#220000', scale: 3, direction: [1, 0, 0], handlers: {} },
};

for (const [label, m] of Object.entries(SAMPLE_MATERIALS)) {
    const obj = { id: 'x', type: 'mesh', meshSettings: {}, materialSettings: m, edgesSettings: { enabled: true, type: 'tube', tubeRadius: 0.02, materialSettings: m } };
    check(`material/${label}: animatable == timeline rule`, () => {
        assert.deepEqual(names(getAnimatableSpecs('object', obj), 'materialSettings.'), legacyMaterial(m));
        assert.deepEqual(sorted(getAnimatableProperties(obj as any, 'material').map(p => p.value)), legacyMaterial(m));
    });
    check(`edges/${label}: animatable == timeline rule`, () => {
        assert.deepEqual(names(getAnimatableSpecs('object', obj), 'edgesSettings.materialSettings.'), legacyMaterial(m));
        assert.ok(!getAnimatableSpecs('object', obj).some(s => s.key === 'edgesSettings.tubeRadius'), 'tubeRadius is structural');
        assert.ok(getPropertySpecs('object', obj).some(s => s.key === 'edgesSettings.tubeRadius'), 'tubeRadius is a property');
    });
    check(`edges/${label}: off → nothing animatable`, () => {
        const off = { ...obj, edgesSettings: { ...obj.edgesSettings, enabled: false } };
        assert.deepEqual(names(getAnimatableSpecs('object', off), 'edgesSettings.'), []);
    });
    check(`material/${label}: bounds from MATERIAL_PROPERTY_BOUNDS`, () => {
        for (const s of getPropertySpecs('object', obj).filter(s => s.domain === 'material' && s.kind === 'number')) {
            const b = MATERIAL_PROPERTY_BOUNDS[s.name];
            assert.equal(s.min, b?.min, `${s.name} min`);
            assert.equal(s.max, b?.max, `${s.name} max`);
        }
    });
}

check('self-managed material: light / particles / effect / grid / environment / space / land have no material properties', () => {
    for (const type of ['light', 'particles', 'effect', 'grid', 'environment', 'space', 'land']) {
        const obj = { id: 'x', type, meshSettings: {}, materialSettings: SAMPLE_MATERIALS.standard, config: { type: 'none' } };
        assert.equal(getPropertySpecs('object', obj).filter(s => s.domain === 'material').length, 0, type);
    }
});

check('text: every look draws its own material; mesh text takes one', () => {
    for (const look of Object.keys(DEFAULT_TEXT_OBJECTS)) {
        const obj = { id: 'x', type: 'text', meshSettings: {}, materialSettings: SAMPLE_MATERIALS.standard, config: { ...(DEFAULT_TEXT_OBJECTS as any)[look] } };
        assert.equal(getPropertySpecs('object', obj).filter(s => s.domain === 'material').length, 0, look);
    }
    const mesh = { id: 'x', type: 'mesh', meshSettings: {}, materialSettings: SAMPLE_MATERIALS.standard, config: { type: 'text', text: 'Hello', font: 'inter' } };
    const specs = getPropertySpecs('object', mesh);
    assert.ok(specs.some(s => s.domain === 'material'), 'mesh text keeps its material');
    assert.ok(specs.some(s => s.key === 'config.font' && s.options?.some(o => o.value === 'inter')), 'mesh text lists the fonts');
    assert.ok(!specs.some(s => s.domain === 'text'), 'mesh text is not in the text family');
});

check('getAnimatableProperties(transform): the three vectors', () => {
    assert.deepEqual(getAnimatableProperties({ type: 'mesh' } as any, 'transform').map(p => p.value), ['position', 'rotation', 'scale']);
});

check('detectAnimatableDomain routes by name, structural keys included', () => {
    const obj: any = { type: 'mesh', materialSettings: SAMPLE_MATERIALS.standard, edgesSettings: { type: 'tube', materialSettings: { color: '#fff' } } };
    assert.equal(detectAnimatableDomain(obj, 'position.x'), 'transform');
    assert.equal(detectAnimatableDomain(obj, 'roughness'), 'material');
    assert.equal(detectAnimatableDomain(obj, 'wireframe'), 'material');
    assert.equal(detectAnimatableDomain(obj, 'color'), 'edges');
    assert.equal(detectAnimatableDomain(obj, 'tubeRadius'), 'edges');
    assert.equal(detectAnimatableDomain(obj, 'nope'), null);
    const light: any = { type: 'light', config: { type: 'point', intensity: 1 } };
    assert.equal(detectAnimatableDomain(light, 'intensity'), 'light');
});

check('transform: position / rotation / scale / visible', () => {
    assert.deepEqual(names(getAnimatableSpecs('object', { type: 'mesh' }), 'meshSettings.'), ['position', 'rotation', 'scale', 'visible']);
});

check('camera: position / target / fov', () => {
    assert.deepEqual(sorted(getAnimatableSpecs('camera', {}).map(s => s.key)), ['controls.target', 'fov', 'position']);
});

// -----------------------------------------------------------------------------
// Environment: controller rows + the ONE animatable rule
// -----------------------------------------------------------------------------
//
// Timeline (P0): every number / colour row of a layer that is on.
// AI scene analysis (P0): the same minus cloud altitudes / sizes, ocean mesh, terrain
// land shape. The registry adopts the second (schema `animatable: false`); the
// difference to the timeline is asserted below so it is exact.

const legacyTimeline = (rows: OptionalProperty[], prefix: string) =>
    rows.filter(p => p.name !== 'enabled' && (p.type === 'number' || p.type === 'color')).map(p => `${prefix}${p.name}`);

const ENV_CASES: Array<{ label: string; element: PropertyElement; settings: any; lists: Array<[OptionalProperty[], string]>; notAnimatable: string[] }> = [
    { label: 'sky', element: 'sky', settings: {}, lists: [[skyOptionalProperties, '']], notAnimatable: [] },
    ...(['stratocumulus', 'cumulus', 'cumulonimbus'] as const).map(deckType => ({
        label: `clouds/${deckType}`, element: 'clouds' as const,
        settings: { config: { enabled: true, deckType }, cirrus: { enabled: true } },
        lists: [[cloudDeckOptionalProperties(deckType as any), 'config.'], [cirrusOptionalProperties, 'cirrus.']] as Array<[OptionalProperty[], string]>,
        notAnimatable: ['config.baseAltitude', 'config.topAltitude', 'config.featureSize', 'config.detailSize', 'config.weatherCellSize', 'cirrus.altitude', 'cirrus.thickness', 'cirrus.featureSize'],
    })),
    ...([['sea', 'world'], ['lake', 'object']] as const).map(([waterType, host]) => ({
        label: `ocean/${waterType}/${host}`, element: 'ocean' as const,
        settings: { config: { waterType, host } },
        lists: [[oceanSurfaceOptionalProperties(waterType as any, host as any), 'config.']] as Array<[OptionalProperty[], string]>,
        notAnimatable: ['config.seaLevel', 'config.size', 'config.segments', 'config.waveComponents'],
    })),
    ...(['mountains', 'hills', 'dunes', 'canyon'] as const).map(terrainType => ({
        label: `terrain/${terrainType}`, element: 'terrain' as const,
        settings: { config: { terrainType } },
        lists: [[terrainOptionalProperties(terrainType as any), 'config.']] as Array<[OptionalProperty[], string]>,
        notAnimatable: ['*'], // everything but the look keys
    })),
];
const TERRAIN_LOOK = new Set(['config.ambient', 'config.bounce', 'config.sunShadow', 'config.aerialPerspective', 'config.exposure', 'config.specular', 'config.roughness']);

for (const c of ENV_CASES) {
    for (const [rows, prefix] of c.lists) rowsMatch(c.label, c.element, c.settings, rows, prefix);
    check(`${c.label}: animatable == timeline minus structural`, () => {
        const timeline = c.lists.flatMap(([rows, prefix]) => legacyTimeline(rows, prefix));
        const expected = c.notAnimatable[0] === '*'
            ? timeline.filter(k => TERRAIN_LOOK.has(k))
            : timeline.filter(k => !c.notAnimatable.includes(k));
        assert.deepEqual(sorted(getAnimatableSpecs(c.element, c.settings).map(s => s.key)), sorted(expected));
    });
}

check('clouds: a layer that is off has nothing animatable', () => {
    const specs = getAnimatableSpecs('clouds', { config: { enabled: false, deckType: 'cumulus' }, cirrus: { enabled: false } });
    assert.equal(specs.length, 0);
});

// -----------------------------------------------------------------------------

console.log(`property registry parity: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
    for (const f of failures) console.log(`  ✗ ${f}`);
    process.exit(1);
}
