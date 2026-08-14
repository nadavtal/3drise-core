import type { ColorRepresentation } from "three";
import type { CreatedObjectSettings, Vector3Array } from "./scene3d";
export type SprarklesSettings = {
    visible: boolean;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale: [number, number, number];
    count: number;
    size: number;
    color: ColorRepresentation | Float32Array;
    speed: number;
    opacity: number;
    noise: number;
};

export type ParticledConfig = {
    count: number;
    shapeType: PositionShape;
    particles: boolean;
    paths: boolean;
    outlines?: boolean;
    texture?: string | null;
};

export type ParticlesSettings = CreatedObjectSettings & {
    config: ParticledConfig;
};

export type ShapeParams = {
    name: PositionShape;
    width?: number;
    height?: number;
    length: number;
    meshSize?: Vector3Array;
    startPosition?: [number, number, number];
    endPosition?: [number, number, number];
    radius?: number;
    outlines?: boolean;
    positions?: Float32Array;
    size?: number;
};

export type PositionShape = 'line' | 'box' | 'sphere' | 'dna' | 'helix3d' | 'circles' | 'grid' | 'circle' | 'square' | 'triangle' | 'helix' | 'torus' | 'cylinder' | 'cone' | 'wave' | 'dnaHelix' | 'heart' | 'star' | 'stars' | 'flower' | 'knot' | 'galaxy' | 'crystal' | 'tree' | 'text' | 'dragonCurve' | 'lotus' | 'infinity' | 'spiral' | 'hexagon' | 'pentagon' | 'figureEight' | 'clover' | 'butterfly' | 'zigzag' | 'spring' | 'lissajous' | 'rose' | 'trefoilKnot' | 'cross' | 'diamond' | 'crescent' | 'brain' | 'arrow' | 'mesh' | 'image' | 'landscape' | 'portrait' | 'random' | 'custom' | 'none';

export interface ShapeConfig {
    line: {
        startPosition: Vector3Array;
        endPosition: Vector3Array;
    };
    box: {
        meshSize: Vector3Array;
    };
    sphere: {
        radius: number;
    };
    grid: {
        spacing: number;
    };
    circle: {
        radius: number;
    };
    triangle: {
        size: number;
    };
    square: {
        width: number;
        height: number;
    };
    helix: {
        radius: number;
        turns: number;
        height: number;
    };
    torus: {
        majorRadius: number;
        minorRadius: number;
    };
    cylinder: {
        radius: number;
        height: number;
    };
    cone: {
        baseRadius: number;
        height: number;
    };
    wave: {
        amplitude: number;
        frequency: number;
        spread: number;
    };
    dnaHelix: {
        radius: number;
        turns: number;
        height: number;
    };
    heart: {
        scale: number;
    };
    star: {
        points: number;
        outerRadius: number;
        innerRadius: number;
    };
    flower: {
        petals: number;
        petalSize: number;
    };
    knot: {
        scale: number;
    };
    galaxy: {
        arms: number;
        armSpread: number;
        coreRadius: number;
    };
    crystal: {
        layers: number;
        crystalSize: number;
    };
    tree: {
        branches: number;
        treeHeight: number;
        spread: number;
    };
    text: {
        text: string;
        letterSize: number;
        spacing: number;
    };
    dragonCurve: {
        iterations: number;
        scale: number;
    };
    lotus: {
        petals: number;
        layers: number;
        maxRadius: number;
    };
    infinity: {
        scale: number;
        thickness: number;
    };
    stars: {
        count: number;
    };
    mesh: {
        meshId: number | null;
        scale: number;
        centerGeometry: boolean;
        sampleMethod: 'vertices' | 'surface' | 'volume';
        densityMultiplier: number;
    };
    tube: {
        radius: number;
        height: number;
        radialSegments: number;
        heightSegments: number;
    };
}


export {};
