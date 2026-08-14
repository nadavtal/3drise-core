type DbShader = {
    name: string;
    description: string;
    materialType: string;
    vertex: string;
    fragment: string;
    uniforms: Record<string, any>;
};
export const shaders: DbShader[] = [
    {
        name: 'Sand',
        description: 'A realistic sand shader with dynamic ripples and wind effects.',
        materialType: 'sand',
        vertex: `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    // NOTE: mat3(modelMatrix) is correct for uniform scale. If you put sand on a
    // non-uniformly scaled mesh, swap for a proper inverse-transpose normal mat.
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,
        fragment: `
  precision highp float;

  uniform float u_time;
  uniform vec3  u_color;
  uniform float u_colorVariation;
  uniform float u_scale;
  uniform float u_rippleScale;
  uniform float u_rippleStrength;
  uniform float u_rippleAsymmetry;
  uniform vec2  u_windDir;
  uniform float u_grainDensity;
  uniform float u_grainStrength;
  uniform float u_roughness;
  uniform vec3  u_sunDirection;
  uniform vec3  u_sunColor;
  uniform float u_sunIntensity;
  uniform float u_ambient;
  uniform vec3  u_skyColor;
  uniform vec3  u_groundColor;
  uniform float u_windSpeed;
  uniform vec3  u_mouse;
  uniform float u_mouseRadius;
  uniform float u_mouseStrength;
  uniform float u_mouseSwirl;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  // ── hashing & noise ─────────────────────────────────────────────────────
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i),                  hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);

  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p = ROT * p * 2.03 + vec2(1.7);
      a *= 0.5;
    }
    return s;
  }

  // Triplanar fBm — projected from the 3 world planes, blended by the
  // geometric normal so it never stretches on steep faces.
  float triFbm(vec3 p) {
    vec3 w = pow(abs(vWorldNormal), vec3(4.0));
    w /= (w.x + w.y + w.z + 1e-5);
    return fbm(p.zy) * w.x + fbm(p.xz) * w.y + fbm(p.xy) * w.z;
  }

  // ── wind ripples ────────────────────────────────────────────────────────
  // Crests perpendicular to wind, sinuous, with an asymmetric tent profile
  // (gentle windward, steep lee). The whole pattern MIGRATES downwind over time
  // (u_time * u_windSpeed) — windward face erodes, lee face builds — which is
  // how real ripples crawl. Returns a height in [0,1].
  float rippleField(vec2 xz, vec2 w) {
    vec2 perp = vec2(-w.y, w.x);
    float drift = u_time * u_windSpeed;            // world-distance the pattern has crawled
    float along = dot(xz, w) - drift;
    float across = dot(xz, perp);

    float wob = (fbm(vec2(across * 0.6, along * 0.15) * u_rippleScale) - 0.5) * 1.4;
    float k = mix(0.5, 0.82, clamp(u_rippleAsymmetry, 0.0, 1.0));

    float ph  = fract(along * u_rippleScale * 0.6 + wob);
    float crest = min(smoothstep(0.0, k, ph), 1.0 - smoothstep(k, 1.0, ph));
    crest = pow(crest, 0.8);

    // amplitude breathes along the crest so ripples merge & fade naturally
    float amp = 0.55 + 0.45 * fbm(vec2(across * 0.25, along * 0.05) * u_rippleScale + 7.0);

    // finer secondary ripple set riding on the primary
    float ph2 = fract(along * u_rippleScale * 1.7 + wob * 0.6);
    float crest2 = min(smoothstep(0.0, k, ph2), 1.0 - smoothstep(k, 1.0, ph2));

    return crest * amp * 0.8 + crest2 * 0.2;
  }

  // Smooth falloff of the cursor gust at this fragment (0 outside the radius).
  float mouseGust(vec3 wp) {
    if (u_mouseStrength <= 0.001) return 0.0;
    float d = length(wp.xz - u_mouse.xz);
    return smoothstep(u_mouseRadius, 0.0, d) * u_mouseStrength;
  }

  // World-space sand height. Single scalar field -> derivative bump below.
  // Ripples are gated to up-facing surfaces (they only form on wind-exposed flats).
  float sandHeight(vec3 wp, vec3 gN) {
    vec2 w = normalize(u_windDir + vec2(1e-5));

    // Wind-blown grit: the medium detail layer crawls gently downwind too.
    vec3 flow = vec3(w.x, 0.0, w.y) * (u_time * u_windSpeed * 0.5);
    float dunes = triFbm(wp * (0.6 * u_scale));            // coarse undulation (static)
    float micro = triFbm((wp - flow) * (3.0 * u_scale));  // medium grit (advected)

    float up = clamp(gN.y, 0.0, 1.0);
    up *= up;

    // ── interactive gust: shove + swirl the ripple sampling away from the
    //    cursor, and flatten the disturbed core (freshly blown sand). ──
    vec2 xz = wp.xz;
    float gust = mouseGust(wp);
    if (gust > 0.0) {
      vec2 d2 = wp.xz - u_mouse.xz;
      vec2 dir = d2 / (length(d2) + 1e-4);
      vec2 tang = vec2(-dir.y, dir.x);
      xz += (dir + tang * u_mouseSwirl) * gust * u_mouseRadius * 0.18;
    }

    float ripples = rippleField(xz, w) * up * (1.0 - 0.6 * gust);
    return dunes * 0.10 + micro * 0.025 + ripples * (0.14 * u_rippleStrength);
  }

  // Schüler surface-gradient bump: perturb N from a height field using screen
  // derivatives of world position — no tangents needed, works on any mesh.
  vec3 perturbNormal(vec3 pos, vec3 N, float h, float scale) {
    vec3 dpdx = dFdx(pos);
    vec3 dpdy = dFdy(pos);
    vec3 r1 = cross(dpdy, N);
    vec3 r2 = cross(N, dpdx);
    float det = dot(dpdx, r1);
    vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
    return normalize(abs(det) * N - scale * grad);
  }

  // Qualitative Oren-Nayar — the rough, matte, slightly retro look of powder.
  float orenNayar(vec3 L, vec3 V, vec3 N, float rough) {
    float r2 = rough * rough;
    float A = 1.0 - 0.5 * r2 / (r2 + 0.33);
    float B = 0.45 * r2 / (r2 + 0.09);
    float NdotL = clamp(dot(N, L), 1e-3, 1.0);
    float NdotV = clamp(dot(N, V), 1e-3, 1.0);
    float ga = max(0.0, dot(normalize(V - N * NdotV), normalize(L - N * NdotL)));
    float aL = acos(NdotL);
    float aV = acos(NdotV);
    float alpha = max(aL, aV);
    float beta  = min(aL, aV);
    return NdotL * (A + B * ga * sin(alpha) * tan(min(beta, 1.4)));
  }

  // Sparse, view-dependent micro-facet glints. A small fraction of grain cells
  // catch the half-vector, so the surface twinkles as the camera moves. Built to
  // stay stable on large meshes:
  //  - Cell ids are WRAPPED before hashing. Hashing world coords directly blows
  //    up to the hundreds-of-thousands on a big plane, where float32 has no
  //    fractional precision left and the pattern strobes. The ~11-unit tile is
  //    invisible under sparse random glints.
  //  - Glints are ANTI-ALIASED by their screen footprint: once a grain cell is
  //    sub-pixel (far away) it can't be resolved and is faded out, instead of
  //    flickering every frame.
  //  - A smooth per-grain pulse keeps static frames alive without a hard re-roll.
  float sparkle(vec3 wp, vec3 N, vec3 H) {
    float density = clamp(u_grainDensity, 0.0, 4.0);
    float cellScale = 60.0 * (0.5 + density);

    // grain cells per pixel; >1 means the glint is sub-pixel -> fade to avoid aliasing
    vec3 fw = fwidth(wp) * cellScale;
    float footprint = max(max(fw.x, fw.y), fw.z);
    float aa = clamp(1.5 - footprint, 0.0, 1.0);
    if (aa <= 0.0) return 0.0;

    vec3 id = mod(floor(wp * cellScale), 1024.0);   // bounded -> precision-safe
    float r1 = hash13(id);
    float r2 = hash13(id + 17.13);
    float r3 = hash13(id + 41.71);

    vec3 tx = normalize(cross(N, vec3(0.0, 1.0, 0.0)) + vec3(1e-4));
    vec3 ty = cross(N, tx);
    vec3 mn = normalize(N + (tx * (r1 - 0.5) + ty * (r2 - 0.5)) * 0.9);

    float s = pow(max(dot(mn, H), 0.0), 900.0);
    float gate = step(0.93 - 0.06 * density, r3);
    float twinkle = 0.65 + 0.35 * sin(u_time * 1.8 + r3 * 6.2831);

    return s * gate * twinkle * aa;
  }

  void main() {
    vec3 wp = vWorldPos;
    vec3 gN = normalize(vWorldNormal);

    float h = sandHeight(wp, gN);
    vec3 N = perturbNormal(wp, gN, h, 1.0);

    vec3 V = normalize(cameraPosition - wp);
    vec3 L = normalize(u_sunDirection);
    vec3 Hh = normalize(L + V);

    // ── albedo: iron-oxide tonal variation + trough darkening ──
    float tone = triFbm(wp * (0.2 * u_scale) + 11.0);
    vec3 cool = u_color * vec3(0.82, 0.80, 0.74);
    vec3 warm = u_color * vec3(1.07, 0.99, 0.85);
    vec3 albedo = mix(u_color, mix(cool, warm, tone), clamp(u_colorVariation, 0.0, 1.0));
    albedo *= mix(0.86, 1.06, smoothstep(0.0, 0.16, h));      // cavity in troughs
    albedo *= 0.97 + 0.06 * triFbm(wp * (6.0 * u_scale));     // faint grit speckle

    // ── lighting ──
    float NdotL = max(dot(N, L), 0.0);
    float diff = orenNayar(L, V, N, clamp(u_roughness, 0.04, 1.0));
    vec3 sun = u_sunColor * u_sunIntensity;
    vec3 color = albedo * sun * diff;

    float hemi = N.y * 0.5 + 0.5;
    vec3 amb = mix(u_groundColor, u_skyColor, hemi) * u_ambient;
    color += albedo * amb;

    // ── grain sparkle (only on the lit side; freshly blown grains glint more) ──
    float gust = mouseGust(wp);
    float glint = sparkle(wp, N, Hh) * NdotL;
    color += glint * (1.0 + 1.5 * gust) * (u_sunColor * 0.7 + 0.3);

    // ── lofted-sand sheen: disturbed sand catches a little extra light ──
    color += albedo * gust * 0.22;

    gl_FragColor = vec4(color, 1.0);
  }
`,
        uniforms: {
            u_time: 0,
            u_color: [0.78, 0.66, 0.46],
            u_colorVariation: 0.5,
            u_scale: 1.0,
            u_rippleScale: 1.0,
            u_rippleStrength: 1.0,
            u_rippleAsymmetry: 0.6,
            u_windDir: [1, 0],
            u_grainDensity: 1.0,
            u_roughness: 0.88,
            u_sunDirection: [0.5, 0.82, 0.28],
            u_sunColor: [1.0, 0.93, 0.82],
            u_sunIntensity: 1.0,
            u_ambient: 1.0,
            u_skyColor: [0.55, 0.68, 0.92],
            u_groundColor: [0.45, 0.33, 0.22],
            u_windSpeed: 0.15,
            u_mouse: [0, -1000, 0],
            u_mouseRadius: 3.0,
            u_mouseStrength: 0.0,
            u_mouseSwirl: 0.5,
        }
    },
    {
        name: 'Molecules',
        description: 'A shader for rendering glowing molecular structures.',
        materialType: 'particles',
        vertex: `
  attribute float aPhase;
  attribute float aSize;

  uniform float u_time;
  uniform float uPointSize;
  uniform float uIntensity;

  varying float vAlpha;
  varying vec3  vColor;

  vec3 hsv2rgb(float h, float s, float v){
    vec3 rgb=clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);
    return v*mix(vec3(1.),rgb,s);
  }

  void main() {
    // Each node has independent color + pulse
    float hue    = mod(aPhase + u_time * 0.08, 1.0);
    float pulse  = 0.5 + 0.5 * sin(u_time * 2.5 + aPhase * 6.28);
    vColor       = hsv2rgb(hue, 0.85, 1.0);
    vAlpha       = 0.55 + 0.45 * pulse;

    vec4 mv       = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize  = uPointSize * aSize * (0.6 + 0.4 * pulse) * uIntensity * (250.0 / -mv.z);
    gl_Position   = projectionMatrix * mv;
  }
`, fragment: `
  varying float vAlpha;
  varying vec3  vColor;
  uniform float uOpacity;

  void main() {
    vec2  coord = gl_PointCoord - vec2(0.5);
    float dist  = length(coord);
    if (dist > 0.5) discard;

    // Gaussian core glow
    float glow = exp(-dist * dist * 8.0);
    // Four-point diffraction spike (like a bright star)
    float cx   = exp(-abs(coord.x) * 20.0) * exp(-coord.y*coord.y * 36.0);
    float cy   = exp(-abs(coord.y) * 20.0) * exp(-coord.x*coord.x * 36.0);
    float spike = (cx + cy) * 0.5;
    // White-hot centre
    float core  = exp(-dist * dist * 80.0);

    vec3 col = mix(vColor, vec3(1.0), core * 0.8 + spike * 0.2);
    gl_FragColor = vec4(col, vAlpha * uOpacity * (glow + spike * 0.6 + core));
  }
`,
        uniforms: {
            u_time: 0,
            uPointSize: 1.0,
            uIntensity: 1.0,
            uOpacity: 1.0,
        }
    }
];
export const getShaderByName = (name: string): DbShader | undefined => shaders.find(s => s.name === name);
