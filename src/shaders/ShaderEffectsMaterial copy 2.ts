import { Vector2, Color } from 'three';
import type { Texture } from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { effectsVertexGLSL } from './effects/EffectsVertexFunctions.glsl';
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
    uNormalizationScale: {
        value: number;
    };
    uGenVertexType: {
        value: number;
    };
    uGenVertexEnabled: {
        value: boolean;
    };
    uGenVertexIntensity: {
        value: number;
    };
    uGenVertexSpeed: {
        value: number;
    };
    uGenVertexFrequency: {
        value: number;
    };
    uGenVertexDirection: {
        value: number;
    };
    uGenVertexCenterX: {
        value: number;
    };
    uGenVertexCenterY: {
        value: number;
    };
    uGenVertexMinScale: {
        value: number;
    };
    uGenVertexMaxScale: {
        value: number;
    };
    uPtrRadius: {
        value: number;
    };
    uPtrVertexType: {
        value: number;
    };
    uPtrVertexEnabled: {
        value: boolean;
    };
    uPtrVertexIntensity: {
        value: number;
    };
    uPtrVertexSpeed: {
        value: number;
    };
    uPtrVertexFrequency: {
        value: number;
    };
    uPtrVertexDirection: {
        value: number;
    };
    uPtrVertexCenterX: {
        value: number;
    };
    uPtrVertexCenterY: {
        value: number;
    };
    uPtrVertexMinScale: {
        value: number;
    };
    uPtrVertexMaxScale: {
        value: number;
    };
    uGenFragmentType: {
        value: number;
    };
    uGenFragmentEnabled: {
        value: boolean;
    };
    uGenFragmentIntensity: {
        value: number;
    };
    uGenFragmentSpeed: {
        value: number;
    };
    uGenFragmentColor: {
        value: Color;
    };
    uGenGrayscaleMode: {
        value: number;
    };
    uGenGrayscaleContrast: {
        value: number;
    };
    uGenGrayscaleBrightness: {
        value: number;
    };
    uGenGrayscaleWaveFreq: {
        value: number;
    };
    uGenGrayscaleWaveDir: {
        value: number;
    };
    uGenGrayscaleCenterX: {
        value: number;
    };
    uGenGrayscaleCenterY: {
        value: number;
    };
    uPtrFragmentType: {
        value: number;
    };
    uPtrFragmentEnabled: {
        value: boolean;
    };
    uPtrFragmentIntensity: {
        value: number;
    };
    uPtrFragmentSpeed: {
        value: number;
    };
    uPtrFragmentColor: {
        value: Color;
    };
    uPtrGrayscaleMode: {
        value: number;
    };
    uPtrGrayscaleContrast: {
        value: number;
    };
    uPtrGrayscaleBrightness: {
        value: number;
    };
    uPtrGrayscaleWaveFreq: {
        value: number;
    };
    uPtrGrayscaleWaveDir: {
        value: number;
    };
    uPtrGrayscaleCenterX: {
        value: number;
    };
    uPtrGrayscaleCenterY: {
        value: number;
    };
}

// ─── Vertex shader ────────────────────────────────────────────────────────────
const vertexShader = /*glsl*/ `
${effectsVertexGLSL}

uniform float uPointSize;
uniform float uMorphProgress;
uniform float uNormalizationScale;
attribute vec2 aUV;
varying vec2 vUV;
varying vec2 vTexCoords;
varying vec2 vScreenPosition;

void main() {
  vUV = aUV;

  #include <begin_vertex>
  vec3 morphedPos = mix(position, position, uMorphProgress);

  vec2 scaledPointer = u_pointer * 5.0;
  morphedPos = applyAllVertexEffects(morphedPos, scaledPointer);

  vTexCoords = morphedPos.xy;
  transformed = morphedPos;
  #include <project_vertex>

  gl_PointSize = uPointSize * getScaleMultiplier(morphedPos, scaledPointer);
  vScreenPosition = gl_Position.xy / gl_Position.w;
  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  #include <worldpos_vertex>
  #include <fog_vertex>
}
`;
// ─── Fragment shader ──────────────────────────────────────────────────────────
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
uniform float uParticleUVScale;
uniform vec2 u_pointer;
uniform float uPtrRadius;
varying vec2 vScreenPosition;

// ── General fragment uniforms ─────────────────────────────────────────────
uniform float uGenFragmentType;
uniform bool uGenFragmentEnabled;
uniform float uGenFragmentIntensity;
uniform float uGenFragmentSpeed;
uniform vec3 uGenFragmentColor;
uniform float uGenGrayscaleMode;
uniform float uGenGrayscaleContrast;
uniform float uGenGrayscaleBrightness;
uniform float uGenGrayscaleWaveFreq;
uniform float uGenGrayscaleWaveDir;
uniform float uGenGrayscaleCenterX;
uniform float uGenGrayscaleCenterY;

// ── Pointer fragment uniforms ─────────────────────────────────────────────
uniform float uPtrFragmentType;
uniform bool uPtrFragmentEnabled;
uniform float uPtrFragmentIntensity;
uniform float uPtrFragmentSpeed;
uniform vec3 uPtrFragmentColor;
uniform float uPtrGrayscaleMode;
uniform float uPtrGrayscaleContrast;
uniform float uPtrGrayscaleBrightness;
uniform float uPtrGrayscaleWaveFreq;
uniform float uPtrGrayscaleWaveDir;
uniform float uPtrGrayscaleCenterX;
uniform float uPtrGrayscaleCenterY;

// ─────────────────────────────────────────────────────────────────────────

float circle(vec2 uv, float border) {
  float dist = 0.5 - distance(uv, vec2(0.5));
  return smoothstep(0.0, border, dist);
}

vec4 applyFragmentEffect(
  vec4 color,
  float type, float intensity, float speed,
  vec3 fColor,
  float grayscaleMode, float contrast, float brightness,
  float waveFreq, float waveDir, float cx, float cy
) {
  if (type < 1.5) {
    // Grayscale
    float factor = 0.0;
    if (grayscaleMode < 0.5) {
      factor = intensity;
    } else if (grayscaleMode < 1.5) {
      float pos = waveDir < 0.5 ? vTexCoords.x : (waveDir < 1.5 ? vTexCoords.y : vTexCoords.x + vTexCoords.y);
      factor = (sin(pos * waveFreq + u_time * speed) * 0.5 + 0.5) * intensity;
    } else if (grayscaleMode < 2.5) {
      factor = (sin(u_time * speed) * 0.5 + 0.5) * intensity;
    } else {
      float d = distance(vTexCoords, vec2(cx, cy));
      factor = (sin(d * 5.0 - u_time * speed) * 0.5 + 0.5) * intensity;
    }
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gray = (gray - 0.5) * contrast + 0.5 + brightness;
    color.rgb = mix(color.rgb, vec3(gray), factor);
  } else if (type < 2.5) {
    // Glow
    color.rgb += fColor * intensity;
  } else if (type < 3.5) {
    // ColorShift
    color.rgb = mix(color.rgb, fColor, intensity);
  }
  return color;
}

void main() {
  vec4 outColor;
  if (uHasTexture) {
    vec2 scaledUV = gl_PointCoord * uParticleUVScale;
    scaledUV.y *= -1.0;
    scaledUV += vUV;
    vec4 colorA = texture2D(uTexture, scaledUV) * vec4(uColor, 1.0);
    vec4 colorB = texture2D(uTargetTexture, scaledUV) * vec4(uColor, 1.0);
    outColor = mix(colorA, colorB, uMorphProgress);
  } else {
    outColor = vec4(uColor, 1.0);
  }

  outColor.a *= circle(gl_PointCoord, 0.2);

  // General fragment effect (global)
  if (uGenFragmentEnabled && uGenFragmentType > 0.5) {
    outColor = applyFragmentEffect(
      outColor,
      uGenFragmentType, uGenFragmentIntensity, uGenFragmentSpeed,
      uGenFragmentColor,
      uGenGrayscaleMode, uGenGrayscaleContrast, uGenGrayscaleBrightness,
      uGenGrayscaleWaveFreq, uGenGrayscaleWaveDir, uGenGrayscaleCenterX, uGenGrayscaleCenterY
    );
  }

  // Pointer fragment effect (within radius)
  if (uPtrFragmentEnabled && uPtrFragmentType > 0.5) {
    vec2 scaledPointer = u_pointer * 5.0;
    float falloff = smoothstep(uPtrRadius, 0.0, distance(vTexCoords, scaledPointer));
    if (falloff > 0.0) {
      outColor = applyFragmentEffect(
        outColor,
        uPtrFragmentType, uPtrFragmentIntensity * falloff, uPtrFragmentSpeed,
        uPtrFragmentColor,
        uPtrGrayscaleMode, uPtrGrayscaleContrast, uPtrGrayscaleBrightness,
        uPtrGrayscaleWaveFreq, uPtrGrayscaleWaveDir, uPtrGrayscaleCenterX, uPtrGrayscaleCenterY
      );
    }
  }

  outColor.a *= uOpacity;
  gl_FragColor = outColor;
}
`;
// ─── Material definition ──────────────────────────────────────────────────────
const ShaderEffectsMaterial = shaderMaterial({
    // Base
    u_time: 0,
    u_pointer: new Vector2(),
    uPointSize: 1.0,
    uTexture: null,
    uTargetTexture: null,
    uHasTexture: false,
    uMorphProgress: 0.0,
    uColor: new Color(1.0, 1.0, 1.0),
    uOpacity: 1.0,
    uNormalizationScale: 1.0,
    uParticleUVScale: 0.01,
    // General vertex effect
    uGenVertexType: 0,
    uGenVertexEnabled: false,
    uGenVertexIntensity: 0.3,
    uGenVertexSpeed: 1.0,
    uGenVertexFrequency: 3.0,
    uGenVertexDirection: 0,
    uGenVertexCenterX: 0.0,
    uGenVertexCenterY: 0.0,
    uGenVertexMinScale: 0.5,
    uGenVertexMaxScale: 2.0,
    // Pointer vertex effect
    uPtrRadius: 2.5,
    uPtrVertexType: 0,
    uPtrVertexEnabled: false,
    uPtrVertexIntensity: 0.3,
    uPtrVertexSpeed: 1.0,
    uPtrVertexFrequency: 3.0,
    uPtrVertexDirection: 0,
    uPtrVertexCenterX: 0.0,
    uPtrVertexCenterY: 0.0,
    uPtrVertexMinScale: 0.5,
    uPtrVertexMaxScale: 2.0,
    // General fragment effect
    uGenFragmentType: 0,
    uGenFragmentEnabled: false,
    uGenFragmentIntensity: 1.0,
    uGenFragmentSpeed: 1.0,
    uGenFragmentColor: new Color(1.0, 1.0, 1.0),
    uGenGrayscaleMode: 0,
    uGenGrayscaleContrast: 1.0,
    uGenGrayscaleBrightness: 0.0,
    uGenGrayscaleWaveFreq: 3.0,
    uGenGrayscaleWaveDir: 0,
    uGenGrayscaleCenterX: 0.0,
    uGenGrayscaleCenterY: 0.0,
    // Pointer fragment effect
    uPtrFragmentType: 0,
    uPtrFragmentEnabled: false,
    uPtrFragmentIntensity: 1.0,
    uPtrFragmentSpeed: 1.0,
    uPtrFragmentColor: new Color(1.0, 1.0, 1.0),
    uPtrGrayscaleMode: 0,
    uPtrGrayscaleContrast: 1.0,
    uPtrGrayscaleBrightness: 0.0,
    uPtrGrayscaleWaveFreq: 3.0,
    uPtrGrayscaleWaveDir: 0,
    uPtrGrayscaleCenterX: 0.0,
    uPtrGrayscaleCenterY: 0.0,
}, vertexShader, fragmentShader);
extend({ ShaderEffectsMaterial });
export { ShaderEffectsMaterial };
