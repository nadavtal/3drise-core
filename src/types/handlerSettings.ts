export type MouseAxis = 'x' | 'y' | 'both';

export type PropertyType = 'position' | 'rotation' | 'scale' | 'material' | 'custom';

export type MaterialProperty = 'color' | 'opacity' | 'roughness' | 'metalness' | 'emissive';

export type CustomHandlers = {
    onMouseMove?: {
        enabled: boolean;
        properties: Array<{
            property: string;
            propertySettings: Record<string, any>;
        }>;
    };
    onMouseEnter?: {
        enabled: boolean;
        properties: Array<{
            property: string;
            propertySettings: Record<string, any>;
        }>;
    };
    onMouseLeave?: {
        enabled: boolean;
        properties: Array<{
            property: string;
            propertySettings: Record<string, any>;
        }>;
    };
};

export interface PropertyConstraints {
    min: number;
    max: number;
    sensitivity: number;
    axis: MouseAxis;
}

export interface PropertyMapping {
    mouseAxis: MouseAxis;
    sensitivity: number;
    inverted?: boolean;
    curve?: 'linear' | 'exponential' | 'logarithmic';
    constraints?: PropertyConstraints;
}

export interface PropertyHandlerConfig {
    enabled: boolean;
    property: PropertyType;
    subProperty?: MaterialProperty | string;
    mapping: PropertyMapping;
    previewMode?: boolean;
}
export {};
