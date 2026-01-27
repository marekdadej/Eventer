import * as THREE from 'three';
import { LayherPartsBase } from './LayherCore.js';

/**
 * Decks - Podesty Layher oraz Elementy Systemu Peri.
 * Zaktualizowano:
 * - Ramka aluminiowa ciągła (2mm grubości), zlicowana ze sklejką.
 * - Obsługa plastikowych zaślepek (narożników) sterowana przez setCorners.
 * - ZWIĘKSZONO LICZBĘ NITÓW (gęstszy rozstaw 0.12m).
 * - NOWA NAKLEJKA: Czarne tło + żółty napis "Agencja Eventer".
 */
export class Decks extends LayherPartsBase {
    constructor(length, width, variant = 'i6') { 
        super();
        this.length = length;
        this.width = width;
        this.variant = variant;
        
        // Flagi narożników [Lewy-Tył, Prawy-Tył, Prawy-Przód, Lewy-Przód]
        // true = wstaw plastik (środek sceny / przód), false = brak plastiku (tył/boki pod barierki)
        this.cornersState = [true, true, true, true]; 
        this.cornerMeshes = [];

        // Inicjalizacja materiałów
        if (!this.matPeriPlywood) this._initPeriMaterials();
        this._initLogoMaterial();

        this.data = this._getData();
        this.group = this._build();
        
        this.group.userData = {
            type: 'Deck',
            variant: this.variant,
            length: this.length,
            width: this.width,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber
        };
    }

    /**
     * Ustawia widoczność plastikowych zaślepek w narożnikach.
     * Używane przez StageFloorSystem do usuwania plastików na krawędziach pod barierki.
     */
    setCorners(nw, ne, se, sw) {
        this.cornersState = [nw, ne, se, sw];
        if (this.cornerMeshes.length === 4) {
            this.cornerMeshes[0].visible = nw;
            this.cornerMeshes[1].visible = ne;
            this.cornerMeshes[2].visible = se;
            this.cornerMeshes[3].visible = sw;
        }
    }

    _initPeriMaterials() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#252525';
        ctx.lineWidth = 2;
        const step = 32;
        ctx.beginPath();
        for (let i = -512; i < 1024; i += step) {
            ctx.moveTo(i, 0); ctx.lineTo(i + 512, 512);
            ctx.moveTo(i + 512, 0); ctx.lineTo(i, 512);
        }
        ctx.stroke();
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 4);

        this.matPeriPlywood = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            bumpMap: texture,
            bumpScale: 0.02,
            side: THREE.DoubleSide
        });

        this.matPeriBeam = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6, metalness: 0.1 });
        this.matPlasticCorner = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.1 });
        
        // Materiał na nity
        this.matRivet = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.3, metalness: 0.8 });
    }

    _initLogoMaterial() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // ZMIANA: Czarne tło
        ctx.fillStyle = '#000000'; 
        ctx.fillRect(0, 0, 512, 128);

        // ZMIANA: Żółty napis "Agencja Eventer"
        ctx.fillStyle = '#FFD700'; // Złoty/Żółty
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Agencja Eventer', 256, 64);

        // ZMIANA: Żółta ramka
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, 492, 108);

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 16;
        this.matLayherLogo = new THREE.MeshBasicMaterial({ map: texture });
    }

    _getData() {
        const i6Data = {
            0.73: { weight: 5.6, catalogNumber: '3883.073' },
            1.04: { weight: 7.4, catalogNumber: '3883.104' },
            1.57: { weight: 10.5, catalogNumber: '3883.157' },
            2.07: { weight: 13.4, catalogNumber: '3883.207' },
            2.57: { weight: 16.4, catalogNumber: '3883.257' },
            3.07: { weight: 19.3, catalogNumber: '3883.307' }
        };
        const eventT16 = { 'def': { weight: 34.3, catalogNumber: '5402.xxx' } };
        const periPlywoodData = { weight: 25.0, catalogNumber: 'PERI.PLY.250' };
        const periBeamData = { weight: this.length * 5.9, catalogNumber: `PERI.GT24.${(this.length*100).toFixed(0)}` };
        const periBayData = { weight: (this.length * this.width) * 30, catalogNumber: 'PERI.SYSTEM.BAY' };

        if (this.variant === 'periPlywood') return periPlywoodData;
        if (this.variant === 'periBeam') return periBeamData;
        if (this.variant === 'periBay') return periBayData;
        if (this.variant === 'eventT16') return eventT16['def'];
        
        return i6Data[this.length] || { weight: 10, catalogNumber: 'CUSTOM' };
    }

    _build() {
        const group = new THREE.Group();
        const len = this.length; 
        const w = this.width;    

        // 1. PERI BAY
        if (this.variant === 'periBay') {
            const beamHeight = 0.24;
            let numBeams = Math.ceil(w / 0.5) + 1; 
            if (numBeams < 3) numBeams = 3;
            const margin = 0.10; 
            const effectiveW = w - 2*margin;
            const stepZ = effectiveW / (numBeams - 1);
            const startZ = -effectiveW / 2;
            for(let i=0; i<numBeams; i++) {
                const zPos = startZ + i * stepZ;
                const beam = this._createPeriBeam(len);
                beam.position.set(len/2, beamHeight/2, zPos); 
                group.add(beam);
            }
            const plyThick = 0.027;
            const ply = this._createPeriPlywoodSheet(len, w, plyThick);
            ply.position.set(len/2, beamHeight + plyThick/2, 0);
            group.add(ply);
            return group;
        }

        // 2. ELEMENTY POJEDYNCZE PERI
        if (this.variant === 'periBeam') {
            const beam = this._createPeriBeam(len);
            beam.position.set(len/2, 0.12, 0);
            group.add(beam);
            return group;
        }
        if (this.variant === 'periPlywood') {
            const ply = this._createPeriPlywoodSheet(2.5, 1.25, 0.021);
            ply.position.set(1.25, 0.01, 0);
            group.add(ply);
            return group;
        }

        // 3. LAYHER EVENT T16
        if (this.variant === 'eventT16') {
            const frameHeight = 0.086;  
            const plyThick = 0.012;     
            const topY = frameHeight;   
            const borderW = 0.002;      
            const cutSize = 0.055;      

            // Helper kształtu
            const createChamferedRect = (L, W, cut) => {
                const s = new THREE.Shape();
                const hl = L / 2;
                const hw = W / 2;
                s.moveTo(-hl + cut, -hw);
                s.lineTo(hl - cut, -hw);
                s.lineTo(hl, -hw + cut);
                s.lineTo(hl, hw - cut);
                s.lineTo(hl - cut, hw);
                s.lineTo(-hl + cut, hw);
                s.lineTo(-hl, hw - cut);
                s.lineTo(-hl, -hw + cut);
                s.closePath();
                return s;
            };

            // A. RAMKA ALUMINIOWA
            const outerShape = createChamferedRect(len, w, cutSize);
            const innerShape = createChamferedRect(len - 2*borderW, w - 2*borderW, cutSize);
            outerShape.holes.push(innerShape);

            const frameGeo = new THREE.ExtrudeGeometry(outerShape, { depth: frameHeight, bevelEnabled: false, curveSegments: 1 });
            frameGeo.rotateX(Math.PI / 2);
            frameGeo.translate(len/2, topY, 0);
            const frame = new THREE.Mesh(frameGeo, this.matAlu);
            group.add(frame);

            // B. SKLEJKA
            const plyGeo = new THREE.ExtrudeGeometry(innerShape, { depth: plyThick, bevelEnabled: false });
            plyGeo.rotateX(Math.PI / 2);
            plyGeo.translate(len/2, topY, 0);
            const plywood = new THREE.Mesh(plyGeo, this.matPlywoodEvent);
            group.add(plywood);

            // C. NITY (Rivets) - Gęste (co 12cm)
            const rivetSpacing = 0.12; 
            const rivetMargin = borderW + 0.015; 
            const rivetGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.002, 8);
            const rivetY = topY + 0.0005;

            // Długie boki
            const countX = Math.floor((len - 2*cutSize) / rivetSpacing);
            const stepX = (len - 2*cutSize) / countX;
            const startX = cutSize; 

            for(let side of [-1, 1]) {
                const zPos = side * (w/2 - rivetMargin);
                for(let i=1; i<countX; i++) {
                    const xPos = startX + i*stepX;
                    const r = new THREE.Mesh(rivetGeo, this.matRivet);
                    r.position.set(xPos, rivetY, zPos);
                    group.add(r);
                }
            }

            // Krótkie boki
            const countZ = Math.floor((w - 2*cutSize) / rivetSpacing);
            const stepZ = (w - 2*cutSize) / countZ;
            
            for(let endX of [rivetMargin, len - rivetMargin]) { 
                for(let i=1; i<countZ; i++) {
                    const zPos = -w/2 + cutSize + i*stepZ;
                    const r = new THREE.Mesh(rivetGeo, this.matRivet);
                    r.position.set(endX, rivetY, zPos);
                    group.add(r);
                }
            }

            // D. NAKLEJKA "AGENCJA EVENTER" (ZMODYFIKOWANA)
            const stickerW = 0.30;
            const stickerH = 0.06;
            const stickerGeo = new THREE.PlaneGeometry(stickerW, stickerH);
            
            const sticker1 = new THREE.Mesh(stickerGeo, this.matLayherLogo);
            sticker1.position.set(len/2, frameHeight/2, w/2 + 0.0015);
            group.add(sticker1);

            const sticker2 = sticker1.clone();
            sticker2.rotation.y = Math.PI;
            sticker2.position.z = -w/2 - 0.0015;
            group.add(sticker2);

            // E. NAROŻNIKI PLASTIKOWE (INSERTS)
            const cornerShape = new THREE.Shape();
            cornerShape.moveTo(0, 0);
            cornerShape.lineTo(cutSize, 0);
            cornerShape.lineTo(0, cutSize);
            cornerShape.closePath();

            const cornerGeo = new THREE.ExtrudeGeometry(cornerShape, { depth: plyThick, bevelEnabled: false });
            cornerGeo.rotateX(Math.PI / 2);

            const addCorner = (xGlobal, zGlobal, rotationY) => {
                const mesh = new THREE.Mesh(cornerGeo, this.matPlasticCorner);
                mesh.position.set(xGlobal, topY, zGlobal);
                mesh.rotation.y = rotationY;
                group.add(mesh);
                this.cornerMeshes.push(mesh);
            };

            addCorner(0, -w/2, 0); 
            addCorner(len, -w/2, Math.PI / 2);
            addCorner(len, w/2, Math.PI);
            addCorner(0, w/2, -Math.PI / 2);

            // F. HAKI (Ukryte)
            const endCapW = 0.05; 
            const subY = topY - frameHeight;
            const hookShape = new THREE.Shape();
            hookShape.moveTo(0, subY + 0.04);
            hookShape.lineTo(endCapW, subY + 0.04);
            hookShape.lineTo(endCapW, subY); 
            hookShape.lineTo(0, subY);
            hookShape.closePath();

            const hookGeo = new THREE.ExtrudeGeometry(hookShape, { depth: w - 2*cutSize, bevelEnabled: false });
            hookGeo.translate(0, 0, -(w - 2*cutSize)/2);

            const hookL = new THREE.Mesh(hookGeo, this.matAlu);
            hookL.position.set(0, 0, 0); 
            group.add(hookL);

            const hookR = new THREE.Mesh(hookGeo, this.matAlu);
            hookR.rotation.y = Math.PI;
            hookR.position.set(len, 0, 0); 
            group.add(hookR);

        } else {
            // I6 Stalowy
            const plateH = 0.054;
            const plateGeo = new THREE.BoxGeometry(len, plateH, w);
            const plate = new THREE.Mesh(plateGeo, this.matGalvNew);
            plate.position.set(len / 2, plateH / 2, 0);
            group.add(plate);
        }

        group.castShadow = true;
        group.receiveShadow = true;
        return group;
    }

    _createPeriBeam(length) {
        const geo = new THREE.BoxGeometry(length, 0.24, 0.08); 
        return new THREE.Mesh(geo, this.matPeriBeam);
    }
    _createPeriPlywoodSheet(len, wid, thick) {
        return new THREE.Mesh(new THREE.BoxGeometry(len, thick, wid), this.matPeriPlywood);
    }
}