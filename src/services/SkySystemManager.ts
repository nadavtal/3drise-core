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
}


const SUNRISE = 6;
const SUNSET = 21;
const MAX_ELEVATION = 42;
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
    setTimeSettings(settings: TimeSettings): void {
        this.enabled = settings.enabled;
        this.timescale = settings.timescale;
        this.autoAnimate = settings.autoAnimate;
        this.syncWithRealTime = settings.syncWithRealTime;
        if (this.syncWithRealTime) {
            this.syncToRealTime();
        }
        if (Math.abs(this.timeInHours - settings.timeOfDay) > 0.01) {
            this.timeInHours = settings.timeOfDay;
            this.recalculateState();
        }
    }
    setOnTimeSync(callback: ((timeOfDay: number) => void) | null): void {
        this.onTimeSync = callback;
    }
    setTime(hours: number, minutes: number = 0): void {
        this.timeInHours = hours + minutes / 60;
        this.recalculateState();
    }
    tick(delta: number): void {
        if (!this.enabled)
            return;
        // console.log(delta)
        // this.delta = delta;
        this.elapsedTime += delta;
        if (this.syncWithRealTime) {
            this.syncToRealTime();
        }
        else if (this.autoAnimate && this.timescale > 0) {
            // console.log(delta)
            this.advanceTime(delta);
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
    private advanceTime(delta) {
        const hoursPerSecond = this.timescale / 60;
        this.timeInHours += hoursPerSecond * delta;
        if (this.timeInHours >= 24) {
            this.timeInHours -= 24;
        }
        else if (this.timeInHours < 0) {
            this.timeInHours += 24;
        }
    }
    private syncToRealTime() {
        const now = new Date();
        const currentMinute = now.getHours() * 60 + now.getMinutes();
        this.timeInHours =
            now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        if (currentMinute !== this.lastSyncedMinute) {
            this.lastSyncedMinute = currentMinute;
            this.onTimeSync?.(Math.round(this.timeInHours * 100) / 100);
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
    private calculateTimeState(timeInHours) {
        const isDaytime = timeInHours >= SUNRISE && timeInHours <= SUNSET;
        let normalizedTime;
        if (isDaytime) {
            normalizedTime = (timeInHours - SUNRISE) / (SUNSET - SUNRISE);
        }
        else {
            const nightHour = timeInHours >= SUNSET ? timeInHours : timeInHours + 24;
            normalizedTime = (nightHour - SUNSET) / (24 - SUNSET + SUNRISE);
        }
        let sunElevation = Math.cos(Math.PI * (normalizedTime - 0.5)) * MAX_ELEVATION - 5;
        const sunAzimuth = 180 + 180 * normalizedTime;
        if (!isDaytime) {
            sunElevation *= 0.5;
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
    private transformAzimuth(rawAzimuth) {
        return ((270 - rawAzimuth) % 360) - 180;
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
