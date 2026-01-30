import * as THREE from 'three';
import { 
    LayherPartsBase,
    VerticalStandardsLW,
    BaseJacks,
    BaseCollarNormal,
    HorizontalLedgersLW,
    ULedgers,
    Decks,
    ConsolesAndGirders,
    VerticalBracesLW, 
    AntiSlipWoodPad
} from './layher/LayherPartsBase.js';

export class FohSystem {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.lpBase = new LayherPartsBase();
        this.consolesFactory = new ConsolesAndGirders();

        this.initMaterials();
    }

    initMaterials() {
        this.matRoofCanvas = new THREE.MeshStandardMaterial({
            color: 0x222222, 
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        this.matScrim = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide
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

        let w = parseFloat(config.width) || 4.14;
        let d = parseFloat(config.depth) || 4.14;
        const dist = parseFloat(config.dist) || 20.0;
        const levelType = config.level || 'twoStory'; 

        const modX = 2.07;
        const modZ = 2.07;
        
        const cols = Math.max(1, Math.round(w / modX));
        const rows = Math.max(1, Math.round(d / modZ));
        
        const realW = cols * modX;
        const realD = rows * modZ;
        
        const startX = -realW / 2;
        const startZ = -realD / 2;

        this.group.position.set(0, 0, dist);

        const baseH = 0.20; 

        let floorLevels = [];

        floorLevels.push(baseH);

        if (levelType === 'twoStory' || levelType === 'threeStory') {
            floorLevels.push(baseH + 2.5); 
        }

        if (levelType === 'threeStory') {
            floorLevels.push(baseH + 5.0);
        }

        const topFloorH = floorLevels[floorLevels.length - 1];

        const roofFrontY = topFloorH + 2.8;
        const roofBackY = topFloorH + 2.2;

        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                const x = startX + i * modX;
                const z = startZ + j * modZ;

                const ratio = j / rows; 
                const roofYAtPos = roofFrontY - ((roofFrontY - roofBackY) * ratio);
                
                const targetH = roofYAtPos + 0.1; 

                this._buildColumnStack(x, z, targetH, floorLevels);
            }
        }

        floorLevels.forEach((y, index) => {
            const isTop = (index === floorLevels.length - 1);
            this._buildFloorLevel(cols, rows, modX, modZ, startX, startZ, y, isTop);

            if (y < topFloorH) { 
                const nextY = y + 2.5; 
                this._buildDiagonals(cols, rows, modX, modZ, startX, startZ, y, nextY);
            }
        });

        this._buildRoof(realW, realD, roofFrontY, roofBackY, startX, startZ);

        if (config.scrim) {
            this._buildScrims(realW, realD, topFloorH, roofFrontY, roofBackY, startX, startZ);
        }
    }

    _buildColumnStack(x, z, totalH, floorLevels) {
        const node = new THREE.Group();
        node.position.set(x, 0, z);

        node.add(new AntiSlipWoodPad().group);
        const jack = new BaseJacks('60a', 0.15); 
        jack.group.position.y = 0.045;
        node.add(jack.group);

        const collar = new BaseCollarNormal();
        collar.group.position.y = 0.195;
        node.add(collar.group);
        
        let currentH = 0.20; 
        let remainingH = totalH - currentH;

        while (remainingH > 0.5) {
            let segLen = 2.5; 
            if (remainingH < 2.5 && remainingH >= 2.0) segLen = 2.0;
            else if (remainingH < 2.0 && remainingH >= 1.5) segLen = 1.5;
            else if (remainingH < 1.5 && remainingH >= 1.0) segLen = 1.0;
            else if (remainingH < 1.0) segLen = remainingH; 

            const std = new VerticalStandardsLW(segLen, 'withSpigot');
        
            std.group.position.y = currentH + 0.15; 
            node.add(std.group);

            currentH += segLen;
            remainingH -= segLen;
        }

        this.group.add(node);
    }

    _buildFloorLevel(cols, rows, modX, modZ, startX, startZ, y, isTop) {
      
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = startX + i * modX;
                const z = startZ + j * modZ + modZ/2;
                
                const u = new ULedgers(modZ, 'lwT14');
                u.group.rotation.y = Math.PI/2;
                u.group.position.set(x, y, z);
                this.group.add(u.group);
            }
        }

        for (let j = 0; j <= rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = startX + i * modX + modX/2;
                const z = startZ + j * modZ;
                
                const o = new HorizontalLedgersLW(modX);
                o.group.position.set(x, y, z);
                this.group.add(o.group);
            }
        }

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const cellX = startX + i * modX + modX/2;
                const cellZ = startZ + j * modZ;
                
                const d1 = new Decks(modX, 1.04, 'eventT16');
                d1.group.position.set(cellX, y, cellZ + 0.52);
                this.group.add(d1.group);

                const d2 = new Decks(modX, 1.04, 'eventT16');
                d2.group.position.set(cellX, y, cellZ + 1.55);
                this.group.add(d2.group);
            }
        }

        if (isTop) {
            this._buildRailings(cols, rows, modX, modZ, startX, startZ, y);
        }
    }

    _buildDiagonals(cols, rows, modX, modZ, startX, startZ, lowerY, upperY) {
     
        const xPositions = [startX, startX + (cols * modX)];
        
        xPositions.forEach(xPos => {
            for (let j = 0; j < rows; j++) {
                const zStart = startZ + j * modZ;
                const zEnd = startZ + (j+1) * modZ;
            
                try {
                    const brace = new VerticalBracesLW(2.5, 2.07); 
                    brace.group.rotation.y = Math.PI/2;
                    
                    brace.group.position.set(xPos, lowerY, zStart + modZ/2);
                    
                    this.group.add(brace.group);
                } catch(e) {
                  
                }
            }
        });

        const zBack = startZ + (rows * modZ);
        for (let i = 0; i < cols; i++) {
            const xStart = startX + i * modX;
            
            const brace = new VerticalBracesLW(2.5, 2.07);
            brace.group.position.set(xStart + modX/2, lowerY, zBack);
            this.group.add(brace.group);
        }
        
    }

    _buildRailings(cols, rows, modX, modZ, startX, startZ, y) {
        for (let i = 0; i < cols; i++) {
            const x = startX + i*modX + modX/2;
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modX);
                r.group.position.set(x, y+h, startZ);
                this.group.add(r.group);
            });
        }
        const zBack = startZ + rows * modZ;
        for (let i = 0; i < cols; i++) {
            const x = startX + i*modX + modX/2;
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modX);
                r.group.position.set(x, y+h, zBack);
                this.group.add(r.group);
            });
        }
        for (let j = 0; j < rows; j++) {
            const z = startZ + j*modZ + modZ/2;
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modZ);
                r.group.rotation.y = Math.PI/2;
                r.group.position.set(startX, y+h, z);
                this.group.add(r.group);
            });
            const xRight = startX + cols*modX;
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modZ);
                r.group.rotation.y = Math.PI/2;
                r.group.position.set(xRight, y+h, z);
                this.group.add(r.group);
            });
        }
    }

    _buildRoof(w, d, floorY, frontH, backH, startX, startZ) {

        const beamFront = this.consolesFactory.createULatticeGirderAlu(w);
        beamFront.position.set(0, frontH, startZ); 
        this.group.add(beamFront);

        const beamBack = this.consolesFactory.createULatticeGirderAlu(w);
        beamBack.position.set(0, backH, startZ + d);
        this.group.add(beamBack);

        const spacing = 0.5; 
        const count = Math.ceil(w / spacing);
        const step = w / count; 
        
        const lengthZ = Math.sqrt(d*d + (frontH - backH)**2);
        const angle = Math.atan2(frontH - backH, d);

        for (let k = 0; k <= count; k++) {
            const x = startX + k * step;
            
            const tube = new THREE.Mesh(
                new THREE.CylinderGeometry(0.024, 0.024, lengthZ + 0.4, 8), 
                this.lpBase.matAlu
            );
            
            const midH = (frontH + backH) / 2 + 0.25; 
            const midZ = startZ + d / 2;
            
            tube.position.set(x, midH, midZ);
            tube.rotation.x = angle; 
            this.group.add(tube);
        }

        const roofGeo = new THREE.PlaneGeometry(w + 0.6, lengthZ + 0.6);
        const canvas = new THREE.Mesh(roofGeo, this.matRoofCanvas);
        
        const midH = (frontH + backH) / 2 + 0.28; 
        canvas.position.set(0, midH, startZ + d/2);
        canvas.rotation.x = -Math.PI/2 + angle; 
        this.group.add(canvas);
    }

    _buildScrims(w, d, topFloorH, hFront, hBack, startX, startZ) {
        const bottomY = 0.2;
        
        const backH = hBack - bottomY;
        const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(w, backH), this.matScrim);
        backPlane.position.set(0, bottomY + backH/2, startZ + d);
        this.group.add(backPlane);

        const shape = new THREE.Shape();
        shape.moveTo(0, bottomY);         
        shape.lineTo(d, bottomY);        
        shape.lineTo(d, hBack);            
        shape.lineTo(0, hFront);         
        shape.closePath();
        
        const sideGeo = new THREE.ShapeGeometry(shape);
        
        const left = new THREE.Mesh(sideGeo, this.matScrim);
        left.rotation.y = -Math.PI/2;
        left.position.set(startX, 0, startZ);
        this.group.add(left);

        const right = new THREE.Mesh(sideGeo, this.matScrim);
        right.rotation.y = -Math.PI/2;
        right.position.set(startX + w, 0, startZ);
        this.group.add(right);
    }
}