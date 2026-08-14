export interface LavaPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    materialType: string;
    settings: Record<string, any>;
}
export const lavaPresets: LavaPreset[] = [
    {
        name: "Sun Lava",
        type: "lava",
        category: "effect",
        description: "Bright, boiling lava with sunspots and filament cracks, inspired by the sun's surface",
        tags: ["lava", "bright", "orange", "procedural", "natural", "realistic"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.1,
            u_cellScale: 1.3,
            u_warpStrength: 1.0,
            u_boilAmplitude: 0.028,
            u_crackIntensity: 0.3,
            u_spotIntensity: 1.0,
            u_rimIntensity: 1.6,
            u_brightness: 1.0,
            u_rimColor: [1.0, 0.45, 0.08],
            u_color1: [0.18, 0.005, 0.0],
            u_color2: [0.62, 0.07, 0.005],
            u_color3: [1.0, 0.34, 0.02],
            u_color4: [1.0, 0.72, 0.18],
            u_color5: [1.0, 0.97, 0.78],
        }
    },
    {
        name: "Obsidian Crust",
        type: "lava",
        category: "effect",
        description: "Cooled black basalt skin with molten orange veins bleeding through the cracks",
        tags: ["lava", "dark", "obsidian", "basalt", "cooled", "cracks"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.04,
            u_cellScale: 1.0,
            u_warpStrength: 0.6,
            u_boilAmplitude: 0.02,
            u_crackIntensity: 1.25,
            u_spotIntensity: 0.3,
            u_rimIntensity: 1.0,
            u_brightness: 0.85,
            u_rimColor: [0.85, 0.28, 0.05],
            u_color1: [0.015, 0.012, 0.010],
            u_color2: [0.05, 0.025, 0.020],
            u_color3: [0.35, 0.05, 0.005],
            u_color4: [1.0, 0.42, 0.06],
            u_color5: [1.0, 0.95, 0.60]
        }
    },
    {
        name: "Hellfire",
        type: "lava",
        category: "effect",
        description: "Demonic blood-red magma with heavy boil and a smoldering crimson limb",
        tags: ["lava", "red", "demonic", "hellfire", "thick", "boiling"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.07,
            u_cellScale: 1.1,
            u_warpStrength: 1.2,
            u_boilAmplitude: 0.045,
            u_crackIntensity: 0.55,
            u_spotIntensity: 0.6,
            u_rimIntensity: 2.2,
            u_brightness: 1.05,
            u_rimColor: [1.0, 0.18, 0.05],
            u_color1: [0.08, 0.0, 0.0],
            u_color2: [0.45, 0.02, 0.0],
            u_color3: [0.95, 0.12, 0.0],
            u_color4: [1.0, 0.5, 0.08],
            u_color5: [1.0, 0.92, 0.55]
        }
    },
    {
        name: "Blue Giant",
        type: "lava",
        category: "effect",
        description: "Hyper-hot blue stellar surface — cobalt convection cells with blinding white-hot filaments",
        tags: ["lava", "star", "blue", "cyan", "stellar", "bright"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.18,
            u_cellScale: 1.5,
            u_warpStrength: 1.1,
            u_boilAmplitude: 0.025,
            u_crackIntensity: 0.7,
            u_spotIntensity: 0.7,
            u_rimIntensity: 2.0,
            u_brightness: 1.3,
            u_rimColor: [0.5, 0.75, 1.0],
            u_color1: [0.0, 0.02, 0.10],
            u_color2: [0.0, 0.10, 0.45],
            u_color3: [0.20, 0.55, 1.0],
            u_color4: [0.78, 0.92, 1.0],
            u_color5: [1.0, 1.0, 1.0]
        }
    },
    {
        name: "Toxic Slime",
        type: "lava",
        category: "effect",
        description: "Radioactive green ooze with acid-bright fissures and a sickly chartreuse glow",
        tags: ["lava", "green", "toxic", "acid", "radioactive", "sci-fi"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.09,
            u_cellScale: 1.4,
            u_warpStrength: 0.9,
            u_boilAmplitude: 0.03,
            u_crackIntensity: 0.6,
            u_spotIntensity: 0.5,
            u_rimIntensity: 1.5,
            u_brightness: 1.0,
            u_rimColor: [0.55, 1.0, 0.25],
            u_color1: [0.0, 0.05, 0.0],
            u_color2: [0.02, 0.22, 0.05],
            u_color3: [0.10, 0.62, 0.12],
            u_color4: [0.55, 1.0, 0.35],
            u_color5: [0.85, 1.0, 0.70]
        }
    },
    {
        name: "Cryo Magma",
        type: "lava",
        category: "effect",
        description: "Slow violet cryo-magma with big lazy cells drifting under a soft lilac rim",
        tags: ["lava", "purple", "violet", "cryo", "cold", "slow"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.05,
            u_cellScale: 0.9,
            u_warpStrength: 0.8,
            u_boilAmplitude: 0.025,
            u_crackIntensity: 0.5,
            u_spotIntensity: 0.4,
            u_rimIntensity: 1.7,
            u_brightness: 0.95,
            u_rimColor: [0.55, 0.4, 1.0],
            u_color1: [0.04, 0.0, 0.10],
            u_color2: [0.18, 0.05, 0.45],
            u_color3: [0.40, 0.25, 0.85],
            u_color4: [0.65, 0.75, 1.0],
            u_color5: [0.92, 0.98, 1.0]
        }
    },
    {
        name: "Plasma Storm",
        type: "lava",
        category: "effect",
        description: "Fast, chaotic magenta-violet plasma with lightning-like filament arcs",
        tags: ["lava", "plasma", "magenta", "electric", "chaotic", "fast"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.25,
            u_cellScale: 1.8,
            u_warpStrength: 1.8,
            u_boilAmplitude: 0.03,
            u_crackIntensity: 1.0,
            u_spotIntensity: 0.2,
            u_rimIntensity: 2.4,
            u_brightness: 1.2,
            u_rimColor: [1.0, 0.35, 1.0],
            u_color1: [0.05, 0.0, 0.08],
            u_color2: [0.32, 0.02, 0.45],
            u_color3: [0.95, 0.15, 0.85],
            u_color4: [1.0, 0.65, 1.0],
            u_color5: [1.0, 0.95, 1.0]
        }
    },
    {
        name: "Dying Ember",
        type: "lava",
        category: "effect",
        description: "Dim charred coals, mostly cooled — heat only shows where the crust fractures",
        tags: ["lava", "ember", "coal", "dim", "dying", "atmospheric"],
        materialType: "LavaMaterial",
        settings: {
            u_time: 0,
            u_speed: 0.05,
            u_cellScale: 0.8,
            u_warpStrength: 0.5,
            u_boilAmplitude: 0.018,
            u_crackIntensity: 1.4,
            u_spotIntensity: 0.4,
            u_rimIntensity: 0.8,
            u_brightness: 0.70,
            u_rimColor: [0.9, 0.30, 0.05],
            u_color1: [0.010, 0.005, 0.005],
            u_color2: [0.10, 0.018, 0.008],
            u_color3: [0.55, 0.10, 0.01],
            u_color4: [1.0, 0.45, 0.08],
            u_color5: [1.0, 0.85, 0.35]
        }
    }
];
