import { waveEffect } from './wave';
import { vortexEffect } from './vortex';
import { rippleEffect } from './ripple';
import { scaleEffect } from './scale';
import { displacementEffect } from './displacement';
import { noiseEffect } from './noise';
import { twistEffect } from './twist';
import { magnetEffect } from './magnet';
import { jitterEffect } from './jitter';
import { explodeEffect } from './explode';
import { spiralEffect } from './spiral';
import { grayscaleEffect } from './grayscale';
import { glowEffect } from './glow';
import { colorShiftEffect } from './colorShift';
import { brightnessEffect } from './brightness';
import { pulseEffect } from './pulse';
import { hueShiftEffect } from './hueShift';
import { saturationEffect } from './saturation';
import { sparkleEffect } from './sparkle';
import { flickerEffect } from './flicker';
import { depthFadeEffect } from './depthFade';
import { rainbowEffect } from './rainbow';
import type { EffectDescriptor, EffectShaderStage, EffectScope } from "../types";

const ALL_DESCRIPTORS = [
    // Vertex
    waveEffect,
    vortexEffect,
    rippleEffect,
    scaleEffect,
    displacementEffect,
    noiseEffect,
    twistEffect,
    magnetEffect,
    jitterEffect,
    explodeEffect,
    spiralEffect,
    // Fragment
    grayscaleEffect,
    glowEffect,
    colorShiftEffect,
    brightnessEffect,
    pulseEffect,
    hueShiftEffect,
    saturationEffect,
    sparkleEffect,
    flickerEffect,
    depthFadeEffect,
    rainbowEffect,
];
export const EFFECT_REGISTRY: Record<string, EffectDescriptor> = Object.fromEntries(ALL_DESCRIPTORS.map((d) => [d.id, d]));
export function registerEffect(descriptor: EffectDescriptor): void {
    if (EFFECT_REGISTRY[descriptor.id]) {
        console.warn(`[effects] descriptor "${descriptor.id}" already registered; overwriting`);
    }
    EFFECT_REGISTRY[descriptor.id] = descriptor;
}
export function getDescriptor(id: string): EffectDescriptor | undefined {
    return EFFECT_REGISTRY[id];
}
export function listDescriptors(filter?: {
            stage?: EffectShaderStage;
            scope?: EffectScope;
        }): EffectDescriptor[] {
    const all = Object.values(EFFECT_REGISTRY);
    if (!filter)
        return all;
    return all.filter((d) => {
        if (filter.stage && d.stage !== filter.stage)
            return false;
        if (filter.scope && !d.allowedScopes.includes(filter.scope))
            return false;
        return true;
    });
}
