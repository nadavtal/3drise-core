export const easingFunctions: Record<string, (t: number) => number> = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => --t * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - --t * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 + --t * t * t * t * t,
    easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: (t) => Math.sin(t * Math.PI / 2),
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t) => {
        if (t === 0 || t === 1)
            return t;
        return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: (t) => Math.sqrt(1 - --t * t),
    easeInOutCirc: (t) => t < 0.5
        ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
        : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2,
    easeInBack: (t) => { const c = 1.70158; return t * t * ((c + 1) * t - c); },
    easeOutBack: (t) => { const c = 1.70158; return 1 + --t * t * ((c + 1) * t + c); },
    easeInOutBack: (t) => {
        const c = 1.70158 * 1.525;
        return t < 0.5
            ? (2 * t) ** 2 * ((c + 1) * 2 * t - c) / 2
            : ((2 * t - 2) ** 2 * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
    },
    easeInElastic: (t) => {
        if (t === 0 || t === 1)
            return t;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
    },
    easeOutElastic: (t) => {
        if (t === 0 || t === 1)
            return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },
    easeInOutElastic: (t) => {
        if (t === 0 || t === 1)
            return t;
        return t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1;
    },
    easeInBounce: (t) => 1 - easingFunctions.easeOutBounce(1 - t),
    easeOutBounce: (t) => {
        if (t < 1 / 2.75)
            return 7.5625 * t * t;
        if (t < 2 / 2.75)
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75)
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    easeInOutBounce: (t) => t < 0.5
        ? (1 - easingFunctions.easeOutBounce(1 - 2 * t)) / 2
        : (1 + easingFunctions.easeOutBounce(2 * t - 1)) / 2,
};
export const applyEasing = (easingName: string, progress: number): number => {
    const fn = easingFunctions[easingName];
    return fn ? fn(progress) : progress;
};
export const gsapEasingMap: Record<string, string> = {
    'power1.in': 'easeInQuad', 'power1.out': 'easeOutQuad', 'power1.inOut': 'easeInOutQuad',
    'power2.in': 'easeInCubic', 'power2.out': 'easeOutCubic', 'power2.inOut': 'easeInOutCubic',
    'power3.in': 'easeInQuart', 'power3.out': 'easeOutQuart', 'power3.inOut': 'easeInOutQuart',
    'power4.in': 'easeInQuint', 'power4.out': 'easeOutQuint', 'power4.inOut': 'easeInOutQuint',
    'sine.in': 'easeInSine', 'sine.out': 'easeOutSine', 'sine.inOut': 'easeInOutSine',
    'expo.in': 'easeInExpo', 'expo.out': 'easeOutExpo', 'expo.inOut': 'easeInOutExpo',
    'circ.in': 'easeInCirc', 'circ.out': 'easeOutCirc', 'circ.inOut': 'easeInOutCirc',
    'back.in': 'easeInBack', 'back.out': 'easeOutBack', 'back.inOut': 'easeInOutBack',
    'elastic.in': 'easeInElastic', 'elastic.out': 'easeOutElastic', 'elastic.inOut': 'easeInOutElastic',
    'bounce.in': 'easeInBounce', 'bounce.out': 'easeOutBounce', 'bounce.inOut': 'easeInOutBounce',
    'linear': 'linear',
};
export const resolveEasing = (ease: string): string => gsapEasingMap[ease] ?? ease;
