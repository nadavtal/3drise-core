import type { CreatedObjectSettings } from '../types/scene3d';

// =============================================================================
// Space objects — load-time migration of the legacy config
// =============================================================================
//
// The old starfield spun itself through a `rotateSpeed` knob (rotation.y +=
// rotateSpeed * 0.01 every frame). Spinning the whole object is the parent's
// transform, so the knob is gone from the space family; a saved starfield that
// had it gets the equivalent transform 'spin' effect instead (rad/s at 60 fps),
// unless it already animates its transform (a rotation effect, or keyframes: an
// enabled transform effect would switch those off). The dead `size` / `sep` keys (never
// read by the renderer) are dropped too.
//
// Pure and idempotent: returns the same object when there is nothing to migrate,
// so it can run on every load without marking anything dirty.
//

const ROTATION_EFFECTS = new Set(['rotate3d', 'spin', 'sway', 'flip']);
/** The old per-frame step (0.01 rad per unit) at 60 frames per second. */
const LEGACY_FRAMES_PER_SECOND = 60;

export function migrateSpaceObject<T extends CreatedObjectSettings>(obj: T): T {
    if (!obj || (obj as any).type !== 'space') return obj;
    const config = (obj as any).config as Record<string, unknown> | undefined;
    if (!config || config.type !== 'stars') return obj;
    if (!('rotateSpeed' in config) && !('size' in config) && !('sep' in config)) return obj;

    const { rotateSpeed, size: _size, sep: _sep, ...rest } = config;
    const next: any = { ...obj, config: rest };

    const speed = typeof rotateSpeed === 'number' ? rotateSpeed * 0.01 * LEGACY_FRAMES_PER_SECOND : 0;
    if (speed > 0) {
        const animations = (obj as any).animations ?? {};
        const transform = animations.transform ?? {};
        const effects: any[] = transform.effects ?? [];
        const keyframed = (transform.animations?.length ?? 0) > 0;
        if (!keyframed && !effects.some(e => ROTATION_EFFECTS.has(e?.type))) {
            const hasOther = Object.entries(animations).some(([k, v]: [string, any]) =>
                k !== 'enabled' && v && ((v.animations?.length ?? 0) > 0 || (v.effects?.length ?? 0) > 0));
            next.animations = {
                ...animations,
                // Switch the animations on only when nothing else is there that the user may have turned off.
                enabled: hasOther ? (animations.enabled ?? true) : true,
                transform: { ...transform, effects: [...effects, { type: 'spin', enabled: true, speed, options: { axis: 'y' } }] },
            };
        }
    }
    return next;
}
