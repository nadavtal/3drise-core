import { DataTexture, FloatType, RGBAFormat, ShaderMaterial, Vector2 } from "three";
// Simulation shaders for morphing between shapes
const morphSimulationVertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const morphSimulationFragmentShader = `
uniform float u_time;
uniform sampler2D uPositionsSource;
uniform sampler2D uPositionsTarget;
uniform vec2 resolution;
uniform float uMorphProgress;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  
  vec4 positionSource = texture2D(uPositionsSource, uv);
  vec4 positionTarget = texture2D(uPositionsTarget, uv);
  
  // Use the morphProgress uniform for smooth interpolation
  vec4 finalPosition = mix(positionSource, positionTarget, uMorphProgress);
  
  gl_FragColor = finalPosition;
}
`;
class MorphSimulationMaterial extends ShaderMaterial {
    constructor(size: number, defaultSourceData: Float32Array, defaultTargetData: Float32Array) {
        const sourceTexture = new DataTexture(defaultSourceData, size, size, RGBAFormat, FloatType);
        sourceTexture.needsUpdate = true;
        const targetTexture = new DataTexture(defaultTargetData, size, size, RGBAFormat, FloatType);
        targetTexture.needsUpdate = true;
        const uniforms = {
            u_time: { value: 0.0 },
            uPositionsSource: { value: sourceTexture },
            uPositionsTarget: { value: targetTexture },
            uMorphProgress: { value: 0.0 },
            resolution: { value: new Vector2(size, size) }
        };
        super({
            uniforms,
            vertexShader: morphSimulationVertexShader,
            fragmentShader: morphSimulationFragmentShader,
        });
    }
    updatePositions(sourceData: Float32Array, targetData: Float32Array, size: number): void {
        // Update source texture
        if (this.uniforms.uPositionsSource.value) {
            this.uniforms.uPositionsSource.value.image.data = sourceData;
            this.uniforms.uPositionsSource.value.needsUpdate = true;
        }
        // Update target texture
        if (this.uniforms.uPositionsTarget.value) {
            this.uniforms.uPositionsTarget.value.image.data = targetData;
            this.uniforms.uPositionsTarget.value.needsUpdate = true;
        }
    }
    getLinesAndColumns(): {
                source: {
                    lines: number;
                    columns: number;
                };
                target: {
                    lines: number;
                    columns: number;
                };
            } {
        const sourceTexture = this.uniforms.uPositionsSource.value;
        const targetTexture = this.uniforms.uPositionsTarget.value;
        const source = { lines: sourceTexture.image.height, columns: sourceTexture.image.width };
        const target = { lines: targetTexture.image.height, columns: targetTexture.image.width };
        return { source, target };
    }
}
export default MorphSimulationMaterial;
