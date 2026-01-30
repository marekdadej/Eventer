import * as THREE from 'three';
import { LayherPartsBase } from './LayherCore.js';

export class VerticalBracesLW extends LayherPartsBase {
    constructor(fieldHeight, fieldWidth) {
        super();
        this.fieldHeight = fieldHeight; 
        this.fieldWidth = fieldWidth;   
        
        this.initMaterials();

        this.data = this._getData();
        this.group = this._buildHighDetail();
        
        this.group.userData = {
            type: 'VerticalBraceLW',
            height: this.fieldHeight,
            width: this.fieldWidth,
            length: this.data.length,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber
        };
    }

    initMaterials() {
        this.matCastSteel = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            roughness: 0.9, 
            metalness: 0.4 
        }); 
        this.matWedgeShiny = new THREE.MeshStandardMaterial({ 
            color: 0xCCCCCC, 
            roughness: 0.4, 
            metalness: 0.7 
        });
        this.matTubeGalv = this.matGalvNew; 
    }

    _getData() {
        const dataMap = {
            2.0: { 2.07: { length: 2.81 }, 2.57: { length: 3.18 }, 3.07: { length: 3.60 } },
            1.5: { 2.07: { length: 2.48 } },
            1.0: { 2.07: { length: 2.20 } }
        };
        const h = dataMap[this.fieldHeight];
        if (h && h[this.fieldWidth]) {
            return { ...h[this.fieldWidth], weight: 10, catalogNumber: 'DETAILED' };
        }
        const calcLen = Math.sqrt(this.fieldHeight**2 + this.fieldWidth**2);
        return { length: parseFloat(calcLen.toFixed(2)), weight: calcLen*3.5, catalogNumber: 'CUSTOM' };
    }

    _buildHighDetail() {
        const group = new THREE.Group();
        
        const H = this.fieldHeight;
        const W = this.fieldWidth;
        const gridDiagonalLen = Math.sqrt(H*H + W*W);

        const rPipe = 0.02415; 
 
        const standOffset = 0.058; 

        const pivotOffset = 0.040; 

        const tailLength = 0.035; 

        const startWedgePos = new THREE.Vector3(standOffset, 0, 0);
        const endWedgePos = new THREE.Vector3(gridDiagonalLen - standOffset, 0, 0);

        const startPivotPos = new THREE.Vector3(standOffset + pivotOffset, 0, 0);
        const endPivotPos = new THREE.Vector3(gridDiagonalLen - (standOffset + pivotOffset), 0, 0);

        const head1 = this._createCastHead(startWedgePos, startPivotPos, false);
        group.add(head1);

        const head2 = this._createCastHead(endWedgePos, endPivotPos, true);
        group.add(head2);

        const tubeAssembly = this._createTubeAssembly(startPivotPos, endPivotPos, rPipe, tailLength);
        group.add(tubeAssembly);

        group.traverse(obj => {
            if(obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
        });

        return group;
    }

    _createCastHead(wedgePos, pivotPos, isEnd) {
        const headGroup = new THREE.Group();
        headGroup.position.copy(wedgePos);
        
        if (isEnd) {
            headGroup.rotation.y = Math.PI;
        }

        const distToPivot = wedgePos.distanceTo(pivotPos);
        
        const jawThickness = 0.012; 
        const jawHeight = 0.055;
        const jawWidth = 0.05; 
        const gapForTube = 0.016; 
        const cheekThickness = (jawWidth - gapForTube) / 2;

        const cheekGeo = new THREE.BoxGeometry(distToPivot + 0.02, jawHeight, cheekThickness);

        const cheekL = new THREE.Mesh(cheekGeo, this.matCastSteel);
        cheekL.position.set(distToPivot/2, 0, -(gapForTube + cheekThickness)/2);
        headGroup.add(cheekL);

        const cheekR = new THREE.Mesh(cheekGeo, this.matCastSteel);
        cheekR.position.set(distToPivot/2, 0, (gapForTube + cheekThickness)/2);
        headGroup.add(cheekR);

        const topBlockGeo = new THREE.BoxGeometry(0.03, 0.02, jawWidth);
        const topBlock = new THREE.Mesh(topBlockGeo, this.matCastSteel);
        topBlock.position.set(0, jawHeight/2 + 0.01, 0);
        headGroup.add(topBlock);

        const wedgeShape = new THREE.Shape();
        const wTop = 0.015, wBot = 0.008, wLen = 0.14;
        wedgeShape.moveTo(-wTop/2, wLen/2);
        wedgeShape.lineTo(wTop/2, wLen/2);
        wedgeShape.lineTo(wBot/2, -wLen/2);
        wedgeShape.lineTo(-wBot/2, -wLen/2);
        wedgeShape.closePath();
        const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.006, bevelEnabled: false });
        const wedge = new THREE.Mesh(wedgeGeo, this.matWedgeShiny);
        wedge.rotation.y = Math.PI/2; 
        wedge.position.y = 0.02; 
        headGroup.add(wedge);

        const pinGeo = new THREE.CylinderGeometry(0.008, 0.008, jawWidth + 0.005, 12);
        pinGeo.rotateX(Math.PI/2);
        const pin = new THREE.Mesh(pinGeo, this.matHighSteel);
        pin.position.set(distToPivot, 0, 0);
        headGroup.add(pin);

        return headGroup;
    }

    _createTubeAssembly(p1, p2, rPipe, tailLength) {
        const assemblyGroup = new THREE.Group();
        
        assemblyGroup.position.copy(p1);
        assemblyGroup.lookAt(p2);
        
        const totalPivotDistance = p1.distanceTo(p2);
        
        const flatThickness = 0.014; 
        const flatWidth = rPipe * 1.8; 
        const flatTransitionLen = 0.08; 

        const flatStartGeo = new THREE.BoxGeometry(tailLength + flatTransitionLen, flatThickness, flatWidth);
        const flatStart = new THREE.Mesh(flatStartGeo, this.matTubeGalv);
  
        flatStart.position.set((flatTransitionLen - tailLength)/2, 0, 0);
        assemblyGroup.add(flatStart);

        const flatEnd = flatStart.clone();
        flatEnd.position.set(totalPivotDistance - (flatTransitionLen - tailLength)/2, 0, 0);
        assemblyGroup.add(flatEnd);

        const roundTubeLen = totalPivotDistance - 2 * flatTransitionLen;
        
        if (roundTubeLen > 0) {
            const tubeGeo = new THREE.CylinderGeometry(rPipe, rPipe, roundTubeLen, 16);
            tubeGeo.rotateZ(Math.PI/2); 
            const tube = new THREE.Mesh(tubeGeo, this.matTubeGalv);
            tube.position.set(totalPivotDistance / 2, 0, 0);
            assemblyGroup.add(tube);

            this._addDetailsToTube(assemblyGroup, rPipe, roundTubeLen, totalPivotDistance / 2);
        }

        return assemblyGroup;
    }

    _addDetailsToTube(group, rPipe, tubeLen, centerX) {
        const stickerGeo = new THREE.CylinderGeometry(rPipe + 0.0005, rPipe + 0.0005, 0.08, 16, 1, true);
        stickerGeo.rotateZ(Math.PI/2);
        const sticker = new THREE.Mesh(stickerGeo, this.matPlasticRed);
        sticker.position.set(centerX, 0, 0);
        group.add(sticker);

        const rivetCount = Math.floor(tubeLen / 0.4);
        const startX = centerX - tubeLen/2;
        for(let i=1; i<rivetCount; i++) {
            const riv = new THREE.Mesh(this.geoRivet, this.matHighSteel);
            riv.position.set(startX + i*0.4, rPipe, 0);
            group.add(riv);
        }
    }
}