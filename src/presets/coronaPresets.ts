import { BackSide } from "three";
export interface CoronaPreset {
    name: string;
    type: string;
    category: string;
    description: string;
    tags: string[];
    materialType: string;
    settings: Record<string, any>;
}

export const coronaPresets: CoronaPreset[] = [
    {
        name: "Sun Corona",
        type: "corona",
        category: "effect",
        description: "Classic warm solar halo with a soft amber limb and gentle breathing pulse",
        tags: ["corona", "halo", "sun", "orange", "warm", "default"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 1.5,
            u_falloff: 1.8,
            u_pulseSpeed: 0.7,
            u_pulseAmount: 0.3,
            u_shellScale: 1.25,
            u_innerColor: [1.0, 0.30, 0.03],
            u_outerColor: [1.0, 0.62, 0.22],
            side: BackSide
        }
    },
    {
        name: "Solar Flare",
        type: "corona",
        category: "effect",
        description: "Hyper-bright stellar halo with a wide hot-yellow limb and rapid breathing",
        tags: ["corona", "halo", "solar", "bright", "yellow", "intense"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 2.4,
            u_falloff: 1.5,
            u_pulseSpeed: 1.2,
            u_pulseAmount: 0.45,
            u_shellScale: 1.30,
            u_innerColor: [1.0, 0.18, 0.02],
            u_outerColor: [1.0, 0.85, 0.40],
            side: BackSide
        }
    },
    {
        name: "Eclipse Crown",
        type: "corona",
        category: "effect",
        description: "Ethereal pale-gold ring with a slow, barely-there pulse — like totality",
        tags: ["corona", "halo", "eclipse", "pale", "gold", "subtle"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 1.2,
            u_falloff: 1.4,
            u_pulseSpeed: 0.3,
            u_pulseAmount: 0.15,
            u_shellScale: 1.35,
            u_innerColor: [0.95, 0.85, 0.65],
            u_outerColor: [1.0, 0.95, 0.80],
            side: BackSide
        }
    },
    {
        name: "Blue Star",
        type: "corona",
        category: "effect",
        description: "Cool stellar atmosphere — cobalt outer fade with a brilliant cyan-white limb",
        tags: ["corona", "halo", "star", "blue", "cyan", "stellar"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 1.8,
            u_falloff: 2.2,
            u_pulseSpeed: 0.5,
            u_pulseAmount: 0.2,
            u_shellScale: 1.28,
            u_innerColor: [0.10, 0.30, 0.85],
            u_outerColor: [0.75, 0.92, 1.0],
            side: BackSide
        }
    },
    {
        name: "Hellfire Halo",
        type: "corona",
        category: "effect",
        description: "Dark crimson halo with a tight, smoldering blood-red limb and slow heavy breath",
        tags: ["corona", "halo", "hellfire", "red", "demonic", "dark"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 1.7,
            u_falloff: 2.5,
            u_pulseSpeed: 0.4,
            u_pulseAmount: 0.40,
            u_shellScale: 1.22,
            u_innerColor: [0.55, 0.02, 0.0],
            u_outerColor: [1.0, 0.22, 0.08],
            side: BackSide
        }
    },
    {
        name: "Plasma Wisp",
        type: "corona",
        category: "effect",
        description: "Electric magenta-violet aura with a flickering, fast-pulsing energy ring",
        tags: ["corona", "halo", "plasma", "magenta", "violet", "electric"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 1.9,
            u_falloff: 2.0,
            u_pulseSpeed: 1.8,
            u_pulseAmount: 0.50,
            u_shellScale: 1.30,
            u_innerColor: [0.40, 0.08, 0.80],
            u_outerColor: [1.0, 0.35, 0.95],
            side: BackSide
        }
    },
    {
        name: "Aurora Veil",
        type: "corona",
        category: "effect",
        description: "Soft emerald-to-chartreuse halo drifting at a slow, dreamlike pace",
        tags: ["corona", "halo", "aurora", "green", "cyan", "ethereal"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 1.4,
            u_falloff: 1.6,
            u_pulseSpeed: 0.25,
            u_pulseAmount: 0.30,
            u_shellScale: 1.35,
            u_innerColor: [0.10, 0.55, 0.40],
            u_outerColor: [0.65, 1.0, 0.75],
            side: BackSide
        }
    },
    {
        name: "Frozen Halo",
        type: "corona",
        category: "effect",
        description: "Icy blue-to-white ring with a calm, almost steady glow — frost glow of a cold body",
        tags: ["corona", "halo", "ice", "frozen", "blue", "calm"],
        materialType: "CoronaMaterial",
        settings: {
            u_time: 0,
            u_intensity: 1.3,
            u_falloff: 2.4,
            u_pulseSpeed: 0.2,
            u_pulseAmount: 0.15,
            u_shellScale: 1.25,
            u_innerColor: [0.20, 0.45, 0.85],
            u_outerColor: [0.92, 0.97, 1.0],
            side: BackSide
        }
    }
];
