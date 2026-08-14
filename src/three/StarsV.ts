import * as THREE from 'three';
import { skySystemManager } from '../services/SkySystemManager';
import type { TimeSettings } from "../types/scene3d";
import type { StarsSettings } from "../types/environment";
export interface StarsVOptions {
    settings: StarsSettings;
    timeSettings?: TimeSettings;
    sunSystemEnabled?: boolean;
}


const vertexShader = /*glsl*/ `
  attribute float size;
  attribute vec3 color;
  attribute float phase;
  attribute float freq;

  varying vec3 vColor;

  uniform float time;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = sin(time * freq + phase) * 0.2 + 0.8;
    gl_PointSize = size * twinkle;
    vec4 pos = projectionMatrix * mvPosition;
    pos.z = pos.w * 0.999999;
    gl_Position = pos;
  }
`;
const fragmentShader = /*glsl*/ `
  varying vec3 vColor;
  uniform float opacity;
  uniform vec3 uColor;
  uniform vec3 targetColor;
  uniform float colorMix;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center) * 2.0;
    float core = (1.0 - smoothstep(0.0, 0.2, dist)) * 0.8;
    float glow = (1.0 - smoothstep(0.2, 0.5, dist)) * 0.1;
    float brightness = core + glow;
    vec3 transitionColor = mix(uColor, targetColor, colorMix);
    vec3 finalColor = mix(vec3(1.0), transitionColor * vColor, 0.8) * 0.6;
    gl_FragColor = vec4(finalColor, brightness * opacity);
  }
`;
function buildGeometry(count) {
    const halfCount = Math.floor(count / 2);
    const geometry = new THREE.BufferGeometry();
    const topPositions = new Float32Array(halfCount * 3);
    for (let i = 0; i < halfCount; i++) {
        const u = Math.random();
        const v = Math.random() * 0.5 + 0.5;
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        topPositions.set([Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)], i * 3);
    }
    const positions = new Float32Array(halfCount * 6);
    positions.set(topPositions, 0);
    for (let i = 0; i < halfCount; i++) {
        positions.set([topPositions[i * 3], -topPositions[i * 3 + 1], topPositions[i * 3 + 2]], (i + halfCount) * 3);
    }
    const colors = new Float32Array(halfCount * 3);
    for (let i = 0; i < halfCount; i++) {
        const vv = Math.random();
        const c = vv < 0.15 ? [0.8, 0.85, 1.0] : vv < 0.3 ? [1.0, 0.95, 0.8] : [1.0, 1.0, 1.0];
        colors.set(c, i * 3);
    }
    const mc = new Float32Array(halfCount * 6);
    mc.set(colors, 0);
    mc.set(colors, colors.length);
    const sizes = new Float32Array(halfCount);
    for (let i = 0; i < halfCount; i++) {
        const vv = Math.random();
        sizes[i] = vv < 0.01 ? 40 + Math.random() * 20 : vv < 0.05 ? 25 + Math.random() * 15 : vv < 0.2 ? 15 + Math.random() * 10 : 5 + Math.random() * 5;
    }
    const ms = new Float32Array(halfCount * 2);
    ms.set(sizes, 0);
    ms.set(sizes, sizes.length);
    const phases = new Float32Array(halfCount);
    for (let i = 0; i < halfCount; i++)
        phases[i] = Math.random() * Math.PI * 2;
    const mp = new Float32Array(halfCount * 2);
    mp.set(phases, 0);
    mp.set(phases, phases.length);
    const freqs = new Float32Array(halfCount);
    for (let i = 0; i < halfCount; i++)
        freqs[i] = 1.0 + Math.random() * 2.0;
    const mf = new Float32Array(halfCount * 2);
    mf.set(freqs, 0);
    mf.set(freqs, freqs.length);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(mc, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(ms, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(mp, 1));
    geometry.setAttribute('freq', new THREE.BufferAttribute(mf, 1));
    return geometry;
}
export class StarsV {
    private parent;
    private points;
    private material;
    private geometry;
    private config;
    private elapsed = 0;
    private opacity = 1;
    private targetOpacity = 1;
    constructor(parent: THREE.Object3D, options: StarsVOptions) {
        this.parent = parent;
        this.config = options;
        const { settings } = options;
        this.geometry = buildGeometry(settings.config.count);
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                time: { value: 0 },
                opacity: { value: 1 },
                uColor: { value: new THREE.Color(settings.config.color) },
                targetColor: { value: new THREE.Color(settings.config.color) },
                colorMix: { value: 0 },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.points = new THREE.Points(this.geometry, this.material);
        this.points.visible = settings.meshSettings.visible;
        this.points.renderOrder = -1;
        this.points.frustumCulled = false;
        const s = typeof settings.meshSettings.scale === 'number' ? settings.meshSettings.scale : settings.meshSettings.scale[0];
        this.points.scale.setScalar(s);
        parent.add(this.points);
        if (options.timeSettings)
            skySystemManager.setTimeSettings(options.timeSettings);
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.points.visible)
            return;
        const { settings, timeSettings, sunSystemEnabled } = this.config;
        this.elapsed += delta;
        this.points.rotation.y += settings.config.rotateSpeed * 0.01;
        this.material.uniforms.time.value = this.elapsed;
        if (timeSettings?.enabled && sunSystemEnabled) {
            const state = skySystemManager.getState();
            this.applyTimeState(state, delta);
        }
    }
    private applyTimeState(state, delta) {
        const { normalizedTime, isDaytime, autoAnimate } = state;
        if (!autoAnimate)
            return;
        if (!isDaytime) {
            this.targetOpacity = 1;
        }
        else {
            const sunriseEnd = 0.15;
            const sunsetStart = 0.85;
            if (normalizedTime <= sunriseEnd) {
                this.targetOpacity = 1 - normalizedTime / sunriseEnd;
            }
            else if (normalizedTime >= sunsetStart) {
                this.targetOpacity = (normalizedTime - sunsetStart) / (1 - sunsetStart);
            }
            else {
                this.targetOpacity = 0;
            }
        }
        const lerpSpeed = Math.min(1, 1.5 * (delta || 1));
        this.opacity += (this.targetOpacity - this.opacity) * lerpSpeed;
        this.material.uniforms.opacity.value = this.opacity;
        this.points.visible = this.opacity > 0.01;
    }
    updateConfig(options: StarsVOptions): void {
        this.config = options;
        if (options.timeSettings)
            skySystemManager.setTimeSettings(options.timeSettings);
    }
    dispose(removeFromScene: boolean = true): void {
        this.geometry.dispose();
        this.material.dispose();
        if (removeFromScene)
            this.parent.remove(this.points);
    }
}
