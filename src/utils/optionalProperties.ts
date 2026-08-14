export interface OptionalProperty {
    name: string;
    description: string;
    type: 'number' | 'string' | 'boolean' | 'color' | 'vector3' | 'vector2' | 'select';
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
}

export type EnvironmentType = keyof typeof environmentOptionalProperties;
export const skyOptionalProperties: OptionalProperty[] = [
    {
        name: 'elevation',
        description: 'Height of the sun above the horizon',
        type: 'number',
        min: 0,
        max: 90,
    },
    {
        name: 'azimuth',
        description: 'Compass direction of the sun',
        type: 'number',
        min: 0,
        max: 360,
    },
    {
        name: 'turbidity',
        description: 'Atmospheric haze, affects sky color and sun intensity',
        type: 'number',
        min: 0,
        max: 10,
    },
    {
        name: 'rayleigh',
        description: 'Rayleigh scattering coefficient for blue light',
        type: 'number',
        min: 0,
        max: 4,
        step: 0.1,
    },
    {
        name: 'mieCoefficient',
        description: 'Mie scattering coefficient for particles in atmosphere',
        type: 'number',
        min: 0,
        max: 0.1,
        step: 0.001,
    },
    {
        name: 'mieDirectionalG',
        description: 'Directional intensity of Mie scattering',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    }
];
export const oceanOptionalProperties: OptionalProperty[] = [
    {
        name: 'sunColor',
        description: 'Color of the sun reflection on water',
        type: 'color',
    },
    {
        name: 'waterColor',
        description: 'Base color of the water',
        type: 'color',
    },
    {
        name: 'distortionScale',
        description: 'Intensity of water surface distortion',
        type: 'number',
        min: 0,
        max: 20,
        step: 0.1,
    },
    {
        name: 'waveHeight',
        description: 'Height of the water waves',
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
    },
    {
        name: 'speed',
        description: 'Speed of water movement animation',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
    }
];
export const terrainOptionalProperties: OptionalProperty[] = [
    {
        name: 'displacementScale',
        description: 'Intensity of terrain height displacement',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
    }
];
export const textOptionalProperties: OptionalProperty[] = [
    {
        name: 'text',
        description: 'Text content to display',
        type: 'string',
    },
    {
        name: 'height',
        description: 'Extrusion depth of the 3D text',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'position',
        description: 'Position of the text in 3D space',
        type: 'vector3',
    },
    {
        name: 'scale',
        description: 'Scale of the text object',
        type: 'vector3',
    },
    {
        name: 'bevelSize',
        description: 'Size of the text bevel',
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
    },
    {
        name: 'bevelSegments',
        description: 'Number of bevel segments for smoother edges',
        type: 'number',
        min: 1,
        max: 20,
        step: 1,
    },
    {
        name: 'curveSegments',
        description: 'Number of segments for text curves',
        type: 'number',
        min: 1,
        max: 256,
        step: 1,
    },
    {
        name: 'bevelThickness',
        description: 'Thickness of the text bevel',
        type: 'number',
        min: 0,
        max: 0.1,
        step: 0.001,
    },
    {
        name: 'letterSpacing',
        description: 'Spacing between letters',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    }
];
export const plainOptionalProperties: OptionalProperty[] = [
    {
        name: 'materialType',
        description: 'Type of material for the plane',
        type: 'select',
        options: ['reflector', 'refraction', 'transmission', 'wobble', 'distort', 'standard', 'physical', 'basic', 'lambert', 'phong', 'toon', 'normal', 'matcap'],
    },
    {
        name: 'position',
        description: 'Position of the plane in 3D space',
        type: 'vector3',
    },
    {
        name: 'rotation',
        description: 'Rotation of the plane',
        type: 'vector3',
    },
    {
        name: 'scale',
        description: 'Scale of the plane',
        type: 'vector3',
    },
    {
        name: 'size',
        description: 'Width and height of the plane',
        type: 'vector2',
    },
    {
        name: 'color',
        description: 'Base color of the plane',
        type: 'color',
    },
    {
        name: 'blur',
        description: 'Blur amount for reflective materials',
        type: 'vector2',
    },
    {
        name: 'resolution',
        description: 'Resolution for reflective materials',
        type: 'number',
        min: 256,
        max: 4096,
        step: 256,
    },
    {
        name: 'mixBlur',
        description: 'Mix factor for blur effect',
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
    },
    {
        name: 'mixStrength',
        description: 'Strength of the reflection mix',
        type: 'number',
        min: 0,
        max: 100,
        step: 1,
    },
    {
        name: 'roughness',
        description: 'Surface roughness of the material',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'metalness',
        description: 'Metallic property of the material',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'depthScale',
        description: 'Scale factor for depth-based effects',
        type: 'number',
        min: 0,
        max: 5,
        step: 0.1,
    },
    {
        name: 'minDepthThreshold',
        description: 'Minimum depth threshold for effects',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'maxDepthThreshold',
        description: 'Maximum depth threshold for effects',
        type: 'number',
        min: 0,
        max: 5,
        step: 0.01,
    }
];
export const meshOptionalProperties: OptionalProperty[] = [
    {
        name: 'position',
        description: 'Position of the mesh in 3D space',
        type: 'vector3',
    },
    {
        name: 'rotation',
        description: 'Rotation of the mesh in radians',
        type: 'vector3',
    },
    {
        name: 'scale',
        description: 'Scale factor for each axis',
        type: 'vector3',
    },
    {
        name: 'color',
        description: 'Base color of the mesh material',
        type: 'color',
    },
    {
        name: 'opacity',
        description: 'Transparency of the mesh material',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    }
];
export const rainOptionalProperties: OptionalProperty[] = [
    {
        name: 'color',
        description: 'Color of rain particles',
        type: 'color',
    },
    {
        name: 'size',
        description: 'Size of individual rain particles',
        type: 'number',
        min: 0.01,
        max: 1,
        step: 0.01,
    },
    {
        name: 'opacity',
        description: 'Transparency of rain particles',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'speed',
        description: 'Speed of falling rain',
        type: 'number',
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    {
        name: 'density',
        description: 'Number of rain particles',
        type: 'number',
        min: 10,
        max: 1000,
        step: 10,
    }
];
export const fogOptionalProperties: OptionalProperty[] = [
    {
        name: 'color',
        description: 'Color of the fog',
        type: 'color',
    },
    {
        name: 'near',
        description: 'Distance where fog starts to appear',
        type: 'number',
        min: 0.1,
        max: 100,
        step: 0.1,
    },
    {
        name: 'far',
        description: 'Distance where fog reaches maximum density',
        type: 'number',
        min: 1,
        max: 1000,
        step: 1,
    }
];
export const starsOptionalProperties: OptionalProperty[] = [
    {
        name: 'rotateSpeed',
        description: 'Speed of stars rotation',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
    },
    {
        name: 'count',
        description: 'Number of stars to display',
        type: 'number',
        min: 10,
        max: 1000,
        step: 10,
    },
    {
        name: 'sep',
        description: 'Separation distance between stars',
        type: 'number',
        min: 1,
        max: 20,
        step: 0.1,
    },
    {
        name: 'color',
        description: 'Color of the stars',
        type: 'color',
    },
    {
        name: 'size',
        description: 'Size of individual stars',
        type: 'number',
        min: 0.01,
        max: 1,
        step: 0.01,
    }
];
export const shootingStarsOptionalProperties: OptionalProperty[] = [
    {
        name: 'count',
        description: 'Number of shooting stars active at once',
        type: 'number',
        min: 1,
        max: 50,
        step: 1,
    },
    {
        name: 'speedRange',
        description: 'Min and max speed of shooting stars',
        type: 'vector2',
        min: 0,
        max: 1,
        step: 0.01,
    },
    {
        name: 'lengthRange',
        description: 'Min and max length of shooting star trails',
        type: 'vector2',
        min: 1,
        max: 500,
        step: 1,
    },
    {
        name: 'intervalRange',
        description: 'Min and max seconds between new shooting stars',
        type: 'vector2',
        min: 0.1,
        max: 30,
        step: 0.1,
    },
    {
        name: 'trailLengthRange',
        description: 'Min and max trail fade length',
        type: 'vector2',
        min: 1,
        max: 300,
        step: 1,
    },
    {
        name: 'followMouse',
        description: 'Shooting stars aim toward mouse cursor',
        type: 'boolean',
    },
];
export const hdrOptionalProperties: OptionalProperty[] = [
    {
        name: 'name',
        description: 'HDR environment name',
        type: 'select',
        options: ['apartment', 'city', 'forest', 'dawn', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'],
    },
    {
        name: 'url',
        description: 'Custom HDR environment URL',
        type: 'string',
    }
];
export const cloudsOptionalProperties: OptionalProperty[] = [
    {
        name: 'cloudColor',
        description: 'Color of the clouds',
        type: 'color',
    },
    {
        name: 'lightColor',
        description: 'Color of the lightning',
        type: 'color',
    },
    {
        name: 'speed',
        description: 'Speed of cloud movement',
        type: 'number',
    },
    {
        name: 'scroll',
        description: 'Scroll factor for cloud texture',
        type: 'number',
    }
];
// Export all optional properties as a collection for easy access
export const environmentOptionalProperties = {
    sky: skyOptionalProperties,
    ocean: oceanOptionalProperties,
    terrain: terrainOptionalProperties,
    text: textOptionalProperties,
    plain: plainOptionalProperties,
    mesh: meshOptionalProperties,
    rain: rainOptionalProperties,
    fog: fogOptionalProperties,
    stars: starsOptionalProperties,
    hdr: hdrOptionalProperties,
    clouds: cloudsOptionalProperties
};
