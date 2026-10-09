// One sun-direction convention: the Preetham disc, the clock's sunDirection and
// everything lit by them must point the same way.
// Run: tsc test/sunDirection.test.ts --outDir <tmp> --module commonjs
//      --moduleResolution node10 --target es2022 --skipLibCheck --esModuleInterop
//      --rootDir .   then node <tmp>/test/sunDirection.test.js (with core's
//      node_modules resolvable).
import { sunDirectionFromAngles, sunAnglesFromDirection, createSunPosition } from '../src/utils/sunUtils';
import { SkySystemManager } from '../src/services/SkySystemManager';
import { skyPhaseWeights, atmosphereForSunElevation, SKY_PHASE_ATMOSPHERES } from '../src/utils/skyPhase';

let fails = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;
const angle = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) =>
    Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))) * 180 / Math.PI;

// convention: az 0 → +X, 90 → +Z, elevation 90 → +Y
{
    const x = sunDirectionFromAngles(0, 0);
    const z = sunDirectionFromAngles(0, 90);
    const up = sunDirectionFromAngles(90, 37);
    ok(near(x.x, 1) && near(x.y, 0) && near(x.z, 0), 'az 0 → +X');
    ok(near(z.x, 0) && near(z.z, 1), 'az 90 → +Z');
    ok(near(up.y, 1), 'el 90 → +Y');
}

// createSunPosition is the same function
{
    let worst = 0;
    for (let el = -80; el <= 80; el += 7) for (let az = -180; az < 180; az += 11) {
        worst = Math.max(worst, angle(createSunPosition(el, az), sunDirectionFromAngles(el, az)));
    }
    // acos near 1 resolves to ~1e-6°, so compare at 1e-4°.
    ok(worst < 1e-4, `createSunPosition matches (worst ${worst.toExponential(1)}°)`);
}

// inverse round-trips
{
    let worst = 0;
    for (let el = -85; el <= 85; el += 5) for (let az = -175; az < 180; az += 13) {
        const a = sunAnglesFromDirection(sunDirectionFromAngles(el, az));
        worst = Math.max(worst, Math.abs(a.elevation - el), Math.abs(((a.azimuth - az + 540) % 360) - 180));
    }
    ok(worst < 1e-6, `angles round-trip (worst ${worst.toExponential(1)})`);
}

// The bug this guards: the clock used x = sin(az), z = cos(az), which put the lit
// sun up to 137° away from the disc. SkyController draws the disc at createSunPosition(state.sunElevation,
// state.sunAzimuth); clouds, ocean, terrain and the key light use state.sunDirection.
// They must agree at every hour.
{
    const m = new SkySystemManager();
    let worst = 0, worstAt = 0;
    for (let h = 0; h < 24; h += 0.25) {
        m.setTime(h);
        const s = m.getState();
        const disc = createSunPosition(s.sunElevation, s.sunAzimuth);
        const a = angle(disc, s.sunDirection);
        if (a > worst) { worst = a; worstAt = h; }
        const byTime = m.getStateByTime(h).sunDirection;
        worst = Math.max(worst, angle(byTime, s.sunDirection));
    }
    ok(worst < 1e-4, `clock sunDirection matches the drawn disc all day (worst ${worst.toFixed(6)}° at ${worstAt}h)`);
}

// sun is up by day, down at night
{
    const m = new SkySystemManager();
    m.setTime(13.5); ok(m.getState().sunDirection.y > 0.5, 'high at 13:30');
    m.setTime(2); ok(m.getState().sunDirection.y < 0, 'below horizon at 02:00');
}

// Moon: the sun's arc, moonPhase of a day behind.
{
    const m = new SkySystemManager();
    const base = { enabled: true, timescale: 60, autoAnimate: false, syncWithRealTime: false };
    m.setTimeSettings({ ...base, timeOfDay: 1.5, moonPhase: 0.5 });
    ok(m.getState().moonDirection.y > 0.5, 'full moon high at 01:30 (sun\'s 13:30 arc, 12 h behind)');
    m.setTimeSettings({ ...base, timeOfDay: 13.5, moonPhase: 0.5 });
    ok(m.getState().moonDirection.y < 0, 'full moon below the horizon at 13:30');
    ok(near(m.getState().moonIllumination, 1), 'full moon illumination 1');
    m.setTimeSettings({ ...base, timeOfDay: 13.5, moonPhase: 0 });
    ok(angle(m.getState().moonDirection, m.getState().sunDirection) < 1e-4, 'new moon rides with the sun');
    ok(near(m.getState().moonIllumination, 0), 'new moon illumination 0');
    m.setTimeSettings({ ...base, timeOfDay: 13.5, moonPhase: 0.25 });
    ok(near(m.getState().moonIllumination, 0.5), 'quarter moon half lit');
    // continuous through the day: no step bigger than the clock's own 15-min motion allows
    m.setTimeSettings({ ...base, timeOfDay: 0, moonPhase: 0.5 });
    let prev = m.getState().moonDirection.clone(), worst = 0;
    for (let h = 0.25; h <= 24; h += 0.25) {
        m.setTime(h % 24);
        const d = m.getState().moonDirection;
        worst = Math.max(worst, angle(prev, d));
        prev = d.clone();
    }
    ok(worst < 6, `moon path continuous (largest 15-min step ${worst.toFixed(2)}°)`);
    const st = m.getStateByTime(1.5);
    m.setTime(1.5);
    ok(angle(st.moonDirection, m.getState().moonDirection) < 1e-4, 'getStateByTime moon matches getState');
}

// Phases from sun elevation
{
    let worstSum = 0, worstJump = 0, prev = skyPhaseWeights(-30);
    for (let el = -30; el <= 60; el += 0.05) {
        const w = skyPhaseWeights(el);
        worstSum = Math.max(worstSum, Math.abs(w.night + w.twilight + w.golden + w.day - 1));
        worstJump = Math.max(worstJump, Math.abs(w.night - prev.night), Math.abs(w.twilight - prev.twilight), Math.abs(w.golden - prev.golden), Math.abs(w.day - prev.day));
        prev = w;
    }
    ok(worstSum < 1e-9, 'phase weights sum to 1');
    ok(worstJump < 0.02, `phase weights continuous (largest 0.05° step ${worstJump.toFixed(4)})`);
    const day = { turbidity: 1.3, rayleigh: 0.6, mieCoefficient: 0.004, mieDirectionalG: 0.7 };
    const a = atmosphereForSunElevation(40, day);
    ok(near(a.turbidity, 1.3) && near(a.rayleigh, 0.6), 'high sun = the authored day look');
    const nt = atmosphereForSunElevation(-30, day);
    ok(near(nt.rayleigh, SKY_PHASE_ATMOSPHERES.night.rayleigh), 'deep night = night atmosphere');
    const g = atmosphereForSunElevation(3, day);
    ok(near(g.turbidity, SKY_PHASE_ATMOSPHERES.golden.turbidity), 'sun on the horizon = golden atmosphere');
    const m = new SkySystemManager();
    m.setTime(13.5); ok(m.getTimeOfDay() === 'Midday', 'label Midday at 13:30');
    m.setTime(2); ok(m.getTimeOfDay() === 'Nighttime', 'label Nighttime at 02:00');
    m.setTime(20.4); ok(m.getTimeOfDay() === 'Sunset', `label Sunset at 20:24 (el ${m.getState().sunElevation.toFixed(1)}°)`);
    m.setTime(6.6); ok(m.getTimeOfDay() === 'Sunrise', `label Sunrise at 06:36 (el ${m.getState().sunElevation.toFixed(1)}°)`);
}

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
if (fails) process.exit(1);
