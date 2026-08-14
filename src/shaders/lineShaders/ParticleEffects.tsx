import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
export type EffectType = "plasma" | "electric" | "particles" | "rainbow" | "lava" | "frost";

export interface ParticleEffectsProps {
    /**
     * One or more effects rendered simultaneously.
     * Each active effect spawns its own independent particle layer.
     *
     * @example
     * <ParticleEffects effectTypes={["plasma"]} />
     * <ParticleEffects effectTypes={["electric", "lava"]} count={3000} />
     */
    effectTypes: EffectType[];
    /**
     * Total number of particles per effect layer.
     * Default: 2000
     */
    count?: number;
    /**
     * Bounding radius — particles spawn and roam within a sphere of this size.
     * Default: 2.5
     */
    radius?: number;
    /** Animation speed multiplier — 0.2 – 3.0, default 1 */
    speed?: number;
    /** Brightness / alpha multiplier — 0.2 – 2.0, default 1 */
    intensity?: number;
    /**
     * Base particle size in world units.
     * Default: 0.06
     */
    particleSize?: number;
    /**
     * When true particles orbit around the origin.
     * When false they drift freely and respawn.
     * Default: false
     */
    orbit?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────────────────────
const ALL_EFFECTS = [
    "plasma", "electric", "particles", "rainbow", "lava", "frost",
];
const EFFECT_MODE = {
    plasma: 0, electric: 1, particles: 2, rainbow: 3, lava: 4, frost: 5,
};
// ─────────────────────────────────────────────────────────────────────────────
//  GLSL — vertex shader
//
//  Per-particle CPU attributes:
//    aLife     — normalised lifetime 0 (just born) → 1 (about to die)
//    aId       — stable unique float index, used for per-particle hashing
//    aVelocity — xyz drift direction (unit vector × speed)
//    aSize     — base point size scalar
//
//  The vertex shader handles:
//    • size modulation (pulse, flicker, fade at end of life)
//    • position jitter for electric / frost
//    • orbit wobble
// ─────────────────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uMode;
uniform float u_speed;
uniform float uSize;
uniform float uRadius;

attribute float aLife;    // 0 → 1 over particle lifetime
attribute float aId;      // stable unique index per particle
attribute vec3  aVelocity;
attribute float aSize;

varying float vLife;
varying float vId;
varying vec3  vPos;
varying float vNoise;

float hash(float n){ return fract(sin(n)*43758.5453); }
float hash2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(float x){
  float i=floor(x); float f=fract(x);
  float u=f*f*(3.0-2.0*f);
  return mix(hash(i),hash(i+1.0),u);
}

void main(){
  vLife = aLife;
  vId   = aId;
  vPos  = position;

  vec3 p = position;

  // ── per-mode vertex effects ────────────────
  float jitter = 0.0;

  if(uMode == 1.0){ // electric — spark displacement
    float bolt = noise(uTime*u_speed*18.0 + aId*3.7) * 0.12 - 0.06;
    jitter = bolt;
    p += normalize(p + 0.001) * bolt;
  }

  if(uMode == 4.0){ // lava — slow thermal rise
    float rise = noise(uTime*u_speed*0.6 + aId*2.3) * 0.05;
    p.y += rise;
  }

  if(uMode == 5.0){ // frost — crystal drift
    float drift = (noise(uTime*u_speed*0.4 + aId*4.1) - 0.5) * 0.04;
    p += vec3(drift, drift*0.5, -drift*0.3);
  }

  vNoise = jitter;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);

  // ── size ──────────────────────────────────
  float fade   = smoothstep(0.0,0.08,aLife) * smoothstep(1.0,0.85,aLife);
  float sz     = uSize * aSize * fade;

  if(uMode == 0.0){ // plasma — pulsing orbs
    sz *= 1.0 + 0.4*sin(uTime*u_speed*4.0 + aId*6.28);
  }
  if(uMode == 1.0){ // electric — sharp sparks
    sz *= 0.6 + 0.8*noise(uTime*u_speed*30.0 + aId*5.1);
  }
  if(uMode == 2.0){ // particles — varied sizes
    sz *= 0.5 + 1.5*hash(aId*0.37);
  }
  if(uMode == 3.0){ // rainbow — smooth medium
    sz *= 1.2;
  }
  if(uMode == 4.0){ // lava — large blobs
    sz *= 1.4 + 0.6*sin(uTime*u_speed*1.5 + aId*2.1);
  }
  if(uMode == 5.0){ // frost — small crystals
    sz *= 0.5 + 0.5*hash(aId*0.91);
  }

  gl_PointSize = max(sz, 1.0);
}`;
// ─────────────────────────────────────────────────────────────────────────────
//  GLSL — fragment shader
//
//  Each mode renders a distinct particle appearance:
//    plasma    — glowing orb, HSV hue shifts with time + life
//    electric  — sharp white-blue spark with jagged core
//    particles — coloured comet streak (circular sprite with directional tail)
//    rainbow   — smooth iridescent disc, hue from life + id
//    lava      — dark orange→yellow magma blob with bright hotspot
//    frost     — icy white hexagonal shimmer with sparkle
// ─────────────────────────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uMode;
uniform float u_speed;
uniform float uIntensity;

varying float vLife;
varying float vId;
varying vec3  vPos;
varying float vNoise;

float hash(float n){ return fract(sin(n)*43758.5453); }
float noise(float x){
  float i=floor(x); float f=fract(x);
  float u=f*f*(3.0-2.0*f);
  return mix(hash(i),hash(i+1.0),u);
}
vec3 hsv(float h,float s,float v){
  vec3 c=clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);
  return v*mix(vec3(1.0),c,s);
}

// Smooth circular falloff
float disc(vec2 uv){ return 1.0 - smoothstep(0.35,0.5,length(uv-0.5)); }

// Soft glow falloff (wider)
float glow(vec2 uv, float r){ return exp(-pow(length(uv-0.5)/r,2.0)*6.0); }

void main(){
  vec2  uv    = gl_PointCoord;
  float t     = uTime * u_speed;
  float fade  = smoothstep(0.0,0.08,vLife)*smoothstep(1.0,0.82,vLife);
  vec3  col   = vec3(0.0);
  float alpha = 0.0;

  /* ── 0 · PLASMA ──────────────────────────────────────────────────────── */
  if(uMode == 0.0){
    float hue   = fract(vId*0.137 + t*0.07 + vLife*0.3);
    col         = hsv(hue, 0.85, 1.0);
    float core  = glow(uv, 0.18);
    float halo  = glow(uv, 0.42) * 0.35;
    float ring  = smoothstep(0.22,0.26,length(uv-0.5)) *
                  smoothstep(0.30,0.26,length(uv-0.5)) * 0.6;
    alpha       = (core + halo + ring) * fade * uIntensity;
    col         = mix(col, vec3(1.0), core * 0.5);
    col        += hsv(fract(hue+0.5),1.0,0.5) * ring;

  /* ── 1 · ELECTRIC ────────────────────────────────────────────────────── */
  }else if(uMode == 1.0){
    vec2  c2    = uv - 0.5;
    // Jagged star shape
    float ang   = atan(c2.y, c2.x);
    float r     = length(c2);
    float star  = 0.5 * abs(sin(ang * 4.0 + t*20.0 + vId*3.1)) * 0.08 + 0.08;
    float spark = smoothstep(star + 0.01, star - 0.01, r);
    float core  = glow(uv, 0.12);
    float flick = 0.5 + 0.5*sin(t*60.0 + vId*7.3);
    col         = mix(vec3(0.3,0.6,1.0), vec3(0.9,0.95,1.0), core);
    col        += vec3(0.1,0.3,1.0) * spark * 0.5;
    alpha       = (core * 1.2 + spark * 0.6) * flick * fade * uIntensity;

  /* ── 2 · PARTICLES ───────────────────────────────────────────────────── */
  }else if(uMode == 2.0){
    float hue2  = fract(vId*0.271 + t*0.04);
    col         = hsv(hue2, 0.8, 1.0);
    // Elongated comet: bright head at top of sprite, fading trail
    float head  = glow(uv, 0.14);
    float trail = smoothstep(0.5, 0.15, uv.y) * (1.0-uv.x*0.4) *
                  smoothstep(0.55,0.45,abs(uv.x-0.5));
    col         = mix(col, vec3(1.0), head * 0.7);
    alpha       = (head * 1.5 + trail * 0.5) * fade * uIntensity;

  /* ── 3 · RAINBOW ─────────────────────────────────────────────────────── */
  }else if(uMode == 3.0){
    float hue3  = fract(vId*0.193 + t*0.05 + vLife*0.5 + length(uv-0.5)*0.8);
    col         = hsv(hue3, 1.0, 1.0);
    col         = pow(col, vec3(0.6));
    float disc2 = disc(uv);
    float rim   = smoothstep(0.28,0.32,length(uv-0.5)) *
                  smoothstep(0.5, 0.32,length(uv-0.5));
    col        += hsv(fract(hue3+0.33),1.0,1.0) * rim * 0.8;
    alpha       = (disc2 * 0.9 + rim * 0.5) * fade * uIntensity;

  /* ── 4 · LAVA ────────────────────────────────────────────────────────── */
  }else if(uMode == 4.0){
    float heat  = glow(uv, 0.28);
    float hot   = glow(uv, 0.10);
    float crust = smoothstep(0.5,0.3,length(uv-0.5)) *
                  noise(length(uv-0.5)*20.0 + t*2.0 + vId) * 0.6;
    vec3 dark   = vec3(0.12,0.01,0.0);
    vec3 orange = vec3(1.0,0.18,0.0);
    vec3 yellow = vec3(1.0,0.85,0.1);
    col         = mix(dark, orange, heat);
    col         = mix(col,  yellow, hot * 0.9);
    col        += orange * crust;
    alpha       = (heat * 0.9 + hot * 0.5 + crust * 0.3) * fade * uIntensity;

  /* ── 5 · FROST ───────────────────────────────────────────────────────── */
  }else{
    vec2  c5    = uv - 0.5;
    float r5    = length(c5);
    float ang5  = atan(c5.y, c5.x);
    // Hexagonal ice crystal shape
    float hex   = cos(ang5) * cos(ang5 - 1.047) * cos(ang5 + 1.047);
    float crystal = smoothstep(0.22 + hex*0.06, 0.18 + hex*0.06, r5);
    float shim  = noise(r5*30.0 + ang5*4.0 + t*3.0 + vId*5.0);
    float spark = pow(shim, 5.0) * smoothstep(0.25,0.0,r5);
    vec3 ice1   = vec3(0.65,0.88,1.0);
    vec3 ice2   = vec3(0.9, 0.97,1.0);
    col         = mix(ice1, ice2, shim);
    col        += vec3(1.0) * spark * 2.0;
    alpha       = (crystal * 0.7 + spark * 0.8) * fade * uIntensity;
  }

  if(alpha < 0.01) discard;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}`;
function randomOnSphere(r) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return [s * Math.cos(theta) * r, u * r, s * Math.sin(theta) * r];
}
function spawnParticle(p, posArr, radius, mode) {
    const i3 = p.id * 3;
    let x, y, z;
    if (mode === 4) {
        // lava — spawn near equatorial band, drift upward
        const ang = Math.random() * Math.PI * 2;
        const r = radius * (0.5 + Math.random() * 0.5);
        x = Math.cos(ang) * r;
        y = -radius * 0.3 + Math.random() * radius * 0.3;
        z = Math.sin(ang) * r;
        p.vx = (Math.random() - 0.5) * 0.003;
        p.vy = 0.004 + Math.random() * 0.008;
        p.vz = (Math.random() - 0.5) * 0.003;
    }
    else if (mode === 5) {
        // frost — spawn anywhere, drift gently downward
        [x, y, z] = randomOnSphere(radius * (0.3 + Math.random() * 0.7));
        p.vx = (Math.random() - 0.5) * 0.002;
        p.vy = -0.001 - Math.random() * 0.003;
        p.vz = (Math.random() - 0.5) * 0.002;
    }
    else if (mode === 1) {
        // electric — spawn near surface, dart outward
        [x, y, z] = randomOnSphere(radius * 0.9);
        const nx = x / radius, ny = y / radius, nz = z / radius;
        const spd = 0.008 + Math.random() * 0.012;
        p.vx = nx * spd + (Math.random() - 0.5) * 0.005;
        p.vy = ny * spd + (Math.random() - 0.5) * 0.005;
        p.vz = nz * spd + (Math.random() - 0.5) * 0.005;
    }
    else {
        // default — random position within sphere
        const r = radius * Math.cbrt(Math.random());
        [x, y, z] = randomOnSphere(r);
        const spd = 0.002 + Math.random() * 0.005;
        p.vx = (Math.random() - 0.5) * spd;
        p.vy = (Math.random() - 0.5) * spd;
        p.vz = (Math.random() - 0.5) * spd;
    }
    posArr[i3] = x;
    posArr[i3 + 1] = y;
    posArr[i3 + 2] = z;
    p.life = 0;
    p.lifeSpeed = 0.003 + Math.random() * 0.007;
    p.size = 0.6 + Math.random() * 0.8;
}
function buildSim(count, radius, mode) {
    const posArr = new Float32Array(count * 3);
    const lifeArr = new Float32Array(count);
    const idArr = new Float32Array(count);
    const velArr = new Float32Array(count * 3);
    const sizeArr = new Float32Array(count);
    const particles = Array.from({ length: count }, (_, i) => {
        const p = {
            vx: 0, vy: 0, vz: 0,
            life: Math.random(), // stagger initial lifetimes
            lifeSpeed: 0.003 + Math.random() * 0.007,
            size: 0.6 + Math.random() * 0.8,
            id: i,
        };
        spawnParticle(p, posArr, radius, mode);
        p.life = Math.random(); // re-randomise after spawn sets it to 0
        idArr[i] = i;
        sizeArr[i] = p.size;
        return p;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aLife", new THREE.BufferAttribute(lifeArr, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aId", new THREE.BufferAttribute(idArr, 1));
    geo.setAttribute("aVelocity", new THREE.BufferAttribute(velArr, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizeArr, 1));
    return {
        particles, posArr, lifeArr, idArr, velArr, sizeArr, geo,
        dispose: () => geo.dispose(),
    };
}
function tickSim(sim, delta, radius, mode, speed, orbit) {
    const { particles, posArr, lifeArr } = sim;
    const dt = delta * speed;
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const i3 = i * 3;
        p.life += p.lifeSpeed * dt * 60;
        if (p.life >= 1.0) {
            spawnParticle(p, posArr, radius, mode);
            continue;
        }
        if (orbit) {
            // Orbit around Y axis — each particle has its own angular speed
            const ang = (p.id * 0.4 + p.life * 2.0) * dt;
            const cosA = Math.cos(ang);
            const sinA = Math.sin(ang);
            const px = posArr[i3];
            const pz = posArr[i3 + 2];
            posArr[i3] = px * cosA - pz * sinA;
            posArr[i3 + 2] = px * sinA + pz * cosA;
        }
        else {
            posArr[i3] += p.vx * dt * 60;
            posArr[i3 + 1] += p.vy * dt * 60;
            posArr[i3 + 2] += p.vz * dt * 60;
        }
        // Respawn if escaped bounding sphere
        const dx = posArr[i3], dy = posArr[i3 + 1], dz = posArr[i3 + 2];
        if (dx * dx + dy * dy + dz * dz > radius * radius * 1.5) {
            spawnParticle(p, posArr, radius, mode);
        }
        lifeArr[i] = p.life;
    }
    sim.geo.attributes.position.needsUpdate = true;
    sim.geo.attributes.aLife.needsUpdate = true;
}
function makeLayer(count, radius, mode) {
    const sim = buildSim(count, radius, mode);
    const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
            uTime: { value: 0 },
            uMode: { value: mode },
            u_speed: { value: 1 },
            uIntensity: { value: 1 },
            uSize: { value: 80 }, // gl_PointSize base (pixels)
            uRadius: { value: radius },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Points(sim.geo, mat);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    return {
        mesh, mat, sim,
        dispose: () => { mat.dispose(); sim.dispose(); },
    };
}
// ─────────────────────────────────────────────────────────────────────────────
//  Component
//
//  Usage inside any R3F scene or parent group:
//
//  // Standalone, fills a sphere of radius 2.5
//  <ParticleEffects effectTypes={["plasma", "electric"]} />
//
//  // Inside a mesh parent — inherits its transform
//  <group position={[0, 1, 0]}>
//    <ParticleEffects effectTypes={["lava"]} radius={1.5} count={1500} />
//  </group>
// ─────────────────────────────────────────────────────────────────────────────
export default function ParticleEffects({ effectTypes, count = 2000, radius = 2.5, speed = 1, intensity = 1, particleSize = 0.06, orbit = false, }: ParticleEffectsProps) {
    const { scene } = useThree();
    const parentRef = useRef(null);
    // Live prop refs
    const effectTypesRef = useRef(effectTypes);
    const speedRef = useRef(speed);
    const intensityRef = useRef(intensity);
    const orbitRef = useRef(orbit);
    effectTypesRef.current = effectTypes;
    speedRef.current = speed;
    intensityRef.current = intensity;
    orbitRef.current = orbit;
    // pixel size: convert world-unit particleSize to a reasonable gl_PointSize base
    const pixelSize = particleSize * 1200;
    const layers = useMemo(() => {
        return Object.fromEntries(ALL_EFFECTS.map((fx) => [fx, makeLayer(count, radius, EFFECT_MODE[fx])]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count, radius]);
    useEffect(() => {
        const meshes = ALL_EFFECTS.map((fx) => layers[fx].mesh);
        meshes.forEach((m) => scene.add(m));
        return () => {
            meshes.forEach((m) => scene.remove(m));
            ALL_EFFECTS.forEach((fx) => layers[fx].dispose());
        };
    }, [scene, layers]);
    useFrame(({ clock }, delta) => {
        const t = clock.getElapsedTime();
        const sp = speedRef.current;
        const it = intensityRef.current;
        const active = effectTypesRef.current;
        for (const fx of ALL_EFFECTS) {
            const layer = layers[fx];
            const visible = active.includes((fx as any));
            layer.mesh.visible = visible;
            if (!visible)
                continue;
            // Inherit parent world transform
            if (parentRef.current) {
                layer.mesh.matrixWorld.copy(parentRef.current.matrixWorld);
                layer.mesh.matrixAutoUpdate = false;
            }
            // Tick CPU simulation
            tickSim(layer.sim, Math.min(delta, 0.05), radius, EFFECT_MODE[fx], sp, orbitRef.current);
            layer.mat.uniforms.uTime.value = t;
            layer.mat.uniforms.u_speed.value = sp;
            layer.mat.uniforms.uIntensity.value = it;
            layer.mat.uniforms.uSize.value = pixelSize;
        }
    });
    return (<group ref={(g) => {
            if (g)
                parentRef.current = g.parent;
        }} />);
}
