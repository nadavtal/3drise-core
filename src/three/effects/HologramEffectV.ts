import * as THREE from 'three';
import type { HologramConfig } from "../../types/generativeEffects";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform float u_time;
  uniform float uScanSpeed;
  uniform float uScanlineCount;
  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uFlickerAmount;
  uniform float uGridEnabled;
  uniform float uGlitchOffset;
  uniform float uAberration;
  uniform float uPlaneY;
  uniform float uIntensity;

  varying vec2 vUv;

  float hash(float n){ return fract(sin(n) * 43758.5453); }
  float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  float scanSample(vec2 uv, float t) {
    return step(0.45, fract(uv.y * uScanlineCount + t * uScanSpeed));
  }

  void main() {
    vec2 uv = vUv;
    float t  = u_time;

    float blockY  = floor(uv.y * 8.0);
    float glitchT = hash(blockY + floor(t * 12.0));
    float doGlitch= step(0.94, glitchT);
    uv.x += doGlitch * (hash(blockY * 3.1 + t * 4.0) - 0.5) * uGlitchOffset;
    uv.x  = fract(uv.x);

    float aberr = uAberration * (1.0 + 0.4 * sin(t * 3.0));
    float r_val = scanSample(uv + vec2( aberr, 0.0), t);
    float g_val = scanSample(uv,                     t);
    float b_val = scanSample(uv - vec2( aberr, 0.0), t);
    vec3  scanRGB = vec3(r_val, g_val, b_val);

    float fringe = sin(uv.y * 60.0 + t * 4.0) * sin(uv.x * 40.0 - t * 2.0) * 0.5 + 0.5;
    fringe = pow(fringe, 3.0) * 0.35;

    float grid = 0.0;
    if (uGridEnabled > 0.5) {
      float gx = step(0.93, fract(uv.x * 14.0));
      float gy = step(0.93, fract(uv.y * 14.0));
      grid = max(gx, gy) * 0.5;
    }

    float assembleT  = mod(t * 0.3, 2.5);
    float assembled  = smoothstep(assembleT - 0.4, assembleT, uPlaneY * 0.5 + 0.5);
    float stableT    = smoothstep(0.0, 1.2, assembleT);
    float assembleA  = mix(assembled, 1.0, stableT);

    float flicker = 1.0 - uFlickerAmount * step(0.93, hash(floor(t * 18.0)));

    vec3  hologramColor = uColor * scanRGB;
    float scanBright    = (r_val + g_val + b_val) / 3.0;
    float intensity     = (scanBright * 0.65 + fringe + grid) * flicker * assembleA * uIntensity;
    if (intensity < 0.015) discard;

    gl_FragColor = vec4(hologramColor + uColor * fringe, intensity * uOpacity);
  }
`;
export class HologramEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    constructor(scene: THREE.Scene, config: HologramConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { scanlineCount, scanSpeed, scanColor, gridEnabled, flickerAmount, opacity, speed, intensity } = this.config;
        const c = new THREE.Color(scanColor);
        const colorVec = new THREE.Vector3(c.r, c.g, c.b);
        const planeSize = this.boundingRadius * 2.3;
        const stepY = (this.boundingRadius * 2.5) / Math.max(scanlineCount - 1, 1);
        for (let i = 0; i < scanlineCount; i++) {
            const planeY = (i / Math.max(scanlineCount - 1, 1)) * 2 - 1;
            const mat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    u_time: { value: 0 },
                    uScanSpeed: { value: scanSpeed * speed },
                    uScanlineCount: { value: 5.0 + i * 0.3 },
                    uColor: { value: colorVec },
                    uOpacity: { value: opacity * intensity },
                    uFlickerAmount: { value: flickerAmount },
                    uGridEnabled: { value: gridEnabled ? 1.0 : 0.0 },
                    uGlitchOffset: { value: 0 },
                    uAberration: { value: 0.012 },
                    uPlaneY: { value: planeY },
                    uIntensity: { value: intensity },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            });
            this.materials.push(mat);
            const y = -this.boundingRadius * 1.25 + i * stepY;
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize, 2, 2), mat);
            mesh.position.set(0, y, 0);
            mesh.rotation.set(-Math.PI / 2, 0, 0);
            this.group.add(mesh);
        }
    }
    update(elapsed: number, _delta: number = 0.016): void {
        const { glitchEnabled } = this.config;
        this.materials.forEach((mat, i) => {
            mat.uniforms.u_time.value = elapsed + i * 0.04;
            if (glitchEnabled && Math.random() > 0.985) {
                mat.uniforms.uGlitchOffset.value = (Math.random() - 0.5) * 0.06;
            }
            else {
                mat.uniforms.uGlitchOffset.value *= 0.80;
            }
        });
    }
    updateConfig(config: HologramConfig, boundingRadius?: number): void {
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
