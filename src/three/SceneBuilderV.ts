import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildObjectTree } from '../utils/objectTreeUtils';
import { LightsManagerV } from './LightsManagerV';
import { EnvironmentManagerV } from './EnvironmentManagerV';
import { Text3DV } from './Text3DV';
import { Text2DV } from './Text2DV';
import { ParticlesV } from './ParticlesV';
import { PathRendererV } from './PathRendererV';
import { GridHelperV } from './GridHelperV';
import { createMeshByType } from '../utils/meshUtils';
import type { ProjectData } from "../types/types";
export interface SceneBuilderVOptions {
    onInitialized?: () => void;
}


export class SceneBuilderV {
    readonly scene: THREE.Scene;
    readonly renderer: THREE.WebGLRenderer;
    readonly camera: THREE.PerspectiveCamera;
    readonly controls: OrbitControls;
    private container;
    private lightsManager = null;
    private environmentManager = null;
    private updatables = [];
    private animationId = null;
    private resizeObserver = null;
    private clock = new THREE.Clock();
    constructor(container: HTMLElement, project: ProjectData, options: SceneBuilderVOptions = {}) {
        this.container = container;
        const sceneSettings = (project.sceneSettingsData || {});
        const env = (project.environments?.[0] ?? (sceneSettings as any).environment ?? {});
        const cam = (project.camera ?? (sceneSettings as any).camera ?? {});
        const sceneCanvas = (sceneSettings as any).canvas ?? (sceneSettings as any).scene?.canvas ?? {};
        const generalObjSettings = ((sceneSettings as any).generalObjectSettings ?? (sceneSettings as any).scene?.generalObjectSettings ?? {});
        const timeSettings = (sceneSettings as any).timeSettings ?? (sceneSettings as any).scene?.timeSettings ?? {};
        const controls = cam.controls ?? {};
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: sceneCanvas.antialias ?? true,
            alpha: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(sceneCanvas.dpr ?? window.devicePixelRatio);
        this.renderer.setSize(container.clientWidth || 300, container.clientHeight || 300);
        this.renderer.shadowMap.enabled = sceneCanvas.shadows ?? true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.NoToneMapping;
        if (sceneCanvas.backgroundColor) {
            this.renderer.setClearColor(sceneCanvas.backgroundColor, 1);
        }
        container.style.overflow = 'hidden';
        container.appendChild(this.renderer.domElement);
        // Scene
        this.scene = new THREE.Scene();
        // Camera
        const pos = cam.position ?? [0, 2, 8];
        const ori = cam.orientation ?? [0, 0, 0];
        this.camera = new THREE.PerspectiveCamera(cam.fov ?? 60, (container.clientWidth || 300) / (container.clientHeight || 300), cam.near ?? 0.1, cam.far ?? 1000);
        this.camera.position.set(pos[0] ?? 0, pos[1] ?? 2, pos[2] ?? 8);
        this.camera.rotation.set(ori[0] ?? 0, ori[1] ?? 0, ori[2] ?? 0);
        // Orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = controls.enabled ?? true;
        this.controls.enablePan = controls.enablePan ?? true;
        this.controls.enableRotate = controls.enableRotate ?? true;
        this.controls.autoRotate = controls.autoRotate ?? false;
        this.controls.autoRotateSpeed = controls.autoRotateSpeed ?? 2;
        this.controls.zoomSpeed = controls.zoomSpeed ?? 1;
        this.controls.panSpeed = controls.panSpeed ?? 1;
        this.controls.rotateSpeed = controls.rotateSpeed ?? 1;
        this.controls.minDistance = controls.minDistance ?? 1;
        this.controls.maxDistance = controls.maxDistance ?? 1000;
        if (controls.target) {
            const t = controls.target;
            this.controls.target.set(t[0] ?? 0, t[1] ?? 0, t[2] ?? 0);
        }
        if (controls.minPolarAngle)
            this.controls.minPolarAngle = controls.minPolarAngle;
        if (controls.maxPolarAngle)
            this.controls.maxPolarAngle = controls.maxPolarAngle;
        if (controls.minAzimuthAngle)
            this.controls.minAzimuthAngle = controls.minAzimuthAngle;
        if (controls.maxAzimuthAngle)
            this.controls.maxAzimuthAngle = controls.maxAzimuthAngle;
        // Lights
        if (project.lights?.length) {
            this.lightsManager = new LightsManagerV(this.scene, project.lights[0]);
        }
        // Environment
        if (env) {
            this.environmentManager = new EnvironmentManagerV(this.scene, {
                scene: this.scene,
                renderer: this.renderer,
                camera: this.camera,
                hdrSettings: env.hdr,
                timeSettings: timeSettings.enabled ? timeSettings : undefined,
                sunSystemVisible: env.sky?.sunSystem?.visible ?? false,
                sunSize: env.sky?.sunSystem?.sunSize ?? 1,
                moonSize: env.sky?.sunSystem?.moonSize ?? 1,
                sunIntensity: env.sky?.sunSystem?.intensity ?? 1,
                castShadow: env.sky?.sunSystem?.castShadow,
                shadowMapSize: env.sky?.sunSystem?.shadowMapSize,
                starsSettings: env.stars,
                skyControllerSettings: env.sky?.visible && !env.sky?.sunSystem?.visible ? env.sky : undefined,
                cloudsSettings: env.clouds,
                rainSettings: env.rain,
                fogSettings: env.fog,
            });
            this.updatables.push(this.environmentManager);
        }
        // Objects
        const objectsGroup = new THREE.Group();
        objectsGroup.name = 'main-objects';
        const ms = generalObjSettings?.meshSettings;
        if (ms?.position)
            objectsGroup.position.set(ms.position[0] ?? 0, ms.position[1] ?? 0, ms.position[2] ?? 0);
        if (ms?.rotation)
            objectsGroup.rotation.set(ms.rotation[0] ?? 0, ms.rotation[1] ?? 0, ms.rotation[2] ?? 0);
        if (ms?.scale)
            objectsGroup.scale.set(ms.scale[0] ?? 1, ms.scale[1] ?? 1, ms.scale[2] ?? 1);
        this.scene.add(objectsGroup);
        const tree = buildObjectTree(project.sceneObjects ?? []);
        tree.forEach(node => this.buildNode(node, objectsGroup));
        // Resize
        this.resizeObserver = new ResizeObserver(() => this.handleResize());
        this.resizeObserver.observe(container);
        // Start loop
        this.animate();
        options.onInitialized?.();
    }
    private buildNode(node, parent) {
        const { createdObject, children } = node;
        if (!createdObject)
            return;
        const ms = createdObject.meshSettings;
        const group = new THREE.Group();
        group.name = createdObject.name;
        group.userData.id = createdObject.id;
        group.userData.type = createdObject.type;
        if (ms?.position)
            group.position.set(ms.position[0] ?? 0, ms.position[1] ?? 0, ms.position[2] ?? 0);
        if (ms?.rotation)
            group.rotation.set(ms.rotation[0] ?? 0, ms.rotation[1] ?? 0, ms.rotation[2] ?? 0);
        if (ms?.scale)
            group.scale.set(ms.scale[0] ?? 1, ms.scale[1] ?? 1, ms.scale[2] ?? 1);
        group.visible = ms?.visible ?? true;
        parent.add(group);
        if (createdObject.type !== 'group') {
            this.buildObject(createdObject, group);
        }
        // Per-object effects — EffectsGeneratorV needs the scene as parent
        if (createdObject.effects?.length) {
            createdObject.effects.forEach((effect) => {
                // const fx = new EffectsGeneratorV(this.scene, effect);
                // this.updatables.push(fx as unknown as Updatable);
            });
        }
        children.forEach((child) => this.buildNode(child, group));
    }
    private buildObject(obj, parent) {
        const mat = obj.materialSettings;
        const color = mat?.color ?? '#ffffff';
        switch (obj.type) {
            case 'text': {
                const textSettings = obj;
                const config = textSettings.config;
                if (config?.renderMode === 'text3d') {
                    const v = new Text3DV(parent, { text: config.text ?? obj.name, config, color });
                    this.updatables.push(v);
                }
                else {
                    const v = new Text2DV(parent, { text: config?.text ?? obj.name, config, color });
                    this.updatables.push(v);
                }
                break;
            }
            case 'particles': {
                const p = obj;
                const pc = p.config?.particles;
                if (pc) {
                    const v = new ParticlesV(parent, {
                        shapeType: pc.shapeType ?? 'sphere',
                        count: pc.count ?? 1000,
                        color,
                        pointSize: pc.size ?? 3,
                    });
                    this.updatables.push(v);
                }
                break;
            }
            case 'path': {
                const pathSettings = obj;
                const pc = pathSettings.config;
                if (pc) {
                    const v = new PathRendererV(parent, { pathConfig: pc, color, showLine: true, showCurve: true });
                    this.updatables.push(v);
                }
                break;
            }
            case 'grid': {
                new GridHelperV(parent);
                break;
            }
            case 'effect': {
                const config = obj.config;
                // if (config) {
                //   const v = new EffectsGeneratorV(this.scene, { enabled: true, config });
                //   this.updatables.push(v as unknown as Updatable);
                // }
                break;
            }
            case 'gallery': {
                // const v = new GalleryLayoutV(parent, obj as any);
                // this.updatables.push(v as unknown as Updatable);
                break;
            }
            case 'mesh':
            case 'model':
            case 'custom_primitive': {
                const object = createMeshByType(obj.meshSettings);
                const mesh = object?.mesh;
                if (mesh) {
                    mesh.material = new THREE.MeshStandardMaterial({
                        color,
                        opacity: mat?.opacity ?? 1,
                        transparent: (mat?.opacity ?? 1) < 1,
                    });
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    parent.add(mesh);
                }
                break;
            }
            default:
                break;
        }
    }
    private animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        const elapsed = this.clock.elapsedTime;
        this.updatables.forEach(u => u.update(elapsed, delta));
        this.lightsManager?.update(elapsed);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
    private handleResize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (!w || !h)
            return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
    dispose(): void {
        if (this.animationId !== null)
            cancelAnimationFrame(this.animationId);
        this.resizeObserver?.disconnect();
        this.updatables.forEach(u => u.dispose());
        this.lightsManager?.dispose();
        this.environmentManager?.dispose();
        this.controls.dispose();
        this.renderer.dispose();
        this.renderer.domElement.remove();
    }
}
