import * as THREE from 'three';
import { applyEasing, resolveEasing } from '../utils/easingUtils';
import { smoothPathCorners, createPathSpline } from '../utils/pathUtils';
import type { PathConfig } from "../types/animations";
export interface AnimatedObjectVOptions {
    position?: [number, number, number];
    scale?: [number, number, number];
    rotation?: [number, number, number];
}

export interface TransitionOptions {
    from?: {
        position?: [number, number, number];
        scale?: [number, number, number];
        rotation?: [number, number, number];
    };
    to: {
        position?: [number, number, number];
        scale?: [number, number, number];
        rotation?: [number, number, number];
    };
    duration?: number;
    ease?: string;
    onComplete?: () => void;
}

export interface PathAnimationOptions {
    ease?: string;
    loop?: boolean;
    yoyo?: boolean;
    speed?: number;
    faceDirection?: boolean;
    applyRotation?: boolean;
    offset?: [number, number, number];
    onComplete?: () => void;
}


export class AnimatedObjectV {
    readonly group: THREE.Group;
    private parent;
    // Step-based transform state
    private fromPos = new THREE.Vector3();
    private fromScale = new THREE.Vector3(1, 1, 1);
    private fromRot = new THREE.Euler();
    private toPos = new THREE.Vector3();
    private toScale = new THREE.Vector3(1, 1, 1);
    private toRot = new THREE.Euler();
    private transProgress = 1;
    private transDuration = 1;
    private transEase = 'linear';
    private transElapsed = 0;
    private transOnComplete = null;
    // Path animation state
    private pathPoints = [];
    private pathSpline = null;
    private pathProgress = 0;
    private pathDuration = 1;
    private pathSpeed = 1;
    private pathEase = null;
    private pathLoop = false;
    private pathYoyo = false;
    private pathDirection = 1;
    private pathActive = false;
    private pathFaceDir = true;
    private pathApplyRot = true;
    private pathOffset = null;
    private pathOnComplete = null;
    private targetQuat = new THREE.Quaternion();
    constructor(parent: THREE.Object3D, options: AnimatedObjectVOptions = {}) {
        this.parent = parent;
        this.group = new THREE.Group();
        const pos = options.position ?? [0, 0, 0];
        const sc = options.scale ?? [1, 1, 1];
        const rot = options.rotation ?? [0, 0, 0];
        this.group.position.set(...pos);
        this.group.scale.set(...sc);
        this.group.rotation.set(...rot);
        parent.add(this.group);
    }
    startTransition(options: TransitionOptions): void {
        const cur = this.group;
        this.fromPos.set(options.from?.position?.[0] ?? cur.position.x, options.from?.position?.[1] ?? cur.position.y, options.from?.position?.[2] ?? cur.position.z);
        this.fromScale.set(options.from?.scale?.[0] ?? cur.scale.x, options.from?.scale?.[1] ?? cur.scale.y, options.from?.scale?.[2] ?? cur.scale.z);
        this.fromRot.set(options.from?.rotation?.[0] ?? cur.rotation.x, options.from?.rotation?.[1] ?? cur.rotation.y, options.from?.rotation?.[2] ?? cur.rotation.z);
        this.toPos.set(options.to.position?.[0] ?? cur.position.x, options.to.position?.[1] ?? cur.position.y, options.to.position?.[2] ?? cur.position.z);
        this.toScale.set(options.to.scale?.[0] ?? cur.scale.x, options.to.scale?.[1] ?? cur.scale.y, options.to.scale?.[2] ?? cur.scale.z);
        this.toRot.set(options.to.rotation?.[0] ?? cur.rotation.x, options.to.rotation?.[1] ?? cur.rotation.y, options.to.rotation?.[2] ?? cur.rotation.z);
        this.transDuration = options.duration ?? 1;
        this.transEase = options.ease ?? 'linear';
        this.transElapsed = 0;
        this.transProgress = 0;
        this.transOnComplete = options.onComplete ?? null;
    }
    startPathAnimation(pathConfig: PathConfig, duration: number, options: PathAnimationOptions = {}): boolean {
        if (pathConfig.points.length < 2)
            return false;
        const smooth = pathConfig.smoothCorners ?? 0;
        const pts = smooth > 0 && pathConfig.points.length >= 3
            ? smoothPathCorners(pathConfig.points, smooth)
            : pathConfig.points;
        this.pathPoints = pts;
        this.pathSpline = createPathSpline(pts, pathConfig.curve ?? 1);
        this.pathProgress = 0;
        this.pathDuration = duration;
        this.pathSpeed = options.speed ?? 1;
        this.pathEase = options.ease ?? null;
        this.pathLoop = options.loop ?? false;
        this.pathYoyo = options.yoyo ?? false;
        this.pathDirection = 1;
        this.pathFaceDir = options.faceDirection ?? true;
        this.pathApplyRot = options.applyRotation ?? pathConfig.applyRotation ?? true;
        this.pathOffset = options.offset ?? pathConfig.offset ?? null;
        this.pathOnComplete = options.onComplete ?? null;
        this.pathActive = true;
        return true;
    }
    stopAnimation(): void {
        this.transProgress = 1;
        this.pathActive = false;
    }
    private updateTransition(delta) {
        if (this.transProgress >= 1)
            return;
        this.transElapsed += delta;
        const linear = Math.min(this.transElapsed / this.transDuration, 1);
        const p = applyEasing(resolveEasing(this.transEase), linear);
        this.transProgress = linear;
        const g = this.group;
        g.position.lerpVectors(this.fromPos, this.toPos, p);
        g.scale.lerpVectors(this.fromScale, this.toScale, p);
        g.rotation.set(this.fromRot.x + (this.toRot.x - this.fromRot.x) * p, this.fromRot.y + (this.toRot.y - this.fromRot.y) * p, this.fromRot.z + (this.toRot.z - this.fromRot.z) * p);
        if (linear >= 1)
            this.transOnComplete?.();
    }
    private updatePath(delta) {
        if (!this.pathActive)
            return;
        this.pathProgress += (delta / this.pathDuration) * this.pathSpeed * this.pathDirection;
        let p = this.pathProgress;
        if (p >= 1 || p <= 0) {
            if (this.pathYoyo) {
                this.pathDirection *= -1;
                p = Math.max(0, Math.min(1, p));
                this.pathProgress = p;
                if (!this.pathLoop && this.pathDirection === 1 && p <= 0) {
                    this.pathActive = false;
                    this.pathOnComplete?.();
                    return;
                }
            }
            else if (this.pathLoop) {
                this.pathProgress = ((p % 1) + 1) % 1;
                p = this.pathProgress;
            }
            else {
                this.pathProgress = Math.max(0, Math.min(1, p));
                this.pathActive = false;
                this.pathOnComplete?.();
                return;
            }
        }
        const eased = this.pathEase ? applyEasing(resolveEasing(this.pathEase), p) : p;
        const clamped = Math.max(0, Math.min(1, eased));
        let position;
        let direction;
        if (this.pathSpline) {
            position = this.pathSpline.getPointAt(clamped);
            direction = this.pathSpline.getTangentAt(clamped).normalize();
        }
        else {
            const pts = this.pathPoints;
            const segs = pts.length - 1;
            const idx = Math.min(Math.floor(clamped * segs), segs - 1);
            const sp = clamped * segs - idx;
            const a = pts[idx], b = pts[idx + 1];
            position = new THREE.Vector3(a[0] + (b[0] - a[0]) * sp, a[1] + (b[1] - a[1]) * sp, a[2] + (b[2] - a[2]) * sp);
            direction = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        }
        if (this.pathOffset) {
            position.x += this.pathOffset[0];
            position.y += this.pathOffset[1];
            position.z += this.pathOffset[2];
        }
        this.group.position.copy(position);
        if (this.pathApplyRot && this.pathFaceDir && direction.lengthSq() > 0.0001) {
            const up = new THREE.Vector3(0, 1, 0);
            const mat = new THREE.Matrix4();
            mat.lookAt(position, new THREE.Vector3().copy(position).add(direction), up);
            this.targetQuat.setFromRotationMatrix(mat);
            this.targetQuat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
            this.group.quaternion.slerp(this.targetQuat, 1);
        }
    }
    update(_elapsed: number, delta: number = 0.016): void {
        this.updateTransition(delta);
        this.updatePath(delta);
    }
    dispose(removeFromScene: boolean = true): void {
        if (removeFromScene)
            this.parent.remove(this.group);
        this.group.clear();
    }
}
