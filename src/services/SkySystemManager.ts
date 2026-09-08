import * as THREE from 'three';
import type { TimeSettings } from "../types/scene3d";
export type TimeOfDayLabel = 'Sunrise' | 'Midday' | 'Sunset' | 'Nighttime';

export interface SkyTimeState {
    timeInHours: number;
    normalizedTime: number;
    isDaytime: boolean;
    timeOfDay: TimeOfDayLabel;
    sunElevation: number;
    sunAzimuth: number;
    sunDirection: THREE.Vector3;
    delta: number;
    elapsedTime: number;
    autoAnimate: boolean;
    /** Time is moving on its own — autoAnimate OR real-time sync. Consumers that
     *  schedule expensive work off a sun change (a cube-camera capture) use this
     *  to stand down and let the environment probe's own timer do it once. */
    advancing: boolean;
}


const SUNRISE = 6;
const SUNSET = 21;
const MAX_ELEVATION = 42;
/** Where the day arc meets the horizon at SUNRISE and SUNSET, and where the
 *  night arc has to meet it back for the curve to be continuous. */
const HORIZON_OFFSET = 5;
/** How far below the horizon the sun gets at the middle of the night. */
const MAX_NIGHT_DEPTH = 21;
/** Real seconds between playback write-backs to the host. */
const SYNC_INTERVAL_SECONDS = 0.25;
export class SkySystemManager {
    private static instance = null;
    private timeInHours = 12;
    private normalizedTime = 0.5;
    private isDaytime = true;
    private timeOfDay = 'Midday';
    private elapsedTime = 0;
    private delta = 0;
    private sunElevation = 37;
    private sunAzimuth = 270;
    private sunDirection = new THREE.Vector3(0, 1, 0);
    private enabled = false;
    private timescale = 60;
    private autoAnimate = false;
    private syncWithRealTime = false;
    private lastSyncedMinute = -1;
    private onTimeSync = null;
    /** The last timeOfDay this manager and its host agree on. A host pushing the
     *  same value back (its own echo of `onTimeSync`) must NOT rewind the clock;
     *  only a genuinely different value is an intentional seek. */
    private lastAppliedTimeOfDay: number | null = null;
    /** Real seconds since the last write-back, so playback dispatches a few times
     *  a second instead of once per frame. */
    private syncAccumulator = 0;
    /** Whoever is allowed to advance the clock. The manager is a singleton, so a
     *  second mounted SkySystem (a market preview, a second canvas) would
     *  otherwise double-tick it and stomp its settings. */
    private driver: object | null = null;
    constructor() {
        this.updateSunDirection();
    }
    static getInstance(): SkySystemManager {
        if (!SkySystemManager.instance) {
            SkySystemManager.instance = new SkySystemManager();
        }
        return SkySystemManager.instance;
    }
    static resetInstance(): void {
        SkySystemManager.instance = null;
    }
    /** Claim the right to drive the clock. Returns true if `token` owns it —
     *  the first claimant wins and keeps it until it releases. Everyone else
     *  reads. */
    claimDriver(token: object): boolean {
        if (this.driver === null) {
            this.driver = token;
        }
        return this.driver === token;
    }
    releaseDriver(token: object): void {
        if (this.driver === token) {
            this.driver = null;
        }
    }
    hasDriver(): boolean {
        return this.driver !== null;
    }
    setTimeSettings(settings: TimeSettings): void {
        this.enabled = settings.enabled;
        this.timescale = settings.timescale;
        this.autoAnimate = settings.autoAnimate;
        this.syncWithRealTime = settings.syncWithRealTime;
        if (this.syncWithRealTime) {
            // Wall clock wins outright; the settings' timeOfDay is only ever an
            // echo of what this manager last published. Adopting it here is what
            // used to put one frame of yesterday's sun on screen.
            this.lastAppliedTimeOfDay = settings.timeOfDay;
            this.syncToRealTime();
            this.recalculateState();
            return;
        }
        // A running clock is ahead of whatever the host last stored, so a plain
        // `timeInHours !== settings.timeOfDay` test is true on every settings
        // object and would rewind playback on any unrelated change (a speed
        // button, a project load, a re-render). Only a timeOfDay that differs
        // from the last one we agreed on is a deliberate seek.
        const seeked = this.lastAppliedTimeOfDay === null
            || Math.abs(settings.timeOfDay - this.lastAppliedTimeOfDay) > 0.001;
        if (seeked) {
            this.lastAppliedTimeOfDay = settings.timeOfDay;
            this.timeInHours = settings.timeOfDay;
            this.delta = 0;
            this.syncAccumulator = 0;
            this.recalculateState();
        }
    }
    setOnTimeSync(callback: ((timeOfDay: number) => void) | null): void {
        this.onTimeSync = callback;
    }
    setTime(hours: number, minutes: number = 0): void {
        this.timeInHours = hours + minutes / 60;
        this.lastAppliedTimeOfDay = this.timeInHours;
        // An explicit seek is a cut, not a movement: zero delta tells every
        // consumer's smoothing lerp to snap rather than glide from the old sun.
        this.delta = 0;
        this.recalculateState();
    }
    /**
     * One frame of clock. Safe to call every frame whenever time is enabled —
     * it advances `timeInHours` only in an advancing mode, but `elapsedTime` and
     * `delta` are what every consumer's smoothing and twinkle read, so they must
     * keep running in manual mode too.
     */
    tick(delta: number): void {
        if (!this.enabled)
            return;
        this.delta = delta;
        this.elapsedTime += delta;
        if (this.syncWithRealTime) {
            this.syncToRealTime();
        }
        else if (this.autoAnimate && this.timescale > 0) {
            this.advanceTime(delta);
            this.publishTime(delta);
        }
        this.recalculateState();
    }
    getState(): SkyTimeState {
        return {
            timeInHours: this.timeInHours,
            normalizedTime: this.normalizedTime,
            isDaytime: this.isDaytime,
            timeOfDay: (this.timeOfDay as any),
            sunElevation: this.sunElevation,
            sunAzimuth: this.transformAzimuth(this.sunAzimuth),
            sunDirection: this.sunDirection,
            delta: this.delta,
            elapsedTime: this.elapsedTime,
            autoAnimate: this.autoAnimate,
            advancing: this.isAdvancing(),
        };
    }
    getStateByTime(timeOfDay: number): SkyTimeState {
        const state = this.calculateTimeState(timeOfDay);
        const el = THREE.MathUtils.degToRad(state.sunElevation);
        const az = THREE.MathUtils.degToRad(this.transformAzimuth(state.sunAzimuth));
        const distance = 0.5;
        const sunDirection = new THREE.Vector3(distance * Math.cos(el) * Math.sin(az), distance * Math.sin(el), distance * Math.cos(el) * Math.cos(az)).normalize();
        return {
            timeInHours: timeOfDay,
            normalizedTime: state.normalizedTime,
            isDaytime: state.isDaytime,
            timeOfDay: (state.timeOfDay as any),
            sunElevation: state.sunElevation,
            sunAzimuth: this.transformAzimuth(state.sunAzimuth),
            sunDirection,
            delta: 0,
            elapsedTime: this.elapsedTime,
            autoAnimate: this.autoAnimate,
            advancing: this.isAdvancing(),
        };
    }
    getTime(): Date {
        const date = new Date();
        date.setHours(Math.floor(this.timeInHours), (this.timeInHours % 1) * 60, 0, 0);
        return date;
    }
    getTimeOfDay(): TimeOfDayLabel {
        return (this.timeOfDay as any);
    }
    getSunDirection(): THREE.Vector3 {
        return this.sunDirection.clone();
    }
    getTimeInHours(): number {
        return this.timeInHours;
    }
    isEnabled(): boolean {
        return this.enabled;
    }
    isAutoAnimating(): boolean {
        return this.autoAnimate;
    }
    isAdvancing(): boolean {
        return this.enabled && (this.syncWithRealTime || (this.autoAnimate && this.timescale > 0));
    }
    private advanceTime(delta) {
        const hoursPerSecond = this.timescale / 60;
        this.timeInHours += hoursPerSecond * delta;
        // Modulo rather than a single +/- 24: at a high timescale one long frame
        // (a backgrounded tab handing back a multi-second delta) can carry the
        // clock past 24 by more than a day, and a single subtraction leaves it
        // out of range for every consumer that indexes by hour.
        if (this.timeInHours >= 24 || this.timeInHours < 0) {
            this.timeInHours = ((this.timeInHours % 24) + 24) % 24;
        }
    }
    /**
     * Push the animating time back to the host a few times a second.
     *
     * Without this the manager was the only thing that knew what time it was:
     * the slider sat frozen at the last value the user set, and that stale value
     * was what got saved with the project. Throttled in REAL seconds, not
     * simulated ones, so the dispatch rate does not scale with timescale.
     *
     * `lastAppliedTimeOfDay` is set to exactly what is published, so the value
     * coming back through the host's state is recognised as our own echo by
     * `setTimeSettings` and does not rewind the clock.
     */
    private publishTime(delta) {
        if (!this.onTimeSync)
            return;
        this.syncAccumulator += delta;
        if (this.syncAccumulator < SYNC_INTERVAL_SECONDS)
            return;
        this.syncAccumulator = 0;
        const rounded = Math.round(this.timeInHours * 100) / 100;
        if (rounded === this.lastAppliedTimeOfDay)
            return;
        this.lastAppliedTimeOfDay = rounded;
        this.onTimeSync(rounded);
    }
    private syncToRealTime() {
        const now = new Date();
        const currentMinute = now.getHours() * 60 + now.getMinutes();
        this.timeInHours =
            now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        if (currentMinute !== this.lastSyncedMinute) {
            this.lastSyncedMinute = currentMinute;
            const rounded = Math.round(this.timeInHours * 100) / 100;
            this.lastAppliedTimeOfDay = rounded;
            this.onTimeSync?.(rounded);
        }
    }
    private recalculateState() {
        const state = this.calculateTimeState(this.timeInHours);
        this.normalizedTime = state.normalizedTime;
        this.isDaytime = state.isDaytime;
        this.timeOfDay = state.timeOfDay;
        this.sunElevation = state.sunElevation;
        this.sunAzimuth = state.sunAzimuth;
        this.updateSunDirection();
    }
    /**
     * Sun elevation and azimuth for a given hour.
     *
     * Both curves are continuous across the whole 24 h, which they were not:
     *
     *  - Azimuth used to be `180 + 180 * normalizedTime` with `normalizedTime`
     *    restarting at 0 at both SUNRISE and SUNSET, so the sun teleported to
     *    the opposite horizon twice a cycle. The night arc now CONTINUES the
     *    day arc (360 -> 540, which is 180 again mod 360), so the sun keeps
     *    travelling the same way round and meets the next dawn exactly where
     *    the day arc starts.
     *
     *  - Night elevation used to be the day curve halved, and the day curve is
     *    positive in the middle — so the sun rose again after sunset and stood
     *    +18 degrees up at 02:00. Anything reading the direction rather than
     *    `isDaytime` (the clouds and the ocean, through useCloudSun) was lit as
     *    if it were afternoon in the middle of the night. The night arc is now
     *    its own curve, below the horizon for all of it, meeting the day curve
     *    at -5 degrees at both ends.
     */
    private calculateTimeState(timeInHours) {
        const isDaytime = timeInHours >= SUNRISE && timeInHours <= SUNSET;
        let normalizedTime;
        let sunElevation;
        let sunAzimuth;
        if (isDaytime) {
            normalizedTime = (timeInHours - SUNRISE) / (SUNSET - SUNRISE);
            sunElevation = Math.cos(Math.PI * (normalizedTime - 0.5)) * MAX_ELEVATION - HORIZON_OFFSET;
            sunAzimuth = 180 + 180 * normalizedTime;
        }
        else {
            const nightHour = timeInHours >= SUNSET ? timeInHours : timeInHours + 24;
            normalizedTime = (nightHour - SUNSET) / (24 - SUNSET + SUNRISE);
            sunElevation = -HORIZON_OFFSET - Math.cos(Math.PI * (normalizedTime - 0.5)) * MAX_NIGHT_DEPTH;
            sunAzimuth = 360 + 180 * normalizedTime;
        }
        let timeOfDay = 'Nighttime';
        if (isDaytime) {
            if (normalizedTime <= 0.25)
                timeOfDay = 'Sunrise';
            else if (normalizedTime <= 0.75)
                timeOfDay = 'Midday';
            else
                timeOfDay = 'Sunset';
        }
        return { normalizedTime, isDaytime, timeOfDay, sunElevation, sunAzimuth };
    }
    /** Scene azimuth in [-180, 180). Normalised into range rather than left to
     *  JS's signed `%`, so the night arc's 360-540 degrees maps onto the same
     *  directions the day arc's 180-360 does instead of running off the end. */
    private transformAzimuth(rawAzimuth) {
        const wrapped = (((270 - rawAzimuth) % 360) + 360) % 360;
        return wrapped - 180;
    }
    private updateSunDirection() {
        const el = THREE.MathUtils.degToRad(this.sunElevation);
        const az = THREE.MathUtils.degToRad(this.transformAzimuth(this.sunAzimuth));
        const distance = 0.5;
        this.sunDirection
            .set(distance * Math.cos(el) * Math.sin(az), distance * Math.sin(el), distance * Math.cos(el) * Math.cos(az))
            .normalize();
    }
}
export const skySystemManager: SkySystemManager = SkySystemManager.getInstance();
export default SkySystemManager;
