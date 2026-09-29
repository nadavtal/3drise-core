// Auto-animate: scene analysis (→ recipes → composer → validator). See claude/auto-animate-plan.md.
export * from './types';
export { analyzeScene, baseName } from './sceneAnalyzer';
export { makeBounds, boundsAround, unionBounds } from './bounds';
export { generateAnimation } from './composer';
export type { GenerateOptions, GenerateResult, AutoTemplate, LengthName } from './composer';
export { validateGenerated } from './validator';
export type { GenerationIssue } from './validator';
export { STYLES } from './recipes';
export type { StyleName, EnterName, AmbientName } from './recipes';
export type { DraftClip, DraftSequence, DraftTrack, DraftKey, DraftEase, DraftValue } from './draft';
export { createRng } from './rng';
