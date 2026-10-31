import type { CreatedObjectSettings, GeometryType } from "./scene3d";
import type { ParticlesSettings } from "./particles";
export interface FrameData {
    url: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    videoSrc?: string | null;
    shapeType?: string;
    /** Per-slot scale some layouts emit (tunnel). Absent means [1, 1, 1]. */
    scale?: [number, number, number];
}

/** One placement produced by the layout math. */
export interface LayoutSlot {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
}

export type GalleryLayout = 'scattered' | 'tiles' | 'horizontal' | 'vertical' | 'circular' | 'spiral' | 'arc' | 'pyramid' | 'helix' | 'box' | 'sphere' | 'fan' | 'wave' | 'tunnel' | 'tunnelPyramid' | 'tunnelWave' | 'random';

export interface GalleryLayoutSettings {
    geometryType: GeometryType;
    layout: GalleryLayout;
    width?: number;
    height?: number;
    columns?: number;
    spacing?: number;
    startX?: number;
    startY?: number;
    radius?: number;
    size?: number;
    rotations?: number;
    heightIncrement?: number;
    arcAngle?: number;
    amplitude?: number;
    frequency?: number;
    layers?: number;
    depth?: number;
    scaleFactor?: number;
    bounds?: number;
    outerFrameScale?: number;
    numImages?: number;
    imageUrls?: string[];
    side?: number;
    /** Seed for the 'random' layout, so it keeps its shape across re-renders. */
    seed?: number;
}

/** The layout-math fields — what GalleryCreator/LayoutCreator read, minus frame styling. */
export type LayoutParams = Pick<GalleryLayoutSettings,
    'columns' | 'spacing' | 'startX' | 'startY' | 'radius' | 'size' | 'rotations' |
    'heightIncrement' | 'arcAngle' | 'amplitude' | 'frequency' | 'layers' | 'depth' |
    'scaleFactor' | 'bounds' | 'seed'>;

/** Object layouts: the gallery shapes plus the scatter kinds only objects use. */
export type ObjectLayoutKind = GalleryLayout | 'area' | 'path';

/** `variantMix`: copies pick a variant of the object (config[field]) by weight. */
export interface LayoutVariantMix {
    /** Config field that holds the variant. Default 'type'. */
    field?: string;
    /** Variant keys the copies choose from. */
    values: string[];
    /** Relative weights, one per value. Missing = equal. */
    weights?: number[];
}

/**
 * `meshSettings.layout` — repeat a mesh / model / effect / light across a layout.
 * Lives in meshSettings (a JSON column) so it persists with no data-center change.
 * Mesh and model copies are instanced (InstancedLayout); effects and lights are full copies.
 */
export interface ObjectLayoutSettings extends LayoutParams {
    enabled: boolean;
    layout: ObjectLayoutKind;
    count: number;
    // ---- per-copy variation, deterministic from `seed` (each its own random stream)
    /** 0–1: copy size spreads over ×[1 − j/2, 1 + j/2]. */
    scaleJitter?: number;
    /** 0–1: copy turn around Y spreads over ±j·π. */
    rotationJitter?: number;
    /** 0–1: hue / lightness spread around the material colour (instanced copies). */
    tintJitter?: number;
    variantMix?: LayoutVariantMix | null;
    // ---- surface placement
    /** Drop each copy onto the terrain / land height at its XZ. */
    onGround?: boolean;
    /** With onGround: tilt each copy to the ground's slope. */
    alignToSlope?: boolean;
    // ---- area / path
    /** area: 'rectangle' (width × depth) or 'polygon' (points). */
    areaShape?: 'rectangle' | 'polygon';
    /** area rectangle: size along X (depth is the size along Z). */
    width?: number;
    /** area polygon / path polyline: [x, z] points in the object's local space. */
    points?: Array<[number, number]>;
    /** path: copies turn to face along the path. Default true. */
    facePath?: boolean;
}

export interface GalleryLayoutConfig {
    name: string;
    value: GalleryLayout;
    label: string;
    settingsFields: Array<keyof Omit<GalleryLayoutSettings, 'layout'>>;
}

export type GalleryGeneralSettings = {
    name: string;
    description: string;
    imageUrls: string[];
    visible: boolean;
    side: number;
    autoAnimationSpeed: number;
};

export type GallerySettings = CreatedObjectSettings & {
    config: GalleryLayoutSettings;
};

export interface GalleryConfig {
    layout: GalleryLayout;
    currentImageUrl: string;
    generalSettings: GalleryGeneralSettings;
    generatedFrames: FrameData[];
    mainImageSettings: ParticlesSettings;
    gallerySettings: GallerySettings;
    assetId?: string | null;
    animationId?: string | null;
}

export type GalleryState = {
    galleries: GalleryConfig[];
    activeGalleryName: string | null;
};

export type IconAction = {
    label: string;
    icon?: string;
    onClick: (title: string, label: string) => void;
    style?: React.CSSProperties;
};


export {};
