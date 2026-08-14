// Reconstructed: the original hand-written objectManager.d.ts was never published
// (source .d.ts files are not copied to dist). Types inferred from usage in
// services/ObjectManager.ts — adjust if your originals differed.
import type { Object3D } from "three";

export type ObjectEventType =
    | "objectAdded"
    | "objectRemoved"
    | "objectUpdated"
    | "objectSelected"
    | "sceneCleared";

export type EventCallback = (data?: any) => void;

export type ContentInteractionType = "hover" | "click";

export interface ContentData {
    hover: string[];
    click: string[];
}

export interface SelectedNode {
    object: Object3D;
    [key: string]: any;
}
