import type { MaterialSettings } from "./materials";
import type { CustomHandlers } from "./handlerSettings";
import type { GridSettings } from "./scene3d";
import type { MouseMoveInteraction, MouseMoveInteractions, ObjectAnimations } from "./objectSettings";
export interface SkySettings {
    visible: boolean;
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
    elevation: number;
    azimuth: number;
    handlers?: CustomHandlers;
    sunSystem: any;
}

export interface MoonSettings {
    visible: boolean;
    position: [number, number, number];
    scale: number;
    rotation: [number, number, number];
    emissiveIntensity: number;
    orbitRadius?: number;
    enableOrbit?: boolean;
    orbitSpeed?: number;
}

export type WaterConfig = {
    planeSize?: [number, number];
    planeSegments?: number;
};

export interface OceanSettings {
    id: string;
    type: 'ocean';
    parentid?: string;
    meshSettings: {
        visible: boolean;
        position: [number, number, number];
        rotation: [number, number, number];
        scale: [number, number, number];
    };
    config: {
        planeSize?: [number, number];
        planeSegments?: number;
    };
    materialSettings: MaterialSettings;
    animations?: ObjectAnimations;
    /** Per-domain mouse-move interactions (same shape as on CreatedObjectSettings). */
    mouseMove?: MouseMoveInteractions | MouseMoveInteraction;
}

export interface TerrainSettings {
    visible: boolean;
    displacementScale: number;
    handlers?: CustomHandlers;
}

export interface PlainSettings {
    visible: boolean;
    materialType: PlainMaterialType;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    size: [number, number];
    color: string;
    blur: [number, number];
    resolution: number;
    mixBlur: number;
    mixStrength: number;
    roughness: number;
    depthScale: number;
    minDepthThreshold: number;
    maxDepthThreshold: number;
    metalness: number;
    handlers?: CustomHandlers;
}

export interface ModelsSettings {
    visible: boolean;
    colors: {
        Main: string;
        FrameBlack: string;
        Chrome: string;
        BreakDiscs: string;
        GreyElements: string;
        handlers?: CustomHandlers;
    };
}

export interface CloudsMeshSettings {
    name?: string;
    visible: boolean;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    sphereRadius?: number;
    sphereSegments?: number;
}

export interface CloudsConfig {
    speed?: number;
    planeSize?: [number, number];
    planeSegments?: number;
}

export interface CloudsSettings {
    id: string;
    type: 'clouds';
    /** Standard mesh slot — position / scale / rotation animated through the transform domain. */
    meshSettings: CloudsMeshSettings;
    /** Shader uniforms — animated through the material domain. */
    materialSettings: MaterialSettings;
    /** Cloud-specific config (e.g. `speed`) — animated through the `clouds` domain. */
    config: CloudsConfig;
    /** Per-domain keyframe animations (same shape as on CreatedObjectSettings). */
    animations?: ObjectAnimations;
    /** Per-domain mouse-move interactions (same shape as on CreatedObjectSettings). */
    mouseMove?: MouseMoveInteractions;
    /** @deprecated Use `mouseMove` (per-domain). Runtime falls back to this for back-compat. */
    handlers?: CustomHandlers;
}

export interface RainConfig {
    color: string;
    size: number;
    opacity?: number;
    speed?: number;
    density?: number;
    windStrength?: number;
    windDirection?: number;
    turbulence?: number;
    splash?: boolean;
}

export interface RainSettings {
    id: string;
    type: 'rain';
    parentid?: string;
    meshSettings: {
        name: string;
        visible: boolean;
        position: [number, number, number];
        rotation: [number, number, number];
        scale: [number, number, number];
    };
    config: RainConfig;
    animations?: ObjectAnimations;
    /** Per-domain mouse-move interactions (same shape as on CreatedObjectSettings). */
    mouseMove?: MouseMoveInteractions | MouseMoveInteraction;
}

export type ShootingStarsSettings = {
    enabled: boolean;
    count: number;
    speedRange: [number, number];
    lengthRange: [number, number];
    intervalRange: [number, number];
    trailLengthRange?: [number, number];
    followMouse?: boolean;
    color: string;
};

export type StarsConfig = {
    rotateSpeed: number;
    count: number;
    sep?: number;
    color: string;
    opacity?: number;
    size?: number;
};

export interface StarsSettings {
    id: string;
    type: 'stars';
    parentid?: string;
    meshSettings: {
        name: string;
        visible: boolean;
        position: [number, number, number];
        rotation: [number, number, number];
        scale: [number, number, number];
    };
    config: StarsConfig;
    animations?: ObjectAnimations;
    /** Per-domain mouse-move interactions (same shape as on CreatedObjectSettings). */
    mouseMove?: MouseMoveInteractions | MouseMoveInteraction;
}

export interface FogSettings {
    visible: boolean;
    color: string;
    near: number;
    far: number;
    handlers?: CustomHandlers;
}

export interface BirdsSettings {
    /** Unique identifier for this bird flock */
    id: string;
    /** Display name for the flock */
    name: string;
    /** Whether this flock is visible */
    visible: boolean;
    /** Number of birds in the flock */
    count: number;
    /** Bounding area size for birds to fly within */
    bounds: number;
    /** Maximum speed limit for birds */
    speedLimit: number;
    /** Separation distance - birds move apart for comfort */
    separation: number;
    /** Alignment distance - birds fly in same direction */
    alignment: number;
    /** Cohesion distance - birds move closer together */
    cohesion: number;
    /** Freedom factor for random movement */
    freedom: number;
    /** Bird scale multiplier */
    scale: number;
    /** Wing span of birds */
    wingSpan: number;
    /** Bird body color */
    color: string;
    /** Position offset for the entire flock */
    position: [number, number, number];
    /** Custom event handlers */
    handlers?: CustomHandlers;
}

export type HdrTransitionType = 'crossfade' | 'wipe' | 'iris' | 'dissolve' | 'vertical-divider' | 'horizontal-divider';

export type HdrTransitionOrder = 'sequential' | 'yoyo' | 'random';

export interface HdrTransitionSettings {
    /** One or more effects. Each transition leg picks the next one (cycles). */
    types: HdrTransitionType[];
    durationMs: number;
    holdMs: number;
    order: HdrTransitionOrder;
    feather?: number;
    dividerFeather?: number;
    wipeAxis?: [number, number, number];
    irisCenter?: [number, number, number];
    noiseScale?: number;
}

export interface HdrSettings {
    visible: boolean;
    name: BackgroundName | null;
    urls?: string[];
    transitionSettings?: HdrTransitionSettings;
    settings: {
        groundRadius: number;
        groundHeight: number;
        groundScale: number;
        frames?: number;
        near?: number;
        far?: number;
        resolution?: number;
        background?: boolean | 'only';
        blur?: number;
        backgroundBlurriness?: number;
        backgroundIntensity?: number;
        backgroundRotation?: number;
        environmentIntensity?: number;
        environmentRotation?: number;
    };
}

export interface EnvironmentState {
    currentPreset: EnvironmentPreset;
    sky: SkySettings;
    ocean: OceanSettings;
    clouds: CloudsSettings;
    rain: RainSettings;
    fog: FogSettings;
    stars: StarsSettings;
    hdr: HdrSettings;
    grid: GridSettings;
}

export type EnvironmentPreset = "Initial" | "Sunset" | "Day" | "Night";

export type BackgroundName = "apartment" | "city" | "forest" | "dawn" | "lobby" | "night" | "park" | "studio" | "sunset" | "warehouse";

export type PlainMaterialType = 'reflector' | 'refraction' | 'transmission' | 'wobble' | 'distort' | 'standard' | 'physical' | 'basic' | 'lambert' | 'phong' | 'toon' | 'normal' | 'matcap';


export const defaultMoonSettings: MoonSettings = {
    visible: true,
    position: [0, 5, 0],
    scale: 3,
    rotation: [0, 0, 0.5],
    emissiveIntensity: 0.3,
    orbitRadius: 250,
    enableOrbit: false,
    orbitSpeed: 0.1,
};
