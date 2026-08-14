import * as THREE from 'three';
export interface GridHelperVOptions {
    size?: number;
    divisions?: number;
    cellColor?: THREE.ColorRepresentation;
    sectionColor?: THREE.ColorRepresentation;
    position?: [number, number, number];
    rotation?: [number, number, number];
    visible?: boolean;
}

export class GridHelperV {
    private parent;
    private grid;
    constructor(parent: THREE.Object3D, options: GridHelperVOptions = {}) {
        this.parent = parent;
        const { size = 100, divisions = 100, cellColor = '#888888', sectionColor = '#444444', position = [0, 0, 0], rotation = [0, 0, 0], visible = true, } = options;
        this.grid = new THREE.GridHelper(size, divisions, sectionColor, cellColor);
        this.grid.position.set(...position);
        this.grid.rotation.set(...rotation);
        this.grid.visible = visible;
        parent.add(this.grid);
    }
    setVisible(visible: boolean): void {
        this.grid.visible = visible;
    }
    update(_elapsed: number, _delta?: number): void { }
    dispose(removeFromScene: boolean = true): void {
        this.grid.geometry.dispose();
        const mat = this.grid.material;
        if (Array.isArray(mat))
            mat.forEach(m => m.dispose());
        else
            mat.dispose();
        if (removeFromScene)
            this.parent.remove(this.grid);
    }
}
