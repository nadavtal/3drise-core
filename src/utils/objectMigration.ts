import type { CreatedObjectSettings } from '../types/scene3d';
import { migrateSpaceObject } from './spaceMigration';
import { migrateGridObject } from './gridMigration';
import { migrateEnvironmentObject } from './environmentMigration';
import { migrateTextObject } from './textMigration';

/**
 * Every load-time migration of saved scene objects, in one pass. Each step is
 * pure, idempotent and returns the same object when there is nothing to change,
 * so this runs on every load (objectsSlice, the viewer ProjectLoader). A family
 * whose saved shape changes adds its step here.
 */
export function migrateObject<T extends CreatedObjectSettings>(obj: T): T {
    return migrateTextObject(migrateEnvironmentObject(migrateGridObject(migrateSpaceObject(obj))));
}
