import SceneStore from '../services/SceneStore';
import type { Object3D } from "three";

export function findById(id: string): Object3D | null {
    if (!id || !SceneStore.scene)
        return null;
    let found = null;
    SceneStore.scene.traverse((obj) => {
        if (!found && obj.userData.id === id) {
            found = obj;
        }
    });
    return found;
}
/**
 * Find a Three.js object in the live scene by its Three.js name (object.name).
 * Uses the native Three.js getObjectByName for efficiency.
 * Returns null if the scene is not yet initialised or the object is not found.
 */
export function findByName(name: string): Object3D | null {
    if (!SceneStore.scene)
        return null;
    return SceneStore.scene.getObjectByName(name) ?? null;
}
