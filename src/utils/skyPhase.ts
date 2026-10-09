/**
 * Time-of-day phases, keyed by SUN ELEVATION — never by the clock.
 *
 * Everything that changes with the time of day (the Preetham atmosphere, star
 * visibility, labels) reads these, so they all turn at the moment the sun
 * actually crosses the horizon, whatever sunrise/sunset hours or sun model is in
 * use. There used to be six hour tables that disagreed by up to 1.5 h.
 *
 * Keys, in degrees of sun elevation:
 *   night     ≤ −12  (astronomical-ish: sky fully dark)
 *   twilight    −4   (blue hour, sun just below the horizon)
 *   golden       3   (sun on the horizon: reddest, haziest)
 *   day       ≥ 15
 * Between two keys the weights cross-fade with a smoothstep; they always sum to 1.
 */

export interface SkyPhaseWeights {
    night: number;
    twilight: number;
    golden: number;
    day: number;
}

export interface SkyAtmosphere {
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
}

export const SKY_PHASE_ELEVATIONS = { night: -12, twilight: -4, golden: 3, day: 15 } as const;

/** Built-in atmospheres for the non-day phases. The day look is the user's own
 *  sky settings (see atmosphereForSunElevation). */
export const SKY_PHASE_ATMOSPHERES: Record<'night' | 'twilight' | 'golden', SkyAtmosphere> = {
    night: { turbidity: 0.5, rayleigh: 0.1, mieCoefficient: 0.001, mieDirectionalG: 0.8 },
    twilight: { turbidity: 2.5, rayleigh: 2.0, mieCoefficient: 0.008, mieDirectionalG: 0.86 },
    golden: { turbidity: 4.5, rayleigh: 3.5, mieCoefficient: 0.012, mieDirectionalG: 0.92 },
};

const smooth = (t: number) => {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
};

/** Phase weights for a sun elevation in degrees. Sum to 1. */
export function skyPhaseWeights(sunElevation: number, out?: SkyPhaseWeights): SkyPhaseWeights {
    const w = out ?? { night: 0, twilight: 0, golden: 0, day: 0 };
    w.night = 0; w.twilight = 0; w.golden = 0; w.day = 0;
    const { night, twilight, golden, day } = SKY_PHASE_ELEVATIONS;
    if (sunElevation <= night) { w.night = 1; return w; }
    if (sunElevation >= day) { w.day = 1; return w; }
    if (sunElevation < twilight) {
        const t = smooth((sunElevation - night) / (twilight - night));
        w.night = 1 - t; w.twilight = t;
    }
    else if (sunElevation < golden) {
        const t = smooth((sunElevation - twilight) / (golden - twilight));
        w.twilight = 1 - t; w.golden = t;
    }
    else {
        const t = smooth((sunElevation - golden) / (day - golden));
        w.golden = 1 - t; w.day = t;
    }
    return w;
}

/**
 * The Preetham atmosphere for a sun elevation: the user's `day` look by day,
 * blended through golden hour and twilight into night as the sun goes down.
 * The user's sliders, keyframes and pointer bindings keep working with the clock
 * on — they shape the day, and time of day adds the evening around it.
 */
export function atmosphereForSunElevation(sunElevation: number, day: SkyAtmosphere, out?: SkyAtmosphere): SkyAtmosphere {
    const w = skyPhaseWeights(sunElevation);
    const { night: n, twilight: t, golden: g } = SKY_PHASE_ATMOSPHERES;
    const o = out ?? { turbidity: 0, rayleigh: 0, mieCoefficient: 0, mieDirectionalG: 0 };
    o.turbidity = w.night * n.turbidity + w.twilight * t.turbidity + w.golden * g.turbidity + w.day * day.turbidity;
    o.rayleigh = w.night * n.rayleigh + w.twilight * t.rayleigh + w.golden * g.rayleigh + w.day * day.rayleigh;
    o.mieCoefficient = w.night * n.mieCoefficient + w.twilight * t.mieCoefficient + w.golden * g.mieCoefficient + w.day * day.mieCoefficient;
    o.mieDirectionalG = w.night * n.mieDirectionalG + w.twilight * t.mieDirectionalG + w.golden * g.mieDirectionalG + w.day * day.mieDirectionalG;
    return o;
}

/** How visible the night sky is (stars, moon halo): 0 by day, 1 once the sun is
 *  12° down. */
export function nightAmount(sunElevation: number): number {
    const w = skyPhaseWeights(sunElevation);
    return w.night + w.twilight * 0.5;
}

/**
 * How bright the sky dome is drawn, 1 by day. Preetham alone never gets darker
 * than a flat grey after sunset (its constant 0.1 base term), so the night reads
 * as overcast dusk instead of night. SkyMesh multiplies its output by this.
 */
export const SKY_PHASE_BRIGHTNESS = { night: 0.08, twilight: 0.5, golden: 1, day: 1 } as const;

export function skyBrightnessForSunElevation(sunElevation: number): number {
    const w = skyPhaseWeights(sunElevation);
    const b = SKY_PHASE_BRIGHTNESS;
    return w.night * b.night + w.twilight * b.twilight + w.golden * b.golden + w.day * b.day;
}
