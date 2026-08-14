import { Vector3 } from "three";
export const createSpherePaths = (radius: number = 0.1, segments: number = 2): number[][] => {
    let paths = [];
    // segments
    for (let i = 0; i < segments; i++) {
        //points
        let points = [];
        let length = 1;
        // let length = randomRange(0.1, 1)
        for (let j = 0; j < 100; j++) {
            const point = new Vector3().setFromSphericalCoords(radius, Math.PI - (j / 100) * Math.PI * length, (i / segments) * Math.PI * 2);
            points.push(point.x, point.y, point.z);
        }
        paths.push(points);
    }
    return paths;
};
export const createLinesPaths = (width: number = 0.2, height: number = 0.2, depth: number = 0.1, segments: number = 2): number[][] => {
    let paths = [];
    // segments
    for (let i = 0; i < segments; i++) {
        //points
        let points = [];
        for (let j = 0; j <= 100; j++) {
            const x = (j / 100) * width - width / 2;
            const y = (i / segments) * height - height / 2;
            const z = depth / 2;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createBoxPaths = (width: number = 0.2, height: number = 0.2, depth: number = 0.2, segments: number = 2): (number | undefined)[][] => {
    let paths = [];
    // faces
    for (let face = 0; face < 6; face++) {
        // segments
        for (let i = 0; i < segments; i++) {
            //points
            let points = [];
            for (let j = 0; j <= 100; j++) {
                let x, y, z;
                switch (face) {
                    case 0: // front face
                        x = (j / 100) * width - width / 2;
                        y = (i / segments) * height - height / 2;
                        z = depth / 2;
                        break;
                    case 1: // back face
                        x = (j / 100) * width - width / 2;
                        y = (i / segments) * height - height / 2;
                        z = -depth / 2;
                        break;
                    case 2: // left face
                        x = -width / 2;
                        y = (i / segments) * height - height / 2;
                        z = (j / 100) * depth - depth / 2;
                        break;
                    case 3: // right face
                        x = width / 2;
                        y = (i / segments) * height - height / 2;
                        z = (j / 100) * depth - depth / 2;
                        break;
                    case 4: // top face
                        x = (j / 100) * width - width / 2;
                        y = height / 2;
                        z = (i / segments) * depth - depth / 2;
                        break;
                    case 5: // bottom face
                        x = (j / 100) * width - width / 2;
                        y = -height / 2;
                        z = (i / segments) * depth - depth / 2;
                        break;
                }
                points.push(x, y, z);
            }
            paths.push(points);
        }
    }
    return paths;
};
export const createSquarePaths = (size: number = 0.2, segments: number = 2): number[][] => {
    let paths = [];
    const halfSize = size / 2;
    // Create paths around the square perimeter in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            let x, y;
            // Trace around the square (4 sides)
            if (progress < 0.25) {
                // Bottom edge (left to right)
                const t = progress / 0.25;
                x = -halfSize + t * size;
                y = -halfSize;
            }
            else if (progress < 0.5) {
                // Right edge (bottom to top)
                const t = (progress - 0.25) / 0.25;
                x = halfSize;
                y = -halfSize + t * size;
            }
            else if (progress < 0.75) {
                // Top edge (right to left)
                const t = (progress - 0.5) / 0.25;
                x = halfSize - t * size;
                y = halfSize;
            }
            else {
                // Left edge (top to bottom)
                const t = (progress - 0.75) / 0.25;
                x = -halfSize;
                y = halfSize - t * size;
            }
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createCirclePaths = (radius: number = 0.1, segments: number = 2): number[][] => {
    let paths = [];
    // Create circular paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const angle = (j / 100) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createStarPaths = (outerRadius: number = 0.15, innerRadius: number = 0.07, points: number = 5, segments: number = 2): number[][] => {
    let paths = [];
    // Create star-shaped paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let pathPoints = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            const angleStep = (Math.PI * 2) / (points * 2);
            const currentAngle = progress * Math.PI * 2;
            const step = Math.floor(currentAngle / angleStep);
            const isOuter = step % 2 === 0;
            const radius = isOuter ? outerRadius : innerRadius;
            const x = Math.cos(currentAngle) * radius;
            const y = Math.sin(currentAngle) * radius;
            pathPoints.push(x, y, z);
        }
        paths.push(pathPoints);
    }
    return paths;
};
export const createTrianglePaths = (size: number = 0.2, segments: number = 2): number[][] => {
    let paths = [];
    const height = (Math.sqrt(3) / 2) * size; // Equilateral triangle height
    // Create triangular paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            let x, y;
            // Trace around the triangle (3 sides)
            if (progress < 1 / 3) {
                // Bottom edge (left to right)
                const t = progress / (1 / 3);
                x = -size / 2 + t * size;
                y = -height / 2;
            }
            else if (progress < 2 / 3) {
                // Right edge (bottom to top)
                const t = (progress - 1 / 3) / (1 / 3);
                x = size / 2 - t * size / 2;
                y = -height / 2 + t * height;
            }
            else {
                // Left edge (top to bottom)
                const t = (progress - 2 / 3) / (1 / 3);
                x = 0 - t * size / 2;
                y = height / 2 - t * height;
            }
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createHeartPaths = (size: number = 0.15, segments: number = 2): number[][] => {
    let paths = [];
    // Create heart-shaped paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2;
            // Parametric heart equation
            const x = size * 16 * Math.pow(Math.sin(t), 3) / 16;
            const y = size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createSpiralPaths = (radius: number = 0.15, height: number = 0.3, turns: number = 3, segments: number = 2): number[][] => {
    let paths = [];
    // Create multiple spiral paths offset from each other
    for (let i = 0; i < segments; i++) {
        let points = [];
        const angleOffset = (i / segments) * Math.PI * 2;
        for (let j = 0; j <= 100; j++) {
            const t = j / 100;
            const angle = t * turns * Math.PI * 2 + angleOffset;
            const currentRadius = radius * (1 - t * 0.5); // Spiral inward
            const x = Math.cos(angle) * currentRadius;
            const y = Math.sin(angle) * currentRadius;
            const z = (t - 0.5) * height;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createWavePaths = (width: number = 0.3, height: number = 0.3, amplitude: number = 0.05, frequency: number = 2, segments: number = 2): number[][] => {
    let paths = [];
    // Create wave paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = j / 100;
            const x = (t - 0.5) * width;
            const y = Math.sin(t * Math.PI * 2 * frequency) * amplitude;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createInfinityPaths = (size: number = 0.1, segments: number = 2): number[][] => {
    let paths = [];
    // Create infinity symbol (∞) paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2;
            // Lemniscate of Bernoulli (infinity symbol)
            const scale = size * 2;
            const x = (scale * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t));
            const y = (scale * Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t));
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createHexagonPaths = (size: number = 0.2, segments: number = 2): number[][] => {
    let paths = [];
    const radius = size / 2;
    // Create hexagon paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            const sideLength = 1 / 6;
            const side = Math.floor(progress / sideLength);
            const sideProgress = (progress % sideLength) / sideLength;
            // Calculate vertices of hexagon
            const vertices = [];
            for (let v = 0; v < 6; v++) {
                const angle = (v / 6) * Math.PI * 2 - Math.PI / 6;
                vertices.push({
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                });
            }
            // Interpolate between vertices
            const currentVertex = vertices[side % 6];
            const nextVertex = vertices[(side + 1) % 6];
            const x = currentVertex.x + (nextVertex.x - currentVertex.x) * sideProgress;
            const y = currentVertex.y + (nextVertex.y - currentVertex.y) * sideProgress;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createPentagonPaths = (size: number = 0.2, segments: number = 2): number[][] => {
    let paths = [];
    const radius = size / 2;
    // Create pentagon paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            const sideLength = 1 / 5;
            const side = Math.floor(progress / sideLength);
            const sideProgress = (progress % sideLength) / sideLength;
            // Calculate vertices of pentagon
            const vertices = [];
            for (let v = 0; v < 5; v++) {
                const angle = (v / 5) * Math.PI * 2 - Math.PI / 2;
                vertices.push({
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                });
            }
            // Interpolate between vertices
            const currentVertex = vertices[side % 5];
            const nextVertex = vertices[(side + 1) % 5];
            const x = currentVertex.x + (nextVertex.x - currentVertex.x) * sideProgress;
            const y = currentVertex.y + (nextVertex.y - currentVertex.y) * sideProgress;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createFigureEightPaths = (size: number = 0.15, segments: number = 2): number[][] => {
    let paths = [];
    // Create figure-8 paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2;
            // Figure-8 parametric equation (vertical orientation)
            const x = size * Math.sin(t);
            const y = size * Math.sin(t) * Math.cos(t);
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createCloverPaths = (size: number = 0.12, segments: number = 2): number[][] => {
    let paths = [];
    // Create four-leaf clover paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2;
            // Four-leaf clover using rose curve
            const r = size * Math.abs(Math.cos(2 * t));
            const x = r * Math.cos(t);
            const y = r * Math.sin(t);
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createButterflyPaths = (size: number = 0.15, segments: number = 2): number[][] => {
    let paths = [];
    // Create butterfly shape paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 12; // Multiple loops for detail
            // Butterfly curve
            const scale = size * Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin(t / 12), 5);
            const x = Math.sin(t) * scale * 0.02;
            const y = Math.cos(t) * scale * 0.02;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createZigzagPaths = (width: number = 0.3, amplitude: number = 0.08, segments: number = 2, zigzags: number = 5): number[][] => {
    let paths = [];
    // Create zigzag paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = j / 100;
            const x = (t - 0.5) * width;
            // Create zigzag pattern
            const zigzagProgress = (t * zigzags) % 1;
            const y = (zigzagProgress < 0.5 ? zigzagProgress * 2 : 2 - zigzagProgress * 2) * amplitude - amplitude / 2;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createSpringPaths = (radius: number = 0.08, height: number = 0.4, turns: number = 5, segments: number = 2): number[][] => {
    let paths = [];
    // Create spring/coil paths offset from each other
    for (let i = 0; i < segments; i++) {
        let points = [];
        const angleOffset = (i / segments) * Math.PI * 2;
        for (let j = 0; j <= 100; j++) {
            const t = j / 100;
            const angle = t * turns * Math.PI * 2 + angleOffset;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (t - 0.5) * height;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createLissajousPaths = (size: number = 0.15, a: number = 3, b: number = 4, delta: number = Math.PI / 2, segments: number = 2): number[][] => {
    let paths = [];
    // Create Lissajous curve paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2;
            // Lissajous curve parametric equations
            const x = size * Math.sin(a * t + delta);
            const y = size * Math.sin(b * t);
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createRosePaths = (size: number = 0.12, petals: number = 5, segments: number = 2): number[][] => {
    let paths = [];
    // Create rose curve paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2;
            // Rose curve (rhodonea curve)
            const r = size * Math.cos(petals * t);
            const x = r * Math.cos(t);
            const y = r * Math.sin(t);
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createTrefoilKnotPaths = (size: number = 0.1, segments: number = 2): number[][] => {
    let paths = [];
    // Create trefoil knot paths offset from each other
    for (let i = 0; i < segments; i++) {
        let points = [];
        const phaseOffset = (i / segments) * Math.PI * 2;
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2 + phaseOffset;
            // Trefoil knot parametric equations
            const x = size * (Math.sin(t) + 2 * Math.sin(2 * t));
            const y = size * (Math.cos(t) - 2 * Math.cos(2 * t));
            const z = size * (-Math.sin(3 * t));
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createHelixPath = (radius: number = 0.08, height: number = 0.3, turns: number = 3, segments: number = 1): number[][] => {
    let paths = [];
    // Create single helix paths
    for (let i = 0; i < segments; i++) {
        let points = [];
        const angleOffset = (i / segments) * Math.PI * 2;
        for (let j = 0; j <= 100; j++) {
            const t = j / 100;
            const angle = t * turns * Math.PI * 2 + angleOffset;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (t - 0.5) * height;
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createCrossPaths = (size: number = 0.2, thickness: number = 0.06, segments: number = 2): number[][] => {
    let paths = [];
    // Create cross/plus sign paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        // Trace the cross outline
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            let x, y;
            // Divide into 12 segments for the cross outline
            const segment = progress * 12;
            if (segment < 1) {
                // Top of vertical bar
                x = thickness / 2 - progress * 12 * thickness;
                y = size / 2;
            }
            else if (segment < 2) {
                // Right side down to horizontal
                x = -thickness / 2;
                y = size / 2 - (segment - 1) * (size / 2 - thickness / 2);
            }
            else if (segment < 3) {
                // Top of right horizontal
                x = -thickness / 2 - (segment - 2) * (size / 2 - thickness / 2);
                y = thickness / 2;
            }
            else if (segment < 4) {
                // Right end
                x = -size / 2;
                y = thickness / 2 - (segment - 3) * thickness;
            }
            else if (segment < 5) {
                // Bottom of right horizontal
                x = -size / 2 + (segment - 4) * (size / 2 - thickness / 2);
                y = -thickness / 2;
            }
            else if (segment < 6) {
                // Left side down
                x = -thickness / 2;
                y = -thickness / 2 - (segment - 5) * (size / 2 - thickness / 2);
            }
            else if (segment < 7) {
                // Bottom of vertical
                x = -thickness / 2 + (segment - 6) * thickness;
                y = -size / 2;
            }
            else if (segment < 8) {
                // Left side up to horizontal
                x = thickness / 2;
                y = -size / 2 + (segment - 7) * (size / 2 - thickness / 2);
            }
            else if (segment < 9) {
                // Bottom of left horizontal
                x = thickness / 2 + (segment - 8) * (size / 2 - thickness / 2);
                y = -thickness / 2;
            }
            else if (segment < 10) {
                // Left end
                x = size / 2;
                y = -thickness / 2 + (segment - 9) * thickness;
            }
            else if (segment < 11) {
                // Top of left horizontal
                x = size / 2 - (segment - 10) * (size / 2 - thickness / 2);
                y = thickness / 2;
            }
            else {
                // Right side up
                x = thickness / 2;
                y = thickness / 2 + (segment - 11) * (size / 2 - thickness / 2);
            }
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createDiamondPaths = (size: number = 0.2, segments: number = 2): number[][] => {
    let paths = [];
    const halfSize = size / 2;
    // Create diamond (rotated square) paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            let x, y;
            // Trace around the diamond (4 sides)
            if (progress < 0.25) {
                // Right edge (center to bottom)
                const t = progress / 0.25;
                x = halfSize - t * halfSize;
                y = -t * halfSize;
            }
            else if (progress < 0.5) {
                // Bottom edge (right to left)
                const t = (progress - 0.25) / 0.25;
                x = 0 - t * halfSize;
                y = -halfSize + t * halfSize;
            }
            else if (progress < 0.75) {
                // Left edge (bottom to top)
                const t = (progress - 0.5) / 0.25;
                x = -halfSize + t * halfSize;
                y = 0 + t * halfSize;
            }
            else {
                // Top edge (left to right)
                const t = (progress - 0.75) / 0.25;
                x = 0 + t * halfSize;
                y = halfSize - t * halfSize;
            }
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const createCrescentPaths = (size: number = 0.15, thickness: number = 0.5, segments: number = 2): number[][] => {
    let paths = [];
    // Create crescent moon paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const t = (j / 100) * Math.PI * 2;
            // Outer circle
            if (j <= 50) {
                const angle = (j / 50) * Math.PI * 2;
                const x = Math.cos(angle) * size;
                const y = Math.sin(angle) * size;
                points.push(x, y, z);
            }
            else {
                // Inner circle (offset to create crescent)
                const angle = ((j - 50) / 50) * Math.PI * 2;
                const offset = size * thickness;
                const innerRadius = size * 0.8;
                const x = Math.cos(Math.PI - angle) * innerRadius + offset;
                const y = Math.sin(Math.PI - angle) * innerRadius;
                points.push(x, y, z);
            }
        }
        paths.push(points);
    }
    return paths;
};
export const createArrowPaths = (length: number = 0.3, width: number = 0.15, segments: number = 2): number[][] => {
    let paths = [];
    // Create arrow paths in the XY plane (z = 0)
    for (let i = 0; i < segments; i++) {
        let points = [];
        const z = 0; // Keep in XY plane to match position generation
        for (let j = 0; j <= 100; j++) {
            const progress = j / 100;
            let x, y;
            const shaftWidth = width * 0.4;
            const headWidth = width;
            const headLength = length * 0.3;
            const shaftLength = length - headLength;
            // Trace arrow outline
            if (progress < 1 / 7) {
                // Bottom of shaft
                const t = progress / (1 / 7);
                x = -length / 2 + t * shaftLength;
                y = -shaftWidth / 2;
            }
            else if (progress < 2 / 7) {
                // Bottom of head
                const t = (progress - 1 / 7) / (1 / 7);
                x = -length / 2 + shaftLength;
                y = -shaftWidth / 2 - t * (headWidth / 2 - shaftWidth / 2);
            }
            else if (progress < 3 / 7) {
                // Point of arrow
                const t = (progress - 2 / 7) / (1 / 7);
                x = -length / 2 + shaftLength + t * headLength;
                y = -headWidth / 2 + t * headWidth;
            }
            else if (progress < 4 / 7) {
                // Top of head
                const t = (progress - 3 / 7) / (1 / 7);
                x = length / 2 - t * headLength;
                y = headWidth / 2 - t * (headWidth / 2 - shaftWidth / 2);
            }
            else if (progress < 5 / 7) {
                // Top of shaft
                const t = (progress - 4 / 7) / (1 / 7);
                x = -length / 2 + shaftLength - t * shaftLength;
                y = shaftWidth / 2;
            }
            else if (progress < 6 / 7) {
                // Left end
                const t = (progress - 5 / 7) / (1 / 7);
                x = -length / 2;
                y = shaftWidth / 2 - t * shaftWidth;
            }
            else {
                // Close the path
                const t = (progress - 6 / 7) / (1 / 7);
                x = -length / 2;
                y = -shaftWidth / 2;
            }
            points.push(x, y, z);
        }
        paths.push(points);
    }
    return paths;
};
export const brainsPaths: number[][] = [
    [
        0.0038, 0.0749, 0.0085, 0.003, 0.071, 0.0009, 0.0051, 0.0681, -0.0069,
        0.0114, 0.0667, -0.0126, 0.0188, 0.0661, -0.017, 0.0267, 0.0678, -0.0188,
        0.033, 0.0703, -0.0139, 0.0378, 0.0703, -0.0067, 0.0429, 0.0685, 0.0001,
        0.0472, 0.0658, 0.007, 0.0487, 0.0636, 0.0152, 0.0486, 0.0606, 0.0232,
        0.0519, 0.0545, 0.0277, 0.0578, 0.0494, 0.0257, 0.0613, 0.0504, 0.0184,
        0.0593, 0.0554, 0.0118, 0.0565, 0.0596, 0.0048, 0.0539, 0.0627, -0.0029,
        0.051, 0.0649, -0.0108, 0.047, 0.0664, -0.0183, 0.0411, 0.0663, -0.0246,
        0.0364, 0.0626, -0.0303, 0.0387, 0.0565, -0.0356, 0.044, 0.052, -0.0408,
        0.0497, 0.0487, -0.0465, 0.0553, 0.0454, -0.0522, 0.0602, 0.0399, -0.0565,
        0.0638, 0.0325, -0.0592, 0.0663, 0.0249, -0.0624, 0.0673, 0.0175, -0.0667,
        0.0671, 0.009, -0.0677, 0.0662, 0.0007, -0.0655, 0.0637, -0.0064, -0.0612,
        0.0602, -0.0121, -0.0558, 0.056, -0.0161, -0.0494, 0.0562, -0.0229, -0.0451,
        0.0609, -0.0301, -0.0455, 0.067, -0.0357, -0.0477, 0.0736, -0.0408, -0.0465,
        0.079, -0.0459, -0.0419,
    ],
    [
        -0.034, 0.0696, -0.0067, -0.0411, 0.0661, -0.0103, -0.0481, 0.0622, -0.0135,
        -0.0548, 0.057, -0.0152, -0.0608, 0.0518, -0.0123, -0.0652, 0.0486, -0.0056,
        -0.0692, 0.0455, 0.0014, -0.0731, 0.0423, 0.0085, -0.0766, 0.04, 0.0161,
        -0.081, 0.0361, 0.0223, -0.0858, 0.0296, 0.0251, -0.0882, 0.0221, 0.0284,
        -0.0882, 0.0192, 0.0362, -0.0891, 0.0202, 0.0447, -0.0897, 0.0205, 0.0533,
        -0.0873, 0.018, 0.0611, -0.0809, 0.015, 0.0657, -0.0741, 0.0102, 0.0664,
        -0.0718, 0.0019, 0.067, -0.0712, -0.0066, 0.0688, -0.0718, -0.0152, 0.0693,
        -0.0713, -0.0238, 0.0687, -0.0679, -0.0314, 0.0661, -0.0639, -0.038, 0.0623,
        -0.0583, -0.0418, 0.0571, -0.0523, -0.0419, 0.051, -0.0472, -0.0406, 0.044,
        -0.0421, -0.0395, 0.0371, -0.0362, -0.0369, 0.0314, -0.0319, -0.0309,
        0.0271, -0.0291, -0.0235, 0.0235, -0.0243, -0.0188, 0.0185, -0.0172,
        -0.0185, 0.0137, -0.0096, -0.0196, 0.0095, -0.0028, -0.0208, 0.0044, 0.0044,
        -0.0226, -0.0001, 0.0123, -0.024, -0.0035, 0.0199, -0.0236, -0.0076, 0.0261,
        -0.0228, -0.0135, 0.0314, -0.0231, -0.0204, 0.0373, -0.0237, -0.0267,
        0.0439, -0.0253, -0.0321, 0.0506, -0.0272, -0.0374, 0.0573, -0.0296,
        -0.0424, 0.0637, -0.0334, -0.0467, 0.0708, -0.038, -0.0484, 0.0778, -0.0407,
        -0.0446, 0.0833, -0.0423, -0.038, 0.0897, -0.0412, -0.0337, 0.0949, -0.0349,
        -0.0362, 0.0988, -0.0275, -0.0348, 0.1004, -0.0208, -0.0295, 0.1019,
        -0.0158, -0.0226, 0.1025, -0.0113, -0.0153, 0.1013, -0.0049, -0.0096,
    ],
    [
        -0.0454, 0.0357, -0.0569, -0.0372, 0.0383, -0.0585, -0.0297, 0.0421, -0.061,
        -0.0226, 0.0469, -0.0626, -0.0155, 0.0519, -0.0625, -0.0086, 0.0566,
        -0.0596, -0.0008, 0.0599, -0.0576, 0.0073, 0.0623, -0.0556, 0.0146, 0.0648,
        -0.0516, 0.0211, 0.0665, -0.0461, 0.0267, 0.0661, -0.0394, 0.0322, 0.0615,
        -0.0353, 0.0376, 0.056, -0.0388, 0.0429, 0.0519, -0.0444, 0.0488, 0.0486,
        -0.05, 0.0548, 0.0446, -0.055, 0.0602, 0.0386, -0.0581, 0.0642, 0.0311,
        -0.0597, 0.0668, 0.0235, -0.0631, 0.0673, 0.0158, -0.067, 0.067, 0.0072,
        -0.0676, 0.0659, -0.0013, -0.0659, 0.0628, -0.0088, -0.0629, 0.0572,
        -0.0131, -0.058, 0.0503, -0.0151, -0.053, 0.0434, -0.0194, -0.0498, 0.0367,
        -0.0231, -0.0457, 0.0305, -0.0258, -0.0401, 0.0241, -0.0271, -0.0343,
        0.0171, -0.0282, -0.0292, 0.0101, -0.031, -0.0249, 0.006, -0.0377, -0.0219,
        0.0054, -0.0463, -0.0202, 0.0054, -0.055, -0.0193, 0.0057, -0.0637, -0.0195,
        0.0061, -0.0724, -0.0199,
    ],
    [
        0.0113, 0.0336, -0.0878, 0.0164, 0.0382, -0.0824, 0.0238, 0.0412, -0.0788,
        0.0311, 0.0443, -0.0751, 0.0377, 0.0477, -0.0703, 0.0436, 0.0496, -0.0642,
        0.0482, 0.0495, -0.0567, 0.0472, 0.0494, -0.0484, 0.0424, 0.0516, -0.0414,
        0.0379, 0.0564, -0.0356, 0.0359, 0.0625, -0.0301, 0.0414, 0.0663, -0.0246,
        0.0472, 0.0664, -0.0182, 0.0511, 0.0649, -0.0105, 0.054, 0.0626, -0.0025,
        0.0565, 0.0595, 0.0054, 0.0595, 0.0552, 0.0123, 0.0611, 0.0501, 0.0191,
        0.0572, 0.0498, 0.0261, 0.0512, 0.0554, 0.0275, 0.0488, 0.0611, 0.0219,
        0.0488, 0.064, 0.0137, 0.0467, 0.0662, 0.0055, 0.042, 0.0688, -0.0015,
        0.0369, 0.0703, -0.0085, 0.0317, 0.0698, -0.0154, 0.0245, 0.0673, -0.019,
        0.0166, 0.0661, -0.0158, 0.0093, 0.0672, -0.011, 0.0027, 0.0688, -0.0055,
        -0.0035, 0.0698, 0.0006, -0.0098, 0.07, 0.0068, -0.0161, 0.069, 0.0128,
        -0.0229, 0.067, 0.018, -0.0312, 0.0672, 0.0177, -0.0387, 0.0672, 0.0132,
        -0.0457, 0.0642, 0.0146, -0.0506, 0.0615, 0.0214, -0.0571, 0.0583, 0.0258,
        -0.0593, 0.0569, 0.0199,
    ],
    [
        0.0891, -0.047, -0.0175, 0.0884, -0.045, -0.026, 0.086, -0.043, -0.0342,
        0.0814, -0.0414, -0.0414, 0.0749, -0.0399, -0.047, 0.0673, -0.0361, -0.0478,
        0.061, -0.0305, -0.0455, 0.0565, -0.0232, -0.045, 0.0554, -0.0157, -0.0488,
        0.0583, -0.013, -0.0562, 0.0626, -0.0148, -0.0636, 0.0671, -0.0161, -0.0708,
        0.069, -0.0135, -0.0788, 0.066, -0.0109, -0.0864, 0.0597, -0.0108, -0.0924,
        0.0521, -0.013, -0.096, 0.0439, -0.0155, -0.0978, 0.0353, -0.0159, -0.0991,
        0.0272, -0.0132, -0.101, 0.0195, -0.0093, -0.1022, 0.0133, -0.0033, -0.1016,
        0.0093, 0.0043, -0.0998, 0.0076, 0.0124, -0.097, 0.0058, 0.0203, -0.0937,
        0.0021, 0.027, -0.0895, -0.0035, 0.0312, -0.0845, -0.011, 0.0316, -0.0802,
        -0.019, 0.031, -0.0765, -0.0268, 0.0293, -0.073, -0.034, 0.0247, -0.072,
        -0.0383, 0.0176, -0.0746, -0.0387, 0.0095, -0.0774, -0.0323, 0.0054,
        -0.0807, -0.0245, 0.0066, -0.0844, -0.0172, 0.0106, -0.087, -0.0105, 0.0158,
        -0.0892,
    ],
    [
        0.0226, -0.1047, -0.0335, 0.0195, -0.0969, -0.0312, 0.0158, -0.0894,
        -0.0292, 0.0114, -0.0822, -0.0271, 0.0078, -0.0748, -0.0244, 0.0059,
        -0.0671, -0.021, 0.0055, -0.0587, -0.0192, 0.0054, -0.0501, -0.0196, 0.0055,
        -0.0416, -0.021, 0.0077, -0.0337, -0.0234, 0.0137, -0.0291, -0.027, 0.0208,
        -0.0276, -0.0318, 0.0274, -0.0267, -0.0372, 0.0335, -0.0246, -0.0429,
        0.0399, -0.0215, -0.0479, 0.0466, -0.0173, -0.0513, 0.0536, -0.0141,
        -0.0551, 0.06, -0.0117, -0.0603, 0.0645, -0.0058, -0.0645, 0.0667, 0.0022,
        -0.0668, 0.0672, 0.0107, -0.0677, 0.0673, 0.0191, -0.066, 0.0659, 0.0264,
        -0.0616, 0.0629, 0.034, -0.059, 0.0583, 0.041, -0.0571, 0.0527, 0.0462,
        -0.0533, 0.0468, 0.0495, -0.0479, 0.0411, 0.053, -0.0423, 0.036, 0.0575,
        -0.037, 0.0305, 0.0634, -0.0359, 0.025, 0.0666, -0.0415, 0.0192, 0.0661,
        -0.0478, 0.0127, 0.0641, -0.0531, 0.005, 0.0617, -0.0561, -0.0032, 0.0594,
        -0.0576, -0.0095, 0.055, -0.061, -0.0107, 0.0488, -0.0667,
    ],
    [
        -0.0113, 0.065, 0.0502, -0.0185, 0.0634, 0.0459, -0.0259, 0.0612, 0.0494,
        -0.0302, 0.0576, 0.0561, -0.0344, 0.0528, 0.0621, -0.0413, 0.0485, 0.0649,
        -0.0488, 0.0455, 0.0616, -0.0547, 0.0415, 0.0564, -0.0597, 0.0349, 0.0582,
        -0.0637, 0.0283, 0.0624, -0.0688, 0.0223, 0.0665, -0.071, 0.0142, 0.0689,
        -0.0709, 0.0054, 0.0696, -0.0709, -0.0034, 0.0693, -0.0717, -0.0122, 0.0692,
        -0.0716, -0.021, 0.069, -0.0691, -0.0291, 0.0672, -0.0651, -0.0361, 0.0635,
        -0.06, -0.0414, 0.0588, -0.0538, -0.0421, 0.0526, -0.0484, -0.0408, 0.0458,
        -0.0433, -0.0397, 0.0386, -0.0374, -0.0378, 0.0324, -0.0325, -0.0323,
        0.0278, -0.0296, -0.0248, 0.0241, -0.0253, -0.0192, 0.0193, -0.0183,
        -0.0184, 0.0143, -0.0105, -0.0195, 0.0101, -0.0034, -0.0207, 0.0051, 0.0037,
        -0.022, 0.0, 0.0098, -0.0246, -0.0057, 0.0108, -0.032, -0.0101, 0.0116,
        -0.0406, -0.0122, 0.0111, -0.0493, -0.0119, 0.0093, -0.0579, -0.0109,
        0.0087, -0.0667, -0.0105, 0.0103, -0.0753, -0.0113, 0.0135, -0.0828,
        -0.0147, 0.017, -0.0892, -0.0196, 0.0195, -0.0967, -0.0233, 0.0203, -0.1055,
        -0.0233, 0.0206, -0.1141, -0.0216,
    ],
    [
        -0.0283, 0.0634, 0.0276, -0.034, 0.0602, 0.0333, -0.039, 0.0561, 0.039,
        -0.0449, 0.0524, 0.0441, -0.0519, 0.0484, 0.0473, -0.0576, 0.0427, 0.0503,
        -0.0609, 0.0362, 0.0548, -0.063, 0.0291, 0.0592, -0.0672, 0.0237, 0.0643,
        -0.0707, 0.017, 0.0682, -0.0712, 0.0086, 0.0698, -0.0709, -0.0001, 0.0697,
        -0.0712, -0.0087, 0.0692, -0.0719, -0.0173, 0.0692, -0.0708, -0.0259,
        0.0686, -0.0671, -0.033, 0.0656, -0.0628, -0.0392, 0.0614, -0.057, -0.0421,
        0.0559, -0.0512, -0.0416, 0.0496, -0.0462, -0.0401, 0.0426, -0.0408, -0.039,
        0.036, -0.035, -0.0359, 0.0304, -0.0312, -0.0293, 0.0265, -0.0285, -0.0221,
        0.0226, -0.0229, -0.0186, 0.0173, -0.016, -0.0189, 0.0121, -0.0094, -0.0189,
        0.0066, -0.0034, -0.0177, 0.0005, 0.0014, -0.0188, -0.0065, 0.0041, -0.0217,
        -0.0141, 0.0077, -0.0232, -0.0218, 0.0137, -0.0249, -0.0277, 0.0208,
        -0.0268, -0.0323, 0.0278, -0.0271, -0.0373, 0.0341, -0.0269, -0.0432,
        0.0397, -0.0278, -0.0497, 0.0449, -0.0308, -0.056,
    ],
    [
        -0.0451, 0.0052, -0.0729, -0.0506, -0.0004, -0.0691, -0.0561, -0.0048,
        -0.064, -0.0607, -0.0085, -0.0576, -0.0651, -0.0126, -0.0513, -0.0689,
        -0.0166, -0.0444, -0.0733, -0.0213, -0.0385, -0.0769, -0.0272, -0.0333,
        -0.0786, -0.0336, -0.0276, -0.0772, -0.0379, -0.0203, -0.0732, -0.0413,
        -0.0133, -0.0686, -0.0446, -0.0067, -0.0629, -0.0465, -0.0004, -0.0556,
        -0.0466, 0.0043, -0.0476, -0.0437, 0.0057, -0.0411, -0.0379, 0.0058,
        -0.0366, -0.0314, 0.0094, -0.0322, -0.0259, 0.0145, -0.0264, -0.0207,
        0.0184, -0.0183, -0.0188, 0.02, -0.0101, -0.0213, 0.0191, -0.0026, -0.0252,
        0.0169, 0.0054, -0.0281, 0.0152, 0.0132, -0.0318, 0.0135, 0.0196, -0.0373,
        0.0119, 0.0253, -0.0437, 0.0131, 0.0316, -0.0483, 0.0169, 0.0397, -0.0508,
        0.0191, 0.0482, -0.0526, 0.0201, 0.0567, -0.0536, 0.0214, 0.0651, -0.053,
        0.0236, 0.073, -0.0499, 0.0257, 0.0775, -0.044, 0.0294, 0.0753, -0.0388,
        0.0357, 0.0701, -0.0366, 0.0423, 0.0645, -0.0372, 0.0489, 0.0582, -0.0394,
        0.0546, 0.0516, -0.042, 0.0597,
    ],
    [
        -0.054, -0.0429, 0.0473, -0.06, -0.0422, 0.0537, -0.0643, -0.0388, 0.0603,
        -0.0673, -0.0324, 0.0654, -0.0709, -0.025, 0.0686, -0.0719, -0.0164, 0.0692,
        -0.0712, -0.0076, 0.0692, -0.0709, 0.0011, 0.0696, -0.0712, 0.0099, 0.0697,
        -0.0704, 0.0183, 0.0679, -0.0663, 0.0244, 0.0634, -0.0625, 0.0303, 0.0584,
        -0.0604, 0.0375, 0.0539, -0.0564, 0.0439, 0.0496, -0.0502, 0.0493, 0.0466,
        -0.0433, 0.0532, 0.0427, -0.0377, 0.0574, 0.0375, -0.0323, 0.0615, 0.0319,
        -0.0262, 0.0639, 0.0261, -0.0199, 0.0669, 0.0207, -0.0139, 0.0695, 0.0149,
        -0.0077, 0.0702, 0.0088, -0.0017, 0.0698, 0.0024, 0.0037, 0.0687, -0.0044,
        0.0094, 0.0671, -0.0109, 0.0165, 0.0661, -0.0158, 0.0245, 0.0672, -0.019,
        0.0316, 0.0697, -0.0155, 0.0368, 0.0704, -0.0085, 0.0419, 0.0689, -0.0016,
        0.0465, 0.0663, 0.0054, 0.0487, 0.064, 0.0135, 0.049, 0.0612, 0.0218,
        0.0514, 0.0552, 0.0273, 0.0551, 0.0479, 0.0302, 0.0568, 0.041, 0.0352,
        0.0561, 0.0355, 0.0419, 0.0527, 0.0321, 0.0492, 0.0481, 0.0302, 0.0564,
        0.0432, 0.028, 0.0633,
    ],
    [
        -0.0183, 0.0693, 0.0275, -0.0254, 0.0646, 0.0267, -0.032, 0.0616, 0.0311,
        -0.0372, 0.0577, 0.0369, -0.0425, 0.0536, 0.0424, -0.0494, 0.0499, 0.0462,
        -0.0559, 0.0449, 0.049, -0.06, 0.0385, 0.0532, -0.0621, 0.0314, 0.0577,
        -0.0656, 0.0252, 0.0625, -0.07, 0.0195, 0.0672, -0.0712, 0.0114, 0.0696,
        -0.0709, 0.0027, 0.0699, -0.071, -0.006, 0.0693, -0.0718, -0.0146, 0.0692,
        -0.0714, -0.0233, 0.0688, -0.0682, -0.0309, 0.0665, -0.0641, -0.0375,
        0.0626, -0.0587, -0.0419, 0.0575, -0.0527, -0.0419, 0.0513, -0.0476,
        -0.0405, 0.0444, -0.0424, -0.0394, 0.0376, -0.0364, -0.037, 0.0317, -0.0319,
        -0.0312, 0.0273, -0.0292, -0.0239, 0.0235, -0.0246, -0.0188, 0.0186,
        -0.0174, -0.0186, 0.0138, -0.0098, -0.0197, 0.0097, -0.0028, -0.0209,
        0.0047, 0.0042, -0.0221, -0.0004, 0.0096, -0.0252, -0.0061, 0.0109, -0.0325,
        -0.0103, 0.0116, -0.041, -0.012, 0.0112, -0.0497, -0.0118, 0.0094, -0.0581,
        -0.0109, 0.0088, -0.0668, -0.0102, 0.0104, -0.0752, -0.0112, 0.0135,
        -0.0825, -0.0146, 0.017, -0.0889, -0.0193, 0.0192, -0.0963, -0.0233, 0.0192,
        -0.1047, -0.0256,
    ],
    [
        -0.0421, 0.0659, -0.0141, -0.0495, 0.0611, -0.0147, -0.0562, 0.0555,
        -0.0152, -0.0619, 0.0508, -0.0108, -0.0662, 0.048, -0.0037, -0.0702, 0.0446,
        0.0035, -0.074, 0.0417, 0.0108, -0.0779, 0.039, 0.0182, -0.0828, 0.0341,
        0.0234, -0.0872, 0.0269, 0.026, -0.0882, 0.0202, 0.0311, -0.0884, 0.0194,
        0.0396, -0.0896, 0.0206, 0.0483, -0.0893, 0.0196, 0.0569, -0.0848, 0.0166,
        0.0636, -0.0772, 0.0134, 0.0662, -0.0729, 0.0063, 0.0663, -0.0715, -0.0023,
        0.0679, -0.0714, -0.011, 0.0692, -0.0718, -0.0198, 0.0692, -0.0698, -0.0282,
        0.0678, -0.0658, -0.0352, 0.0643, -0.0609, -0.0408, 0.0597, -0.0548,
        -0.0422, 0.0536, -0.0491, -0.0411, 0.047, -0.0442, -0.0398, 0.0398, -0.0384,
        -0.0382, 0.0334, -0.033, -0.0332, 0.0287, -0.0297, -0.0261, 0.0248, -0.0308,
        -0.0244, 0.0174, -0.0343, -0.0291, 0.0109, -0.0348, -0.0345, 0.0041,
        -0.0317, -0.0394, -0.0024, -0.0281, -0.0444, -0.0088, -0.0256, -0.0487,
        -0.016, -0.0229, -0.0506, -0.0241, -0.0208, -0.0507, -0.0327, -0.019,
        -0.0511, -0.0413, -0.018, -0.0521, -0.05, -0.0186, -0.0532, -0.0587,
        -0.0208, -0.0532, -0.0673,
    ],
    [
        -0.0208, 0.0682, 0.0167, -0.0263, 0.0648, 0.0224, -0.0309, 0.0627, 0.0294,
        -0.0357, 0.0591, 0.0355, -0.0408, 0.0546, 0.0409, -0.0473, 0.0509, 0.0452,
        -0.054, 0.0464, 0.0482, -0.0589, 0.0404, 0.0518, -0.0615, 0.0336, 0.0564,
        -0.0642, 0.0269, 0.0609, -0.0689, 0.0219, 0.0662, -0.071, 0.0142, 0.069,
        -0.0709, 0.0056, 0.0697, -0.0709, -0.003, 0.0693, -0.0716, -0.0116, 0.0692,
        -0.0717, -0.0202, 0.0691, -0.0695, -0.0283, 0.0675, -0.0656, -0.0352, 0.064,
        -0.0609, -0.0407, 0.0595, -0.0549, -0.0423, 0.0537, -0.0487, -0.0413,
        0.0478, -0.0425, -0.0401, 0.0418, -0.0365, -0.0383, 0.0359, -0.0314,
        -0.0339, 0.0308, -0.0275, -0.0268, 0.0278, -0.0229, -0.0202, 0.0246,
        -0.0159, -0.0191, 0.0204, -0.0082, -0.0224, 0.0186, -0.0006, -0.026, 0.0168,
        0.0074, -0.0289, 0.0151, 0.0151, -0.0317, 0.0125, 0.0209, -0.0337, 0.0068,
        0.0219, -0.0371, -0.0009, 0.02, -0.044, -0.0051, 0.0182, -0.0524, -0.0054,
        0.0183, -0.061, -0.0051, 0.0207, -0.0692, -0.0056, 0.0228, -0.0774, -0.0075,
    ],
    [
        -0.0454, 0.0197, 0.0852, -0.0541, 0.0193, 0.0867, -0.0626, 0.0182, 0.0858,
        -0.0688, 0.0166, 0.0802, -0.0712, 0.0144, 0.0722, -0.071, 0.0064, 0.0696,
        -0.0709, -0.0024, 0.0694, -0.0715, -0.0112, 0.0692, -0.072, -0.02, 0.0692,
        -0.0697, -0.0282, 0.0677, -0.0658, -0.0352, 0.0643, -0.0608, -0.0406,
        0.0596, -0.0548, -0.0422, 0.0536, -0.0492, -0.0411, 0.047, -0.0442, -0.0398,
        0.0398, -0.0384, -0.0381, 0.0335, -0.0331, -0.0333, 0.0287, -0.03, -0.0261,
        0.025, -0.0262, -0.0199, 0.0203, -0.0198, -0.0184, 0.0148, -0.0128, -0.0192,
        0.0094, -0.0063, -0.0186, 0.0036, -0.0006, -0.0179, -0.003, 0.0038, -0.0199,
        -0.0102, 0.0081, -0.0222, -0.0173, 0.0147, -0.0208, -0.0227, 0.022, -0.0183,
        -0.027, 0.0293, -0.0169, -0.0317, 0.0357, -0.0167, -0.0376, 0.042, -0.0153,
        -0.0437, 0.0485, -0.0129, -0.049, 0.0557, -0.0115, -0.0538, 0.0618, -0.0094,
        -0.0595, 0.0655, -0.0051, -0.0662, 0.0675, -0.0009, -0.0736, 0.0659, 0.0024,
        -0.0814, 0.0603, 0.0036, -0.0878, 0.0528, 0.0023, -0.0921, 0.0453, -0.0005,
        -0.0957, 0.0374, -0.0019, -0.0992, 0.0293, 0.0003, -0.1013, 0.0245, 0.0069,
        -0.0999, 0.025, 0.0147, -0.0962,
    ],
    [
        0.0716, -0.0324, 0.0426, 0.067, -0.0339, 0.0492, 0.0631, -0.0283, 0.0543,
        0.0571, -0.026, 0.0598, 0.0505, -0.0274, 0.0653, 0.0436, -0.026, 0.07,
        0.0369, -0.0214, 0.073, 0.0299, -0.0239, 0.0765, 0.0239, -0.0295, 0.0794,
        0.0168, -0.0342, 0.08, 0.0095, -0.0375, 0.0768, 0.0029, -0.041, 0.0724,
        -0.005, -0.0437, 0.0718, -0.0133, -0.0442, 0.0742, -0.0217, -0.0446, 0.0764,
        -0.0298, -0.0456, 0.0792, -0.0383, -0.0467, 0.081, -0.0469, -0.047, 0.0815,
        -0.0553, -0.0452, 0.0806, -0.0625, -0.0409, 0.0786, -0.0672, -0.0355,
        0.0739, -0.0701, -0.0288, 0.0694, -0.0717, -0.0203, 0.0689, -0.0715,
        -0.0117, 0.0692, -0.0713, -0.0031, 0.0683, -0.0727, 0.0053, 0.0665, -0.0764,
        0.013, 0.0664, -0.0839, 0.0164, 0.0642, -0.089, 0.0194, 0.0582, -0.0896,
        0.0206, 0.0497, -0.0886, 0.0196, 0.0411, -0.0882, 0.0197, 0.0326, -0.0877,
        0.0252, 0.0264, -0.0839, 0.0326, 0.0241, -0.0789, 0.0381, 0.02, -0.075,
        0.0411, 0.0129, -0.0715, 0.0436, 0.0054, -0.0675, 0.047, -0.0015, -0.0634,
        0.0499, -0.0087, -0.0584, 0.0537, -0.0144, -0.052, 0.0594, -0.0147, -0.0451,
        0.064, -0.0123, -0.038, 0.0676, -0.0088, -0.0313, 0.0705, -0.0041, -0.0247,
        0.0728, 0.0011,
    ],
    [
        -0.0672, 0.0213, -0.0455, -0.0608, 0.0262, -0.0491, -0.0539, 0.03, -0.0529,
        -0.0464, 0.0318, -0.057, -0.039, 0.0357, -0.0593, -0.0319, 0.0407, -0.0605,
        -0.0248, 0.0456, -0.0621, -0.0175, 0.0503, -0.0627, -0.0106, 0.0553,
        -0.0606, -0.0031, 0.059, -0.0581, 0.0051, 0.0616, -0.0564, 0.0127, 0.0641,
        -0.0528, 0.0195, 0.0662, -0.0477, 0.0253, 0.0665, -0.0413, 0.0307, 0.0632,
        -0.0355, 0.0363, 0.0572, -0.0375, 0.0415, 0.0528, -0.043, 0.0473, 0.0493,
        -0.0486, 0.0533, 0.0458, -0.0539, 0.0589, 0.0402, -0.0575, 0.0634, 0.0329,
        -0.0592, 0.0663, 0.0253, -0.0621, 0.0673, 0.0178, -0.0666, 0.0671, 0.0092,
        -0.0677, 0.0663, 0.0008, -0.0656, 0.0638, -0.0064, -0.0613, 0.0601, -0.0119,
        -0.0557, 0.0547, -0.0141, -0.0491, 0.0505, -0.0179, -0.0425, 0.0468,
        -0.0224, -0.0358, 0.0417, -0.0257, -0.0296, 0.0355, -0.0267, -0.0236,
        0.0302, -0.0265, -0.0166, 0.026, -0.0272, -0.009, 0.0231, -0.0315, -0.0021,
        0.0231, -0.0377, 0.004, 0.0255, -0.0436, 0.0101, 0.0284, -0.0478, 0.0171,
        0.0234, -0.0502, 0.0227, 0.0152, -0.0494, 0.0256,
    ],
    [
        0.0019, -0.0289, -0.0972, -0.0024, -0.0213, -0.0968, -0.006, -0.0133,
        -0.0962, -0.0109, -0.0069, -0.0936, -0.0184, -0.0061, -0.0897, -0.0254,
        -0.0101, -0.0867, -0.0315, -0.0157, -0.0838, -0.0384, -0.0189, -0.0795,
        -0.0455, -0.0204, -0.0746, -0.0511, -0.023, -0.0685, -0.0567, -0.0257,
        -0.0623, -0.0626, -0.0274, -0.0561, -0.0679, -0.0267, -0.0493, -0.0706,
        -0.0209, -0.0434, -0.0757, -0.0195, -0.0371, -0.0817, -0.0208, -0.0308,
        -0.087, -0.0218, -0.024, -0.0907, -0.0262, -0.0177, -0.0935, -0.0309,
        -0.0111, -0.0971, -0.0299, -0.0035, -0.0994, -0.0238, 0.0022, -0.1007,
        -0.0157, 0.0049, -0.1003, -0.007, 0.005, -0.0976, 0.0013, 0.005, -0.0952,
        0.0078, 0.0082, -0.0967, 0.0051, 0.0162, -0.0968, 0.0033, 0.0247, -0.0964,
        0.0047, 0.0333, -0.0963, 0.0056, 0.042, -0.095, 0.0056, 0.0507, -0.0913,
        0.0053, 0.0585, -0.0849, 0.0051, 0.0643, -0.0768, 0.0072, 0.0664, -0.0728,
        0.0145, 0.0664, -0.0693, 0.0224, 0.0654, -0.063, 0.028, 0.0662, -0.0575,
        0.0318, 0.0717,
    ],
    [
        0.0868, -0.0478, -0.0256, 0.0855, -0.0439, -0.0333, 0.0818, -0.0414,
        -0.0407, 0.0754, -0.0399, -0.0464, 0.0678, -0.0364, -0.0482, 0.061, -0.0319,
        -0.045, 0.0548, -0.0281, -0.0402, 0.0484, -0.0245, -0.0353, 0.0414, -0.0204,
        -0.0323, 0.0334, -0.017, -0.0314, 0.0251, -0.0173, -0.029, 0.0173, -0.0199,
        -0.0261, 0.0094, -0.0225, -0.0231, 0.0019, -0.0255, -0.0196, -0.0056,
        -0.028, -0.0159, -0.0132, -0.0297, -0.0119, -0.0199, -0.0315, -0.0066,
        -0.0264, -0.034, -0.0012, -0.0341, -0.0373, 0.0013, -0.0415, -0.0413,
        0.0035, -0.0493, -0.0449, 0.0052, -0.0575, -0.0468, 0.0033, -0.0645,
        -0.0461, -0.0017, -0.0706, -0.0427, -0.0071, -0.0768, -0.0387, -0.0117,
        -0.0849, -0.036, -0.0128, -0.0924, -0.0329, -0.0098, -0.0971, -0.0294,
        -0.0035, -0.0995, -0.0235, 0.0025, -0.1006, -0.0153, 0.0049, -0.1003,
        -0.0065, 0.0051, -0.0973, 0.0017, 0.0051, -0.0933, 0.0095, 0.0048, -0.0895,
        0.0174, 0.0038, -0.085, 0.0245, 0.0014, -0.0799, 0.0304, -0.0026, -0.0749,
        0.0359, -0.0073, -0.0701, 0.0412, -0.0123,
    ],
    [
        -0.0205, 0.0318, -0.0761, -0.0278, 0.0288, -0.0725, -0.0347, 0.0239, -0.072,
        -0.0382, 0.0167, -0.0752, -0.0391, 0.0084, -0.0775, -0.0424, 0.0009,
        -0.0755, -0.0487, -0.003, -0.0712, -0.0549, -0.0049, -0.0655, -0.0598,
        -0.0076, -0.0588, -0.0642, -0.0118, -0.0526, -0.068, -0.0157, -0.0458,
        -0.0731, -0.0188, -0.0395, -0.0792, -0.0206, -0.0336, -0.0849, -0.0212,
        -0.0271, -0.0895, -0.0234, -0.0201, -0.0921, -0.0292, -0.0142, -0.0954,
        -0.0312, -0.0069, -0.0986, -0.0268, -0.0003, -0.1002, -0.0197, 0.0042,
        -0.1008, -0.0111, 0.0051, -0.0992, -0.0026, 0.005, -0.0957, 0.0053, 0.0054,
        -0.0959, 0.0069, 0.012, -0.0968, 0.0039, 0.02, -0.0965, 0.0039, 0.0287,
        -0.0964, 0.0052, 0.0373, -0.0959, 0.0056, 0.046, -0.0937, 0.0054, 0.0543,
        -0.089, 0.0051, 0.0615, -0.0814, 0.0057, 0.0654, -0.0737, 0.0093, 0.0671,
        -0.0708, 0.0145, 0.0729, -0.0685, 0.0168, 0.0808, -0.062, 0.0183, 0.086,
        -0.0535, 0.0195, 0.0866, -0.0449, 0.0193, 0.0855, -0.0367, 0.0164, 0.0851,
    ],
    [
        -0.0454, 0.0468, 0.0654, -0.0509, 0.0443, 0.0593, -0.0565, 0.0394, 0.0556,
        -0.0608, 0.0328, 0.0591, -0.0649, 0.0267, 0.0634, -0.0704, 0.0207, 0.0659,
        -0.0736, 0.0128, 0.0665, -0.0786, 0.0062, 0.0664, -0.0864, 0.0051, 0.0632,
        -0.0924, 0.0053, 0.0572, -0.0954, 0.0055, 0.0492, -0.0963, 0.0055, 0.0407,
        -0.0964, 0.0045, 0.0322, -0.0967, 0.0036, 0.0237, -0.0966, 0.0055, 0.0154,
        -0.0948, 0.0079, 0.0075, -0.0975, 0.0013, 0.005, -0.1004, -0.0068, 0.0051,
        -0.1007, -0.0154, 0.0049, -0.0996, -0.0234, 0.0024, -0.0972, -0.0294,
        -0.0031, -0.0935, -0.0312, -0.0103, -0.091, -0.0269, -0.0171, -0.0878,
        -0.022, -0.0233, -0.0826, -0.0208, -0.03, -0.0766, -0.0197, -0.0361,
        -0.0713, -0.0206, -0.0424, -0.0683, -0.0259, -0.0484, -0.0635, -0.0276,
        -0.0551, -0.0577, -0.0264, -0.0612, -0.0521, -0.0237, -0.0672, -0.0466,
        -0.021, -0.0733, -0.0399, -0.0193, -0.0784, -0.0332, -0.0165, -0.0829,
        -0.027, -0.0115, -0.0861, -0.0203, -0.007, -0.0888, -0.0126, -0.0052,
        -0.0924, -0.0053, -0.0025, -0.0958,
    ],
    [
        -0.0151, 0.0716, 0.0085, -0.0196, 0.0681, 0.0151, -0.0252, 0.0649, 0.0211,
        -0.0301, 0.0629, 0.028, -0.035, 0.0598, 0.0346, -0.0401, 0.0553, 0.0401,
        -0.0464, 0.0516, 0.0449, -0.0533, 0.0472, 0.0478, -0.0587, 0.0412, 0.0512,
        -0.0614, 0.0344, 0.0559, -0.0637, 0.0272, 0.0603, -0.0686, 0.0222, 0.0655,
        -0.0711, 0.0148, 0.069, -0.071, 0.0061, 0.07, -0.0709, -0.0026, 0.0694,
        -0.0715, -0.0113, 0.0692, -0.0718, -0.0201, 0.0691, -0.0695, -0.0282,
        0.0675, -0.0656, -0.0353, 0.064, -0.0607, -0.0407, 0.0594, -0.0547, -0.0423,
        0.0535, -0.0492, -0.041, 0.0468, -0.0443, -0.0399, 0.0396, -0.0384, -0.0381,
        0.0335, -0.0331, -0.0335, 0.0285, -0.03, -0.0262, 0.0248, -0.0264, -0.0197,
        0.0204, -0.0199, -0.0184, 0.015, -0.013, -0.0192, 0.0096, -0.0066, -0.0185,
        0.0038, -0.0008, -0.0179, -0.0028, 0.0029, -0.0204, -0.0102, 0.0056,
        -0.0227, -0.0182, 0.0105, -0.024, -0.0252, 0.0174, -0.0262, -0.0301, 0.0247,
        -0.0272, -0.0349, 0.0313, -0.0271, -0.0405, 0.0373, -0.027, -0.0469,
    ],
    [
        -0.0132, 0.0276, -0.0824, -0.0189, 0.0312, -0.0769, -0.0262, 0.0302,
        -0.0727, -0.0333, 0.0252, -0.0719, -0.0379, 0.0184, -0.0745, -0.0389,
        0.0102, -0.0772, -0.0412, 0.002, -0.0763, -0.0474, -0.0025, -0.0721,
        -0.0539, -0.0046, -0.0666, -0.059, -0.0071, -0.0599, -0.0635, -0.0111,
        -0.0535, -0.0674, -0.0153, -0.0468, -0.0723, -0.0186, -0.0403, -0.0785,
        -0.0204, -0.0343, -0.0844, -0.0211, -0.0278, -0.0891, -0.0232, -0.0208,
        -0.0919, -0.0288, -0.0147, -0.0951, -0.0315, -0.0073, -0.0985, -0.0271,
        -0.0006, -0.1001, -0.02, 0.0042, -0.1008, -0.0113, 0.0051, -0.0992, -0.0027,
        0.005, -0.0957, 0.0053, 0.0054, -0.0959, 0.0069, 0.012, -0.0969, 0.0038,
        0.0202, -0.0965, 0.004, 0.0289, -0.0963, 0.0053, 0.0377, -0.0959, 0.0056,
        0.0464, -0.0935, 0.0054, 0.0549, -0.0884, 0.0051, 0.0619, -0.0806, 0.0059,
        0.0656, -0.0733, 0.0098, 0.0676, -0.0706, 0.0151, 0.0737, -0.0678, 0.017,
        0.0817, -0.0609, 0.0185, 0.0865, -0.0522, 0.0194, 0.0863, -0.0434, 0.0193,
        0.0854, -0.035, 0.0208, 0.0857, -0.0306, 0.0278, 0.0844, -0.0281, 0.0348,
        0.0798, -0.0227, 0.04, 0.0752,
    ],
    [
        -0.0908, -0.0021, 0.0615, -0.0831, -0.0041, 0.065, -0.0756, -0.008, 0.0668,
        -0.0722, -0.0156, 0.0685, -0.0709, -0.0242, 0.0687, -0.0677, -0.0318,
        0.0659, -0.0636, -0.0384, 0.062, -0.0579, -0.0419, 0.0567, -0.0518, -0.0418,
        0.0505, -0.0469, -0.0405, 0.0434, -0.0416, -0.0394, 0.0366, -0.0358,
        -0.0365, 0.0309, -0.0316, -0.0302, 0.0267, -0.0288, -0.0228, 0.0231,
        -0.0236, -0.0186, 0.018, -0.0168, -0.0187, 0.0126, -0.0101, -0.019, 0.007,
        -0.0039, -0.0179, 0.001, 0.0011, -0.0187, -0.0059, 0.0051, -0.0214, -0.0132,
        0.0106, -0.0219, -0.0197, 0.0175, -0.0198, -0.0245, 0.0249, -0.0179,
        -0.0288, 0.0319, -0.0171, -0.0339, 0.0382, -0.016, -0.0399, 0.0444, -0.0141,
        -0.0457, 0.0511, -0.012, -0.0509, 0.0582, -0.011, -0.0558, 0.0633, -0.0078,
        -0.062, 0.0666, -0.0034, -0.0687, 0.0675, 0.0006, -0.0763, 0.0644, 0.0032,
        -0.0838, 0.0578, 0.0035, -0.0895, 0.0502, 0.0019, -0.0934, 0.0427, -0.0007,
        -0.0969, 0.0347, -0.0012, -0.1, 0.0266, 0.0014, -0.1014,
    ],
    [
        0.0021, 0.0732, -0.0159, 0.0089, 0.0686, -0.0135, 0.0105, 0.0692, -0.0189,
        0.0036, 0.0717, -0.0234, -0.004, 0.0717, -0.0276, -0.0113, 0.0703, -0.0321,
        -0.019, 0.0681, -0.0357, -0.0268, 0.0651, -0.0379, -0.0339, 0.0605, -0.0402,
        -0.0404, 0.0549, -0.0417, -0.0466, 0.0488, -0.0425, -0.0527, 0.0426,
        -0.0428, -0.0592, 0.0368, -0.0421, -0.0644, 0.0303, -0.0398, -0.0678,
        0.0224, -0.039, -0.0698, 0.0145, -0.0422, -0.072, 0.0069, -0.0457, -0.0737,
        -0.0014, -0.0446, -0.073, -0.0096, -0.0417, -0.0743, -0.0172, -0.0381,
        -0.078, -0.0231, -0.0328, -0.0802, -0.0295, -0.0274, -0.0788, -0.0361,
        -0.022, -0.0747, -0.0403, -0.0157, -0.0702, -0.0436, -0.009, -0.0647,
        -0.0464, -0.0028, -0.0603, -0.0509, -0.004, -0.062, -0.0531, -0.0122,
        -0.0613, -0.0549, -0.0207, -0.0577, -0.0577, -0.028, -0.0522, -0.0602,
        -0.0342, -0.0445, -0.0609, -0.0378, -0.0361, -0.0589, -0.0384, -0.0287,
        -0.0556, -0.0413, -0.0215, -0.0534, -0.0456, -0.0146, -0.0554, -0.0502,
    ],
    [
        -0.0256, -0.0183, -0.0872, -0.0216, -0.0107, -0.0882, -0.0164, -0.0038,
        -0.0899, -0.0107, 0.0025, -0.0919, -0.0052, 0.0092, -0.0934, 0.0006, 0.0157,
        -0.094, 0.007, 0.0153, -0.0959, 0.0089, 0.0073, -0.0988, 0.0114, -0.0008,
        -0.1011, 0.017, -0.0074, -0.1021, 0.0244, -0.0119, -0.1016, 0.0323, -0.0151,
        -0.0997, 0.0408, -0.016, -0.0983, 0.0492, -0.0141, -0.0969, 0.057, -0.0117,
        -0.0939, 0.0639, -0.0104, -0.0888, 0.0683, -0.0122, -0.0817, 0.0684,
        -0.0155, -0.0738, 0.0644, -0.0157, -0.0662, 0.0598, -0.0134, -0.0591,
        0.0563, -0.0141, -0.0514, 0.0555, -0.0202, -0.0458, 0.059, -0.0279, -0.0449,
        0.0647, -0.0341, -0.047, 0.072, -0.0387, -0.0479, 0.0793, -0.0408, -0.0439,
        0.0842, -0.0425, -0.037, 0.0868, -0.0457, -0.0293, 0.0865, -0.0487, -0.0211,
        0.0845, -0.0498, -0.0127, 0.0824, -0.0488, -0.0043, 0.0814, -0.0472, 0.0043,
        0.0808, -0.0462, 0.0129, 0.0798, -0.045, 0.0216, 0.0782, -0.0426, 0.0298,
        0.0745, -0.039, 0.0368, 0.0688, -0.0378, 0.0432,
    ],
    [
        -0.0606, 0.0298, -0.0476, -0.0535, 0.0325, -0.052, -0.0459, 0.0346, -0.0559,
        -0.038, 0.0377, -0.058, -0.0305, 0.0416, -0.0605, -0.0233, 0.0462, -0.0625,
        -0.0161, 0.051, -0.0627, -0.0094, 0.0561, -0.06, -0.0018, 0.0596, -0.0576,
        0.0065, 0.0621, -0.0557, 0.014, 0.0645, -0.0521, 0.0205, 0.0664, -0.0465,
        0.0263, 0.0663, -0.0399, 0.0319, 0.0619, -0.0355, 0.0376, 0.0559, -0.0375,
        0.0437, 0.0514, -0.0418, 0.0508, 0.049, -0.0463, 0.0594, 0.0494, -0.0456,
        0.0666, 0.0491, -0.0407, 0.0723, 0.0463, -0.0347, 0.0776, 0.0418, -0.0294,
        0.0831, 0.0363, -0.0253, 0.0884, 0.0299, -0.0224, 0.0926, 0.0224, -0.021,
        0.0966, 0.0146, -0.0201, 0.1, 0.0095, -0.0152, 0.0982, 0.0137, -0.0083,
        0.0942, 0.0196, -0.0031, 0.0898, 0.0252, 0.002, 0.0845, 0.0295, 0.0074,
        0.0791, 0.0308, 0.0142, 0.0747, 0.0302, 0.0218, 0.0702, 0.0294, 0.0293,
        0.0697, 0.0248, 0.0364, 0.0725, 0.0177, 0.0406, 0.0748, 0.0094, 0.0417,
        0.0758, 0.0006, 0.0419,
    ],
    [
        0.004, 0.0673, 0.0408, 0.009, 0.0632, 0.0468, 0.0116, 0.058, 0.0534, 0.0094,
        0.0525, 0.0595, 0.0032, 0.0488, 0.0645, -0.0041, 0.0455, 0.0681, -0.012,
        0.0427, 0.071, -0.0199, 0.0404, 0.0741, -0.0267, 0.0367, 0.0782, -0.03,
        0.0303, 0.083, -0.0329, 0.0226, 0.0857, -0.0405, 0.0192, 0.0853, -0.0493,
        0.0194, 0.086, -0.0581, 0.019, 0.0867, -0.066, 0.0174, 0.0837, -0.0704,
        0.0159, 0.0765, -0.0712, 0.0109, 0.0699, -0.0709, 0.0021, 0.0695, -0.0711,
        -0.0067, 0.0692, -0.0718, -0.0155, 0.0692, -0.0712, -0.0242, 0.0687,
        -0.0677, -0.0318, 0.066, -0.0634, -0.0384, 0.062, -0.0577, -0.042, 0.0566,
        -0.0517, -0.0417, 0.0502, -0.0467, -0.0403, 0.0431, -0.0412, -0.0391,
        0.0363, -0.0352, -0.0362, 0.0306, -0.0313, -0.0295, 0.0265, -0.0285,
        -0.0221, 0.0226, -0.0228, -0.0186, 0.0172, -0.0158, -0.0189, 0.0119,
        -0.0091, -0.019, 0.0062, -0.0029, -0.0178, -0.0, 0.0017, -0.0191, -0.0073,
        0.0044, -0.022, -0.0152, 0.0085, -0.0234, -0.0228, 0.0148, -0.0252, -0.0285,
        0.0221, -0.0269, -0.0332, 0.0291, -0.0271, -0.0385, 0.0354, -0.027, -0.0447,
        0.0411, -0.0282, -0.0513, 0.046, -0.0315, -0.0578, 0.0487, -0.0368, -0.0642,
        0.0489, -0.044, -0.0692,
    ],
    [
        -0.0738, -0.044, 0.0009, -0.0731, -0.0412, -0.007, -0.0771, -0.0379,
        -0.0139, -0.0807, -0.0343, -0.0209, -0.0809, -0.0289, -0.0275, -0.078,
        -0.023, -0.0331, -0.0742, -0.0172, -0.0383, -0.0732, -0.0094, -0.0418,
        -0.0738, -0.0012, -0.0446, -0.0719, 0.007, -0.0456, -0.0698, 0.0147,
        -0.0423, -0.0677, 0.0225, -0.0394, -0.0645, 0.0304, -0.04, -0.0591, 0.0369,
        -0.0419, -0.0526, 0.0426, -0.0428, -0.0464, 0.0488, -0.0426, -0.0402,
        0.0548, -0.0418, -0.0334, 0.0601, -0.041, -0.0257, 0.0641, -0.0402, -0.0178,
        0.0672, -0.0386, -0.0101, 0.0693, -0.0351, -0.0027, 0.0708, -0.0307, 0.0047,
        0.071, -0.0263, 0.0122, 0.0692, -0.0224, 0.0195, 0.0667, -0.0227, 0.0178,
        0.0691, -0.0299, 0.0116, 0.0704, -0.0358, 0.0048, 0.0696, -0.0411, -0.0021,
        0.0674, -0.0459, -0.0097, 0.065, -0.0491, -0.0179, 0.0623, -0.0504, -0.0246,
        0.0574, -0.0524, -0.0281, 0.0502, -0.0559, -0.0322, 0.0429, -0.058, -0.0381,
        0.0366, -0.0587, -0.0444, 0.0307, -0.0597,
    ],
    [
        -0.0616, 0.0217, -0.0533, -0.0576, 0.0285, -0.051, -0.0501, 0.0309, -0.0549,
        -0.0425, 0.0334, -0.0585, -0.0353, 0.0383, -0.0597, -0.0282, 0.0432,
        -0.0615, -0.0209, 0.048, -0.0629, -0.014, 0.0532, -0.0617, -0.0069, 0.0577,
        -0.0588, 0.0013, 0.0605, -0.0572, 0.0094, 0.0629, -0.0549, 0.0165, 0.0653,
        -0.0503, 0.0228, 0.0667, -0.0443, 0.0282, 0.0653, -0.0376, 0.0337, 0.0596,
        -0.0354, 0.039, 0.0548, -0.0403, 0.0445, 0.051, -0.0461, 0.0506, 0.0476,
        -0.0516, 0.0565, 0.043, -0.0562, 0.0616, 0.0364, -0.0586, 0.0653, 0.0286,
        -0.0605, 0.0671, 0.021, -0.0646, 0.0672, 0.0129, -0.0677, 0.0668, 0.0042,
        -0.067, 0.065, -0.0042, -0.0648, 0.061, -0.0109, -0.0611, 0.0545, -0.0137,
        -0.0558, 0.0477, -0.0171, -0.0522, 0.0457, -0.0246, -0.0554, 0.0479,
        -0.0315, -0.0605, 0.0501, -0.0371, -0.0668, 0.0484, -0.0406, -0.0745,
        0.0429, -0.0419, -0.0811, 0.0357, -0.0444, -0.0854, 0.0277, -0.0481,
        -0.0862, 0.0195, -0.0512, -0.0853,
    ],
    [
        -0.0075, -0.0213, -0.094, -0.0074, -0.0128, -0.0955, -0.0116, -0.0063,
        -0.0933, -0.0192, -0.0064, -0.0894, -0.0261, -0.0106, -0.0864, -0.0322,
        -0.016, -0.0834, -0.039, -0.0191, -0.0791, -0.0458, -0.0209, -0.0739,
        -0.0515, -0.0233, -0.0679, -0.0571, -0.0261, -0.0617, -0.063, -0.0278,
        -0.0556, -0.068, -0.026, -0.049, -0.071, -0.0209, -0.0428, -0.0751, -0.0234,
        -0.0363, -0.0778, -0.0299, -0.0312, -0.0786, -0.0358, -0.025, -0.0762,
        -0.0384, -0.0171, -0.0731, -0.0406, -0.0093, -0.0725, -0.0432, -0.0012,
        -0.0757, -0.0438, 0.0068, -0.0786, -0.0442, 0.015, -0.0813, -0.0453, 0.0232,
        -0.0836, -0.0463, 0.0315, -0.0846, -0.0471, 0.0401, -0.0845, -0.0458,
        0.0486, -0.0837, -0.0416, 0.0562, -0.0794, -0.0363, 0.0614, -0.0743,
        -0.0304, 0.065, -0.0725, -0.0224, 0.0681, -0.0715, -0.0139, 0.0691, -0.0711,
        -0.0052, 0.0691, -0.0711, 0.0028, 0.072, -0.0695, 0.0053, 0.08, -0.0647,
        0.0053, 0.0872, -0.057, 0.0055, 0.0911, -0.0485, 0.0059, 0.0926, -0.0398,
        0.0055, 0.0932, -0.0312, 0.005, 0.0942, -0.0229, 0.0072, 0.0946, -0.0161,
        0.012, 0.0923, -0.0108, 0.0177, 0.0885, -0.0061, 0.0238, 0.0844, 0.0004,
        0.0278, 0.0806, 0.0089, 0.0283, 0.0788, 0.0171, 0.0297, 0.0761,
    ],
    [
        -0.0546, -0.0156, -0.0691, -0.0535, -0.0071, -0.0685, -0.0572, -0.0057,
        -0.0621, -0.0619, -0.0088, -0.0554, -0.0671, -0.0108, -0.0487, -0.0726,
        -0.0077, -0.0433, -0.0737, 0.0006, -0.0449, -0.0714, 0.0088, -0.0453,
        -0.0693, 0.0164, -0.0413, -0.0671, 0.0244, -0.039, -0.0633, 0.0322, -0.0404,
        -0.0575, 0.0384, -0.0422, -0.051, 0.0442, -0.0428, -0.0448, 0.0505, -0.0424,
        -0.0385, 0.0564, -0.0415, -0.0312, 0.0613, -0.0408, -0.0234, 0.0651,
        -0.0399, -0.0154, 0.0679, -0.0375, -0.0078, 0.0699, -0.0337, -0.0003, 0.071,
        -0.0292, 0.0072, 0.0708, -0.0249, 0.0148, 0.0681, -0.0216, 0.0199, 0.0674,
        -0.0253, 0.0157, 0.07, -0.0322, 0.0089, 0.0703, -0.0377, 0.0021, 0.0688,
        -0.0431, -0.005, 0.0664, -0.0475, -0.0132, 0.0641, -0.0496, -0.0211, 0.0608,
        -0.0507, -0.026, 0.0545, -0.0539, -0.0243, 0.0491, -0.0596, -0.0169, 0.0504,
        -0.0627, -0.01, 0.0553, -0.0607, -0.002, 0.0565, -0.0611, 0.0045, 0.0535,
        -0.0662, 0.0123, 0.0522, -0.0695, 0.0207, 0.0534, -0.0676, 0.0285, 0.0549,
        -0.0639,
    ],
    [
        -0.0418, -0.0378, 0.0181, -0.0399, -0.0355, 0.0101, -0.0342, -0.0347,
        0.0039, -0.0269, -0.0338, -0.0005, -0.0206, -0.0319, -0.006, -0.0143, -0.03,
        -0.0116, -0.0068, -0.0282, -0.0154, 0.0008, -0.0259, -0.0188, 0.0081,
        -0.0229, -0.0224, 0.0157, -0.0205, -0.0256, 0.0236, -0.0184, -0.0285,
        0.0308, -0.0172, -0.0329, 0.037, -0.0164, -0.0388, 0.0431, -0.0146, -0.0446,
        0.0496, -0.0124, -0.0499, 0.0567, -0.0113, -0.0547, 0.0626, -0.008, -0.0597,
        0.0657, -0.0014, -0.0642, 0.0669, 0.0065, -0.0674, 0.0673, 0.015, -0.0673,
        0.0668, 0.0227, -0.0636, 0.0647, 0.0301, -0.06, 0.0615, 0.0378, -0.0575,
        0.0571, 0.044, -0.0537, 0.0514, 0.0477, -0.0484, 0.0457, 0.0507, -0.0426,
        0.0402, 0.0547, -0.0374, 0.0363, 0.0602, -0.0322, 0.0388, 0.0656, -0.0267,
        0.0449, 0.0666, -0.0208, 0.0497, 0.0656, -0.0138, 0.0528, 0.0637, -0.006,
        0.0555, 0.0609, 0.0017, 0.058, 0.0574, 0.0092, 0.0608, 0.0524, 0.0157,
        0.061, 0.0475, 0.0226, 0.059, 0.0435, 0.03, 0.0571, 0.0391, 0.0372, 0.0562,
        0.0336, 0.0438, 0.0562, 0.0271, 0.0494, 0.0553, 0.0215, 0.0557, 0.0512,
        0.0203, 0.063,
    ],
    [
        -0.0063, -0.0099, -0.0963, -0.013, -0.0064, -0.0924, -0.0207, -0.0068,
        -0.0887, -0.0273, -0.0117, -0.0859, -0.0335, -0.0168, -0.0827, -0.0404,
        -0.0194, -0.0781, -0.0471, -0.0212, -0.0729, -0.0525, -0.0239, -0.0667,
        -0.0582, -0.0266, -0.0607, -0.064, -0.0276, -0.0544, -0.0687, -0.0254,
        -0.0477, -0.0718, -0.0202, -0.0417, -0.0774, -0.02, -0.0353, -0.0834,
        -0.0209, -0.0291, -0.0884, -0.0226, -0.0223, -0.0913, -0.0279, -0.0162,
        -0.094, -0.0313, -0.009, -0.0977, -0.0287, -0.0019, -0.0998, -0.022, 0.003,
        -0.1008, -0.0137, 0.005, -0.1, -0.0051, 0.0051, -0.0968, 0.0029, 0.0051,
        -0.0953, 0.0077, 0.0095, -0.0968, 0.0047, 0.0174, -0.0966, 0.0036, 0.0259,
        -0.0964, 0.0049, 0.0344, -0.0962, 0.0055, 0.0431, -0.0948, 0.0056, 0.0516,
        -0.0909, 0.0052, 0.0593, -0.084, 0.0052, 0.0644, -0.0762, 0.0075, 0.0666,
        -0.0779, 0.0139, 0.0663, -0.0853, 0.0169, 0.0633, -0.0893, 0.0199, 0.0565,
        -0.0895, 0.0205, 0.048, -0.0884, 0.0193, 0.0394, -0.0882, 0.0204, 0.0311,
        -0.0872, 0.0267, 0.0258, -0.0829, 0.0338, 0.0235, -0.0778, 0.0391, 0.019,
        -0.0732, 0.043, 0.0128, -0.0688, 0.0469, 0.0064,
    ],
    [
        0.0133, 0.0458, -0.0775, 0.0049, 0.0448, -0.0755, -0.0033, 0.0439, -0.0729,
        -0.0104, 0.0457, -0.0685, -0.0174, 0.048, -0.0639, -0.0242, 0.0497, -0.059,
        -0.0262, 0.055, -0.0532, -0.0208, 0.0609, -0.0504, -0.013, 0.0644, -0.0493,
        -0.0049, 0.0664, -0.0474, 0.0023, 0.0686, -0.0432, 0.0088, 0.0703, -0.0378,
        0.0155, 0.07, -0.0324, 0.0204, 0.0674, -0.026, 0.0179, 0.0655, -0.0184,
        0.0116, 0.0668, -0.0126, 0.0054, 0.0683, -0.007, 0.0002, 0.0693, -0.0001,
        -0.0055, 0.0701, 0.0064, -0.0116, 0.0699, 0.0126, -0.0176, 0.0681, 0.0185,
        -0.0235, 0.065, 0.0241, -0.0299, 0.0626, 0.0294, -0.0356, 0.0592, 0.035,
        -0.0406, 0.055, 0.0406, -0.0469, 0.0514, 0.0452, -0.0538, 0.047, 0.048,
        -0.0588, 0.041, 0.0514, -0.0615, 0.0342, 0.056, -0.0637, 0.0272, 0.0606,
        -0.0691, 0.0221, 0.0649, -0.073, 0.0147, 0.0666, -0.077, 0.0073, 0.0665,
        -0.085, 0.0068, 0.064, -0.0916, 0.0082, 0.0587, -0.0948, 0.009, 0.0508,
        -0.0955, 0.0089, 0.0422, -0.0954, 0.0079, 0.0336, -0.0961, 0.0066, 0.0251,
        -0.0965, 0.0083, 0.0168, -0.0937, 0.0123, 0.0097, -0.0896, 0.0178, 0.0045,
        -0.085, 0.0242, 0.001, -0.0806, 0.0283, -0.005, -0.0783, 0.0291, -0.0133,
        -0.0761, 0.0299, -0.0216,
    ],
    [
        -0.1007, -0.0232, 0.0445, -0.1016, -0.0252, 0.036, -0.1019, -0.0286, 0.028,
        -0.1002, -0.0325, 0.0203, -0.097, -0.037, 0.0135, -0.0924, -0.0421, 0.0081,
        -0.0845, -0.0439, 0.006, -0.0757, -0.0446, 0.0064, -0.0672, -0.0469, 0.0067,
        -0.0585, -0.0474, 0.0066, -0.0501, -0.0453, 0.0056, -0.0423, -0.0418,
        0.0036, -0.0348, -0.0376, 0.0015, -0.0271, -0.0343, -0.0009, -0.0205,
        -0.0317, -0.006, -0.0139, -0.0298, -0.0115, -0.0063, -0.0282, -0.0156,
        0.0013, -0.0257, -0.0193, 0.0087, -0.0227, -0.0228, 0.0166, -0.0202,
        -0.0258, 0.0246, -0.0178, -0.0287, 0.0317, -0.017, -0.0337, 0.0379, -0.0165,
        -0.0399, 0.0442, -0.0145, -0.0457, 0.0509, -0.0122, -0.0508, 0.0582,
        -0.0109, -0.0556, 0.0636, -0.0067, -0.0607, 0.0661, 0.0004, -0.0651, 0.0671,
        0.0086, -0.0679, 0.0673, 0.0171, -0.0666, 0.0663, 0.0248, -0.0624, 0.0639,
        0.0326, -0.0592, 0.0604, 0.0401, -0.0564, 0.0551, 0.0455, -0.0521, 0.0492,
        0.0486, -0.0464, 0.0435, 0.0519, -0.0406, 0.0384, 0.0567, -0.0352, 0.0341,
        0.0621, -0.0297,
    ],
    [
        0.0431, 0.0356, -0.0799, 0.0438, 0.0282, -0.0841, 0.0492, 0.022, -0.086,
        0.0571, 0.0191, -0.0841, 0.0637, 0.016, -0.0795, 0.0668, 0.0114, -0.0729,
        0.0671, 0.005, -0.0672, 0.0653, -0.0025, -0.0632, 0.0619, -0.009, -0.0588,
        0.0554, -0.0115, -0.0538, 0.0483, -0.0129, -0.049, 0.0419, -0.0153, -0.0437,
        0.0357, -0.0168, -0.0378, 0.0294, -0.0171, -0.0319, 0.0222, -0.0184,
        -0.0272, 0.015, -0.0206, -0.0229, 0.0084, -0.0222, -0.0176, 0.0039, -0.0203,
        -0.0105, -0.0004, -0.0182, -0.0034, -0.006, -0.0185, 0.0032, -0.0124,
        -0.0191, 0.009, -0.0193, -0.0185, 0.0143, -0.0257, -0.0195, 0.0199, -0.0297,
        -0.0252, 0.0246, -0.0327, -0.0325, 0.0281, -0.0376, -0.0379, 0.0327,
        -0.0434, -0.0396, 0.0389, -0.0484, -0.0409, 0.0459, -0.0538, -0.0421,
        0.0526, -0.0598, -0.0413, 0.0586, -0.065, -0.0365, 0.0635, -0.0689, -0.0297,
        0.0671, -0.0717, -0.0218, 0.069, -0.0716, -0.0131, 0.0693, -0.0709, -0.0044,
        0.0693, -0.0708, 0.0043, 0.0691, -0.0711, 0.0128, 0.0702, -0.0698, 0.0162,
        0.0778, -0.0651, 0.0177, 0.0847, -0.0569, 0.019, 0.0867, -0.0483, 0.0195,
        0.0858, -0.0396, 0.0194, 0.0854, -0.0321, 0.0231, 0.0859, -0.0299, 0.0307,
        0.0826, -0.0268, 0.0371, 0.0778, -0.0198, 0.0405, 0.074, -0.012, 0.0427,
        0.071, -0.004, 0.0451, 0.0685, 0.0039, 0.0471, 0.0656, 0.0114, 0.0489,
        0.0616,
    ],
    [
        0.056, -0.0243, -0.0605, 0.0534, -0.0174, -0.0561, 0.0487, -0.0134, -0.0503,
        0.0428, -0.0146, -0.0441, 0.0367, -0.0164, -0.0383, 0.0302, -0.0172,
        -0.0326, 0.0231, -0.0183, -0.0278, 0.0159, -0.0203, -0.0235, 0.0091,
        -0.0223, -0.0185, 0.0043, -0.0208, -0.0116, 0.0003, -0.0182, -0.0044,
        -0.0051, -0.0182, 0.0023, -0.0114, -0.0191, 0.0081, -0.0181, -0.0186,
        0.0135, -0.0247, -0.019, 0.019, -0.0293, -0.024, 0.0238, -0.0321, -0.0314,
        0.0273, -0.0365, -0.0373, 0.0316, -0.0424, -0.0396, 0.0375, -0.0475,
        -0.0406, 0.0444, -0.0526, -0.0419, 0.0513, -0.0586, -0.0418, 0.0574, -0.064,
        -0.0376, 0.0625, -0.0681, -0.031, 0.0663, -0.0714, -0.0235, 0.0689, -0.0718,
        -0.0148, 0.0691, -0.0711, -0.0062, 0.0688, -0.071, 0.0017, 0.0714, -0.0701,
        0.0051, 0.079, -0.0655, 0.0053, 0.0862, -0.0581, 0.0056, 0.0906, -0.0497,
        0.0059, 0.0925, -0.0411, 0.0054, 0.0932, -0.0326, 0.0046, 0.0941, -0.0243,
        0.0067, 0.0946, -0.0173, 0.0114, 0.093, -0.0117, 0.0168, 0.0893, -0.007,
        0.0229, 0.0852, -0.0028, 0.0286, 0.0804, 0.0023, 0.0336, 0.0754, 0.0087,
        0.0376, 0.0712, 0.0162, 0.0395, 0.0675, 0.023, 0.0422, 0.0629, 0.0268,
        0.0476, 0.0575, 0.0285, 0.0537, 0.0516, 0.0283, 0.0593, 0.0451, 0.0262,
        0.0641, 0.0381, 0.0228, 0.0682, 0.0314,
    ],
    [
        0.0356, -0.0895, -0.0199, 0.0329, -0.0831, -0.0147, 0.0303, -0.0762,
        -0.0103, 0.0265, -0.0696, -0.0064, 0.022, -0.0629, -0.0035, 0.0195, -0.0548,
        -0.0032, 0.0197, -0.0463, -0.0045, 0.0215, -0.0384, -0.0027, 0.0215,
        -0.0344, 0.0047, 0.0171, -0.0323, 0.0115, 0.0095, -0.0297, 0.0145, 0.0015,
        -0.0269, 0.0162, -0.0061, -0.0234, 0.0182, -0.0137, -0.0197, 0.0198,
        -0.0212, -0.0193, 0.0232, -0.0263, -0.0247, 0.0271, -0.0302, -0.0319,
        0.0299, -0.0348, -0.0376, 0.0342, -0.0407, -0.0398, 0.0401, -0.0469,
        -0.0409, 0.046, -0.0531, -0.0421, 0.0519, -0.0592, -0.0416, 0.0579, -0.0644,
        -0.0372, 0.0629, -0.0684, -0.0306, 0.0666, -0.0715, -0.0229, 0.0689,
        -0.0717, -0.0143, 0.0692, -0.071, -0.0057, 0.0692, -0.0708, 0.0029, 0.0694,
        -0.0711, 0.0115, 0.069, -0.0698, 0.0198, 0.0674, -0.0653, 0.0261, 0.0639,
        -0.0611, 0.0323, 0.0596, -0.057, 0.0389, 0.0559, -0.0515, 0.0441, 0.0592,
        -0.045, 0.0472, 0.0638, -0.0373, 0.0506, 0.0638, -0.0317, 0.0552, 0.0594,
        -0.0282, 0.0595, 0.0529, -0.0229, 0.0625, 0.0468, -0.016, 0.0651, 0.0425,
        -0.0114, 0.0697, 0.037,
    ],
    [
        0.0342, 0.0681, 0.0199, 0.0357, 0.0649, 0.0279, 0.0378, 0.0603, 0.0349,
        0.0393, 0.0546, 0.0414, 0.0394, 0.0487, 0.0478, 0.0377, 0.043, 0.0541,
        0.0363, 0.0373, 0.0605, 0.0358, 0.0303, 0.0656, 0.0341, 0.0229, 0.0698,
        0.0306, 0.0167, 0.0748, 0.0263, 0.0109, 0.0796, 0.0242, 0.0033, 0.0824,
        0.03, -0.0024, 0.081, 0.0353, -0.0071, 0.0765, 0.0365, -0.0151, 0.0735,
        0.0396, -0.023, 0.0718, 0.046, -0.0274, 0.0685, 0.0529, -0.0271, 0.0633,
        0.0594, -0.0262, 0.0578, 0.0648, -0.0301, 0.0526, 0.068, -0.0353, 0.0465,
        0.0724, -0.0377, 0.0394, 0.0768, -0.041, 0.0329, 0.0762, -0.0469, 0.0273,
        0.0696, -0.0518, 0.0248, 0.0614, -0.0535, 0.0228, 0.0531, -0.0535, 0.0202,
        0.0448, -0.0539, 0.0175, 0.0371, -0.0566, 0.0146, 0.0313, -0.0611, 0.01,
        0.0293, -0.066, 0.0033, 0.0312, -0.07, -0.0041, 0.0349, -0.0715, -0.0117,
        0.0354, -0.0696, -0.02, 0.0313, -0.0656, -0.0264, 0.0264, -0.0652, -0.0332,
        0.0252, -0.0682, -0.0412, 0.0254, -0.0715, -0.0493,
    ],
    [
        -0.0072, 0.0318, 0.0813, -0.0102, 0.0247, 0.0855, -0.0131, 0.0175, 0.0896,
        -0.0178, 0.0111, 0.0932, -0.025, 0.0067, 0.0948, -0.0336, 0.0073, 0.0936,
        -0.0422, 0.0089, 0.0926, -0.0509, 0.0093, 0.0921, -0.0594, 0.0086, 0.0901,
        -0.0664, 0.0074, 0.0853, -0.0703, 0.0065, 0.0776, -0.0713, 0.0093, 0.07,
        -0.0704, 0.0177, 0.0677, -0.0665, 0.0243, 0.0639, -0.0626, 0.03, 0.0586,
        -0.0604, 0.0371, 0.0541, -0.0566, 0.0436, 0.0497, -0.0504, 0.0491, 0.0469,
        -0.0436, 0.0531, 0.0432, -0.038, 0.0571, 0.0378, -0.0327, 0.0613, 0.0321,
        -0.0265, 0.0638, 0.0265, -0.0202, 0.0665, 0.021, -0.0143, 0.0693, 0.0152,
        -0.0081, 0.0702, 0.0091, -0.0021, 0.0698, 0.0028, 0.0033, 0.0688, -0.0041,
        0.0089, 0.0675, -0.0106, 0.016, 0.0661, -0.0156, 0.0239, 0.067, -0.0189,
        0.0313, 0.0698, -0.016, 0.0364, 0.0704, -0.009, 0.0416, 0.069, -0.0021,
        0.0463, 0.0665, 0.0048, 0.0485, 0.0642, 0.0129, 0.0487, 0.0617, 0.0212,
        0.0511, 0.0559, 0.027, 0.0549, 0.0486, 0.0299, 0.0569, 0.0415, 0.0345,
        0.0566, 0.0359, 0.0411, 0.0532, 0.0325, 0.0483, 0.0485, 0.0307, 0.0555,
        0.0455, 0.026, 0.0621, 0.0456, 0.019, 0.0673,
    ],
    [
        0.055, -0.0718, -0.0368, 0.0478, -0.0683, -0.0334, 0.0424, -0.0675, -0.0269,
        0.0383, -0.0697, -0.0194, 0.0336, -0.0716, -0.0123, 0.0274, -0.0696,
        -0.0068, 0.0221, -0.0637, -0.0035, 0.0196, -0.0554, -0.0032, 0.0197,
        -0.0468, -0.0044, 0.0214, -0.0387, -0.0028, 0.0216, -0.0343, 0.0045, 0.017,
        -0.0323, 0.0113, 0.0094, -0.0297, 0.0146, 0.0013, -0.0268, 0.0164, -0.0065,
        -0.0233, 0.0182, -0.0142, -0.0195, 0.0198, -0.0217, -0.0195, 0.0237,
        -0.0267, -0.0254, 0.0273, -0.0307, -0.0327, 0.0302, -0.0356, -0.0379, 0.035,
        -0.0416, -0.0399, 0.041, -0.0479, -0.0411, 0.047, -0.0542, -0.0422, 0.053,
        -0.0604, -0.0413, 0.059, -0.0653, -0.0359, 0.0637, -0.0693, -0.0289, 0.0673,
        -0.0717, -0.0208, 0.0691, -0.0716, -0.0121, 0.0693, -0.0712, -0.0034,
        0.0681, -0.0724, 0.005, 0.0664, -0.0764, 0.0126, 0.0664, -0.0838, 0.0161,
        0.0644, -0.0888, 0.0192, 0.0582, -0.0897, 0.0207, 0.0498, -0.0886, 0.0196,
        0.0412, -0.0881, 0.0194, 0.0325, -0.0878, 0.0245, 0.0256, -0.0854, 0.032,
        0.022,
    ],
    [
        0.0412, 0.0222, 0.0673, 0.0449, 0.0277, 0.0616, 0.0492, 0.0309, 0.0547,
        0.0536, 0.0328, 0.0474, 0.0566, 0.0366, 0.0402, 0.0567, 0.0424, 0.0338,
        0.0545, 0.0495, 0.0295, 0.0507, 0.0568, 0.0265, 0.0488, 0.062, 0.0201,
        0.0485, 0.0644, 0.0118, 0.0458, 0.0668, 0.0039, 0.041, 0.0693, -0.003,
        0.0359, 0.0704, -0.01, 0.0305, 0.0695, -0.0168, 0.0229, 0.0668, -0.0186,
        0.015, 0.0661, -0.0151, 0.0082, 0.0675, -0.0098, 0.0028, 0.069, -0.0032,
        -0.0027, 0.0699, 0.0036, -0.0088, 0.0702, 0.0098, -0.015, 0.0692, 0.0159,
        -0.0209, 0.0663, 0.0216, -0.0272, 0.0636, 0.027, -0.0332, 0.061, 0.0328,
        -0.0384, 0.0568, 0.0384, -0.0442, 0.0526, 0.0434, -0.051, 0.0486, 0.047,
        -0.0571, 0.0431, 0.05, -0.0607, 0.0366, 0.0544, -0.0627, 0.0294, 0.059,
        -0.0669, 0.0239, 0.0642, -0.0707, 0.0172, 0.068, -0.0713, 0.009, 0.0705,
        -0.0702, 0.0064, 0.0781, -0.066, 0.0074, 0.0856, -0.059, 0.0087, 0.0904,
        -0.0505, 0.0093, 0.0922, -0.0418, 0.0088, 0.0925, -0.0333, 0.0071, 0.0936,
        -0.0247, 0.0068, 0.0948, -0.0174, 0.011, 0.093, -0.0117, 0.0165, 0.0893,
        -0.0072, 0.0228, 0.0852, -0.0029, 0.0286, 0.0803, 0.0023, 0.0336, 0.0754,
        0.0091, 0.0374, 0.0714, 0.0166, 0.0396, 0.0676, 0.0233, 0.0422, 0.0628,
        0.0285, 0.0466, 0.0573,
    ],
    [
        0.0758, 0.0012, 0.0407, 0.0748, 0.0099, 0.0415, 0.0723, 0.0182, 0.0405,
        0.0696, 0.0252, 0.0361, 0.0705, 0.0294, 0.0288, 0.0751, 0.0302, 0.0213,
        0.0795, 0.0307, 0.0137, 0.0849, 0.0293, 0.007, 0.0902, 0.0248, 0.0015,
        0.0945, 0.0193, -0.0037, 0.0984, 0.0134, -0.009, 0.1008, 0.0075, -0.015,
        0.1018, 0.0024, -0.0221, 0.1012, -0.0016, -0.0299, 0.0991, -0.0032, -0.0382,
        0.096, -0.0015, -0.0463, 0.0924, 0.0003, -0.0541, 0.0872, -0.0002, -0.0611,
        0.0797, -0.0019, -0.065, 0.0714, -0.0042, -0.0636, 0.0642, -0.0082, -0.0608,
        0.0632, -0.0149, -0.0642, 0.0673, -0.0163, -0.0715, 0.069, -0.0131, -0.0794,
        0.0657, -0.0105, -0.0869, 0.0592, -0.0111, -0.0926, 0.0515, -0.0134,
        -0.0962, 0.0432, -0.0156, -0.0979, 0.0346, -0.0158, -0.0992, 0.0265,
        -0.0129, -0.1011, 0.0188, -0.0089, -0.1022, 0.0127, -0.0027, -0.1015,
        0.0092, 0.0051, -0.0995, 0.0075, 0.0133, -0.0967, 0.0025, 0.0171, -0.094,
        -0.0039, 0.0111, -0.0939,
    ],
    [
        0.0038, 0.043, -0.0767, -0.0039, 0.0436, -0.0728, -0.0109, 0.046, -0.0681,
        -0.0182, 0.0479, -0.0635, -0.0251, 0.0497, -0.0585, -0.0254, 0.0559,
        -0.0531, -0.0197, 0.0617, -0.0504, -0.0115, 0.0646, -0.0493, -0.0034,
        0.0668, -0.0469, 0.0035, 0.0692, -0.042, 0.0102, 0.0705, -0.0366, 0.0169,
        0.0697, -0.031, 0.0202, 0.0666, -0.0238, 0.0161, 0.0657, -0.0166, 0.0095,
        0.0672, -0.0111, 0.0037, 0.0687, -0.0047, -0.0017, 0.0697, 0.0022, -0.0076,
        0.0702, 0.0086, -0.0138, 0.0696, 0.0148, -0.0198, 0.0671, 0.0207, -0.0261,
        0.0641, 0.0261, -0.0323, 0.0614, 0.0317, -0.0376, 0.0574, 0.0374, -0.0431,
        0.0533, 0.0428, -0.0502, 0.0496, 0.0465, -0.0565, 0.0443, 0.0493, -0.0603,
        0.0377, 0.0537, -0.0624, 0.0306, 0.0582, -0.0663, 0.0246, 0.0633, -0.0703,
        0.0182, 0.0674, -0.0715, 0.0099, 0.0699, -0.0705, 0.0064, 0.0772, -0.0666,
        0.0072, 0.0848, -0.0597, 0.0085, 0.0899, -0.0513, 0.0093, 0.0922, -0.0425,
        0.0088, 0.0926, -0.0339, 0.0071, 0.0934, -0.0254, 0.0068, 0.0945, -0.0178,
        0.0107, 0.0933, -0.0131, 0.0171, 0.0896, -0.01, 0.0242, 0.0855,
    ],
    [
        0.0819, -0.0468, 0.0034, 0.0744, -0.0506, 0.0051, 0.0673, -0.0541, 0.0085,
        0.0599, -0.0552, 0.0128, 0.0523, -0.0537, 0.0164, 0.0443, -0.0516, 0.019,
        0.0359, -0.0505, 0.0204, 0.0273, -0.0505, 0.0217, 0.019, -0.0502, 0.0238,
        0.0112, -0.0475, 0.0261, 0.0045, -0.0428, 0.0286, -0.0018, -0.0381, 0.0323,
        -0.0084, -0.0333, 0.0346, -0.0149, -0.0282, 0.0324, -0.0214, -0.024, 0.0286,
        -0.0281, -0.0274, 0.0277, -0.0319, -0.0343, 0.0312, -0.037, -0.0386, 0.0364,
        -0.043, -0.0403, 0.0424, -0.0491, -0.0415, 0.0483, -0.0554, -0.0424, 0.0542,
        -0.0613, -0.0403, 0.0599, -0.066, -0.0347, 0.0644, -0.0697, -0.0277, 0.0677,
        -0.0718, -0.0196, 0.0692, -0.0715, -0.011, 0.0689, -0.071, -0.0024, 0.0694,
        -0.0709, 0.0039, 0.0745, -0.0684, 0.0052, 0.0825, -0.0625, 0.0054, 0.0886,
        -0.0545, 0.0057, 0.0917, -0.046, 0.0057, 0.0929, -0.0374, 0.005, 0.0936,
        -0.0289, 0.0052, 0.0945, -0.0211, 0.0086, 0.0943, -0.0147, 0.0136, 0.0914,
        -0.0095, 0.0194, 0.0876, -0.0045, 0.0249, 0.0835, 0.0019, 0.0287, 0.0791,
    ],
    [
        0.0285, 0.0475, 0.0566, 0.0237, 0.0427, 0.0622, 0.0173, 0.0396, 0.0673,
        0.0097, 0.0374, 0.0712, 0.0027, 0.0338, 0.0752, -0.0026, 0.0288, 0.0801,
        -0.0069, 0.0229, 0.0851, -0.0115, 0.0167, 0.0892, -0.0173, 0.0111, 0.0929,
        -0.0245, 0.0066, 0.0947, -0.033, 0.005, 0.094, -0.0418, 0.0056, 0.093,
        -0.0506, 0.0058, 0.0924, -0.0591, 0.0053, 0.0905, -0.0662, 0.0054, 0.0854,
        -0.0703, 0.0051, 0.0778, -0.071, 0.0007, 0.0707, -0.0712, -0.0078, 0.0688,
        -0.0718, -0.0166, 0.0691, -0.0709, -0.0253, 0.0687, -0.0673, -0.0327,
        0.0658, -0.0629, -0.039, 0.0615, -0.0572, -0.0421, 0.0559, -0.0508, -0.0418,
        0.0498, -0.0444, -0.0407, 0.0439, -0.0382, -0.0393, 0.0377, -0.0327,
        -0.0356, 0.032, -0.0285, -0.0287, 0.0285, -0.0243, -0.0215, 0.0257, -0.0177,
        -0.0188, 0.0214, -0.0098, -0.0215, 0.019, -0.0021, -0.0253, 0.0169, 0.006,
        -0.0283, 0.015, 0.0138, -0.0322, 0.0134, 0.0202, -0.0379, 0.0119, 0.026,
        -0.0446, 0.0124, 0.0318, -0.0509, 0.0143, 0.0329, -0.0587, 0.0122, 0.0299,
        -0.0644, 0.0062, 0.03, -0.0685, -0.0014, 0.0343, -0.0713, -0.0083,
    ],
    [
        0.062, -0.029, 0.056, 0.0558, -0.0265, 0.061, 0.0491, -0.0275, 0.0664,
        0.0422, -0.0252, 0.0707, 0.0353, -0.0213, 0.0737, 0.0286, -0.0251, 0.0772,
        0.0224, -0.0307, 0.0798, 0.0151, -0.035, 0.0796, 0.008, -0.0383, 0.0759,
        0.0012, -0.0419, 0.0719, -0.0068, -0.0439, 0.0723, -0.0151, -0.0441, 0.0749,
        -0.0235, -0.0448, 0.077, -0.0317, -0.0458, 0.0797, -0.0402, -0.0469, 0.0812,
        -0.0488, -0.0469, 0.0814, -0.0571, -0.0446, 0.0802, -0.0637, -0.0398,
        0.0776, -0.068, -0.0341, 0.0727, -0.0706, -0.0269, 0.0691, -0.0718, -0.0184,
        0.0689, -0.0714, -0.0097, 0.0689, -0.071, -0.0011, 0.0697, -0.0707, 0.0042,
        0.0759, -0.0678, 0.0053, 0.0839, -0.0611, 0.0055, 0.0893, -0.0529, 0.0057,
        0.0921, -0.0443, 0.0056, 0.093, -0.0357, 0.0049, 0.0938, -0.0271, 0.0056,
        0.0946, -0.0196, 0.0096, 0.0938, -0.0133, 0.0147, 0.0906, -0.0085, 0.0207,
        0.0866, -0.0036, 0.0263, 0.0822, 0.0042, 0.0275, 0.0808, 0.0114, 0.0245,
        0.0843,
    ],
    [
        0.0913, -0.008, 0.018, 0.0866, -0.0098, 0.0252, 0.0827, -0.0145, 0.0315,
        0.0786, -0.0192, 0.0376, 0.0736, -0.0215, 0.0445, 0.0677, -0.0229, 0.0509,
        0.061, -0.0247, 0.0564, 0.0545, -0.0269, 0.062, 0.0477, -0.0279, 0.0675,
        0.0409, -0.0243, 0.0711, 0.0368, -0.0168, 0.0731, 0.0356, -0.0085, 0.0758,
        0.0314, -0.0027, 0.08, 0.0249, 0.0019, 0.0825, 0.0256, 0.0099, 0.0804, 0.03,
        0.0158, 0.0756, 0.0336, 0.022, 0.0704, 0.0356, 0.0294, 0.0661, 0.0362,
        0.0366, 0.0612, 0.0376, 0.0424, 0.0546, 0.039, 0.0483, 0.0483, 0.039,
        0.0545, 0.042, 0.0379, 0.06, 0.0352, 0.036, 0.0647, 0.028, 0.0337, 0.0681,
        0.0202, 0.0305, 0.0704, 0.0123, 0.0263, 0.0718, 0.0046, 0.0225, 0.0717,
        -0.0033, 0.0181, 0.0693, -0.0104, 0.0103, 0.0673, -0.0116, 0.0042, 0.0684,
        -0.0054, -0.0009, 0.0697, 0.0017, -0.007, 0.0702, 0.0081, -0.0135, 0.0696,
        0.014, -0.0187, 0.0682, 0.0209, -0.0208, 0.0678, 0.0294,
    ],
    [
        0.0455, 0.0071, 0.0729, 0.0391, 0.0127, 0.0715, 0.0353, 0.0201, 0.0697,
        0.0355, 0.0283, 0.0667, 0.036, 0.0357, 0.0623, 0.0372, 0.0414, 0.0559,
        0.0391, 0.047, 0.0495, 0.0395, 0.0528, 0.0432, 0.0383, 0.0586, 0.0369,
        0.0363, 0.0637, 0.0302, 0.0345, 0.0672, 0.0225, 0.0319, 0.0697, 0.0146,
        0.0279, 0.0713, 0.0071, 0.0238, 0.0719, -0.0005, 0.0202, 0.0701, -0.0081,
        0.0158, 0.0677, -0.0152, 0.0094, 0.0696, -0.0204, 0.0019, 0.0717, -0.0242,
        -0.0055, 0.0714, -0.0285, -0.0128, 0.0699, -0.033, -0.0205, 0.0676, -0.0363,
        -0.0282, 0.0644, -0.0383, -0.0351, 0.0596, -0.0405, -0.0414, 0.0538, -0.042,
        -0.0475, 0.0477, -0.0427, -0.0537, 0.0416, -0.0427, -0.0601, 0.036, -0.0415,
        -0.0651, 0.0292, -0.0396, -0.0681, 0.0212, -0.0396, -0.07, 0.0135, -0.0428,
        -0.0723, 0.0058, -0.0458, -0.0741, -0.0023, -0.0439, -0.0727, -0.0105,
        -0.0416, -0.0706, -0.0187, -0.0426, -0.0688, -0.0255, -0.0474, -0.0645,
        -0.0278, -0.0541, -0.0587, -0.0263, -0.0603, -0.0529, -0.0239, -0.0664,
        -0.0475, -0.0213, -0.0726, -0.0409, -0.0194, -0.0779, -0.0339, -0.0173,
        -0.0823, -0.0276, -0.0125, -0.0858, -0.022, -0.0062, -0.088, -0.0164,
        0.0002, -0.0897, -0.0114, 0.0071, -0.091,
    ],
    [
        -0.0094, 0.009, -0.0913, -0.0147, 0.0021, -0.0902, -0.0204, -0.0043,
        -0.0886, -0.0262, -0.0106, -0.0866, -0.0322, -0.016, -0.0834, -0.0391,
        -0.019, -0.079, -0.0459, -0.0209, -0.0738, -0.0516, -0.0234, -0.0678,
        -0.0572, -0.0261, -0.0616, -0.0632, -0.0278, -0.0554, -0.0681, -0.0263,
        -0.0486, -0.0705, -0.0201, -0.0433, -0.0724, -0.0119, -0.0414, -0.074,
        -0.0036, -0.0435, -0.0727, 0.0045, -0.0458, -0.0703, 0.0124, -0.0434,
        -0.0684, 0.0201, -0.0398, -0.0656, 0.0283, -0.0391, -0.0608, 0.0352,
        -0.0414, -0.0544, 0.0409, -0.0428, -0.0482, 0.0471, -0.0426, -0.0421,
        0.0534, -0.0418, -0.0354, 0.0589, -0.0411, -0.0278, 0.0632, -0.0404,
        -0.0199, 0.0665, -0.0389, -0.012, 0.0689, -0.0359, -0.0045, 0.0705, -0.0317,
        0.003, 0.0711, -0.0273, 0.0106, 0.0696, -0.0232, 0.0183, 0.067, -0.0203,
        0.0267, 0.0679, -0.0187, 0.0331, 0.0702, -0.0135, 0.0382, 0.0703, -0.0064,
        0.0433, 0.0682, 0.0004, 0.0474, 0.0656, 0.0076, 0.0487, 0.0634, 0.0159,
        0.0481, 0.0604, 0.024, 0.0485, 0.0555, 0.0313,
    ],
    [
        0.0702, 0.0273, 0.0328, 0.0711, 0.0213, 0.0388, 0.074, 0.0135, 0.0413,
        0.0742, 0.005, 0.0429, 0.0708, -0.0012, 0.0476, 0.0653, -0.0035, 0.0539,
        0.0584, -0.0047, 0.0593, 0.0512, -0.0074, 0.0634, 0.0448, -0.0119, 0.0673,
        0.0386, -0.017, 0.0708, 0.0326, -0.0219, 0.0749, 0.0267, -0.0275, 0.0782,
        0.0206, -0.0336, 0.0793, 0.0138, -0.0383, 0.0765, 0.0072, -0.0418, 0.0719,
        0.001, -0.045, 0.0667, -0.0046, -0.047, 0.0603, -0.0091, -0.0458, 0.053,
        -0.0102, -0.042, 0.0453, -0.0089, -0.0366, 0.0386, -0.012, -0.0305, 0.0336,
        -0.0184, -0.0255, 0.0303, -0.025, -0.0216, 0.0261, -0.0298, -0.0229, 0.0193,
        -0.0334, -0.0276, 0.0128, -0.0377, -0.0332, 0.0077, -0.043, -0.0398, 0.0059,
        -0.0499, -0.0449, 0.0056, -0.0579, -0.0468, 0.0029, -0.0648, -0.0464,
        -0.0024, -0.0701, -0.0438, -0.0089, -0.0747, -0.0405, -0.0156, -0.078,
        -0.037, -0.0229, -0.0784, -0.0318, -0.0297, -0.0759, -0.0251, -0.0349,
        -0.0721, -0.0202, -0.0408, -0.069, -0.0251, -0.0471, -0.0646, -0.0272,
        -0.054, -0.06, -0.0242, -0.0607,
    ],
    [
        -0.0171, -0.0483, 0.0598, -0.0096, -0.0471, 0.0564, -0.0031, -0.0464,
        0.0616, 0.0025, -0.0444, 0.068, 0.0087, -0.041, 0.0731, 0.0153, -0.0372,
        0.0775, 0.022, -0.0322, 0.0793, 0.0282, -0.0263, 0.0774, 0.0336, -0.0201,
        0.0745, 0.0361, -0.0119, 0.0745, 0.0341, -0.0045, 0.078, 0.0275, -0.0006,
        0.0819, 0.024, 0.0067, 0.0818, 0.028, 0.0132, 0.0778, 0.0322, 0.0189,
        0.0726, 0.035, 0.0258, 0.068, 0.0359, 0.0334, 0.0638, 0.0366, 0.0398, 0.058,
        0.0385, 0.0453, 0.0514, 0.0403, 0.0508, 0.0449, 0.0409, 0.0561, 0.0379,
        0.0396, 0.0613, 0.0311, 0.0377, 0.0654, 0.0236, 0.0358, 0.0683, 0.0155,
        0.0323, 0.0701, 0.0077, 0.028, 0.0711, 0.0002, 0.0238, 0.0704, -0.0074,
        0.021, 0.0677, -0.0152, 0.0268, 0.068, -0.0189, 0.0331, 0.0702, -0.0136,
        0.038, 0.0704, -0.0064, 0.0431, 0.0684, 0.0004, 0.0473, 0.0657, 0.0075,
        0.0487, 0.0635, 0.0158, 0.0488, 0.0601, 0.0237, 0.0523, 0.0539, 0.0281,
        0.0585, 0.0491, 0.0249, 0.0638, 0.047, 0.0184, 0.0685, 0.0453, 0.0112,
        0.0731, 0.0431, 0.0041,
    ],
    [
        -0.0549, -0.0346, 0.0944, -0.0497, -0.0279, 0.0965, -0.0423, -0.0243,
        0.0987, -0.0339, -0.0259, 0.1, -0.0256, -0.0286, 0.0997, -0.018, -0.0257,
        0.0989, -0.0139, -0.0181, 0.0993, -0.0121, -0.0096, 0.0994, -0.0112,
        -0.0012, 0.0971, -0.0115, 0.0067, 0.0934, -0.0184, 0.0087, 0.0935, -0.0265,
        0.0058, 0.0945, -0.0351, 0.0049, 0.0938, -0.0438, 0.0057, 0.093, -0.0525,
        0.0057, 0.0922, -0.0608, 0.0053, 0.0896, -0.0674, 0.0054, 0.084, -0.0707,
        0.0047, 0.0761, -0.071, -0.0009, 0.07, -0.0713, -0.0095, 0.0688, -0.0718,
        -0.0182, 0.0688, -0.071, -0.0269, 0.0691, -0.068, -0.0342, 0.0727, -0.0636,
        -0.0398, 0.0777, -0.0568, -0.0446, 0.0802, -0.0485, -0.047, 0.0812, -0.0398,
        -0.0468, 0.0811, -0.0312, -0.0459, 0.0796, -0.023, -0.0449, 0.0769, -0.0145,
        -0.044, 0.0748, -0.0062, -0.0438, 0.0721, 0.002, -0.0416, 0.0723, 0.0088,
        -0.038, 0.0764, 0.016, -0.0346, 0.08, 0.0232, -0.0299, 0.0795, 0.0294,
        -0.0244, 0.0768, 0.0365, -0.0216, 0.0732, 0.0433, -0.0257, 0.0701, 0.0503,
        -0.0277, 0.0656, 0.0568, -0.0261, 0.06, 0.0633, -0.0238, 0.0546, 0.0698,
        -0.0223, 0.0489, 0.0753, -0.0207, 0.0423, 0.0803, -0.0192, 0.0353, 0.0854,
        -0.0175, 0.0283, 0.0899, -0.0174, 0.0209, 0.0931, -0.0197, 0.013, 0.0967,
        -0.0219, 0.0054,
    ],
    [
        0.0211, -0.1331, -0.0292, 0.0257, -0.1358, -0.0228, 0.0305, -0.13, -0.0208,
        0.033, -0.1218, -0.0221, 0.0347, -0.1134, -0.0233, 0.036, -0.1049, -0.0244,
        0.0365, -0.0967, -0.027, 0.0357, -0.0883, -0.029, 0.034, -0.0799, -0.0286,
        0.0326, -0.0715, -0.0273, 0.0357, -0.0641, -0.028, 0.0429, -0.0653, -0.0324,
        0.0497, -0.0686, -0.0365, 0.0569, -0.0706, -0.0407, 0.0633, -0.0677,
        -0.0454, 0.0687, -0.0613, -0.0474, 0.0736, -0.0544, -0.046, 0.0779, -0.0476,
        -0.0429, 0.0829, -0.0435, -0.0374, 0.0896, -0.0411, -0.0338, 0.095, -0.035,
        -0.036, 0.0987, -0.0274, -0.0349, 0.1003, -0.0207, -0.0298, 0.1018, -0.016,
        -0.0227, 0.1026, -0.0118, -0.0152, 0.1015, -0.0057, -0.0093, 0.0997, 0.0019,
        -0.0056, 0.0973, 0.0101, -0.0045, 0.0951, 0.0185, -0.0047,
    ],
    [
        0.0185, -0.1255, -0.0237, 0.0203, -0.1335, -0.0219, 0.0253, -0.1312,
        -0.0187, 0.0282, -0.1232, -0.0185, 0.0307, -0.115, -0.0196, 0.0327, -0.1067,
        -0.0203, 0.033, -0.0982, -0.0193, 0.0326, -0.0899, -0.0168, 0.0316, -0.082,
        -0.0135, 0.0304, -0.0747, -0.0092, 0.0295, -0.0692, -0.0027, 0.0298,
        -0.0651, 0.0047, 0.0327, -0.06, 0.011, 0.0347, -0.0536, 0.0162, 0.0298,
        -0.0501, 0.0211, 0.0216, -0.0504, 0.0236, 0.0135, -0.049, 0.0262, 0.0062,
        -0.0454, 0.0289, -0.0002, -0.0415, 0.0331, -0.0056, -0.0407, 0.0394,
        -0.0092, -0.044, 0.0464,
    ],
    [
        0.0364, -0.1065, -0.0256, 0.0344, -0.1145, -0.0233, 0.0315, -0.1222,
        -0.0207, 0.0277, -0.1296, -0.019, 0.0218, -0.1349, -0.0206, 0.0185, -0.1286,
        -0.0237, 0.0184, -0.1201, -0.0249, 0.019, -0.1116, -0.0253, 0.0194, -0.1031,
        -0.0251, 0.0186, -0.0948, -0.0261, 0.0153, -0.0876, -0.0294,
    ],
];
export const dnaPaths: number[][] = [
    [
        0.2124, 0.1651, -0.0139, 0.2053, 0.1566, -0.0195, 0.1988, 0.1472,
        -0.0243, 0.1927, 0.1371, -0.0281, 0.187, 0.1264, -0.0307, 0.1815,
        0.1154, -0.032, 0.176, 0.1042, -0.0319, 0.1705, 0.0932, -0.0304,
        0.1647, 0.0826, -0.0277, 0.1586, 0.0725, -0.0237, 0.152, 0.0632,
        -0.0188, 0.1448, 0.0549, -0.0131, 0.137, 0.0477, -0.0068, 0.1284,
        0.0415, -0.0002, 0.1192, 0.0366, 0.0064, 0.1092, 0.0328, 0.0127,
        0.0986, 0.03, 0.0185, 0.0873, 0.0282, 0.0235, 0.0756, 0.0272, 0.0275,
        0.0636, 0.0268, 0.0303, 0.0512, 0.0268, 0.0318, 0.0388, 0.0269, 0.032,
        0.0265, 0.027, 0.0308, 0.0144, 0.0267, 0.0283, 0.0025, 0.0258, 0.0246,
        -0.0088, 0.0242, 0.0198, -0.0196, 0.0217, 0.0142, -0.0297, 0.0182,
        0.008, -0.0392, 0.0135, 0.0014, -0.0479, 0.0077, -0.0052, -0.0559,
        0.0007, -0.0116, -0.0632, -0.0074, -0.0175, -0.07, -0.0164, -0.0226,
        -0.0762, -0.0263, -0.0268, -0.082, -0.0368, -0.0299, -0.0876, -0.0478,
        -0.0316, -0.0931, -0.0589, -0.0321, -0.0985, -0.07, -0.0311, -0.1042,
        -0.0808, -0.0289, -0.1102, -0.0911, -0.0254, -0.1166, -0.1007,
        -0.0208, -0.1235, -0.1094, -0.0153, -0.1311, -0.1171, -0.0092,
        -0.1394, -0.1236, -0.0027, -0.1484, -0.129, 0.0039, -0.1581, -0.1333,
        0.0104, -0.1685, -0.1364, 0.0164, -0.1795, -0.1385, 0.0217, -0.191,
        -0.1398, 0.0261, -0.203, -0.1404, 0.0294, -0.2152, -0.1406, 0.0314,
        -0.2276, -0.1405, 0.0321,
    ],
    [
        -0.2276, -0.1405, -0.0321, -0.2221, -0.1293, -0.0314, -0.2165,
        -0.1185, -0.0294, -0.2106, -0.1081, -0.0261, -0.2043, -0.0983,
        -0.0217, -0.1975, -0.0895, -0.0164, -0.19, -0.0816, -0.0104, -0.1818,
        -0.0748, -0.0039, -0.173, -0.0692, 0.0027, -0.1634, -0.0647, 0.0092,
        -0.1532, -0.0614, 0.0153, -0.1423, -0.0591, 0.0208, -0.1308, -0.0576,
        0.0254, -0.1189, -0.0569, 0.0289, -0.1067, -0.0567, 0.0311, -0.0944,
        -0.0568, 0.0321, -0.082, -0.0569, 0.0316, -0.0697, -0.0568, 0.0299,
        -0.0577, -0.0563, 0.0268, -0.0461, -0.0552, 0.0226, -0.035, -0.0532,
        0.0175, -0.0244, -0.0503, 0.0116, -0.0146, -0.0462, 0.0052, -0.0055,
        -0.0411, -0.0014, 0.0029, -0.0347, -0.008, 0.0107, -0.0272, -0.0142,
        0.0177, -0.0187, -0.0198, 0.0242, -0.0093, -0.0246, 0.0303, 0.0009,
        -0.0283, 0.036, 0.0116, -0.0308, 0.0415, 0.0226, -0.032, 0.0469,
        0.0338, -0.0318, 0.0525, 0.0448, -0.0303, 0.0582, 0.0554, -0.0275,
        0.0644, 0.0654, -0.0235, 0.071, 0.0746, -0.0185, 0.0782, 0.0829,
        -0.0127, 0.0861, 0.0901, -0.0064, 0.0947, 0.0962, 0.0002, 0.104,
        0.1011, 0.0068, 0.114, 0.1048, 0.0131, 0.1247, 0.1075, 0.0188, 0.1359,
        0.1093, 0.0237, 0.1477, 0.1102, 0.0277, 0.1597, 0.1106, 0.0304,
        0.1721, 0.1106, 0.0319, 0.1845, 0.1105, 0.032, 0.1968, 0.1105, 0.0307,
        0.2089, 0.1108, 0.0281, 0.2207, 0.1117, 0.0243, 0.232, 0.1133, 0.0195,
        0.2428, 0.1158, 0.0139,
    ],
    [
        -0.0954, -0.0637, -0.0318, -0.0961, -0.0625, -0.0212, -0.0968,
        -0.0614, -0.0106, -0.0975, -0.0602, 0.0, -0.0983, -0.059, 0.0106,
        -0.099, -0.0579, 0.0212, -0.0997, -0.0567, 0.0318,
    ],
    [
        -0.0697, -0.0568, 0.0299, -0.0718, -0.0535, 0.0199, -0.0738, -0.0502,
        0.01, -0.0759, -0.0468, 0.0, -0.0779, -0.0435, -0.01, -0.08, -0.0402,
        -0.0199, -0.082, -0.0368, -0.0299,
    ],
    [
        -0.0671, -0.0125, -0.0205, -0.0628, -0.0194, -0.0137, -0.0585,
        -0.0264, -0.0068, -0.0542, -0.0334, 0.0, -0.0499, -0.0404, 0.0068,
        -0.0456, -0.0474, 0.0137, -0.0412, -0.0544, 0.0205,
    ],
    [
        -0.016, -0.0469, 0.0061, -0.0215, -0.0379, 0.0041, -0.027, -0.029,
        0.002, -0.0325, -0.0201, 0.0, -0.038, -0.0111, -0.002, -0.0435,
        -0.0022, -0.0041, -0.0491, 0.0067, -0.0061,
    ],
    [
        -0.0269, 0.0193, 0.0098, -0.0215, 0.0106, 0.0065, -0.0162, 0.002,
        0.0033, -0.0108, -0.0067, 0.0, -0.0055, -0.0154, -0.0033, -0.0001,
        -0.024, -0.0065, 0.0052, -0.0327, -0.0098,
    ],
    [
        0.0224, -0.0121, -0.0233, 0.0186, -0.0058, -0.0155, 0.0147, 0.0004,
        -0.0078, 0.0108, 0.0067, 0.0, 0.007, 0.0129, 0.0078, 0.0031, 0.0192,
        0.0155, -0.0007, 0.0255, 0.0233,
    ],
    [
        0.0283, 0.027, 0.0311, 0.0297, 0.0247, 0.0207, 0.0311, 0.0224, 0.0104,
        0.0325, 0.0201, 0.0, 0.0339, 0.0178, -0.0104, 0.0354, 0.0155, -0.0207,
        0.0368, 0.0132, -0.0311,
    ],
    [
        0.0501, 0.0401, -0.0311, 0.0514, 0.0379, -0.0207, 0.0528, 0.0357,
        -0.0104, 0.0542, 0.0334, 0.0, 0.0556, 0.0312, 0.0104, 0.0569, 0.029,
        0.0207, 0.0583, 0.0268, 0.0311,
    ],
    [
        0.0873, 0.0282, 0.0235, 0.0835, 0.0344, 0.0157, 0.0797, 0.0406,
        0.0078, 0.0759, 0.0468, 0.0, 0.072, 0.053, -0.0078, 0.0682, 0.0592,
        -0.0157, 0.0644, 0.0654, -0.0235,
    ],
    [
        0.0815, 0.0861, -0.0101, 0.0869, 0.0775, -0.0067, 0.0922, 0.0688,
        -0.0034, 0.0975, 0.0602, 0.0, 0.1029, 0.0516, 0.0034, 0.1082, 0.0429,
        0.0067, 0.1135, 0.0343, 0.0101,
    ],
];
export const helix3dPaths: number[][] = [
    [0.0, 0.0, 0.0, 0.0, 0.0759, 0.0],
    [-0.0657, 0.0379, 0.0, 0.0, 0.0759, 0.0],
    [0.0657, 0.0379, 0.0, 0.0, 0.0759, 0.0],
    [-0.0657, -0.0379, -0.0, -0.0657, 0.0379, 0.0],
    [0.0, 0.0, 0.0, -0.0657, 0.0379, 0.0],
    [0.0, 0.0, 0.0, -0.0657, -0.0379, -0.0],
    [0.0, -0.0759, -0.0, -0.0657, -0.0379, -0.0],
    [0.0, 0.0, 0.0, 0.0, -0.0759, -0.0],
    [0.0657, -0.0379, -0.0, 0.0, -0.0759, -0.0],
    [0.0657, 0.0379, 0.0, 0.0657, -0.0379, -0.0],
    [0.0, 0.0, 0.0, 0.0657, -0.0379, -0.0],
    [0.0, 0.0, 0.0, 0.0657, 0.0379, 0.0],
    [0.015, 0.0759, 0.0, 0.015, 0.0659, -0.0036],
    [0.0075, 0.0634, 0.0034, 0.015, 0.0659, -0.0036],
    [0.0075, 0.0685, -0.0107, 0.015, 0.0659, -0.0036],
    [0.0075, 0.0733, 0.007, 0.0075, 0.0634, 0.0034],
    [0.0, 0.0608, 0.0105, 0.0075, 0.0634, 0.0034],
    [0.0, 0.0659, -0.0036, 0.0075, 0.0634, 0.0034],
    [0.0, 0.0708, 0.0141, 0.0, 0.0608, 0.0105],
    [-0.0075, 0.0634, 0.0034, 0.0, 0.0608, 0.0105],
    [0.0075, 0.0733, 0.007, 0.015, 0.0759, 0.0],
    [0.015, 0.0858, 0.0036, 0.015, 0.0759, 0.0],
    [0.0075, 0.0784, -0.007, 0.015, 0.0759, 0.0],
    [0.0, 0.0708, 0.0141, 0.0075, 0.0733, 0.007],
    [0.0075, 0.0833, 0.0107, 0.0075, 0.0733, 0.007],
    [0.0, 0.0807, 0.0177, 0.0, 0.0708, 0.0141],
    [-0.0075, 0.0733, 0.007, 0.0, 0.0708, 0.0141],
    [0.0075, 0.0833, 0.0107, 0.015, 0.0858, 0.0036],
    [0.0075, 0.0884, -0.0034, 0.015, 0.0858, 0.0036],
    [0.0, 0.0807, 0.0177, 0.0075, 0.0833, 0.0107],
    [0.0, 0.0858, 0.0036, 0.0075, 0.0833, 0.0107],
    [-0.0075, 0.0833, 0.0107, 0.0, 0.0807, 0.0177],
    [-0.015, 0.0759, 0.0, -0.015, 0.0659, -0.0036],
    [-0.0075, 0.0685, -0.0107, -0.015, 0.0659, -0.0036],
    [-0.0075, 0.0634, 0.0034, -0.015, 0.0659, -0.0036],
    [-0.0075, 0.0784, -0.007, -0.0075, 0.0685, -0.0107],
    [0.0, 0.071, -0.0177, -0.0075, 0.0685, -0.0107],
    [0.0, 0.0659, -0.0036, -0.0075, 0.0685, -0.0107],
    [0.0, 0.081, -0.0141, 0.0, 0.071, -0.0177],
    [0.0075, 0.0685, -0.0107, 0.0, 0.071, -0.0177],
    [-0.0075, 0.0784, -0.007, -0.015, 0.0759, 0.0],
    [-0.015, 0.0858, 0.0036, -0.015, 0.0759, 0.0],
    [-0.0075, 0.0733, 0.007, -0.015, 0.0759, 0.0],
    [0.0, 0.081, -0.0141, -0.0075, 0.0784, -0.007],
    [-0.0075, 0.0884, -0.0034, -0.0075, 0.0784, -0.007],
    [0.0, 0.091, -0.0105, 0.0, 0.081, -0.0141],
    [0.0075, 0.0784, -0.007, 0.0, 0.081, -0.0141],
    [-0.0075, 0.0884, -0.0034, -0.015, 0.0858, 0.0036],
    [-0.0075, 0.0833, 0.0107, -0.015, 0.0858, 0.0036],
    [0.0, 0.091, -0.0105, -0.0075, 0.0884, -0.0034],
    [0.0, 0.0858, 0.0036, -0.0075, 0.0884, -0.0034],
    [0.0075, 0.0884, -0.0034, 0.0, 0.091, -0.0105],
    [0.0, 0.0858, 0.0036, -0.0075, 0.0833, 0.0107],
    [-0.0075, 0.0733, 0.007, -0.0075, 0.0833, 0.0107],
    [0.0075, 0.0884, -0.0034, 0.0, 0.0858, 0.0036],
    [0.0075, 0.0784, -0.007, 0.0075, 0.0884, -0.0034],
    [0.0, 0.0659, -0.0036, 0.0075, 0.0685, -0.0107],
    [0.0075, 0.0784, -0.007, 0.0075, 0.0685, -0.0107],
    [-0.0075, 0.0634, 0.0034, 0.0, 0.0659, -0.0036],
    [-0.0075, 0.0733, 0.007, -0.0075, 0.0634, 0.0034],
    [-0.0507, 0.0379, 0.0, -0.0507, 0.028, -0.0036],
    [-0.0582, 0.0254, 0.0034, -0.0507, 0.028, -0.0036],
    [-0.0582, 0.0305, -0.0107, -0.0507, 0.028, -0.0036],
    [-0.0582, 0.0354, 0.007, -0.0582, 0.0254, 0.0034],
    [-0.0657, 0.0229, 0.0105, -0.0582, 0.0254, 0.0034],
    [-0.0657, 0.028, -0.0036, -0.0582, 0.0254, 0.0034],
    [-0.0657, 0.0328, 0.0141, -0.0657, 0.0229, 0.0105],
    [-0.0732, 0.0254, 0.0034, -0.0657, 0.0229, 0.0105],
    [-0.0582, 0.0354, 0.007, -0.0507, 0.0379, 0.0],
    [-0.0507, 0.0479, 0.0036, -0.0507, 0.0379, 0.0],
    [-0.0582, 0.0405, -0.007, -0.0507, 0.0379, 0.0],
    [-0.0657, 0.0328, 0.0141, -0.0582, 0.0354, 0.007],
    [-0.0582, 0.0453, 0.0107, -0.0582, 0.0354, 0.007],
    [-0.0657, 0.0428, 0.0177, -0.0657, 0.0328, 0.0141],
    [-0.0732, 0.0354, 0.007, -0.0657, 0.0328, 0.0141],
    [-0.0582, 0.0453, 0.0107, -0.0507, 0.0479, 0.0036],
    [-0.0582, 0.0505, -0.0034, -0.0507, 0.0479, 0.0036],
    [-0.0657, 0.0428, 0.0177, -0.0582, 0.0453, 0.0107],
    [-0.0657, 0.0479, 0.0036, -0.0582, 0.0453, 0.0107],
    [-0.0732, 0.0453, 0.0107, -0.0657, 0.0428, 0.0177],
    [-0.0807, 0.0379, 0.0, -0.0807, 0.028, -0.0036],
    [-0.0732, 0.0305, -0.0107, -0.0807, 0.028, -0.0036],
    [-0.0732, 0.0254, 0.0034, -0.0807, 0.028, -0.0036],
    [-0.0732, 0.0405, -0.007, -0.0732, 0.0305, -0.0107],
    [-0.0657, 0.0331, -0.0177, -0.0732, 0.0305, -0.0107],
    [-0.0657, 0.028, -0.0036, -0.0732, 0.0305, -0.0107],
    [-0.0657, 0.0431, -0.0141, -0.0657, 0.0331, -0.0177],
    [-0.0582, 0.0305, -0.0107, -0.0657, 0.0331, -0.0177],
    [-0.0732, 0.0405, -0.007, -0.0807, 0.0379, 0.0],
    [-0.0807, 0.0479, 0.0036, -0.0807, 0.0379, 0.0],
    [-0.0732, 0.0354, 0.007, -0.0807, 0.0379, 0.0],
    [-0.0657, 0.0431, -0.0141, -0.0732, 0.0405, -0.007],
    [-0.0732, 0.0505, -0.0034, -0.0732, 0.0405, -0.007],
    [-0.0657, 0.053, -0.0105, -0.0657, 0.0431, -0.0141],
    [-0.0582, 0.0405, -0.007, -0.0657, 0.0431, -0.0141],
    [-0.0732, 0.0505, -0.0034, -0.0807, 0.0479, 0.0036],
    [-0.0732, 0.0453, 0.0107, -0.0807, 0.0479, 0.0036],
    [-0.0657, 0.053, -0.0105, -0.0732, 0.0505, -0.0034],
    [-0.0657, 0.0479, 0.0036, -0.0732, 0.0505, -0.0034],
    [-0.0582, 0.0505, -0.0034, -0.0657, 0.053, -0.0105],
    [-0.0657, 0.0479, 0.0036, -0.0732, 0.0453, 0.0107],
    [-0.0732, 0.0354, 0.007, -0.0732, 0.0453, 0.0107],
    [-0.0582, 0.0505, -0.0034, -0.0657, 0.0479, 0.0036],
    [-0.0582, 0.0405, -0.007, -0.0582, 0.0505, -0.0034],
    [-0.0657, 0.028, -0.0036, -0.0582, 0.0305, -0.0107],
    [-0.0582, 0.0405, -0.007, -0.0582, 0.0305, -0.0107],
    [-0.0732, 0.0254, 0.0034, -0.0657, 0.028, -0.0036],
    [-0.0732, 0.0354, 0.007, -0.0732, 0.0254, 0.0034],
    [-0.0507, -0.0379, -0.0, -0.0507, -0.0479, -0.0036],
    [-0.0582, -0.0505, 0.0034, -0.0507, -0.0479, -0.0036],
    [-0.0582, -0.0453, -0.0107, -0.0507, -0.0479, -0.0036],
    [-0.0582, -0.0405, 0.007, -0.0582, -0.0505, 0.0034],
    [-0.0657, -0.053, 0.0105, -0.0582, -0.0505, 0.0034],
    [-0.0657, -0.0479, -0.0036, -0.0582, -0.0505, 0.0034],
    [-0.0657, -0.0431, 0.0141, -0.0657, -0.053, 0.0105],
    [-0.0732, -0.0505, 0.0034, -0.0657, -0.053, 0.0105],
    [-0.0582, -0.0405, 0.007, -0.0507, -0.0379, -0.0],
    [-0.0507, -0.028, 0.0036, -0.0507, -0.0379, -0.0],
    [-0.0582, -0.0354, -0.007, -0.0507, -0.0379, -0.0],
    [-0.0657, -0.0431, 0.0141, -0.0582, -0.0405, 0.007],
    [-0.0582, -0.0305, 0.0107, -0.0582, -0.0405, 0.007],
    [-0.0657, -0.0331, 0.0177, -0.0657, -0.0431, 0.0141],
    [-0.0732, -0.0405, 0.007, -0.0657, -0.0431, 0.0141],
    [-0.0582, -0.0305, 0.0107, -0.0507, -0.028, 0.0036],
    [-0.0582, -0.0254, -0.0034, -0.0507, -0.028, 0.0036],
    [-0.0657, -0.0331, 0.0177, -0.0582, -0.0305, 0.0107],
    [-0.0657, -0.028, 0.0036, -0.0582, -0.0305, 0.0107],
    [-0.0732, -0.0305, 0.0107, -0.0657, -0.0331, 0.0177],
    [-0.0807, -0.0379, -0.0, -0.0807, -0.0479, -0.0036],
    [-0.0732, -0.0453, -0.0107, -0.0807, -0.0479, -0.0036],
    [-0.0732, -0.0505, 0.0034, -0.0807, -0.0479, -0.0036],
    [-0.0732, -0.0354, -0.007, -0.0732, -0.0453, -0.0107],
    [-0.0657, -0.0428, -0.0177, -0.0732, -0.0453, -0.0107],
    [-0.0657, -0.0479, -0.0036, -0.0732, -0.0453, -0.0107],
    [-0.0657, -0.0328, -0.0141, -0.0657, -0.0428, -0.0177],
    [-0.0582, -0.0453, -0.0107, -0.0657, -0.0428, -0.0177],
    [-0.0732, -0.0354, -0.007, -0.0807, -0.0379, -0.0],
    [-0.0807, -0.028, 0.0036, -0.0807, -0.0379, -0.0],
    [-0.0732, -0.0405, 0.007, -0.0807, -0.0379, -0.0],
    [-0.0657, -0.0328, -0.0141, -0.0732, -0.0354, -0.007],
    [-0.0732, -0.0254, -0.0034, -0.0732, -0.0354, -0.007],
    [-0.0657, -0.0229, -0.0105, -0.0657, -0.0328, -0.0141],
    [-0.0582, -0.0354, -0.007, -0.0657, -0.0328, -0.0141],
    [-0.0732, -0.0254, -0.0034, -0.0807, -0.028, 0.0036],
    [-0.0732, -0.0305, 0.0107, -0.0807, -0.028, 0.0036],
    [-0.0657, -0.0229, -0.0105, -0.0732, -0.0254, -0.0034],
    [-0.0657, -0.028, 0.0036, -0.0732, -0.0254, -0.0034],
    [-0.0582, -0.0254, -0.0034, -0.0657, -0.0229, -0.0105],
    [-0.0657, -0.028, 0.0036, -0.0732, -0.0305, 0.0107],
    [-0.0732, -0.0405, 0.007, -0.0732, -0.0305, 0.0107],
    [-0.0582, -0.0254, -0.0034, -0.0657, -0.028, 0.0036],
    [-0.0582, -0.0354, -0.007, -0.0582, -0.0254, -0.0034],
    [-0.0657, -0.0479, -0.0036, -0.0582, -0.0453, -0.0107],
    [-0.0582, -0.0354, -0.007, -0.0582, -0.0453, -0.0107],
    [-0.0732, -0.0505, 0.0034, -0.0657, -0.0479, -0.0036],
    [-0.0732, -0.0405, 0.007, -0.0732, -0.0505, 0.0034],
    [0.015, -0.0759, -0.0, 0.015, -0.0858, -0.0036],
    [0.0075, -0.0884, 0.0034, 0.015, -0.0858, -0.0036],
    [0.0075, -0.0833, -0.0107, 0.015, -0.0858, -0.0036],
    [0.0075, -0.0784, 0.007, 0.0075, -0.0884, 0.0034],
    [0.0, -0.091, 0.0105, 0.0075, -0.0884, 0.0034],
    [0.0, -0.0858, -0.0036, 0.0075, -0.0884, 0.0034],
    [0.0, -0.081, 0.0141, 0.0, -0.091, 0.0105],
    [-0.0075, -0.0884, 0.0034, 0.0, -0.091, 0.0105],
    [0.0075, -0.0784, 0.007, 0.015, -0.0759, -0.0],
    [0.015, -0.0659, 0.0036, 0.015, -0.0759, -0.0],
    [0.0075, -0.0733, -0.007, 0.015, -0.0759, -0.0],
    [0.0, -0.081, 0.0141, 0.0075, -0.0784, 0.007],
    [0.0075, -0.0685, 0.0107, 0.0075, -0.0784, 0.007],
    [0.0, -0.071, 0.0177, 0.0, -0.081, 0.0141],
    [-0.0075, -0.0784, 0.007, 0.0, -0.081, 0.0141],
    [0.0075, -0.0685, 0.0107, 0.015, -0.0659, 0.0036],
    [0.0075, -0.0634, -0.0034, 0.015, -0.0659, 0.0036],
    [0.0, -0.071, 0.0177, 0.0075, -0.0685, 0.0107],
    [0.0, -0.0659, 0.0036, 0.0075, -0.0685, 0.0107],
    [-0.0075, -0.0685, 0.0107, 0.0, -0.071, 0.0177],
    [-0.015, -0.0759, -0.0, -0.015, -0.0858, -0.0036],
    [-0.0075, -0.0833, -0.0107, -0.015, -0.0858, -0.0036],
    [-0.0075, -0.0884, 0.0034, -0.015, -0.0858, -0.0036],
    [-0.0075, -0.0733, -0.007, -0.0075, -0.0833, -0.0107],
    [0.0, -0.0807, -0.0177, -0.0075, -0.0833, -0.0107],
    [0.0, -0.0858, -0.0036, -0.0075, -0.0833, -0.0107],
    [0.0, -0.0708, -0.0141, 0.0, -0.0807, -0.0177],
    [0.0075, -0.0833, -0.0107, 0.0, -0.0807, -0.0177],
    [-0.0075, -0.0733, -0.007, -0.015, -0.0759, -0.0],
    [-0.015, -0.0659, 0.0036, -0.015, -0.0759, -0.0],
    [-0.0075, -0.0784, 0.007, -0.015, -0.0759, -0.0],
    [0.0, -0.0708, -0.0141, -0.0075, -0.0733, -0.007],
    [-0.0075, -0.0634, -0.0034, -0.0075, -0.0733, -0.007],
    [0.0, -0.0608, -0.0105, 0.0, -0.0708, -0.0141],
    [0.0075, -0.0733, -0.007, 0.0, -0.0708, -0.0141],
    [-0.0075, -0.0634, -0.0034, -0.015, -0.0659, 0.0036],
    [-0.0075, -0.0685, 0.0107, -0.015, -0.0659, 0.0036],
    [0.0, -0.0608, -0.0105, -0.0075, -0.0634, -0.0034],
    [0.0, -0.0659, 0.0036, -0.0075, -0.0634, -0.0034],
    [0.0075, -0.0634, -0.0034, 0.0, -0.0608, -0.0105],
    [0.0, -0.0659, 0.0036, -0.0075, -0.0685, 0.0107],
    [-0.0075, -0.0784, 0.007, -0.0075, -0.0685, 0.0107],
    [0.0075, -0.0634, -0.0034, 0.0, -0.0659, 0.0036],
    [0.0075, -0.0733, -0.007, 0.0075, -0.0634, -0.0034],
    [0.0, -0.0858, -0.0036, 0.0075, -0.0833, -0.0107],
    [0.0075, -0.0733, -0.007, 0.0075, -0.0833, -0.0107],
    [-0.0075, -0.0884, 0.0034, 0.0, -0.0858, -0.0036],
    [-0.0075, -0.0784, 0.007, -0.0075, -0.0884, 0.0034],
    [0.0807, -0.0379, -0.0, 0.0807, -0.0479, -0.0036],
    [0.0732, -0.0505, 0.0034, 0.0807, -0.0479, -0.0036],
    [0.0732, -0.0453, -0.0107, 0.0807, -0.0479, -0.0036],
    [0.0732, -0.0405, 0.007, 0.0732, -0.0505, 0.0034],
    [0.0657, -0.053, 0.0105, 0.0732, -0.0505, 0.0034],
    [0.0657, -0.0479, -0.0036, 0.0732, -0.0505, 0.0034],
    [0.0657, -0.0431, 0.0141, 0.0657, -0.053, 0.0105],
    [0.0582, -0.0505, 0.0034, 0.0657, -0.053, 0.0105],
    [0.0732, -0.0405, 0.007, 0.0807, -0.0379, -0.0],
    [0.0807, -0.028, 0.0036, 0.0807, -0.0379, -0.0],
    [0.0732, -0.0354, -0.007, 0.0807, -0.0379, -0.0],
    [0.0657, -0.0431, 0.0141, 0.0732, -0.0405, 0.007],
    [0.0732, -0.0305, 0.0107, 0.0732, -0.0405, 0.007],
    [0.0657, -0.0331, 0.0177, 0.0657, -0.0431, 0.0141],
    [0.0582, -0.0405, 0.007, 0.0657, -0.0431, 0.0141],
    [0.0732, -0.0305, 0.0107, 0.0807, -0.028, 0.0036],
    [0.0732, -0.0254, -0.0034, 0.0807, -0.028, 0.0036],
    [0.0657, -0.0331, 0.0177, 0.0732, -0.0305, 0.0107],
    [0.0657, -0.028, 0.0036, 0.0732, -0.0305, 0.0107],
    [0.0582, -0.0305, 0.0107, 0.0657, -0.0331, 0.0177],
    [0.0507, -0.0379, -0.0, 0.0507, -0.0479, -0.0036],
    [0.0582, -0.0453, -0.0107, 0.0507, -0.0479, -0.0036],
    [0.0582, -0.0505, 0.0034, 0.0507, -0.0479, -0.0036],
    [0.0582, -0.0354, -0.007, 0.0582, -0.0453, -0.0107],
    [0.0657, -0.0428, -0.0177, 0.0582, -0.0453, -0.0107],
    [0.0657, -0.0479, -0.0036, 0.0582, -0.0453, -0.0107],
    [0.0657, -0.0328, -0.0141, 0.0657, -0.0428, -0.0177],
    [0.0732, -0.0453, -0.0107, 0.0657, -0.0428, -0.0177],
    [0.0582, -0.0354, -0.007, 0.0507, -0.0379, -0.0],
    [0.0507, -0.028, 0.0036, 0.0507, -0.0379, -0.0],
    [0.0582, -0.0405, 0.007, 0.0507, -0.0379, -0.0],
    [0.0657, -0.0328, -0.0141, 0.0582, -0.0354, -0.007],
    [0.0582, -0.0254, -0.0034, 0.0582, -0.0354, -0.007],
    [0.0657, -0.0229, -0.0105, 0.0657, -0.0328, -0.0141],
    [0.0732, -0.0354, -0.007, 0.0657, -0.0328, -0.0141],
    [0.0582, -0.0254, -0.0034, 0.0507, -0.028, 0.0036],
    [0.0582, -0.0305, 0.0107, 0.0507, -0.028, 0.0036],
    [0.0657, -0.0229, -0.0105, 0.0582, -0.0254, -0.0034],
    [0.0657, -0.028, 0.0036, 0.0582, -0.0254, -0.0034],
    [0.0732, -0.0254, -0.0034, 0.0657, -0.0229, -0.0105],
    [0.0657, -0.028, 0.0036, 0.0582, -0.0305, 0.0107],
    [0.0582, -0.0405, 0.007, 0.0582, -0.0305, 0.0107],
    [0.0732, -0.0254, -0.0034, 0.0657, -0.028, 0.0036],
    [0.0732, -0.0354, -0.007, 0.0732, -0.0254, -0.0034],
    [0.0657, -0.0479, -0.0036, 0.0732, -0.0453, -0.0107],
    [0.0732, -0.0354, -0.007, 0.0732, -0.0453, -0.0107],
    [0.0582, -0.0505, 0.0034, 0.0657, -0.0479, -0.0036],
    [0.0582, -0.0405, 0.007, 0.0582, -0.0505, 0.0034],
    [0.0807, 0.0379, 0.0, 0.0807, 0.028, -0.0036],
    [0.0732, 0.0254, 0.0034, 0.0807, 0.028, -0.0036],
    [0.0732, 0.0305, -0.0107, 0.0807, 0.028, -0.0036],
    [0.0732, 0.0354, 0.007, 0.0732, 0.0254, 0.0034],
    [0.0657, 0.0229, 0.0105, 0.0732, 0.0254, 0.0034],
    [0.0657, 0.028, -0.0036, 0.0732, 0.0254, 0.0034],
    [0.0657, 0.0328, 0.0141, 0.0657, 0.0229, 0.0105],
    [0.0582, 0.0254, 0.0034, 0.0657, 0.0229, 0.0105],
    [0.0732, 0.0354, 0.007, 0.0807, 0.0379, 0.0],
    [0.0807, 0.0479, 0.0036, 0.0807, 0.0379, 0.0],
    [0.0732, 0.0405, -0.007, 0.0807, 0.0379, 0.0],
    [0.0657, 0.0328, 0.0141, 0.0732, 0.0354, 0.007],
    [0.0732, 0.0453, 0.0107, 0.0732, 0.0354, 0.007],
    [0.0657, 0.0428, 0.0177, 0.0657, 0.0328, 0.0141],
    [0.0582, 0.0354, 0.007, 0.0657, 0.0328, 0.0141],
    [0.0732, 0.0453, 0.0107, 0.0807, 0.0479, 0.0036],
    [0.0732, 0.0505, -0.0034, 0.0807, 0.0479, 0.0036],
    [0.0657, 0.0428, 0.0177, 0.0732, 0.0453, 0.0107],
    [0.0657, 0.0479, 0.0036, 0.0732, 0.0453, 0.0107],
    [0.0582, 0.0453, 0.0107, 0.0657, 0.0428, 0.0177],
    [0.0507, 0.0379, 0.0, 0.0507, 0.028, -0.0036],
    [0.0582, 0.0305, -0.0107, 0.0507, 0.028, -0.0036],
    [0.0582, 0.0254, 0.0034, 0.0507, 0.028, -0.0036],
    [0.0582, 0.0405, -0.007, 0.0582, 0.0305, -0.0107],
    [0.0657, 0.0331, -0.0177, 0.0582, 0.0305, -0.0107],
    [0.0657, 0.028, -0.0036, 0.0582, 0.0305, -0.0107],
    [0.0657, 0.0431, -0.0141, 0.0657, 0.0331, -0.0177],
    [0.0732, 0.0305, -0.0107, 0.0657, 0.0331, -0.0177],
    [0.0582, 0.0405, -0.007, 0.0507, 0.0379, 0.0],
    [0.0507, 0.0479, 0.0036, 0.0507, 0.0379, 0.0],
    [0.0582, 0.0354, 0.007, 0.0507, 0.0379, 0.0],
    [0.0657, 0.0431, -0.0141, 0.0582, 0.0405, -0.007],
    [0.0582, 0.0505, -0.0034, 0.0582, 0.0405, -0.007],
    [0.0657, 0.053, -0.0105, 0.0657, 0.0431, -0.0141],
    [0.0732, 0.0405, -0.007, 0.0657, 0.0431, -0.0141],
    [0.0582, 0.0505, -0.0034, 0.0507, 0.0479, 0.0036],
    [0.0582, 0.0453, 0.0107, 0.0507, 0.0479, 0.0036],
    [0.0657, 0.053, -0.0105, 0.0582, 0.0505, -0.0034],
    [0.0657, 0.0479, 0.0036, 0.0582, 0.0505, -0.0034],
    [0.0732, 0.0505, -0.0034, 0.0657, 0.053, -0.0105],
    [0.0657, 0.0479, 0.0036, 0.0582, 0.0453, 0.0107],
    [0.0582, 0.0354, 0.007, 0.0582, 0.0453, 0.0107],
    [0.0732, 0.0505, -0.0034, 0.0657, 0.0479, 0.0036],
    [0.0732, 0.0405, -0.007, 0.0732, 0.0505, -0.0034],
    [0.0657, 0.028, -0.0036, 0.0732, 0.0305, -0.0107],
    [0.0732, 0.0405, -0.007, 0.0732, 0.0305, -0.0107],
    [0.0582, 0.0254, 0.0034, 0.0657, 0.028, -0.0036],
    [0.0582, 0.0354, 0.007, 0.0582, 0.0254, 0.0034],
    [0.015, 0.0, 0.0, 0.015, -0.01, -0.0036],
    [0.0075, -0.0125, 0.0034, 0.015, -0.01, -0.0036],
    [0.0075, -0.0074, -0.0107, 0.015, -0.01, -0.0036],
    [0.0075, -0.0026, 0.007, 0.0075, -0.0125, 0.0034],
    [0.0, -0.0151, 0.0105, 0.0075, -0.0125, 0.0034],
    [0.0, -0.01, -0.0036, 0.0075, -0.0125, 0.0034],
    [0.0, -0.0051, 0.0141, 0.0, -0.0151, 0.0105],
    [-0.0075, -0.0125, 0.0034, 0.0, -0.0151, 0.0105],
    [0.0075, -0.0026, 0.007, 0.015, 0.0, 0.0],
    [0.015, 0.01, 0.0036, 0.015, 0.0, 0.0],
    [0.0075, 0.0026, -0.007, 0.015, 0.0, 0.0],
    [0.0, -0.0051, 0.0141, 0.0075, -0.0026, 0.007],
    [0.0075, 0.0074, 0.0107, 0.0075, -0.0026, 0.007],
    [0.0, 0.0048, 0.0177, 0.0, -0.0051, 0.0141],
    [-0.0075, -0.0026, 0.007, 0.0, -0.0051, 0.0141],
    [0.0075, 0.0074, 0.0107, 0.015, 0.01, 0.0036],
    [0.0075, 0.0125, -0.0034, 0.015, 0.01, 0.0036],
    [0.0, 0.0048, 0.0177, 0.0075, 0.0074, 0.0107],
    [0.0, 0.01, 0.0036, 0.0075, 0.0074, 0.0107],
    [-0.0075, 0.0074, 0.0107, 0.0, 0.0048, 0.0177],
    [-0.015, 0.0, 0.0, -0.015, -0.01, -0.0036],
    [-0.0075, -0.0074, -0.0107, -0.015, -0.01, -0.0036],
    [-0.0075, -0.0125, 0.0034, -0.015, -0.01, -0.0036],
    [-0.0075, 0.0026, -0.007, -0.0075, -0.0074, -0.0107],
    [0.0, -0.0048, -0.0177, -0.0075, -0.0074, -0.0107],
    [0.0, -0.01, -0.0036, -0.0075, -0.0074, -0.0107],
    [0.0, 0.0051, -0.0141, 0.0, -0.0048, -0.0177],
    [0.0075, -0.0074, -0.0107, 0.0, -0.0048, -0.0177],
    [-0.0075, 0.0026, -0.007, -0.015, 0.0, 0.0],
    [-0.015, 0.01, 0.0036, -0.015, 0.0, 0.0],
    [-0.0075, -0.0026, 0.007, -0.015, 0.0, 0.0],
    [0.0, 0.0051, -0.0141, -0.0075, 0.0026, -0.007],
    [-0.0075, 0.0125, -0.0034, -0.0075, 0.0026, -0.007],
    [0.0, 0.0151, -0.0105, 0.0, 0.0051, -0.0141],
    [0.0075, 0.0026, -0.007, 0.0, 0.0051, -0.0141],
    [-0.0075, 0.0125, -0.0034, -0.015, 0.01, 0.0036],
    [-0.0075, 0.0074, 0.0107, -0.015, 0.01, 0.0036],
    [0.0, 0.0151, -0.0105, -0.0075, 0.0125, -0.0034],
    [0.0, 0.01, 0.0036, -0.0075, 0.0125, -0.0034],
    [0.0075, 0.0125, -0.0034, 0.0, 0.0151, -0.0105],
    [0.0, 0.01, 0.0036, -0.0075, 0.0074, 0.0107],
    [-0.0075, -0.0026, 0.007, -0.0075, 0.0074, 0.0107],
    [0.0075, 0.0125, -0.0034, 0.0, 0.01, 0.0036],
    [0.0075, 0.0026, -0.007, 0.0075, 0.0125, -0.0034],
    [0.0, -0.01, -0.0036, 0.0075, -0.0074, -0.0107],
    [0.0075, 0.0026, -0.007, 0.0075, -0.0074, -0.0107],
    [-0.0075, -0.0125, 0.0034, 0.0, -0.01, -0.0036],
    [-0.0075, -0.0026, 0.007, -0.0075, -0.0125, 0.0034],
    [0.015, 0.0659, -0.0036, 0.015, 0.0759, 0.0],
    [0.015, 0.0659, -0.0036, 0.0075, 0.0634, 0.0034],
    [0.015, 0.0659, -0.0036, 0.0075, 0.0685, -0.0107],
    [0.0075, 0.0634, 0.0034, 0.0075, 0.0733, 0.007],
    [0.0075, 0.0634, 0.0034, 0.0, 0.0608, 0.0105],
    [0.0075, 0.0634, 0.0034, 0.0, 0.0659, -0.0036],
    [0.0, 0.0608, 0.0105, 0.0, 0.0708, 0.0141],
    [0.0, 0.0608, 0.0105, -0.0075, 0.0634, 0.0034],
    [0.015, 0.0759, 0.0, 0.0075, 0.0733, 0.007],
    [0.015, 0.0759, 0.0, 0.015, 0.0858, 0.0036],
    [0.015, 0.0759, 0.0, 0.0075, 0.0784, -0.007],
    [0.0075, 0.0733, 0.007, 0.0, 0.0708, 0.0141],
    [0.0075, 0.0733, 0.007, 0.0075, 0.0833, 0.0107],
    [0.0, 0.0708, 0.0141, 0.0, 0.0807, 0.0177],
    [0.0, 0.0708, 0.0141, -0.0075, 0.0733, 0.007],
    [0.015, 0.0858, 0.0036, 0.0075, 0.0833, 0.0107],
    [0.015, 0.0858, 0.0036, 0.0075, 0.0884, -0.0034],
    [0.0075, 0.0833, 0.0107, 0.0, 0.0807, 0.0177],
    [0.0075, 0.0833, 0.0107, 0.0, 0.0858, 0.0036],
    [0.0, 0.0807, 0.0177, -0.0075, 0.0833, 0.0107],
    [-0.015, 0.0659, -0.0036, -0.015, 0.0759, 0.0],
    [-0.015, 0.0659, -0.0036, -0.0075, 0.0685, -0.0107],
    [-0.015, 0.0659, -0.0036, -0.0075, 0.0634, 0.0034],
    [-0.0075, 0.0685, -0.0107, -0.0075, 0.0784, -0.007],
    [-0.0075, 0.0685, -0.0107, 0.0, 0.071, -0.0177],
    [-0.0075, 0.0685, -0.0107, 0.0, 0.0659, -0.0036],
    [0.0, 0.071, -0.0177, 0.0, 0.081, -0.0141],
    [0.0, 0.071, -0.0177, 0.0075, 0.0685, -0.0107],
    [-0.015, 0.0759, 0.0, -0.0075, 0.0784, -0.007],
    [-0.015, 0.0759, 0.0, -0.015, 0.0858, 0.0036],
    [-0.015, 0.0759, 0.0, -0.0075, 0.0733, 0.007],
    [-0.0075, 0.0784, -0.007, 0.0, 0.081, -0.0141],
    [-0.0075, 0.0784, -0.007, -0.0075, 0.0884, -0.0034],
    [0.0, 0.081, -0.0141, 0.0, 0.091, -0.0105],
    [0.0, 0.081, -0.0141, 0.0075, 0.0784, -0.007],
    [-0.015, 0.0858, 0.0036, -0.0075, 0.0884, -0.0034],
    [-0.015, 0.0858, 0.0036, -0.0075, 0.0833, 0.0107],
    [-0.0075, 0.0884, -0.0034, 0.0, 0.091, -0.0105],
    [-0.0075, 0.0884, -0.0034, 0.0, 0.0858, 0.0036],
    [0.0, 0.091, -0.0105, 0.0075, 0.0884, -0.0034],
    [-0.0075, 0.0833, 0.0107, 0.0, 0.0858, 0.0036],
    [-0.0075, 0.0833, 0.0107, -0.0075, 0.0733, 0.007],
    [0.0, 0.0858, 0.0036, 0.0075, 0.0884, -0.0034],
    [0.0075, 0.0884, -0.0034, 0.0075, 0.0784, -0.007],
    [0.0075, 0.0685, -0.0107, 0.0, 0.0659, -0.0036],
    [0.0075, 0.0685, -0.0107, 0.0075, 0.0784, -0.007],
    [0.0, 0.0659, -0.0036, -0.0075, 0.0634, 0.0034],
    [-0.0075, 0.0634, 0.0034, -0.0075, 0.0733, 0.007],
    [-0.0507, 0.028, -0.0036, -0.0507, 0.0379, 0.0],
    [-0.0507, 0.028, -0.0036, -0.0582, 0.0254, 0.0034],
    [-0.0507, 0.028, -0.0036, -0.0582, 0.0305, -0.0107],
    [-0.0582, 0.0254, 0.0034, -0.0582, 0.0354, 0.007],
    [-0.0582, 0.0254, 0.0034, -0.0657, 0.0229, 0.0105],
    [-0.0582, 0.0254, 0.0034, -0.0657, 0.028, -0.0036],
    [-0.0657, 0.0229, 0.0105, -0.0657, 0.0328, 0.0141],
    [-0.0657, 0.0229, 0.0105, -0.0732, 0.0254, 0.0034],
    [-0.0507, 0.0379, 0.0, -0.0582, 0.0354, 0.007],
    [-0.0507, 0.0379, 0.0, -0.0507, 0.0479, 0.0036],
    [-0.0507, 0.0379, 0.0, -0.0582, 0.0405, -0.007],
    [-0.0582, 0.0354, 0.007, -0.0657, 0.0328, 0.0141],
    [-0.0582, 0.0354, 0.007, -0.0582, 0.0453, 0.0107],
    [-0.0657, 0.0328, 0.0141, -0.0657, 0.0428, 0.0177],
    [-0.0657, 0.0328, 0.0141, -0.0732, 0.0354, 0.007],
    [-0.0507, 0.0479, 0.0036, -0.0582, 0.0453, 0.0107],
    [-0.0507, 0.0479, 0.0036, -0.0582, 0.0505, -0.0034],
    [-0.0582, 0.0453, 0.0107, -0.0657, 0.0428, 0.0177],
    [-0.0582, 0.0453, 0.0107, -0.0657, 0.0479, 0.0036],
    [-0.0657, 0.0428, 0.0177, -0.0732, 0.0453, 0.0107],
    [-0.0807, 0.028, -0.0036, -0.0807, 0.0379, 0.0],
    [-0.0807, 0.028, -0.0036, -0.0732, 0.0305, -0.0107],
    [-0.0807, 0.028, -0.0036, -0.0732, 0.0254, 0.0034],
    [-0.0732, 0.0305, -0.0107, -0.0732, 0.0405, -0.007],
    [-0.0732, 0.0305, -0.0107, -0.0657, 0.0331, -0.0177],
    [-0.0732, 0.0305, -0.0107, -0.0657, 0.028, -0.0036],
    [-0.0657, 0.0331, -0.0177, -0.0657, 0.0431, -0.0141],
    [-0.0657, 0.0331, -0.0177, -0.0582, 0.0305, -0.0107],
    [-0.0807, 0.0379, 0.0, -0.0732, 0.0405, -0.007],
    [-0.0807, 0.0379, 0.0, -0.0807, 0.0479, 0.0036],
    [-0.0807, 0.0379, 0.0, -0.0732, 0.0354, 0.007],
    [-0.0732, 0.0405, -0.007, -0.0657, 0.0431, -0.0141],
    [-0.0732, 0.0405, -0.007, -0.0732, 0.0505, -0.0034],
    [-0.0657, 0.0431, -0.0141, -0.0657, 0.053, -0.0105],
    [-0.0657, 0.0431, -0.0141, -0.0582, 0.0405, -0.007],
    [-0.0807, 0.0479, 0.0036, -0.0732, 0.0505, -0.0034],
    [-0.0807, 0.0479, 0.0036, -0.0732, 0.0453, 0.0107],
    [-0.0732, 0.0505, -0.0034, -0.0657, 0.053, -0.0105],
    [-0.0732, 0.0505, -0.0034, -0.0657, 0.0479, 0.0036],
    [-0.0657, 0.053, -0.0105, -0.0582, 0.0505, -0.0034],
    [-0.0732, 0.0453, 0.0107, -0.0657, 0.0479, 0.0036],
    [-0.0732, 0.0453, 0.0107, -0.0732, 0.0354, 0.007],
    [-0.0657, 0.0479, 0.0036, -0.0582, 0.0505, -0.0034],
    [-0.0582, 0.0505, -0.0034, -0.0582, 0.0405, -0.007],
    [-0.0582, 0.0305, -0.0107, -0.0657, 0.028, -0.0036],
    [-0.0582, 0.0305, -0.0107, -0.0582, 0.0405, -0.007],
    [-0.0657, 0.028, -0.0036, -0.0732, 0.0254, 0.0034],
    [-0.0732, 0.0254, 0.0034, -0.0732, 0.0354, 0.007],
    [-0.0507, -0.0479, -0.0036, -0.0507, -0.0379, -0.0],
    [-0.0507, -0.0479, -0.0036, -0.0582, -0.0505, 0.0034],
    [-0.0507, -0.0479, -0.0036, -0.0582, -0.0453, -0.0107],
    [-0.0582, -0.0505, 0.0034, -0.0582, -0.0405, 0.007],
    [-0.0582, -0.0505, 0.0034, -0.0657, -0.053, 0.0105],
    [-0.0582, -0.0505, 0.0034, -0.0657, -0.0479, -0.0036],
    [-0.0657, -0.053, 0.0105, -0.0657, -0.0431, 0.0141],
    [-0.0657, -0.053, 0.0105, -0.0732, -0.0505, 0.0034],
    [-0.0507, -0.0379, -0.0, -0.0582, -0.0405, 0.007],
    [-0.0507, -0.0379, -0.0, -0.0507, -0.028, 0.0036],
    [-0.0507, -0.0379, -0.0, -0.0582, -0.0354, -0.007],
    [-0.0582, -0.0405, 0.007, -0.0657, -0.0431, 0.0141],
    [-0.0582, -0.0405, 0.007, -0.0582, -0.0305, 0.0107],
    [-0.0657, -0.0431, 0.0141, -0.0657, -0.0331, 0.0177],
    [-0.0657, -0.0431, 0.0141, -0.0732, -0.0405, 0.007],
    [-0.0507, -0.028, 0.0036, -0.0582, -0.0305, 0.0107],
    [-0.0507, -0.028, 0.0036, -0.0582, -0.0254, -0.0034],
    [-0.0582, -0.0305, 0.0107, -0.0657, -0.0331, 0.0177],
    [-0.0582, -0.0305, 0.0107, -0.0657, -0.028, 0.0036],
    [-0.0657, -0.0331, 0.0177, -0.0732, -0.0305, 0.0107],
    [-0.0807, -0.0479, -0.0036, -0.0807, -0.0379, -0.0],
    [-0.0807, -0.0479, -0.0036, -0.0732, -0.0453, -0.0107],
    [-0.0807, -0.0479, -0.0036, -0.0732, -0.0505, 0.0034],
    [-0.0732, -0.0453, -0.0107, -0.0732, -0.0354, -0.007],
    [-0.0732, -0.0453, -0.0107, -0.0657, -0.0428, -0.0177],
    [-0.0732, -0.0453, -0.0107, -0.0657, -0.0479, -0.0036],
    [-0.0657, -0.0428, -0.0177, -0.0657, -0.0328, -0.0141],
    [-0.0657, -0.0428, -0.0177, -0.0582, -0.0453, -0.0107],
    [-0.0807, -0.0379, -0.0, -0.0732, -0.0354, -0.007],
    [-0.0807, -0.0379, -0.0, -0.0807, -0.028, 0.0036],
    [-0.0807, -0.0379, -0.0, -0.0732, -0.0405, 0.007],
    [-0.0732, -0.0354, -0.007, -0.0657, -0.0328, -0.0141],
    [-0.0732, -0.0354, -0.007, -0.0732, -0.0254, -0.0034],
    [-0.0657, -0.0328, -0.0141, -0.0657, -0.0229, -0.0105],
    [-0.0657, -0.0328, -0.0141, -0.0582, -0.0354, -0.007],
    [-0.0807, -0.028, 0.0036, -0.0732, -0.0254, -0.0034],
    [-0.0807, -0.028, 0.0036, -0.0732, -0.0305, 0.0107],
    [-0.0732, -0.0254, -0.0034, -0.0657, -0.0229, -0.0105],
    [-0.0732, -0.0254, -0.0034, -0.0657, -0.028, 0.0036],
    [-0.0657, -0.0229, -0.0105, -0.0582, -0.0254, -0.0034],
    [-0.0732, -0.0305, 0.0107, -0.0657, -0.028, 0.0036],
    [-0.0732, -0.0305, 0.0107, -0.0732, -0.0405, 0.007],
    [-0.0657, -0.028, 0.0036, -0.0582, -0.0254, -0.0034],
    [-0.0582, -0.0254, -0.0034, -0.0582, -0.0354, -0.007],
    [-0.0582, -0.0453, -0.0107, -0.0657, -0.0479, -0.0036],
    [-0.0582, -0.0453, -0.0107, -0.0582, -0.0354, -0.007],
    [-0.0657, -0.0479, -0.0036, -0.0732, -0.0505, 0.0034],
    [-0.0732, -0.0505, 0.0034, -0.0732, -0.0405, 0.007],
    [0.015, -0.0858, -0.0036, 0.015, -0.0759, -0.0],
    [0.015, -0.0858, -0.0036, 0.0075, -0.0884, 0.0034],
    [0.015, -0.0858, -0.0036, 0.0075, -0.0833, -0.0107],
    [0.0075, -0.0884, 0.0034, 0.0075, -0.0784, 0.007],
    [0.0075, -0.0884, 0.0034, 0.0, -0.091, 0.0105],
    [0.0075, -0.0884, 0.0034, 0.0, -0.0858, -0.0036],
    [0.0, -0.091, 0.0105, 0.0, -0.081, 0.0141],
    [0.0, -0.091, 0.0105, -0.0075, -0.0884, 0.0034],
    [0.015, -0.0759, -0.0, 0.0075, -0.0784, 0.007],
    [0.015, -0.0759, -0.0, 0.015, -0.0659, 0.0036],
    [0.015, -0.0759, -0.0, 0.0075, -0.0733, -0.007],
    [0.0075, -0.0784, 0.007, 0.0, -0.081, 0.0141],
    [0.0075, -0.0784, 0.007, 0.0075, -0.0685, 0.0107],
    [0.0, -0.081, 0.0141, 0.0, -0.071, 0.0177],
    [0.0, -0.081, 0.0141, -0.0075, -0.0784, 0.007],
    [0.015, -0.0659, 0.0036, 0.0075, -0.0685, 0.0107],
    [0.015, -0.0659, 0.0036, 0.0075, -0.0634, -0.0034],
    [0.0075, -0.0685, 0.0107, 0.0, -0.071, 0.0177],
    [0.0075, -0.0685, 0.0107, 0.0, -0.0659, 0.0036],
    [0.0, -0.071, 0.0177, -0.0075, -0.0685, 0.0107],
    [-0.015, -0.0858, -0.0036, -0.015, -0.0759, -0.0],
    [-0.015, -0.0858, -0.0036, -0.0075, -0.0833, -0.0107],
    [-0.015, -0.0858, -0.0036, -0.0075, -0.0884, 0.0034],
    [-0.0075, -0.0833, -0.0107, -0.0075, -0.0733, -0.007],
    [-0.0075, -0.0833, -0.0107, 0.0, -0.0807, -0.0177],
    [-0.0075, -0.0833, -0.0107, 0.0, -0.0858, -0.0036],
    [0.0, -0.0807, -0.0177, 0.0, -0.0708, -0.0141],
    [0.0, -0.0807, -0.0177, 0.0075, -0.0833, -0.0107],
    [-0.015, -0.0759, -0.0, -0.0075, -0.0733, -0.007],
    [-0.015, -0.0759, -0.0, -0.015, -0.0659, 0.0036],
    [-0.015, -0.0759, -0.0, -0.0075, -0.0784, 0.007],
    [-0.0075, -0.0733, -0.007, 0.0, -0.0708, -0.0141],
    [-0.0075, -0.0733, -0.007, -0.0075, -0.0634, -0.0034],
    [0.0, -0.0708, -0.0141, 0.0, -0.0608, -0.0105],
    [0.0, -0.0708, -0.0141, 0.0075, -0.0733, -0.007],
    [-0.015, -0.0659, 0.0036, -0.0075, -0.0634, -0.0034],
    [-0.015, -0.0659, 0.0036, -0.0075, -0.0685, 0.0107],
    [-0.0075, -0.0634, -0.0034, 0.0, -0.0608, -0.0105],
    [-0.0075, -0.0634, -0.0034, 0.0, -0.0659, 0.0036],
    [0.0, -0.0608, -0.0105, 0.0075, -0.0634, -0.0034],
    [-0.0075, -0.0685, 0.0107, 0.0, -0.0659, 0.0036],
    [-0.0075, -0.0685, 0.0107, -0.0075, -0.0784, 0.007],
    [0.0, -0.0659, 0.0036, 0.0075, -0.0634, -0.0034],
    [0.0075, -0.0634, -0.0034, 0.0075, -0.0733, -0.007],
    [0.0075, -0.0833, -0.0107, 0.0, -0.0858, -0.0036],
    [0.0075, -0.0833, -0.0107, 0.0075, -0.0733, -0.007],
    [0.0, -0.0858, -0.0036, -0.0075, -0.0884, 0.0034],
    [-0.0075, -0.0884, 0.0034, -0.0075, -0.0784, 0.007],
    [0.0807, -0.0479, -0.0036, 0.0807, -0.0379, -0.0],
    [0.0807, -0.0479, -0.0036, 0.0732, -0.0505, 0.0034],
    [0.0807, -0.0479, -0.0036, 0.0732, -0.0453, -0.0107],
    [0.0732, -0.0505, 0.0034, 0.0732, -0.0405, 0.007],
    [0.0732, -0.0505, 0.0034, 0.0657, -0.053, 0.0105],
    [0.0732, -0.0505, 0.0034, 0.0657, -0.0479, -0.0036],
    [0.0657, -0.053, 0.0105, 0.0657, -0.0431, 0.0141],
    [0.0657, -0.053, 0.0105, 0.0582, -0.0505, 0.0034],
    [0.0807, -0.0379, -0.0, 0.0732, -0.0405, 0.007],
    [0.0807, -0.0379, -0.0, 0.0807, -0.028, 0.0036],
    [0.0807, -0.0379, -0.0, 0.0732, -0.0354, -0.007],
    [0.0732, -0.0405, 0.007, 0.0657, -0.0431, 0.0141],
    [0.0732, -0.0405, 0.007, 0.0732, -0.0305, 0.0107],
    [0.0657, -0.0431, 0.0141, 0.0657, -0.0331, 0.0177],
    [0.0657, -0.0431, 0.0141, 0.0582, -0.0405, 0.007],
    [0.0807, -0.028, 0.0036, 0.0732, -0.0305, 0.0107],
    [0.0807, -0.028, 0.0036, 0.0732, -0.0254, -0.0034],
    [0.0732, -0.0305, 0.0107, 0.0657, -0.0331, 0.0177],
    [0.0732, -0.0305, 0.0107, 0.0657, -0.028, 0.0036],
    [0.0657, -0.0331, 0.0177, 0.0582, -0.0305, 0.0107],
    [0.0507, -0.0479, -0.0036, 0.0507, -0.0379, -0.0],
    [0.0507, -0.0479, -0.0036, 0.0582, -0.0453, -0.0107],
    [0.0507, -0.0479, -0.0036, 0.0582, -0.0505, 0.0034],
    [0.0582, -0.0453, -0.0107, 0.0582, -0.0354, -0.007],
    [0.0582, -0.0453, -0.0107, 0.0657, -0.0428, -0.0177],
    [0.0582, -0.0453, -0.0107, 0.0657, -0.0479, -0.0036],
    [0.0657, -0.0428, -0.0177, 0.0657, -0.0328, -0.0141],
    [0.0657, -0.0428, -0.0177, 0.0732, -0.0453, -0.0107],
    [0.0507, -0.0379, -0.0, 0.0582, -0.0354, -0.007],
    [0.0507, -0.0379, -0.0, 0.0507, -0.028, 0.0036],
    [0.0507, -0.0379, -0.0, 0.0582, -0.0405, 0.007],
    [0.0582, -0.0354, -0.007, 0.0657, -0.0328, -0.0141],
    [0.0582, -0.0354, -0.007, 0.0582, -0.0254, -0.0034],
    [0.0657, -0.0328, -0.0141, 0.0657, -0.0229, -0.0105],
    [0.0657, -0.0328, -0.0141, 0.0732, -0.0354, -0.007],
    [0.0507, -0.028, 0.0036, 0.0582, -0.0254, -0.0034],
    [0.0507, -0.028, 0.0036, 0.0582, -0.0305, 0.0107],
    [0.0582, -0.0254, -0.0034, 0.0657, -0.0229, -0.0105],
    [0.0582, -0.0254, -0.0034, 0.0657, -0.028, 0.0036],
    [0.0657, -0.0229, -0.0105, 0.0732, -0.0254, -0.0034],
    [0.0582, -0.0305, 0.0107, 0.0657, -0.028, 0.0036],
    [0.0582, -0.0305, 0.0107, 0.0582, -0.0405, 0.007],
    [0.0657, -0.028, 0.0036, 0.0732, -0.0254, -0.0034],
    [0.0732, -0.0254, -0.0034, 0.0732, -0.0354, -0.007],
    [0.0732, -0.0453, -0.0107, 0.0657, -0.0479, -0.0036],
    [0.0732, -0.0453, -0.0107, 0.0732, -0.0354, -0.007],
    [0.0657, -0.0479, -0.0036, 0.0582, -0.0505, 0.0034],
    [0.0582, -0.0505, 0.0034, 0.0582, -0.0405, 0.007],
    [0.0807, 0.028, -0.0036, 0.0807, 0.0379, 0.0],
    [0.0807, 0.028, -0.0036, 0.0732, 0.0254, 0.0034],
    [0.0807, 0.028, -0.0036, 0.0732, 0.0305, -0.0107],
    [0.0732, 0.0254, 0.0034, 0.0732, 0.0354, 0.007],
    [0.0732, 0.0254, 0.0034, 0.0657, 0.0229, 0.0105],
    [0.0732, 0.0254, 0.0034, 0.0657, 0.028, -0.0036],
    [0.0657, 0.0229, 0.0105, 0.0657, 0.0328, 0.0141],
    [0.0657, 0.0229, 0.0105, 0.0582, 0.0254, 0.0034],
    [0.0807, 0.0379, 0.0, 0.0732, 0.0354, 0.007],
    [0.0807, 0.0379, 0.0, 0.0807, 0.0479, 0.0036],
    [0.0807, 0.0379, 0.0, 0.0732, 0.0405, -0.007],
    [0.0732, 0.0354, 0.007, 0.0657, 0.0328, 0.0141],
    [0.0732, 0.0354, 0.007, 0.0732, 0.0453, 0.0107],
    [0.0657, 0.0328, 0.0141, 0.0657, 0.0428, 0.0177],
    [0.0657, 0.0328, 0.0141, 0.0582, 0.0354, 0.007],
    [0.0807, 0.0479, 0.0036, 0.0732, 0.0453, 0.0107],
    [0.0807, 0.0479, 0.0036, 0.0732, 0.0505, -0.0034],
    [0.0732, 0.0453, 0.0107, 0.0657, 0.0428, 0.0177],
    [0.0732, 0.0453, 0.0107, 0.0657, 0.0479, 0.0036],
    [0.0657, 0.0428, 0.0177, 0.0582, 0.0453, 0.0107],
    [0.0507, 0.028, -0.0036, 0.0507, 0.0379, 0.0],
    [0.0507, 0.028, -0.0036, 0.0582, 0.0305, -0.0107],
    [0.0507, 0.028, -0.0036, 0.0582, 0.0254, 0.0034],
    [0.0582, 0.0305, -0.0107, 0.0582, 0.0405, -0.007],
    [0.0582, 0.0305, -0.0107, 0.0657, 0.0331, -0.0177],
    [0.0582, 0.0305, -0.0107, 0.0657, 0.028, -0.0036],
    [0.0657, 0.0331, -0.0177, 0.0657, 0.0431, -0.0141],
    [0.0657, 0.0331, -0.0177, 0.0732, 0.0305, -0.0107],
    [0.0507, 0.0379, 0.0, 0.0582, 0.0405, -0.007],
    [0.0507, 0.0379, 0.0, 0.0507, 0.0479, 0.0036],
    [0.0507, 0.0379, 0.0, 0.0582, 0.0354, 0.007],
    [0.0582, 0.0405, -0.007, 0.0657, 0.0431, -0.0141],
    [0.0582, 0.0405, -0.007, 0.0582, 0.0505, -0.0034],
    [0.0657, 0.0431, -0.0141, 0.0657, 0.053, -0.0105],
    [0.0657, 0.0431, -0.0141, 0.0732, 0.0405, -0.007],
    [0.0507, 0.0479, 0.0036, 0.0582, 0.0505, -0.0034],
    [0.0507, 0.0479, 0.0036, 0.0582, 0.0453, 0.0107],
    [0.0582, 0.0505, -0.0034, 0.0657, 0.053, -0.0105],
    [0.0582, 0.0505, -0.0034, 0.0657, 0.0479, 0.0036],
    [0.0657, 0.053, -0.0105, 0.0732, 0.0505, -0.0034],
    [0.0582, 0.0453, 0.0107, 0.0657, 0.0479, 0.0036],
    [0.0582, 0.0453, 0.0107, 0.0582, 0.0354, 0.007],
    [0.0657, 0.0479, 0.0036, 0.0732, 0.0505, -0.0034],
    [0.0732, 0.0505, -0.0034, 0.0732, 0.0405, -0.007],
    [0.0732, 0.0305, -0.0107, 0.0657, 0.028, -0.0036],
    [0.0732, 0.0305, -0.0107, 0.0732, 0.0405, -0.007],
    [0.0657, 0.028, -0.0036, 0.0582, 0.0254, 0.0034],
    [0.0582, 0.0254, 0.0034, 0.0582, 0.0354, 0.007],
    [0.015, -0.01, -0.0036, 0.015, 0.0, 0.0],
    [0.015, -0.01, -0.0036, 0.0075, -0.0125, 0.0034],
    [0.015, -0.01, -0.0036, 0.0075, -0.0074, -0.0107],
    [0.0075, -0.0125, 0.0034, 0.0075, -0.0026, 0.007],
    [0.0075, -0.0125, 0.0034, 0.0, -0.0151, 0.0105],
    [0.0075, -0.0125, 0.0034, 0.0, -0.01, -0.0036],
    [0.0, -0.0151, 0.0105, 0.0, -0.0051, 0.0141],
    [0.0, -0.0151, 0.0105, -0.0075, -0.0125, 0.0034],
    [0.015, 0.0, 0.0, 0.0075, -0.0026, 0.007],
    [0.015, 0.0, 0.0, 0.015, 0.01, 0.0036],
    [0.015, 0.0, 0.0, 0.0075, 0.0026, -0.007],
    [0.0075, -0.0026, 0.007, 0.0, -0.0051, 0.0141],
    [0.0075, -0.0026, 0.007, 0.0075, 0.0074, 0.0107],
    [0.0, -0.0051, 0.0141, 0.0, 0.0048, 0.0177],
    [0.0, -0.0051, 0.0141, -0.0075, -0.0026, 0.007],
    [0.015, 0.01, 0.0036, 0.0075, 0.0074, 0.0107],
    [0.015, 0.01, 0.0036, 0.0075, 0.0125, -0.0034],
    [0.0075, 0.0074, 0.0107, 0.0, 0.0048, 0.0177],
    [0.0075, 0.0074, 0.0107, 0.0, 0.01, 0.0036],
    [0.0, 0.0048, 0.0177, -0.0075, 0.0074, 0.0107],
    [-0.015, -0.01, -0.0036, -0.015, 0.0, 0.0],
    [-0.015, -0.01, -0.0036, -0.0075, -0.0074, -0.0107],
    [-0.015, -0.01, -0.0036, -0.0075, -0.0125, 0.0034],
    [-0.0075, -0.0074, -0.0107, -0.0075, 0.0026, -0.007],
    [-0.0075, -0.0074, -0.0107, 0.0, -0.0048, -0.0177],
    [-0.0075, -0.0074, -0.0107, 0.0, -0.01, -0.0036],
    [0.0, -0.0048, -0.0177, 0.0, 0.0051, -0.0141],
    [0.0, -0.0048, -0.0177, 0.0075, -0.0074, -0.0107],
    [-0.015, 0.0, 0.0, -0.0075, 0.0026, -0.007],
    [-0.015, 0.0, 0.0, -0.015, 0.01, 0.0036],
    [-0.015, 0.0, 0.0, -0.0075, -0.0026, 0.007],
    [-0.0075, 0.0026, -0.007, 0.0, 0.0051, -0.0141],
    [-0.0075, 0.0026, -0.007, -0.0075, 0.0125, -0.0034],
    [0.0, 0.0051, -0.0141, 0.0, 0.0151, -0.0105],
    [0.0, 0.0051, -0.0141, 0.0075, 0.0026, -0.007],
    [-0.015, 0.01, 0.0036, -0.0075, 0.0125, -0.0034],
    [-0.015, 0.01, 0.0036, -0.0075, 0.0074, 0.0107],
    [-0.0075, 0.0125, -0.0034, 0.0, 0.0151, -0.0105],
    [-0.0075, 0.0125, -0.0034, 0.0, 0.01, 0.0036],
    [0.0, 0.0151, -0.0105, 0.0075, 0.0125, -0.0034],
    [-0.0075, 0.0074, 0.0107, 0.0, 0.01, 0.0036],
    [-0.0075, 0.0074, 0.0107, -0.0075, -0.0026, 0.007],
    [0.0, 0.01, 0.0036, 0.0075, 0.0125, -0.0034],
    [0.0075, 0.0125, -0.0034, 0.0075, 0.0026, -0.007],
    [0.0075, -0.0074, -0.0107, 0.0, -0.01, -0.0036],
    [0.0075, -0.0074, -0.0107, 0.0075, 0.0026, -0.007],
    [0.0, -0.01, -0.0036, -0.0075, -0.0125, 0.0034],
    [-0.0075, -0.0125, 0.0034, -0.0075, -0.0026, 0.007],
];
export const circlesPaths: number[][] = [
    [
        -0.0, 0.0101, -0.0141, -0.0015, 0.0151, -0.0122, -0.0031, 0.0201,
        -0.0104, -0.0048, 0.025, -0.0084, -0.0068, 0.0298, -0.0063, -0.009,
        0.0343, -0.004, -0.0116, 0.0386, -0.0015, -0.0144, 0.0426, 0.0011,
        -0.0176, 0.0463, 0.0039, -0.021, 0.0496, 0.0068, -0.0247, 0.0524,
        0.0099, -0.0286, 0.0548, 0.013, -0.0328, 0.0566, 0.0162, -0.0371,
        0.0577, 0.0195, -0.0416, 0.0582, 0.0227, -0.0462, 0.0579, 0.0259,
        -0.0507, 0.0569, 0.0289, -0.0551, 0.0551, 0.0318, -0.0594, 0.0526,
        0.0344, -0.0633, 0.0495, 0.0367, -0.067, 0.0458, 0.0387, -0.0703,
        0.0416, 0.0403, -0.0731, 0.037, 0.0417, -0.0756, 0.0322, 0.0427,
        -0.0778, 0.0271, 0.0434, -0.0795, 0.0218, 0.0438, -0.0808, 0.0164,
        0.0439, -0.0819, 0.0109, 0.0437, -0.0825, 0.0054, 0.0434, -0.0828,
        -0.0001, 0.0427, -0.0828, -0.0056, 0.0419, -0.0825, -0.0111, 0.0408,
        -0.0819, -0.0164, 0.0395, -0.081, -0.0217, 0.0381, -0.0797, -0.0269,
        0.0364, -0.0782, -0.0319, 0.0345, -0.0764, -0.0368, 0.0325, -0.0742,
        -0.0414, 0.0303, -0.0718, -0.0458, 0.0279, -0.0691, -0.05, 0.0253,
        -0.0661, -0.0538, 0.0226, -0.0628, -0.0573, 0.0198, -0.0593, -0.0603,
        0.0168, -0.0555, -0.0629, 0.0137, -0.0514, -0.065, 0.0105, -0.0471,
        -0.0665, 0.0073, -0.0427, -0.0673, 0.004, -0.0382, -0.0674, 0.0008,
        -0.0336, -0.0667, -0.0023, -0.0291, -0.0653, -0.0052, -0.0248,
        -0.0632, -0.008, -0.0207, -0.0603, -0.0104, -0.0169, -0.0569, -0.0126,
        -0.0134, -0.0529, -0.0144, -0.0103, -0.0485, -0.0159, -0.0077,
        -0.0438, -0.017, -0.0054, -0.0388, -0.0179, -0.0034, -0.0336, -0.0184,
        -0.0019, -0.0283, -0.0187, -0.0007, -0.0228, -0.0187, 0.0001, -0.0173,
        -0.0184, 0.0006, -0.0118, -0.0179, 0.0007, -0.0063, -0.0172, 0.0006,
        -0.0008, -0.0162, 0.0004, 0.0046, -0.0152, 0.0, 0.0101, -0.0141,
    ],
    [
        0.0, 0.0101, -0.0141, 0.0002, 0.0048, -0.0157, 0.0004, -0.0006,
        -0.0173, 0.0003, -0.0059, -0.019, -0.0001, -0.0112, -0.0207, -0.0008,
        -0.0164, -0.0224, -0.002, -0.0215, -0.0242, -0.0036, -0.0265, -0.0261,
        -0.0056, -0.0314, -0.0279, -0.0081, -0.036, -0.0298, -0.0111, -0.0403,
        -0.0317, -0.0144, -0.0443, -0.0335, -0.0183, -0.0479, -0.0353,
        -0.0226, -0.0511, -0.037, -0.0272, -0.0536, -0.0386, -0.0322, -0.0555,
        -0.04, -0.0375, -0.0567, -0.0413, -0.0429, -0.0572, -0.0424, -0.0484,
        -0.0569, -0.0433, -0.0538, -0.0559, -0.0439, -0.0591, -0.0542,
        -0.0443, -0.0642, -0.0519, -0.0445, -0.069, -0.0491, -0.0444, -0.0735,
        -0.0458, -0.0442, -0.0776, -0.0421, -0.0438, -0.0814, -0.0381,
        -0.0432, -0.0849, -0.0338, -0.0425, -0.088, -0.0293, -0.0416, -0.0907,
        -0.0245, -0.0406, -0.0931, -0.0196, -0.0395, -0.0951, -0.0146,
        -0.0383, -0.0968, -0.0094, -0.037, -0.0981, -0.0042, -0.0356, -0.099,
        0.0011, -0.0341, -0.0996, 0.0064, -0.0325, -0.0998, 0.0118, -0.0309,
        -0.0996, 0.0171, -0.0292, -0.099, 0.0223, -0.0275, -0.098, 0.0275,
        -0.0257, -0.0966, 0.0326, -0.0239, -0.0948, 0.0375, -0.0221, -0.0925,
        0.0422, -0.0202, -0.0898, 0.0467, -0.0183, -0.0867, 0.0509, -0.0165,
        -0.083, 0.0547, -0.0147, -0.079, 0.0581, -0.0129, -0.0745, 0.0609,
        -0.0113, -0.0696, 0.0631, -0.0097, -0.0645, 0.0647, -0.0083, -0.0591,
        0.0655, -0.0072, -0.0536, 0.0656, -0.0062, -0.0482, 0.0649, -0.0054,
        -0.0428, 0.0635, -0.0049, -0.0376, 0.0615, -0.0047, -0.0327, 0.059,
        -0.0046, -0.0281, 0.0559, -0.0047, -0.0238, 0.0524, -0.0051, -0.0198,
        0.0485, -0.0056, -0.0162, 0.0444, -0.0062, -0.0129, 0.0399, -0.0071,
        -0.01, 0.0353, -0.008, -0.0074, 0.0305, -0.0091, -0.0052, 0.0255,
        -0.0102, -0.0033, 0.0204, -0.0115, -0.0016, 0.0153, -0.0128, -0.0,
        0.0101, -0.0141,
    ],
    [
        -0.0, 0.0101, -0.0141, -0.0013, 0.0154, -0.0132, -0.0027, 0.0208,
        -0.0124, -0.0042, 0.0261, -0.0117, -0.0059, 0.0314, -0.0114, -0.0077,
        0.0366, -0.0114, -0.0098, 0.0418, -0.0117, -0.0121, 0.0468, -0.0124,
        -0.0145, 0.0517, -0.0135, -0.0172, 0.0563, -0.015, -0.02, 0.0607,
        -0.0169, -0.023, 0.0648, -0.0193, -0.0261, 0.0685, -0.0221, -0.0293,
        0.0716, -0.0253, -0.0326, 0.0742, -0.029, -0.036, 0.0762, -0.033,
        -0.0392, 0.0774, -0.0373, -0.0424, 0.078, -0.0418, -0.0453, 0.0777,
        -0.0465, -0.0481, 0.0768, -0.0513, -0.0505, 0.0752, -0.056, -0.0527,
        0.0729, -0.0606, -0.0546, 0.0701, -0.065, -0.0562, 0.0669, -0.0693,
        -0.0575, 0.0633, -0.0733, -0.0585, 0.0593, -0.077, -0.0592, 0.055,
        -0.0805, -0.0597, 0.0505, -0.0837, -0.0599, 0.0458, -0.0867, -0.0599,
        0.0409, -0.0893, -0.0596, 0.0358, -0.0917, -0.0591, 0.0307, -0.0938,
        -0.0584, 0.0255, -0.0955, -0.0575, 0.0202, -0.097, -0.0563, 0.0149,
        -0.0982, -0.055, 0.0095, -0.099, -0.0534, 0.0042, -0.0996, -0.0516,
        -0.0011, -0.0998, -0.0497, -0.0063, -0.0996, -0.0475, -0.0114,
        -0.0991, -0.0451, -0.0163, -0.0982, -0.0426, -0.0211, -0.0968,
        -0.0398, -0.0256, -0.0951, -0.0369, -0.0298, -0.093, -0.0339, -0.0337,
        -0.0904, -0.0307, -0.0371, -0.0874, -0.0274, -0.04, -0.0839, -0.0241,
        -0.0423, -0.0801, -0.0208, -0.0439, -0.0759, -0.0176, -0.0448,
        -0.0715, -0.0145, -0.0449, -0.0668, -0.0117, -0.0443, -0.0621,
        -0.0091, -0.043, -0.0574, -0.0068, -0.041, -0.0527, -0.0047, -0.0385,
        -0.0482, -0.003, -0.0355, -0.0439, -0.0016, -0.032, -0.0397, -0.0004,
        -0.0282, -0.0359, 0.0005, -0.0241, -0.0322, 0.0011, -0.0197, -0.0289,
        0.0014, -0.015, -0.0258, 0.0015, -0.0102, -0.023, 0.0013, -0.0053,
        -0.0205, 0.001, -0.0002, -0.0182, 0.0005, 0.0049, -0.0161, 0.0,
        0.0101, -0.0141,
    ],
    [
        0.0, 0.0101, -0.0141, 0.001, 0.0051, -0.0162, 0.0021, 0.0001, -0.0184,
        0.0032, -0.0048, -0.0208, 0.0043, -0.0096, -0.0235, 0.0055, -0.0141,
        -0.0265, 0.0067, -0.0184, -0.0299, 0.0079, -0.0224, -0.0336, 0.0092,
        -0.026, -0.0376, 0.0105, -0.0293, -0.0419, 0.0118, -0.0321, -0.0465,
        0.0131, -0.0345, -0.0514, 0.0144, -0.0362, -0.0565, 0.0156, -0.0374,
        -0.0618, 0.0168, -0.0378, -0.0672, 0.0179, -0.0375, -0.0726, 0.0189,
        -0.0365, -0.078, 0.0198, -0.0347, -0.0832, 0.0206, -0.0322, -0.0881,
        0.0211, -0.029, -0.0926, 0.0216, -0.0253, -0.0967, 0.0218, -0.0211,
        -0.1003, 0.022, -0.0165, -0.1035, 0.0219, -0.0116, -0.1062, 0.0218,
        -0.0065, -0.1083, 0.0215, -0.0012, -0.1101, 0.0212, 0.0042, -0.1113,
        0.0207, 0.0097, -0.1121, 0.0201, 0.0152, -0.1126, 0.0195, 0.0207,
        -0.1126, 0.0187, 0.0262, -0.1122, 0.0179, 0.0317, -0.1115, 0.0171,
        0.0371, -0.1103, 0.0161, 0.0424, -0.1089, 0.0151, 0.0475, -0.107,
        0.0141, 0.0526, -0.1048, 0.013, 0.0574, -0.1023, 0.0118, 0.062,
        -0.0995, 0.0107, 0.0664, -0.0963, 0.0094, 0.0706, -0.0928, 0.0082,
        0.0744, -0.0889, 0.0069, 0.0779, -0.0848, 0.0056, 0.0809, -0.0803,
        0.0043, 0.0835, -0.0755, 0.003, 0.0855, -0.0705, 0.0017, 0.087,
        -0.0653, 0.0005, 0.0878, -0.06, -0.0007, 0.0879, -0.0545, -0.0017,
        0.0872, -0.0491, -0.0027, 0.0857, -0.0438, -0.0035, 0.0835, -0.0388,
        -0.0041, 0.0807, -0.0341, -0.0046, 0.0772, -0.0297, -0.005, 0.0732,
        -0.0259, -0.0052, 0.0688, -0.0225, -0.0052, 0.0641, -0.0196, -0.0051,
        0.0591, -0.0172, -0.0049, 0.0539, -0.0152, -0.0046, 0.0485, -0.0137,
        -0.0042, 0.0431, -0.0127, -0.0037, 0.0376, -0.0121, -0.003, 0.032,
        -0.0119, -0.0024, 0.0265, -0.0121, -0.0016, 0.021, -0.0126, -0.0008,
        0.0155, -0.0133, -0.0, 0.0101, -0.0141,
    ],
    [
        0.0, 0.0101, -0.0141, -0.0004, 0.0155, -0.013, -0.0006, 0.021,
        -0.0119, -0.0007, 0.0265, -0.011, -0.0006, 0.032, -0.0103, -0.0001,
        0.0375, -0.0098, 0.0007, 0.043, -0.0095, 0.0019, 0.0485, -0.0095,
        0.0034, 0.0538, -0.0097, 0.0054, 0.059, -0.0103, 0.0077, 0.064,
        -0.0111, 0.0103, 0.0687, -0.0123, 0.0134, 0.0731, -0.0138, 0.0169,
        0.0771, -0.0156, 0.0207, 0.0805, -0.0177, 0.0248, 0.0833, -0.0202,
        0.0291, 0.0855, -0.0229, 0.0336, 0.0869, -0.0259, 0.0382, 0.0876,
        -0.029, 0.0427, 0.0875, -0.0322, 0.0471, 0.0867, -0.0354, 0.0514,
        0.0852, -0.0387, 0.0555, 0.0831, -0.0419, 0.0593, 0.0805, -0.045,
        0.0628, 0.0775, -0.0479, 0.0661, 0.074, -0.0508, 0.0691, 0.0701,
        -0.0535, 0.0718, 0.066, -0.056, 0.0742, 0.0616, -0.0584, 0.0764,
        0.0569, -0.0606, 0.0782, 0.0521, -0.0627, 0.0797, 0.0471, -0.0645,
        0.081, 0.0419, -0.0662, 0.0819, 0.0366, -0.0677, 0.0825, 0.0312,
        -0.069, 0.0828, 0.0258, -0.07, 0.0828, 0.0203, -0.0709, 0.0825,
        0.0148, -0.0715, 0.0819, 0.0093, -0.0719, 0.0808, 0.0038, -0.0721,
        0.0795, -0.0016, -0.0719, 0.0778, -0.0069, -0.0715, 0.0756, -0.012,
        -0.0708, 0.0731, -0.0169, -0.0698, 0.0703, -0.0214, -0.0685, 0.067,
        -0.0256, -0.0668, 0.0633, -0.0293, -0.0648, 0.0594, -0.0324, -0.0625,
        0.0551, -0.0349, -0.0599, 0.0507, -0.0367, -0.0571, 0.0462, -0.0377,
        -0.054, 0.0416, -0.038, -0.0509, 0.0371, -0.0375, -0.0476, 0.0328,
        -0.0364, -0.0444, 0.0286, -0.0346, -0.0412, 0.0247, -0.0322, -0.038,
        0.021, -0.0294, -0.035, 0.0176, -0.0261, -0.0321, 0.0144, -0.0224,
        -0.0293, 0.0116, -0.0184, -0.0267, 0.009, -0.0141, -0.0242, 0.0068,
        -0.0096, -0.0219, 0.0048, -0.0049, -0.0198, 0.0031, 0.0001, -0.0178,
        0.0015, 0.005, -0.0159, 0.0, 0.0101, -0.0141,
    ],
    [
        0.0, 0.0101, -0.0141, 0.0016, 0.0049, -0.0154, 0.0033, -0.0002,
        -0.0167, 0.0052, -0.0053, -0.0179, 0.0074, -0.0103, -0.0191, 0.01,
        -0.0151, -0.0202, 0.0129, -0.0198, -0.0211, 0.0162, -0.0242, -0.0219,
        0.0198, -0.0284, -0.0226, 0.0238, -0.0322, -0.0231, 0.0281, -0.0357,
        -0.0234, 0.0327, -0.0388, -0.0236, 0.0376, -0.0414, -0.0235, 0.0428,
        -0.0434, -0.0232, 0.0482, -0.0447, -0.0227, 0.0536, -0.0454, -0.022,
        0.0591, -0.0453, -0.021, 0.0645, -0.0445, -0.0198, 0.0696, -0.0429,
        -0.0184, 0.0745, -0.0407, -0.0169, 0.079, -0.0379, -0.0152, 0.083,
        -0.0345, -0.0135, 0.0867, -0.0307, -0.0117, 0.0898, -0.0265, -0.0098,
        0.0925, -0.022, -0.008, 0.0948, -0.0173, -0.0061, 0.0966, -0.0124,
        -0.0043, 0.098, -0.0073, -0.0024, 0.099, -0.0021, -0.0007, 0.0996,
        0.0031, 0.0011, 0.0998, 0.0084, 0.0027, 0.0996, 0.0138, 0.0044, 0.099,
        0.0191, 0.0059, 0.0981, 0.0244, 0.0074, 0.0968, 0.0296, 0.0088,
        0.0951, 0.0347, 0.0101, 0.0931, 0.0398, 0.0113, 0.0907, 0.0447,
        0.0124, 0.088, 0.0494, 0.0134, 0.0849, 0.054, 0.0143, 0.0814, 0.0583,
        0.015, 0.0776, 0.0623, 0.0156, 0.0735, 0.066, 0.016, 0.069, 0.0693,
        0.0163, 0.0642, 0.0721, 0.0163, 0.0591, 0.0744, 0.0161, 0.0538,
        0.0761, 0.0157, 0.0484, 0.0771, 0.0151, 0.0429, 0.0774, 0.0143,
        0.0375, 0.0769, 0.0132, 0.0322, 0.0757, 0.0119, 0.0272, 0.0738,
        0.0104, 0.0226, 0.0713, 0.0088, 0.0183, 0.0681, 0.0071, 0.0144,
        0.0645, 0.0053, 0.0111, 0.0605, 0.0035, 0.0081, 0.0562, 0.0016,
        0.0056, 0.0515, -0.0002, 0.0036, 0.0467, -0.0021, 0.002, 0.0417,
        -0.0039, 0.0008, 0.0366, -0.0057, 0.0001, 0.0313, -0.0075, -0.0003,
        0.0261, -0.0092, -0.0004, 0.0207, -0.0108, -0.0002, 0.0154, -0.0125,
        0.0, 0.0101, -0.0141,
    ],
    [
        0.0, 0.0101, -0.0141, -0.0005, 0.0152, -0.012, -0.001, 0.0204,
        -0.0099, -0.0013, 0.0255, -0.0077, -0.0015, 0.0304, -0.0051, -0.0014,
        0.0352, -0.0023, -0.0011, 0.0399, 0.0007, -0.0005, 0.0443, 0.0041,
        0.0004, 0.0484, 0.0077, 0.0016, 0.0522, 0.0116, 0.003, 0.0557, 0.0157,
        0.0047, 0.0587, 0.02, 0.0068, 0.0612, 0.0245, 0.0091, 0.0632, 0.0292,
        0.0117, 0.0645, 0.0339, 0.0145, 0.0651, 0.0387, 0.0176, 0.065, 0.0433,
        0.0208, 0.0641, 0.0478, 0.0241, 0.0625, 0.0519, 0.0274, 0.0602,
        0.0558, 0.0307, 0.0573, 0.0592, 0.0339, 0.0539, 0.0622, 0.0369, 0.05,
        0.0648, 0.0398, 0.0458, 0.067, 0.0426, 0.0413, 0.0687, 0.0451, 0.0365,
        0.07, 0.0475, 0.0315, 0.0709, 0.0497, 0.0264, 0.0714, 0.0516, 0.0212,
        0.0716, 0.0534, 0.016, 0.0714, 0.055, 0.0106, 0.0709, 0.0563, 0.0053,
        0.07, 0.0575, -0.0, 0.0689, 0.0584, -0.0053, 0.0674, 0.0591, -0.0105,
        0.0656, 0.0596, -0.0157, 0.0635, 0.0599, -0.0207, 0.0611, 0.0599,
        -0.0256, 0.0585, 0.0597, -0.0303, 0.0556, 0.0592, -0.0348, 0.0523,
        0.0585, -0.0391, 0.0488, 0.0575, -0.0431, 0.0451, 0.0562, -0.0467,
        0.0411, 0.0546, -0.05, 0.0369, 0.0527, -0.0527, 0.0324, 0.0505,
        -0.055, 0.0278, 0.0481, -0.0566, 0.0231, 0.0453, -0.0575, 0.0184,
        0.0424, -0.0578, 0.0137, 0.0392, -0.0573, 0.0091, 0.036, -0.056,
        0.0048, 0.0326, -0.054, 0.0008, 0.0293, -0.0514, -0.0028, 0.0261,
        -0.0483, -0.0061, 0.023, -0.0446, -0.0089, 0.02, -0.0406, -0.0112,
        0.0172, -0.0362, -0.0131, 0.0145, -0.0315, -0.0147, 0.0121, -0.0266,
        -0.0157, 0.0098, -0.0216, -0.0165, 0.0077, -0.0164, -0.0168, 0.0059,
        -0.0112, -0.0168, 0.0042, -0.0059, -0.0164, 0.0027, -0.0006, -0.0158,
        0.0013, 0.0048, -0.015, 0.0, 0.0101, -0.0141,
    ],
    [
        0.0, 0.0101, -0.0141, 0.0008, 0.0046, -0.0149, 0.0016, -0.0008,
        -0.0156, 0.0024, -0.0063, -0.0161, 0.003, -0.0118, -0.0163, 0.0037,
        -0.0174, -0.0161, 0.0042, -0.0229, -0.0155, 0.0046, -0.0283, -0.0144,
        0.0049, -0.0337, -0.0129, 0.0051, -0.0389, -0.011, 0.0052, -0.0439,
        -0.0086, 0.0052, -0.0487, -0.0057, 0.005, -0.0531, -0.0023, 0.0046,
        -0.057, 0.0016, 0.0041, -0.0605, 0.0059, 0.0035, -0.0634, 0.0106,
        0.0027, -0.0655, 0.0157, 0.0017, -0.067, 0.0209, 0.0007, -0.0677,
        0.0264, -0.0005, -0.0676, 0.0318, -0.0017, -0.0668, 0.0372, -0.003,
        -0.0654, 0.0424, -0.0043, -0.0633, 0.0474, -0.0056, -0.0607, 0.0521,
        -0.0069, -0.0577, 0.0566, -0.0082, -0.0542, 0.0608, -0.0094, -0.0504,
        0.0646, -0.0107, -0.0463, 0.0681, -0.0118, -0.0419, 0.0713, -0.013,
        -0.0372, 0.0742, -0.0141, -0.0324, 0.0767, -0.0151, -0.0274, 0.0789,
        -0.0161, -0.0222, 0.0807, -0.0171, -0.0169, 0.0822, -0.0179, -0.0115,
        0.0833, -0.0187, -0.0061, 0.084, -0.0195, -0.0006, 0.0844, -0.0201,
        0.005, 0.0844, -0.0207, 0.0105, 0.084, -0.0212, 0.016, 0.0832,
        -0.0215, 0.0214, 0.0819, -0.0218, 0.0267, 0.0802, -0.0219, 0.0318,
        0.078, -0.022, 0.0367, 0.0753, -0.0218, 0.0413, 0.0722, -0.0216,
        0.0455, 0.0685, -0.0211, 0.0492, 0.0644, -0.0206, 0.0523, 0.0599,
        -0.0198, 0.0549, 0.055, -0.0189, 0.0567, 0.0498, -0.0179, 0.0577,
        0.0445, -0.0168, 0.058, 0.039, -0.0156, 0.0576, 0.0336, -0.0144,
        0.0564, 0.0283, -0.0131, 0.0547, 0.0232, -0.0118, 0.0523, 0.0183,
        -0.0105, 0.0495, 0.0137, -0.0092, 0.0462, 0.0094, -0.0079, 0.0426,
        0.0054, -0.0067, 0.0386, 0.0017, -0.0055, 0.0343, -0.0016, -0.0043,
        0.0298, -0.0046, -0.0032, 0.025, -0.0073, -0.0021, 0.0201, -0.0097,
        -0.001, 0.0151, -0.012, -0.0, 0.0101, -0.0141,
    ],
];
export const defaultPaths: number[][] = [];
