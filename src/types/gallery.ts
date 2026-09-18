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

/**
 * `meshSettings.layout` — repeat a mesh / model / effect / light across a gallery layout.
 * Lives in meshSettings (a JSON column) so it persists with no data-center change.
 */
export interface ObjectLayoutSettings extends LayoutParams {
    enabled: boolean;
    layout: GalleryLayout;
    count: number;
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
