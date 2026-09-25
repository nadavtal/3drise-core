/**
 * Action Types
 * Defines the structure for UI actions that can trigger animations, toggle elements, or load projects
 */

export type OperationTypes = 'zoom' | 'moveToFront' | 'displayImage' | 'glow' | 'vanish' | 'focus' | 'playAnimation' | 'create' | 'update' | 'delete' | 'toggle' | 'loadProject' | 'none';

export interface Action {
    /** Unique identifier for this action */
    /** Name of the action */
    name: string;
    operation: OperationTypes;
    elementId: string;
    /** Description of the action */
    schemaType: string;
    targetIds?: string[];
    description?: string;
    /** Animation sequence IDs to play when this action is executed */
    animationIds?: string[];
    /** UI element IDs to toggle (show/hide) when this action is executed */
    /** Project ID to load when this action is executed */
    loadProject?: string;
    payload?: Record<string, any>;
}

export type ActionsSet = {
    id: string;
    name: string;
    description?: string;
    actions: Action[];
};
/**
 * One element an action changes: `state` addresses it (a scene object id, or one of
 * 'camera' | 'sky' | 'ocean' | 'clouds'), and `patch` is a deep partial of that
 * element's own settings — `{ materialSettings: { materialVariant: 'Glass' } }`,
 * `{ config: { intensity: 4 } }`, `{ meshSettings: { position: [0, 2, 0] } }`.
 */
export interface ActionTarget {
    state: string;
    patch: Record<string, any>;
}

/**
 * ActionSequence — an instant, multi-element scene change, applied at runtime only.
 *
 * Executed by `SceneActions.applyAction` / `revertAction` / `toggleAction`, which lay
 * the patches over the authored settings; revert removes them. Never written into the
 * authored settings and never persisted as scene state — only the action definition is saved.
 */
export interface ActionSequence {
    id: string;
    name: string;
    /**
     * Stable, code-facing name — what the component API addresses
     * (`scene.actions.toggle('open-door')`). Derived from the name once at creation,
     * unique per project, survives renames and project copies. See utils/actionKeys.
     */
    key?: string;
    description?: string;
    targets: ActionTarget[];
    assetId?: string | null;
    /** Runtime only */
    isDirty?: boolean;
}
export {};
