import type { CreatedObjectSettings } from '../types/scene3d';
import { isGalleryObjectConfig } from '../data/galleryDefaults';

// =============================================================================
// Gallery — load-time migration of the legacy layout gallery
// =============================================================================
//
// Object type 'gallery' used to carry a bare GalleryLayoutSettings (config.layout, no config.type). That
// gallery is now the `layout` variant of the gallery family; a saved one gains `type: 'layout'` (and
// `enabled`) and nothing else changes. Pure and idempotent.
//

export function migrateGalleryObject<T extends CreatedObjectSettings>(obj: T): T {
    if (!obj || (obj as any).type !== 'gallery') return obj;
    const config = ((obj as any).config ?? {}) as Record<string, any>;
    if (isGalleryObjectConfig(config)) return obj;
    return { ...obj, config: { ...config, type: 'layout', enabled: config.enabled !== false, layout: config.layout ?? 'tiles' } };
}
