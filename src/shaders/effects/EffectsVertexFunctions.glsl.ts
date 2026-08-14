// Shared vortex shader functions for all shader effects
export const effectsVertexGLSL = /*glsl*/ `
  // ============================================================================
  // UNIFORMS - All effect uniforms
  // ============================================================================
  uniform float u_time;
  uniform vec2 u_pointer;
  uniform float uPointerEffectRadius;
  
  // General vortex effects
  uniform bool uGeneralWaveEnabled;
  uniform float uGeneralWaveIntensity;
  uniform float uGeneralWaveFrequency;
  uniform float uGeneralWaveSpeed;
  uniform float uGeneralWaveDirection;
  uniform bool uGeneralVortexEnabled;
  uniform float uGeneralVortexIntensity;
  uniform float uGeneralVortexSpeed;
  uniform float uGeneralVortexCenterX;
  uniform float uGeneralVortexCenterY;
  uniform bool uGeneralRippleEnabled;
  uniform float uGeneralRippleIntensity;
  uniform float uGeneralRippleSpeed;
  uniform float uGeneralRippleFrequency;
  uniform float uGeneralRippleCenterX;
  uniform float uGeneralRippleCenterY;
  
  // Pointer vortex effects
  uniform bool uRippleEnabled;
  uniform float uRippleIntensity;
  uniform float uRippleSpeed;
  uniform bool uDisplacementEnabled;
  uniform float uDisplacementIntensity;
  uniform bool uVortexEnabled;
  uniform float uVortexIntensity;
  uniform float uVortexSpeed;
  uniform bool uWaveEnabled;
  uniform float uWaveIntensity;
  uniform float uWaveFrequency;
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  // Calculate smooth falloff from pointer position
  float getPointerFalloff(vec3 position, vec2 pointer) {
    float dist = distance(position.xy, pointer);
    return smoothstep(uPointerEffectRadius, 0.0, dist);
  }
  
  // ============================================================================
  // GENERAL EFFECTS (Always active when enabled)
  // ============================================================================
  
  vec3 applyGeneralWave(vec3 pos) {
    float waveInput = 0.0;
    if (uGeneralWaveDirection < 0.5) {
      // Horizontal
      waveInput = pos.x;
    } else if (uGeneralWaveDirection < 1.5) {
      // Vertical
      waveInput = pos.y;
    } else {
      // Diagonal
      waveInput = pos.x + pos.y;
    }
    pos.z += sin(waveInput * uGeneralWaveFrequency + u_time * uGeneralWaveSpeed) * uGeneralWaveIntensity;
    return pos;
  }
  
  vec3 applyGeneralVortex(vec3 pos) {
    vec2 center = vec2(uGeneralVortexCenterX, uGeneralVortexCenterY);
    vec2 toCenter = pos.xy - center;
    float angle = uGeneralVortexIntensity * u_time * uGeneralVortexSpeed;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos.xy = center + rotation * toCenter;
    return pos;
  }
  
  vec3 applyGeneralRipple(vec3 pos) {
    vec2 center = vec2(uGeneralRippleCenterX, uGeneralRippleCenterY);
    float rippleDist = distance(pos.xy, center);
    float rippleWave = sin(rippleDist * uGeneralRippleFrequency - u_time * uGeneralRippleSpeed) * uGeneralRippleIntensity;
    pos.z += rippleWave;
    return pos;
  }
  
  // ============================================================================
  // POINTER EFFECTS (Interactive, based on pointer position)
  // ============================================================================
  
  vec3 applyPointerRipple(vec3 pos, vec2 pointer) {
    float falloff = getPointerFalloff(pos, pointer);
    if (falloff > 0.0) {
      float dist = distance(pos.xy, pointer);
      float wave = sin(dist * 5.0 - u_time * uRippleSpeed) * uRippleIntensity;
      pos.z += wave * falloff * 0.5;
    }
    return pos;
  }
  
  vec3 applyPointerDisplacement(vec3 pos, vec2 pointer) {
    float falloff = getPointerFalloff(pos, pointer);
    if (falloff > 0.0) {
      vec2 dir = normalize(pos.xy - pointer);
      pos.xy += dir * uDisplacementIntensity * falloff * 2.0;
    }
    return pos;
  }
  
  vec3 applyPointerVortex(vec3 pos, vec2 pointer) {
    float falloff = getPointerFalloff(pos, pointer);
    if (falloff > 0.0) {
      vec2 toPointer = pos.xy - pointer;
      float angle = uVortexIntensity * falloff * u_time * uVortexSpeed;
      mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      pos.xy = pointer + rotation * toPointer;
    }
    return pos;
  }
  
  vec3 applyPointerWave(vec3 pos, vec2 pointer) {
    float falloff = getPointerFalloff(pos, pointer);
    if (falloff > 0.0) {
      pos.z += sin(pos.x * uWaveFrequency + u_time) * uWaveIntensity * falloff * 0.5;
    }
    return pos;
  }
  
  // ============================================================================
  // APPLY ALL VERTEX EFFECTS
  // ============================================================================
  
  vec3 applyAllVertexEffects(vec3 pos, vec2 pointer) {
    // Apply general effects first (global, always active)
    if (uGeneralWaveEnabled) {
      pos = applyGeneralWave(pos);
    }
    
    if (uGeneralVortexEnabled) {
      pos = applyGeneralVortex(pos);
    }
    
    if (uGeneralRippleEnabled) {
      pos = applyGeneralRipple(pos);
    }
    
    // Apply pointer effects (interactive)
    if (uRippleEnabled) {
      pos = applyPointerRipple(pos, pointer);
    }
    
    if (uDisplacementEnabled) {
      pos = applyPointerDisplacement(pos, pointer);
    }
    
    if (uVortexEnabled) {
      pos = applyPointerVortex(pos, pointer);
    }
    
    if (uWaveEnabled) {
      pos = applyPointerWave(pos, pointer);
    }
    
    return pos;
  }
`;
