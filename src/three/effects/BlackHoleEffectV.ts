import * as THREE from 'three';
import type { BlackHoleConfig } from "../../types/generativeEffects";

const diskVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const diskFrag = /* glsl */ `
  uniform float u_time;
  uniform float uRotSpeed;
  uniform vec3  uDiskColor;
  uniform float uOpacity;
  uniform float uIntensity;

  varying vec2 vUv;

  vec3 tempColor(float t) {
    vec3 outer = uDiskColor * 0.4;
    vec3 mid   = uDiskColor;
    vec3 inner = vec3(0.85, 0.95, 1.0) * 2.5;
    if (t < 0.5) return mix(outer, mid,   t * 2.0);
    else          return mix(mid,  inner, (t - 0.5) * 2.0);
  }

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vec2  centered = vUv * 2.0 - 1.0;
    float dist     = length(centered);
    if (dist > 1.0 || dist < 0.001) discard;

    float angle = atan(centered.y, centered.x);

    float t = 1.0 - dist;

    float spiral = fract(dist * 6.0 - u_time * uRotSpeed + angle / 6.28318);
    float bands  = pow(spiral, 2.2) * 0.6 + 0.4;

    float bright = pow(t, 0.7) * bands;

    float noise = 0.85 + 0.15 * sin(angle * 7.0 + dist * 18.0 - u_time * 2.5);

    vec3  col   = tempColor(t) * bright * noise;
    float alpha = bright * noise * uOpacity * uIntensity * smoothstep(0.0, 0.08, dist);
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
const lensFrag = /* glsl */ `
  uniform float u_time;
  uniform vec3  uDiskColor;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec3  vNormal;

  void main() {
    vec3  viewDir = normalize(cameraPosition - vNormal * 100.0);
    float ndv     = abs(dot(normalize(vNormal), viewDir));
    float fresnel = pow(1.0 - ndv, 2.2);
    float equator = exp(-ndv * ndv * 6.0) * 2.5;
    float alpha   = (fresnel * 0.4 + equator * 0.6) * uOpacity * uIntensity;
    if (alpha < 0.005) discard;
    vec3 col = mix(uDiskColor, vec3(1.0, 0.92, 0.8), fresnel * 0.5);
    gl_FragColor = vec4(col, alpha);
  }
`;
const lensVert = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const jetVert = /* glsl */ `
  attribute float aT;
  attribute float aPhase;
  uniform float   u_time;
  uniform float   u_speed;
  uniform float   uLength;
  uniform float   uDir;
  uniform float   uRadius;
  varying float   vT;
  void main() {
    float t  = fract(aT + u_time * u_speed);
    vT = t;
    float r  = uRadius * (1.0 - t * 0.85);
    float a  = aPhase + t * 4.0;
    float x  = cos(a) * r;
    float z  = sin(a) * r;
    float y  = uDir * t * uLength;
    vec4  mv = modelViewMatrix * vec4(x, y, z, 1.0);
    gl_PointSize = (1.0 - t) * 6.0 * (200.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;
const jetFrag = /* glsl */ `
  uniform vec3  uJetColor;
  uniform float uOpacity;
  varying float vT;
  void main() {
    vec2  c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;
    float g = exp(-dot(c,c) * 6.0);
    float a = g * uOpacity * (1.0 - vT) * smoothstep(0.0, 0.1, vT);
    if (a < 0.01) discard;
    gl_FragColor = vec4(uJetColor, a);
  }
`;
export class BlackHoleEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    constructor(scene: THREE.Scene, config: BlackHoleConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { diskColor, jetEnabled, jetColor, rotationSpeed, tilt, opacity, speed, intensity } = this.config;
        const r = this.boundingRadius;
        const tiltRad = (tilt * Math.PI) / 180;
        this.group.rotation.set(0, 0, tiltRad);
        const dc = new THREE.Color(diskColor);
        const dcv = new THREE.Vector3(dc.r, dc.g, dc.b);
        const diskMat = new THREE.ShaderMaterial({
            vertexShader: diskVert, fragmentShader: diskFrag,
            uniforms: {
                u_time: { value: 0 },
                uRotSpeed: { value: rotationSpeed },
                uDiskColor: { value: dcv },
                uOpacity: { value: opacity },
                uIntensity: { value: intensity },
            },
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        });
        this.materials.push(diskMat);
        const lensMat = new THREE.ShaderMaterial({
            vertexShader: lensVert, fragmentShader: lensFrag,
            uniforms: {
                u_time: { value: 0 },
                uDiskColor: { value: dcv },
                uOpacity: { value: opacity },
                uIntensity: { value: intensity },
            },
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
        });
        this.materials.push(lensMat);
        // Photon sphere lensing rim
        this.group.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 48, 48), lensMat));
        // Accretion disk
        const diskMesh = new THREE.Mesh(new THREE.RingGeometry(r * 0.38, r * 1.15, 72), diskMat);
        diskMesh.rotation.set(Math.PI / 2, 0, 0);
        this.group.add(diskMesh);
        // Jets
        if (jetEnabled) {
            const JN = 80;
            const jT = new Float32Array(JN);
            const jPhase = new Float32Array(JN);
            for (let i = 0; i < JN; i++) {
                jT[i] = i / JN;
                jPhase[i] = Math.random() * Math.PI * 2;
            }
            const jGeo = new THREE.BufferGeometry();
            jGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(JN * 3), 3));
            jGeo.setAttribute('aT', new THREE.BufferAttribute(jT, 1));
            jGeo.setAttribute('aPhase', new THREE.BufferAttribute(jPhase, 1));
            (jGeo as any).frustumCulled = false;
            const jc = new THREE.Color(jetColor);
            const makeJetMat = (dir) => {
                const m = new THREE.ShaderMaterial({
                    vertexShader: jetVert, fragmentShader: jetFrag,
                    uniforms: {
                        u_time: { value: 0 },
                        u_speed: { value: speed },
                        uLength: { value: r * 2.2 },
                        uDir: { value: dir },
                        uRadius: { value: r * 0.12 },
                        uJetColor: { value: new THREE.Vector3(jc.r, jc.g, jc.b) },
                        uOpacity: { value: opacity * 0.8 },
                    },
                    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
                });
                return m;
            };
            const jetMat1 = makeJetMat(1);
            const jetMat2 = makeJetMat(-1);
            this.materials.push(jetMat1);
            this.materials.push(jetMat2);
            this.group.add(new THREE.Points(jGeo, jetMat1));
            this.group.add(new THREE.Points(jGeo, jetMat2));
        }
    }
    update(elapsed: number, _delta: number = 0.016): void {
        for (const mat of this.materials)
            mat.uniforms.u_time.value = elapsed;
    }
    updateConfig(config: BlackHoleConfig, boundingRadius?: number): void {
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
