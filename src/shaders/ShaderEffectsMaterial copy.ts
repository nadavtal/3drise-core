import { Vector2, Color } from "three";
import type { Texture } from 'three';
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { effectsVertexGLSL } from "./effects/EffectsVertexFunctions.glsl";
export interface ShaderEffectsMaterialUniforms {
    u_time: {
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
    uGlowIntensity: {
        value: number;
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
    uGeneralGrayscaleEnabled: {
        value: boolean;
    };
    uGeneralGrayscaleMode: {
        value: number;
    };
    uGeneralGrayscaleIntensity: {
        value: number;
    };
    uGeneralGrayscaleContrast: {
        value: number;
    };
    uGeneralGrayscaleBrightness: {
        value: number;
    };
    uGeneralGrayscaleWaveFreq: {
        value: number;
    };
    uGeneralGrayscaleWaveSpeed: {
        value: number;
    };
    uGeneralGrayscaleWaveDir: {
        value: number;
    };
    uGeneralGrayscalePulseSpeed: {
        value: number;
    };
    uGeneralGrayscaleRippleSpeed: {
        value: number;
    };
    uGeneralGrayscaleRippleCenterX: {
        value: number;
    };
    uGeneralGrayscaleRippleCenterY: {
        value: number;
    };
    uPointerGrayscaleEnabled: {
        value: boolean;
    };
    uPointerGrayscaleIntensity: {
        value: number;
    };
    uPointerGrayscaleContrast: {
        value: number;
    };
    uPointerGrayscaleBrightness: {
        value: number;
    };
}

// Vertex shader
const vertexShader = /*glsl*/ `
${effectsVertexGLSL}

uniform float uPointSize;
varying vec2 vTexCoords;
uniform float uMorphProgress;
uniform float uNormalizationScale;
attribute vec3 targetPosition;
// Scale effect uniforms (not included in effectsVertexGLSL)
uniform bool uScaleEnabled;
uniform float uScaleIntensity;
uniform float uMinScale;
uniform float uMaxScale;

// UV attribute for texture mapping
attribute vec2 aUV;
varying vec2 vUV;

varying vec2 vScreenPosition;

void main() {
  // Pass UV to fragment shader
  vUV = aUV;
  
  vec3 pos = position;
  
  #include <begin_vertex>
  
  vec3 morphedPos = mix(position, position, uMorphProgress);
  vec2 rippleCenter = vec2(uGeneralRippleCenterX, uGeneralRippleCenterY);
  // Apply general effects first (global, always active)
  
  // General Wave effect
  if (uGeneralWaveEnabled) {
    float waveInput = 0.0;
    if (uGeneralWaveDirection < 0.5) {
      // Horizontal
      waveInput = morphedPos.x;
    } else if (uGeneralWaveDirection < 1.5) {
      // Vertical
      waveInput = morphedPos.y;
    } else {
      // Diagonal
      waveInput = morphedPos.x + morphedPos.y;
    }
    morphedPos.z += sin(waveInput * uGeneralWaveFrequency + u_time * uGeneralWaveSpeed) * uGeneralWaveIntensity;
  }
  
  // General Vortex effect
  if (uGeneralVortexEnabled) {
    vec2 generalCenter = vec2(uGeneralVortexCenterX, uGeneralVortexCenterY);
    vec2 toCenter = morphedPos.xy - generalCenter;
    float angle = uGeneralVortexIntensity * u_time * uGeneralVortexSpeed;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    morphedPos.xy = generalCenter + rotation * toCenter;
  }
  
  // General Ripple effect
  if (uGeneralRippleEnabled) {
    morphedPos = applyGeneralRipple(morphedPos);
  }
  
  // Apply pointer effects to texture-based particles
  // Scale pointer to match normalized position space
  vec2 scaledPointer = u_pointer * 5.0;
  float dist = distance(morphedPos.xy, scaledPointer);
  float falloff = smoothstep(uPointerEffectRadius, 0.0, dist);
  
  // Ripple effect
  if (uRippleEnabled && falloff > 0.0) {
    float wave = sin(dist * 5.0 - u_time * uRippleSpeed) * uRippleIntensity;
    morphedPos.z += wave * falloff * 0.5;
  }
  
  // Displacement effect
  if (uDisplacementEnabled && falloff > 0.0) {
    vec2 dir = normalize(morphedPos.xy - scaledPointer);
    morphedPos.xy += dir * uDisplacementIntensity * falloff * 2.0;
  }
  
  // Vortex effect
  if (uVortexEnabled && falloff > 0.0) {
    vec2 toPointer = morphedPos.xy - scaledPointer;
    float angle = uVortexIntensity * falloff * u_time * uVortexSpeed;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    morphedPos.xy = scaledPointer + rotation * toPointer;
  }
  
  // Wave effect
  if (uWaveEnabled && falloff > 0.0) {
    morphedPos.z += sin(morphedPos.x * uWaveFrequency + u_time) * uWaveIntensity * falloff * 0.5;
  }
  
  vTexCoords = morphedPos.xy;
  
  // Use the transformed vortex position
  transformed = morphedPos;
  
  #include <project_vertex>
  
  // Scale effect for point size
  float sizeMultiplier = 1.0;
  if (uScaleEnabled && falloff > 0.0) {
    sizeMultiplier = mix(uMinScale, uMaxScale, falloff * uScaleIntensity);
  }
  gl_PointSize = uPointSize * sizeMultiplier;
  
  // Pass screen position for fragment shader
  vScreenPosition = gl_Position.xy / gl_Position.w;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  #include <worldpos_vertex>
  #include <fog_vertex>
}

`;
// Fragment shader
const fragmentShader = /*glsl*/ `

uniform sampler2D uTexture;
uniform sampler2D uTargetTexture;
uniform bool uHasTexture;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vTexCoords;
varying vec2 vUV;
uniform float uMorphProgress;
uniform float u_time;
uniform float uParticleUVScale; // How much of texture each particle covers
// Pointer effects
uniform vec2 u_pointer;
uniform float uPointerEffectRadius;
// Fragment effects
uniform bool uGlowEnabled;
uniform float uGlowIntensity;
uniform vec3 uGlowColor;
uniform bool uColorShiftEnabled;
uniform float uColorShiftIntensity;
uniform vec3 uColorShiftTarget;
uniform bool uBrightnessEnabled;
uniform float uBrightnessIntensity;
uniform bool uPulseEnabled;
uniform float uPulseIntensity;
uniform float uPulseSpeed;
// Grayscale effects
uniform bool uGeneralGrayscaleEnabled;
uniform float uGeneralGrayscaleMode;
uniform float uGeneralGrayscaleIntensity;
uniform float uGeneralGrayscaleContrast;
uniform float uGeneralGrayscaleBrightness;
uniform float uGeneralGrayscaleWaveFreq;
uniform float uGeneralGrayscaleWaveSpeed;
uniform float uGeneralGrayscaleWaveDir;
uniform float uGeneralGrayscalePulseSpeed;
uniform float uGeneralGrayscaleRippleSpeed;
uniform float uGeneralGrayscaleRippleCenterX;
uniform float uGeneralGrayscaleRippleCenterY;
uniform bool uPointerGrayscaleEnabled;
uniform float uPointerGrayscaleIntensity;
uniform float uPointerGrayscaleContrast;
uniform float uPointerGrayscaleBrightness;

varying vec2 vScreenPosition;

float circle(vec2 uv, float border) {
    float radius = 0.5;
    float dist = radius - distance(uv, vec2(0.5));
    return smoothstep(0.0, border, dist);
}

void main() {
  vec2 uv = gl_PointCoord;
  vec4 outColor;
  
  if (uHasTexture) {
    // Texture-based rendering using UV attributes
    // Scale down the point coordinate so each particle shows only a tiny piece
    vec2 scaledUV = gl_PointCoord * uParticleUVScale;
    scaledUV.y *= -1.0;
    scaledUV += vUV;  // Add the particle's base UV position
    vec4 colorA = texture2D(uTexture, scaledUV) * vec4(uColor, 1.0);
    vec4 colorB = texture2D(uTargetTexture, scaledUV) * vec4(uColor, 1.0);
    outColor = mix(colorA, colorB, uMorphProgress);
  } else {
    // No texture - use solid color
    outColor = vec4(uColor, 1.0);
  }
  
  // Apply circular shape to points
  outColor.a *= circle(gl_PointCoord, 0.2);
  
  // Apply pointer fragment effects
  // Scale pointer to match normalized position space
  vec2 scaledPointer = u_pointer * 5.0;
  float dist = distance(vTexCoords, scaledPointer);
  float falloff = smoothstep(uPointerEffectRadius, 0.0, dist);
  
  // Glow effect
  if (uGlowEnabled && falloff > 0.0) {
    outColor.rgb += uGlowColor * uGlowIntensity * falloff;
  }
  
  // Brightness effect
  if (uBrightnessEnabled && falloff > 0.0) {
    outColor.rgb *= (1.0 + uBrightnessIntensity * falloff);
  }
  
  // Pulse effect
  if (uPulseEnabled && falloff > 0.0) {
    float pulse = sin(u_time * uPulseSpeed) * 0.5 + 0.5;
    outColor.rgb += vec3(pulse * uPulseIntensity * falloff);
  }
  
  // Color shift effect
  if (uColorShiftEnabled && falloff > 0.0) {
    outColor.rgb = mix(outColor.rgb, uColorShiftTarget, uColorShiftIntensity * falloff);
  }
  
  // Pointer Grayscale effect
  if (uPointerGrayscaleEnabled && falloff > 0.0) {
    float gray = dot(outColor.rgb, vec3(0.299, 0.587, 0.114));
    gray = (gray - 0.5) * uPointerGrayscaleContrast + 0.5 + uPointerGrayscaleBrightness;
    vec3 grayscaleColor = vec3(gray);
    outColor.rgb = mix(outColor.rgb, grayscaleColor, uPointerGrayscaleIntensity * falloff);
  }
  
  // General Grayscale effect (applied globally with modes)
  if (uGeneralGrayscaleEnabled) {
    float grayscaleFactor = 0.0;
    
    if (uGeneralGrayscaleMode < 0.5) {
      // Mode 0: Static
      grayscaleFactor = uGeneralGrayscaleIntensity;
    } else if (uGeneralGrayscaleMode < 1.5) {
      // Mode 1: Wave
      float wavePos = 0.0;
      if (uGeneralGrayscaleWaveDir < 0.5) {
        // Horizontal
        wavePos = vTexCoords.x;
      } else if (uGeneralGrayscaleWaveDir < 1.5) {
        // Vertical
        wavePos = vTexCoords.y;
      } else {
        // Diagonal
        wavePos = vTexCoords.x + vTexCoords.y;
      }
      grayscaleFactor = (sin(wavePos * uGeneralGrayscaleWaveFreq + u_time * uGeneralGrayscaleWaveSpeed) * 0.5 + 0.5) * uGeneralGrayscaleIntensity;
    } else if (uGeneralGrayscaleMode < 2.5) {
      // Mode 2: Pulse
      grayscaleFactor = (sin(u_time * uGeneralGrayscalePulseSpeed) * 0.5 + 0.5) * uGeneralGrayscaleIntensity;
    } else {
      // Mode 3: Ripple
      vec2 rippleCenter = vec2(uGeneralGrayscaleRippleCenterX, uGeneralGrayscaleRippleCenterY);
      float rippleDist = distance(vTexCoords, rippleCenter);
      grayscaleFactor = (sin(rippleDist * 5.0 - u_time * uGeneralGrayscaleRippleSpeed) * 0.5 + 0.5) * uGeneralGrayscaleIntensity;
    }
    
    float gray = dot(outColor.rgb, vec3(0.299, 0.587, 0.114));
    gray = (gray - 0.5) * uGeneralGrayscaleContrast + 0.5 + uGeneralGrayscaleBrightness;
    vec3 grayscaleColor = vec3(gray);
    outColor.rgb = mix(outColor.rgb, grayscaleColor, grayscaleFactor);
  }
  
  outColor.a *= uOpacity;
  
  gl_FragColor = outColor;
}

`;
// Create the shader material with uniforms
const ShaderEffectsMaterial = shaderMaterial({
    u_time: 0,
    uTexture: null,
    uTargetTexture: null,
    uHasTexture: false,
    uPointSize: 1.0,
    u_pointer: new Vector2(),
    uColor: new Color(1.0, 1.0, 1.0),
    uMorphProgress: 0.0,
    uNormalizationScale: 1.0,
    uOpacity: 1.0,
    uParticleUVScale: 0.01, // How much of texture each particle covers (1/nbColumns or similar)
    // Pointer effects
    uPointerEffectRadius: 2.5,
    // Vertex effects
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
    // Fragment effects
    uGlowEnabled: false,
    uGlowIntensity: 0.5,
    uGlowColor: new Color(1.0, 1.0, 1.0),
    uColorShiftEnabled: false,
    uColorShiftIntensity: 0.5,
    uColorShiftTarget: new Color(1.0, 0.4, 0.0),
    uBrightnessEnabled: false,
    uBrightnessIntensity: 0.5,
    uPulseEnabled: false,
    uPulseIntensity: 0.5,
    uPulseSpeed: 2.0,
    // General effects
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
    // Grayscale effects
    uGeneralGrayscaleEnabled: false,
    uGeneralGrayscaleMode: 0.0,
    uGeneralGrayscaleIntensity: 1.0,
    uGeneralGrayscaleContrast: 1.0,
    uGeneralGrayscaleBrightness: 0.0,
    uGeneralGrayscaleWaveFreq: 3.0,
    uGeneralGrayscaleWaveSpeed: 1.0,
    uGeneralGrayscaleWaveDir: 0.0,
    uGeneralGrayscalePulseSpeed: 2.0,
    uGeneralGrayscaleRippleSpeed: 2.0,
    uGeneralGrayscaleRippleCenterX: 0.0,
    uGeneralGrayscaleRippleCenterY: 0.0,
    uPointerGrayscaleEnabled: false,
    uPointerGrayscaleIntensity: 1.0,
    uPointerGrayscaleContrast: 1.0,
    uPointerGrayscaleBrightness: 0.0,
}, vertexShader, fragmentShader);
extend({ ShaderEffectsMaterial });
export { ShaderEffectsMaterial };
