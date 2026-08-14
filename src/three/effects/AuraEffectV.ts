import * as THREE from 'three';
import type { AuraConfig } from "../../types/generativeEffects";

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;

  void main() {
    vNormal       = normalize(normalMatrix * normal);
    vWorldNormal  = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mv       = modelViewMatrix * vec4(position, 1.0);
    vViewDir      = normalize(-mv.xyz);
    gl_Position   = projectionMatrix * mv;
  }
`;
const fragmentShader = /* glsl */ `
  uniform float u_time;
  uniform float uFresnelPower;
  uniform float uPulseSpeed;
  uniform float uNoiseAmount;
  uniform float uOpacity;
  uniform float uLayerIndex;  // 0..1
  uniform float uBaseHue;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;

  // ── HSV helper ────────────────────────────────────────────────────────────
  vec3 hsv2rgb(float h, float s, float v) {
    vec3 rgb = clamp(abs(mod(h*6.0+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
    return v * mix(vec3(1.0), rgb, s);
  }

  // ── 3D value noise + 4-octave FBM ─────────────────────────────────────────
  float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  float noise(vec3 p){
    vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),         hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){
    float v=0., a=0.5;
    for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.17+vec3(1.7,9.2,3.7); a*=0.5; }
    return v;
  }

  void main() {
    vec3 viewDir = normalize(vViewDir);

    // ── Fresnel ────────────────────────────────────────────────────────────
    float ndv     = abs(dot(vNormal, viewDir));
    float fresnel = pow(1.0 - ndv, uFresnelPower);

    // ── 4-octave FBM noise ─────────────────────────────────────────────────
    float f = fbm(vWorldNormal * 3.5 + u_time * 0.18);

    // ── Iridescence: hue shifts with view angle AND time ───────────────────
    float hue     = mod(uBaseHue + ndv * 0.45 - uLayerIndex * 0.15 + u_time * 0.04, 1.0);
    vec3  iriCol  = hsv2rgb(hue, 0.85, 1.0);

    // ── Electric tendrils: sharp bright streaks where FBM exceeds threshold ─
    float tendrils = smoothstep(0.60, 0.75, f + uLayerIndex * 0.05);

    // ── Pulse per layer (staggered phase) ──────────────────────────────────
    float pulse = 0.65 + 0.35 * sin(u_time * uPulseSpeed + uLayerIndex * 2.1);

    // ── Combine ────────────────────────────────────────────────────────────
    float noiseBlend = (1.0 - uNoiseAmount) + uNoiseAmount * f;
    float alpha = fresnel * noiseBlend * uOpacity * pulse * (1.0 - uLayerIndex * 0.22) * uIntensity;
    if (alpha < 0.004) discard;

    vec3 col = iriCol + iriCol * tendrils * 1.8;
    gl_FragColor = vec4(col, alpha);
  }
`;
export class AuraEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    constructor(scene: THREE.Scene, config: AuraConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { layerCount, fresnelPower, pulseSpeed, innerColor, noiseAmount, sizeMultiplier, opacity, speed, intensity } = this.config;
        const c = new THREE.Color(innerColor);
        const h = { h: 0, s: 0, l: 0 };
        c.getHSL(h);
        const baseHue = h.h;
        const baseR = this.boundingRadius * sizeMultiplier;
        for (let i = 0; i < layerCount; i++) {
            const mat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    u_time: { value: 0 },
                    uFresnelPower: { value: fresnelPower },
                    uPulseSpeed: { value: pulseSpeed * speed },
                    uNoiseAmount: { value: noiseAmount },
                    uOpacity: { value: opacity },
                    uLayerIndex: { value: layerCount > 1 ? i / (layerCount - 1) : 0 },
                    uBaseHue: { value: baseHue },
                    uIntensity: { value: intensity },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
            });
            this.materials.push(mat);
            const layerT = layerCount > 1 ? i / (layerCount - 1) : 0;
            const r = baseR * (1 + layerT * layerT * 0.5);
            const geo = new THREE.SphereGeometry(r, 40, 40);
            const mesh = new THREE.Mesh(geo, mat);
            this.group.add(mesh);
        }
    }
    update(elapsed: number, _delta: number = 0.016): void {
        for (const mat of this.materials)
            mat.uniforms.u_time.value = elapsed;
    }
    updateConfig(config: AuraConfig, boundingRadius?: number): void {
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
