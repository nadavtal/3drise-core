import { GalleryLayout, GalleryLayoutConfig, GalleryLayoutSettings } from "../types/gallery";

const GOLDENRATIO = 1.61803398875;
export const GALLERY_LAYOUT_CONFIGS: Record<GalleryLayout, GalleryLayoutConfig> = {
    scattered: { name: 'Scattered', value: 'scattered', label: 'Scattered', settingsFields: ['spacing'] },
    tiles: { name: 'Tiles (Grid)', value: 'tiles', label: 'Tiles (Grid)', settingsFields: ['columns', 'spacing'] },
    horizontal: { name: 'Horizontal', value: 'horizontal', label: 'Horizontal', settingsFields: ['spacing', 'startX'] },
    vertical: { name: 'Vertical', value: 'vertical', label: 'Vertical', settingsFields: ['spacing', 'startY'] },
    circular: { name: 'Circular', value: 'circular', label: 'Circular', settingsFields: ['radius'] },
    spiral: { name: 'Spiral', value: 'spiral', label: 'Spiral', settingsFields: ['radius', 'rotations', 'heightIncrement'] },
    arc: { name: 'Arc', value: 'arc', label: 'Arc', settingsFields: ['radius', 'arcAngle'] },
    pyramid: { name: 'Pyramid', value: 'pyramid', label: 'Pyramid', settingsFields: ['layers', 'spacing'] },
    helix: { name: 'Helix', value: 'helix', label: 'Helix', settingsFields: ['radius', 'rotations', 'heightIncrement'] },
    box: { name: 'Box (3D)', value: 'box', label: 'Box (3D)', settingsFields: ['size'] },
    sphere: { name: 'Sphere', value: 'sphere', label: 'Sphere', settingsFields: ['radius'] },
    fan: { name: 'Fan', value: 'fan', label: 'Fan', settingsFields: ['radius', 'arcAngle'] },
    wave: { name: 'Wave', value: 'wave', label: 'Wave', settingsFields: ['amplitude', 'frequency', 'spacing'] },
    tunnel: { name: 'Tunnel', value: 'tunnel', label: 'Tunnel', settingsFields: ['depth', 'scaleFactor'] },
    tunnelPyramid: { name: 'Tunnel Pyramid', value: 'tunnelPyramid', label: 'Tunnel Pyramid', settingsFields: ['depth', 'layers', 'spacing'] },
    tunnelWave: { name: 'Tunnel Wave', value: 'tunnelWave', label: 'Tunnel Wave', settingsFields: ['depth', 'amplitude', 'frequency', 'spacing'] },
    random: { name: 'Random', value: 'random', label: 'Random', settingsFields: ['bounds'] },
};
export const getLayoutSettings = (layout: GalleryLayout, layoutSettings: GalleryLayoutSettings): GalleryLayoutSettings => {
    const baseSettings = {
        geometryType: layoutSettings.geometryType,
        layout,
        outerFrameScale: layoutSettings.outerFrameScale || 1,
        width: layoutSettings.width || 1,
        height: layoutSettings.height || GOLDENRATIO,
        numImages: layoutSettings.numImages || 20,
    };
    const config = GALLERY_LAYOUT_CONFIGS[layout];
    if (!config)
        return baseSettings;
    const settings = { ...baseSettings };
    config.settingsFields.forEach(field => {
        if (layoutSettings[field] !== undefined) {
            settings[field] = layoutSettings[field];
        }
    });
    return settings;
};
export const getLayoutSettingsFields = (layout: GalleryLayout): Array<keyof Omit<GalleryLayoutSettings, "layout">> => GALLERY_LAYOUT_CONFIGS[layout]?.settingsFields || [];
export const getLayoutPresets = (): {
        label: string;
        value: GalleryLayout;
    }[] => Object.values(GALLERY_LAYOUT_CONFIGS).map(c => ({ label: c.label, value: c.value }));
export const layoutUsesField = (layout: GalleryLayout, field: keyof Omit<GalleryLayoutSettings, "layout">): boolean => GALLERY_LAYOUT_CONFIGS[layout]?.settingsFields.includes(field) || false;
