// =============================================================================
// TEXTURE RESOLVER - Registry-Driven Texture Resolution Service
// =============================================================================
//
// Single source of truth for resolving texture URLs to Three.js Texture objects.
// Uses MaterialRegistry's textureProperties to know which settings keys are textures,
// eliminating heuristic guessing scattered across the codebase.
//
// Usage:
//   const resolved = await textureResolver.resolveSettings('Standard', materialSettings);
//   // All texture URL strings in resolved are now Texture objects
//
import { loadTextureAsync } from '../utils/loadingManager';
import { NoiseGenerator } from './NoiseGenerator';
import MaterialRegistryAPI from '../services/MaterialRegistry';
import { Texture } from "three";

class TextureResolverService {
    // Cache: URL string → loaded Texture
    private cache = new Map();
    /**
     * Resolve a single texture URL to a Three.js Texture object.
     * Returns cached texture if the same URL was loaded before.
     */
    async resolve(url: string): Promise<Texture> {
        // Return cached texture if available
        const cached = this.cache.get(url);
        if (cached)
            return cached;
        try {
            const texture = await loadTextureAsync(url);
            this.cache.set(url, texture);
            return texture;
        }
        catch (error) {
            console.error(`[TextureResolver] Failed to load texture: ${url}`, error);
            throw error;
        }
    }
    /**
     * Create a procedural noise texture.
     */
    resolveNoise(type: string = 'perlin'): Texture {
        return NoiseGenerator.createNoiseTexture(512, 512, (type as any));
    }
    /**
     * Resolve ALL texture properties in a settings object based on registry info.
     *
     * Uses MaterialRegistryAPI.getTextureProperties(variant) to determine which keys
     * are texture slots, then resolves any string URLs to Texture objects.
     *
     * - String values on texture keys → loaded as Texture via loadTextureAsync
     * - null values → left as null (no texture)
     * - Already-Texture values → left as-is
     * - Non-texture keys → left untouched
     */
    async resolveSettings(variant: string, settings: Record<string, any>): Promise<Record<string, any>> {
        const resolved = { ...settings };
        // Get texture property names from the registry (single source of truth)
        const textureKeys = MaterialRegistryAPI.getTextureProperties(variant);
        // Also detect noise keys from settings (keys containing "noise")
        const noiseKeys = Object.keys(settings).filter(key => {
            const lower = key.toLowerCase();
            return lower.includes('noise') && !lower.includes('texture');
        });
        // Resolve texture URLs in parallel
        const texturePromises = [];
        for (const key of textureKeys) {
            const value = settings[key];
            if (typeof value === 'string' && value !== '' && value !== 'none') {
                // It's a URL string — resolve to Texture
                texturePromises.push(this.resolve(value)
                    .then(texture => {
                    resolved[key] = texture;
                })
                    .catch(error => {
                    console.warn(`[TextureResolver] Could not resolve texture for "${key}": ${value}`, error);
                    resolved[key] = null; // Fallback to null on error
                }));
            }
            // If value is null, undefined, or already a Texture — leave as-is
        }
        // Resolve noise textures (synchronous)
        for (const key of noiseKeys) {
            const value = settings[key];
            if (typeof value === 'string' && value !== '' && value !== 'none') {
                resolved[key] = this.resolveNoise(value);
            }
        }
        // Wait for all texture loads to complete
        await Promise.all(texturePromises);
        return resolved;
    }
    /**
     * Check if a texture URL is already cached.
     */
    isCached(url: string): boolean {
        return this.cache.has(url);
    }
    /**
     * Get a cached texture without loading. Returns undefined if not cached.
     */
    getCached(url: string): Texture | undefined {
        return this.cache.get(url);
    }
    /**
     * Clear the texture cache and dispose all cached textures.
     */
    clearCache(): void {
        for (const texture of this.cache.values()) {
            texture.dispose();
        }
        this.cache.clear();
    }
    /**
     * Remove a specific URL from the cache and dispose its texture.
     */
    evict(url: string): void {
        const texture = this.cache.get(url);
        if (texture) {
            texture.dispose();
            this.cache.delete(url);
        }
    }
    /**
     * Get cache statistics.
     */
    getStats(): {
                cacheSize: number;
                cachedUrls: string[];
            } {
        return {
            cacheSize: this.cache.size,
            cachedUrls: Array.from(this.cache.keys()),
        };
    }
}
// Export singleton instance
export const textureResolver: TextureResolverService = new TextureResolverService();
// Export class for testing
export { TextureResolverService };
