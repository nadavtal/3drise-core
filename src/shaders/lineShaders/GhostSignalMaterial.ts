import { Vector2, Vector3 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface GhostSignalMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_signalColor: {
        value: Vector3;
    };
    u_trailColor: {
        value: Vector3;
    };
    u_speed: {
        value: number;
    };
    u_packetCount: {
        value: number;
    };
    u_trailLength: {
        value: number;
    };
    u_glitchIntensity: {
        value: number;
    };
}

const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_signalColor;
  uniform vec3 u_trailColor;
  uniform float u_speed;
  uniform float u_packetCount;
  uniform float u_trailLength;
  uniform float u_glitchIntensity;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    float along = vUv.x;
    float across = vUv.y - 0.5;

    float totalLight = 0.0;
    vec3 col = vec3(0.0);

    // Multiple packets racing along the line
    for (float i = 0.0; i < 8.0; i++) {
      if (i >= u_packetCount) break;

      float offset = hash(i * 7.3 + 0.5);
      float speedVar = 0.8 + hash(i * 13.7) * 0.4;
      float pos = fract(offset + u_time * u_speed * speedVar);

      float d = along - pos;

      // Trail: exponential decay behind the packet
      float trail = 0.0;
      if (d < 0.0 && d > -u_trailLength) {
        trail = exp(d / (u_trailLength * 0.3));
      }

      // Head: sharp bright front
      float head = exp(-abs(d) * 120.0) * 3.0;

      float perp = exp(-abs(across) * 40.0);

      col += u_trailColor * trail * perp;
      col += u_signalColor * head * perp;
      totalLight += (trail + head) * perp;
    }

    // Scan-line / glitch interference pattern
    float scanLine = step(0.97, fract(vUv.y * 20.0 + u_time * 0.3));
    float glitchTime = floor(u_time * 8.0);
    float glitchStrip = step(0.92, hash(floor(vUv.x * 15.0) + glitchTime));
    float glitch = scanLine * glitchStrip * u_glitchIntensity;

    float noiseFlicker = hash(vUv.x * 100.0 + u_time * 50.0);
    col += u_signalColor * glitch * noiseFlicker;

    // Base wire glow — very subtle so the line is always slightly visible
    float wireGlow = exp(-abs(across) * 25.0) * 0.04;
    col += u_trailColor * wireGlow;

    float alpha = clamp(totalLight + glitch * 0.5 + wireGlow, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;
const GhostSignalMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(),
    u_signalColor: new Vector3(0.2, 1.0, 0.5), // Phosphor green
    u_trailColor: new Vector3(0.05, 0.4, 0.15), // Dim green
    u_speed: 0.4,
    u_packetCount: 3.0,
    u_trailLength: 0.25,
    u_glitchIntensity: 0.6,
}, vertexShader, fragmentShader);
extend({ GhostSignalMaterial });
export { GhostSignalMaterial };
