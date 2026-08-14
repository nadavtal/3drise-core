import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
export interface EarthAtmosphereMaterialUniforms {
    uSunDirection: {
        value: THREE.Vector3;
    };
    uAtmosphereDayColor: {
        value: THREE.Color;
    };
    uAtmosphereTwilightColor: {
        value: THREE.Color;
    };
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            earthAtmosphereMaterial: any;
        }
    }
}

const vertexShader = /*glsl*/ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
const fragmentShader = /*glsl*/ `
  uniform vec3 uSunDirection;
  uniform vec3 uAtmosphereDayColor;
  uniform vec3 uAtmosphereTwilightColor;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  float remap(float v, float inMin, float inMax, float outMin, float outMax) {
    float t = clamp((v - inMin) / (inMax - inMin), 0.0, 1.0);
    return mix(outMin, outMax, t);
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunDirection);

    vec3 viewDir = normalize(vWorldPosition - cameraPosition);
    float fresnel = 1.0 - abs(dot(viewDir, normal));

    float sunOrientation = dot(normal, sunDir);

    vec3 color = mix(
      uAtmosphereTwilightColor,
      uAtmosphereDayColor,
      smoothstep(-0.25, 0.75, sunOrientation)
    );

    float alpha = pow(remap(fresnel, 0.73, 1.0, 1.0, 0.0), 3.0);
    alpha *= smoothstep(-0.5, 1.0, sunOrientation);

    gl_FragColor = vec4(color, alpha);
  }
`;
const EarthAtmosphereMaterial = shaderMaterial({
    uSunDirection: new THREE.Vector3(0, 0, 1),
    uAtmosphereDayColor: new THREE.Color('#4db2ff'),
    uAtmosphereTwilightColor: new THREE.Color('#bc490b'),
}, vertexShader, fragmentShader);
extend({ EarthAtmosphereMaterial });
export { EarthAtmosphereMaterial };
