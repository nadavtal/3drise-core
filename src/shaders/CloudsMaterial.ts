import { Vector3, Vector2 } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface CloudsMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_mouse: {
        value: Vector2;
    };
    u_noise: {
        type: string;
        value: Texture | null;
    };
    u_texture: {
        value: Texture | null;
    };
    u_scroll: {
        value: number;
    };
    u_cloudColor: {
        value: Vector3;
    };
    u_lightColor: {
        value: Vector3;
    };
    u_useOriginalImage: {
        value: 1.0 | 0.0;
    };
}

// Vertex shader
const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Fragment shader
const fragmentShader = /*glsl*/ `
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform sampler2D u_noise;
  uniform sampler2D u_texture;
  uniform float u_scroll;
  uniform vec3 u_cloudColor; 
  uniform vec3 u_lightColor;
  uniform float u_useOriginalImage;
  varying vec2 vUv;
  varying vec3 vPosition;
  

  float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 perm(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
  }
  
  void main() {
    vec4 bgColor = texture2D(u_texture, vUv);

    // Spherical UV coordinate processing
    vec2 sphereUV = vUv;
    
    // Compensate for pole distortion by adjusting V coordinate
    float poleCompensation = sin(sphereUV.y * 3.14159);
    poleCompensation = max(poleCompensation, 0.1); // Prevent division by zero at poles
    
    // Create base UV coordinates optimized for sphere geometry
    vec2 uv = sphereUV;
    uv.x *= 2.0; // Stretch horizontally to reduce seam visibility
    uv = (uv - 0.5) * 2.0; // Center and scale
    
    // Use 3D position for more natural noise distribution
    vec3 spherePos = normalize(vPosition);
    
    // Generate noise using both UV and 3D position for better sphere distribution
    float noise1 = noise(vec3(uv * 2.0 + spherePos.xy * 0.5, u_time * 2.0)) * 2.0;
    float noise2 = noise(vec3(spherePos * 3.0 + vec3(u_time * 1.357 - 10.0)));

    // Apply scroll effect with pole compensation
    uv.y -= u_scroll * 0.0001 * poleCompensation;

    // Texture sampling with proper sphere scaling
    uv += texture2D(u_texture, uv * 0.8 - vec2(u_time * 0.05, 0.0)).rg * 0.08 + noise1 * 0.008 * (1.0 - clamp(noise1 * noise1 * 2.0 + 0.2, 0.0, 1.0));

    vec3 tex = texture2D(u_texture, uv * 0.8 - vec2(u_time * 0.02, 0.0)).rgb;

    uv.y -= u_scroll * 0.0001 * poleCompensation;
    vec3 tex1 = texture2D(u_texture, uv * 0.8 - vec2(u_time * 0.08, 0.0)).rgb;

    uv.y -= u_scroll * 0.0001 * poleCompensation;
    vec3 tex2 = texture2D(u_texture, uv * 0.6 + 0.2 - vec2(u_time * 0.1, 0.0)).rgb;

    vec3 fragcolour = tex;

    float shade = tex.r;
    shade *= clamp(noise1 * noise2 * sin(u_time * 3.0), 0.2, 10.0);
    shade += shade * shade * 3.0;
    shade -= (1.0 - clamp(tex1 * 4.0, 0.0, 1.0).r) * 0.2;
    shade -= (1.0 - clamp(tex2 * 4.0, 0.0, 1.0).r) * 0.1;

    // Conditional color mixing
    if (u_useOriginalImage > 0.5) {

    } else {
      // Use custom cloud colors
      fragcolour = mix(u_cloudColor, u_lightColor, shade);
    }
    gl_FragColor = vec4(fragcolour, 1.0);
    // gl_FragColor = bgColor;
  }
`;
// Create the shader material with uniforms
const CloudsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_mouse: new Vector2(),
    u_noise: null,
    u_texture: null,
    u_scroll: 0.0,
    u_cloudColor: new Vector3(0.07, 0.0, 0.24),
    u_lightColor: new Vector3(0.25, 0.6, 1.0),
    u_useOriginalImage: 0.0
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ CloudsMaterial });
export { CloudsMaterial };
