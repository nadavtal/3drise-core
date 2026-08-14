import * as THREE from 'three';
import { skySystemManager } from '../services/SkySystemManager';
import type { TimeSettings } from "../types/scene3d";
export interface SkyboxVOptions {
    visible?: boolean;
    scale?: number;
    sunSize?: number;
    moonSize?: number;
    timeSettings: TimeSettings;
}


const COLORS = {
    white: new THREE.Color(0xffffff),
    orange: new THREE.Color(0xff4500),
    yellow: new THREE.Color(0xffd700),
    red: new THREE.Color(0xff6347),
    darkRed: new THREE.Color(0xd32f2f),
    skyBlue: new THREE.Color(0x87ceeb),
    darkSky: new THREE.Color(0x0d1321),
    nightSky: new THREE.Color(0x1c2331),
    moon: new THREE.Color(0xe6e8fa),
};
const MOON_GLOW = COLORS.moon.clone().multiplyScalar(1.8);
const SKY_KEYFRAMES = [
    { t: 0, horizon: COLORS.darkSky, high: COLORS.nightSky, sun: MOON_GLOW },
    { t: 5, horizon: COLORS.darkSky, high: COLORS.nightSky, sun: MOON_GLOW },
    { t: 5.7, horizon: COLORS.darkRed, high: COLORS.darkSky, sun: COLORS.orange },
    { t: 6.3, horizon: COLORS.red, high: COLORS.darkSky, sun: COLORS.orange },
    { t: 6.8, horizon: COLORS.yellow, high: COLORS.darkSky, sun: COLORS.yellow },
    { t: 8, horizon: COLORS.skyBlue, high: COLORS.skyBlue, sun: COLORS.white },
    { t: 12, horizon: COLORS.skyBlue, high: COLORS.darkSky, sun: COLORS.white },
    { t: 16, horizon: COLORS.skyBlue, high: COLORS.skyBlue, sun: COLORS.white },
    { t: 19, horizon: COLORS.yellow, high: COLORS.skyBlue, sun: COLORS.yellow },
    { t: 20, horizon: COLORS.red, high: COLORS.darkRed, sun: COLORS.orange },
    { t: 20.7, horizon: COLORS.darkRed, high: COLORS.darkSky, sun: COLORS.orange },
    { t: 22, horizon: COLORS.darkSky, high: COLORS.nightSky, sun: MOON_GLOW },
    { t: 24, horizon: COLORS.darkSky, high: COLORS.nightSky, sun: MOON_GLOW },
];
function sampleSkyKeyframes(timeInHours, outHorizon, outHigh, outSun) {
    const wrapped = ((timeInHours % 24) + 24) % 24;
    for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
        const k0 = SKY_KEYFRAMES[i];
        const k1 = SKY_KEYFRAMES[i + 1];
        if (wrapped <= k1.t) {
            const span = k1.t - k0.t;
            const t = span === 0 ? 0 : (wrapped - k0.t) / span;
            outHorizon.lerpColors(k0.horizon, k1.horizon, t);
            outHigh.lerpColors(k0.high, k1.high, t);
            outSun.lerpColors(k0.sun, k1.sun, t);
            return;
        }
    }
    const last = SKY_KEYFRAMES[SKY_KEYFRAMES.length - 1];
    outHorizon.copy(last.horizon);
    outHigh.copy(last.high);
    outSun.copy(last.sun);
}
export class SkyboxV {
    private parent;
    private mesh;
    private material;
    private config;
    private sunColor = new THREE.Color(0xffe5b0);
    private skyColorLow = new THREE.Color(0x6fa2ef);
    private skyColorHigh = new THREE.Color(0x2053ff);
    private targetSunColor = new THREE.Color(0xffe5b0);
    private targetSkyColorLow = new THREE.Color(0x6fa2ef);
    private targetSkyColorHigh = new THREE.Color(0x2053ff);
    private static readonly vertexShader = /*glsl*/ `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position = pos.xyww;
    }
  `;
    private static readonly fragmentShader = /*glsl*/ `
    precision mediump float;
    varying vec3 vWorldPosition;
    uniform float uSunAzimuth;
    uniform float uSunElevation;
    uniform vec3 uSunColor;
    uniform vec3 uSkyColorLow;
    uniform vec3 uSkyColorHigh;
    uniform float uSunSize;

    void main() {
      vec3 direction = normalize(vWorldPosition);
      vec3 skyColor = mix(uSkyColorLow, uSkyColorHigh, clamp(direction.y * 0.5 + 0.5, 0.0, 1.0));
      float azimuth = radians(uSunAzimuth);
      float elevation = radians(uSunElevation);
      vec3 sunDirection = normalize(vec3(
        cos(elevation) * sin(azimuth),
        sin(elevation),
        cos(elevation) * cos(azimuth)
      ));
      float sunIntensity = pow(max(dot(direction, sunDirection), 0.0), 1000.0 / uSunSize);
      vec3 sunColor = uSunColor * sunIntensity;
      gl_FragColor = vec4(skyColor + sunColor, 1.0);
    }
  `;
    constructor(parent: THREE.Object3D, options: SkyboxVOptions) {
        this.parent = parent;
        this.config = options;
        this.material = new THREE.ShaderMaterial({
            vertexShader: SkyboxV.vertexShader,
            fragmentShader: SkyboxV.fragmentShader,
            uniforms: {
                uSunAzimuth: { value: 216 },
                uSunElevation: { value: 24.68698059628387 },
                uSunColor: { value: new THREE.Color(0xffe5b0) },
                uSkyColorLow: { value: new THREE.Color(0x6fa2ef) },
                uSkyColorHigh: { value: new THREE.Color(0x2053ff) },
                uSunSize: { value: 1 },
            },
            side: THREE.BackSide,
            depthWrite: false,
            fog: false,
        });
        const scale = options.scale ?? 100000;
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.scale.setScalar(scale);
        this.mesh.visible = options.visible ?? true;
        parent.add(this.mesh);
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.mesh.visible)
            return;
        const { timeSettings } = this.config;
        if (!timeSettings.enabled)
            return;
        const state = skySystemManager.getState();
        this.applyTimeState(state, delta);
    }
    private applyTimeState(state, delta) {
        const { timeInHours, isDaytime, sunElevation, sunAzimuth } = state;
        const sunSize = this.config.sunSize ?? 1;
        const moonSize = this.config.moonSize ?? 1;
        sampleSkyKeyframes(timeInHours, this.targetSkyColorLow, this.targetSkyColorHigh, this.targetSunColor);
        const colorLerpSpeed = Math.min(1, 2.0 * (delta !== 0 ? delta : 1));
        this.sunColor.lerp(this.targetSunColor, colorLerpSpeed);
        this.skyColorLow.lerp(this.targetSkyColorLow, colorLerpSpeed);
        this.skyColorHigh.lerp(this.targetSkyColorHigh, colorLerpSpeed);
        const uniforms = this.material.uniforms;
        uniforms.uSunAzimuth.value = sunAzimuth;
        uniforms.uSunElevation.value = sunElevation;
        uniforms.uSunColor.value.copy(this.sunColor);
        uniforms.uSkyColorLow.value.copy(this.skyColorLow);
        uniforms.uSkyColorHigh.value.copy(this.skyColorHigh);
        uniforms.uSunSize.value = isDaytime ? sunSize : moonSize;
    }
    updateConfig(options: SkyboxVOptions): void {
        this.config = options;
        this.mesh.visible = options.visible ?? true;
        if (options.scale !== undefined) {
            this.mesh.scale.setScalar(options.scale);
        }
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    dispose(removeFromScene: boolean = true): void {
        this.mesh.geometry.dispose();
        this.material.dispose();
        if (removeFromScene)
            this.parent.remove(this.mesh);
    }
}
