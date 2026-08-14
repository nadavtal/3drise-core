import * as THREE from 'three';
import { skySystemManager } from '../services/SkySystemManager';
import type { TimeSettings } from "../types/scene3d";
export interface CloudsVOptions {
    timeSettings: TimeSettings;
    visible?: boolean;
    scale?: number;
    height?: number;
    speed?: number;
}


const CLOUD_COLORS = {
    night: new THREE.Color(0.1, 0.1, 0.2),
    sunrise: new THREE.Color(0.8, 0.4, 0.4),
    midday: new THREE.Color(1.0, 1.0, 1.0),
    sunset: new THREE.Color(0.8, 0.3, 0.3),
};
const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  varying vec2 vUv;
  uniform float u_time;
  uniform vec3 u_cloudColor;

  float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

  float noise(vec2 n) {
    vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n);
    vec2 f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
  }

  float fbm(vec2 n) {
    float t = 0.0, s = 1.0;
    for (int i = 0; i < 5; i++) {
      t += noise(n) * s;
      n = n * 2.0 + vec2(0.5);
      s *= 0.5;
    }
    return t;
  }

  void main() {
    vec2 uv = vUv * 4.0 + vec2(u_time * 0.02, 0.0);
    float cloud = fbm(uv);
    cloud = smoothstep(0.4, 0.9, cloud);
    gl_FragColor = vec4(u_cloudColor, cloud * 0.8);
  }
`;
export class CloudsV {
    private parent;
    private mesh;
    private material;
    private config;
    private animTime = 0;
    private cloudColor = new THREE.Color(1, 1, 1);
    private targetColor = new THREE.Color(1, 1, 1);
    constructor(parent: THREE.Object3D, options: CloudsVOptions) {
        this.parent = parent;
        this.config = options;
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0 },
                u_cloudColor: { value: new THREE.Color(1, 1, 1) },
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(0, options.height ?? 400, 0);
        this.mesh.rotation.set(Math.PI / 2, 0, 0);
        this.mesh.scale.setScalar(options.scale ?? 1);
        this.mesh.renderOrder = -1;
        this.mesh.frustumCulled = false;
        this.mesh.visible = options.visible ?? true;
        parent.add(this.mesh);
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.mesh.visible)
            return;
        const { timeSettings, speed = 1 } = this.config;
        if (!timeSettings.enabled)
            return;
        const state = skySystemManager.getState();
        this.applyTimeState(state, delta);
        this.animTime += 0.02 * speed;
        this.material.uniforms.u_time.value = this.animTime;
        this.material.uniforms.u_cloudColor.value.copy(this.cloudColor);
    }
    private applyTimeState(state, delta) {
        const { normalizedTime, isDaytime } = state;
        if (isDaytime) {
            if (normalizedTime <= 0.15) {
                this.targetColor.lerpColors(CLOUD_COLORS.night, CLOUD_COLORS.sunrise, normalizedTime / 0.15);
            }
            else if (normalizedTime <= 0.25) {
                this.targetColor.lerpColors(CLOUD_COLORS.sunrise, CLOUD_COLORS.midday, (normalizedTime - 0.15) / 0.10);
            }
            else if (normalizedTime <= 0.75) {
                this.targetColor.copy(CLOUD_COLORS.midday);
            }
            else if (normalizedTime <= 0.85) {
                this.targetColor.lerpColors(CLOUD_COLORS.midday, CLOUD_COLORS.sunset, (normalizedTime - 0.75) / 0.10);
            }
            else {
                this.targetColor.lerpColors(CLOUD_COLORS.sunset, CLOUD_COLORS.night, (normalizedTime - 0.85) / 0.15);
            }
        }
        else {
            this.targetColor.copy(CLOUD_COLORS.night);
        }
        const lerpSpeed = Math.min(1, 2.0 * (delta || 0.016));
        this.cloudColor.lerp(this.targetColor, lerpSpeed);
    }
    updateConfig(options: CloudsVOptions): void {
        this.config = options;
        this.mesh.visible = options.visible ?? true;
        if (options.scale !== undefined)
            this.mesh.scale.setScalar(options.scale);
        if (options.height !== undefined)
            this.mesh.position.y = options.height;
        skySystemManager.setTimeSettings(options.timeSettings);
    }
    dispose(removeFromScene: boolean = true): void {
        this.mesh.geometry.dispose();
        this.material.dispose();
        if (removeFromScene)
            this.parent.remove(this.mesh);
    }
}
