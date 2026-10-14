import type { EffectSpread, EffectSteps, ObjectEffect, ObjectEffectClip } from '../types/objectSettings';

/**
 * Visual effects layer GLSL onto three's standard materials, so they take only objects drawn with
 * them: meshes (3d text included) and models. Every other scene object (particles, grids, text, lights,
 * weather, space, generative effects…) takes physical (transform) effects only, for now —
 * they move the object's group, whatever draws inside it.
 */
export function objectTakesVisualEffects(o: { type?: string; config?: unknown } | null | undefined): boolean {
    // a group never draws an effect itself: its visual effects go to each child that takes them
    return o?.type === 'mesh' || o?.type === 'model' || o?.type === 'group';
}

/**
 * A group's material goes to its children the way its visual effects do: a group has no surface,
 * so applying a material to it applies it to every object inside it (any depth) that takes visual
 * effects — meshes and models; objects drawing their own shaders (particles, grids, text, lights…)
 * keep theirs. `targets` (child ids, any depth) narrows it: a chosen nested group stands for
 * what is inside it. Each child keeps the material in its own settings.
 */
export function groupMaterialTargets<T extends { id: string; type?: string; parentId?: string | null; config?: unknown }>(
    objects: readonly T[], groupId: string, targets?: readonly string[] | null,
): T[] {
    const byParent = new Map<string, T[]>();
    for (const o of objects) {
        if (!o.parentId) continue;
        const list = byParent.get(o.parentId);
        if (list) list.push(o); else byParent.set(o.parentId, [o]);
    }
    const out: T[] = [];
    const seen = new Set<string>();
    const takes = (o: T) => o.type !== 'group' && objectTakesVisualEffects(o);
    const add = (o: T) => { if (!seen.has(o.id) && takes(o)) { seen.add(o.id); out.push(o); } };
    const walk = (id: string) => { for (const c of byParent.get(id) ?? []) { add(c); walk(c.id); } };
    if (!targets?.length) { walk(groupId); return out; }
    // only targets inside this group
    const inside = new Set<string>();
    const mark = (id: string) => { for (const c of byParent.get(id) ?? []) { inside.add(c.id); mark(c.id); } };
    mark(groupId);
    for (const id of targets) {
        if (!inside.has(id)) continue;
        const o = objects.find(x => x.id === id);
        if (!o) continue;
        if (o.type === 'group') walk(o.id); else add(o);
    }
    return out;
}

/** A group's stagger when its clip sets none (see EffectSpread). */
export const DEFAULT_EFFECT_SPREAD: Required<EffectSpread> = { order: 'tree', total: 0.6, out: 'reverse' };

const EMPTY: ObjectEffectClip = Object.freeze({ effects: [] }) as ObjectEffectClip;

/** An object's effect clip (`effects`), or an empty one. The stored value itself — identity stays stable. */
export function objectEffectClipOf(settings: { effects?: unknown } | null | undefined): ObjectEffectClip {
    const c = (settings as any)?.effects;
    return c && typeof c === 'object' && !Array.isArray(c) ? c as ObjectEffectClip : EMPTY;
}

/** The object's Base effects (well-formed entries only). */
export function objectEffectsOf(settings: { effects?: unknown } | null | undefined): ObjectEffect[] {
    const list = objectEffectClipOf(settings).effects;
    return Array.isArray(list) ? list.filter((e: any) => e && typeof e.operation === 'string' && typeof e.id === 'string') : [];
}

/** The steps of an effect clip as the effects controller takes them, or null when it has none. */
export function objectEffectStepsOf(clip: ObjectEffectClip | null | undefined): EffectSteps | null {
    return clip?.steps?.length ? { steps: clip.steps, loop: clip.loop, yoyo: clip.yoyo } : null;
}

/** The object with its effect clip changed (Base effects normalised, the rest kept). */
export function withObjectEffectClip<T extends { effects?: unknown }>(settings: T, patch: Partial<ObjectEffectClip>): T {
    return { ...settings, effects: { ...objectEffectClipOf(settings), effects: objectEffectsOf(settings), ...patch } };
}
