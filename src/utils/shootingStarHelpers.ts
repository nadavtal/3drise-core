import type { ShootingStarsSettings } from "../types/environment";
export interface ShootingStarData {
    id: number;
    position: [number, number, number];
    direction: [number, number, number];
    speed: number;
    color: string;
    trailLength: number;
    length: number;
}


const randomInRange = (min, max) => Math.random() * (max - min) + min;
const generateRandomPosition = (minRadius = 50, maxRadius = 60) => {
    const theta = Math.random() * Math.PI * 2;
    const phi = randomInRange(Math.PI * 0.2, Math.PI * 0.8);
    const radius = randomInRange(minRadius, maxRadius);
    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    ];
};
const generateRandomDirection = () => {
    const x = randomInRange(-1, 1);
    const y = randomInRange(-1, -0.3);
    const z = randomInRange(-0.5, 0.5);
    const len = Math.sqrt(x * x + y * y + z * z);
    return [x / len, y / len, z / len];
};
export const generateShootingStar = (id: number, settings: ShootingStarsSettings): ShootingStarData => {
    if (!settings) {
        return {
            id,
            position: (generateRandomPosition() as any),
            direction: (generateRandomDirection() as any),
            speed: 0.08,
            color: '#ffffff',
            trailLength: 30,
            length: 10,
        };
    }
    const { speedRange, lengthRange, trailLengthRange } = settings;
    return {
        id,
        position: (generateRandomPosition() as any),
        direction: (generateRandomDirection() as any),
        speed: randomInRange(speedRange[0], speedRange[1]),
        color: '#ffffff',
        trailLength: trailLengthRange
            ? Math.floor(randomInRange(trailLengthRange[0], trailLengthRange[1]))
            : 30,
        length: randomInRange(lengthRange[0], lengthRange[1]),
    };
};
export const generateShootingStars = (count: number, settings: ShootingStarsSettings): ShootingStarData[] => Array.from({ length: count }, (_, i) => generateShootingStar(i, settings));
