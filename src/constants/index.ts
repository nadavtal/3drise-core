export const GOLDENRATIO = 1.61803398875;
export const cameraInitialPosition: [number, number, number] = [0, 5, 10];
export const PROJECT_MANAGER = 'Projects Manager';
export const MODELIST = 'Modelist';
export const DESIGNER = 'Designer';
export const _DEFAULT_EDGES_MATERIAL: {
            materialType: string;
            materialVariant: string;
            color: string;
            apply: boolean;
        } = { materialType: 'basic', materialVariant: 'Basic', color: '#ffffff', apply: true };
export const DEFAULT_EDGES_SETTINGS: {
            enabled: boolean;
            type: string;
            materialSettings: {
                materialType: string;
                materialVariant: string;
                color: string;
                apply: boolean;
            };
        } = { enabled: false, type: 'line', materialSettings: _DEFAULT_EDGES_MATERIAL };
