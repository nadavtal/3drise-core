// =============================================================================
// Action keys — the stable, code-facing name of an action
// =============================================================================
//
// `key` is what a developer types into their own code to trigger an action from
// outside the project (`scene.actions.toggle('open-door')`). Ids change when a
// project is copied or forked; names are labels and get edited. A key is derived
// from the name ONCE, at creation, and then frozen — renaming the action does not
// touch it. It is unique per project; the data-center enforces that on save
// (it carries its own copy of `toActionKey` — keep the two in step).
//

export const ACTION_KEY_MAX_LENGTH = 64;
const ACTION_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Open the Front Door!" -> "open-the-front-door". Falls back to "action". */
export function toActionKey(name: string | undefined | null): string {
    const slug = (name ?? '')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, ACTION_KEY_MAX_LENGTH)
        .replace(/-+$/g, '');
    return slug || 'action';
}

/** True for a well-formed key: lowercase letters, digits, single dashes between. */
export function isValidActionKey(key: string | undefined | null): boolean {
    return !!key && key.length <= ACTION_KEY_MAX_LENGTH && ACTION_KEY_PATTERN.test(key);
}

/** `base`, or `base-2`, `base-3`… — the first one not in `taken`. */
export function uniqueActionKey(base: string, taken: Iterable<string>): string {
    const used = new Set(taken);
    if (!used.has(base)) return base;
    for (let n = 2; ; n++) {
        const suffix = `-${n}`;
        const candidate = `${base.slice(0, ACTION_KEY_MAX_LENGTH - suffix.length).replace(/-+$/g, '')}${suffix}`;
        if (!used.has(candidate)) return candidate;
    }
}
