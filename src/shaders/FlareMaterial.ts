import { Vector2, Vector3 } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { NOISE_GLSL } from "./sunNoise";
export interface FlareMaterialUniforms {
    u_time: {
        value: number;
    };
    u_speed: {
        value: number;
    };
    u_frequency: {
        value: number;
    };
    u_reach: {
        value: number;
    };
    u_intensity: {
        value: number;
    };
    u_decay: {
        value: number;
    };
    u_widthScale: {
        value: number;
    };
    u_fringeIntensity: {
        value: number;
    };
    u_rootColor: {
        value: Vector3;
    };
    u_tipColor: {
        value: Vector3;
    };
    u_shootEnabled: {
        value: number;
    };
    u_shootSpread: {
        value: number;
    };
    u_maskEnabled: {
        value: number;
    };
    u_mask: {
        type: string;
        value: Texture | null;
    };
    u_resolution: {
        value: Vector2;
    };
    u_center: {
        value: Vector2;
    };
    u_limbScreen: {
        value: number;
    };
}

// Vertex shader
const vertexShader = /*glsl*/ `
  varying vec2 vLocal;
  void main() {
    // Plane geometry is 4.4x4.4 -> vLocal in [-2.2, 2.2] core radii.
    vLocal = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Fragment shader
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform float u_speed;
  uniform float u_frequency;
  uniform float u_reach;
  uniform float u_intensity;
  uniform float u_decay;
  uniform float u_widthScale;
  uniform float u_fringeIntensity;
  uniform vec3 u_rootColor;
  uniform vec3 u_tipColor;
  uniform float u_shootEnabled;
  uniform float u_shootSpread;
  uniform float u_maskEnabled;
  uniform sampler2D u_mask;
  uniform vec2 u_resolution;
  uniform vec2 u_center;
  uniform float u_limbScreen;
  varying vec2 vLocal;

  ${NOISE_GLSL}

  float hash1(float n){ return fract(sin(n) * 43758.5453123); }

  // One full burst system (5 explosive slots + fringe) for a given radial
  // frame: r is distance in limb units (root at 1), dir/a the direction.
  // seedOff decouples burst schedules between layers.
  vec4 burstField(float r, vec2 dir, float a, float t, float seedOff) {
    vec3 acc = vec3(0.0);
    float alpha = 0.0;

    for (int i = 0; i < 5; i++) {
      float fi = float(i) + seedOff;
      float period = 4.5 + 3.5 * hash1(fi * 7.31 + 1.7);
      float ph = t * u_frequency / period + hash1(fi * 3.71);
      float cyc = floor(ph);
      float s = fract(ph);                 // 0..1 through this burst's life
      float seed = fi * 19.3 + cyc * 7.07; // new angle/size every cycle

      float ang = hash1(seed) * 6.2831853;
      float width = (0.10 + 0.10 * hash1(seed + 2.0)) * u_widthScale;
      float reach = (0.45 + 0.60 * hash1(seed + 4.0)) * u_reach;

      // Explosive envelope: ~0.05s attack, then decay.
      float env = smoothstep(0.0, 0.05, s) * pow(1.0 - s, u_decay);
      if (env < 0.01) continue;

      // Decelerating ejection front (fast at launch, slows down).
      float front = 1.0 + reach * (1.0 - pow(1.0 - s, 2.0));

      float da = a - ang;
      da = atan(sin(da), cos(da));
      float angProf = exp(-(da * da) / (2.0 * width * width));

      // Ragged plasma texture streaming outward fast.
      float rag = 0.6 + 0.4 * (fbm(vec3(dir * 4.0, r * 3.0 - t * 1.2 + fi * 9.0)) * 0.5 + 0.5);

      // Bright shock blob at the front + trailing column back to the root.
      float blob = exp(-pow((r - front) / 0.12, 2.0));
      float column = (1.0 - smoothstep(front - 0.5, front + 0.03, r)) * smoothstep(0.95, 1.05, r);

      float e = env * angProf * rag * (blob * 1.8 + column * 0.7) * u_intensity;

      float f = clamp((r - 1.0) / max(front - 1.0, 0.05), 0.0, 1.0);
      vec3 c = mix(u_rootColor, u_tipColor, f * 0.8);

      acc += c * e;
      alpha += e;
    }

    // Faint baseline fringe at the root.
    float n = fbm(vec3(dir * 3.0, r * 2.2 - t * 0.45)) * 0.5 + 0.5;
    float f2 = clamp((r - 0.98) / (0.10 + 0.10 * n), 0.0, 1.0);
    float fringe = (1.0 - f2);
    fringe *= fringe * n * u_fringeIntensity;
    acc += mix(u_rootColor * 0.85, u_tipColor * 0.7, f2) * fringe;
    alpha += fringe;

    return vec4(acc, alpha);
  }

  void main() {
    float t = u_time * u_speed;

    // One burst system; u_shootEnabled selects where it roots:
    // center (shooting) vs limb (circular or silhouette).
    float r = 0.0;
    vec2 dir = vec2(1.0, 0.0);
    bool limbValid = false;

    if (u_shootEnabled > 0.5) {
      // --- Shooting mode: bursts root at the plane center. With
      // u_shootSpread = 1.0 a burst travels exactly the same plane
      // distance as it would from the limb — only the root moves. ---
      float len = length(vLocal);
      dir = vLocal / max(len, 1e-4);
      r = 1.0 + len * u_shootSpread;
      limbValid = true;
    } else if (u_maskEnabled > 0.5) {
      // --- Silhouette mode: the limb is wherever the host's screen-space
      // mask ends along this fragment's direction from the host center. ---
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 p2 = (uv - u_center) * vec2(aspect, 1.0);
      float dist = length(p2);
      if (dist > 1e-4) {
        dir = p2 / dist;

        // FIXED-RANGE march out to the bounding silhouette — never just to
        // the fragment, or interior fragments find themselves as the edge.
        float hi = u_limbScreen * 1.05;
        float stepLen = hi / 32.0;
        float edge = 0.0;
        for (int i = 1; i <= 32; i++) {
          float s = stepLen * float(i);
          vec2 su = u_center + (dir * s) / vec2(aspect, 1.0);
          if (texture2D(u_mask, su).r > 0.5) edge = s;
        }
        if (edge > 1e-4) {
          // Binary-search refinement -> sub-pixel edge, smooth limb.
          float lo2 = edge;
          float hi2 = min(edge + stepLen, hi);
          for (int j = 0; j < 6; j++) {
            float m = 0.5 * (lo2 + hi2);
            vec2 su = u_center + (dir * m) / vec2(aspect, 1.0);
            if (texture2D(u_mask, su).r > 0.5) lo2 = m; else hi2 = m;
          }
          edge = 0.5 * (lo2 + hi2);
          r = dist / edge;
          limbValid = true;
        }
      }
    } else {
      // --- Circular mode: limb at radius 1 in billboard units. ---
      r = length(vLocal);
      dir = vLocal / max(r, 1e-4);
      limbValid = true;
    }

    if (!limbValid || r < 0.92 || r > 2.15) discard;

    vec4 b = burstField(r, dir, atan(dir.y, dir.x), t, 0.0);
    float alpha = clamp(b.a, 0.0, 1.0);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(b.rgb, alpha);
  }
`;
// Create the shader material with uniforms
const FlareMaterial = shaderMaterial({
    u_time: 0,
    u_speed: 1.0,
    u_frequency: 1.0,
    u_reach: 1.0,
    u_intensity: 1.0,
    u_decay: 2.2,
    u_widthScale: 1.0,
    u_fringeIntensity: 0.3,
    u_rootColor: new Vector3(1.0, 0.92, 0.65),
    u_tipColor: new Vector3(1.0, 0.35, 0.04),
    u_shootEnabled: 0.0,
    u_shootSpread: 1.0,
    u_maskEnabled: 0.0,
    u_mask: null,
    u_resolution: new Vector2(1, 1),
    u_center: new Vector2(0.5, 0.5),
    u_limbScreen: 0.25
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ FlareMaterial });
export { FlareMaterial };
