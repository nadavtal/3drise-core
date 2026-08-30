// =============================================================================
// vertexEffectsCpu — position effects, evaluated on the CPU
// =============================================================================
//
// Why this exists: the GLSL versions of these effects only run inside
// `buildShaderEffectsMaterial`'s standalone shell, and that shell *replaces*
// whatever material the object was given. Evaluating position effects here
// instead means they displace the geometry and leave `.material` alone, so they
// compose with any material — the registry's, a custom ShaderMaterial, anything.
//
// Colour effects cannot move: there is no per-pixel hook on the CPU. They stay
// in the shell until they are injected into the chosen material (onBeforeCompile).
//
// Each implementation is a transcription of the matching `vertexBody` in
// `registry/*.ts`. Keep them in step. The GLSL bodies remain the reference for
// anything still rendered through the shell.
//
// Deliberately allocation-free in the hot loop: positions are read from a base
// array and written to an output array, no vectors constructed per point.
//
import { getDescriptor } from './registry/index';
import { sampleNoise } from './noiseLib';
import type { ShaderEffect } from './types';

/**
 * The shader approximated a local-space pointer as `u_pointer * 5.0` — a legacy
 * constant, but the one the effects were tuned against. The CPU path reuses it
 * so pointer-scoped effects keep the reach they had.
 */
export const LOCAL_POINTER_SCALE = 5.0;

export interface VertexEffectContext {
    /** Seconds, matching the shader's `u_time`. */
    time: number;
    /**
     * Pointer position in the same space as the positions being displaced.
     * The shader computed pointer falloff in screen NDC per vertex; doing that
     * on the CPU would mean projecting every point every frame, so this uses
     * object-local distance instead. Pointer-scoped effects therefore have a
     * slightly different falloff shape than they did in the shader.
     */
    pointerX: number;
    pointerY: number;
    /** Falloff radius for `pointer`-scoped effects, in local units. */
    pointerRadius: number;
}

/** Working position, reused across points so the loop allocates nothing. */
interface Pos {
    x: number;
    y: number;
    z: number;
}

type VertexEffectImpl = (
    p: Pos,
    values: Record<string, number>,
    time: number,
    scope: number,
    baseX: number,
    baseY: number,
    baseZ: number,
) => void;

const smoothstep = (edge0: number, edge1: number, x: number): number => {
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
    return t * t * (3 - 2 * t);
};
const fract = (x: number): number => x - Math.floor(x);

// ─── Implementations ─────────────────────────────────────────────────────────

const wave: VertexEffectImpl = (p, v, t, s) => {
    const input = v.direction < 0.5 ? p.x : v.direction < 1.5 ? p.y : p.x + p.y;
    p.z += Math.sin(input * v.frequency + t * v.speed) * v.intensity * s;
};

const ripple: VertexEffectImpl = (p, v, t, s) => {
    const dx = p.x - v.centerX;
    const dy = p.y - v.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    p.z += Math.sin(dist * v.frequency - t * v.speed) * v.intensity * s;
};

const vortex: VertexEffectImpl = (p, v, t, s) => {
    const toX = p.x - v.centerX;
    const toY = p.y - v.centerY;
    const angle = v.intensity * t * v.speed * s;
    const c = Math.cos(angle), sn = Math.sin(angle);
    p.x = v.centerX + (c * toX - sn * toY);
    p.y = v.centerY + (sn * toX + c * toY);
};

const spiral: VertexEffectImpl = (p, v, t, s) => {
    const toX = p.x - v.centerX;
    const toY = p.y - v.centerY;
    let r = Math.sqrt(toX * toX + toY * toY);
    let a = Math.atan2(toY, toX);
    a += t * v.speed * v.intensity * s;
    r = Math.max(0, r + t * v.radialSpeed * s);
    p.x = v.centerX + r * Math.cos(a);
    p.y = v.centerY + r * Math.sin(a);
};

const twist: VertexEffectImpl = (p, v, t, s) => {
    const coord = v.axis < 0.5 ? p.x : v.axis < 1.5 ? p.y : p.z;
    const angle = (coord * v.intensity + t * v.speed) * s;
    const sn = Math.sin(angle), c = Math.cos(angle);
    if (v.axis < 0.5) {
        const y = c * p.y - sn * p.z;
        const z = sn * p.y + c * p.z;
        p.y = y; p.z = z;
    } else if (v.axis < 1.5) {
        const x = c * p.x + sn * p.z;
        const z = -sn * p.x + c * p.z;
        p.x = x; p.z = z;
    } else {
        const x = c * p.x - sn * p.y;
        const y = sn * p.x + c * p.y;
        p.x = x; p.y = y;
    }
};

const explode: VertexEffectImpl = (p, v, t, s) => {
    const fx = p.x - v.centerX;
    const fy = p.y - v.centerY;
    const fz = p.z - v.centerZ;
    const dist = Math.sqrt(fx * fx + fy * fy + fz * fz);
    let dx = 0, dy = 1, dz = 0;
    if (dist > 0.0001) {
        dx = fx / dist; dy = fy / dist; dz = fz / dist;
    }
    const wave01 = Math.sin(t * v.speed) * 0.5 + 0.5;
    const push = v.intensity * wave01 * s;
    p.x += dx * push; p.y += dy * push; p.z += dz * push;
};

const magnet: VertexEffectImpl = (p, v, t, s) => {
    const toX = v.centerX - p.x;
    const toY = v.centerY - p.y;
    const toZ = v.centerZ - p.z;
    const dist = Math.max(Math.sqrt(toX * toX + toY * toY + toZ * toZ), 0.001);
    const strength = Math.min(v.intensity * s / Math.pow(dist, v.falloffPower), dist);
    p.x += (toX / dist) * strength;
    p.y += (toY / dist) * strength;
    p.z += (toZ / dist) * strength;
};

const jitter: VertexEffectImpl = (p, v, t, s, bx, by, bz) => {
    // Seeded from the untouched base position, exactly as the shader seeds from
    // the `position` attribute, so each point keeps its own stable direction.
    const step = Math.floor(t * v.speed) * 0.137;
    const sx = bx + step, sy = by + step, sz = bz + step;
    const ox = fract(Math.sin(sx * 12.9898 + sy * 78.233 + sz * 37.719) * 43758.5453) - 0.5;
    const oy = fract(Math.sin(sx * 93.9898 + sy * 47.233 + sz * 12.719) * 43758.5453) - 0.5;
    const oz = fract(Math.sin(sx * 54.9898 + sy * 31.233 + sz * 89.719) * 43758.5453) - 0.5;
    const k = v.intensity * 2.0 * s;
    p.x += ox * k; p.y += oy * k; p.z += oz * k;
};

const noise: VertexEffectImpl = (p, v, t, s) => {
    const nx = p.x * v.frequency + t * v.speed;
    const ny = p.y * v.frequency + t * v.speed;
    const k = v.intensity * s;
    if (v.axis < 2.5) {
        const push = sampleNoise(v.noiseType, nx, ny) * k;
        if (v.axis < 0.5) p.x += push;
        else if (v.axis < 1.5) p.y += push;
        else p.z += push;
        return;
    }
    p.x += sampleNoise(v.noiseType, nx, ny) * k;
    p.y += sampleNoise(v.noiseType, nx + 31.7, ny + 5.2) * k;
    p.z += sampleNoise(v.noiseType, nx + 11.3, ny + 27.1) * k;
};

const displacement: VertexEffectImpl = (p, v, t, s, _bx, _by, _bz) => {
    // Pushed away from the pointer. `ctx` supplies the pointer in local space;
    // it is folded into `values` by applyVertexEffects before the loop.
    const dx = p.x - v.__pointerX;
    const dy = p.y - v.__pointerY;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-6)
        return;
    const k = v.intensity * s * 2.0;
    p.x += (dx / len) * k;
    p.y += (dy / len) * k;
};

/**
 * Position effects that run on the CPU. Anything vertex-stage but absent here
 * still needs the shader shell — `scale` writes gl_PointSize, which has no
 * per-point CPU equivalent.
 */
export const CPU_VERTEX_EFFECTS: Record<string, VertexEffectImpl> = {
    wave, ripple, vortex, spiral, twist, explode, magnet, jitter, noise, displacement,
};

/** True when this effect type displaces positions on the CPU. */
export function hasCpuVertexEffect(type: string): boolean {
    return Object.prototype.hasOwnProperty.call(CPU_VERTEX_EFFECTS, type);
}

/** Split a mixed list into the CPU-displaced ones and everything else. */
export function partitionShaderEffects(effects: ShaderEffect[] | null | undefined): {
    position: ShaderEffect[];
    shell: ShaderEffect[];
} {
    const position: ShaderEffect[] = [];
    const shell: ShaderEffect[] = [];
    for (const effect of effects ?? []) {
        (hasCpuVertexEffect(effect.type) ? position : shell).push(effect);
    }
    return { position, shell };
}

/** Resolve an effect's values against its descriptor defaults, once per frame. */
function resolveValues(effect: ShaderEffect, ctx: VertexEffectContext): Record<string, number> | null {
    const descriptor = getDescriptor(effect.type);
    if (!descriptor)
        return null;
    const values: Record<string, number> = {};
    for (const [key, def] of Object.entries(descriptor.uniforms)) {
        const raw = effect.values?.[key];
        const value = raw === undefined ? def.default : raw;
        values[key] = typeof value === 'number' ? value : Number(value) || 0;
    }
    values.__pointerX = ctx.pointerX;
    values.__pointerY = ctx.pointerY;
    return values;
}

const scratch: Pos = { x: 0, y: 0, z: 0 };

/**
 * Displace `base` into `out` by every enabled position effect.
 *
 * `base` is never modified, so effects always compose from the authored
 * positions rather than accumulating frame over frame. Returns false when
 * nothing was applied, so the caller can skip the attribute upload.
 */
export function applyVertexEffects(
    base: Float32Array,
    out: Float32Array,
    effects: ShaderEffect[] | null | undefined,
    ctx: VertexEffectContext,
): boolean {
    const active = (effects ?? []).filter(e => e?.enabled && hasCpuVertexEffect(e.type));
    if (active.length === 0)
        return false;
    const resolved: { impl: VertexEffectImpl; values: Record<string, number>; pointerScoped: boolean }[] = [];
    for (const effect of active) {
        const values = resolveValues(effect, ctx);
        if (!values)
            continue;
        resolved.push({
            impl: CPU_VERTEX_EFFECTS[effect.type],
            values,
            pointerScoped: effect.scope === 'pointer',
        });
    }
    if (resolved.length === 0)
        return false;
    const radius = ctx.pointerRadius > 0 ? ctx.pointerRadius : 1;
    const count = Math.min(base.length, out.length);
    for (let i = 0; i < count; i += 3) {
        const bx = base[i], by = base[i + 1], bz = base[i + 2];
        scratch.x = bx; scratch.y = by; scratch.z = bz;
        // Falloff is measured from the untouched position so that one effect
        // moving a point cannot change how strongly the next one grips it.
        const dx = bx - ctx.pointerX;
        const dy = by - ctx.pointerY;
        const pointerFalloff = smoothstep(radius, 0, Math.sqrt(dx * dx + dy * dy));
        for (const { impl, values, pointerScoped } of resolved) {
            const scope = pointerScoped ? pointerFalloff : 1;
            if (scope <= 0)
                continue;
            impl(scratch, values, ctx.time, scope, bx, by, bz);
        }
        out[i] = scratch.x;
        out[i + 1] = scratch.y;
        out[i + 2] = scratch.z;
    }
    return true;
}
