import type { CreatedObjectSettings } from "../types/scene3d";
export interface ObjectTreeNode {
    objectId: string;
    createdObject?: CreatedObjectSettings;
    children: ObjectTreeNode[];
}


/**
 * Build a tree structure from flat array of objects using parentId relationships
 */
export function buildObjectTree(objects: CreatedObjectSettings[]): ObjectTreeNode[] {
    const objectMap = new Map();
    const roots = [];
    // First pass: create tree nodes for all objects
    objects.forEach(obj => {
        objectMap.set(obj.id, { objectId: obj.id, createdObject: obj, children: [] });
    });
    // Second pass: build parent-child relationships
    objects.forEach(obj => {
        const node = objectMap.get(obj.id);
        if (obj.parentId && objectMap.has(obj.parentId)) {
            const parent = objectMap.get(obj.parentId);
            parent.children.push(node);
        }
        else {
            // No parent or parent doesn't exist - this is a root object
            roots.push(node);
        }
    });
    return roots;
}
/**
 * Get all descendant IDs of an object (children, grandchildren, etc.)
 */
export function getDescendantIds(objectId: string, objects: CreatedObjectSettings[]): string[] {
    const descendants = [];
    const queue = objects.filter(obj => obj.parentId === objectId);
    while (queue.length > 0) {
        const current = queue.shift();
        descendants.push(current.id);
        // Add children of current to queue
        objects.filter(obj => obj.parentId === current.id).forEach(child => {
            queue.push(child);
        });
    }
    return descendants;
}
/**
 * Get all ancestor IDs of an object (parent, grandparent, etc. up to root)
 */
export function getAncestorIds(objectId: string, objects: CreatedObjectSettings[]): string[] {
    const ancestors = [];
    let current = objects.find(obj => obj.id === objectId);
    while (current && current.parentId) {
        ancestors.push(current.parentId);
        current = objects.find(obj => obj.id === current.parentId);
    }
    return ancestors;
}
/**
 * Check if dropping an object onto a target would create a circular reference
 */
export function wouldCreateCircularReference(objectId: string, targetParentId: string, objects: CreatedObjectSettings[]): boolean {
    // Can't parent to self
    if (objectId === targetParentId)
        return true;
    // Check if target is a descendant of object
    const descendants = getDescendantIds(objectId, objects);
    return descendants.includes(targetParentId);
}
/**
 * Get the depth of an object in the tree (0 = root)
 */
export function getObjectDepth(objectId: string, objects: CreatedObjectSettings[]): number {
    return getAncestorIds(objectId, objects).length;
}
/**
 * Flatten a tree back to array (useful for iteration in render order)
 */
export function flattenTree(nodes: ObjectTreeNode[]): string[] {
    const result = [];
    function traverse(node) {
        result.push(node.objectId);
        node.children.forEach(traverse);
    }
    nodes.forEach(traverse);
    return result;
}
/**
 * Sort objects so parents come before children (for proper Three.js rendering)
 */
export function sortByHierarchy(objects: CreatedObjectSettings[]): string[] {
    const tree = buildObjectTree(objects);
    return flattenTree(tree);
}
/**
 * Get object type icon name for UI display
 */
export function getObjectTypeIcon(type: CreatedObjectSettings['type']): string {
    const icons = {
        mesh: 'cube',
        model: 'box',
        particles: 'sparkles',
        path: 'route',
        gallery: 'image',
        custom_primitive: 'shapes',
        text: 'type',
        group: 'folder',
        grid: 'grid-3x3',
        effect: 'wand2',
        light: 'lightbulb',
        clouds: 'cloud',
        rain: 'cloud-rain',
        water: 'waves',
        stars: 'star',
        fog: 'cloud',
        solarSystem: 'solar-system',
        shootingStars: 'shooting-star',
        earth: 'globe',
    };
    return icons[type] || 'circle';
}
