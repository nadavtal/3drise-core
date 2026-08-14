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
export {};
