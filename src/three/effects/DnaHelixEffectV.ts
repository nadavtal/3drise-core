import * as THREE from 'three';
import type { DnaHelixConfig } from "../../types/generativeEffects";

const dotVert = /* glsl */ `
  attribute float aPhase;
  uniform float   uSize;
  uniform float   u_time;
  varying float   vP;
  void main() {
    vP = 0.55 + 0.45 * sin(u_time * 2.0 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * vP * (200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const dotFrag = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vP;
  void main() {
    vec2  c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.2, 0.0, d);
    float halo = exp(-d * d * 4.5) * 0.6;
    gl_FragColor = vec4(uColor + vec3(core * 0.5), (core + halo) * vP * uOpacity);
  }
`;
const boltPtVert = /* glsl */ `
  attribute float aBright;
  uniform float   uSize;
  varying float   vB;
  void main() {
    vB = aBright;
    vec4 mv      = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * aBright * (200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const boltPtFrag = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vB;
  void main() {
    if (vB < 0.01) discard;
    vec2  c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float g = exp(-dot(c, c) * 5.0);
    gl_FragColor = vec4(uColor, g * vB * uOpacity);
  }
`;
const TURNS = 4;
const BOLT_N = 12;
const BOLT_LEN_T = 0.08;
const BOLTS_PER_STRAND = 2;
const SEGS_PER_BOLT = BOLT_N - 1;
const VERTS_PER_BOLT = SEGS_PER_BOLT * 2;
const BASE_GLOW = 0.12;
const CYAN = new THREE.Color('#00ffee');
const WHITE = new THREE.Color('#ffffff');
function makeRng(seed) {
    let s = (seed * 1664525 + 1013904223) >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}
function helixAt(t, si, numStrands, r, h) {
    const angle = t * Math.PI * 2 * TURNS + si * (Math.PI * 2 / numStrands);
    return new THREE.Vector3(Math.cos(angle) * r, t * h - h / 2, Math.sin(angle) * r);
}
export class DnaHelixEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private strands = [];
    private boltGeo = null;
    private boltPtsGeo = null;
    private boltPtsMat = null;
    private boltStates = [];
    private washProgress = 0;
    private dotMat = null;
    private numStrands = 2;
    private N = 150;
    constructor(scene: THREE.Scene, config: DnaHelixConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { particleCount, strandCount, helixRadius, helixHeight, basePairColor, runningLightEnabled, opacity, intensity } = this.config;
        const r = this.boundingRadius * helixRadius;
        const h = this.boundingRadius * helixHeight;
        const numStrands = Math.min(strandCount, 3);
        this.numStrands = numStrands;
        const N = Math.max(particleCount, 150);
        this.N = N;
        const RUNG_STEP = Math.max(3, Math.floor(N / 22));
        const strandPts = Array.from({ length: numStrands }, () => []);
        for (let si = 0; si < numStrands; si++) {
            for (let i = 0; i < N; i++) {
                strandPts[si].push(helixAt(i / (N - 1), si, numStrands, r, h));
            }
        }
        // Backbones
        this.strands = [];
        for (const pts of strandPts) {
            const pos = new Float32Array(pts.length * 3);
            const col = new Float32Array(pts.length * 3);
            for (let i = 0; i < pts.length; i++) {
                pos[i * 3] = pts[i].x;
                pos[i * 3 + 1] = pts[i].y;
                pos[i * 3 + 2] = pts[i].z;
                col[i * 3] = CYAN.r * BASE_GLOW;
                col[i * 3 + 1] = CYAN.g * BASE_GLOW;
                col[i * 3 + 2] = CYAN.b * BASE_GLOW;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            const mat = new THREE.LineBasicMaterial({
                vertexColors: true, transparent: true, depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            const line = new THREE.Line(geo, mat);
            this.group.add(line);
            this.strands.push({
                line,
                colorBuf: col,
                colorAttr: geo.attributes.color,
                N: pts.length,
            });
        }
        // Rungs
        const rV = [], rC = [];
        const rc = new THREE.Color(basePairColor || '#00ffee');
        for (let i = 0; i < N; i += RUNG_STEP) {
            const a = strandPts[0][i];
            const b = strandPts[1 % numStrands][i];
            rV.push(a.x, a.y, a.z, b.x, b.y, b.z);
            const br = 0.55 + 0.3 * Math.sin((i / (N - 1)) * Math.PI);
            rC.push(rc.r * br, rc.g * br, rc.b * br, rc.r * br, rc.g * br, rc.b * br);
        }
        const rungGeo = new THREE.BufferGeometry();
        rungGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rV), 3));
        rungGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(rC), 3));
        const rungMat = new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: opacity * 0.7,
            depthWrite: false, blending: THREE.AdditiveBlending,
        });
        this.group.add(new THREE.LineSegments(rungGeo, rungMat));
        // Dots
        const dP = [], dPh = [];
        let di = 0;
        for (let i = 0; i < N; i += RUNG_STEP) {
            for (let si = 0; si < numStrands; si++) {
                const p = strandPts[si][i];
                dP.push(p.x, p.y, p.z);
                dPh.push(di * 1.37 + si * 2.09);
                di++;
            }
        }
        const dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dP), 3));
        dotGeo.setAttribute('aPhase', new THREE.BufferAttribute(new Float32Array(dPh), 1));
        const dotMat = new THREE.ShaderMaterial({
            vertexShader: dotVert, fragmentShader: dotFrag,
            uniforms: {
                uSize: { value: 14 * intensity },
                uColor: { value: new THREE.Vector3(0.15, 1.0, 0.93) },
                uOpacity: { value: opacity },
                u_time: { value: 0 },
            },
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        this.dotMat = dotMat;
        this.materials.push(dotMat);
        this.group.add(new THREE.Points(dotGeo, dotMat));
        // Energy bolts
        if (runningLightEnabled) {
            const totalBolts = numStrands * BOLTS_PER_STRAND;
            const totalVerts = totalBolts * VERTS_PER_BOLT;
            const pos2 = new Float32Array(totalVerts * 3);
            const col2 = new Float32Array(totalVerts * 3);
            const boltGeo = new THREE.BufferGeometry();
            boltGeo.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
            boltGeo.setAttribute('color', new THREE.BufferAttribute(col2, 3));
            const boltMat = new THREE.LineBasicMaterial({
                vertexColors: true, transparent: true, depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            this.boltStates = [];
            for (let si = 0; si < numStrands; si++) {
                for (let bi = 0; bi < BOLTS_PER_STRAND; bi++) {
                    this.boltStates.push({
                        si,
                        headT: bi / BOLTS_PER_STRAND,
                        seed: si * 200 + bi * 37 + 1,
                    });
                }
            }
            const totalPts = numStrands * BOLTS_PER_STRAND * BOLT_N;
            const ptPos = new Float32Array(totalPts * 3);
            const ptBright = new Float32Array(totalPts);
            const ptsGeo = new THREE.BufferGeometry();
            ptsGeo.setAttribute('position', new THREE.BufferAttribute(ptPos, 3));
            ptsGeo.setAttribute('aBright', new THREE.BufferAttribute(ptBright, 1));
            const ptsMat = new THREE.ShaderMaterial({
                vertexShader: boltPtVert,
                fragmentShader: boltPtFrag,
                uniforms: {
                    uSize: { value: 18 },
                    uColor: { value: new THREE.Vector3(0.1, 1.0, 0.95) },
                    uOpacity: { value: 1.0 },
                },
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
            });
            this.boltGeo = boltGeo;
            this.boltPtsGeo = ptsGeo;
            this.boltPtsMat = ptsMat;
            this.materials.push(ptsMat);
            this.group.add(new THREE.LineSegments(boltGeo, boltMat));
            this.group.add(new THREE.Points(ptsGeo, ptsMat));
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        const { runningLightEnabled, opacity, speed, intensity } = this.config;
        const r = this.boundingRadius * this.config.helixRadius;
        const h = this.boundingRadius * this.config.helixHeight;
        this.group.rotation.y += delta * speed * 0.18;
        if (this.dotMat)
            this.dotMat.uniforms.u_time.value = elapsed;
        // Backbone color wash
        this.washProgress = (this.washProgress + delta * speed * 0.28) % 1;
        const head = this.washProgress;
        for (const { colorBuf, colorAttr, N } of this.strands) {
            for (let i = 0; i < N; i++) {
                const t = i / (N - 1);
                const dist = Math.min(Math.abs(t - head), 1 - Math.abs(t - head));
                const trail = Math.exp(-dist * 9.0);
                const corona = Math.exp(-dist * dist * 200);
                const bright = BASE_GLOW + (trail * 0.6 + corona * 2.2) * intensity;
                const hm = Math.min(1, corona * 0.7);
                colorBuf[i * 3] = (CYAN.r + (WHITE.r - CYAN.r) * hm) * bright;
                colorBuf[i * 3 + 1] = (CYAN.g + (WHITE.g - CYAN.g) * hm) * bright;
                colorBuf[i * 3 + 2] = (CYAN.b + (WHITE.b - CYAN.b) * hm) * bright;
            }
            colorAttr.needsUpdate = true;
        }
        if (runningLightEnabled && this.boltGeo && this.boltPtsGeo && this.boltPtsMat) {
            const posAttr = this.boltGeo.attributes.position;
            const colAttr = this.boltGeo.attributes.color;
            const ptPosAttr = this.boltPtsGeo.attributes.position;
            const ptBrtAttr = this.boltPtsGeo.attributes.aBright;
            const JITTER = r * 0.20;
            this.boltPtsMat.uniforms.uSize.value = 18 * intensity;
            this.boltPtsMat.uniforms.uOpacity.value = opacity;
            this.boltStates.forEach((bstate, boltIdx) => {
                bstate.headT += delta * speed * 0.18;
                if (bstate.headT >= 1) {
                    bstate.headT -= 1;
                    bstate.seed++;
                }
                const { si, headT, seed } = bstate;
                const rng = makeRng(seed);
                const pts = [];
                const cols = [];
                const bright = [];
                for (let i = 0; i < BOLT_N; i++) {
                    const frac = i / (BOLT_N - 1);
                    const t = headT - BOLT_LEN_T + frac * BOLT_LEN_T;
                    const tw = ((t % 1) + 1) % 1;
                    const p = helixAt(tw, si, this.numStrands, r, h);
                    if (i > 0 && i < BOLT_N - 1) {
                        const lxz = Math.sqrt(p.x * p.x + p.z * p.z);
                        if (lxz > 0.001) {
                            const rx = p.x / lxz, rz = p.z / lxz;
                            const dr = (rng() * 2 - 1) * JITTER;
                            const dt = (rng() * 2 - 1) * JITTER * 0.5;
                            p.x += rx * dr - rz * dt;
                            p.z += rz * dr + rx * dt;
                            p.y += (rng() * 2 - 1) * JITTER * 0.3;
                        }
                    }
                    const trail = Math.exp(-(1 - frac) * 5.0);
                    const corona = Math.exp(-Math.pow((1 - frac) / 0.12, 2) * 2) * 3.5;
                    const b = (trail * 1.0 + corona) * intensity * 1.5;
                    const hm = Math.min(1, corona * 0.55);
                    pts.push([p.x, p.y, p.z]);
                    cols.push([
                        (CYAN.r + (WHITE.r - CYAN.r) * hm) * b,
                        (CYAN.g + (WHITE.g - CYAN.g) * hm) * b,
                        (CYAN.b + (WHITE.b - CYAN.b) * hm) * b,
                    ]);
                    bright.push(Math.min(1, b * 0.7));
                }
                const baseV = boltIdx * VERTS_PER_BOLT;
                for (let j = 0; j < SEGS_PER_BOLT; j++) {
                    const va = baseV + j * 2;
                    posAttr.setXYZ(va, pts[j][0], pts[j][1], pts[j][2]);
                    posAttr.setXYZ(va + 1, pts[j + 1][0], pts[j + 1][1], pts[j + 1][2]);
                    colAttr.setXYZ(va, cols[j][0], cols[j][1], cols[j][2]);
                    colAttr.setXYZ(va + 1, cols[j + 1][0], cols[j + 1][1], cols[j + 1][2]);
                }
                const baseP = boltIdx * BOLT_N;
                for (let i = 0; i < BOLT_N; i++) {
                    ptPosAttr.setXYZ(baseP + i, pts[i][0], pts[i][1], pts[i][2]);
                    ptBrtAttr.setX(baseP + i, bright[i]);
                }
            });
            posAttr.needsUpdate = true;
            colAttr.needsUpdate = true;
            ptPosAttr.needsUpdate = true;
            ptBrtAttr.needsUpdate = true;
        }
    }
    updateConfig(config: DnaHelixConfig, boundingRadius?: number): void {
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
            if (c.material && !Array.isArray(c.material))
                c.material.dispose();
        });
        this.materials.forEach(m => m.dispose());
        this.materials = [];
        this.strands = [];
        this.boltGeo = null;
        this.boltPtsGeo = null;
        this.boltPtsMat = null;
        this.dotMat = null;
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
