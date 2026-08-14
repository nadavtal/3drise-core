import * as THREE from 'three';
import { PositionsCreator } from '../services/PositionsCreator';
import { shapeConfig } from '../data/shapeConfig';
import type { PositionShape } from "../types/particles";
export interface ParticlesVOptions {
    shapeType: PositionShape;
    count?: number;
    color?: string | number;
    opacity?: number;
    pointSize?: number;
    outlines?: boolean;
    duration?: number;
    targetShapeType?: PositionShape;
}


export class ParticlesV {
    private parent;
    private group;
    private points = null;
    private basePositions = null;
    private targetPositions = null;
    private animationProgress = 0;
    private speed;
    private config;
    constructor(parent: THREE.Object3D, options: ParticlesVOptions) {
        this.parent = parent;
        this.config = { count: 1000, duration: 1, ...options };
        this.speed = 1 / (this.config.duration || 1);
        this.group = new THREE.Group();
        parent.add(this.group);
        this.build();
    }
    private build() {
        const { shapeType, count = 1000, color = '#ffffff', opacity = 1, pointSize = 2, outlines = false } = this.config;
        const shapeParams = {
            length: count,
            name: shapeType,
            outlines,
            ...(shapeConfig[shapeType] || {}),
        };
        this.basePositions = PositionsCreator.generatePositions(shapeParams);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.basePositions), 3));
        const material = new THREE.PointsMaterial({
            color: new THREE.Color(color),
            size: pointSize * 0.01,
            transparent: opacity < 1,
            opacity,
            depthWrite: false,
        });
        this.points = new THREE.Points(geometry, material);
        this.group.add(this.points);
        if (this.config.targetShapeType && this.config.targetShapeType !== shapeType) {
            const targetParams = {
                length: count,
                name: this.config.targetShapeType,
                outlines,
                ...(shapeConfig[this.config.targetShapeType] || {}),
            };
            this.targetPositions = PositionsCreator.generatePositions(targetParams);
            this.animationProgress = 0;
        }
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.points || !this.basePositions || !this.targetPositions)
            return;
        this.animationProgress = Math.min(this.animationProgress + delta * this.speed, 1);
        const posAttr = this.points.geometry.attributes.position;
        const arr = posAttr.array;
        const length = Math.min(this.basePositions.length, this.targetPositions.length);
        for (let i = 0; i < length; i += 3) {
            arr[i] = this.basePositions[i] + (this.targetPositions[i] - this.basePositions[i]) * this.animationProgress;
            arr[i + 1] = this.basePositions[i + 1] + (this.targetPositions[i + 1] - this.basePositions[i + 1]) * this.animationProgress;
            arr[i + 2] = this.basePositions[i + 2] + (this.targetPositions[i + 2] - this.basePositions[i + 2]) * this.animationProgress;
        }
        posAttr.needsUpdate = true;
    }
    updateConfig(options: Partial<ParticlesVOptions>): void {
        this.config = { ...this.config, ...options };
        this.speed = 1 / (this.config.duration || 1);
        this.dispose(false);
        this.group.clear();
        this.basePositions = null;
        this.targetPositions = null;
        this.animationProgress = 0;
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        if (this.points) {
            this.points.geometry.dispose();
            this.points.material.dispose();
            this.points = null;
        }
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
        this.basePositions = null;
        this.targetPositions = null;
    }
}
