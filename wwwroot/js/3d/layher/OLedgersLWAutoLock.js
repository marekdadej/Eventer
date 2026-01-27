import * as THREE from 'three';
import { LayherPartsBase } from './LayherCore.js';

/**
 * OLedgersLWAutoLock - O-rygiel LW stalowy z funkcją AutoLock.
 * Zaktualizowano: 
 * - Odsunięcie od osi stojaka o promień rury.
 * - NAKLEJKA: Używa globalnego materiału z logo (z LayherCore).
 */
export class OLedgersLWAutoLock extends LayherPartsBase {
    constructor(length) {
        super();
        this.length = length;
        
        this.data = this._getData();
        this.group = this._build();
        this.group.userData = {
            type: 'OLedgerLWAutoLock',
            nominalLength: this.length,
            actualLength: this.data.actualLength || this.length,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber,
            packQuantity: this.data.packQuantity
        };
    }

    _getData() {
        const dataMap = {
            0.39: { weight: 1.9, packQuantity: 250, catalogNumber: '2601.039' },
            0.45: { weight: 2.1, packQuantity: 250, catalogNumber: '2601.045' },
            0.73: { weight: 2.9, packQuantity: 400, catalogNumber: '2601.073' },
            0.86: { weight: 3.3, packQuantity: 50, catalogNumber: '2601.086' },
            0.90: { weight: 3.4, packQuantity: 50, catalogNumber: '2601.090' },
            1.04: { weight: 3.8, packQuantity: 50, catalogNumber: '2601.103' },
            1.09: { weight: 4.0, packQuantity: 50, catalogNumber: '2601.109' },
            1.29: { weight: 4.6, packQuantity: 50, catalogNumber: '2601.129' },
            1.40: { weight: 5.0, packQuantity: 50, catalogNumber: '2601.140' },
            1.57: { weight: 5.5, packQuantity: 50, catalogNumber: '2601.157' },
            2.07: { weight: 7.0, packQuantity: 50, catalogNumber: '2601.207' },
            2.57: { weight: 8.5, packQuantity: 50, catalogNumber: '2601.257' },
            3.07: { weight: 10.1, packQuantity: 50, catalogNumber: '2601.307' },
            4.14: { weight: 13.4, packQuantity: 50, catalogNumber: '2601.414' }
        };

        if (!dataMap[this.length]) {
            return { 
                weight: this.length * 3.3, 
                packQuantity: 50, 
                catalogNumber: 'CUSTOM' 
            };
        }

        return dataMap[this.length];
    }

    _build() {
        const group = new THREE.Group();
        const len = this.length;
        const rPipe = 0.02415; 

        // ODSUNIĘCIE STOJAKA
        const standOffset = 0.025;
        const headOffset = 0.048; 

        const totalStart = standOffset + headOffset;
        const totalEnd = len - (standOffset + headOffset);
        const tubeLen = totalEnd - totalStart;

        // Główna rura
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(rPipe, rPipe, tubeLen, 24),
            this.matGalvNew
        );
        tube.rotation.z = Math.PI / 2;
        tube.position.x = len / 2;
        group.add(tube);

        // Głowice AutoLock
        this._addAutoLockHead(group, standOffset);
        this._addAutoLockHead(group, len - standOffset);

        // --- NAKLEJKA Z LOGO (PÓŁ-WALEC) ---
        const stickerWidth = 0.16; // Fizyczna szerokość naklejki na rurze
        const stickerGeo = new THREE.CylinderGeometry(
            rPipe + 0.0015, 
            rPipe + 0.0015, 
            stickerWidth, 
            32, 1, 
            true,           // openEnded
            0, Math.PI      // thetaLength: Półkole
        );
        
        // Używamy globalnego materiału z LayherCore
        const sticker = new THREE.Mesh(stickerGeo, this.matStickerLogo);
        
        // Orientacja naklejki
        sticker.rotation.z = Math.PI / 2; 
        sticker.rotation.y = -Math.PI / 2; 
        
        sticker.position.x = len / 2;
        group.add(sticker);

        // Nity
        const rivetCount = Math.floor(tubeLen / 0.5);
        for (let i = 1; i <= rivetCount; i++) {
            const rx = totalStart + i * 0.5;
            if (rx < totalEnd) {
                // Nie dajemy nita pod naklejką
                if (Math.abs(rx - len/2) > 0.1) {
                    const riv = new THREE.Mesh(this.geoRivet, this.matHighSteel);
                    riv.position.set(rx, rPipe + 0.002, 0);
                    group.add(riv);
                }
            }
        }

        group.castShadow = true;
        group.receiveShadow = true;

        return group;
    }

    _addAutoLockHead(group, x) {
        const head = new THREE.Mesh(this.geoWedgeHead, this.matCastSteel);
        const wedge = new THREE.Mesh(this.geoWedge, this.matHighSteel);

        const isRight = (x > this.length / 2);

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

        // Mechanizm AutoLock (plastik) - zostawiamy czerwony
        const autoLockGeo = new THREE.BoxGeometry(0.04, 0.05, 0.03);
        const autoLock = new THREE.Mesh(autoLockGeo, this.matPlasticRed);
        
        if (isRight) {
            autoLock.position.set(x - 0.02, 0.06, 0);
            autoLock.rotation.z = 0.2; 
        } else {
            autoLock.position.set(x + 0.02, 0.06, 0);
            autoLock.rotation.z = -0.2; 
        }
        
        group.add(autoLock);
    }
}

/**
 * GuardRailT13 - Poręcz T13 (O-Guardrail) o wysokości 1.0m.
 */
export class GuardRailT13 extends LayherPartsBase {
    constructor(length) {
        super();
        this.length = length; 
        this.data = this._getData();
        this.group = this._build();
        this.group.userData = {
            type: 'GuardRailT13',
            length: this.length,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber,
            packQuantity: this.data.packQuantity
        };
    }

    _getData() {
        const dataMap = {
            1.04: { weight: 8.1, packQuantity: 40, catalogNumber: '5417.104' },
            2.07: { weight: 14.4, packQuantity: 40, catalogNumber: '5417.207' },
            2.57: { weight: 18.7, packQuantity: 40, catalogNumber: '5417.257' }
        };

        if (!dataMap[this.length]) {
            return { 
                weight: this.length * 7.0, 
                packQuantity: 40, 
                catalogNumber: 'CUSTOM-T13' 
            };
        }
        return dataMap[this.length];
    }

    _build() {
        const group = new THREE.Group();
        const len = this.length;
        const rPipe = 0.02;
        const standOffset = 0.025;
        const railLen = len - 2 * standOffset;

        // 1. Rura Górna (1.0m)
        const topRail = new THREE.Mesh(
            new THREE.CylinderGeometry(rPipe, rPipe, railLen, 12),
            this.matGalvNew
        );
        topRail.rotation.z = Math.PI / 2;
        topRail.position.set(len / 2, 1.0, 0);
        group.add(topRail);

        // 2. Rura Środkowa (0.5m)
        const midRail = new THREE.Mesh(
            new THREE.CylinderGeometry(rPipe, rPipe, railLen, 12),
            this.matGalvNew
        );
        midRail.rotation.z = Math.PI / 2;
        midRail.position.set(len / 2, 0.5, 0);
        group.add(midRail);

        // 3. Piony
        const vHeight = 0.5;
        const vGeo = new THREE.CylinderGeometry(rPipe, rPipe, vHeight, 12);
        
        const vLeft = new THREE.Mesh(vGeo, this.matGalvNew);
        vLeft.position.set(standOffset + 0.05, 0.75, 0); 
        group.add(vLeft);

        const vRight = new THREE.Mesh(vGeo, this.matGalvNew);
        vRight.position.set(len - standOffset - 0.05, 0.75, 0);
        group.add(vRight);

        // 4. Głowice
        this._addWedgeHead(group, standOffset, 0.5);
        this._addWedgeHead(group, standOffset, 1.0);
        this._addWedgeHead(group, len - standOffset, 0.5, true);
        this._addWedgeHead(group, len - standOffset, 1.0, true);

        // 5. Pręty
        const bars = Math.floor(len / 0.12) - 1; 
        if (bars > 0) {
            const barGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6);
            const step = railLen / (bars + 1);
            const startX = standOffset;

            for(let i=1; i<=bars; i++) {
                const bx = startX + i * step;
                const barBetween = new THREE.Mesh(barGeo, this.matGalvNew);
                barBetween.position.set(bx, 0.75, 0);
                group.add(barBetween);
            }
        }

        group.castShadow = true;
        group.receiveShadow = true;
        return group;
    }

    _addWedgeHead(group, x, y, isRight = false) {
        const head = new THREE.Mesh(this.geoWedgeHead, this.matCastSteel);
        const wedge = new THREE.Mesh(this.geoWedge, this.matHighSteel);

        if (isRight) {
            head.rotation.y = Math.PI;
            head.position.set(x, y, 0);
            wedge.position.set(x - 0.025, y + 0.045, 0);
        } else {
            head.position.set(x, y, 0);
            wedge.position.set(x + 0.025, y + 0.045, 0);
        }
        
        group.add(head);
        group.add(wedge);
    }
}