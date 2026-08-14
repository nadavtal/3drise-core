import * as THREE from 'three';
import type { RainSettings } from "../types/environment";
export interface RainVOptions {
    settings: RainSettings;
}


const DEG_TO_RAD = Math.PI / 180;
const MAX_PARTICLES = 20000;
const vertexShader = `
  attribute float speed;
  varying float vSpeed;
  uniform float windAngle;
  uniform float windTilt;
  uniform float streakLength;

  void main() {
    vSpeed = speed;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 12.0 * streakLength * (200.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fragmentShader = `
  varying float vSpeed;
  uniform vec3 uColor;
  uniform float opacity;
  uniform float windAngle;
  uniform float windTilt;
  uniform float streakLength;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float angle = windAngle * windTilt;
    float ca = cos(angle);
    float sa = sin(angle);
    vec2 rotUv = vec2(
      uv.x * ca - uv.y * sa,
      uv.x * sa + uv.y * ca
    );
    float aspectRatio = max(streakLength, 1.0);
    rotUv.x *= aspectRatio;
    float dist = length(rotUv);
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow = (1.0 - smoothstep(0.1, 0.4, dist)) * 0.3;
    float alpha = (core + glow) * opacity;
    float gradient = smoothstep(-0.5, 0.2, rotUv.y) * 0.3 + 0.7;
    alpha *= gradient;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
export class RainV {
    private parent;
    private points = null;
    private geometry = null;
    private material = null;
    private velocities = null;
    private particleCount = 0;
    private settings;
    constructor(parent: THREE.Object3D, options: RainVOptions) {
        this.parent = parent;
        this.settings = options.settings;
        this.build();
    }
    private build() {
        const s = this.settings;
        const cfg = s.config;
        const mesh = s.meshSettings;
        const areaSize = mesh.scale?.[0] ?? 200;
        const halfArea = areaSize / 2;
        const height = areaSize * 1.25;
        this.particleCount = Math.min(Math.max(Math.round((cfg.density ?? 100) * 100), 100), MAX_PARTICLES);
        const positions = new Float32Array(this.particleCount * 3);
        const speeds = new Float32Array(this.particleCount);
        const velocities = new Float32Array(this.particleCount);
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = Math.random() * areaSize - halfArea;
            positions[i3 + 1] = Math.random() * height - height / 4;
            positions[i3 + 2] = Math.random() * areaSize - halfArea;
            const v = 0.8 + Math.random() * 0.4;
            speeds[i] = v;
            velocities[i] = v;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uColor: { value: new THREE.Color(cfg.color || '#ffffff') },
                opacity: { value: cfg.opacity ?? 0.5 },
                windAngle: { value: (cfg.windDirection ?? 0) * DEG_TO_RAD },
                windTilt: { value: cfg.windStrength ?? 0 },
                streakLength: { value: Math.max((cfg.size ?? 0.1) * 30, 1.0) },
            },
            transparent: true,
            depthWrite: false,
        });
        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        if (mesh.visible)
            this.parent.add(points);
        this.geometry = geometry;
        this.material = material;
        this.points = points;
        this.velocities = velocities;
    }
    private teardown() {
        if (this.points?.parent)
            this.parent.remove(this.points);
        this.geometry?.dispose();
        this.material?.dispose();
        this.geometry = null;
        this.material = null;
        this.points = null;
        this.velocities = null;
    }
    update(_elapsed: number, delta: number = 0.016): void {
        const s = this.settings;
        const cfg = s.config;
        const mesh = s.meshSettings;
        if (!mesh.visible || !this.geometry || !this.velocities || !this.points)
            return;
        const posAttr = this.geometry.attributes.position;
        const positions = posAttr.array;
        const velocities = this.velocities;
        const speed = (cfg.speed ?? 1) * 60;
        const windStrength = (cfg.windStrength ?? 0) * 30;
        const windAngle = (cfg.windDirection ?? 0) * DEG_TO_RAD;
        const windX = Math.sin(windAngle) * windStrength;
        const windZ = Math.cos(windAngle) * windStrength;
        const turbulence = cfg.turbulence ?? 0;
        const areaSize = mesh.scale?.[0] ?? 200;
        const halfArea = areaSize / 2;
        const height = areaSize * 1.25;
        const groundY = -height / 4;
        const dt = Math.min(delta, 0.05);
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const v = velocities[i];
            const turbX = turbulence > 0 ? (Math.random() - 0.5) * turbulence * 10 * dt : 0;
            const turbZ = turbulence > 0 ? (Math.random() - 0.5) * turbulence * 10 * dt : 0;
            positions[i3] += (windX * v + turbX) * dt;
            positions[i3 + 1] -= speed * v * dt;
            positions[i3 + 2] += (windZ * v + turbZ) * dt;
            if (positions[i3 + 1] < groundY) {
                positions[i3] = Math.random() * areaSize - halfArea;
                positions[i3 + 1] = height * 0.75;
                positions[i3 + 2] = Math.random() * areaSize - halfArea;
                velocities[i] = 0.8 + Math.random() * 0.4;
            }
            if (positions[i3] > halfArea)
                positions[i3] -= areaSize;
            if (positions[i3] < -halfArea)
                positions[i3] += areaSize;
            if (positions[i3 + 2] > halfArea)
                positions[i3 + 2] -= areaSize;
            if (positions[i3 + 2] < -halfArea)
                positions[i3 + 2] += areaSize;
        }
        posAttr.needsUpdate = true;
    }
    updateConfig(options: RainVOptions): void {
        const prev = this.settings;
        this.settings = options.settings;
        const cfg = options.settings.config;
        const mesh = options.settings.meshSettings;
        const needsRebuild = prev.config.density !== cfg.density ||
            prev.meshSettings.scale?.[0] !== mesh.scale?.[0];
        if (needsRebuild) {
            this.teardown();
            this.build();
            return;
        }
        if (this.points) {
            if (mesh.visible && !this.points.parent) {
                this.parent.add(this.points);
            }
            else if (!mesh.visible && this.points.parent) {
                this.parent.remove(this.points);
            }
        }
        if (this.material) {
            const u = this.material.uniforms;
            u.uColor.value.set(cfg.color || '#ffffff');
            u.opacity.value = cfg.opacity ?? 0.5;
            u.streakLength.value = Math.max((cfg.size ?? 0.1) * 30, 1.0);
            u.windAngle.value = (cfg.windDirection ?? 0) * DEG_TO_RAD;
            u.windTilt.value = cfg.windStrength ?? 0;
        }
    }
    dispose(removeFromScene: boolean = true): void {
        if (removeFromScene && this.points?.parent) {
            this.parent.remove(this.points);
        }
        this.geometry?.dispose();
        this.material?.dispose();
        this.geometry = null;
        this.material = null;
        this.points = null;
        this.velocities = null;
    }
}
