import { BoxGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, TextureLoader, } from 'three';
import type { Side, Scene } from 'three';
import type { GalleryLayoutSettings } from "../types/gallery";
export interface FrameVOptions {
    url: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    layoutSettings: Pick<GalleryLayoutSettings, 'width' | 'height' | 'outerFrameScale'>;
    frameColor?: string;
    side?: Side;
    onLoad?: () => void;
    onClick?: (url: string) => void;
}


export class FrameV {
    private group;
    private frameMesh;
    private imageMesh;
    readonly url: string;
    onClick?: (url: string) => void;
    constructor(scene: Scene, options: FrameVOptions) {
        const { url, position = [0, 0, 0], rotation = [0, 0, 0], layoutSettings, frameColor = '#333333', side = DoubleSide, onLoad, onClick, } = options;
        this.url = url;
        this.onClick = onClick;
        const w = (layoutSettings.width ?? 1) * (layoutSettings.outerFrameScale ?? 1);
        const h = (layoutSettings.height ?? 1) * (layoutSettings.outerFrameScale ?? 1);
        this.frameMesh = new Mesh(new BoxGeometry(w, h, 0.05), new MeshStandardMaterial({ color: frameColor, side }));
        this.imageMesh = new Mesh(new PlaneGeometry(w * 0.9, h * 0.9), new MeshBasicMaterial({ transparent: true, side }));
        this.imageMesh.position.z = 0.03;
        this.group = new Group();
        this.group.add(this.frameMesh, this.imageMesh);
        this.group.position.set(...position);
        this.group.rotation.set(...rotation);
        scene.add(this.group);
        new TextureLoader().load(url, (texture) => {
            this.imageMesh.material.map = texture;
            this.imageMesh.material.needsUpdate = true;
            onLoad?.();
        });
    }
    setPosition(position: [number, number, number]): void {
        this.group.position.set(...position);
    }
    setHovered(hovered: boolean): void {
        this.frameMesh.material.emissive.set(hovered ? '#444444' : '#000000');
    }
    dispose(): void {
        this.frameMesh.geometry.dispose();
        this.frameMesh.material.dispose();
        this.imageMesh.geometry.dispose();
        const mat = this.imageMesh.material;
        mat.map?.dispose();
        mat.dispose();
        this.group.parent?.remove(this.group);
    }
}
