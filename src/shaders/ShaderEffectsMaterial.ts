// Compatibility shim. The monolithic ShaderEffectsMaterial has been replaced by
// a registry-driven factory. Consumers should import the new exports directly:
//
//   import { buildShaderEffectsMaterial, EFFECT_REGISTRY,
//            listDescriptors, createDefaultShaderEffect,
//            type ShaderEffect } from '@ntalmagor/3drize-core';
export { buildShaderEffectsMaterial, } from './effects/buildShaderEffectsMaterial';
export { EFFECT_REGISTRY, getDescriptor, listDescriptors, registerEffect, } from './effects/registry/index';
export { createDefaultShaderEffect, generateInstanceId } from './effects/defaults';
export { buildUniformPrefix, buildUniformName, structureKey, } from './effects/types';
