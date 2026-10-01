/**
 * Track generators — motion math baked into ordinary clip keyframes.
 *
 * A generator is a small parameter object (oscillate / orbit / spin / noise /
 * pulse / tween / expr). `bakeTrack` turns it into keyframes the Animations V2
 * runtime already understands, so the viewer, the timeline and the published
 * scene never change: users get editable keys, the aiAgent gets a vocabulary
 * of motion instead of hand-typed keyframes. `expandStagger` clones one track
 * (keys or generator) across many objects with a time offset — the ripple.
 *
 * ZERO dependencies on purpose: this file is copied verbatim into aiAgent
 * (CommonJS; it cannot import core, which is ESM — see particlesCatalog.ts for
 * the same pattern). Source of truth: packages/core/src/animations/trackGenerators.ts.
 * When it changes, copy the whole file over aiAgent/src/skills/createAnimation/trackGenerators.ts.
 *
 * Values: number, [x,y,z] vectors (per-component math), '#rrggbb' colours
 * (tween / pulse only) and booleans (tween only: a step).
 */

// =============================================================================
// Types
// =============================================================================

export type GenValue = number | number[] | string | boolean;

/** Structurally the viewer's ClipKeyframe (id, t, value, ease). */
export interface GenKeyframe {
    id: string;
    t: number;
    value: GenValue;
    ease?: string;
}

export const GENERATOR_TYPES = ['oscillate', 'orbit', 'spin', 'noise', 'pulse', 'tween', 'expr'] as const;
export type GeneratorType = typeof GENERATOR_TYPES[number];

export type GeneratorAxis = 'x' | 'y' | 'z';

/**
 * Flat on purpose (strict structured output on every LLM provider accepts a flat
 * object with nullable fields; unions are unreliable). Unused fields are ignored.
 */
export interface TrackGenerator {
    type: GeneratorType;
    /** Start value. null/undefined = the authored value (`base`). tween / pulse / expr. */
    from?: GenValue | null;
    /** End value (tween; null with `from` set = the authored value) or peak (pulse). */
    to?: GenValue | null;
    /** Amplitude: number (all components) or [x,y,z] (per component; 0 leaves a component still). oscillate / noise. */
    amp?: GenValue | null;
    /** Hz. oscillate / noise. Default 0.5 (oscillate), 1 (noise). */
    freq?: number | null;
    /** Radians. oscillate: phase offset. orbit: start angle (default = where the object already is). */
    phase?: number | null;
    /** Seconds per revolution. orbit / spin. Negative = the other way. */
    period?: number | null;
    /** How many cycles / revolutions fit in the window. Alternative to freq / period. tween: repeats. */
    cycles?: number | null;
    /** tween: go back on every other cycle. */
    yoyo?: boolean | null;
    /** Ease of the tween / pulse segments. Default easeInOutCubic. */
    ease?: string | null;
    /** orbit: [x,y,z]; null = scene centre (option) or origin. */
    center?: number[] | null;
    /** orbit: null = the object's current distance from the centre. */
    radius?: number | null;
    /** orbit: axis of revolution (default y). spin: axis that turns (default y). */
    axis?: GeneratorAxis | null;
    /** orbit: vertical bob as a fraction of the radius (0 = flat); zero at the start angle. */
    tilt?: number | null;
    /** noise: octaves (default 2). */
    octaves?: number | null;
    /** noise / expr noise() / stagger random: deterministic seed. */
    seed?: number | null;
    /** expr: a formula — see EXPR_HELP. */
    expr?: string | null;
    /** Window inside the clip, seconds. Default 0..duration. */
    start?: number | null;
    end?: number | null;
}

export interface BakeOptions {
    /** Clip duration, seconds. */
    duration: number;
    /** Authored value of the path (the object's current value). */
    base?: GenValue;
    /** Index / count inside a stagger group (expr: i, n). */
    i?: number;
    n?: number;
    /** Default orbit centre. */
    sceneCenter?: number[];
    /** Samples per second for smooth generators. Default 20. */
    sampleRate?: number;
    /** Cap on keys per track. Default 600. */
    maxKeys?: number;
    makeId?: () => string;
}

export const EXPR_HELP =
    'Variables: t (seconds since the window start), u (0..1 progress), d (window length), T (clip time), ' +
    'base (authored value, per component for vectors), k (component index 0..2), i, n (position in a stagger group), PI, E. ' +
    'Functions: sin cos tan abs min max floor ceil round sqrt pow exp log sign fract mod(a,b) clamp(x,lo,hi) ' +
    'lerp(a,b,u) smoothstep(lo,hi,x) step(edge,x) noise(x[,seed]) (-1..1, smooth) rand(seed) (0..1, constant). ' +
    'Operators + - * / % ^, parentheses, unary minus. Example: "base + 0.2*sin(2*PI*0.5*t + i*0.6)".';

// =============================================================================
// Small helpers
// =============================================================================

const TAU = Math.PI * 2;
let idCounter = 0;
const defaultId = () => `temp-key-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
const round = (n: number) => Math.round(n * 10000) / 10000;
const isVec = (v: unknown): v is number[] => Array.isArray(v) && v.every(x => typeof x === 'number');
const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const AXIS_INDEX: Record<GeneratorAxis, number> = { x: 0, y: 1, z: 2 };

function hashSeed(seed: number): number {
    let h = (seed | 0) ^ 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return (h ^ (h >>> 16)) >>> 0;
}

/** Deterministic 0..1 for an integer lattice point. */
function latticeRand(x: number, seed: number): number {
    let h = hashSeed(seed + Math.imul(x | 0, 374761393));
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

/** Smooth 1D value noise, -1..1, period-free. */
export function noise1d(x: number, seed = 0, octaves = 1): number {
    let sum = 0, ampSum = 0, amp = 1, f = 1;
    for (let o = 0; o < Math.max(1, octaves | 0); o++) {
        const xf = x * f;
        const x0 = Math.floor(xf);
        const frac = xf - x0;
        const s = frac * frac * (3 - 2 * frac);
        const a = latticeRand(x0, seed + o * 7919) * 2 - 1;
        const b = latticeRand(x0 + 1, seed + o * 7919) * 2 - 1;
        sum += (a + (b - a) * s) * amp;
        ampSum += amp;
        amp *= 0.5;
        f *= 2;
    }
    return sum / ampSum;
}

function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]: number[]): string {
    const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
}

/** Per-component view of a value: numbers → [n], vectors as-is. */
function components(v: GenValue | undefined, fallbackLen = 1): number[] {
    if (typeof v === 'number') return [v];
    if (isVec(v)) return v.slice();
    return new Array(fallbackLen).fill(0);
}
function fromComponents(c: number[], like: GenValue | undefined): GenValue {
    return isVec(like) ? c.map(round) : round(c[0]);
}
/** Broadcast a number / vector parameter to `len` components. */
function spread(v: GenValue | null | undefined, len: number, fallback: number): number[] {
    if (typeof v === 'number') return new Array(len).fill(v);
    if (isVec(v)) return Array.from({ length: len }, (_, k) => v[k] ?? 0);
    return new Array(len).fill(fallback);
}

interface Window { start: number; end: number; length: number }
function windowOf(gen: TrackGenerator, duration: number): Window {
    const start = Math.max(0, gen.start ?? 0);
    const end = Math.min(duration, gen.end ?? duration);
    return { start, end: Math.max(start, end), length: Math.max(0, end - start) };
}

// =============================================================================
// Expression evaluator — tiny recursive-descent parser, no eval.
// =============================================================================

type Scope = Record<string, number>;
type Node = (s: Scope) => number;

const FUNCS: Record<string, (...a: number[]) => number> = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, floor: Math.floor, ceil: Math.ceil,
    round: Math.round, sqrt: Math.sqrt, exp: Math.exp, log: Math.log, sign: Math.sign,
    min: (...a) => Math.min(...a), max: (...a) => Math.max(...a), pow: Math.pow,
    fract: x => x - Math.floor(x),
    mod: (a, b) => (b === 0 ? 0 : a - b * Math.floor(a / b)),
    clamp: (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
    lerp: (a, b, u) => a + (b - a) * u,
    smoothstep: (lo, hi, x) => { const u = Math.min(1, Math.max(0, (x - lo) / (hi - lo || 1))); return u * u * (3 - 2 * u); },
    step: (edge, x) => (x < edge ? 0 : 1),
    noise: (x, seed = 0) => noise1d(x, seed | 0, 2),
    rand: (seed = 0) => latticeRand(0, seed | 0),
};

type Tok = { k: 'num'; v: number } | { k: 'id'; v: string } | { k: 'op'; v: string };

function tokenize(src: string): Tok[] {
    const out: Tok[] = [];
    let i = 0;
    while (i < src.length) {
        const c = src[i];
        if (/\s/.test(c)) { i++; continue; }
        if (/[0-9.]/.test(c)) {
            const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
            if (!m) throw new Error(`bad number at ${i}`);
            out.push({ k: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue;
        }
        if (/[a-zA-Z_]/.test(c)) {
            const m = /^[a-zA-Z_][a-zA-Z0-9_]*/.exec(src.slice(i))!;
            out.push({ k: 'id', v: m[0] }); i += m[0].length; continue;
        }
        if ('+-*/%^(),'.includes(c)) { out.push({ k: 'op', v: c }); i++; continue; }
        throw new Error(`unexpected "${c}" at ${i}`);
    }
    return out;
}

/** Compile an expression once; evaluate many times. Throws on a syntax error or unknown name. */
export function compileExpr(src: string): (scope: Scope) => number {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const take = () => toks[p++];
    const isOp = (v: string) => peek()?.k === 'op' && (peek() as any).v === v;

    function primary(): Node {
        const t = take();
        if (!t) throw new Error('unexpected end');
        if (t.k === 'num') { const v = t.v; return () => v; }
        if (t.k === 'id') {
            const name = t.v;
            if (isOp('(')) {
                take();
                const args: Node[] = [];
                if (!isOp(')')) { do { args.push(expr()); } while (isOp(',') && take()); }
                if (!isOp(')')) throw new Error(`expected ) after ${name}(`);
                take();
                const fn = FUNCS[name];
                if (!fn) throw new Error(`unknown function ${name}`);
                return s => fn(...args.map(a => a(s)));
            }
            if (name === 'PI') return () => Math.PI;
            if (name === 'E') return () => Math.E;
            return s => { const v = s[name]; if (v === undefined) throw new Error(`unknown variable ${name}`); return v; };
        }
        if (t.k === 'op' && t.v === '(') { const e = expr(); if (!isOp(')')) throw new Error('expected )'); take(); return e; }
        if (t.k === 'op' && t.v === '-') { const e = unary(); return s => -e(s); }
        if (t.k === 'op' && t.v === '+') return unary();
        throw new Error(`unexpected ${t.v}`);
    }
    function unary(): Node { return primary(); }
    function power(): Node {
        const b = unary();
        if (isOp('^')) { take(); const e = power(); return s => Math.pow(b(s), e(s)); }
        return b;
    }
    function term(): Node {
        let l = power();
        while (isOp('*') || isOp('/') || isOp('%')) {
            const op = (take() as any).v; const r = power(); const ll = l;
            l = op === '*' ? s => ll(s) * r(s) : op === '/' ? s => { const d = r(s); return d === 0 ? 0 : ll(s) / d; } : s => FUNCS.mod(ll(s), r(s));
        }
        return l;
    }
    function expr(): Node {
        let l = term();
        while (isOp('+') || isOp('-')) {
            const op = (take() as any).v; const r = term(); const ll = l;
            l = op === '+' ? s => ll(s) + r(s) : s => ll(s) - r(s);
        }
        return l;
    }
    const root = expr();
    if (p < toks.length) throw new Error(`unexpected ${(toks[p] as any).v}`);
    return s => { const v = root(s); return Number.isFinite(v) ? v : 0; };
}

// =============================================================================
// bakeTrack
// =============================================================================

/**
 * Bake a generator into keyframes. Smooth generators are sampled (linear ease
 * between samples, the curve is in the samples); tween / pulse / spin emit exact
 * keys with eases. Returns [] when the generator cannot apply to the base value
 * (e.g. oscillate on a colour) — the caller reports it.
 */
export function bakeTrack(gen: TrackGenerator, opts: BakeOptions): GenKeyframe[] {
    const makeId = opts.makeId ?? defaultId;
    const w = windowOf(gen, opts.duration);
    const base = gen.from ?? opts.base;
    const key = (t: number, value: GenValue, ease?: string): GenKeyframe =>
        ease ? { id: makeId(), t: round(t), value, ease } : { id: makeId(), t: round(t), value };

    switch (gen.type) {
        // tween: `from` given and `to` null = tween INTO the authored value (an entrance).
        case 'tween': return bakeTween(gen.from != null && gen.to == null && opts.base !== undefined ? { ...gen, to: opts.base } : gen, w, base, key);
        case 'pulse': return bakePulse(gen, w, base, key);
        case 'spin': return bakeSpin(gen, w, base, key);
        case 'oscillate': case 'orbit': case 'noise': case 'expr':
            return bakeSampled(gen, w, base, opts, key);
        default: return [];
    }
}

type KeyFn = (t: number, value: GenValue, ease?: string) => GenKeyframe;

function lerpValue(a: GenValue, b: GenValue, u: number): GenValue {
    if (typeof a === 'number' && typeof b === 'number') return round(a + (b - a) * u);
    if (isVec(a) && isVec(b)) return a.map((x, k) => round(x + ((b[k] ?? x) - x) * u));
    if (isColor(a) && isColor(b)) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((x, k) => x + (B[k] - x) * u)); }
    return u < 1 ? a : b;
}

function bakeTween(gen: TrackGenerator, w: Window, base: GenValue | undefined, key: KeyFn): GenKeyframe[] {
    if (base === undefined || gen.to === undefined || gen.to === null) return [];
    const from = base, to = gen.to;
    const ease = gen.ease ?? 'easeInOutCubic';
    const cycles = Math.max(1, Math.round(gen.cycles ?? 1));
    const seg = w.length / cycles;
    const out: GenKeyframe[] = [];
    if (typeof from === 'boolean' || typeof to === 'boolean') {
        // A step: switch at the window start, back at the end if yoyo.
        out.push(key(w.start, from, 'step'), key(w.start + seg, to, 'step'));
        if (gen.yoyo) out.push(key(w.end, from, 'step'));
        return out;
    }
    for (let c = 0; c < cycles; c++) {
        const t0 = w.start + c * seg;
        const forward = !gen.yoyo || c % 2 === 0;
        out.push(key(t0, forward ? from : to, ease));
        // Without yoyo a repeat restarts from `from`: land on `to` just before the jump.
        if (!gen.yoyo && c < cycles - 1) out.push(key(t0 + seg - 0.01, to, 'step'));
    }
    const lastForward = !gen.yoyo || (cycles - 1) % 2 === 0;
    out.push(key(w.end, lastForward ? to : from));
    return out;
}

function bakePulse(gen: TrackGenerator, w: Window, base: GenValue | undefined, key: KeyFn): GenKeyframe[] {
    if (base === undefined || gen.to === undefined || gen.to === null) return [];
    const ease = gen.ease ?? 'easeInOutSine';
    const cycles = Math.max(1, Math.round(gen.cycles ?? (gen.freq ? w.length * gen.freq : 1)));
    const seg = w.length / cycles;
    const out: GenKeyframe[] = [];
    for (let c = 0; c < cycles; c++) {
        const t0 = w.start + c * seg;
        out.push(key(t0, base, ease), key(t0 + seg / 2, gen.to, ease));
    }
    out.push(key(w.end, base));
    return out;
}

function bakeSpin(gen: TrackGenerator, w: Window, base: GenValue | undefined, key: KeyFn): GenKeyframe[] {
    if (base === undefined || typeof base === 'string' || typeof base === 'boolean') return [];
    const revolutions = gen.period ? w.length / gen.period : (gen.cycles ?? 1);
    const delta = TAU * revolutions;
    const comps = components(base);
    const end = comps.slice();
    if (isVec(base)) end[AXIS_INDEX[gen.axis ?? 'y']] += delta; else end[0] += delta;
    return [key(w.start, base, 'linear'), key(w.end, fromComponents(end, base))];
}

function bakeSampled(gen: TrackGenerator, w: Window, base: GenValue | undefined, opts: BakeOptions, key: KeyFn): GenKeyframe[] {
    if (base === undefined || typeof base === 'string' || typeof base === 'boolean') return [];
    if (w.length <= 0) return [];
    const rate = Math.max(1, opts.sampleRate ?? 20);
    const maxKeys = Math.max(2, opts.maxKeys ?? 600);
    const count = Math.min(maxKeys, Math.max(2, Math.round(w.length * rate) + 1));
    const dt = w.length / (count - 1);
    const comps = components(base);
    const len = comps.length;
    const sample = sampler(gen, base, comps, len, w, opts);
    if (!sample) return [];
    const out: GenKeyframe[] = [];
    for (let s = 0; s < count; s++) {
        const t = s * dt;
        const v = sample(t);
        out.push(key(w.start + t, fromComponents(v, base), s < count - 1 ? 'linear' : undefined));
    }
    return out;
}

/** Returns f(t) → components, t relative to the window start. */
function sampler(gen: TrackGenerator, base: GenValue, comps: number[], len: number, w: Window, opts: BakeOptions): ((t: number) => number[]) | null {
    const i = opts.i ?? 0, n = opts.n ?? 1;
    switch (gen.type) {
        case 'oscillate': {
            const amp = spread(gen.amp, len, len === 1 ? 1 : 0);
            if (len > 1 && gen.amp == null) amp[1] = 1; // default: bob on y
            const freq = gen.freq ?? (gen.cycles ? gen.cycles / (w.length || 1) : 0.5);
            const phase = gen.phase ?? 0;
            return t => comps.map((b, k) => b + amp[k] * Math.sin(TAU * freq * t + phase));
        }
        case 'noise': {
            const amp = spread(gen.amp, len, len === 1 ? 1 : 0);
            if (len > 1 && gen.amp == null) amp.fill(1);
            const freq = gen.freq ?? 1;
            const seed = (gen.seed ?? 0) + i * 101;
            const oct = gen.octaves ?? 2;
            return t => comps.map((b, k) => b + amp[k] * noise1d(t * freq + k * 37.1, seed + k * 1000, oct));
        }
        case 'orbit': {
            if (len < 3) return null;
            const axis = gen.axis ?? 'y';
            const [ia, ib, iup] = axis === 'y' ? [0, 2, 1] : axis === 'x' ? [1, 2, 0] : [0, 1, 2];
            const c = gen.center ?? opts.sceneCenter ?? [0, 0, 0];
            const da = comps[ia] - (c[ia] ?? 0), db = comps[ib] - (c[ib] ?? 0);
            const radius = gen.radius ?? (Math.hypot(da, db) || 1);
            const phase0 = gen.phase ?? ((da || db) ? Math.atan2(db, da) : 0);
            const period = gen.period ?? ((w.length / (gen.cycles ?? 1)) || 1);
            const tilt = gen.tilt ?? 0;
            const up0 = comps[iup];
            return t => {
                const th = phase0 + TAU * t / period;
                const v = comps.slice();
                v[ia] = (c[ia] ?? 0) + radius * Math.cos(th);
                v[ib] = (c[ib] ?? 0) + radius * Math.sin(th);
                v[iup] = up0 + tilt * radius * Math.sin(th - phase0); // 0 at the start: no jump
                return v;
            };
        }
        case 'expr': {
            if (!gen.expr) return null;
            const fn = compileExpr(gen.expr); // throws → caller reports
            const scope: Scope = { i, n, d: w.length, t: 0, u: 0, T: 0, base: 0, k: 0 };
            return t => comps.map((b, k) => {
                scope.t = t; scope.u = w.length ? t / w.length : 0; scope.T = w.start + t; scope.base = b; scope.k = k;
                return fn(scope);
            });
        }
        default: return null;
    }
}

// =============================================================================
// expandStagger
// =============================================================================

export type StaggerOrder = 'listed' | 'random' | 'byX' | 'byY' | 'byZ' | 'distanceFrom';

export interface StaggerSpec {
    /** Object ids. */
    targets: string[];
    /** Seconds between consecutive members. */
    offset: number;
    order?: StaggerOrder | null;
    /** distanceFrom: [x,y,z]; null = scene centre. */
    origin?: number[] | null;
    /** random order: seed. */
    seed?: number | null;
    /** The template. Exactly one of keys / gen. */
    track: { path: string; keys?: GenKeyframe[] | null; gen?: TrackGenerator | null };
}

export interface StaggerObject {
    id: string;
    /** World position, for ordering. */
    position?: number[];
    /** Authored value of `track.path` on this object (the base). */
    base?: GenValue;
}

export interface StaggeredTrack { state: string; path: string; keys: GenKeyframe[] }

/** Order the ids; unknown ids are dropped. */
export function orderStagger(spec: StaggerSpec, objects: Record<string, StaggerObject>, sceneCenter?: number[]): string[] {
    const ids = spec.targets.filter(id => objects[id]);
    const order = spec.order ?? 'listed';
    if (order === 'listed') return ids;
    if (order === 'random') {
        const seed = spec.seed ?? 0;
        return ids.map((id, k) => ({ id, r: latticeRand(k, seed) })).sort((a, b) => a.r - b.r).map(x => x.id);
    }
    const pos = (id: string) => objects[id].position ?? [0, 0, 0];
    if (order === 'distanceFrom') {
        const o = spec.origin ?? sceneCenter ?? [0, 0, 0];
        const d = (id: string) => { const p = pos(id); return Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]); };
        return ids.slice().sort((a, b) => d(a) - d(b));
    }
    const k = order === 'byX' ? 0 : order === 'byY' ? 1 : 2;
    return ids.slice().sort((a, b) => pos(a)[k] - pos(b)[k]);
}

/**
 * One track per target: the template baked (or its keys cloned) for that object's
 * base value, shifted by index * offset. The clip's duration should be
 * max(key.t) afterwards — the caller owns that.
 */
export function expandStagger(spec: StaggerSpec, objects: Record<string, StaggerObject>, opts: Omit<BakeOptions, 'base' | 'i' | 'n'>): StaggeredTrack[] {
    const ids = orderStagger(spec, objects, opts.sceneCenter);
    const makeId = opts.makeId ?? defaultId;
    const n = ids.length;
    return ids.map((id, i) => {
        const shift = i * Math.max(0, spec.offset);
        let keys: GenKeyframe[];
        if (spec.track.gen) {
            keys = bakeTrack(spec.track.gen, { ...opts, base: objects[id].base, i, n, makeId });
        } else {
            keys = (spec.track.keys ?? []).map(k => ({ ...k, id: makeId() }));
        }
        return { state: id, path: spec.track.path, keys: keys.map(k => ({ ...k, t: round(k.t + shift) })) };
    });
}
