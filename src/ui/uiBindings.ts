// =============================================================================
// Reading and validating the bindings of a layer
// =============================================================================
//
// `collectUiBindings` reads every binding attribute of a rendered (or parsed) layer.
// The binder uses it to wire the DOM and to `inspect`; `validateUiLayer` uses it to
// tell the agent what is wrong before anything is saved. Both read the same grammar
// (uiSpec), so what validates is what runs.
//
import {
    UI_ATTR, UI_CLASSES, UI_SET_ENVIRONMENT, UI_TRIGGER_ATTRS, parseAnchor, parseBind, parseCommands, parseConditions, parseOffset, parseSetTarget, parseSetValue,
    type UiAnchor, type UiSetTarget, type UiBind, type UiCommand, type UiCommandKind, type UiCondition, type UiTrigger,
} from './uiSpec';
import { resolveUiRef, type Refable } from './uiKeys';

export interface UiBindingUse {
    el: Element;
    /** Short human description of the element: `<button.rise-button> "Open"`. */
    label: string;
    errors: string[];
    commands: { trigger: UiTrigger; items: UiCommand[] }[];
    state: UiCondition[];
    showWhen: UiCondition[];
    bind?: UiBind;
    anchor?: UiAnchor;
    /** `data-set`: the live property this control writes. */
    set?: UiSetTarget;
    /** `data-set-value` on a button: what a press writes. */
    setValue?: ReturnType<typeof parseSetValue>;
    anchorOcclude: boolean;
    anchorOffset: [number, number] | null;
}

const BINDING_SELECTOR = Object.values(UI_ATTR).map(a => `[${a}]`).join(',');

export function describeUiElement(el: Element): string {
    const cls = (el.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30);
    return `<${el.localName}${cls ? '.' + cls : ''}${el.id ? '#' + el.id : ''}>${text ? ` "${text}"` : ''}`;
}

/** Every element of `root` that carries a binding attribute. */
export function collectUiBindings(root: ParentNode): UiBindingUse[] {
    const uses: UiBindingUse[] = [];
    for (const el of Array.from(root.querySelectorAll(BINDING_SELECTOR))) {
        const use: UiBindingUse = {
            el, label: describeUiElement(el), errors: [], commands: [], state: [], showWhen: [],
            anchorOcclude: el.hasAttribute(UI_ATTR.anchorOcclude), anchorOffset: null,
        };
        for (const trigger of Object.keys(UI_TRIGGER_ATTRS) as UiTrigger[]) {
            const attr = UI_TRIGGER_ATTRS[trigger];
            if (!el.hasAttribute(attr)) continue;
            const { commands, errors } = parseCommands(el.getAttribute(attr));
            use.errors.push(...errors.map(e => `${attr}: ${e}`));
            use.commands.push({ trigger, items: commands });
        }
        if (el.hasAttribute(UI_ATTR.state)) {
            const { conditions, errors } = parseConditions(el.getAttribute(UI_ATTR.state));
            use.state = conditions; use.errors.push(...errors.map(e => `${UI_ATTR.state}: ${e}`));
        }
        if (el.hasAttribute(UI_ATTR.showWhen)) {
            const { conditions, errors } = parseConditions(el.getAttribute(UI_ATTR.showWhen));
            use.showWhen = conditions; use.errors.push(...errors.map(e => `${UI_ATTR.showWhen}: ${e}`));
        }
        if (el.hasAttribute(UI_ATTR.bind)) {
            const { bind, error } = parseBind(el.getAttribute(UI_ATTR.bind));
            if (bind) use.bind = bind; if (error) use.errors.push(`${UI_ATTR.bind}: ${error}`);
        }
        if (el.hasAttribute(UI_ATTR.anchor)) {
            const { anchor, error } = parseAnchor(el.getAttribute(UI_ATTR.anchor));
            if (anchor) use.anchor = anchor; if (error) use.errors.push(`${UI_ATTR.anchor}: ${error}`);
        }
        if (el.hasAttribute(UI_ATTR.set)) {
            const { set, error } = parseSetTarget(el.getAttribute(UI_ATTR.set));
            if (set) use.set = set; if (error) use.errors.push(`${UI_ATTR.set}: ${error}`);
        }
        if (el.hasAttribute(UI_ATTR.setValue)) use.setValue = parseSetValue(el.getAttribute(UI_ATTR.setValue));
        if (el.hasAttribute(UI_ATTR.anchorOffset)) {
            use.anchorOffset = parseOffset(el.getAttribute(UI_ATTR.anchorOffset));
            if (!use.anchorOffset) use.errors.push(`${UI_ATTR.anchorOffset}: expected two numbers in px, like "0 -12".`);
        }
        uses.push(use);
    }
    return uses;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface UiRefs {
    actions: readonly Refable[];
    clips: readonly Refable[];
    sequences: readonly Refable[];
    /** Scene objects, to check data-anchor and data-set targets. */
    objects: readonly Refable[];
    /**
     * Checks one `data-set` target (is the path live-writable on it?). Returns a problem or undefined.
     * Optional: the viewer provides it; without it only the syntax and the target are checked.
     */
    checkSet?: (target: UiSetTarget) => string | undefined;
}

export interface UiIssue {
    level: 'error' | 'warning';
    /** The element, for the agent to find it. */
    element: string;
    message: string;
}

const known = (items: readonly Refable[]) => items.map(i => i.key || i.name).join(', ') || 'none yet';

function checkRef(kind: UiCommandKind, ref: string, refs: UiRefs, layerIds: Set<string>): string | null {
    if (kind === 'ui') return layerIds.has(ref.slice(1)) ? null : `no element with id "${ref.slice(1)}" in this layer.`;
    const list = kind === 'action' ? refs.actions : kind === 'clip' ? refs.clips : refs.sequences;
    return resolveUiRef(list, ref) ? null : `no ${kind} "${ref}". Known ${kind}s: ${known(list)}.`;
}

/** Generic control classes: a control with none of them gets a nudge, so users can restyle it in one place. */
const GENERIC = new Set(UI_CLASSES.map(c => c.name));
const hasGenericClass = (el: Element) => (el.getAttribute('class') ?? '').split(/\s+/).some(c => GENERIC.has(c));

export function validateUiRoot(root: ParentNode, refs: UiRefs): UiIssue[] {
    const issues: UiIssue[] = [];
    const add = (level: UiIssue['level'], element: string, message: string) => issues.push({ level, element, message });
    const layerIds = new Set(Array.from(root.querySelectorAll('[id]')).map(e => e.id));

    const uses = collectUiBindings(root);
    for (const use of uses) {
        for (const e of use.errors) add('error', use.label, e);
        for (const group of use.commands) {
            for (const c of group.items) {
                const problem = checkRef(c.kind, c.ref, refs, layerIds);
                if (problem) add('error', use.label, `${UI_TRIGGER_ATTRS[group.trigger]}: ${problem}`);
            }
        }
        for (const [attr, list] of [[UI_ATTR.state, use.state], [UI_ATTR.showWhen, use.showWhen]] as const) {
            for (const c of list) {
                const problem = checkRef(c.kind, c.ref, refs, layerIds);
                if (problem) add('error', use.label, `${attr}: ${problem}`);
            }
        }
        if (use.bind) {
            const problem = checkRef(use.bind.kind, use.bind.ref, refs, layerIds);
            if (problem) add('error', use.label, `${UI_ATTR.bind}: ${problem}`);
            if (!(use.el.localName === 'input' && use.el.getAttribute('type') === 'range')) {
                add('error', use.label, `${UI_ATTR.bind} only works on <input type="range">.`);
            }
        }
        if (use.anchor && !resolveUiRef(refs.objects, use.anchor.object)) {
            add('error', use.label, `${UI_ATTR.anchor}: no object "${use.anchor.object}". Known objects: ${known(refs.objects)}.`);
        }
        if (use.set) {
            const t = use.set;
            const env = (UI_SET_ENVIRONMENT as readonly string[]).includes(t.target);
            if (!env && !resolveUiRef(refs.objects, t.target)) {
                add('error', use.label, `${UI_ATTR.set}: no object "${t.target}". Use ${UI_SET_ENVIRONMENT.join(', ')} or an object (known: ${known(refs.objects)}).`);
            } else {
                const problem = refs.checkSet?.(t);
                if (problem) add('error', use.label, `${UI_ATTR.set}: ${problem}`);
            }
            const tag = use.el.localName;
            const type = (use.el.getAttribute('type') ?? 'text').toLowerCase();
            const isInput = tag === 'input' || tag === 'select';
            if (!isInput && use.setValue === undefined) {
                add('error', use.label, `${UI_ATTR.set} on a <${tag}> needs ${UI_ATTR.setValue} (what a press writes); or use an <input> / <select>.`);
            }
            if (isInput && use.setValue !== undefined) add('warning', use.label, `${UI_ATTR.setValue} is for buttons; on an input the control's own value is written.`);
            if (tag === 'input' && type === 'range' && (!use.el.hasAttribute('min') || !use.el.hasAttribute('max'))) {
                add('warning', use.label, 'a range with data-set writes its own value: set min and max in the property\'s units (the default is 0–100).');
            }
        } else if (use.setValue !== undefined) {
            add('error', use.label, `${UI_ATTR.setValue} needs ${UI_ATTR.set} (the property to write).`);
        }
        const hover = use.commands.some(c => (c.trigger === 'hoverIn' || c.trigger === 'hoverOut') && c.items.length);
        const click = use.commands.some(c => c.trigger === 'click' && c.items.length);
        if (hover && !click && !use.anchor) {
            add('warning', use.label, 'hover does not fire on touch screens — give it a data-click too.');
        }
    }

    // data-show-when rewrites `hidden` on every refresh, so a ui command on the same element would be undone.
    const uiTargets = new Set<string>();
    for (const use of uses) for (const g of use.commands) for (const c of g.items) if (c.kind === 'ui') uiTargets.add(c.ref.slice(1));
    for (const use of uses) {
        if (use.showWhen.length && use.el.id && uiTargets.has(use.el.id)) {
            add('warning', use.label, 'has data-show-when and is also the target of a ui command; data-show-when wins on every refresh. Use one of the two.');
        }
    }

    // Generic classes: controls without one are hard for users to restyle together.
    for (const el of Array.from(root.querySelectorAll('button, input, select'))) {
        if (hasGenericClass(el)) continue;
        const t = el.localName === 'input' ? el.getAttribute('type') ?? 'text' : el.localName;
        const want = t === 'range' ? 'rise-slider' : el.localName === 'button' ? 'rise-button (or rise-toggle)' : 'rise-input';
        add('warning', describeUiElement(el), `has no generic class — add ${want} so users can restyle every control in one place.`);
    }
    return issues;
}
