// Shared fragment shader functions for all shader effects
export const effectsFragmentGLSL = /*glsl*/ `
  // ============================================================================
  // UNIFORMS - All fragment effect uniforms
  // ============================================================================
  uniform float u_time;
  uniform vec2 u_pointer;
  uniform float uPointerEffectRadius;
  
  // General fragment effects - Grayscale
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
  
  // Pointer fragment effects
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
  uniform bool uPointerGrayscaleEnabled;
  uniform float uPointerGrayscaleIntensity;
  uniform float uPointerGrayscaleContrast;
  uniform float uPointerGrayscaleBrightness;
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  // Calculate smooth falloff from pointer position
  float getFragmentPointerFalloff(vec2 fragPos, vec2 pointer) {
    float dist = distance(fragPos, pointer);
    return smoothstep(uPointerEffectRadius, 0.0, dist);
  }
  
  // Convert RGB to grayscale
  float rgbToGrayscale(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }
  
  // Apply contrast and brightness to grayscale value
  float adjustGrayscale(float gray, float contrast, float brightness) {
    return (gray - 0.5) * contrast + 0.5 + brightness;
  }
  
  // ============================================================================
  // GENERAL EFFECTS (Always active when enabled)
  // ============================================================================
  
  vec3 applyGeneralGrayscale(vec3 color, vec2 fragPos) {
    float grayscaleFactor = 0.0;
    
    if (uGeneralGrayscaleMode < 0.5) {
      // Mode 0: Static
      grayscaleFactor = uGeneralGrayscaleIntensity;
    } else if (uGeneralGrayscaleMode < 1.5) {
      // Mode 1: Wave
      float wavePos = 0.0;
      if (uGeneralGrayscaleWaveDir < 0.5) {
        // Horizontal
        wavePos = fragPos.x;
      } else if (uGeneralGrayscaleWaveDir < 1.5) {
        // Vertical
        wavePos = fragPos.y;
      } else {
        // Diagonal
        wavePos = fragPos.x + fragPos.y;
      }
      grayscaleFactor = (sin(wavePos * uGeneralGrayscaleWaveFreq + u_time * uGeneralGrayscaleWaveSpeed) * 0.5 + 0.5) * uGeneralGrayscaleIntensity;
    } else if (uGeneralGrayscaleMode < 2.5) {
      // Mode 2: Pulse
      grayscaleFactor = (sin(u_time * uGeneralGrayscalePulseSpeed) * 0.5 + 0.5) * uGeneralGrayscaleIntensity;
    } else {
      // Mode 3: Ripple
      vec2 rippleCenter = vec2(uGeneralGrayscaleRippleCenterX, uGeneralGrayscaleRippleCenterY);
      float rippleDist = distance(fragPos, rippleCenter);
      grayscaleFactor = (sin(rippleDist * 5.0 - u_time * uGeneralGrayscaleRippleSpeed) * 0.5 + 0.5) * uGeneralGrayscaleIntensity;
    }
    
    float gray = rgbToGrayscale(color);
    gray = adjustGrayscale(gray, uGeneralGrayscaleContrast, uGeneralGrayscaleBrightness);
    vec3 grayscaleColor = vec3(gray);
    return mix(color, grayscaleColor, grayscaleFactor);
  }
  
  // ============================================================================
  // POINTER EFFECTS (Interactive, based on pointer position)
  // ============================================================================
  
  vec3 applyPointerGlow(vec3 color, vec2 fragPos, vec2 pointer) {
    float falloff = getFragmentPointerFalloff(fragPos, pointer);
    if (falloff > 0.0) {
      color += uGlowColor * uGlowIntensity * falloff;
    }
    return color;
  }
  
  vec3 applyPointerColorShift(vec3 color, vec2 fragPos, vec2 pointer) {
    float falloff = getFragmentPointerFalloff(fragPos, pointer);
    if (falloff > 0.0) {
      color = mix(color, uColorShiftTarget, uColorShiftIntensity * falloff);
    }
    return color;
  }
  
  vec3 applyPointerBrightness(vec3 color, vec2 fragPos, vec2 pointer) {
    float falloff = getFragmentPointerFalloff(fragPos, pointer);
    if (falloff > 0.0) {
      color *= (1.0 + uBrightnessIntensity * falloff);
    }
    return color;
  }
  
  vec3 applyPointerPulse(vec3 color, vec2 fragPos, vec2 pointer) {
    float falloff = getFragmentPointerFalloff(fragPos, pointer);
    if (falloff > 0.0) {
      float pulse = sin(u_time * uPulseSpeed) * 0.5 + 0.5;
      color += vec3(pulse * uPulseIntensity * falloff);
    }
    return color;
  }
  
  vec3 applyPointerGrayscale(vec3 color, vec2 fragPos, vec2 pointer) {
    float falloff = getFragmentPointerFalloff(fragPos, pointer);
    if (falloff > 0.0) {
      float gray = rgbToGrayscale(color);
      gray = adjustGrayscale(gray, uPointerGrayscaleContrast, uPointerGrayscaleBrightness);
      vec3 grayscaleColor = vec3(gray);
      color = mix(color, grayscaleColor, uPointerGrayscaleIntensity * falloff);
    }
    return color;
  }
  
  // ============================================================================
  // APPLY ALL FRAGMENT EFFECTS
  // ============================================================================
  
  vec3 applyAllFragmentEffects(vec3 color, vec2 fragPos, vec2 pointer) {
    // Apply pointer effects first (interactive)
    if (uGlowEnabled) {
      color = applyPointerGlow(color, fragPos, pointer);
    }
    
    if (uBrightnessEnabled) {
      color = applyPointerBrightness(color, fragPos, pointer);
    }
    
    if (uPulseEnabled) {
      color = applyPointerPulse(color, fragPos, pointer);
    }
    
    if (uColorShiftEnabled) {
      color = applyPointerColorShift(color, fragPos, pointer);
    }
    
    if (uPointerGrayscaleEnabled) {
      color = applyPointerGrayscale(color, fragPos, pointer);
    }
    
    // Apply general effects last (global, always active)
    if (uGeneralGrayscaleEnabled) {
      color = applyGeneralGrayscale(color, fragPos);
    }
    
    return color;
  }
`;
