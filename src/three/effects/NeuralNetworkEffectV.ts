import * as THREE from 'three';
import type { NeuralNetworkConfig } from "../../types/generativeEffects";

const pulseVert = /* glsl */ `
  attribute float aBright;
  uniform float   uSize;
  varying float   vB;
  void main() {
    vB = aBright;
    if (vB < 0.01) { gl_PointSize = 0.0; gl_Position = vec4(0); return; }
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * vB * (200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const pulseFrag = /* glsl */ `
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
const MAX_PULSES = 4;
export class NeuralNetworkEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private orbitAngles = new Float32Array(0);
    private pulses = [];
    private nextPulse = 0;
    private effectScene = null;
    private tmpMat = new THREE.Matrix4();
    private tmpQuat = new THREE.Quaternion();
    private tmpVec = new THREE.Vector3();
    private N = 20;
    constructor(scene: THREE.Scene, config: NeuralNetworkConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { nodeCount, nodeColor, pulseColor, opacity, intensity } = this.config;
        const r = this.boundingRadius * 1.35;
        const N = Math.max(8, Math.min(nodeCount, 40));
        this.N = N;
        const basePos = [];
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < N; i++) {
            const y = 1 - (i / (N - 1)) * 2;
            const rad = Math.sqrt(1 - y * y) * r;
            const phi = i * goldenAngle;
            basePos.push(new THREE.Vector3(Math.cos(phi) * rad, y * r, Math.sin(phi) * rad));
        }
        const orbitAxes = Array.from({ length: N }, () => new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize());
        const orbitSpeeds = Array.from({ length: N }, () => 0.4 + Math.random() * 0.6);
        const angles = new Float32Array(N);
        for (let i = 0; i < N; i++)
            angles[i] = i * 0.7;
        this.orbitAngles = angles;
        const MAX_DIST = r * 0.85;
        const edges = [];
        const degree = new Int32Array(N);
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (degree[i] >= 3 || degree[j] >= 3)
                    continue;
                if (basePos[i].distanceTo(basePos[j]) < MAX_DIST) {
                    edges.push([i, j]);
                    degree[i]++;
                    degree[j]++;
                }
            }
        }
        const edgeVerts = new Float32Array(edges.length * 6);
        const edgeCols = new Float32Array(edges.length * 6);
        const nc = new THREE.Color(nodeColor);
        const DIM = 0.06;
        for (let e = 0; e < edges.length; e++) {
            const [a, b] = edges[e];
            edgeVerts.set([basePos[a].x, basePos[a].y, basePos[a].z, basePos[b].x, basePos[b].y, basePos[b].z], e * 6);
            edgeCols.set([nc.r * DIM, nc.g * DIM, nc.b * DIM, nc.r * DIM, nc.g * DIM, nc.b * DIM], e * 6);
        }
        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgeVerts, 3));
        edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeCols, 3));
        const edgeMat = new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const nodeGeo = new THREE.SphereGeometry(0.055 * intensity, 8, 8);
        const nc2 = new THREE.Color(nodeColor);
        const nodeMat = new THREE.MeshBasicMaterial({
            color: nc2, transparent: true, opacity: opacity * 0.55,
            depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const nodeMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, N);
        nodeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        const pulsePos = new Float32Array(MAX_PULSES * 3);
        const pulseBright = new Float32Array(MAX_PULSES);
        const pulseGeo = new THREE.BufferGeometry();
        pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
        pulseGeo.setAttribute('aBright', new THREE.BufferAttribute(pulseBright, 1));
        const pc = new THREE.Color(pulseColor);
        const pulseMat = new THREE.ShaderMaterial({
            vertexShader: pulseVert, fragmentShader: pulseFrag,
            uniforms: {
                uSize: { value: 20 * intensity },
                uColor: { value: new THREE.Vector3(pc.r, pc.g, pc.b) },
                uOpacity: { value: opacity },
            },
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        this.pulses = Array.from({ length: MAX_PULSES }, () => ({
            fromIdx: 0, toIdx: 1, progress: 0, active: false,
        }));
        this.nextPulse = 0;
        this.effectScene = { basePos, orbitAxes, orbitSpeeds, edges, edgeGeo, edgeMat, nodeMesh, pulseGeo, pulseMat };
        this.materials.push(pulseMat);
        this.group.add(new THREE.LineSegments(edgeGeo, edgeMat));
        this.group.add(nodeMesh);
        this.group.add(new THREE.Points(pulseGeo, pulseMat));
    }
    update(_elapsed: number, delta: number = 0.016): void {
        if (!this.effectScene)
            return;
        const { speed, orbitSpeed, signalSpeed, intensity } = this.config;
        const dt = delta * speed;
        const { basePos, orbitAxes, orbitSpeeds, edges, edgeGeo, nodeMesh, pulseGeo, pulseMat } = this.effectScene;
        const N = this.N;
        const angles = this.orbitAngles;
        const curPos = [];
        for (let i = 0; i < N; i++) {
            angles[i] += dt * orbitSpeed * orbitSpeeds[i] * 0.4;
            const base = basePos[i];
            const axis = orbitAxes[i];
            const ang = angles[i];
            const cosA = Math.cos(ang), sinA = Math.sin(ang);
            const dot = base.dot(axis);
            this.tmpVec.set(base.x * cosA + (axis.y * base.z - axis.z * base.y) * sinA + axis.x * dot * (1 - cosA), base.y * cosA + (axis.z * base.x - axis.x * base.z) * sinA + axis.y * dot * (1 - cosA), base.z * cosA + (axis.x * base.y - axis.y * base.x) * sinA + axis.z * dot * (1 - cosA));
            curPos.push(this.tmpVec.clone());
            this.tmpMat.compose(this.tmpVec, this.tmpQuat, new THREE.Vector3(1, 1, 1));
            nodeMesh.setMatrixAt(i, this.tmpMat);
        }
        nodeMesh.instanceMatrix.needsUpdate = true;
        const edgePosAttr = edgeGeo.attributes.position;
        for (let e = 0; e < edges.length; e++) {
            const [a, b] = edges[e];
            edgePosAttr.setXYZ(e * 2, curPos[a].x, curPos[a].y, curPos[a].z);
            edgePosAttr.setXYZ(e * 2 + 1, curPos[b].x, curPos[b].y, curPos[b].z);
        }
        edgePosAttr.needsUpdate = true;
        this.nextPulse -= delta;
        if (this.nextPulse <= 0 && edges.length > 0) {
            this.nextPulse = 0.4 / speed;
            const idle = this.pulses.findIndex(p => !p.active);
            if (idle >= 0) {
                const e = Math.floor(Math.random() * edges.length);
                this.pulses[idle] = { fromIdx: edges[e][0], toIdx: edges[e][1], progress: 0, active: true };
            }
        }
        const ptPos = pulseGeo.attributes.position;
        const ptBright = pulseGeo.attributes.aBright;
        this.pulses.forEach((p, pi) => {
            if (!p.active) {
                ptBright.setX(pi, 0);
                return;
            }
            p.progress += dt * signalSpeed * 0.9;
            if (p.progress >= 1) {
                p.active = false;
                ptBright.setX(pi, 0);
                return;
            }
            const pos = curPos[p.fromIdx].clone().lerp(curPos[p.toIdx], p.progress);
            ptPos.setXYZ(pi, pos.x, pos.y, pos.z);
            ptBright.setX(pi, 0.7 + 0.3 * Math.sin(p.progress * Math.PI));
        });
        ptPos.needsUpdate = true;
        ptBright.needsUpdate = true;
        pulseMat.uniforms.uSize.value = 20 * intensity;
    }
    updateConfig(config: NeuralNetworkConfig, boundingRadius?: number): void {
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
        this.effectScene = null;
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
