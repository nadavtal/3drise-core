import { MeshStandardMaterial, MeshBasicMaterial, MeshPhysicalMaterial, MeshPhongMaterial, DoubleSide, FrontSide, MeshLambertMaterial, MeshToonMaterial } from 'three';
// Import existing shader materials
import { CloudsMaterial } from '../shaders/CloudsMaterial';
import { VolumetricCloudsMaterial } from '../shaders/VolumetricCloudsMaterial';
import { CartoonCloudsMaterial } from '../shaders/CartoonCloudsMaterial';
import { StormCloudsMaterial } from '../shaders/StormCloudsMaterial';
import { CirrusCloudsMaterial } from '../shaders/CirrusCloudsMaterial';
import { NebulaCloudsMaterial } from '../shaders/NebulaCloudsMaterial';
import { PainterlyCloudsMaterial } from '../shaders/PainterlyCloudsMaterial';
import { SkyCloudsMaterial } from '../shaders/SkyCloudsMaterial';
import { SandMaterial } from '../shaders/SandMaterial';
import { SmokeMaterial } from '../shaders/SmokeMaterial';
import { SmokeRibbonMaterial } from '../shaders/SmokeRibbonMaterial';
import { WaterMaterial } from '../shaders/WaterMaterial';
import { oceanPresets } from '../presets/oceanPresets';
import { cloudsPresets } from '../presets/cloudsPresets';
import { glassPresets } from '../presets/glassPresets';
import { metalPresets } from '../presets/metalPresets';
import { crystalPresets } from '../presets/crystalPresets';
import { woodPresets } from '../presets/woodPresets';
import { plasticPresets } from '../presets/plasticPresets';
import { StormCloudsPointsMaterial } from '../shaders/StormCloudsPointsMaterial';
import { BubblesPointsMaterial } from '../shaders/BubblesPointsMaterial';
import { GlyphRingMaterial } from '../shaders/GlyphRingMaterial';
import { SparklesBurstMaterial } from '../shaders/SparklesBurstMaterial';
import { NebulaPointsMaterial } from '../shaders/NebulaPointsMaterial';
import { CloudsPointsMaterial } from '../shaders/CloudsPointsMaterial';
import { VolumetricCloudsPointsMaterial } from '../shaders/VolumetricCloudsPointsMaterial';
import { CartoonCloudsPointsMaterial } from '../shaders/CartoonCloudsPointsMaterial';
import { CirrusCloudsPointsMaterial } from '../shaders/CirrusCloudsPointsMaterial';
import { PainterlyCloudsPointsMaterial } from '../shaders/PainterlyCloudsPointsMaterial';
import { MeshEffectsMaterial } from '../shaders/MeshEffectsMaterial';
import { effectsPresets } from '../presets/effectsPresets';
import { PlasmaLineMaterial, ElectricLineMaterial, RainbowLineMaterial, LavaLineMaterial, FrostLineMaterial, } from '../shaders/LineEffectsMaterials';
import { GhostSignalMaterial, SerpentFlowMaterial, SolarFilamentMaterial, TeslaArcMaterial, VoidRiftMaterial } from '../shaders/lineShaders/index';
import { lavaPresets } from '../presets/lavaPresets';
import { coronaPresets } from '../presets/coronaPresets';
import { LavaMaterial, CoronaMaterial } from '../shaders/index';
import { sandPresets } from '../presets/sandPresets';
import type { MaterialType } from "../types/materials";
import type { MaterialDefinition } from "../services/MaterialRegistry";

const materials: Record<MaterialType, MaterialDefinition> = {
    basic: {
        name: 'Basic Materials',
        description: 'Standard Three.js materials for general objects',
        defaultVariant: 'Standard',
        useCases: [
            'General-purpose 3D objects',
            'Architectural visualization',
            'Product rendering',
            'Game assets',
            'UI and HUD elements',
            'Stylized and artistic scenes',
        ],
        variants: {
            'Basic': {
                name: 'Basic Material',
                description: 'Simple unlit material that is not affected by lights. Renders flat colors or textures without shading calculations, making it the fastest material option.',
                materialClass: MeshBasicMaterial,
                useCases: [
                    'UI elements and HUD overlays',
                    'Unlit backgrounds and skyboxes',
                    'Debug and wireframe visualization',
                    'Flat-shaded stylized art',
                    'Billboards and sprites',
                    'Performance-critical scenes with many objects',
                    'Objects that should ignore scene lighting',
                ],
                textureProperties: ['map', 'alphaMap', 'aoMap', 'envMap'],
                defaultSettings: {
                    color: "#ffffff",
                    map: null,
                    alphaMap: null,
                    envMap: null,
                    aoMap: null,
                    reflectivity: 0.5,
                    wireframe: false,
                    transparent: false,
                    opacity: 1,
                    side: FrontSide,
                }
            },
            'Standard': {
                name: 'Standard Material',
                description: 'Physically based rendering (PBR) material using metallic-roughness workflow. Provides realistic lighting response with good performance balance.',
                materialClass: MeshStandardMaterial,
                useCases: [
                    'General-purpose PBR objects',
                    'Furniture and interior design',
                    'Walls, floors, and architectural surfaces',
                    'Everyday objects and props',
                    'Game assets with realistic lighting',
                    'Product visualization',
                    'Outdoor environments and terrain',
                ],
                textureProperties: ['map', 'normalMap', 'bumpMap', 'aoMap', 'alphaMap', 'displacementMap', 'envMap'],
                defaultSettings: {
                    color: "#ffffff",
                    roughness: 0.5,
                    metalness: 0.5,
                    map: null,
                    envMap: null,
                    envMapIntensity: 1.0,
                    aoMap: null,
                    aoMapIntensity: 1.0,
                    normalMap: null,
                    normalScale: [1, 1],
                    bumpMap: null,
                    bumpScale: 1.0,
                    displacementMap: null,
                    displacementScale: 1.0,
                    emissive: "#000000",
                    emissiveIntensity: 1.0,
                    alphaMap: null,
                    flatShading: false,
                    wireframe: false,
                    transparent: false,
                    opacity: 1,
                    side: FrontSide,
                }
            },
            'Physical': {
                name: 'Physical Material',
                description: 'Advanced PBR material extending Standard with clearcoat, transmission, sheen, and iridescence. The most feature-rich material for photorealistic rendering.',
                materialClass: MeshPhysicalMaterial,
                useCases: [
                    'Car paint and coated surfaces',
                    'Glass, liquids, and transparent objects',
                    'Fabrics with sheen (silk, velvet)',
                    'Gemstones and jewelry',
                    'Soap bubbles and iridescent surfaces',
                    'Advanced architectural materials',
                    'High-end product visualization',
                    'Photorealistic rendering',
                ],
                textureProperties: ['map', 'normalMap', 'alphaMap', 'envMap'],
                defaultSettings: {
                    color: "#ffffff",
                    roughness: 0.5,
                    metalness: 0.5,
                    thickness: 0.5,
                    clearcoat: 0.0,
                    clearcoatRoughness: 0.0,
                    transmission: 0.0,
                    ior: 1.5,
                    map: null,
                    envMap: null,
                    envMapIntensity: 1.0,
                    normalMap: null,
                    normalScale: [1, 1],
                    emissive: "#000000",
                    emissiveIntensity: 1.0,
                    alphaMap: null,
                    attenuationColor: "#ffffff",
                    attenuationDistance: 0,
                    sheen: 0.0,
                    sheenRoughness: 1.0,
                    sheenColor: "#000000",
                    specularIntensity: 1.0,
                    specularColor: "#ffffff",
                    iridescence: 0.0,
                    iridescenceIOR: 1.3,
                    wireframe: false,
                    transparent: true,
                    opacity: 1,
                    side: FrontSide,
                }
            },
            'Phong': {
                name: 'Phong Material',
                description: 'Classic Phong shading model with specular highlights. Uses a non-physically-based approach that is computationally cheaper than PBR materials.',
                materialClass: MeshPhongMaterial,
                useCases: [
                    'Retro and classic 3D aesthetics',
                    'Shiny plastic objects',
                    'Legacy game asset compatibility',
                    'Simple specular highlight effects',
                    'Cartoon-ish shiny surfaces',
                    'Performance-sensitive scenes needing specular',
                    'Quick prototyping with visible highlights',
                ],
                textureProperties: ['map', 'normalMap', 'bumpMap', 'alphaMap', 'envMap'],
                defaultSettings: {
                    color: "#11ffff",
                    shininess: 30,
                    specular: "#111111",
                    map: null,
                    envMap: null,
                    normalMap: null,
                    normalScale: [1, 1],
                    bumpMap: null,
                    bumpScale: 1.0,
                    emissive: "#000000",
                    emissiveIntensity: 1.0,
                    alphaMap: null,
                    reflectivity: 1.0,
                    flatShading: false,
                    wireframe: false,
                    transparent: false,
                    opacity: 1,
                    side: FrontSide,
                }
            },
            'Lambert': {
                name: 'Lambert Material',
                description: 'Non-shiny material using Lambertian reflectance model. Only calculates lighting at vertices, making it very performant for large scenes.',
                materialClass: MeshLambertMaterial,
                useCases: [
                    'Performance-optimized large scenes',
                    'Matte and diffuse surfaces',
                    'Terrain and landscape rendering',
                    'Low-poly art style',
                    'Mobile-friendly 3D rendering',
                    'Background objects that dont need detail',
                    'Large environments with many objects',
                ],
                textureProperties: ['map', 'alphaMap', 'aoMap', 'envMap'],
                defaultSettings: {
                    color: "#11ffff",
                    map: null,
                    envMap: null,
                    emissive: "#000000",
                    emissiveIntensity: 1.0,
                    alphaMap: null,
                    aoMap: null,
                    reflectivity: 1.0,
                    wireframe: false,
                    transparent: false,
                    opacity: 1,
                    side: FrontSide,
                }
            },
            'Toon': {
                name: 'Toon Material',
                description: 'Cel-shaded material that creates flat color bands instead of smooth gradients. Uses a gradient map to control the number and distribution of shading steps.',
                materialClass: MeshToonMaterial,
                useCases: [
                    'Cel-shaded and anime-style rendering',
                    'Cartoon games and characters',
                    'Stylized illustrations and scenes',
                    'Comic book aesthetics',
                    'Flat-shaded artistic scenes',
                    'Non-photorealistic rendering (NPR)',
                    'Children-friendly visual styles',
                ],
                textureProperties: ['map', 'gradientMap', 'normalMap', 'bumpMap', 'alphaMap'],
                defaultSettings: {
                    color: "#ffffff",
                    gradientMap: null,
                    map: null,
                    normalMap: null,
                    normalScale: [1, 1],
                    bumpMap: null,
                    bumpScale: 1.0,
                    emissive: "#000000",
                    emissiveIntensity: 1.0,
                    alphaMap: null,
                    wireframe: false,
                    transparent: false,
                    opacity: 1,
                    side: FrontSide,
                }
            },
        }
    },
    water: {
        name: 'Water Materials',
        description: 'Water and liquid surface materials',
        defaultVariant: 'BasicWater',
        variants: oceanPresets.reduce((acc, preset) => {
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: WaterMaterial,
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    sand: {
        name: 'Sand Materials',
        description: 'Sand and granular surface materials',
        defaultVariant: 'DesertSand',
        variants: sandPresets.reduce((acc, preset) => {
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: SandMaterial,
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    smoke: {
        name: 'Smoke Materials',
        description: 'Dynamic smoke and volumetric effects using custom shaders',
        defaultVariant: 'Smoke',
        variants: {
            'Smoke': {
                name: 'Smoke',
                description: '2d Smoke shader for volumetric effects',
                materialClass: SmokeMaterial,
                defaultSettings: {
                    u_time: 0,
                    u_colorDark: [0.06, 0.06, 0.07],
                    u_colorLight: [0.58, 0.58, 0.62],
                    u_lightColor: [1.0, 0.95, 0.85],
                    u_lightDir: [-0.6, 0.7, 0.0],
                    u_speed: 0.35,
                    u_turbulence: 1.6,
                    u_transition: 0.32,
                    u_density: 1.0,
                    u_dissipation: 0.45,
                    u_spread: 0.9,
                    u_sway: 0.5,
                    u_windDir: [0.3, 0.0],
                    u_radius: 1.0,
                    u_height: 3.0,
                    u_mouse: [0, -1000, 0],
                    u_mouseStrength: 0.0,
                },
            },
            'SmokeRibbon': {
                name: 'Smoke Ribbon',
                description: 'Ribbon-like smoke effect with swirling motion',
                materialClass: SmokeRibbonMaterial,
                defaultSettings: {
                    u_time: 0,
                    u_color: [0.95, 0.95, 0.97],
                    u_colorTop: [0.7, 0.72, 0.78],
                    u_speed: 0.18,
                    u_detail: 1.4,
                    u_remapLow: 0.38,
                    u_remapHigh: 1.0,
                    u_edgeX: 0.4,
                    u_edgeY: 0.32,
                    u_density: 1.0,
                    u_twistStrength: 9.0,
                    u_twistSpeed: 0.4,
                    u_twistScale: 0.9,
                    u_twistStart: 0.18,
                    u_windDir: [0.15, 0.0],
                    u_mouse: [0, -1000, 0],
                    u_mouseStrength: 0.0,
                },
            }
        }
    },
    glass: {
        name: 'Glass Materials',
        description: 'Glass and transparent materials using MeshPhysicalMaterial',
        defaultVariant: 'ClearGlass',
        variants: glassPresets.reduce((acc, preset) => {
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: MeshPhysicalMaterial,
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    metal: {
        name: 'Metal Materials',
        description: 'Metallic surfaces using MeshStandardMaterial with high metalness',
        defaultVariant: 'Steel',
        variants: metalPresets.reduce((acc, preset) => {
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: MeshStandardMaterial,
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    crystal: {
        name: 'Crystal Materials',
        description: 'Gemstone and crystal materials using MeshPhysicalMaterial with refraction',
        defaultVariant: 'Diamond',
        variants: crystalPresets.reduce((acc, preset) => {
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: MeshPhysicalMaterial,
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    wood: {
        name: 'Wood Materials',
        description: 'Natural wood materials using MeshStandardMaterial',
        defaultVariant: 'Oak',
        variants: woodPresets.reduce((acc, preset) => {
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: MeshStandardMaterial,
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    plastic: {
        name: 'Plastic Materials',
        description: 'Plastic and polymer materials using MeshStandardMaterial and MeshPhysicalMaterial',
        defaultVariant: 'GlossyPlastic',
        variants: plasticPresets.reduce((acc, preset) => {
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: MeshStandardMaterial,
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    clouds: {
        name: 'Cloud Materials',
        description: 'Atmospheric and cloud rendering materials',
        defaultVariant: 'Clouds',
        variants: cloudsPresets.reduce((acc, preset) => {
            // Map materialType to actual material class
            const materialClassMap = {
                'SkyClouds': SkyCloudsMaterial
            };
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: materialClassMap[preset.materialType],
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    lava: {
        name: 'Lava Materials',
        description: 'Lava and molten materials using custom shaders',
        defaultVariant: 'Sun Lava',
        variants: lavaPresets.reduce((acc, preset) => {
            // Map materialType to actual material class
            const materialClassMap = {
                'LavaMaterial': LavaMaterial
            };
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: materialClassMap[preset.materialType],
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    corona: {
        name: 'Corona Materials',
        description: 'Stellar halo / glow shells rendered as additive back-side spheres around a core',
        defaultVariant: 'Sun Corona',
        variants: coronaPresets.reduce((acc, preset) => {
            // Map materialType to actual material class
            const materialClassMap = {
                'CoronaMaterial': CoronaMaterial
            };
            acc[preset.name] = {
                name: preset.name,
                description: preset.description,
                materialClass: materialClassMap[preset.materialType],
                defaultSettings: preset.settings
            };
            return acc;
        }, {})
    },
    effects: {
        name: 'Effect Materials',
        description: 'Special effect materials for various visual effects',
        defaultVariant: 'Clouds',
        variants: {
            ...effectsPresets.reduce((acc, preset) => {
                // Map materialType to actual material class
                const materialClassMap = {
                    'Nebula': NebulaCloudsMaterial,
                    'Clouds': CloudsMaterial,
                    'VolumetricClouds': VolumetricCloudsMaterial,
                    'CartoonClouds': CartoonCloudsMaterial,
                    'StormClouds': StormCloudsMaterial,
                    'CirrusClouds': CirrusCloudsMaterial,
                    'PainterlyClouds': PainterlyCloudsMaterial,
                    'SkyClouds': SkyCloudsMaterial
                };
                acc[preset.name] = {
                    name: preset.name,
                    description: preset.description,
                    materialClass: materialClassMap[preset.materialType],
                    defaultSettings: preset.settings
                };
                return acc;
            }, {}),
            'GlyphRing': {
                name: 'Glyph Ring',
                description: 'Rotating ring of randomized rune glyphs on a plane mesh — additive-blended, with separate ring/glyph colors, optional per-glyph shading, time-driven shape morph and a soft underline.',
                materialClass: GlyphRingMaterial,
                defaultSettings: {
                    uRingColor: '#88ccff',
                    uGlyphsColor: '#88ccff',
                    uShadesMultiplier: 0.0,
                    uHoverColor: '#ffffff',
                    uHoverRadius: 0.3,
                    uHoverIntensity: 0.0,
                    uGlyphCount: 12,
                    uRotation: 0,
                    uMorphSpeed: 0.4,
                    uIntensity: 1.5,
                    uOpacity: 1.0,
                }
            },
            'SparklesBurst': {
                name: 'Sparkles Burst',
                description: 'Radial sparkle-burst shader on a plane mesh — animated wavefront ring expanding outward, N tapered rays radiating from center, a bright soft core, and tiny sparkles travelling along each ray. Driven by a 0→1 progress uniform, configurable core/burst colors, ray count, intensity, opacity, and cursor-proximity hover highlight.',
                materialClass: SparklesBurstMaterial,
                defaultSettings: {
                    uProgress: 0,
                    uRayCount: 8,
                    uCoreColor: '#ffffff',
                    uBurstColor: '#ffaa00',
                    uIntensity: 1.0,
                    uOpacity: 1.0,
                    uHoverColor: '#ffffff',
                    uHoverRadius: 0.3,
                    uHoverIntensity: 0.0,
                }
            }
        }
    },
    advanced: {
        name: 'Advanced Materials',
        description: 'Advanced Drei materials with special effects',
        defaultVariant: 'Reflector',
        variants: {
            'Reflector': {
                name: 'Reflector',
                description: 'Realistic reflective surface with depth-based effects',
                materialClass: null,
                defaultSettings: {
                    color: "#777777",
                    roughness: 0.1,
                    metalness: 1.0,
                    blur: [300, 100],
                    resolution: 512,
                    mixBlur: 1,
                    mixStrength: 40,
                    depthScale: 1,
                    minDepthThreshold: 0.1,
                    maxDepthThreshold: 1,
                    side: DoubleSide
                }
            },
            'Refraction': {
                name: 'Refraction',
                description: 'Glass-like material with light refraction and chromatic aberration',
                materialClass: null,
                defaultSettings: {
                    color: "#ffffff",
                    ior: 2.4,
                    fresnel: 0,
                    aberrationStrength: 0.01,
                    fastChroma: true,
                    side: DoubleSide
                }
            },
            'Transmission': {
                name: 'Transmission',
                description: 'Advanced glass material with realistic light transmission',
                materialClass: null,
                defaultSettings: {
                    transmission: 1,
                    thickness: 0.2,
                    roughness: 0.0,
                    chromaticAberration: 0.03,
                    anisotropy: 0.1,
                    anisotropicBlur: 0.1,
                    distortion: 0.0,
                    distortionScale: 0.3,
                    temporalDistortion: 0.5,
                    transmissionSampler: true,
                    backside: false,
                    backsideThickness: 0.2,
                    backsideEnvMapIntensity: 1,
                    resolution: 256,
                    backsideResolution: 256,
                    samples: 10,
                    side: DoubleSide
                }
            },
            'Distort': {
                name: 'Distort',
                description: 'Animated vortex distortion material',
                materialClass: null,
                defaultSettings: {
                    color: "#ffffff",
                    distort: 0.5,
                    speed: 2,
                    radius: 1,
                    side: DoubleSide
                }
            },
            'Wobble': {
                name: 'Wobble',
                description: 'Animated wobbling vortex material',
                materialClass: null,
                defaultSettings: {
                    color: "#ffffff",
                    factor: 1,
                    speed: 2,
                    side: DoubleSide
                }
            },
            // 'Discard': {
            //   name: 'Discard',
            //   description: 'Material with pixel discard effects',
            //   materialClass: null,
            //   defaultSettings: {
            //     color: "#ffffff",
            //     side: DoubleSide
            //   }
            // },
            // 'Portal': {
            //   name: 'Portal',
            //   description: 'Portal material for creating see-through effects',
            //   materialClass: null,
            //   defaultSettings: {
            //     blend: 1,
            //     resolution: 512,
            //     side: DoubleSide
            //   }
            // }
        }
    },
    particles: {
        name: 'Particle Shader Materials',
        description: 'Shader materials optimized for points geometry with effects',
        defaultVariant: '3dRiseShader',
        variants: {
            '3dRiseShader': {
                name: '3dRise Shader Material',
                description: 'Registry-driven particle shader; built dynamically via buildShaderEffectsMaterial',
                materialClass: null,
                defaultSettings: {
                    uPointSize: 1.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'StormCloudsPoints': {
                name: 'Storm Clouds Points',
                description: 'Storm clouds shader with particle effects for points geometry',
                materialClass: StormCloudsPointsMaterial,
                defaultSettings: {
                    u_stormIntensity: 1.2,
                    u_lightningFreq: 3.0,
                    u_darkColor: [0.1, 0.1, 0.2],
                    u_lightColor: [0.9, 0.9, 1.0],
                    u_turbulence: 0.5,
                    uPointSize: 5.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'NebulaPoints': {
                name: 'Nebula Points',
                description: 'Colorful nebula clouds for points geometry',
                materialClass: NebulaPointsMaterial,
                defaultSettings: {
                    u_color1: [0.8, 0.2, 0.9],
                    u_color2: [0.2, 0.6, 1.0],
                    u_color3: [1.0, 0.4, 0.2],
                    u_glowIntensity: 1.5,
                    u_complexity: 3.0,
                    uPointSize: 5.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'CloudsPoints': {
                name: 'Clouds Points',
                description: 'Classic clouds shader for points geometry',
                materialClass: CloudsPointsMaterial,
                defaultSettings: {
                    u_cloudColor: [0.07, 0.0, 0.24],
                    u_lightColor: [0.25, 0.6, 1.0],
                    u_useOriginalImage: 0.0,
                    uPointSize: 5.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'VolumetricCloudsPoints': {
                name: 'Volumetric Clouds Points',
                description: 'Volumetric clouds with depth for points geometry',
                materialClass: VolumetricCloudsPointsMaterial,
                defaultSettings: {
                    u_cloudDensity: 1.5,
                    u_cloudCoverage: 0.5,
                    u_lightColor: [1.0, 1.0, 1.0],
                    u_shadowColor: [0.3, 0.3, 0.4],
                    uPointSize: 5.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'CartoonCloudsPoints': {
                name: 'Cartoon Clouds Points',
                description: 'Cel-shaded cartoon clouds for points geometry',
                materialClass: CartoonCloudsPointsMaterial,
                defaultSettings: {
                    u_cloudColor: [1.0, 1.0, 1.0],
                    u_edgeThickness: 0.1,
                    uPointSize: 5.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'CirrusCloudsPoints': {
                name: 'Cirrus Clouds Points',
                description: 'Wispy high-altitude clouds for points geometry',
                materialClass: CirrusCloudsPointsMaterial,
                defaultSettings: {
                    u_windSpeed: 0.3,
                    u_wispy: 2.0,
                    u_cloudColor: [1.0, 1.0, 1.0],
                    uPointSize: 5.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'PainterlyCloudsPoints': {
                name: 'Painterly Clouds Points',
                description: 'Artistic painted clouds for points geometry',
                materialClass: PainterlyCloudsPointsMaterial,
                defaultSettings: {
                    u_baseColor: [0.7, 0.8, 0.9],
                    u_highlightColor: [1.0, 1.0, 1.0],
                    u_brushStrokes: 4.0,
                    uPointSize: 5.0,
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                }
            },
            'Bubbles': {
                name: 'Bubbles',
                description: 'Iridescent thin-film soap-bubble shader on points geometry — animated fresnel rim, specular highlight, gentle wobble, end-of-life pop flash, and a configurable 3-color cycle.',
                materialClass: BubblesPointsMaterial,
                defaultSettings: {
                    uScale: 0.1,
                    uColorA: '#aaccff',
                    uColorB: '#ffaadd',
                    uColorC: '#aaffcc',
                    uOpacity: 0.6,
                    uIridescence: 0.7,
                    uPopWindow: 0.18,
                    uSpeed: 1.0,
                }
            }
        }
    },
    custom: {
        name: 'Custom Shader Materials',
        description: 'Custom shader materials for mesh geometry with effects',
        defaultVariant: 'MeshShader',
        variants: {
            'MeshShader': {
                name: '3dRise Mesh Shader Material',
                description: 'Custom shader material for mesh geometry with wave, ripple, vortex, and color effects',
                materialClass: MeshEffectsMaterial,
                textureProperties: ['uTexture', 'uTargetTexture'],
                defaultSettings: {
                    uColor: "#ffffff",
                    uOpacity: 1.0,
                    uTexture: null,
                    uTargetTexture: null,
                }
            }
        }
    },
    shaders: {
        name: 'User Shaders',
        description: 'Custom shader materials created by the user',
        defaultVariant: '',
        variants: {}
    },
    line: {
        name: 'Line Effects',
        description: 'Animated edge effects rendered as dense point clouds along object geometry edges',
        defaultVariant: 'Plasma',
        useCases: [
            'Sci-fi wireframe outlines',
            'Magic / spell effects',
            'Energy shields and force fields',
            'Data visualization overlays',
            'Stylized neon edges',
        ],
        variants: {
            Tesla: {
                name: 'Tesla',
                description: 'Cool tesla electricity effect.',
                materialClass: TeslaArcMaterial,
                useCases: ['Sci-fi energy', 'Magic auras', 'Psychedelic visuals', 'Electricity effects', 'Energy weapons', 'Electric fields'],
                defaultSettings: {
                    u_arcColor: [0.4, 0.8, 1.0], // Electric cyan
                    u_glowColor: [0.1, 0.3, 0.9], // Deep blue plasma
                    u_speed: 1.0,
                    u_intensity: 1.5,
                    u_forkDensity: 6.0,
                },
            },
            Serpent: {
                name: 'Serpent',
                description: 'Flowing multi-colour plasma waves rippling along every edge.',
                materialClass: SerpentFlowMaterial,
                useCases: ['Sci-fi energy', 'Magic auras', 'Psychedelic visuals'],
                defaultSettings: {
                    u_colorA: [1.0, 0.2, 0.8], // Magenta
                    u_colorB: [0.1, 0.9, 1.0], // Cyan
                    u_colorC: [0.8, 1.0, 0.2], // Chartreuse
                    u_speed: 0.6,
                    u_width: 0.35,
                    u_shimmer: 0.7,
                },
            },
            Ghost: {
                name: 'Ghost',
                description: 'Ethereal ghostly wisps that flow and fade along edges.',
                materialClass: GhostSignalMaterial,
                useCases: ['Sci-fi energy', 'Magic auras', 'Psychedelic visuals'],
                defaultSettings: {
                    u_signalColor: [0.2, 1.0, 0.5], // Phosphor green
                    u_trailColor: [0.05, 0.4, 0.15], // Dim green
                    u_speed: 0.4,
                    u_packetCount: 3.0,
                    u_trailLength: 0.25,
                    u_glitchIntensity: 0.6,
                },
            },
            Solar: {
                name: 'Solar',
                description: 'Flowing multi-colour plasma waves rippling along every edge.',
                materialClass: SolarFilamentMaterial,
                useCases: ['Sci-fi energy', 'Magic auras', 'Psychedelic visuals'],
                defaultSettings: {
                    u_coreColor: [1.0, 0.98, 0.7], // White-hot
                    u_midColor: [1.0, 0.55, 0.05], // Solar orange
                    u_coolColor: [0.7, 0.08, 0.02], // Deep plasma red
                    u_flareColor: [1.0, 0.9, 0.3], // Bright yellow flare
                    u_speed: 0.5,
                    u_turbulence: 1.2,
                },
            },
            VoidRift: {
                name: 'Void Rift',
                description: 'Dark void rift with swirling cosmic energy and starry sparkles.',
                materialClass: VoidRiftMaterial,
                useCases: ['Sci-fi energy', 'Magic auras', 'Psychedelic visuals'],
                defaultSettings: {
                    u_riftColor: [0.02, 0.0, 0.06], // Near-void purple-black
                    u_radiationColor: [0.9, 0.95, 1.0, 1.0], // Cool white radiation
                    u_lensColor: [0.5, 0.2, 1.0, 1.0], // Violet gravitational lens
                    u_speed: 0.4,
                    u_riftWidth: 0.12,
                    u_radiationDensity: 8.0,
                },
            },
            Plasma: {
                name: 'Plasma',
                description: 'Flowing multi-colour plasma waves rippling along every edge.',
                materialClass: PlasmaLineMaterial,
                useCases: ['Sci-fi energy', 'Magic auras', 'Psychedelic visuals'],
                defaultSettings: {
                    u_speed: 0.8,
                    uIntensity: 1.2,
                    uDensity: 1.0,
                    glowIntensity: 0.30,
                },
            },
            Electric: {
                name: 'Electric',
                description: 'High-frequency lightning bolts that crackle and jitter along edges.',
                materialClass: ElectricLineMaterial,
                useCases: ['Lightning effects', 'Energy weapons', 'Electric fields'],
                defaultSettings: {
                    u_speed: 1.8,
                    uIntensity: 1.5,
                    uDensity: 0.8,
                    glowIntensity: 0.15,
                },
            },
            Rainbow: {
                name: 'Rainbow',
                description: 'Slowly undulating full-spectrum colour interference patterns.',
                materialClass: RainbowLineMaterial,
                useCases: ['Holographic effects', 'Prism / iridescent outlines', 'Festive visuals'],
                defaultSettings: {
                    u_speed: 0.6,
                    uIntensity: 1.0,
                    uDensity: 1.2,
                    glowIntensity: 0.35,
                },
            },
            Lava: {
                name: 'Lava',
                description: 'Slow molten lava flow with glowing orange-red heat bubbles.',
                materialClass: LavaLineMaterial,
                useCases: ['Fire / lava effects', 'Volcanic hazards', 'Hellish environments'],
                defaultSettings: {
                    u_speed: 0.5,
                    uIntensity: 1.1,
                    uDensity: 0.8,
                    glowIntensity: 0.40,
                },
            },
            Frost: {
                name: 'Frost',
                description: 'Slow icy shimmer with crystalline sparkles and cold-blue hues.',
                materialClass: FrostLineMaterial,
                useCases: ['Ice and snow effects', 'Frozen objects', 'Winter environments'],
                defaultSettings: {
                    u_speed: 0.3,
                    uIntensity: 0.8,
                    uDensity: 1.4,
                    glowIntensity: 0.50,
                },
            },
        },
    },
};
export default materials;
