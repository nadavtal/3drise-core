export const gridUtils = {
    snapToGrid: (position, cellSize) => [
        Math.round(position[0] / cellSize) * cellSize,
        position[1],
        Math.round(position[2] / cellSize) * cellSize,
    ],
    worldToGrid: (worldPos, cellSize) => [
        Math.round(worldPos[0] / cellSize),
        worldPos[1],
        Math.round(worldPos[2] / cellSize),
    ],
    gridToWorld: (gridPos, cellSize) => [
        gridPos[0] * cellSize,
        gridPos[1],
        gridPos[2] * cellSize,
    ],
    isOnGridIntersection: (position, cellSize, tolerance = 0.1) => {
        const s = gridUtils.snapToGrid(position, cellSize);
        return Math.sqrt((position[0] - s[0]) ** 2 + (position[2] - s[2]) ** 2) <= tolerance;
    },
    isOnSectionLine: (position, cellSize, sectionSize, tolerance = 0.1) => {
        const sectionCells = sectionSize / cellSize;
        const g = gridUtils.worldToGrid(position, cellSize);
        return (g[0] % sectionCells < tolerance) || (g[2] % sectionCells < tolerance);
    },
};
