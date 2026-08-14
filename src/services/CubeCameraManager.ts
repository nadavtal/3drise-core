import * as THREE from 'three';
import { createCubeCamera, updateCubeCamera, disposeCubeCamera, setSceneEnvironment, clearSceneEnvironment, } from '../utils/environmentUtils';
import { updateSceneMaterials } from '../utils/materialUtils';
export class CubeCameraManager {
    private static instance = null;
    private cubeCamera = null;
    private scene = null;
    private renderer = null;
    private isUpdating = false;
    private onUpdate = null;
    constructor() { }
    static getInstance(): CubeCameraManager {
        if (!CubeCameraManager.instance) {
            CubeCameraManager.instance = new CubeCameraManager();
        }
        return CubeCameraManager.instance;
    }
    static resetInstance(): void {
        CubeCameraManager.instance = null;
    }
    attach(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
        this.scene = scene;
        this.renderer = renderer;
    }
    detach(): void {
        this.dispose();
        this.scene = null;
        this.renderer = null;
    }
    setOnUpdate(callback: ((texture: THREE.Texture) => void) | null): void {
        this.onUpdate = callback;
    }
    initCubeCamera(resolution: number = 512, position: THREE.Vector3 = new THREE.Vector3(0, 50, 0)): THREE.CubeCamera | null {
        if (!this.scene)
            return null;
        if (this.cubeCamera)
            disposeCubeCamera(this.cubeCamera, this.scene);
        this.cubeCamera = createCubeCamera(this.scene, resolution, position);
        return this.cubeCamera;
    }
    updateEnvironment(): THREE.Texture | null {
        // console.log('Updating cube camera environment map...', {
        //   hasCubeCamera: !!this.cubeCamera,
        //   hasScene: !!this.scene,
        //   hasRenderer: !!this.renderer,
        //   isUpdating: this.isUpdating,
        // });
        if (!this.scene || !this.renderer)
            return null;
        if (!this.cubeCamera) {
            this.initCubeCamera();
        }
        if (this.isUpdating)
            return null;
        try {
            this.isUpdating = true;
            const texture = updateCubeCamera(this.cubeCamera, this.renderer, this.scene);
            setSceneEnvironment(this.scene, texture);
            updateSceneMaterials(this.scene, texture);
            this.onUpdate?.(texture);
            return texture;
        }
        finally {
            this.isUpdating = false;
        }
    }
    clear(): void {
        if (this.scene)
            clearSceneEnvironment(this.scene);
    }
    dispose(): void {
        if (this.cubeCamera && this.scene) {
            disposeCubeCamera(this.cubeCamera, this.scene);
        }
        this.cubeCamera = null;
    }
    getCubeCamera(): THREE.CubeCamera | null {
        return this.cubeCamera;
    }
    hasCubeCamera(): boolean {
        return this.cubeCamera !== null;
    }
}
export const cubeCameraManager: CubeCameraManager = CubeCameraManager.getInstance();
