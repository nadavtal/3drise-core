import { loadAssets } from '../utils/utils';
import { SceneBuilderV } from './SceneBuilderV';
import type { SceneBuilderVOptions } from './SceneBuilderV';
import type { Project } from "../types/users";
export interface ProjectLoaderVOptions extends SceneBuilderVOptions {
    onLoaded?: (project: Project) => void;
    onError?: (error: Error) => void;
}


const DATA_CENTER_SERVER = 'https://3d-rise.com/api/data/';
export class ProjectLoaderV {
    private container;
    private sceneBuilder = null;
    private options;
    constructor(container: HTMLElement, projectId: string, options: ProjectLoaderVOptions = {}) {
        this.container = container;
        this.options = options;
        this.load(projectId);
    }
    private async load(projectId) {
        let project;
        try {
            const url = `${DATA_CENTER_SERVER}projects/${projectId}/view`;
            const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
            if (!res.ok)
                throw new Error(res.status === 404 ? 'Project not found' : `HTTP ${res.status}`);
            project = await res.json();
        }
        catch (err) {
            this.options.onError?.(err);
            return;
        }
        const sceneObjects = project.sceneObjects ?? [];
        const modelObjects = sceneObjects.filter(o => o.type === 'model');
        if (modelObjects.length) {
            try {
                const models = modelObjects.map(o => ({ ...o.userData, id: o.id }));
                await loadAssets(models);
            }
            catch {
                // Non-fatal — build scene with whatever loaded
            }
        }
        this.options.onLoaded?.(project);
        this.sceneBuilder = new SceneBuilderV(this.container, project, {
            onInitialized: this.options.onInitialized,
        });
    }
    get scene() { return this.sceneBuilder?.scene ?? null; }
    get camera() { return this.sceneBuilder?.camera ?? null; }
    get renderer() { return this.sceneBuilder?.renderer ?? null; }
    dispose(): void {
        this.sceneBuilder?.dispose();
        this.sceneBuilder = null;
    }
}
