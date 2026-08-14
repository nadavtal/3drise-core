import type * as THREE from "three";
import { AuraEffectV } from './effects/AuraEffectV';
import { OrbEffectV } from './effects/OrbEffectV';
import { SmokePlumeEffectV } from './effects/SmokePlumeEffectV';
import { VolumetricFogEffectV } from './effects/VolumetricFogEffectV';
import { SmokeRingEffectV } from './effects/SmokeRingEffectV';
import { PortalEffectV } from './effects/PortalEffectV';
import { BlackHoleEffectV } from './effects/BlackHoleEffectV';
import { ForcefieldEffectV } from './effects/ForcefieldEffectV';
import { DataStreamEffectV } from './effects/DataStreamEffectV';
import { HologramEffectV } from './effects/HologramEffectV';
import { AuroraEffectV } from './effects/AuroraEffectV';
import { ShockwaveEffectV } from './effects/ShockwaveEffectV';
import { ConstellationEffectV } from './effects/ConstellationEffectV';
import { MoleculesEffectV } from './effects/MoleculesEffectV';
import { DnaHelixEffectV } from './effects/DnaHelixEffectV';
import { IceCrystalsEffectV } from './effects/IceCrystalsEffectV';
import { LightningEffectV } from './effects/LightningEffectV';
import { NeuralNetworkEffectV } from './effects/NeuralNetworkEffectV';
import type { GenerativeEffectSettings } from "../types/generativeEffects";

export class EffectsGeneratorV {
    private scene;
    private effect = null;
    private settings;
    private boundingRadius;
    constructor(scene: THREE.Scene, settings: GenerativeEffectSettings, boundingRadius: number = 1) {
        this.scene = scene;
        this.settings = settings;
        this.boundingRadius = boundingRadius;
        if ((settings as any).enabled)
            this.build();
    }
    private build() {
        const { config } = this.settings;
        const r = this.boundingRadius;
        switch (config.type) {
            case 'aura':
                this.effect = new AuraEffectV(this.scene, config, r);
                break;
            case 'orb':
                this.effect = new OrbEffectV(this.scene, config, r);
                break;
                break;
            case 'smokePlume':
                this.effect = new SmokePlumeEffectV(this.scene, config, r);
                break;
            case 'volumetricFog':
                this.effect = new VolumetricFogEffectV(this.scene, config, r);
                break;
            case 'smokeRing':
                this.effect = new SmokeRingEffectV(this.scene, config, r);
                break;
            case 'portal':
                this.effect = new PortalEffectV(this.scene, config, r);
                break;
            case 'blackHole':
                this.effect = new BlackHoleEffectV(this.scene, config, r);
                break;
            case 'forcefield':
                this.effect = new ForcefieldEffectV(this.scene, config, r);
                break;
            case 'dataStream':
                this.effect = new DataStreamEffectV(this.scene, config, r);
                break;
            case 'hologram':
                this.effect = new HologramEffectV(this.scene, config, r);
                break;
            case 'aurora':
                this.effect = new AuroraEffectV(this.scene, config, r);
                break;
            case 'shockwave':
                this.effect = new ShockwaveEffectV(this.scene, config, r);
                break;
            case 'constellation':
                this.effect = new ConstellationEffectV(this.scene, config, r);
                break;
            case 'molecules':
                this.effect = new MoleculesEffectV(this.scene, config, r);
                break;
            case 'dnaHelix':
                this.effect = new DnaHelixEffectV(this.scene, config, r);
                break;
            case 'iceCrystals':
                this.effect = new IceCrystalsEffectV(this.scene, config, r);
                break;
            case 'lightning':
                this.effect = new LightningEffectV(this.scene, config, r);
                break;
            case 'neuralNetwork':
                this.effect = new NeuralNetworkEffectV(this.scene, config, r);
                break;
            default: this.effect = null;
        }
    }
    update(elapsed: number, delta: number = 0.016): void {
        this.effect?.update(elapsed, delta);
    }
    updateSettings(settings: GenerativeEffectSettings, boundingRadius?: number): void {
        if (boundingRadius !== undefined)
            this.boundingRadius = boundingRadius;
        this.settings = settings;
        this.effect?.dispose();
        this.effect = null;
        if ((settings as any).enabled)
            this.build();
    }
    dispose(): void {
        this.effect?.dispose();
        this.effect = null;
    }
}
