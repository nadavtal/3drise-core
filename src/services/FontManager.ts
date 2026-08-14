export interface FontInfo {
    name: string;
    displayName: string;
    googleFont: string;
    threejsFont?: string;
    category: 'sans-serif' | 'serif' | 'display' | 'monospace';
    isLoaded: boolean;
}
const loadGoogleFont = (fontUrl) => {
    return new Promise<void>((resolve, reject) => {
        if (typeof document === 'undefined') {
            resolve();
            return;
        }
        if (document.querySelector(`link[href="${fontUrl}"]`)) {
            resolve();
            return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load font: ${fontUrl}`));
        document.head.appendChild(link);
    });
};
class FontManager {
    private static instance = null;
    private fonts = new Map();
    private loadingPromises = new Map();
    private readonly CURATED_FONTS = [
        { name: 'roboto', displayName: 'Roboto', googleFont: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', threejsFont: 'https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json', category: 'sans-serif' },
        { name: 'opensans', displayName: 'Open Sans', googleFont: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'sans-serif' },
        { name: 'lato', displayName: 'Lato', googleFont: 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHvxk6XweuBCY.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'sans-serif' },
        { name: 'poppins', displayName: 'Poppins', googleFont: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJDUc1NECPY.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'sans-serif' },
        { name: 'merriweather', displayName: 'Merriweather', googleFont: 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyriQwlOrhSvowK_l5OeyxNV-bnrw.ttf', threejsFont: 'https://threejs.org/examples/fonts/droid/droid_serif_regular.typeface.json', category: 'serif' },
        { name: 'playfair', displayName: 'Playfair Display', googleFont: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQZNLo_U2r.ttf', threejsFont: 'https://threejs.org/examples/fonts/droid/droid_serif_bold.typeface.json', category: 'serif' },
        { name: 'bebas', displayName: 'Bebas Neue', googleFont: 'https://fonts.gstatic.com/s/bebasneue/v10/JTUSjIg69CK48gW7PXooxW5rygbi49c.ttf', threejsFont: 'https://threejs.org/examples/fonts/gentilis_bold.typeface.json', category: 'display' },
        { name: 'lobster', displayName: 'Lobster', googleFont: 'https://fonts.gstatic.com/s/lobster/v30/neILzCirqoswsqX9_oWsMqEzSJQ.ttf', threejsFont: 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json', category: 'display' },
        { name: 'robotomono', displayName: 'Roboto Mono', googleFont: 'https://fonts.gstatic.com/s/robotomono/v23/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vuPQ--5Ip2sSQ.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'monospace' },
        { name: 'jetbrainsmono', displayName: 'JetBrains Mono', googleFont: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yK1jPVmUsaaDhw.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'monospace' },
        { name: 'courierprime', displayName: 'Courier Prime', googleFont: 'https://fonts.gstatic.com/s/courierprime/v9/u-450q2lgwslOqpF_6gQ8kELWwZjW-_-tvg.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'monospace' },
        { name: 'ubuntumono', displayName: 'Ubuntu Mono', googleFont: 'https://fonts.gstatic.com/s/ubuntumono/v17/KFOjCneDtsqEr0keqCMhbBc9AMX6lJBP.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'monospace' },
        { name: 'ptmono', displayName: 'PT Mono', googleFont: 'https://fonts.gstatic.com/s/ptmono/v13/9oRONYoBnWILk-9ArCg5MtPyAcg.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'monospace' },
        { name: 'cousine', displayName: 'Cousine', googleFont: 'https://fonts.gstatic.com/s/cousine/v27/d6lIkaiiRdih4SpPzSMlzTbtz9k.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'monospace' },
        { name: 'novamono', displayName: 'Nova Mono', googleFont: 'https://fonts.gstatic.com/s/novamono/v18/Cn-0JtiGWQ5Ajb--MRKfYGxYrdM9Sg.ttf', threejsFont: 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', category: 'monospace' },
    ];
    constructor() {
        this.CURATED_FONTS.forEach(fontData => {
            this.fonts.set(fontData.name, { ...fontData, isLoaded: false });
        });
    }
    static getInstance(): FontManager {
        if (!FontManager.instance)
            FontManager.instance = new FontManager();
        return FontManager.instance;
    }
    getAllFonts(): FontInfo[] { return Array.from(this.fonts.values()); }
    getFont(name: string): FontInfo | undefined { return this.fonts.get(name); }
    getBitmapFont(name: string): string | undefined { return this.fonts.get(name)?.googleFont; }
    get3DFont(name: string): string | undefined { return this.fonts.get(name)?.threejsFont; }
    getFontsByCategory(category: FontInfo['category']): FontInfo[] { return Array.from(this.fonts.values()).filter(f => f.category === category); }
    isFontLoaded(name: string): boolean { return this.fonts.get(name)?.isLoaded || false; }
    getDefaultFont(): FontInfo { return this.fonts.get('roboto'); }
    async loadFont(name: string): Promise<void> {
        const font = this.fonts.get(name);
        if (!font)
            throw new Error(`Font not found: ${name}`);
        if (font.isLoaded)
            return;
        if (this.loadingPromises.has(name))
            return this.loadingPromises.get(name);
        const promise = loadGoogleFont(font.googleFont)
            .then(() => { font.isLoaded = true; this.loadingPromises.delete(name); })
            .catch(error => { this.loadingPromises.delete(name); throw error; });
        this.loadingPromises.set(name, promise);
        return promise;
    }
    getFontOptions(): Array<{
                value: string;
                label: string;
                category: string;
            }> {
        return Array.from(this.fonts.values()).map(f => ({ value: f.name, label: f.displayName, category: f.category }));
    }
}
export const fontManager: FontManager = FontManager.getInstance();
export default FontManager;
