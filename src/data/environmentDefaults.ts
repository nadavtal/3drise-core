import type { EnvironmentObjectConfig, EnvironmentObjectType } from "../types";

// =============================================================================
// ENVIRONMENT OBJECTS — defaults, labels, animatable knobs
// =============================================================================
//
// Generated from the environment lab (Claude outputs/environment-lab, gen_family.mjs).
// The animatable list is derived from each component's applyConfig: a knob is
// listed only when that push point applies it per frame. Structural knobs
// (density, quality, seed), mode selects and switches are never listed.
//

export const DEFAULT_ENVIRONMENT_OBJECTS: Record<EnvironmentObjectType, EnvironmentObjectConfig> = {
    snow: { type: 'snow', enabled: true, intensity: 1, speed: 1, color: '#f4f8ff', opacity: 0.9, density: 1, quality: 'medium', seed: 7, followCamera: false, windStrength: 0.18, windDirection: 30, turbulence: 0.25, flakeSize: 0.045, flutter: 0.6, tumble: 0.5, gustiness: 0.6, bands: 0.75, glint: 0.8, shadeColor: '#a9bddc', pointerMode: 'gust', pointerStrength: 1, pointerRadius: 1, pointerColor: '#ffb070' },
    sandstorm: { type: 'sandstorm', enabled: true, intensity: 1, speed: 1, color: '#c8955a', opacity: 1, density: 1, quality: 'medium', seed: 11, followCamera: false, windStrength: 0.6, windDirection: 75, turbulence: 0.5, height: 0.3, walls: 0.85, haze: 0.25, grains: 1, grainSize: 1, shadeColor: '#6d5a4a', pointerMode: 'devil', pointerStrength: 1, pointerRadius: 1, pointerColor: '#ffd9a0' },
    rainbow: { type: 'rainbow', enabled: true, intensity: 1, opacity: 1, dropSize: 1, secondary: 0, color: '#ffffff', pointerMode: 'spray', pointerStrength: 1, pointerRadius: 1, pointerColor: '#ffffff' },
    tornado: { type: 'tornado', enabled: true, intensity: 1, speed: 1, color: '#b9bec4', opacity: 1, density: 1, quality: 'medium', seed: 3, followCamera: false, windStrength: 0.15, windDirection: 40, turbulence: 0.5, rotation: 1, coreRadius: 1, reach: 0.9, wander: 0.5, lift: 1, dust: 1, dustSpread: 1, shadeColor: '#3c424c', dustColor: '#8a7358', pointerMode: 'steer', pointerStrength: 1, pointerRadius: 1, pointerColor: '#c9a27a' },
    thunderstorm: { type: 'thunderstorm', enabled: true, intensity: 1, speed: 1, color: '#aab4c2', opacity: 1, density: 1, quality: 'medium', seed: 9, followCamera: false, windStrength: 0.35, windDirection: 120, turbulence: 0.4, shafts: 0.6, flashRate: 6, flashIntensity: 1.5, shadeColor: '#39414d', flashColor: '#cfd8ff', pointerMode: 'strike', pointerStrength: 1, pointerRadius: 1, pointerColor: '#ffffff' },
    rain: { type: 'rain', enabled: true, color: '#ffffff', size: 0.1, opacity: 0.5, speed: 1, density: 100, windStrength: 0, windDirection: 0, turbulence: 0 },
};

export const ENVIRONMENT_OBJECT_LABELS: Record<EnvironmentObjectType, string> = {
    snow: 'Snow',
    sandstorm: 'Sandstorm',
    rainbow: 'Rainbow',
    tornado: 'Tornado',
    thunderstorm: 'Thunderstorm',
    rain: 'Rain',
};

export const ENVIRONMENT_OBJECTS_ANIMATABLE: Record<EnvironmentObjectType, { value: string; label: string }[]> = {
    snow: [
        { value: 'intensity', label: 'Intensity' },
        { value: 'speed', label: 'Speed' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'color', label: 'Color' },
        { value: 'shadeColor', label: 'Shade Color' },
        { value: 'pointerColor', label: 'Pointer Color' },
        { value: 'windStrength', label: 'Wind Strength' },
        { value: 'windDirection', label: 'Wind Direction' },
        { value: 'turbulence', label: 'Turbulence' },
        { value: 'flakeSize', label: 'Flake Size' },
        { value: 'flutter', label: 'Flutter' },
        { value: 'tumble', label: 'Tumble' },
        { value: 'gustiness', label: 'Gustiness' },
        { value: 'bands', label: 'Bands' },
        { value: 'glint', label: 'Glint' },
        { value: 'pointerStrength', label: 'Pointer Strength' },
        { value: 'pointerRadius', label: 'Pointer Radius' },
    ],
    sandstorm: [
        { value: 'intensity', label: 'Intensity' },
        { value: 'speed', label: 'Speed' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'color', label: 'Color' },
        { value: 'shadeColor', label: 'Shade Color' },
        { value: 'pointerColor', label: 'Pointer Color' },
        { value: 'windStrength', label: 'Wind Strength' },
        { value: 'windDirection', label: 'Wind Direction' },
        { value: 'turbulence', label: 'Turbulence' },
        { value: 'pointerStrength', label: 'Pointer Strength' },
        { value: 'pointerRadius', label: 'Pointer Radius' },
        { value: 'height', label: 'Height' },
        { value: 'walls', label: 'Walls' },
        { value: 'haze', label: 'Haze' },
        { value: 'grains', label: 'Grains' },
        { value: 'grainSize', label: 'Grain Size' },
    ],
    rainbow: [
        { value: 'intensity', label: 'Intensity' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'color', label: 'Color' },
        { value: 'pointerColor', label: 'Pointer Color' },
        { value: 'pointerStrength', label: 'Pointer Strength' },
        { value: 'pointerRadius', label: 'Pointer Radius' },
        { value: 'dropSize', label: 'Drop Size' },
        { value: 'secondary', label: 'Secondary' },
    ],
    tornado: [
        { value: 'intensity', label: 'Intensity' },
        { value: 'speed', label: 'Speed' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'color', label: 'Color' },
        { value: 'shadeColor', label: 'Shade Color' },
        { value: 'pointerColor', label: 'Pointer Color' },
        { value: 'windStrength', label: 'Wind Strength' },
        { value: 'windDirection', label: 'Wind Direction' },
        { value: 'turbulence', label: 'Turbulence' },
        { value: 'pointerStrength', label: 'Pointer Strength' },
        { value: 'pointerRadius', label: 'Pointer Radius' },
        { value: 'rotation', label: 'Rotation' },
        { value: 'coreRadius', label: 'Core Radius' },
        { value: 'reach', label: 'Reach' },
        { value: 'wander', label: 'Wander' },
        { value: 'lift', label: 'Lift' },
        { value: 'dust', label: 'Dust' },
        { value: 'dustSpread', label: 'Dust Spread' },
        { value: 'dustColor', label: 'Dust Color' },
    ],
    thunderstorm: [
        { value: 'intensity', label: 'Intensity' },
        { value: 'speed', label: 'Speed' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'color', label: 'Color' },
        { value: 'shadeColor', label: 'Shade Color' },
        { value: 'pointerColor', label: 'Pointer Color' },
        { value: 'windStrength', label: 'Wind Strength' },
        { value: 'windDirection', label: 'Wind Direction' },
        { value: 'turbulence', label: 'Turbulence' },
        { value: 'pointerStrength', label: 'Pointer Strength' },
        { value: 'pointerRadius', label: 'Pointer Radius' },
        { value: 'shafts', label: 'Shafts' },
        { value: 'flashIntensity', label: 'Flash Intensity' },
        { value: 'flashColor', label: 'Flash Color' },
        { value: 'flashRate', label: 'Flash Rate' },
    ],
    rain: [
        { value: 'color', label: 'Color' },
        { value: 'size', label: 'Size' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'speed', label: 'Speed' },
        { value: 'windStrength', label: 'Wind Strength' },
        { value: 'windDirection', label: 'Wind Direction' },
        { value: 'turbulence', label: 'Turbulence' },
    ],
};

/** True when the config is one of the environment objects. */
export function isEnvironmentObjectConfig(config: unknown): config is EnvironmentObjectConfig {
    const t = (config as { type?: unknown } | null | undefined)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_ENVIRONMENT_OBJECTS, t);
}
