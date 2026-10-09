import { Euler, Quaternion } from 'three';
import type { CreatedObjectSettings } from '../types/scene3d';

// =============================================================================
// Grids — load-time migration of the legacy surface knobs
// =============================================================================
//
// Every grid now lies flat in its own frame (the plane on local XZ, facing +Y);
// standing it up is the parent object's rotation, and pointer behaviour is a
// Pointer-tab binding. Older grids carried two knobs for that:
//   flat: false   the plane stood upright on local XY. Kept as it looked by
//                 turning the object +90° about its own X axis, so the now-flat
//                 plane ends up exactly where the upright one was.
//   followMouse   the ripple focus tracked the cursor. Dropped: the focus stays
//                 at the grid's centre.
// Both keys are removed. Pure and idempotent: returns the same object when there
// is nothing to migrate, so it can run on every load without marking anything dirty.
//

const UPRIGHT = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0));

export function migrateGridObject<T extends CreatedObjectSettings>(obj: T): T {
    if (!obj || (obj as any).type !== 'grid') return obj;
    const config = (obj as any).config as Record<string, unknown> | undefined;
    if (!config || (!('flat' in config) && !('followMouse' in config))) return obj;

    const { flat, followMouse: _followMouse, ...rest } = config;
    const next: any = { ...obj, config: rest };

    if (flat === false) {
        const mesh = (obj as any).meshSettings ?? {};
        const r = Array.isArray(mesh.rotation) ? mesh.rotation : [0, 0, 0];
        const q = new Quaternion().setFromEuler(new Euler(r[0] ?? 0, r[1] ?? 0, r[2] ?? 0)).multiply(UPRIGHT);
        const e = new Euler().setFromQuaternion(q);
        next.meshSettings = { ...mesh, rotation: [e.x, e.y, e.z] };
    }
    return next;
}

