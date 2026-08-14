import type { ShaderType } from "../services/ShadersLibrary";
import { AnimationOptions } from ".";
declare module '@react-three/fiber' {
    interface ThreeElements {
        morphSimulationMaterial: any;
        myImageMaterial: any;
        shaderEffectsMaterial: any;
        lineMaterial: any;
    }
}

export type MaterialType = 'basic' | 'lava' | 'smoke' | 'sand' | 'corona' | 'effects' | 'water' | 'glass' | 'metal' | 'crystal' | 'wood' | 'plastic' | 'clouds' | 'advanced' | 'particles' | 'custom' | 'shaders' | 'line';

export type MaterialOptions = 'color' | 'opacity' | 'emissive' | 'roughness' | 'metalness' | 'normalMap' | 'bumpMap' | 'displacementMap' | 'alphaMap' | 'envMap' | 'lightMap' | 'aoMap' | 'wireframe' | 'side';

interface BaseMaterialSettings {
}

interface OpacityMaterialSettings extends BaseMaterialSettings {
    opacity: number;
    transparent: boolean;
}

interface ColorMaterialSettings extends BaseMaterialSettings {
    color: string;
    opacity: number;
}

interface TextureMaterialSettings {
    map: string | null;
}

interface WireframeMaterialSettings {
    wireframe: boolean;
}

interface SideMaterialSettings {
    side?: 0 | 1 | 2;
}

interface PBRMaterialSettings {
    roughness: number;
    metalness: number;
}

interface EnvMapMaterialSettings {
    envMap?: string | null;
    envMapIntensity?: number;
}

interface NormalMapMaterialSettings {
    normalMap?: string | null;
    normalScale?: [number, number];
}

interface BumpMapMaterialSettings {
    bumpMap?: string | null;
    bumpScale?: number;
}

interface AoMapMaterialSettings {
    aoMap?: string | null;
    aoMapIntensity?: number;
}

interface DisplacementMapMaterialSettings {
    displacementMap?: string | null;
    displacementScale?: number;
}

interface AlphaMapMaterialSettings {
    alphaMap?: string | null;
}

interface EmissiveMaterialSettings {
    emissive?: string;
    emissiveIntensity?: number;
}

export interface BasicMaterialSettings extends ColorMaterialSettings, TextureMaterialSettings, WireframeMaterialSettings, SideMaterialSettings, AlphaMapMaterialSettings {
    envMap?: string | null;
    aoMap?: string | null;
    reflectivity?: number;
}

export interface StandardMaterialSettings extends ColorMaterialSettings, TextureMaterialSettings, WireframeMaterialSettings, PBRMaterialSettings, SideMaterialSettings, EnvMapMaterialSettings, NormalMapMaterialSettings, BumpMapMaterialSettings, AoMapMaterialSettings, DisplacementMapMaterialSettings, AlphaMapMaterialSettings, EmissiveMaterialSettings {
    flatShading?: boolean;
}

export interface PhongMaterialSettings extends ColorMaterialSettings, TextureMaterialSettings, WireframeMaterialSettings, SideMaterialSettings, NormalMapMaterialSettings, BumpMapMaterialSettings, AlphaMapMaterialSettings, EmissiveMaterialSettings {
    shininess: number;
    specular: string;
    envMap?: string | null;
    reflectivity?: number;
    flatShading?: boolean;
}

export interface LambertMaterialSettings extends ColorMaterialSettings, TextureMaterialSettings, WireframeMaterialSettings, SideMaterialSettings, AlphaMapMaterialSettings, EmissiveMaterialSettings {
    envMap?: string | null;
    aoMap?: string | null;
    reflectivity?: number;
}

export interface PhysicalMaterialSettings extends StandardMaterialSettings {
    clearcoat: number;
    clearcoatRoughness: number;
    transmission: number;
    ior: number;
    thickness?: number;
    attenuationColor?: string;
    attenuationDistance?: number;
    sheen?: number;
    sheenRoughness?: number;
    sheenColor?: string;
    specularIntensity?: number;
    specularColor?: string;
    iridescence?: number;
    iridescenceIOR?: number;
}

export interface ToonMaterialSettings extends ColorMaterialSettings, TextureMaterialSettings, WireframeMaterialSettings, SideMaterialSettings, NormalMapMaterialSettings, BumpMapMaterialSettings, AlphaMapMaterialSettings, EmissiveMaterialSettings {
    gradientMap: string | null;
}

export interface NormalMaterialSettings extends OpacityMaterialSettings, WireframeMaterialSettings, SideMaterialSettings {
}

export interface PointsMaterialSettings extends ColorMaterialSettings, TextureMaterialSettings {
    pointSize: number;
    sizeAttenuation: boolean;
}

export interface LineMaterialSettings extends BaseMaterialSettings {
    color: string;
    linewidth: number;
    linecap: string;
    linejoin: string;
}

export interface ShadowMaterialSettings extends BaseMaterialSettings, SideMaterialSettings {
}

export interface SpriteMaterialSettings extends ColorMaterialSettings, TextureMaterialSettings {
}

export type UniFormSettings = {
    [key: string]: any;
};

export type ShaderSettings = UniFormSettings & SideMaterialSettings & {
    shaderType: ShaderType;
};

export interface ReflectorMaterialSettings {
    color?: string;
    roughness?: number;
    metalness?: number;
    blur?: [number, number];
    resolution?: number;
    mixBlur?: number;
    mixStrength?: number;
    depthScale?: number;
    minDepthThreshold?: number;
    maxDepthThreshold?: number;
    depthToBlurRatioBias?: number;
    mirror?: number;
    distortion?: number;
    mixContrast?: number;
}

export interface RefractionMaterialSettings {
    color?: string;
    ior?: number;
    fresnel?: number;
    aberrationStrength?: number;
    fastChroma?: boolean;
}

export interface TransmissionMaterialSettings {
    transmission?: number;
    thickness?: number;
    roughness?: number;
    chromaticAberration?: number;
    anisotropy?: number;
    anisotropicBlur?: number;
    distortion?: number;
    distortionScale?: number;
    temporalDistortion?: number;
    transmissionSampler?: boolean;
    backside?: boolean;
    backsideThickness?: number;
    backsideEnvMapIntensity?: number;
    resolution?: number;
    backsideResolution?: number;
    samples?: number;
}

export interface DistortMaterialSettings {
    color?: string;
    distort?: number;
    speed?: number;
    radius?: number;
}

export interface WobbleMaterialSettings {
    color?: string;
    factor?: number;
    speed?: number;
}

export interface DiscardMaterialSettings {
    color?: string;
    discard?: (p: any) => number;
}

export interface PortalMaterialSettings {
    blend?: number;
    resolution?: number;
}

export type AllMaterials = BasicMaterialSettings | StandardMaterialSettings | PhongMaterialSettings | LambertMaterialSettings | PhysicalMaterialSettings | ToonMaterialSettings | NormalMaterialSettings | PointsMaterialSettings | LineMaterialSettings | ShadowMaterialSettings | SpriteMaterialSettings | ShaderSettings;

export type MaterialSettings = AllMaterials & {
    apply?: boolean;
    materialType?: MaterialType;
    materialVariant?: string;
    materialName?: string;
    animations?: AnimationOptions[];
    objectIds?: string[];
};


export {};
