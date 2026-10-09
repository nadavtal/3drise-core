// =============================================================================
// Property registry — types
// =============================================================================
//
// One description of every property an element has: what it is called, what kind
// of value it holds, its bounds / options, and whether it can be driven per frame
// (animatable: timeline tracks, mouse-move, AI clips) or only set (structural:
// controllers, action patches). The registry (./registry.ts) assembles these from
// the property tables (./tables) and the environment schemas (../environment), so
// the data stays where it is maintained and every consumer reads the same answer.
//

export type PropertyKind = 'number' | 'color' | 'boolean' | 'select' | 'vec3' | 'vec2' | 'string' | 'texture';

/** What a property belongs to. Objects are all 'object'; the kind of object is read from its settings. */
export type PropertyElement = 'object' | 'camera' | 'sky' | 'clouds' | 'ocean' | 'terrain';

export const ENVIRONMENT_ELEMENTS = ['sky', 'clouds', 'ocean', 'terrain'] as const;
export type EnvironmentElement = (typeof ENVIRONMENT_ELEMENTS)[number];

/**
 * The family a property comes from. For objects it matches AnimatableDomain
 * (getAnimatableProperties), plus 'shadow' (a light's shadow block) and 'config'
 * (config knobs of objects with no animatable table: text, plain, mesh).
 */
export type PropertyDomain =
    | 'transform' | 'material' | 'edges'
    | 'light' | 'shadow' | 'particles' | 'effect' | 'grid' | 'environment' | 'space' | 'land' | 'text' | 'rain' | 'clouds' | 'config'
    | 'camera' | 'sky' | 'stars' | 'cirrus' | 'ocean' | 'terrain';

export interface PropertyOption {
    value: string;
    label?: string;
}

export interface PropertySpec {
    /** Settings path on the element: 'meshSettings.position', 'materialSettings.roughness',
     *  'config.intensity', 'config.shadow.bias', 'elevation' (sky), 'config.coverage' (clouds deck),
     *  'cirrus.coverage', 'controls.target' (camera). */
    key: string;
    /** Last segment of the key: the name the controllers and the mouse-move domains use. */
    name: string;
    label: string;
    description?: string;
    kind: PropertyKind;
    domain: PropertyDomain;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: PropertyOption[];
    /** Value a panel shows when the settings do not carry one. */
    default?: unknown;
    /** Controller tab / section (light tabs, schema groups). */
    group?: string;
    /** Can be driven per frame. false = structural: set only. */
    animatable: boolean;
}

export interface DescribedProperty extends PropertySpec {
    /** Current value on the element's settings (undefined when not set). */
    value: unknown;
}
