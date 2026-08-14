import { BoxGeometry, BufferGeometry, CapsuleGeometry, Color, ConeGeometry, CylinderGeometry, DodecahedronGeometry, Float32BufferAttribute, IcosahedronGeometry, LineBasicMaterial, Mesh, MeshStandardMaterial, OctahedronGeometry, PlaneGeometry, RingGeometry, Shape, ShapeGeometry, SphereGeometry, TetrahedronGeometry, TorusGeometry, ExtrudeGeometry, } from 'three';
import type { BaseMeshOptions, MeshGeometryConfig } from "../types/mesh";
import type { MaterialSettings } from "../types/materials";
export type CreatedMeshByTypeResult = {
    mesh: Mesh;
    config: MeshGeometryConfig;
};


const safeNumber = (value, fallback, min?) => {
    const num = typeof value === 'number' && !isNaN(value) ? value : fallback;
    return min !== undefined ? Math.max(num, min) : num;
};
function normalize(geo, radius) {
    geo.computeBoundingSphere();
    const scale = radius / (geo.boundingSphere?.radius || 1);
    geo.scale(scale, scale, scale);
    geo.computeVertexNormals();
    return geo;
}
export const createMesh = (config: BaseMeshOptions, materialSettings?: MaterialSettings): Mesh => {
    const material = new MeshStandardMaterial({
        color: materialSettings && typeof (materialSettings as any).color === 'string'
            ? (materialSettings as any).color : '#ffffff',
        opacity: materialSettings && 'opacity' in materialSettings
            ? materialSettings.opacity || 1 : 1,
    });
    const mesh = new Mesh();
    mesh.material = material;
    mesh.name = config.name || `${config.type}_${Date.now()}`;
    // mesh.scale.set(...config.scale);
    // mesh.position.set(...config.position);
    // mesh.rotation.set(...config.rotation);
    mesh.userData = { type: config.type, id: config.id, options: config };
    return mesh;
};
const createBox = (size, mesh) => {
    mesh.geometry = new BoxGeometry(...size);
    return mesh;
};
const createHeart = ({ curveSegments = 64 }, mesh) => {
    const s = new Shape();
    const x = 0;
    const y = 0;
    s.moveTo(x + 0.25, y + 0.25);
    s.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y);
    s.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35);
    s.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95);
    s.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35);
    s.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y);
    s.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
    const geo = new ExtrudeGeometry(s, {
        depth: 1,
        curveSegments,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 3,
    });
    geo.rotateZ(Math.PI); // orient point-down
    geo.center();
    mesh.geometry = normalize(geo, 1);
    return mesh;
};
const createSphere = (options, mesh) => {
    const { radius = 0.5, segments = 32, rings = segments } = options;
    mesh.geometry = new SphereGeometry(radius, segments, rings);
    return mesh;
};
const createPoint = (options, mesh) => {
    const { size = 0.1 } = options;
    mesh.geometry = new SphereGeometry(size, 16, 16);
    return mesh;
};
const createGrid = (options, mesh) => {
    const { size = 10, divisions = 10 } = options;
    const gridGeometry = new BufferGeometry();
    const vertices = [];
    const colors = [];
    const step = size / divisions;
    const halfSize = size / 2;
    for (let i = 0; i <= divisions; i++) {
        const pos = -halfSize + i * step;
        vertices.push(-halfSize, 0, pos, halfSize, 0, pos);
        vertices.push(pos, 0, -halfSize, pos, 0, halfSize);
        const gridColor = new Color('#ffffff');
        for (let j = 0; j < 4; j++)
            colors.push(gridColor.r, gridColor.g, gridColor.b);
    }
    gridGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    gridGeometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    mesh.geometry = gridGeometry;
    mesh.material = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, fog: false });
    return mesh;
};
const createCylinder = (options, mesh) => {
    const radiusTop = typeof options.radiusTop === 'number' && options.radiusTop > 0 ? options.radiusTop : 0.5;
    const radiusBottom = typeof options.radiusBottom === 'number' && options.radiusBottom > 0 ? options.radiusBottom : 0.5;
    const height = typeof options.height === 'number' && options.height > 0 ? options.height : 1;
    const radialSegments = typeof options.radialSegments === 'number' && options.radialSegments >= 3 ? options.radialSegments : 32;
    mesh.geometry = new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    return mesh;
};
const createTorus = (options, mesh) => {
    mesh.geometry = new TorusGeometry(safeNumber(options.radius, 0.5, 0.0001), safeNumber(options.tube, 0.2, 0.0001), safeNumber(options.radialSegments, 16, 3), safeNumber(options.tubularSegments, 100, 3));
    return mesh;
};
const createCone = (options, mesh) => {
    mesh.geometry = new ConeGeometry(safeNumber(options.radius, 0.5, 0.0001), safeNumber(options.height, 1, 0.0001), safeNumber(options.radialSegments, 32, 3));
    return mesh;
};
const createPlane = (options, mesh) => {
    const width = safeNumber(options.width ?? options.scale[0], 1, 0.0001);
    const height = safeNumber(options.height ?? options.scale[1], 1, 0.0001);
    mesh.geometry = new PlaneGeometry(width, height, safeNumber(options.widthSegments, 1, 1), safeNumber(options.heightSegments, 1, 1));
    return mesh;
};
const createText = (options, mesh) => {
    const text = typeof options.text === 'string' ? options.text : 'Hello';
    const size = safeNumber(options.size, 1, 0.0001);
    const height = safeNumber(options.height, 0.2, 0.0001);
    mesh.geometry = new BoxGeometry(text.length * size * 0.6, size, height);
    return mesh;
};
const createCustomMesh = (options, mesh) => {
    const { vertices = [], indices = [], normals, uvs } = options;
    const geometry = new BufferGeometry();
    if (vertices.length > 0)
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    if (indices && indices.length > 0)
        geometry.setIndex(indices);
    if (normals && normals.length === vertices.length) {
        geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    }
    else {
        geometry.computeVertexNormals();
    }
    if (uvs && uvs.length === (vertices.length / 3) * 2) {
        geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    }
    else if (vertices.length > 0) {
        const vertexCount = vertices.length / 3;
        const autoUvs = new Float32Array(vertexCount * 2);
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (let i = 0; i < vertexCount; i++) {
            const x = vertices[i * 3], z = vertices[i * 3 + 2];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
        }
        const rangeX = maxX - minX || 1, rangeZ = maxZ - minZ || 1;
        for (let i = 0; i < vertexCount; i++) {
            autoUvs[i * 2] = (vertices[i * 3] - minX) / rangeX;
            autoUvs[i * 2 + 1] = (vertices[i * 3 + 2] - minZ) / rangeZ;
        }
        geometry.setAttribute('uv', new Float32BufferAttribute(autoUvs, 2));
    }
    mesh.geometry = geometry;
    return mesh;
};
const createRing = (options, mesh) => {
    const { innerRadius = 0.3, outerRadius = 0.8, thetaSegments = 32, phiSegments = 8 } = options;
    mesh.geometry = new RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments);
    return mesh;
};
const createArcPlane = (options, mesh) => {
    const { radius = 1, startAngle = 0, endAngle = Math.PI, width = 0.2, segments = 32 } = options;
    const shape = new Shape();
    shape.absarc(0, 0, radius, startAngle, endAngle, false);
    shape.lineTo(Math.cos(endAngle) * (radius - width), Math.sin(endAngle) * (radius - width));
    shape.absarc(0, 0, radius - width, endAngle, startAngle, true);
    shape.closePath();
    mesh.geometry = new ShapeGeometry(shape, segments);
    return mesh;
};
const createBentPlane = (options, mesh) => {
    const { height = 1, radius = 2, arc = Math.PI / 2, widthSegments = 32, heightSegments = 1 } = options;
    const geometry = new BufferGeometry();
    const vertices = [], indices = [], uvs = [];
    const startAngle = -arc / 2, endAngle = arc / 2;
    for (let j = 0; j <= heightSegments; j++) {
        const v = j / heightSegments;
        const y = (v - 0.5) * height;
        for (let i = 0; i <= widthSegments; i++) {
            const u = i / widthSegments;
            const angle = startAngle + (endAngle - startAngle) * u;
            vertices.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius - radius);
            uvs.push(u, v);
        }
    }
    for (let j = 0; j < heightSegments; j++) {
        for (let i = 0; i < widthSegments; i++) {
            const a = i + (widthSegments + 1) * j;
            const b = i + (widthSegments + 1) * (j + 1);
            const c = (i + 1) + (widthSegments + 1) * (j + 1);
            const d = (i + 1) + (widthSegments + 1) * j;
            indices.push(a, b, d, b, c, d);
        }
    }
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    mesh.geometry = geometry;
    return mesh;
};
const createBentPlaneInverse = (options, mesh) => {
    const { height = 1, radius = 2, arc = Math.PI / 2, widthSegments = 32, heightSegments = 1 } = options;
    const geometry = new BufferGeometry();
    const vertices = [], indices = [], uvs = [];
    const startAngle = -arc / 2, endAngle = arc / 2;
    for (let j = 0; j <= heightSegments; j++) {
        const v = j / heightSegments;
        const y = (v - 0.5) * height;
        for (let i = 0; i <= widthSegments; i++) {
            const u = i / widthSegments;
            const angle = startAngle + (endAngle - startAngle) * u;
            vertices.push(Math.sin(angle) * radius, y, -Math.cos(angle) * radius + radius);
            uvs.push(u, v);
        }
    }
    for (let j = 0; j < heightSegments; j++) {
        for (let i = 0; i < widthSegments; i++) {
            const a = i + (widthSegments + 1) * j;
            const b = i + (widthSegments + 1) * (j + 1);
            const c = (i + 1) + (widthSegments + 1) * (j + 1);
            const d = (i + 1) + (widthSegments + 1) * j;
            indices.push(a, b, d, b, c, d);
        }
    }
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    mesh.geometry = geometry;
    return mesh;
};
const createIcosahedron = (options, mesh) => {
    mesh.geometry = new IcosahedronGeometry(options.radius ?? 0.5, options.detail ?? 0);
    return mesh;
};
const createOctahedron = (options, mesh) => {
    mesh.geometry = new OctahedronGeometry(options.radius ?? 0.5, options.detail ?? 0);
    return mesh;
};
const createTetrahedron = (options, mesh) => {
    mesh.geometry = new TetrahedronGeometry(options.radius ?? 0.5, options.detail ?? 0);
    return mesh;
};
const createDodecahedron = (options, mesh) => {
    mesh.geometry = new DodecahedronGeometry(options.radius ?? 0.5, options.detail ?? 0);
    return mesh;
};
const createCapsule = (options, mesh) => {
    const { radius = 0.3, length = 1.0, capSegments = 4, radialSegments = 8 } = options;
    mesh.geometry = new CapsuleGeometry(radius, length, capSegments, radialSegments);
    return mesh;
};
const getMeshGeometryConfig = (meshData) => {
    const type = (meshData.type || 'box');
    switch (type) {
        case 'box':
            return {
                type,
                size: (meshData.size || meshData.scale),
            };
        case 'sphere': {
            const segments = safeNumber(meshData.segments, 32, 3);
            return {
                type,
                radius: safeNumber(meshData.radius, 0.5, 0.0001),
                segments,
                rings: safeNumber(meshData.rings, segments, 2),
            };
        }
        case 'cylinder':
            return {
                type,
                radiusTop: safeNumber(meshData.radiusTop, 0.5, 0.0001),
                radiusBottom: safeNumber(meshData.radiusBottom, 0.5, 0.0001),
                height: safeNumber(meshData.height, 1, 0.0001),
                radialSegments: safeNumber(meshData.radialSegments, 32, 3),
            };
        case 'cone':
            return {
                type,
                radius: safeNumber(meshData.radius, 0.5, 0.0001),
                height: safeNumber(meshData.height, 1, 0.0001),
                radialSegments: safeNumber(meshData.radialSegments, 32, 3),
            };
        case 'torus':
            return {
                type,
                radius: safeNumber(meshData.radius, 0.5, 0.0001),
                tube: safeNumber(meshData.tube, 0.2, 0.0001),
                radialSegments: safeNumber(meshData.radialSegments, 16, 3),
                tubularSegments: safeNumber(meshData.tubularSegments, 100, 3),
            };
        case 'plane':
            return {
                type,
                width: safeNumber(meshData.scale?.[0], 1, 0.0001),
                height: safeNumber(meshData.scale?.[1], 1, 0.0001),
                widthSegments: safeNumber(meshData.widthSegments, 1, 1),
                heightSegments: safeNumber(meshData.heightSegments, 1, 1),
            };
        case 'ring':
            return {
                type,
                innerRadius: safeNumber(meshData.innerRadius, 0.3, 0.0001),
                outerRadius: safeNumber(meshData.outerRadius, 0.8, 0.0001),
                thetaSegments: safeNumber(meshData.thetaSegments, 32, 3),
                phiSegments: safeNumber(meshData.phiSegments, 8, 1),
            };
        case 'arc':
            return {
                type,
                radius: safeNumber(meshData.radius, 1, 0.0001),
                startAngle: safeNumber(meshData.startAngle, 0),
                endAngle: safeNumber(meshData.endAngle, Math.PI),
                width: safeNumber(meshData.width, 0.2, 0.0001),
                segments: safeNumber(meshData.segments, 32, 3),
            };
        case 'bentPlane':
            return {
                type,
                height: safeNumber(meshData.height, 1, 0.0001),
                radius: safeNumber(meshData.radius, 2, 0.0001),
                arc: safeNumber(meshData.arc, Math.PI / 2, 0.0001),
                widthSegments: safeNumber(meshData.widthSegments, 32, 1),
                heightSegments: safeNumber(meshData.heightSegments, 1, 1),
            };
        case 'bentPlaneInverse':
            return {
                type,
                height: safeNumber(meshData.height, 1, 0.0001),
                radius: safeNumber(meshData.radius, 2, 0.0001),
                arc: safeNumber(meshData.arc, Math.PI / 2, 0.0001),
                widthSegments: safeNumber(meshData.widthSegments, 32, 1),
                heightSegments: safeNumber(meshData.heightSegments, 1, 1),
            };
        case 'capsule':
            return {
                type,
                radius: safeNumber(meshData.radius, 0.3, 0.0001),
                length: safeNumber(meshData.length, 1.0, 0.0001),
                capSegments: safeNumber(meshData.capSegments, 4, 1),
                radialSegments: safeNumber(meshData.radialSegments, 8, 3),
            };
        case 'icosahedron':
            return {
                type,
                radius: safeNumber(meshData.radius, 0.5, 0.0001),
                detail: safeNumber(meshData.detail, 0, 0),
            };
        case 'octahedron':
            return {
                type,
                radius: safeNumber(meshData.radius, 0.5, 0.0001),
                detail: safeNumber(meshData.detail, 0, 0),
            };
        case 'tetrahedron':
            return {
                type,
                radius: safeNumber(meshData.radius, 0.5, 0.0001),
                detail: safeNumber(meshData.detail, 0, 0),
            };
        case 'dodecahedron':
            return {
                type,
                radius: safeNumber(meshData.radius, 0.5, 0.0001),
                detail: safeNumber(meshData.detail, 0, 0),
            };
        case 'text':
            return {
                type,
                text: typeof meshData.text === 'string' ? meshData.text : 'Hello',
                size: safeNumber(meshData.size, 1, 0.0001),
                height: safeNumber(meshData.height, 0.2, 0.0001),
            };
        case 'point':
            return {
                type,
                size: safeNumber(meshData.size, 0.1, 0.0001),
            };
        case 'grid':
            return {
                type,
                size: safeNumber(meshData.size, 10, 0.0001),
                divisions: safeNumber(meshData.divisions, 10, 1),
            };
        case 'custom':
            return {
                type,
                vertices: Array.isArray(meshData.vertices) ? meshData.vertices : [],
                indices: Array.isArray(meshData.indices) ? meshData.indices : [],
                normals: Array.isArray(meshData.normals) ? meshData.normals : [],
                uvs: Array.isArray(meshData.uvs) ? meshData.uvs : [],
            };
        default:
            console.warn('Unknown mesh type:', type);
            return null;
    }
};
export const createMeshByType = (meshData: BaseMeshOptions): CreatedMeshByTypeResult | null => {
    const config = {
        ...meshData,
        type: meshData.type || 'box',
    };
    const geometryConfig = getMeshGeometryConfig(config);
    if (!geometryConfig)
        return null;
    const mesh = createMesh(config);
    let createdMesh = null;
    switch (geometryConfig.type) {
        case 'box':
            createdMesh = createBox(geometryConfig.size, mesh);
            break;
        case 'sphere':
            createdMesh = createSphere({ ...config, ...geometryConfig }, mesh);
            break;
        case 'cylinder':
            createdMesh = createCylinder({ ...config, ...geometryConfig }, mesh);
            break;
        case 'cone':
            createdMesh = createCone({ ...config, ...geometryConfig }, mesh);
            break;
        case 'torus':
            createdMesh = createTorus({ ...config, ...geometryConfig }, mesh);
            break;
        case 'plane':
            createdMesh = createPlane({ ...config, ...geometryConfig }, mesh);
            break;
        case 'ring':
            createdMesh = createRing({ ...config, ...geometryConfig }, mesh);
            break;
        case 'arc':
            createdMesh = createArcPlane({ ...config, ...geometryConfig }, mesh);
            break;
        case 'bentPlane':
            createdMesh = createBentPlane({ ...config, ...geometryConfig }, mesh);
            break;
        case 'bentPlaneInverse':
            createdMesh = createBentPlaneInverse({ ...config, ...geometryConfig }, mesh);
            break;
        case 'capsule':
            createdMesh = createCapsule({ ...config, ...geometryConfig }, mesh);
            break;
        case 'icosahedron':
            createdMesh = createIcosahedron({ ...config, ...geometryConfig }, mesh);
            break;
        case 'octahedron':
            createdMesh = createOctahedron({ ...config, ...geometryConfig }, mesh);
            break;
        case 'tetrahedron':
            createdMesh = createTetrahedron({ ...config, ...geometryConfig }, mesh);
            break;
        case 'dodecahedron':
            createdMesh = createDodecahedron({ ...config, ...geometryConfig }, mesh);
            break;
        case 'text':
            createdMesh = createText({ ...config, ...geometryConfig }, mesh);
            break;
        case 'point':
            createdMesh = createPoint({ ...config, ...geometryConfig }, mesh);
            break;
        case 'grid':
            createdMesh = createGrid({ ...config, ...geometryConfig }, mesh);
            break;
        case 'custom':
            createdMesh = createCustomMesh({ ...config, ...geometryConfig }, mesh);
            break;
        default:
            return null;
    }
    return {
        mesh: createdMesh,
        config: geometryConfig,
    };
};
