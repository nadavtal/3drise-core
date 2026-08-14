export function createSunPosition(elevation: number, azimuth: number): {
        x: number;
        y: number;
        z: number;
    } {
    const phi = (90 - elevation) * (Math.PI / 180);
    const theta = azimuth * (Math.PI / 180);
    return {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
    };
}
