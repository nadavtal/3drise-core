import type { CreatedObjectSettings } from '../types/scene3d';
import { DEFAULT_TEXT_OBJECTS, TEXT_FONTS } from '../data/textDefaults';

// =============================================================================
// Text — load-time migration of the legacy 2d (bitmap) / 3d text
// =============================================================================
//
// Object type 'text' used to host two renderers told apart by `config.renderMode` and carrying no
// `config.type`: a troika bitmap text ('bitmap') and a per-letter extruded text ('text3d'). Both are gone:
//   bitmap  → the `plain` text look (same object type; the material colour / opacity become the look's own
//             knobs, the em size matches so a 0.5 fontSize keeps its size and any other scales the transform)
//   text3d  → the `text` shape of the mesh family (object type 'mesh'), which keeps its material and bevel
// Fonts the packed font list does not know fall back to the default face.
//
// Pure and idempotent: a text with a config.type is already in the new shape and is returned as is.
//

const KNOWN_FONTS = new Set(TEXT_FONTS.map((f) => f.id));
const fontOf = (font: unknown): string => (typeof font === 'string' && KNOWN_FONTS.has(font) ? font : 'inter');
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function migrateTextObject<T extends CreatedObjectSettings>(obj: T): T {
    if (!obj || (obj as any).type !== 'text') return obj;
    const config = ((obj as any).config ?? {}) as Record<string, any>;
    if (typeof config.type === 'string' && config.type in DEFAULT_TEXT_OBJECTS) return obj;

    const text = typeof config.text === 'string' ? config.text : 'Hello';
    const font = fontOf(config.font);
    const material = ((obj as any).materialSettings ?? {}) as Record<string, any>;

    if (config.renderMode === 'text3d') {
        const bevel = config.bevelEnabled !== false;
        return {
            ...obj,
            type: 'mesh',
            config: {
                type: 'text', text, font,
                size: num(config.size, 1), height: num(config.height, 0.2), letterSpacing: num(config.letterSpacing, 0),
                bevelEnabled: bevel, bevelThickness: num(config.bevelThickness, 0.02), bevelSize: num(config.bevelSize, 0.015), bevelSegments: num(config.bevelSegments, 3),
            },
        } as T;
    }

    // bitmap (or no renderMode at all) → plain look
    const next: any = {
        ...obj,
        config: {
            ...DEFAULT_TEXT_OBJECTS.plain, text, font,
            ...(typeof material.color === 'string' ? { color: material.color } : {}),
            ...(typeof material.opacity === 'number' ? { opacity: material.opacity } : {}),
        },
    };
    const fontSize = num(config.fontSize, 0.5);
    if (Math.abs(fontSize - 0.5) > 1e-6) {
        const k = fontSize / 0.5;
        const ms = (obj as any).meshSettings ?? {};
        const sc = Array.isArray(ms.scale) && ms.scale.length === 3 ? ms.scale : [1, 1, 1];
        next.meshSettings = { ...ms, scale: sc.map((v: number) => v * k) };
    }
    return next as T;
}
