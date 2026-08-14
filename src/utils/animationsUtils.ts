// GSAP Mathematical Easing Functions
export const easingFunctions = {
    // Linear
    linear: (t) => t,
    // Power/Quad
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    // Cubic
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => (--t) * t * t + 1,
    easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    // Quart
    easeInQuart: (t) => t * t * t * t,
    easeOutQuart: (t) => 1 - (--t) * t * t * t,
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    // Quint
    easeInQuint: (t) => t * t * t * t * t,
    easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
    easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    // Sine
    easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: (t) => Math.sin(t * Math.PI / 2),
    easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    // Expo
    easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: (t) => {
        if (t === 0)
            return 0;
        if (t === 1)
            return 1;
        if (t < 0.5)
            return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    // Circ
    easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
    easeOutCirc: (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
    easeInOutCirc: (t) => {
        if (t < 0.5)
            return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
        return (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
    },
    // Back
    easeInBack: (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    easeOutBack: (t) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    easeInOutBack: (t) => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    // Elastic
    easeInElastic: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    easeOutElastic: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    easeInOutElastic: (t) => {
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    },
    // Bounce
    easeInBounce: (t) => 1 - easingFunctions.easeOutBounce(1 - t),
    easeOutBounce: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        }
        else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        }
        else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        }
        else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    easeInOutBounce: (t) => {
        return t < 0.5
            ? (1 - easingFunctions.easeOutBounce(1 - 2 * t)) / 2
            : (1 + easingFunctions.easeOutBounce(2 * t - 1)) / 2;
    }
};
// Helper function to apply easing to a value
export const applyEasing = (easingName: string, progress: number): number => {
    // console.log("Applying easing:", easingName);
    const easingFunction = easingFunctions[easingName];
    // console.log("Easing function found:", easingFunction);
    return easingFunction ? easingFunction(progress) : progress;
};
// GSAP easing string mappings for convenience
export const gsapEasingMap = {
    // Power
    'power1.in': 'easeInQuad',
    'power1.out': 'easeOutQuad',
    'power1.inOut': 'easeInOutQuad',
    'power2.in': 'easeInCubic',
    'power2.out': 'easeOutCubic',
    'power2.inOut': 'easeInOutCubic',
    'power3.in': 'easeInQuart',
    'power3.out': 'easeOutQuart',
    'power3.inOut': 'easeInOutQuart',
    'power4.in': 'easeInQuint',
    'power4.out': 'easeOutQuint',
    'power4.inOut': 'easeInOutQuint',
    // Sine
    'sine.in': 'easeInSine',
    'sine.out': 'easeOutSine',
    'sine.inOut': 'easeInOutSine',
    // Expo
    'expo.in': 'easeInExpo',
    'expo.out': 'easeOutExpo',
    'expo.inOut': 'easeInOutExpo',
    // Circ
    'circ.in': 'easeInCirc',
    'circ.out': 'easeOutCirc',
    'circ.inOut': 'easeInOutCirc',
    // Back
    'back.in': 'easeInBack',
    'back.out': 'easeOutBack',
    'back.inOut': 'easeInOutBack',
    // Elastic
    'elastic.in': 'easeInElastic',
    'elastic.out': 'easeOutElastic',
    'elastic.inOut': 'easeInOutElastic',
    // Bounce
    'bounce.in': 'easeInBounce',
    'bounce.out': 'easeOutBounce',
    'bounce.inOut': 'easeInOutBounce',
    // Linear
    'none': 'linear',
    'linear': 'linear'
};
