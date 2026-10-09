import type { CreatedObjectSettings } from '../types/scene3d';

// =============================================================================
// Environment objects — load-time migration of the legacy rain
// =============================================================================
//
// Rain used to sit outside the environment family, with its own animation domain:
// its keyframes in `animations.rain`, its pointer bindings in `mouseMove.rain`.
// It is a family member now, driven through `animations.environment` /
// `mouseMove.environment` like every other environment object, so a saved rain's
// tracks move over (appended to anything already there). The never-rendered
// `splash` knob is dropped.
//
// Pure and idempotent: returns the same object when there is nothing to migrate.
//

export function migrateEnvironmentObject<T extends CreatedObjectSettings>(obj: T): T {
    if (!obj || (obj as any).type !== 'environment') return obj;
    const config = (obj as any).config as Record<string, unknown> | undefined;
    if (!config || config.type !== 'rain') return obj;
    const animations = (obj as any).animations as Record<string, any> | undefined;
    const mouseMove = (obj as any).mouseMove as Record<string, any> | undefined;
    const hasAnim = !!animations && 'rain' in animations;
    const hasMouse = !!mouseMove && typeof mouseMove === 'object' && 'rain' in mouseMove;
    if (!('splash' in config) && !hasAnim && !hasMouse) return obj;

    const next: any = { ...obj };
    if ('splash' in config) {
        const { splash: _splash, ...rest } = config;
        next.config = rest;
    }
    if (hasAnim) {
        const { rain, ...others } = animations!;
        const env = others.environment ?? {};
        next.animations = {
            ...others,
            environment: { ...rain, ...env, animations: [...(env.animations ?? []), ...(rain?.animations ?? [])] },
        };
    }
    if (hasMouse) {
        const { rain, ...others } = mouseMove!;
        const env = others.environment;
        next.mouseMove = {
            ...others,
            environment: env
                ? { ...env, enabled: env.enabled || !!rain?.enabled, properties: [...(env.properties ?? []), ...(rain?.properties ?? [])] }
                : rain,
        };
    }
    return next;
}
