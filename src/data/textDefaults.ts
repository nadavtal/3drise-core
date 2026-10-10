import type { TextObjectConfig, TextObjectType } from "../types";

// =============================================================================
// TEXT OBJECTS — defaults, labels, animatable knobs
// =============================================================================
//
// The animatable list of each look is what its push point applies per frame
// (useTextObject -> the look's apply): the look's colours and numbers. Structural
// knobs (text, font, draw / erase methods, a look's detail count), switches and
// the playback timings are never listed.
//

export const DEFAULT_TEXT_OBJECTS: Record<TextObjectType, TextObjectConfig> = {
    handwriting: { type: 'handwriting', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'pen', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'fade', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, color: '#efe6d2', color2: '#ffd9a0', weight: 1, wetTime: 1.1, sheen: 0.35, opacity: 1, penGlow: 1 },
    neonTube: { type: 'neonTube', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'trace', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'undraw', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, color: '#ff2f9a', color2: '#ffd2ec', tube: 0.04, core: 0.22, glow: 1, flicker: 1, offLevel: 0.07, opacity: 1 },
    fourierSketch: { type: 'fourierSketch', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'epicycle', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'fade', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, color: '#5fd0ff', color2: '#fff1c2', line: 0.03, terms: 96, circles: 1, trail: 0.9, bridges: 0.14, glint: 1, opacity: 1 },
    frostGrowth: { type: 'frostGrowth', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'grow', drawDuration: 6, drawEase: 'linear', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'sublimate', eraseDuration: 3, eraseEase: 'linear', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, reach: 0.15, branching: 1, grains: 5, sparkle: 0.6, thickness: 1, seams: 0.75, haze: 0.5, seed: 7, color: '#d6edff', color2: '#4a90d4', opacity: 1 },
    plasmaDischarge: { type: 'plasmaDischarge', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'strike', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'undraw', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, branches: 0.72, reach: 0.55, branchiness: 0.6, pulse: 0.8, glow: 1, spectrum: 0.5, core: 0.0065, color: '#6c3dff', color2: '#a9ceff', opacity: 1, seed: 7 },
    burnAway: { type: 'burnAway', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'trace', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'burn', eraseDuration: 6, eraseEase: 'linear', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2.5, hiddenTime: 0.5, color: '#efe2c4', color2: '#ff7a1c', char: 0.6, ashLace: 0.7, curl: 0.6, spread: 1, ember: 1, roughness: 0.6, singe: 0.55, opacity: 1, seed: 7 },
    lightPainting: { type: 'lightPainting', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'pen', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'pen', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, exposure: 1, temperature: 3000, sparks: 110, spread: 0.7, bloom: 1, width: 0.012, strobe: 0, halation: 0.55, tremor: 0.5, color: '#ffe0b0', color2: '#ffffff', opacity: 1 },
    constellation: { type: 'constellation', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'pen', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'undraw', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, stars: 5.5, brightness: 0, twinkle: 1, lines: 1, temperature: 0, seed: 7, color: '#7f9bd0', color2: '#dce8ff', opacity: 1 },
    inkBleed: { type: 'inkBleed', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'pen', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'burn', eraseDuration: 6, eraseEase: 'linear', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2.5, hiddenTime: 0.5, color: '#1b2d6a', color2: '#b0703c', bleed: 0.042, dryTime: 2.4, fibre: 0.7, pooling: 0.7, weight: 0.7, paper: 1, oxidation: 3.5, burn: 0.6, char: 0.6, spread: 1, opacity: 1 },
    liquidMetal: { type: 'liquidMetal', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'flow', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'melt', eraseDuration: 4.5, eraseEase: 'linear', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, thickness: 0.06, roughness: 1, reflectivity: 0.8, environment: 1.15, tint: 0.7, rippleSpeed: 1, oxide: 0.4, spikes: 0, melt: 0.5, drips: 0.6, color: '#cdd5df', color2: '#f4f7ff', opacity: 1 },
    embroidery: { type: 'embroidery', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'stitch', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'undraw', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, color: '#c92f48', color2: '#e8c47a', density: 44, slant: 66, thickness: 1.35, sheen: 1, relief: 1, outline: 0.65, fabric: 0.4, pucker: 0.6, style: 'auto', opacity: 1 },
    chalkboard: { type: 'chalkboard', shown: true, text: 'Hello, world', font: 'caveat', drawMethod: 'pen', drawDuration: 5, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'smudge', eraseDuration: 2, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, pressure: 0.55, chatter: 0.6, grain: 0.55, weight: 1, dust: 0.6, ghost: 0.5, swing: 0.6, board: 0, opacity: 1, color: '#ebe6d8', color2: '#c4dcf2' },
    plain: { type: 'plain', shown: true, text: 'Hello', font: 'inter', drawMethod: 'fade', drawDuration: 1.2, drawEase: 'easeInOut', drawStagger: 0.6, drawAngle: 0, eraseMethod: 'fade', eraseDuration: 0.8, eraseEase: 'easeInOut', eraseStagger: 0.6, eraseAngle: 0, autoPlay: true, loop: false, yoyo: false, holdTime: 2, hiddenTime: 0.5, color: '#ffffff', color2: '#111111', weight: 0, outline: 0, fill: 1, softness: 0, opacity: 1 },
};

export const TEXT_OBJECT_LABELS: Record<TextObjectType, string> = {
    handwriting: 'Handwriting',
    neonTube: 'Neon Tube',
    fourierSketch: 'Fourier Sketch',
    frostGrowth: 'Frost Growth',
    plasmaDischarge: 'Plasma Discharge',
    burnAway: 'Burn Away',
    lightPainting: 'Light Painting',
    constellation: 'Constellation',
    inkBleed: 'Ink Bleed',
    liquidMetal: 'Liquid Metal',
    embroidery: 'Embroidery',
    chalkboard: 'Chalkboard',
    plain: 'Plain',
};

export const TEXT_OBJECTS_ANIMATABLE: Record<TextObjectType, { value: string; label: string }[]> = {
    handwriting: [
        { value: 'weight', label: 'Pen weight' },
        { value: 'color', label: 'Ink' },
        { value: 'color2', label: 'Wet ink' },
        { value: 'wetTime', label: 'Drying time' },
        { value: 'sheen', label: 'Sheen' },
        { value: 'penGlow', label: 'Pen glow' },
        { value: 'opacity', label: 'Opacity' },
    ],
    neonTube: [
        { value: 'color', label: 'Tube colour' },
        { value: 'glow', label: 'Glow' },
        { value: 'tube', label: 'Tube thickness' },
        { value: 'flicker', label: 'Flicker' },
        { value: 'color2', label: 'Hot core' },
        { value: 'core', label: 'Core width' },
        { value: 'offLevel', label: 'Unlit glass' },
        { value: 'opacity', label: 'Opacity' },
    ],
    fourierSketch: [
        { value: 'color', label: 'Line colour' },
        { value: 'circles', label: 'Circles' },
        { value: 'glint', label: 'Glints' },
        { value: 'color2', label: 'Hot colour' },
        { value: 'line', label: 'Line width' },
        { value: 'trail', label: 'Trail' },
        { value: 'bridges', label: 'Bridges' },
        { value: 'opacity', label: 'Opacity' },
    ],
    frostGrowth: [
        { value: 'sparkle', label: 'Sparkle' },
        { value: 'thickness', label: 'Thickness' },
        { value: 'seams', label: 'Grain seams' },
        { value: 'haze', label: 'Frost haze' },
        { value: 'color', label: 'Ice' },
        { value: 'color2', label: 'Deep ice' },
        { value: 'opacity', label: 'Opacity' },
    ],
    plasmaDischarge: [
        { value: 'branches', label: 'Branching' },
        { value: 'reach', label: 'Reach' },
        { value: 'glow', label: 'Glow' },
        { value: 'pulse', label: 'Current pulses' },
        { value: 'spectrum', label: 'Emission lines' },
        { value: 'core', label: 'Core width' },
        { value: 'color', label: 'Plasma' },
        { value: 'color2', label: 'Hot core' },
        { value: 'opacity', label: 'Opacity' },
    ],
    burnAway: [
        { value: 'char', label: 'Char' },
        { value: 'spread', label: 'Spread' },
        { value: 'ember', label: 'Ember' },
        { value: 'color', label: 'Paper' },
        { value: 'color2', label: 'Ember colour' },
        { value: 'roughness', label: 'Raggedness' },
        { value: 'singe', label: 'Singe' },
        { value: 'ashLace', label: 'Ash lace' },
        { value: 'curl', label: 'Curl' },
        { value: 'opacity', label: 'Opacity' },
    ],
    lightPainting: [
        { value: 'exposure', label: 'Exposure' },
        { value: 'temperature', label: 'Temperature' },
        { value: 'strobe', label: 'Strobe' },
        { value: 'sparks', label: 'Sparks' },
        { value: 'width', label: 'Trail width' },
        { value: 'halation', label: 'Halation' },
        { value: 'spread', label: 'Spread' },
        { value: 'bloom', label: 'Bloom' },
        { value: 'color', label: 'Colour' },
        { value: 'color2', label: 'Hot core' },
        { value: 'opacity', label: 'Opacity' },
    ],
    constellation: [
        { value: 'brightness', label: 'Brightness' },
        { value: 'temperature', label: 'Temperature' },
        { value: 'lines', label: 'Chart lines' },
        { value: 'twinkle', label: 'Twinkle' },
        { value: 'color', label: 'Line colour' },
        { value: 'color2', label: 'Highlight / tint' },
        { value: 'opacity', label: 'Opacity' },
    ],
    inkBleed: [
        { value: 'bleed', label: 'Bleed' },
        { value: 'color', label: 'Ink' },
        { value: 'weight', label: 'Pen weight' },
        { value: 'paper', label: 'Paper' },
        { value: 'color2', label: 'Fringe dye' },
        { value: 'dryTime', label: 'Drying time' },
        { value: 'fibre', label: 'Fibre' },
        { value: 'pooling', label: 'Pooling' },
        { value: 'oxidation', label: 'Oxidation' },
        { value: 'burn', label: 'Ink burn' },
        { value: 'char', label: 'Char' },
        { value: 'spread', label: 'Spread' },
        { value: 'opacity', label: 'Opacity' },
    ],
    liquidMetal: [
        { value: 'thickness', label: 'Thickness' },
        { value: 'environment', label: 'Environment' },
        { value: 'color', label: 'Metal colour' },
        { value: 'tint', label: 'Metal tint' },
        { value: 'melt', label: 'Melt' },
        { value: 'drips', label: 'Drips' },
        { value: 'spikes', label: 'Spikes' },
        { value: 'oxide', label: 'Oxide skin' },
        { value: 'reflectivity', label: 'Reflectivity' },
        { value: 'roughness', label: 'Ripples' },
        { value: 'rippleSpeed', label: 'Ripple speed' },
        { value: 'color2', label: 'Edge tint' },
        { value: 'opacity', label: 'Opacity' },
    ],
    embroidery: [
        { value: 'color', label: 'Thread' },
        { value: 'sheen', label: 'Sheen' },
        { value: 'color2', label: 'Contrast thread' },
        { value: 'relief', label: 'Relief' },
        { value: 'outline', label: 'Border row' },
        { value: 'fabric', label: 'Fabric' },
        { value: 'pucker', label: 'Pucker' },
        { value: 'opacity', label: 'Opacity' },
    ],
    chalkboard: [
        { value: 'pressure', label: 'Pressure' },
        { value: 'chatter', label: 'Chatter' },
        { value: 'grain', label: 'Grain' },
        { value: 'dust', label: 'Dust' },
        { value: 'weight', label: 'Weight' },
        { value: 'swing', label: 'Swing' },
        { value: 'ghost', label: 'Ghost' },
        { value: 'board', label: 'Board' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'color', label: 'Chalk' },
        { value: 'color2', label: 'Highlight' },
    ],
    plain: [
        { value: 'color', label: 'Colour' },
        { value: 'weight', label: 'Weight' },
        { value: 'outline', label: 'Outline' },
        { value: 'opacity', label: 'Opacity' },
        { value: 'color2', label: 'Outline colour' },
        { value: 'fill', label: 'Fill' },
        { value: 'softness', label: 'Softness' },
    ],
};

/** The typefaces every look can use: the id is stored, the family is the Google Fonts name used to preview it. */
export const TEXT_FONTS: ReadonlyArray<{ id: string; label: string; family: string }> = [
    // clean text faces (plain labels, mesh text)
    { id: 'inter', label: 'Inter', family: 'Inter' },
    { id: 'roboto', label: 'Roboto', family: 'Roboto' },
    { id: 'montserrat', label: 'Montserrat', family: 'Montserrat' },
    { id: 'poppins', label: 'Poppins', family: 'Poppins' },
    { id: 'oswald', label: 'Oswald', family: 'Oswald' },
    { id: 'bebas-neue', label: 'Bebas Neue', family: 'Bebas Neue' },
    { id: 'playfair-display', label: 'Playfair Display', family: 'Playfair Display' },
    { id: 'lora', label: 'Lora', family: 'Lora' },
    // handwriting faces (the pen looks)
    { id: 'caveat', label: 'Caveat', family: 'Caveat' },
    { id: 'kalam', label: 'Kalam', family: 'Kalam' },
    { id: 'handlee', label: 'Handlee', family: 'Handlee' },
    { id: 'patrick-hand', label: 'Patrick Hand', family: 'Patrick Hand' },
    { id: 'architects-daughter', label: 'Architect\'s Daughter', family: 'Architects Daughter' },
    { id: 'indie-flower', label: 'Indie Flower', family: 'Indie Flower' },
    { id: 'gochi-hand', label: 'Gochi Hand', family: 'Gochi Hand' },
    { id: 'nanum-pen-script', label: 'Nanum Pen', family: 'Nanum Pen Script' },
    { id: 'mynerve', label: 'Mynerve', family: 'Mynerve' },
    { id: 'dancing-script', label: 'Dancing Script', family: 'Dancing Script' },
    { id: 'courgette', label: 'Courgette', family: 'Courgette' },
    { id: 'satisfy', label: 'Satisfy', family: 'Satisfy' },
    { id: 'kaushan-script', label: 'Kaushan Script', family: 'Kaushan Script' },
    { id: 'sriracha', label: 'Sriracha', family: 'Sriracha' },
    { id: 'pacifico', label: 'Pacifico', family: 'Pacifico' },
];

/** True when the config is one of the text looks (object type 'text', config.type set). */
export function isTextObjectConfig(config: unknown): config is TextObjectConfig {
    const t = (config as { type?: unknown } | null | undefined)?.type;
    return typeof t === 'string' && Object.prototype.hasOwnProperty.call(DEFAULT_TEXT_OBJECTS, t);
}
