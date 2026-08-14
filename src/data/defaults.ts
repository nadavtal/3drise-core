import { MaterialRegistryAPI } from "../services/index";
export const DEFAULTS_CONFIGS = {
    rain: {
        color: "#ffffff",
        size: 0.1,
        opacity: 0.5,
        speed: 1.0,
        density: 100,
        windStrength: 0,
        windDirection: 0,
        turbulence: 0,
        splash: false,
    },
    text: {
        text: 'New Text',
        font: 'Arial',
        renderMode: 'bitmap',
        fontSize: 1,
        maxWidth: 10,
        lineHeight: 1,
        letterSpacing: 0,
        textAlign: 'center',
        anchorX: 'center',
        anchorY: 'middle',
    },
    grid: {
        cellSize: 1,
        cellThickness: 1,
        cellColor: '#630c0c',
        sectionSize: 10,
        sectionThickness: 1.5,
        sectionColor: '#ffffff',
    },
    water: {
        planeSize: [100, 100],
        planeSegments: 64,
    },
    stars: {
        rotateSpeed: 0.1,
        count: 5000,
        color: '#ffffff',
        opacity: 1,
        size: 0.1,
    },
    clouds: {
        speed: 1,
        planeSize: [1000, 1000],
        planeSegments: 64,
    },
    earth: {
        sunPosition: [0, 0, 3],
        atmosphereDayColor: '#4db2ff',
        atmosphereTwilightColor: '#bc490b',
    },
    solarSystem: {
        enableOrbit: true,
        enableSelfRotation: true,
        showOrbitRings: true,
        orbitSpeedMultiplier: 1,
        sunColor: '#ffd27a',
        sunRadius: 8,
        sunIntensity: 3,
        orbitRingColor: '#444444',
        orbitRingOpacity: 0.35,
    },
    shootingStars: {
        enabled: true,
        count: 10,
        color: '#ffffff',
        // colors: [],
        speedRange: [0.05, 0.15],
        lengthRange: [50, 150],
        intervalRange: [2, 5],
        trailLengthRange: [10, 100],
        followMouse: false,
    }
};
export const DEFAULTS_TRANSFORM: {
            rain: {
                scale: [number, number, number];
            };
            water: {
                rotation: [number, number, number];
            };
            stars: {
                scale: [number, number, number];
            };
            shootingStars: {
                scale: [number, number, number];
            };
            clouds: {
                position: [number, number, number];
                rotation: [number, number, number];
            };
        } = {
    rain: { scale: [100, 100, 100] },
    water: { rotation: [-Math.PI / 2, 0, 0] },
    stars: { scale: [500, 500, 500] },
    shootingStars: { scale: [500, 500, 500] },
    clouds: { position: [0, 100, 0], rotation: [-Math.PI / 2, Math.PI, 0] },
};
export const DEFAULTS_MATERIAL: {
            water: {
                materialType: "water";
                materialVariant: string;
            };
            stars: {
                materialType: "particles";
            };
            clouds: {
                materialType: "clouds";
                materialVariant: string;
            };
        } = {
    water: {
        materialType: 'water',
        materialVariant: 'Lake',
        ...MaterialRegistryAPI.getVariantDefinition('Lake').defaultSettings,
    },
    stars: {
        materialType: 'particles',
    },
    clouds: {
        materialType: 'clouds',
        materialVariant: 'Sky Clouds Bright',
        ...MaterialRegistryAPI.getVariantDefinition('Sky Clouds Bright').defaultSettings,
    }
};
