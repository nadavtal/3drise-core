// =============================================================================
// SceneActions — runtime settings patches (actions)
// =============================================================================
//
// The scene has three layers of state:
//
//   authored settings   (Redux in the editor, project props in a published scene)
//     -> action patches  (this store: runtime only, stackable, exactly revertible)
//       -> per-frame overrides (animations, mouse-move, sequences, live drags)
//
// An action is a list of targets, each a `state` key (object id, or 'camera' |
// 'sky' | 'ocean' | 'clouds') and a patch — a deep partial of that element's
// settings. Applying pushes the patches; reverting removes them. Because a patch
// goes through the element's normal settings path, structural changes (material
// variant, display mode, light shape, particle count) work exactly as an edit in
// the panel does, and revert is exact: no `from` values to record.
//
// Renderers read their element's merged patch with `getPatch(state)` +
// `subscribe(state)` (viewer's useRuntimeSettings wraps both), so only the
// elements an action touches re-render.
//
// Nothing here is persisted. `reset()` on project load.
//
import type { ActionSequence } from '../types/actions';
import { composeSettingsPatches, type SettingsPatch } from '../utils/settingsPatch';

type Listener = () => void;

export type SceneActionsEvent =
    | { type: 'applied'; actionId: string }
    | { type: 'reverted'; actionId: string }
    | { type: 'reset' };

interface StackEntry {
    actionId: string;
    patch: SettingsPatch;
}

class SceneActions {
    private stacks = new Map<string, StackEntry[]>();
    private merged = new Map<string, SettingsPatch | undefined>();
    private applied = new Set<string>();
    private stateListeners = new Map<string, Set<Listener>>();
    private eventListeners = new Set<(event: SceneActionsEvent) => void>();
    private version = 0;

    /** Apply an action. Re-applying moves its patches to the top of each stack. */
    applyAction(action: ActionSequence): void {
        const touched = this.removeEntries(action.id);
        for (const target of action.targets ?? []) {
            if (!target?.state || !target.patch || Object.keys(target.patch).length === 0) continue;
            const stack = this.stacks.get(target.state) ?? [];
            stack.push({ actionId: action.id, patch: target.patch });
            this.stacks.set(target.state, stack);
            touched.add(target.state);
        }
        this.applied.add(action.id);
        this.commit(touched, { type: 'applied', actionId: action.id });
    }

    /** Remove an action's patches from every element it touched. */
    revertAction(actionOrId: ActionSequence | string): void {
        const actionId = typeof actionOrId === 'string' ? actionOrId : actionOrId.id;
        if (!this.applied.has(actionId)) return;
        const touched = this.removeEntries(actionId);
        this.applied.delete(actionId);
        this.commit(touched, { type: 'reverted', actionId });
    }

    /** Apply when not applied, revert when applied. Returns true when it applied. */
    toggleAction(action: ActionSequence): boolean {
        if (this.applied.has(action.id)) {
            this.revertAction(action.id);
            return false;
        }
        this.applyAction(action);
        return true;
    }

    isActionApplied(actionId: string): boolean {
        return this.applied.has(actionId);
    }

    getAppliedActionIds(): string[] {
        return Array.from(this.applied);
    }

    /** Drop every patch (project load, "reset" in the editor). */
    reset(): void {
        const touched = new Set(this.stacks.keys());
        this.stacks.clear();
        this.applied.clear();
        this.commit(touched, { type: 'reset' });
    }

    /** The merged patch for one element — stable identity until it changes. */
    getPatch(state: string | undefined | null): SettingsPatch | undefined {
        if (!state) return undefined;
        return this.merged.get(state);
    }

    /** Subscribe to one element's patch. Returns the unsubscribe. */
    subscribe(state: string, listener: Listener): () => void {
        let set = this.stateListeners.get(state);
        if (!set) {
            set = new Set();
            this.stateListeners.set(state, set);
        }
        set.add(listener);
        return () => {
            set!.delete(listener);
            if (set!.size === 0) this.stateListeners.delete(state);
        };
    }

    /** Subscribe to apply / revert / reset events (UI badges, the component API). */
    onEvent(listener: (event: SceneActionsEvent) => void): () => void {
        this.eventListeners.add(listener);
        return () => this.eventListeners.delete(listener);
    }

    /** Monotonic counter, bumped on every change (a cheap useSyncExternalStore snapshot). */
    getVersion(): number {
        return this.version;
    }

    private removeEntries(actionId: string): Set<string> {
        const touched = new Set<string>();
        for (const [state, stack] of this.stacks) {
            const next = stack.filter(e => e.actionId !== actionId);
            if (next.length === stack.length) continue;
            touched.add(state);
            if (next.length === 0) this.stacks.delete(state);
            else this.stacks.set(state, next);
        }
        return touched;
    }

    private commit(touched: Set<string>, event: SceneActionsEvent): void {
        for (const state of touched) {
            const stack = this.stacks.get(state);
            this.merged.set(state, stack ? composeSettingsPatches(stack.map(e => e.patch)) : undefined);
            if (!stack) this.merged.delete(state);
        }
        this.version += 1;
        for (const state of touched) {
            this.stateListeners.get(state)?.forEach(l => {
                try { l(); } catch (err) { console.error('[SceneActions] listener failed', err); }
            });
        }
        this.eventListeners.forEach(l => {
            try { l(event); } catch (err) { console.error('[SceneActions] event listener failed', err); }
        });
    }
}

const sceneActions = new SceneActions();
export default sceneActions;
