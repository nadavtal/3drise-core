import type { BaseMeshOptions, MeshSettings, ModelData } from "./mesh";
import type { MaterialSettings } from "./materials";
import { Object3D } from "three";
import type { ParticledConfig } from "./particles";
import type { OperationTypes } from "./actions";
import type { RigidBodyTypeString } from "@react-three/rapier";
import type { TextConfig } from "./text";
import type { EffectTriggerMode } from "./effects";
import type { PathConfig } from "./animations";
import type { LightObjectConfig } from "./lights";
import type { Interaction, MouseMoveInteraction, MouseMoveInteractions, ObjectAnimations } from "./objectSettings";
import type { GenerativeEffectConfig, GenerativeEffectSettings, BubblesConfig, GlyphsConfig, SparklesBurstConfig } from "./generativeEffects";
import { GalleryLayoutSettings } from "./gallery";
import type { CloudsConfig, MoonSettings, RainConfig, WaterConfig } from "./environment";
export type FrameClickHandler = {
    enabled: boolean;
    type: OperationTypes;
    settings?: Record<string, any>;
};

export interface ImageAsset {
    id: string;
    url: string;
    name?: string;
    type?: string;
    dimensions?: {
        width: number;
        height: number;
    };
}

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export type Vector2Array = [number, number];

export type Vector3Array = [number, number, number];

export type QuaternionArray = [number, number, number, number];

export type threeJsVector = Vector3Array | QuaternionArray | Vector2Array;

export interface CameraPosition extends Vector3 {
}

export interface DeviceInfo {
    type: 'mobile' | 'tablet' | 'desktop';
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

export interface OrientationInfo {
    type: 'portrait' | 'landscape';
    angle: number;
}

export interface Position {
    x: number;
    y: number;
    z: number;
}

export interface Orientation {
    x: number;
    y: number;
    z: number;
    w?: number;
}

export interface GeometryConfig {
    type: 'box' | 'sphere' | 'plane' | 'cylinder' | 'cone';
    args?: number[];
}

export type AnchorPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface AnchorOffset {
    x?: number;
    y?: number;
    z?: number;
}

export type AnchorSettings = {
    enabled: boolean;
    anchor: AnchorPosition;
    fixedPosition?: boolean;
    fixedSize?: boolean;
    fixedRotation?: boolean;
    offset?: AnchorOffset;
    padding?: number;
};

export type PageTemplateId = string;

export type BaseMeshData = BaseMeshOptions;

export interface RequiredMeshOptions extends BaseMeshOptions {
    id: string;
    name: string;
    type: GeometryType;
}

export type HoverEffectType = 'none' | 'color' | 'scale' | 'flip' | 'spin';

export interface GeneralEffectsState {
    wave: {
        enabled: boolean;
        intensity: number;
        frequency: number;
        speed: number;
        direction: 'horizontal' | 'vertical' | 'diagonal';
    };
    vortex: {
        enabled: boolean;
        intensity: number;
        speed: number;
        centerX: number;
        centerY: number;
    };
    ripple: {
        enabled: boolean;
        intensity: number;
        speed: number;
        centerX: number;
        centerY: number;
    };
    grayscale: {
        enabled: boolean;
        mode: 'static' | 'wave' | 'pulse' | 'ripple';
        intensity: number;
        contrast: number;
        brightness: number;
        waveFrequency: number;
        waveSpeed: number;
        waveDirection: 'horizontal' | 'vertical' | 'diagonal';
        pulseSpeed: number;
        rippleSpeed: number;
        rippleCenterX: number;
        rippleCenterY: number;
    };
}

export type HoverSettings = {
    sensitivity: number;
    applyToChildren: boolean;
};

export type CreatedRef = {
    id: string;
    name: string;
    object: Object3D;
};

export type EdgesType = 'line' | 'tube' | 'cube' | 'particles';

export type ObjectEdges = {
    enabled: boolean;
    type: EdgesType;
    tubeRadius?: number;
    cubeSize?: number;
    materialSettings: MaterialSettings;
};

export type CreatedObjectType = 'mesh' | 'model' | 'text' | 'group' | 'custom_primitive' | 'particles' | 'grid' | 'path' | 'gallery' | 'effect' | 'light' | 'clouds' | 'rain' | 'fog' | 'stars' | 'water' | 'solarSystem' | 'shootingStars' | 'earth';

export type ShapeName = 'heart' | 'box' | 'star' | 'polygon' | 'gear' | 'flower' | 'spade' | 'club' | 'diamond' | 'droplet' | 'lightning' | 'sparkle' | 'shield' | 'pawPrint' | 'superformula' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'ring' | 'arcPlane' | 'bentPlane' | 'bentPlaneInverse' | 'capsule' | 'icosahedron' | 'octahedron' | 'tetrahedron' | 'dodecahedron' | 'text' | 'point' | 'custom' | 'infinity';

export interface GeometryShapeConfig {
    type: ShapeName;
    curveSegments?: number;
    subdivisions?: number;
    segments?: number;
    rings?: number;
    points?: number;
    sides?: number;
    petals?: number;
    teeth?: number;
    bumps?: number;
    widthSegments?: number;
    heightSegments?: number;
    radialSegments?: number;
    tubularSegments?: number;
    thetaSegments?: number;
    phiSegments?: number;
    capSegments?: number;
    detail?: number;
    outer?: number;
    inner?: number;
    hole?: number;
    radiusTop?: number;
    radiusBottom?: number;
    innerRadius?: number;
    outerRadius?: number;
    width?: number;
    height?: number;
    radius?: number;
    length?: number;
    arc?: number;
    startAngle?: number;
    endAngle?: number;
    tube?: number;
    size?: number;
    text?: string;
    vertices?: number[];
    indices?: number[];
    normals?: number[];
    uvs?: number[];
    offset?: number;
    taper?: number;
    tail?: number;
    vein?: boolean;
    sharp?: number;
    bevelThickness?: number;
    bevelSize?: number;
    bevelSegments?: number;
    symmetry?: number;
    roundness?: number;
    twist1?: number;
    twist2?: number;
    stretchX?: number;
    stretchY?: number;
    samples?: number;
    waist?: number;
    thickness?: number;
}

export type ModeGroup = 'mesh' | 'points' | 'lines';

export type DisplayMode = 'solid' | 'volume' | 'surface' | 'symmetric' | 'evenScatter' | 'vertices' | 'edges3d' | 'profile2d' | 'wireframe' | 'contourSlices' | 'plexus';

export interface ModeConfig {
    mode: DisplayMode;
    count: number;
    symmetry: number;
    spacing: number;
    slices: number;
    linkRadius: number;
    angle: number;
    lineWidth: number;
}

export type CreatedObjectConfig = GridConfig | TextConfig | PathConfig | ParticledConfig | GenerativeEffectConfig | GalleryLayoutSettings | LightObjectConfig | CloudsConfig | GeometryShapeConfig | RainConfig | WaterConfig | BubblesConfig | GlyphsConfig | SparklesBurstConfig | MoonSettings;

export type GeneralObjectSettings = {
    meshSettings: ModelData | BaseMeshOptions | MeshSettings;
    materialSettings: MaterialSettings;
    rigidBodySettings?: RigidBodySettings;
    edgesSettings?: ObjectEdges;
    effects?: GenerativeEffectSettings[];
    /** Continuous effects - always running (animations, transform, color) */
    animations?: ObjectAnimations;
    /** Click / hover action interactions */
    actions?: Interaction[];
    /** Continuous mouse-move property tracking (per-domain shape). The legacy flat
     *  MouseMoveInteraction shape is read transparently by the runtime hook for
     *  back-compat with persisted projects. */
    mouseMove?: MouseMoveInteractions | MouseMoveInteraction;
};

export type CreatedObjectSettings = GeneralObjectSettings & {
    id: string;
    name: string;
    type: CreatedObjectType;
    parentId?: string | null;
    userData?: Record<string, any>;
    isDirty?: boolean;
    config?: CreatedObjectConfig;
    modeConfig?: ModeConfig;
    isTemplate?: boolean;
};

export type WaterSettings = CreatedObjectSettings & {
    type: 'water';
    materialSettings: MaterialSettings & {
        materialType: 'water';
    };
    config: WaterConfig;
};

export type SceneDataType = 'scene' | 'ui' | 'text' | 'project' | 'presets' | 'sky' | 'ocean' | 'mesh' | 'model' | 'clouds' | 'rain' | 'fog' | 'stars' | 'hdr';

export type GeometryType = 'none' | 'heart' | 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'ring' | 'arc' | 'bentPlane' | 'bentPlaneInverse' | 'icosahedron' | 'octahedron' | 'tetrahedron' | 'dodecahedron' | 'capsule' | 'text' | 'custom' | 'grid' | 'point' | 'heart';

export interface AnimationOptions {
    triggerMode?: EffectTriggerMode;
    property: string;
    pathId?: string;
    to: threeJsVector | string | number;
    duration: number;
    type?: 'tween' | 'keyframe';
    from?: any;
    delay?: number;
    ease?: string;
    loop?: boolean;
    yoyo?: boolean;
    active?: boolean;
    /** Whether to apply rotation to face movement direction when following a path (default: true) */
    applyRotation?: boolean;
    /** Position offset to add when following a path [x, y, z] */
    offset?: Vector3Array;
    /** Whether to preserve the object's original position/rotation relative to the path (default: false) */
    keepOriginalTransform?: boolean;
    /** IDs of child objects to animate (if empty/undefined, animates parent object) */
    objectIds?: string[];
    onStart?: () => void;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
}

export interface InstancedMeshOptions extends BaseMeshOptions {
    count: number;
    instanceMatrix?: Float32Array;
    instanceColor?: Float32Array;
    frustumCulled?: boolean;
}

export interface LODMeshOptions extends BaseMeshOptions {
    levels: Array<{
        geometry: GeometryType;
        distance: number;
        options?: BaseMeshOptions;
    }>;
}

export type GridConfig = {
    cellSize: number;
    cellThickness: number;
    cellColor: string;
    sectionSize: number;
    sectionThickness: number;
    sectionColor: string;
    followCamera: boolean;
    fadeDistance: number;
    fadeStrength: number;
    fadeFrom: number;
    side: number;
};

export type GridSettings = GridConfig & {
    visible: boolean;
    position: Vector3Array;
    rotation: Vector3Array;
};

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ExecuteInteractionParams {
    interaction: Interaction;
    ref: Object3D;
    createdObject: CreatedObjectSettings;
}

export interface MeshCollection {
    [key: string]: CreatedRef[];
}

export interface MeshCollectionByType {
    points: CreatedRef[];
    boxes: CreatedRef[];
    spheres: CreatedRef[];
    cylinders: CreatedRef[];
    cones: CreatedRef[];
    torus: CreatedRef[];
    planes: CreatedRef[];
    grids: CreatedRef[];
    models: CreatedRef[];
    custom: CreatedRef[];
}

export interface PhysicsSettings {
    enabled?: boolean;
    gravity?: Vector3Array;
    paused?: boolean;
    debug?: boolean;
}

export interface RigidBodySettings {
    enabled?: boolean;
    type?: RigidBodyTypeString;
    mass?: number;
    friction?: number;
    restitution?: number;
    gravityScale?: number;
    linearDamping?: number;
    angularDamping?: number;
    linearVelocity?: Vector3Array;
    angularVelocity?: Vector3Array;
    collisionGroup?: number;
    collisionMask?: number;
    lockRotation?: boolean | [boolean, boolean, boolean];
    lockPosition?: boolean | [boolean, boolean, boolean];
    sensor?: boolean;
    ccd?: boolean;
}

export interface ShaderMaterialOptions {
    uniforms?: {
        [uniform: string]: any;
    };
    vertexShader?: string;
    fragmentShader?: string;
    transparent?: boolean;
    depthTest?: boolean;
    depthWrite?: boolean;
    side?: 'front' | 'back' | 'double';
}

export interface TextureOptions {
    url?: string;
    repeat?: [number, number];
    offset?: [number, number];
    rotation?: number;
    center?: [number, number];
    flipY?: boolean;
    encoding?: number;
    format?: number;
    type?: number;
    anisotropy?: number;
    generateMipmaps?: boolean;
    wrapS?: number;
    wrapT?: number;
    magFilter?: number;
    minFilter?: number;
}

export interface EnvironmentOptions {
    type?: 'skybox' | 'equirectangular' | 'cubemap';
    textures?: string[] | string;
    intensity?: number;
    background?: boolean;
    environment?: boolean;
}

export type ModelAnalysis = {
    interactibles: any[];
    meshes: number;
    materials: number;
    textures: number;
    unNamedMeshes: number;
};

export type ImageAnalysis = {
    name: string;
    url: string;
};

export type NodeUserData = {
    name: string;
    data?: Record<string, any>;
    images?: string[];
    images360?: string[];
};

export interface TimeSettings {
    enabled: boolean;
    timeOfDay: number;
    timescale: number;
    autoAnimate: boolean;
    syncWithRealTime: boolean;
}

export interface CanvasConfig {
    shadows?: boolean;
    backgroundColor?: string;
    antialias?: boolean;
    dpr?: number | [number, number];
    gl?: {
        antialias?: boolean;
        alpha?: boolean;
        powerPreference?: 'default' | 'high-performance' | 'low-power';
        preserveDrawingBuffer?: boolean;
    };
}

export interface ControlsConfig {
    enabled?: boolean;
    enableZoom?: boolean;
    enablePan?: boolean;
    enableRotate?: boolean;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    target: Vector3Array;
    zoomSpeed?: number;
    panSpeed?: number;
    rotateSpeed?: number;
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    minAzimuthAngle?: number;
    maxAzimuthAngle?: number;
}

export type SceneSettings = {
    generalObjectSettings: GeneralObjectSettings;
    canvas: CanvasConfig;
    physicsSettings: PhysicsSettings;
    timeSettings: TimeSettings;
};

export interface SceneState {
    sceneSettings: SceneSettings;
    objectSettings: CreatedObjectSettings[];
    selectedObjectIds: string[];
    minScene: {
        active: boolean;
        show: boolean;
    };
}

export type CameraView = {
    position: Vector3Array;
    orientation: QuaternionArray;
    fov: number;
    near: number;
    far: number;
    controls: ControlsConfig;
};

export interface CameraState {
    position: Vector3Array;
    orientation: QuaternionArray;
    fov: number;
    near: number;
    far: number;
    animations: AnimationOptions[];
    mouseMove: MouseMoveInteraction;
    controls: ControlsConfig;
    views?: CameraView[];
}

export interface PathMaterialSettings {
    time: number;
    color: {
        r: number;
        g: number;
        b: number;
    };
    rippleRadius: number;
    animationProgress: number;
}

export interface PathTransformSettings {
    position: Vector3Array;
    rotation: Vector3Array;
    scale: Vector3Array;
}

export interface PathTubeSettings {
    tubeRadius: number;
    tubeSegments: number;
    radialSegments: number;
    closed: boolean;
}

export type ProductionSceneProps = {
    children?: React.ReactNode;
    physicsSettings: PhysicsSettings;
};


// React Three Fiber and 3D Scene Type Definitions
;
export {};
