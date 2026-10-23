import type { CreatedObjectSettings } from '../types/scene3d';

// =============================================================================
// Image — load-time migration of the single-picture image object
// =============================================================================
//
// Image objects used to carry one picture, `config.url`; they now carry `config.imageUrls` (shown in turn every
// `config.interval` seconds). A saved one with `url` gets `imageUrls: [url]` (or [] when it had none) and loses
// `url`; `interval` is left to the defaults. Pure and idempotent.
//

export function migrateImageObject<T extends CreatedObjectSettings>(obj: T): T {
    if (!obj || (obj as any).type !== 'image') return obj;
    const config = (obj as any).config as Record<string, any> | undefined;
    if (!config || !('url' in config)) return obj;
    const { url, ...rest } = config;
    const imageUrls = Array.isArray(rest.imageUrls) && rest.imageUrls.length ? rest.imageUrls : (typeof url === 'string' && url ? [url] : []);
    return { ...obj, config: { ...rest, imageUrls } };
}
