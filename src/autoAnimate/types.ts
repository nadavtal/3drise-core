// =============================================================================
// Auto-animate — shared types. See claude/auto-animate-plan.md.
// =============================================================================
import type { CreatedObjectType } from '../types/scene3d';

export type V3 = [number, number, number];

export interface Bounds {
    min: V3;
    max: V3;
    center: V3;
    size: V3;
    /** Half the diagonal: the radius of a sphere that encloses the box. */
    radius: number;
}

/**
 * What an object is for, animation-wise.
 *   hero        the one object the scene is about (largest / most central / framed)
 *   member      part of a group (siblings, or a spatial cluster of alike objects)
 *   standalone  an ordinary object on its own
 *   container   a group object that holds others (animate it OR its children)
 *   background  huge or ambient things: floors, backdrops, grids, space, effects
 *   light       lights
 */
export type ObjectRole = 'hero' | 'member' | 'standalone' | 'container' | 'background' | 'light';

/** Which property families a recipe may write, as settings paths. */
export interface ObjectCapabilities {
    transform: boolean;
    /** Keyable materialSettings keys (numbers, colours, booleans). */
    material: string[];
    /** Keyable edgesSettings.materialSettings keys (when edges are on). */
    edges: string[];
    /** config.* knobs from the generated registries (lights, particles). */
    config: string[];
    /** Model node names, when measured (a model can be animated node by node). */
    nodes: string[];
    /** Opacity can be faded: the material has an opacity and is transparent. */
    fadeable: boolean;
    /** Has an emissive intensity to pulse. */
    emissive: boolean;
}

export interface ObjectProfile {
    id: string;
    name: string;
    type: CreatedObjectType;
    parentId: string | null;
    childIds: string[];
    /** 0 = top level. */
    depth: number;
    visible: boolean;
    /** Has a real id (not a temp id the save will swap) — only saved objects can be animated. */
    saved: boolean;
    /** Authored local transform. */
    position: V3;
    rotation: V3;
    scale: V3;
    /** World scale of the parent — a world-space offset / this = the local offset. */
    parentScale: V3;
    /** World bounds: measured from the live scene, else estimated from the transform. */
    bounds: Bounds;
    measured: boolean;
    role: ObjectRole;
    groupId: string | null;
    capabilities: ObjectCapabilities;
    /** Hero candidacy score (0 when not a candidate). */
    heroScore: number;
}

export interface GroupProfile {
    id: string;
    /** parent: children of one group object; cluster: alike top-level objects near each other or with the same base name. */
    kind: 'parent' | 'cluster';
    /** The group object (kind 'parent'). */
    parentId: string | null;
    memberIds: string[];
    /** Axis the members spread along most. */
    axis: 'x' | 'y' | 'z';
    /** Members along that axis (a cascade order). */
    order: string[];
    /** Members from the group's centre outward (a radial cascade order). */
    radialOrder: string[];
    bounds: Bounds;
    /** Members share one type. */
    uniformType: boolean;
}

export interface EnvironmentProfile {
    sky: boolean;
    clouds: boolean;
    ocean: boolean;
    terrain: boolean;
    /** Sea level when the ocean is on. */
    seaLevel: number | null;
}

export interface CameraProfile {
    position: V3;
    target: V3;
    fov: number;
    /** Camera → target. */
    distance: number;
}

export interface SceneProfile {
    objects: ObjectProfile[];
    groups: GroupProfile[];
    heroId: string | null;
    environment: EnvironmentProfile;
    camera: CameraProfile;
    /** Bounds of the animatable content (background excluded when there's anything else). */
    bounds: Bounds;
    /** Lowest y objects rest on (content bottom, sea level or 0). */
    ground: number;
    /** Characteristic size — scale every magnitude by this. */
    scale: number;
    countsByType: Partial<Record<CreatedObjectType, number>>;
}

/** What the analyser reads. Plain settings — works in the studio, the viewer and on a server. */
export interface SceneInput {
    objects: any[];
    camera?: any;
    sky?: any;
    clouds?: any;
    ocean?: any;
    terrain?: any;
}

export interface AnalyzeOptions {
    /** Live world bounds of an object (viewer: Box3 of its Object3D), or null when not mounted. */
    measure?: (id: string) => Bounds | null;
    /** Model node names of a model object (viewer), for node-level recipes. */
    nodesOf?: (id: string) => string[];
}
