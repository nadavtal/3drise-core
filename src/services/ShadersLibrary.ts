import { getType } from "../utils/dataUtils";
import { commonNoiseFunctions } from "../shaders/CommonNoiseFunctions";
import type { OptionalProperty } from "../utils/optionalProperties";
import type { UniformDefinition } from "../types/types";
export type CustomShaderSettings = {
    name: string;
    description: string;
    uniforms: UniformDefinition[];
    vertex: string;
    fragment: string;
};

export type ShaderType = string;


const clouds = {
    name: "Clouds",
    description: "Dramatic clouds with lightning effects",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_resolution',
            description: 'Viewport resolution',
            type: 'vec2',
            defaultValue: [800, 600],
        },
        {
            name: 'u_mouse',
            description: 'Mouse position',
            type: 'vec2',
            defaultValue: [0.5, 0.5],
        },
        {
            name: 'u_scroll',
            description: 'Scroll position',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_noise',
            description: 'Noise texture',
            type: 'sampler2D',
            defaultValue: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png",
        },
        {
            name: 'u_texture',
            description: 'Background texture',
            type: 'sampler2D',
            defaultValue: "https://3d-rise.sfo3.digitaloceanspaces.com/app/images/clouds/clouds.jpg",
        },
        {
            name: 'u_cloudColor',
            description: 'Base cloud color',
            type: 'vec3',
            defaultValue: '#830088',
        },
        {
            name: 'u_lightColor',
            description: 'Light color',
            type: 'vec3',
            defaultValue: '#409eff',
        },
        {
            name: 'u_useOriginalImage',
            description: 'Use original image texture',
            type: 'float',
            defaultValue: 0.0,
        }
    ],
    vertex: `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
    fragment: `
  varying vec2 vUv;
  varying vec3 vPosition;
  

  float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 perm(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
  }
  
  void main() {
    vec4 bgColor = texture2D(u_texture, vUv);

    // Spherical UV coordinate processing
    vec2 sphereUV = vUv;
    
    // Compensate for pole distortion by adjusting V coordinate
    float poleCompensation = sin(sphereUV.y * 3.14159);
    poleCompensation = max(poleCompensation, 0.1); // Prevent division by zero at poles
    
    // Create base UV coordinates optimized for sphere geometry
    vec2 uv = sphereUV;
    uv.x *= 2.0; // Stretch horizontally to reduce seam visibility
    uv = (uv - 0.5) * 2.0; // Center and scale
    
    // Use 3D position for more natural noise distribution
    vec3 spherePos = normalize(vPosition);
    
    // Generate noise using both UV and 3D position for better sphere distribution
    float noise1 = noise(vec3(uv * 2.0 + spherePos.xy * 0.5, u_time * 2.0)) * 2.0;
    float noise2 = noise(vec3(spherePos * 3.0 + vec3(u_time * 1.357 - 10.0)));

    // Apply scroll effect with pole compensation
    uv.y -= u_scroll * 0.0001 * poleCompensation;

    // Texture sampling with proper sphere scaling
    uv += texture2D(u_texture, uv * 0.8 - vec2(u_time * 0.05, 0.0)).rg * 0.08 + noise1 * 0.008 * (1.0 - clamp(noise1 * noise1 * 2.0 + 0.2, 0.0, 1.0));

    vec3 tex = texture2D(u_texture, uv * 0.8 - vec2(u_time * 0.02, 0.0)).rgb;

    uv.y -= u_scroll * 0.0001 * poleCompensation;
    vec3 tex1 = texture2D(u_texture, uv * 0.8 - vec2(u_time * 0.08, 0.0)).rgb;

    uv.y -= u_scroll * 0.0001 * poleCompensation;
    vec3 tex2 = texture2D(u_texture, uv * 0.6 + 0.2 - vec2(u_time * 0.1, 0.0)).rgb;

    vec3 fragcolour = tex;

    float shade = tex.r;
    shade *= clamp(noise1 * noise2 * sin(u_time * 3.0), 0.2, 10.0);
    shade += shade * shade * 3.0;
    shade -= (1.0 - clamp(tex1 * 4.0, 0.0, 1.0).r) * 0.2;
    shade -= (1.0 - clamp(tex2 * 4.0, 0.0, 1.0).r) * 0.1;

    if (u_useOriginalImage > 0.5) {

    } else {
      fragcolour = mix(u_cloudColor, u_lightColor, shade);
    }
    gl_FragColor = vec4(fragcolour, 1.0);
  }
`,
};
const volumetric = {
    name: "Volumetric Clouds",
    description: "3D raymarched clouds with realistic density and light scattering",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_cameraPosition',
            description: 'Camera position in world space',
            type: 'vec3',
            defaultValue: [0.0, 0.0, 0.0],
        },
        {
            name: 'u_lightDirection',
            description: 'Direction of the main light source',
            type: 'vec3',
            defaultValue: [0.5, 1.0, 0.5],
        },
        {
            name: 'u_cloudDensity',
            description: 'Overall density of the clouds',
            type: 'float',
            defaultValue: 0.8,
        },
        {
            name: 'u_cloudCoverage',
            description: 'Coverage of clouds in the sky',
            type: 'float',
            defaultValue: 0.4,
        },
        {
            name: 'u_cloudScale',
            description: 'Scale of the cloud formations',
            type: 'float',
            defaultValue: 0.5,
        },
        {
            name: 'u_lightColor',
            description: 'Color of the light illuminating the clouds',
            type: 'vec3',
            defaultValue: '#f1e4b3',
        },
        {
            name: 'u_shadowColor',
            description: 'Color of the cloud shadows',
            type: 'vec3',
            defaultValue: '#4a5a6d',
        },
        {
            name: 'u_absorption',
            description: 'Absorption coefficient for light passing through clouds',
            type: 'float',
            defaultValue: 1.0,
        },
        {
            name: 'u_scattering',
            description: 'Scattering coefficient for light within clouds',
            type: 'float',
            defaultValue: 0.5,
        },
    ],
    vertex: `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
    fragment: `
varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  
  ${commonNoiseFunctions}
  
  float cloudDensity(vec3 pos) {
    vec3 p = pos * u_cloudScale + vec3(u_time * 0.1, 0.0, u_time * 0.05);
    float density = fbm(p) - u_cloudCoverage;
    return max(0.0, density) * u_cloudDensity;
  }
  
  vec3 rayMarch(vec3 rayOrigin, vec3 rayDir, float maxDist) {
    vec3 color = vec3(0.0);
    float transmittance = 1.0;
    float stepSize = maxDist / 32.0;
    
    for (int i = 0; i < 32; i++) {
      vec3 pos = rayOrigin + rayDir * float(i) * stepSize;
      float density = cloudDensity(pos);
      
      if (density > 0.01) {
        // Light scattering calculation
        float lightDensity = cloudDensity(pos + u_lightDirection * stepSize);
        float scattering = exp(-lightDensity * u_scattering);
        
        vec3 lightContrib = u_lightColor * scattering * density * transmittance;
        color += lightContrib * stepSize;
        
        transmittance *= exp(-density * u_absorption * stepSize);
        
        if (transmittance < 0.01) break;
      }
    }
    
    return color + u_shadowColor * (1.0 - transmittance);
  }
  
  void main() {
    vec3 rayDir = normalize(vWorldPosition - u_cameraPosition);
    vec3 color = rayMarch(vWorldPosition, rayDir, 10.0);
    
    gl_FragColor = vec4(color, 1.0);
  }
  `,
};
const cartoonClouds = {
    name: "Cartoon Clouds",
    description: "Soft, puffy stylized clouds with rim lighting",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_cloudColor',
            description: 'Base cloud color',
            type: 'vec3',
            defaultValue: '#f1e4b3',
        },
        {
            name: 'u_rimColor',
            description: 'Rim lighting color',
            type: 'vec3',
            defaultValue: '#11e23eff',
        },
        {
            name: 'u_puffiness',
            description: 'Cloud puffiness factor',
            type: 'float',
            defaultValue: 0.2,
        },
        {
            name: 'u_softness',
            description: 'Edge softness of clouds',
            type: 'float',
            defaultValue: 0.3,
        }
    ],
    vertex: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragment: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    ${commonNoiseFunctions}
    
    void main() {
      vec2 uv = vUv;
      
      // Create puffy cloud shapes
      float noise1 = fbm(vec3(uv * 2.0, u_time * 0.1)) * u_puffiness;
      float noise2 = fbm(vec3(uv * 4.0, u_time * 0.05)) * u_puffiness * 0.5;
      
      float cloudMask = smoothstep(0.3, 0.7, noise1 + noise2);
      
      // Rim lighting effect
      float rim = 1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
      rim = smoothstep(0.0, 1.0, rim);
      
      vec3 finalColor = mix(u_cloudColor, u_rimColor, rim * cloudMask);
      finalColor = mix(vec3(0.0), finalColor, smoothstep(0.0, u_softness, cloudMask));
      
      gl_FragColor = vec4(finalColor, cloudMask);
    }
  `
};
const stormClouds = {
    name: "Storm Clouds",
    description: "Dark, dramatic clouds with lightning effects",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_stormIntensity',
            description: 'Intensity of the storm effect',
            type: 'float',
            defaultValue: 1.2,
        },
        {
            name: 'u_lightningFreq',
            description: 'Frequency of lightning flashes',
            type: 'float',
            defaultValue: 3.1,
        },
        {
            name: 'u_darkColor',
            description: 'Dark storm cloud color',
            type: 'vec3',
            defaultValue: '#1a1a2e',
        },
        {
            name: 'u_lightColor',
            description: 'Lightning and bright areas color',
            type: 'vec3',
            defaultValue: '#f1e4b3',
        },
        {
            name: 'u_turbulence',
            description: 'Cloud turbulence factor',
            type: 'float',
            defaultValue: 0.5,
        }
    ],
    vertex: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragment: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    ${commonNoiseFunctions}
    
    void main() {
      vec2 uv = vUv;
      
      // Turbulent cloud formation
      float noise1 = fbm(vec3(uv * 1.5 + u_time * 0.1, u_time * 0.2)) * u_turbulence;
      float noise2 = fbm(vec3(uv * 3.0 + u_time * 0.15, u_time * 0.1)) * u_turbulence * 0.5;
      
      float stormMask = noise1 + noise2;
      stormMask = pow(abs(stormMask), u_stormIntensity);
      
      // Lightning effect
      float lightning = sin(u_time * u_lightningFreq) * 0.5 + 0.5;
      lightning = pow(lightning, 10.0) * step(0.9, lightning);
      
      vec3 cloudColor = mix(u_darkColor, u_lightColor, stormMask + lightning);
      
      gl_FragColor = vec4(cloudColor, 1.0);
    }
  `
};
const cirrusClouds = {
    name: "Cirrus Clouds",
    description: "Thin, wispy high-altitude clouds",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_windSpeed',
            description: 'Wind speed affecting cloud movement',
            type: 'float',
            defaultValue: 0.05,
        },
        {
            name: 'u_transparency',
            description: 'Overall transparency of the clouds',
            type: 'float',
            defaultValue: 0.4,
        },
        {
            name: 'u_streakiness',
            description: 'Streaky appearance factor',
            type: 'float',
            defaultValue: 8.0,
        },
        {
            name: 'u_cloudColor',
            description: 'Color of the cirrus clouds',
            type: 'vec3',
            defaultValue: '#ffffff',
        }
    ],
    vertex: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragment: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    ${commonNoiseFunctions}
    
    void main() {
      vec2 uv = vUv;
      uv.x += u_time * u_windSpeed;
      
      // Create streaky, wispy patterns
      float streak1 = fbm(vec3(uv.x * u_streakiness, uv.y * 2.0, u_time * 0.1));
      float streak2 = fbm(vec3(uv.x * u_streakiness * 0.5, uv.y * 4.0, u_time * 0.05));
      
      float cirrusMask = (streak1 + streak2 * 0.5) * u_transparency;
      cirrusMask = smoothstep(0.2, 0.8, cirrusMask);
      
      vec3 finalColor = u_cloudColor * cirrusMask;
      
      gl_FragColor = vec4(finalColor, cirrusMask);
    }
  `
};
const nebulaClouds = {
    name: "Nebula Clouds",
    description: "Colorful cosmic gas clouds with glow effects",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_color1',
            description: 'Primary nebula color',
            type: 'vec3',
            defaultValue: '#cc33ff',
        },
        {
            name: 'u_color2',
            description: 'Secondary nebula color',
            type: 'vec3',
            defaultValue: '#00aaff',
        },
        {
            name: 'u_color3',
            description: 'Tertiary nebula color',
            type: 'vec3',
            defaultValue: '#ff6655',
        },
        {
            name: 'u_glowIntensity',
            description: 'Intensity of the glow effect',
            type: 'float',
            defaultValue: 1.5,
        },
        {
            name: 'u_complexity',
            description: 'Complexity of the nebula patterns',
            type: 'float',
            defaultValue: 3.0,
        }
    ],
    vertex: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragment: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    ${commonNoiseFunctions}
    
    void main() {
      vec2 uv = vUv;
      
      // Create complex nebula patterns
      float noise1 = fbm(vec3(uv * u_complexity, u_time * 0.1));
      float noise2 = fbm(vec3(uv * u_complexity * 1.5, u_time * 0.08));
      float noise3 = fbm(vec3(uv * u_complexity * 2.0, u_time * 0.05));
      
      // Mix colors based on noise patterns
      vec3 color = u_color1 * noise1 + u_color2 * noise2 + u_color3 * noise3;
      
      // Add glow effect
      float glow = (noise1 + noise2 + noise3) / 3.0;
      glow = pow(glow, 1.0 / u_glowIntensity);
      
      color *= glow * u_glowIntensity;
      
      gl_FragColor = vec4(color, glow);
    }
  `
};
const painterlyClouds = {
    name: "Painterly Clouds",
    description: "Artistic clouds with brush stroke textures",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_brushSize',
            description: 'Size of the brush strokes',
            type: 'float',
            defaultValue: 2.0,
        },
        {
            name: 'u_paintTexture',
            description: 'Brush texture for painterly effect',
            type: 'sampler2D',
            defaultValue: "",
        },
        {
            name: 'u_baseColor',
            description: 'Base color of the clouds',
            type: 'vec3',
            defaultValue: '#e6e6f2',
        },
        {
            name: 'u_highlightColor',
            description: 'Highlight color for brush strokes',
            type: 'vec3',
            defaultValue: '#2de981ff',
        },
        {
            name: 'u_brushStrokes',
            description: 'Density of brush strokes',
            type: 'float',
            defaultValue: 8.0,
        },
        {
            name: 'u_hasText',
            description: 'Whether paint texture is available',
            type: 'float',
            defaultValue: 0.0,
        }
    ],
    vertex: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragment: `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    ${commonNoiseFunctions}
    
    void main() {
      vec2 uv = vUv;
      
      // Create brush stroke patterns
      float brushNoise = fbm(vec3(uv * u_brushStrokes, u_time * 0.02));
      
      // Sample paint texture if available
      vec3 paintSample = u_hasText > 0.5 ? texture2D(u_paintTexture, uv * u_brushSize).rgb : vec3(1.0);
      
      // Create painterly cloud shapes
      float cloudShape = fbm(vec3(uv * 2.0, u_time * 0.05));
      cloudShape = smoothstep(0.3, 0.7, cloudShape + brushNoise * 0.2);
      
      // Mix colors with painterly effect
      vec3 finalColor = mix(u_baseColor, u_highlightColor, brushNoise * cloudShape);
      finalColor *= paintSample;
      
      gl_FragColor = vec4(finalColor, cloudShape);
    }
  `
};
const basicWater = {
    name: "Basic Water",
    description: "Realistic water with heightmap displacement and lighting effects",
    uniforms: [
        {
            name: 'u_time',
            description: 'Time uniform for animations',
            type: 'float',
            defaultValue: 0.0,
        },
        {
            name: 'u_seaHeight',
            description: 'Height of the water waves',
            type: 'float',
            defaultValue: 0.6,
        },
        {
            name: 'u_seaChoppy',
            description: 'Choppiness of the water surface',
            type: 'float',
            defaultValue: 4.0,
        },
        {
            name: 'u_seaSpeed',
            description: 'Speed of wave animation',
            type: 'float',
            defaultValue: 0.8,
        },
        {
            name: 'u_seaFreq',
            description: 'Frequency of the waves',
            type: 'float',
            defaultValue: 0.16,
        },
        {
            name: 'u_seaBaseColor',
            description: 'Base color of the water',
            type: 'vec3',
            defaultValue: '#000f30',
        },
        {
            name: 'u_seaWaterColor',
            description: 'Main water color',
            type: 'vec3',
            defaultValue: '#7a8b6d',
        },
        {
            name: 'u_reflectionColor',
            description: 'Color of water reflections',
            type: 'vec3',
            defaultValue: '#80bfff',
        }
    ],
    vertex: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragment: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    
    ${commonNoiseFunctions}
    
    float seaOctave(vec2 uv, float choppy) {
      uv += fbm(vec3(uv, u_time));
      vec2 wv = 1.0 - abs(sin(uv));
      vec2 swv = abs(cos(uv));    
      wv = mix(wv, swv, wv);
      return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
    }
    
    float seaMap(vec3 p) {
      float freq = u_seaFreq;
      float amp = u_seaHeight;
      float choppy = u_seaChoppy;
      vec2 uv = p.xz; 
      
      float d, h = 0.0;    
      for(int i = 0; i < 3; i++) {        
        d = seaOctave((uv + u_time * u_seaSpeed) * freq, choppy);
        d += seaOctave((uv - u_time * u_seaSpeed) * freq, choppy);
        h += d * amp;        
        uv *= 1.6; 
        freq *= 1.9; 
        amp *= 0.22;
        choppy = mix(choppy, 1.0, 0.2);
      }
      return p.y - h;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Calculate water height and normal
      float height = seaMap(vWorldPosition);
      vec2 eps = vec2(0.1, 0.0);
      vec3 normal = normalize(vec3(
        seaMap(vWorldPosition + eps.xyy) - seaMap(vWorldPosition - eps.xyy),
        2.0 * eps.x,
        seaMap(vWorldPosition + eps.yyx) - seaMap(vWorldPosition - eps.yyx)
      ));
      
      // Calculate fresnel and reflection
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      float fresnel = 1.0 - max(dot(-normal, viewDir), 0.0);
      fresnel = pow(fresnel, 3.0) * 0.65;
      
      vec3 waterColor = mix(u_seaBaseColor, u_seaWaterColor, fresnel);
      waterColor = mix(waterColor, u_reflectionColor, fresnel);
      
      gl_FragColor = vec4(waterColor, 0.9);
    }
  `
};
export const ShadersLibrary = [
    clouds,
    volumetric,
    cartoonClouds,
    stormClouds,
    cirrusClouds,
    nebulaClouds,
    painterlyClouds,
    basicWater
];
// Utility function to get shader by name
export const getShader = (name: string): CustomShaderSettings | {
        name: string;
        description: string;
        uniforms: ({
            name: string;
            description: string;
            type: string;
            defaultValue: number;
        } | {
            name: string;
            description: string;
            type: string;
            defaultValue: number[];
        } | {
            name: string;
            description: string;
            type: string;
            defaultValue: string;
        })[];
        vertex: string;
        fragment: string;
    } | undefined => {
    return ShadersLibrary.find(shader => shader.name === name);
};
// Get all available shader types
export const getAvailableShadersKeys = (): string[] => {
    return ShadersLibrary.map(shader => shader.name);
};
export const getAvailableShaders = (): (CustomShaderSettings | {
        name: string;
        description: string;
        uniforms: ({
            name: string;
            description: string;
            type: string;
            defaultValue: number;
        } | {
            name: string;
            description: string;
            type: string;
            defaultValue: number[];
        } | {
            name: string;
            description: string;
            type: string;
            defaultValue: string;
        })[];
        vertex: string;
        fragment: string;
    })[] => {
    return ShadersLibrary;
};
export const getOptionalProperties = (name: string): OptionalProperty[] => {
    const excluded = ['u_resolution', 'u_time', 'u_useOriginalImage', 'u_mouse'];
    const shader = ShadersLibrary.find(shader => shader.name === name);
    if (!shader)
        return [];
    const optionalProps = [];
    for (const uniform of shader.uniforms) {
        if (!excluded.includes(uniform.name)) {
            optionalProps.push({
                name: uniform.name.replace('u_', ''),
                description: uniform.description || '',
                type: getType(uniform.name, uniform.defaultValue)
            });
        }
    }
    return optionalProps;
};
