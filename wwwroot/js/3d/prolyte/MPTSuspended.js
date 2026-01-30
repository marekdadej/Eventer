import * as THREE from 'three';
import { MPTStandard } from './MPTStandard.js';

import { LayherPartsBase } from '../layher/LayherPartsBase.js';

export class MPTSuspended extends MPTStandard {
    constructor(scene) {
        super(scene);
        this.lp = new LayherPartsBase();
    }

    build(config) {
        this.clear();
        const W = parseFloat(config.width) || 12.0;
        const D = parseFloat(config.depth) || 10.0;
        const H = parseFloat(config.height) || 8.0;
        const showCanopy = config.showCanopy !== false;
        
        const gridY = H; 
        this._buildRoofGrid(W, D, gridY, showCanopy);

        const towerSpreadX = W + 3.0; 
        const towerSpreadZ = D + 2.0; 
        const towerH = H + 2.0; 

        const towers = [
            {x: towerSpreadX/2, z: towerSpreadZ/2},
            {x: -towerSpreadX/2, z: towerSpreadZ/2},
            {x: towerSpreadX/2, z: -towerSpreadZ/2},
            {x: -towerSpreadX/2, z: -towerSpreadZ/2}
        ];

        towers.forEach(t => {
            this._buildLayherSupportTower(t.x, t.z, towerH);
            
            this._addCantilever(t.x, t.z, towerH, W/2, D/2, gridY);
        });
    }

    _buildLayherSupportTower(x, z, h) {
        const size = 2.07;
        
        if (!this.lp.createStandard || !this.lp.createLedgerO) {
            console.warn("Brak metod Layher w MPTSuspended. Sprawdź plik LayherPartsBase.");
            return;
        }

        const offs = [-size/2, size/2];
        offs.forEach(ox => {
            offs.forEach(oz => {
                const std = this.lp.createStandard(h);
                std.position.set(x + ox, 0, z + oz);
                this.group.add(std);
            });
        });
        
        for(let y=2; y<=h; y+=2) {
            const ledX = this.lp.createLedgerO(size);
            ledX.position.set(x, y, z - size/2);
            this.group.add(ledX);
            
            const ledX2 = ledX.clone(); 
            ledX2.position.z = z + size/2; 
            this.group.add(ledX2);
            
            const ledZ = this.lp.createLedgerO(size);
            ledZ.rotation.y = Math.PI/2;
            ledZ.position.set(x - size/2, y, z);
            this.group.add(ledZ);
            
            const ledZ2 = ledZ.clone(); 
            ledZ2.position.x = x + size/2; 
            this.group.add(ledZ2);
        }
    }

    _addCantilever(tx, tz, th, roofHalfW, roofHalfD, roofH) {
        const targetX = (tx > 0) ? roofHalfW : -roofHalfW;
        const targetZ = (tz > 0) ? roofHalfD : -roofHalfD;
        
        const armLen = 2.5;
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(armLen, 0.2, 0.1), 
            new THREE.MeshStandardMaterial({color:0x333333})
        );
        
        const dir = (tx > 0) ? -1 : 1; 
        arm.position.set(tx + (dir * armLen/2), th - 0.5, tz);
        this.group.add(arm);

  
        const hookX = tx + (dir * (armLen - 0.2)); 
        const start = new THREE.Vector3(hookX, th - 0.6, tz);
        const end = new THREE.Vector3(targetX, roofH, targetZ); 
        
        const dist = start.distanceTo(end);
        
        const chain = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, dist), 
            new THREE.MeshStandardMaterial({color:0x111111})
        );
        
        chain.position.copy(start).lerp(end, 0.5);
        chain.lookAt(end);
        chain.rotateX(Math.PI/2); 
        this.group.add(chain);
    }
}