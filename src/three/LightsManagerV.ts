import { AmbientLight, DirectionalLight, } from 'three';
import type { Scene } from 'three';
import { createSunPosition } from '../utils/sunUtils';
import type { SceneLightConfig } from "../types/lights";

export class LightsManagerV {
    private scene;
    private config;
    private ambientLight;
    private directionalLights = new Map();
    private spotLights = new Map();
    private spotTargets = new Map();
    private pointLights = new Map();
    private sunLight = null;
    constructor(scene: Scene, config: SceneLightConfig) {
        this.scene = scene;
        this.config = config;
        this.ambientLight = new AmbientLight();
        scene.add(this.ambientLight);
        this.applyConfig(config);
    }
    /** Call each frame with renderer clock's elapsed time in seconds. */
    update(elapsedTime: number): void {
        if (this.config.followSun && this.sunLight && this.config.sun) {
            const pos = createSunPosition(this.config.sun.elevation ?? 45, (this.config.sun.azimuth ?? -90) + elapsedTime * 0.01);
            this.sunLight.position.set(pos.x * 100, pos.y * 100, pos.z * 100);
        }
    }
    /** Swap to a new config and sync all lights. */
    updateConfig(config: SceneLightConfig): void {
        this.config = config;
        this.applyConfig(config);
    }
    dispose(): void {
        this.scene.remove(this.ambientLight);
        this.directionalLights.forEach(l => this.scene.remove(l));
        this.spotLights.forEach(l => this.scene.remove(l));
        this.spotTargets.forEach(t => this.scene.remove(t));
        this.pointLights.forEach(l => this.scene.remove(l));
        if (this.sunLight)
            this.scene.remove(this.sunLight);
        this.directionalLights.clear();
        this.spotLights.clear();
        this.spotTargets.clear();
        this.pointLights.clear();
    }
    private applyConfig(config) {
        if (config.ambient) {
            this.ambientLight.color.set(config.ambient.color);
            this.ambientLight.intensity = config.ambient.intensity;
        }
        if (config.sun) {
            if (!this.sunLight) {
                this.sunLight = new DirectionalLight(config.sun.color ?? '#ffffff', config.sun.intensity ?? 1);
                this.scene.add(this.sunLight);
            }
            else {
                this.sunLight.color.set(config.sun.color ?? '#ffffff');
                this.sunLight.intensity = config.sun.intensity ?? 1;
            }
        }
    }
    private syncLightMap(map, configs, create, update) {
        const seen = new Set();
        for (const c of configs) {
            if (c.enabled === false)
                continue;
            seen.add(c.name);
            if (map.has(c.name)) {
                update(map.get(c.name), c);
            }
            else {
                map.set(c.name, create(c));
            }
        }
        for (const [name, light] of map) {
            if (!seen.has(name)) {
                this.scene.remove(light);
                map.delete(name);
                const t = this.spotTargets.get(name);
                if (t) {
                    this.scene.remove(t);
                    this.spotTargets.delete(name);
                }
            }
        }
    }
}
