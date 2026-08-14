export type CursorType = 'comet' | 'lightning' | 'sparkles' | 'crosshair' | 'orb' | 'aura' | 'liquidMetal' | 'aurora' | 'glyphs' | 'ferrofluid' | 'plasmaWhip' | 'tesla' | 'bubbles';

export type ClickActionType = 'none' | 'shockwave' | 'sparklesBurst' | 'boltFlash' | 'realityTear' | 'implosion' | 'voronoiFracture' | 'phaseShift' | 'plasmaBomb' | 'glyphInscription';

export type CursorPickMode = 'raycast-scene' | 'raycast-plane' | 'none';

export interface CursorBaseConfig {
    enabled: boolean;
    type: CursorType;
    color: string;
    scale: number;
    intensity: number;
    opacity: number;
    idleFadeMs: number;
    pickMode: CursorPickMode;
    planeDistance: number;
}

export interface CometCursorConfig extends CursorBaseConfig {
    type: 'comet';
    trailLength: number;
    particleCount: number;
}

export interface LightningCursorConfig extends CursorBaseConfig {
    type: 'lightning';
    segmentCount: number;
    jitter: number;
    arcRange: number;
}

export interface SparklesCursorConfig extends CursorBaseConfig {
    type: 'sparkles';
    particleCount: number;
    gravity: number;
    lifetimeMs: number;
}

export interface CrosshairCursorConfig extends CursorBaseConfig {
    type: 'crosshair';
    showLabel: boolean;
    outlineColor: string;
}

export interface OrbCursorConfig extends CursorBaseConfig {
    type: 'orb';
    innerColor: string;
    outerColor: string;
    pulseSpeed: number;
}

export interface AuraCursorConfig extends CursorBaseConfig {
    type: 'aura';
    falloff: number;
}

export interface LiquidMetalCursorConfig extends CursorBaseConfig {
    type: 'liquidMetal';
    metalness: number;
    roughness: number;
    morphSpeed: number;
}

export interface AuroraCursorConfig extends CursorBaseConfig {
    type: 'aurora';
    trailLength: number;
    ribbonWidth: number;
    flowSpeed: number;
}

export interface GlyphRingCursorConfig extends CursorBaseConfig {
    type: 'glyphs';
    glyphCount: number;
    ringRadius: number;
    rotationSpeed: number;
}

export interface FerrofluidCursorConfig extends CursorBaseConfig {
    type: 'ferrofluid';
    spikeCount: number;
    reach: number;
    metalness: number;
}

export interface PlasmaWhipCursorConfig extends CursorBaseConfig {
    type: 'plasmaWhip';
    pointCount: number;
    thickness: number;
    flowSpeed: number;
}

export interface TeslaCursorConfig extends CursorBaseConfig {
    type: 'tesla';
    pointColor: string;
    pointSize: number;
    lineThickness: number;
    trailLength: number;
    pulseCount: number;
    pulseSpeed: number;
}

export interface BubblesCursorConfig extends CursorBaseConfig {
    type: 'bubbles';
    spawnRate: number;
    floatSpeed: number;
    iridescence: number;
    lifetimeMs: number;
}

export type CursorConfig = CometCursorConfig | LightningCursorConfig | SparklesCursorConfig | CrosshairCursorConfig | OrbCursorConfig | AuraCursorConfig | LiquidMetalCursorConfig | AuroraCursorConfig | GlyphRingCursorConfig | FerrofluidCursorConfig | PlasmaWhipCursorConfig | TeslaCursorConfig | BubblesCursorConfig;

export interface ClickActionBaseConfig {
    color: string;
    scale: number;
    durationMs: number;
}

export interface NoneActionConfig extends ClickActionBaseConfig {
    type: 'none';
}

export interface ShockwaveActionConfig extends ClickActionBaseConfig {
    type: 'shockwave';
}

export interface SparklesBurstActionConfig extends ClickActionBaseConfig {
    type: 'sparklesBurst';
    rayCount: number;
}

export interface BoltFlashActionConfig extends ClickActionBaseConfig {
    type: 'boltFlash';
}

export interface RealityTearActionConfig extends ClickActionBaseConfig {
    type: 'realityTear';
    tearWidth: number;
}

export interface ImplosionActionConfig extends ClickActionBaseConfig {
    type: 'implosion';
    bandCount: number;
}

export interface VoronoiFractureActionConfig extends ClickActionBaseConfig {
    type: 'voronoiFracture';
    shardCount: number;
}

export interface PhaseShiftActionConfig extends ClickActionBaseConfig {
    type: 'phaseShift';
    radius: number;
}

export interface PlasmaBombActionConfig extends ClickActionBaseConfig {
    type: 'plasmaBomb';
    ringWidth: number;
}

export interface GlyphInscriptionActionConfig extends ClickActionBaseConfig {
    type: 'glyphInscription';
    glyphCount: number;
}

export type ClickActionConfig = NoneActionConfig | ShockwaveActionConfig | SparklesBurstActionConfig | BoltFlashActionConfig | RealityTearActionConfig | ImplosionActionConfig | VoronoiFractureActionConfig | PhaseShiftActionConfig | PlasmaBombActionConfig | GlyphInscriptionActionConfig;

export interface CursorModuleConfig {
    effects: CursorConfig[];
    clickActions: ClickActionConfig[];
}
export {};
