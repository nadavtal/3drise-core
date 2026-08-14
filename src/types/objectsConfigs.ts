import { ColorRepresentation } from "three";
import { MyGridCellMode, MyGridLineMode } from "../shaders";
export interface EarthConfig {
    sunPosition: [number, number, number];
    atmosphereDayColor: ColorRepresentation;
    atmosphereTwilightColor: ColorRepresentation;
    radius?: number;
}

export interface SolarSystemConfig {
    enableOrbit?: boolean;
    enableSelfRotation?: boolean;
    showOrbitRings?: boolean;
    orbitSpeedMultiplier?: number;
    sunColor?: ColorRepresentation;
    sunRadius?: number;
    sunIntensity?: number;
    orbitRingColor?: ColorRepresentation;
    orbitRingOpacity?: number;
}

export interface MyGridConfig {
    cellSize: number;
    size: number;
    /** plane subdivisions per side; auto-derived when omitted (bumped if displace > 0) */
    segments?: number;
    /** lay flat on XZ (true) or keep upright on XY (false) */
    flat: boolean;
    lineMode: MyGridLineMode;
    cellMode: MyGridCellMode;
    lineWidth: number;
    sectionSize: number;
    sectionWidth: number;
    animSpeed: number;
    animScale: number;
    animIntensity: number;
    fadeDistance?: number;
    fadeStrength: number;
    displace: number;
    lineColor: string;
    sectionColor: string;
    cellColor: string;
    glowColor: string;
    bgColor: string;
    bgOpacity: number;
    followMouse: boolean;
}


export {};
