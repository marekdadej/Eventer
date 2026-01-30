import * as THREE from 'three';
import { ProlyteParts } from './ProlyteParts.js';

export class MPTStandard {
    constructor(scene) {
        this.scene = scene;
        this.parts = new ProlyteParts();
        this.group = new THREE.Group();
        this.scene.add(this.group);
 
        this.matCanopy = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            side: THREE.DoubleSide, 
            roughness: 0.6,
            metalness: 0.1
        });
        
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
        
        const W = parseFloat(config.width) || 12.0;
        const D = parseFloat(config.depth) || 10.0;
        
        const clearance = parseFloat(config.roofClearance) || 7.0; 
        
        const showCanopy = config.showCanopy !== false;
        const showScrim = config.prolyteScrim === true;

        const towerX = W / 2;
        const towerZ = D / 2;
        
        const towerHeight = clearance + 2.0; 

        this._buildTower(-towerX, towerZ, clearance, towerHeight);
        this._buildTower(towerX, towerZ, clearance, towerHeight);
        this._buildTower(-towerX, -towerZ, clearance, towerHeight);
        this._buildTower(towerX, -towerZ, clearance, towerHeight);

        const gridY = clearance + 0.20;
        
        this._buildRoofStructure(W, D, gridY, showCanopy, showScrim);
    }

    _buildTower(x, z, clearanceH, totalH) {
        const tGrp = new THREE.Group();
        tGrp.position.set(x, 0, z);

        tGrp.add(this.parts.createBase());

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

        const sleeve = this.parts.createSleeve();
        sleeve.position.y = clearanceH + 0.3; 
        tGrp.add(sleeve);

        const top = this.parts.createTop();
        top.position.y = mastTop;
        tGrp.add(top);

        this.group.add(tGrp);
    }

    _buildRoofStructure(W, D, y, showCanopy, showScrim) {
        const roofGrp = new THREE.Group();
        roofGrp.position.y = y;

        const trussSize = 0.39; 
        const sleeveSize = 0.55; 
        
        const spanX = W - sleeveSize;
        const spanZ = D - sleeveSize;

        const beamFront = this.parts.createMainTruss(spanX);
        beamFront.position.set(0, 0, -D/2); 
        roofGrp.add(beamFront);

        const beamBack = beamFront.clone();
        beamBack.position.set(0, 0, D/2); 
        roofGrp.add(beamBack);

        const beamLeft = this.parts.createMainTruss(spanZ);
        beamLeft.rotation.y = Math.PI / 2;
        beamLeft.position.set(-W/2, 0, 0);
        roofGrp.add(beamLeft);

        const beamRight = beamLeft.clone();
        beamRight.position.set(W/2, 0, 0);
        roofGrp.add(beamRight);

        const ridgeRise = 1.8; 
        
        const supportFront = this.parts.createRidgeAssembly(ridgeRise);
        supportFront.position.set(0, trussSize/2, -D/2); 
        roofGrp.add(supportFront);

        const supportBack = this.parts.createRidgeAssembly(ridgeRise);
        supportBack.position.set(0, trussSize/2, D/2); 
        supportBack.rotation.y = Math.PI; 
        roofGrp.add(supportBack);

        const cantileverLen = 2.0; 
        const ridgeLen = D + cantileverLen; 
        
        const ridgeBeam = this.parts.createMainTruss(ridgeLen); 
        ridgeBeam.rotation.y = Math.PI / 2; 
        ridgeBeam.position.set(0, ridgeRise + trussSize, -cantileverLen/2);
        roofGrp.add(ridgeBeam);

        const halfSpan = W / 2;
        const roofAngle = Math.atan2(ridgeRise, halfSpan);
        const rafterLen = Math.sqrt(halfSpan*halfSpan + ridgeRise*ridgeRise);

        const rafterPositions = [
            D/2,            
            D/6,            
            -D/6,              
            -D/2,            
            -D/2 - cantileverLen 
        ];

        rafterPositions.forEach(zPos => {
            const rafL = this.parts.createRafter(rafterLen);
            rafL.position.set(-W/4, ridgeRise/2 + 0.2, zPos);
            rafL.rotation.z = -roofAngle;
            roofGrp.add(rafL);

            const rafR = this.parts.createRafter(rafterLen);
            rafR.position.set(W/4, ridgeRise/2 + 0.2, zPos);
            rafR.rotation.z = roofAngle;
            rafR.rotation.y = Math.PI; 
            rafR.rotation.z = roofAngle; 
            roofGrp.add(rafR);
        });

        this._addTensionGear(roofGrp, W, D, cantileverLen, ridgeRise);

        if (showCanopy) {
            this._createGabledCanopy(roofGrp, W, D, cantileverLen, ridgeRise);
        }

        if (showScrim) {
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
        const scrimH = heightFromGround; 
        
        const planeBack = new THREE.PlaneGeometry(W, scrimH);
        const meshBack = new THREE.Mesh(planeBack, this.matScrim);
        meshBack.position.set(0, -scrimH/2, D/2);
        group.add(meshBack);

        const sideLen = D * 0.7;
        const planeSide = new THREE.PlaneGeometry(sideLen, scrimH);
        
        const meshL = new THREE.Mesh(planeSide, this.matScrim);
        meshL.rotation.y = Math.PI / 2;
        meshL.position.set(-W/2, -scrimH/2, D/2 - sideLen/2);
        group.add(meshL);

        const meshR = new THREE.Mesh(planeSide, this.matScrim);
        meshR.rotation.y = -Math.PI / 2;
        meshR.position.set(W/2, -scrimH/2, D/2 - sideLen/2);
        group.add(meshR);
    }
}