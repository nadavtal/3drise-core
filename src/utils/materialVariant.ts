// A material variant as full settings — what picking it in the studio writes: the
// variant's tuned defaults with apply / type / name on top. One switch track or one
// patch key (`materialSettings.materialVariant: 'Gold'`) stands for all of it: the
// timeline expands it when it lays a switch layer (ClipsRuntime), the agent when it
// builds an action's changes.
import { FrontSide } from 'three';
import MaterialRegistryAPI from '../services/MaterialRegistry';
import type { MaterialSettings } from '../types/materials';

/** The full settings of a variant, or null when the name is unknown. */
export function materialVariantSettings(variant: string): MaterialSettings | null {
    const MR = MaterialRegistryAPI as any;
    const type = MR.getTypeFromVariantName(variant);
    if (!type) return null;
    const defaults = MR.getVariantDefinition(variant)?.defaultSettings ?? {};
    return { apply: true, materialType: type, materialVariant: variant, ...defaults, side: defaults.side ?? FrontSide } as MaterialSettings;
}

/**
 * A settings patch whose `materialSettings.materialVariant` names a variant: the variant's
 * full settings, with the patch's own material keys on top (a colour tweaked after the
 * switch wins). Any other patch comes back unchanged.
 */
export function expandMaterialVariant<T extends Record<string, any>>(patch: T): T {
    let out = patch;
    const ms = patch?.materialSettings;
    if (ms && typeof ms === 'object' && typeof ms.materialVariant === 'string') {
        const full = materialVariantSettings(ms.materialVariant);
        if (full) out = { ...out, materialSettings: { ...full, ...ms } };
    }
    // A part (config.nodeOverrides.<part>.material.variant): the part's material replaced by the variant.
    const parts = patch?.config?.nodeOverrides;
    if (parts && typeof parts === 'object') {
        let changed = false;
        const next: Record<string, any> = { ...parts };
        for (const [k, o] of Object.entries<any>(parts)) {
            const v = o?.material?.variant;
            if (typeof v !== 'string') continue;
            const full = materialVariantSettings(v);
            if (!full) continue;
            const { variant: _v, ...rest } = o.material;
            next[k] = { ...o, material: { ...rest, mode: 'replace', settings: { ...full, ...(rest.settings ?? {}) } } };
            changed = true;
        }
        if (changed) out = { ...out, config: { ...out.config, nodeOverrides: next } };
    }
    return out;
}
