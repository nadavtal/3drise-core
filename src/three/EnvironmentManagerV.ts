import * as THREE from 'three';
import { SkySystemV } from './SkySystemV';
import type { SkySystemVOptions } from './SkySystemV';
import { createCubeCamera, updateCubeCamera, setSceneEnvironment, clearSceneEnvironment, disposeCubeCamera, loadEquirectHdrEnvironment, } from '../utils/environmentUtils';
import type { HdrSettings } from "../types/environment";
export interface EnvironmentManagerVOptions extends SkySystemVOptions {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    hdrSettings?: HdrSettings;
    cubeCameraResolution?: number;
    cubeCameraPosition?: THREE.Vector3;
}


export class EnvironmentManagerV {
    private parent;
    private scene;
    private renderer;
    private skySystem;
    private cubeCamera = null;
    private config;
    private elapsedMs = 0;
    private readonly CUBE_UPDATE_INTERVAL_MS = 300;
    private loadedHdrUrl = null;
    private loadedHdrTexture = null;
    private hdrLoadToken = 0;
    constructor(parent: THREE.Object3D, options: EnvironmentManagerVOptions) {
        this.parent = parent;
        this.config = options;
        this.scene = options.scene;
        this.renderer = options.renderer;
        this.skySystem = new SkySystemV(parent, options);
        this.applyHdrState();
    }
    private firstUrl(hdr) {
        if (!hdr || !hdr.visible)
            return undefined;
        return hdr.urls && hdr.urls.length > 0 ? hdr.urls[0] : undefined;
    }
    private isSkyActive() {
        const o = this.config;
        return (o.visible !== false) && (o.sunSystemVisible ?? false);
    }
    private applyHdrState() {
        const hdr = this.config.hdrSettings;
        const firstUrl = this.firstUrl(hdr);
        if (firstUrl) {
            // Equirect URL takes precedence — dispose procedural camera, load HDR.
            // Vanilla path always uses the first URL; transitions are React-only.
            if (this.cubeCamera) {
                disposeCubeCamera(this.cubeCamera, this.scene);
                this.cubeCamera = null;
            }
            this.loadHdrUrl(firstUrl, hdr.settings?.background !== false);
            return;
        }
        // No url — dispose any loaded HDR texture.
        this.disposeLoadedHdr();
        if (hdr?.visible && hdr.name) {
            // Preset case — vanilla has no preset library; leave scene.environment as-is.
            // (Procedural cube camera is not started either, to avoid overwriting an
            // environment a caller may have set externally.)
            return;
        }
        // No HDR active. Fall back to procedural cube camera when sky is active.
        if (this.isSkyActive()) {
            if (!this.cubeCamera)
                this.initCubeCamera();
        }
        else if (this.cubeCamera) {
            disposeCubeCamera(this.cubeCamera, this.scene);
            this.cubeCamera = null;
            clearSceneEnvironment(this.scene);
        }
    }
    private async loadHdrUrl(url, asBackground) {
        if (this.loadedHdrUrl === url && this.loadedHdrTexture) {
            setSceneEnvironment(this.scene, this.loadedHdrTexture);
            if (!asBackground)
                this.scene.background = null;
            return;
        }
        const token = ++this.hdrLoadToken;
        try {
            const texture = await loadEquirectHdrEnvironment(url, this.renderer);
            if (token !== this.hdrLoadToken) {
                // A newer load superseded us — drop this result.
                texture.dispose();
                return;
            }
            this.disposeLoadedHdr();
            this.loadedHdrUrl = url;
            this.loadedHdrTexture = texture;
            this.scene.environment = texture;
            this.scene.background = asBackground ? texture : null;
        }
        catch (err) {
            console.error('[EnvironmentManagerV] Failed to load HDR:', url, err);
        }
    }
    private disposeLoadedHdr() {
        if (this.loadedHdrTexture) {
            this.loadedHdrTexture.dispose();
            this.loadedHdrTexture = null;
        }
        this.loadedHdrUrl = null;
        if (this.scene.environment)
            this.scene.environment = null;
        if (this.scene.background)
            this.scene.background = null;
    }
    private initCubeCamera() {
        const { cubeCameraResolution = 512, cubeCameraPosition = new THREE.Vector3(0, 50, 0) } = this.config;
        if (this.cubeCamera)
            disposeCubeCamera(this.cubeCamera, this.scene);
        this.cubeCamera = createCubeCamera(this.scene, cubeCameraResolution, cubeCameraPosition);
        this.updateEnvironment();
    }
    updateEnvironment(): void {
        if (!this.cubeCamera)
            return;
        const texture = updateCubeCamera(this.cubeCamera, this.renderer, this.scene);
        setSceneEnvironment(this.scene, texture);
    }
    update(elapsed: number, delta: number = 0.016): void {
        this.skySystem.update(elapsed, delta);
        if (this.cubeCamera && this.config.timeSettings.autoAnimate) {
            this.elapsedMs += delta * 1000;
            if (this.elapsedMs >= this.CUBE_UPDATE_INTERVAL_MS) {
                this.elapsedMs = 0;
                this.updateEnvironment();
            }
        }
    }
    updateConfig(options: EnvironmentManagerVOptions): void {
        this.config = options;
        this.scene = options.scene;
        this.renderer = options.renderer;
        this.applyHdrState();
        this.skySystem.updateConfig(options);
    }
    dispose(removeFromScene: boolean = true): void {
        if (this.cubeCamera) {
            disposeCubeCamera(this.cubeCamera, this.scene);
            this.cubeCamera = null;
        }
        this.disposeLoadedHdr();
        clearSceneEnvironment(this.scene);
        this.skySystem.dispose(removeFromScene);
    }
}
