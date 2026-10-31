// =============================================================================
// fnPresets — ready-made functions (built-in, by reference 'preset:<id>')
// =============================================================================
//
// Named settings of library functions, grouped by what they are for, not by their math — the
// gallery's first tab and the AI's shortcuts. Like area / grid presets: scenes and layouts refer to
// a preset by id, so NEVER change one once shipped; a better version is a new id.
//
import type { FnRefObj } from './fnTypes';

export type FnPresetGroup = 'terrain' | 'organic' | 'motion' | 'arrangement' | 'signal';
export const FN_PRESET_GROUPS: ReadonlyArray<{ id: FnPresetGroup; label: string; description: string }> = [
    { id: 'terrain', label: 'Coast & terrain', description: 'Edges and heights of land and water.' },
    { id: 'organic', label: 'Organic', description: 'Clouds, marble, grain — natural textures.' },
    { id: 'motion', label: 'Motion', description: 'Rhythms and easings for things that move.' },
    { id: 'arrangement', label: 'Arrangement', description: 'How many things are laid out.' },
    { id: 'signal', label: 'Signal', description: 'Masks, thresholds and falloffs.' },
];

export interface FnPreset { id: string; name: string; description: string; group: FnPresetGroup; fn: FnRefObj }

export const FN_PRESETS: readonly FnPreset[] = [
    // terrain
    { id: 'ragged-coast', name: 'Ragged coast', description: 'A fractal shoreline — bays within bays.', group: 'terrain', fn: { id: 'layer.fbm', base: 'noise.simplex', params: { octaves: 5 } } },
    { id: 'gentle-hills', name: 'Gentle hills', description: 'Slow rolling bumps, no fine detail.', group: 'terrain', fn: { id: 'layer.fbm', base: 'noise.perlin', params: { octaves: 2 } } },
    { id: 'rocky-capes', name: 'Rocky capes', description: 'Sharp headlands pointing out to sea.', group: 'terrain', fn: { id: 'layer.ridged', base: 'noise.simplex', params: { octaves: 4 } } },
    { id: 'fjords', name: 'Fjords', description: 'Deep hooked inlets — the coast bent by itself.', group: 'terrain', fn: { id: 'layer.warp', base: 'noise.simplex', params: { octaves: 4, warp: 2.4 } } },
    { id: 'quarry', name: 'Quarry', description: 'Stepped, cut terraces.', group: 'terrain', fn: { id: 'layer.terrace', base: 'noise.perlin', params: { octaves: 3, steps: 5 } } },
    { id: 'scalloped-shore', name: 'Scalloped shore', description: 'Round coves between rounded points.', group: 'terrain', fn: { id: 'noise.worley' } },
    { id: 'dunes', name: 'Dunes', description: 'Long soft ridges.', group: 'terrain', fn: { id: 'layer.billow', base: 'noise.perlin', params: { octaves: 2 } } },
    // organic
    { id: 'cumulus', name: 'Cumulus', description: 'Puffy, rounded cloud lobes.', group: 'organic', fn: { id: 'layer.billow', base: 'noise.simplex', params: { octaves: 5 } } },
    { id: 'marble', name: 'Marble', description: 'Veins swirled through stone.', group: 'organic', fn: { id: 'layer.warp', base: 'noise.perlin', params: { octaves: 5, warp: 3.2 } } },
    { id: 'soft-grain', name: 'Soft grain', description: 'Fine, even roughness.', group: 'organic', fn: { id: 'layer.fbm', base: 'noise.value', params: { octaves: 6 } } },
    { id: 'cells', name: 'Cells', description: 'Cellular — scales, cracked mud, foam.', group: 'organic', fn: { id: 'noise.worley' } },
    { id: 'lightning-veins', name: 'Lightning veins', description: 'Thin bright ridges on a dark field.', group: 'organic', fn: { id: 'layer.ridged', base: 'noise.perlin', params: { octaves: 6 } } },
    // motion
    { id: 'heartbeat', name: 'Heartbeat', description: 'A short soft pulse each cycle.', group: 'motion', fn: { id: 'wave.pulse', params: { width: 0.18, softness: 0.6 } } },
    { id: 'breathing', name: 'Breathing', description: 'A slow, even in and out.', group: 'motion', fn: { id: 'wave.sine' } },
    { id: 'flicker', name: 'Flicker', description: 'Uneven, candle-like variation.', group: 'motion', fn: { id: 'layer.fbm', base: 'noise.value', params: { octaves: 3 } } },
    { id: 'snappy', name: 'Snappy', description: 'Fast out with a long settle.', group: 'motion', fn: { id: 'ease.expo' } },
    { id: 'natural', name: 'Natural', description: 'Slow start, slow end — the default feel.', group: 'motion', fn: { id: 'ease.inOut', params: { power: 2 } } },
    { id: 'playful', name: 'Playful', description: 'Overshoots and comes back.', group: 'motion', fn: { id: 'ease.back', params: { overshoot: 1.7 } } },
    { id: 'rubber', name: 'Rubber', description: 'Springs past and rings down.', group: 'motion', fn: { id: 'ease.elastic', params: { period: 0.35 } } },
    { id: 'drop', name: 'Drop', description: 'Lands and bounces to rest.', group: 'motion', fn: { id: 'ease.bounce' } },
    // arrangement
    { id: 'sunflower', name: 'Sunflower', description: 'Even points in a disc, no rows.', group: 'arrangement', fn: { id: 'sequence.phyllotaxis' } },
    { id: 'even-scatter', name: 'Even scatter', description: 'Even over a square, lightly jittered.', group: 'arrangement', fn: { id: 'sequence.halton', params: { jitter: 0.4 } } },
    { id: 'orchard', name: 'Orchard', description: 'Staggered rows.', group: 'arrangement', fn: { id: 'sequence.grid', params: { stagger: 0.5 } } },
    { id: 'galaxy', name: 'Galaxy', description: 'A three-turn spiral.', group: 'arrangement', fn: { id: 'sequence.spiral', params: { turns: 3 } } },
    { id: 'figure-eight', name: 'Figure eight', description: 'A looping path.', group: 'arrangement', fn: { id: 'sequence.lissajous', params: { a: 2, b: 1, delta: 0 } } },
    // signal
    { id: 'soft-mask', name: 'Soft mask', description: 'A wide, gentle 0 → 1.', group: 'signal', fn: { id: 'signal.smoothstep', params: { edge0: 0.1, edge1: 0.9 } } },
    { id: 'hard-edge', name: 'Hard edge', description: 'Off then on, halfway.', group: 'signal', fn: { id: 'signal.step', params: { edge: 0.5 } } },
    { id: 'spotlight', name: 'Spotlight', description: 'A bright centre fading out.', group: 'signal', fn: { id: 'signal.bell', params: { center: 0.5, width: 0.3 } } },
    { id: 'punchy', name: 'Punchy', description: 'More contrast in the middle.', group: 'signal', fn: { id: 'signal.gain', params: { k: 3 } } },
];
