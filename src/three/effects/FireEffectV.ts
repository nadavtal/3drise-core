import * as THREE from 'three';
import type { FireConfig } from "../../types/generativeEffects";

const flameVert = /* glsl */ `
  attribute float aT;
  attribute vec2  aBase;
  attribute float aSpeed;
  attribute float aPhase;

  uniform float u_time;
  uniform float u_speed;
  uniform float uHeight;
  uniform float uSpread;
  uniform float uSize;

  varying float vT;

  void main() {
    float t = fract(aT + u_time * u_speed * aSpeed);
    vT = t;

    float spreadScale = 1.0 - t * 0.85;
    float x = aBase.x * spreadScale * uSpread;
    float z = aBase.y * spreadScale * uSpread;

    float sway1 = sin(t * 3.8 + u_time * 1.6 + aPhase)        * 0.18 * uSpread * (1.0 - t);
    float sway2 = sin(t * 6.2 - u_time * 2.3 + aPhase * 1.7)  * 0.09 * uSpread * (1.0 - t);
    x += sway1 + sway2;
    z += cos(t * 4.1 + u_time * 1.9 + aPhase * 0.8) * 0.12 * uSpread * (1.0 - t);

    float y = t * uHeight - uHeight * 0.5;

    gl_PointSize = uSize * (1.0 - t * 0.8) * (200.0 / -(modelViewMatrix * vec4(x, y, z, 1.0)).z);
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(x, y, z, 1.0);
  }
`;
const flameFrag = /* glsl */ `
  uniform vec3  uFlameColor;
  uniform vec3  uTipColor;
  uniform float uOpacity;
  varying float vT;

  void main() {
    vec2  c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float g = exp(-d * d * 5.5);

    float t2 = vT * vT;
    vec3 midCol = mix(uFlameColor, vec3(1.0, 0.65, 0.1), 0.5);
    vec3 col = t2 < 0.4
      ? mix(uFlameColor, midCol,   t2 / 0.4)
      : mix(midCol,     uTipColor, (t2 - 0.4) / 0.6);

    float alpha = g * uOpacity * smoothstep(0.0, 0.12, vT) * (1.0 - smoothstep(0.75, 1.0, vT));
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
const emberVert = /* glsl */ `
  attribute float aT;
  attribute vec3  aDrift;
  attribute float aPhase;

  uniform float u_time;
  uniform float u_speed;
  uniform float uHeight;

  varying float vT;

  void main() {
    float t = fract(aT + u_time * u_speed * 0.4);
    vT = t;

    float x = aDrift.x * t * 1.8 + sin(t * 5.0 + aPhase) * 0.15;
    float y = t * uHeight * 1.3 - uHeight * 0.4;
    float z = aDrift.z * t * 1.8 + cos(t * 4.0 + aPhase) * 0.12;

    gl_PointSize = (1.0 - t) * 5.0 * (200.0 / -(modelViewMatrix * vec4(x, y, z, 1.0)).z);
    gl_Position  = projectionMatrix * modelViewMatrix * vec4(x, y, z, 1.0);
  }
`;
const emberFrag = /* glsl */ `
  uniform float uOpacity;
  varying float vT;

  void main() {
    vec2  c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float g     = exp(-dot(c, c) * 7.0);
    float alpha = g * uOpacity * (1.0 - vT) * smoothstep(0.0, 0.08, vT);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(1.0, 0.65 + (1.0 - vT) * 0.35, 0.2 * (1.0 - vT), alpha);
  }
`;
export class FireEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private flameMat = null;
    private emberMat = null;
    constructor(scene: THREE.Scene, config: FireConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { particleCount, height, spread, flameColor, tipColor, opacity, speed, intensity } = this.config;
        const h = this.boundingRadius * height;
        const s = this.boundingRadius * spread;
        const N = Math.max(50, particleCount);
        const E = Math.floor(N * 0.2);
        // Flame geometry
        const aT = new Float32Array(N);
        const aBase = new Float32Array(N * 2);
        const aSpeed = new Float32Array(N);
        const aPhase = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            aT[i] = i / N;
            const r = Math.sqrt(Math.random()) * s;
            const a = Math.random() * Math.PI * 2;
            aBase[i * 2] = Math.cos(a) * r;
            aBase[i * 2 + 1] = Math.sin(a) * r;
            aSpeed[i] = 0.6 + Math.random() * 0.8;
            aPhase[i] = Math.random() * Math.PI * 2;
        }
        const fGeo = new THREE.BufferGeometry();
        fGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        fGeo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
        fGeo.setAttribute('aBase', new THREE.BufferAttribute(aBase, 2));
        fGeo.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
        fGeo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
        const fc = new THREE.Color(flameColor);
        const tc = new THREE.Color(tipColor);
        const fMat = new THREE.ShaderMaterial({
            vertexShader: flameVert,
            fragmentShader: flameFrag,
            uniforms: {
                u_time: { value: 0 },
                u_speed: { value: speed },
                uHeight: { value: h },
                uSpread: { value: s },
                uSize: { value: 20 * intensity },
                uFlameColor: { value: new THREE.Vector3(fc.r, fc.g, fc.b) },
                uTipColor: { value: new THREE.Vector3(tc.r, tc.g, tc.b) },
                uOpacity: { value: opacity },
            },
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        this.flameMat = fMat;
        this.materials.push(fMat);
        // Ember geometry
        const eT = new Float32Array(E);
        const eDrift = new Float32Array(E * 3);
        const ePhase = new Float32Array(E);
        for (let i = 0; i < E; i++) {
            eT[i] = i / E;
            const a = Math.random() * Math.PI * 2;
            const r = (0.2 + Math.random() * 0.8) * s;
            eDrift[i * 3] = Math.cos(a) * r;
            eDrift[i * 3 + 1] = 0;
            eDrift[i * 3 + 2] = Math.sin(a) * r;
            ePhase[i] = Math.random() * Math.PI * 2;
        }
        const eGeo = new THREE.BufferGeometry();
        eGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(E * 3), 3));
        eGeo.setAttribute('aT', new THREE.BufferAttribute(eT, 1));
        eGeo.setAttribute('aDrift', new THREE.BufferAttribute(eDrift, 3));
        eGeo.setAttribute('aPhase', new THREE.BufferAttribute(ePhase, 1));
        const eMat = new THREE.ShaderMaterial({
            vertexShader: emberVert,
            fragmentShader: emberFrag,
            uniforms: {
                u_time: { value: 0 },
                u_speed: { value: speed },
                uHeight: { value: h },
                uOpacity: { value: opacity * 0.7 },
            },
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        this.emberMat = eMat;
        this.materials.push(eMat);
        const subGroup = new THREE.Group();
        subGroup.position.set(0, this.boundingRadius * 0.1, 0);
        subGroup.add(new THREE.Points(fGeo, fMat));
        subGroup.add(new THREE.Points(eGeo, eMat));
        this.group.add(subGroup);
    }
    update(elapsed: number, _delta: number = 0.016): void {
        if (this.flameMat)
            this.flameMat.uniforms.u_time.value = elapsed;
        if (this.emberMat)
            this.emberMat.uniforms.u_time.value = elapsed;
    }
    updateConfig(config: FireConfig, boundingRadius?: number): void {
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
        this.flameMat = null;
        this.emberMat = null;
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
