// =============================================================================
// gridLayoutPresets — ready-made grid layouts (core utils/gridLayout)
// =============================================================================
//
// Starting points in four groups, each a plain GridLayout built with the same edit functions the
// editor uses (so a preset is exactly what a user could have drawn):
//   City plans      real patterns, straight lines: Manhattan, superblocks, a Roman camp…
//   Organic         slanted lines, moved junctions and curves: a diamond, a fan, a medina…
//   Terrain         heights: terraces, a valley, a ridge, a coastal slope
//   Infrastructure  bridges, flyovers and roundabout platforms
// A preset that uses slants, heights or bridges is `free`: only consumers that draw those
// (GridCreator's `slant`) list it. Cells carry fills (block mixes, parks, parking, plazas) for
// the street grid's blocks.
//
// Scenes use a preset BY REFERENCE ('preset:<id>', gridLayoutRefs.ts): never change an existing
// preset's layout — every scene using it would silently change. A better version is a new id.
//
// Sizes respect the street grid: a crossing reaches ~18 m along each street and a roundabout
// ~31 m, so streets next to roundabouts are 120 m or more.
//
import {
    uniformGridLayout, gridMerge, gridSetFill, gridSetCurve, gridSetCorner, gridSetJunction, gridToggleStreet,
    gridSetLineEnds, gridSetOffset, gridSetHeight, gridLiftLine,
    gridStreetId, gridCellId, gridNodeId, linePositionsOf,
} from './gridLayout';
import type { GridLayout, GridCellFill } from './gridLayout';

export type GridPresetGroup = 'city' | 'organic' | 'terrain' | 'infrastructure';
export const GRID_PRESET_GROUPS: ReadonlyArray<{ id: GridPresetGroup; label: string; description: string }> = [
    { id: 'city', label: 'City plans', description: 'Real street patterns on straight lines.' },
    { id: 'organic', label: 'Organic', description: 'Slanted lines, moved junctions and curves.' },
    { id: 'terrain', label: 'Terrain', description: 'Grids with height: terraces, valleys, ridges.' },
    { id: 'infrastructure', label: 'Infrastructure', description: 'Bridges, flyovers and roundabouts on a slope.' },
];

export interface GridPreset {
    id: string;
    name: string;
    description: string;
    group: GridPresetGroup;
    /** Uses slanted lines, moved junctions, heights, arches or bridges (only for consumers that draw them). */
    free: boolean;
    layout: GridLayout;
}

/** Does a layout use anything beyond straight lines on flat ground? */
export function gridIsFree(g: GridLayout): boolean {
    return !!(g.ends || g.offsets || g.heights || g.heightCurve || Object.values(g.curves ?? {}).some((c) => !!c.bend?.lift) || Object.values(g.junctions ?? {}).some((j) => j.kind === 'bridgeX' || j.kind === 'bridgeY'));
}

// ---------------------------------------------------------------------------- small builders
const sizes = (cols: number[], rows: number[], edge: 'loop' | 'open' = 'loop'): GridLayout => ({ version: 1, columns: cols, rows, edge });
const even = (n: number, size: number) => Array(n).fill(size) as number[];
const fillAll = (g: GridLayout, f: (c: number, r: number) => GridCellFill | null): GridLayout => {
    let out = g;
    for (let r = 0; r < g.rows.length; r++) for (let c = 0; c < g.columns.length; c++) { const v = f(c, r); if (v) out = gridSetFill(out, [gridCellId(c, r)], v); }
    return out;
};
const park = (g: GridLayout, col: number, row: number, cols: number, rows: number, kind: GridCellFill['kind'] = 'park') =>
    gridSetFill(gridMerge(g, { col, row, cols, rows }), [gridCellId(col, row)], { kind });
const round = (g: GridLayout, i: number, j: number, radius = 10) => gridSetJunction(g, gridNodeId(i, j), { kind: 'roundabout', radius });
const cut = (g: GridLayout, ...ids: string[]) => ids.reduce((acc, id) => gridToggleStreet(acc, id), g);
const block = (mix: string): GridCellFill => ({ kind: 'block', mix });
/** A street bent sideways: metres to the right of travel (the curving API's side — + south on an x street, + west on a z street). */
const side = (g: GridLayout, id: string, metres: number) => gridSetCurve(g, id, { side: metres });
/** The cell's distance from the grid centre, 0 (middle) .. 1 (edge) — for downtown-to-suburb fills. */
const ring = (g: GridLayout, c: number, r: number) => Math.max(Math.abs((c + 0.5) / g.columns.length - 0.5), Math.abs((r + 0.5) / g.rows.length - 0.5)) * 2;

// ---------------------------------------------------------------------------- the presets
function build(): GridPreset[] {
    const out: GridPreset[] = [];
    let group: GridPresetGroup = 'city';
    const add = (id: string, name: string, description: string, layout: GridLayout) => out.push({ id, name, description, group, free: gridIsFree(layout), layout });

    // 1. Quick 5x5 — the street grid's own default.
    add('classic', 'Classic 4 × 4', 'Even 150 m blocks with a loop road round the edge — the street grid’s default.',
        fillAll(uniformGridLayout(5, 5, 150), (c, r) => block(ring(uniformGridLayout(5, 5, 150), c, r) < 0.6 ? 'downtown' : 'residential')));

    // 2. Manhattan: long thin blocks, avenues far apart, streets close.
    {
        const g = sizes(even(5, 260), even(8, 80), 'open');
        add('manhattan', 'Manhattan', 'Long 260 × 80 m blocks: avenues far apart, cross streets every 80 m, open at the edges.',
            fillAll(g, () => block('downtown')));
    }

    // 3. Central park: a big merged park in the middle of a downtown.
    {
        let g = sizes(even(7, 140), even(7, 140));
        g = park(g, 2, 2, 3, 3);
        g = fillAll(g, (c, r) => (c >= 2 && c <= 4 && r >= 2 && r <= 4 ? null : block('downtown')));
        add('central-park', 'Central park', 'A 3 × 3-block park in the middle of a 7 × 7 downtown.', g);
    }

    // 4. Superblocks: 3 x 3 blocks per superblock, the inner streets cut to through traffic.
    {
        let g = sizes(even(6, 113), even(6, 113));
        for (const [c0, r0] of [[0, 0], [3, 0], [0, 3], [3, 3]]) {
            // cut the streets inside each 3 x 3 superblock (the cross through its middle block)
            g = cut(g, gridStreetId('x', c0 + 1, r0 + 1), gridStreetId('x', c0 + 1, r0 + 2), gridStreetId('z', c0 + 1, r0 + 1), gridStreetId('z', c0 + 2, r0 + 1));
            g = gridSetFill(g, [gridCellId(c0 + 1, r0 + 1)], { kind: 'plaza' });
        }
        g = fillAll(g, (c, r) => (g.cells?.[gridCellId(c, r)] ? null : block('residential')));
        add('superblocks', 'Superblocks', 'Barcelona superilles: four 3 × 3 superblocks, inner streets cut, a plaza in each heart.', g);
    }

    // 5. Roundabout town: roundabouts on the main cross.
    {
        let g = sizes(even(4, 160), even(4, 160));
        g = round(g, 2, 2, 14); g = round(g, 2, 1); g = round(g, 2, 3); g = round(g, 1, 2); g = round(g, 3, 2);
        g = fillAll(g, (c, r) => block(ring(g, c, r) < 0.6 ? 'downtown' : 'suburb'));
        add('roundabout-town', 'Roundabout town', 'A 4 × 4 town whose main cross runs through five roundabouts.', g);
    }

    // 6. Old town: small, irregular blocks with bent lanes.
    {
        let g = sizes([70, 90, 60, 85, 75], [80, 60, 95, 70]);
        g = side(g, gridStreetId('x', 1, 1), 12); g = side(g, gridStreetId('x', 3, 2), -10);
        g = side(g, gridStreetId('z', 2, 0), -9); g = side(g, gridStreetId('z', 3, 2), 11);
        g = side(g, gridStreetId('x', 0, 3), 8); g = side(g, gridStreetId('z', 1, 3), -10);
        g = gridSetFill(g, [gridCellId(2, 1)], { kind: 'plaza' });
        g = fillAll(g, (c, r) => (c === 2 && r === 1 ? null : block('oldTown')));
        add('old-town', 'Old town', 'Small uneven blocks, crooked lanes and a market plaza.', g);
    }

    // 7. Garden suburb: curving streets and wide round corners.
    {
        let g = sizes(even(4, 180), even(3, 160));
        for (let j = 1; j < 3; j++) for (let i = 0; i < 4; i++) g = side(g, gridStreetId('x', i, j), (i + j) % 2 ? 22 : -22);
        for (const id of ['0,0', '4,0', '0,3', '4,3']) g = gridSetCorner(g, id, 70);
        g = park(g, 1, 1, 2, 1);
        g = fillAll(g, (c, r) => (r === 1 && (c === 1 || c === 2) ? null : block('suburb')));
        add('garden-suburb', 'Garden suburb', 'Curving residential streets, big round corners and a green in the middle.', g);
    }

    // 8. Cul-de-sacs: dead ends off a loop.
    {
        let g = sizes(even(5, 120), even(4, 120));
        g = cut(g, gridStreetId('z', 1, 1), gridStreetId('z', 2, 2), gridStreetId('z', 3, 1), gridStreetId('z', 4, 2),
            gridStreetId('x', 1, 2), gridStreetId('x', 3, 2));
        g = fillAll(g, () => block('suburb'));
        add('cul-de-sacs', 'Cul-de-sacs', 'A suburb of dead-end streets off a loop road.', g);
    }

    // 9. Boulevard: a park strip down the middle of a wide avenue.
    {
        let g = sizes([150, 150, 60, 150, 150], even(5, 130));
        g = park(g, 2, 0, 1, 5);
        g = fillAll(g, (c, r) => (c === 2 ? null : block(c === 1 || c === 3 ? 'downtown' : 'residential')));
        add('boulevard', 'Boulevard', 'A 60 m park strip runs the length of the city between two avenues.', g);
    }

    // 10. New town: mixed — park, plaza, parking, roundabout, rounded edge.
    {
        let g = sizes(even(6, 140), even(5, 140));
        g = park(g, 0, 0, 2, 2);
        g = gridSetFill(g, [gridCellId(3, 2)], { kind: 'plaza' });
        g = gridSetFill(g, [gridCellId(5, 4)], { kind: 'parking' }); g = gridSetFill(g, [gridCellId(4, 4)], { kind: 'parking' });
        g = round(g, 3, 2, 12); g = round(g, 4, 3);
        for (const id of ['6,0', '0,5', '6,5']) g = gridSetCorner(g, id, 60);
        g = side(g, gridStreetId('z', 6, 1), -20); g = side(g, gridStreetId('z', 6, 3), 20);
        g = fillAll(g, (c, r) => (g.cells?.[gridCellId(c, r)] || gridIn(g, c, r) ? null : block(ring(g, c, r) < 0.5 ? 'downtown' : 'residential')));
        add('new-town', 'New town', 'A planned town: a park, a plaza on a roundabout, parking and a curving east side.', g);
    }

    // 11. Roman camp: a square castrum, the forum where its two main streets cross.
    {
        let g = sizes(even(6, 90), even(6, 90));
        g = gridSetFill(gridMerge(g, { col: 2, row: 2, cols: 2, rows: 2 }), [gridCellId(2, 2)], { kind: 'plaza' });
        for (const id of ['0,0', '6,0', '0,6', '6,6']) g = gridSetCorner(g, id, 30);
        g = fillAll(g, (c, r) => (gridIn(g, c, r) ? null : block('oldTown')));
        add('roman-camp', 'Roman camp', 'A square castrum: 90 m insulae, rounded walls and the forum at the central crossing.', g);
    }

    // ------------------------------------------------------------------ organic
    group = 'organic';
    // 12. Diamond: every column line leans one way, every row line the other.
    {
        let g = sizes(even(5, 120), even(5, 120));
        for (let k = 0; k <= 5; k++) { g = gridSetLineEnds(g, 'col', k, { a: -90, b: 90 }); g = gridSetLineEnds(g, 'row', k, { a: 70, b: -70 }); }
        g = fillAll(g, () => block('residential'));
        add('diamond', 'Diamond', 'Columns lean one way, rows the other: a lattice of rhombus blocks.', g);
    }
    // 13. Fan: the column lines gather toward the north, like streets running to a gate.
    {
        let g = sizes(even(6, 120), even(4, 130));
        const xs = linePositionsOf(g.columns);
        for (let k = 0; k <= 6; k++) g = gridSetLineEnds(g, 'col', k, { a: Math.round(-xs[k] * 0.62) });
        g = gridSetCorner(gridSetCorner(g, '0,4', 60), '6,4', 60);
        g = fillAll(g, (c, r) => block(r === 0 ? 'downtown' : 'residential'));
        add('fan', 'Fan', 'Streets fan out from the north like spokes from a city gate.', g);
    }
    // 14. Riverside: the rows follow a river's bend, peaking off-centre.
    {
        let g = sizes(even(5, 140), [90, 110, 110, 90]);
        for (let j = 0; j <= 4; j++) for (let i = 0; i < 5; i++) {
            const id = gridStreetId('x', i, j);
            g = gridSetCurve(g, id, { side: 34 - Math.abs(i - 2) * 6, peak: 0.4 + 0.05 * i });
        }
        g = gridSetFill(gridMerge(g, { col: 0, row: 3, cols: 5, rows: 1 }), [gridCellId(0, 3)], { kind: 'park' });
        g = fillAll(g, (c, r) => (r === 3 ? null : block('residential')));
        add('riverside', 'Riverside', 'Rows of streets swing with a river bend; a park runs along the water.', g);
    }
    // 15. Medina: an old city of moved junctions and tight, sharp lanes.
    {
        let g = sizes([70, 80, 65, 75, 70], [75, 65, 80, 70]);
        let seed = 7;
        const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; };
        for (let j = 1; j < 4; j++) for (let i = 1; i < 5; i++) g = gridSetOffset(g, gridNodeId(i, j), [Math.round(rnd() * 34), Math.round(rnd() * 30)]);
        for (const [id, b] of [['x:1,1', 14], ['z:2,1', 12], ['x:3,2', 11], ['z:3,0', -9], ['x:0,3', -10], ['z:1,2', -12]] as const) {
            g = gridSetCurve(g, id, { side: b, sharpness: 0.45 });
        }
        g = cut(g, gridStreetId('z', 4, 1), gridStreetId('x', 1, 3));
        g = gridSetFill(g, [gridCellId(2, 1)], { kind: 'plaza' });
        g = fillAll(g, (c, r) => (c === 2 && r === 1 ? null : block('oldTown')));
        add('medina', 'Medina', 'An old walled city: crooked junctions, tight sharp lanes, two dead ends and a souk square.', g);
    }

    // ------------------------------------------------------------------ terrain
    group = 'terrain';
    // 16. Terraces: each row of streets a step higher up the hill.
    {
        let g = sizes(even(5, 130), even(4, 110));
        for (let j = 0; j <= 4; j++) g = gridLiftLine(g, 'row', j, j * 9, j * 9);
        g = fillAll(g, () => block('residential'));
        add('terraces', 'Terraces', 'A hillside town: every row of streets 9 m above the one below it.', g);
    }
    // 17. Valley: a smooth bowl, low in the middle.
    {
        let g: GridLayout = { ...sizes(even(6, 120), even(6, 120)), heightCurve: 'smooth' };
        for (let j = 0; j <= 6; j++) for (let i = 0; i <= 6; i++) g = gridSetHeight(g, gridNodeId(i, j), Math.round(((i - 3) ** 2 + (j - 3) ** 2) * 2.2));
        g = park(g, 2, 2, 2, 2);
        g = fillAll(g, (c, r) => (gridIn(g, c, r) ? null : block('suburb')));
        add('valley', 'Valley', 'A town in a bowl: streets ease down to a park on the valley floor.', g);
    }
    // 18. Ridge: high along the middle, falling away to both sides.
    {
        let g: GridLayout = { ...sizes(even(6, 120), even(5, 120)), heightCurve: 'smooth' };
        for (let j = 0; j <= 5; j++) for (let i = 0; i <= 6; i++) g = gridSetHeight(g, gridNodeId(i, j), Math.max(0, 36 - Math.abs(i - 3) * 12));
        g = fillAll(g, (c) => block(c === 2 || c === 3 ? 'downtown' : 'residential'));
        add('ridge', 'Ridge', 'A main street along a ridge 36 m up; side streets fall away smoothly to both sides.', g);
    }
    // 19. Coastal slope: the town runs down to the sea, open at the shore.
    {
        let g: GridLayout = { ...sizes(even(6, 120), even(4, 110), 'open'), heightCurve: 'smooth' };
        for (let j = 0; j <= 4; j++) g = gridLiftLine(g, 'row', j, (4 - j) * 11, (4 - j) * 11 - 6);
        for (let i = 0; i < 6; i++) g = gridSetCurve(g, gridStreetId('x', i, 4), { lift: -3 });
        g = fillAll(g, (c, r) => block(r === 3 ? 'residential' : 'suburb'));
        add('coastal-slope', 'Coastal slope', 'Streets step down a hillside to an open seafront, the shore road dipping between blocks.', g);
    }

    // ------------------------------------------------------------------ infrastructure
    group = 'infrastructure';
    // 20. Interchange: the main avenues cross on bridges.
    {
        let g = sizes(even(4, 160), even(4, 160));
        g = gridSetJunction(g, gridNodeId(2, 2), { kind: 'bridgeX', clearance: 9 });
        g = gridSetJunction(g, gridNodeId(1, 2), { kind: 'bridgeY', clearance: 7 });
        g = gridSetJunction(g, gridNodeId(3, 2), { kind: 'bridgeY', clearance: 7 });
        g = round(g, 2, 1, 12); g = round(g, 2, 3, 12);
        g = fillAll(g, (c, r) => block(ring(g, c, r) < 0.6 ? 'downtown' : 'residential'));
        add('interchange', 'Interchange', 'The main avenues cross on bridges, with roundabouts where they meet the side streets.', g);
    }
    // 21. Flyover avenue: an elevated avenue across the whole town.
    {
        let g = sizes(even(6, 130), even(4, 130));
        for (let i = 1; i < 6; i++) g = gridSetJunction(g, gridNodeId(i, 2), { kind: 'bridgeX', clearance: 8 });
        for (let i = 0; i < 6; i++) g = gridSetCurve(g, gridStreetId('x', i, 2), { lift: 3 });
        g = fillAll(g, () => block('downtown'));
        add('flyover', 'Flyover avenue', 'An avenue flies over every cross street, arching between its piers.', g);
    }
    // 22. Hilltop circus: a big roundabout on a hilltop, its streets climbing to it.
    {
        let g: GridLayout = { ...sizes(even(4, 170), even(4, 170)), heightCurve: 'smooth' };
        for (let j = 0; j <= 4; j++) for (let i = 0; i <= 4; i++) g = gridSetHeight(g, gridNodeId(i, j), Math.max(0, 28 - Math.hypot(i - 2, j - 2) * 11));
        g = round(g, 2, 2, 28);
        g = round(g, 1, 1); g = round(g, 3, 1); g = round(g, 1, 3); g = round(g, 3, 3);
        g = fillAll(g, (c, r) => block(ring(g, c, r) < 0.6 ? 'downtown' : 'suburb'));
        add('hilltop-circus', 'Hilltop circus', 'A grand roundabout on a 28 m hilltop, level on its platform, its avenues climbing to it.', g);
    }

    // ------------------------------------------------------------------ terrain, second row (31 Oct 2026): heights as the idea
    group = 'terrain';
    // 23. Rolling hills: a sine × sine height field, smooth everywhere.
    {
        let g: GridLayout = { ...sizes(even(6, 120), even(6, 120)), heightCurve: 'smooth' };
        for (let j = 0; j <= 6; j++) for (let i = 0; i <= 6; i++) g = gridSetHeight(g, gridNodeId(i, j), Math.round(10 + 10 * Math.sin(i * 1.05) * Math.cos(j * 1.05)));
        g = fillAll(g, (c, r) => block(ring(g, c, r) < 0.5 ? 'residential' : 'suburb'));
        add('rolling-hills', 'Rolling hills', 'Streets ride a field of smooth hills and hollows, 20 m from trough to crest.', g);
    }
    // 24. Tilted town: one even slope from the north-west corner down to the south-east.
    {
        let g = sizes(even(5, 130), even(5, 130));
        for (let j = 0; j <= 5; j++) for (let i = 0; i <= 5; i++) g = gridSetHeight(g, gridNodeId(i, j), (10 - i - j) * 3);
        g = fillAll(g, () => block('residential'));
        add('tilted-town', 'Tilted town', 'The whole grid on one diagonal slope, 30 m of fall corner to corner.', g);
    }
    // 25. River valley: the middle column dips 12 m; the cross streets bridge it.
    {
        let g: GridLayout = { ...sizes(even(6, 120), even(4, 130)), heightCurve: 'smooth' };
        for (let j = 0; j <= 4; j++) for (let i = 0; i <= 6; i++) g = gridSetHeight(g, gridNodeId(i, j), Math.round(12 - 12 * Math.exp(-((i - 3) ** 2) / 1.6)));
        g = cut(g, gridStreetId('z', 3, 0), gridStreetId('z', 3, 1), gridStreetId('z', 3, 2), gridStreetId('z', 3, 3));
        g = gridSetFill(gridMerge(g, { col: 2, row: 0, cols: 2, rows: 4 }), [gridCellId(2, 0)], { kind: 'park' });
        g = fillAll(g, (c, r) => (gridIn(g, c, r) ? null : block('residential')));
        add('river-valley', 'River valley', 'A valley 12 m deep runs north–south through the town: a park along the river, the cross streets dipping over it.', g);
    }
    // 26. Sunken plaza: the central block's four corners 6 m down.
    {
        let g: GridLayout = { ...sizes(even(5, 120), even(5, 120)), heightCurve: 'smooth' };
        for (const id of ['2,2', '3,2', '2,3', '3,3']) g = gridSetHeight(g, id, -6);
        g = gridSetFill(g, [gridCellId(2, 2)], { kind: 'plaza' });
        g = fillAll(g, (c, r) => (c === 2 && r === 2 ? null : block('downtown')));
        add('sunken-plaza', 'Sunken plaza', 'The central plaza sits 6 m below the streets around it, which ease down to its corners.', g);
    }
    // 27. Hillside village: terraces up the slope, lanes bending along them, round corners.
    {
        let g: GridLayout = { ...sizes([110, 90, 120, 100], even(4, 90)), heightCurve: 'smooth' };
        for (let j = 0; j <= 4; j++) g = gridLiftLine(g, 'row', j, j * 8 + 2, j * 8 - 2);
        for (let j = 0; j <= 4; j++) for (let i = 0; i < 4; i++) g = side(g, gridStreetId('x', i, j), (i + j) % 2 ? 12 : -10);
        for (const id of ['0,0', '4,0', '0,4', '4,4']) g = gridSetCorner(g, id, 40);
        g = gridSetFill(g, [gridCellId(1, 2)], { kind: 'plaza' });
        g = fillAll(g, (c, r) => (c === 1 && r === 2 ? null : block('oldTown')));
        add('hillside-village', 'Hillside village', 'Terraced lanes bending along a 32 m slope, a square halfway up.', g);
    }
    // 28. Twin hills: two hilltops with a saddle between, a roundabout on each crest.
    {
        let g: GridLayout = { ...sizes(even(6, 140), even(4, 140)), heightCurve: 'smooth' };
        for (let j = 0; j <= 4; j++) for (let i = 0; i <= 6; i++) g = gridSetHeight(g, gridNodeId(i, j), Math.round(Math.max(0, 24 - Math.hypot(i - 1.5, j - 2) * 9, 18 - Math.hypot(i - 4.5, j - 2) * 8)));
        g = round(g, 2, 2, 14); g = round(g, 4, 2, 12);
        g = fillAll(g, (c, r) => block(ring(g, c, r) < 0.5 ? 'downtown' : 'suburb'));
        add('twin-hills', 'Twin hills', 'Two hilltops, 24 and 18 m, each crowned by a roundabout, a saddle street between them.', g);
    }
    group = 'infrastructure';
    // 29. Escarpment: the east half 18 m up, the main avenues bridging the step.
    {
        let g = sizes(even(6, 130), even(4, 130));
        for (let j = 0; j <= 4; j++) for (let i = 0; i <= 6; i++) g = gridSetHeight(g, gridNodeId(i, j), i >= 3 ? 18 : 0);
        for (let j = 1; j < 4; j++) g = gridSetJunction(g, gridNodeId(3, j), { kind: 'bridgeX', clearance: 8 });
        g = fillAll(g, (c) => block(c >= 3 ? 'residential' : 'downtown'));
        add('escarpment', 'Escarpment', 'The town steps 18 m up along a cliff line; the cross avenues bridge the step.', g);
    }
    // 30. Canyon avenue: one avenue 15 m below the grid, every cross street bridging it.
    {
        let g = sizes(even(5, 150), even(5, 130));
        for (let i = 0; i <= 5; i++) g = gridSetHeight(g, gridNodeId(i, 2), -15);
        for (let i = 1; i < 5; i++) g = gridSetJunction(g, gridNodeId(i, 2), { kind: 'bridgeY', clearance: 12 });
        g = fillAll(g, (c, r) => block(r === 1 || r === 2 ? 'downtown' : 'residential'));
        add('canyon-avenue', 'Canyon avenue', 'A sunken avenue 15 m below the town, every cross street flying over it.', g);
    }
    group = 'organic';
    // 31. Ripples: every east–west street bent the same way, in phase.
    {
        let g = sizes(even(5, 130), even(5, 120));
        for (let j = 0; j <= 5; j++) for (let i = 0; i < 5; i++) g = side(g, gridStreetId('x', i, j), 22);
        g = fillAll(g, () => block('residential'));
        add('ripples', 'Ripples', 'Every east–west street swings south in phase: a town of parallel waves.', g);
    }
    return out;
}

/** True when cell (c, r) is inside a merged rectangle (its fill lives on the merge's first cell). */
function gridIn(g: GridLayout, c: number, r: number): boolean {
    return (g.merged ?? []).some((m) => c >= m.col && c < m.col + m.cols && r >= m.row && r < m.row + m.rows);
}

/** The preset grids, in their groups (built once). */
export const GRID_PRESETS: readonly GridPreset[] = build();
