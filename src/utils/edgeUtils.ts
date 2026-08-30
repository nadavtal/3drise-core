import { BufferAttribute, BufferGeometry, EdgesGeometry, Float32BufferAttribute, Matrix4, Mesh, Vector3 } from "three";
import type { Object3D } from 'three';
import { EDGES_GROUP_KEY } from "./materialApplicationUtils";
export interface MeshEntry {
    mesh: Mesh;
    /** transform relative to the root object */
    matrixRelativeToRoot: Matrix4;
}

export interface EdgeSegment {
    start: Vector3;
    end: Vector3;
}

/** Recursively collect all meshes with geometries, accumulating local matrices. */
export function collectMeshes(obj: Object3D, parentMatrix: Matrix4 = new Matrix4()): MeshEntry[] {
    const worldMatrix = parentMatrix.clone().multiply(obj.matrix);
    const results = [];
    if (obj instanceof Mesh && obj.geometry instanceof BufferGeometry && obj.geometry.getAttribute('position')) {
        results.push({ mesh: obj, matrixRelativeToRoot: worldMatrix });
    }
    for (const child of obj.children) {
        if (child.userData[EDGES_GROUP_KEY])
            continue; // skip previously-built edges
        results.push(...collectMeshes(child, worldMatrix));
    }
    return results;
}
/** Pick edge threshold based on bounding box shape. */
export function computeThreshold(geometry: BufferGeometry): number {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new Vector3();
    box.getSize(size);
    const dims = [size.x, size.y, size.z].sort((a, b) => a - b);
    const isFlat = dims[0] < 0.001 || dims[0] / dims[2] < 0.01;
    return isFlat ? 180 : 15;
}
/**
 * Extract all edge segments from an Object3D (or group).
 * Each segment is in the coordinate space of the root object.
 */
export function extractEdgeSegments(object: Object3D): EdgeSegment[] {
    const entries = collectMeshes(object);
    const segments = [];
    for (const { mesh, matrixRelativeToRoot } of entries) {
        const threshold = computeThreshold(mesh.geometry);
        const edges = new EdgesGeometry(mesh.geometry, threshold);
        const pos = edges.attributes.position;
        for (let i = 0; i < pos.count; i += 2) {
            const start = new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            const end = new Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
            start.applyMatrix4(matrixRelativeToRoot);
            end.applyMatrix4(matrixRelativeToRoot);
            segments.push({ start, end });
        }
        edges.dispose();
    }
    return segments;
}
/**
 * Sample `countPerEdge` evenly-spaced points along every edge.
 * Returns flat array of Vector3 positions and matching per-point edge indices.
 */
export function sampleEdgePoints(segments: EdgeSegment[], countPerEdge: number): {
        positions: Float32Array;
        progress: Float32Array;
        edgeIndex: Float32Array;
    } {
    const total = segments.length * countPerEdge;
    const positions = new Float32Array(total * 3);
    const progress = new Float32Array(total);
    const edgeIndex = new Float32Array(total);
    let ptr = 0;
    for (let e = 0; e < segments.length; e++) {
        const { start, end } = segments[e];
        for (let s = 0; s < countPerEdge; s++) {
            const t = s / countPerEdge;
            const x = start.x + (end.x - start.x) * t;
            const y = start.y + (end.y - start.y) * t;
            const z = start.z + (end.z - start.z) * t;
            positions[ptr * 3] = x;
            positions[ptr * 3 + 1] = y;
            positions[ptr * 3 + 2] = z;
            progress[ptr] = t;
            edgeIndex[ptr] = e;
            ptr++;
        }
    }
    return { positions, progress, edgeIndex };
}
/**
 * Build a single pre-baked dense LineSegments geometry for all edges of an object.
 * Every edge is subdivided into `subdivisions` segments.
 * Per-vertex attributes: position, aProgress (0..1), aEdgePhase (golden-ratio spread), aEdgeFreq (0.25..0.5 Hz)
 * Indices form connected pairs so LineSegments renders them as solid continuous lines per edge.
 */
export function buildSubdividedEdgeGeometry(object: Object3D, subdivisions: number = 60, parentMatrix?: Matrix4): BufferGeometry {
    const entries = collectMeshes(object, parentMatrix ?? new Matrix4());
    const allSegs = [];
    for (const { mesh, matrixRelativeToRoot } of entries) {
        const threshold = computeThreshold(mesh.geometry);
        const edges = new EdgesGeometry(mesh.geometry, threshold);
        const pos = edges.attributes.position;
        for (let i = 0; i < pos.count; i += 2) {
            const s = new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(matrixRelativeToRoot);
            const e = new Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)).applyMatrix4(matrixRelativeToRoot);
            allSegs.push({ start: s, end: e });
        }
        edges.dispose();
    }
    const ptsPerEdge = subdivisions + 1;
    const total = allSegs.length * ptsPerEdge;
    const positions = new Float32Array(total * 3);
    const aProgress = new Float32Array(total);
    const aEdgePhase = new Float32Array(total);
    const aEdgeFreq = new Float32Array(total);
    const indices = [];
    for (let e = 0; e < allSegs.length; e++) {
        const { start, end } = allSegs[e];
        const phase = (e * 0.618033) % 1.0; // golden-ratio spread → unique phase per edge
        const freq = 0.25 + (e * 0.137013) % 0.25; // 0.25..0.50 Hz, unique per edge
        const base = e * ptsPerEdge;
        for (let s = 0; s <= subdivisions; s++) {
            const t = s / subdivisions;
            const i = base + s;
            positions[i * 3] = start.x + (end.x - start.x) * t;
            positions[i * 3 + 1] = start.y + (end.y - start.y) * t;
            positions[i * 3 + 2] = start.z + (end.z - start.z) * t;
            aProgress[i] = t;
            aEdgePhase[i] = phase;
            aEdgeFreq[i] = freq;
            if (s < subdivisions)
                indices.push(i, i + 1); // connected line-segment pairs
        }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("aProgress", new BufferAttribute(aProgress, 1));
    geo.setAttribute("aEdgePhase", new BufferAttribute(aEdgePhase, 1));
    geo.setAttribute("aEdgeFreq", new BufferAttribute(aEdgeFreq, 1));
    geo.setIndex(indices);
    return geo;
}

// =============================================================================
// SEGMENT QUADS
// =============================================================================
//
// Turn a list of line segments into a ribbon of camera-agnostic quads — two
// triangles per segment, with UVs running (0,0)-(1,1) along and across it.
//
// This is what makes edges materialisable: the result is an ordinary Mesh with
// real UVs, so every registry material (the `line` shader family included)
// applies to it exactly as it would to any other mesh. Line primitives cannot
// do that — Line2 needs its own LineMaterial and carries no UVs — which is why
// both the edges builder and the `lines` display modes go through here instead.
//
// `source` is a flat sequence of vertex positions, two consecutive vertices per
// segment: either a BufferAttribute (e.g. EdgesGeometry.attributes.position) or
// an array of [x, y, z] triples.
//
export function buildSegmentQuadGeometry(source: BufferAttribute | ArrayLike<[number, number, number]>, thickness: number = 0.008): BufferGeometry {
    const isAttribute = typeof (source as BufferAttribute).getX === 'function';
    const attr = source as BufferAttribute;
    const list = source as ArrayLike<[number, number, number]>;
    const vertexCount = isAttribute ? attr.count : list.length;
    const segCount = Math.floor(vertexCount / 2);
    const readVertex = (i: number, out: Vector3): Vector3 => (isAttribute
        ? out.fromBufferAttribute(attr, i)
        : out.set(list[i][0], list[i][1], list[i][2]));
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const start = new Vector3();
    const end = new Vector3();
    const dir = new Vector3();
    const up = new Vector3(0, 1, 0);
    const right = new Vector3();
    for (let i = 0; i < segCount; i++) {
        readVertex(i * 2, start);
        readVertex(i * 2 + 1, end);
        dir.subVectors(end, start).normalize();
        // Perpendicular axis — fallback to X if the segment is vertical
        right.crossVectors(dir, up).normalize();
        if (right.lengthSq() < 0.0001) {
            right.set(1, 0, 0);
        }
        const rx = right.x * thickness;
        const ry = right.y * thickness;
        const rz = right.z * thickness;
        const base = i * 4;
        // v0  start-bottom   uv(0,0)
        positions.push(start.x - rx, start.y - ry, start.z - rz);
        uvs.push(0, 0);
        // v1  end-bottom     uv(1,0)
        positions.push(end.x - rx, end.y - ry, end.z - rz);
        uvs.push(1, 0);
        // v2  start-top      uv(0,1)
        positions.push(start.x + rx, start.y + ry, start.z + rz);
        uvs.push(0, 1);
        // v3  end-top        uv(1,1)
        positions.push(end.x + rx, end.y + ry, end.z + rz);
        uvs.push(1, 1);
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}
