import type { ObjectEffect } from '../types/objectSettings';

/** The object effects of a stored object — entries of any older shape (generative effects) are dropped. */
export function objectEffectsOf(settings: { effects?: unknown } | null | undefined): ObjectEffect[] {
    const list = (settings as any)?.effects;
    return Array.isArray(list) ? list.filter((e: any) => e && typeof e.operation === 'string' && typeof e.id === 'string') : [];
}
