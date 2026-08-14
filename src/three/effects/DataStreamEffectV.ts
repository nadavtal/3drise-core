import * as THREE from 'three';
import type { DataStreamConfig } from "../../types/generativeEffects";

const vertexShader = /* glsl */ `
  attribute float aT;
  attribute float aOffset;
  attribute float aStrand;

  uniform float u_time;
  uniform float u_speed;
  uniform float uRadius;
  uniform float uTurns;
  uniform float uHeight;
  uniform float uPointSize;
  uniform float uIntensity;

  varying float vAlpha;
  varying vec3  vColor;

  vec3 palette(float t) {
    vec3 cold = vec3(0.05, 0.15, 0.9);
    vec3 mid  = vec3(0.0,  0.85, 1.0);
    vec3 hot  = vec3(1.0,  0.92, 0.55);
    if (t < 0.5) return mix(cold, mid,  t * 2.0);
    else          return mix(mid,  hot, (t - 0.5) * 2.0);
  }

  void main() {
    const float TAU = 6.28318530718;

    float dir    = aStrand > 0.5 ? -1.0 : 1.0;
    float phase  = aStrand > 0.5 ? TAU * 0.5 : 0.0;
    float t      = fract(aT + aOffset + u_time * u_speed * dir);

    float angle  = t * uTurns * TAU + phase;
    float y      = (t - 0.5) * uHeight;

    float rWave  = uRadius * (1.0 + 0.06 * sin(t * TAU * 3.0 + u_time * 2.0));
    vec3 helixPos = vec3(cos(angle) * rWave, y, sin(angle) * rWave);

    float nearHead = smoothstep(0.0, 0.10, t);
    float nearTail = 1.0 - smoothstep(0.88, 1.0, t);
    vAlpha = nearHead * nearTail;

    float tColor  = aStrand > 0.5 ? 1.0 - t : t;
    vColor        = palette(tColor);
    if (aStrand > 0.5) vColor = mix(vColor, vColor.zxy, 0.25);

    float sizeT  = aStrand > 0.5 ? 1.0 - t : t;
    float sizeMod = 0.3 + 0.7 * pow(sizeT, 0.4);

    vec4 mv = modelViewMatrix * vec4(helixPos, 1.0);
    gl_PointSize = uPointSize * sizeMod * uIntensity * (280.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3  vColor;
  uniform float uOpacity;

  void main() {
    vec2  coord = gl_PointCoord - vec2(0.5);
    float dist  = length(coord);
    if (dist > 0.5) discard;

    float glow  = exp(-dist * dist * 9.0);

    float cx = exp(-abs(coord.x) * 18.0) * exp(-coord.y*coord.y * 28.0);
    float cy = exp(-abs(coord.y) * 18.0) * exp(-coord.x*coord.x * 28.0);
    float star = (cx + cy) * 0.25;

    gl_FragColor = vec4(vColor, vAlpha * uOpacity * (glow + star));
  }
`;
export class DataStreamEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    constructor(scene: THREE.Scene, config: DataStreamConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { particleCount, spiralTurns, streamRadius, inward, particleSize, opacity, speed, intensity } = this.config;
        const r = this.boundingRadius * streamRadius;
        const h = this.boundingRadius * 2.6;
        const total = particleCount * 2;
        const tArr = new Float32Array(total);
        const offsetArr = new Float32Array(total);
        const strandArr = new Float32Array(total);
        for (let i = 0; i < total; i++) {
            const half = i < particleCount ? 0 : 1;
            const localI = i % particleCount;
            tArr[i] = localI / particleCount;
            offsetArr[i] = Math.random();
            strandArr[i] = half;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(total * 3), 3));
        geo.setAttribute('aT', new THREE.BufferAttribute(tArr, 1));
        geo.setAttribute('aOffset', new THREE.BufferAttribute(offsetArr, 1));
        geo.setAttribute('aStrand', new THREE.BufferAttribute(strandArr, 1));
        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0 },
                u_speed: { value: speed * (inward ? -1 : 1) },
                uRadius: { value: r },
                uTurns: { value: spiralTurns },
                uHeight: { value: h },
                uPointSize: { value: particleSize * 80 },
                uIntensity: { value: intensity },
                uOpacity: { value: opacity },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.materials.push(mat);
        this.group.add(new THREE.Points(geo, mat));
    }
    update(elapsed: number, _delta: number = 0.016): void {
        for (const mat of this.materials)
            mat.uniforms.u_time.value = elapsed;
    }
    updateConfig(config: DataStreamConfig, boundingRadius?: number): void {
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
