import * as THREE from 'three';
import type { Text2DConfig } from "../types/text";
export interface Text2DVOptions {
    text: string;
    config?: Partial<Text2DConfig>;
    color?: string;
    opacity?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    canvasWidth?: number;
    canvasHeight?: number;
}


export class Text2DV {
    private parent;
    private group;
    private mesh = null;
    private texture = null;
    private options;
    constructor(parent: THREE.Object3D, options: Text2DVOptions) {
        this.parent = parent;
        this.options = options;
        this.group = new THREE.Group();
        if (options.position)
            this.group.position.set(...options.position);
        if (options.rotation)
            this.group.rotation.set(...options.rotation);
        parent.add(this.group);
        this.build();
    }
    private build() {
        const { text, config = {}, color = '#ffffff', opacity = 1, canvasWidth = 512, canvasHeight = 128, } = this.options;
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        const pxSize = Math.round(canvasHeight * 0.5);
        ctx.font = `${pxSize}px sans-serif`;
        ctx.textAlign = config.textAlign ?? 'center';
        ctx.textBaseline = 'middle';
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
        this.texture = new THREE.CanvasTexture(canvas);
        const fontSize = config.fontSize ?? 0.5;
        const aspect = canvasWidth / canvasHeight;
        const planeH = fontSize * 2;
        const planeW = planeH * aspect;
        const geo = new THREE.PlaneGeometry(planeW, planeH);
        const mat = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);
    }
    update(_elapsed: number, _delta?: number): void { }
    updateConfig(options: Text2DVOptions): void {
        this.dispose(false);
        this.options = options;
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        this.texture?.dispose();
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
        this.mesh = null;
        this.texture = null;
    }
}
