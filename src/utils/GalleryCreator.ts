import type { FrameData, GalleryLayoutSettings } from "../types/gallery";

export class GalleryCreator {
    /**
     * Creates a scattered gallery layout with concentric circles
     * Center image + rings of images around it, with side images rotated inward
     */
    static scattered(imageUrls: string[], spacing: number = 3.5, count?: number): FrameData[] {
        const numImages = count || imageUrls.length;
        const frames = [];
        const actualCount = Math.min(numImages, imageUrls.length);
        if (actualCount === 0)
            return frames;
        // First image at center
        frames.push({
            url: imageUrls[0],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            videoSrc: null,
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
                    url: imageUrls[imageIndex],
                    position: [x, 0, z],
                    rotation: [0, 0, 0], // All images face forward for now
                    videoSrc: null,
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
    static tiles(imageUrls: string[], columns: number = 3, spacing: number = 2.5): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
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
                url: imageUrls[i],
                position: [
                    offsetX + col * spacing,
                    offsetY + row * spacing,
                    0, // Centered at origin
                ],
                rotation: [0, 0, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a horizontal row layout
     */
    static horizontal(imageUrls: string[], spacing: number = 2.5, startX: number = 0): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        // Calculate centering offset to position gallery center at [0, 0, 0]
        const totalWidth = (totalImages - 1) * spacing;
        const offsetX = startX - totalWidth / 2;
        for (let i = 0; i < totalImages; i++) {
            frames.push({
                url: imageUrls[i],
                position: [offsetX + i * spacing, 0, 0],
                rotation: [0, 0, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a vertical column layout
     */
    static vertical(imageUrls: string[], spacing: number = 2.0, startY: number = 0): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        // Calculate centering offset to position gallery center at [0, 0, 0]
        const totalHeight = (totalImages - 1) * spacing;
        const offsetY = startY - totalHeight / 2;
        for (let i = 0; i < totalImages; i++) {
            frames.push({
                url: imageUrls[i],
                position: [0, offsetY + i * spacing, 0],
                rotation: [0, 0, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a circular layout with images arranged in a ring
     */
    static circular(imageUrls: string[], radius: number = 5): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const angle = (i / totalImages) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            frames.push({
                url: imageUrls[i],
                position: [x, 0, z],
                rotation: [0, -angle, 0], // Face inward
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a spiral layout ascending or expanding outward
     */
    static spiral(imageUrls: string[], radius: number = 5, rotations: number = 2, heightIncrement: number = 0.5): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const angle = progress * rotations * Math.PI * 2;
            const currentRadius = radius * (1 - progress * 0.3); // Spiral inward slightly
            const x = Math.cos(angle) * currentRadius;
            const z = Math.sin(angle) * currentRadius;
            const y = progress * totalImages * heightIncrement - (totalImages * heightIncrement) / 2;
            frames.push({
                url: imageUrls[i],
                position: [x, y, z],
                rotation: [0, -angle, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates an arc/curved layout
     */
    static arc(imageUrls: string[], radius: number = 5, arcAngle: number = Math.PI): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / (totalImages - 1 || 1);
            const angle = -arcAngle / 2 + progress * arcAngle;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            frames.push({
                url: imageUrls[i],
                position: [x, 0, z],
                rotation: [0, -angle, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a pyramid stack layout
     */
    static pyramid(imageUrls: string[], layers: number = 3, spacing: number = 2.5): FrameData[] {
        const frames = [];
        let imageIndex = 0;
        for (let layer = layers; layer > 0; layer--) {
            const itemsInLayer = layer;
            const layerY = (layers - layer) * spacing - (layers * spacing) / 2;
            const layerWidth = (itemsInLayer - 1) * spacing;
            const offsetX = -layerWidth / 2;
            for (let i = 0; i < itemsInLayer && imageIndex < imageUrls.length; i++) {
                frames.push({
                    url: imageUrls[imageIndex],
                    position: [offsetX + i * spacing, layerY, 0],
                    rotation: [0, 0, 0],
                    videoSrc: null,
                });
                imageIndex++;
            }
        }
        return frames;
    }
    /**
     * Creates a helix (DNA-style spiral)
     */
    static helix(imageUrls: string[], radius: number = 3, rotations: number = 3, heightIncrement: number = 0.4): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const angle = progress * rotations * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = progress * totalImages * heightIncrement - (totalImages * heightIncrement) / 2;
            frames.push({
                url: imageUrls[i],
                position: [x, y, z],
                rotation: [0, -angle - Math.PI / 2, 0], // Tangent to helix
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a 3D box layout with images on all 6 faces
     */
    static box(imageUrls: string[], size: number = 5): FrameData[] {
        const frames = [];
        const imagesPerFace = Math.ceil(imageUrls.length / 6);
        let imageIndex = 0;
        // Define the 6 faces: Front, Back, Right, Left, Top, Bottom
        const faceConfigs = [
            { name: 'Front', basePos: [0, 0, size], baseRot: [0, 0, 0] },
            { name: 'Back', basePos: [0, 0, -size], baseRot: [0, Math.PI, 0] },
            { name: 'Right', basePos: [size, 0, 0], baseRot: [0, Math.PI / 2, 0] },
            { name: 'Left', basePos: [-size, 0, 0], baseRot: [0, -Math.PI / 2, 0] },
            { name: 'Top', basePos: [0, size, 0], baseRot: [-Math.PI / 2, 0, 0] },
            { name: 'Bottom', basePos: [0, -size, 0], baseRot: [Math.PI / 2, 0, 0] }
        ];
        for (let faceIndex = 0; faceIndex < 6 && imageIndex < imageUrls.length; faceIndex++) {
            const config = faceConfigs[faceIndex];
            const itemsOnFace = Math.min(imagesPerFace, imageUrls.length - imageIndex);
            const cols = Math.ceil(Math.sqrt(itemsOnFace));
            const rows = Math.ceil(itemsOnFace / cols);
            const spacing = (size * 1.8) / Math.max(cols, rows);
            for (let i = 0; i < itemsOnFace; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;
                const offsetX = (col - (cols - 1) / 2) * spacing;
                const offsetY = (row - (rows - 1) / 2) * spacing;
                // Calculate position based on face orientation
                let position;
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
                    url: imageUrls[imageIndex],
                    position,
                    rotation: config.baseRot,
                    videoSrc: null,
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
    static sphere(imageUrls: string[], radius: number = 5): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
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
                url: imageUrls[i],
                position: [x, y, z],
                rotation: [0, 0, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a fan/radial layout
     */
    static fan(imageUrls: string[], radius: number = 5, arcAngle: number = Math.PI * 1.5): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / (totalImages - 1 || 1);
            const angle = -arcAngle / 2 + progress * arcAngle;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            frames.push({
                url: imageUrls[i],
                position: [x, 0, z],
                rotation: [0, -angle, 0], // All face center
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a wave pattern layout
     */
    static wave(imageUrls: string[], amplitude: number = 2, frequency: number = 2, spacing: number = 1.5): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        const totalWidth = (totalImages - 1) * spacing;
        const offsetX = -totalWidth / 2;
        for (let i = 0; i < totalImages; i++) {
            const x = offsetX + i * spacing;
            const progress = i / totalImages;
            const y = Math.sin(progress * frequency * Math.PI * 2) * amplitude;
            frames.push({
                url: imageUrls[i],
                position: [x, y, 0],
                rotation: [0, 0, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a tunnel/perspective layout
     */
    static tunnel(imageUrls: string[], depth: number = 20, scaleFactor: number = 0.8): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const z = -progress * depth;
            const scale = Math.pow(scaleFactor, i);
            frames.push({
                url: imageUrls[i],
                position: [0, 0, z],
                rotation: [0, 0, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a tunnel-pyramid layout combining depth perspective with pyramid stacking
     * Starts with 1 frame at front, expands as it recedes. All at y=0
     */
    static tunnelPyramid(imageUrls: string[], depth: number = 20, layers: number = 6, spacing: number = 2.5): FrameData[] {
        const frames = [];
        let imageIndex = 0;
        let currentLayer = 1;
        // Continue adding layers until all images are placed
        while (imageIndex < imageUrls.length) {
            const itemsInLayer = currentLayer;
            const layerProgress = (currentLayer - 1) / (layers - 1 || 1);
            const z = -layerProgress * depth;
            const layerWidth = (itemsInLayer - 1) * spacing;
            const offsetX = -layerWidth / 2;
            for (let i = 0; i < itemsInLayer && imageIndex < imageUrls.length; i++) {
                frames.push({
                    url: imageUrls[imageIndex],
                    position: [offsetX + i * spacing, 0, z], // Y always 0
                    rotation: [0, 0, 0],
                    videoSrc: null,
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
    static tunnelWave(imageUrls: string[], depth: number = 20, amplitude: number = 2, frequency: number = 2, spacing: number = 1.5): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const progress = i / totalImages;
            const x = Math.sin(progress * frequency * Math.PI * 2) * amplitude;
            const z = -progress * depth;
            frames.push({
                url: imageUrls[i],
                position: [x, 0, z], // Y always 0, wave in X
                rotation: [0, 0, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Creates a random/organic layout
     */
    static random(imageUrls: string[], bounds: number = 8): FrameData[] {
        const frames = [];
        const totalImages = imageUrls.length;
        for (let i = 0; i < totalImages; i++) {
            const x = (Math.random() - 0.5) * bounds * 2;
            const y = (Math.random() - 0.5) * bounds;
            const z = (Math.random() - 0.5) * bounds * 2;
            const rotY = Math.random() * Math.PI * 2;
            frames.push({
                url: imageUrls[i],
                position: [x, y, z],
                rotation: [0, rotY, 0],
                videoSrc: null,
            });
        }
        return frames;
    }
    /**
     * Main method to generate gallery layout based on settings
     */
    static generateGallery(imageUrls: string[], settings: GalleryLayoutSettings): FrameData[] {
        console.log('GalleryCreator.generate called with settings:', settings);
        switch (settings.layout) {
            case 'scattered':
                return this.scattered(imageUrls, settings.spacing || 3.5);
            case 'tiles':
                return this.tiles(imageUrls, settings.columns || 3, settings.spacing || 2.5);
            case 'horizontal':
                return this.horizontal(imageUrls, settings.spacing || 2.5, settings.startX || 0);
            case 'vertical':
                return this.vertical(imageUrls, settings.spacing || 2.0, settings.startY || 0);
            case 'circular':
                return this.circular(imageUrls, settings.radius || 5);
            case 'spiral':
                return this.spiral(imageUrls, settings.radius || 5, settings.rotations || 2, settings.heightIncrement || 0.5);
            case 'arc':
                return this.arc(imageUrls, settings.radius || 5, settings.arcAngle || Math.PI);
            case 'pyramid':
                return this.pyramid(imageUrls, settings.layers || 3, settings.spacing || 2.5);
            case 'helix':
                return this.helix(imageUrls, settings.radius || 3, settings.rotations || 3, settings.heightIncrement || 0.4);
            case 'box':
                return this.box(imageUrls, settings.size || 5);
            case 'sphere':
                return this.sphere(imageUrls, settings.radius || 5);
            case 'fan':
                return this.fan(imageUrls, settings.radius || 5, settings.arcAngle || Math.PI * 1.5);
            case 'wave':
                return this.wave(imageUrls, settings.amplitude || 2, settings.frequency || 2, settings.spacing || 1.5);
            case 'tunnel':
                return this.tunnel(imageUrls, settings.depth || 20, settings.scaleFactor || 0.8);
            case 'tunnelPyramid':
                return this.tunnelPyramid(imageUrls, settings.depth || 20, settings.layers || 3, settings.spacing || 2.5);
            case 'tunnelWave':
                return this.tunnelWave(imageUrls, settings.depth || 20, settings.amplitude || 2, settings.frequency || 2, settings.spacing || 1.5);
            case 'random':
                return this.random(imageUrls, settings.bounds || 8);
            default:
                return this.scattered(imageUrls);
        }
    }
}
