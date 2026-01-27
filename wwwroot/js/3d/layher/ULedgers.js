import * as THREE from 'three';
import { LayherPartsBase } from './LayherCore.js';

/**
 * ULedgers - U-rygle (Trawersy).
 * Zaktualizowano: Odsunięcie od osi stojaka o promień rury (brak przenikania).
 */
export class ULedgers extends LayherPartsBase {
    constructor(length, variant = 'lwT14') { 
        super();
        this.length = length;
        this.variant = variant;
        this.data = this._getData();
        this.group = this._build();
        this.group.userData = {
            type: 'ULedger',
            variant: this.variant,
            length: this.length,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber
        };
    }

    _getData() {
        const eventData = {
            0.73: { weight: 4.5, catalogNumber: '5400.073' }, 
            1.04: { weight: 6.0, catalogNumber: '5400.104' },
            1.09: { weight: 6.3, catalogNumber: '5400.109' },
            1.40: { weight: 8.0, catalogNumber: '5400.140' },
            1.57: { weight: 9.0, catalogNumber: '5400.157' },
            2.07: { weight: 12.0, catalogNumber: '5400.207' },
            2.57: { weight: 15.0, catalogNumber: '5400.257' },
            3.07: { weight: 18.0, catalogNumber: '5400.307' }
        };

        const lwT14Data = {
            0.73: { weight: 3.1, catalogNumber: '2618.073' },
            1.04: { weight: 4.2, catalogNumber: '2618.103' },
            1.09: { weight: 4.3, catalogNumber: '2618.109' },
            1.40: { weight: 5.4, catalogNumber: '2618.139' },
            1.57: { weight: 5.9, catalogNumber: '2618.157' },
            2.07: { weight: 7.7, catalogNumber: '2618.207' },
            2.57: { weight: 9.4, catalogNumber: '2618.257' },
            3.07: { weight: 11.2, catalogNumber: '2618.307' }
        };

        const lwT14ReinforcedData = {
            1.40: { weight: 8.9, catalogNumber: '2618.140' },
            1.57: { weight: 9.4, catalogNumber: '2613.157' },
            2.07: { weight: 12.7, catalogNumber: '2613.207' },
            2.57: { weight: 15.7, catalogNumber: '2613.257' },
            3.07: { weight: 19.0, catalogNumber: '2613.307' }
        };

        let map;
        if (this.variant === 'event') map = eventData;
        else if (this.variant === 'lwT14Reinforced') map = lwT14ReinforcedData;
        else map = lwT14Data;

        if (!map[this.length]) {
            return { weight: this.length * 5.0, catalogNumber: 'CUSTOM' };
        }
        return map[this.length];
    }

    _build() {
        const group = new THREE.Group();
        const len = this.length;
        const isAlu = this.variant === 'event';
        const mat = isAlu ? this.matAlu : this.matGalvNew;

        // ODSUNIĘCIE STOJAKA (Promień rury ~2.4cm + luz)
        const standOffset = 0.025;

        // Offset konstrukcyjny głowicy U
        const headOffset = isAlu ? 0.038 : 0.045; 
        
        // Długość samego profilu U
        const profileLen = len - 2 * (standOffset + headOffset);

        // 1. Profil U
        let shape;
        let profileHeight;

        if (isAlu) {
            // Wariant Event (Trawersa wysoka)
            profileHeight = 0.22; 
            const w = 0.045;
            const slotW = 0.02;
            const slotD = 0.035;

            shape = new THREE.Shape();
            shape.moveTo(-w/2, -profileHeight/2);
            shape.lineTo(w/2, -profileHeight/2);
            shape.lineTo(w/2, profileHeight/2);
            shape.lineTo(slotW/2, profileHeight/2); 
            shape.lineTo(slotW/2, profileHeight/2 - slotD); 
            shape.lineTo(-slotW/2, profileHeight/2 - slotD);
            shape.lineTo(-slotW/2, profileHeight/2);
            shape.lineTo(-w/2, profileHeight/2);
            shape.closePath();
        } else {
            // Standard LW
            profileHeight = 0.054;
            shape = this._buildUProfileShape(this.variant);
        }

        const geo = new THREE.ExtrudeGeometry(shape, { depth: profileLen, bevelEnabled: false });
        
        // Obrót i pozycja
        geo.rotateY(Math.PI / 2);
        // Przesuwamy profil o (standOffset + headOffset) od zera
        geo.translate(standOffset + headOffset, 0, 0);

        const profile = new THREE.Mesh(geo, mat);
        group.add(profile);

        // 2. Głowice (z uwzględnieniem standOffset)
        this._addWedgeHeads(group, len, standOffset);

        // 3. Naklejka (Płaska)
        const stickerW = 0.12;
        const stickerH = 0.05;
        const stickerGeo = new THREE.PlaneGeometry(stickerW, stickerH);
        const stickerOffsetZ = 0.026; 

        const s1 = new THREE.Mesh(stickerGeo, this.matStickerRed || this.matPlasticRed);
        s1.position.set(len / 2, 0, stickerOffsetZ);
        group.add(s1);

        const s2 = s1.clone();
        s2.rotation.x = Math.PI; 
        s2.position.z = -stickerOffsetZ;
        group.add(s2);

        // 4. Wzmocnienie (dla lwT14Reinforced)
        if (this.variant === 'lwT14Reinforced') {
            const trussH = 0.4;
            const rPipe = 0.02;
            const bottomChord = new THREE.Mesh(
                new THREE.CylinderGeometry(rPipe, rPipe, profileLen, 16),
                this.matGalvNew
            );
            bottomChord.rotation.z = Math.PI / 2;
            bottomChord.position.set(len / 2, -trussH, 0);
            group.add(bottomChord);

            const step = 0.5;
            const steps = Math.floor(profileLen / step);
            // Start kratownicy też przesunięty
            const startX = standOffset + headOffset;
            
            for (let i = 0; i < steps; i++) {
                const x1 = startX + i * step;
                const x2 = startX + (i + 1) * step;
                // Krzyżulce
                this._addTube(group, x1, 0, 0, x2, -trussH, 0, 0.012);
                this._addTube(group, x2, 0, 0, x1, -trussH, 0, 0.012);
            }
        }

        group.castShadow = true;
        group.receiveShadow = true;

        return group;
    }

    _addWedgeHeads(group, length, offset) {
        // Lewa głowica
        const headL = new THREE.Mesh(this.geoWedgeHead, this.matCastSteel);
        headL.position.x = offset; 
        group.add(headL);
        const wedgeL = new THREE.Mesh(this.geoWedge, this.matHighSteel);
        wedgeL.position.set(offset + 0.025, 0.045, 0);
        group.add(wedgeL);

        // Prawa głowica
        const headR = headL.clone();
        headR.rotation.y = Math.PI;
        headR.position.x = length - offset; 
        group.add(headR);
        const wedgeR = new THREE.Mesh(this.geoWedge, this.matHighSteel);
        wedgeR.position.set(length - offset - 0.025, 0.045, 0);
        group.add(wedgeR);
    }

    _addTube(group, x1, y1, z1, x2, y2, z2, r) {
        const v1 = new THREE.Vector3(x1, y1, z1);
        const v2 = new THREE.Vector3(x2, y2, z2);
        const len = v1.distanceTo(v2);
        const geo = new THREE.CylinderGeometry(r, r, len, 8);
        geo.rotateX(Math.PI / 2);
        const mesh = new THREE.Mesh(geo, this.matGalvNew);
        const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        mesh.position.copy(mid);
        mesh.lookAt(v2);
        group.add(mesh);
    }
}