import type { ThreeEvent } from "@react-three/fiber";
import type { CreatedObjectSettings, Vector3Array, ExecuteInteractionParams } from "../types/scene3d";
import { Object3D } from "three";
export interface SceneClickEvent {
    object: CreatedObjectSettings;
    ref: Object3D;
    event: ThreeEvent<MouseEvent>;
}

export type OnSceneObjectClick = (event: SceneClickEvent) => void;

interface ExecuteSceneInteraction {
    (params: ExecuteInteractionParams): void;
}

interface HandleCreatedObjectClickParams {
    createdObject: CreatedObjectSettings;
    ref: Object3D;
    event: ThreeEvent<MouseEvent>;
    mode: 'default' | 'path';
    executeInteraction: ExecuteSceneInteraction;
    onObjectClick?: OnSceneObjectClick;
    onPathPoint?: (clickPosition: Vector3Array) => void;
}

interface HandleCreatedObjectHoverParams {
    createdObject: CreatedObjectSettings;
    ref: Object3D;
    event: ThreeEvent<PointerEvent>;
    executeInteraction: ExecuteSceneInteraction;
}


function filterInteractionsByEvent(interactions, mouseEvent) {
    if (!interactions)
        return [];
    return interactions.filter((interaction) => interaction.mouseEvent === mouseEvent);
}
export function handleCreatedObjectClick({ createdObject, ref, event, mode, executeInteraction, onObjectClick,
// onPathPoint,
 }: HandleCreatedObjectClickParams): void {
    console.log('[createdObjectHandlers] handleObjectClick:', createdObject.id, { mode });
    if (onObjectClick) {
        onObjectClick({ object: createdObject, ref, event });
    }
    // if (mode === 'path') {
    //   onPathPoint?.(event.point.toArray() as Vector3Array);
    //   return;
    // }
    const clickInteractions = filterInteractionsByEvent(createdObject.actions, 'click');
    clickInteractions.forEach((interaction) => {
        executeInteraction({ interaction, ref, createdObject });
    });
}
export function handleCreatedObjectMouseEnter({ createdObject, ref, event, executeInteraction, }: HandleCreatedObjectHoverParams): void {
    console.log('[createdObjectHandlers] handleMouseEnter:', createdObject.id, event.type);
    const enterInteractions = filterInteractionsByEvent(createdObject.actions, 'mouseEnter');
    enterInteractions.forEach((interaction) => {
        executeInteraction({ interaction, ref, createdObject });
    });
}
export function handleCreatedObjectMouseLeave({ createdObject, ref, event, executeInteraction, }: HandleCreatedObjectHoverParams): void {
    console.log('[createdObjectHandlers] handleMouseLeave:', createdObject.id, event.type);
    const leaveInteractions = filterInteractionsByEvent(createdObject.actions, 'mouseLeave');
    leaveInteractions.forEach((interaction) => {
        executeInteraction({ interaction, ref, createdObject });
    });
}
