import type { Color, Vector2 } from "three";
export type EffectShaderStage = 'vertex' | 'fragment';

export type EffectScope = 'global' | 'pointer';

export type EffectGlslType = 'float' | 'int' | 'bool' | 'vec2' | 'vec3' | 'vec4';

export type EffectControl = {
    kind: 'slider';
    label: string;
    min: number;
    max: number;
    step?: number;
} | {
    kind: 'select';
    label: string;
    options: {
        value: number;
        label: string;
    }[];
} | {
    kind: 'color';
    label: string;
} | {
    kind: 'toggle';
    label: string;
} | {
    kind: 'hidden';
};

export type EffectUniformDefault = number | boolean | string | [number, number] | [number, number, number] | [number, number, number, number];

export interface EffectUniformDef {
    glslType: EffectGlslType;
    default: EffectUniformDefault;
    control: EffectControl;
}

export interface EffectDescriptor {
    id: string;
    label: string;
    stage: EffectShaderStage;
    allowedScopes: readonly EffectScope[];
    uniforms: Record<string, EffectUniformDef>;
    helpers?: string;
    vertexBody?: string;
    fragmentBody?: string;
}

export type EffectValue = number | boolean | string | [number, number] | [number, number, number] | [number, number, number, number];

export interface ShaderEffect {
    type: string;
    instanceId: string;
    scope: EffectScope;
    enabled: boolean;
    values: Record<string, EffectValue>;
}

export type ShaderEffectsConfig = ShaderEffect[];

export type UniformValue = number | boolean | Color | Vector2 | [number, number] | [number, number, number];


export function buildUniformPrefix(instanceId: string): string {
    return `u_${instanceId.replace(/-/g, '_')}_`;
}
export function buildUniformName(instanceId: string, key: string): string {
    return `${buildUniformPrefix(instanceId)}${key}`;
}
export function structureKey(effects: ShaderEffect[]): string {
    return effects
        .map((e) => `${e.type}:${e.scope}:${e.enabled ? 1 : 0}:${e.instanceId}`)
        .join('|');
}
