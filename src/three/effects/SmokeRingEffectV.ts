import * as THREE from 'three';
import type { SmokeRingConfig } from "../../types/generativeEffects";

const ringVert = /* glsl */ `
  attribute float aAngle;
  attribute float aPuff;
  attribute float aPhase;

  uniform float uProgress;
  uniform float uMaxRadius;
  uniform float uThickness;
  uniform float uRiseSpeed;
  uniform float uBaseY;
  uniform float u_time;

  varying float vAlpha;

  void main() {
    if (uProgress < 0.0 || uProgress > 1.0) {
      gl_PointSize = 0.0;
      gl_Position  = vec4(0.0);
      vAlpha = 0.0;
      return;
    }

    float ringR = uMaxRadius * uProgress;

    float tubeR = uThickness * (0.8 + 0.4 * uProgress);
    float tubePhi = aPuff + u_time * 0.4 + aPhase;
    float offR = tubeR * cos(tubePhi);
    float offY = tubeR * sin(tubePhi);

    float r   = ringR + offR;
    float x   = cos(aAngle) * r;
    float z   = sin(aAngle) * r;
    float y   = uBaseY + uProgress * uRiseSpeed + offY;

    float lifeAlpha = smoothstep(0.0, 0.12, uProgress) * smoothstep(1.0, 0.65, uProgress);
    vAlpha = lifeAlpha;

    float puffSize = uThickness * 50.0 * lifeAlpha;

    vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_PointSize = puffSize * (200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const ringFrag = /* glsl */ `
  uniform vec3  uSmokeColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.01) discard;
    vec2  c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float g = exp(-d * d * 3.0);
    gl_FragColor = vec4(uSmokeColor, g * vAlpha * uOpacity);
  }
`;
const PUFFS_PER_RING = 120;
export class SmokeRingEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private ringStates = [];
    constructor(scene: THREE.Scene, config: SmokeRingConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { ringCount, expansionRadius, riseSpeed, intervalSeconds, smokeColor, thickness, opacity, intensity } = this.config;
        const N = Math.max(1, Math.min(ringCount, 4));
        const maxR = this.boundingRadius * expansionRadius;
        const tubeR = this.boundingRadius * thickness;
        const riseH = this.boundingRadius * riseSpeed;
        const sc = new THREE.Color(smokeColor);
        const scv = new THREE.Vector3(sc.r, sc.g, sc.b);
        this.ringStates = Array.from({ length: N }, (_, i) => ({
            progress: 0,
            timer: (i / N) * intervalSeconds,
            active: false,
        }));
        for (let ri = 0; ri < N; ri++) {
            const aAngle = new Float32Array(PUFFS_PER_RING);
            const aPuff = new Float32Array(PUFFS_PER_RING);
            const aPhase = new Float32Array(PUFFS_PER_RING);
            for (let i = 0; i < PUFFS_PER_RING; i++) {
                aAngle[i] = (i / PUFFS_PER_RING) * Math.PI * 2;
                aPuff[i] = Math.random() * Math.PI * 2;
                aPhase[i] = Math.random() * Math.PI * 2;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PUFFS_PER_RING * 3), 3));
            geo.setAttribute('aAngle', new THREE.BufferAttribute(aAngle, 1));
            geo.setAttribute('aPuff', new THREE.BufferAttribute(aPuff, 1));
            geo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
            (geo as any).frustumCulled = false;
            const mat = new THREE.ShaderMaterial({
                vertexShader: ringVert,
                fragmentShader: ringFrag,
                uniforms: {
                    uProgress: { value: -1 },
                    uMaxRadius: { value: maxR },
                    uThickness: { value: tubeR * intensity },
                    uRiseSpeed: { value: riseH },
                    uBaseY: { value: -this.boundingRadius * 0.2 },
                    u_time: { value: 0 },
                    uSmokeColor: { value: scv },
                    uOpacity: { value: opacity },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.NormalBlending,
            });
            this.materials.push(mat);
            this.group.add(new THREE.Points(geo, mat));
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        const { intervalSeconds, speed } = this.config;
        const dt = delta * speed;
        this.ringStates.forEach((ring, ri) => {
            const mat = this.materials[ri];
            if (!mat)
                return;
            mat.uniforms.u_time.value = elapsed;
            if (ring.active) {
                ring.progress += dt * 0.32;
                if (ring.progress >= 1) {
                    ring.active = false;
                    ring.progress = 0;
                    ring.timer = intervalSeconds / speed;
                    mat.uniforms.uProgress.value = -1;
                }
                else {
                    mat.uniforms.uProgress.value = ring.progress;
                }
            }
            else {
                ring.timer -= delta;
                if (ring.timer <= 0) {
                    ring.active = true;
                    ring.progress = 0;
                }
            }
        });
    }
    updateConfig(config: SmokeRingConfig, boundingRadius?: number): void {
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
        this.ringStates = [];
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
