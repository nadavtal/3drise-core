import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import type { TextConfig } from "../types/text";
export interface LetterVOptions {
    char: string;
    config: TextConfig;
    color?: string;
    opacity?: number;
    position?: [number, number, number];
}


export class LetterV {
    private parent;
    private group;
    private mesh = null;
    private material = null;
    private options;
    private static loader = new FontLoader();
    private static fontCache = new Map();
    constructor(parent: THREE.Object3D, options: LetterVOptions) {
        this.parent = parent;
        this.options = options;
        this.group = new THREE.Group();
        if (options.position)
            this.group.position.set(...options.position);
        parent.add(this.group);
        this.build();
    }
    private build() {
        const { char, config, color = '#ffffff', opacity = 1 } = this.options;
        if (config.renderMode !== 'text3d') {
            console.warn('[LetterV] Only text3d render mode is supported in vanilla. Use Letter React component for bitmap mode.');
            return;
        }
        const c = config;
        const fontUrl = c.font
            ? this.getFontUrl(c.font)
            : 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';
        this.material = new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity });
        const buildGeometry = (font) => {
            if (this.mesh) {
                this.mesh.geometry.dispose();
                this.group.remove(this.mesh);
            }
            const geo = new TextGeometry(char, {
                font,
                size: c.size ?? 1,
                depth: c.height ?? 0.2,
                curveSegments: c.curveSegments ?? 12,
                bevelEnabled: c.bevelEnabled ?? true,
                bevelThickness: c.bevelThickness ?? 0.03,
                bevelSize: c.bevelSize ?? 0.02,
                bevelOffset: c.bevelOffset ?? 0,
                bevelSegments: c.bevelSegments ?? 5,
            });
            geo.center();
            this.mesh = new THREE.Mesh(geo, this.material);
            this.group.add(this.mesh);
        };
        const cached = LetterV.fontCache.get(fontUrl);
        if (cached) {
            buildGeometry(cached);
        }
        else {
            LetterV.loader.load(fontUrl, (font) => {
                LetterV.fontCache.set(fontUrl, font);
                buildGeometry(font);
            });
        }
    }
    private getFontUrl(fontName) {
        const fontMap = {
            roboto: 'https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json',
            merriweather: 'https://threejs.org/examples/fonts/droid/droid_serif_regular.typeface.json',
            playfair: 'https://threejs.org/examples/fonts/droid/droid_serif_bold.typeface.json',
            bebas: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json',
            lobster: 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json',
        };
        return fontMap[fontName] ?? 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json';
    }
    updateConfig(options: LetterVOptions): void {
        this.dispose(false);
        this.options = options;
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.group.remove(this.mesh);
            this.mesh = null;
        }
        this.material?.dispose();
        this.material = null;
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
    }
}
