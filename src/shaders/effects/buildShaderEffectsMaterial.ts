import { ShaderMaterial, Vector2, Color } from 'three';
import { buildUniformPrefix, structureKey } from './types';
import type { ShaderEffect, EffectShaderStage } from './types';
import { getDescriptor } from './registry/index';
import { baseVertexTemplate } from './baseVertex.glsl';
import { baseFragmentTemplate } from './baseFragment.glsl';
export interface BuildShaderEffectsMaterialOptions {
    effects: ShaderEffect[];
    initialColor?: string;
    initialOpacity?: number;
    initialPointSize?: number;
    initialParticleUVScale?: number;
    initialPointerEffectRadius?: number;
}

export interface ShaderEffectsMaterialMeta {
    __structureKey: string;
    __effectPrefixes: Map<string, string>;
}

function makeUniformValue(def, raw) {
    const value = raw === undefined ? def.default : raw;
    switch (def.glslType) {
        case 'float':
        case 'int':
            return typeof value === 'number' ? value : Number(value) || 0;
        case 'bool':
            return Boolean(value);
        case 'vec2': {
            const v = Array.isArray(value) ? value : [0, 0];
            return new Vector2(v[0] ?? 0, v[1] ?? 0);
        }
        case 'vec3': {
            if (def.control.kind === 'color') {
                if (typeof value === 'string')
                    return new Color(value);
                if (Array.isArray(value))
                    return new Color(value[0] ?? 1, value[1] ?? 1, value[2] ?? 1);
                return new Color(1, 1, 1);
            }
            const v = Array.isArray(value) ? value : [0, 0, 0];
            return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0];
        }
        case 'vec4': {
            const v = Array.isArray(value) ? value : [0, 0, 0, 0];
            return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0];
        }
        default:
            return value;
    }
}
function appendDescriptorUniformDecls(state, prefix, desc) {
    const lines = [];
    for (const [key, def] of Object.entries(desc.uniforms)) {
        lines.push(`uniform ${(def as any).glslType} ${prefix}${key};`);
    }
    const block = lines.join('\n') + '\n';
    if (desc.stage === 'vertex')
        state.vertexUniformDecls += block;
    else
        state.fragmentUniformDecls += block;
}
function appendDescriptorHelpers(state, desc) {
    if (!desc.helpers)
        return;
    if (desc.stage === 'vertex') {
        if (state.helperIdsVertex.has(desc.id))
            return;
        state.helperIdsVertex.add(desc.id);
        state.vertexHelpers += desc.helpers + '\n';
    }
    else {
        if (state.helperIdsFragment.has(desc.id))
            return;
        state.helperIdsFragment.add(desc.id);
        state.fragmentHelpers += desc.helpers + '\n';
    }
}
function appendDescriptorBody(state, prefix, desc, scope) {
    const body = desc.stage === 'vertex' ? desc.vertexBody : desc.fragmentBody;
    if (!body)
        return;
    const replaced = body.replace(/\{\{prefix\}\}/g, prefix);
    // Inject effectScopeFactor at the top of each body so descriptors can multiply
    // by it without knowing their scope. global → 1.0, pointer → vPointerFalloff.
    // Pointer scope is also gated by the falloff > 0 check (early-out).
    // (Single-underscore prefixes are reserved in GLSL; double-underscore is
    // reserved by spec — must avoid both.)
    const scopeFactorDecl = scope === 'pointer'
        ? 'float effectScopeFactor = vPointerFalloff;'
        : 'float effectScopeFactor = 1.0;';
    const withScope = `{ ${scopeFactorDecl}\n${replaced}\n}`;
    const wrapped = scope === 'pointer' ? `if (vPointerFalloff > 0.0) ${withScope}` : withScope;
    if (desc.stage === 'vertex')
        state.vertexBody += wrapped + '\n';
    else
        state.fragmentBody += wrapped + '\n';
}
function processEffect(state, eff) {
    if (!eff.enabled)
        return;
    const desc = getDescriptor(eff.type);
    if (!desc) {
        console.warn(`[effects] unknown effect type "${eff.type}"; skipping`);
        return;
    }
    const prefix = buildUniformPrefix(eff.instanceId);
    for (const [key, def] of Object.entries(desc.uniforms)) {
        state.uniforms[`${prefix}${key}`] = { value: makeUniformValue(def, eff.values[key]) };
    }
    appendDescriptorUniformDecls(state, prefix, desc);
    appendDescriptorHelpers(state, desc);
    appendDescriptorBody(state, prefix, desc, eff.scope);
}
export function buildShaderEffectsMaterial(options: BuildShaderEffectsMaterialOptions): ShaderMaterial & ShaderEffectsMaterialMeta {
    const { effects } = options;
    const state = {
        uniforms: {
            u_time: { value: 0 },
            u_pointer: { value: new Vector2() },
            uPointerEffectRadius: { value: options.initialPointerEffectRadius ?? 0.4 },
            uPointSize: { value: options.initialPointSize ?? 5.0 },
            uMorphProgress: { value: 0 },
            uTextureMorph: { value: 0 },
            uNormalizationScale: { value: 1.0 },
            uTexture: { value: null },
            uTargetTexture: { value: null },
            uHasTexture: { value: false },
            uColor: { value: new Color(options.initialColor ?? '#ffffff') },
            uOpacity: { value: options.initialOpacity ?? 1.0 },
            uParticleUVScale: { value: options.initialParticleUVScale ?? 0.01 },
        },
        vertexUniformDecls: '',
        fragmentUniformDecls: '',
        vertexHelpers: '',
        fragmentHelpers: '',
        vertexBody: '',
        fragmentBody: '',
        helperIdsVertex: new Set(),
        helperIdsFragment: new Set(),
    };
    const prefixes = new Map();
    for (const eff of effects) {
        if (!eff.enabled)
            continue;
        prefixes.set(eff.instanceId, buildUniformPrefix(eff.instanceId));
        processEffect(state, eff);
    }
    const vertexShader = baseVertexTemplate
        .replace('// __EFFECT_HELPERS__', state.vertexHelpers || '// (no helpers)')
        .replace('// __EFFECT_UNIFORMS__', state.vertexUniformDecls || '// (no effect uniforms)')
        .replace('// __EFFECT_VERTEX_BODY__', state.vertexBody || '// (no vertex effects)');
    const fragmentShader = baseFragmentTemplate
        .replace('// __EFFECT_HELPERS__', state.fragmentHelpers || '// (no helpers)')
        .replace('// __EFFECT_UNIFORMS__', state.fragmentUniformDecls || '// (no effect uniforms)')
        .replace('// __EFFECT_FRAGMENT_BODY__', state.fragmentBody || '// (no fragment effects)');
    const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: state.uniforms,
        transparent: true,
        depthTest: true,
        depthWrite: false,
    });
    (material as any).__structureKey = structureKey(effects);
    (material as any).__effectPrefixes = prefixes;
    return (material as any);
}
export function getEffectStage(effectType: string): EffectShaderStage | undefined {
    return getDescriptor(effectType)?.stage;
}
