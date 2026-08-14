import * as THREE from 'three';
import type { CatmullRomCurve3 } from "three";
export interface PathVOptions {
    curve: CatmullRomCurve3;
    targetCurve?: CatmullRomCurve3;
    color?: string | number;
    opacity?: number;
    tubeRadius?: number;
    duration?: number;
}


export class PathV {
    private parent;
    private group;
    private mesh = null;
    private targetMesh = null;
    private animationProgress = 0;
    private basePositions = null;
    private speed;
    private config;
    constructor(parent: THREE.Object3D, options: PathVOptions) {
        this.parent = parent;
        this.config = options;
        this.speed = 1 / (options.duration || 1);
        this.group = new THREE.Group();
        parent.add(this.group);
        this.build();
    }
    private build() {
        const { curve, targetCurve, color = '#4c00ff', opacity = 1, tubeRadius = 0.001 } = this.config;
        const geometry = new THREE.TubeGeometry(curve, 64, tubeRadius, 8, false);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: opacity < 1,
            opacity,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.group.add(this.mesh);
        this.basePositions = new Float32Array(geometry.attributes.position.array);
        if (targetCurve) {
            const targetGeometry = new THREE.TubeGeometry(targetCurve, 64, tubeRadius, 8, false);
            this.targetMesh = new THREE.Mesh(targetGeometry, new THREE.MeshBasicMaterial({ visible: false }));
            this.targetMesh.position.y = -1000;
            this.group.add(this.targetMesh);
        }
        this.animationProgress = 0;
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.mesh || !this.targetMesh || !this.basePositions)
            return;
        this.animationProgress = Math.min(this.animationProgress + delta * this.speed, 1);
        const currentGeom = this.mesh.geometry;
        const targetPositions = this.targetMesh.geometry.attributes.position.array;
        const currentPosAttr = currentGeom.attributes.position;
        const arr = currentPosAttr.array;
        const length = Math.min(this.basePositions.length, targetPositions.length);
        for (let i = 0; i < length; i += 3) {
            arr[i] = this.basePositions[i] + (targetPositions[i] - this.basePositions[i]) * this.animationProgress;
            arr[i + 1] = this.basePositions[i + 1] + (targetPositions[i + 1] - this.basePositions[i + 1]) * this.animationProgress;
            arr[i + 2] = this.basePositions[i + 2] + (targetPositions[i + 2] - this.basePositions[i + 2]) * this.animationProgress;
        }
        currentPosAttr.needsUpdate = true;
    }
    updateCurves(curve: CatmullRomCurve3, targetCurve?: CatmullRomCurve3): void {
        this.config = { ...this.config, curve, targetCurve };
        this.dispose(false);
        this.build();
    }
    updateConfig(options: Partial<PathVOptions>): void {
        this.config = { ...this.config, ...options };
        this.speed = 1 / (this.config.duration || 1);
        this.dispose(false);
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.mesh = null;
        }
        if (this.targetMesh) {
            this.targetMesh.geometry.dispose();
            this.targetMesh.material.dispose();
            this.targetMesh = null;
        }
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
        this.basePositions = null;
    }
}
