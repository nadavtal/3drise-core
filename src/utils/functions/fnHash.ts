// =============================================================================
// fnHash — THE hash of the functions library, identical on the CPU and the GPU
// =============================================================================
//
// One integer lattice hash (the one the curving API's noise has always used): 32-bit multiplies
// with wrap-around, two xor-shifts. On the CPU it is Math.imul on int32; in GLSL it is `uint`
// arithmetic (WebGL2 — three 0.170 needs it anyway), which wraps the same way, so the lattice
// values are bit-identical on both sides and the noise built on them matches to fp32 rounding.
//
// NEVER use a sin-based hash (fract(sin(dot(p, …)) * 43758.5)) in the library: it differs per
// GPU and can never match the CPU.
//
// Changing this hash changes every function's output — it never changes.
//

/** A 0..1 value for an integer lattice point and a seed. */
export function fnHash2(x: number, y: number, seed: number): number {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

/** A 0..1 value for one number (not lattice-aligned; used to turn / size a pattern by its seed). */
export function fnHash1(n: number): number {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
}

export const fnSmooth = (t: number) => t * t * (3 - 2 * t);
export const fnFade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** The same, in GLSL (ES 3.00). `fn_hash1` is the seed-only helper; its sin is fine (not per fragment lattice). */
export const FN_HASH_GLSL = /*glsl*/ `
float fn_hash2(float x, float y, float seed) {
    uint h = uint(int(x)) * 374761393u + uint(int(y)) * 668265263u + uint(int(seed)) * 1442695041u;
    h = (h ^ (h >> 13u)) * 1274126177u;
    h ^= h >> 16u;
    return float(h) / 4294967296.0;
}
float fn_hash1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453123); }
float fn_smooth(float t) { return t * t * (3.0 - 2.0 * t); }
float fn_fade(float t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
`;
