import * as THREE from 'three';
import { LetterV } from './LetterV';
// legacy vanilla port: the old 2d / 3d text config shape (removed from the live types)
type Text3DConfig = { text?: string; font?: string; renderMode?: 'text3d' | 'bitmap'; [k: string]: any };
export interface Text3DVOptions {
    text: string;
    config: Text3DConfig;
    color?: string;
    opacity?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
}


export class Text3DV {
    private parent;
    private group;
    private letters = [];
    private options;
    constructor(parent: THREE.Object3D, options: Text3DVOptions) {
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
        const { text, config, color = '#ffffff', opacity = 1 } = this.options;
        const size = config.size ?? 1;
        const spacing = size * (0.6 + (config.letterSpacing ?? 0));
        const totalWidth = (text.length - 1) * spacing;
        text.split('').forEach((char, i) => {
            const x = i * spacing - totalWidth / 2;
            const lv = new LetterV(this.group, { char, config, color, opacity, position: [x, 0, 0] });
            this.letters.push(lv);
        });
    }
    update(_elapsed: number, _delta?: number): void { }
    updateConfig(options: Text3DVOptions): void {
        this.dispose(false);
        this.options = options;
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        this.letters.forEach(l => l.dispose());
        this.letters = [];
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
    }
}
