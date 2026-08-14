import * as THREE from 'three';
import type { VolumetricFogConfig } from "../../types/generativeEffects";

const fogVert = /* glsl */ `
  attribute float aT;
  attribute vec3  aCenter;
  attribute float aPhase;
  attribute float aSize;

  uniform float u_time;
  uniform float uDrift;
  uniform float uFogRadius;

  varying float vAlpha;

  void main() {
    float t = fract(aT + u_time * 0.05);

    float dx = sin(u_time * uDrift + aPhase)          * uFogRadius * 0.18;
    float dz = cos(u_time * uDrift * 0.7 + aPhase * 1.3) * uFogRadius * 0.14;
    float dy = sin(u_time * 0.25 + aPhase) * uFogRadius * 0.06;

    vec3 pos = aCenter + vec3(dx, dy, dz);

    float pulse = 0.55 + 0.45 * sin(u_time * 0.35 + aPhase * 2.1);
    vAlpha = pulse;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (220.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const fogFrag = /* glsl */ `
  uniform vec3  uFogColor;
  uniform float uDensity;
  varying float vAlpha;

  void main() {
    vec2  c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float g = exp(-d * d * 2.2);

    gl_FragColor = vec4(uFogColor, g * vAlpha * uDensity);
  }
`;
export class VolumetricFogEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    constructor(scene: THREE.Scene, config: VolumetricFogConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { particleCount, fogRadius, driftSpeed, fogColor, density, opacity, intensity } = this.config;
        const r = this.boundingRadius * fogRadius;
        const N = Math.max(20, Math.min(particleCount, 200));
        const aT = new Float32Array(N);
        const aCenter = new Float32Array(N * 3);
        const aPhase = new Float32Array(N);
        const aSize = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            aT[i] = i / N;
            const angle = Math.random() * Math.PI * 2;
            const rad = Math.sqrt(Math.random()) * r;
            const yOff = (Math.random() - 0.3) * this.boundingRadius * 0.35;
            aCenter[i * 3] = Math.cos(angle) * rad;
            aCenter[i * 3 + 1] = yOff - this.boundingRadius * 0.3;
            aCenter[i * 3 + 2] = Math.sin(angle) * rad;
            aPhase[i] = Math.random() * Math.PI * 2;
            aSize[i] = (50 + Math.random() * 70) * intensity;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
        g.setAttribute('aCenter', new THREE.BufferAttribute(aCenter, 3));
        g.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
        g.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
        (g as any).frustumCulled = false;
        const fc = new THREE.Color(fogColor);
        const m = new THREE.ShaderMaterial({
            vertexShader: fogVert,
            fragmentShader: fogFrag,
            uniforms: {
                u_time: { value: 0 },
                uDrift: { value: driftSpeed },
                uFogRadius: { value: r },
                uFogColor: { value: new THREE.Vector3(fc.r, fc.g, fc.b) },
                uDensity: { value: density * opacity },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });
        this.materials.push(m);
        this.group.add(new THREE.Points(g, m));
    }
    update(elapsed: number, _delta: number = 0.016): void {
        for (const mat of this.materials)
            mat.uniforms.u_time.value = elapsed;
    }
    updateConfig(config: VolumetricFogConfig, boundingRadius?: number): void {
        this.config = config;
        if (boundingRadius !== undefined)
            this.boundingRadius = boundingRadius;
        this.dispose(false);
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        this.group.traverse(child => {
            const c = child;
            if (c.geometry)
                c.geometry.dispose();
        });
        this.materials.forEach(m => m.dispose());
        this.materials = [];
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
