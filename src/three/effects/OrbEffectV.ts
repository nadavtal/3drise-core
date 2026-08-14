import * as THREE from 'three';
import type { OrbConfig } from "../../types/generativeEffects";

const sharedVert = /* glsl */ `
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
const coreFrag = /* glsl */ `
  uniform float u_time;
  uniform vec3  uInnerColor;
  uniform vec3  uOuterColor;
  uniform float uOpacity;
  uniform float uNoiseAmount;
  uniform float uIntensity;
  uniform float uPulseSpeed;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;

  float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  float noise(vec3 p){
    vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){
    float v=0., a=0.5;
    for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.13+vec3(1.7,9.2,3.7); a*=0.5; }
    return v;
  }

  void main() {
    vec3 nCoord = vWorldNormal * 5.5 + vec3(u_time * 0.35, u_time * 0.18, u_time * -0.22);
    float f      = fbm(nCoord);

    float cells  = smoothstep(0.54, 0.72, f) * 4.0;
    float cool   = (1.0 - smoothstep(0.38, 0.50, f)) * 0.3;
    float flares = smoothstep(0.70, 0.85, f) * 6.0;

    float pulse  = 0.85 + 0.15 * sin(u_time * uPulseSpeed * 2.3);
    float limb   = 1.0 - abs(dot(vNormal, vViewDir)) * 0.4;

    vec3 col = mix(uOuterColor, uInnerColor, f * 1.8 + cells * 0.3);
    col += uInnerColor * flares;
    col -= uOuterColor * cool;
    col *= pulse * limb * (1.0 + uNoiseAmount * cells);

    float alpha = (0.85 + cells * 0.15) * uOpacity * uIntensity;
    gl_FragColor = vec4(col, alpha);
  }
`;
const plasmaFrag = /* glsl */ `
  uniform float u_time;
  uniform float uLayerIndex;
  uniform vec3  uInnerColor;
  uniform vec3  uOuterColor;
  uniform float uOpacity;
  uniform float uNoiseAmount;
  uniform float uPulseSpeed;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;

  vec3 hsv2rgb(float h, float s, float v){
    vec3 rgb=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
    return v*mix(vec3(1.),rgb,s);
  }
  float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  float noise(vec3 p){
    vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){ float v=0.,a=0.5; for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.17+vec3(1.7,9.2,3.7);a*=0.5;} return v; }

  void main() {
    vec3 viewDir = normalize(vViewDir);
    float ndv    = abs(dot(vNormal, viewDir));

    float fresnel = pow(1.0 - ndv, 2.5 - uLayerIndex);

    float f = fbm(vWorldNormal * (3.0 + uLayerIndex * 2.0) + vec3(u_time * (0.15 + uLayerIndex * 0.08)));

    float hue      = mod(ndv * 0.5 - uLayerIndex * 0.2 + u_time * 0.05 + f * 0.15, 1.0);
    vec3  iriCol   = hsv2rgb(hue, 0.9 - uLayerIndex * 0.2, 1.0);

    float tendril  = smoothstep(0.62 - uLayerIndex * 0.04, 0.78, f);
    float plasma   = smoothstep(0.50, 0.65, f) * 0.5;

    float pulse    = 0.6 + 0.4 * sin(u_time * uPulseSpeed + uLayerIndex * 2.4);

    vec3 col = iriCol + iriCol * (tendril * 2.0 + plasma);
    col      = mix(col, uInnerColor, tendril * 0.3);

    float noiseBlend = (1.0 - uNoiseAmount) + uNoiseAmount * f;
    float alpha = fresnel * noiseBlend * uOpacity * pulse
                  * (1.0 - uLayerIndex * 0.28) * uIntensity;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;
const glowFrag = /* glsl */ `
  uniform float u_time;
  uniform vec3  uOuterColor;
  uniform float uOpacity;
  uniform float uPulseSpeed;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float ndv    = abs(dot(normalize(vNormal), normalize(vViewDir)));
    float fresnel = pow(1.0 - ndv, 1.2);
    float pulse   = 0.55 + 0.45 * sin(u_time * uPulseSpeed * 0.7 + 1.2);
    float alpha   = fresnel * uOpacity * pulse * 0.5;
    if (alpha < 0.003) discard;
    float hue  = mod(u_time * 0.04, 1.0);
    vec3  tint = mix(uOuterColor, vec3(cos(hue*6.28)*0.5+0.5, cos((hue+0.33)*6.28)*0.5+0.5, cos((hue+0.67)*6.28)*0.5+0.5), 0.25);
    gl_FragColor = vec4(tint, alpha);
  }
`;
const coronaVert = /* glsl */ `
  attribute float aAngle;
  varying float vAngle;
  void main() {
    vAngle      = aAngle;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const coronaFrag = /* glsl */ `
  uniform float u_time;
  uniform vec3  uCoronaColor;
  uniform float uOpacity;
  uniform float uIntensity;
  varying float vAngle;

  vec3 hsv2rgb(float h, float s, float v){
    vec3 rgb=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
    return v*mix(vec3(1.),rgb,s);
  }

  void main() {
    float hue    = mod(vAngle / 6.28318 + u_time * 0.15, 1.0);
    vec3  col    = mix(uCoronaColor, hsv2rgb(hue, 0.8, 1.0), 0.6);
    float pulse  = 0.6 + 0.4 * sin(u_time * 2.5 + vAngle * 3.0);
    float alpha  = uOpacity * pulse * uIntensity;
    gl_FragColor = vec4(col * (1.0 + pulse), alpha);
  }
`;
export class OrbEffectV {
    private scene;
    private group;
    private materials = [];
    private config;
    private boundingRadius;
    private coronaGroup = null;
    private speed = 1;
    constructor(scene: THREE.Scene, config: OrbConfig, boundingRadius: number = 1) {
        this.scene = scene;
        this.config = config;
        this.boundingRadius = boundingRadius;
        this.group = new THREE.Group();
        scene.add(this.group);
        this.build();
    }
    private build() {
        const { coreSize, glowLayers, innerColor, outerColor, coronaEnabled, coronaColor, noiseAmount, pulseSpeed, opacity, speed, intensity } = this.config;
        this.speed = speed;
        const ic = new THREE.Color(innerColor);
        const oc = new THREE.Color(outerColor);
        const cc = new THREE.Color(coronaColor);
        const innerColorVec = new THREE.Vector3(ic.r, ic.g, ic.b);
        const outerColorVec = new THREE.Vector3(oc.r, oc.g, oc.b);
        const coronaColorVec = new THREE.Vector3(cc.r, cc.g, cc.b);
        const coreR = this.boundingRadius * coreSize;
        // Core material
        const coreMat = new THREE.ShaderMaterial({
            vertexShader: sharedVert,
            fragmentShader: coreFrag,
            uniforms: {
                u_time: { value: 0 },
                uInnerColor: { value: innerColorVec },
                uOuterColor: { value: outerColorVec },
                uOpacity: { value: opacity },
                uNoiseAmount: { value: noiseAmount },
                uIntensity: { value: intensity },
                uPulseSpeed: { value: pulseSpeed * speed },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        this.materials.push(coreMat);
        const coreGeo = new THREE.SphereGeometry(coreR, 48, 48);
        this.group.add(new THREE.Mesh(coreGeo, coreMat));
        // Plasma shells
        for (let i = 0; i < glowLayers; i++) {
            const shellMat = new THREE.ShaderMaterial({
                vertexShader: sharedVert,
                fragmentShader: plasmaFrag,
                uniforms: {
                    u_time: { value: 0 },
                    uLayerIndex: { value: glowLayers > 1 ? i / (glowLayers - 1) : 0 },
                    uInnerColor: { value: innerColorVec },
                    uOuterColor: { value: outerColorVec },
                    uOpacity: { value: opacity },
                    uNoiseAmount: { value: noiseAmount },
                    uPulseSpeed: { value: pulseSpeed * speed },
                    uIntensity: { value: intensity },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
            });
            this.materials.push(shellMat);
            const layerT = glowLayers > 1 ? i / (glowLayers - 1) : 0;
            const r = coreR * (1.35 + layerT * layerT * 1.8);
            this.group.add(new THREE.Mesh(new THREE.SphereGeometry(r, 40, 40), shellMat));
        }
        // Outer diffuse glow
        const glowMat = new THREE.ShaderMaterial({
            vertexShader: sharedVert,
            fragmentShader: glowFrag,
            uniforms: {
                u_time: { value: 0 },
                uOuterColor: { value: outerColorVec },
                uOpacity: { value: opacity * 0.6 },
                uPulseSpeed: { value: pulseSpeed * speed },
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
        });
        this.materials.push(glowMat);
        const glowR = coreR * (3.5 + glowLayers * 0.6);
        this.group.add(new THREE.Mesh(new THREE.SphereGeometry(glowR, 32, 32), glowMat));
        // Corona ring
        if (coronaEnabled) {
            const tubeSegs = 80;
            const geo = new THREE.TorusGeometry(coreR * 2.8, coreR * 0.12, 8, tubeSegs);
            const count = geo.attributes.position.count;
            const angles = new Float32Array(count);
            const pos = geo.attributes.position;
            for (let i = 0; i < count; i++) {
                angles[i] = Math.atan2(pos.getZ(i), pos.getX(i)) + Math.PI;
            }
            geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
            const coronaMat = new THREE.ShaderMaterial({
                vertexShader: coronaVert,
                fragmentShader: coronaFrag,
                uniforms: {
                    u_time: { value: 0 },
                    uCoronaColor: { value: coronaColorVec },
                    uOpacity: { value: opacity * 0.85 },
                    uIntensity: { value: intensity },
                },
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            this.materials.push(coronaMat);
            this.coronaGroup = new THREE.Group();
            this.coronaGroup.rotation.set(Math.PI * 0.18, 0, Math.PI * 0.08);
            this.coronaGroup.add(new THREE.Mesh(geo, coronaMat));
            this.group.add(this.coronaGroup);
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        for (const mat of this.materials)
            mat.uniforms.u_time.value = elapsed;
        if (this.coronaGroup) {
            this.coronaGroup.rotation.z += delta * this.speed * 0.4;
        }
    }
    updateConfig(config: OrbConfig, boundingRadius?: number): void {
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
        this.coronaGroup = null;
        this.group.clear();
        if (removeFromScene && this.group.parent)
            this.group.parent.remove(this.group);
    }
}
