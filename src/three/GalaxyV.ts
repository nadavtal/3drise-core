import * as THREE from 'three';
import { StarsV } from './StarsV';
import { generateShootingStars, generateShootingStar } from '../utils/shootingStarHelpers';
import type { StarsSettings } from "../types/environment";
export interface GalaxyVOptions {
    settings: StarsSettings;
}


const shootingStarVertexShader = /*glsl*/ `
  varying float vProgress;
  attribute float progress;
  void main() {
    vProgress = progress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const shootingStarFragmentShader = /*glsl*/ `
  uniform vec3 color;
  uniform float opacity;
  varying float vProgress;
  void main() {
    float alpha = opacity * (1.0 - vProgress) * (1.0 - vProgress);
    float glow = 1.0 - vProgress;
    vec3 glowColor = color * (1.0 + glow * 0.5);
    gl_FragColor = vec4(glowColor, alpha);
  }
`;
class ShootingStarItemV {
    group;
    lineSegments;
    starMesh;
    glowMesh;
    trailGeometry;
    trailMaterial;
    starMaterial;
    glowMaterial;
    currentPos;
    direction;
    trailPositions;
    distanceTraveled = 0;
    speed;
    trailLength;
    maxDistance;
    fadeIn;
    fadeOut;
    opacity;
    onComplete;
    done = false;
    constructor(data, onComplete) {
        this.speed = data.speed;
        this.trailLength = Math.max(2, data.trailLength);
        this.maxDistance = data.length;
        this.fadeIn = this.maxDistance * 0.15;
        this.fadeOut = this.maxDistance * 0.15;
        this.opacity = 0.9;
        this.onComplete = onComplete;
        this.currentPos = new THREE.Vector3(...data.position);
        this.direction = new THREE.Vector3(...data.direction).normalize();
        this.trailPositions = Array(this.trailLength).fill(null).map(() => this.currentPos.clone());
        this.group = new THREE.Group();
        // Trail geometry
        this.trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.trailLength * 3);
        const progress = new Float32Array(this.trailLength);
        const indices = [];
        for (let i = 0; i < this.trailLength - 1; i++)
            indices.push(i, i + 1);
        for (let i = 0; i < this.trailLength; i++) {
            positions[i * 3] = data.position[0];
            positions[i * 3 + 1] = data.position[1];
            positions[i * 3 + 2] = data.position[2];
            progress[i] = i / (this.trailLength - 1);
        }
        this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trailGeometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));
        this.trailGeometry.setIndex(indices);
        this.trailMaterial = new THREE.ShaderMaterial({
            vertexShader: shootingStarVertexShader,
            fragmentShader: shootingStarFragmentShader,
            uniforms: {
                color: { value: new THREE.Color(data.color) },
                opacity: { value: this.opacity },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.lineSegments = new THREE.LineSegments(this.trailGeometry, this.trailMaterial);
        this.group.add(this.lineSegments);
        const size = 0.08;
        this.starMaterial = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: this.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.glowMaterial = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: this.opacity * 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.starMesh = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), this.starMaterial);
        this.glowMesh = new THREE.Mesh(new THREE.SphereGeometry(size * 2, 8, 8), this.glowMaterial);
        this.starMesh.add(this.glowMesh);
        this.starMesh.position.copy(this.currentPos);
        this.group.add(this.starMesh);
    }
    update(delta) {
        if (this.done)
            return;
        const movement = this.direction.clone().multiplyScalar(this.speed);
        this.currentPos.add(movement);
        this.distanceTraveled += this.speed;
        let alpha = this.opacity;
        if (this.distanceTraveled < this.fadeIn) {
            alpha = this.opacity * (this.distanceTraveled / this.fadeIn);
        }
        else if (this.distanceTraveled > this.maxDistance - this.fadeOut) {
            alpha = this.opacity * ((this.maxDistance - this.distanceTraveled) / this.fadeOut);
        }
        alpha = Math.max(0, alpha);
        this.starMesh.position.copy(this.currentPos);
        this.starMaterial.opacity = alpha;
        this.glowMaterial.opacity = alpha * 0.3;
        this.trailMaterial.uniforms.opacity.value = alpha;
        this.trailPositions.unshift(this.currentPos.clone());
        if (this.trailPositions.length > this.trailLength)
            this.trailPositions.pop();
        const posAttr = this.trailGeometry.getAttribute('position');
        for (let i = 0; i < this.trailPositions.length; i++) {
            const p = this.trailPositions[i];
            posAttr.setXYZ(i, p.x, p.y, p.z);
        }
        posAttr.needsUpdate = true;
        if (this.distanceTraveled >= this.maxDistance) {
            this.done = true;
            this.onComplete();
        }
    }
    dispose() {
        this.trailGeometry.dispose();
        this.trailMaterial.dispose();
        this.starMesh.geometry.dispose();
        this.starMaterial.dispose();
        this.glowMesh.geometry.dispose();
        this.glowMaterial.dispose();
    }
}
export class GalaxyV {
    private parent;
    private starsGroup;
    private shootingGroup;
    private starsV;
    private shootingItems = [];
    private config;
    private nextId = 0;
    constructor(parent: THREE.Object3D, options: GalaxyVOptions) {
        this.parent = parent;
        this.config = options;
        this.starsGroup = new THREE.Group();
        this.shootingGroup = new THREE.Group();
        parent.add(this.starsGroup);
        parent.add(this.shootingGroup);
        this.starsV = new StarsV(this.starsGroup, { settings: options.settings });
        this.initShootingStars();
    }
    private initShootingStars() {
        const { shootingStars } = this.config.settings;
        if (!shootingStars?.enabled)
            return;
        const stars = generateShootingStars(shootingStars.count, shootingStars);
        for (const data of stars) {
            this.addShootingStar(data);
        }
        this.nextId = shootingStars.count;
    }
    private addShootingStar(data) {
        const item = new ShootingStarItemV(data, () => {
            // Respawn when complete
            if (!this.config.settings.shootingStars?.enabled)
                return;
            const newData = generateShootingStar(this.nextId++, this.config.settings.shootingStars);
            newData.id = item.group.id; // reuse group reference
            item.dispose();
            this.shootingGroup.remove(item.group);
            const idx = this.shootingItems.indexOf(item);
            if (idx >= 0)
                this.shootingItems.splice(idx, 1);
            this.addShootingStar(newData);
        });
        this.shootingGroup.add(item.group);
        this.shootingItems.push(item);
    }
    update(elapsed: number, delta: number = 0.016): void {
        if (!this.config.settings.visible)
            return;
        this.starsV.update(elapsed, delta);
        for (const item of this.shootingItems) {
            item.update(delta);
        }
    }
    updateConfig(options: GalaxyVOptions): void {
        this.config = options;
        this.starsV.updateConfig({ settings: options.settings });
        // Rebuild shooting stars if settings changed
        for (const item of this.shootingItems) {
            item.dispose();
            this.shootingGroup.remove(item.group);
        }
        this.shootingItems = [];
        this.nextId = 0;
        this.initShootingStars();
    }
    dispose(removeFromScene: boolean = true): void {
        this.starsV.dispose(false);
        for (const item of this.shootingItems) {
            item.dispose();
        }
        this.shootingItems = [];
        if (removeFromScene) {
            this.parent.remove(this.starsGroup);
            this.parent.remove(this.shootingGroup);
        }
    }
}
