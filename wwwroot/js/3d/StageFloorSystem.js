import * as THREE from 'three';
import { LayherPartsBase } from './layher/LayherCore.js';

import { 
    VerticalStandardsLW, 
    BaseJacks, 
    BaseCollarNormal, 
    ULedgers, 
    HorizontalLedgersLW, 
    Decks, 
    AntiSlipWoodPad,
    LayherAccessories
} from './layher/LayherPartsBase.js'; 

export class StageFloorSystem {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.lpBase = new LayherPartsBase();
        this.accessories = new LayherAccessories();
        this.initMaterials();
    }

    initMaterials() {
        this.matSteel = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6, metalness: 0.5 });
        this.matWedgeHead = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7, metalness: 0.4 });
    }

    clear() {
        this.group.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else if (child.material) child.material.dispose();
            }
        });
        this.group.clear();
    }

    build(config) {
        this.clear();
        const requestedW = parseFloat(config.width) || 10.35;
        const requestedD = parseFloat(config.depth) || 8.28;
        const totalH = parseFloat(config.height) || 1.5;
        const floorType = config.floorType || 'layher';
        
        const getBays = (total) => {
            const bays = [];
            let remaining = total;
            while (remaining >= 2.06) { 
                bays.push(2.07);
                remaining -= 2.07;
            }
            if (remaining > 0.5) { 
                bays.push(1.04);
            }
            return bays;
        };

        const baysX = getBays(requestedW);
        const baysZ = getBays(requestedD);

        const actualW = baysX.reduce((a, b) => a + b, 0);
        const actualD = baysZ.reduce((a, b) => a + b, 0);

        const startX = -actualW / 2;
        const startZ = -actualD / 2;

        this.isPeri = (floorType === 'peri');
        this.buildStructure(baysX, baysZ, startX, startZ, totalH);
    }

    _calculateVerticalStack(totalH) {
        const deckThickness = 0.086;
        const deckSink = 0.05;
        const transomH = 0.22;
        const transomCenter = transomH / 2; 
        const woodPadH = 0.045;
        const baseCollarEffH = 0.20; 
        const topRosetteOffset = 0.025; 

        const targetRosetteY = totalH - (deckThickness - deckSink) - transomCenter;
        
        const availableSpace = targetRosetteY - woodPadH;
        const heightToFill = availableSpace - baseCollarEffH + topRosetteOffset;

        const standardLens = [4.0, 3.0, 2.0, 1.5, 1.0, 0.5];
        let stack = [];
        let remaining = heightToFill;
        let bestJack = 0.30; 

        while (remaining > 2.6) { 
            stack.push(2.0);
            remaining -= 2.0;
        }

        let found = false;
        for (let std of standardLens) {
            const neededJack = remaining - std;
            if (neededJack >= 0.05 && neededJack <= 0.65) {
                stack.push(std);
                bestJack = neededJack;
                found = true;
                break;
            }
        }
        if (!found) {
            stack.push(0.5); 
            bestJack = Math.max(0.05, remaining - 0.5);
        }

        return {
            jackEx: bestJack,
            standards: stack,
            baseStartY: woodPadH + bestJack, 
            firstStdY: woodPadH + bestJack + baseCollarEffH 
        };
    }

    buildStructure(baysX, baysZ, startX, startZ, totalH) {
        const stackConfig = this._calculateVerticalStack(totalH);

        const colCoords = []; 
        let curX = startX;
        for (let i = 0; i <= baysX.length; i++) {
            colCoords[i] = [];
            let curZ = startZ;
            for (let j = 0; j <= baysZ.length; j++) {
                colCoords[i][j] = { x: curX, z: curZ };
                this._placeColumn(curX, curZ, stackConfig);
                if (j < baysZ.length) curZ += baysZ[j];
            }
            if (i < baysX.length) curX += baysX[i];
        }

        const nodeLevels = [stackConfig.baseStartY + 0.17];
        let currentY = stackConfig.firstStdY;
        stackConfig.standards.forEach((len, idx) => {
            const topRosette = currentY + len - 0.025;
            if (idx < stackConfig.standards.length - 1) nodeLevels.push(topRosette);
            currentY += len;
        });
        
        const topRosetteLevel = currentY - 0.025;

        const allLevels = [...nodeLevels, topRosetteLevel]; 

        for (let k = 0; k < allLevels.length - 1; k++) {
            const yBottom = allLevels[k];
            const yTop = allLevels[k+1];
            const heightDiff = yTop - yBottom;
            const isBaseLevel = (k === 0);

            this._buildGridsAndBracing(baysX, baysZ, colCoords, yBottom, isBaseLevel);

            if (heightDiff >= 0.4) {
                this._buildTowerBracing(baysX, baysZ, colCoords, yBottom, yTop);
            }
        }

        this._buildGridsAndBracing(baysX, baysZ, colCoords, topRosetteLevel, false);
        this._buildFloor(baysX, baysZ, colCoords, topRosetteLevel);

        this._buildGuardrails(baysX, baysZ, colCoords, topRosetteLevel, totalH);
    }

    _placeColumn(x, z, config) {
        const colGrp = new THREE.Group();
        colGrp.position.set(x, 0, z);
        colGrp.add(new AntiSlipWoodPad().group);
        
        const jack = new BaseJacks('60a', config.jackEx);
        jack.group.position.y = 0.045; 
        colGrp.add(jack.group);
        
        const collar = new BaseCollarNormal();
        collar.group.position.y = config.baseStartY;
        colGrp.add(collar.group);

        let localY = config.firstStdY;
        config.standards.forEach((len, idx) => {
            const std = new VerticalStandardsLW(len, 'withoutSpigot');
            std.group.position.y = localY;
            colGrp.add(std.group);
            
            if (idx < config.standards.length - 1) {
                const spigot = this.accessories.createSpigotConnector(false);
                spigot.position.y = (localY + len) - 0.26;
                colGrp.add(spigot);
            }
            localY += len;
        });
        this.group.add(colGrp);
    }

    _buildGridsAndBracing(baysX, baysZ, colCoords, y, isBaseLevel) {
        for (let i = 0; i <= baysX.length; i++) {
            for (let j = 0; j <= baysZ.length; j++) {
                const p = colCoords[i][j];

                if (i < baysX.length) {
                    const l = new HorizontalLedgersLW(baysX[i]);
                    l.group.position.set(p.x, y, p.z);
                    this.group.add(l.group);
                }

                if (j < baysZ.length) {
                    const l = new HorizontalLedgersLW(baysZ[j]);
                    l.group.rotation.y = -Math.PI/2; 
                    l.group.position.set(p.x, y, p.z);
                    this.group.add(l.group);
                }

                if (isBaseLevel && i < baysX.length && j < baysZ.length) {
                    const isFrontRow = (j === baysZ.length - 1);
                    const isMiddleCol = (i === Math.floor(baysX.length / 2));
                    
                    if (isFrontRow || isMiddleCol) {
                        const W = baysX[i];
                        const D = baysZ[j];
                        this._addHorizontalDiagonal(p.x, p.z, y, W, D, (i+j)%2 === 0);
                    }
                }
            }
        }
    }

    _addHorizontalDiagonal(x, z, y, width, depth, flip) {
        const len = Math.sqrt(width * width + depth * depth); 
        const diag = new THREE.Group();
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len - 0.12, 8), this.matSteel);
        tube.rotation.z = Math.PI / 2;
        diag.add(tube);
        diag.position.set(x + width/2, y + 0.05, z + depth/2);
        const angle = Math.atan2(depth, width);
        diag.rotation.y = flip ? angle : -angle;
        this.group.add(diag);
    }

    _isBracedColumn(idx, count) {
        if (idx === 0) return true;            
        if (idx === count - 1) return true;    
        if (idx % 2 === 0) {
            if (idx === count - 2) return false; 
            return true;
        }
        return false;
    }

    _buildTowerBracing(baysX, baysZ, colCoords, yBottom, yTop) {
        const offset = 0.10; 
        for (let i = 0; i < baysX.length; i++) {
            for (let j = 0; j < baysZ.length; j++) {
                const braceX = this._isBracedColumn(i, baysX.length);
                const braceZ = this._isBracedColumn(j, baysZ.length);

                if (braceX && braceZ) {
                    const c1 = colCoords[i][j];     
                    const c2 = colCoords[i+1][j];   
                    const c3 = colCoords[i][j+1];   
                    const c4 = colCoords[i+1][j+1]; 

                    const p1 = new THREE.Vector3(c1.x, 0, c1.z);
                    const p2 = new THREE.Vector3(c2.x, 0, c2.z);
                    const p3 = new THREE.Vector3(c3.x, 0, c3.z);
                    const p4 = new THREE.Vector3(c4.x, 0, c4.z);

                    this._addDiagonalBetweenCols(p1, p2, yBottom, yTop, offset);
                    this._addDiagonalBetweenCols(p3, p4, yBottom, yTop, offset);
                    this._addDiagonalBetweenCols(p1, p3, yBottom, yTop, offset);
                    this._addDiagonalBetweenCols(p2, p4, yBottom, yTop, offset);
                }
            }
        }
    }

    _addDiagonalBetweenCols(base1, base2, yBottom, yTop, offset) {
        const b1 = base1.clone(); b1.y = yBottom;
        const b2 = base2.clone(); b2.y = yTop;
        const dir = new THREE.Vector3().subVectors(base2, base1).normalize();
        const pStart = b1.add(dir.clone().multiplyScalar(offset));
        const pEnd = b2.sub(dir.clone().multiplyScalar(offset));
        this._addDiagonalSmart(pStart, pEnd);
    }

    _addDiagonalSmart(p1, p2) {
        const vec = new THREE.Vector3().subVectors(p2, p1);
        const len = vec.length();
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const headSpace = 0.08; 
        const tubeLen = len - (2 * headSpace); 
        const group = new THREE.Group();
        group.position.copy(mid);
        group.lookAt(p2);
        const tubeGeo = new THREE.CylinderGeometry(0.024, 0.024, tubeLen, 8);
        tubeGeo.rotateX(Math.PI / 2);
        const tube = new THREE.Mesh(tubeGeo, this.matSteel);
        group.add(tube);
        const headGeo = new THREE.BoxGeometry(0.03, 0.06, 0.08); 
        const h1 = new THREE.Mesh(headGeo, this.matWedgeHead);
        h1.position.z = -len/2 + 0.02; 
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.015), this.matWedgeHead);
        w1.position.y = 0.04;
        h1.add(w1);
        group.add(h1);
        const h2 = h1.clone();
        h2.rotation.z = Math.PI; 
        h2.position.z = len/2 - 0.02;
        group.add(h2);
        this.group.add(group);
    }

    _buildFloor(baysX, baysZ, colCoords, topLevel) {
        const deckY = topLevel + 0.06;
        const uLevel = topLevel;

        for (let i = 0; i < baysX.length; i++) {
            for (let j = 0; j < baysZ.length; j++) {
                const p = colCoords[i][j];
                const W = baysX[i];
                const D = baysZ[j];

        
                if (W >= 2.0 && D >= 2.0) {
                    this._addULedger(p.x, uLevel, p.z + D, D, true);      
                    this._addULedger(p.x + W, uLevel, p.z + D, D, true);  
                    
                    if (this.isPeri) {
                        this._placePeriDeck(p.x, deckY, p.z, W, D);
                    } else {
                        this._placeDeck(p.x, deckY, p.z + 0.52, 2.07, 1.04); 
                        this._placeDeck(p.x, deckY, p.z + 1.56, 2.07, 1.04);
                    }
                } 
                else if (W >= 2.0 && D < 2.0) {
                    this._addULedger(p.x, uLevel, p.z + D, D, true);
                    this._addULedger(p.x + W, uLevel, p.z + D, D, true);
                    
                    if (this.isPeri) {
                        this._placePeriDeck(p.x, deckY, p.z, W, D);
                    } else {
                        this._placeDeck(p.x, deckY, p.z + D/2, 2.07, 1.04);
                    }
                } 
                else if (W < 2.0 && D >= 2.0) {
                    this._addULedger(p.x, uLevel, p.z, W, false);
                    this._addULedger(p.x, uLevel, p.z + D, W, false);
                    
                    if (this.isPeri) {
                         this._placePeriDeck(p.x, deckY, p.z, W, D);
                    } else {
                        this._placeDeckVertical(p.x + W/2, deckY, p.z + D, 2.07, 1.04);
                    }
                } 
                else {
                    this._addULedger(p.x, uLevel, p.z + D, D, true);
                    this._addULedger(p.x + W, uLevel, p.z + D, D, true);
                    
                    if (this.isPeri) {
                        this._placePeriDeck(p.x, deckY, p.z, W, D);
                    } else {
                        this._placeDeck(p.x, deckY, p.z + D/2, 1.04, 1.04);
                    }
                }
            }
        }
    }

    _addULedger(x, y, z, len, isRotated) {
        const u = new ULedgers(len, 'event');
        u.group.position.set(x, y, z);
        if (isRotated) u.group.rotation.y = Math.PI/2;
        this.group.add(u.group);
    }

    _placeDeck(x, y, z, len, width) {
        const d = new Decks(len - 0.01, width, 'eventT16');
        d.group.position.set(x, y, z);
        if (d.setCorners) d.setCorners(false, false, false, false);
        this.group.add(d.group);
    }

    _placeDeckVertical(x, y, z, len, width) {
        const d = new Decks(len - 0.01, width, 'eventT16');
        d.group.rotation.y = Math.PI / 2;
        d.group.position.set(x, y, z);
        if (d.setCorners) d.setCorners(false, false, false, false);
        this.group.add(d.group);
    }

    _placePeriDeck(x, y, z, bayW, bayD) {
        const bay = new Decks(bayW, bayD, 'periBay');
        bay.group.position.set(x, y, z + bayD/2);
        if (bay.setCorners) bay.setCorners(false, false, false, false);
        this.group.add(bay.group);
    }

    _buildGuardrails(baysX, baysZ, colCoords, topRosetteLevel, totalH) {
        const isHigh = totalH > 2.5;
        for (let i = 0; i <= baysX.length; i++) {
            for (let j = 0; j <= baysZ.length; j++) {
                const p = colCoords[i][j];
                const isFront = (j === baysZ.length);
                const isBack = (j === 0);
                const isSide = (i === 0 || i === baysX.length);
                const isCorner = isFront && isSide;

                if (isSide || isBack || (isHigh && isFront)) {
                    let h = 1.0;
                    if (isSide || isBack) h = isHigh ? 1.5 : 1.0;
                    else if (isHigh && isFront) h = isCorner ? 1.5 : 1.0;
                    this._addGuardrailPost(p.x, p.z, h, topRosetteLevel);
                }

                if (i < baysX.length && (isBack || (isHigh && isFront))) {
                    let levels = [0.5, 1.0];
                    if (isBack && isHigh) levels = [0.5, 1.0, 1.5];
                    levels.forEach(lvlY => {
                        const r = new HorizontalLedgersLW(baysX[i]);
                        r.group.position.set(p.x, topRosetteLevel + lvlY, p.z);
                        this.group.add(r.group);
                    });
                }

                if (j < baysZ.length && isSide) {
                    const levels = isHigh ? [0.5, 1.0, 1.5] : [0.5, 1.0];
                    levels.forEach(lvlY => {
                        const r = new HorizontalLedgersLW(baysZ[j]);
                        r.group.rotation.y = -Math.PI/2;
                        r.group.position.set(p.x, topRosetteLevel + lvlY, p.z);
                        this.group.add(r.group);
                    });
                }
            }
        }
    }

    _addGuardrailPost(x, z, h, yPos) {
        const group = new THREE.Group();
        group.position.set(x, yPos, z);
        const spigot = this.accessories.createSpigotConnector(true);
        group.add(spigot);
        const bolt = this.accessories.createSpecialBoltM12();
        bolt.position.y = -0.35;
        group.add(bolt);
        const pin = this.accessories.createRedLockingPin();
        pin.position.y = 0.15;
        group.add(pin);
        const post = new VerticalStandardsLW(h, 'withoutSpigot');
        group.add(post.group);
        this.group.add(group);
    }
}