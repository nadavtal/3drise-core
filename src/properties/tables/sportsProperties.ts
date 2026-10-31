// Property table for the sports variants (type 'sports', config.type set). The registry (../registry.ts) is built on these tables.
// Rows carry a `tab` (shape / finish / colours) the sports controller groups by.
import type { OptionalProperty } from './optionalProperties';
import type { SportsObjectType } from '../../types/sportsObjects';

// =============================================================================
// SPORTS OBJECTS OPTIONAL PROPERTIES — entries appended by the integrator per object spec
// =============================================================================

export const SPORTS_PROPERTIES: Record<SportsObjectType, OptionalProperty[]> = {

    court: [
        { name: 'sport', label: 'Sport', description: 'The sport: regulation size, every rulebook line, the natural surface and colours, and its fixtures.', type: 'select', options: ['tennis', 'basketball', 'soccer', 'futsal', 'handball', 'volleyball', 'badminton', 'padel', 'pickleball', 'iceHockey', 'athleticsTrack', 'tableTennis', 'americanFootball'], optionLabels: ['Tennis', 'Basketball', 'Soccer', 'Futsal', 'Handball', 'Volleyball', 'Badminton', 'Padel', 'Pickleball', 'Ice Hockey', 'Athletics Track', 'Table Tennis', 'American Football'], tab: 'shape', animatable: false },
        { name: 'surface', label: 'Surface', description: 'The playing surface; auto takes the sport\'s own.', type: 'select', options: ['auto', 'hardcourt', 'clay', 'grass', 'wood', 'ice', 'tartan', 'turf', 'sand', 'concrete', 'painted'], optionLabels: ['Auto', 'Hardcourt', 'Clay', 'Grass', 'Wood', 'Ice', 'Tartan', 'Turf', 'Sand', 'Concrete', 'Painted'], tab: 'shape', animatable: false },
        { name: 'margin', label: 'Margin', description: 'Run-off around the lines relative to the sport\'s regulation run-off (0 = lines only).', type: 'number', min: 0, max: 2, step: 0.05, tab: 'shape', animatable: false },
        { name: 'lineScale', label: 'Line Scale', description: 'Line width relative to the rulebook width.', type: 'number', min: 0.5, max: 2, step: 0.05, tab: 'shape' },
        { name: 'fixtures', label: 'Fixtures', description: 'Builds the sport\'s nets, goals or hoops on the court.', type: 'boolean', tab: 'shape', animatable: false },
        { name: 'quality', label: 'Quality', description: 'Detail level: segment counts of the round parts and the nets.', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'], tab: 'shape', animatable: false },
        { name: 'seed', label: 'Seed', description: 'Random variation of the wear, grain and marbling.', type: 'number', min: 1, max: 999, step: 1, tab: 'shape', animatable: false },
        { name: 'wear', label: 'Wear', description: 'Wear, 0 new .. 1 heavily used: scuffs, dirt and worn surfaces, concentrated where the play is.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'finish' },
        { name: 'wetness', label: 'Wetness', description: 'Wet surface, 0 dry .. 1 puddles: darker, glossy, standing water in the hollows.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'finish' },
        { name: 'gloss', label: 'Gloss', description: 'Surface gloss relative to the material, 0.2 matte .. 3 polished.', type: 'number', min: 0.2, max: 3, step: 0.01, tab: 'finish' },
        { name: 'floodlights', label: 'Floodlights', description: 'Floodlight masts for the sport (none for table tennis): they light the court at night with no real lights and spill onto the paving around it.', type: 'boolean', tab: 'lights', animatable: false },
        { name: 'floodIntensity', label: 'Flood Intensity', description: 'Brightness of the floodlights, 0 off .. 3 (animatable).', type: 'number', min: 0, max: 3, step: 0.01, tab: 'lights' },
        { name: 'floodColor', label: 'Flood Color', description: 'Colour of the floodlights.', type: 'color', tab: 'lights' },
        { name: 'lighting', label: 'Lighting', description: 'Auto lights up at dusk with the scene sun (like the street lamps); day / night force it.', type: 'select', options: ['auto', 'day', 'night'], optionLabels: ['Auto', 'Day', 'Night'], tab: 'lights', animatable: false },
        { name: 'naturalColors', label: 'Natural Colors', description: 'On: the colours are the real ones for the sport / item. Off: the three colour knobs below.', type: 'boolean', tab: 'colours', animatable: false },
        { name: 'color', label: 'Color', description: 'Surface colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'secondaryColor', label: 'Secondary Color', description: 'Line colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'accentColor', label: 'Accent Color', description: 'Surround / painted-zone colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'opacity', label: 'Opacity', description: 'Opacity of the whole object.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'colours' },
    ],
    ball: [
        { name: 'sport', label: 'Sport', description: 'The ball: real size, its panel layout and seams, surface and natural colours.', type: 'select', options: ['football', 'basketball', 'tennis', 'baseball', 'volleyball', 'rugby', 'americanFootball', 'golf', 'cricket', 'bowling', 'beachBall'], optionLabels: ['Football', 'Basketball', 'Tennis', 'Baseball', 'Volleyball', 'Rugby', 'American Football', 'Golf', 'Cricket', 'Bowling', 'Beach Ball'], tab: 'shape', animatable: false },
        { name: 'quality', label: 'Quality', description: 'Detail level: segment counts of the round parts and the nets.', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'], tab: 'shape', animatable: false },
        { name: 'seed', label: 'Seed', description: 'Random variation of the wear, grain and marbling.', type: 'number', min: 1, max: 999, step: 1, tab: 'shape', animatable: false },
        { name: 'naturalColors', label: 'Natural Colors', description: 'On: the colours are the real ones for the sport / item. Off: the three colour knobs below.', type: 'boolean', tab: 'colours', animatable: false },
        { name: 'color', label: 'Color', description: 'Main panel colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'secondaryColor', label: 'Secondary Color', description: 'Second panel colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'accentColor', label: 'Accent Color', description: 'Seam / stitch colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'seamWidth', label: 'Seam Width', description: 'Seam width relative to the ball\'s real seam.', type: 'number', min: 0.3, max: 2.5, step: 0.01, tab: 'finish' },
        { name: 'seamDepth', label: 'Seam Depth', description: 'Depth of the seam grooves and height of the stitches.', type: 'number', min: 0, max: 2, step: 0.01, tab: 'finish' },
        { name: 'bulge', label: 'Bulge', description: 'How far the panels puff out between the seams (stitched leather balls).', type: 'number', min: 0, max: 1, step: 0.01, tab: 'finish' },
        { name: 'wear', label: 'Wear', description: 'Wear, 0 new .. 1 heavily used: scuffs, dirt and worn surfaces, concentrated where the play is.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'finish' },
        { name: 'gloss', label: 'Gloss', description: 'Surface gloss relative to the material, 0.2 matte .. 3 polished.', type: 'number', min: 0.2, max: 3, step: 0.01, tab: 'finish' },
        { name: 'opacity', label: 'Opacity', description: 'Opacity of the whole object.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'colours' },
    ],
    equipment: [
        { name: 'item', label: 'Item', description: 'The item: its parts, real dimensions and natural materials.', type: 'select', options: ['tennisRacquet', 'badmintonRacquet', 'tableTennisPaddle', 'baseballBat', 'cricketBat', 'golfDriver', 'golfIron', 'golfPutter', 'hockeyStick', 'skateboard', 'dumbbell', 'kettlebell', 'barbell', 'frisbee'], optionLabels: ['Tennis Racquet', 'Badminton Racquet', 'Table Tennis Paddle', 'Baseball Bat', 'Cricket Bat', 'Golf Driver', 'Golf Iron', 'Golf Putter', 'Hockey Stick', 'Skateboard', 'Dumbbell', 'Kettlebell', 'Barbell', 'Frisbee'], tab: 'shape', animatable: false },
        { name: 'material', label: 'Material', description: 'Material of the main part; auto takes the item\'s own.', type: 'select', options: ['auto', 'wood', 'metal', 'carbon', 'plastic', 'paint'], optionLabels: ['Auto', 'Wood', 'Metal', 'Carbon', 'Plastic', 'Paint'], tab: 'shape', animatable: false },
        { name: 'plates', label: 'Plates', description: 'Weight: plates per side on a barbell; the size of a dumbbell or kettlebell.', type: 'number', min: 1, max: 5, step: 1, tab: 'shape', animatable: false },
        { name: 'quality', label: 'Quality', description: 'Detail level: segment counts of the round parts and the nets.', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'], tab: 'shape', animatable: false },
        { name: 'seed', label: 'Seed', description: 'Random variation of the wear, grain and marbling.', type: 'number', min: 1, max: 999, step: 1, tab: 'shape', animatable: false },
        { name: 'naturalColors', label: 'Natural Colors', description: 'On: the colours are the real ones for the sport / item. Off: the three colour knobs below.', type: 'boolean', tab: 'colours', animatable: false },
        { name: 'color', label: 'Color', description: 'Main part colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'secondaryColor', label: 'Secondary Color', description: 'Grip colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'accentColor', label: 'Accent Color', description: 'Accent colour: strings, wheels, plates, faces (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'wear', label: 'Wear', description: 'Wear, 0 new .. 1 heavily used: scuffs, dirt and worn surfaces, concentrated where the play is.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'finish' },
        { name: 'gloss', label: 'Gloss', description: 'Surface gloss relative to the material, 0.2 matte .. 3 polished.', type: 'number', min: 0.2, max: 3, step: 0.01, tab: 'finish' },
        { name: 'opacity', label: 'Opacity', description: 'Opacity of the whole object.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'colours' },
    ],
    goal: [
        { name: 'kind', label: 'Kind', description: 'The goal, net or hoop: regulation size, frame, nets and natural colours.', type: 'select', options: ['footballGoal', 'futsalGoal', 'handballGoal', 'hockeyNet', 'basketballHoop', 'volleyballNet', 'tennisNet', 'badmintonNet', 'rugbyPosts', 'americanUprights'], optionLabels: ['Football Goal', 'Futsal Goal', 'Handball Goal', 'Hockey Net', 'Basketball Hoop', 'Volleyball Net', 'Tennis Net', 'Badminton Net', 'Rugby Posts', 'American Uprights'], tab: 'shape', animatable: false },
        { name: 'showNet', label: 'Show Net', description: 'Shows the net.', type: 'boolean', tab: 'shape', animatable: false },
        { name: 'meshSize', label: 'Mesh Size', description: 'Net cell size relative to the kind\'s regulation mesh.', type: 'number', min: 0.5, max: 2, step: 0.05, tab: 'shape', animatable: false },
        { name: 'quality', label: 'Quality', description: 'Detail level: segment counts of the round parts and the nets.', type: 'select', options: ['low', 'medium', 'high'], optionLabels: ['Low', 'Medium', 'High'], tab: 'shape', animatable: false },
        { name: 'seed', label: 'Seed', description: 'Random variation of the wear, grain and marbling.', type: 'number', min: 1, max: 999, step: 1, tab: 'shape', animatable: false },
        { name: 'naturalColors', label: 'Natural Colors', description: 'On: the colours are the real ones for the sport / item. Off: the three colour knobs below.', type: 'boolean', tab: 'colours', animatable: false },
        { name: 'color', label: 'Color', description: 'Posts / frame colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'secondaryColor', label: 'Secondary Color', description: 'Net colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'accentColor', label: 'Accent Color', description: 'Tapes, pads and board colour (used when Natural Colors is off).', type: 'color', tab: 'colours' },
        { name: 'netTension', label: 'Net Tension', description: 'How taut the net is, 0 slack and billowing .. 1 tight (animatable).', type: 'number', min: 0, max: 1, step: 0.01, tab: 'finish' },
        { name: 'wear', label: 'Wear', description: 'Wear, 0 new .. 1 heavily used: scuffs, dirt and worn surfaces, concentrated where the play is.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'finish' },
        { name: 'gloss', label: 'Gloss', description: 'Surface gloss relative to the material, 0.2 matte .. 3 polished.', type: 'number', min: 0.2, max: 3, step: 0.01, tab: 'finish' },
        { name: 'opacity', label: 'Opacity', description: 'Opacity of the whole object.', type: 'number', min: 0, max: 1, step: 0.01, tab: 'colours' },
    ],
};
