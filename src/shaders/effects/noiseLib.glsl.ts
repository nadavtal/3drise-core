// Pure-function noise library. Each function takes a position and returns a float.
// Effect descriptors include this via their `helpers` field; the factory dedupes
// by descriptor.id, so add `helpers: noiseLibGLSL` to any descriptor that needs it.
//
// Available functions (signature → float):
//   perlinNoise2D(vec2)
//   simplexNoise2D(vec2)
//   worleyNoise2D(vec2)        — returns distance to nearest cell point
//   valueNoise2D(vec2)
//   whiteNoise2D(vec2)
//   fractalNoise2D(vec2)       — fbm of perlin, 4 octaves
//   ridgedNoise2D(vec2)        — ridged multifractal, 4 octaves
//   turbulenceNoise2D(vec2)    — abs perlin fbm, 4 octaves
//   domainWarpedNoise2D(vec2)  — perlin with self-warped coords
//
// And a dispatch helper:
//   sampleNoise(float type, vec2 p)  // type: 0=perlin 1=simplex 2=worley 3=value
//                                    //       4=white 5=fractal 6=ridged 7=turbulence 8=domainWarped
export const noiseLibGLSL = /*glsl*/ `
// ---------------------------------------------------------------------------
// Hashing utilities
// ---------------------------------------------------------------------------
float nl_hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float nl_hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec2 nl_hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

vec3 nl_mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 nl_mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 nl_permute3(vec3 x) { return nl_mod289_3(((x * 34.0) + 1.0) * x); }
vec4 nl_mod289_4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 nl_permute4(vec4 x) { return nl_mod289_4(((x * 34.0) + 1.0) * x); }

vec2 nl_fade2(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

// ---------------------------------------------------------------------------
// White noise (uniform random)
// ---------------------------------------------------------------------------
float whiteNoise2D(vec2 p) {
  return nl_hash21(p);
}

// ---------------------------------------------------------------------------
// Value noise — bilinear interp of hashed corners
// ---------------------------------------------------------------------------
float valueNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = nl_hash21(i);
  float b = nl_hash21(i + vec2(1.0, 0.0));
  float c = nl_hash21(i + vec2(0.0, 1.0));
  float d = nl_hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// ---------------------------------------------------------------------------
// Perlin noise (2D, IQ/Stefan Gustavson formulation, returns roughly [-1, 1])
// ---------------------------------------------------------------------------
float perlinNoise2D(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = nl_permute4(nl_permute4(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = nl_fade2(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

// ---------------------------------------------------------------------------
// Simplex noise (Stefan Gustavson 2D)
// ---------------------------------------------------------------------------
float simplexNoise2D(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = nl_mod289_2(i);
  vec3 p = nl_permute3(nl_permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// ---------------------------------------------------------------------------
// Worley/cellular noise — distance to nearest random cell point in [0,1]
// ---------------------------------------------------------------------------
float worleyNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float minDist = 1.5;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = 0.5 + 0.5 * nl_hash22(i + neighbor);
      vec2 diff = neighbor + point - f;
      minDist = min(minDist, length(diff));
    }
  }
  return minDist;
}

// ---------------------------------------------------------------------------
// FBM/turbulence/ridged — fixed 4 octaves (loop bounds must be const in WebGL1)
// ---------------------------------------------------------------------------
float fractalNoise2D(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  vec2 q = p;
  for (int i = 0; i < 4; i++) {
    v += amp * perlinNoise2D(q);
    q *= 2.0;
    amp *= 0.5;
  }
  return v;
}

float turbulenceNoise2D(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  vec2 q = p;
  for (int i = 0; i < 4; i++) {
    v += amp * abs(perlinNoise2D(q));
    q *= 2.0;
    amp *= 0.5;
  }
  return v;
}

float ridgedNoise2D(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  vec2 q = p;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(perlinNoise2D(q));
    v += amp * n * n;
    q *= 2.0;
    amp *= 0.5;
  }
  return v;
}

float domainWarpedNoise2D(vec2 p) {
  vec2 warp = vec2(perlinNoise2D(p), perlinNoise2D(p + vec2(5.2, 1.3)));
  return perlinNoise2D(p + warp * 0.5);
}

// ---------------------------------------------------------------------------
// Dispatch — type select: 0=perlin 1=simplex 2=worley 3=value 4=white
//                          5=fractal 6=ridged 7=turbulence 8=domainWarped
// ---------------------------------------------------------------------------
float sampleNoise(float type, vec2 p) {
  if (type < 0.5) return perlinNoise2D(p);
  if (type < 1.5) return simplexNoise2D(p);
  if (type < 2.5) return worleyNoise2D(p) * 2.0 - 1.0;
  if (type < 3.5) return valueNoise2D(p) * 2.0 - 1.0;
  if (type < 4.5) return whiteNoise2D(p) * 2.0 - 1.0;
  if (type < 5.5) return fractalNoise2D(p);
  if (type < 6.5) return ridgedNoise2D(p);
  if (type < 7.5) return turbulenceNoise2D(p);
  return domainWarpedNoise2D(p);
}
`;
export const NOISE_TYPE_OPTIONS: {
            value: number;
            label: string;
        }[] = [
    { value: 0, label: 'Perlin' },
    { value: 1, label: 'Simplex' },
    { value: 2, label: 'Worley' },
    { value: 3, label: 'Value' },
    { value: 4, label: 'White' },
    { value: 5, label: 'Fractal' },
    { value: 6, label: 'Ridged' },
    { value: 7, label: 'Turbulence' },
    { value: 8, label: 'Domain warped' },
];
