// =============================================================================
// fnCurves — the curve-shaped functions: easing (how a motion starts and ends) and signal
// (shaping a 0..1 value). t in 0..1 → 0..1 (easings may overshoot: back, elastic)
// =============================================================================
//
// Every curve has a GLSL twin `float fn_x(float t, <params>)` for use in shaders (fades, pulses,
// animated materials). The TS side is the one animation and layouts use.
//
import type { CurveFnDef, CurveSampler, FnParam, FnParams } from './fnTypes';

const R01: [number, number] = [0, 1];
const PI = Math.PI;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const curve = (family: 'ease' | 'signal', id: string, name: string, description: string, goodFor: string[], params: FnParam[], sampler: (p: FnParams, seed: number) => CurveSampler, body: string, range: [number, number] = R01): CurveFnDef => {
    const args = params.map((p) => `, float ${p.key}`).join('');
    return { id, name, family, shape: 'curve', range, description, goodFor, params, sampler, glsl: { name: `fn_${id.split('.')[1]}`, chunk: `\nfloat fn_${id.split('.')[1]}(float t${args}) {\n${body}\n}` } };
};

// ---------------------------------------------------------------------------- easing
const POWER: FnParam = { key: 'power', label: 'Power', min: 1, max: 6, step: 0.1, default: 2, tip: '1 is linear; higher is a slower start (or end) and a sharper finish.' };
export const FN_EASE_DEFS: CurveFnDef[] = [
    curve('ease', 'ease.linear', 'Linear', 'No easing — constant speed.', ['Mechanical motion', 'Conveyor belts', 'Reference'], [], () => (t) => t, `    return t;`),
    curve('ease', 'ease.in', 'Ease in', 'Starts slow, finishes fast.', ['Falling', 'Accelerating away', 'Anticipation'], [POWER],
        (p) => { const k = p.power; return (t) => Math.pow(t, k); }, `    return pow(t, power);`),
    curve('ease', 'ease.out', 'Ease out', 'Starts fast, settles slow.', ['Arriving', 'Decelerating to rest', 'UI reveals'], [POWER],
        (p) => { const k = p.power; return (t) => 1 - Math.pow(1 - t, k); }, `    return 1.0 - pow(1.0 - t, power);`),
    curve('ease', 'ease.inOut', 'Ease in-out', 'Slow at both ends, fast in the middle.', ['Camera moves', 'Doors', 'Anything that should feel natural'], [POWER],
        (p) => { const k = p.power; return (t) => t < 0.5 ? Math.pow(2 * t, k) / 2 : 1 - Math.pow(2 - 2 * t, k) / 2; },
        `    return t < 0.5 ? pow(2.0 * t, power) * 0.5 : 1.0 - pow(2.0 - 2.0 * t, power) * 0.5;`),
    curve('ease', 'ease.sine', 'Sine in-out', 'The gentlest in-out.', ['Breathing', 'Floating', 'Soft loops'], [],
        () => (t) => -(Math.cos(PI * t) - 1) / 2, `    return -(cos(3.141592653589793 * t) - 1.0) * 0.5;`),
    curve('ease', 'ease.expo', 'Exponential out', 'Very fast start that eases out for a long time.', ['Snappy UI', 'Camera settles', 'Dashes'], [],
        () => (t) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t), `    return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t);`),
    curve('ease', 'ease.back', 'Back out', 'Overshoots the target, then comes back.', ['Playful pops', 'Cards sliding in', 'Emphasis'],
        [{ key: 'overshoot', label: 'Overshoot', min: 0, max: 4, step: 0.05, default: 1.7, tip: 'How far past the target it goes before settling.' }],
        (p) => { const s = p.overshoot; return (t) => { const u = t - 1; return 1 + u * u * ((s + 1) * u + s); }; },
        `    float u = t - 1.0; return 1.0 + u * u * ((overshoot + 1.0) * u + overshoot);`, [-0.2, 1.4]),
    curve('ease', 'ease.elastic', 'Elastic out', 'Springs past and rings down.', ['Boings', 'Rubber bands', 'Wobbly arrivals'],
        [{ key: 'period', label: 'Period', min: 0.1, max: 1, step: 0.01, default: 0.3, tip: 'How fast it rings — small is a fast buzz, large is a slow sway.' }],
        (p) => { const per = p.period; return (t) => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - per / 4) * (2 * PI) / per) + 1; },
        `    if (t <= 0.0) return 0.0; if (t >= 1.0) return 1.0; return pow(2.0, -10.0 * t) * sin((t - period / 4.0) * 6.283185307179586 / period) + 1.0;`, [-0.4, 1.4]),
    curve('ease', 'ease.bounce', 'Bounce out', 'Lands and bounces to rest.', ['Dropping objects', 'Balls', 'Fun UI'], [],
        () => (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; } if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; } t -= 2.625 / d; return n * t * t + 0.984375; },
        `    const float n = 7.5625, d = 2.75;
    if (t < 1.0 / d) return n * t * t;
    if (t < 2.0 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
    if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
    t -= 2.625 / d; return n * t * t + 0.984375;`),
    curve('ease', 'ease.spring', 'Spring', 'A damped spring settling on the target.', ['Physical UI', 'Camera follow', 'Dangling things'],
        [{ key: 'stiffness', label: 'Stiffness', min: 2, max: 40, step: 0.5, default: 12, tip: 'How fast it oscillates — a stiff spring rings faster.' },
         { key: 'damping', label: 'Damping', min: 0, max: 1, step: 0.01, default: 0.4, tip: '0 keeps ringing, 1 is critically damped (no overshoot).' }],
        (p) => { const w = p.stiffness, z = p.damping; return (t) => { if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t); const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }; },
        `    if (damping >= 1.0) return 1.0 - (1.0 + stiffness * t) * exp(-stiffness * t);
    float wd = stiffness * sqrt(1.0 - damping * damping);
    return 1.0 - exp(-damping * stiffness * t) * (cos(wd * t) + (damping * stiffness / wd) * sin(wd * t));`, [-0.4, 1.4]),
];

// ---------------------------------------------------------------------------- signal
export const FN_SIGNAL_DEFS: CurveFnDef[] = [
    curve('signal', 'signal.smoothstep', 'Smoothstep', 'A soft S from 0 to 1 between two edges.', ['Soft masks', 'Fades', 'Blending zones'],
        [{ key: 'edge0', label: 'From', min: 0, max: 1, step: 0.01, default: 0.25, tip: 'Where the rise starts.' }, { key: 'edge1', label: 'To', min: 0, max: 1, step: 0.01, default: 0.75, tip: 'Where it reaches 1.' }],
        (p) => { const a = p.edge0, b = Math.max(p.edge0 + 1e-4, p.edge1); return (t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); }; },
        `    float x = clamp((t - edge0) / max(1e-4, edge1 - edge0), 0.0, 1.0); return x * x * (3.0 - 2.0 * x);`),
    curve('signal', 'signal.smootherstep', 'Smootherstep', 'Like smoothstep with flatter ends — no visible kink.', ['Terrain blends', 'Very soft fades'],
        [{ key: 'edge0', label: 'From', min: 0, max: 1, step: 0.01, default: 0.25, tip: 'Where the rise starts.' }, { key: 'edge1', label: 'To', min: 0, max: 1, step: 0.01, default: 0.75, tip: 'Where it reaches 1.' }],
        (p) => { const a = p.edge0, b = Math.max(p.edge0 + 1e-4, p.edge1); return (t) => { const x = clamp01((t - a) / (b - a)); return x * x * x * (x * (x * 6 - 15) + 10); }; },
        `    float x = clamp((t - edge0) / max(1e-4, edge1 - edge0), 0.0, 1.0); return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);`),
    curve('signal', 'signal.step', 'Step', 'Hard on / off at an edge.', ['Thresholds', 'Hard masks', 'Cel shading'],
        [{ key: 'edge', label: 'Edge', min: 0, max: 1, step: 0.01, default: 0.5, tip: 'Below it 0, from it on 1.' }],
        (p) => { const e = p.edge; return (t) => t < e ? 0 : 1; }, `    return t < edge ? 0.0 : 1.0;`),
    curve('signal', 'signal.gain', 'Gain', 'Pushes values toward the ends (contrast) or the middle.', ['Contrast', 'Sharper noise', 'Flattening'],
        [{ key: 'k', label: 'Gain', min: 0.1, max: 8, step: 0.1, default: 2, tip: 'Above 1 steepens the middle (more contrast); below 1 flattens it.' }],
        (p) => { const k = p.k; return (t) => { const a = 0.5 * Math.pow(2 * (t < 0.5 ? t : 1 - t), k); return t < 0.5 ? a : 1 - a; }; },
        `    float a = 0.5 * pow(2.0 * (t < 0.5 ? t : 1.0 - t), k); return t < 0.5 ? a : 1.0 - a;`),
    curve('signal', 'signal.bias', 'Bias', 'Bends the whole curve up or down.', ['Brightening', 'Shifting density', 'Weighting toward one end'],
        [{ key: 'b', label: 'Bias', min: 0.01, max: 0.99, step: 0.01, default: 0.5, tip: '0.5 is straight; lower pulls values down, higher pushes them up.' }],
        (p) => { const b = p.b; return (t) => t / ((1 / b - 2) * (1 - t) + 1); }, `    return t / ((1.0 / b - 2.0) * (1.0 - t) + 1.0);`),
    curve('signal', 'signal.bell', 'Bell', 'A bump around a centre — a gaussian.', ['Spotlights', 'Soft brushes', 'Peaks in a profile'],
        [{ key: 'center', label: 'Centre', min: 0, max: 1, step: 0.01, default: 0.5, tip: 'Where the bump peaks.' }, { key: 'width', label: 'Width', min: 0.02, max: 1, step: 0.01, default: 0.25, tip: 'How wide the bump is.' }],
        (p) => { const c = p.center, w = p.width; return (t) => { const d = (t - c) / w; return Math.exp(-4 * d * d); }; }, `    float d = (t - center) / width; return exp(-4.0 * d * d);`),
    curve('signal', 'signal.gamma', 'Gamma', 'A power curve — the classic brightness curve.', ['Tone curves', 'Density falloff', 'Simple falloff'],
        [{ key: 'gamma', label: 'Gamma', min: 0.2, max: 5, step: 0.05, default: 2.2, tip: 'Above 1 darkens the middle, below 1 lifts it.' }],
        (p) => { const g = p.gamma; return (t) => Math.pow(clamp01(t), g); }, `    return pow(clamp(t, 0.0, 1.0), gamma);`),
];
