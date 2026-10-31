// =============================================================================
// URBAN OBJECTS — the context city kit (object type 'urban', config.type picks the variant)
// =============================================================================
//
// Generative city context placed from the catalog: a parametric building, a block of
// them, a road along a polyline, street furniture. Every variant draws with the family's
// own materials (components/urban/urbanCore in the viewer): a shared sun block read from
// the scene's sky / time of day, and a LAMP LIST — street lamps carry no THREE light; the
// surfaces the family owns light themselves from the lamps that reach them.
//
// Sizes are world metres in the config (a building's width, a road's lane width); the
// transform places and turns the object. The variant interfaces and the unions are
// appended by the integrator from each object spec (Claude outputs/integrate).
//


/** A texture set from the library on an urban surface: the set name, its map URLs
 *  (stored, so an embed without the library still renders) and the tile size in metres. */
export interface UrbanTextureRef {
    set: string;
    maps: { color?: string; normal?: string; roughness?: string; ao?: string; displacement?: string };
    tileSize: number;
}

/** 'auto' follows the scene sun (lights come on through dusk); 'day' / 'night' force it. */
export type UrbanLighting = 'auto' | 'day' | 'night';

export interface BaseUrbanObjectConfig {
    enabled: boolean;
    lighting: UrbanLighting;
}

export type UrbanObjectType = 'building' | 'road' | 'block' | 'streetFurniture' | 'skyline' | 'plaza' | 'junction' | 'traffic' | 'signage' | 'park' | 'parkingLot' | 'streetGrid';

/** A parametric building: nine footprints (box, L, U, courtyard, stepped, slab, podium tower, twin towers, cylinder), eight shader facades (curtain wall, punched, ribbon, brick, balconies, concrete panel, glass fins, industrial) and nine roofs (flat to pitched, hip, mansard, helipad, crown, green), with emissive rooms at night. Use for city context around a hero model. */
export interface BuildingUrbanConfig extends BaseUrbanObjectConfig {
    type: 'building';
    /** Box, L, U, a ring around a courtyard, stepped setbacks, a long slab, a tower or twin towers on a podium, or a round tower. */
    footprint: 'box' | 'lShape' | 'podiumTower' | 'uShape' | 'courtyard' | 'stepped' | 'slab' | 'twinTowers' | 'cylinder';
    /** Footprint width in metres (x). */
    width: number;
    /** Footprint depth in metres (z). */
    depth: number;
    /** Number of floors; the height is floors x floor height (the lobby is 1.6 floors). */
    floors: number;
    /** Height of one floor in metres. */
    floorHeight: number;
    /** A taller glazed ground floor with doors. */
    lobby: boolean;
    /** Flat, parapet, parapet plus a plant box, a pitched gable, a hip, a mansard, a helipad, a crown that glows at night, or a green roof. */
    roof: 'flat' | 'parapet' | 'mechanical' | 'pitched' | 'hip' | 'mansard' | 'helipad' | 'crown' | 'green';
    /** Which windows are lit at night and where the roof box sits. */
    seed: number;
    /** Window pattern: curtain wall, punched, ribbon, brick with lintels, recessed balconies, concrete panels, glass with vertical fins, or industrial with roller doors. */
    facade: 'curtainWall' | 'punched' | 'ribbon' | 'brick' | 'balconies' | 'concretePanel' | 'glassFins' | 'industrial';
    /** How much of each bay and floor is glass. */
    windowRatio: number;
    /** Nominal width of one window bay in metres; bays are fitted to the face. */
    bayWidth: number;
    /** Width of the window frames and slab lines in metres. */
    mullionWidth: number;
    /** Average wall colour; a texture only adds grain and relief. */
    wallColor: string;
    /** Glass tint. */
    glassColor: string;
    /** How much sky the glass reflects. */
    glassReflect: number;
    /** Mullion and frame colour. */
    mullionColor: string;
    /** Colour of the roof surface. */
    roofColor: string;
    /** A texture set from the library for the wall (concrete, brick, stone, plaster). */
    texture: UrbanTextureRef;
    /** Strength of the wall texture normal map. */
    textureStrength: number;
    /** Share of windows lit at night. */
    windowLights: number;
    /** Share of lit rooms in the warm colour; the rest take the cool colour. */
    lightWarmth: number;
    /** Warm room light. */
    lightColor: string;
    /** Cool room light. */
    coolLightColor: string;
    /** Brightness of the lit windows. */
    windowGlow: number;
    /** How often rooms switch their lights on or off at night (0 = frozen, 1 = every room re-rolls every 20-80 s). */
    flicker: number;
}

/** A street along a polyline: lanes with dashed or solid markings, zebra crossings, kerbed sidewalks and street lamps at a spacing, all from the texture library; lamps light the asphalt at night. Use for the streets of a city block. */
export interface RoadUrbanConfig extends BaseUrbanObjectConfig {
    type: 'road';
    /** The road path as [x, z] metres in the object space; two or more points. */
    points: number[][];
    /** 0 keeps the corners sharp, 1 rounds the path through the points. */
    curve: number;
    /** Number of lanes (all directions). */
    lanes: number;
    /** Width of one lane in metres. */
    laneWidth: number;
    /** Dashed, solid, double or no centre line. */
    markings: 'dashed' | 'solid' | 'double' | 'none';
    /** Dashed lines between lanes. */
    laneLines: boolean;
    /** Solid lines along the kerbs. */
    edgeLines: boolean;
    /** Zebra crossings and stop lines at both ends. */
    crosswalks: boolean;
    /** Colour of the road paint. */
    markingColor: string;
    /** Tyre tracks and chipped paint. */
    wear: number;
    /** Average asphalt colour. */
    asphaltColor: string;
    /** Asphalt or road texture set from the library. */
    texture: UrbanTextureRef;
    /** Sidewalk width in metres on both sides; 0 for none. */
    sidewalk: number;
    /** Kerb height in metres. */
    kerbHeight: number;
    /** Average sidewalk colour. */
    sidewalkColor: string;
    /** Paving texture set for the sidewalks. */
    sidewalkTexture: UrbanTextureRef;
    /** Metres between street lamps; 0 for no lamps. */
    lampSpacing: number;
    /** Which side of the road the lamps stand on. */
    lampSide: 'both' | 'left' | 'right' | 'alternate' | 'none';
    /** Pole height in metres. */
    lampHeight: number;
    /** Colour of the lamp light. */
    lampColor: string;
    /** How far a lamp pool reaches in metres. */
    lampRadius: number;
    /** Brightness of the lamp pools and heads. */
    lampIntensity: number;
    /** Colour of the poles. */
    lampPaint: string;
    /** Wear and grain pattern. */
    seed: number;
}

/** A grid of parametric buildings on a paved or lawn plot, with its own small lit streets through the middle (a cross or one way), drawn from a city mix (downtown, residential, old town, industrial, suburb) or the block's own knobs with jittered footprints, heights, facades and tints, as one instanced mesh with emissive windows at night. Use for filling a city around a hero model in a few clicks. */
export interface BlockUrbanConfig extends BaseUrbanObjectConfig {
    type: 'block';
    /** A city character that picks footprints, facades, roofs and floors per building: downtown, residential, old town, industrial or suburb. Custom varies the block's own building knobs. */
    mix: 'custom' | 'downtown' | 'residential' | 'oldTown' | 'industrial' | 'suburb';
    /** Buildings along x. */
    columns: number;
    /** Buildings along z. */
    rows: number;
    /** Space between buildings in metres. */
    gap: number;
    /** How much footprints shrink and slide inside their cell. */
    sizeJitter: number;
    /** Lowest building. */
    floorsMin: number;
    /** Tallest building. */
    floorsMax: number;
    /** 0: every building like the block settings; 1: footprints, facades, tints and roofs vary per building. */
    facadeMix: number;
    /** The ground under the block: paving, lawn or nothing. */
    plot: 'paved' | 'lawn' | 'none';
    /** How far the plot extends past the buildings. */
    plotMargin: number;
    /** Average colour of the paving. */
    plotColor: string;
    /** Paving texture set from the library. */
    plotTexture: UrbanTextureRef;
    /** Reshuffles the block. */
    seed: number;
    /** Small streets through the block: a cross through the middle (with a junction), one along x (between the centre rows), one along z (between the centre columns), or none. */
    streets: 'none' | 'cross' | 'alongX' | 'alongZ';
    /** Lanes on a block street, both directions together. */
    streetLanes: number;
    /** Width of one lane in metres. */
    streetLaneWidth: number;
    /** Pavement width on each side in metres (0 = none). */
    streetSidewalk: number;
    /** Asphalt set from the library. */
    streetTexture: UrbanTextureRef;
    /** Average asphalt colour of the block streets. */
    streetAsphaltColor: string;
    /** Colour of the lane lines and zebras. */
    streetMarkingColor: string;
    /** Street lamps along the block streets and on the junction corners; they light the streets, the plot and the facades at night. */
    streetLamps: boolean;
    /** Metres between lamps along a block street. */
    streetLampSpacing: number;
    /** Height of the lamp heads in metres. */
    streetLampHeight: number;
    /** Colour of the lamp light. */
    streetLampColor: string;
    /** How far each lamp lights, in metres. */
    streetLampRadius: number;
    /** Brightness of the lamp pools. */
    streetLampIntensity: number;
    /** Box, L, U, a ring around a courtyard, stepped setbacks, a long slab, a tower or twin towers on a podium, or a round tower. */
    footprint: 'box' | 'lShape' | 'podiumTower' | 'uShape' | 'courtyard' | 'stepped' | 'slab' | 'twinTowers' | 'cylinder';
    /** Footprint width in metres (x). */
    width: number;
    /** Footprint depth in metres (z). */
    depth: number;
    /** Height of one floor in metres. */
    floorHeight: number;
    /** A taller glazed ground floor with doors. */
    lobby: boolean;
    /** Flat, parapet, parapet plus a plant box, a pitched gable, a hip, a mansard, a helipad, a crown that glows at night, or a green roof. */
    roof: 'flat' | 'parapet' | 'mechanical' | 'pitched' | 'hip' | 'mansard' | 'helipad' | 'crown' | 'green';
    /** Window pattern: curtain wall, punched, ribbon, brick with lintels, recessed balconies, concrete panels, glass with vertical fins, or industrial with roller doors. */
    facade: 'curtainWall' | 'punched' | 'ribbon' | 'brick' | 'balconies' | 'concretePanel' | 'glassFins' | 'industrial';
    /** How much of each bay and floor is glass. */
    windowRatio: number;
    /** Nominal width of one window bay in metres; bays are fitted to the face. */
    bayWidth: number;
    /** Width of the window frames and slab lines in metres. */
    mullionWidth: number;
    /** Average wall colour; a texture only adds grain and relief. */
    wallColor: string;
    /** Glass tint. */
    glassColor: string;
    /** How much sky the glass reflects. */
    glassReflect: number;
    /** Mullion and frame colour. */
    mullionColor: string;
    /** Colour of the roof surface. */
    roofColor: string;
    /** A texture set from the library for the wall (concrete, brick, stone, plaster). */
    texture: UrbanTextureRef;
    /** Strength of the wall texture normal map. */
    textureStrength: number;
    /** Share of windows lit at night. */
    windowLights: number;
    /** Share of lit rooms in the warm colour; the rest take the cool colour. */
    lightWarmth: number;
    /** Warm room light. */
    lightColor: string;
    /** Cool room light. */
    coolLightColor: string;
    /** Brightness of the lit windows. */
    windowGlow: number;
    /** How often rooms switch their lights on or off at night (0 = frozen, 1 = every room re-rolls every 20-80 s). */
    flicker: number;
}

/** One piece of street furniture by kind: a street lamp with an emissive head that lights nearby roads and facades at night, a slatted bench, a bollard or a bus shelter with a lit panel. Use for the pavements and plazas of a city scene. */
export interface StreetFurnitureUrbanConfig extends BaseUrbanObjectConfig {
    type: 'streetFurniture';
    /** Street lamp, bench, bollard or bus shelter. */
    kind: 'lamp' | 'bench' | 'bollard' | 'shelter';
    /** Scale; 1 is real-world size. */
    size: number;
    /** Painted metal colour. */
    paint: string;
    /** Wood slats and glass tint. */
    accentColor: string;
    /** Colour of the light (lamp, shelter panel, bollard band). */
    lampColor: string;
    /** How far the light pool reaches in metres. */
    lampRadius: number;
    /** Brightness of the pool and the head. */
    lampIntensity: number;
    /** Also add a real point light at the head (for up to ~4 hero lamps in a scene; every real light costs on every lit material). */
    realLight: boolean;
}

/** A far belt of hundreds of parametric buildings on a ring around the scene, varied in footprint, height, facade and tint, drawn as one instanced mesh with lit windows at night. Use for the city horizon behind a hero building or block. */
export interface SkylineUrbanConfig extends BaseUrbanObjectConfig {
    type: 'skyline';
    /** A city character for the belt's footprints, facades and roofs (downtown, residential, old town, industrial, suburb); custom uses the belt settings with variety. */
    mix: 'custom' | 'downtown' | 'residential' | 'oldTown' | 'industrial' | 'suburb';
    /** Distance of the belt from the object centre in metres. */
    radius: number;
    /** How deep the belt is (buildings scatter radius ± depth / 2). */
    spread: number;
    /** Where the belt begins, in degrees around the centre. */
    arcStart: number;
    /** How many degrees the belt covers (360 = all around). */
    arcSpan: number;
    /** Number of buildings in the belt (one draw call whatever the count). */
    count: number;
    /** Lowest building in metres. */
    heightMin: number;
    /** Tallest building in metres; most are near the minimum, a few reach this. */
    heightMax: number;
    /** Typical footprint width in metres. */
    width: number;
    /** Typical footprint depth in metres. */
    depth: number;
    /** How much footprints vary around the typical size. */
    sizeJitter: number;
    /** The belt's base window pattern; variety mixes the others in. */
    facade: 'curtainWall' | 'punched' | 'ribbon' | 'brick' | 'balconies' | 'concretePanel' | 'glassFins' | 'industrial';
    /** 0: every building like the belt settings; 1: footprints, facades and tints vary per building. */
    facadeMix: number;
    /** How much of each bay and floor is glass. */
    windowRatio: number;
    /** Nominal width of one window bay in metres. */
    bayWidth: number;
    /** Share of windows lit at night. */
    windowLights: number;
    /** Reshuffles the belt. */
    seed: number;
    /** Average wall colour; a texture only adds grain and relief. */
    wallColor: string;
    /** Glass tint. */
    glassColor: string;
    /** How much sky the glass reflects. */
    glassReflect: number;
    /** Mullion and frame colour. */
    mullionColor: string;
    /** Colour of the roof surface. */
    roofColor: string;
    /** A texture set from the library for the wall (concrete, brick, stone, plaster). */
    texture: UrbanTextureRef;
    /** Strength of the wall texture normal map. */
    textureStrength: number;
    /** Share of lit rooms in the warm colour; the rest take the cool colour. */
    lightWarmth: number;
    /** Warm room light. */
    lightColor: string;
    /** Cool room light. */
    coolLightColor: string;
    /** Brightness of the lit windows. */
    windowGlow: number;
    /** How often rooms switch their lights on or off at night (0 = frozen, 1 = every room re-rolls every 20-80 s). */
    flicker: number;
}

/** A paved area inside a polygon: a library paving set with a second set laid in a grid, stripe, ring or checker pattern in metres, a kerb around the edge, lit by the street lamps at night. Use for a hero building's forecourt, a square or a courtyard. */
export interface PlazaUrbanConfig extends BaseUrbanObjectConfig {
    type: 'plaza';
    /** The plaza outline as [x, z] metres in the object space; three or more points. */
    points: number[][];
    /** 0 keeps the corners sharp, 1 rounds the outline through the points. */
    curve: number;
    /** A kerb around the edge, in the pattern set. */
    kerb: boolean;
    /** Height of the slab and kerb above the ground in metres. */
    kerbHeight: number;
    /** The main paving set from the library. */
    texture: UrbanTextureRef;
    /** Average colour of the main paving. */
    color: string;
    /** How the second set is laid: none, a grid of bands, stripes, rings from the centre, or a checker of cells. */
    pattern: 'none' | 'grid' | 'stripes' | 'rings' | 'checker';
    /** Metres between bands (or the checker cell size). */
    patternSpacing: number;
    /** Width of a band in metres. */
    patternWidth: number;
    /** Turns the pattern, in degrees. */
    patternAngle: number;
    /** The second paving set, used for the pattern bands and the kerb. */
    bandTexture: UrbanTextureRef;
    /** Average colour of the pattern bands and the kerb. */
    bandColor: string;
    /** Large-scale tone variation. */
    seed: number;
}

/** A road intersection, cross, T or roundabout, with rounded kerb corners, lane markings, stop lines and zebra crossings on each arm, cycling traffic signals and a street lamp on each corner that lights the crossing at night; roads of the same width end at its arms. Use for where the streets of a city block meet. */
export interface JunctionUrbanConfig extends BaseUrbanObjectConfig {
    type: 'junction';
    /** A four-way cross, a T (no south arm), a roundabout, or a three-arm roundabout (no south arm). */
    shape: 'cross' | 'tee' | 'roundabout' | 'roundabout3';
    /** Roundabouts: radius of the lawn island in metres; the ring road runs around it, one road wide. */
    islandRadius: number;
    /** Lanes of the roads that meet here (all arms). */
    lanes: number;
    /** Width of one lane in metres — match the roads. */
    laneWidth: number;
    /** How far each arm stub reaches from the box; roads end here. */
    armLength: number;
    /** Radius of the rounded kerb corners. */
    cornerRadius: number;
    /** Zebra crossings and stop lines on every arm. */
    crossings: boolean;
    /** Colour of the road paint. */
    markingColor: string;
    /** Tyre tracks and chipped paint. */
    wear: number;
    /** Average asphalt colour. */
    asphaltColor: string;
    /** Asphalt or road texture set from the library. */
    texture: UrbanTextureRef;
    /** Corner pavements with kerbs. */
    sidewalk: boolean;
    /** Kerb height in metres. */
    kerbHeight: number;
    /** Average pavement colour. */
    sidewalkColor: string;
    /** Paving texture set for the corners. */
    sidewalkTexture: UrbanTextureRef;
    /** Traffic lights on the corners. */
    signals: boolean;
    /** Seconds for one full green-amber-red cycle of both axes. */
    signalCycle: number;
    /** Pole height in metres. */
    signalHeight: number;
    /** Colour of the poles and heads. */
    signalPaint: string;
    /** A street lamp on each corner, lighting the crossing at night. */
    lamps: boolean;
    /** Lamp height in metres. */
    lampHeight: number;
    /** Colour of the lamp posts. */
    lampPaint: string;
    /** Colour of the lamp light. */
    lampColor: string;
    /** Brightness of the light pools at night. */
    lampIntensity: number;
    /** How far a lamp lights the ground and the facades. */
    lampRadius: number;
    /** Wear and grain pattern. */
    seed: number;
}

/** Streams of head and tail lights moving along a road path at night, lanes running both ways, as instanced glowing sprites with no car geometry. Use for living streets in night shots of a city scene. */
export interface TrafficUrbanConfig extends BaseUrbanObjectConfig {
    type: 'traffic';
    /** The traffic path as [x, z] metres in the object space — copy the road's points. */
    points: number[][];
    /** 0 keeps the corners sharp, 1 rounds the path (match the road). */
    curve: number;
    /** Lanes, both directions; the right-hand half runs forward, the other back. */
    lanes: number;
    /** Width of one lane in metres. */
    laneWidth: number;
    /** Cars per 100 m per lane. */
    density: number;
    /** Travel speed in km/h. */
    speed: number;
    /** How unevenly the cars are spaced. */
    jitter: number;
    /** Colour of the head lamps. */
    headlightColor: string;
    /** Colour of the tail lamps. */
    taillightColor: string;
    /** Brightness of the lamps. */
    intensity: number;
    /** Size of the lamp sprites. */
    size: number;
    /** Small low-poly cars under the lamps, day and night (one instanced draw per street). */
    showCars: boolean;
    /** Reshuffles the cars. */
    seed: number;
}

/** A billboard on posts, a street totem or a rooftop sign carrying a picture of your choice, lit as a print by day and backlit at night, spilling a little light on the ground. Use for branding a development, a sales office or a shop in a city scene. */
export interface SignageUrbanConfig extends BaseUrbanObjectConfig {
    type: 'signage';
    /** A billboard on two posts, a street totem on a plinth, or a rooftop sign on a truss. */
    kind: 'billboard' | 'totem' | 'rooftop';
    /** Panel width in metres. */
    width: number;
    /** Panel height in metres. */
    height: number;
    /** Height of the panel's bottom edge above the base (billboard, rooftop). */
    elevation: number;
    /** Show the picture on the back as well. */
    doubleSided: boolean;
    /** The picture on the panel (an image from your assets). */
    imageUrl: string;
    /** Panel colour behind / without a picture. */
    color: string;
    /** Frame, posts and truss colour. */
    frameColor: string;
    /** How strongly the panel glows at night. */
    glow: number;
}

/** A lawn inside a polygon with a looping paved path, an optional cross path, a kerb and short park lamps that light it at night; add trees and benches with the vegetation and street furniture objects. Use for the green between city blocks or a square in front of a hero building. */
export interface ParkUrbanConfig extends BaseUrbanObjectConfig {
    type: 'park';
    /** The park outline as [x, z] metres in the object space; three or more points. */
    points: number[][];
    /** 0 keeps the corners sharp, 1 rounds the outline through the points. */
    curve: number;
    /** A kerb around the lawn, in the path set. */
    kerb: boolean;
    /** Height of the lawn and kerb above the ground. */
    kerbHeight: number;
    /** Lawn colour (the lawn has its own grain; no texture). */
    lawnColor: string;
    /** How far inside the outline the path loop runs (fraction toward the centre). */
    pathInset: number;
    /** Width of the path in metres. */
    pathWidth: number;
    /** A straight path across the loop between its two farthest points. */
    crossPath: boolean;
    /** Paving set for the path and the kerb. */
    pathTexture: UrbanTextureRef;
    /** Average path colour. */
    pathColor: string;
    /** Average kerb colour. */
    kerbColor: string;
    /** Metres between park lamps along the loop. */
    lampSpacing: number;
    /** Park lamp height in metres. */
    lampHeight: number;
    /** Colour of the lamp posts. */
    lampPaint: string;
    /** Colour of the lamp light. */
    lampColor: string;
    /** Brightness of the light pools at night. */
    lampIntensity: number;
    /** How far a lamp lights the lawn. */
    lampRadius: number;
}

/** A surface car park: marked bays around aisles on asphalt from the texture library, a kerb, tall lamps that light it at night and a crowd of low-poly parked cars at a set occupancy, all instanced. Use for the ground around offices, malls and stations in a city scene. */
export interface ParkingLotUrbanConfig extends BaseUrbanObjectConfig {
    type: 'parkingLot';
    /** Lot width in metres (bays run along it). */
    width: number;
    /** Lot depth in metres (modules of two bay rows and an aisle stack along it). */
    depth: number;
    /** Width of one parking bay. */
    bayWidth: number;
    /** Depth of one parking bay. */
    bayDepth: number;
    /** Width of the driving aisle between two bay rows. */
    aisle: number;
    /** Share of bays with a car in them. */
    cars: number;
    /** Scale of the parked cars. */
    carScale: number;
    /** Which bays are taken and the paint of each car. */
    seed: number;
    /** Asphalt set from the library. */
    texture: UrbanTextureRef;
    /** Average asphalt colour. */
    asphaltColor: string;
    /** Colour of the bay lines. */
    markingColor: string;
    /** How chipped the markings are. */
    wear: number;
    /** A kerb around the lot. */
    kerb: boolean;
    /** Kerb height in metres. */
    kerbHeight: number;
    /** Average kerb colour. */
    kerbColor: string;
    /** Paving set for the kerb. */
    kerbTexture: UrbanTextureRef;
    /** Metres between lamps along each aisle. */
    lampSpacing: number;
    /** Lamp height in metres. */
    lampHeight: number;
    /** Colour of the lamp posts. */
    lampPaint: string;
    /** Colour of the lamp light. */
    lampColor: string;
    /** Brightness of the light pools at night. */
    lampIntensity: number;
    /** How far a lamp lights the ground. */
    lampRadius: number;
}

/** A whole street grid as one object, drawn from a grid layout (uneven cell sizes, merged cells for parks, removed or bent streets) or a quick columns x rows of junctions a pitch apart, roads between them ending at the junction arms, tees and rounded corners on the edge (or open stubs), signals, lamps and traffic on every street, with the road family's surfaces and night lighting. Use for the streets of a city in one click, then fill the cells with blocks, parks and parking. */
export interface StreetGridUrbanConfig extends BaseUrbanObjectConfig {
    type: 'streetGrid';
    /** The grid it draws, by reference: 'preset:<id>' (a built-in grid) or a saved grid's asset id (a `layout` asset of kind 'grid'). */
    layoutId: string;
    /** Ground under the grid's grounds (cells grounded in the grid editor): a texture set; none = a lawn. */
    groundTexture: UrbanTextureRef;
    /** Colour of the grounds that have no texture (a lawn). A textured ground shows its texture in its own colours. */
    groundColor: string;
    /** Per ground (by its id in the grid, e.g. 'g1'): a texture set instead of Ground texture. */
    groundTextures: Record<string, UrbanTextureRef>;
    /** Lanes on every street, both directions together. */
    lanes: number;
    /** Width of one lane in metres. */
    laneWidth: number;
    /** Length of each junction arm (stop line, zebra) before the road starts. */
    armLength: number;
    /** Rounding of the junction kerb corners. */
    cornerRadius: number;
    /** Wear, lamp and traffic variation. */
    seed: number;
    /** Asphalt set from the library. */
    texture: UrbanTextureRef;
    /** Average asphalt colour. */
    asphaltColor: string;
    /** Colour of lane lines, stop lines and zebras. */
    markingColor: string;
    /** How worn the markings and wheel tracks are. */
    wear: number;
    /** Zebra crossings on the junction arms. */
    crossings: boolean;
    /** Sidewalk width in metres (0 = none). */
    sidewalk: number;
    /** Kerb height in metres. */
    kerbHeight: number;
    /** Average sidewalk colour. */
    sidewalkColor: string;
    /** Paving set for the sidewalks and junction corners. */
    sidewalkTexture: UrbanTextureRef;
    /** Traffic signals on every junction. */
    signals: boolean;
    /** Seconds for one full green-amber-red cycle. */
    signalCycle: number;
    /** Colour of the signal poles and heads. */
    signalPaint: string;
    /** Street lamps along the roads and on every junction corner. */
    lamps: boolean;
    /** Metres between lamps along a road. */
    lampSpacing: number;
    /** Lamp height in metres. */
    lampHeight: number;
    /** Colour of the lamp posts. */
    lampPaint: string;
    /** Colour of the lamp light. */
    lampColor: string;
    /** Brightness of the light pools at night. */
    lampIntensity: number;
    /** How far a lamp lights the ground and the facades. */
    lampRadius: number;
    /** Cars per 100 m per lane (0 = none). */
    traffic: number;
    /** Small low-poly cars under the head and tail lights, day and night (cheap: one instanced draw per street). Off = only the lights at night. */
    showCars: boolean;
    /** Traffic speed in km/h. */
    speed: number;
}

export type UrbanObjectConfig = ({ type: 'building' } & BuildingUrbanConfig) | ({ type: 'road' } & RoadUrbanConfig) | ({ type: 'block' } & BlockUrbanConfig) | ({ type: 'streetFurniture' } & StreetFurnitureUrbanConfig) | ({ type: 'skyline' } & SkylineUrbanConfig) | ({ type: 'plaza' } & PlazaUrbanConfig) | ({ type: 'junction' } & JunctionUrbanConfig) | ({ type: 'traffic' } & TrafficUrbanConfig) | ({ type: 'signage' } & SignageUrbanConfig) | ({ type: 'park' } & ParkUrbanConfig) | ({ type: 'parkingLot' } & ParkingLotUrbanConfig) | ({ type: 'streetGrid' } & StreetGridUrbanConfig);
