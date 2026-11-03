import type * as THREE from 'three';

// A pointer event on a scene object, typed exactly like React Three Fiber's ThreeEvent
// (@react-three/fiber 9, core/events.d.ts) so core needs no React: the React package passes
// R3F's event straight through, and any other renderer can build the same shape.
export type ScenePointerCamera = THREE.OrthographicCamera | THREE.PerspectiveCamera;
export interface SceneIntersection extends THREE.Intersection {
    /** The event source (the object which registered the handler) */
    eventObject: THREE.Object3D;
}
export interface SceneIntersectionEvent<TSourceEvent> extends SceneIntersection {
    eventObject: THREE.Object3D;
    intersections: SceneIntersection[];
    unprojectedPoint: THREE.Vector3;
    pointer: THREE.Vector2;
    delta: number;
    ray: THREE.Ray;
    camera: ScenePointerCamera;
    stopPropagation: () => void;
    nativeEvent: TSourceEvent;
    stopped: boolean;
}
type NonFunctionKeys<P> = { [K in keyof P]-?: P[K] extends Function ? never : K }[keyof P];
type Properties<T> = Pick<T, NonFunctionKeys<T>>;
export type ScenePointerEvent<TEvent = MouseEvent> = SceneIntersectionEvent<TEvent> & Properties<TEvent>;
