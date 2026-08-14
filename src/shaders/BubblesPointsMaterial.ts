import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
export interface BubblesPointsMaterialUniforms {
    uTime: {
        value: number;
    };
    uScale: {
        value: number;
    };
    uColorA: {
        value: THREE.Color;
    };
    uColorB: {
        value: THREE.Color;
    };
    uColorC: {
        value: THREE.Color;
    };
    uOpacity: {
        value: number;
    };
    uIridescence: {
        value: number;
    };
    uPopWindow: {
        value: number;
    };
    uSpeed: {
        value: number;
    };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            bubblesPointsMaterial: any;
        }
    }
}

const vertexShader = /* glsl */ `
  attribute float aAge;
  attribute float aLife;
  attribute float aBaseSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uScale;
  uniform float uPopWindow;
  uniform float uSpeed;
  varying float vAgeN;
  varying float vPopN;
  varying float vPhase;
  void main() {
    vAgeN = clamp(aAge / max(aLife, 1.0), 0.0, 1.0);
    float popStart = 1.0 - uPopWindow;
    vPopN = (vAgeN > popStart) ? (vAgeN - popStart) / uPopWindow : 0.0;
    vPhase = aPhase;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float wobble = 1.0 + sin(uTime * uSpeed * 2.0 + aPhase) * 0.06;
    float popBurst = 1.0 + vPopN * 1.5;
    float size = aBaseSize * wobble * popBurst * uScale;
    gl_PointSize = size * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform float uOpacity;
  uniform float uIridescence;
  uniform float uTime;
  uniform float uSpeed;
  varying float vAgeN;
  varying float vPopN;
  varying float vPhase;

  // Cycle three colors smoothly as t advances. t wraps to [0,1).
  vec3 cycleColors(float t) {
    t = fract(t);
    float s = t * 3.0;
    if (s < 1.0) return mix(uColorA, uColorB, s);
    if (s < 2.0) return mix(uColorB, uColorC, s - 1.0);
    return mix(uColorC, uColorA, s - 2.0);
  }

  vec3 thinFilm(float fresnel, float phase) {
    float t = fresnel + phase * 0.15 + uTime * uSpeed * 0.05;
    return cycleColors(t);
  }

  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r = length(c);
    if (r > 1.0) discard;

    float z = sqrt(max(0.0, 1.0 - r * r));
    vec3 n = vec3(c.x, c.y, z);
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);

    vec3 film = thinFilm(fresnel, vPhase);
    // Base color is the average of the three palette colors so iridescence=0
    // still picks a sensible neutral.
    vec3 baseColor = (uColorA + uColorB + uColorC) / 3.0;
    vec3 col = mix(baseColor, film, uIridescence);

    float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 32.0);

    float popFlash = vPopN * (1.0 - vPopN) * 4.0;

    float lifeFade = 1.0 - smoothstep(0.85, 1.0, vAgeN) * (vPopN > 0.0 ? 0.0 : 1.0);
    float baseAlpha = (fresnel * 0.85 + spec * 0.5 + popFlash * 0.6);
    float alpha = baseAlpha * uOpacity * lifeFade;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(col * (1.0 + spec + popFlash), alpha);
  }
`;
const BubblesPointsMaterial = shaderMaterial({
    uTime: 0,
    uScale: 0.1,
    uColorA: new THREE.Color('#aaccff'),
    uColorB: new THREE.Color('#ffaadd'),
    uColorC: new THREE.Color('#aaffcc'),
    uOpacity: 0.6,
    uIridescence: 0.7,
    uPopWindow: 0.18,
    uSpeed: 1.0,
}, vertexShader, fragmentShader);
extend({ BubblesPointsMaterial });
export { BubblesPointsMaterial };
