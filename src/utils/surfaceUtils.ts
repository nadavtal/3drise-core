// =============================================================================
// surfaceUtils — which kind of surface an object actually draws
// =============================================================================
//
// A mesh's display mode does not just change how it looks; it changes what kind
// of Three.js object gets drawn, and therefore which materials can be applied
// to it at all. `ModeGroup` names those three kinds:
//
//   mesh   — a solid <mesh>. Every mesh material applies.
//   points — a <points>. Only the `particles` family applies; a mesh material
//            on a Points object does not render.
//   lines  — segment ribbons. Built as quad meshes (see buildSegmentQuadGeometry),
//            so mesh materials apply to them exactly as they do to edges.
//
// This is the single source of truth for that question, shared by the mesh
// display modes, the `particles` object type and the edges builder, so the
// material picker and the renderers can never disagree about it.
//
import type { CreatedObjectSettings, DisplayMode, EdgesType, ModeGroup } from '../types/scene3d';

/** Display mode → the kind of object it draws. */
export const DISPLAY_MODE_GROUPS: Record<DisplayMode, ModeGroup> = {
    solid: 'mesh',
    volume: 'points',
    surface: 'points',
    symmetric: 'points',
    evenScatter: 'points',
    vertices: 'points',
    // plexus draws a point cloud plus connecting ribbons; the points dominate.
    plexus: 'points',
    edges3d: 'lines',
    profile2d: 'lines',
    wireframe: 'lines',
    contourSlices: 'lines',
};

export function modeGroupOf(mode?: DisplayMode | null): ModeGroup {
    return (mode && DISPLAY_MODE_GROUPS[mode]) || 'mesh';
}

/**
 * Edge decorations follow the same rule: `particles` edges are a Points object,
 * every other edge type is built from meshes.
 */
export function edgesTypeGroupOf(type?: EdgesType | null): ModeGroup {
    return type === 'particles' ? 'points' : 'lines';
}

/** The surface a created object draws, for material-compatibility purposes. */
export function surfaceOf(settings?: Pick<CreatedObjectSettings, 'type' | 'modeConfig'> | null): ModeGroup {
    if (!settings)
        return 'mesh';
    if (settings.type === 'particles')
        return 'points';
    if (settings.type === 'mesh')
        return modeGroupOf(settings.modeConfig?.mode);
    return 'mesh';
}

/**
 * The one hard constraint: a Points object can only take the `particles`
 * family, and that family only renders on a Points object. Everything else is
 * an ordinary mesh material — the `line` family included, which is a material
 * with line-like effects rather than a material for line primitives.
 */
export function materialTypeFitsSurface(materialType: string, surface: ModeGroup): boolean {
    return surface === 'points'
        ? materialType === 'particles'
        : materialType !== 'particles';
}

/** The family to fall back to when the current one cannot draw on a surface. */
export function defaultMaterialTypeForSurface(surface: ModeGroup): string {
    return surface === 'points' ? 'particles' : 'basic';
}
