import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface VoidRiftMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_riftColor: {
        value: Vector3;
    };
    u_radiationColor: {
        value: Vector3;
    };
    u_lensColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_riftWidth: {
        value: number;
    };
    u_radiationDensity: {
        value: number;
    };
}

const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_riftColor;
  uniform vec3 u_radiationColor;
  uniform vec3 u_lensColor;
  uniform float u_speed;
  uniform float u_riftWidth;
  uniform float u_radiationDensity;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n) * 43758.5453); }
  float hash2d(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash2d(i), b = hash2d(i + vec2(1, 0));
    float c = hash2d(i + vec2(0, 1)), d = hash2d(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Domain-warped noise for the rift edge — makes it breathe and writhe
  float riftNoise(vec2 p, float t) {
    vec2 q = vec2(smoothNoise(p + vec2(t * 0.3, t * 0.2)),
                  smoothNoise(p + vec2(t * 0.2, -t * 0.4)));
    vec2 r = vec2(smoothNoise(p + 4.0 * q + vec2(1.7, 9.2)),
                  smoothNoise(p + 4.0 * q + vec2(8.3, 2.8)));
    return smoothNoise(p + 4.0 * r);
  }

  void main() {
    float t = u_time * u_speed;
    float along = vUv.x;
    float across = vUv.y - 0.5;

    // Rift edge — domain-warped so it breathes and writhes
    vec2 riftUV = vec2(along * 4.0 - t * 0.5, across * 2.0);
    float riftWarp = riftNoise(riftUV, t) - 0.5;
    float riftEdge = abs(across - riftWarp * 0.1);

    float insideRift = 1.0 - smoothstep(0.0, u_riftWidth, riftEdge);

    // Edge shimmer — lensing distortion halo
    float lensing = exp(-riftEdge * 12.0) * (1.0 - insideRift * 0.7);
    lensing *= 0.5 + 0.5 * sin(along * 30.0 - t * 5.0 + riftWarp * 10.0);

    // Hawking radiation — sparse bright sparks ejected from the event horizon
    vec3 radCol = vec3(0.0);
    for (float i = 0.0; i < 12.0; i++) {
      if (i >= u_radiationDensity) break;
      float seed  = hash(i * 3.7 + floor(t * 2.0));
      float pos   = seed;
      float birth = fract(hash(i * 5.3 + floor(t * 4.0)) + t * 0.8);
      float life  = 1.0 - birth;

      // Spark drifts perpendicular to the rift as it ages
      float drift     = (hash(i * 9.1) - 0.5) * life * 0.4;
      float sparkDist = length(vec2((along - pos) * 6.0, (across - drift) * 8.0));
      float spark     = exp(-sparkDist * sparkDist * 20.0) * life * (1.0 - life) * 4.0;

      vec3 sparkColor = mix(u_radiationColor, vec3(1.0, 0.6, 0.2), life * 0.6);
      radCol += sparkColor * spark;
    }

    // Dimensional bleed — strands of an alternate reality bleeding through
    float bleedPhase = along * 15.0 + t * 1.5;
    float bleed = sin(bleedPhase) * sin(bleedPhase * 1.618) * 0.5 + 0.5;
    bleed *= insideRift * 0.3;
    bleed *= smoothNoise(vec2(along * 8.0, t * 0.7));

    // Dark matter texture inside the rift — not nothing, but OTHER
    float darkMatter = smoothNoise(vec2(along * 20.0 - t, across * 10.0)) * insideRift;
    float antimatter = smoothNoise(vec2(along * 35.0 + t * 1.3, across * 20.0 - t * 0.5)) * insideRift;

    vec3 col = vec3(0.0);
    col += u_riftColor * insideRift * (0.3 + darkMatter * 0.3 + antimatter * 0.15);
    col += u_lensColor * lensing * 0.8;
    col += vec3(0.6, 0.1, 0.9) * bleed;
    col += radCol;

    // Edge singularity line — ultra-bright thin line at the rift boundary
    float singularity = exp(-riftEdge * 60.0) * 2.0;
    singularity *= 0.7 + 0.3 * sin(along * 50.0 - t * 8.0);
    col += mix(u_lensColor, vec3(1.0), 0.5) * singularity;

    float alpha = clamp(
      insideRift * 0.7 + lensing * 0.6 + singularity * 0.8
      + (radCol.r + radCol.g + radCol.b) * 0.4,
      0.0, 1.0
    );

    gl_FragColor = vec4(col, alpha);
  }
`;
const VoidRiftMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_riftColor: new Vector3(0.02, 0.0, 0.06), // Near-void purple-black
    u_radiationColor: new Vector3(0.9, 0.95, 1.0), // Cool white radiation
    u_lensColor: new Vector3(0.5, 0.2, 1.0), // Violet gravitational lens
    u_speed: 0.4,
    u_riftWidth: 0.12,
    u_radiationDensity: 8.0,
}, vertexShader, fragmentShader);
extend({ VoidRiftMaterial });
export { VoidRiftMaterial };
