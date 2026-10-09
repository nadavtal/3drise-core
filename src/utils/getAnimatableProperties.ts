import type { MouseMoveInteraction, MouseMoveInteractions, ObjectAnimations } from "../types/objectSettings";
import { getAnimatableSpecs, getPropertySpecs } from "../properties/registry";
import type { PropertyKind, PropertySpec } from "../properties/types";

export type AnimatableDomain = 'transform' | 'material' | 'edges' | 'light' | 'clouds' | 'rain' | 'particles' | 'effect' | 'grid' | 'environment' | 'space' | 'land' | 'text' | 'sky' | 'ocean' | 'terrain';

export interface AnimatableProperty {
    value: string;
    label: string;
    /** From the property registry: value kind and bounds (mouse-move seeds its range from these). */
    kind?: PropertyKind;
    min?: number;
    max?: number;
    step?: number;
}

export interface AnimatableTarget {
    id?: string;
    type?: string;
    meshSettings?: Record<string, any>;
    materialSettings?: Record<string, any>;
    edgesSettings?: {
        enabled?: boolean;
        type?: 'tube' | 'cube';
        materialSettings?: Record<string, any>;
    };
    config?: ({
        type?: string;
    } & Record<string, any>);
    animations?: ObjectAnimations;
    mouseMove?: MouseMoveInteractions | MouseMoveInteraction;
}

// =============================================================================
// getAnimatableProperties — per-domain view of the property registry
// =============================================================================
//
// What the keyframe Animation tab, the MouseMove tab and analyzeScene can drive on
// one domain of an object. Since the property registry (src/properties) this is a
// filter over getAnimatableSpecs: the animatable rule lives there, once, for the
// timeline, mouse-move, the AI scene analysis and the controllers alike.
//
// Values are domain-relative names ('position', 'roughness', 'intensity'), which is
// what the mouse-move / keyframe domains store.
//
// Transform keeps its three vectors: `visible` is a timeline step track, not
// something a pointer or a keyframe tween can drive.
//
// =============================================================================

/** camelCase / kebab-ish → "Title Case". */
export function toAnimatableLabel(key: string): string {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
}

const toAnimatable = (s: PropertySpec): AnimatableProperty => {
    const out: AnimatableProperty = { value: s.name, label: s.label, kind: s.kind };
    if (s.min !== undefined) out.min = s.min;
    if (s.max !== undefined) out.max = s.max;
    if (s.step !== undefined) out.step = s.step;
    return out;
};

export function getAnimatableProperties(settings: AnimatableTarget, domain: AnimatableDomain): AnimatableProperty[] {
    if (!settings) return [];
    return getAnimatableSpecs('object', settings)
        .filter(s => s.domain === domain)
        .filter(s => domain !== 'transform' || s.kind === 'vec3')
        .map(toAnimatable);
}

/** Domain priority when a name exists in more than one (edges before material: an edges key shadows the mesh's). */
const DETECT_ORDER: AnimatableDomain[] = ['edges', 'light', 'effect', 'grid', 'environment', 'space', 'land', 'text', 'particles', 'clouds', 'rain', 'sky', 'ocean', 'terrain', 'material'];

/**
 * Detect which domain a property name belongs to, for a given target. Used by
 * the runtime + UI to migrate flat MouseMove arrays into the new per-domain
 * shape, and to route the runtime's combined dispatch.
 *
 * Reads every registry property (not only animatable ones), so an entry saved
 * before the animatable rule tightened still routes to its domain.
 */
export function detectAnimatableDomain(settings: AnimatableTarget, propertyName: string): AnimatableDomain | null {
    const head = propertyName.split('.')[0];
    if (head === 'position' || head === 'rotation' || head === 'scale') {
        return 'transform';
    }
    const specs = getPropertySpecs('object', settings);
    for (const domain of DETECT_ORDER) {
        if (specs.some(s => s.domain === domain && s.name === propertyName)) return domain;
    }
    return null;
}
