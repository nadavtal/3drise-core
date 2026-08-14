import * as THREE from 'three';
import { PositionsCreator } from '../services/PositionsCreator';
import { PathV } from './PathV';
import type { PositionShape } from "../types/particles";
export interface LinesVOptions {
    shapeType: PositionShape;
    targetShapeType?: PositionShape;
    color?: string | number;
    opacity?: number;
    tubeRadius?: number;
    duration?: number;
}


export class LinesV {
    private parent;
    private group;
    private paths = [];
    private config;
    constructor(parent: THREE.Object3D, options: LinesVOptions) {
        this.parent = parent;
        this.config = options;
        this.group = new THREE.Group();
        parent.add(this.group);
        this.build();
    }
    private build() {
        const { shapeType, targetShapeType, color, opacity, tubeRadius, duration } = this.config;
        const curves = PositionsCreator.generatePaths(shapeType);
        const targetCurves = PositionsCreator.generatePaths(targetShapeType || shapeType);
        curves.forEach((curve, index) => {
            const targetCurve = targetCurves[index % targetCurves.length];
            const path = new PathV(this.group, { curve, targetCurve, color, opacity, tubeRadius, duration });
            this.paths.push(path);
        });
    }
    update(elapsed: number, delta?: number): void {
        this.paths.forEach(path => path.update(elapsed, delta));
    }
    updateConfig(options: Partial<LinesVOptions>): void {
        this.config = { ...this.config, ...options };
        this.paths.forEach(p => p.dispose(false));
        this.paths = [];
        this.group.clear();
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        this.paths.forEach(p => p.dispose(false));
        this.paths = [];
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
    }
}
