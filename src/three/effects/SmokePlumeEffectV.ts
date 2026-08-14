import * as THREE from 'three';
import type { SmokePlumeConfig } from "../../types/generativeEffects";

const smokeVert = /* glsl */ `
  attribute float aT;
  attribute vec2  aBase;
  attribute float aPhase;
  attribute float aRotOff;
  attribute float aSize;

  uniform float u_time;
  uniform float u_speed;
  uniform float uHeight;
  uniform float uSpread;
  uniform float uTurb;
  uniform float uSizeScale;

  varying float vLife;
  varying float vAlpha;

  void main() {
    float life = fract(aT + u_time * u_speed * 0.22);
    vLife = life;

    float expand  = 1.0 + life * 2.5;
    float x = aBase.x * expand * uSpread;
    float z = aBase.y * expand * uSpread;

    float t1 = sin(life * 4.2 + aPhase)               * uTurb * uSpread * life * 0.9;
    float t2 = sin(life * 7.1 + aPhase * 1.7 + 1.3)   * uTurb * uSpread * life * 0.4;
    float t3 = cos(life * 3.5 - aPhase * 0.8)          * uTurb * uSpread * life * 0.3;
    x += t1 + t2;
    z += t3 + t2 * 0.5;

    float y = life * uHeight - uHeight * 0.45;

    float growFade = smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.6, life);
    float sz = aSize * uSizeScale * growFade;

    vAlpha = growFade * growFade;

    vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_PointSize = sz * (200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const smokeFrag = /* glsl */ `
  uniform vec3  uSmokeColor;
  uniform float uOpacity;
  varying float vLife;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.01) discard;

    vec2  c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float g = exp(-d * d * 3.8);

    float darkening = 1.0 - vLife * 0.45;
    vec3  col = uSmokeColor * darkening;

    gl_FragColor = vec4(col, g * vAlpha * uOpacity);
  }
`;
export class SmokePlumeEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    constructor(scene: THREE.Scene, config: SmokePlumeConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { particleCount, height, spread, smokeColor, turbulence, opacity, speed, intensity } = this.config;
        const h = this.boundingRadius * height;
        const s = this.boundingRadius * spread;
        const N = Math.max(40, particleCount);
        const aT = new Float32Array(N);
        const aBase = new Float32Array(N * 2);
        const aPhase = new Float32Array(N);
        const aRotOff = new Float32Array(N);
        const aSize = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            aT[i] = i / N;
            const r = Math.pow(Math.random(), 0.6) * s;
            const a = Math.random() * Math.PI * 2;
            aBase[i * 2] = Math.cos(a) * r;
            aBase[i * 2 + 1] = Math.sin(a) * r;
            aPhase[i] = Math.random() * Math.PI * 2;
            aRotOff[i] = Math.random() * Math.PI * 2;
            aSize[i] = 35 + Math.random() * 45;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
        g.setAttribute('aBase', new THREE.BufferAttribute(aBase, 2));
        g.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
        g.setAttribute('aRotOff', new THREE.BufferAttribute(aRotOff, 1));
        g.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
        (g as any).frustumCulled = false;
        const sc = new THREE.Color(smokeColor);
        const m = new THREE.ShaderMaterial({
            vertexShader: smokeVert,
            fragmentShader: smokeFrag,
            uniforms: {
                u_time: { value: 0 },
                u_speed: { value: speed },
                uHeight: { value: h },
                uSpread: { value: s },
                uTurb: { value: turbulence },
                uSizeScale: { value: intensity },
                uSmokeColor: { value: new THREE.Vector3(sc.r, sc.g, sc.b) },
                uOpacity: { value: opacity },
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
    updateConfig(config: SmokePlumeConfig, boundingRadius?: number): void {
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
