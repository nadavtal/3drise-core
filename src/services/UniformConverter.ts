// =============================================================================
// UNIFORM CONVERTER - TYPE-SAFE SHADER UNIFORM PROCESSING
// =============================================================================
import { TextureLoader, Vector2, Vector3 } from "three";
import type { Texture } from 'three';
import type { UniFormSettings } from "../types/materials";

// =============================================================================
// UNIFORM TYPE PROCESSORS
// =============================================================================
class UniformProcessor {
}
class ColorProcessor extends UniformProcessor {
    canProcess(key, value) {
        return key.includes('Color') || key.includes('color') || value?.isColor;
    }
    toSetting(value) {
        if (typeof value === 'number') {
            return '#' + value.toString(16).padStart(6, '0');
        }
        if (value?.isVector3) {
            return this.vector3ToHex(value);
        }
        return value === null ? null : String(value);
    }
    toUniform(value) {
        if (typeof value === 'string' && value.startsWith('#')) {
            return this.hexToVector3(value);
        }
        return value;
    }
    vector3ToHex(vec3) {
        const r = Math.floor(Math.max(0, Math.min(1, vec3.x)) * 255).toString(16).padStart(2, '0');
        const g = Math.floor(Math.max(0, Math.min(1, vec3.y)) * 255).toString(16).padStart(2, '0');
        const b = Math.floor(Math.max(0, Math.min(1, vec3.z)) * 255).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }
    hexToVector3(hexColor) {
        const r = parseInt(hexColor.slice(1, 3), 16) / 255;
        const g = parseInt(hexColor.slice(3, 5), 16) / 255;
        const b = parseInt(hexColor.slice(5, 7), 16) / 255;
        return new Vector3(r, g, b);
    }
}
class Vector3Processor extends UniformProcessor {
    canProcess(key, value, uniform) {
        return (value?.isVector3) ||
            (Array.isArray(value) && value.length === 3 && this.isVector3Key(key)) ||
            (uniform?.value?.isVector3);
    }
    toSetting(value) {
        if (value?.isVector3) {
            return [value.x, value.y, value.z];
        }
        if (value && typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
            return [value.x, value.y, value.z];
        }
        return value;
    }
    toUniform(value) {
        if (Array.isArray(value) && value.length === 3) {
            return new Vector3(value[0], value[1], value[2]);
        }
        return value;
    }
    isVector3Key(key) {
        return key.includes('Position') ||
            key.includes('Direction') ||
            key.includes('Scale') ||
            key.includes('Rotation');
    }
}
class Vector2Processor extends UniformProcessor {
    canProcess(key, value, uniform) {
        return (value?.isVector2) ||
            (Array.isArray(value) && value.length === 2) ||
            (uniform?.value?.isVector2) ||
            (this.isVector2Key(key) && (value?.isVector2 || Array.isArray(value) || uniform?.value?.isVector2));
    }
    toSetting(value) {
        console.log("Vector2Processor toSetting:", value);
        if (value?.isVector2) {
            return [value.x, value.y];
        }
        if (value && typeof value === 'object' && 'x' in value && 'y' in value && !('z' in value)) {
            return [value.x, value.y];
        }
        return value;
    }
    toUniform(value) {
        if (Array.isArray(value) && value.length === 2) {
            return new Vector2(value[0], value[1]);
        }
        return value;
    }
    isVector2Key(key) {
        return key.includes('mouse') ||
            key.includes('resolution') ||
            key.includes('size');
    }
}
class BooleanProcessor extends UniformProcessor {
    canProcess(key, value) {
        return typeof value === 'boolean';
    }
    toSetting(value) {
        return value;
    }
    toUniform(value) {
        return typeof value === 'boolean' ? (value ? 1.0 : 0.0) : value;
    }
}
class NullProcessor extends UniformProcessor {
    canProcess(key, value) {
        return value === null;
    }
    toSetting(value) {
        return null;
    }
    toUniform(value) {
        return null;
    }
}
class DefaultProcessor extends UniformProcessor {
    canProcess() {
        return true; // Always can process as fallback
    }
    toSetting(value) {
        return value;
    }
    toUniform(value) {
        return value;
    }
}
// =============================================================================
// UNIFORM CONVERTER
// =============================================================================
export class UniformConverter {
    private processors = [
        new Vector3Processor(),
        new NullProcessor(),
        new ColorProcessor(),
        new Vector2Processor(),
        new BooleanProcessor(),
        new DefaultProcessor(), // Must be last as fallback
    ];
    private loader = new TextureLoader();
    private excludedUniforms = ["u_type", "visible", "materialType", "materialVariant"];
    /**
     * Convert shader uniforms to UI-friendly settings
     */
    convertToSettings(uniforms: Record<string, any>): UniFormSettings {
        const settings = {};
        Object.keys(uniforms).forEach(key => {
            if (this.excludedUniforms.includes(key))
                return;
            const uniform = uniforms[key];
            const value = uniform.value;
            // const propName = key.replace('u_', '');
            const processor = this.processors.find(p => p.canProcess(key, value, uniform));
            if (processor) {
                settings[key] = processor.toSetting(value);
            }
        });
        return settings;
    }
    /**
     * Convert UI settings back to shader uniforms
     */
    async loadTexture(name: string, url: string): Promise<Texture> {
        // console.log('Loading texture:', name, url);
        // if (this.texturesByType.get(type)?.has(name)) {
        //   return this.texturesByType.get(type)?.get(name)?.texture!;
        // }
        // const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        //   const image = new window.Image();
        //   image.crossOrigin = 'Anonymous';
        //   image.onload = () => resolve(image);
        //   image.onerror = reject;
        //   image.src = url;
        // });
        // const width = img.width;
        // const height = img.height;
        // const isLandscape =  width > height;
        return new Promise((resolve, reject) => {
            this.loader.load(url, (texture) => {
                // this.texturesByType.get(type)?.set(name, {
                //   texture,
                //   width,
                //   height,
                //   isLandscape
                // });
                console.log('Texture loaded:', name, texture);
                // console.log(this.texturesByType);
                resolve(texture);
            }, undefined, (err) => reject(err));
        });
    }
    convertToUniforms(settings: UniFormSettings): Record<string, any> {
        // console.log("Converting settings to uniforms:", settings);
        const uniforms = {};
        Object.keys(settings).forEach(async (key) => {
            if (this.excludedUniforms.includes(key))
                return;
            const value = settings[key];
            const processor = this.processors.find(p => p.canProcess(key, value, settings));
            if (processor) {
                // Convert the value and assign it to the uniform's value property
                // console.log({processor})
                uniforms[key] = processor.toUniform(value);
            }
            else {
                console.warn(`No processor found for uniform key: ${key} with value:`, value);
            }
        });
        // Remove excluded uniforms from the result
        this.excludedUniforms.forEach(excludedKey => {
            delete uniforms[excludedKey];
        });
        return uniforms;
    }
    /**
     * Add a custom processor for specific uniform types
     */
    addProcessor(processor: UniformProcessor, index?: number): void {
        if (index !== undefined) {
            this.processors.splice(index, 0, (processor as any));
        }
        else {
            // Insert before the default processor (which should always be last)
            this.processors.splice(-1, 0, (processor as any));
        }
    }
    /**
     * Remove excluded uniform keys
     */
    addExcludedUniform(uniformKey: string): void {
        if (!this.excludedUniforms.includes(uniformKey)) {
            this.excludedUniforms.push(uniformKey);
        }
    }
    /**
     * Remove excluded uniform keys
     */
    removeExcludedUniform(uniformKey: string): void {
        const index = this.excludedUniforms.indexOf(uniformKey);
        if (index > -1) {
            this.excludedUniforms.splice(index, 1);
        }
    }
}
// Export a singleton instance for convenience
export const uniformConverter: UniformConverter = new UniformConverter();
// Export the base class for custom processors
export { UniformProcessor };
