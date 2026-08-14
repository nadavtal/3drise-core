import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
export interface EarthMaterialUniforms {
    uDayMap: {
        value: THREE.Texture | null;
    };
    uNightMap: {
        value: THREE.Texture | null;
    };
    uBumpRoughnessClouds: {
        value: THREE.Texture | null;
    };
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
            earthMaterial: any;
        }
    }
}

const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
const fragmentShader = /*glsl*/ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform sampler2D uBumpRoughnessClouds;
  uniform vec3 uSunDirection;
  uniform vec3 uAtmosphereDayColor;
  uniform vec3 uAtmosphereTwilightColor;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunDirection);

    vec3 dayTex   = texture2D(uDayMap, vUv).rgb;
    vec3 nightTex = texture2D(uNightMap, vUv).rgb;
    vec3 brc      = texture2D(uBumpRoughnessClouds, vUv).rgb;

    float cloudsStrength = smoothstep(0.2, 1.0, brc.b);
    vec3 dayColor = mix(dayTex, vec3(1.0), clamp(cloudsStrength * 2.0, 0.0, 1.0));

    float sunOrientation = dot(normal, sunDir);
    float dayStrength = smoothstep(-0.25, 0.5, sunOrientation);

    vec3 viewDir = normalize(vWorldPosition - cameraPosition);
    float fresnel = 1.0 - abs(dot(viewDir, normal));

    vec3 atmosphereColor = mix(
      uAtmosphereTwilightColor,
      uAtmosphereDayColor,
      smoothstep(-0.25, 0.75, sunOrientation)
    );
    float atmosphereDayStrength = smoothstep(-0.5, 1.0, sunOrientation);
    float atmosphereMix = clamp(atmosphereDayStrength * pow(fresnel, 2.0), 0.0, 1.0);

    vec3 finalColor = mix(nightTex, dayColor, dayStrength);
    finalColor = mix(finalColor, atmosphereColor, atmosphereMix);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
const EarthMaterial = shaderMaterial({
    uDayMap: null,
    uNightMap: null,
    uBumpRoughnessClouds: null,
    uSunDirection: new THREE.Vector3(0, 0, 1),
    uAtmosphereDayColor: new THREE.Color('#4db2ff'),
    uAtmosphereTwilightColor: new THREE.Color('#bc490b'),
}, vertexShader, fragmentShader);
extend({ EarthMaterial });
export { EarthMaterial };
