export const baseFragmentTemplate = /*glsl*/ `
precision highp float;

uniform sampler2D uTexture;
uniform sampler2D uTargetTexture;
uniform bool uHasTexture;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTextureMorph;
uniform float u_time;
uniform vec2 u_pointer;
uniform float uPointerEffectRadius;
uniform float uParticleUVScale;

varying vec2 vTexCoords;
varying vec2 vUV;
varying vec2 vScreenPosition;
varying float vPointerFalloff;

// __EFFECT_HELPERS__
// __EFFECT_UNIFORMS__

float circle(vec2 uv, float border) {
  float radius = 0.5;
  float dist = radius - distance(uv, vec2(0.5));
  return smoothstep(0.0, border, dist);
}

void main() {
  vec4 outColor;

  if (uHasTexture) {
    vec2 scaledUV = gl_PointCoord * uParticleUVScale;
    scaledUV.y *= -1.0;
    scaledUV += vUV;
    vec4 colorA = texture2D(uTexture, scaledUV) * vec4(uColor, 1.0);
    vec4 colorB = texture2D(uTargetTexture, scaledUV) * vec4(uColor, 1.0);
    outColor = mix(colorA, colorB, uTextureMorph);
  } else {
    outColor = vec4(uColor, 1.0);
  }

  outColor.a *= circle(gl_PointCoord, 0.2);

  float falloff = vPointerFalloff;

  // __EFFECT_FRAGMENT_BODY__

  outColor.a *= uOpacity;

  gl_FragColor = outColor;
}
`;
