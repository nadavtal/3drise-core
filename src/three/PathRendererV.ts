import * as THREE from 'three';
import { smoothPathCorners, createPathSpline, sampleSplinePoints } from '../utils/pathUtils';
import type { PathConfig } from "../types/animations";
export interface PathRendererVOptions {
    pathConfig: PathConfig;
    color?: string;
    showPoints?: boolean;
    showLine?: boolean;
    showCurve?: boolean;
    pointSize?: number;
}


export class PathRendererV {
    private parent;
    private group;
    private options;
    private pointMeshes = [];
    private lines = [];
    private geometryMeshes = [];
    constructor(parent: THREE.Object3D, options: PathRendererVOptions) {
        this.parent = parent;
        this.options = options;
        this.group = new THREE.Group();
        parent.add(this.group);
        this.build();
    }
    private build() {
        const { pathConfig, color = '#ffa500', showPoints = true, showLine = true, showCurve = true, pointSize = 0.15, } = this.options;
        const points = pathConfig.points || [];
        if (points.length === 0)
            return;
        const curve = pathConfig.curve ?? 1;
        const smoothCorners = pathConfig.smoothCorners ?? 0;
        const hasCurve = curve > 1;
        const hasSmoothCorners = smoothCorners > 0;
        const smoothedPoints = hasSmoothCorners && points.length >= 3
            ? smoothPathCorners(points, smoothCorners)
            : points;
        if (showPoints) {
            const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, toneMapped: false });
            const sphereGeo = new THREE.SphereGeometry(pointSize, 16, 16);
            const dotGeo = new THREE.SphereGeometry(pointSize * 0.33, 8, 8);
            const dotMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
            for (const point of points) {
                const sphere = new THREE.Mesh(sphereGeo, mat);
                sphere.position.set(...(point as [number, number, number]));
                this.group.add(sphere);
                this.pointMeshes.push(sphere);
                const dot = new THREE.Mesh(dotGeo, dotMat);
                dot.position.set(point[0], point[1] + pointSize * 1.67, point[2]);
                this.group.add(dot);
                this.pointMeshes.push(dot);
            }
        }
        if (showLine && points.length > 1 && !hasCurve && !hasSmoothCorners) {
            const line = this.makeLine(points, color, false);
            this.group.add(line);
            this.lines.push(line);
        }
        if (showCurve && points.length >= 2 && (hasCurve || hasSmoothCorners)) {
            const spline = createPathSpline(hasSmoothCorners ? smoothedPoints : points, curve);
            if (spline) {
                const curvePoints = sampleSplinePoints(spline, smoothedPoints.length);
                const curveLine = this.makeLine(curvePoints, color, false);
                this.group.add(curveLine);
                this.lines.push(curveLine);
            }
            if (showLine && points.length > 1) {
                const dashed = this.makeLine(points, color, true);
                this.group.add(dashed);
                this.lines.push(dashed);
            }
        }
        if (pathConfig.geometry && pathConfig.geometry.type !== 'none' && points.length >= 2) {
            this.buildGeometry(points, curve, smoothCorners, pathConfig.geometry);
        }
    }
    private makeLine(points, color, dashed) {
        const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
        const mat = dashed
            ? new THREE.LineDashedMaterial({ color, dashSize: 0.1, gapSize: 0.1 })
            : new THREE.LineBasicMaterial({ color });
        const line = new THREE.Line(geo, mat);
        if (dashed)
            line.computeLineDistances();
        return line;
    }
    private buildGeometry(points, curve, smoothCorners, geometry) {
        const { type, width = 2, radius = 0.5, segments = 8, numLanes = 0, color = '#555555', dividerColor = '#ffffff' } = geometry;
        const smoothed = smoothPathCorners(points, smoothCorners);
        const spline = createPathSpline(smoothed, curve);
        if (!spline)
            return;
        const stdMat = (c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide });
        if (type === 'tube') {
            const geo = new THREE.TubeGeometry(spline, points.length * 10, radius, segments, false);
            const mesh = new THREE.Mesh(geo, stdMat(color));
            this.group.add(mesh);
            this.geometryMeshes.push(mesh);
        }
        if (type === 'road') {
            const geo = this.buildRoadGeo(spline, points.length, width);
            if (geo) {
                const mesh = new THREE.Mesh(geo, stdMat(color));
                this.group.add(mesh);
                this.geometryMeshes.push(mesh);
            }
            if (numLanes > 0) {
                this.buildLaneDividers(spline, points.length, width, numLanes, dividerColor)
                    .forEach(l => { this.group.add(l); this.lines.push(l); });
            }
        }
        if (type === 'walls') {
            const geo = this.buildWallsGeo(spline, points.length, width);
            if (geo) {
                const mesh = new THREE.Mesh(geo, stdMat(color));
                this.group.add(mesh);
                this.geometryMeshes.push(mesh);
            }
        }
    }
    private buildRoadGeo(spline, numPoints, width) {
        const divisions = Math.max(numPoints * 20, 100);
        const vertices = [];
        const indices = [];
        const uvs = [];
        const halfWidth = width / 2;
        const up = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i <= divisions; i++) {
            const t = i / divisions;
            const point = spline.getPointAt(t);
            const tangent = spline.getTangentAt(t).normalize();
            const perp = new THREE.Vector3().crossVectors(tangent, up).normalize();
            const left = new THREE.Vector3().copy(point).addScaledVector(perp, -halfWidth);
            const right = new THREE.Vector3().copy(point).addScaledVector(perp, halfWidth);
            left.y += 0.01;
            right.y += 0.01;
            vertices.push(left.x, left.y, left.z, right.x, right.y, right.z);
            uvs.push(0, t, 1, t);
            if (i < divisions) {
                const b = i * 2;
                indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }
    private buildWallsGeo(spline, numPoints, width) {
        const divisions = Math.max(numPoints * 20, 100);
        const wallHeight = 2;
        const halfWidth = width / 2;
        const vertices = [];
        const indices = [];
        const uvs = [];
        const up = new THREE.Vector3(0, 1, 0);
        for (let i = 0; i <= divisions; i++) {
            const t = i / divisions;
            const point = spline.getPointAt(t);
            const perp = new THREE.Vector3().crossVectors(spline.getTangentAt(t).normalize(), up).normalize();
            const lb = new THREE.Vector3().copy(point).addScaledVector(perp, -halfWidth);
            const lt = lb.clone().setY(lb.y + wallHeight);
            const rb = new THREE.Vector3().copy(point).addScaledVector(perp, halfWidth);
            const rt = rb.clone().setY(rb.y + wallHeight);
            vertices.push(lb.x, lb.y, lb.z, lt.x, lt.y, lt.z, rb.x, rb.y, rb.z, rt.x, rt.y, rt.z);
            uvs.push(0, t, 0, t, 1, t, 1, t);
            if (i < divisions) {
                const b = i * 4, n = (i + 1) * 4;
                indices.push(b, b + 1, n, b + 1, n + 1, n, b + 2, n + 2, b + 3, b + 3, n + 2, n + 3, b + 1, b + 3, n + 1, b + 3, n + 3, n + 1, b, n, b + 2, b + 2, n, n + 2);
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
    }
    private buildLaneDividers(spline, numPoints, width, numLanes, color) {
        const divisions = Math.max(numPoints * 20, 100);
        const laneWidth = width / (numLanes * 2);
        const offsets = [0];
        for (let lane = 1; lane < numLanes; lane++) {
            offsets.push(-lane * laneWidth, lane * laneWidth);
        }
        const up = new THREE.Vector3(0, 1, 0);
        return offsets.map((offset, idx) => {
            const pts = [];
            for (let i = 0; i <= divisions; i++) {
                const t = i / divisions;
                const point = spline.getPointAt(t);
                const perp = new THREE.Vector3().crossVectors(spline.getTangentAt(t).normalize(), up).normalize();
                const dp = new THREE.Vector3().copy(point).addScaledVector(perp, offset);
                dp.y += 0.02;
                pts.push(dp);
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const mat = idx === 0
                ? new THREE.LineBasicMaterial({ color })
                : new THREE.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.3 });
            const line = new THREE.Line(geo, mat);
            if (idx !== 0)
                line.computeLineDistances();
            return line;
        });
    }
    update(_elapsed: number, _delta?: number): void { }
    updateConfig(options: PathRendererVOptions): void {
        this.dispose(false);
        this.options = options;
        this.build();
    }
    dispose(removeFromScene: boolean = true): void {
        const disposeMesh = (m) => {
            m.geometry.dispose();
            m.material.dispose();
        };
        const disposeLine = (l) => {
            l.geometry.dispose();
            l.material.dispose();
        };
        this.pointMeshes.forEach(disposeMesh);
        this.lines.forEach(disposeLine);
        this.geometryMeshes.forEach(disposeMesh);
        this.pointMeshes = [];
        this.lines = [];
        this.geometryMeshes = [];
        this.group.clear();
        if (removeFromScene)
            this.parent.remove(this.group);
    }
}
