import { Group, Mesh } from "three";
import type { Material, Object3D } from 'three';
import type { ContentData, SelectedNode, ObjectEventType, EventCallback, ContentInteractionType } from "../types/objectManager";
import type { CreatedRef } from "../types/scene3d";
import type { BaseMeshOptions } from "../types/mesh";

const contentByIdPlaceholders = new Map();
contentByIdPlaceholders.set("635", {
    hover: ["placeholder1", "placeholder2"],
    click: ["placeholder3", "placeholder4"]
});
contentByIdPlaceholders.set("312", {
    hover: ["placeholder1", "placeholder2"],
    click: ["placeholder3", "placeholder4"]
});
contentByIdPlaceholders.set("850", {
    hover: ["placeholder2"],
    click: ["placeholder3"]
});
contentByIdPlaceholders.set("1953", {
    hover: ["placeholder4"],
    click: ["placeholder3"]
});
contentByIdPlaceholders.set("28", {
    hover: ["placeholder2"],
    click: ["placeholder3"]
});
class ObjectManager {
    private static instance;
    private objects = new Map();
    private contentById = new Map();
    // Store original materials for each object (objectId -> childUuid -> cloned Material)
    private originalMaterials = new Map();
    private objectHierarchy = new Map();
    private selectedMeshes = [];
    private scene = new Group();
    // Event listeners
    private listeners = {
        objectAdded: new Set(),
        objectRemoved: new Set(),
        objectUpdated: new Set(),
        objectSelected: new Set(),
        sceneCleared: new Set(),
    };
    // Current selection
    private selectedModel = null;
    private selectedObjects = new Set();
    private hoveredObject = null;
    // Scene management
    private currentSceneId = null;
    private sceneHistory = [];
    constructor() {
        if (ObjectManager.instance) {
            return ObjectManager.instance;
        }
        ObjectManager.instance = this;
    }
    // Static method to get instance
    static getInstance(): ObjectManager {
        if (!ObjectManager.instance) {
            ObjectManager.instance = new ObjectManager();
        }
        return ObjectManager.instance;
    }
    // Event Management
    on(event: ObjectEventType, callback: EventCallback): void {
        if (this.listeners[event]) {
            this.listeners[event].add(callback);
        }
    }
    off(event: ObjectEventType, callback: EventCallback): void {
        if (this.listeners[event]) {
            this.listeners[event].delete(callback);
        }
    }
    private emit(event, data) {
        if (this.listeners[event]) {
            // console.log(`ObjectManager: Emitting event ${event}`, data);
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    getScene(): Group {
        return this.scene;
    }
    setScene(scene: Group): void {
        this.scene = scene;
    }
    setSelectedMeshes(meshes: Mesh[]): void {
        this.selectedMeshes = meshes;
    }
    getSelectedMeshes(): Mesh[] {
        return this.selectedMeshes;
    }
    setSelectedModel(model: CreatedRef | null): void {
        this.selectedModel = model;
    }
    getMeshSettingsFromMesh(mesh: Mesh): BaseMeshOptions {
        const settings = {
            id: mesh.id,
            name: mesh.name,
            visible: mesh.visible,
            position: [mesh.position.x, mesh.position.y, mesh.position.z],
            rotation: mesh.rotation ? [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z] : [0, 0, 0],
            scale: mesh.scale ? [mesh.scale.x, mesh.scale.y, mesh.scale.z] : [1, 1, 1],
            castShadow: mesh.castShadow,
            receiveShadow: mesh.receiveShadow,
        };
        return (settings as any);
    }
    getMaterialSettingsFromMaterial(material: any): Record<string, any> {
        return {
            color: `#${material.color.getHexString()}`,
            opacity: material.opacity,
            alphaMap: material.alphaMap?.name,
            envMap: material.envMap?.name,
            lightMap: material.lightMap?.name,
            aoMap: material.aoMap?.name,
            wireframe: material.wireframe,
        };
    }
    getAllMaterialsFromGroup(group: Group): Record<string, any>[] {
        const materials = [];
        console.log({ group });
        group.traverse((child) => {
            if (child instanceof Mesh && child.material) {
                // console.log({material: child.material})
                const materialSettings = this.getMaterialSettingsFromMaterial(child.material);
                materials.push({
                    name: child.name,
                    ...materialSettings
                });
            }
        });
        return materials;
    }
    getMaterialSettingsFromObjectId(id: string): Record<string, any> {
        const object = this.objects.get(id);
        if (!object) {
            console.warn(`ObjectManager: Object with id ${id} not found`);
            return {};
        }
        // console.log({object})
        let material = null;
        object.object.traverse((child) => {
            if (!material && child instanceof Mesh && child.material) {
                material = Array.isArray(child.material) ? child.material[0] : child.material;
            }
        });
        const settings = material ? {
            name: object.name,
            color: `#${material.color.getHexString()}`,
            opacity: material.opacity,
            alphaMap: material.alphaMap?.name,
            envMap: material.envMap?.name,
            lightMap: material.lightMap?.name,
            aoMap: material.aoMap?.name,
            // side: material.side,
            wireframe: material.wireframe,
        } : {
            name: object.name,
            color: '#FFFFFF',
            opacity: 1,
            alphaMap: undefined,
            envMap: undefined,
            lightMap: undefined,
            aoMap: undefined,
            // side: material.side,
            wireframe: false,
        };
        return settings;
    }
    getSelectedModel(): CreatedRef | null {
        return this.selectedModel;
    }
    addObject(object: CreatedRef): boolean {
        if (!object || !object.id) {
            console.warn("ObjectManager: Cannot add object without Id");
            return false;
        }
        const id = object.id;
        // console.log(`Registering object with ID ${object.id}`, object);
        // Store object
        this.objects.set(id, object);
        // Store original materials for this object
        this.storeOriginalMaterials(id, object.object);
        this.emit('objectAdded', { object });
        return true;
    }
    /**
     * Store original materials for an object's children
     * Called automatically when adding an object
     */
    storeOriginalMaterials(objectId: string, object: Object3D): void {
        const materialsMap = new Map();
        object.traverse((child) => {
            if ((child as any).material) {
                // Clone the material to preserve original state
                const clonedMaterial = (child as any).material.clone();
                materialsMap.set(child.uuid, clonedMaterial);
            }
        });
        if (materialsMap.size > 0) {
            this.originalMaterials.set(objectId, materialsMap);
        }
    }
    /**
     * Restore original materials to an object
     * @param objectId - The object ID to restore materials for
     * @returns true if materials were restored
     */
    restoreOriginalMaterials(objectId: string): boolean {
        const object = this.objects.get(objectId);
        const materialsMap = this.originalMaterials.get(objectId);
        console.log(`Restoring materials for object ID ${objectId}`, { object, materialsMap });
        if (!object || !materialsMap) {
            console.warn(`ObjectManager: Cannot restore materials for ${objectId}`);
            return false;
        }
        object.object.traverse((child) => {
            if (child.material && materialsMap.has(child.uuid)) {
                // Clone again to preserve the original for future restorations
                child.material = materialsMap.get(child.uuid).clone();
            }
        });
        return true;
    }
    /**
     * Get the original material for a specific child of an object
     */
    getOriginalMaterial(objectId: string, childUuid: string): Material | null {
        const materialsMap = this.originalMaterials.get(objectId);
        return materialsMap?.get(childUuid) || null;
    }
    removeObject(id: string): boolean {
        const object = this.objects.get(id);
        if (!object) {
            console.warn(`ObjectManager: Object with id ${id} not found`);
            return false;
        }
        this.selectedObjects.delete(id);
        if (this.hoveredObject === id) {
            this.hoveredObject = null;
        }
        // Remove from storage
        this.objects.delete(id);
        // Clean up original materials
        this.originalMaterials.delete(id);
        // Emit event
        this.emit('objectRemoved', { id: id.toString(), object });
        // console.log(`ObjectManager: Removed object ${metadata?.name || id}`);
        return true;
    }
    updateContentById(id: string, uiElementId: string, type: ContentInteractionType = 'hover'): void {
        console.log(`ObjectManager: Updating content for id ${id} with element ${uiElementId}`);
        const existingContent = this.contentById.get(id) || {
            hover: [],
            click: []
        };
        existingContent[type].push(uiElementId);
        this.contentById.set(id, existingContent);
        console.log(`ObjectManager: Content updated for id ${id}`, this.contentById.get(id));
    }
    updateContentByType(): void {
    }
    getContentById(id: string): ContentData | null {
        // console.log("Getting content for id:", id);
        // console.log(this.contentById);
        return this.contentById.get(id) || null;
    }
    showNode(model: Object3D, selectedNode: SelectedNode): void {
        console.log({
            model,
            selectedNode
        });
        model.traverse((node) => {
            node.visible = false;
        });
        // Function to make a node and all its parents visible
        const makeNodeAndParentsVisible = (targetNode) => {
            let currentNode = targetNode;
            // Traverse up the hierarchy to make all parents visible
            while (currentNode) {
                console.log("Making node visible:", currentNode);
                currentNode.visible = true;
                currentNode = currentNode.parent;
                // Stop if we reach the scene or root
                if (!currentNode || currentNode.isScene || currentNode.type === 'Scene') {
                    break;
                }
            }
        };
        const makeAllNodeChildrenVisible = (targetNode) => {
            targetNode.traverse((node) => {
                node.visible = true;
            });
        };
        // Find the target node and make it and its parents visible
        model.traverse((node) => {
            if (node.uuid === selectedNode.object.uuid) {
                makeNodeAndParentsVisible(node);
                makeAllNodeChildrenVisible(node);
            }
        });
    }
    // Retrieval Methods
    getObject(id: string): CreatedRef | null {
        // console.log(this.objects);
        if (!this.objects.has(id)) {
            // console.warn(`ObjectManager: Object with id ${id} not found`);
            return null;
        }
        return this.objects.get(id);
    }
    updateObjectId(tempId: string, realId: string): void {
        const object = this.objects.get(tempId);
        if (object) {
            this.objects.delete(tempId);
            object.id = realId;
            this.objects.set(realId, object);
        }
        else {
            console.warn(`ObjectManager: Cannot update ID from ${tempId} to ${realId} - object not found`);
        }
    }
    getObjectByUserDataId(id: string): CreatedRef | null {
        // find an object that userData has this id
        for (const object of this.objects.values()) {
            if (object.object.userData.id && object.object.userData.id !== undefined) {
                // console.log("Found object with userData.id:", object);
                if (object.object.userData.id === id) {
                    return object;
                }
            }
            else {
                return this.getObject(id);
            }
        }
        return null;
    }
    getObjectByName(name: string): CreatedRef | null {
        for (const object of this.objects.values()) {
            if (object.name === name) {
                return object;
            }
        }
        return null;
    }
    getAllObjects(): CreatedRef[] {
        return Array.from(this.objects.values());
    }
    getObjectsTypes(): {
                [key: string]: CreatedRef[];
            } {
        const types = {};
        console.log(this.objects);
        for (const object of this.objects.values()) {
            const object3d = object.object;
            if (!types[object3d.type]) {
                types[object3d.type] = [];
            }
            types[object3d.type].push(object);
        }
        return types;
    }
    getObjectsByType(type: string): CreatedRef[] {
        return this.getObjectsTypes()[type] || [];
    }
    // Hierarchy Management
    addHierarchy(parentId: string, childId: string): void {
        if (!this.objectHierarchy.has(parentId)) {
            this.objectHierarchy.set(parentId, new Set());
        }
        this.objectHierarchy.get(parentId).add(childId);
    }
    // Scene Management
    setCurrentScene(sceneId: string): void {
        if (this.currentSceneId !== sceneId) {
            this.currentSceneId = sceneId;
            this.sceneHistory.push(sceneId);
        }
    }
    clearAllObjects(): void {
        const objectIds = Array.from(this.objects.keys());
        objectIds.forEach(id => this.removeObject(id));
        // Clear all collections
        this.objects.clear();
        this.hoveredObject = null;
        this.emit('sceneCleared', { sceneId: 'all' });
        console.log('ObjectManager: Cleared all objects');
    }
}
// Export singleton instance
export default ObjectManager.getInstance();
