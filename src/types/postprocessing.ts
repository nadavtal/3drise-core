export type PostProcessingType = 'bloom' | 'depth-of-field' | 'motion-blur' | 'chromatic-aberration' | 'vignette' | 'noise' | 'glitch' | 'outline' | 'sepia' | 'color-correction' | 'ssao' | 'ssr' | 'god-rays';

export type ToneMappingType = 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces-filmic';

export interface PostProcessingState {
    effects: PostProcessingSetting[];
    toneMapping: ToneMappingSettings;
    globalEnabled: boolean;
}

export interface BasePostProcessingSetting {
    id: string;
    enabled: boolean;
    name: string;
    type: PostProcessingType;
    order: number;
}

export interface BloomSettings {
    intensity: number;
    threshold: number;
    radius: number;
}

export interface DepthOfFieldSettings {
    focusDistance: number;
    bokehScale: number;
    aperture: number;
}

export interface MotionBlurSettings {
    samples: number;
    intensity: number;
}

export interface ChromaticAberrationSettings {
    offset: number;
}

export interface VignetteSettings {
    offset: number;
    darkness: number;
}

export interface NoiseSettings {
    intensity: number;
}

export interface GlitchSettings {
    intensity: number;
    columns: number;
}

export interface OutlineSettings {
    thickness: number;
    color: string;
}

export interface SepiaSettings {
    intensity: number;
}

export interface ColorCorrectionSettings {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
}

export interface SSAOSettings {
    radius: number;
    intensity: number;
    bias: number;
}

export interface SSRSettings {
    intensity: number;
    roughnessFade: number;
}

export interface GodRaysSettings {
    intensity: number;
    decay: number;
    density: number;
}

export interface BloomPostProcessingSetting extends BasePostProcessingSetting {
    type: 'bloom';
    settings: BloomSettings;
}

export interface DepthOfFieldPostProcessingSetting extends BasePostProcessingSetting {
    type: 'depth-of-field';
    settings: DepthOfFieldSettings;
}

export interface MotionBlurPostProcessingSetting extends BasePostProcessingSetting {
    type: 'motion-blur';
    settings: MotionBlurSettings;
}

export interface ChromaticAberrationPostProcessingSetting extends BasePostProcessingSetting {
    type: 'chromatic-aberration';
    settings: ChromaticAberrationSettings;
}

export interface VignettePostProcessingSetting extends BasePostProcessingSetting {
    type: 'vignette';
    settings: VignetteSettings;
}

export interface NoisePostProcessingSetting extends BasePostProcessingSetting {
    type: 'noise';
    settings: NoiseSettings;
}

export interface GlitchPostProcessingSetting extends BasePostProcessingSetting {
    type: 'glitch';
    settings: GlitchSettings;
}

export interface OutlinePostProcessingSetting extends BasePostProcessingSetting {
    type: 'outline';
    settings: OutlineSettings;
}

export interface SepiaPostProcessingSetting extends BasePostProcessingSetting {
    type: 'sepia';
    settings: SepiaSettings;
}

export interface ColorCorrectionPostProcessingSetting extends BasePostProcessingSetting {
    type: 'color-correction';
    settings: ColorCorrectionSettings;
}

export interface SSAOPostProcessingSetting extends BasePostProcessingSetting {
    type: 'ssao';
    settings: SSAOSettings;
}

export interface SSRPostProcessingSetting extends BasePostProcessingSetting {
    type: 'ssr';
    settings: SSRSettings;
}

export interface GodRaysPostProcessingSetting extends BasePostProcessingSetting {
    type: 'god-rays';
    settings: GodRaysSettings;
}

export type PostProcessingSetting = BloomPostProcessingSetting | DepthOfFieldPostProcessingSetting | MotionBlurPostProcessingSetting | ChromaticAberrationPostProcessingSetting | VignettePostProcessingSetting | NoisePostProcessingSetting | GlitchPostProcessingSetting | OutlinePostProcessingSetting | SepiaPostProcessingSetting | ColorCorrectionPostProcessingSetting | SSAOPostProcessingSetting | SSRPostProcessingSetting | GodRaysPostProcessingSetting;

export interface PostProcessingEffectDefinition {
    name: string;
    description: string;
    component: string;
    defaultSettings: any;
    category: 'basic' | 'advanced' | 'artistic' | 'technical';
}

export interface ToneMappingSettings {
    type: ToneMappingType;
    exposure: number;
}

export interface PostProcessingController {
    settings: PostProcessingSetting[];
    updateSettings: (newSettings: PostProcessingSetting[]) => void;
    resetToDefaults: () => void;
    applyPreset: (presetName: string) => void;
}
export {};
