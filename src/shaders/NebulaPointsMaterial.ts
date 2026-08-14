import { Vector3, Vector2, Color } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { commonNoiseFunctions } from "./CommonNoiseFunctions";
import { effectsVertexGLSL } from "./effects/EffectsVertexFunctions.glsl";
export interface NebulaPointsMaterialUniforms {
    u_time: {
        value: number;
    };
    u_color1: {
        value: Vector3;
    };
    u_color2: {
        value: Vector3;
    };
    u_color3: {
        value: Vector3;
    };
    u_glowIntensity: {
        value: number;
    };
    u_complexity: {
        value: number;
    };
    u_pointer: {
        value: Vector2;
    };
    uPointSize: {
        value: number;
    };
    uTexture: {
        value: Texture | null;
    };
    uTargetTexture: {
        value: Texture | null;
    };
    uMorphProgress: {
        value: number;
    };
    uColor: {
        value: Color;
    };
    uOpacity: {
        value: number;
    };
    uParticleUVScale: {
        value: number;
    };
    uPointerEffectRadius: {
        value: number;
    };
    uNormalizationScale: {
        value: number;
    };
    uRippleEnabled: {
        value: boolean;
    };
    uRippleIntensity: {
        value: number;
    };
    uRippleSpeed: {
        value: number;
    };
    uDisplacementEnabled: {
        value: boolean;
    };
    uDisplacementIntensity: {
        value: number;
    };
    uScaleEnabled: {
        value: boolean;
    };
    uScaleIntensity: {
        value: number;
    };
    uMinScale: {
        value: number;
    };
    uMaxScale: {
        value: number;
    };
    uVortexEnabled: {
        value: boolean;
    };
    uVortexIntensity: {
        value: number;
    };
    uVortexSpeed: {
        value: number;
    };
    uWaveEnabled: {
        value: boolean;
    };
    uWaveIntensity: {
        value: number;
    };
    uWaveFrequency: {
        value: number;
    };
    uGlowEnabled: {
        value: boolean;
    };
    uGlowColor: {
        value: Color;
    };
    uColorShiftEnabled: {
        value: boolean;
    };
    uColorShiftIntensity: {
        value: number;
    };
    uColorShiftTarget: {
        value: Color;
    };
    uBrightnessEnabled: {
        value: boolean;
    };
    uBrightnessIntensity: {
        value: number;
    };
    uPulseEnabled: {
        value: boolean;
    };
    uPulseIntensity: {
        value: number;
    };
    uPulseSpeed: {
        value: number;
    };
    uGeneralWaveEnabled: {
        value: boolean;
    };
    uGeneralWaveIntensity: {
        value: number;
    };
    uGeneralWaveFrequency: {
        value: number;
    };
    uGeneralWaveSpeed: {
        value: number;
    };
    uGeneralWaveDirection: {
        value: number;
    };
    uGeneralVortexEnabled: {
        value: boolean;
    };
    uGeneralVortexIntensity: {
        value: number;
    };
    uGeneralVortexSpeed: {
        value: number;
    };
    uGeneralVortexCenterX: {
        value: number;
    };
    uGeneralVortexCenterY: {
        value: number;
    };
    uGeneralRippleEnabled: {
        value: boolean;
    };
    uGeneralRippleIntensity: {
        value: number;
    };
    uGeneralRippleSpeed: {
        value: number;
    };
    uGeneralRippleCenterX: {
        value: number;
    };
    uGeneralRippleCenterY: {
        value: number;
    };
}

const vertexShader = /*glsl*/ `
${effectsVertexGLSL}

uniform float uPointSize;
varying vec2 vTexCoords;
uniform float uMorphProgress;
uniform float uNormalizationScale;
attribute vec3 targetPosition;
uniform bool uScaleEnabled;
uniform float uScaleIntensity;
uniform float uMinScale;
uniform float uMaxScale;
attribute vec2 aUV;
varying vec2 vUV;
varying vec2 vScreenPosition;
varying vec3 vPosition;

void main() {
  vUV = aUV;
  vPosition = position;
  vec3 pos = position;
  
  #include <begin_vertex>
  
  vec3 morphedPos = mix(position, targetPosition, uMorphProgress);
  
  if (uGeneralWaveEnabled) {
    float waveInput = 0.0;
    if (uGeneralWaveDirection < 0.5) {
      waveInput = morphedPos.x;
    } else if (uGeneralWaveDirection < 1.5) {
      waveInput = morphedPos.y;
    } else {
      waveInput = morphedPos.x + morphedPos.y;
    }
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
    float wave = sin(dist * 5.0 - u_time * uRippleSpeed) * uRippleIntensity;
    morphedPos.z += wave * falloff * 0.5;
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
  
  if (uWaveEnabled && falloff > 0.0) {
    morphedPos.z += sin(morphedPos.x * uWaveFrequency + u_time) * uWaveIntensity * falloff * 0.5;
  }
  
  vTexCoords = morphedPos.xy;
  transformed = morphedPos;
  
  #include <project_vertex>
  
  float sizeMultiplier = 1.0;
  if (uScaleEnabled && falloff > 0.0) {
    sizeMultiplier = mix(uMinScale, uMaxScale, falloff * uScaleIntensity);
  }
  gl_PointSize = uPointSize * sizeMultiplier;
  vScreenPosition = gl_Position.xy / gl_Position.w;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  #include <worldpos_vertex>
  #include <fog_vertex>
}
`;
const fragmentShader = /*glsl*/ `
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_glowIntensity;
uniform float u_complexity;

uniform sampler2D uTexture;
uniform sampler2D uTargetTexture;
uniform bool uHasTexture;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uMorphProgress;
uniform float uParticleUVScale;
uniform vec2 u_pointer;
uniform float uPointerEffectRadius;

uniform bool uGlowEnabled;
uniform float uEffectGlowIntensity;
uniform vec3 uGlowColor;
uniform bool uColorShiftEnabled;
uniform float uColorShiftIntensity;
uniform vec3 uColorShiftTarget;
uniform bool uBrightnessEnabled;
uniform float uBrightnessIntensity;
uniform bool uPulseEnabled;
uniform float uPulseIntensity;
uniform float uPulseSpeed;

varying vec2 vTexCoords;
varying vec2 vUV;
varying vec2 vScreenPosition;
varying vec3 vPosition;

${commonNoiseFunctions}

float circle(vec2 uv, float border) {
    float radius = 0.5;
    float dist = radius - distance(uv, vec2(0.5));
    return smoothstep(0.0, border, dist);
}

void main() {
  vec2 pointUV = gl_PointCoord;
  vec4 outColor;
  
  vec3 spherePos = normalize(vPosition);
  
  // Multi-layered nebula effect
  float nebula1 = fbm(spherePos * u_complexity + vec3(u_time * 0.1));
  float nebula2 = fbm(spherePos * u_complexity * 0.5 + vec3(u_time * 0.05, u_time * 0.08, 0.0));
  float nebula3 = fbm(spherePos * u_complexity * 2.0 + vec3(0.0, u_time * 0.03, u_time * 0.07));
  
  // Color mixing based on noise layers
  vec3 nebulaColor = u_color1 * nebula1;
  nebulaColor += u_color2 * nebula2 * 0.7;
  nebulaColor += u_color3 * nebula3 * 0.5;
  nebulaColor *= u_glowIntensity;
  
  float alpha = (nebula1 + nebula2 * 0.7 + nebula3 * 0.5) / 2.2;
  
  outColor = vec4(nebulaColor * uColor, alpha);
  
  if (uHasTexture) {
    vec2 scaledUV = pointUV * uParticleUVScale;
    scaledUV.y *= -1.0;
    scaledUV += vUV;
    vec4 colorA = texture2D(uTexture, scaledUV);
    vec4 colorB = texture2D(uTargetTexture, scaledUV);
    vec4 texColor = mix(colorA, colorB, uMorphProgress);
    outColor = mix(outColor, texColor * vec4(nebulaColor, 1.0), 0.5);
  }
  
  float circleAlpha = circle(pointUV, 0.2);
  outColor.a *= circleAlpha;
  
  vec2 scaledPointer = u_pointer * 5.0;
  float dist = distance(vTexCoords, scaledPointer);
  float falloff = smoothstep(uPointerEffectRadius, 0.0, dist);
  
  if (uGlowEnabled && falloff > 0.0) {
    outColor.rgb += uGlowColor * uEffectGlowIntensity * falloff;
  }
  
  if (uBrightnessEnabled && falloff > 0.0) {
    outColor.rgb *= (1.0 + uBrightnessIntensity * falloff);
  }
  
  if (uPulseEnabled && falloff > 0.0) {
    float pulse = sin(u_time * uPulseSpeed) * 0.5 + 0.5;
    outColor.rgb += vec3(pulse * uPulseIntensity * falloff);
  }
  
  if (uColorShiftEnabled && falloff > 0.0) {
    outColor.rgb = mix(outColor.rgb, uColorShiftTarget, uColorShiftIntensity * falloff);
  }
  
  outColor.a *= uOpacity;
  float edgeFade = 1.0 - length(pointUV * 2.0 - 1.0) * 0.3;
  outColor.a *= edgeFade;
  
  gl_FragColor = outColor;
}
`;
const NebulaPointsMaterial = shaderMaterial({
    u_time: 0,
    u_color1: new Vector3(0.8, 0.2, 0.9),
    u_color2: new Vector3(0.2, 0.6, 1.0),
    u_color3: new Vector3(1.0, 0.4, 0.2),
    u_glowIntensity: 1.5,
    u_complexity: 3.0,
    uTexture: null,
    uTargetTexture: null,
    uHasTexture: false,
    uPointSize: 5.0,
    u_pointer: new Vector2(),
    uColor: new Color(1.0, 1.0, 1.0),
    uMorphProgress: 0.0,
    uNormalizationScale: 1.0,
    uOpacity: 1.0,
    uParticleUVScale: 0.01,
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
    uWaveEnabled: false,
    uWaveIntensity: 0.5,
    uWaveFrequency: 5.0,
    uGlowEnabled: false,
    uEffectGlowIntensity: 0.5,
    uGlowColor: new Color(1.0, 1.0, 1.0),
    uColorShiftEnabled: false,
    uColorShiftIntensity: 0.5,
    uColorShiftTarget: new Color(1.0, 0.4, 0.0),
    uBrightnessEnabled: false,
    uBrightnessIntensity: 0.5,
    uPulseEnabled: false,
    uPulseIntensity: 0.5,
    uPulseSpeed: 2.0,
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
extend({ NebulaPointsMaterial });
export { NebulaPointsMaterial };
