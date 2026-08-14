import { shaderMaterial } from "@react-three/drei";
import { ShaderMaterial } from "three";
export interface CustomShaderMaterialProps {
    uniforms: {
        [uniform: string]: any;
    };
    vertexShader: string;
    fragmentShader: string;
}


export function createCustomShaderMaterial({ uniforms, vertexShader, fragmentShader }: CustomShaderMaterialProps): typeof ShaderMaterial {
    // Create the shader material using drei's shaderMaterial helper
    const CustomMaterial = shaderMaterial(uniforms, vertexShader, fragmentShader);
    //   console.log({CustomMaterial})
    // Extend the material for use in React Three Fiber
    //   extend({ CustomMaterial });
    return CustomMaterial;
}
// export { createCustomShaderMaterial as CustomShaderMaterial };
