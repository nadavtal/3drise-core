import * as THREE from 'three';
import { skySystemManager } from '../services/SkySystemManager';
import type { TimeSettings } from "../types/scene3d";
export interface LensflareVOptions {
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    timeSettings: TimeSettings;
    visible?: boolean;
    intensity?: number;
}


function createFlareTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (type === 0) {
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.1, 'rgba(255, 250, 240, 0.9)');
        gradient.addColorStop(0.25, 'rgba(255, 229, 176, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 229, 176, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 229, 176, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
    }
    else {
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, 'rgba(255, 229, 176, 0.6)');
        gradient.addColorStop(0.3, 'rgba(255, 229, 176, 0.3)');
        gradient.addColorStop(0.6, 'rgba(255, 229, 176, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 229, 176, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}
export class LensflareV {
    private parent;
    private sprite;
    private material;
    private config;
    constructor(parent: THREE.Object3D, options: LensflareVOptions) {
        this.parent = parent;
        this.config = options;
        const texture = createFlareTexture(0);
        this.material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
        });
        this.sprite = new THREE.Sprite(this.material);
        this.sprite.renderOrder = Infinity;
        this.sprite.visible = options.visible ?? true;
        parent.add(this.sprite);
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.sprite.visible)
            return;
        const { timeSettings, camera, intensity = 1 } = this.config;
        if (!timeSettings.enabled)
            return;
        const state = skySystemManager.getState();
        const { sunDirection } = state;
        const distance = Math.min(camera.far * 0.5, 200);
        this.sprite.position.copy(camera.position);
        this.sprite.position.addScaledVector(sunDirection, distance);
        this.sprite.scale.setScalar(5 * intensity);
        this.material.opacity = sunDirection.y > 0 ? Math.min(sunDirection.y * 2, 1) : 0;
    }
    updateConfig(options: LensflareVOptions): void {
        this.config = options;
        this.sprite.visible = options.visible ?? true;
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    dispose(removeFromScene: boolean = true): void {
        this.material.map?.dispose();
        this.material.dispose();
        if (removeFromScene)
            this.parent.remove(this.sprite);
    }
}
