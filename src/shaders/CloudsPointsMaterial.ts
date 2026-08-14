import { Vector3, Vector2, Color } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { effectsVertexGLSL } from "./effects/EffectsVertexFunctions.glsl";
export interface CloudsPointsMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_texture: {
        value: Texture | null;
    };
    u_cloudColor: {
        value: Vector3;
    };
    u_lightColor: {
        value: Vector3;
    };
    u_useOriginalImage: {
        value: number;
    };
    u_pointer: {
        value: Vector2;
    };
    uPointSize: {
        value: number;
    };
    uColor: {
        value: Color;
    };
    uOpacity: {
        value: number;
    };
}

const vertexShader = /*glsl*/ `
${effectsVertexGLSL}

uniform float uPointSize;
varying vec2 vTexCoords;
uniform float uMorphProgress;
attribute vec3 targetPosition;
uniform bool uScaleEnabled;
uniform float uScaleIntensity;
uniform float uMinScale;
uniform float uMaxScale;
attribute vec2 aUV;
varying vec2 vUV;
varying vec3 vPosition;

void main() {
  vUV = aUV;
  vPosition = position;
  
  vec3 morphedPos = mix(position, targetPosition, uMorphProgress);
  
  if (uGeneralWaveEnabled) {
    float waveInput = uGeneralWaveDirection < 0.5 ? morphedPos.x : 
                      uGeneralWaveDirection < 1.5 ? morphedPos.y : 
                      morphedPos.x + morphedPos.y;
    morphedPos.z += sin(waveInput * uGeneralWaveFrequency + u_time * uGeneralWaveSpeed) * uGeneralWaveIntensity;
  }
  
  if (uGeneralVortexEnabled) {
    vec2 generalCenter = vec2(uGeneralVortexCenterX, uGeneralVortexCenterY);
    vec2 toCenter = morphedPos.xy - generalCenter;
    float angle = uGeneralVortexIntensity * u_time * uGeneralVortexSpeed;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    morphedPos.xy = generalCenter + rotation * toCenter;
  }
  
  if (uGeneralRippleEnabled) {
    morphedPos = applyGeneralRipple(morphedPos);
  }
  
  vec2 scaledPointer = u_pointer * 5.0;
  float dist = distance(morphedPos.xy, scaledPointer);
  float falloff = smoothstep(uPointerEffectRadius, 0.0, dist);
  
  if (uRippleEnabled && falloff > 0.0) {
    morphedPos.z += sin(dist * 5.0 - u_time * uRippleSpeed) * uRippleIntensity * falloff * 0.5;
  }
  
  if (uDisplacementEnabled && falloff > 0.0) {
    vec2 dir = normalize(morphedPos.xy - scaledPointer);
    morphedPos.xy += dir * uDisplacementIntensity * falloff * 2.0;
  }
  
  if (uVortexEnabled && falloff > 0.0) {
    vec2 toPointer = morphedPos.xy - scaledPointer;
    float angle = uVortexIntensity * falloff * u_time * uVortexSpeed;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    morphedPos.xy = scaledPointer + rotation * toPointer;
  }
  
  vTexCoords = morphedPos.xy;
  
  vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  float sizeMultiplier = 1.0;
  if (uScaleEnabled && falloff > 0.0) {
    sizeMultiplier = mix(uMinScale, uMaxScale, falloff * uScaleIntensity);
  }
  gl_PointSize = uPointSize * sizeMultiplier;
}
`;
const fragmentShader = /*glsl*/ `
uniform float u_time;
uniform sampler2D u_texture;
uniform vec3 u_cloudColor;
uniform vec3 u_lightColor;
uniform float u_useOriginalImage;
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 u_pointer;
uniform float uPointerEffectRadius;
uniform bool uGlowEnabled;
uniform float uGlowIntensity;
uniform vec3 uGlowColor;

varying vec2 vTexCoords;
varying vec2 vUV;
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

float circle(vec2 uv, float border) {
  float radius = 0.5;
  float dist = radius - distance(uv, vec2(0.5));
  return smoothstep(0.0, border, dist);
}

void main() {
  vec2 pointUV = gl_PointCoord;
  vec3 spherePos = normalize(vPosition);
  
  float noise1 = noise(vec3(vUV * 2.0 + spherePos.xy * 0.5, u_time * 2.0)) * 2.0;
  float noise2 = noise(vec3(spherePos * 3.0 + vec3(u_time * 1.357 - 10.0)));
  
  vec2 uv = vUV;
  uv += noise1 * 0.008 * (1.0 - clamp(noise1 * noise1 * 2.0 + 0.2, 0.0, 1.0));
  
  float shade = noise1;
  shade *= clamp(noise1 * noise2 * sin(u_time * 3.0), 0.2, 10.0);
  shade += shade * shade * 3.0;
  
  vec3 cloudColor = u_useOriginalImage > 0.5 ? 
    vec3(shade) : 
    mix(u_cloudColor, u_lightColor, shade);
  
  vec4 outColor = vec4(cloudColor * uColor, shade * 0.8);
  outColor.a *= circle(pointUV, 0.2);
  
  vec2 scaledPointer = u_pointer * 5.0;
  float dist = distance(vTexCoords, scaledPointer);
  float falloff = smoothstep(uPointerEffectRadius, 0.0, dist);
  
  if (uGlowEnabled && falloff > 0.0) {
    outColor.rgb += uGlowColor * uGlowIntensity * falloff;
  }
  
  outColor.a *= uOpacity;
  gl_FragColor = outColor;
}
`;
const CloudsPointsMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_texture: null,
    u_cloudColor: new Vector3(0.07, 0.0, 0.24),
    u_lightColor: new Vector3(0.25, 0.6, 1.0),
    u_useOriginalImage: 0.0,
    uPointSize: 5.0,
    u_pointer: new Vector2(),
    uColor: new Color(1.0, 1.0, 1.0),
    uOpacity: 1.0,
    uMorphProgress: 0.0,
    uPointerEffectRadius: 2.5,
    uRippleEnabled: false,
    uRippleIntensity: 0.5,
    uRippleSpeed: 2.0,
    uDisplacementEnabled: false,
    uDisplacementIntensity: 0.5,
    uScaleEnabled: false,
    uScaleIntensity: 0.5,
    uMinScale: 0.5,
    uMaxScale: 2.0,
    uVortexEnabled: false,
    uVortexIntensity: 0.5,
    uVortexSpeed: 1.0,
    uGlowEnabled: false,
    uGlowIntensity: 0.5,
    uGlowColor: new Color(1.0, 1.0, 1.0),
    uGeneralWaveEnabled: false,
    uGeneralWaveIntensity: 0.3,
    uGeneralWaveFrequency: 3.0,
    uGeneralWaveSpeed: 1.0,
    uGeneralWaveDirection: 0.0,
    uGeneralVortexEnabled: false,
    uGeneralVortexIntensity: 0.5,
    uGeneralVortexSpeed: 0.5,
    uGeneralVortexCenterX: 0.0,
    uGeneralVortexCenterY: 0.0,
    uGeneralRippleEnabled: false,
    uGeneralRippleIntensity: 0.3,
    uGeneralRippleSpeed: 2.0,
    uGeneralRippleCenterX: 0.0,
    uGeneralRippleCenterY: 0.0,
}, vertexShader, fragmentShader);
extend({ CloudsPointsMaterial });
export { CloudsPointsMaterial };
