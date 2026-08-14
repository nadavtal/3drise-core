import * as THREE from 'three';
import type { AuroraConfig } from "../../types/generativeEffects";

const ribbonVert = /* glsl */ `
  uniform float u_time;
  uniform float uPhase;
  uniform float u_speed;
  uniform float uWaveAmp;
  varying vec2  vUv;

  void main() {
    vec3 pos = position;
    float w1 = sin(pos.y * 2.5 + u_time * u_speed + uPhase)         * uWaveAmp;
    float w2 = sin(pos.y * 1.2 - u_time * u_speed * 0.7 + uPhase * 1.3) * uWaveAmp * 0.5;
    float w3 = sin(pos.y * 4.1 + u_time * u_speed * 1.3 + uPhase * 2.1) * uWaveAmp * 0.18;
    pos.x += w1 + w2 + w3;
    pos.z += sin(pos.y * 3.0 + u_time * u_speed * 0.5 + uPhase * 0.7) * uWaveAmp * 0.3;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;
const ribbonFrag = /* glsl */ `
  uniform float u_time;
  uniform float uHue;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec2  vUv;

  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  void main() {
    float fade = sin(vUv.y * 3.14159);
    fade = pow(fade, 0.6);

    float shimmer = 0.55 + 0.45 * sin(vUv.y * 22.0 + u_time * 2.4 + uHue * 9.0);

    float hEdge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);

    float hue = mod(uHue + vUv.y * 0.14 + u_time * 0.022, 1.0);
    vec3  col = hsl2rgb(hue, 0.92, 0.58 + shimmer * 0.12);

    float alpha = fade * shimmer * hEdge * uOpacity * uIntensity;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
export class AuroraEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private ribbons = [];
    constructor(scene: THREE.Scene, config: AuroraConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { ribbonCount, waveAmplitude, colorShift, arcWidth, opacity, intensity } = this.config;
        const N = Math.max(3, Math.min(ribbonCount, 10));
        const r = this.boundingRadius;
        const w = r * 0.9;
        const h = r * 2.2;
        const rad = r * 1.35;
        const hues = [0.33, 0.38, 0.45, 0.50, 0.57, 0.65, 0.72, 0.78, 0.82, 0.87];
        this.ribbons = [];
        for (let i = 0; i < N; i++) {
            const t = N === 1 ? 0.5 : i / (N - 1);
            const angle = (t - 0.5) * arcWidth * Math.PI;
            const hue = (colorShift + hues[i % hues.length]) % 1;
            const geo = new THREE.PlaneGeometry(w, h, 1, 24);
            const mat = new THREE.ShaderMaterial({
                vertexShader: ribbonVert,
                fragmentShader: ribbonFrag,
                uniforms: {
                    u_time: { value: 0 },
                    uPhase: { value: i * 1.13 + t * Math.PI * 2 },
                    u_speed: { value: 0.55 + Math.random() * 0.3 },
                    uWaveAmp: { value: waveAmplitude * r * 0.55 },
                    uHue: { value: hue },
                    uOpacity: { value: opacity },
                    uIntensity: { value: intensity },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            });
            this.materials.push(mat);
            this.ribbons.push({ mat });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(Math.sin(angle) * rad, r * 0.55, -Math.cos(angle) * rad);
            mesh.rotation.y = angle;
            mesh.rotation.x = 0.08;
            this.group.add(mesh);
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        const { speed } = this.config;
        for (const { mat } of this.ribbons)
            mat.uniforms.u_time.value = elapsed;
        this.group.rotation.y += delta * speed * 0.06;
    }
    updateConfig(config: AuroraConfig, boundingRadius?: number): void {
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
        this.ribbons = [];
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
