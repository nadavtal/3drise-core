import * as THREE from 'three';
import type { MoleculesConfig } from "../../types/generativeEffects";

const nodeVertShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;

  uniform float u_time;
  uniform float uPointSize;
  uniform float uIntensity;

  varying float vAlpha;
  varying vec3  vColor;

  vec3 hsv2rgb(float h, float s, float v){
    vec3 rgb=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
    return v*mix(vec3(1.),rgb,s);
  }

  void main() {
    float hue    = mod(aPhase + u_time * 0.08, 1.0);
    float pulse  = 0.5 + 0.5 * sin(u_time * 2.5 + aPhase * 6.28);
    vColor       = hsv2rgb(hue, 0.85, 1.0);
    vAlpha       = 0.55 + 0.45 * pulse;

    vec4 mv       = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize  = uPointSize * aSize * (0.6 + 0.4 * pulse) * uIntensity * (250.0 / -mv.z);
    gl_Position   = projectionMatrix * mv;
  }
`;
const nodeFragShader = /* glsl */ `
  varying float vAlpha;
  varying vec3  vColor;
  uniform float uOpacity;

  void main() {
    vec2  coord = gl_PointCoord - vec2(0.5);
    float dist  = length(coord);
    if (dist > 0.5) discard;

    float glow = exp(-dist * dist * 8.0);
    float cx   = exp(-abs(coord.x) * 20.0) * exp(-coord.y*coord.y * 36.0);
    float cy   = exp(-abs(coord.y) * 20.0) * exp(-coord.x*coord.x * 36.0);
    float spike = (cx + cy) * 0.5;
    float core  = exp(-dist * dist * 80.0);

    vec3 col = mix(vColor, vec3(1.0), core * 0.8 + spike * 0.2);
    gl_FragColor = vec4(col, vAlpha * uOpacity * (glow + spike * 0.6 + core));
  }
`;
export class MoleculesEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private nodeGeo = null;
    private nodeMat = null;
    private bondGeo = null;
    private bondMat = null;
    private tRef = new Float32Array(0);
    private orbitalParams = [];
    private atomPos = [];
    private tmpCol = new THREE.Color();
    constructor(scene: THREE.Scene, config: MoleculesConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { atomCount, orbitRadius, atomSize, showBonds, opacity, intensity } = this.config;
        const r = this.boundingRadius * orbitRadius;
        const PHI = 1.6180339887;
        const pairs = [
            [1, 2, 3], [2, 3, 1], [3, 1, 2], [1, 3, 2], [2, 1, 3], [3, 2, 1],
            [1, 1, 2], [2, 2, 1], [1, 2, 2], [2, 1, 1], [3, 3, 2], [2, 3, 3],
        ];
        this.orbitalParams = Array.from({ length: atomCount }, (_, i) => {
            const [fx, fy, fz] = pairs[i % pairs.length];
            return {
                fx, fy, fz,
                px: (i * PHI * Math.PI) % (Math.PI * 2),
                py: (i * PHI * PHI * Math.PI) % (Math.PI * 2),
                pz: (i * Math.pow(PHI, 3) * Math.PI) % (Math.PI * 2),
                hueBase: i / Math.max(atomCount - 1, 1),
                speedMult: 0.65 + (i % 7) * 0.07,
            };
        });
        this.tRef = new Float32Array(atomCount);
        for (let i = 0; i < atomCount; i++)
            this.tRef[i] = (i / atomCount) * Math.PI * 2;
        this.atomPos = Array.from({ length: atomCount }, () => new THREE.Vector3());
        // Node geometry
        const phases = new Float32Array(atomCount);
        const sizes = new Float32Array(atomCount);
        for (let i = 0; i < atomCount; i++) {
            phases[i] = i / atomCount;
            sizes[i] = 0.8 + Math.random() * 0.6;
        }
        const nodeGeo = new THREE.BufferGeometry();
        nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(atomCount * 3), 3));
        nodeGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        const nodeMat = new THREE.ShaderMaterial({
            vertexShader: nodeVertShader,
            fragmentShader: nodeFragShader,
            uniforms: {
                u_time: { value: 0 },
                uPointSize: { value: atomSize * 200 },
                uIntensity: { value: intensity },
                uOpacity: { value: opacity },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.nodeGeo = nodeGeo;
        this.nodeMat = nodeMat;
        this.materials.push(nodeMat);
        this.group.add(new THREE.Points(nodeGeo, nodeMat));
        // Bond geometry
        if (showBonds) {
            const vertCount = atomCount * 2;
            const bondGeo = new THREE.BufferGeometry();
            const positions = new Float32Array(vertCount * 3);
            const colors = new Float32Array(vertCount * 3);
            bondGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            bondGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            const bondMat = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: opacity * 0.7,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            this.bondGeo = bondGeo;
            this.bondMat = bondMat;
            this.group.add(new THREE.LineSegments(bondGeo, bondMat));
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        const { atomCount, orbitRadius, showBonds, speed } = this.config;
        const r = this.boundingRadius * orbitRadius;
        if (!this.nodeMat || !this.nodeGeo)
            return;
        this.nodeMat.uniforms.u_time.value = elapsed;
        const nodePos = this.nodeGeo.attributes.position;
        for (let i = 0; i < atomCount; i++) {
            this.tRef[i] += delta * speed * this.orbitalParams[i].speedMult;
            const a = this.tRef[i];
            const p = this.orbitalParams[i];
            const x = Math.cos(p.fx * a + p.px) * r;
            const y = Math.sin(p.fy * a + p.py) * r * 0.75;
            const z = Math.sin(p.fz * a + p.pz) * r;
            this.atomPos[i].set(x, y, z);
            nodePos.setXYZ(i, x, y, z);
        }
        nodePos.needsUpdate = true;
        if (showBonds && this.bondGeo) {
            const bondPos = this.bondGeo.attributes.position;
            const bondCol = this.bondGeo.attributes.color;
            for (let i = 0; i < atomCount; i++) {
                const curr = this.atomPos[i];
                const next = this.atomPos[(i + 1) % atomCount];
                bondPos.setXYZ(i * 2, curr.x, curr.y, curr.z);
                bondPos.setXYZ(i * 2 + 1, next.x, next.y, next.z);
                const hue0 = (this.orbitalParams[i].hueBase + elapsed * 0.07) % 1;
                const hue1 = (this.orbitalParams[(i + 1) % atomCount].hueBase + elapsed * 0.07) % 1;
                this.tmpCol.setHSL(hue0, 1.0, 0.6);
                bondCol.setXYZ(i * 2, this.tmpCol.r, this.tmpCol.g, this.tmpCol.b);
                this.tmpCol.setHSL(hue1, 1.0, 0.6);
                bondCol.setXYZ(i * 2 + 1, this.tmpCol.r, this.tmpCol.g, this.tmpCol.b);
            }
            bondPos.needsUpdate = true;
            bondCol.needsUpdate = true;
        }
    }
    updateConfig(config: MoleculesConfig, boundingRadius?: number): void {
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
        if (this.bondMat)
            this.bondMat.dispose();
        this.materials = [];
        this.nodeGeo = null;
        this.nodeMat = null;
        this.bondGeo = null;
        this.bondMat = null;
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
