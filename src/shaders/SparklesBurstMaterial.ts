import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
export interface SparklesBurstMaterialUniforms {
    uTime: {
        value: number;
    };
    /** 0→1 over `durationMs`; JS-driven. */
    uProgress: {
        value: number;
    };
    uRayCount: {
        value: number;
    };
    uCoreColor: {
        value: THREE.Color;
    };
    uBurstColor: {
        value: THREE.Color;
    };
    uIntensity: {
        value: number;
    };
    uOpacity: {
        value: number;
    };
    /** Color a burst shifts toward when the cursor is hovering near it. */
    uHoverColor: {
        value: THREE.Color;
    };
    /** Radius of the hover-glow falloff in NDC units. */
    uHoverRadius: {
        value: number;
    };
    /** Strength of the hover effect. 0 = off. */
    uHoverIntensity: {
        value: number;
    };
    /** Auto-populated each frame by animateUniforms (NDC pointer, -1..1). */
    u_mouse: {
        value: THREE.Vector2;
    };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            sparklesBurstMaterial: any;
        }
    }
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec4 vClipPos;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vClipPos = gl_Position;
  }
`;
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uRayCount;
  uniform vec3  uCoreColor;
  uniform vec3  uBurstColor;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform vec3  uHoverColor;
  uniform float uHoverRadius;
  uniform float uHoverIntensity;
  uniform vec2  u_mouse;
  varying vec2  vUv;
  varying vec4  vClipPos;

  #define PI 3.14159265359

  void main() {
    // Polar coords centered on the quad
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float theta = atan(p.y, p.x);

    // Ease-out cubic expansion: front of the wave reaches r=1 at uProgress=1
    float expand = 1.0 - pow(1.0 - uProgress, 3.0);

    // N rays radiating outward, each as a tapered bright slice
    float angularPhase = theta * uRayCount * 0.5 / PI;
    float rays = pow(0.5 + 0.5 * cos(angularPhase * 2.0 * PI), 12.0);

    // Thin wavefront ring at r = expand
    float wf = smoothstep(expand - 0.04, expand - 0.005, r)
             * (1.0 - smoothstep(expand + 0.005, expand + 0.04, r));

    // Tapered ray length: bright at base, fades at the leading edge
    float rayLen = rays
      * smoothstep(0.02, 0.18, r)
      * (1.0 - smoothstep(expand * 0.4, expand * 1.05, r));

    // Bright soft core that fades during the latter half
    float core = pow(max(0.0, 1.0 - r * 4.0), 4.0)
               * (1.0 - smoothstep(0.25, 0.7, uProgress));

    // Tiny sparkles travelling outward along each ray
    float sparkleR = fract(r * 4.5 - uTime * 1.2);
    float sparkle = pow(1.0 - 2.0 * abs(sparkleR - 0.5), 18.0) * rays;

    float intensity = wf * 1.4 + rayLen * 1.0 + core * 1.2 + sparkle * 0.9;

    // Color gradient: hot core color inner → outer burst color
    vec3 col = mix(uCoreColor, uBurstColor, smoothstep(0.05, expand * 0.9, r));
    col *= 1.0 + intensity * 0.9 * uIntensity;

    // Hover: per-fragment NDC distance to the cursor with smoothstep falloff
    // — 1.0 at cursor, 0.0 at the radius edge. Color and brightness both
    // use the gradient; gated off when uHoverIntensity == 0.
    vec2 fragNdc = vClipPos.xy / vClipPos.w;
    float mouseDist = length(fragNdc - u_mouse);
    float radius = max(uHoverRadius, 0.0001);
    float hoverActive = step(0.0001, uHoverIntensity);
    float hoverFalloff = (1.0 - smoothstep(0.0, radius, mouseDist)) * hoverActive;
    float hoverEffect = hoverFalloff * uHoverIntensity;
    col = mix(col, uHoverColor, hoverFalloff);
    col *= 1.0 + hoverEffect * 2.0;

    // Overall fade-out across the action lifetime
    float fade = 1.0 - smoothstep(0.7, 1.0, uProgress);
    float alpha = intensity * fade * uOpacity;
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
const SparklesBurstMaterial = shaderMaterial({
    uTime: 0,
    uProgress: 0,
    uRayCount: 8,
    uCoreColor: new THREE.Color('#ffffff'),
    uBurstColor: new THREE.Color('#ffaa00'),
    uIntensity: 1.0,
    uOpacity: 1.0,
    uHoverColor: new THREE.Color('#ffffff'),
    uHoverRadius: 0.3,
    uHoverIntensity: 0.0,
    u_mouse: new THREE.Vector2(0, 0),
}, vertexShader, fragmentShader);
extend({ SparklesBurstMaterial });
export { SparklesBurstMaterial };
