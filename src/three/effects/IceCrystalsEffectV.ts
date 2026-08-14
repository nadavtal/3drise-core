import * as THREE from 'three';
import type { IceCrystalsConfig } from "../../types/generativeEffects";

const spikeVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const spikeFrag = /* glsl */ `
  uniform vec3  uIceColor;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec3  vNormal;
  varying vec3  vWorldPos;

  void main() {
    vec3 viewDir  = normalize(cameraPosition - vWorldPos);
    vec3 n        = normalize(vNormal);

    vec3 h        = normalize(viewDir + vec3(0.6, 1.0, 0.4));
    float spec    = pow(max(dot(n, h), 0.0), 38.0) * 2.5;

    float fresnel = pow(1.0 - abs(dot(n, viewDir)), 2.0);

    float shade   = 0.5 + 0.5 * abs(dot(n, normalize(vec3(1.0, 2.0, 0.5))));

    vec3  col   = uIceColor * shade + vec3(spec) + vec3(0.6, 0.9, 1.0) * fresnel * 0.5;
    float alpha = (shade * 0.5 + fresnel * 0.35 + spec * 0.15) * uOpacity * uIntensity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;
const frostVert = /* glsl */ `
  attribute float aBaseY;
  attribute float aSize;
  attribute vec2  aXZ;
  uniform float   u_time;
  uniform float   uRange;
  varying float   vA;
  void main() {
    float y  = mod(aBaseY - u_time * 0.35, uRange) - uRange * 0.5;
    vec3  pos = vec3(aXZ.x, y, aXZ.y);
    vA = 0.4 + 0.6 * smoothstep(-uRange * 0.5, -uRange * 0.3, y)
             * smoothstep(uRange * 0.5, uRange * 0.3, y);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (180.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const frostFrag = /* glsl */ `
  uniform float uOpacity;
  varying float vA;
  void main() {
    vec2  c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float g = exp(-dot(c, c) * 6.0);
    gl_FragColor = vec4(0.85, 0.95, 1.0, g * vA * uOpacity);
  }
`;
export class IceCrystalsEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private spikeMesh = null;
    private spikeMat = null;
    private frostMat = null;
    private pulseMats = [];
    private timeRef = 0;
    private N = 30;
    constructor(scene: THREE.Scene, config: IceCrystalsConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { spikeCount, spikeLength, frostEnabled, iceColor, opacity, intensity } = this.config;
        const r = this.boundingRadius;
        const N = Math.max(10, Math.min(spikeCount, 60));
        this.N = N;
        const ic = new THREE.Color(iceColor);
        const spikeLen = r * spikeLength * 0.55;
        const spikeBase = r * 0.055 * intensity;
        const spikeGeo = new THREE.ConeGeometry(spikeBase, spikeLen, 5);
        spikeGeo.translate(0, spikeLen / 2, 0);
        const sMat = new THREE.ShaderMaterial({
            vertexShader: spikeVert,
            fragmentShader: spikeFrag,
            uniforms: {
                uIceColor: { value: new THREE.Vector3(ic.r, ic.g, ic.b) },
                uOpacity: { value: opacity },
                uIntensity: { value: intensity },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        });
        this.spikeMat = sMat;
        this.materials.push(sMat);
        const mesh = new THREE.InstancedMesh(spikeGeo, sMat, N);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.spikeMesh = mesh;
        const tmpPos = new THREE.Vector3();
        const tmpQuat = new THREE.Quaternion();
        const tmpMat = new THREE.Matrix4();
        const UP = new THREE.Vector3(0, 1, 0);
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < N; i++) {
            const y = 1 - (i / (N - 1)) * 2;
            const rad = Math.sqrt(1 - y * y) * r;
            const phi = i * goldenAngle;
            tmpPos.set(Math.cos(phi) * rad, y * r, Math.sin(phi) * rad);
            const dir = tmpPos.clone().normalize();
            tmpQuat.setFromUnitVectors(UP, dir);
            const scaleY = 0.6 + Math.random() * 0.8;
            tmpMat.compose(tmpPos, tmpQuat, new THREE.Vector3(1, scaleY, 1));
            mesh.setMatrixAt(i, tmpMat);
        }
        mesh.instanceMatrix.needsUpdate = true;
        this.group.add(mesh);
        // Store base matrices for pulse animation
        this.pulseMats = Array.from({ length: N }, (_, i) => {
            const m = new THREE.Matrix4();
            mesh.getMatrixAt(i, m);
            return m.clone();
        });
        // Frost particles
        if (frostEnabled) {
            const FN = 180;
            const range = r * 2.5;
            const fBaseY = new Float32Array(FN);
            const fSize = new Float32Array(FN);
            const fXZ = new Float32Array(FN * 2);
            for (let i = 0; i < FN; i++) {
                fBaseY[i] = Math.random() * range;
                fSize[i] = 1.5 + Math.random() * 3.0;
                const a = Math.random() * Math.PI * 2;
                const fr = (0.9 + Math.random() * 0.8) * r;
                fXZ[i * 2] = Math.cos(a) * fr;
                fXZ[i * 2 + 1] = Math.sin(a) * fr;
            }
            const fGeo = new THREE.BufferGeometry();
            fGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FN * 3), 3));
            fGeo.setAttribute('aBaseY', new THREE.BufferAttribute(fBaseY, 1));
            fGeo.setAttribute('aSize', new THREE.BufferAttribute(fSize, 1));
            fGeo.setAttribute('aXZ', new THREE.BufferAttribute(fXZ, 2));
            (fGeo as any).frustumCulled = false;
            const fMat = new THREE.ShaderMaterial({
                vertexShader: frostVert,
                fragmentShader: frostFrag,
                uniforms: {
                    u_time: { value: 0 },
                    uRange: { value: range },
                    uOpacity: { value: opacity * 0.55 },
                },
                transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
            });
            this.frostMat = fMat;
            this.materials.push(fMat);
            this.group.add(new THREE.Points(fGeo, fMat));
        }
    }
    update(_elapsed: number, delta: number = 0.016): void {
        this.timeRef += delta;
        const t = this.timeRef;
        const { pulseSpeed } = this.config;
        if (this.frostMat)
            this.frostMat.uniforms.u_time.value = t;
        if (this.spikeMesh) {
            const tmpMat = new THREE.Matrix4();
            const tmpPos = new THREE.Vector3();
            const tmpQuat = new THREE.Quaternion();
            const tmpScale = new THREE.Vector3();
            for (let i = 0; i < this.N; i++) {
                const base = this.pulseMats[i];
                base.decompose(tmpPos, tmpQuat, tmpScale);
                const pulse = 0.88 + 0.12 * Math.sin(t * pulseSpeed * 1.8 + i * 0.47);
                tmpScale.y = pulse;
                tmpMat.compose(tmpPos, tmpQuat, tmpScale);
                this.spikeMesh.setMatrixAt(i, tmpMat);
            }
            this.spikeMesh.instanceMatrix.needsUpdate = true;
        }
    }
    updateConfig(config: IceCrystalsConfig, boundingRadius?: number): void {
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
        this.spikeMesh = null;
        this.spikeMat = null;
        this.frostMat = null;
        this.pulseMats = [];
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
