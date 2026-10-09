// =============================================================================
// UI layer keys — same slug rules as action keys
// =============================================================================
//
// Derived once from the name, then frozen; unique per project (the data-center
// enforces it on save, like action keys — it keeps its own copy of the slug code).
//
import { ACTION_KEY_MAX_LENGTH, isValidActionKey, toActionKey, uniqueActionKey } from '../utils/actionKeys';

export const UI_KEY_MAX_LENGTH = ACTION_KEY_MAX_LENGTH;
export const isValidUiLayerKey = isValidActionKey;
export const uniqueUiLayerKey = uniqueActionKey;

/** "Door controls" -> "door-controls". A name with no latin letters or digits (Hebrew, emoji…) falls back to "ui". */
export function toUiLayerKey(name: string | undefined | null): string {
    const slug = toActionKey(name);
    return slug === 'action' && !/\baction\b/i.test(name ?? '') ? 'ui' : slug;
}

export interface Refable { id: string; key?: string; name: string }

/** Key, then id, then exact name — the same order SceneHandle uses. Undefined when nothing matches. */
export function resolveUiRef<T extends Refable>(items: readonly T[], ref: string): T | undefined {
    if (!ref) return undefined;
    return items.find(i => i.key === ref) ?? items.find(i => i.id === ref) ?? items.find(i => i.name === ref);
}
