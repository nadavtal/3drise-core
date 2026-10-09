// =============================================================================
// generateAnimation — scene profile + template + style → clips and a sequence.
// =============================================================================
//
// Templates:
//   intro    Reveal (hero enters, camera pulls in) → Ensemble (groups cascade in,
//            the rest follow, lights) → Showcase (camera swings around the hero,
//            the hero pulses). Ends on the authored scene. Plays once (hold).
//   ambient  One looping step: everything breathes / floats / sways and returns to
//            rest, the camera swings out and back — seamless at the loop seam.
//
// Rules enforced here (see claude/auto-animate-plan.md): continuity through a
// ledger; group coherence (same recipe, ease, duration, ±7% amplitude, cascade in
// spatial order with a fixed total stagger); scale-relative magnitudes; ground;
// camera speed limit; return to rest; beat grid (0.25 s); no parent + child on the
// same object chain; saved objects only; a later entrance is staged at its start
// pose from the first frame (so nothing pops in before its turn).
//
import { toActionKey, uniqueActionKey } from '../utils/actionKeys';
import { analyzeScene } from './sceneAnalyzer';
import { createRng } from './rng';
import type { DraftClip, DraftEase, DraftKey, DraftSequence, DraftTrack, DraftValue } from './draft';
import {
    chooseEnter, environmentPaths, Ledger, planAmbient, planCameraDolly, planCameraOrbit, planEnter, planLightEnter,
    round, STYLES, type AmbientName, type EnterMove, type EnterName, type RecipeContext, type StyleName,
} from './recipes';
import { validateGenerated, type GenerationIssue } from './validator';
import type { AnalyzeOptions, GroupProfile, ObjectProfile, SceneInput, SceneProfile, V3 } from './types';

export type AutoTemplate = 'intro' | 'ambient';
export type LengthName = 'short' | 'medium' | 'long';

export interface GenerateOptions {
    template: AutoTemplate;
    style: StyleName;
    length: LengthName;
    driver?: DraftSequence['driver'];
    seed?: number;
    /** Ids for new clips / sequences / tracks / keys (the studio's temp ids). */
    makeId?: (prefix: string) => string;
    /** Keys already used by the project's clips and sequences. */
    takenKeys?: string[];
    /** A profile computed with live measurements; otherwise analysed here from settings. */
    profile?: SceneProfile;
    analyze?: AnalyzeOptions;
    /** Start the sequence when the published project loads. */
    autoplay?: boolean;
    /**
     * Animate objects that still have temp ids. Safe since the save rewrites every temp id
     * in a batch (data-center assignBatchIds + client tempIdRemap), clip tracks included —
     * the scene agent creates and animates objects in one request.
     */
    includeUnsaved?: boolean;
}

export interface GenerateResult {
    clips: DraftClip[];
    sequence: DraftSequence;
    profile: SceneProfile;
    issues: GenerationIssue[];
}

const LENGTH_MUL: Record<LengthName, number> = { short: 0.8, medium: 1, long: 1.3 };
const BEAT = 0.25;
const snap = (t: number, min = BEAT) => Math.max(min, Math.round(t / BEAT) * BEAT);
const defaultId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const getAtPath = (obj: any, path: string): any =>
    path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function generateAnimation(input: SceneInput, options: GenerateOptions): GenerateResult {
    const profile = options.profile ?? analyzeScene(input, options.analyze);
    const makeId = options.makeId ?? defaultId;
    const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
    const rng = createRng(seed);
    const style = STYLES[options.style] ?? STYLES.calm;
    const driver = options.driver ?? 'time';
    const objectsById = new Map((input.objects ?? []).map((o: any) => [o.id, o]));
    const authored = (state: string, path: string): DraftValue | undefined => {
        const src = state === 'camera' ? input.camera
            : state === 'sky' ? input.sky
            : state === 'clouds' ? input.clouds
            : state === 'ocean' ? input.ocean
            : state === 'terrain' ? input.terrain
            : objectsById.get(state);
        const v = getAtPath(src, path);
        return v === undefined ? undefined : (Array.isArray(v) ? [...v] : v);
    };
    const ctx: RecipeContext = { profile, rng, style, ledger: new Ledger(authored), makeId, driven: driver !== 'time' };

    const taken = new Set(options.takenKeys ?? []);
    const keyFor = (name: string) => {
        const k = uniqueActionKey(toActionKey(name), taken);
        taken.add(k);
        return k;
    };

    const clips: DraftClip[] = [];
    const steps: DraftSequence['steps'] = [];
    const lenMul = LENGTH_MUL[options.length] ?? 1;
    const dur = (base: number) => snap(base * style.durationMul * lenMul);

    // --- helpers ------------------------------------------------------------------------
    const key = (t: number, value: DraftValue, ease?: DraftEase): DraftKey => ({ id: makeId('k'), t: round(t), value, ...(ease ? { ease } : {}) });
    const track = (state: string, path: string, keys: DraftKey[]): DraftTrack => ({ id: makeId('tr'), state, path, keys });
    const enterTracks = (moves: EnterMove[], t0: number, d: number): DraftTrack[] =>
        moves.map(m => track(m.state, m.path, [key(t0, m.away, m.ease), key(t0 + d, m.rest)]));
    const addClip = (name: string, tracks: DraftTrack[], duration: number, description?: string): DraftClip | null => {
        if (!tracks.length) return null;
        const clip: DraftClip = {
            id: makeId('clip'), name: `Auto · ${name}`, key: keyFor(`auto ${name}`), description,
            duration: round(duration, 3), fps: 30, loop: false, yoyo: false, endMode: 'hold', tracks,
        };
        clips.push(clip);
        ctx.ledger.commit(tracks);
        return clip;
    };
    const addStep = (list: Array<DraftClip | null>) => {
        const ok = list.filter((c): c is DraftClip => !!c);
        if (ok.length) steps.push({ id: makeId('step'), clips: ok.map(c => ({ id: makeId('sc'), clipId: c.id, delay: 0, speed: 1 })) });
        return ok.length ? Math.max(...ok.map(c => c.duration)) : 0;
    };

    // --- who moves ----------------------------------------------------------------------------
    const byId = new Map(profile.objects.map(p => [p.id, p]));
    const ancestors = (p: ObjectProfile): string[] => {
        const out: string[] = [];
        let cur = p.parentId ? byId.get(p.parentId) : undefined;
        while (cur && out.length < 64) { out.push(cur.id); cur = cur.parentId ? byId.get(cur.parentId) : undefined; }
        return out;
    };
    const hero = profile.heroId ? byId.get(profile.heroId) ?? null : null;
    const animated = new Set<string>();
    /** A new object may move unless it or one of its ancestors / descendants already does. */
    const usable = (p: ObjectProfile) => p.saved || !!options.includeUnsaved;
    const canAnimate = (p: ObjectProfile) =>
        usable(p) && p.visible && !animated.has(p.id) && !ancestors(p).some(a => animated.has(a)) &&
        ![...animated].some(id => ancestors(byId.get(id)!).includes(p.id));
    if (hero && usable(hero)) animated.add(hero.id);

    const groups: Array<{ group: GroupProfile | null; name: string; members: ObjectProfile[] }> = [];
    for (const g of profile.groups) {
        const members = g.memberIds.map(id => byId.get(id)!).filter(m => m.role !== 'hero');
        const free = members.filter(canAnimate);
        if (free.length < 2) continue;
        free.forEach(m => animated.add(m.id));
        const order = (rng.next() < 0.5 ? g.order : g.radialOrder).filter(id => free.some(m => m.id === id));
        const first = byId.get(order[0])!;
        const label = g.kind === 'parent' ? byId.get(g.parentId!)?.name ?? 'Group' : `${first.name.replace(/[\s_\-.#]*\d+\s*$/, '') || first.name}s`;
        groups.push({ group: g, name: label, members: order.map(id => byId.get(id)!) });
    }
    const standalone = profile.objects
        .filter(p => (p.role === 'standalone' || p.role === 'member') && canAnimate(p))
        .sort((a, b) => a.bounds.center[0] - b.bounds.center[0]);
    standalone.forEach(p => animated.add(p.id));
    const lights = profile.objects.filter(p => p.role === 'light' && usable(p) && p.capabilities.config.includes('intensity'));
    const center: V3 = hero ? hero.bounds.center : profile.bounds.center;

    // =========================================================================================
    if (options.template === 'ambient') {
        const T = dur(4);
        const phaseSpan = T * 0.5;
        const stepClips: Array<DraftClip | null> = [];
        const ambientTracks = (p: ObjectProfile, name: AmbientName, amp: number, phase: number): DraftTrack[] => {
            const plan = planAmbient(name, p, amp, ctx);
            if (!plan) return [];
            return [track(p.id, plan.path, plan.points.map(([f, v], i) => key(phase + f * T, v, i < plan.points.length - 1 ? style.ambientEase : undefined)))];
        };
        if (hero && animated.has(hero.id)) {
            stepClips.push(addClip(hero.name, [...ambientTracks(hero, 'float', 1, 0), ...ambientTracks(hero, 'glow', 1, 0)], T, 'Hero: float and glow'));
        }
        for (const g of groups) {
            const name = rng.pick<AmbientName>(['float', 'sway', 'breathe']);
            const n = g.members.length;
            const tracks = g.members.flatMap((m, i) => ambientTracks(m, name, rng.jitter(0.07), snap((phaseSpan * i) / Math.max(1, n), 0)));
            stepClips.push(addClip(g.name, tracks, T + phaseSpan, `${name}, a wave across the group`));
        }
        if (standalone.length) {
            const n = standalone.length;
            const tracks = standalone.flatMap((m, i) => ambientTracks(m, 'float', rng.jitter(0.07) * 0.7, snap((phaseSpan * i) / Math.max(1, n), 0)));
            stepClips.push(addClip('Others', tracks, T + phaseSpan, 'Gentle float'));
        }
        if (lights.length) {
            stepClips.push(addClip('Lights', lights.flatMap(l => ambientTracks(l, 'swell', rng.jitter(0.07), 0)), T, 'Light swell'));
        }
        const L = Math.max(T, ...stepClips.filter(Boolean).map(c => c!.duration));
        stepClips.push(addClip('Camera', planCameraOrbit(ctx, center, L, rng.next() < 0.5 ? 1 : -1), L, 'Swing out and back'));
        const envTracks = environmentPaths(ctx).map(e => {
            const v = Number(ctx.ledger.get(e.state, e.path));
            const peak = round(Math.min(e.max, Math.max(e.min, v + e.delta / 2)));
            return track(e.state, e.path, [key(0, v, 'easeInOutSine'), key(L / 2, peak, 'easeInOutSine'), key(L, v)]);
        });
        stepClips.push(addClip('Atmosphere', envTracks, L, 'Slow environment drift'));
        addStep(stepClips);
    } else {
        // ---------------------------------------------------------------- intro
        const D = dur(1.2);
        const envs = environmentPaths(ctx);
        // Plan every entrance first: their start poses are staged from the first frame.
        const heroMoves = hero && animated.has(hero.id) ? chooseEnter(hero, 1, ctx).moves : [];
        const groupPlans = groups.map(g => {
            // One recipe for the whole group: the first of the style that works for every member.
            const names: EnterName[] = [...style.enters, 'pop'];
            const name = names.find(nm => g.members.every(m => planEnter(nm, m, 1, ctx))) ?? 'pop';
            const amps = g.members.map(() => rng.jitter(0.07));
            return { ...g, moves: g.members.map((m, i) => planEnter(name, m, amps[i], ctx) ?? []), recipe: name };
        });
        const standaloneMoves = standalone.map(p => chooseEnter(p, 0.8 * rng.jitter(0.07), ctx).moves);
        const lightMoves = style.name === 'cinematic' ? lights.flatMap(l => planLightEnter(l, ctx)) : [];

        // Step 1 — Reveal
        const later = [...groupPlans.flatMap(g => g.moves.flat()), ...standaloneMoves.flat(), ...lightMoves];
        const step1: Array<DraftClip | null> = [];
        step1.push(addClip('Staging', later.map(m => track(m.state, m.path, [key(0, m.away)])), BEAT, 'Start poses of what enters later'));
        if (heroMoves.length) step1.push(addClip(`${hero!.name} enters`, enterTracks(heroMoves, 0, D), D, 'Hero entrance'));
        const dolly = planCameraDolly(ctx, 1);
        const Dc = dur(1.6);
        if (dolly) step1.push(addClip('Camera in', [track('camera', dolly.path, [key(0, dolly.away, style.name === 'cinematic' ? 'easeInOutCubic' : 'easeOutCubic'), key(Dc, dolly.rest)])], Dc, 'Pull in to the authored view'));
        const L1 = Math.max(D, Dc);

        // Step 2 — Ensemble
        const step2: Array<DraftClip | null> = [];
        for (const g of groupPlans) {
            const n = g.members.length;
            const S = snap(Math.min(1.4, Math.max(0.4, 0.18 * n)) * style.durationMul, 0);
            const tracks = g.moves.flatMap((moves, i) => enterTracks(moves, n > 1 ? round((S * i) / (n - 1)) : 0, D));
            step2.push(addClip(`${g.name} enter`, tracks, D + S, `${g.recipe}, cascading`));
        }
        if (standalone.length) {
            const n = standalone.length;
            const S = snap(Math.min(1.2, Math.max(0.3, 0.15 * n)) * style.durationMul, 0);
            step2.push(addClip('Others enter', standaloneMoves.flatMap((moves, i) => enterTracks(moves, n > 1 ? round((S * i) / (n - 1)) : 0, D)), D + S));
        }
        if (lightMoves.length) step2.push(addClip('Lights on', enterTracks(lightMoves, 0, D * 1.5), D * 1.5));
        const L2 = step2.filter(Boolean).length ? Math.max(...step2.filter(Boolean).map(c => c!.duration)) : 0;

        // Step 3 — Showcase
        const Do = dur(4);
        const step3: Array<DraftClip | null> = [];
        step3.push(addClip('Camera orbit', planCameraOrbit(ctx, center, Do, rng.next() < 0.5 ? 1 : -1), Do, 'Swing around and back'));
        if (hero && animated.has(hero.id)) {
            const accent = planAmbient(hero.capabilities.emissive ? 'glow' : 'breathe', hero, 1, ctx);
            if (accent) {
                const T = Math.min(Do, dur(1.6));
                step3.push(addClip(`${hero.name} accent`, [track(hero.id, accent.path, accent.points.map(([f, v], i) => key(round((Do - T) / 2 + f * T), v, i < accent.points.length - 1 ? style.ambientEase : undefined)))], Do));
            }
        }

        // Atmosphere: one continuous slow move across the steps (rest − δ → rest).
        const lengths = [L1, L2, Do];
        const total = lengths.reduce((a, b) => a + b, 0);
        const envClip = (stepIndex: number): DraftClip | null => {
            const L = lengths[stepIndex];
            if (!L || !envs.length) return null;
            const before = lengths.slice(0, stepIndex).reduce((a, b) => a + b, 0);
            const tracks = envs.map(e => {
                const rest = Number(ctx.ledger.get(e.state, e.path));
                // rest here is where the previous slice left it; the full move ends at the authored value
                const authoredV = Number(authored(e.state, e.path));
                const start = Math.min(e.max, Math.max(e.min, authoredV - e.delta));
                const at = (t: number) => round(start + (authoredV - start) * (t / total));
                return track(e.state, e.path, [key(0, stepIndex === 0 ? at(0) : rest, 'linear'), key(L, at(before + L))]);
            });
            return addClip(`Atmosphere ${stepIndex + 1}`, tracks, L, 'Slow environment layer');
        };
        step1.push(envClip(0));
        addStep(step1);
        if (L2) { step2.push(envClip(1)); addStep(step2); }
        step3.push(envClip(2));
        addStep(step3);
    }

    const name = `Auto · ${options.template === 'ambient' ? 'Ambient loop' : 'Intro'} (${style.name})`;
    const sequence: DraftSequence = {
        id: makeId('seq'),
        name,
        key: keyFor(name),
        description: `Generated from the scene (seed ${seed}).`,
        steps,
        cues: [],
        loop: options.template === 'ambient' && driver === 'time',
        yoyo: false,
        reverse: false,
        endMode: 'hold',
        driver,
        driverSettings: { sensitivity: 1, smoothing: 0.25, invert: false },
        autoplay: options.autoplay ?? false,
    };

    const issues = validateGenerated(clips, sequence, { driven: ctx.driven });
    return { clips, sequence, profile, issues };
}
