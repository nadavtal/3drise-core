import type { GenerativeParticlesConfig, GenerativeParticlesType } from "../types";

// =============================================================================
// GENERATIVE PARTICLES — defaults (identical to packages/viewer/particles-defaults.json)
// =============================================================================
export const DEFAULT_GENERATIVE_PARTICLES: Record<GenerativeParticlesType, GenerativeParticlesConfig> = {
    tidalStream: { type: 'tidalStream', enabled: true, intensity: 1, speed: 1, opacity: 0.9, size: 1, color: '#8cbcff', particleCount: 18000, satelliteCount: 2, satelliteMass: 0.0005, orbitEccentricity: 0.5, streamAge: 2.2, dopplerScale: 2, redshiftColor: '#ffa070', discStars: 70000, armCount: 2, nebulaColor: '#ff5c8a', starSize: 1, pointerMode: 'subhalo', pointerStrength: 1, pointerRadius: 1, pointerColor: '#ffd29a', trailMode: 'comet', trailLength: 1.6, trailOpacity: 0.55, trailColor: '#7fa8ff', trailShare: 0.25 },
    brownianDust: { type: 'brownianDust', enabled: true, intensity: 1, speed: 1, opacity: 0.9, size: 1, color: '#ffd7a1', particleCount: 5000, temperature: 1, turbulence: 1, beamAngle: 38, beamWidth: 0.32, windowPanes: 3, anisotropy: 0.7, hazeDensity: 1, aperture: 0.6, ambientColor: '#7892b8', pointerMode: 'hand', pointerStrength: 1, pointerRadius: 1, pointerColor: '#ffe7c2', trailMode: 'comet', trailLength: 2.5, trailOpacity: 0.5, trailColor: '#ffb870', trailShare: 0.3 },
    bioluminescentWake: { type: 'bioluminescentWake', enabled: true, intensity: 1, speed: 1, opacity: 0.9, size: 1, color: '#3cc3ff', particleCount: 36000, swellHeight: 1, current: 0.3, sensitivity: 1, recovery: 6, glowTime: 1, waterClarity: 1, deepColor: '#1a8f8a', moonlight: 0.6, seed: 1, quality: 'medium', pointerMode: 'fish', pointerStrength: 1, pointerRadius: 1, pointerColor: '#dff4ff', trailMode: 'streak', trailLength: 1.5, trailOpacity: 0.6, trailColor: '#2f7dff', trailShare: 1 },
    electronOrbitals: { type: 'electronOrbitals', enabled: true, intensity: 1, speed: 1, opacity: 0.9, size: 1, color: '#6fd6ff', particleCount: 24000, stateA: '4f+2', stateB: '3d+1', mix: 0.35, timeScale: 1, phaseColor: '#ff6ad5', cloudDensity: 0.7, phaseFronts: 1, pointSize: 0.8, seed: 1, quality: 'medium', pointerMode: 'photon', pointerStrength: 1, pointerRadius: 1, pointerColor: '#fff2c4', trailMode: 'comet', trailLength: 2.5, trailOpacity: 0.45, trailColor: '#7a8cff', trailShare: 0.3 },
    grinderSparks: { type: 'grinderSparks', enabled: true, intensity: 1, speed: 1, opacity: 0.9, size: 1, color: '#fff1d6', particleCount: 12000, sparkRate: 1, wheelSpeed: 35, sprayAngle: 14, carbon: 0.5, temperature: 2000, exposure: 1, floorReflect: 0.35, emberColor: '#ff3a12', seed: 1, quality: 'medium', pointerMode: 'wheel', pointerStrength: 1, pointerRadius: 1, pointerColor: '#ffd9a0', trailMode: 'comet', trailLength: 0.9, trailOpacity: 0.9, trailColor: '#ff7a2e', trailShare: 1 },
};

export const GENERATIVE_PARTICLES_LABELS: Record<GenerativeParticlesType, string> = {
    tidalStream: 'Tidal Stream',
    brownianDust: 'Sunbeam Dust',
    bioluminescentWake: 'Sea Sparkle',
    electronOrbitals: 'Quantum Orbitals',
    grinderSparks: 'Grinder Sparks',
};

/** True when a particles object's config is a generative particle object (not the legacy shape particles). */
export function isGenerativeParticlesConfig(config: unknown): config is GenerativeParticlesConfig {
    const t = (config as { type?: unknown } | null | undefined)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_GENERATIVE_PARTICLES, t);
}
