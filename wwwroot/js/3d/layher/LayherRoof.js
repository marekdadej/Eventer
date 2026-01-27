import * as THREE from 'three';
import { LayherPartsBase } from './LayherPartsBase.js';
import { VerticalStandardsLW, HorizontalLedgersLW } from './LayherPartsBase.js';
import { LayherAccessories } from './LayherAccessories.js';

export class LayherRoof {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.lpBase = new LayherPartsBase();
        this.accessories = new LayherAccessories();
        
        this.initMaterials();
    }

    initMaterials() {
        this.matCanvas = new THREE.MeshStandardMaterial({
            color: 0x111111, 
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        // Materiał siatki (scrim)
        this.matScrim = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.65, 
            side: THREE.DoubleSide,
            wireframe: false 
        });
    }

    clear() {
        this.group.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
        this.group.clear();
    }

    build(config) {
        this.clear();

        let width = parseFloat(config.width) || 6.21;
        if (width > 6.21) width = 6.21;

        let depth = parseFloat(config.depth) || 4.14;
        
        // --- 1. WYSOKOŚCI DACHU ---
        const frontH = 3.0; 
        const backH = 2.5; 

        const frontGirderBottomY = frontH - 0.5;
        const backGirderBottomY = backH - 0.5;

        const halfW = width / 2;
        const halfD = depth / 2;

        // --- 2. STOJAKI DACHOWE (SKRAJNE) ---
        // Przód
        this._placeRoofColumn(halfW, frontH, halfD, false);  
        this._placeRoofColumn(-halfW, frontH, halfD, false); 
        // Tył (isBack = true -> wymuszenie 2.5m)
        this._placeRoofColumn(halfW, backH, -halfD, true);  
        this._placeRoofColumn(-halfW, backH, -halfD, true); 

        // --- 3. DŹWIGARY O-ALU ---
        this._buildLatticeGirderO(width, frontGirderBottomY, halfD); 
        this._buildLatticeGirderO(width, backGirderBottomY, -halfD);

        // --- 4. KROKWIE ---
        const rPipe = 0.024;
        const startY = frontH + rPipe; 
        const endY = backH + rPipe;
        this._buildRafters(width, depth, startY, endY);

        // --- 5. PLANDEKA ---
        this._buildCanopy(width, depth, startY, endY);

        // --- 6. SIATKI (SCRIMS) ---
        if (config.layherScrim || config.hasScrim) {
            // Obliczamy dokładną wysokość, do której ma sięgać siatka
            // startY/endY to góra rury krokwi. Dodajemy minimalny margines na plandekę.
            const scrimFrontH = startY + 0.02; 
            const scrimBackH = endY + 0.02;
            
            this._buildScrims(width, depth, scrimFrontH, scrimBackH);
        }
    }

    _placeRoofColumn(x, targetHeight, z, isBack) {
        let stdLen = 2.0;
        
        if (targetHeight >= 3.8) stdLen = 4.0;
        else if (targetHeight >= 2.8) stdLen = 3.0;
        else if (targetHeight >= 2.3) stdLen = 2.5;
        else if (targetHeight >= 1.8) stdLen = 2.0;
        else stdLen = 1.0;

        if (isBack) {
            stdLen = 2.5;
        }

        const std = new VerticalStandardsLW(stdLen, 'withoutSpigot');
        std.group.position.set(x, 0, z);
        
        this._addConnectionDetail(std.group, 0);

        this.group.add(std.group);
    }

    _addConnectionDetail(group, yPos) {
        const spigot = this.accessories.createSpigotConnector(true);
        spigot.position.y = yPos;
        group.add(spigot);

        const bolt = this.accessories.createSpecialBoltM12();
        bolt.position.set(0, yPos - 0.35, 0); 
        group.add(bolt);

        const pin = this.accessories.createRedLockingPin();
        pin.position.set(0, yPos + 0.15, 0);
        group.add(pin);
    }

    _buildLatticeGirderO(len, yPosBottomChord, zPos) {
        const group = new THREE.Group();
        const trussH = 0.5; 
        const rChord = 0.024; 
        const rBrace = 0.015; 
        const mat = this.lpBase.matAlu; 

        const effectiveLen = len - 0.1; 
        const botChord = new THREE.Mesh(new THREE.CylinderGeometry(rChord, rChord, effectiveLen, 16), mat);
        botChord.rotation.z = Math.PI / 2;
        group.add(botChord);

        const topChord = botChord.clone();
        topChord.position.y = trussH;
        group.add(topChord);

        const step = 0.5; 
        const count = Math.ceil(len / step);
        const dx = len / count;
        const startX = -len / 2;

        for(let i=0; i<count; i++) {
            const x1 = startX + i*dx;
            const x2 = startX + (i+1)*dx;
            this._addTube(group, x1, 0, 0, x2, trussH, 0, rBrace, mat);
            this._addTube(group, x2, 0, 0, x2, trussH, 0, rBrace, mat);
        }

        const addHeads = (x, rotY) => {
            const h1 = new THREE.Mesh(this.lpBase.geoWedgeHead, this.lpBase.matCastSteel);
            h1.rotation.y = rotY;
            h1.position.set(x, 0, 0);
            group.add(h1);
            
            const h2 = h1.clone();
            h2.position.set(x, trussH, 0);
            group.add(h2);

            const w1 = new THREE.Mesh(this.lpBase.geoWedge, this.lpBase.matHighSteel);
            const wOffset = (x < 0) ? 0.025 : -0.025;
            w1.position.set(x + wOffset, 0.045, 0);
            group.add(w1);
            const w2 = w1.clone();
            w2.position.y = trussH + 0.045;
            group.add(w2);
        };
        addHeads(-len/2, 0);
        addHeads(len/2, Math.PI);

        group.position.set(0, yPosBottomChord, zPos);
        this.group.add(group);
    }

    _buildRafters(w, d, startY, endY) {
        const count = 7; 
        const spacing = w / (count - 1);
        const startX = -w/2;
        const halfD = d/2;
        const mat = this.lpBase.matAlu;
        const rPipe = 0.024;

        for(let i=0; i<count; i++) {
            const x = startX + i * spacing;
            this._addTube(this.group, x, startY, halfD, x, endY, -halfD, rPipe, mat);
        }
    }

    _buildCanopy(w, d, startY, endY) {
        const group = new THREE.Group();
        const offsetOut = 0.03; 
        const zFront = d/2 + offsetOut;
        const zBack = -d/2 - offsetOut;
        const xLeft = -w/2 - offsetOut;
        const xRight = w/2 + offsetOut;

        const drop = startY - endY;
        const angle = Math.atan2(drop, d); 
        const roofLen = Math.sqrt(d*d + drop*drop) + 2*offsetOut; 
        const midY = (startY + endY) / 2;
        const canopyY = midY + 0.03; 

        // GÓRA
        const widthTotal = w + 2*offsetOut;
        const planeGeo = new THREE.PlaneGeometry(widthTotal, roofLen + 0.4); 
        const roofPlane = new THREE.Mesh(planeGeo, this.matCanvas);
        roofPlane.rotation.x = -Math.PI/2 - angle; 
        roofPlane.position.set(0, canopyY, 0); 
        group.add(roofPlane);

        // BOKI
        const valanceH = 0.60; 
        
        const yAtFront = canopyY + (d/2 * Math.tan(angle));
        const yAtBack = canopyY - (d/2 * Math.tan(angle));

        const localZFront = d/2 + 0.2; 
        const localZBack = -d/2 - 0.2;
        const localYFront = (localZFront) * Math.tan(angle);
        const localYBack = (localZBack) * Math.tan(angle);

        const sideShape = new THREE.Shape();
        sideShape.moveTo(localZFront, localYFront);
        sideShape.lineTo(localZBack, localYBack);
        sideShape.lineTo(localZBack, localYBack - valanceH);
        sideShape.lineTo(localZFront, localYFront - valanceH);
        sideShape.closePath();

        const sideGeo = new THREE.ShapeGeometry(sideShape);
        const leftVal = new THREE.Mesh(sideGeo, this.matCanvas);
        leftVal.rotation.y = -Math.PI / 2;
        leftVal.position.set(xLeft, canopyY, 0); 
        group.add(leftVal);

        const rightVal = new THREE.Mesh(sideGeo, this.matCanvas);
        rightVal.rotation.y = -Math.PI / 2;
        rightVal.position.set(xRight, canopyY, 0);
        group.add(rightVal);

        // FALBANY
        const frontValGeo = new THREE.PlaneGeometry(widthTotal, valanceH);
        const frontVal = new THREE.Mesh(frontValGeo, this.matCanvas);
        frontVal.position.set(0, yAtFront - valanceH/2, zFront); 
        group.add(frontVal);

        const backVal = frontVal.clone();
        backVal.position.set(0, yAtBack - valanceH/2, zBack);
        backVal.rotation.y = Math.PI;
        group.add(backVal);

        this.group.add(group);
    }

    _buildScrims(w, d, hFront, hBack) {
        const mat = this.matScrim;
        // Offset, aby siatka była minimalnie na zewnątrz konstrukcji
        const offset = 0.05; 
        
        // 1. TYLNA SIATKA (Prostokąt)
        // Szerokość to w + 2*offset, żeby domknąć rogi z siatkami bocznymi
        const backW = w + (2 * offset);
        const backGeo = new THREE.PlaneGeometry(backW, hBack);
        const backScrim = new THREE.Mesh(backGeo, mat);
        
        // Pozycja: środek wysokości (hBack/2)
        // Z: tył sceny (-d/2) przesunięty o offset na zewnątrz
        backScrim.position.set(0, hBack / 2, -d/2 - offset); 
        backScrim.rotation.y = Math.PI; // Tyłem do przodu
        this.group.add(backScrim);

        // 2. BOCZNE SIATKI (Trapezy)
        // Tworzymy kształt trapezu odpowiadający spadkowi dachu
        const sideShape = new THREE.Shape();
        
        // Współrzędne lokalne kształtu 2D (przed obrotem):
        // X = Oś Z świata (po obrocie)
        // Y = Oś Y świata
        
        // Punkt początkowy (Przód-Dół)
        // d/2 to przód, +offset żeby domknąć
        sideShape.moveTo(d/2 + offset, 0);
        
        // Punkt (Przód-Góra)
        sideShape.lineTo(d/2 + offset, hFront);
        
        // Punkt (Tył-Góra)
        sideShape.lineTo(-d/2 - offset, hBack);
        
        // Punkt (Tył-Dół)
        sideShape.lineTo(-d/2 - offset, 0);
        
        sideShape.closePath();
        
        const sideGeo = new THREE.ShapeGeometry(sideShape);
        
        // Lewa Siatka
        const leftScrim = new THREE.Mesh(sideGeo, mat);
        leftScrim.rotation.y = -Math.PI / 2; // Obrót o -90 stopni
        // Pozycja X: lewa krawędź (-w/2) przesunięta o offset na zewnątrz
        leftScrim.position.set(-w/2 - offset, 0, 0);
        this.group.add(leftScrim);

        // Prawa Siatka
        const rightScrim = new THREE.Mesh(sideGeo, mat);
        rightScrim.rotation.y = -Math.PI / 2; // Ten sam obrót, ale materiał DoubleSide załatwia sprawę
        // Pozycja X: prawa krawędź (+w/2) przesunięta o offset na zewnątrz
        rightScrim.position.set(w/2 + offset, 0, 0);
        this.group.add(rightScrim);
    }

    _addTube(group, x1, y1, z1, x2, y2, z2, r, material) {
        const v1 = new THREE.Vector3(x1, y1, z1);
        const v2 = new THREE.Vector3(x2, y2, z2);
        const dist = v1.distanceTo(v2);
        const geo = new THREE.CylinderGeometry(r, r, dist, 8);
        geo.rotateX(Math.PI / 2); 
        const mesh = new THREE.Mesh(geo, material);
        const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        mesh.position.copy(mid);
        mesh.lookAt(v2);
        group.add(mesh);
    }
}