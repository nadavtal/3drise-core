import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { skySystemManager } from '../services/SkySystemManager';
import { createSunPosition } from '../utils/sunUtils';
import type { SkySettings } from "../types/environment";
import type { TimeSettings } from "../types/scene3d";
export interface SkyControllerVOptions {
    settings: SkySettings;
    timeSettings?: TimeSettings;
    scale?: number;
}


export class SkyControllerV {
    private parent;
    private sky;
    private sunLight;
    private config;
    private previousSettings = null;
    constructor(parent: THREE.Object3D, options: SkyControllerVOptions) {
        this.parent = parent;
        this.config = options;
        this.sky = new Sky();
        this.sky.scale.setScalar(10000);
        this.sky.userData.id = '3drise-sky';
        parent.add(this.sky);
        this.sunLight = new THREE.DirectionalLight('#ffffff', 1);
        this.sunLight.castShadow = true;
        parent.add(this.sunLight);
        if (options.timeSettings) {
            skySystemManager.setTimeSettings(options.timeSettings);
        }
        this.applySettings(options.settings);
    }
    private applySettings(settings) {
        const uniforms = this.sky.material.uniforms;
        if (!uniforms)
            return;
        uniforms.turbidity.value = settings.turbidity;
        uniforms.rayleigh.value = settings.rayleigh;
        uniforms.mieCoefficient.value = settings.mieCoefficient;
        uniforms.mieDirectionalG.value = settings.mieDirectionalG;
        const sunPos = createSunPosition(settings.elevation, settings.azimuth);
        uniforms.sunPosition.value.copy(sunPos);
        this.sky.visible = settings.visible;
        this.sunLight.visible = settings.visible;
        const distance = 100;
        this.sunLight.position.set(sunPos.x * distance, sunPos.y * distance, sunPos.z * distance);
        this.sunLight.shadow.camera.updateProjectionMatrix();
        this.previousSettings = { ...settings };
    }
    private hasChanges(next) {
        const prev = this.previousSettings;
        if (!prev)
            return true;
        return (next.visible !== prev.visible ||
            Math.abs(next.turbidity - prev.turbidity) > 0.01 ||
            Math.abs(next.rayleigh - prev.rayleigh) > 0.01 ||
            Math.abs(next.mieCoefficient - prev.mieCoefficient) > 0.001 ||
            Math.abs(next.mieDirectionalG - prev.mieDirectionalG) > 0.001 ||
            Math.abs(next.elevation - prev.elevation) > 0.1 ||
            Math.abs(next.azimuth - prev.azimuth) > 0.1);
    }
    update(_elapsed: number, _delta: number = 0.016): void {
        const { settings, timeSettings } = this.config;
        if (!timeSettings?.enabled || !settings.visible)
            return;
        const state = skySystemManager.getState();
        const params = calculateSkyParamsForTime(state.timeInHours);
        const newSettings = {
            ...settings,
            elevation: state.sunElevation,
            azimuth: state.sunAzimuth,
            ...params,
        };
        if (this.hasChanges(newSettings)) {
            this.applySettings(newSettings);
        }
    }
    updateConfig(options: SkyControllerVOptions): void {
        this.config = options;
        if (options.timeSettings)
            skySystemManager.setTimeSettings(options.timeSettings);
        this.applySettings(options.settings);
    }
    dispose(removeFromScene: boolean = true): void {
        this.sky.geometry?.dispose();
        this.sky.material?.dispose();
        this.sunLight.shadow?.map?.dispose();
        if (removeFromScene) {
            this.parent.remove(this.sky);
            this.parent.remove(this.sunLight);
        }
    }
}
// ─── Atmospheric parameter calculation ───────────────────────────────────────
function calculateSkyParamsForTime(timeInHours) {
    const night = { turbidity: 0.5, rayleigh: 0.1, mieCoefficient: 0.001, mieDirectionalG: 0.8 };
    const sunrise = { turbidity: 4, rayleigh: 3, mieCoefficient: 0.01, mieDirectionalG: 0.9 };
    const day = { turbidity: 0.7, rayleigh: 0.54, mieCoefficient: 0.005, mieDirectionalG: 0.7 };
    const sunset = { turbidity: 4.5, rayleigh: 3.5, mieCoefficient: 0.012, mieDirectionalG: 0.92 };
    const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
    const ss = (t) => t * t * (3 - 2 * t);
    const lp = (f, to, t) => ({
        turbidity: lerp(f.turbidity, to.turbidity, ss(t)),
        rayleigh: lerp(f.rayleigh, to.rayleigh, ss(t)),
        mieCoefficient: lerp(f.mieCoefficient, to.mieCoefficient, ss(t)),
        mieDirectionalG: lerp(f.mieDirectionalG, to.mieDirectionalG, ss(t)),
    });
    if (timeInHours < 5)
        return night;
    if (timeInHours < 6.5)
        return lp(night, sunrise, (timeInHours - 5) / 1.5);
    if (timeInHours < 8)
        return lp(sunrise, day, (timeInHours - 6.5) / 1.5);
    if (timeInHours < 17)
        return day;
    if (timeInHours < 19)
        return lp(day, sunset, (timeInHours - 17) / 2);
    if (timeInHours < 21)
        return lp(sunset, night, (timeInHours - 19) / 2);
    return night;
}
