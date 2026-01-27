import * as THREE from 'three';
import { ProlyteParts } from './ProlyteParts.js';

export class MPTStandard {
    constructor(scene) {
        this.scene = scene;
        // Importujemy części
        this.parts = new ProlyteParts();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // MATERIAŁY
        // Szara plandeka (PVC)
        this.matCanopy = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            side: THREE.DoubleSide, 
            roughness: 0.6,
            metalness: 0.1
        });
        
        // Czarna siatka (Scrim)
        this.matScrim = new THREE.MeshBasicMaterial({
            color: 0x050505,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
        });
    }

    clear() {
        this.group.traverse(c => { 
            if(c.isMesh) {
                if(c.geometry) c.geometry.dispose();
            }
        });
        this.group.clear();
    }

    build(config) {
        this.clear();
        
        // Wymiary sceny
        const W = parseFloat(config.width) || 12.0;
        const D = parseFloat(config.depth) || 10.0;
        
        // Wysokość CLEARANCE (prześwit od ziemi do spodu kraty)
        const clearance = parseFloat(config.roofClearance) || 7.0; 
        
        const showCanopy = config.showCanopy !== false;
        const showScrim = config.prolyteScrim === true;

        // Rozstaw wież
        const towerX = W / 2;
        const towerZ = D / 2;
        
        // 1. WIEŻE MPT (4 sztuki)
        // Wieże wyższe niż prześwit
        const towerHeight = clearance + 2.0; 

        // Przekazujemy 'clearance' jako trzeci argument
        this._buildTower(-towerX, towerZ, clearance, towerHeight);
        this._buildTower(towerX, towerZ, clearance, towerHeight);
        this._buildTower(-towerX, -towerZ, clearance, towerHeight);
        this._buildTower(towerX, -towerZ, clearance, towerHeight);

        // 2. KONSTRUKCJA DACHU
        // Oś gridu = clearance + połowa grubości kraty H40V (0.4m / 2 = 0.2m)
        const gridY = clearance + 0.20;
        
        this._buildRoofStructure(W, D, gridY, showCanopy, showScrim);
    }

    // POPRAWKA: clearanceH to parametr wysokości wózka
    _buildTower(x, z, clearanceH, totalH) {
        const tGrp = new THREE.Group();
        tGrp.position.set(x, 0, z);

        // A. Baza MPT
        tGrp.add(this.parts.createBase());

        // B. Maszt
        let currentY = 0.2;
        const mastTop = totalH; 

        while(currentY < mastTop - 0.5) {
            let segLen = 2.0;
            if (mastTop - currentY < 2.5) segLen = 1.0; 

            const seg = this.parts.createMast(segLen);
            seg.rotation.z = Math.PI / 2; 
            seg.position.y = currentY + segLen/2;
            tGrp.add(seg);
            currentY += segLen;
        }

        // C. Sleeve Block (Wózek)
        // POPRAWKA: Używamy zmiennej clearanceH (argument funkcji), a nie clearance
        const sleeve = this.parts.createSleeve();
        sleeve.position.y = clearanceH + 0.3; 
        tGrp.add(sleeve);

        // D. Top Section
        const top = this.parts.createTop();
        top.position.y = mastTop;
        tGrp.add(top);

        this.group.add(tGrp);
    }

    _buildRoofStructure(W, D, y, showCanopy, showScrim) {
        const roofGrp = new THREE.Group();
        roofGrp.position.y = y;

        // Wymiary elementów
        const trussSize = 0.39; // H40V
        const sleeveSize = 0.55; 
        
        const spanX = W - sleeveSize;
        const spanZ = D - sleeveSize;

        // --- 1. GRID (OBWIEDNIA PŁASKA) ---
        
        // Belki PRZÓD i TYŁ
        const beamFront = this.parts.createMainTruss(spanX);
        beamFront.position.set(0, 0, -D/2); 
        roofGrp.add(beamFront);

        const beamBack = beamFront.clone();
        beamBack.position.set(0, 0, D/2); 
        roofGrp.add(beamBack);

        // Belki LEWA i PRAWA
        const beamLeft = this.parts.createMainTruss(spanZ);
        beamLeft.rotation.y = Math.PI / 2;
        beamLeft.position.set(-W/2, 0, 0);
        roofGrp.add(beamLeft);

        const beamRight = beamLeft.clone();
        beamRight.position.set(W/2, 0, 0);
        roofGrp.add(beamRight);

        // --- 2. KONSTRUKCJA DWUSPADOWA ---
        
        const ridgeRise = 1.8; // Wysokość szczytu
        
        // Słupki kalenicy (Ridge Supports)
        const supportFront = this.parts.createRidgeAssembly(ridgeRise);
        supportFront.position.set(0, trussSize/2, -D/2); 
        roofGrp.add(supportFront);

        const supportBack = this.parts.createRidgeAssembly(ridgeRise);
        supportBack.position.set(0, trussSize/2, D/2); 
        supportBack.rotation.y = Math.PI; 
        roofGrp.add(supportBack);

        // Belka Kalenicowa + Cantilever
        const cantileverLen = 2.0; 
        const ridgeLen = D + cantileverLen; 
        
        const ridgeBeam = this.parts.createMainTruss(ridgeLen); 
        ridgeBeam.rotation.y = Math.PI / 2; 
        // Środek geometrii belki przesunięty, by wystawała z przodu
        ridgeBeam.position.set(0, ridgeRise + trussSize, -cantileverLen/2);
        roofGrp.add(ridgeBeam);

        // --- 3. KROKWIE (RAFTERS) ---
        const halfSpan = W / 2;
        const roofAngle = Math.atan2(ridgeRise, halfSpan);
        const rafterLen = Math.sqrt(halfSpan*halfSpan + ridgeRise*ridgeRise);

        // Rozstawienie krokwi
        const rafterPositions = [
            D/2,               // Tył
            D/6,               // Środek-tył
            -D/6,              // Środek-przód
            -D/2,              // Linia frontu
            -D/2 - cantileverLen // Koniec cantilevera
        ];

        rafterPositions.forEach(zPos => {
            // Lewa
            const rafL = this.parts.createRafter(rafterLen);
            rafL.position.set(-W/4, ridgeRise/2 + 0.2, zPos);
            rafL.rotation.z = -roofAngle;
            roofGrp.add(rafL);

            // Prawa
            const rafR = this.parts.createRafter(rafterLen);
            rafR.position.set(W/4, ridgeRise/2 + 0.2, zPos);
            rafR.rotation.z = roofAngle;
            rafR.rotation.y = Math.PI; 
            rafR.rotation.z = roofAngle; 
            roofGrp.add(rafR);
        });

        // --- 4. STĘŻENIA ---
        this._addTensionGear(roofGrp, W, D, cantileverLen, ridgeRise);

        // --- 5. PLANDEKA ---
        if (showCanopy) {
            this._createGabledCanopy(roofGrp, W, D, cantileverLen, ridgeRise);
        }

        // --- 6. SIATKI ---
        if (showScrim) {
            // Wysokość siatki = wysokość od gridu do ziemi (y)
            this._createScrims(roofGrp, W, D, y);
        }

        this.group.add(roofGrp);
    }

    _addTensionGear(group, W, D, cant, rise) {
        const topPoint = new THREE.Vector3(0, rise + 0.4, -D/2 - cant);
        const cornerL = new THREE.Vector3(-W/2, 0, -D/2);
        const cornerR = new THREE.Vector3(W/2, 0, -D/2);

        const matSteel = new THREE.MeshBasicMaterial({color: 0x333333});

        [cornerL, cornerR].forEach(corner => {
            const dist = topPoint.distanceTo(corner);
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, dist), matSteel);
            tube.position.copy(topPoint).lerp(corner, 0.5);
            tube.lookAt(corner);
            tube.rotateX(Math.PI/2);
            group.add(tube);
        });
    }

    _createGabledCanopy(group, W, D, cant, rise) {
        const overhang = 0.4;
        const widthHalf = W/2 + overhang;
        
        const shape = new THREE.Shape();
        shape.moveTo(-widthHalf, 0);       
        shape.lineTo(0, rise + 0.25);      
        shape.lineTo(widthHalf, 0);        
        
        const depthTotal = D + cant + 0.2;
        
        const geo = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            depth: depthTotal,
            bevelEnabled: false
        });

        geo.rotateY(Math.PI);
        geo.translate(0, 0, D/2 + 0.1);

        const mesh = new THREE.Mesh(geo, this.matCanopy);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }

    _createScrims(group, W, D, heightFromGround) {
        // Siatki wiszą od gridu w dół.
        const scrimH = heightFromGround; 
        
        // TYŁ
        const planeBack = new THREE.PlaneGeometry(W, scrimH);
        const meshBack = new THREE.Mesh(planeBack, this.matScrim);
        meshBack.position.set(0, -scrimH/2, D/2);
        group.add(meshBack);

        // BOKI (częściowe, 2/3 głębokości)
        const sideLen = D * 0.7;
        const planeSide = new THREE.PlaneGeometry(sideLen, scrimH);
        
        // Lewy
        const meshL = new THREE.Mesh(planeSide, this.matScrim);
        meshL.rotation.y = Math.PI / 2;
        meshL.position.set(-W/2, -scrimH/2, D/2 - sideLen/2);
        group.add(meshL);

        // Prawy
        const meshR = new THREE.Mesh(planeSide, this.matScrim);
        meshR.rotation.y = -Math.PI / 2;
        meshR.position.set(W/2, -scrimH/2, D/2 - sideLen/2);
        group.add(meshR);
    }
}