import { TextureLoader } from 'three';
import type { Texture } from 'three';
export type TextureType = 'clouds' | 'grass' | 'terrain' | 'grounds' | 'images';

class TexturesManager {
    private textures = new Map();
    private texturesByType = new Map();
    private loader;
    constructor() {
        this.loader = new TextureLoader();
        ['images', 'clouds', 'grass', 'terrain', 'grounds'].forEach(t => this.texturesByType.set(t, new Map()));
    }
    async loadTexture(name: string, url: string, type?: TextureType): Promise<Texture> {
        if (type && this.texturesByType.get(type)?.has(name)) {
            return this.texturesByType.get(type).get(name).texture;
        }
        const img = await new Promise((resolve, reject) => {
            const image = new window.Image();
            image.crossOrigin = 'Anonymous';
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
        const { width, height } = img as any;
        const isLandscape = width > height;
        return new Promise((resolve, reject) => {
            this.loader.load(url, (texture) => {
                if (type)
                    this.texturesByType.get(type)?.set(name, { texture, width, height, isLandscape });
                resolve(texture);
            }, undefined, reject);
        });
    }
    getTextureByUrl(url: string): Texture | undefined {
        for (const [, value] of this.textures.entries()) {
            if (value.texture.image?.src === url)
                return value.texture;
        }
        return undefined;
    }
    getTexture(key: string): Texture | undefined {
        return this.textures.get(key)?.texture;
    }
    addTexture(key: string, texture: Texture, width: number, height: number, isLandscape: boolean): void {
        this.textures.set(key, { texture, width, height, isLandscape });
    }
    removeTexture(key: string): void { this.textures.delete(key); }
    clear(): void { this.textures.clear(); }
}
const texturesManager: TexturesManager = new TexturesManager();
export default texturesManager;
