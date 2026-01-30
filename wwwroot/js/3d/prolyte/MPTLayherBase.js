import * as THREE from 'three';
import { MPTStandard } from './MPTStandard.js'; 

import { LayherPartsBase } from '../layher/LayherPartsBase.js'; 

export class MPTLayherBase extends MPTStandard {
    constructor(scene) {
        super(scene);
        this.lp = new LayherPartsBase();
    }
    
    build(config) {
        this.clear();
        const W = parseFloat(config.width) || 12.0;
        const D = parseFloat(config.depth) || 10.0;
        const H = parseFloat(config.height) || 7.0;
        const showCanopy = config.showCanopy !== false;

        const baseH = 1.0; 
        const towerX = W / 2;
        const towerZ = D / 2;
        
        const positions = [
            {x: towerX, z: towerZ}, {x: -towerX, z: towerZ},
            {x: towerX, z: -towerZ}, {x: -towerX, z: -towerZ}
        ];

        positions.forEach(pos => {
            this._buildLayherPodium(pos.x, pos.z, baseH);
            
            const tGrp = new THREE.Group();
            tGrp.position.set(pos.x, baseH, pos.z);
            tGrp.add(this.parts.createBase());
            
            const mastH = H - baseH + 1.5;
            let cy = 0.2;
            while(cy < mastH) {
                const sl = (mastH - cy > 2) ? 2 : (mastH - cy);
                const s = this.parts.createMast(sl);
                s.rotation.z = Math.PI/2; s.position.y = cy + sl/2;
                tGrp.add(s);
                cy += sl;
            }
            const sleeve = this.parts.createSleeve();
            sleeve.position.y = H - baseH + 0.25; 
            tGrp.add(sleeve);
            const top = this.parts.createTop();
            top.position.y = mastH;
            tGrp.add(top);

            this.group.add(tGrp);
        });

        this._buildRoofStructure(W, D, H + 0.20, showCanopy, config.prolyteScrim);
    }

    _buildLayherPodium(x, z, h) {
        const size = 2.07;
        if (this.lp.createStandard) {
            const s1 = this.lp.createStandard(h); s1.position.set(x-size/2, 0, z-size/2); this.group.add(s1);
            const s2 = this.lp.createStandard(h); s2.position.set(x+size/2, 0, z-size/2); this.group.add(s2);
            const s3 = this.lp.createStandard(h); s3.position.set(x-size/2, 0, z+size/2); this.group.add(s3);
            const s4 = this.lp.createStandard(h); s4.position.set(x+size/2, 0, z+size/2); this.group.add(s4);

            const deck = this.lp.createEventDeck(size, size);
            deck.position.set(x-size/2, h, z-size/2 + size/2); 
            this.group.add(deck);
        }
    }
}