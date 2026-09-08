import * as THREE from 'three';
import { skySystemManager } from '../services/SkySystemManager';
import { SkyboxV } from './SkyboxV';
import { LensflareV } from './LensflareV';
import { SunLightV } from './SunLightV';
import { SkyControllerV } from './SkyControllerV';
import { RainV } from './RainV';
import type { TimeSettings } from "../types/scene3d";
import type { StarsSettings, CloudsSettings, SkySettings, RainSettings, FogSettings } from "../types/environment";
export interface SkySystemVOptions {
    timeSettings: TimeSettings;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    scene?: THREE.Scene;
    visible?: boolean;
    sunSystemVisible?: boolean;
    sunSize?: number;
    moonSize?: number;
    skyboxScale?: number;
    sunIntensity?: number;
    castShadow?: boolean;
    shadowMapSize?: number;
    targetPosition?: [number, number, number];
    starsSettings?: StarsSettings;
    cloudsSettings?: CloudsSettings;
    skyControllerSettings?: SkySettings;
    rainSettings?: RainSettings;
    fogSettings?: FogSettings;
    onTimeOfDayChange?: (timeOfDay: string, elapsedTime: number) => void;
}


export class SkySystemV {
    private parent;
    private config;
    private skybox = null;
    private lensflare = null;
    private sunLight = null;
    private clouds = null;
    private skyController = null;
    private rain = null;
    private previousTimeOfDay = null;
    constructor(parent: THREE.Object3D, options: SkySystemVOptions) {
        this.parent = parent;
        this.config = options;
        skySystemManager.setTimeSettings(options.timeSettings);
        if (options.visible !== false && options.sunSystemVisible) {
            this.skybox = new SkyboxV(parent, {
                visible: true,
                scale: options.skyboxScale ?? 100000,
                sunSize: options.sunSize ?? 1,
                moonSize: options.moonSize ?? 1,
                timeSettings: options.timeSettings,
            });
            this.lensflare = new LensflareV(parent, {
                camera: options.camera,
                visible: true,
                intensity: options.sunIntensity ?? 1,
                timeSettings: options.timeSettings,
            });
            this.sunLight = new SunLightV(parent, {
                visible: true,
                timeSettings: options.timeSettings,
                targetPosition: options.targetPosition ?? [0, 0, 0],
                intensity: options.sunIntensity ?? 1,
                castShadow: options.castShadow ?? true,
                shadowMapSize: options.shadowMapSize ?? 2048,
            });
        }
        if (!options.sunSystemVisible && options.skyControllerSettings) {
            this.skyController = new SkyControllerV(parent, {
                settings: options.skyControllerSettings,
                timeSettings: options.timeSettings,
            });
        }
        if (options.rainSettings?.meshSettings?.visible) {
            this.rain = new RainV(parent, { settings: options.rainSettings });
        }
        if (options.fogSettings && options.scene) {
            this.applyFog(options.scene, options.fogSettings);
        }
    }
    private applyFog(scene, fogSettings) {
        if (fogSettings.visible) {
            scene.fog = new THREE.Fog(fogSettings.color, fogSettings.near, fogSettings.far);
        }
        else {
            scene.fog = null;
        }
    }
    update(_elapsed: number, delta: number = 0.016): void {
        const { timeSettings, onTimeOfDayChange } = this.config;
        if (!timeSettings.enabled)
            return;
        // Ticked whenever time is enabled, not only while it animates: the
        // manager's `delta` and `elapsedTime` come out of here and drive every
        // consumer's colour smoothing. Advancing the hour is the manager's own
        // decision. Kept in step with the R3F SkySystem deliberately.
        skySystemManager.tick(delta);
        const current = skySystemManager.getTimeOfDay();
        if (this.previousTimeOfDay !== null && this.previousTimeOfDay !== current) {
            const state = skySystemManager.getState();
            onTimeOfDayChange?.(current, state.elapsedTime);
        }
        this.previousTimeOfDay = current;
        this.skybox?.update(_elapsed, delta);
        this.lensflare?.update(_elapsed, delta);
        this.sunLight?.update(_elapsed, delta);
        this.skyController?.update(_elapsed, delta);
    }
    updateConfig(options: SkySystemVOptions): void {
        this.config = options;
        skySystemManager.setTimeSettings(options.timeSettings);
        this.skybox?.updateConfig({ ...options, visible: options.sunSystemVisible });
        this.lensflare?.updateConfig({ ...options, camera: options.camera, visible: options.sunSystemVisible });
        this.sunLight?.updateConfig({ ...options, visible: options.sunSystemVisible });
        if (options.skyControllerSettings && this.skyController) {
            this.skyController.updateConfig({
                settings: options.skyControllerSettings,
                timeSettings: options.timeSettings,
            });
        }
    }
    dispose(removeFromScene: boolean = true): void {
        this.skybox?.dispose(removeFromScene);
        this.lensflare?.dispose(removeFromScene);
        this.sunLight?.dispose(removeFromScene);
        this.skyController?.dispose(removeFromScene);
    }
}
