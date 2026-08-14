import { Vector3, Vector2, Color } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
import { effectsVertexGLSL } from "./effects/EffectsVertexFunctions.glsl";
export interface CartoonCloudsPointsMaterialUniforms {
    u_time: {
        value: number;
    };
    u_cloudColor: {
        value: Vector3;
    };
    u_edgeThickness: {
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
uniform vec3 u_cloudColor;
uniform float u_edgeThickness;
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vPosition;

${commonNoiseFunctions}

float circle(vec2 uv, float border) {
  return smoothstep(0.0, border, 0.5 - distance(uv, vec2(0.5)));
}

void main() {
  vec3 spherePos = normalize(vPosition);
  float cloud = fbm(spherePos * 3.0 + vec3(u_time * 0.1));
  float stepped = floor(cloud * 3.0) / 3.0;
  
  gl_FragColor = vec4(u_cloudColor * uColor, stepped * uOpacity * circle(gl_PointCoord, 0.2));
}
`;
export const CartoonCloudsPointsMaterial = shaderMaterial({
    u_time: 0,
    u_cloudColor: new Vector3(1.0, 1.0, 1.0),
    u_edgeThickness: 0.1,
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
extend({ CartoonCloudsPointsMaterial });
