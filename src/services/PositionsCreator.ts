import { Vector3 } from 'three';
import type { CatmullRomCurve3 } from 'three';
import { generateBoxPositions, generateLinePositions, generateSquarePositions, generateCirclePositions, generateSpherePositions, generateTrianglePositions, generateCylinderPositions, centerPathsToUnit } from '../utils/positionsCreatorUtils';
import { createCurves } from '../utils/pathUtils';
import { brainsPaths, circlesPaths, createArrowPaths, createBoxPaths, createButterflyPaths, createCirclePaths, createCloverPaths, createCrescentPaths, createCrossPaths, createDiamondPaths, createFigureEightPaths, createHeartPaths, createHelixPath, createHexagonPaths, createInfinityPaths, createLinesPaths, createLissajousPaths, createPentagonPaths, createRosePaths, createSpherePaths, createSpringPaths, createSpiralPaths, createSquarePaths, createStarPaths, createTrefoilKnotPaths, createTrianglePaths, createWavePaths, createZigzagPaths, dnaPaths, helix3dPaths } from '../data/paths';
import type { PositionShape, ShapeParams } from "../types/particles";

export class PositionsCreator {
    static generateStarsPosition(count: number): Float32Array {
        const positions = [];
        let v = new Vector3();
        for (let i = 0; i < count * count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 10 + (Math.random() * 0.6 - 0.3);
            v.setFromSphericalCoords(radius, phi, theta);
            positions.push(v.x, v.y, v.z);
        }
        return new Float32Array(positions);
    }
    static generateGridOfParticles(shapeParams: ShapeParams): Float32Array {
        const { name, length, meshSize = [3, 3] } = shapeParams;
        const data = new Float32Array(length);
        const totalParticles = length / 4;
        let columns, lines;
        if (name === 'landscape') {
            columns = Math.round(Math.sqrt(totalParticles * (16 / 9)));
            lines = Math.round(totalParticles / columns);
            if (Math.abs(meshSize[0] / meshSize[1] - 16 / 9) > 0.01) {
                meshSize[0] = meshSize[1] * (16 / 9);
            }
        }
        else if (name === 'portrait') {
            lines = Math.round(Math.sqrt(totalParticles * (9 / 16)));
            columns = Math.round(totalParticles / lines);
            if (Math.abs(meshSize[1] / meshSize[0] - 16 / 9) > 0.01) {
                meshSize[1] = meshSize[0] * (16 / 9);
            }
        }
        else {
            columns = Math.round(Math.sqrt(totalParticles));
            lines = Math.round(totalParticles / columns);
        }
        const gridWidth = meshSize[0];
        const gridHeight = meshSize[1];
        const spacingX = gridWidth / (columns - 1);
        const spacingY = gridHeight / (lines - 1);
        for (let i = 0; i < length; i += 4) {
            const index = i / 4;
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = -gridWidth / 2 + col * spacingX;
            const y = -gridHeight / 2 + row * spacingY;
            data[i] = x;
            data[i + 1] = y;
            data[i + 2] = 0;
            data[i + 3] = 1.0;
        }
        return data;
    }
    static generateParticlesGrid(nbLines: number, nbColumns: number): Float32Array {
        const vertices = [];
        for (let i = 0; i < nbColumns; i++) {
            for (let j = 0; j < nbLines; j++) {
                vertices.push(i, j, 0);
            }
        }
        return new Float32Array(vertices);
    }
    static async generatePositionsFromImage(src: string, nbLines: number = 9, nbColumns: number = 16): Promise<{
                positions: Float32Array;
                isLandscape: boolean;
            }> {
        const img = await new Promise((resolve, reject) => {
            const image = new window.Image();
            image.crossOrigin = 'Anonymous';
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
        const isLandscape = (img as any).width > (img as any).height;
        if (isLandscape)
            return { positions: PositionsCreator.generateParticlesGrid(nbLines, nbColumns), isLandscape };
        return { positions: PositionsCreator.generateParticlesGrid(nbColumns, nbLines), isLandscape };
    }
    static convertPathsToPositions(paths: number[][], totalParticles: number, outlines: boolean = true): Float32Array {
        const data = new Float32Array(totalParticles * 3);
        if (paths.length === 0)
            return data;
        const allPoints = [];
        for (const path of paths) {
            for (let i = 0; i < path.length; i += 3) {
                allPoints.push(path[i], path[i + 1], path[i + 2]);
            }
        }
        const totalPathPoints = allPoints.length / 3;
        if (outlines) {
            for (let i = 0; i < totalParticles * 3; i += 3) {
                const particleIndex = i / 3;
                const pointIndex = Math.floor((particleIndex / totalParticles) * totalPathPoints) * 3;
                data[i] = allPoints[pointIndex] || 0;
                data[i + 1] = allPoints[pointIndex + 1] || 0;
                data[i + 2] = allPoints[pointIndex + 2] || 0;
            }
        }
        else {
            let centroidX = 0, centroidY = 0, centroidZ = 0;
            for (let i = 0; i < allPoints.length; i += 3) {
                centroidX += allPoints[i];
                centroidY += allPoints[i + 1];
                centroidZ += allPoints[i + 2];
            }
            centroidX /= totalPathPoints;
            centroidY /= totalPathPoints;
            centroidZ /= totalPathPoints;
            for (let i = 0; i < totalParticles * 3; i += 3) {
                const particleIndex = i / 3;
                const outlinePointIndex = Math.floor((particleIndex / totalParticles) * totalPathPoints) * 3;
                const outlineX = allPoints[outlinePointIndex] || 0;
                const outlineY = allPoints[outlinePointIndex + 1] || 0;
                const outlineZ = allPoints[outlinePointIndex + 2] || 0;
                const t = Math.sqrt(Math.random());
                data[i] = centroidX + (outlineX - centroidX) * t;
                data[i + 1] = centroidY + (outlineY - centroidY) * t;
                data[i + 2] = centroidZ + (outlineZ - centroidZ) * t;
            }
        }
        return data;
    }
    static simpleMeshPositions: PositionShape[] = [
        'line', 'box', 'sphere', 'circle', 'square', 'triangle', 'cylinder',
        'star', 'heart', 'spiral', 'wave', 'infinity', 'hexagon', 'pentagon',
        'figureEight', 'clover', 'butterfly', 'zigzag', 'spring', 'lissajous',
        'rose', 'trefoilKnot', 'helix', 'cross', 'diamond', 'crescent', 'arrow',
        'brain', 'dna', 'helix3d', 'circles',
    ];
    static availablePaths: string[] = [
        'default', 'line', 'brain', 'dna', 'helix3d', 'circles', 'box', 'sphere',
        'square', 'circle', 'star', 'triangle', 'cylinder', 'heart', 'spiral',
        'wave', 'infinity', 'hexagon', 'pentagon', 'figureEight', 'clover',
        'butterfly', 'zigzag', 'spring', 'lissajous', 'rose', 'trefoilKnot',
        'helix', 'cross', 'diamond', 'crescent', 'arrow',
    ];
    static generatePaths: (shapeName: PositionShape, count?: number) => CatmullRomCurve3[] = (shapeName, count = 1) => {
        switch (shapeName) {
            case 'brain': return createCurves(centerPathsToUnit(brainsPaths));
            case 'dna': return createCurves(centerPathsToUnit(dnaPaths));
            case 'helix3d': return createCurves(centerPathsToUnit(helix3dPaths));
            case 'circles': return createCurves(centerPathsToUnit(circlesPaths));
            case 'box': return createCurves(createBoxPaths(1, 1, 1, 10));
            case 'sphere': return createCurves(createSpherePaths(1, 10));
            case 'square': return createCurves(createSquarePaths(1, count));
            case 'circle': return createCurves(createCirclePaths(1, count));
            case 'star': return createCurves(createStarPaths(1, 0.5, 5, count));
            case 'triangle': return createCurves(createTrianglePaths(1, count));
            case 'heart': return createCurves(createHeartPaths(1, count));
            case 'spiral': return createCurves(createSpiralPaths(0.5, 0.3, 3, 5));
            case 'wave': return createCurves(createWavePaths(1, 1, 0.1, 2, count));
            case 'infinity': return createCurves(createInfinityPaths(1, count));
            case 'line': return createCurves(createLinesPaths(1, 1, 0.1, count));
            case 'cylinder': return createCurves(createBoxPaths(1, 1, 1, 10));
            case 'hexagon': return createCurves(createHexagonPaths(1, count));
            case 'pentagon': return createCurves(createPentagonPaths(1, count));
            case 'figureEight': return createCurves(createFigureEightPaths(0.5, count));
            case 'clover': return createCurves(createCloverPaths(1, count));
            case 'butterfly': return createCurves(createButterflyPaths(1, count));
            case 'zigzag': return createCurves(createZigzagPaths(1, 0.1, count, 5));
            case 'spring': return createCurves(createSpringPaths(0.5, 0.4, 5, 5));
            case 'lissajous': return createCurves(createLissajousPaths(1, 3, 4, Math.PI / 2, 5));
            case 'rose': return createCurves(createRosePaths(1, 5, 1));
            case 'trefoilKnot': return createCurves(createTrefoilKnotPaths(1, 5));
            case 'helix': return createCurves(createHelixPath(0.5, 0.3, 3, 5));
            case 'cross': return createCurves(createCrossPaths(1, 0.06, count));
            case 'diamond': return createCurves(createDiamondPaths(1, count));
            case 'crescent': return createCurves(createCrescentPaths(1, 0.5, count));
            case 'arrow': return createCurves(createArrowPaths(1, 0.15, count));
            default: return createCurves(createLinesPaths(1, 1, 0.1, count));
        }
    };
    static generatePositions: (shapeParams: ShapeParams) => Float32Array = (shapeParams) => {
        const { name, length } = shapeParams;
        const totalParticles = length;
        switch (name) {
            case 'line':
                return generateLinePositions(shapeParams.startPosition || [-0.5, 0, 0], shapeParams.endPosition || [0.5, 0, 0], shapeParams.length);
            case 'box':
                return generateBoxPositions(shapeParams.meshSize || [1, 1, 1], length, shapeParams.outlines || false);
            case 'sphere':
                return generateSpherePositions(shapeParams.radius || 0.5, length, shapeParams.outlines || false);
            case 'circle':
                return generateCirclePositions(shapeParams.radius || 0.5, length, shapeParams.outlines || false);
            case 'square':
                return generateSquarePositions(shapeParams.width || 1, shapeParams.height || 1, length, shapeParams.outlines || false);
            case 'triangle':
                return generateTrianglePositions(shapeParams.size || 1, length, shapeParams.outlines || false);
            case 'cylinder':
                return generateCylinderPositions(shapeParams.radius || 0.5, shapeParams.height || 1, length, shapeParams.outlines || false);
            case 'grid':
            case 'landscape':
            case 'portrait':
                return this.generateGridOfParticles(shapeParams);
            case 'brain':
                return this.convertPathsToPositions(centerPathsToUnit(brainsPaths), totalParticles, shapeParams.outlines || false);
            case 'star':
                return this.convertPathsToPositions(createStarPaths(0.5, 0.05, 5, 1), totalParticles, shapeParams.outlines || false);
            case 'heart':
                return this.convertPathsToPositions(createHeartPaths(0.5, 1), totalParticles, shapeParams.outlines || false);
            case 'spiral':
                return this.convertPathsToPositions(createSpiralPaths(0.5, 1, 3, 5), totalParticles, shapeParams.outlines || false);
            case 'infinity':
                return this.convertPathsToPositions(createInfinityPaths(0.25, 10), totalParticles, shapeParams.outlines || false);
            case 'hexagon':
                return this.convertPathsToPositions(createHexagonPaths(1, 10), totalParticles, shapeParams.outlines || false);
            case 'pentagon':
                return this.convertPathsToPositions(createPentagonPaths(1.05, 10), totalParticles, shapeParams.outlines || false);
            case 'figureEight':
                return this.convertPathsToPositions(createFigureEightPaths(0.5, 10), totalParticles, shapeParams.outlines || false);
            case 'clover':
                return this.convertPathsToPositions(createCloverPaths(0.5, 10), totalParticles, shapeParams.outlines || false);
            case 'butterfly':
                // NOTE: butterfly's `size` only scales one term of its curve, so it
                // cannot be scaled linearly; 16 is the empirical value for extent ≈ 1.
                return this.convertPathsToPositions(createButterflyPaths(16, 5), totalParticles, shapeParams.outlines || false);
            case 'zigzag':
                return this.convertPathsToPositions(createZigzagPaths(1, 0.08, 10, 5), totalParticles, shapeParams.outlines || false);
            case 'spring':
                return this.convertPathsToPositions(createSpringPaths(0.2, 1, 5, 5), totalParticles, shapeParams.outlines || false);
            case 'lissajous':
                return this.convertPathsToPositions(createLissajousPaths(0.5, 3, 4, Math.PI / 2, 5), totalParticles, shapeParams.outlines || false);
            case 'rose':
                return this.convertPathsToPositions(createRosePaths(0.525, 5, 10), totalParticles, shapeParams.outlines || false);
            case 'trefoilKnot':
                return this.convertPathsToPositions(createTrefoilKnotPaths(1, 5), totalParticles, shapeParams.outlines || false);
            case 'helix':
                return this.convertPathsToPositions(createHelixPath(0.267, 1, 3, 5), totalParticles, shapeParams.outlines || false);
            case 'cross':
                return this.convertPathsToPositions(createCrossPaths(1, 0.06, 1), totalParticles, shapeParams.outlines || false);
            case 'diamond':
                return this.convertPathsToPositions(createDiamondPaths(1, 10), totalParticles, shapeParams.outlines || false);
            case 'crescent':
                return this.convertPathsToPositions(createCrescentPaths(0.435, 0.5, 10), totalParticles, shapeParams.outlines || false);
            case 'arrow':
                return this.convertPathsToPositions(createArrowPaths(1, 0.5, 10), totalParticles, shapeParams.outlines || false);
            case 'wave':
                return this.convertPathsToPositions(createWavePaths(1, 0.3, 0.05, 2, 10), totalParticles, shapeParams.outlines || false);
            case 'circles':
                return this.convertPathsToPositions(centerPathsToUnit(circlesPaths), totalParticles, shapeParams.outlines || false);
            case 'dna':
                return this.convertPathsToPositions(centerPathsToUnit(dnaPaths), totalParticles, shapeParams.outlines || false);
            case 'helix3d':
                return this.convertPathsToPositions(centerPathsToUnit(helix3dPaths), totalParticles, shapeParams.outlines || false);
            default:
                return generateLinePositions(shapeParams.startPosition || [-0.5, 0, 0], shapeParams.endPosition || [0.5, 0, 0], shapeParams.length);
        }
    };
    static getPossibleShapes(): {
                label: string;
                value: string;
            }[] {
        return this.simpleMeshPositions.map((shape) => ({
            label: shape.charAt(0).toUpperCase() + shape.slice(1),
            value: shape,
        }));
    }
    static getPossiblePaths(): {
                label: string;
                value: string;
            }[] {
        return this.availablePaths.map((path) => ({
            label: path.charAt(0).toUpperCase() + path.slice(1),
            value: path,
        }));
    }
}
export default PositionsCreator;
