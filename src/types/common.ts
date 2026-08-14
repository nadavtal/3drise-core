export type Vector2Array = [number, number];

export type Vector3Array = [number, number, number];

export type QuaternionArray = [number, number, number, number];

export type AnchorPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface AnchorOffset {
    x?: number;
    y?: number;
    z?: number;
}

export type AnchorSettings = {
    enabled: boolean;
    anchor: AnchorPosition;
    fixedPosition?: boolean;
    fixedSize?: boolean;
    fixedRotation?: boolean;
    offset?: AnchorOffset;
    padding?: number;
};
export {};
