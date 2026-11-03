import * as THREE from 'three';
import type { MeshBVHUniformStruct } from 'three-mesh-bvh';

// Core's copy of drei's shaderMaterial (@react-three/drei 10.7.7, core/shaderMaterial.js) — same
// behaviour, line for line, so core needs no React. A class per call: uniforms become instance
// properties (material.u_time = …). Registering it as a JSX element is the React package's job
// (packages/viewer/src/registerMaterials.ts).
type UniformValue = THREE.Texture | THREE.TypedArray | THREE.Matrix4 | THREE.Matrix3 | THREE.Quaternion | THREE.Vector4 | THREE.Vector3 | THREE.Vector2 | THREE.Color | MeshBVHUniformStruct | number | boolean | null;
type Uniforms = Record<string, UniformValue | Record<string, UniformValue> | Array<UniformValue>>;
export type ShaderMaterialClass<M> = (new (...args: any[]) => M) & { key: string };

export function shaderMaterial<U extends Uniforms, M extends THREE.ShaderMaterial & U>(
    uniforms: U,
    vertexShader: string,
    fragmentShader: string,
    onInit?: (material?: M) => void,
): ShaderMaterialClass<M> {
    const Material = class extends THREE.ShaderMaterial {
        static key = THREE.MathUtils.generateUUID();
        constructor(parameters?: THREE.ShaderMaterialParameters) {
            super({ vertexShader, fragmentShader, ...parameters });
            for (const key in uniforms) {
                this.uniforms[key] = new THREE.Uniform(uniforms[key]);
                Object.defineProperty(this, key, {
                    get() { return this.uniforms[key].value; },
                    set(value) { this.uniforms[key].value = value; },
                });
            }
            this.uniforms = THREE.UniformsUtils.clone(this.uniforms);
            onInit?.(this as unknown as M);
        }
    };
    return Material as unknown as ShaderMaterialClass<M>;
}
