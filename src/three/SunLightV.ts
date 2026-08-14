import * as THREE from 'three';
import { skySystemManager } from '../services/SkySystemManager';
import type { TimeSettings } from "../types/scene3d";
export interface SunLightVOptions {
    timeSettings: TimeSettings;
    visible?: boolean;
    targetPosition?: [number, number, number];
    shadowDistance?: number;
    intensity?: number;
    castShadow?: boolean;
    shadowMapSize?: number;
}


const COLORS = {
    white: new THREE.Color(0xffffff),
    orange: new THREE.Color(0xff4500),
    moon: new THREE.Color(0xe6e8fa),
};
const MAX_ELEVATION = 42;
const SUNRISE = 6;
const SUNSET = 21;
const DARKNESS_START = 20.42;
const DARKNESS_END = 6.58;
export class SunLightV {
    private parent;
    private light;
    private config;
    private colorRef = new THREE.Color(0xffe5b0);
    private targetColor = new THREE.Color(0xffe5b0);
    private intensityVal = 1;
    private targetIntensity = 1;
    constructor(parent: THREE.Object3D, options: SunLightVOptions) {
        this.parent = parent;
        this.config = options;
        const shadowMapSize = options.shadowMapSize ?? 2048;
        this.light = new THREE.DirectionalLight(0xffe5b0, 1);
        this.light.castShadow = options.castShadow ?? true;
        this.light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
        this.light.shadow.camera.left = -50;
        this.light.shadow.camera.right = 50;
        this.light.shadow.camera.top = 50;
        this.light.shadow.camera.bottom = -50;
        this.light.shadow.camera.near = 0.5;
        this.light.shadow.camera.far = 1000;
        this.light.shadow.normalBias = 0.02;
        this.light.shadow.bias = 0.000002;
        this.light.shadow.radius = 2;
        this.light.visible = options.visible ?? true;
        parent.add(this.light);
        parent.add(this.light.target);
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.light.visible)
            return;
        const { timeSettings } = this.config;
        if (!timeSettings.enabled)
            return;
        const state = skySystemManager.getState();
        this.applyTimeState(state, delta);
    }
    private applyTimeState(state, delta) {
        const { timeInHours, normalizedTime, isDaytime, sunDirection, sunElevation } = state;
        const targetPos = this.config.targetPosition ?? [0, 0, 0];
        const shadowDistance = this.config.shadowDistance ?? 300;
        const intensityMultiplier = this.config.intensity ?? 1;
        const isInDarkTransition = (timeInHours >= DARKNESS_START && timeInHours <= SUNSET) ||
            (timeInHours >= SUNRISE && timeInHours <= DARKNESS_END);
        if (isDaytime) {
            const normalizedElevation = Math.min(sunElevation / MAX_ELEVATION, 1);
            const t = Math.pow(1 - normalizedElevation, 3);
            this.targetColor.lerpColors(COLORS.white, COLORS.orange, t);
            this.targetIntensity = isInDarkTransition
                ? 0.1
                : Math.min(40, Math.pow(normalizedElevation, 1.2) * 4);
        }
        else {
            this.targetColor.copy(COLORS.moon).multiplyScalar(1.8);
            this.targetIntensity = 0.5;
        }
        const lerpSpeed = Math.min(1, 2.0 * (delta || 1));
        this.colorRef.lerp(this.targetColor, lerpSpeed);
        this.intensityVal += (this.targetIntensity - this.intensityVal) * lerpSpeed;
        this.light.position.set(targetPos[0] + sunDirection.x * shadowDistance, targetPos[1] + sunDirection.y * shadowDistance, targetPos[2] + sunDirection.z * shadowDistance);
        this.light.target.position.set(targetPos[0], targetPos[1], targetPos[2]);
        this.light.target.updateMatrixWorld();
        this.light.intensity = this.intensityVal * intensityMultiplier;
        this.light.color.copy(this.colorRef);
    }
    updateConfig(options: SunLightVOptions): void {
        this.config = options;
        this.light.visible = options.visible ?? true;
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    dispose(removeFromScene: boolean = true): void {
        if (removeFromScene) {
            this.parent.remove(this.light);
            this.parent.remove(this.light.target);
        }
    }
}
