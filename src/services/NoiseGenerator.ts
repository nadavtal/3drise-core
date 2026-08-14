import * as THREE from 'three';
export type NoiseType = 'perlin' | 'simplex' | 'worley' | 'voronoi' | 'fractal' | 'ridged' | 'billowy' | 'white' | 'blue' | 'pink' | 'value' | 'turbulence' | 'domain-warped';

export interface NoiseConfig {
    type: NoiseType;
    octaves?: number;
    frequency?: number;
    amplitude?: number;
    lacunarity?: number;
    persistence?: number;
    seed?: number;
    scale?: number;
    offset?: THREE.Vector2;
    cellSize?: number;
    ridgeOffset?: number;
    warpStrength?: number;
}

export interface GeneratedNoise {
    glslCode: string;
    uniforms: Record<string, {
        value: any;
        type?: string;
    }>;
    dependencies: string[];
}

export class NoiseGenerator {
    private static permutationTable = [
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
        140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
        247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
        57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
        74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
        60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
        65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
        200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
        52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
        207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
        119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
        218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
        81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
        184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
        222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];
    /**
     * Generate noise function based on configuration
     */
    static generateNoise(config: NoiseConfig): GeneratedNoise {
        const defaultConfig = {
            ...{
                type: 'perlin',
                octaves: 4,
                frequency: 1.0,
                amplitude: 1.0,
                lacunarity: 2.0,
                persistence: 0.5,
                seed: 0,
                scale: 1.0,
                offset: new THREE.Vector2(0, 0),
                cellSize: 1.0,
                ridgeOffset: 1.0,
                warpStrength: 0.1,
            },
            ...config
        };
        switch (defaultConfig.type) {
            case 'perlin':
                return this.generatePerlinNoise(defaultConfig);
            case 'simplex':
                return this.generateSimplexNoise(defaultConfig);
            case 'worley':
            case 'voronoi':
                return this.generateWorleyNoise(defaultConfig);
            case 'fractal':
                return this.generateFractalNoise(defaultConfig);
            case 'ridged':
                return this.generateRidgedNoise(defaultConfig);
            case 'billowy':
                return this.generateBillowyNoise(defaultConfig);
            case 'white':
                return this.generateWhiteNoise(defaultConfig);
            case 'blue':
                return this.generateBlueNoise(defaultConfig);
            case 'pink':
                return this.generatePinkNoise(defaultConfig);
            case 'value':
                return this.generateValueNoise(defaultConfig);
            case 'turbulence':
                return this.generateTurbulenceNoise(defaultConfig);
            case 'domain-warped':
                return this.generateDomainWarpedNoise(defaultConfig);
            default:
                return this.generatePerlinNoise(defaultConfig);
        }
    }
    /**
     * Generate Perlin noise GLSL code
     */
    private static generatePerlinNoise(config) {
        const glslCode = `
// Perlin Noise Functions
vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float perlinNoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
}

vec3 fade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float getPerlinNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseFrequency * u_noiseScale;
    return perlinNoise(pos) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                u_noiseFrequency: { value: config.frequency },
                u_noiseAmplitude: { value: config.amplitude },
                u_noiseScale: { value: config.scale },
                u_noiseOffset: { value: [config.offset.x, config.offset.y] }
            },
            dependencies: ['fade']
        };
    }
    /**
     * Generate Simplex noise GLSL code
     */
    private static generateSimplexNoise(config) {
        const glslCode = `
// Simplex Noise Functions
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float simplexNoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
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
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

float getSimplexNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseFrequency * u_noiseScale;
    return simplexNoise(pos) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                u_noiseFrequency: { value: config.frequency },
                u_noiseAmplitude: { value: config.amplitude },
                u_noiseScale: { value: config.scale },
                u_noiseOffset: { value: [config.offset.x, config.offset.y] }
            },
            dependencies: []
        };
    }
    /**
     * Generate Worley/Voronoi noise GLSL code
     */
    private static generateWorleyNoise(config) {
        const glslCode = `
// Worley/Voronoi Noise Functions
vec2 random2(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

float worleyNoise(vec2 st) {
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);
    
    float min_dist = 1.0;
    
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i_st + neighbor);
            point = 0.5 + 0.5 * sin(u_time + 6.2831 * point);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            min_dist = min(min_dist, dist);
        }
    }
    
    return min_dist;
}

float getWorleyNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseFrequency * u_noiseScale * u_cellSize;
    return worleyNoise(pos) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                u_noiseFrequency: { value: config.frequency },
                u_noiseAmplitude: { value: config.amplitude },
                u_noiseScale: { value: config.scale },
                u_noiseOffset: { value: [config.offset.x, config.offset.y] },
                u_cellSize: { value: config.cellSize },
                u_time: { value: 0 }
            },
            dependencies: []
        };
    }
    /**
     * Generate Fractal noise GLSL code
     */
    private static generateFractalNoise(config) {
        const baseNoise = this.generatePerlinNoise(config);
        const glslCode = baseNoise.glslCode + `
float getFractalNoise(vec2 uv) {
    float value = 0.0;
    float amplitude = u_noiseAmplitude;
    float frequency = u_noiseFrequency;
    
    for (int i = 0; i < ${config.octaves}; i++) {
        vec2 pos = (uv + u_noiseOffset) * frequency * u_noiseScale;
        value += perlinNoise(pos) * amplitude;
        frequency *= u_lacunarity;
        amplitude *= u_persistence;
    }
    
    return value;
}
`;
        return {
            glslCode,
            uniforms: {
                ...baseNoise.uniforms,
                u_lacunarity: { value: config.lacunarity },
                u_persistence: { value: config.persistence }
            },
            dependencies: baseNoise.dependencies
        };
    }
    /**
     * Generate Ridged noise GLSL code
     */
    private static generateRidgedNoise(config) {
        const baseNoise = this.generatePerlinNoise(config);
        const glslCode = baseNoise.glslCode + `
float getRidgedNoise(vec2 uv) {
    float value = 0.0;
    float amplitude = u_noiseAmplitude;
    float frequency = u_noiseFrequency;
    
    for (int i = 0; i < ${config.octaves}; i++) {
        vec2 pos = (uv + u_noiseOffset) * frequency * u_noiseScale;
        float noise = perlinNoise(pos);
        noise = abs(noise);
        noise = u_ridgeOffset - noise;
        noise = noise * noise;
        value += noise * amplitude;
        frequency *= u_lacunarity;
        amplitude *= u_persistence;
    }
    
    return value;
}
`;
        return {
            glslCode,
            uniforms: {
                ...baseNoise.uniforms,
                u_lacunarity: { value: config.lacunarity },
                u_persistence: { value: config.persistence },
                u_ridgeOffset: { value: config.ridgeOffset }
            },
            dependencies: baseNoise.dependencies
        };
    }
    /**
     * Generate Billowy noise GLSL code
     */
    private static generateBillowyNoise(config) {
        const baseNoise = this.generatePerlinNoise(config);
        const glslCode = baseNoise.glslCode + `
float getBillowyNoise(vec2 uv) {
    float value = 0.0;
    float amplitude = u_noiseAmplitude;
    float frequency = u_noiseFrequency;
    
    for (int i = 0; i < ${config.octaves}; i++) {
        vec2 pos = (uv + u_noiseOffset) * frequency * u_noiseScale;
        float noise = perlinNoise(pos);
        noise = abs(noise);
        value += noise * amplitude;
        frequency *= u_lacunarity;
        amplitude *= u_persistence;
    }
    
    return value;
}
`;
        return {
            glslCode,
            uniforms: {
                ...baseNoise.uniforms,
                u_lacunarity: { value: config.lacunarity },
                u_persistence: { value: config.persistence }
            },
            dependencies: baseNoise.dependencies
        };
    }
    /**
     * Generate White noise GLSL code
     */
    private static generateWhiteNoise(config) {
        const glslCode = `
// White Noise Functions
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float getWhiteNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseFrequency * u_noiseScale;
    return random(pos) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                u_noiseFrequency: { value: config.frequency },
                u_noiseAmplitude: { value: config.amplitude },
                u_noiseScale: { value: config.scale },
                u_noiseOffset: { value: [config.offset.x, config.offset.y] }
            },
            dependencies: []
        };
    }
    /**
     * Generate Blue noise GLSL code
     */
    private static generateBlueNoise(config) {
        const glslCode = `
// Blue Noise Functions (approximation using dithering pattern)
float blueNoise(vec2 uv) {
    vec2 pos = floor(uv * 64.0);
    float noise = fract(sin(dot(pos, vec2(12.9898, 78.233))) * 43758.5453);
    
    // Apply blue noise characteristics (high-frequency bias)
    noise = pow(noise, 0.5);
    return noise;
}

float getBlueNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseFrequency * u_noiseScale;
    return blueNoise(pos) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                u_noiseFrequency: { value: config.frequency },
                u_noiseAmplitude: { value: config.amplitude },
                u_noiseScale: { value: config.scale },
                u_noiseOffset: { value: [config.offset.x, config.offset.y] }
            },
            dependencies: []
        };
    }
    /**
     * Generate Pink noise GLSL code
     */
    private static generatePinkNoise(config) {
        const glslCode = `
// Pink Noise Functions (1/f noise approximation)
float pinkNoise(vec2 uv) {
    float noise = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    
    // Combine multiple frequencies with decreasing amplitude
    for (int i = 0; i < 6; i++) {
        noise += sin(uv.x * frequency) * sin(uv.y * frequency) * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    return noise * 0.5 + 0.5;
}

float getPinkNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseFrequency * u_noiseScale;
    return pinkNoise(pos) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                u_noiseFrequency: { value: config.frequency },
                u_noiseAmplitude: { value: config.amplitude },
                u_noiseScale: { value: config.scale },
                u_noiseOffset: { value: [config.offset.x, config.offset.y] }
            },
            dependencies: []
        };
    }
    /**
     * Generate Value noise GLSL code
     */
    private static generateValueNoise(config) {
        const glslCode = `
// Value Noise Functions
float valueNoise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float getValueNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseFrequency * u_noiseScale;
    return valueNoise(pos) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                u_noiseFrequency: { value: config.frequency },
                u_noiseAmplitude: { value: config.amplitude },
                u_noiseScale: { value: config.scale },
                u_noiseOffset: { value: [config.offset.x, config.offset.y] }
            },
            dependencies: []
        };
    }
    /**
     * Generate Turbulence noise GLSL code
     */
    private static generateTurbulenceNoise(config) {
        const baseNoise = this.generatePerlinNoise(config);
        const glslCode = baseNoise.glslCode + `
float getTurbulenceNoise(vec2 uv) {
    float value = 0.0;
    float amplitude = u_noiseAmplitude;
    float frequency = u_noiseFrequency;
    
    for (int i = 0; i < ${config.octaves}; i++) {
        vec2 pos = (uv + u_noiseOffset) * frequency * u_noiseScale;
        value += abs(perlinNoise(pos)) * amplitude;
        frequency *= u_lacunarity;
        amplitude *= u_persistence;
    }
    
    return value;
}
`;
        return {
            glslCode,
            uniforms: {
                ...baseNoise.uniforms,
                u_lacunarity: { value: config.lacunarity },
                u_persistence: { value: config.persistence }
            },
            dependencies: baseNoise.dependencies
        };
    }
    /**
     * Generate Domain Warped noise GLSL code
     */
    private static generateDomainWarpedNoise(config) {
        const baseNoise = this.generatePerlinNoise(config);
        const glslCode = baseNoise.glslCode + `
float getDomainWarpedNoise(vec2 uv) {
    vec2 pos = (uv + u_noiseOffset) * u_noiseScale;
    
    // Create domain warp
    vec2 warp = vec2(
        perlinNoise(pos),
        perlinNoise(pos + vec2(5.2, 1.3))
    ) * u_warpStrength;
    
    // Apply warped coordinates to final noise
    vec2 warpedPos = pos + warp;
    return perlinNoise(warpedPos * u_noiseFrequency) * u_noiseAmplitude;
}
`;
        return {
            glslCode,
            uniforms: {
                ...baseNoise.uniforms,
                u_warpStrength: { value: config.warpStrength }
            },
            dependencies: baseNoise.dependencies
        };
    }
    static getAvailableNoises(): NoiseType[] {
        return [
            'perlin',
            'simplex',
            'white',
            'fractal',
            'turbulence',
            'domain-warped',
            'ridged',
            'billowy',
            'worley',
            'voronoi',
            'blue',
            'pink',
            'value'
        ];
    }
    /**
     * Create a noise texture for sampling
     */
    static createNoiseTexture(width: number = 256, height: number = 256, type: NoiseType = 'perlin', config?: Partial<NoiseConfig>): THREE.DataTexture {
        const size = width * height;
        const data = new Uint8Array(4 * size);
        const noiseConfig = {
            type,
            octaves: 4,
            frequency: 0.1,
            amplitude: 1.0,
            lacunarity: 2.0,
            persistence: 0.5,
            seed: 0,
            scale: 1.0,
            offset: new THREE.Vector2(0, 0),
            cellSize: 1.0,
            ridgeOffset: 1.0,
            warpStrength: 0.1,
            ...config
        };
        for (let i = 0; i < size; i++) {
            const x = (i % width) / width;
            const y = Math.floor(i / width) / height;
            let noise = 0;
            // Simple implementation for texture generation
            switch (type) {
                case 'perlin':
                case 'simplex':
                    noise = this.simplePerlin(x * noiseConfig.frequency, y * noiseConfig.frequency);
                    break;
                case 'white':
                    noise = Math.random();
                    break;
                case 'fractal':
                    noise = this.fractalNoise(x, y, noiseConfig);
                    break;
                default:
                    noise = this.simplePerlin(x * noiseConfig.frequency, y * noiseConfig.frequency);
            }
            // Normalize to 0-255 range
            const value = Math.floor((noise * 0.5 + 0.5) * 255);
            const stride = i * 4;
            data[stride] = value; // R
            data[stride + 1] = value; // G
            data[stride + 2] = value; // B
            data[stride + 3] = 255; // A
        }
        const texture = new THREE.DataTexture(data, width, height);
        texture.needsUpdate = true;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        return texture;
    }
    /**
     * Simple Perlin noise implementation for texture generation
     */
    private static simplePerlin(x, y) {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = this.fade(xf);
        const v = this.fade(yf);
        const aa = this.permutationTable[this.permutationTable[xi] + yi];
        const ab = this.permutationTable[this.permutationTable[xi] + yi + 1];
        const ba = this.permutationTable[this.permutationTable[xi + 1] + yi];
        const bb = this.permutationTable[this.permutationTable[xi + 1] + yi + 1];
        const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
        const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
        return this.lerp(x1, x2, v);
    }
    private static fractalNoise(x, y, config) {
        let value = 0;
        let amplitude = config.amplitude;
        let frequency = config.frequency;
        for (let i = 0; i < config.octaves; i++) {
            value += this.simplePerlin(x * frequency, y * frequency) * amplitude;
            frequency *= config.lacunarity;
            amplitude *= config.persistence;
        }
        return value;
    }
    private static fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    private static lerp(a, b, t) {
        return a + t * (b - a);
    }
    private static grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}
