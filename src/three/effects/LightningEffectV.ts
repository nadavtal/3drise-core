import * as THREE from 'three';
import type { LightningConfig } from "../../types/generativeEffects";

const glowVert = /* glsl */ `
  attribute float aBrightness;
  uniform float uPointSize;
  varying float vB;
  void main() {
    vB           = aBrightness;
    vec4 mv      = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPointSize * aBrightness * (200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const glowFrag = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vB;
  void main() {
    if (vB < 0.01) discard;
    vec2  c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float g = exp(-dot(c, c) * 5.5);
    gl_FragColor = vec4(uColor, g * vB * uOpacity);
  }
`;
const FADE_DUR = 0.22;
function makeRng(seed) {
    let s = (seed * 1664525 + 1013904223) >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}
function fractalPolyline(start, end, depth, rng) {
    if (depth === 0)
        return [start.clone(), end.clone()];
    const mid = start.clone().lerp(end, 0.42 + rng() * 0.16);
    const dir = end.clone().sub(start);
    const len = dir.length();
    dir.normalize();
    let perp1 = new THREE.Vector3(dir.z, 0, -dir.x);
    if (perp1.lengthSq() < 0.001)
        perp1.set(0, dir.z, -dir.y);
    perp1.normalize();
    const perp2 = dir.clone().cross(perp1).normalize();
    const spread = len * 0.38;
    mid.addScaledVector(perp1, (rng() - 0.5) * 2 * spread);
    mid.addScaledVector(perp2, (rng() - 0.5) * spread * 0.7);
    const a = fractalPolyline(start, mid, depth - 1, rng);
    const b = fractalPolyline(mid, end, depth - 1, rng);
    return [...a.slice(0, -1), ...b];
}
export class LightningEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private bolts = [];
    private lineMat = null;
    private glowMats = [];
    private coreCol = new THREE.Color();
    private glowCol = new THREE.Color();
    private depth = 4;
    private N = 17;
    private sr = 1;
    constructor(scene: THREE.Scene, config: LightningConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private boltEndpoints(rng) {
        const theta = rng() * Math.PI * 2;
        const elev = 0.3 + rng() * 0.4;
        return [
            new THREE.Vector3(Math.cos(theta) * this.sr * elev, this.sr * (0.8 + rng() * 0.4), Math.sin(theta) * this.sr * elev),
            new THREE.Vector3((rng() - 0.5) * this.boundingRadius * 0.4, (rng() - 0.5) * this.boundingRadius * 0.3, (rng() - 0.5) * this.boundingRadius * 0.4),
        ];
    }
    private makeGeos(pts, colBuf, brightBuf) {
        const N = this.N;
        const posArr = new Float32Array(N * 3);
        for (let i = 0; i < pts.length && i < N; i++) {
            posArr[i * 3] = pts[i].x;
            posArr[i * 3 + 1] = pts[i].y;
            posArr[i * 3 + 2] = pts[i].z;
        }
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(posArr.slice(), 3));
        lineGeo.setAttribute('color', new THREE.BufferAttribute(colBuf, 3));
        const pointGeo = new THREE.BufferGeometry();
        pointGeo.setAttribute('position', new THREE.BufferAttribute(posArr.slice(), 3));
        pointGeo.setAttribute('aBrightness', new THREE.BufferAttribute(brightBuf, 1));
        return { lineGeo, pointGeo };
    }
    private refreshColors(bolt, overallScale) {
        const { progress, points, colBuf, brightBuf, lineGeo, pointGeo } = bolt;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            if (t > progress + 0.001) {
                colBuf[i * 3] = colBuf[i * 3 + 1] = colBuf[i * 3 + 2] = 0;
                brightBuf[i] = 0;
                continue;
            }
            const behind = progress - t;
            const trail = Math.exp(-behind * 7.0);
            const buildUp = 0.3 + 0.7 * progress;
            const corona = Math.exp(-behind * behind * 220) * 3.0;
            const totalBri = (trail * buildUp + corona) * this.config.intensity * overallScale;
            const headMix = Math.min(1, corona * 0.5);
            colBuf[i * 3] = (this.glowCol.r + (this.coreCol.r - this.glowCol.r) * headMix) * totalBri;
            colBuf[i * 3 + 1] = (this.glowCol.g + (this.coreCol.g - this.glowCol.g) * headMix) * totalBri;
            colBuf[i * 3 + 2] = (this.glowCol.b + (this.coreCol.b - this.glowCol.b) * headMix) * totalBri;
            brightBuf[i] = Math.min(1, (trail * buildUp * 0.5 + corona * 0.3) * overallScale);
        }
        lineGeo.attributes.color.needsUpdate = true;
        pointGeo.attributes.aBrightness.needsUpdate = true;
    }
    private rebuildShape(bolt) {
        bolt.seed++;
        const rng = makeRng(bolt.seed);
        const [o, t] = this.boltEndpoints(rng);
        bolt.points = fractalPolyline(o, t, this.depth, rng);
        bolt.waitDur = 0.3 + rng() * 1.3;
        bolt.progress = 0;
        const pts = bolt.points;
        const posL = bolt.lineGeo.attributes.position;
        const posP = bolt.pointGeo.attributes.position;
        for (let i = 0; i < pts.length && i < this.N; i++) {
            posL.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
            posP.setXYZ(i, pts[i].x, pts[i].y, pts[i].z);
        }
        posL.needsUpdate = true;
        posP.needsUpdate = true;
    }
    private build() {
        const { boltCount, branchDepth, color, glowColor, opacity, intensity, strikeRadius } = this.config;
        this.depth = Math.min(Math.max(branchDepth, 2), 6);
        this.N = Math.pow(2, this.depth) + 1;
        this.sr = this.boundingRadius * strikeRadius;
        this.coreCol = new THREE.Color(color);
        this.glowCol = new THREE.Color(glowColor);
        const glowVec = new THREE.Vector3(this.glowCol.r, this.glowCol.g, this.glowCol.b);
        this.lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.bolts = Array.from({ length: boltCount }, (_, bi) => {
            const seed = bi * 997 + 1;
            const rng = makeRng(seed);
            const [o, t] = this.boltEndpoints(rng);
            const pts = fractalPolyline(o, t, this.depth, rng);
            const col = new Float32Array(this.N * 3);
            const bri = new Float32Array(this.N);
            const { lineGeo, pointGeo } = this.makeGeos(pts, col, bri);
            return {
                phase: 'wait', timer: (bi / boltCount) * 1.8,
                progress: 0, seed, waitDur: 0.5 + rng() * 1.0,
                points: pts, colBuf: col, brightBuf: bri, lineGeo, pointGeo,
            };
        });
        this.glowMats = this.bolts.map(() => new THREE.ShaderMaterial({
            vertexShader: glowVert,
            fragmentShader: glowFrag,
            uniforms: {
                uPointSize: { value: 6 * intensity },
                uColor: { value: glowVec },
                uOpacity: { value: opacity * 0.12 },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        }));
        this.materials.push(...this.glowMats);
        const lineObjects = this.bolts.map(bolt => new THREE.Line(bolt.lineGeo, this.lineMat));
        for (let bi = 0; bi < boltCount; bi++) {
            this.group.add(lineObjects[bi]);
            this.group.add(new THREE.Points(this.bolts[bi].pointGeo, this.glowMats[bi]));
        }
    }
    update(_elapsed: number, delta: number = 0.016): void {
        const { speed, opacity } = this.config;
        const dt = delta * speed;
        this.bolts.forEach((bolt, bi) => {
            switch (bolt.phase) {
                case 'wait':
                    bolt.timer -= delta;
                    bolt.colBuf.fill(0);
                    bolt.brightBuf.fill(0);
                    bolt.lineGeo.attributes.color.needsUpdate = true;
                    bolt.pointGeo.attributes.aBrightness.needsUpdate = true;
                    if (bolt.timer <= 0) {
                        this.rebuildShape(bolt);
                        bolt.phase = 'travel';
                    }
                    break;
                case 'travel':
                    bolt.progress += dt * 8.0;
                    if (bolt.progress >= 1) {
                        bolt.progress = 1;
                        bolt.phase = 'flash';
                        bolt.timer = 0.06 + Math.random() * 0.05;
                    }
                    this.refreshColors(bolt, 1.0);
                    break;
                case 'flash': {
                    bolt.timer -= delta;
                    const flashBoost = 1.0 + Math.max(0, bolt.timer / 0.08) * 2.5;
                    this.refreshColors(bolt, flashBoost);
                    if (bolt.timer <= 0) {
                        bolt.phase = 'fade';
                        bolt.timer = FADE_DUR;
                    }
                    break;
                }
                case 'fade': {
                    bolt.timer -= delta;
                    const ratio = Math.max(0, bolt.timer / FADE_DUR);
                    this.refreshColors(bolt, ratio);
                    this.glowMats[bi].uniforms.uOpacity.value = opacity * 0.12 * ratio;
                    if (bolt.timer <= 0) {
                        bolt.phase = 'wait';
                        bolt.timer = bolt.waitDur;
                        this.glowMats[bi].uniforms.uOpacity.value = opacity * 0.12;
                    }
                    break;
                }
            }
        });
    }
    updateConfig(config: LightningConfig, boundingRadius?: number): void {
        this.config = config;
        if (boundingRadius !== undefined)
            this.boundingRadius = boundingRadius;
        this.dispose(false);
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        this.bolts.forEach(bolt => {
            bolt.lineGeo.dispose();
            bolt.pointGeo.dispose();
        });
        this.bolts = [];
        this.lineMat?.dispose();
        this.lineMat = null;
        this.materials.forEach(m => m.dispose());
        this.materials = [];
        this.glowMats = [];
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
