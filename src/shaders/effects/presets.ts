import { generateInstanceId } from './defaults';
import type { ShaderEffect, EffectScope, EffectValue } from "./types";
export interface EffectPresetEntry {
    type: string;
    scope: EffectScope;
    enabled: boolean;
    values: Record<string, EffectValue>;
}

export interface EffectPreset {
    id: string;
    label: string;
    description?: string;
    pointerRadius?: number;
    effects: EffectPresetEntry[];
}


// Note: Each entry's `values` keys must match its descriptor's uniform keys
// (see registry/<type>.ts). Mismatches don't error — they silently leave
// uniforms at their defaults. Copy keys from the descriptor when adding new
// presets.
export const EFFECT_PRESETS: EffectPreset[] = [
    // -------------------------------------------------------------------------
    // Atmospheric / dreamy
    // -------------------------------------------------------------------------
    {
        id: 'auroraVeil',
        label: 'Aurora veil',
        description: 'Slow vertical ribbon with cycling icy hues over a cyan glow.',
        effects: [
            { type: 'wave', scope: 'global', enabled: true,
                values: { intensity: 0.6, frequency: 1.2, speed: 0.3, direction: 1 } },
            { type: 'hueShift', scope: 'global', enabled: true,
                values: { intensity: 1, speed: 0.25, spatial: 1.2 } },
            { type: 'saturation', scope: 'global', enabled: true,
                values: { intensity: 0.7 } },
            { type: 'glow', scope: 'global', enabled: true,
                values: { intensity: 0.4, color: '#7fdfff' } },
        ],
    },
    {
        id: 'cosmicDust',
        label: 'Cosmic dust',
        description: 'Domain-warped drift with sparse twinkles fading into the distance.',
        effects: [
            { type: 'noise', scope: 'global', enabled: true,
                values: { intensity: 0.4, frequency: 0.6, speed: 0.2, noiseType: 8, axis: 3 } },
            { type: 'sparkle', scope: 'global', enabled: true,
                values: { intensity: 1.5, density: 0.05, speed: 4 } },
            { type: 'depthFade', scope: 'global', enabled: true,
                values: { intensity: 0.65, near: 0.92, far: 1.0 } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.4, targetColor: '#5a3a8a' } },
        ],
    },
    {
        id: 'vaporwave',
        label: 'Vaporwave drift',
        description: 'Slow horizontal drift with pink/teal palette and dreamy bloom.',
        effects: [
            { type: 'wave', scope: 'global', enabled: true,
                values: { intensity: 0.25, frequency: 1, speed: 0.3, direction: 0 } },
            { type: 'hueShift', scope: 'global', enabled: true,
                values: { intensity: 0.7, speed: 0.15, spatial: 0.8 } },
            { type: 'saturation', scope: 'global', enabled: true,
                values: { intensity: 0.6 } },
            { type: 'glow', scope: 'global', enabled: true,
                values: { intensity: 0.5, color: '#ff88cc' } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.35, targetColor: '#88eedd' } },
        ],
    },
    // -------------------------------------------------------------------------
    // High-energy / chaotic
    // -------------------------------------------------------------------------
    {
        id: 'neonTornado',
        label: 'Neon tornado',
        description: 'Tight Y-axis twist with cycling neon hues and a cyan glow.',
        effects: [
            { type: 'twist', scope: 'global', enabled: true,
                values: { intensity: 2.5, speed: 1.0, axis: 1 } },
            { type: 'jitter', scope: 'global', enabled: true,
                values: { intensity: 0.03, speed: 18 } },
            { type: 'hueShift', scope: 'global', enabled: true,
                values: { intensity: 1, speed: 1.2, spatial: 0 } },
            { type: 'saturation', scope: 'global', enabled: true,
                values: { intensity: 1.5 } },
            { type: 'glow', scope: 'global', enabled: true,
                values: { intensity: 0.6, color: '#00ffff' } },
        ],
    },
    {
        id: 'stormFront',
        label: 'Storm front',
        description: 'Turbulent particles with strong flicker and pulsing storm-grey light.',
        effects: [
            { type: 'noise', scope: 'global', enabled: true,
                values: { intensity: 0.7, frequency: 2.0, speed: 1.2, noiseType: 7, axis: 3 } },
            { type: 'flicker', scope: 'global', enabled: true,
                values: { intensity: 0.6, speed: 22 } },
            { type: 'brightness', scope: 'global', enabled: true,
                values: { intensity: 0.45 } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.5, targetColor: '#506470' } },
            { type: 'pulse', scope: 'global', enabled: true,
                values: { intensity: 0.3, speed: 4 } },
        ],
    },
    {
        id: 'glitchStatic',
        label: 'Glitch / static',
        description: 'CRT chaos: white noise, heavy jitter, desaturated flicker.',
        effects: [
            { type: 'noise', scope: 'global', enabled: true,
                values: { intensity: 0.25, frequency: 8, speed: 2, noiseType: 4, axis: 3 } },
            { type: 'jitter', scope: 'global', enabled: true,
                values: { intensity: 0.08, speed: 40 } },
            { type: 'flicker', scope: 'global', enabled: true,
                values: { intensity: 0.5, speed: 35 } },
            { type: 'saturation', scope: 'global', enabled: true,
                values: { intensity: -0.4 } },
            { type: 'brightness', scope: 'global', enabled: true,
                values: { intensity: 0.3 } },
        ],
    },
    {
        id: 'cyberRain',
        label: 'Cyber rain',
        description: 'Vertical wave + ripples + neon green tint with glitchy flicker.',
        effects: [
            { type: 'wave', scope: 'global', enabled: true,
                values: { intensity: 0.4, frequency: 6, speed: 2.5, direction: 1 } },
            { type: 'ripple', scope: 'global', enabled: true,
                values: { intensity: 0.15, frequency: 5, speed: 3, centerX: 0, centerY: 0 } },
            { type: 'flicker', scope: 'global', enabled: true,
                values: { intensity: 0.3, speed: 30 } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.6, targetColor: '#00ffaa' } },
            { type: 'brightness', scope: 'global', enabled: true,
                values: { intensity: 0.3 } },
        ],
    },
    // -------------------------------------------------------------------------
    // Cosmic / cosmic-physics
    // -------------------------------------------------------------------------
    {
        id: 'blackhole',
        label: 'Black hole',
        description: 'Inverse-square pull, slow spiral, dimming toward the void.',
        effects: [
            { type: 'magnet', scope: 'global', enabled: true,
                values: { intensity: 1.8, centerX: 0, centerY: 0, centerZ: 0, falloffPower: 2 } },
            { type: 'spiral', scope: 'global', enabled: true,
                values: { intensity: 0.4, radialSpeed: -0.05, speed: 0.6, centerX: 0, centerY: 0 } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.65, targetColor: '#0a0518' } },
            { type: 'depthFade', scope: 'global', enabled: true,
                values: { intensity: 0.7, near: 0.9, far: 1.0 } },
        ],
    },
    {
        id: 'galacticCore',
        label: 'Galactic core',
        description: 'Particles spiral toward a warm glowing center with sparkles.',
        effects: [
            { type: 'magnet', scope: 'global', enabled: true,
                values: { intensity: 0.7, centerX: 0, centerY: 0, centerZ: 0, falloffPower: 1.5 } },
            { type: 'spiral', scope: 'global', enabled: true,
                values: { intensity: 0.5, radialSpeed: 0.0, speed: 0.4, centerX: 0, centerY: 0 } },
            { type: 'glow', scope: 'global', enabled: true,
                values: { intensity: 0.7, color: '#ffe6aa' } },
            { type: 'hueShift', scope: 'global', enabled: true,
                values: { intensity: 0.4, speed: 0.2, spatial: 0.5 } },
            { type: 'sparkle', scope: 'global', enabled: true,
                values: { intensity: 1.2, density: 0.06, speed: 5 } },
        ],
    },
    {
        id: 'solarFlare',
        label: 'Solar flare',
        description: 'Pulsing radial burst with hot orange glow and intense flicker.',
        effects: [
            { type: 'explode', scope: 'global', enabled: true,
                values: { intensity: 0.5, centerX: 0, centerY: 0, centerZ: 0, speed: 1.0 } },
            { type: 'flicker', scope: 'global', enabled: true,
                values: { intensity: 0.5, speed: 20 } },
            { type: 'glow', scope: 'global', enabled: true,
                values: { intensity: 0.8, color: '#ff6622' } },
            { type: 'saturation', scope: 'global', enabled: true,
                values: { intensity: 1.0 } },
            { type: 'brightness', scope: 'global', enabled: true,
                values: { intensity: 0.4 } },
        ],
    },
    // -------------------------------------------------------------------------
    // Organic / liquid
    // -------------------------------------------------------------------------
    {
        id: 'inkInWater',
        label: 'Ink in water',
        description: 'Turbulent diffusion with deep blue tint fading into darkness.',
        effects: [
            { type: 'noise', scope: 'global', enabled: true,
                values: { intensity: 0.5, frequency: 0.5, speed: 0.3, noiseType: 7, axis: 3 } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.7, targetColor: '#0a2055' } },
            { type: 'saturation', scope: 'global', enabled: true,
                values: { intensity: 0.8 } },
            { type: 'depthFade', scope: 'global', enabled: true,
                values: { intensity: 0.55, near: 0.88, far: 1.0 } },
        ],
    },
    {
        id: 'plasmaLamp',
        label: 'Plasma lamp',
        description: 'Slow swirling perlin glow with cycling magenta-purple hues.',
        effects: [
            { type: 'noise', scope: 'global', enabled: true,
                values: { intensity: 0.3, frequency: 0.8, speed: 0.4, noiseType: 0, axis: 3 } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.5, targetColor: '#aa44ff' } },
            { type: 'hueShift', scope: 'global', enabled: true,
                values: { intensity: 0.6, speed: 0.4, spatial: 0.3 } },
            { type: 'glow', scope: 'global', enabled: true,
                values: { intensity: 0.6, color: '#ff44aa' } },
        ],
    },
    {
        id: 'fireflies',
        label: 'Fireflies at dusk',
        description: 'Twinkling warm bugs over a violet twilight sky.',
        effects: [
            { type: 'jitter', scope: 'global', enabled: true,
                values: { intensity: 0.06, speed: 6 } },
            { type: 'sparkle', scope: 'global', enabled: true,
                values: { intensity: 2, density: 0.18, speed: 4 } },
            { type: 'flicker', scope: 'global', enabled: true,
                values: { intensity: 0.3, speed: 8 } },
            { type: 'glow', scope: 'global', enabled: true,
                values: { intensity: 0.7, color: '#ffaa44' } },
            { type: 'colorShift', scope: 'global', enabled: true,
                values: { intensity: 0.3, targetColor: '#3a1a55' } },
        ],
    },
    // -------------------------------------------------------------------------
    // Party / playful
    // -------------------------------------------------------------------------
    {
        id: 'discoInferno',
        label: 'Disco inferno',
        description: 'Pulsing brightness, radial rainbow, dense sparkles, supersaturated.',
        effects: [
            { type: 'pulse', scope: 'global', enabled: true,
                values: { intensity: 0.6, speed: 3 } },
            { type: 'rainbow', scope: 'global', enabled: true,
                values: { intensity: 0.85, speed: 1.5, spatial: 1.0, direction: 3 } },
            { type: 'saturation', scope: 'global', enabled: true,
                values: { intensity: 1.3 } },
            { type: 'sparkle', scope: 'global', enabled: true,
                values: { intensity: 1.5, density: 0.2, speed: 10 } },
        ],
    },
    // -------------------------------------------------------------------------
    // Pointer-driven
    // -------------------------------------------------------------------------
    {
        id: 'pointerComet',
        label: 'Pointer comet',
        description: 'Cursor pushes particles outward and leaves a sparkling glowing trail. Move your mouse over the canvas.',
        pointerRadius: 0.7,
        effects: [
            // Baseline so something is visible even before the user moves the cursor.
            { type: 'wave', scope: 'global', enabled: true,
                values: { intensity: 0.1, frequency: 2, speed: 0.3, direction: 2 } },
            { type: 'displacement', scope: 'pointer', enabled: true,
                values: { intensity: 1.2 } },
            { type: 'sparkle', scope: 'pointer', enabled: true,
                values: { intensity: 2.5, density: 0.4, speed: 8 } },
            { type: 'glow', scope: 'pointer', enabled: true,
                values: { intensity: 1.0, color: '#ffeebb' } },
            { type: 'scale', scope: 'pointer', enabled: true,
                values: { intensity: 0.7, minScale: 1, maxScale: 3 } },
        ],
    },
];
export function instantiatePreset(preset: EffectPreset): ShaderEffect[] {
    return preset.effects.map((entry) => ({
        type: entry.type,
        instanceId: generateInstanceId(),
        scope: entry.scope,
        enabled: entry.enabled,
        values: { ...entry.values },
    }));
}
export function listPresets(): EffectPreset[] {
    return EFFECT_PRESETS;
}
export function getPreset(id: string): EffectPreset | undefined {
    return EFFECT_PRESETS.find((p) => p.id === id);
}
export function getRandomPreset(): EffectPreset {
    return EFFECT_PRESETS[Math.floor(Math.random() * EFFECT_PRESETS.length)];
}
