// =============================================================================
// noiseLib.ts — CPU port of noiseLib.glsl
// =============================================================================
//
// A faithful scalar transcription of the GLSL noise library, so a position
// effect evaluated on the CPU produces the same shape as the shader did. Keep
// the two in step: if a function changes in `noiseLib.glsl.ts`, change it here.
//
// Type dispatch matches `sampleNoise` exactly:
//   0=perlin 1=simplex 2=worley 3=value 4=white
//   5=fractal 6=ridged 7=turbulence 8=domainWarped
//

const fract = (x: number): number => x - Math.floor(x);
/** GLSL mod(), which differs from JS % for negative operands. */
const glslMod = (x: number, y: number): number => x - y * Math.floor(x / y);
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

const mod289 = (x: number): number => x - Math.floor(x * (1.0 / 289.0)) * 289.0;
const permute = (x: number): number => mod289(((x * 34.0) + 1.0) * x);

const hash21 = (x: number, y: number): number =>
    fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);

/** nl_hash22 — returns a 2-vector in roughly [-1, 1]. */
function hash22(x: number, y: number, out: [number, number]): [number, number] {
    const dx = x * 127.1 + y * 311.7;
    const dy = x * 269.5 + y * 183.3;
    out[0] = -1.0 + 2.0 * fract(Math.sin(dx) * 43758.5453123);
    out[1] = -1.0 + 2.0 * fract(Math.sin(dy) * 43758.5453123);
    return out;
}

const fade = (t: number): number => t * t * t * (t * (t * 6.0 - 15.0) + 10.0);

export function whiteNoise2D(x: number, y: number): number {
    return hash21(x, y);
}

export function valueNoise2D(x: number, y: number): number {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = fract(x), fy = fract(y);
    const a = hash21(ix, iy);
    const b = hash21(ix + 1.0, iy);
    const c = hash21(ix, iy + 1.0);
    const d = hash21(ix + 1.0, iy + 1.0);
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    return mix(a, b, ux) + (c - a) * uy * (1.0 - ux) + (d - b) * ux * uy;
}

export function perlinNoise2D(px: number, py: number): number {
    // Pi = floor(P.xyxy) + (0,0,1,1); Pf = fract(P.xyxy) - (0,0,1,1)
    let pi0 = Math.floor(px), pi1 = Math.floor(py);
    let pi2 = pi0 + 1.0, pi3 = pi1 + 1.0;
    const pf0 = fract(px), pf1 = fract(py);
    const pf2 = pf0 - 1.0, pf3 = pf1 - 1.0;
    pi0 = glslMod(pi0, 289.0); pi1 = glslMod(pi1, 289.0);
    pi2 = glslMod(pi2, 289.0); pi3 = glslMod(pi3, 289.0);
    // ix = Pi.xzxz, iy = Pi.yyww, fx = Pf.xzxz, fy = Pf.yyww
    const ix = [pi0, pi2, pi0, pi2];
    const iy = [pi1, pi1, pi3, pi3];
    const fx = [pf0, pf2, pf0, pf2];
    const fy = [pf1, pf1, pf3, pf3];
    const gxv: number[] = [0, 0, 0, 0];
    const gyv: number[] = [0, 0, 0, 0];
    for (let k = 0; k < 4; k++) {
        const i = permute(permute(ix[k]) + iy[k]);
        let gx = 2.0 * fract(i * 0.0243902439) - 1.0;
        const gy = Math.abs(gx) - 0.5;
        gx = gx - Math.floor(gx + 0.5);
        gxv[k] = gx;
        gyv[k] = gy;
    }
    // g00=(gx.x,gy.x) g10=(gx.y,gy.y) g01=(gx.z,gy.z) g11=(gx.w,gy.w)
    let g00x = gxv[0], g00y = gyv[0];
    let g10x = gxv[1], g10y = gyv[1];
    let g01x = gxv[2], g01y = gyv[2];
    let g11x = gxv[3], g11y = gyv[3];
    const N = 1.79284291400159, M = 0.85373472095314;
    const n00norm = N - M * (g00x * g00x + g00y * g00y);
    const n01norm = N - M * (g01x * g01x + g01y * g01y);
    const n10norm = N - M * (g10x * g10x + g10y * g10y);
    const n11norm = N - M * (g11x * g11x + g11y * g11y);
    g00x *= n00norm; g00y *= n00norm;
    g01x *= n01norm; g01y *= n01norm;
    g10x *= n10norm; g10y *= n10norm;
    g11x *= n11norm; g11y *= n11norm;
    const n00 = g00x * fx[0] + g00y * fy[0];
    const n10 = g10x * fx[1] + g10y * fy[1];
    const n01 = g01x * fx[2] + g01y * fy[2];
    const n11 = g11x * fx[3] + g11y * fy[3];
    const fadeX = fade(pf0), fadeY = fade(pf1);
    const nx0 = mix(n00, n10, fadeX);
    const nx1 = mix(n01, n11, fadeX);
    return 2.3 * mix(nx0, nx1, fadeY);
}

export function simplexNoise2D(vx: number, vy: number): number {
    const C0 = 0.211324865405187, C1 = 0.366025403784439;
    const C2 = -0.577350269189626, C3 = 0.024390243902439;
    const dotVC = vx * C1 + vy * C1;
    let ix = Math.floor(vx + dotVC);
    let iy = Math.floor(vy + dotVC);
    const dotIC = ix * C0 + iy * C0;
    const x0x = vx - ix + dotIC;
    const x0y = vy - iy + dotIC;
    const i1x = x0x > x0y ? 1.0 : 0.0;
    const i1y = x0x > x0y ? 0.0 : 1.0;
    // x12 = x0.xyxy + C.xxzz; x12.xy -= i1
    const x12x = x0x + C0 - i1x;
    const x12y = x0y + C0 - i1y;
    const x12z = x0x + C2;
    const x12w = x0y + C2;
    ix = mod289(ix); iy = mod289(iy);
    const p0 = permute(permute(iy + 0.0) + ix + 0.0);
    const p1 = permute(permute(iy + i1y) + ix + i1x);
    const p2 = permute(permute(iy + 1.0) + ix + 1.0);
    let m0 = Math.max(0.5 - (x0x * x0x + x0y * x0y), 0.0);
    let m1 = Math.max(0.5 - (x12x * x12x + x12y * x12y), 0.0);
    let m2 = Math.max(0.5 - (x12z * x12z + x12w * x12w), 0.0);
    m0 = m0 * m0; m0 = m0 * m0;
    m1 = m1 * m1; m1 = m1 * m1;
    m2 = m2 * m2; m2 = m2 * m2;
    const xa = 2.0 * fract(p0 * C3) - 1.0;
    const xb = 2.0 * fract(p1 * C3) - 1.0;
    const xc = 2.0 * fract(p2 * C3) - 1.0;
    const ha = Math.abs(xa) - 0.5, hb = Math.abs(xb) - 0.5, hc = Math.abs(xc) - 0.5;
    const a0a = xa - Math.floor(xa + 0.5);
    const a0b = xb - Math.floor(xb + 0.5);
    const a0c = xc - Math.floor(xc + 0.5);
    const N = 1.79284291400159, M = 0.85373472095314;
    m0 *= N - M * (a0a * a0a + ha * ha);
    m1 *= N - M * (a0b * a0b + hb * hb);
    m2 *= N - M * (a0c * a0c + hc * hc);
    const gx = a0a * x0x + ha * x0y;
    const gy = a0b * x12x + hb * x12y;
    const gz = a0c * x12z + hc * x12w;
    return 130.0 * (m0 * gx + m1 * gy + m2 * gz);
}

const worleyScratch: [number, number] = [0, 0];

export function worleyNoise2D(px: number, py: number): number {
    const ix = Math.floor(px), iy = Math.floor(py);
    const fx = fract(px), fy = fract(py);
    let minDist = 1.5;
    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const h = hash22(ix + x, iy + y, worleyScratch);
            const pointX = 0.5 + 0.5 * h[0];
            const pointY = 0.5 + 0.5 * h[1];
            const dx = x + pointX - fx;
            const dy = y + pointY - fy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < minDist)
                minDist = d;
        }
    }
    return minDist;
}

export function fractalNoise2D(px: number, py: number): number {
    let v = 0.0, amp = 0.5, qx = px, qy = py;
    for (let i = 0; i < 4; i++) {
        v += amp * perlinNoise2D(qx, qy);
        qx *= 2.0; qy *= 2.0; amp *= 0.5;
    }
    return v;
}

export function turbulenceNoise2D(px: number, py: number): number {
    let v = 0.0, amp = 0.5, qx = px, qy = py;
    for (let i = 0; i < 4; i++) {
        v += amp * Math.abs(perlinNoise2D(qx, qy));
        qx *= 2.0; qy *= 2.0; amp *= 0.5;
    }
    return v;
}

export function ridgedNoise2D(px: number, py: number): number {
    let v = 0.0, amp = 0.5, qx = px, qy = py;
    for (let i = 0; i < 4; i++) {
        const n = 1.0 - Math.abs(perlinNoise2D(qx, qy));
        v += amp * n * n;
        qx *= 2.0; qy *= 2.0; amp *= 0.5;
    }
    return v;
}

export function domainWarpedNoise2D(px: number, py: number): number {
    const wx = perlinNoise2D(px, py);
    const wy = perlinNoise2D(px + 5.2, py + 1.3);
    return perlinNoise2D(px + wx * 0.5, py + wy * 0.5);
}

/** Mirrors the GLSL `sampleNoise(float type, vec2 p)` dispatch, ranges included. */
export function sampleNoise(type: number, px: number, py: number): number {
    if (type < 0.5) return perlinNoise2D(px, py);
    if (type < 1.5) return simplexNoise2D(px, py);
    if (type < 2.5) return worleyNoise2D(px, py) * 2.0 - 1.0;
    if (type < 3.5) return valueNoise2D(px, py) * 2.0 - 1.0;
    if (type < 4.5) return whiteNoise2D(px, py) * 2.0 - 1.0;
    if (type < 5.5) return fractalNoise2D(px, py);
    if (type < 6.5) return ridgedNoise2D(px, py);
    if (type < 7.5) return turbulenceNoise2D(px, py);
    return domainWarpedNoise2D(px, py);
}
