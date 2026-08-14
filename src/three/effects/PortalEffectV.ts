import * as THREE from 'three';
import type { PortalConfig } from "../../types/generativeEffects";

const discVertShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const discFragShader = /* glsl */ `
  uniform float u_time;
  uniform float uSpiralTurns;
  uniform float uRotationSpeed;
  uniform vec3  uInnerColor;
  uniform vec3  uOuterColor;
  uniform float uOpacity;
  uniform float uIntensity;

  varying vec2 vUv;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2  centered = vUv * 2.0 - 1.0;
    float dist     = length(centered);
    if (dist > 1.0) discard;

    float angle = atan(centered.y, centered.x);
    const float TAU = 6.28318530718;
    float t     = u_time * uRotationSpeed;

    float s1 = fract(dist * uSpiralTurns        - angle / TAU + t);
    float s2 = fract(dist * uSpiralTurns * 0.6  + angle / TAU - t * 1.4);
    float s3 = fract(dist * uSpiralTurns * 2.2  - angle / TAU * 1.5 + t * 2.1);

    float w3    = pow(1.0 - dist, 2.0);
    float vortex = s1 * 0.45 + s2 * 0.30 * (1.0 - w3) + s3 * 0.60 * w3;

    float rimRing = exp(-pow((dist - 0.92) / 0.04, 2.0)) * 3.0;
    float rim     = pow(smoothstep(0.85, 1.0, dist), 0.7) * 1.5;

    float core        = exp(-dist * dist * 22.0) * 4.0;
    float singularity = exp(-dist * dist * 90.0) * 8.0;

    float edgeFade = 1.0 - smoothstep(0.72, 1.0, dist);
    float noise    = hash(vec2(dist * 8.0 + t * 0.3, angle));
    float flux     = 0.85 + 0.15 * noise;

    vec3 rimLight = mix(uOuterColor * 2.0, vec3(1.0, 0.9, 0.7), rimRing * 0.5);
    vec3 col      = mix(rimLight, uInnerColor, vortex * 0.7 + core * 0.3) * flux;
    col += vec3(1.0, 0.95, 0.85) * (singularity + core * 0.4);
    col += uOuterColor * rim * 0.8;

    float alpha = (vortex * 0.5 + edgeFade * 0.25 + core * 0.5 + rim * 0.4 + singularity * 0.3)
                  * uOpacity * uIntensity;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
const dustVertShader = /* glsl */ `
  attribute float aAngle;
  attribute float aRadiusOff;
  attribute float aHeightOff;
  attribute float aSpeed;
  attribute float aPhase;

  uniform float u_time;
  uniform float uRadius;
  uniform float uPointSize;
  uniform float u_speed;

  varying float vAlpha;

  void main() {
    const float TAU = 6.28318530718;

    float angle = aAngle + u_time * u_speed * aSpeed;
    float r     = uRadius * (1.0 + aRadiusOff);
    float y     = uRadius * aHeightOff * sin(angle * 2.3 + aPhase + u_time * 0.7);

    vec3 pos = vec3(cos(angle) * r, y, sin(angle) * r);

    float twinkle = pow(max(0.0, sin(u_time * 1.8 + aPhase)), 6.0);
    float base    = 0.08 + 0.12 * (0.5 + 0.5 * sin(aPhase + u_time * 0.4));
    vAlpha        = base + twinkle * 0.7;

    vec4 mv      = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uPointSize * (0.4 + twinkle * 1.6) * (180.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const dustFragShader = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec2  coord = gl_PointCoord - 0.5;
    float dist  = length(coord);
    if (dist > 0.5) discard;
    float glow  = exp(-dist * dist * 9.0);
    gl_FragColor = vec4(uColor, vAlpha * uOpacity * glow);
  }
`;
export class PortalEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    constructor(scene: THREE.Scene, config: PortalConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { radius, spiralTurns, innerGlowColor, outerGlowColor, rotationSpeed, particleRingEnabled, particleCount, opacity, speed, intensity } = this.config;
        const r = this.boundingRadius * radius;
        const ic = new THREE.Color(innerGlowColor);
        const oc = new THREE.Color(outerGlowColor);
        const innerColorVec = new THREE.Vector3(ic.r, ic.g, ic.b);
        const outerColorVec = new THREE.Vector3(oc.r, oc.g, oc.b);
        const discMat = new THREE.ShaderMaterial({
            vertexShader: discVertShader,
            fragmentShader: discFragShader,
            uniforms: {
                u_time: { value: 0 },
                uSpiralTurns: { value: spiralTurns },
                uRotationSpeed: { value: rotationSpeed * speed },
                uInnerColor: { value: innerColorVec },
                uOuterColor: { value: outerColorVec },
                uOpacity: { value: opacity },
                uIntensity: { value: intensity },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        });
        this.materials.push(discMat);
        const subGroup = new THREE.Group();
        subGroup.rotation.set(-Math.PI / 2, 0, 0);
        subGroup.position.set(0, -this.boundingRadius * 0.75, 0);
        subGroup.add(new THREE.Mesh(new THREE.CircleGeometry(r, 80), discMat));
        if (particleRingEnabled) {
            const count = particleCount;
            const angles = new Float32Array(count);
            const radOffsets = new Float32Array(count);
            const heightOffs = new Float32Array(count);
            const speeds = new Float32Array(count);
            const phases = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                angles[i] = (i / count) * Math.PI * 2 + Math.random() * 0.2;
                radOffsets[i] = (Math.random() - 0.5) * 0.24;
                heightOffs[i] = (Math.random() - 0.5) * 0.16;
                speeds[i] = 0.3 + Math.random() * 1.4;
                phases[i] = Math.random() * Math.PI * 2;
            }
            const dustGeo = new THREE.BufferGeometry();
            dustGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
            dustGeo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
            dustGeo.setAttribute('aRadiusOff', new THREE.BufferAttribute(radOffsets, 1));
            dustGeo.setAttribute('aHeightOff', new THREE.BufferAttribute(heightOffs, 1));
            dustGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
            dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
            const dustCol = new THREE.Color(innerGlowColor).lerp(new THREE.Color('#ffffff'), 0.75);
            const dustColVec = new THREE.Vector3(dustCol.r, dustCol.g, dustCol.b);
            const dustMat = new THREE.ShaderMaterial({
                vertexShader: dustVertShader,
                fragmentShader: dustFragShader,
                uniforms: {
                    u_time: { value: 0 },
                    uRadius: { value: r },
                    uPointSize: { value: 5 * intensity },
                    u_speed: { value: speed * 0.5 },
                    uColor: { value: dustColVec },
                    uOpacity: { value: opacity * 0.6 },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            this.materials.push(dustMat);
            subGroup.add(new THREE.Points(dustGeo, dustMat));
        }
        this.group.add(subGroup);
    }
    update(elapsed: number, _delta: number = 0.016): void {
        for (const mat of this.materials)
            mat.uniforms.u_time.value = elapsed;
    }
    updateConfig(config: PortalConfig, boundingRadius?: number): void {
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
