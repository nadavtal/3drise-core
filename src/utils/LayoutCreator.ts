// =============================================================================
// LayoutCreator — the layout math behind galleries and object layouts
// =============================================================================
//
// Count-based: every algorithm returns a transform per slot and knows nothing about
// what is placed there. GalleryCreator stamps image urls onto these slots; ObjectNode
// repeats a scene object across them (meshSettings.layout).
import type { GalleryLayout, LayoutParams, LayoutSlot, ObjectLayoutSettings } from "../types/gallery";
import type { CreatedObjectSettings } from "../types/scene3d";
import { modeGroupOf } from "./surfaceUtils";
export class LayoutCreator {
    /**
     * Creates a scattered gallery layout with concentric circles
     * Center image + rings of images around it, with side images rotated inward
     */
    static scattered(count: number, spacing: number = 3.5): LayoutSlot[] {
        const numImages = count;
        const frames: LayoutSlot[] = [];
        const actualCount = numImages;
        if (actualCount === 0)
            return frames;
        // First image at center
        frames.push({
            position: [0, 0, 0],
            rotation: [0, 0, 0],
        });
        let imageIndex = 1;
        let ringNumber = 1;
        // Distribute remaining images across rings
        while (imageIndex < actualCount) {
            const radius = ringNumber * spacing;
            // Each ring can hold more images as radius increases
            const imagesInRing = Math.min(Math.ceil(6 + ringNumber * 2), // 8, 10, 12, 14... images per ring
            actualCount - imageIndex);
            for (let i = 0; i < imagesInRing && imageIndex < actualCount; i++) {
                const angle = (i / imagesInRing) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                frames.push({
                    position: [x, 0, z],
                    rotation: [0, 0, 0], // All images face forward for now
                });
                imageIndex++;
            }
            ringNumber++;
        }
        return frames;
    }
    /**
     * Creates a grid/tile layout with frames arranged in rows and columns
     */
    static tiles(count: number, columns: number = 3, spacing: number = 2.5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        const rows = Math.ceil(totalImages / columns);
        // Calculate centering offset to position gallery center at [0, 0, 0]
        const totalWidth = (columns - 1) * spacing;
        const totalHeight = (rows - 1) * spacing;
        const offsetX = -totalWidth / 2;
        const offsetY = -totalHeight / 2;
        for (let i = 0; i < totalImages; i++) {
            const row = Math.floor(i / columns);
            const col = i % columns;
            frames.push({
                position: [
                    offsetX + col * spacing,
                    offsetY + row * spacing,
                    0, // Centered at origin
                ],
                rotation: [0, 0, 0],
            });
        }
        return frames;
    }
    /**
     * Creates a horizontal row layout
     */
    static horizontal(count: number, spacing: number = 2.5, startX: number = 0): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        // Calculate centering offset to position gallery center at [0, 0, 0]
        const totalWidth = (totalImages - 1) * spacing;
        const offsetX = startX - totalWidth / 2;
        for (let i = 0; i < totalImages; i++) {
            frames.push({
                position: [offsetX + i * spacing, 0, 0],
                rotation: [0, 0, 0],
            });
        }
        return frames;
    }
    /**
     * Creates a vertical column layout
     */
    static vertical(count: number, spacing: number = 2.0, startY: number = 0): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        // Calculate centering offset to position gallery center at [0, 0, 0]
        const totalHeight = (totalImages - 1) * spacing;
        const offsetY = startY - totalHeight / 2;
        for (let i = 0; i < totalImages; i++) {
            frames.push({
                position: [0, offsetY + i * spacing, 0],
                rotation: [0, 0, 0],
            });
        }
        return frames;
    }
    /**
     * Creates a circular layout with images arranged in a ring
     */
    static circular(count: number, radius: number = 5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        for (let i = 0; i < totalImages; i++) {
            const angle = (i / totalImages) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            frames.push({
                position: [x, 0, z],
                rotation: [0, -angle, 0], // Face inward
            });
        }
        return frames;
    }
    /**
     * Creates a spiral layout ascending or expanding outward
     */
    static spiral(count: number, radius: number = 5, rotations: number = 2, heightIncrement: number = 0.5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const angle = progress * rotations * Math.PI * 2;
            const currentRadius = radius * (1 - progress * 0.3); // Spiral inward slightly
            const x = Math.cos(angle) * currentRadius;
            const z = Math.sin(angle) * currentRadius;
            const y = progress * totalImages * heightIncrement - (totalImages * heightIncrement) / 2;
            frames.push({
                position: [x, y, z],
                rotation: [0, -angle, 0],
            });
        }
        return frames;
    }
    /**
     * Creates an arc/curved layout
     */
    static arc(count: number, radius: number = 5, arcAngle: number = Math.PI): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / (totalImages - 1 || 1);
            const angle = -arcAngle / 2 + progress * arcAngle;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            frames.push({
                position: [x, 0, z],
                rotation: [0, -angle, 0],
            });
        }
        return frames;
    }
    /**
     * Creates a pyramid stack layout
     */
    static pyramid(count: number, layers: number = 3, spacing: number = 2.5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        let imageIndex = 0;
        for (let layer = layers; layer > 0; layer--) {
            const itemsInLayer = layer;
            const layerY = (layers - layer) * spacing - (layers * spacing) / 2;
            const layerWidth = (itemsInLayer - 1) * spacing;
            const offsetX = -layerWidth / 2;
            for (let i = 0; i < itemsInLayer && imageIndex < count; i++) {
                frames.push({
                    position: [offsetX + i * spacing, layerY, 0],
                    rotation: [0, 0, 0],
                });
                imageIndex++;
            }
        }
        return frames;
    }
    /**
     * Creates a helix (DNA-style spiral)
     */
    static helix(count: number, radius: number = 3, rotations: number = 3, heightIncrement: number = 0.4): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const angle = progress * rotations * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = progress * totalImages * heightIncrement - (totalImages * heightIncrement) / 2;
            frames.push({
                position: [x, y, z],
                rotation: [0, -angle - Math.PI / 2, 0], // Tangent to helix
            });
        }
        return frames;
    }
    /**
     * Creates a 3D box layout with images on all 6 faces
     */
    static box(count: number, size: number = 5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const imagesPerFace = Math.ceil(count / 6);
        let imageIndex = 0;
        // Define the 6 faces: Front, Back, Right, Left, Top, Bottom
        const faceConfigs: { name: string; basePos: [number, number, number]; baseRot: [number, number, number] }[] = [
            { name: 'Front', basePos: [0, 0, size], baseRot: [0, 0, 0] },
            { name: 'Back', basePos: [0, 0, -size], baseRot: [0, Math.PI, 0] },
            { name: 'Right', basePos: [size, 0, 0], baseRot: [0, Math.PI / 2, 0] },
            { name: 'Left', basePos: [-size, 0, 0], baseRot: [0, -Math.PI / 2, 0] },
            { name: 'Top', basePos: [0, size, 0], baseRot: [-Math.PI / 2, 0, 0] },
            { name: 'Bottom', basePos: [0, -size, 0], baseRot: [Math.PI / 2, 0, 0] }
        ];
        for (let faceIndex = 0; faceIndex < 6 && imageIndex < count; faceIndex++) {
            const config = faceConfigs[faceIndex];
            const itemsOnFace = Math.min(imagesPerFace, count - imageIndex);
            const cols = Math.ceil(Math.sqrt(itemsOnFace));
            const rows = Math.ceil(itemsOnFace / cols);
            const spacing = (size * 1.8) / Math.max(cols, rows);
            for (let i = 0; i < itemsOnFace; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const offsetX = (col - (cols - 1) / 2) * spacing;
                const offsetY = (row - (rows - 1) / 2) * spacing;
                // Calculate position based on face orientation
                let position: [number, number, number];
                if (faceIndex === 0)
                    position = [offsetX, offsetY, size]; // Front
                else if (faceIndex === 1)
                    position = [-offsetX, offsetY, -size]; // Back (mirror X)
                else if (faceIndex === 2)
                    position = [size, offsetY, -offsetX]; // Right (X fixed, offset in -Z)
                else if (faceIndex === 3)
                    position = [-size, offsetY, offsetX]; // Left (X fixed, offset in +Z)
                else if (faceIndex === 4)
                    position = [offsetX, size, -offsetY]; // Top (Y fixed, offset in -Z)
                else
                    position = [offsetX, -size, offsetY]; // Bottom (Y fixed, offset in +Z)
                frames.push({
                    position,
                    rotation: config.baseRot,
                });
                imageIndex++;
            }
        }
        return frames;
    }
    /**
     * Creates a sphere layout with images distributed evenly on a sphere surface
     * Uses Fibonacci sphere algorithm for even distribution
     */
    static sphere(count: number, radius: number = 5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleIncrement = Math.PI * 2 * goldenRatio;
        for (let i = 0; i < totalImages; i++) {
            // Fibonacci sphere distribution
            const t = i / totalImages;
            const inclination = Math.acos(1 - 2 * t); // 0 to PI (theta - angle from north pole)
            const azimuth = angleIncrement * i; // phi - angle around equator
            // Convert spherical to Cartesian coordinates
            const x = radius * Math.sin(inclination) * Math.cos(azimuth);
            const y = radius * Math.cos(inclination);
            const z = radius * Math.sin(inclination) * Math.sin(azimuth);
            frames.push({
                position: [x, y, z],
                rotation: [0, 0, 0],
            });
        }
        return frames;
    }
    /**
     * Creates a fan/radial layout
     */
    static fan(count: number, radius: number = 5, arcAngle: number = Math.PI * 1.5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / (totalImages - 1 || 1);
            const angle = -arcAngle / 2 + progress * arcAngle;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            frames.push({
                position: [x, 0, z],
                rotation: [0, -angle, 0], // All face center
            });
        }
        return frames;
    }
    /**
     * Creates a wave pattern layout
     */
    static wave(count: number, amplitude: number = 2, frequency: number = 2, spacing: number = 1.5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        const totalWidth = (totalImages - 1) * spacing;
        const offsetX = -totalWidth / 2;
        for (let i = 0; i < totalImages; i++) {
            const x = offsetX + i * spacing;
            const progress = i / totalImages;
            const y = Math.sin(progress * frequency * Math.PI * 2) * amplitude;
            frames.push({
                position: [x, y, 0],
                rotation: [0, 0, 0],
            });
        }
        return frames;
    }
    /**
     * Creates a tunnel/perspective layout
     */
    static tunnel(count: number, depth: number = 20, scaleFactor: number = 0.8): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const z = -progress * depth;
            const scale = Math.pow(scaleFactor, i);
            frames.push({
                position: [0, 0, z],
                rotation: [0, 0, 0],
                scale: [scale, scale, scale],
            });
        }
        return frames;
    }
    /**
     * Creates a tunnel-pyramid layout combining depth perspective with pyramid stacking
     * Starts with 1 frame at front, expands as it recedes. All at y=0
     */
    static tunnelPyramid(count: number, depth: number = 20, layers: number = 6, spacing: number = 2.5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        let imageIndex = 0;
        let currentLayer = 1;
        // Continue adding layers until all images are placed
        while (imageIndex < count) {
            const itemsInLayer = currentLayer;
            const layerProgress = (currentLayer - 1) / (layers - 1 || 1);
            const z = -layerProgress * depth;
            const layerWidth = (itemsInLayer - 1) * spacing;
            const offsetX = -layerWidth / 2;
            for (let i = 0; i < itemsInLayer && imageIndex < count; i++) {
                frames.push({
                    position: [offsetX + i * spacing, 0, z], // Y always 0
                    rotation: [0, 0, 0],
                });
                imageIndex++;
            }
            currentLayer++;
        }
        return frames;
    }
    /**
     * Creates a tunnel-wave layout combining depth perspective with wave pattern
     * Wave pattern in X axis, all at y=0, receding in Z
     */
    static tunnelWave(count: number, depth: number = 20, amplitude: number = 2, frequency: number = 2, spacing: number = 1.5): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const x = Math.sin(progress * frequency * Math.PI * 2) * amplitude;
            const z = -progress * depth;
            frames.push({
                position: [x, 0, z], // Y always 0, wave in X
                rotation: [0, 0, 0],
            });
        }
        return frames;
    }
    /**
     * Creates a random/organic layout
     */
    static random(count: number, bounds: number = 8, seed: number = 1): LayoutSlot[] {
        const frames: LayoutSlot[] = [];
        const totalImages = count;
        const rand = seededRandom(seed);
        for (let i = 0; i < totalImages; i++) {
            const x = (rand() - 0.5) * bounds * 2;
            const y = (rand() - 0.5) * bounds;
            const z = (rand() - 0.5) * bounds * 2;
            const rotY = rand() * Math.PI * 2;
            frames.push({
                position: [x, y, z],
                rotation: [0, rotY, 0],
            });
        }
        return frames;
    }
    /**
     * Slots for `count` copies in the given layout. Reads only the fields the layout uses
     * (see GALLERY_LAYOUT_CONFIGS); anything missing falls back to that layout's default.
     */
    static generate(count: number, settings: LayoutParams & { layout?: GalleryLayout; seed?: number }): LayoutSlot[] {
        const n = Math.max(0, Math.floor(count || 0));
        switch (settings.layout) {
            case 'scattered':
                return this.scattered(n, settings.spacing || 3.5);
            case 'tiles':
                return this.tiles(n, settings.columns || 3, settings.spacing || 2.5);
            case 'horizontal':
                return this.horizontal(n, settings.spacing || 2.5, settings.startX || 0);
            case 'vertical':
                return this.vertical(n, settings.spacing || 2.0, settings.startY || 0);
            case 'circular':
                return this.circular(n, settings.radius || 5);
            case 'spiral':
                return this.spiral(n, settings.radius || 5, settings.rotations || 2, settings.heightIncrement || 0.5);
            case 'arc':
                return this.arc(n, settings.radius || 5, settings.arcAngle || Math.PI);
            case 'pyramid':
                return this.pyramid(n, settings.layers || 3, settings.spacing || 2.5);
            case 'helix':
                return this.helix(n, settings.radius || 3, settings.rotations || 3, settings.heightIncrement || 0.4);
            case 'box':
                return this.box(n, settings.size || 5);
            case 'sphere':
                return this.sphere(n, settings.radius || 5);
            case 'fan':
                return this.fan(n, settings.radius || 5, settings.arcAngle || Math.PI * 1.5);
            case 'wave':
                return this.wave(n, settings.amplitude || 2, settings.frequency || 2, settings.spacing || 1.5);
            case 'tunnel':
                return this.tunnel(n, settings.depth || 20, settings.scaleFactor || 0.8);
            case 'tunnelPyramid':
                return this.tunnelPyramid(n, settings.depth || 20, settings.layers || 3, settings.spacing || 2.5);
            case 'tunnelWave':
                return this.tunnelWave(n, settings.depth || 20, settings.amplitude || 2, settings.frequency || 2, settings.spacing || 1.5);
            case 'random':
                return this.random(n, settings.bounds || 8, settings.seed ?? 1);
            default:
                return this.scattered(n);
        }
    }
}

export const generateLayoutSlots = (count: number, settings: LayoutParams & { layout?: GalleryLayout; seed?: number }): LayoutSlot[] =>
    LayoutCreator.generate(count, settings);

// =============================================================================
// Object layout (meshSettings.layout) — repeat a scene object in a gallery layout
// =============================================================================

/** Object types whose renderer output ObjectNode can repeat across layout slots. */
export const LAYOUT_CAPABLE_TYPES: ReadonlySet<string> = new Set(['mesh', 'model', 'effect', 'light']);

export const DEFAULT_OBJECT_LAYOUT: ObjectLayoutSettings = {
    enabled: false,
    layout: 'circular',
    count: 6,
    seed: 1,
    columns: 3,
    spacing: 3.5,
    startX: 0,
    startY: 0,
    radius: 5,
    size: 5,
    rotations: 2,
    heightIncrement: 0.5,
    arcAngle: Math.PI,
    amplitude: 2,
    frequency: 2,
    layers: 3,
    depth: 20,
    scaleFactor: 0.8,
    bounds: 8,
};

/**
 * Saved objects predate this field. Absent means no layout at all — never the default —
 * and a partial block is merged over the defaults so an added knob fills in.
 */
export const normalizeObjectLayout = (layout: Partial<ObjectLayoutSettings> | null | undefined): ObjectLayoutSettings | null => {
    if (!layout || typeof layout !== 'object')
        return null;
    return { ...DEFAULT_OBJECT_LAYOUT, ...layout };
};

/**
 * Per-type ceilings on layout copies. Every copy is a full render of the object, so these
 * track what each copy costs:
 * - light: each one adds per-fragment cost to every lit material, and changing the light
 *   count recompiles every material (three.js keys programs on light counts).
 * - effect: each copy is a whole particle / shader effect.
 * - mesh in a points mode: each copy resamples its points (volumeFill raycasts in render).
 * - model: geometry is shared with the cache master, but every part of every copy is its
 *   own draw call with its own material clone.
 */
export const LAYOUT_COUNT_LIMITS = {
    mesh: 100,
    meshPoints: 12,
    model: 30,
    effect: 24,
    light: 8,
} as const;

/** Light kinds a layout makes sense for: N directional copies are one brighter light, and
 *  an ambient light has no position. */
export const LAYOUT_LIGHT_KINDS: ReadonlySet<string> = new Set(['point', 'spot']);

export interface ObjectLayoutSupport {
    allowed: boolean;
    /** Why not, in words the panel can show. */
    reason?: string;
    maxCount: number;
}

/** Whether this object can be repeated, and how many times. One answer for the viewer and the panel. */
export const getObjectLayoutSupport = (obj: Pick<CreatedObjectSettings, 'type' | 'config' | 'modeConfig'>): ObjectLayoutSupport => {
    switch (obj.type) {
        case 'mesh':
            return modeGroupOf(obj.modeConfig?.mode) === 'points'
                ? { allowed: true, maxCount: LAYOUT_COUNT_LIMITS.meshPoints }
                : { allowed: true, maxCount: LAYOUT_COUNT_LIMITS.mesh };
        case 'model':
            return { allowed: true, maxCount: LAYOUT_COUNT_LIMITS.model };
        case 'effect':
            return { allowed: true, maxCount: LAYOUT_COUNT_LIMITS.effect };
        case 'light': {
            const kind = (obj.config as { type?: string } | undefined)?.type;
            return kind && LAYOUT_LIGHT_KINDS.has(kind)
                ? { allowed: true, maxCount: LAYOUT_COUNT_LIMITS.light }
                : { allowed: false, maxCount: 0, reason: 'Layouts work with point and spot lights only.' };
        }
        default:
            return { allowed: false, maxCount: 0, reason: 'This object type cannot be repeated in a layout.' };
    }
};

/** mulberry32 — deterministic, so a random layout keeps its shape across re-renders. */
function seededRandom(seed: number): () => number {
    let a = (Math.floor(seed) || 1) >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
