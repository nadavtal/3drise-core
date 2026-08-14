import * as THREE from 'three';
import { updateCurrentLayoutSettings } from '../utils/galleriesUtils';
import { FrameV } from './FrameV';
import { ImageGeometryV } from './ImageGeometryV';
import { EffectsGeneratorV } from './EffectsGeneratorV';
import type { CreatedObjectSettings } from "../types/scene3d";
export interface GalleryLayoutVOptions {
    onFrameClick?: (url: string) => void;
}


export class GalleryLayoutV {
    private parent;
    private group;
    private frames = [];
    private imageGeos = [];
    private effects = [];
    private createdObject;
    private options;
    constructor(parent: THREE.Object3D, createdObject: CreatedObjectSettings, options: GalleryLayoutVOptions = {}) {
        this.parent = parent;
        this.createdObject = createdObject;
        this.options = options;
        this.group = new THREE.Group();
        parent.add(this.group);
        this.build();
    }
    private build() {
        const { config, materialSettings } = this.createdObject;
        const galleryLayout = config || { frames: [], geometryType: 'none', outerFrameScale: 1 };
        const { frames, layoutSettings } = updateCurrentLayoutSettings(galleryLayout);
        const color = materialSettings?.color ?? '#ffffff';
        for (const frame of frames) {
            const fv = new FrameV(this.group, {
                url: frame.url,
                position: frame.position,
                rotation: frame.rotation,
                layoutSettings,
                frameColor: color,
                onClick: this.options.onFrameClick,
            });
            this.frames.push(fv);
            if (layoutSettings.geometryType && layoutSettings.geometryType !== 'none') {
                const ig = new ImageGeometryV(this.group, {
                    url: frame.url,
                    geometryType: layoutSettings.geometryType,
                    position: frame.position,
                    rotation: frame.rotation,
                });
                this.imageGeos.push(ig);
            }
        }
        if (this.createdObject.effects) {
            for (const effectSettings of this.createdObject.effects) {
                if (effectSettings.enabled) {
                    const fxParent = new THREE.Group();
                    this.group.add(fxParent);
                    this.effects.push(new EffectsGeneratorV((fxParent as any), effectSettings));
                }
            }
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        this.effects.forEach(fx => fx.update(elapsed, delta));
    }
    updateCreatedObject(createdObject: CreatedObjectSettings): void {
        this.dispose(false);
        this.createdObject = createdObject;
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        this.frames.forEach(f => f.dispose());
        this.imageGeos.forEach(ig => ig.dispose());
        this.effects.forEach(fx => fx.dispose());
        this.frames = [];
        this.imageGeos = [];
        this.effects = [];
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
    }
}
