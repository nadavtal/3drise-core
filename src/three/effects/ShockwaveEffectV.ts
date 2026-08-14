import * as THREE from 'three';
import type { ShockwaveConfig } from "../../types/generativeEffects";

const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uExpansionScale;

  void main() {
    vec3 pos = position;
    float expansion = 1.0 + uProgress * uExpansionScale;
    pos.x *= expansion;
    pos.y *= expansion;

    float angle = atan(pos.y, pos.x);
    float warp = sin(angle * 8.0 + uProgress * 18.0) * 0.018 * (1.0 - uProgress);
    pos.z += warp;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform vec3  uColor;
  uniform vec3  uRimColor;
  uniform float uOpacity;
  uniform float u_time;

  float hash(float n){ return fract(sin(n) * 43758.5453); }

  void main() {
    float fade   = 1.0 - uProgress;

    float corona = exp(-uProgress * 6.0) * 2.5;

    float shimmer = 0.75 + 0.25 * hash(uProgress * 40.0 + u_time * 7.0);

    float rim     = pow(max(0.0, 1.0 - uProgress), 4.0);

    vec3 rimBoosted = mix(uRimColor, vec3(1.4, 1.4, 1.6), corona * 0.5);
    vec3 finalColor  = mix(uColor, rimBoosted, rim + corona * 0.4);
    finalColor      += rimBoosted * corona * 0.6;

    float alpha = fade * uOpacity * shimmer;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
const flashFrag = /* glsl */ `
  uniform float uProgress;
  uniform vec3  uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    float dist = length(c);
    if (dist > 1.0) discard;
    float fade = exp(-uProgress * 12.0);
    float radial = 1.0 - smoothstep(0.4, 1.0, dist);
    float alpha = fade * radial * uOpacity * 0.9;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(uColor * 2.0, alpha);
  }
`;
const flashVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export class ShockwaveEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private ringStates = [];
    private ringMats = [];
    private flashMats = [];
    constructor(scene: THREE.Scene, config: ShockwaveConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private makeRingStates(count, interval) {
        return Array.from({ length: count }, (_, i) => ({
            progress: 0,
            cooldown: (i / Math.max(count, 1)) * interval,
        }));
    }
    private build() {
        const { ringCount, expansionRadius, thickness, intervalSeconds, color, rimColor, opacity, intensity } = this.config;
        const r = this.boundingRadius;
        const cc = new THREE.Color(color);
        const rc = new THREE.Color(rimColor);
        const colorVec = new THREE.Vector3(cc.r, cc.g, cc.b);
        const rimColorVec = new THREE.Vector3(rc.r, rc.g, rc.b);
        this.ringStates = this.makeRingStates(ringCount, intervalSeconds);
        this.ringMats = [];
        this.flashMats = [];
        for (let i = 0; i < ringCount; i++) {
            const mat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    uProgress: { value: 0 },
                    uExpansionScale: { value: (expansionRadius - 1) * intensity },
                    uColor: { value: colorVec },
                    uRimColor: { value: rimColorVec },
                    uOpacity: { value: opacity },
                    u_time: { value: 0 },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            });
            this.ringMats.push(mat);
            this.materials.push(mat);
            const fMat = new THREE.ShaderMaterial({
                vertexShader: flashVert,
                fragmentShader: flashFrag,
                uniforms: {
                    uProgress: { value: 0 },
                    uColor: { value: colorVec },
                    uOpacity: { value: opacity },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            });
            this.flashMats.push(fMat);
            this.materials.push(fMat);
            const subGroup = new THREE.Group();
            const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(r, thickness * intensity, 10, 80), mat);
            ringMesh.rotation.set(-Math.PI / 2, 0, 0);
            subGroup.add(ringMesh);
            const flashR = r * 1.05;
            const flashMesh = new THREE.Mesh(new THREE.CircleGeometry(flashR, 48), fMat);
            flashMesh.rotation.set(-Math.PI / 2, 0, 0);
            subGroup.add(flashMesh);
            this.group.add(subGroup);
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        const { intervalSeconds, speed } = this.config;
        for (let i = 0; i < this.ringMats.length; i++) {
            const state_ = this.ringStates[i];
            const mat = this.ringMats[i];
            const fMat = this.flashMats[i];
            mat.uniforms.u_time.value = elapsed;
            if (state_.cooldown > 0) {
                state_.cooldown -= delta;
                mat.uniforms.uProgress.value = 1;
                fMat.uniforms.uProgress.value = 1;
                continue;
            }
            state_.progress += delta * speed;
            const p = Math.min(state_.progress, 1);
            mat.uniforms.uProgress.value = p;
            fMat.uniforms.uProgress.value = p;
            if (state_.progress >= 1) {
                state_.progress = 0;
                state_.cooldown = intervalSeconds / speed;
            }
        }
    }
    updateConfig(config: ShockwaveConfig, boundingRadius?: number): void {
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
        this.ringMats = [];
        this.flashMats = [];
        this.ringStates = [];
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
