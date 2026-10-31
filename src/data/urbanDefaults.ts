import type { UrbanObjectConfig, UrbanObjectType } from "../types";

// =============================================================================
// URBAN OBJECTS — defaults, labels, animatable knobs (type 'urban', config.type set)
// =============================================================================
//
// The only place a default lives: the viewer components, the controller, the catalog
// and the AI read it from here. Entries are appended by the integrator from each
// object spec (building, block, road, streetFurniture, …).
//
// Animatable = exactly what the component's applyConfig pushes per frame (colours,
// glass / light intensities, wear); structural knobs (footprint, floors, points, lamp
// spacing, textures) rebuild and are never listed.
//

export const DEFAULT_URBAN_OBJECTS: Record<UrbanObjectType, UrbanObjectConfig> = {

    building: { type: 'building', enabled: true, footprint: 'box', width: 24, depth: 18, floors: 12, floorHeight: 3.4, lobby: true, facade: 'curtainWall', windowRatio: 0.62, bayWidth: 3, mullionWidth: 0.08, roof: 'parapet', wallColor: '#9a9590', glassColor: '#5f7f93', glassReflect: 0.9, mullionColor: '#2a2d31', roofColor: '#6d6a66', texture: { set: 'Concrete016', maps: {}, tileSize: 4 }, textureStrength: 0.6, windowLights: 0.45, lightWarmth: 0.7, lightColor: '#ffd9a8', coolLightColor: '#cfe4ff', windowGlow: 1, flicker: 0.25, lighting: 'auto', seed: 7 },
    road: { type: 'road', enabled: true, points: [[-80, 0], [80, 0]], curve: 0.5, lanes: 2, laneWidth: 3.5, markings: 'dashed', laneLines: true, edgeLines: true, crosswalks: true, markingColor: '#e9e6dc', asphaltColor: '#4b4b4e', wear: 0.5, texture: { set: 'Road008A', maps: {}, tileSize: 6 }, sidewalk: 3, kerbHeight: 0.15, sidewalkColor: '#a39f98', sidewalkTexture: { set: 'PavingStones136', maps: {}, tileSize: 3 }, lampSpacing: 28, lampSide: 'alternate', lampHeight: 8, lampColor: '#ffd6a0', lampRadius: 18, lampIntensity: 2.6, lampPaint: '#2b2f33', lighting: 'auto', seed: 3 },
    block: { enabled: true, footprint: 'box', width: 24, depth: 18, floorHeight: 3.4, lobby: true, facade: 'curtainWall', windowRatio: 0.62, bayWidth: 3, mullionWidth: 0.08, roof: 'parapet', wallColor: '#9a9590', glassColor: '#5f7f93', glassReflect: 0.9, mullionColor: '#2a2d31', roofColor: '#6d6a66', texture: { set: 'Concrete016', maps: {}, tileSize: 4 }, textureStrength: 0.6, windowLights: 0.45, lightWarmth: 0.7, lightColor: '#ffd9a8', coolLightColor: '#cfe4ff', windowGlow: 1, flicker: 0.25, lighting: 'auto', type: 'block', mix: 'custom', columns: 4, rows: 2, gap: 10, sizeJitter: 0.3, floorsMin: 5, floorsMax: 16, facadeMix: 0.7, plot: 'paved', plotMargin: 6, plotColor: '#9d9892', plotTexture: { set: 'PavingStones142', maps: {}, tileSize: 3 }, streets: 'cross', streetLanes: 2, streetLaneWidth: 3, streetSidewalk: 2, streetAsphaltColor: '#4b4b4e', streetMarkingColor: '#e9e6dc', streetTexture: { set: 'Road008A', maps: {}, tileSize: 6 }, streetLamps: true, streetLampSpacing: 22, streetLampHeight: 6, streetLampColor: '#ffd6a0', streetLampRadius: 16, streetLampIntensity: 2.2, seed: 11 },
    streetFurniture: { type: 'streetFurniture', enabled: true, kind: 'lamp', size: 1, paint: '#2b2f33', accentColor: '#8a5a2b', lampColor: '#ffd6a0', lampRadius: 18, lampIntensity: 2.6, realLight: false, lighting: 'auto' },
    skyline: { type: 'skyline', enabled: true, mix: 'custom', radius: 520, spread: 260, arcStart: 0, arcSpan: 360, count: 220, heightMin: 18, heightMax: 140, width: 28, depth: 24, sizeJitter: 0.5, facade: 'curtainWall', facadeMix: 1, windowRatio: 0.6, bayWidth: 3.2, wallColor: '#8f8b86', glassColor: '#5a7488', glassReflect: 0.85, mullionColor: '#2a2d31', roofColor: '#5e5b57', texture: { set: 'Concrete016', maps: {}, tileSize: 4 }, textureStrength: 0.4, windowLights: 0.4, lightWarmth: 0.7, lightColor: '#ffd9a8', coolLightColor: '#cfe4ff', windowGlow: 1, flicker: 0.25, lighting: 'auto', seed: 5 },
    plaza: { type: 'plaza', enabled: true, points: [[-30, -20], [30, -20], [30, 20], [-30, 20]], curve: 0, texture: { set: 'PavingStones142', maps: {}, tileSize: 3 }, color: '#9d9892', pattern: 'grid', patternSpacing: 8, patternWidth: 0.6, patternAngle: 0, bandTexture: { set: 'PavingStones136', maps: {}, tileSize: 2 }, bandColor: '#6e6a66', kerb: true, kerbHeight: 0.15, lighting: 'auto', seed: 1 },
    junction: { type: 'junction', enabled: true, shape: 'cross', islandRadius: 10, lanes: 2, laneWidth: 3.5, armLength: 14, cornerRadius: 6, crossings: true, markingColor: '#e9e6dc', asphaltColor: '#4b4b4e', wear: 0.5, texture: { set: 'Road008A', maps: {}, tileSize: 6 }, sidewalk: true, kerbHeight: 0.15, sidewalkColor: '#a39f98', sidewalkTexture: { set: 'PavingStones136', maps: {}, tileSize: 3 }, signals: true, signalCycle: 14, signalHeight: 4.5, signalPaint: '#2b2f33', lamps: true, lampHeight: 7, lampPaint: '#2b2f33', lampColor: '#ffd6a0', lampRadius: 18, lampIntensity: 2.6, lighting: 'auto', seed: 2 },
    traffic: { type: 'traffic', enabled: true, points: [[-120, 0], [120, 0]], curve: 0.5, lanes: 2, laneWidth: 3.5, density: 1.5, speed: 45, jitter: 0.5, headlightColor: '#fff2d6', taillightColor: '#ff2a1a', intensity: 1, size: 1, showCars: false, lighting: 'auto', seed: 4 },
    signage: { type: 'signage', enabled: true, kind: 'billboard', width: 8, height: 4, elevation: 6, imageUrl: '', color: '#1b2430', frameColor: '#2b2f33', glow: 1, doubleSided: true, lighting: 'auto' },
    park: { type: 'park', enabled: true, points: [[-40, -30], [40, -30], [40, 30], [-40, 30]], curve: 0.5, lawnColor: '#3e6b25', kerb: true, kerbHeight: 0.12, kerbColor: '#8f8a84', pathInset: 0.3, pathWidth: 3, crossPath: true, pathTexture: { set: 'PavingStones136', maps: {}, tileSize: 2 }, pathColor: '#a8a295', lampSpacing: 18, lampHeight: 4, lampPaint: '#2b2f33', lampColor: '#ffe2b8', lampRadius: 12, lampIntensity: 2, lighting: 'auto' },
    parkingLot: { type: 'parkingLot', enabled: true, width: 60, depth: 44, bayWidth: 2.5, bayDepth: 5, aisle: 6.5, markingColor: '#e9e6dc', asphaltColor: '#4b4b4e', wear: 0.5, texture: { set: 'Road008A', maps: {}, tileSize: 6 }, kerb: true, kerbHeight: 0.15, kerbColor: '#a39f98', kerbTexture: { set: 'PavingStones136', maps: {}, tileSize: 3 }, lampSpacing: 24, lampHeight: 9, lampPaint: '#2b2f33', lampColor: '#ffd6a0', lampRadius: 22, lampIntensity: 2.6, cars: 0.6, carScale: 1, lighting: 'auto', seed: 3 },
    streetGrid: { type: 'streetGrid', enabled: true, layoutId: 'preset:classic', groundTexture: { set: '', maps: {}, tileSize: 4 }, groundColor: '#3e6b25', groundTextures: {}, lanes: 2, laneWidth: 3.5, armLength: 14, cornerRadius: 6, crossings: true, signals: true, signalCycle: 14, signalPaint: '#2b2f33', markingColor: '#e9e6dc', asphaltColor: '#4b4b4e', wear: 0.5, texture: { set: 'Road008A', maps: {}, tileSize: 6 }, sidewalk: 3, kerbHeight: 0.15, sidewalkColor: '#a39f98', sidewalkTexture: { set: 'PavingStones136', maps: {}, tileSize: 3 }, lamps: true, lampSpacing: 28, lampHeight: 8, lampPaint: '#2b2f33', lampColor: '#ffd6a0', lampRadius: 18, lampIntensity: 2.6, traffic: 1.2, showCars: true, speed: 45, lighting: 'auto', seed: 5 },
};

export const URBAN_OBJECT_LABELS: Record<UrbanObjectType, string> = {

    building: 'Building',
    road: 'Road',
    block: 'City Block',
    streetFurniture: 'Street Furniture',
    skyline: 'Skyline',
    plaza: 'Plaza',
    junction: 'Junction',
    traffic: 'Traffic',
    signage: 'Signage',
    park: 'Park',
    parkingLot: 'Parking Lot',
    streetGrid: 'Street Grid',
};

export const URBAN_OBJECTS_ANIMATABLE: Record<UrbanObjectType, { value: string; label: string }[]> = {

    building: [
        { value: 'wallColor', label: 'Wall' },
        { value: 'glassColor', label: 'Glass' },
        { value: 'glassReflect', label: 'Reflection' },
        { value: 'mullionColor', label: 'Frames' },
        { value: 'roofColor', label: 'Roof colour' },
        { value: 'mullionWidth', label: 'Mullions' },
        { value: 'lightColor', label: 'Warm light' },
        { value: 'coolLightColor', label: 'Cool light' },
        { value: 'lightWarmth', label: 'Warm share' },
        { value: 'windowGlow', label: 'Glow' },
        { value: 'flicker', label: 'Turnover' },
        { value: 'textureStrength', label: 'Relief' },
    ],
    road: [
        { value: 'asphaltColor', label: 'Asphalt' },
        { value: 'markingColor', label: 'Paint' },
        { value: 'wear', label: 'Wear' },
        { value: 'sidewalkColor', label: 'Paving colour' },
        { value: 'lampPaint', label: 'Pole paint' },
        { value: 'lampColor', label: 'Lamp colour' },
        { value: 'lampIntensity', label: 'Lamp power' },
        { value: 'lampRadius', label: 'Lamp reach' },
    ],
    block: [
        { value: 'plotColor', label: 'Plot colour' },
        { value: 'streetAsphaltColor', label: 'Asphalt' },
        { value: 'streetMarkingColor', label: 'Markings' },
        { value: 'streetLampColor', label: 'Lamp light' },
        { value: 'streetLampRadius', label: 'Lamp reach' },
        { value: 'streetLampIntensity', label: 'Lamp intensity' },
        { value: 'wallColor', label: 'Wall' },
        { value: 'glassColor', label: 'Glass' },
        { value: 'glassReflect', label: 'Reflection' },
        { value: 'mullionColor', label: 'Frames' },
        { value: 'roofColor', label: 'Roof colour' },
        { value: 'mullionWidth', label: 'Mullions' },
        { value: 'lightColor', label: 'Warm light' },
        { value: 'coolLightColor', label: 'Cool light' },
        { value: 'lightWarmth', label: 'Warm share' },
        { value: 'windowGlow', label: 'Glow' },
        { value: 'flicker', label: 'Turnover' },
        { value: 'textureStrength', label: 'Relief' },
    ],
    streetFurniture: [
        { value: 'paint', label: 'Paint' },
        { value: 'accentColor', label: 'Accent' },
        { value: 'lampColor', label: 'Lamp colour' },
        { value: 'lampIntensity', label: 'Lamp power' },
        { value: 'lampRadius', label: 'Lamp reach' },
    ],
    skyline: [
        { value: 'wallColor', label: 'Wall' },
        { value: 'glassColor', label: 'Glass' },
        { value: 'glassReflect', label: 'Reflection' },
        { value: 'mullionColor', label: 'Frames' },
        { value: 'roofColor', label: 'Roof colour' },
        { value: 'lightColor', label: 'Warm light' },
        { value: 'coolLightColor', label: 'Cool light' },
        { value: 'lightWarmth', label: 'Warm share' },
        { value: 'windowGlow', label: 'Glow' },
        { value: 'flicker', label: 'Turnover' },
        { value: 'textureStrength', label: 'Relief' },
    ],
    plaza: [
        { value: 'color', label: 'Paving colour' },
        { value: 'bandColor', label: 'Pattern colour' },
        { value: 'patternSpacing', label: 'Spacing' },
        { value: 'patternWidth', label: 'Band width' },
        { value: 'patternAngle', label: 'Angle' },
    ],
    junction: [
        { value: 'asphaltColor', label: 'Asphalt' },
        { value: 'markingColor', label: 'Paint' },
        { value: 'wear', label: 'Wear' },
        { value: 'sidewalkColor', label: 'Paving colour' },
        { value: 'signalPaint', label: 'Signal paint' },
        { value: 'signalCycle', label: 'Cycle' },
        { value: 'lampPaint', label: 'Lamp paint' },
        { value: 'lampColor', label: 'Lamp light' },
        { value: 'lampIntensity', label: 'Lamp intensity' },
        { value: 'lampRadius', label: 'Lamp reach' },
    ],
    traffic: [
        { value: 'speed', label: 'Speed' },
        { value: 'headlightColor', label: 'Head lights' },
        { value: 'taillightColor', label: 'Tail lights' },
        { value: 'intensity', label: 'Brightness' },
        { value: 'size', label: 'Size' },
    ],
    signage: [
        { value: 'color', label: 'Background' },
        { value: 'frameColor', label: 'Frame' },
        { value: 'glow', label: 'Backlight' },
    ],
    park: [
        { value: 'lawnColor', label: 'Lawn' },
        { value: 'pathColor', label: 'Path colour' },
        { value: 'kerbColor', label: 'Kerb colour' },
        { value: 'lampPaint', label: 'Lamp paint' },
        { value: 'lampColor', label: 'Lamp light' },
        { value: 'lampIntensity', label: 'Lamp intensity' },
        { value: 'lampRadius', label: 'Lamp reach' },
    ],
    parkingLot: [
        { value: 'asphaltColor', label: 'Asphalt' },
        { value: 'markingColor', label: 'Markings' },
        { value: 'wear', label: 'Wear' },
        { value: 'kerbColor', label: 'Kerb colour' },
        { value: 'lampPaint', label: 'Lamp paint' },
        { value: 'lampColor', label: 'Lamp light' },
        { value: 'lampIntensity', label: 'Lamp intensity' },
        { value: 'lampRadius', label: 'Lamp reach' },
    ],
    streetGrid: [
        { value: 'groundColor', label: 'Lawn colour' },
        { value: 'asphaltColor', label: 'Asphalt' },
        { value: 'markingColor', label: 'Markings' },
        { value: 'wear', label: 'Wear' },
        { value: 'sidewalkColor', label: 'Sidewalk colour' },
        { value: 'signalPaint', label: 'Signal paint' },
        { value: 'signalCycle', label: 'Cycle' },
        { value: 'lampPaint', label: 'Lamp paint' },
        { value: 'lampColor', label: 'Lamp light' },
        { value: 'lampRadius', label: 'Lamp reach' },
        { value: 'lampIntensity', label: 'Lamp intensity' },
        { value: 'speed', label: 'Speed' },
    ],
};

/** True when the config is one of the urban variants (type 'urban', config.type set). */
export function isUrbanObjectConfig(config: unknown): config is UrbanObjectConfig {
    const t = (config as { type?: unknown } | null | undefined)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_URBAN_OBJECTS, t);
}
