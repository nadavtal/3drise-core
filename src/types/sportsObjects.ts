// =============================================================================
// SPORTS OBJECTS — sports props at regulation size (object type 'sports', config.type picks the variant)
// =============================================================================
//
// Courts with every rulebook line and their nets / goals / hoops, balls with their true panel
// geometry and seams, equipment built from its parts, and goals / nets / hoops — built
// procedurally in the viewer (components/sports). They are lit by the scene's lights like
// meshes (MeshStandardMaterial with the family's code injected) and cast and receive shadows;
// the materials are the family's own (no Material tab).
//
// Size contract: REAL metres (a tennis court is 23.77 × 10.97 m, a football 22 cm across); the
// transform starts at scale 1 and places the prop. Knobs describe the prop, never move it.
// The variant interfaces and the unions are appended by the integrator from each object spec
// (Claude outputs/integrate).
//

export type SportsQuality = 'low' | 'medium' | 'high';

export interface BaseSportsObjectConfig {
    enabled: boolean;
    /** Detail level: segment counts of the round parts and the nets (structural). */
    quality: SportsQuality;
    /** Random variation of the wear, grain and marbling (structural). */
    seed: number;
    /** On: the real colours of the sport / item; off: color / secondaryColor / accentColor. */
    naturalColors: boolean;
    /** Main colour (surface / main panel / main part / posts). */
    color: string;
    /** Second colour (lines / second panel / grip / net). */
    secondaryColor: string;
    /** Accent colour (surround / seams / strings, wheels / tapes, pads). */
    accentColor: string;
    /** Wear, 0 new .. 1 heavily used. */
    wear: number;
    /** Surface gloss relative to the material. */
    gloss: number;
    opacity: number;
}

export type SportsObjectType = 'court' | 'ball' | 'equipment' | 'goal';

/** A regulation playing surface with every rulebook line drawn sharp at any distance: tennis, basketball, soccer, American football, futsal, handball, volleyball, badminton, padel, pickleball, ice hockey rink, athletics track or table-tennis table, on acrylic, clay, grass, parquet, ice, tartan, turf or sand, with its nets, goals or hoops. Use for sports venues, parks, schools, product scenes and arenas. */
export interface CourtSportsConfig extends BaseSportsObjectConfig {
    type: 'court';
    /** The sport: regulation size, every rulebook line, the natural surface and colours, and its fixtures. */
    sport: 'tennis' | 'basketball' | 'soccer' | 'futsal' | 'handball' | 'volleyball' | 'badminton' | 'padel' | 'pickleball' | 'iceHockey' | 'athleticsTrack' | 'tableTennis' | 'americanFootball';
    /** The playing surface; auto takes the sport's own. */
    surface: 'auto' | 'hardcourt' | 'clay' | 'grass' | 'wood' | 'ice' | 'tartan' | 'turf' | 'sand' | 'concrete' | 'painted';
    /** Run-off around the lines relative to the sport's regulation run-off (0 = lines only). */
    margin: number;
    /** Line width relative to the rulebook width. */
    lineScale: number;
    /** Builds the sport's nets, goals or hoops on the court. */
    fixtures: boolean;
    /** Wet surface, 0 dry .. 1 puddles: darker, glossy, standing water in the hollows. */
    wetness: number;
    /** Floodlight masts for the sport (none for table tennis): they light the court at night with no real lights and spill onto the paving around it. */
    floodlights: boolean;
    /** Brightness of the floodlights, 0 off .. 3 (animatable). */
    floodIntensity: number;
    /** Colour of the floodlights. */
    floodColor: string;
    /** Auto lights up at dusk with the scene sun (like the street lamps); day / night force it. */
    lighting: 'auto' | 'day' | 'night';
}

/** A ball at its real size with its true panel geometry and seams: football, basketball, tennis, baseball, volleyball, rugby, American football, golf, cricket, bowling or beach ball, with leather, felt, rubber or resin surfaces, grooved seams, stitches, dimples and wear. Use for sports scenes, product shots, playgrounds and still lifes. */
export interface BallSportsConfig extends BaseSportsObjectConfig {
    type: 'ball';
    /** The ball: real size, its panel layout and seams, surface and natural colours. */
    sport: 'football' | 'basketball' | 'tennis' | 'baseball' | 'volleyball' | 'rugby' | 'americanFootball' | 'golf' | 'cricket' | 'bowling' | 'beachBall';
    /** Seam width relative to the ball's real seam. */
    seamWidth: number;
    /** Depth of the seam grooves and height of the stitches. */
    seamDepth: number;
    /** How far the panels puff out between the seams (stitched leather balls). */
    bulge: number;
}

/** A piece of sports equipment at real size, built from its parts: tennis or badminton racquet with a strung bed, table-tennis paddle, baseball or cricket bat, golf driver, iron or putter, hockey stick, skateboard, dumbbell, kettlebell, barbell with plates, or frisbee, in wood, steel, carbon, rubber and leather with wear. Use for gyms, sports shops, locker rooms, product shots and lifestyle scenes. */
export interface EquipmentSportsConfig extends BaseSportsObjectConfig {
    type: 'equipment';
    /** The item: its parts, real dimensions and natural materials. */
    item: 'tennisRacquet' | 'badmintonRacquet' | 'tableTennisPaddle' | 'baseballBat' | 'cricketBat' | 'golfDriver' | 'golfIron' | 'golfPutter' | 'hockeyStick' | 'skateboard' | 'dumbbell' | 'kettlebell' | 'barbell' | 'frisbee';
    /** Material of the main part; auto takes the item's own. */
    material: 'auto' | 'wood' | 'metal' | 'carbon' | 'plastic' | 'paint';
    /** Weight: plates per side on a barbell; the size of a dumbbell or kettlebell. */
    plates: number;
}

/** A regulation goal, net or hoop standing on the ground: football, futsal or handball goal with its sagging net, ice-hockey net, basketball hoop with backboard and pole, volleyball, tennis or badminton net on posts, rugby or American-football uprights, in real metres with wear. Use for pitches, courts, playgrounds, backyards and arenas. */
export interface GoalSportsConfig extends BaseSportsObjectConfig {
    type: 'goal';
    /** The goal, net or hoop: regulation size, frame, nets and natural colours. */
    kind: 'footballGoal' | 'futsalGoal' | 'handballGoal' | 'hockeyNet' | 'basketballHoop' | 'volleyballNet' | 'tennisNet' | 'badmintonNet' | 'rugbyPosts' | 'americanUprights';
    /** Shows the net. */
    showNet: boolean;
    /** Net cell size relative to the kind's regulation mesh. */
    meshSize: number;
    /** How taut the net is, 0 slack and billowing .. 1 tight (animatable). */
    netTension: number;
}

export type SportsObjectConfig = ({ type: 'court' } & CourtSportsConfig) | ({ type: 'ball' } & BallSportsConfig) | ({ type: 'equipment' } & EquipmentSportsConfig) | ({ type: 'goal' } & GoalSportsConfig);
