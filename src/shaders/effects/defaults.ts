import { getDescriptor } from './registry/index';
import type { ShaderEffect, EffectScope } from "./types";

function defaultValueFor(def) {
    return def.default;
}
export function generateInstanceId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
export function createDefaultShaderEffect(type: string, scope?: EffectScope): ShaderEffect | undefined {
    const desc = getDescriptor(type);
    if (!desc)
        return undefined;
    const resolvedScope = scope ?? desc.allowedScopes[0];
    const values = {};
    for (const [key, def] of Object.entries(desc.uniforms)) {
        values[key] = defaultValueFor(def);
    }
    return {
        type: desc.id,
        instanceId: generateInstanceId(),
        scope: resolvedScope,
        enabled: true,
        values,
    };
}
