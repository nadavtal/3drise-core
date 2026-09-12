import { GalleryCreator } from './GalleryCreator';
import { pexel } from '../data/images';
import { FrontSide } from 'three';
import { defaultParticlesSettings } from '../data/particlesSettings';
import { getLayoutSettings } from './GalleryLayouts';
import { type GalleryLayoutSettings, type FrameData, type GalleryConfig, type GalleryLayout } from "../types/gallery";

// =============================================================================
// DEFAULT IMAGE URLS
// =============================================================================
export const defaultImageUrls: string[] = [
    pexel(1103970),
    pexel(416430),
    pexel(310452),
    pexel(327482),
    pexel(325185),
    pexel(358574),
    pexel(227675),
    pexel(911738),
    pexel(1738986),
    pexel(1181467),
    pexel(1181605),
    pexel(1181719),
    pexel(1181403),
    pexel(1181282),
    pexel(1181396),
    pexel(1181677),
    pexel(1181248),
    pexel(1181263),
    pexel(1181424),
    pexel(1181675),
];
export const createNumberOfDefaultImages = (num: number): string[] => {
    const urls = [];
    for (let i = 0; i < num; i++) {
        urls.push(defaultImageUrls[i % defaultImageUrls.length]);
    }
    return urls;
};
// =============================================================================
// LAYOUT SETTINGS HELPERS
// =============================================================================
export const getInitialLayoutSettings = (layout: GalleryLayout): GalleryLayoutSettings => {
    const galleryState = {
        geometryType: 'plane',
        columns: 3,
        width: 1,
        height: 1,
        spacing: 3.5,
        startX: 0,
        startY: 0,
        radius: 5,
        rotations: 2,
        heightIncrement: 0.5,
        arcAngle: Math.PI,
        amplitude: 2,
        frequency: 2,
        layers: 3,
        depth: 20,
        scaleFactor: 0.8,
        bounds: 8,
        layout,
        numImages: 20,
    };
    return getLayoutSettings(layout, (galleryState as any));
};
export const updateCurrentLayoutSettings = (currentSettings: GalleryLayoutSettings, newSettings?: Partial<GalleryLayoutSettings>): {
        frames: FrameData[];
        layoutSettings: GalleryLayoutSettings;
    } => {
    console.log('Updating layout settings for gallery:', currentSettings);
    const galleryState: GalleryLayoutSettings = {
        geometryType: newSettings?.geometryType ?? currentSettings.geometryType,
        columns: newSettings?.columns ?? currentSettings.columns ?? 3,
        width: newSettings?.width ?? currentSettings.width ?? 1,
        height: newSettings?.height ?? currentSettings.height ?? 1,
        spacing: newSettings?.spacing ?? currentSettings.spacing ?? 3.5,
        startX: newSettings?.startX ?? currentSettings.startX ?? 0,
        startY: newSettings?.startY ?? currentSettings.startY ?? 0,
        radius: newSettings?.radius ?? currentSettings.radius ?? 5,
        rotations: newSettings?.rotations ?? currentSettings.rotations ?? 2,
        heightIncrement: newSettings?.heightIncrement ?? currentSettings.heightIncrement ?? 0.5,
        arcAngle: newSettings?.arcAngle ?? currentSettings.arcAngle ?? Math.PI,
        amplitude: newSettings?.amplitude ?? currentSettings.amplitude ?? 2,
        frequency: newSettings?.frequency ?? currentSettings.frequency ?? 2,
        layers: newSettings?.layers ?? currentSettings.layers ?? 3,
        depth: newSettings?.depth ?? currentSettings.depth ?? 20,
        scaleFactor: newSettings?.scaleFactor ?? currentSettings.scaleFactor ?? 0.8,
        bounds: newSettings?.bounds ?? currentSettings.bounds ?? 8,
        outerFrameScale: newSettings?.outerFrameScale ?? currentSettings.outerFrameScale ?? 1,
        numImages: newSettings?.numImages ?? currentSettings.numImages ?? 20,
        layout: newSettings?.layout ?? currentSettings.layout,
    };
    const frames = GalleryCreator.generateGallery(currentSettings.imageUrls && currentSettings.imageUrls.length > 0
        ? currentSettings.imageUrls
        : createNumberOfDefaultImages(galleryState.numImages ?? 20), galleryState);
    const layoutSettings = getLayoutSettings(currentSettings.layout, galleryState);
    return { frames, layoutSettings: galleryState };
};
// =============================================================================
// DEFAULT STATE
// =============================================================================
export const defaultGalleryState: GalleryConfig = {
    layout: 'tunnel',
    assetId: null,
    currentImageUrl: '',
    animationId: 'yoyo-sequence-1',
    generalSettings: {
        visible: false,
        name: 'New Gallery',
        description: 'Default gallery description',
        side: FrontSide,
        imageUrls: [],
        autoAnimationSpeed: 2,
    },
    generatedFrames: [],
    mainImageSettings: {
        ...defaultParticlesSettings,
        name: 'New Gallery display',
        meshSettings: {
            ...defaultParticlesSettings.meshSettings,
            scale: [8, 4.5, 1],
        },
        config: {
            ...defaultParticlesSettings.config,
            count: 10000,
            paths: false,
        },
    },
    gallerySettings: {
        type: 'gallery',
        id: `gallery-${Date.now()}`,
        name: 'New Gallery layout',
        meshSettings: {
            id: `mesh-${Date.now()}`,
            name: 'Default Main Image Settings',
            visible: true,
            position: [0, 5, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            anchor: null,
        },
        materialSettings: {
            materialType: 'basic',
            materialName: 'Standard',
            color: '#ffffff',
            opacity: 1.0,
        },
        // hoverSettings: {
        //   sensitivity: 0.5,
        //   applyToChildren: true,
        // },
        actions: [
            {
                enabled: true,
                mouseEvent: 'click',
                operations: ['zoom'],
                settings: ({
                                    distance: 2,
                                    duration: 1.0,
                                    ease: 'power2.out',
                                } as any),
            } as any,
        ],
        config: getInitialLayoutSettings('scattered'),
    },
};
