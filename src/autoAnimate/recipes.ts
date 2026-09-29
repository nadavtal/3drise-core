// =============================================================================
// Recipes — motion building blocks. Each one plans tracks for one target, sized
// by the target's own bounds (scale-relative magnitudes) and bounded by the rules
// (ground, speed). The composer places them in time; the ledger makes every track
// start where the previous step left its property (continuity).
// =============================================================================
import type { DraftEase, DraftTrack, DraftValue } from './draft';
import type { Rng } from './rng';
import type { ObjectProfile, SceneProfile, V3 } from './types';

export type StyleName = 'calm' | 'energetic' | 'cinematic';

export interface StyleSpec {
    name: StyleName;
    durationMul: number;
    amplitudeMul: number;
    /** Entrance recipes to pick from, in preference order. */
    enters: EnterName[];
    enterEase: DraftEase;
    popEase: DraftEase;
    dropEase: DraftEase;
    ambientEase: DraftEase;
    /** Camera orbit swing, degrees. */
    orbitDeg: number;
}

export const STYLES: Record<StyleName, StyleSpec> = {
    calm: {
        name: 'calm', durationMul: 1.35, amplitudeMul: 0.7, enters: ['rise', 'fade', 'pop'],
        enterEase: 'easeOutCubic', popEase: 'easeOutCubic', dropEase: 'easeOutCubic', ambientEase: 'easeInOutSine', orbitDeg: 18,
    },
    energetic: {
        name: 'energetic', durationMul: 0.75, amplitudeMul: 1.2, enters: ['pop', 'drop', 'rise'],
        enterEase: 'easeOutQuart', popEase: 'easeOutBack', dropEase: 'easeOutBounce', ambientEase: 'easeInOutQuad', orbitDeg: 30,
    },
    cinematic: {
        name: 'cinematic', durationMul: 1.2, amplitudeMul: 1, enters: ['spin', 'rise', 'fade'],
        enterEase: 'easeOutExpo', popEase: 'easeOutCubic', dropEase: 'easeOutCubic', ambientEase: 'easeInOutSine', orbitDeg: 35,
    },
};

// ---------------------------------------------------------------------------------------
// Ledger — the current value of every (state, path): authored until a track moves it.
// ---------------------------------------------------------------------------------------

export class Ledger {
    private values = new Map<string, DraftValue>();
    constructor(private authored: (state: string, path: string) => DraftValue | undefined) {}
    get(state: string, path: string): DraftValue | undefined {
        const k = `${state}|${path}`;
        return this.values.has(k) ? this.values.get(k) : this.authored(state, path);
    }
    set(state: string, path: string, value: DraftValue): void {
        this.values.set(`${state}|${path}`, value);
    }
    /** Record every track's last value (after placing a clip). */
    commit(tracks: DraftTrack[]): void {
        for (const t of tracks) {
            const last = t.keys[t.keys.length - 1];
            if (last) this.set(t.state, t.path, last.value);
        }
    }
}

export interface RecipeContext {
    profile: SceneProfile;
    rng: Rng;
    style: StyleSpec;
    ledger: Ledger;
    makeId: (prefix: string) => string;
    /** Wheel / mouse driven: no overshoot eases. */
    driven: boolean;
}

/** One property's move for an entrance: from `away` to `rest`. */
export interface EnterMove { state: string; path: string; away: DraftValue; rest: DraftValue; ease: DraftEase }

export type EnterName = 'rise' | 'drop' | 'pop' | 'spin' | 'fade';

const asV3 = (v: DraftValue | undefined, fallback: V3): V3 =>
    Array.isArray(v) && v.length >= 3 ? [Number(v[0]), Number(v[1]), Number(v[2])] : fallback;
const r3 = (v: V3): V3 => [round(v[0]), round(v[1]), round(v[2])];
export const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

const safeEase = (ctx: RecipeContext, ease: DraftEase, fallback: DraftEase = 'easeOutCubic'): DraftEase =>
    ctx.driven && ['easeInBack', 'easeOutBack', 'easeInOutBack', 'easeOutElastic', 'easeOutBounce'].includes(ease) ? fallback : ease;

const height = (p: ObjectProfile) => Math.max(p.bounds.size[1], p.bounds.radius * 0.5, 1e-3);

// ---------------------------------------------------------------------------------------
// Entrances (end at the authored values)
// ---------------------------------------------------------------------------------------

/**
 * Plan an entrance. Returns null when it can't work here (a rise with no room above
 * the ground, a fade on an opaque material) — the caller tries the next one.
 */
export function planEnter(name: EnterName, p: ObjectProfile, amp: number, ctx: RecipeContext): EnterMove[] | null {
    const id = p.id;
    const pos = asV3(ctx.ledger.get(id, 'meshSettings.position'), p.position);
    const rot = asV3(ctx.ledger.get(id, 'meshSettings.rotation'), p.rotation);
    const scl = asV3(ctx.ledger.get(id, 'meshSettings.scale'), p.scale);
    const s = ctx.style;
    const moves: EnterMove[] = [];
    const fade = (): EnterMove | null => {
        if (!p.capabilities.fadeable) return null;
        const rest = Number(ctx.ledger.get(id, 'materialSettings.opacity') ?? 1);
        return { state: id, path: 'materialSettings.opacity', away: 0, rest, ease: 'easeOutQuad' };
    };

    switch (name) {
        case 'rise': {
            // From below, but never under the ground.
            let d = 0.35 * height(p) * amp;
            const room = p.bounds.min[1] - ctx.profile.ground;
            if (!p.parentId) d = Math.min(d, Math.max(0, room));
            if (d < 0.1 * height(p) * amp) return null;
            const local = d / p.parentScale[1];
            moves.push({ state: id, path: 'meshSettings.position', away: r3([pos[0], pos[1] - local, pos[2]]), rest: pos, ease: s.enterEase });
            const f = fade();
            if (f) moves.push(f);
            return moves;
        }
        case 'drop': {
            const local = (0.6 * height(p) * amp) / p.parentScale[1];
            moves.push({ state: id, path: 'meshSettings.position', away: r3([pos[0], pos[1] + local, pos[2]]), rest: pos, ease: safeEase(ctx, s.dropEase) });
            return moves;
        }
        case 'pop': {
            moves.push({ state: id, path: 'meshSettings.scale', away: r3([scl[0] * 0.001, scl[1] * 0.001, scl[2] * 0.001]), rest: scl, ease: safeEase(ctx, s.popEase) });
            return moves;
        }
        case 'spin': {
            // A quarter turn into place, growing from 60%.
            moves.push({ state: id, path: 'meshSettings.rotation', away: r3([rot[0], rot[1] - (Math.PI / 2) * Math.min(1.2, amp), rot[2]]), rest: rot, ease: s.enterEase });
            moves.push({ state: id, path: 'meshSettings.scale', away: r3([scl[0] * 0.6, scl[1] * 0.6, scl[2] * 0.6]), rest: scl, ease: s.enterEase });
            return moves;
        }
        case 'fade': {
            const f = fade();
            return f ? [f] : null;
        }
    }
    return null;
}

/** The first entrance of the style that works for this object (pop always does). */
export function chooseEnter(p: ObjectProfile, amp: number, ctx: RecipeContext, prefer?: EnterName): { name: EnterName; moves: EnterMove[] } {
    const order: EnterName[] = [...(prefer ? [prefer] : []), ...ctx.style.enters, 'pop'];
    for (const name of order) {
        if (p.type === 'light') break;
        const moves = planEnter(name, p, amp, ctx);
        if (moves?.length) return { name, moves };
    }
    return { name: 'pop', moves: planEnter('pop', p, amp, ctx) ?? [] };
}

/** A light "switches on": intensity from ~0 to its authored value. */
export function planLightEnter(p: ObjectProfile, ctx: RecipeContext): EnterMove[] {
    if (!p.capabilities.config.includes('intensity')) return [];
    const rest = Number(ctx.ledger.get(p.id, 'config.intensity') ?? 1);
    return [{ state: p.id, path: 'config.intensity', away: round(rest * 0.05), rest, ease: 'easeInOutSine' }];
}

// ---------------------------------------------------------------------------------------
// Ambient / accent (return to where they started — seamless in a loop)
// ---------------------------------------------------------------------------------------

export type AmbientName = 'float' | 'sway' | 'breathe' | 'glow' | 'swell';

/** Keys (relative to t0, over T) of an out-and-back move; null when not applicable. */
export function planAmbient(name: AmbientName, p: ObjectProfile, amp: number, ctx: RecipeContext): { path: string; points: Array<[number, DraftValue]> } | null {
    const id = p.id;
    const e = amp * ctx.style.amplitudeMul;
    switch (name) {
        case 'float': {
            const pos = asV3(ctx.ledger.get(id, 'meshSettings.position'), p.position);
            const up = (0.06 * height(p) * e) / p.parentScale[1];
            return { path: 'meshSettings.position', points: [[0, pos], [0.5, r3([pos[0], pos[1] + up, pos[2]])], [1, pos]] };
        }
        case 'sway': {
            const rot = asV3(ctx.ledger.get(id, 'meshSettings.rotation'), p.rotation);
            const a = 0.06 * e;
            return {
                path: 'meshSettings.rotation',
                points: [[0, rot], [0.25, r3([rot[0], rot[1], rot[2] + a])], [0.5, rot], [0.75, r3([rot[0], rot[1], rot[2] - a])], [1, rot]],
            };
        }
        case 'breathe': {
            const scl = asV3(ctx.ledger.get(id, 'meshSettings.scale'), p.scale);
            const k = 1 + 0.04 * e;
            return { path: 'meshSettings.scale', points: [[0, scl], [0.5, r3([scl[0] * k, scl[1] * k, scl[2] * k])], [1, scl]] };
        }
        case 'glow': {
            if (!p.capabilities.emissive) return null;
            const rest = Number(ctx.ledger.get(id, 'materialSettings.emissiveIntensity') ?? 0);
            return { path: 'materialSettings.emissiveIntensity', points: [[0, rest], [0.5, round(rest + Math.max(0.6, rest * 0.8) * e)], [1, rest]] };
        }
        case 'swell': {
            if (!p.capabilities.config.includes('intensity')) return null;
            const rest = Number(ctx.ledger.get(id, 'config.intensity') ?? 1);
            return { path: 'config.intensity', points: [[0, rest], [0.5, round(rest * (1 + 0.25 * e))], [1, rest]] };
        }
    }
    return null;
}

// ---------------------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------------------

const MAX_CAMERA_DEG_PER_S = 60;

/** Pull back from further away into the authored pose. */
export function planCameraDolly(ctx: RecipeContext, amp: number): { path: string; away: DraftValue; rest: DraftValue } | null {
    const pos = asV3(ctx.ledger.get('camera', 'position'), ctx.profile.camera.position);
    const target = asV3(ctx.ledger.get('camera', 'controls.target'), ctx.profile.camera.target);
    const k = 1 + 0.35 * amp * ctx.style.amplitudeMul;
    const away: V3 = r3([target[0] + (pos[0] - target[0]) * k, target[1] + (pos[1] - target[1]) * k, target[2] + (pos[2] - target[2]) * k]);
    return { path: 'position', away, rest: pos };
}

/**
 * Swing around a centre and back (0 → ±A → 0 on a sine, so it starts and ends at
 * rest and its speed is continuous). The swing is limited so the peak angular
 * speed stays under MAX_CAMERA_DEG_PER_S. Returns sampled position keys (a chord
 * between two far keys would cut inside the arc) and, when the camera looks
 * elsewhere, a target track that turns to the centre and back.
 */
export function planCameraOrbit(ctx: RecipeContext, center: V3, duration: number, direction: 1 | -1): DraftTrack[] {
    const pos = asV3(ctx.ledger.get('camera', 'position'), ctx.profile.camera.position);
    const target = asV3(ctx.ledger.get('camera', 'controls.target'), ctx.profile.camera.target);
    const dx = pos[0] - center[0];
    const dz = pos[2] - center[2];
    const radius = Math.hypot(dx, dz);
    if (radius < 1e-3 || duration <= 0) return [];
    const a0 = Math.atan2(dz, dx);
    const maxDeg = (MAX_CAMERA_DEG_PER_S * duration) / Math.PI; // peak of A·π/D
    const A = (Math.min(ctx.style.orbitDeg, maxDeg) * Math.PI) / 180 * direction;
    const n = Math.max(8, Math.ceil(duration / 0.25));
    const keys = Array.from({ length: n + 1 }, (_, i) => {
        const t = (duration * i) / n;
        const a = a0 + A * Math.sin((Math.PI * t) / duration);
        return { id: ctx.makeId('k'), t: round(t), value: r3([center[0] + radius * Math.cos(a), pos[1], center[2] + radius * Math.sin(a)]) as DraftValue, ease: 'linear' as DraftEase };
    });
    const tracks: DraftTrack[] = [{ id: ctx.makeId('tr'), state: 'camera', path: 'position', keys }];
    const off = Math.hypot(target[0] - center[0], target[1] - center[1], target[2] - center[2]);
    if (off > ctx.profile.scale * 0.05) {
        tracks.push({
            id: ctx.makeId('tr'), state: 'camera', path: 'controls.target',
            keys: [
                { id: ctx.makeId('k'), t: 0, value: target, ease: 'easeInOutCubic' },
                { id: ctx.makeId('k'), t: round(duration * 0.25), value: r3(center), ease: 'linear' },
                { id: ctx.makeId('k'), t: round(duration * 0.75), value: r3(center), ease: 'easeInOutCubic' },
                { id: ctx.makeId('k'), t: round(duration), value: target },
            ],
        });
    }
    return tracks;
}

// ---------------------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------------------

/** The slow layer: sky elevation and cloud coverage, when those are on. */
export function environmentPaths(ctx: RecipeContext): Array<{ state: string; path: string; delta: number; min: number; max: number }> {
    const env = ctx.profile.environment;
    const out: Array<{ state: string; path: string; delta: number; min: number; max: number }> = [];
    const a = ctx.style.amplitudeMul;
    if (env.sky && typeof ctx.ledger.get('sky', 'elevation') === 'number') out.push({ state: 'sky', path: 'elevation', delta: 6 * a, min: -5, max: 90 });
    if (env.clouds && typeof ctx.ledger.get('clouds', 'config.coverage') === 'number') out.push({ state: 'clouds', path: 'config.coverage', delta: 0.1 * a, min: 0, max: 1 });
    return out;
}
