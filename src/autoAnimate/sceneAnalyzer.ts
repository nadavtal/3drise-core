// =============================================================================
// analyzeScene — what's in the scene, from an animator's point of view.
// =============================================================================
//
// Pure: reads plain settings (objects, camera, environment). Scene access is
// injected — `measure(id)` gives real world bounds from the live scene (viewer);
// without it bounds are estimated from the authored transform (a unit box scaled),
// which is enough for layout and roles, and works server-side (aiAgent).
//
// Produces a SceneProfile:
//   environment    which of sky / clouds / ocean / terrain are on, sea level
//   camera         pose, target, distance
//   objects        type, hierarchy, world bounds, role, group, capabilities
//   groups         siblings of a group object; clusters of alike top-level
//                  objects (same base name, or same type + size + close together),
//                  with cascade orders (along the main axis, and radial)
//   hero           the object the scene is about
//   bounds/ground/scale   the content's extent — every magnitude is scaled by `scale`
//
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { getAnimatableProperties } from '../utils/getAnimatableProperties';
import { isUuid } from '../utils/idUtils';
import type { CreatedObjectType } from '../types/scene3d';
import { boundsAround, distance, EMPTY_BOUNDS, makeBounds, unionBounds } from './bounds';
import type {
    AnalyzeOptions, Bounds, CameraProfile, EnvironmentProfile, GroupProfile, ObjectCapabilities,
    ObjectProfile, ObjectRole, SceneInput, SceneProfile, V3,
} from './types';

/** Never the hero, never grouped: they are the stage, not the actors. */
const BACKGROUND_TYPES = new Set<CreatedObjectType>(['grid', 'space', 'environment', 'effect', 'path']);
/** Can be the hero. */
const HERO_TYPES = new Set<CreatedObjectType>(['mesh', 'model', 'text', 'custom_primitive', 'gallery', 'group']);
/** Estimated half-extent of an unmeasured object of scale 1. */
const UNIT_HALF: Partial<Record<CreatedObjectType, number>> = { light: 0.15, text: 0.5 };

const MATERIAL_SKIP = new Set(['wireframe', 'transparent', 'flatShading', 'materialName', 'name']);

const vec3 = (v: any, fallback: V3): V3 =>
    Array.isArray(v) && v.length >= 3 && v.every((n: any) => Number.isFinite(Number(n)))
        ? [Number(v[0]), Number(v[1]), Number(v[2])]
        : fallback;

const isKeyable = (v: unknown): boolean =>
    typeof v === 'number' ||
    typeof v === 'boolean' ||
    (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) ||
    (Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number'));

/** "Chair 2", "chair_copy", "Chair (3)" → "chair". */
export const baseName = (name: string): string =>
    (name || '').toLowerCase()
        .replace(/\(\d+\)/g, '')
        .replace(/\b(copy|clone)\b/g, '')
        .replace(/[\s_\-.#]*\d+\s*$/g, '')
        .replace(/[\s_\-.#]+$/g, '')
        .trim();

function capabilitiesOf(obj: any, nodes: string[]): ObjectCapabilities {
    const type = obj.type as CreatedObjectType;
    const material = type === 'light' || type === 'group'
        ? []
        : getAnimatableProperties(obj, 'material')
            .map(p => p.value)
            .filter(k => !MATERIAL_SKIP.has(k) && isKeyable(obj.materialSettings?.[k]));
    const edgesOn = obj.edgesSettings && obj.edgesSettings.enabled !== false && obj.edgesSettings.materialSettings;
    const edges = edgesOn
        ? getAnimatableProperties(obj, 'edges')
            .map(p => p.value)
            .filter(k => k !== 'tubeRadius' && k !== 'cubeSize' && isKeyable(obj.edgesSettings.materialSettings[k]))
        : [];
    const config = [
        ...getAnimatableProperties(obj, 'light'),
        ...getAnimatableProperties(obj, 'particles'),
    ].map(p => p.value);
    return {
        transform: type !== 'environment',
        material,
        edges,
        config,
        nodes,
        fadeable: material.includes('opacity') && obj.materialSettings?.transparent === true,
        emissive: material.includes('emissiveIntensity'),
    };
}

/** World matrix of an object from the authored transforms up its parent chain. */
function worldMatrix(id: string, byId: Map<string, any>, cache: Map<string, Matrix4>, guard = 0): Matrix4 {
    const hit = cache.get(id);
    if (hit) return hit;
    const obj = byId.get(id);
    const m = new Matrix4();
    if (obj) {
        const ms = obj.meshSettings ?? {};
        const r = vec3(ms.rotation, [0, 0, 0]);
        m.compose(
            new Vector3(...vec3(ms.position, [0, 0, 0])),
            new Quaternion().setFromEuler(new Euler(r[0], r[1], r[2])),
            new Vector3(...vec3(ms.scale, [1, 1, 1])),
        );
        if (obj.parentId && byId.has(obj.parentId) && guard < 64) {
            m.premultiply(worldMatrix(obj.parentId, byId, cache, guard + 1));
        }
    }
    cache.set(id, m);
    return m;
}

function worldScale(id: string, byId: Map<string, any>, cache: Map<string, Matrix4>): V3 {
    const s = new Vector3();
    worldMatrix(id, byId, cache).decompose(new Vector3(), new Quaternion(), s);
    return [Math.abs(s.x) || 1, Math.abs(s.y) || 1, Math.abs(s.z) || 1];
}

function estimateBounds(obj: any, world: Matrix4): Bounds {
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    world.decompose(pos, quat, scl);
    const h = UNIT_HALF[obj.type as CreatedObjectType] ?? 0.5;
    return boundsAround([pos.x, pos.y, pos.z], [Math.abs(scl.x) * h, Math.abs(scl.y) * h, Math.abs(scl.z) * h]);
}

function environmentOf(input: SceneInput): EnvironmentProfile {
    const ocean = !!input.ocean?.config?.enabled;
    const seaLevel = Number(input.ocean?.config?.seaLevel);
    return {
        sky: !!input.sky?.visible,
        clouds: !!(input.clouds?.config?.enabled || input.clouds?.cirrus?.enabled),
        ocean,
        terrain: !!input.terrain?.config?.enabled,
        seaLevel: ocean && Number.isFinite(seaLevel) ? seaLevel : null,
    };
}

function cameraOf(input: SceneInput): CameraProfile {
    const position = vec3(input.camera?.position, [0, 2, 8]);
    const target = vec3(input.camera?.controls?.target, [0, 0, 0]);
    const fov = Number(input.camera?.fov) || 50;
    return { position, target, fov, distance: distance(position, target) };
}

/** Axis with the largest spread of the given centres. */
function mainAxis(centers: V3[]): 'x' | 'y' | 'z' {
    const spread = [0, 1, 2].map(i => Math.max(...centers.map(c => c[i])) - Math.min(...centers.map(c => c[i])));
    const i = spread.indexOf(Math.max(...spread));
    return (['x', 'y', 'z'] as const)[i];
}

function makeGroup(id: string, kind: GroupProfile['kind'], parentId: string | null, members: ObjectProfile[]): GroupProfile {
    const bounds = unionBounds(members.map(m => m.bounds)) ?? EMPTY_BOUNDS;
    const axis = mainAxis(members.map(m => m.bounds.center));
    const ai = { x: 0, y: 1, z: 2 }[axis];
    return {
        id,
        kind,
        parentId,
        memberIds: members.map(m => m.id),
        axis,
        order: [...members].sort((a, b) => a.bounds.center[ai] - b.bounds.center[ai]).map(m => m.id),
        radialOrder: [...members]
            .sort((a, b) => distance(a.bounds.center, bounds.center) - distance(b.bounds.center, bounds.center))
            .map(m => m.id),
        bounds,
        uniformType: members.every(m => m.type === members[0].type),
    };
}

export function analyzeScene(input: SceneInput, options: AnalyzeOptions = {}): SceneProfile {
    const raw = (input.objects ?? []).filter((o: any) => o && typeof o.id === 'string');
    const byId = new Map<string, any>(raw.map((o: any) => [o.id, o]));
    const matrices = new Map<string, Matrix4>();
    const environment = environmentOf(input);
    const camera = cameraOf(input);

    // --- objects (bounds, hierarchy, capabilities) ------------------------------------
    const children = new Map<string, string[]>();
    raw.forEach((o: any) => {
        if (o.parentId && byId.has(o.parentId)) {
            const list = children.get(o.parentId) ?? [];
            list.push(o.id);
            children.set(o.parentId, list);
        }
    });
    const depthOf = (id: string, guard = 0): number => {
        const p = byId.get(id)?.parentId;
        return p && byId.has(p) && guard < 64 ? 1 + depthOf(p, guard + 1) : 0;
    };

    const objects: ObjectProfile[] = raw.map((o: any) => {
        const measured = options.measure?.(o.id) ?? null;
        const ms = o.meshSettings ?? {};
        return {
            id: o.id,
            name: ms.name || o.name || o.type,
            type: o.type,
            parentId: o.parentId && byId.has(o.parentId) ? o.parentId : null,
            childIds: children.get(o.id) ?? [],
            depth: depthOf(o.id),
            visible: ms.visible !== false,
            saved: isUuid(o.id),
            position: vec3(ms.position, [0, 0, 0]),
            rotation: vec3(ms.rotation, [0, 0, 0]),
            scale: vec3(ms.scale, [1, 1, 1]),
            parentScale: o.parentId && byId.has(o.parentId) ? worldScale(o.parentId, byId, matrices) : [1, 1, 1],
            bounds: measured ?? estimateBounds(o, worldMatrix(o.id, byId, matrices)),
            measured: !!measured,
            role: 'standalone' as ObjectRole,
            groupId: null,
            capabilities: capabilitiesOf(o, o.type === 'model' ? options.nodesOf?.(o.id) ?? [] : []),
            heroScore: 0,
        };
    });
    const profileById = new Map(objects.map(p => [p.id, p]));

    // An unmeasured container is as big as what it holds.
    for (const p of [...objects].sort((a, b) => b.depth - a.depth)) {
        if (p.measured || !p.childIds.length) continue;
        const kids = unionBounds(p.childIds.map(id => profileById.get(id)!.bounds));
        if (kids) p.bounds = kids;
    }

    // --- content extent -------------------------------------------------------------------
    const actorsFirstPass = objects.filter(p => p.visible && p.type !== 'light' && !BACKGROUND_TYPES.has(p.type));
    const roughContent = unionBounds(actorsFirstPass.map(p => p.bounds)) ?? boundsAround(camera.target, [1, 1, 1]);

    // Huge flat things (floors, backdrops) are background too.
    const isBackdrop = (p: ObjectProfile) => {
        const sorted = [...p.bounds.size].sort((a, b) => a - b);
        const flat = sorted[0] < sorted[2] * 0.05;
        return flat && p.bounds.radius > roughContent.radius * 0.6 && !p.childIds.length;
    };

    // --- roles (light / background / container) ------------------------------------------
    for (const p of objects) {
        if (p.type === 'light') p.role = 'light';
        else if (BACKGROUND_TYPES.has(p.type) || !p.visible || (actorsFirstPass.length > 1 && isBackdrop(p))) p.role = 'background';
        else if (p.childIds.length) p.role = 'container';
    }
    const actors = objects.filter(p => p.role !== 'light' && p.role !== 'background');
    const bounds = unionBounds(actors.map(p => p.bounds)) ?? roughContent;
    const scale = Math.max(0.5, bounds.radius);
    const ground = Math.min(bounds.min[1], environment.seaLevel ?? Infinity);

    // --- groups ---------------------------------------------------------------------------
    const groups: GroupProfile[] = [];
    // 1. children of one group object
    for (const p of objects) {
        const kids = p.childIds.map(id => profileById.get(id)!).filter(k => k.role !== 'light' && k.role !== 'background');
        if (kids.length < 2) continue;
        const g = makeGroup(`parent:${p.id}`, 'parent', p.id, kids);
        groups.push(g);
        kids.forEach(k => { k.groupId = g.id; });
    }
    // 2. clusters of alike top-level objects: same base name, or same type + size + close
    const loose = actors.filter(p => !p.parentId && !p.groupId && p.role !== 'container');
    const parent = new Map(loose.map(p => [p.id, p.id]));
    const find = (id: string): string => (parent.get(id) === id ? id : find(parent.get(id)!));
    const join = (a: string, b: string) => { parent.set(find(a), find(b)); };
    for (let i = 0; i < loose.length; i++) {
        for (let j = i + 1; j < loose.length; j++) {
            const a = loose[i];
            const b = loose[j];
            if (a.type !== b.type) continue;
            const sameName = baseName(a.name) !== '' && baseName(a.name) === baseName(b.name);
            const ra = Math.max(a.bounds.radius, 1e-3);
            const rb = Math.max(b.bounds.radius, 1e-3);
            const alikeSize = Math.max(ra, rb) / Math.min(ra, rb) <= 1.6;
            const close = distance(a.bounds.center, b.bounds.center) <= 3 * Math.max(ra, rb);
            if (sameName || (alikeSize && close)) join(a.id, b.id);
        }
    }
    const clusters = new Map<string, ObjectProfile[]>();
    loose.forEach(p => {
        const root = find(p.id);
        clusters.set(root, [...(clusters.get(root) ?? []), p]);
    });
    for (const [root, members] of clusters) {
        if (members.length < 2) continue;
        const g = makeGroup(`cluster:${root}`, 'cluster', null, members);
        groups.push(g);
        members.forEach(m => { m.groupId = g.id; });
    }
    for (const p of objects) if (p.groupId && p.role === 'standalone') p.role = 'member';

    // --- hero -------------------------------------------------------------------------------
    const forward = new Vector3(...camera.target).sub(new Vector3(...camera.position)).normalize();
    const maxRadius = Math.max(...actors.map(p => p.bounds.radius), 1e-3);
    let heroId: string | null = null;
    let best = 0;
    for (const p of actors) {
        // Top-level things only: a part of a group object is not "the scene".
        if (!HERO_TYPES.has(p.type) || p.parentId) continue;
        const size = p.bounds.radius / maxRadius;
        const centrality = 1 - Math.min(1, distance(p.bounds.center, camera.target) / Math.max(scale, 1e-3));
        const toObj = new Vector3(...p.bounds.center).sub(new Vector3(...camera.position)).normalize();
        const facing = Math.max(0, forward.dot(toObj));
        const typeBonus = p.type === 'model' ? 0.1 : p.type === 'group' ? 0.05 : 0;
        const inCluster = p.groupId?.startsWith('cluster:') ? 0.6 : 1; // one chair among six isn't the hero
        p.heroScore = (0.45 * size + 0.3 * centrality + 0.25 * facing + typeBonus) * inCluster;
        if (p.heroScore > best) { best = p.heroScore; heroId = p.id; }
    }
    if (heroId) profileById.get(heroId)!.role = 'hero';

    const countsByType: SceneProfile['countsByType'] = {};
    objects.forEach(p => { countsByType[p.type] = (countsByType[p.type] ?? 0) + 1; });

    return { objects, groups, heroId, environment, camera, bounds, ground, scale, countsByType };
}

export { makeBounds };
