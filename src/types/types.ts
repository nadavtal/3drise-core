import type { CloudsSettings, EnvironmentState, HdrSettings, OceanSettings, RainSettings, SkySettings, StarsSettings } from "../types/environment";
import type { CameraState, CreatedObjectSettings, GridSettings, QuaternionArray, SceneState, threeJsVector, Vector2Array, Vector3Array } from "../types/scene3d";
import type { FogSettings } from "./environment";
import type { PostProcessingState } from "./postprocessing";
import { Object3D } from "three";
import type { HtmlElement } from "./uiController";
import type { Action } from "./actions";
import type { SceneLightConfig } from "./lights";
import type { AnimationSequence } from "./animations";
import type { CursorModuleConfig } from "./cursor";
import { type ThreeEvent } from "@react-three/fiber";
export type AnimationType = 'tween' | 'keyframe';

export interface CameraConfig {
    position?: threeJsVector;
    fov?: number;
    near?: number;
    far?: number;
    lookAt?: threeJsVector;
}

export interface EnvironmentConfig {
    id?: string;
    hdr?: HdrSettings;
    ocean?: OceanSettings;
    sky?: SkySettings;
    clouds?: CloudsSettings;
    rain?: RainSettings;
    stars?: StarsSettings;
    fog?: FogSettings;
    grid?: GridSettings;
}

export interface SceneConfig {
    scene: SceneState;
    environment: EnvironmentState;
    camera: CameraState;
    onObjectClick?: (object: CreatedObjectSettings, ref: Object3D) => void;
    onObjectHover?: (object: CreatedObjectSettings | null, ref: Object3D) => void;
    onUiElementClick?: (element: HtmlElement) => void;
    onUiElementHover?: (element: HtmlElement | null) => void;
    onSceneInitialized?: () => void;
}

export type UniformType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'bool' | 'sampler2D' | 'samplerCube' | 'mat4';

export interface UniformDefinition {
    name: string;
    type: UniformType;
    defaultValue: string | number | boolean | Vector2Array | Vector3Array | QuaternionArray;
    description?: string;
}

export interface SceneBuilderProps {
    project: ProjectData;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
    className?: string;
    onObjectClick?: (object: CreatedObjectSettings, ref: Object3D, event: ThreeEvent<MouseEvent>) => void;
    onSceneInitialized?: () => void;
    onUiElementClick?: (element: HtmlElement) => void;
    onUiElementHover?: (element: HtmlElement | null) => void;
}

export interface ProjectData {
    settings: Record<string, any>;
    sceneSettingsData: SceneConfig;
    postProcessingData: PostProcessingState;
    lights: SceneLightConfig[];
    camera: CameraState;
    environments: EnvironmentConfig[];
    sceneObjects: CreatedObjectSettings[];
    uiSettings: any;
    actions?: Action[];
    animationSequences?: AnimationSequence[];
    cursor?: CursorModuleConfig;
}

export interface AppFileInfo {
    name: string;
    url: string;
}

export type SelectOptions = {
    value: string;
    label: string;
}[];


export {};
