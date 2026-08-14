import * as THREE from 'three';
import type { ForcefieldConfig } from "../../types/generativeEffects";

const shieldVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv       = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const shieldFrag = /* glsl */ `
  uniform float u_time;
  uniform float uHexSize;
  uniform vec3  uShieldColor;
  uniform vec3  uRimColor;
  uniform float uOpacity;
  uniform float uIntensity;

  uniform vec3  uHitPos[3];
  uniform float uHitTime[3];

  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec2 vUv;

  vec2 hexCoord(vec2 p) {
    const float SQRT3 = 1.7320508;
    vec2 r = vec2(1.0, SQRT3);
    vec2 h = r * 0.5;
    vec2 a = mod(p,       r) - h;
    vec2 b = mod(p + h,   r) - h;
    return dot(a, a) < dot(b, b) ? a : b;
  }

  float hexEdge(vec2 p, float size) {
    vec2 hc = hexCoord(p / size);
    float d = length(hc);
    return 1.0 - smoothstep(size * 0.38, size * 0.46, d);
  }

  void main() {
    vec3  n   = normalize(vNormal);
    float phi  = atan(n.z, n.x);
    float theta = acos(clamp(n.y, -1.0, 1.0));
    vec2  suv  = vec2(phi / 6.28318, theta / 3.14159);

    float edge = hexEdge(suv, uHexSize);

    vec3  viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - abs(dot(n, viewDir)), 2.5);

    float ripple = 0.0;
    for (int k = 0; k < 3; k++) {
      float age  = u_time - uHitTime[k];
      if (age < 0.0 || age > 2.0) continue;
      float dist = distance(vWorldPos, uHitPos[k]);
      float wave = sin(dist * 14.0 - age * 9.0) * exp(-dist * 2.5) * exp(-age * 1.4);
      ripple    += wave * 0.7;
    }

    vec3  col   = mix(uShieldColor, uRimColor, fresnel * 0.6 + edge * 0.4);
    float alpha = (edge * 0.55 + fresnel * 0.3 + max(0.0, ripple) * 0.45 + 0.04)
                  * uOpacity * uIntensity;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col + uRimColor * ripple * 0.3, alpha);
  }
`;
export class ForcefieldEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private hitSlot = 0;
    private nextHit = 0;
    constructor(scene: THREE.Scene, config: ForcefieldConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { hexSize, shieldColor, rimColor, opacity, intensity } = this.config;
        const sc = new THREE.Color(shieldColor);
        const rc = new THREE.Color(rimColor);
        const mat = new THREE.ShaderMaterial({
            vertexShader: shieldVert,
            fragmentShader: shieldFrag,
            uniforms: {
                u_time: { value: 0 },
                uHexSize: { value: hexSize },
                uShieldColor: { value: new THREE.Vector3(sc.r, sc.g, sc.b) },
                uRimColor: { value: new THREE.Vector3(rc.r, rc.g, rc.b) },
                uOpacity: { value: opacity },
                uIntensity: { value: intensity },
                uHitPos: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
                uHitTime: { value: [-99, -99, -99] },
            },
            transparent: true,
            depthWrite: false,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending,
        });
        this.materials.push(mat);
        this.group.add(new THREE.Mesh(new THREE.SphereGeometry(this.boundingRadius * 1.15, 64, 64), mat));
    }
    update(elapsed: number, delta: number = 0.016): void {
        const mat = this.materials[0];
        if (!mat)
            return;
        mat.uniforms.u_time.value = elapsed;
        const { rippleEnabled, speed } = this.config;
        if (rippleEnabled) {
            this.nextHit -= delta;
            if (this.nextHit <= 0) {
                this.nextHit = 1.4 / speed + Math.random() * 0.8;
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.acos(2 * Math.random() - 1);
                const r = this.boundingRadius * 1.15;
                const slot = this.hitSlot % 3;
                mat.uniforms.uHitPos.value[slot].set(Math.sin(theta) * Math.cos(phi) * r, Math.cos(theta) * r, Math.sin(theta) * Math.sin(phi) * r);
                mat.uniforms.uHitTime.value[slot] = elapsed;
                this.hitSlot++;
            }
        }
    }
    updateConfig(config: ForcefieldConfig, boundingRadius?: number): void {
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
