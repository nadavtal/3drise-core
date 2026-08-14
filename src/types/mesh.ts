import type { AnchorSettings, threeJsVector, GeometryType, Vector3Array } from "./scene3d";
export interface AnimatedTransform {
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
    targetPosition?: [number, number, number];
    targetScale?: [number, number, number];
    targetRotation?: [number, number, number];
}

export type TransformSettings = {
    position: Vector3Array;
    rotation: Vector3Array;
    scale: Vector3Array;
    anchor?: AnchorSettings | null;
};

export type MeshSettings = TransformSettings & {
    visible: boolean;
    id: string;
    name: string;
};

export type BaseMeshOptions = MeshSettings & {
    type?: GeometryType;
    castShadow?: boolean;
    receiveShadow?: boolean;
};

export type ModelData = BaseMeshOptions & {
    url: string;
};

export type BoxOptions = {
    size: threeJsVector;
};

export interface PointOptions extends BaseMeshOptions {
    x?: number;
    y?: number;
    z?: number;
    size?: number;
    animate?: boolean;
    originalY?: number;
    segments?: number;
}

export interface SphereOptions extends BaseMeshOptions {
    radius?: number;
    segments?: number;
    rings?: number;
}

export interface CylinderOptions extends BaseMeshOptions {
    radiusTop?: number;
    radiusBottom?: number;
    height?: number;
    radialSegments?: number;
    heightSegments?: number;
    openEnded?: boolean;
    thetaStart?: number;
    thetaLength?: number;
}

export interface ConeOptions extends BaseMeshOptions {
    radius?: number;
    height?: number;
    radialSegments?: number;
    heightSegments?: number;
    openEnded?: boolean;
    thetaStart?: number;
    thetaLength?: number;
}

export interface TorusOptions extends BaseMeshOptions {
    radius?: number;
    tube?: number;
    radialSegments?: number;
    tubularSegments?: number;
    arc?: number;
}

export interface PlaneOptions extends BaseMeshOptions {
    scale: Vector3Array;
    widthSegments?: number;
    heightSegments?: number;
}

export interface RingOptions extends BaseMeshOptions {
    innerRadius?: number;
    outerRadius?: number;
    thetaSegments?: number;
    phiSegments?: number;
    thetaStart?: number;
    thetaLength?: number;
}

export interface ArcPlaneOptions extends BaseMeshOptions {
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    width?: number;
    segments?: number;
}

export interface BentPlaneOptions extends BaseMeshOptions {
    width?: number;
    height?: number;
    radius?: number;
    arc?: number;
    widthSegments?: number;
    heightSegments?: number;
}

export interface IcosahedronOptions extends BaseMeshOptions {
    radius?: number;
    detail?: number;
}

export interface OctahedronOptions extends BaseMeshOptions {
    radius?: number;
    detail?: number;
}

export interface TetrahedronOptions extends BaseMeshOptions {
    radius?: number;
    detail?: number;
}

export interface DodecahedronOptions extends BaseMeshOptions {
    radius?: number;
    detail?: number;
}

export interface CapsuleOptions extends BaseMeshOptions {
    radius?: number;
    length?: number;
    capSegments?: number;
    radialSegments?: number;
}

export interface TextOptions extends BaseMeshOptions {
    text: string;
    size?: number;
    height?: number;
    curveSegments?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
    font?: any;
}

export interface CustomMeshOptions extends BaseMeshOptions {
    vertices: number[];
    indices?: number[];
    normals?: number[];
    uvs?: number[];
    colors?: number[];
}

export interface GridOptions extends BaseMeshOptions {
    size?: number;
    divisions?: number;
    colorCenterLine?: string;
    colorGrid?: string;
}

export type MeshGeometryConfig = ({
    type: 'box';
} & BoxOptions) | ({
    type: 'sphere';
} & Omit<SphereOptions, keyof BaseMeshOptions>) | ({
    type: 'cylinder';
} & Omit<CylinderOptions, keyof BaseMeshOptions>) | ({
    type: 'cone';
} & Omit<ConeOptions, keyof BaseMeshOptions>) | ({
    type: 'torus';
} & Omit<TorusOptions, keyof BaseMeshOptions>) | ({
    type: 'plane';
    width: number;
    height: number;
    widthSegments: number;
    heightSegments: number;
}) | ({
    type: 'ring';
} & Omit<RingOptions, keyof BaseMeshOptions>) | ({
    type: 'arc';
} & Omit<ArcPlaneOptions, keyof BaseMeshOptions>) | ({
    type: 'bentPlane';
} & Omit<BentPlaneOptions, keyof BaseMeshOptions>) | ({
    type: 'bentPlaneInverse';
} & Omit<BentPlaneInverseOptions, keyof BaseMeshOptions>) | ({
    type: 'capsule';
} & Omit<CapsuleOptions, keyof BaseMeshOptions>) | ({
    type: 'icosahedron';
} & Omit<IcosahedronOptions, keyof BaseMeshOptions>) | ({
    type: 'octahedron';
} & Omit<OctahedronOptions, keyof BaseMeshOptions>) | ({
    type: 'tetrahedron';
} & Omit<TetrahedronOptions, keyof BaseMeshOptions>) | ({
    type: 'dodecahedron';
} & Omit<DodecahedronOptions, keyof BaseMeshOptions>) | ({
    type: 'text';
} & Omit<TextOptions, keyof BaseMeshOptions>) | ({
    type: 'point';
} & Omit<PointOptions, keyof BaseMeshOptions>) | ({
    type: 'grid';
} & Omit<GridOptions, keyof BaseMeshOptions>) | ({
    type: 'custom';
} & Omit<CustomMeshOptions, keyof BaseMeshOptions>);

export type BentPlaneInverseOptions = BentPlaneOptions;

export interface AnimatedTransform {
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
    targetPosition?: [number, number, number];
    targetScale?: [number, number, number];
    targetRotation?: [number, number, number];
}


export {};
