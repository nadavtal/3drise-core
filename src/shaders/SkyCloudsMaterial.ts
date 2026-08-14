import { Color, Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface SkyCloudsMaterialUniforms {
    u_time: {
        value: number;
    };
    u_cloudColor: {
        value: Color;
    };
    u_ambientColor: {
        value: Color;
    };
    u_cameraPos: {
        value: Vector3;
    };
    u_resolution: {
        value: Vector2;
    };
    u_sunPosition: {
        value: Vector3;
    };
    u_cloudCoverage: {
        value: number;
    };
    u_cloudScale: {
        value: number;
    };
    u_softness: {
        value: number;
    };
    u_windDirection: {
        value: Vector2;
    };
    u_silverLining: {
        value: number;
    };
    u_selfShading: {
        value: number;
    };
    u_godRays: {
        value: number;
    };
    u_storminess: {
        value: number;
    };
    u_bloomIntensity: {
        value: number;
    };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            skyCloudsMaterial: any;
        }
    }
}

// Vertex shader
const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = pos.xyww;
  }
`;
// Fragment shader with simplex noise for procedural clouds
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec3 u_cloudColor;
  uniform vec3 u_ambientColor;
  uniform vec3 u_cameraPos;
  uniform vec2 u_resolution;
  uniform vec3 u_sunPosition;
  uniform float u_cloudCoverage;
  uniform float u_cloudScale;
  uniform float u_softness;
  uniform vec2 u_windDirection;
  uniform float u_silverLining;
  uniform float u_selfShading;
  uniform float u_godRays;
  uniform float u_storminess;
  uniform float u_bloomIntensity;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Simplex noise permutation function
  vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  // 2D Simplex noise
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    // Wind-driven UV offset (replaces hardcoded X drift)
    vec2 windOffset = u_windDirection * u_time / 100.0;

    // Cloud UV with camera-based parallax, wind, and scale
    vec2 cloudUV = vUv * u_cloudScale + vec2(
      u_cameraPos.x / 1000.0,
      u_cameraPos.z / 1000.0
    ) + windOffset;

    // Storminess adds turbulent UV distortion
    float stormDistort = u_storminess * 0.3;
    cloudUV += stormDistort * vec2(
      snoise(vUv * 4.0 + u_time * 0.1),
      snoise(vUv * 4.0 + u_time * 0.1 + 100.0)
    );

    // Multi-octave noise for cloud density
    float n = snoise(cloudUV * 3.0 + u_time / 50.0) * 0.6
            + snoise(cloudUV * 6.0 + u_time / 40.0) * 0.3
            + snoise(cloudUV * 12.0 + u_time / 30.0) * 0.1;

    // Coverage: shift noise range — 0.0 = clear sky, 1.0 = fully overcast
    // Default coverage 0.5 reproduces original look (threshold centered)
    float coverageShift = (u_cloudCoverage - 0.5) * 1.6;
    float rawDensity = 0.5 * n + 0.5 + coverageShift;

    // Softness controls the smoothstep width (0=sharp cumulus, 1=diffuse haze)
    float softLow = mix(0.3, 0.05, u_softness);
    float softHigh = mix(0.7, 0.95, u_softness);
    float cloudDensity = smoothstep(softLow, softHigh, rawDensity);

    // Storminess boosts density
    cloudDensity = mix(cloudDensity, min(cloudDensity * 1.4, 1.0), u_storminess);

    // Horizon fade to prevent hard edges
    float horizonFade = smoothstep(0.0, 0.3, 1.0 - abs(vUv.y - 0.5) * 2.0);
    
    // Edge fade for smooth blending at cloud boundaries
    float edgeFade = (1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0)) *
                    (1.0 - pow(abs(vUv.y - 0.5) * 2.0, 2.0));

    float finalOpacity = cloudDensity * horizonFade * edgeFade * 0.7;

    // ---- LIGHTING ----
    // Sun direction projected to 2D cloud plane (xz → UV)
    vec3 sunDir = normalize(u_sunPosition);
    vec2 sunDir2D = normalize(sunDir.xz + vec2(0.001));

    // Noise gradient (finite differences for cheap normal approximation)
    float eps = 0.01;
    float nR = snoise((cloudUV + vec2(eps, 0.0)) * 3.0 + u_time / 50.0);
    float nU = snoise((cloudUV + vec2(0.0, eps)) * 3.0 + u_time / 50.0);
    vec2 noiseGrad = vec2(nR - n * 0.6 / 0.6, nU - n * 0.6 / 0.6) / eps;

    // Silver lining: bright rim on cloud edges facing the sun
    float gradSunDot = dot(normalize(noiseGrad + vec2(0.001)), sunDir2D);
    float silverLining = smoothstep(0.0, 1.0, gradSunDot) * u_silverLining;
    // Stronger at cloud edges (thin regions)
    float edgeMask = smoothstep(0.05, 0.4, cloudDensity) * (1.0 - smoothstep(0.4, 0.9, cloudDensity));
    silverLining *= edgeMask;

    // Self-shading: darken underside (opposite sun direction in Y)
    // sunDir.y > 0 means sun is above — bottom of clouds should be darker
    float shadeFactor = u_selfShading * (1.0 - smoothstep(0.0, 0.6, cloudDensity));
    float sunHeight = clamp(sunDir.y, 0.0, 1.0);
    shadeFactor *= sunHeight;

    // Blend lit color and ambient/shadow color
    vec3 litColor = u_cloudColor;
    vec3 shadowColor = u_ambientColor;
    // Storminess darkens overall color
    litColor = mix(litColor, litColor * 0.4, u_storminess);
    shadowColor = mix(shadowColor, shadowColor * 0.3, u_storminess);

    vec3 baseColor = mix(litColor, shadowColor, shadeFactor);
    // Add silver lining glow
    baseColor += vec3(silverLining) * litColor * 1.5;

    // ---- GOD RAYS ----
    if (u_godRays > 0.0) {
      // Project sun to UV space
      vec2 sunUV = sunDir.xz * 0.5 + 0.5;
      vec2 toSun = sunUV - vUv;
      float distToSun = length(toSun);

      // Radial sampling: accumulate cloud gaps along ray toward sun
      float rayAccum = 0.0;
      const int RAY_STEPS = 8;
      for (int i = 1; i <= RAY_STEPS; i++) {
        vec2 samplePos = vUv + toSun * float(i) / float(RAY_STEPS) * 0.5;
        vec2 sampleCloudUV = samplePos * u_cloudScale + vec2(
          u_cameraPos.x / 1000.0,
          u_cameraPos.z / 1000.0
        ) + windOffset;
        float sampleN = snoise(sampleCloudUV * 3.0 + u_time / 50.0) * 0.6
                       + snoise(sampleCloudUV * 6.0 + u_time / 40.0) * 0.3;
        float sampleDensity = smoothstep(softLow, softHigh, 0.5 * sampleN + 0.5 + coverageShift);
        rayAccum += (1.0 - sampleDensity);
      }
      rayAccum /= float(RAY_STEPS);

      // Rays stronger near sun, fade with distance
      float rayFalloff = exp(-distToSun * 3.0) * sunHeight;
      float rays = rayAccum * rayFalloff * u_godRays;

      // Add warm light shaft color
      vec3 rayColor = litColor * 1.2;
      baseColor += rayColor * rays * (1.0 - cloudDensity * 0.5);
      finalOpacity = max(finalOpacity, rays * 0.3 * horizonFade * edgeFade);
    }

    // Bloom: push lit edges above 1.0 for post-processing bloom interaction
    baseColor += vec3(silverLining * u_bloomIntensity * 0.5);

    vec3 finalColor = baseColor;

    gl_FragColor = vec4(finalColor, finalOpacity);

    // Discard nearly transparent fragments for performance
    if (finalOpacity < 0.01) discard;
  }
`;
// Create the shader material with uniforms
const SkyCloudsMaterial = shaderMaterial({
    u_time: 0.0,
    u_cloudColor: new Color(1.0, 1.0, 1.0),
    u_ambientColor: new Color(0.7, 0.7, 0.8),
    u_cameraPos: new Vector3(),
    u_resolution: new Vector2(800, 600),
    u_sunPosition: new Vector3(0.0, 1.0, 0.0),
    u_cloudCoverage: 0.5,
    u_cloudScale: 6.0,
    u_softness: 0.5,
    u_windDirection: new Vector2(1.0, 0.0),
    u_silverLining: 0.0,
    u_selfShading: 0.0,
    u_godRays: 0.0,
    u_storminess: 0.0,
    u_bloomIntensity: 0.0,
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ SkyCloudsMaterial });
export { SkyCloudsMaterial };
