import * as THREE from 'three';
import { MPTStandard } from './prolyte/MPTStandard.js';
import { MPTFrame } from './prolyte/MPTFrame.js';
import { MPTLayherBase } from './prolyte/MPTLayherBase.js';
import { MPTSuspended } from './prolyte/MPTSuspended.js';

export class ProlyteMPT {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.strategies = {
            'standard': new MPTStandard(this.group),
            'frame': new MPTFrame(this.group),
            'layher_base': new MPTLayherBase(this.group),
            'suspended': new MPTSuspended(this.group)
        };
        
        this.currentStrategy = null;
    }

    clear() {
        this.group.clear(); 
        Object.values(this.strategies).forEach(s => {
            if (s.clear) s.clear();
        });
    }

    build(config) {
        this.clear();
        
        let variant = config.variant || 'standard';
        
        if (config.prolyteVar === 'frame' || config.aluVar === 'frame') variant = 'frame';
        if (config.aluVar === 'layher') variant = 'layher_base';

        if (this.strategies[variant]) {
            console.log(`Budowanie Prolyte wariant: ${variant}`);
            this.currentStrategy = this.strategies[variant];
            this.currentStrategy.build(config);
        } else {
            console.warn(`Nieznany wariant: ${variant}, używam standard.`);
            this.strategies['standard'].build(config);
        }
    }
}