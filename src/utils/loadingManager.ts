import { LoadingManager, TextureLoader, RepeatWrapping, HalfFloatType } from 'three';
import type { Texture, Object3D } from 'three';
// import { TilesRenderer } from "3d-tiles-renderer";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
// import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
type LoadCallback = () => void;

type ProgressCallback = (progress: number) => void;

type TextureCallback = (texture: Texture) => void;

interface LoadGLTFResult {
    mesh: Object3D;
    diffuseMap: Texture;
    normalMap: Texture;
    aoMap: Texture;
}

export type { LoadCallback, ProgressCallback, TextureCallback, LoadGLTFResult };

// Initialize loading manager and loaders
const loadingManager: LoadingManager = new LoadingManager();
const textureLoader: TextureLoader = new TextureLoader(loadingManager);
const rgbeLoader: RGBELoader = new RGBELoader();
rgbeLoader.setDataType(HalfFloatType);
const gltfLoader: GLTFLoader = new GLTFLoader(loadingManager);
const dracoLoader: DRACOLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
gltfLoader.setDRACOLoader(dracoLoader);
// Callback arrays
const onLoadCallbacks = [];
const onProgressCallbacks = [];
// Loading manager event handlers
loadingManager.onLoad = () => {
    while (onLoadCallbacks.length) {
        const callback = onLoadCallbacks.shift();
        if (callback) {
            callback.call(null);
        }
    }
};
loadingManager.onProgress = (item, loaded, total) => {
    const _onProgressCallbacks = [...onProgressCallbacks];
    while (_onProgressCallbacks.length) {
        const callback = _onProgressCallbacks.shift();
        if (callback) {
            callback(loaded / total);
        }
    }
};
// Texture loading function (synchronous - returns texture before image loads)
const loadTexture = (src: string, callback?: TextureCallback): Texture => {
    // console.log('loadTexture', src);
    const texture = textureLoader.load(src, () => {
        if (typeof callback === 'function') {
            callback(texture);
        }
    });
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return texture;
};
// Async texture loading - resolves when image is fully loaded
const loadTextureAsync = (src: string): Promise<Texture> => {
    return new Promise((resolve, reject) => {
        textureLoader.load(src, (texture) => {
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            resolve(texture);
        }, undefined, (error) => {
            console.error('Failed to load texture:', src, error);
            reject(error);
        });
    });
};
// HDR loading function
const loadHdr = (src: string): Promise<Texture> => {
    return new Promise((resolve, reject) => {
        rgbeLoader.load(src, (texture) => {
            resolve(texture);
        }, undefined, (error) => {
            reject(error);
        });
    });
};
// GLTF model loading function
const loadModelGLTF = (src: string): Promise<Object3D> => {
    // console.log('loadModelGLTF', src)
    return new Promise((resolve, reject) => {
        gltfLoader.load(src, (gltf) => {
            resolve(gltf.scene);
        }, undefined, (error) => {
            console.log('Error loading GLTF model:', src);
            reject(error);
        });
    });
};
// Combined GLTF and texture loading function
const loadGLTF = async (modelSrc: string, diffuseSrc: string, normalSrc: string, aoSrc: string): Promise<LoadGLTFResult> => {
    const mesh = await loadModelGLTF(modelSrc);
    const diffuseMap = loadTexture(diffuseSrc);
    const normalMap = loadTexture(normalSrc);
    const aoMap = loadTexture(aoSrc);
    return { mesh, diffuseMap, normalMap, aoMap };
};
// Register load completion callback
const onLoad = (callback: LoadCallback): void => {
    onLoadCallbacks.push(callback);
    // Debug reference (consider removing in production)
    (window as any).aa = loadingManager;
};
// Register progress callback
const onProgress = (callback: ProgressCallback): void => {
    onProgressCallbacks.push(callback);
};
// Export all loading functions and utilities
export { loadGLTF, loadTexture, loadTextureAsync, onLoad, onProgress, loadModelGLTF, loadHdr, loadingManager, textureLoader, rgbeLoader, gltfLoader, dracoLoader };
