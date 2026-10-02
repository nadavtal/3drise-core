// Moved from client (client/app/utils/getPropertyConfig.ts).
import { EFFECT_PROPERTIES } from './effectsProperties';
import { PARTICLES_PROPERTIES } from './particlesProperties';
import { environmentOptionalProperties } from './optionalProperties';

const allProperties = {
    ...EFFECT_PROPERTIES,
    ...PARTICLES_PROPERTIES,
    ...environmentOptionalProperties,
};

/** Property rows for a generative effect / particles type or an environment element. */
export const getPropertyConfig = (type: string) => {
    if (type in allProperties) {
        return allProperties[type as keyof typeof allProperties];
    }
    return undefined;
};
