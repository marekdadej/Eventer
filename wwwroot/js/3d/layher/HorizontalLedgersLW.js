import * as THREE from 'three';
import { LayherPartsBase } from './LayherCore.js';

export class HorizontalLedgersLW extends LayherPartsBase {
    constructor(fieldLength, fieldWidth) {
        super();
        this.fieldLength = fieldLength; 
        this.fieldWidth = fieldWidth;  
        
        this.data = this._getData();
        
        this.group = this._build();
        
        this.group.userData = {
            type: 'HorizontalLedgerLW',
            lengthField: this.fieldLength,
            widthField: this.fieldWidth,
            actualLength: this.data.actualLength,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber
        };
    }

    _getData() {
        const dataMap = {
            0.73: { actualLength: 0.73, weight: 3.2, catalogNumber: '2603.073' },
            1.04: { actualLength: 1.04, weight: 4.0, catalogNumber: '2603.103' },
            1.09: { actualLength: 1.09, weight: 4.2, catalogNumber: '2603.109' },
            1.40: { actualLength: 1.40, weight: 5.1, catalogNumber: '2603.140' },
            1.57: { actualLength: 1.57, weight: 5.6, catalogNumber: '2603.157' },
            2.07: { actualLength: 2.07, weight: 7.2, catalogNumber: '2603.207' },
            2.57: { actualLength: 2.57, weight: 8.8, catalogNumber: '2603.257' },
            3.07: { actualLength: 3.07, weight: 10.3, catalogNumber: '2603.307' },
            4.14: { actualLength: 4.14, weight: 13.7, catalogNumber: '2603.414' }
        };

        if (dataMap[this.fieldLength]) {
            return dataMap[this.fieldLength];
        }
        
        return { 
            actualLength: this.fieldLength, 
            weight: this.fieldLength * 3.5, 
            catalogNumber: 'CUSTOM' 
        };
    }

    _build() {
        const group = new THREE.Group();
        const len = this.data.actualLength;
        const rPipe = 0.02415; 

        const standOffset = 0.025; 

        const headConstructionOffset = 0.048; 
 
        const totalStart = standOffset + headConstructionOffset;
        const totalEnd = len - (standOffset + headConstructionOffset);
        
        const tubeLen = totalEnd - totalStart;

        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(rPipe, rPipe, tubeLen, 24),
            this.matGalvNew
        );
        tube.rotation.z = Math.PI / 2;
        tube.position.x = len / 2;
        group.add(tube);

        this._addWedgeHead(group, standOffset);
        this._addWedgeHead(group, len - standOffset);

        const stickerH = 0.08;
        const stickerGeo = new THREE.CylinderGeometry(rPipe + 0.001, rPipe + 0.001, stickerH, 32, 1, true);
        const sticker = new THREE.Mesh(stickerGeo, this.matPlasticRed);
        sticker.rotation.z = Math.PI / 2;
        sticker.position.x = len / 2;
        group.add(sticker);

        const rivetCount = Math.floor(tubeLen / 0.5);
        for (let i = 1; i <= rivetCount; i++) {
   
            const rx = totalStart + i * 0.5;
            
            if (rx < totalEnd) {
                const riv = new THREE.Mesh(this.geoRivet, this.matHighSteel);
                riv.position.set(rx, rPipe, 0); 
                group.add(riv);
                
                const riv2 = riv.clone();
                riv2.position.set(rx, -rPipe, 0); 
                riv2.rotation.x = Math.PI;
                group.add(riv2);
            }
        }

        group.castShadow = true;
        group.receiveShadow = true;

        return group;
    }

    _addWedgeHead(group, x) {
        const head = new THREE.Mesh(this.geoWedgeHead, this.matCastSteel);
        const wedge = new THREE.Mesh(this.geoWedge, this.matHighSteel);

        const isRight = (x > this.data.actualLength / 2);

        if (isRight) {
            head.rotation.y = Math.PI;
            head.position.x = x;
            wedge.position.set(x - 0.025, 0.045, 0);
        } else {
            head.position.x = x;
            wedge.position.set(x + 0.025, 0.045, 0);
        }
        
        group.add(head);
        group.add(wedge);
    }
}