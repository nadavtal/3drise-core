import { Vector3, Vector2 } from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
export interface OceanMaterialUniforms {
    u_time: {
        value: number;
    };
    u_resolution: {
        value: Vector2;
    };
    u_pointer: {
        value: Vector2;
    };
    u_seaHeight: {
        value: number;
    };
    u_seaChoppy: {
        value: number;
    };
    u_seaSpeed: {
        value: number;
    };
    u_seaFreq: {
        value: number;
    };
    u_seaBaseColor: {
        value: Vector3;
    };
    u_seaWaterColor: {
        value: Vector3;
    };
    u_iterGeometry: {
        value: number;
    };
    u_iterFragment: {
        value: number;
    };
    u_numSteps: {
        value: number;
    };
}

// Vertex shader
const vertexShader = /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Fragment shader - converted from the original Seascape shader
const fragmentShader = /*glsl*/ `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform float u_seaHeight;
  uniform float u_seaChoppy;
  uniform float u_seaSpeed;
  uniform float u_seaFreq;
  uniform vec3 u_seaBaseColor;
  uniform vec3 u_seaWaterColor;
  uniform float u_iterGeometry;
  uniform float u_iterFragment;
  uniform float u_numSteps;
  
  varying vec2 vUv;
  varying vec3 vPosition;

  const float PI = 3.141592;
  const float EPSILON = 1e-3;
  
  // math
  mat3 fromEuler(vec3 ang) {
    vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
    m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
    m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
    return m;
  }
  
  float hash( vec2 p ) {
    float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*43758.5453123);
  }
  
  float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );	
    vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
  }

  // lighting
  float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
  }
  
  float specular(vec3 n,vec3 l,vec3 e,float s) {    
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
  }

  // sky
  vec3 getSkyColor(vec3 e) {
    e.y = (max(e.y,0.0)*0.8+0.2)*0.8;
    return vec3(pow(1.0-e.y,2.0), 1.0-e.y, 0.6+(1.0-e.y)*0.4) * 1.1;
  }

  // sea
  float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);        
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv,swv,wv);
    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
  }

  float map(vec3 p) {
    float freq = u_seaFreq;
    float amp = u_seaHeight;
    float choppy = u_seaChoppy;
    vec2 uv = p.xz; 
    uv.x *= 0.75;
    
    float SEA_TIME = 1.0 + u_time * u_seaSpeed;
    mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);
    
    float d, h = 0.0;    
    for(int i = 0; i < 3; i++) {        
      if(float(i) >= u_iterGeometry) break;
      d = sea_octave((uv+SEA_TIME)*freq,choppy);
      d += sea_octave((uv-SEA_TIME)*freq,choppy);
      h += d * amp;        
      uv *= octave_m; 
      freq *= 1.9; 
      amp *= 0.22;
      choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
  }

  float map_detailed(vec3 p) {
    float freq = u_seaFreq;
    float amp = u_seaHeight;
    float choppy = u_seaChoppy;
    vec2 uv = p.xz; 
    uv.x *= 0.75;
    
    float SEA_TIME = 1.0 + u_time * u_seaSpeed;
    mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);
    
    float d, h = 0.0;    
    for(int i = 0; i < 5; i++) {        
      if(float(i) >= u_iterFragment) break;
      d = sea_octave((uv+SEA_TIME)*freq,choppy);
      d += sea_octave((uv-SEA_TIME)*freq,choppy);
      h += d * amp;        
      uv *= octave_m; 
      freq *= 1.9; 
      amp *= 0.22;
      choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
  }

  vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
    float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
    fresnel = min(fresnel * fresnel * fresnel, 0.5);
    
    vec3 reflected = getSkyColor(reflect(eye, n));    
    vec3 refracted = u_seaBaseColor + diffuse(n, l, 80.0) * u_seaWaterColor * 0.12; 
    
    vec3 color = mix(refracted, reflected, fresnel);
    
    float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
    color += u_seaWaterColor * (p.y - u_seaHeight) * 0.18 * atten;
    
    color += specular(n, l, eye, 600.0 * inversesqrt(dot(dist,dist)));
    
    return color;
  }

  // tracing
  vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);    
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
  }

  float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  
    float tm = 0.0;
    float tx = 1000.0;    
    float hx = map(ori + dir * tx);
    if(hx > 0.0) {
      p = ori + dir * tx;
      return tx;   
    }
    float hm = map(ori);    
    for(int i = 0; i < 32; i++) {
      if(float(i) >= u_numSteps) break;
      float tmid = mix(tm, tx, hm / (hm - hx));
      p = ori + dir * tmid;
      float hmid = map(p);        
      if(hmid < 0.0) {
        tx = tmid;
        hx = hmid;
      } else {
        tm = tmid;
        hm = hmid;
      }        
      if(abs(hmid) < EPSILON) break;
    }
    return mix(tm, tx, hm / (hm - hx));
  }

  vec3 getPixel(in vec2 coord, float time) {    
    vec2 uv = coord / u_resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;    
        
    // ray
    vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);    
    vec3 ori = vec3(0.0,3.5,time*5.0);
    vec3 dir = normalize(vec3(uv.xy,-2.0)); 
    dir.z += length(uv) * 0.14;
    dir = normalize(dir) * fromEuler(ang);
    
    // tracing
    vec3 p;
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    float EPSILON_NRM = 0.1 / u_resolution.x;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8)); 
             
    // color
    return mix(
      getSkyColor(dir),
      getSeaColor(p,n,light,dir,dist),
      pow(smoothstep(0.0,-0.02,dir.y),0.2));
  }

  void main() {
    float time = u_time * 0.3 + u_pointer.x*0.01;
    vec3 color = getPixel(gl_FragCoord.xy, time);
    
    // post processing
    gl_FragColor = vec4(pow(color,vec3(0.65)), 1.0);
  }
`;
// Create the shader material with uniforms
const OceanMaterial = shaderMaterial({
    u_time: 0,
    u_resolution: new Vector2(800, 600),
    u_pointer: new Vector2(0, 0),
    u_seaHeight: 0.6,
    u_seaChoppy: 4.0,
    u_seaSpeed: 0.8,
    u_seaFreq: 0.16,
    u_seaBaseColor: new Vector3(0.0, 0.09, 0.18),
    u_seaWaterColor: new Vector3(0.8 * 0.6, 0.9 * 0.6, 0.6 * 0.6),
    u_iterGeometry: 3,
    u_iterFragment: 5,
    u_numSteps: 32
}, vertexShader, fragmentShader);
// Extend the material for use in React Three Fiber
extend({ OceanMaterial });
export { OceanMaterial };
