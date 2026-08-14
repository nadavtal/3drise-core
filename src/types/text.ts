import type { CreatedObjectSettings } from "./scene3d";
export type TextEffectType = 'typewriter' | 'neon' | 'shadow' | 'gradient' | 'glow';

export interface TextEffectOptions {
    colors?: string[];
    angle?: number;
    glowColor?: string;
    glowIntensity?: number;
    shadowColor?: string;
    shadowOffset?: [number, number];
    shadowBlur?: number;
    delay?: number;
    loop?: boolean;
    cursor?: boolean;
    cursorChar?: string;
    outlineColor?: string;
    outlineWidth?: number;
}

export interface TextEffect {
    type: TextEffectType;
    enabled: boolean;
    speed?: number;
    intensity?: number;
    options?: TextEffectOptions;
}

export type TextConfigBase = {
    text: string;
    font?: string;
    renderMode?: 'text3d' | 'bitmap';
};

export type Text3DConfig = TextConfigBase & {
    renderMode: 'text3d';
    size?: number;
    height?: number;
    curveSegments?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
    letterSpacing?: number;
};

export type Text2DConfig = TextConfigBase & {
    renderMode: 'bitmap';
    fontSize?: number;
    maxWidth?: number;
    lineHeight?: number;
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    anchorX?: number | 'left' | 'center' | 'right';
    anchorY?: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom';
    direction?: 'ltr' | 'rtl';
    overflowWrap?: 'normal' | 'break-word';
    whiteSpace?: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line';
    outlineWidth?: number;
    outlineColor?: string;
    outlineBlur?: number;
    outlineOffsetX?: number;
    outlineOffsetY?: number;
    outlineOpacity?: number;
    strokeWidth?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    fillOpacity?: number;
    depthOffset?: number;
    clipRect?: [number, number, number, number];
    sdfGlyphSize?: number;
    gpuAccelerateSDF?: boolean;
};

export type TextConfig = Text2DConfig | Text3DConfig;

export type TextSettings = CreatedObjectSettings & {
    config: TextConfig;
};


export {};
