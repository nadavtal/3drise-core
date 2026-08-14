import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { HdrSettings, HdrTransitionSettings } from "../types";

export const createCubeCamera = (scene: THREE.Scene, resolution: number = 512, position: THREE.Vector3 = new THREE.Vector3(0, 50, 0)): THREE.CubeCamera => {
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(resolution, {
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
    });
    const cubeCamera = new THREE.CubeCamera(0.1, 10000, cubeRenderTarget);
    cubeCamera.position.copy(position);
    scene.add(cubeCamera);
    return cubeCamera;
};
export const updateCubeCamera = (cubeCamera: THREE.CubeCamera, renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture => {
    const originalEnvironment = scene.environment;
    const originalBackground = scene.background;
    const originalEnvMaps = new Map();
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(material => {
                if (material instanceof THREE.MeshStandardMaterial ||
                    material instanceof THREE.MeshPhysicalMaterial) {
                    originalEnvMaps.set(material, material.envMap);
                    material.envMap = null;
                    material.needsUpdate = true;
                }
            });
        }
    });
    scene.environment = null;
    scene.background = null;
    cubeCamera.visible = false;
    try {
        cubeCamera.update(renderer, scene);
    }
    finally {
        // Always restore scene and camera state so the main render is never left
        // with a corrupted environment or an invisible cube camera.
        cubeCamera.visible = true;
        scene.environment = originalEnvironment;
        scene.background = originalBackground;
        originalEnvMaps.forEach((envMap, material) => {
            if (material instanceof THREE.MeshStandardMaterial ||
                material instanceof THREE.MeshPhysicalMaterial) {
                material.envMap = envMap;
                material.needsUpdate = true;
            }
        });
    }
    return cubeCamera.renderTarget.texture;
};
export const setSceneEnvironment = (scene: THREE.Scene, texture: THREE.Texture | null): void => {
    scene.environment = texture;
    scene.background = texture;
};
export const clearSceneEnvironment = (scene: THREE.Scene): void => {
    scene.background = null;
    scene.environment = null;
    scene.traverse((child) => {
        if ((child as any).isMesh) {
            const mesh = child;
            const materials = Array.isArray((mesh as any).material) ? (mesh as any).material : [(mesh as any).material];
            materials.forEach(material => {
                if (material instanceof THREE.MeshStandardMaterial ||
                    material instanceof THREE.MeshPhysicalMaterial) {
                    material.envMap = null;
                    material.needsUpdate = true;
                }
            });
        }
    });
};
export const loadEquirectangularEnvironment = async (src: string, pmremGenerator: THREE.PMREMGenerator, loader: THREE.TextureLoader): Promise<THREE.Texture> => {
    const equirectangularTexture = await new Promise((resolve, reject) => {
        loader.load(src, resolve, undefined, reject);
    });
    pmremGenerator.compileEquirectangularShader();
    const ldrCubeRenderTarget = pmremGenerator.fromEquirectangular((equirectangularTexture as any));
    return ldrCubeRenderTarget.texture;
};
const pickEquirectLoader = (src) => {
    const ext = src.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
    if (ext === 'hdr') {
        const l = new RGBELoader();
        l.setDataType(THREE.HalfFloatType);
        return l;
    }
    if (ext === 'exr') {
        const l = new EXRLoader();
        l.setDataType(THREE.HalfFloatType);
        return l;
    }
    return new THREE.TextureLoader();
};
/**
 * Loads an equirectangular environment from a URL (HDR, EXR, PNG, or JPG).
 * Picks the appropriate loader from the file extension, runs PMREM, and
 * returns a cube render-target texture ready to assign to scene.environment.
 * Disposes the raw equirect texture; callers own the returned PMREM texture.
 */
export const loadEquirectHdrEnvironment = async (src: string, renderer: THREE.WebGLRenderer): Promise<THREE.Texture> => {
    const loader = pickEquirectLoader(src);
    const equirectangular = await new Promise((resolve, reject) => {
        loader.load(src, resolve, undefined, reject);
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromEquirectangular((equirectangular as any));
    (equirectangular as any).dispose();
    pmrem.dispose();
    return target.texture;
};
export const disposeCubeCamera = (cubeCamera: THREE.CubeCamera, scene: THREE.Scene): void => {
    scene.remove(cubeCamera);
    cubeCamera.renderTarget.dispose();
};
export const createDebouncedUpdate = (callback: () => void, delay: number = 100): (() => void) => {
    let timeoutId = null;
    return () => {
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback();
            timeoutId = null;
        }, delay);
    };
};
export const DEFAULT_HDR_TRANSITION_SETTINGS: HdrTransitionSettings = {
    types: ['crossfade'],
    durationMs: 1500,
    holdMs: 800,
    order: 'sequential',
    feather: 0.07,
    dividerFeather: 0.003,
    wipeAxis: [0, 1, 0],
    irisCenter: [0, 1, 0],
    noiseScale: 4.0,
};
export const getTransitionSettings = (hdr: HdrSettings): HdrTransitionSettings => ({
    ...DEFAULT_HDR_TRANSITION_SETTINGS,
    ...(hdr.transitionSettings ?? {}),
});
