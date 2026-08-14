import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
// ─────────────────────────────────────────────────────────────────────────────
//  Shared GLSL — extracted from LineEffects.tsx
//  These shaders expect:
//    uniforms : u_time, uMode, u_speed, uIntensity, uDensity
//    attributes: aT (float 0→1 along edge), aSegId (float edge index)
//    geometry  : dense point cloud sampled from EdgesGeometry
// ─────────────────────────────────────────────────────────────────────────────
const LINE_VERT = /* glsl */ `
uniform float u_time;
uniform float uMode;
uniform float u_speed;
uniform float uDensity;

attribute float aT;
attribute float aSegId;

varying float vT;
varying float vSeg;
varying vec3  vPos;
varying float vJitter;

float hash(float n){ return fract(sin(n)*43758.5453); }
float noise(float x){
  float i=floor(x); float f=fract(x);
  float u=f*f*(3.0-2.0*f);
  return mix(hash(i),hash(i+1.0),u);
}

void main(){
  vT   = aT;
  vSeg = aSegId;
  vPos = position;

  float jitter = 0.0;

  if(uMode == 1.0){ // electric
    float t2 = u_time*u_speed*12.0 + aSegId*7.3;
    jitter   = noise(t2 + aT*5.0)*0.06 - 0.03;
    jitter  += noise(u_time*u_speed*20.0 + aSegId*3.7 + aT*9.0)*0.04 - 0.02;
  }
  if(uMode == 4.0){ // lava
    float t2 = u_time*u_speed*4.0 + aSegId*5.1;
    jitter   = noise(t2 + aT*4.0)*0.03 - 0.015;
  }
  if(uMode == 5.0){ // frost
    float t2 = u_time*u_speed*2.0 + aSegId*4.3;
    jitter   = (noise(t2 + aT*6.0) - 0.5)*0.025;
  }

  vJitter  = jitter;
  vec3 p   = position + normalize(position) * jitter;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);

  float ptSize = 3.0;
  if(uMode == 2.0) ptSize = 5.0;
  if(uMode == 5.0) ptSize = 4.0;
  gl_PointSize = ptSize;
}`;
const LINE_FRAG = /* glsl */ `
uniform float u_time;
uniform float uMode;
uniform float u_speed;
uniform float uIntensity;
uniform float uDensity;

varying float vT;
varying float vSeg;
varying vec3  vPos;
varying float vJitter;

float hash(float n){ return fract(sin(n)*43758.5453); }
float noise(float x){
  float i=floor(x); float f=fract(x);
  float u=f*f*(3.0-2.0*f);
  return mix(hash(i),hash(i+1.0),u);
}
vec3 hsv(float h,float s,float v){
  vec3 c=clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);
  return v*mix(vec3(1.0),c,s);
}

void main(){
  vec3  col   = vec3(0.0);
  float alpha = 1.0;
  float t     = u_time*u_speed;
  float dens  = uDensity;

  /* ── 0 · PLASMA ──────────────────────────────── */
  if(uMode == 0.0){
    float w1 = sin(vT*15.0*dens - t*3.0 + vSeg*1.5)*0.5+0.5;
    float w2 = sin(vT*28.0*dens + t*2.0 + vSeg*2.3)*0.5+0.5;
    float w3 = sin(vT*7.0 *dens - t*1.2 + vSeg*0.7)*0.5+0.5;
    float plasma = w1*0.5+w2*0.3+w3*0.2;
    col   = hsv(fract(plasma*0.7+t*0.08+vSeg*0.04),0.9,1.0);
    col   = pow(col,vec3(0.65));
    float pulse = sin(vT*8.0*dens-t*5.0+vSeg*1.1)*0.25+0.75;
    alpha = pulse*uIntensity;

  /* ── 1 · ELECTRIC ────────────────────────────── */
  }else if(uMode == 1.0){
    float bolt    = abs(vJitter)*50.0;
    float core    = exp(-bolt*bolt*6.0);
    float glow    = exp(-bolt*bolt*0.5)*0.5;
    float flicker = sin(t*70.0+vSeg*11.3)*0.4+0.6;
    float strike  = smoothstep(0.35,0.85,noise(t*7.0+vSeg*2.1));
    col  = vec3(0.15,0.4,1.0)*glow + vec3(0.75,0.9,1.0)*core;
    col += vec3(0.0,0.05,0.2)*0.4;
    col *= (0.5+0.5*flicker)*(0.2+0.8*strike)*uIntensity*1.5;
    alpha = (glow+core)*(0.4+0.6*strike);

  /* ── 2 · PARTICLES ───────────────────────────── */
  }else if(uMode == 2.0){
    float spd   = 1.2+hash(vSeg)*1.5;
    float phase = hash(vSeg*7.13);
    float trail = fract(vT - t*spd*0.5 - phase);
    float head  = exp(-trail*7.0*dens);
    float tail  = exp(-trail*2.0*dens)*0.25;
    float bright= head+tail;
    col  = mix(vec3(0.3,0.6,1.0),hsv(fract(hash(vSeg*3.7)+t*0.04),0.8,1.0),0.7);
    col  = col*bright*uIntensity*2.5 + vec3(1.0)*exp(-trail*25.0)*0.9;
    alpha= bright*1.3;
    float d = length(gl_PointCoord-0.5)*2.0;
    alpha  *= smoothstep(1.0,0.2,d);

  /* ── 3 · RAINBOW ─────────────────────────────── */
  }else if(uMode == 3.0){
    float w1 = sin(vT*12.0*dens-t*4.0+vSeg*1.1)*0.5+0.5;
    float w2 = sin(vT*20.0*dens+t*3.0+vSeg*2.7)*0.5+0.5;
    float w3 = sin(vT*6.0 *dens-t*1.5+vPos.x*3.0+vPos.y*2.0)*0.5+0.5;
    float interf = abs(sin(vT*35.0*dens-t*6.0+vSeg*3.0));
    col  = hsv(fract(w1*0.4+w2*0.35+w3*0.25+t*0.06),1.0,1.0);
    col  = pow(col,vec3(0.5));
    col  = col*(0.5+0.5*interf)+vec3(1.0)*0.1*(1.0-interf);
    alpha= (0.7+0.3*interf)*uIntensity;

  /* ── 4 · LAVA ─────────────────────────────────── */
  }else if(uMode == 4.0){
    float flow   = fract(vT*dens*0.5-t*0.8+vSeg*0.3+vJitter*10.0);
    float heat   = pow(sin(flow*3.14159),0.4);
    float w2     = sin(vT*20.0*dens-t*2.0+vSeg*1.9)*0.5+0.5;
    float bubble = smoothstep(0.6,1.0,noise(t*3.0+vSeg*5.0+vT*8.0));
    col  = mix(vec3(0.15,0.02,0.0),vec3(1.0,0.08,0.0),heat);
    col  = mix(col,vec3(1.0,0.45,0.0),w2*0.5);
    col  = mix(col,vec3(1.0,0.9,0.2),bubble*heat);
    col *= uIntensity;
    alpha= 0.85+0.15*bubble;

  /* ── 5 · FROST ───────────────────────────────── */
  }else{
    float ct    = vT*dens;
    float wave  = sin(ct*10.0-t*1.5+vSeg*2.0)*0.5+0.5;
    float wave2 = sin(ct*22.0+t*0.8 +vSeg*3.1)*0.5+0.5;
    float shim  = sin(ct*40.0-t*3.0 +vSeg*1.7)*0.5+0.5;
    float ice   = wave*0.5+wave2*0.3+shim*0.2;
    float spark = pow(shim,8.0)*noise(t*15.0+vSeg*6.3+vT*12.0);
    col  = mix(vec3(0.6,0.85,1.0),vec3(0.85,0.95,1.0),ice);
    col  = mix(col,vec3(1.0),pow(shim,3.0));
    col += vec3(1.0)*spark*2.0;
    float d2 = length(gl_PointCoord-0.5)*2.0;
    alpha = (0.5+0.5*ice+spark)*uIntensity*smoothstep(1.0,0.0,d2*0.7);
  }

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.5));
}`;
// ─────────────────────────────────────────────────────────────────────────────
//  Glow pass GLSL — wide soft bloom rendered on the sparse (cloudLow) geometry
// ─────────────────────────────────────────────────────────────────────────────
const GLOW_VERT = /* glsl */ `
attribute float aSegId;
attribute float aT;
uniform   float u_time;
uniform   float uMode;
varying   float vT;
varying   float vSeg;
void main(){
  vT   = aT;
  vSeg = aSegId;
  gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 12.0;
}`;
const GLOW_FRAG = /* glsl */ `
uniform float u_time;
uniform float uMode;
uniform float uGlowIntensity;
varying float vT;
varying float vSeg;
float hash(float n){ return fract(sin(n)*43758.5453); }
vec3 hsv(float h,float s,float v){
  vec3 c=clamp(abs(mod(h*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);
  return v*mix(vec3(1.0),c,s);
}
void main(){
  float d = length(gl_PointCoord-0.5)*2.0;
  float g = exp(-d*d*2.5)*uGlowIntensity;
  float hue = fract(vT*0.3+u_time*0.05+vSeg*0.04);
  vec3 col;
  if      (uMode==0.0) col=hsv(hue,0.9,1.0);
  else if (uMode==1.0) col=vec3(0.2,0.5,1.0);
  else if (uMode==2.0) col=hsv(fract(hash(vSeg*3.7)+u_time*0.04),0.8,1.0);
  else if (uMode==3.0) col=hsv(hue,1.0,1.0);
  else if (uMode==4.0) col=vec3(1.0,0.2,0.0);
  else                 col=vec3(0.7,0.9,1.0);
  gl_FragColor=vec4(col*g,g);
}`;
// ─────────────────────────────────────────────────────────────────────────────
//  Main pass materials  (one per effect — uMode baked in as the default value)
// ─────────────────────────────────────────────────────────────────────────────
export const PlasmaLineMaterial = shaderMaterial({ u_time: 0, uMode: 0, u_speed: 0.8, uIntensity: 1.2, uDensity: 1.0 }, LINE_VERT, LINE_FRAG);
export const ElectricLineMaterial = shaderMaterial({ u_time: 0, uMode: 1, u_speed: 1.8, uIntensity: 1.5, uDensity: 0.8 }, LINE_VERT, LINE_FRAG);
export const ParticlesLineMaterial = shaderMaterial({ u_time: 0, uMode: 2, u_speed: 1.2, uIntensity: 1.2, uDensity: 1.0 }, LINE_VERT, LINE_FRAG);
export const RainbowLineMaterial = shaderMaterial({ u_time: 0, uMode: 3, u_speed: 0.6, uIntensity: 1.0, uDensity: 1.2 }, LINE_VERT, LINE_FRAG);
export const LavaLineMaterial = shaderMaterial({ u_time: 0, uMode: 4, u_speed: 0.5, uIntensity: 1.1, uDensity: 0.8 }, LINE_VERT, LINE_FRAG);
export const FrostLineMaterial = shaderMaterial({ u_time: 0, uMode: 5, u_speed: 0.3, uIntensity: 0.8, uDensity: 1.4 }, LINE_VERT, LINE_FRAG);
// ─────────────────────────────────────────────────────────────────────────────
//  Glow pass materials  (one per effect — separate draw call on sparse geometry)
// ─────────────────────────────────────────────────────────────────────────────
export const PlasmaLineGlowMaterial = shaderMaterial({ u_time: 0, uMode: 0, uGlowIntensity: 0.30 }, GLOW_VERT, GLOW_FRAG);
export const ElectricLineGlowMaterial = shaderMaterial({ u_time: 0, uMode: 1, uGlowIntensity: 0.15 }, GLOW_VERT, GLOW_FRAG);
export const ParticlesLineGlowMaterial = shaderMaterial({ u_time: 0, uMode: 2, uGlowIntensity: 0.20 }, GLOW_VERT, GLOW_FRAG);
export const RainbowLineGlowMaterial = shaderMaterial({ u_time: 0, uMode: 3, uGlowIntensity: 0.35 }, GLOW_VERT, GLOW_FRAG);
export const LavaLineGlowMaterial = shaderMaterial({ u_time: 0, uMode: 4, uGlowIntensity: 0.40 }, GLOW_VERT, GLOW_FRAG);
export const FrostLineGlowMaterial = shaderMaterial({ u_time: 0, uMode: 5, uGlowIntensity: 0.50 }, GLOW_VERT, GLOW_FRAG);
// ─────────────────────────────────────────────────────────────────────────────
//  Register with R3F so they are usable as JSX tags
// ─────────────────────────────────────────────────────────────────────────────
extend({
    PlasmaLineMaterial,
    ElectricLineMaterial,
    ParticlesLineMaterial,
    RainbowLineMaterial,
    LavaLineMaterial,
    FrostLineMaterial,
    PlasmaLineGlowMaterial,
    ElectricLineGlowMaterial,
    ParticlesLineGlowMaterial,
    RainbowLineGlowMaterial,
    LavaLineGlowMaterial,
    FrostLineGlowMaterial,
});
