import { Color } from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
export interface SkyboxMaterialUniforms {
    uSunAzimuth: {
        value: number;
    };
    uSunElevation: {
        value: number;
    };
    uSunColor: {
        value: Color;
    };
    uSkyColorLow: {
        value: Color;
    };
    uSkyColorHigh: {
        value: Color;
    };
    uSunSize: {
        value: number;
    };
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        skyboxMaterial: any;
    }
}

const vertexShader = /*glsl*/ `
  varying vec3 vWorldPosition;
  varying vec3 vDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vDirection = normalize(worldPosition.xyz);

    vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = pos.xyww;
  }
`;
const fragmentShader = /*glsl*/ `
  precision mediump float;
  varying vec3 vWorldPosition;
  varying vec3 vDirection;

  uniform float uSunAzimuth;
  uniform float uSunElevation;
  uniform vec3 uSunColor;
  uniform vec3 uSkyColorLow;
  uniform vec3 uSkyColorHigh;
  uniform float uSunSize;

  void main() {
    vec3 direction = normalize(vWorldPosition);

    vec3 skyColor = mix(uSkyColorLow, uSkyColorHigh, clamp(direction.y * 0.5 + 0.5, 0.0, 1.0));

    float azimuth = radians(uSunAzimuth);
    float elevation = radians(uSunElevation);
    vec3 sunDirection = normalize(vec3(
      cos(elevation) * sin(azimuth),
      sin(elevation),
      cos(elevation) * cos(azimuth)
    ));

    float sunIntensity = pow(max(dot(direction, sunDirection), 0.0), 1000.0 / uSunSize);
    vec3 sunColor = uSunColor * sunIntensity;

    gl_FragColor = vec4(skyColor + sunColor, 1.0);
  }
`;
const SkyboxMaterial = shaderMaterial({
    uSunAzimuth: 216,
    uSunElevation: 24.68698059628387,
    uSunColor: new Color(0xffe5b0),
    uSkyColorLow: new Color(0x6fa2ef),
    uSkyColorHigh: new Color(0x2053ff),
    uSunSize: 1,
}, vertexShader, fragmentShader);
extend({ SkyboxMaterial });
export { SkyboxMaterial };
