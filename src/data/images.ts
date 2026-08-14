import { FrameData } from "../types/gallery";

// import type { FrameShapeType } from "~/containers/App/Frame";
export const pexel = (id: number): string => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260`;
export const images: FrameData[] = [
    // Front
    { position: [0, 0, 3], rotation: [0, 0, 0], url: pexel(1103970), videoSrc: null, shapeType: 'ellipse' },
    // Back
    { position: [-1.75, 0, -0.12], rotation: [0, 0, 0], url: pexel(416430), videoSrc: null, shapeType: 'circle' },
    { position: [1.75, 0, -0.12], rotation: [0, 0, 0], url: pexel(310452), videoSrc: null, shapeType: 'rectangle' },
    // Left
    {
        position: [-3.5, 0, 0.5],
        rotation: [0, Math.PI / 2.5, 0],
        url: pexel(327482),
        videoSrc: null,
        shapeType: 'roundedRectangle',
    },
    {
        position: [-4.3, 0, 3],
        rotation: [0, Math.PI / 2.5, 0],
        url: pexel(325185),
        videoSrc: null,
        shapeType: 'ellipse',
    },
    {
        position: [-2, 0, 5.5],
        rotation: [0, Math.PI / 2.5, 0],
        url: pexel(358574),
        videoSrc: null,
        shapeType: 'circle',
    },
    // Right
    {
        position: [3.5, 0, 0.5],
        rotation: [0, -Math.PI / 2.5, 0],
        url: pexel(227675),
        videoSrc: null,
    },
    {
        position: [4.3, 0, 3],
        rotation: [0, -Math.PI / 2.5, 0],
        url: pexel(911738),
        videoSrc: null,
    },
    {
        position: [2, 0, 5.5],
        rotation: [0, -Math.PI / 2.5, 0],
        url: pexel(1738986),
        videoSrc: null,
    },
];
