import { Box3, Vector3 } from "three";
import type { Object3D } from 'three';
import { loadModelGLTF } from "./loadingManager";
import ObjectManager from "../services/ObjectManager";
import type { ModelData } from "../types/mesh";
import type { CreatedRef } from "../types/scene3d";
import { EffectState } from "../types";

export const createDefaultEffectState = (object: Object3D): EffectState => {
    const material = (object as any).material;
    const opacity = material && 'opacity' in material ? material.opacity : 1;
    return {
        originalPosition: { x: object.position.x, y: object.position.y, z: object.position.z },
        originalScale: { x: object.scale.x, y: object.scale.y, z: object.scale.z },
        originalRotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
        originalOpacity: opacity,
        originalColors: {},
        time: 0,
        isTriggered: false,
    };
};
export const calculateAutoScale = (model: Object3D, maxSize: number = 5): number => {
    // Create a bounding box for the model
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    // Find the largest dimension
    const maxDimension = Math.max(size.x, size.y, size.z);
    // Calculate scale factor to fit within maxSize
    const scaleFactor = maxSize / maxDimension;
    console.log(`Model dimensions: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
    console.log(`Max dimension: ${maxDimension.toFixed(2)}, Scale factor: ${scaleFactor.toFixed(2)}`);
    return scaleFactor;
};
// Load model from URL
export const createModelFromUrl = async (model: ModelData): Promise<CreatedRef | null> => {
    try {
        console.log(`Loading model from model: `, model);
        const loadedModel = await loadModelGLTF(model.url);
        // console.log("Model loaded from URL:", loadedModel);
        if (loadedModel) {
            loadedModel.name = model.name || `model_${Date.now()}`;
            loadedModel.scale.set(...(model.scale || [1, 1, 1]));
            loadedModel.rotation.set(...(model.rotation || [0, 0, 0]));
            loadedModel.position.set(...(model.position || [0, 0, 0]));
            loadedModel.traverse((child) => {
                if ((child as any).isMesh) {
                    child.castShadow = model.castShadow !== undefined ? model.castShadow : true;
                    child.receiveShadow = model.receiveShadow !== undefined ? model.receiveShadow : true;
                }
            });
            const managedModel = {
                id: model.id || `model_${Date.now()}`,
                name: loadedModel.name,
                object: loadedModel,
            };
            ObjectManager.addObject(managedModel);
            return managedModel;
        }
    }
    catch (error) {
        console.error("Error loading model from URL:", error);
        return null;
    }
    return null;
};
export const buildQueryString = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
        }
    });
    return searchParams.toString();
};
export const loadModels = async (models: ModelData[]): Promise<CreatedRef[]> => {
    const loadedModels = [];
    const failedModels = [];
    for (const model of models) {
        try {
            const loadedModel = await createModelFromUrl(model);
            if (loadedModel) {
                loadedModels.push(loadedModel);
            }
            else {
                console.warn(`[loadModels] Model returned null:`, {
                    id: model.id,
                    name: model.name,
                    url: model.url
                });
                failedModels.push({ model, error: new Error('createModelFromUrl returned null') });
            }
        }
        catch (error) {
            console.error(`[loadModels] Failed to load model:`, {
                id: model.id,
                name: model.name,
                url: model.url,
                error: error instanceof Error ? error.message : error
            });
            failedModels.push({ model, error });
        }
    }
    // Summary logging
    if (failedModels.length > 0) {
        console.warn(`[loadModels] Loading complete. Success: ${loadedModels.length}, Failed: ${failedModels.length}`);
        console.warn(`[loadModels] Failed models:`, failedModels.map(f => ({
            id: f.model.id,
            name: f.model.name,
            url: f.model.url,
            error: f.error instanceof Error ? f.error.message : String(f.error)
        })));
    }
    else {
        console.log(`[loadModels] All ${loadedModels.length} models loaded successfully`);
    }
    return loadedModels;
};
export const dontAnimate = (key: string): boolean => {
    return key.toLowerCase().includes('texture') ||
        key.toLowerCase().includes('noise');
};
export const loadAssets = async (models: ModelData[]): Promise<CreatedRef[]> => {
    console.log(`[loadAssets] Starting to load ${models.length} models`);
    if (models.length === 0) {
        console.log('[loadAssets] No models to load');
        return [];
    }
    const cleanedModels = models.filter(model => {
        if (!model.url) {
            console.warn(`[loadAssets] Skipping model with missing URL:`, { id: model.id, name: model.name });
            return false;
        }
        if (model.url.includes('blob:')) {
            console.warn(`[loadAssets] Skipping blob URL model:`, { id: model.id, name: model.name });
            return false;
        }
        return true;
    });
    console.log(`[loadAssets] Loading ${cleanedModels.length} valid models (filtered ${models.length - cleanedModels.length})`);
    const createdObjects = await loadModels(cleanedModels);
    console.log(`[loadAssets] Completed. Loaded ${createdObjects.length}/${cleanedModels.length} models`);
    return createdObjects;
};
export const createUniformsText = (uniforms: any[]): string => {
    if (!uniforms || uniforms.length === 0)
        return '';
    let uniformText = '';
    uniforms.forEach((uniform) => {
        uniformText += `uniform ${uniform.type} ${uniform.name};\n`;
    });
    return uniformText;
};
/**
 * Compile shaders by prepending uniform declarations to vertex and fragment shader code.
 * Use this in components via useMemo to derive compiled shaders from raw state.
 */
export const compileShaders = (uniforms: any[], vertexShader: string, fragmentShader: string): {
        vertex: string;
        fragment: string;
    } => {
    const uniformsText = createUniformsText(uniforms);
    return {
        vertex: uniformsText + '\n' + vertexShader,
        fragment: uniformsText + '\n' + fragmentShader,
    };
};
