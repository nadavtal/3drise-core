export const baseVertexTemplate = /*glsl*/ `
precision highp float;

uniform float u_time;
uniform vec2 u_pointer;
uniform float uPointerEffectRadius;
uniform float uPointSize;
uniform float uMorphProgress;
uniform float uNormalizationScale;

attribute vec3 targetPosition;
attribute vec2 aUV;

varying vec2 vTexCoords;
varying vec2 vUV;
varying vec2 vScreenPosition;
varying float vPointerFalloff;

// __EFFECT_HELPERS__
// __EFFECT_UNIFORMS__

void main() {
  vUV = aUV;
  vec3 pos = position;

  #include <begin_vertex>

  vec3 morphedPos = mix(position, targetPosition, uMorphProgress);

  // Pointer falloff is computed in screen-NDC space so it stays correct under any
  // model transform (scale/rotation/position). uPointerEffectRadius is now in NDC
  // units: ~0 = pinpoint, ~1.4 = covers full screen.
  vec4 unmodifiedClip = projectionMatrix * modelViewMatrix * vec4(morphedPos, 1.0);
  vec2 unmodifiedNDC = unmodifiedClip.xy / unmodifiedClip.w;
  float falloff = smoothstep(uPointerEffectRadius, 0.0, distance(unmodifiedNDC, u_pointer));
  vPointerFalloff = falloff;

  // Local-space pointer approximation, kept for descriptors (e.g. displacement)
  // that need a push direction. Magic 5.0 is a legacy constant; this still has
  // the scale-mismatch issue for non-identity transforms — fix is per-descriptor.
  vec2 scaledPointer = u_pointer * 5.0;

  float sizeMultiplier = 1.0;

  // __EFFECT_VERTEX_BODY__

  vTexCoords = morphedPos.xy;
  transformed = morphedPos;

  #include <project_vertex>

  gl_PointSize = uPointSize * sizeMultiplier;
  vScreenPosition = gl_Position.xy / gl_Position.w;

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  #include <worldpos_vertex>
  #include <fog_vertex>
}
`;
