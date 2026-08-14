import type { ShapeConfig, ShapeParams } from "../types/particles";
import type { Vector3Array } from "../types/scene3d";
type PointWriter = ReturnType<typeof createPointWriter>;


// ============================================================================
// Shared helpers
//
// Every generator below emits positions inside a UNIT cube centered at the
// origin (longest axis = 1.0, coords in -0.5..0.5) so all shapes render at a
// consistent size. These helpers hold the point-writing / edge-sampling /
// ring-fill logic the generators used to duplicate.
// ============================================================================
/** Write a single xyz point into a flat [x,y,z, x,y,z, ...] buffer. */
export function setPoint(data: Float32Array, particleIndex: number, x: number, y: number, z: number): void {
    data[particleIndex * 3] = x;
    data[particleIndex * 3 + 1] = y;
    data[particleIndex * 3 + 2] = z;
}
/**
 * Sequential writer into a flat position buffer. Tracks the running particle
 * index and silently ignores writes past `total`, so generators can emit
 * "up to N" points without repeating bounds checks everywhere.
 */
export function createPointWriter(data: Float32Array, total: number): {
        add(x: number, y: number, z: number): void;
        /** Sample `count` evenly-spaced points along the segment A->B (inclusive). */
        addSegment(ax: number, ay: number, az: number, bx: number, by: number, bz: number, count: number, skipFirst?: boolean): void;
        readonly count: number;
        readonly done: boolean;
    } {
    let index = 0;
    return {
        add(x, y, z) {
            if (index < total) {
                setPoint(data, index, x, y, z);
                index++;
            }
        },
        /** Sample `count` evenly-spaced points along the segment A->B (inclusive). */
        addSegment(ax, ay, az, bx, by, bz, count, skipFirst = false) {
            for (let i = skipFirst ? 1 : 0; i < count && index < total; i++) {
                const t = count > 1 ? i / (count - 1) : 0.5;
                this.add(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t);
            }
        },
        get count() { return index; },
        get done() { return index >= total; },
    };
}
/**
 * Golden-angle ("Fibonacci sphere") point for an even distribution of `count`
 * points over a sphere surface of the given radius. Shared by the sphere
 * surface and the sphere-shell volume fill.
 */
export function fibonacciSpherePoint(i: number, count: number, radius: number): [number, number, number] {
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const t = count > 1 ? i / (count - 1) : 0.5;
    const phi = Math.acos(1 - 2 * t); // inclination 0..π
    const theta = Math.PI * 2 * goldenRatio * i; // azimuth via golden angle
    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
    ];
}
/**
 * Center a set of paths on the origin and uniformly scale them so their
 * longest axis equals `targetSize` (default 1 → unit cube, coords in
 * -0.5..0.5), preserving aspect ratio. Used to normalize the static
 * coordinate arrays (brain/dna/helix3d/circles) that have no scale param.
 */
export function centerPathsToUnit(paths: number[][], targetSize: number = 1): number[][] {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const path of paths) {
        for (let i = 0; i < path.length; i += 3) {
            for (let k = 0; k < 3; k++) {
                const v = path[i + k];
                if (v < min[k])
                    min[k] = v;
                if (v > max[k])
                    max[k] = v;
            }
        }
    }
    const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    const maxExtent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
    const scale = targetSize / maxExtent;
    return paths.map((path) => {
        const out = new Array(path.length);
        for (let i = 0; i < path.length; i += 3) {
            out[i] = (path[i] - center[0]) * scale;
            out[i + 1] = (path[i + 1] - center[1]) * scale;
            out[i + 2] = (path[i + 2] - center[2]) * scale;
        }
        return out;
    });
}
/**
 * Fill a disk of the given radius with concentric rings, writing up to the
 * writer's remaining capacity. `place(x, y)` maps a 2D ring coordinate onto
 * the target plane (XY for a circle, XZ at a fixed height for a cylinder layer).
 */
export function fillRings(writer: PointWriter, radius: number, ringBudget: number, place: (x: number, y: number) => [number, number, number]): void {
    const rings = Math.ceil(Math.sqrt(ringBudget));
    for (let ring = 0; ring < rings && !writer.done; ring++) {
        const ringRadius = ring / (rings - 1 || 1); // normalized 0..1
        const circumference = 2 * Math.PI * ringRadius;
        const particlesInRing = ring === 0 ? 1 : Math.max(1, Math.round(circumference * rings / 2));
        for (let i = 0; i < particlesInRing && !writer.done; i++) {
            const t = particlesInRing > 1 ? i / particlesInRing : 0;
            const angle = t * Math.PI * 2;
            const [px, py, pz] = place(ringRadius * radius * Math.cos(angle), ringRadius * radius * Math.sin(angle));
            writer.add(px, py, pz);
        }
    }
}
/**
 * Generate positions for a square shape - evenly scattered on x and y axis.
 * Defaults (width = height = 1) span -0.5..0.5.
 * @param width - Width of the square (x-axis)
 * @param height - Height of the square (y-axis)
 * @param length - Number of particles to generate
 * @param outlines - If true, positions particles only on the outer edges
 * @returns Float32Array with particle positions (x, y, z format, 3 values per particle)
 */
export function generateSquarePositions(width: number, height: number, length: number, outlines: boolean): Float32Array {
    const data = new Float32Array(length * 3);
    const writer = createPointWriter(data, length);
    const halfX = width / 2;
    const halfY = height / 2;
    if (outlines) {
        // Distribute particles across the 4 edges proportionally to edge length.
        const perimeter = 2 * (width + height);
        const nWidth = Math.max(2, Math.round((width / perimeter) * length));
        const nHeight = Math.max(2, Math.round((height / perimeter) * length));
        writer.addSegment(-halfX, -halfY, 0, halfX, -halfY, 0, nWidth); // bottom
        writer.addSegment(halfX, -halfY, 0, halfX, halfY, 0, nHeight, true); // right
        writer.addSegment(halfX, halfY, 0, -halfX, halfY, 0, nWidth, true); // top
        writer.addSegment(-halfX, halfY, 0, -halfX, -halfY, 0, nHeight, true); // left
    }
    else {
        // Evenly spaced grid sized to the aspect ratio.
        const aspectRatio = width / height;
        const gridY = Math.round(Math.sqrt(length / aspectRatio));
        const gridX = Math.max(1, Math.round(length / gridY));
        for (let y = 0; y < gridY && !writer.done; y++) {
            for (let x = 0; x < gridX && !writer.done; x++) {
                const normX = gridX > 1 ? x / (gridX - 1) : 0.5;
                const normY = gridY > 1 ? y / (gridY - 1) : 0.5;
                writer.add((normX - 0.5) * width, (normY - 0.5) * height, 0);
            }
        }
    }
    return data;
}
/**
 * Generate positions for a box shape - evenly distributed in 3D space
 * Following the pattern from generateLinePositions for correct position distribution
 * @param meshSize - Size of the box [width, height, depth]
 * @param length - Number of particles to generate
 * @param outlines - If true, positions particles only on the edges; if false, fills the volume
 * @returns Float32Array with particle positions (x, y, z format, 3 values per particle)
 */
export function generateBoxPositions(meshSize: Vector3Array, length: number, outlines: boolean): Float32Array {
    const data = new Float32Array(length * 3);
    const writer = createPointWriter(data, length);
    const [sizeX, sizeY, sizeZ] = meshSize;
    const halfX = sizeX / 2;
    const halfY = sizeY / 2;
    const halfZ = sizeZ / 2;
    if (outlines) {
        // Box wireframe: 12 edges (4 top, 4 bottom, 4 vertical), particles split
        // across the 4 edges in each direction proportionally to edge length.
        const totalEdgeLength = 4 * (sizeX + sizeY + sizeZ);
        const perEdgeX = Math.max(2, Math.ceil(Math.round((4 * sizeX / totalEdgeLength) * length) / 4));
        const perEdgeY = Math.max(2, Math.ceil(Math.round((4 * sizeY / totalEdgeLength) * length) / 4));
        const perEdgeZ = Math.max(2, Math.ceil(Math.round((4 * sizeZ / totalEdgeLength) * length) / 4));
        // Top face edges
        writer.addSegment(-halfX, halfY, -halfZ, halfX, halfY, -halfZ, perEdgeX); // front top
        writer.addSegment(halfX, halfY, -halfZ, halfX, halfY, halfZ, perEdgeZ, true); // right top
        writer.addSegment(halfX, halfY, halfZ, -halfX, halfY, halfZ, perEdgeX, true); // back top
        writer.addSegment(-halfX, halfY, halfZ, -halfX, halfY, -halfZ, perEdgeZ, true); // left top
        // Bottom face edges
        writer.addSegment(-halfX, -halfY, -halfZ, halfX, -halfY, -halfZ, perEdgeX); // front bottom
        writer.addSegment(halfX, -halfY, -halfZ, halfX, -halfY, halfZ, perEdgeZ, true); // right bottom
        writer.addSegment(halfX, -halfY, halfZ, -halfX, -halfY, halfZ, perEdgeX, true); // back bottom
        writer.addSegment(-halfX, -halfY, halfZ, -halfX, -halfY, -halfZ, perEdgeZ, true); // left bottom
        // Vertical edges
        writer.addSegment(-halfX, -halfY, -halfZ, -halfX, halfY, -halfZ, perEdgeY, true); // front left
        writer.addSegment(halfX, -halfY, -halfZ, halfX, halfY, -halfZ, perEdgeY, true); // front right
        writer.addSegment(halfX, -halfY, halfZ, halfX, halfY, halfZ, perEdgeY, true); // back right
        writer.addSegment(-halfX, -halfY, halfZ, -halfX, halfY, halfZ, perEdgeY, true); // back left
    }
    else {
        // Solid box: evenly distributed particles throughout the volume.
        const volume = sizeX * sizeY * sizeZ;
        const baseParticlesPerUnit = Math.cbrt(length / volume);
        let gridX = Math.max(1, Math.round(sizeX * baseParticlesPerUnit));
        let gridY = Math.max(1, Math.round(sizeY * baseParticlesPerUnit));
        let gridZ = Math.max(1, Math.round(sizeZ * baseParticlesPerUnit));
        // Nudge the grid toward the target particle count.
        const gridTotal = gridX * gridY * gridZ;
        if (gridTotal > 0) {
            const scaleFactor = Math.cbrt(length / gridTotal);
            gridX = Math.max(1, Math.round(gridX * scaleFactor));
            gridY = Math.max(1, Math.round(gridY * scaleFactor));
            gridZ = Math.max(1, Math.round(gridZ * scaleFactor));
        }
        for (let z = 0; z < gridZ && !writer.done; z++) {
            for (let y = 0; y < gridY && !writer.done; y++) {
                for (let x = 0; x < gridX && !writer.done; x++) {
                    const normX = gridX > 1 ? x / (gridX - 1) : 0.5;
                    const normY = gridY > 1 ? y / (gridY - 1) : 0.5;
                    const normZ = gridZ > 1 ? z / (gridZ - 1) : 0.5;
                    writer.add((normX - 0.5) * sizeX, (normY - 0.5) * sizeY, (normZ - 0.5) * sizeZ);
                }
            }
        }
    }
    return data;
}
export function generateLinePositions(start: [number, number, number], end: [number, number, number], length: number): Float32Array {
    const data = new Float32Array(length * 3);
    const writer = createPointWriter(data, length);
    writer.addSegment(start[0], start[1], start[2], end[0], end[1], end[2], length);
    return data;
}
/**
 * Generate positions for a triangle shape - evenly distributed
 * Following the pattern from generateLinePositions for correct position distribution
 * @param size - Size of the triangle (distance from center to vortex)
 * @param length - Number of particles to generate
 * @param outlines - If true, positions particles only on the edges; if false, fills the triangle
 * @returns Float32Array with particle positions (x, y, z format, 3 values per particle)
 */
export function generateTrianglePositions(size: number, length: number, outlines: boolean): Float32Array {
    const data = new Float32Array(length * 3);
    const writer = createPointWriter(data, length);
    // Equilateral triangle vertices, bounding-box centered in the XY plane so
    // the whole shape stays within -0.5..0.5. With size = 1 the width (longest
    // axis) is 1.0 and the height is ~0.866.
    const height = size * Math.sqrt(3) / 2;
    const top = [0, height / 2, 0];
    const left = [-size / 2, -height / 2, 0];
    const right = [size / 2, -height / 2, 0];
    if (outlines) {
        const perEdge = Math.ceil(length / 3);
        writer.addSegment(top[0], top[1], 0, left[0], left[1], 0, perEdge); // top -> bottom-left
        writer.addSegment(left[0], left[1], 0, right[0], right[1], 0, perEdge, true); // bottom-left -> bottom-right
        writer.addSegment(right[0], right[1], 0, top[0], top[1], 0, perEdge, true); // bottom-right -> top
    }
    else {
        // Fill via barycentric coordinates, row by row.
        const rows = Math.ceil(Math.sqrt(length * 2));
        for (let row = 0; row < rows && !writer.done; row++) {
            const rowProgress = rows > 1 ? row / (rows - 1) : 0.5;
            const particlesInRow = Math.max(1, Math.round((1 - rowProgress) * rows));
            for (let col = 0; col < particlesInRow && !writer.done; col++) {
                const colProgress = particlesInRow > 1 ? col / (particlesInRow - 1) : 0.5;
                const u = rowProgress;
                const v = colProgress * (1 - rowProgress);
                const w = 1 - u - v;
                writer.add(w * top[0] + u * left[0] + v * right[0], w * top[1] + u * left[1] + v * right[1], 0);
            }
        }
    }
    return data;
}
/**
 * Generate positions for a circle shape - evenly distributed
 * Following the pattern from generateLinePositions for correct position distribution
 * @param radius - Radius of the circle
 * @param length - Number of particles to generate
 * @param outlines - If true, positions particles only on the circle perimeter; if false, fills the circle
 * @returns Float32Array with particle positions (x, y, z format, 3 values per particle)
 */
export function generateCirclePositions(radius: number, length: number, outlines: boolean): Float32Array {
    const data = new Float32Array(length * 3);
    const writer = createPointWriter(data, length);
    if (outlines) {
        // Even distribution around the perimeter.
        for (let i = 0; i < length; i++) {
            const t = length > 1 ? i / (length - 1) : 0.5;
            const angle = t * Math.PI * 2;
            writer.add(radius * Math.cos(angle), radius * Math.sin(angle), 0);
        }
    }
    else {
        // Fill with concentric rings in the XY plane.
        fillRings(writer, radius, length, (x, y) => [x, y, 0]);
    }
    return data;
}
/**
 * Generate positions for a sphere shape - evenly distributed
 * Following the pattern from generateLinePositions for correct position distribution
 * @param radius - Radius of the sphere
 * @param length - Number of particles to generate
 * @param outlines - If true, positions particles only on the sphere surface; if false, fills the volume
 * @returns Float32Array with particle positions (x, y, z format, 3 values per particle)
 */
export function generateSpherePositions(radius: number, length: number, outlines: boolean): Float32Array {
    const data = new Float32Array(length * 3);
    const writer = createPointWriter(data, length);
    if (outlines) {
        // Even surface distribution via the Fibonacci sphere.
        for (let i = 0; i < length; i++) {
            const [x, y, z] = fibonacciSpherePoint(i, length, radius);
            writer.add(x, y, z);
        }
    }
    else {
        // Fill the volume with nested spherical shells, each spread by the same
        // golden-angle distribution.
        const shells = Math.ceil(Math.cbrt(length));
        for (let shell = 0; shell < shells && !writer.done; shell++) {
            const normalizedRadius = shell / (shells - 1 || 1); // 0..1
            const surfaceArea = 4 * Math.PI * normalizedRadius * normalizedRadius;
            const particlesInShell = shell === 0 ? 1 : Math.max(1, Math.round(surfaceArea * shells * shells / 4));
            for (let i = 0; i < particlesInShell && !writer.done; i++) {
                const [x, y, z] = fibonacciSpherePoint(i, particlesInShell, normalizedRadius * radius);
                writer.add(x, y, z);
            }
        }
    }
    return data;
}
/**
 * Generate positions for a cylinder shape - evenly distributed
 * Following the pattern from generateLinePositions for correct position distribution
 * @param radius - Radius of the cylinder
 * @param height - Height of the cylinder
 * @param length - Number of particles to generate
 * @param outlines - If true, positions particles only on the edges (top/bottom circles and vertical edges); if false, fills the volume
 * @returns Float32Array with particle positions (x, y, z format, 3 values per particle)
 */
export function generateCylinderPositions(radius: number, height: number, length: number, outlines: boolean): Float32Array {
    const data = new Float32Array(length * 3);
    const writer = createPointWriter(data, length);
    const halfHeight = height / 2;
    if (outlines) {
        // Top circle, bottom circle, and 4 vertical edges, split proportionally.
        const circumference = 2 * Math.PI * radius;
        const totalOutlineLength = 2 * circumference + 4 * height;
        const perCircle = Math.max(3, Math.round((circumference / totalOutlineLength) * length));
        const perVerticalEdge = Math.max(2, Math.round((height / totalOutlineLength) * length / 4));
        // A circle traced in the XZ plane at a given height (open loop, t uses
        // `/count` so the first and last points don't coincide).
        const addCircle = (y, count) => {
            for (let i = 0; i < count && !writer.done; i++) {
                const angle = (count > 1 ? i / count : 0) * Math.PI * 2;
                writer.add(radius * Math.cos(angle), y, radius * Math.sin(angle));
            }
        };
        addCircle(halfHeight, perCircle);
        addCircle(-halfHeight, perCircle);
        for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2]) {
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            writer.addSegment(x, -halfHeight, z, x, halfHeight, z, perVerticalEdge);
        }
    }
    else {
        // Fill the volume layer by layer, each layer a concentric-ring disk.
        const density = length / (Math.PI * radius * radius * height);
        const layers = Math.max(1, Math.round(height * Math.cbrt(density / Math.PI)));
        const ringsPerLayer = Math.max(1, Math.round(Math.sqrt(length / layers)));
        for (let layer = 0; layer < layers && !writer.done; layer++) {
            const y = layers > 1 ? -halfHeight + (layer / (layers - 1)) * height : 0;
            fillRings(writer, radius, ringsPerLayer, (x, z) => [x, y, z]);
        }
    }
    return data;
}
export const calculateCirclePositions = (count: number, sep: number): Float32Array<ArrayBuffer> => {
    let positions = [];
    for (let i = 0; i < count * count; i++) {
        // Convert i to an angle between 0 and 2π
        let angle = (i / (count * count)) * 2 * Math.PI;
        // Calculate the radius of the current point
        let radius = (sep * ((i % count) - count / 2)) / 150;
        // Convert polar coordinates to Cartesian coordinates
        let x = radius * Math.cos(angle);
        let z = radius * Math.sin(angle);
        let y = 0;
        // let y = graph(x, z);
        positions.push(x, y, z);
    }
    return new Float32Array(positions);
};
export function generateTextPositions(shapeParams: ShapeParams, config: ShapeConfig['text']): Float32Array {
    const { length } = shapeParams;
    const { text, letterSize, spacing } = config;
    // const length = positions ? positions.length : width * height * 4;
    const data = new Float32Array(length);
    // Define letter shapes as filled areas using a bitmap-like approach
    const letterBitmaps = {
        'A': [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ],
        'B': [
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 0]
        ],
        'C': [
            [0, 1, 1, 1],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [0, 1, 1, 1]
        ],
        'D': [
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 1, 1, 0]
        ],
        'E': [
            [1, 1, 1, 1],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 1]
        ],
        'F': [
            [1, 1, 1, 1],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0]
        ],
        'G': [
            [0, 1, 1, 1],
            [1, 0, 0, 0],
            [1, 0, 1, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 1]
        ],
        'H': [
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ],
        'I': [
            [1, 1, 1],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 1]
        ],
        'J': [
            [1, 1, 1, 1],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [1, 0, 1, 0],
            [0, 1, 1, 0]
        ],
        'K': [
            [1, 0, 0, 1],
            [1, 0, 1, 0],
            [1, 1, 0, 0],
            [1, 0, 1, 0],
            [1, 0, 0, 1]
        ],
        'L': [
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 1]
        ],
        'M': [
            [1, 0, 0, 1],
            [1, 1, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ],
        'N': [
            [1, 0, 0, 1],
            [1, 1, 0, 1],
            [1, 0, 1, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ],
        'O': [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ],
        'P': [
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 0],
            [1, 0, 0, 0],
            [1, 0, 0, 0]
        ],
        'Q': [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 1, 1],
            [0, 1, 1, 1]
        ],
        'R': [
            [1, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 1, 1, 0],
            [1, 0, 1, 0],
            [1, 0, 0, 1]
        ],
        'S': [
            [0, 1, 1, 1],
            [1, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 1],
            [1, 1, 1, 0]
        ],
        'T': [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0]
        ],
        'U': [
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ],
        'V': [
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 0],
            [0, 0, 1, 0]
        ],
        'W': [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 1, 0, 1, 1],
            [1, 0, 0, 0, 1]
        ],
        'X': [
            [1, 0, 0, 1],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 0, 0, 1]
        ],
        'Y': [
            [1, 0, 0, 1],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        'Z': [
            [1, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [1, 1, 1, 1]
        ],
        '0': [
            [0, 1, 1, 0],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [1, 0, 0, 1],
            [0, 1, 1, 0]
        ],
        '1': [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [1, 1, 1]
        ],
        '2': [
            [1, 1, 1, 0],
            [0, 0, 0, 1],
            [0, 1, 1, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 1]
        ],
        '3': [
            [1, 1, 1, 0],
            [0, 0, 0, 1],
            [0, 1, 1, 0],
            [0, 0, 0, 1],
            [1, 1, 1, 0]
        ],
        ' ': [] // Space
    };
    const letters = text.toUpperCase().split('');
    const totalWidth = letters.length * spacing;
    const startX = -totalWidth / 2;
    // Create a list of all valid particle positions for the text
    const textPositions = [];
    letters.forEach((letter, letterIndex) => {
        const bitmap = letterBitmaps[letter] || letterBitmaps['A'];
        if (bitmap.length === 0)
            return; // Skip spaces
        const letterWidth = bitmap[0]?.length || 4;
        const letterHeight = bitmap.length;
        // For each pixel in the bitmap, create multiple particles for density
        for (let row = 0; row < letterHeight; row++) {
            for (let col = 0; col < letterWidth; col++) {
                if (bitmap[row] && bitmap[row][col] === 1) {
                    // Create multiple particles per bitmap pixel for better density
                    const particlesPerPixel = 8;
                    for (let p = 0; p < particlesPerPixel; p++) {
                        const pixelX = startX + letterIndex * spacing + (col + Math.random()) * letterSize / letterWidth;
                        const pixelY = ((letterHeight - 1 - row) + Math.random() - letterHeight / 2) * letterSize / letterHeight;
                        const pixelZ = (Math.random() - 0.5) * 0.3;
                        textPositions.push([pixelX, pixelY, pixelZ]);
                    }
                }
            }
        }
    });
    // If no valid positions, create a fallback
    if (textPositions.length === 0) {
        textPositions.push([0, 0, 0]);
    }
    // Fill the data array by cycling through valid text positions
    for (let i = 0; i < length; i += 3) {
        const index = i / 3;
        const posIndex = index % textPositions.length;
        const pos = textPositions[posIndex];
        // Add some slight randomness to avoid perfect repetition
        const randomOffset = 0.1;
        data[i] = pos[0] + (Math.random() - 0.5) * randomOffset; // x
        data[i + 1] = pos[1] + (Math.random() - 0.5) * randomOffset; // y
        data[i + 2] = pos[2] + (Math.random() - 0.5) * randomOffset; // z
    }
    return data;
}
