import type { Scene, WebGLRenderer } from "three";

/**
 * SceneStore — Layer 1 of the two-phase scene architecture.
 *
 * Holds the live Three.js scene and renderer, set once when the R3F Canvas
 * initialises (onCreated). After that point, any hook, service, or panel can
 * access the scene imperatively without going through React or Redux.
 *
 * Usage (inside Canvas):
 *   onCreated={(state) => { SceneStore.scene = state.scene; SceneStore.gl = state.gl; }}
 *
 * Usage (anywhere):
 *   import { findById } from '~/utils/sceneQuery';
 */
const SceneStore: {
            scene: Scene | null;
            gl: WebGLRenderer | null;
        } = {
    scene: null,
    gl: null,
};
export default SceneStore;
