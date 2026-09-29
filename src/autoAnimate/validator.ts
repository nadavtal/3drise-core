// Checks (and small fixes) on generated clips + sequence. The composer is built to
// satisfy the rules; this proves it, and is the gate the AI agent's output will
// go through too.
import type { DraftClip, DraftSequence, DraftValue } from './draft';
import { OVERSHOOT_EASES } from './draft';

export interface GenerationIssue {
    kind: 'jump' | 'conflict' | 'range' | 'ease';
    message: string;
    clipId?: string;
}

const same = (a: DraftValue | undefined, b: DraftValue | undefined, eps = 1e-3): boolean => {
    if (a === undefined || b === undefined) return true;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => Math.abs(Number(v) - Number(b[i])) <= eps * Math.max(1, Math.abs(Number(v))));
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= eps * Math.max(1, Math.abs(a));
    return a === b;
};

export function validateGenerated(clips: DraftClip[], seq: DraftSequence, opts: { driven: boolean }): GenerationIssue[] {
    const issues: GenerationIssue[] = [];
    const byId = new Map(clips.map(c => [c.id, c]));

    // Driven sequences: no overshoot eases (they feel wrong scrubbed backwards). Fixed in place.
    if (opts.driven) {
        for (const c of clips) for (const t of c.tracks) for (const k of t.keys) {
            if (k.ease && OVERSHOOT_EASES.has(k.ease)) {
                k.ease = 'easeOutCubic';
                issues.push({ kind: 'ease', message: `${c.name}: overshoot ease replaced for a driven sequence`, clipId: c.id });
            }
        }
    }

    // Keys inside their clip, sorted.
    for (const c of clips) for (const t of c.tracks) {
        t.keys.sort((a, b) => a.t - b.t);
        if (t.keys.some(k => k.t < -1e-6 || k.t > c.duration + 1e-6)) {
            issues.push({ kind: 'range', message: `${c.name}: a key sits outside the clip`, clipId: c.id });
        }
    }

    // One writer per property per step; continuity from step to step.
    const ledger = new Map<string, DraftValue>();
    seq.steps.forEach((step, si) => {
        const owners = new Map<string, string>();
        for (const sc of step.clips) {
            const c = byId.get(sc.clipId);
            if (!c) continue;
            for (const t of c.tracks) {
                const k = `${t.state}|${t.node ?? ''}|${t.path}`;
                if (owners.has(k) && owners.get(k) !== c.id) {
                    issues.push({ kind: 'conflict', message: `Step ${si + 1}: two clips drive ${t.path} of ${t.state}`, clipId: c.id });
                }
                owners.set(k, c.id);
                if (si > 0 && ledger.has(k) && !same(ledger.get(k), t.keys[0]?.value)) {
                    issues.push({ kind: 'jump', message: `Step ${si + 1}: ${c.name} starts ${t.path} away from where it was left`, clipId: c.id });
                }
            }
        }
        for (const sc of step.clips) {
            const c = byId.get(sc.clipId);
            c?.tracks.forEach(t => { const last = t.keys[t.keys.length - 1]; if (last) ledger.set(`${t.state}|${t.node ?? ''}|${t.path}`, last.value); });
        }
    });
    return issues;
}
