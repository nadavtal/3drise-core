// =============================================================================
// UI layers — the spec (types, vocabulary, attribute grammar)
// =============================================================================
//
// A UI layer is HTML + CSS written by the AI agent (or by hand) that controls the
// scene through data attributes. The viewer's binder turns the attributes into calls
// on the project's SceneHandle (actions, clips, sequences). This file is the single
// source of the vocabulary: the binder, the validator, the agent docs and the base
// stylesheet all read it, so they cannot drift apart.
//
//   <button class="rise-button" data-click="action.toggle:open-door">Open</button>
//
// Refs are an item's key, then its id, then its exact name (same as SceneHandle).
// Commands are separated by spaces, so a ref used in an attribute cannot contain one:
// address things by key.
//

export interface UiLayer {
    id: string;
    /** Stable, code-facing name; unique per project (see uiKeys). */
    key: string;
    name: string;
    description?: string;
    html: string;
    css: string;
    visible: boolean;
    /** Position in the project's list (junction table `layerOrder`). */
    layerOrder?: number;
}

export type UiRefKind = 'action' | 'sequence' | 'clip';
/** `ui` addresses an element of the same layer by CSS id: `ui.toggle:#menu`. */
export type UiCommandKind = UiRefKind | 'ui';

/** Attributes that run commands. */
export const UI_TRIGGER_ATTRS = {
    click: 'data-click',
    hoverIn: 'data-hover-in',
    hoverOut: 'data-hover-out',
} as const;
export type UiTrigger = keyof typeof UI_TRIGGER_ATTRS;

export const UI_ATTR = {
    ...UI_TRIGGER_ATTRS,
    bind: 'data-bind',
    state: 'data-state',
    showWhen: 'data-show-when',
    anchor: 'data-anchor',
    anchorOcclude: 'data-anchor-occlude',
    anchorOffset: 'data-anchor-offset',
    set: 'data-set',
    setValue: 'data-set-value',
} as const;

/** Verbs per command kind. `toggle` for sequences and clips alternates forward / backward. */
export const UI_VERBS: Record<UiCommandKind, readonly string[]> = {
    action: ['apply', 'revert', 'toggle'],
    sequence: ['play', 'reverse', 'pause', 'resume', 'stop', 'toggle'],
    clip: ['play', 'reverse', 'pause', 'resume', 'stop', 'toggle'],
    ui: ['show', 'hide', 'toggle'],
};

export interface UiCommand {
    kind: UiCommandKind;
    verb: string;
    ref: string;
}

/** A condition on scene state: `action:key`, `!sequence:key`, `ui:#panel`. */
export interface UiCondition {
    negate: boolean;
    kind: UiCommandKind;
    ref: string;
}

export interface UiBind {
    kind: 'sequence' | 'clip';
    ref: string;
}

export interface UiAnchor {
    /** Object ref (id or name). */
    object: string;
    /** Name of a node inside a model. */
    node?: string;
}

/** What `data-set` writes to: an object (or a node of a model), or one of the environment elements. */
export const UI_SET_ENVIRONMENT = ['camera', 'sky', 'clouds', 'ocean', 'terrain'] as const;

export interface UiSetTarget {
    /** `camera` / `sky` / `clouds` / `ocean` / `terrain`, or an object ref (key, id or name). */
    target: string;
    /** Name of a node inside a model. */
    node?: string;
    /** Settings path, the same ones clip tracks use: `materialSettings.opacity`, `meshSettings.position.y`, `config.intensity`. */
    path: string;
}

/** `engine:materialSettings.opacity`, `engine/Door_L:meshSettings.rotation.y`, `sky:elevation`. */
export function parseSetTarget(value: string | null | undefined): { set?: UiSetTarget; error?: string } {
    // One target per attribute, so (unlike the command lists) names may contain spaces.
    const m = /^([^:/]+?)(?:\/([^:]+?))?:([A-Za-z_][\w.]*)$/.exec((value ?? '').trim());
    return m
        ? { set: { target: m[1].trim(), node: m[2]?.trim(), path: m[3] } }
        : { error: `"${value ?? ''}" is not target:path (e.g. engine:materialSettings.opacity or sky:elevation).` };
}

/** The value of `data-set-value`: a number, true/false, a JSON array (`[1,0,0]`), or a string (`#ff0000`). */
export function parseSetValue(value: string | null | undefined): number | boolean | string | number[] | undefined {
    if (value == null) return undefined;
    const t = value.trim();
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (/^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return Number(t);
    if (t.startsWith('[')) {
        try { const a = JSON.parse(t); if (Array.isArray(a) && a.every(n => typeof n === 'number')) return a as number[]; } catch { /* fall through */ }
    }
    return t;
}

const KINDS: readonly UiCommandKind[] = ['action', 'sequence', 'clip', 'ui'];
const isKind = (k: string): k is UiCommandKind => (KINDS as readonly string[]).includes(k);
const tokens = (value: string | null | undefined) => (value ?? '').split(/\s+/).filter(Boolean);

/** `action.toggle:open-door sequence.play:intro` */
export function parseCommands(value: string | null | undefined): { commands: UiCommand[]; errors: string[] } {
    const commands: UiCommand[] = [];
    const errors: string[] = [];
    for (const token of tokens(value)) {
        const m = /^([a-z]+)\.([a-z]+):(.+)$/.exec(token);
        if (!m) { errors.push(`"${token}" is not kind.verb:ref (e.g. action.toggle:open-door).`); continue; }
        const [, kind, verb, ref] = m;
        if (!isKind(kind)) { errors.push(`"${token}": unknown kind "${kind}". Use ${KINDS.join(', ')}.`); continue; }
        if (!UI_VERBS[kind].includes(verb)) { errors.push(`"${token}": ${kind} has no verb "${verb}". Use ${UI_VERBS[kind].join(', ')}.`); continue; }
        if (kind === 'ui' && !/^#[A-Za-z][\w-]*$/.test(ref)) { errors.push(`"${token}": ui commands address an element id in this layer, like ui.toggle:#menu.`); continue; }
        commands.push({ kind, verb, ref });
    }
    return { commands, errors };
}

/** `action:open-door !sequence:intro ui:#menu` — all must hold. */
export function parseConditions(value: string | null | undefined): { conditions: UiCondition[]; errors: string[] } {
    const conditions: UiCondition[] = [];
    const errors: string[] = [];
    for (const raw of tokens(value)) {
        const negate = raw.startsWith('!');
        const token = negate ? raw.slice(1) : raw;
        const m = /^([a-z]+):(.+)$/.exec(token);
        if (!m || !isKind(m[1])) { errors.push(`"${raw}" is not [!]kind:ref (e.g. action:open-door).`); continue; }
        if (m[1] === 'ui' && !/^#[A-Za-z][\w-]*$/.test(m[2])) { errors.push(`"${raw}": ui conditions address an element id in this layer, like ui:#menu.`); continue; }
        conditions.push({ negate, kind: m[1], ref: m[2] });
    }
    return { conditions, errors };
}

/** `sequence:intro` or `clip:spin` (for <input type="range">). */
export function parseBind(value: string | null | undefined): { bind?: UiBind; error?: string } {
    const m = /^(sequence|clip):(.+)$/.exec((value ?? '').trim());
    return m ? { bind: { kind: m[1] as UiBind['kind'], ref: m[2] } } : { error: `"${value ?? ''}" is not sequence:ref or clip:ref.` };
}

/** `object:engine` or `object:engine/Door_L` (the node name is everything after the first slash). */
export function parseAnchor(value: string | null | undefined): { anchor?: UiAnchor; error?: string } {
    const m = /^object:([^/]+)(?:\/(.+))?$/.exec((value ?? '').trim());
    return m ? { anchor: { object: m[1], node: m[2] } } : { error: `"${value ?? ''}" is not object:ref or object:ref/NodeName.` };
}

/** `12 -8` (px, from the projected point). */
export function parseOffset(value: string | null | undefined): [number, number] | null {
    const p = tokens(value).map(Number);
    return p.length === 2 && p.every(Number.isFinite) ? [p[0], p[1]] : null;
}

// ---------------------------------------------------------------------------
// Generic classes + variables (the base stylesheet in the viewer implements them)
// ---------------------------------------------------------------------------
//
// The prefix is `rise-`, not `3drise-`: a CSS class cannot start with a digit
// without escaping (`.3drise-button` is invalid; it has to be `.\33 drise-button`).

export const UI_CLASS_PREFIX = 'rise-';

export interface UiClassInfo {
    name: string;
    /** What it is for — shown in the agent docs. */
    use: string;
    /** Elements the validator expects it on (warns when a control has none of the generic classes). */
    for?: string;
}

export const UI_CLASSES: readonly UiClassInfo[] = [
    { name: 'rise-panel', use: 'A container grouping controls (a bar, a drawer, a side panel).' },
    { name: 'rise-button', use: 'A button. Pressed / active state: [data-on="true"] when it has data-state.', for: 'button' },
    { name: 'rise-toggle', use: 'A button showing an on/off state (use with data-state).', for: 'button' },
    { name: 'rise-slider', use: 'A range input (<input type="range">), often with data-bind.', for: 'input[type=range]' },
    { name: 'rise-input', use: 'A text or number input.', for: 'input' },
    { name: 'rise-menu', use: 'A list of choices (a column of rise-menu-item).' },
    { name: 'rise-menu-item', use: 'One choice in a rise-menu. Selected: [data-on="true"].' },
    { name: 'rise-card', use: 'An info card.' },
    { name: 'rise-card-title', use: 'The card heading.' },
    { name: 'rise-card-body', use: 'The card text.' },
    { name: 'rise-card-image', use: 'An <img> in a card.' },
    { name: 'rise-hotspot', use: 'A marker anchored to an object or model part (data-anchor).' },
    { name: 'rise-label', use: 'A small text label.' },
];

export interface UiVariableInfo { name: string; default: string; use: string }

/** Set on the page (or the host element) to restyle every layer at once. */
export const UI_VARIABLES: readonly UiVariableInfo[] = [
    { name: '--rise-accent', default: '#6ea8ff', use: 'Accent colour: active states, slider thumb, hotspot.' },
    { name: '--rise-accent-text', default: '#0b1220', use: 'Text on the accent colour.' },
    { name: '--rise-bg', default: 'rgba(18, 22, 32, 0.72)', use: 'Control and card background.' },
    { name: '--rise-text', default: '#f2f5fa', use: 'Text colour.' },
    { name: '--rise-muted', default: 'rgba(242, 245, 250, 0.65)', use: 'Secondary text.' },
    { name: '--rise-border', default: 'rgba(255, 255, 255, 0.16)', use: 'Border colour.' },
    { name: '--rise-radius', default: '10px', use: 'Corner radius.' },
    { name: '--rise-gap', default: '8px', use: 'Spacing between grouped controls.' },
    { name: '--rise-font', default: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', use: 'Font family (system fonts only).' },
    { name: '--rise-blur', default: '12px', use: 'Backdrop blur of panels and cards.' },
];

/** Class of the host element each layer is rendered in (target it from the page to override variables). */
export const UI_HOST_CLASS = 'rise-ui-layer';
