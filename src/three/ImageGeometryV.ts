import * as THREE from 'three';
import { createMeshByType } from '../utils/meshUtils';
import type { GeometryType } from "../types/scene3d";
export interface ImageGeometryVOptions {
    geometryType: GeometryType;
    url: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
}


export class ImageGeometryV {
    private parent;
    private group;
    private mesh = null;
    private material = null;
    private config;
    private loader = new THREE.TextureLoader();
    constructor(parent: THREE.Object3D, options: ImageGeometryVOptions) {
        this.parent = parent;
        this.config = options;
        this.group = new THREE.Group();
        parent.add(this.group);
        this.build();
    }
    private buildMeshConfig() {
        const { geometryType, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] } = this.config;
        const base = {
            type: geometryType,
            position,
            rotation,
            scale,
            visible: true,
            id: `image-${geometryType}`,
            name: `image-${geometryType}`,
            castShadow: true,
            receiveShadow: true,
        };
        switch (geometryType) {
            case 'plane':
                return { ...base, scale: [1, 1, 1], widthSegments: 1, heightSegments: 1 };
            case 'ring':
                return { ...base, scale: [1, 1, 1], innerRadius: 0.5, outerRadius: 1, thetaSegments: 32, phiSegments: 8 };
            case 'arc':
                return { ...base, scale: [1, 1, 1], radius: 1, startAngle: 0, endAngle: Math.PI, width: 0.3, segments: 32 };
            case 'bentPlane':
            case 'bentPlaneInverse':
                return { ...base, scale: [1, 1, 1], height: 1, radius: 2, arc: Math.PI / 2, widthSegments: 32, heightSegments: 1 };
            default:
                return base;
        }
    }
    private build() {
        const { url, position = [0, 0, 0], rotation = [0, 0, 0] } = this.config;
        const mesh = createMeshByType((this.buildMeshConfig() as any));
        if (!(mesh instanceof THREE.Mesh))
            return;
        this.material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            toneMapped: false,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
        });
        mesh.material = this.material;
        this.loader.load(url, (texture) => {
            if (this.material)
                this.material.map = texture;
        });
        this.group.position.set(...position);
        this.group.rotation.set(...rotation);
        this.group.add(mesh);
        this.mesh = mesh;
    }
    updateConfig(options: ImageGeometryVOptions): void {
        this.dispose(false);
        this.config = options;
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        if (this.mesh) {
            this.mesh.geometry.dispose();
        }
        this.material?.dispose();
        this.material = null;
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
        this.mesh = null;
    }
}
