import * as THREE from 'three';
import type { ConstellationConfig } from "../../types/generativeEffects";

const starVertShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;

  uniform float u_time;
  uniform float uTwinkleSpeed;
  uniform float uPointSize;

  varying float vAlpha;
  varying float vBrightness;

  void main() {
    float twinkle  = 0.5 + 0.5 * sin(u_time * uTwinkleSpeed + aPhase);
    float twinkle2 = 0.5 + 0.5 * sin(u_time * uTwinkleSpeed * 1.618 + aPhase * 2.3);
    vAlpha      = 0.35 + 0.65 * twinkle;
    vBrightness = twinkle2;

    vec4 mv     = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize * aSize * (twinkle * 0.6 + 0.4) * (260.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const starFragShader = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vBrightness;

  void main() {
    vec2  coord = gl_PointCoord - vec2(0.5);
    float dist  = length(coord);
    if (dist > 0.5) discard;

    float glow = exp(-dist * dist * 10.0);

    float cx = exp(-abs(coord.x) * 16.0) * exp(-coord.y*coord.y * 40.0);
    float cy = exp(-abs(coord.y) * 16.0) * exp(-coord.x*coord.x * 40.0);
    float spike = (cx + cy) * 0.5 * vBrightness;

    float core  = exp(-dist * dist * 80.0);
    vec3  col   = mix(uColor, vec3(1.0, 1.0, 1.0), core * 0.7 + spike * 0.3);

    gl_FragColor = vec4(col, vAlpha * uOpacity * (glow + spike + core));
  }
`;
const lineVertShader = /* glsl */ `
  attribute float aLinePhase;
  attribute float aLineSeed;

  uniform float u_time;
  uniform float uPulseSpeed;

  varying float vLineAlpha;

  void main() {
    float pulse  = 0.5 + 0.5 * sin(u_time * uPulseSpeed + aLinePhase);
    float pulse2 = 0.5 + 0.5 * sin(u_time * uPulseSpeed * aLineSeed + aLinePhase * 1.7);
    vLineAlpha   = pulse * pulse2;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const lineFragShader = /* glsl */ `
  uniform vec3  uColor;
  uniform float uLineOpacity;

  varying float vLineAlpha;

  void main() {
    gl_FragColor = vec4(uColor, vLineAlpha * uLineOpacity);
  }
`;
function fibonacciSphere(count, radius) {
    const positions = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        positions[i * 3] = Math.cos(theta) * r * radius;
        positions[i * 3 + 1] = y * radius;
        positions[i * 3 + 2] = Math.sin(theta) * r * radius;
    }
    return positions;
}
export class ConstellationEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private starMat = null;
    private lineMat = null;
    constructor(scene: THREE.Scene, config: ConstellationConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { starCount, connectRadius, orbitRadius, twinkleSpeed, lineOpacity, starSize, color, opacity } = this.config;
        const r = this.boundingRadius * orbitRadius;
        const connR = this.boundingRadius * connectRadius;
        const c = new THREE.Color(color);
        const colorVec = new THREE.Vector3(c.r, c.g, c.b);
        const positions = fibonacciSphere(starCount, r);
        const phases = new Float32Array(starCount);
        const sizes = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            phases[i] = Math.random() * Math.PI * 2;
            sizes[i] = 0.5 + Math.random() * 1.0;
        }
        const sGeo = new THREE.BufferGeometry();
        sGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        sGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        sGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        const sMat = new THREE.ShaderMaterial({
            vertexShader: starVertShader,
            fragmentShader: starFragShader,
            uniforms: {
                u_time: { value: 0 },
                uTwinkleSpeed: { value: twinkleSpeed },
                uPointSize: { value: starSize * 220 },
                uColor: { value: colorVec },
                uOpacity: { value: opacity },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.starMat = sMat;
        this.materials.push(sMat);
        this.group.add(new THREE.Points(sGeo, sMat));
        // Connection lines
        const lineVerts = [];
        const linePhases = [];
        const lineSeeds = [];
        for (let i = 0; i < starCount; i++) {
            for (let j = i + 1; j < starCount; j++) {
                const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
                const bx = positions[j * 3], by = positions[j * 3 + 1], bz = positions[j * 3 + 2];
                const dx = ax - bx, dy = ay - by, dz = az - bz;
                if (Math.sqrt(dx * dx + dy * dy + dz * dz) < connR) {
                    lineVerts.push(ax, ay, az, bx, by, bz);
                    const ph = Math.random() * Math.PI * 2;
                    const sd = 0.5 + Math.random() * 1.5;
                    linePhases.push(ph, ph);
                    lineSeeds.push(sd, sd);
                }
            }
        }
        const lGeo = new THREE.BufferGeometry();
        lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
        lGeo.setAttribute('aLinePhase', new THREE.BufferAttribute(new Float32Array(linePhases), 1));
        lGeo.setAttribute('aLineSeed', new THREE.BufferAttribute(new Float32Array(lineSeeds), 1));
        const lMat = new THREE.ShaderMaterial({
            vertexShader: lineVertShader,
            fragmentShader: lineFragShader,
            uniforms: {
                u_time: { value: 0 },
                uPulseSpeed: { value: 0.4 },
                uColor: { value: colorVec },
                uLineOpacity: { value: lineOpacity },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.lineMat = lMat;
        this.materials.push(lMat);
        this.group.add(new THREE.LineSegments(lGeo, lMat));
    }
    update(elapsed: number, delta: number = 0.016): void {
        const { speed } = this.config;
        this.group.rotation.y += delta * speed * 0.18;
        this.group.rotation.x += delta * speed * 0.04;
        if (this.starMat)
            this.starMat.uniforms.u_time.value = elapsed;
        if (this.lineMat)
            this.lineMat.uniforms.u_time.value = elapsed;
    }
    updateConfig(config: ConstellationConfig, boundingRadius?: number): void {
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
        this.starMat = null;
        this.lineMat = null;
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
