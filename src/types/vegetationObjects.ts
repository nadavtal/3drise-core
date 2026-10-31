// =============================================================================
// VEGETATION OBJECTS — procedural plants (object type 'vegetation', config.type picks the variant)
// =============================================================================
//
// Trees, shrubs, grass, flowers, crops, climbers, hedges and produce, built procedurally in
// the viewer (components/vegetation): branching skeletons, instanced leaf cards with shaped
// outlines and vein relief, lathe-profiled fruit and vegetables, blades, blossom. They are
// lit by the scene's lights like meshes (MeshStandardMaterial with the family's code injected)
// and cast and receive shadows; the materials are the family's own (no Material tab).
//
// Size contract: a plant is built in the unit box (x / z in [-0.5, 0.5], y in [0, 1], the
// ground at y = 0) and the transform scale is its width and height — the skeleton follows the
// box, local shapes (leaves, fruit, blades) stay isotropic. Knobs describe the plant, never
// the box. The variant interfaces and the unions are appended by the integrator from each
// object spec (Claude outputs/integrate).
//

export type VegetationQuality = 'low' | 'medium' | 'high';

export interface BaseVegetationObjectConfig {
    enabled: boolean;
    /** Detail level: scales leaf / blade / piece counts (structural). */
    quality: VegetationQuality;
    /** Random layout (structural). */
    seed: number;
    /** Leaf colour (produce: the skin tint). */
    color: string;
    /** Colour of the leaves in shade (produce: the greens). */
    shadeColor: string;
    opacity: number;
    /** Time scale of the wind motion (integrated, so animating it never jumps). */
    speed?: number;
    /** Mean wind, 0..1 (the environment family's range; 1 = 8 m/s). */
    windStrength?: number;
    /** Compass direction the wind blows toward, degrees. */
    windDirection?: number;
    /** Gustiness on top of the wind, 0..1. */
    turbulence?: number;
}

export type VegetationObjectType = 'tree' | 'bush' | 'grass' | 'flowers' | 'crops' | 'ivy' | 'hedge' | 'fruit' | 'vegetable' | 'forest';

/** A parametric tree: a species' branching skeleton (oak, pine, birch, willow, palm, maple, cypress) with ridged bark, shaped leaves that turn with the season and let go, hanging fruit that ripens, and hierarchical wind. Use for parks, forests, gardens and any outdoor scene. */
export interface TreeVegetationConfig extends BaseVegetationObjectConfig {
    type: 'tree';
    /** The plant: its skeleton, leaf shape and default colours. Colours left at a species default follow the species. */
    species: 'oak' | 'maple' | 'pine' | 'birch' | 'willow' | 'palm' | 'cypress' | 'olive' | 'cherryBlossom' | 'magnolia' | 'jacaranda' | 'acacia' | 'baobab' | 'spruce' | 'poplar' | 'eucalyptus' | 'bare';
    /** Trunk length relative to the species, 0.4..2: a short stocky trunk or a tall clear one. */
    trunkRatio: number;
    /** How many branches each level carries relative to the species. */
    branchiness: number;
    /** Gravity on the branches: negative lifts them, positive hangs them (weeping). */
    droop: number;
    /** Wander of the branches: 0 straight, 1 gnarled. */
    twist: number;
    /** Leaf (blade, plant) count relative to the species; thinner foliage grows larger cards to keep the cover. */
    density: number;
    /** Leaf outline; auto takes the species' own. */
    leafType: 'auto' | 'broadleaf' | 'lobed' | 'needles' | 'round' | 'lanceolate' | 'frond' | 'heart' | 'maple';
    /** Leaf size relative to the species. */
    leafSize: number;
    /** How much of the foliage is there, 0 bare .. 1 full. */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** Share of the leaves letting go and falling, 0..1. */
    leafFall: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
    /** Amount of blossom, 0 none .. 1 full bloom. */
    flowers: number;
    /** Blossom colour; white follows the species. */
    flowerColor: string;
    /** Detail with distance: auto thins and flattens the leaves far away, then swaps in a lit impostor card; full never reduces (a hero plant); impostor always shows the card. */
    lod: 'auto' | 'full' | 'impostor';
    /** Fruit hanging in the crown (none for no fruit). */
    fruit: 'none' | 'apple' | 'orange' | 'lemon' | 'cherry' | 'pear' | 'plum' | 'berry' | 'rosehip';
    /** How much fruit, 0..1. */
    fruitAmount: number;
    /** Ripening, 0 unripe .. 1 ripe: the skin turns between the kind's two colours. */
    ripeness: number;
    /** Ripe fruit colour; white keeps the kind's own. */
    fruitColor: string;
    /** Bark / stem colour; a species default follows the species. */
    barkColor: string;
}

/** A shrub grown from basal stems arching from the ground: a species' habit (boxwood, wild shrub, lavender, hydrangea, fern, juniper), dense shaped leaves, flower heads and berries, seasonal colour and wind. Use for gardens, hedgerows, undergrowth and planters. */
export interface BushVegetationConfig extends BaseVegetationObjectConfig {
    type: 'bush';
    /** The plant: its skeleton, leaf shape and default colours. Colours left at a species default follow the species. */
    species: 'wildShrub' | 'boxwood' | 'lavender' | 'hydrangea' | 'fern' | 'juniper' | 'rose' | 'azalea' | 'holly' | 'hibiscus' | 'bougainvillea' | 'rosemary' | 'sage' | 'heather' | 'yucca' | 'hosta' | 'bamboo' | 'camellia' | 'forsythia' | 'lilac' | 'oleander' | 'agave';
    /** How many stems rise from the base. */
    stems: number;
    /** How wide the stems lean out from the base, 0 upright .. 1 sprawling. */
    spread: number;
    /** Wander of the branches: 0 straight, 1 gnarled. */
    twist: number;
    /** Leaf count relative to the species; thinner foliage grows larger cards to keep the cover. */
    density: number;
    /** Leaf outline; auto takes the species' own. */
    leafType: 'auto' | 'broadleaf' | 'lobed' | 'needles' | 'round' | 'lanceolate' | 'frond' | 'heart';
    /** Leaf size relative to the species. */
    leafSize: number;
    /** How much of the foliage is there, 0 bare .. 1 full. */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** Share of the leaves letting go and falling, 0..1. */
    leafFall: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
    /** Amount of blossom, 0 none .. 1 full bloom. */
    flowers: number;
    /** Blossom colour; white follows the species. */
    flowerColor: string;
    /** Fruit hanging in the crown (none for no fruit). */
    fruit: 'none' | 'apple' | 'orange' | 'lemon' | 'cherry' | 'pear' | 'plum' | 'berry' | 'rosehip';
    /** How much fruit, 0..1. */
    fruitAmount: number;
    /** Ripening, 0 unripe .. 1 ripe: the skin turns between the kind's two colours. */
    ripeness: number;
    /** Ripe fruit colour; white keeps the kind's own. */
    fruitColor: string;
    /** Bark / stem colour; a species default follows the species. */
    barkColor: string;
    /** Detail with distance: auto thins and flattens the leaves far away, then swaps in a lit impostor card; full never reduces (a hero plant); impostor always shows the card. */
    lod: 'auto' | 'full' | 'impostor';
}

/** A field of bent grass blades in tufts and patches, with waves running through it in the wind, drying from the tips with the season, and scattered meadow flowers. Use for lawns, meadows, verges and any ground that should not be bare. */
export interface GrassVegetationConfig extends BaseVegetationObjectConfig {
    type: 'grass';
    /** 0 spreads the plants evenly, 1 gathers them into tufts with bare ground between. */
    clumping: number;
    /** Blade count relative to the default. */
    density: number;
    /** Share of the tufts carrying a meadow flower (structural). */
    flowers: number;
    /** Blade length in metres. */
    bladeHeight: number;
    /** Blade width relative to the species. */
    bladeWidth: number;
    /** How far the blades bend over from the vertical. */
    lean: number;
    /** How much of the grass is there, 0 bare .. 1 full. */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
    /** Growth stage, 0 seedlings .. 1 fully grown. */
    growth: number;
    /** Blossom colour; white follows the species. */
    flowerColor: string;
}

/** A bed or meadow of one flower species (daisy, tulip, poppy, sunflower, cosmos, lavender): stalks, petal heads that open from buds with the bloom knob, centres and leaves, nodding in the wind. Use for gardens, meadows, parks and planters. */
export interface FlowersVegetationConfig extends BaseVegetationObjectConfig {
    type: 'flowers';
    /** The plant: its skeleton, leaf shape and default colours. Colours left at a species default follow the species. */
    species: 'daisy' | 'tulip' | 'poppy' | 'sunflower' | 'cosmos' | 'lavender' | 'rose' | 'peony' | 'lily' | 'iris' | 'dandelion' | 'dandelionPuff' | 'allium' | 'clover' | 'bluebell' | 'foxglove' | 'lupine' | 'marigold' | 'chrysanthemum' | 'carnation' | 'gerbera' | 'anemone' | 'buttercup' | 'pansy' | 'crocus' | 'hibiscus' | 'lotus' | 'zinnia' | 'aster' | 'cornflower' | 'snapdragon' | 'orchid';
    /** 0 spreads the plants evenly, 1 gathers them into tufts with bare ground between. */
    clumping: number;
    /** Leaf (blade, plant) count relative to the species; thinner foliage grows larger cards to keep the cover. */
    density: number;
    /** Grass and leaves between the flowers, 0 none .. 1 a meadow. */
    undergrowth: number;
    /** How open the flower heads are, 0 buds .. 1 fully open. */
    bloom: number;
    /** Stem height relative to the species. */
    stemHeight: number;
    /** Flower head size relative to the species. */
    headSize: number;
    /** Leaf size relative to the species. */
    leafSize: number;
    /** How much of the foliage is there, 0 bare .. 1 full. */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
    /** Growth stage, 0 seedlings .. 1 fully grown. */
    growth: number;
    /** Petal colour; a species default follows the species. */
    flowerColor: string;
    /** Colour of the flower centres. */
    centerColor: string;
}

/** A planted bed: rows of one crop (tomato, pepper, corn, lettuce, cabbage, pumpkin, strawberry) on ridged soil, each plant a small branching model with its leaves and its produce, grown from seedlings with the growth knob and ripened with ripeness. Use for farms, gardens, greenhouses and food scenes. */
export interface CropsVegetationConfig extends BaseVegetationObjectConfig {
    type: 'crops';
    /** The crop: plant form, produce kind, row habit and default colours. */
    species: 'tomato' | 'pepper' | 'corn' | 'lettuce' | 'cabbage' | 'pumpkin' | 'strawberry' | 'eggplant' | 'chili' | 'cucumber' | 'zucchini' | 'watermelon' | 'cauliflower' | 'cabbageHead' | 'onion' | 'carrot' | 'potato' | 'beans' | 'peas' | 'wheat' | 'sunflower' | 'vineyard' | 'lavenderRows';
    /** Number of planted rows across the box. */
    rows: number;
    /** Plant spacing along a row relative to the species. */
    spacing: number;
    /** Shows the tilled soil beds under the rows. */
    soil: boolean;
    /** Growth stage, 0 seedlings .. 1 fully grown. */
    growth: number;
    /** Ripening of the produce, 0 green .. 1 ripe. */
    ripeness: number;
    /** How much produce shows on the plants, 0 none .. 1 laden. */
    produce: number;
    /** Leaf size relative to the species. */
    leafSize: number;
    /** How much of the foliage is there, 0 bare .. 1 full. */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
    /** Colour of the soil beds. */
    soilColor: string;
}

/** Climbing ivy on the faces of its box: vines random-walked up a wall with branching and thinning, three-lobed leaves facing out, drawn from the ground with the growth knob so it can climb in animation. Use for walls, pillars, fences, ruins and facades. */
export interface IvyVegetationConfig extends BaseVegetationObjectConfig {
    type: 'ivy';
    /** The climber: leaf shape, vine habit, blossom and default colours. */
    species: 'englishIvy' | 'virginiaCreeper' | 'bougainvillea' | 'jasmine' | 'wisteria' | 'climbingRose' | 'honeysuckle' | 'grapevine';
    /** Which faces of the box the vines climb: a wall, two walls, all four or a pillar. */
    faces: 'back' | 'front' | 'sides' | 'around';
    /** How many vines start from the ground. */
    vines: number;
    /** How much each vine forks on the way up. */
    branching: number;
    /** How far up the box the vines have climbed, 0..1. */
    reach: number;
    /** Leaf count along the vines relative to the species. */
    density: number;
    /** Growth stage, 0 seedlings .. 1 fully grown. */
    growth: number;
    /** Amount of blossom, 0 none .. 1 full bloom. */
    flowers: number;
    /** Blossom colour; white follows the species. */
    flowerColor: string;
    /** Leaf size relative to the species. */
    leafSize: number;
    /** How much of the foliage is there, 0 bare .. 1 full. */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
    /** Bark / stem colour; a species default follows the species. */
    barkColor: string;
}

/** A clipped hedge or topiary (box, dome, ball, cylinder, cone, spiral) filled with foliage: a dense skin of small leaves on the clipped surface, a shaded fill inside and twigs beneath, from razor-trimmed to shaggy. Use for gardens, borders, mazes, formal grounds and topiary. */
export interface HedgeVegetationConfig extends BaseVegetationObjectConfig {
    type: 'hedge';
    /** The clipped form of the hedge. */
    shape: 'box' | 'arch' | 'dome' | 'ball' | 'cylinder' | 'cone' | 'pyramid' | 'obelisk' | 'spiral';
    /** The hedging plant: leaf shape and default colours. */
    species: 'boxwood' | 'privet' | 'yew' | 'laurel' | 'beech' | 'holly' | 'photinia' | 'cypress' | 'hornbeam' | 'pittosporum';
    /** Leaf count relative to the species. */
    density: number;
    /** How closely the hedge is clipped: 0 shaggy, 1 a sharp topiary face. */
    trim: number;
    /** Leaf size relative to the species. */
    leafSize: number;
    /** How much of the foliage is there, 0 bare .. 1 full. */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
    /** Bark / stem colour; a species default follows the species. */
    barkColor: string;
    /** Detail with distance: auto thins and flattens the leaves far away, then swaps in a lit impostor card; full never reduces (a hero plant); impostor always shows the card. */
    lod: 'auto' | 'full' | 'impostor';
}

/** One kind of fruit (apple, orange, lemon, pear, banana, cherry, strawberry, grapes, watermelon, pineapple) as a single piece or a pile on the ground: a procedural body with its stem and leaves, a skin that ripens between two colours with the kind's pattern and gloss. Use for kitchens, markets, still lifes and food scenes. */
export interface FruitVegetationConfig extends BaseVegetationObjectConfig {
    type: 'fruit';
    /** Which fruit or vegetable: its body profile, parts (stem, calyx, crown, leaves), skin pattern and gloss. */
    kind: 'apple' | 'pear' | 'peach' | 'apricot' | 'plum' | 'cherry' | 'orange' | 'lemon' | 'lime' | 'grapefruit' | 'banana' | 'mango' | 'papaya' | 'kiwi' | 'fig' | 'avocado' | 'pomegranate' | 'persimmon' | 'strawberry' | 'raspberry' | 'blueberry' | 'grapes' | 'watermelon' | 'melon' | 'pineapple' | 'dragonfruit' | 'coconut';
    /** How many pieces: 1 is a single piece on the ground, more is a pile. */
    count: number;
    /** Ripening, 0 unripe .. 1 ripe: the skin turns between the kind's two colours and the greens darken. */
    ripeness: number;
    /** Size variation between the pieces, 0 identical .. 0.5 very mixed. */
    sizeVar: number;
    /** Spots, scars and bruises on the skin, 0 flawless .. 1 weathered. */
    blemish: number;
    /** Skin gloss relative to the kind, 0 matte .. 2 waxed. */
    gloss: number;
}

/** One kind of vegetable (tomato, pepper, pumpkin, carrot, corn, cucumber, eggplant, broccoli, potato, onion) as a single piece or a pile on the ground: a procedural body with its stem, calyx, tops or husk, a skin that ripens between two colours with the kind's pattern and gloss. Use for kitchens, markets, farms and food scenes. */
export interface VegetableVegetationConfig extends BaseVegetationObjectConfig {
    type: 'vegetable';
    /** Which vegetable: its body profile, parts (tops, leaves, husk, cap), skin pattern and gloss. */
    kind: 'tomato' | 'pepper' | 'chili' | 'eggplant' | 'cucumber' | 'zucchini' | 'pumpkin' | 'butternut' | 'corn' | 'carrot' | 'radish' | 'beet' | 'turnip' | 'potato' | 'sweetPotato' | 'onion' | 'garlic' | 'leek' | 'asparagus' | 'broccoli' | 'cauliflower' | 'cabbage' | 'artichoke' | 'peaPod' | 'beans' | 'mushroom' | 'flyAgaric';
    /** How many pieces: 1 is a single piece on the ground, more is a pile. */
    count: number;
    /** Ripening, 0 unripe .. 1 ripe: the skin turns between the kind's two colours. */
    ripeness: number;
    /** Size variation between the pieces, 0 identical .. 0.5 very mixed. */
    sizeVar: number;
    /** Spots, scars and bruises on the skin, 0 flawless .. 1 weathered. */
    blemish: number;
    /** Skin gloss relative to the kind, 0 matte .. 2 waxed. */
    gloss: number;
}

/** A forest of hundreds to thousands of trees filling its box: a species mix (temperate, conifer, birch, mediterranean, tropical, savanna, blossom, winter) in groves and glades with undergrowth, every tree an instanced lit impostor and the nearest ones real trees. Use for woods, hillsides, landscapes and backdrops. */
export interface ForestVegetationConfig extends BaseVegetationObjectConfig {
    type: 'forest';
    /** The species mix: which trees and which undergrowth bushes, and in what proportion. */
    mix: 'temperate' | 'conifer' | 'birch' | 'autumn' | 'mediterranean' | 'tropical' | 'savanna' | 'blossom' | 'winter';
    /** How many trees stand in the box. */
    trees: number;
    /** 0 spreads the trees evenly, 1 gathers them into groves with glades between. */
    clumping: number;
    /** Height variation between the trees, 0 all reach the canopy .. 0.6 very mixed. */
    sizeVar: number;
    /** Bushes under the trees, 0 none .. 1 a dense understorey. */
    undergrowth: number;
    /** How many of the trees nearest the camera are drawn as full trees; every other tree is its lit impostor card. 0 for a backdrop seen only from far. */
    nearTrees: number;
    /** Leaf size relative to each species. */
    leafSize: number;
    /** How much of the foliage is there, 0 bare .. 1 full (every tree). */
    foliage: number;
    /** Season turn of the leaves: 0 fresh green, 0.5 late summer, 1 autumn colour. */
    seasonHue: number;
    /** Share of the leaves letting go and falling, 0..1. */
    leafFall: number;
    /** How much the leaves tremble in the wind. */
    flutter: number;
    /** How far the branches sway in the wind. */
    sway: number;
}

export type VegetationObjectConfig = ({ type: 'tree' } & TreeVegetationConfig) | ({ type: 'bush' } & BushVegetationConfig) | ({ type: 'grass' } & GrassVegetationConfig) | ({ type: 'flowers' } & FlowersVegetationConfig) | ({ type: 'crops' } & CropsVegetationConfig) | ({ type: 'ivy' } & IvyVegetationConfig) | ({ type: 'hedge' } & HedgeVegetationConfig) | ({ type: 'fruit' } & FruitVegetationConfig) | ({ type: 'vegetable' } & VegetableVegetationConfig) | ({ type: 'forest' } & ForestVegetationConfig);
