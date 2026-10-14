// =============================================================================
// Animation targets — Self / Each / Targets on groups and models
// =============================================================================
//
// An Animation-tab row on a group or a model reaches (AnimationOptions.scope):
//   self     the object as one piece — the old path, `to` absolute (not handled here)
//   each     every part on its own: a group's leaf child objects (full depth, through
//            nested groups), a model's meshes
//   targets  only the chosen ones (AnimationOptions.targets), each on its own:
//            group → child objects by id (a model child optionally narrowed to nodes),
//            model → nodes by name (every layout copy)
//
// Transform `to` on each / targets is RELATIVE to the target's own rest value:
// position / rotation are added, scale is multiplied. Material `to` stays absolute.
//
// Rest values:
//   a scene object root (a group child) → `userData.baseTransform`, written by the
//     viewer's AnimatedObject from the object's settings, so editing the child in the
//     studio moves its rest too;
//   a model node / mesh → snapshotted before the first write (it already carries any
//     saved node override).
// A target the rows stop driving (row removed, switched off, scope changed) is put
// back on its rest at the end of the frame (`AnimationTargetState.endFrame`).
//
// Materials: a model node whose material is shared with a mesh outside the targets
// gets its own clone before the first write (otherwise the whole model changes);
// the original is put back when nothing drives that node's material any more.
//
// Stagger (AnimationOptions.stagger): each target starts `delay` seconds later, its
// delay = total · rank / (n − 1), rank by tree order / axis / centre-out / seeded random.
//
import { Box3, Vector3 } from 'three';
import type { Material, Object3D } from 'three';
import type { AnimationOptions, PartTarget, TargetScope, TargetStagger } from '../types/scene3d';
import { findNodesByName } from './nodeOverrides';
import { getMaterialPropertyValue, applyMaterialPropertyToObject } from './materialUtils';

export type TransformKey = 'position' | 'rotation' | 'scale';
type Vec3 = [number, number, number];

/** What kind of root the scope works on; null = scope does not apply (self). */
export function targetRootKind(root: Object3D): 'group' | 'model' | null {
    const t = root.userData?.objectType;
    return t === 'group' || t === 'model' ? t : null;
}

/** The scope a row really runs with on this root ('self' when it cannot apply). */
export function effectiveScope(root: Object3D, anim: Pick<AnimationOptions, 'scope' | 'targets'>): TargetScope {
    const scope = anim.scope ?? 'self';
    if (scope === 'self' || !targetRootKind(root)) return 'self';
    if (scope === 'targets' && !anim.targets?.length) return 'self';
    return scope;
}

const isFxHelper = (o: Object3D) => !!o.userData?.__opFxHelper;

/** Leaf object roots under a group (through nested groups), tree order. */
function groupLeaves(root: Object3D): Object3D[] {
    const out: Object3D[] = [];
    const walk = (n: Object3D) => {
        for (const c of n.children) {
            if (isFxHelper(c)) continue;
            if (c.userData?.id) {
                if (c.userData.objectType === 'group') walk(c);
                else out.push(c);
            } else walk(c);
        }
    };
    walk(root);
    return out;
}

/** The object root with this id under `root` (any depth). */
function findObjectRoot(root: Object3D, id: string): Object3D | null {
    let hit: Object3D | null = null;
    root.traverse((c) => { if (!hit && c !== root && c.userData?.id === id) hit = c; });
    return hit;
}

/** A model's meshes, tree order (effect helpers left out). */
function meshesOf(root: Object3D): Object3D[] {
    const out: Object3D[] = [];
    const walk = (n: Object3D) => {
        for (const c of n.children) {
            if (isFxHelper(c)) continue;
            if ((c as any).isMesh) out.push(c);
            walk(c);
        }
    };
    walk(root);
    return out;
}

const nodesNamed = (root: Object3D, name: string) => findNodesByName(root, name).filter(n => n !== root);

/**
 * The Object3Ds a row reaches on `root`, in tree order, without duplicates.
 * 'self' (or a root that is neither a group nor a model) → [root].
 */
export function resolveAnimationTargets(root: Object3D, scope: TargetScope | undefined, targets?: PartTarget[]): Object3D[] {
    const kind = targetRootKind(root);
    if (!kind || !scope || scope === 'self') return [root];
    let out: Object3D[];
    if (kind === 'group') {
        if (scope === 'each') out = groupLeaves(root);
        else {
            out = [];
            for (const t of targets ?? []) {
                const child = findObjectRoot(root, t.id);
                if (!child) continue;
                if (t.nodes?.length) for (const n of t.nodes) out.push(...nodesNamed(child, n));
                else out.push(child);
            }
        }
    } else {
        if (scope === 'each') out = meshesOf(root);
        else {
            out = [];
            for (const t of targets ?? []) out.push(...nodesNamed(root, t.id));
        }
    }
    return [...new Set(out)];
}

// -----------------------------------------------------------------------------
// Stagger
// -----------------------------------------------------------------------------

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function mulberry32(seed: number) {
    return () => {
        seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Seconds each target waits, same order as `objs`. No stagger / total 0 / one target → all 0. */
export function staggerDelays(root: Object3D, objs: Object3D[], stagger: TargetStagger | undefined, seed: string): number[] {
    const n = objs.length;
    const total = Math.max(0, Number(stagger?.total) || 0);
    if (!total || n < 2) return objs.map(() => 0);
    const order = stagger?.order ?? 'tree';
    let ranked: number[];   // indices into objs, first goes first
    if (order === 'tree') ranked = objs.map((_, i) => i);
    else if (order === 'random') {
        const rnd = mulberry32(hash(seed));
        ranked = objs.map((_, i) => i);
        for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ranked[i], ranked[j]] = [ranked[j], ranked[i]]; }
    } else {
        root.updateWorldMatrix(true, true);
        const box = new Box3();
        const centres = objs.map((o) => {
            const c = new Vector3();
            box.setFromObject(o);
            if (box.isEmpty()) o.getWorldPosition(c); else box.getCenter(c);
            return root.worldToLocal(c);
        });
        let key: (c: Vector3) => number;
        if (order === 'radial') {
            const mid = centres.reduce((a, c) => a.add(c), new Vector3()).divideScalar(n);
            key = (c) => c.distanceTo(mid);
        } else key = (c) => c[order];
        ranked = objs.map((_, i) => i).sort((a, b) => key(centres[a]) - key(centres[b]) || a - b);
    }
    const delays = new Array<number>(n).fill(0);
    ranked.forEach((idx, rank) => { delays[idx] = (total * rank) / (n - 1); });
    return delays;
}

// -----------------------------------------------------------------------------
// Per-object state (one per animated object, held by the viewer's hook)
// -----------------------------------------------------------------------------

interface Resolved { objs: Object3D[]; delays: number[]; frame: number }
interface MatOwn { mesh: Object3D; original: Material | Material[] }

/** Re-resolve a row's targets this often (frames) — children join / leave, models load. */
const RESOLVE_EVERY = 60;

export class AnimationTargetState {
    private frame = 0;
    private resolved = new Map<string, Resolved>();
    /** Transform rest snapshots of nodes (object roots use userData.baseTransform). */
    private restT = new Map<Object3D, Partial<Record<TransformKey, Vec3>>>();
    /** Material rest values per target and property. */
    private restM = new Map<Object3D, Record<string, unknown>>();
    /** Written this frame / last frame: `${uuid}|t|position` → target. */
    private touched = new Map<string, { obj: Object3D; domain: 't' | 'm'; prop: string }>();
    private last = new Map<string, { obj: Object3D; domain: 't' | 'm'; prop: string }>();
    /** Material clones made per target node. */
    private owned = new Map<Object3D, MatOwn[]>();

    constructor(private root: Object3D) {}

    get object(): Object3D { return this.root; }

    beginFrame(): void {
        this.frame++;
        this.last = this.touched;
        this.touched = new Map();
    }

    /** Targets + delays of a row, cached. */
    targetsOf(anim: AnimationOptions, scope: TargetScope): Resolved {
        const key = `${anim.property}|${scope}|${JSON.stringify(anim.targets ?? null)}|${JSON.stringify(anim.stagger ?? null)}`;
        const hit = this.resolved.get(key);
        if (hit && this.frame - hit.frame < RESOLVE_EVERY && hit.objs.every(o => o.parent)) return hit;
        const objs = resolveAnimationTargets(this.root, scope, anim.targets);
        const same = hit && hit.objs.length === objs.length && hit.objs.every((o, i) => o === objs[i]);
        const delays = same ? hit!.delays : staggerDelays(this.root, objs, anim.stagger, `${this.root.userData?.id ?? this.root.uuid}|${anim.property}`);
        const next = { objs, delays, frame: this.frame };
        this.resolved.set(key, next);
        return next;
    }

    /** Keep a target on what it has (a hover row while not hovered): not restored this frame. */
    hold(obj: Object3D, domain: 't' | 'm', prop: string): void {
        const k = `${obj.uuid}|${domain}|${prop}`;
        const prev = this.last.get(k);
        if (prev) this.touched.set(k, prev);
    }

    // ---- transform ----------------------------------------------------------

    transformRest(obj: Object3D, prop: TransformKey): Vec3 {
        const base = obj.userData?.baseTransform?.[prop];
        if (Array.isArray(base) && base.length >= 3) return [base[0], base[1], base[2]];
        let snap = this.restT.get(obj);
        if (!snap) { snap = {}; this.restT.set(obj, snap); }
        if (!snap[prop]) {
            const v = obj[prop] as any;
            snap[prop] = [v.x, v.y, v.z];
        }
        return snap[prop]!;
    }

    writeTransform(obj: Object3D, prop: TransformKey, v: Vec3): void {
        (obj[prop] as any).set(v[0], v[1], v[2]);
        this.touched.set(`${obj.uuid}|t|${prop}`, { obj, domain: 't', prop });
    }

    /** Mark a transform as driven without writing (keyframe rows write themselves). */
    touchTransform(obj: Object3D, prop: TransformKey): void {
        this.transformRest(obj, prop);
        this.touched.set(`${obj.uuid}|t|${prop}`, { obj, domain: 't', prop });
    }

    // ---- material -----------------------------------------------------------

    /** The target's own value before the first write (what it goes back to). */
    materialRest(obj: Object3D, prop: string): unknown {
        let rec = this.restM.get(obj);
        if (!rec) { rec = {}; this.restM.set(obj, rec); }
        if (!(prop in rec)) rec[prop] = getMaterialPropertyValue(obj, prop);
        return rec[prop];
    }

    writeMaterial(obj: Object3D, prop: string, value: unknown): void {
        if (!obj.userData?.id) this.ownMaterials(obj);
        applyMaterialPropertyToObject(obj, prop, value);
        this.touched.set(`${obj.uuid}|m|${prop}`, { obj, domain: 'm', prop });
    }

    /** A model node: clone the materials it shares with meshes outside it (once). */
    private ownMaterials(node: Object3D): void {
        if (this.owned.has(node)) return;
        const inside = new Set<Object3D>();
        node.traverse(c => inside.add(c));
        const sharedOutside = new Set<Material>();
        this.root.traverse((c) => {
            if (inside.has(c)) return;
            const m = (c as any).material;
            if (!m) return;
            for (const x of Array.isArray(m) ? m : [m]) if (x) sharedOutside.add(x);
        });
        const list: MatOwn[] = [];
        node.traverse((c) => {
            const m = (c as any).material as Material | Material[] | undefined;
            if (!m || isFxHelper(c)) return;
            const arr = Array.isArray(m) ? m : [m];
            if (!arr.some(x => sharedOutside.has(x))) return;
            list.push({ mesh: c, original: m });
            (c as any).material = Array.isArray(m) ? m.map(x => (sharedOutside.has(x) ? x.clone() : x)) : m.clone();
        });
        this.owned.set(node, list);
    }

    private releaseMaterials(node: Object3D): void {
        const list = this.owned.get(node);
        if (!list) return;
        for (const { mesh, original } of list) {
            const cur = (mesh as any).material;
            for (const x of Array.isArray(cur) ? cur : [cur]) {
                if (x && !(Array.isArray(original) ? original.includes(x) : original === x)) x.dispose?.();
            }
            (mesh as any).material = original;
        }
        this.owned.delete(node);
        this.restM.delete(node);
    }

    // ---- end of frame -------------------------------------------------------

    /** Put back on their rest the targets driven last frame and not this frame. */
    endFrame(): void {
        for (const [k, t] of this.last) {
            if (this.touched.has(k)) continue;
            if (t.domain === 't') {
                const prop = t.prop as TransformKey;
                const r = this.transformRest(t.obj, prop);
                (t.obj[prop] as any).set(r[0], r[1], r[2]);
                this.restT.get(t.obj) && delete this.restT.get(t.obj)![prop];
            } else {
                const rec = this.restM.get(t.obj);
                if (rec && t.prop in rec) applyMaterialPropertyToObject(t.obj, t.prop, rec[t.prop]);
                if (rec) delete rec[t.prop];
                const stillDriven = [...this.touched.values()].some(x => x.obj === t.obj && x.domain === 'm');
                if (!stillDriven) this.releaseMaterials(t.obj);
            }
        }
        this.last = new Map();
    }

    /** Everything back on its rest (the object goes away / the hook stops). */
    dispose(): void {
        this.beginFrame();
        this.endFrame();
        for (const node of [...this.owned.keys()]) this.releaseMaterials(node);
        this.resolved.clear();
        this.restT.clear();
        this.restM.clear();
    }
}
