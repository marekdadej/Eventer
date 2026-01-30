import * as THREE from 'three';
import { TrussFactory } from './TrussFactory.js'; 

export class ProlyteAccessories {
    constructor() {
        this.initMaterials();
        this.tf = new TrussFactory(); 
    }

    initMaterials() {
        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            metalness: 0.6,
            roughness: 0.4
        });
        this.matSteelBlack = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.3,
            roughness: 0.7
        });
        this.matCoupler = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa, 
            metalness: 0.5,
            roughness: 0.5
        });
    }

    createBoxCorner40() {
        const group = new THREE.Group();
        const size = 0.39; 
        const plateThick = 0.01; 

        const plateGeo = new THREE.BoxGeometry(size, size, plateThick);
        
        const p1 = new THREE.Mesh(plateGeo, this.matAlu); p1.position.z = size/2; group.add(p1);
        const p2 = new THREE.Mesh(plateGeo, this.matAlu); p2.position.z = -size/2; group.add(p2);
        
        const p3 = new THREE.Mesh(plateGeo, this.matAlu); p3.rotation.y = Math.PI/2; p3.position.x = size/2; group.add(p3);
        const p4 = new THREE.Mesh(plateGeo, this.matAlu); p4.rotation.y = Math.PI/2; p4.position.x = -size/2; group.add(p4);

        const p5 = new THREE.Mesh(plateGeo, this.matAlu); p5.rotation.x = Math.PI/2; p5.position.y = size/2; group.add(p5);
        const p6 = new THREE.Mesh(plateGeo, this.matAlu); p6.rotation.x = Math.PI/2; p6.position.y = -size/2; group.add(p6);

        this._addConnectorsToFace(group, size, 'z+');
        this._addConnectorsToFace(group, size, 'z-');
        this._addConnectorsToFace(group, size, 'x+');
        this._addConnectorsToFace(group, size, 'x-');
        this._addConnectorsToFace(group, size, 'y+');
        this._addConnectorsToFace(group, size, 'y-');

        group.userData = { type: 'BoxCorner40V' };
        return group;
    }

    _addConnectorsToFace(group, size, face) {
        const offset = size / 2 + 0.04; 
        const spacing = 0.24; 
        const ax = 0.342 / 2;

        const positions = [
            [-ax, -ax], [ax, -ax],
            [-ax, ax],  [ax, ax]
        ];

        const couplerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.08, 12);

        positions.forEach(pos => {
            const c = new THREE.Mesh(couplerGeo, this.matCoupler);
            
            if (face === 'z+') { c.rotation.x = Math.PI/2; c.position.set(pos[0], pos[1], offset); }
            if (face === 'z-') { c.rotation.x = Math.PI/2; c.position.set(pos[0], pos[1], -offset); }
            
            if (face === 'x+') { c.rotation.z = Math.PI/2; c.position.set(offset, pos[1], pos[0]); }
            if (face === 'x-') { c.rotation.z = Math.PI/2; c.position.set(-offset, pos[1], pos[0]); }

            if (face === 'y+') { c.position.set(pos[0], offset, pos[1]); }
            if (face === 'y-') { c.position.set(pos[0], -offset, pos[1]); }

            group.add(c);
        });
    }

    createRidgeNode() {
        const group = new THREE.Group();
        const size = 0.39;
        
        const core = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), this.matAlu);
        group.add(core);

        this._addConnectorsToFace(group, size, 'y-');

        this._addConnectorsToFace(group, size, 'z+');
        this._addConnectorsToFace(group, size, 'z-');
        
        const roofAngle = Math.atan2(2.0, 5.0); 
        
        const leftArm = new THREE.Group();
        leftArm.position.x = -size/2;
        leftArm.rotation.z = -roofAngle; 
        this._addTriangleConnectors(leftArm);
        group.add(leftArm);

        const rightArm = new THREE.Group();
        rightArm.position.x = size/2;
        rightArm.rotation.z = roofAngle; 
        rightArm.rotation.y = Math.PI; 
        this._addTriangleConnectors(rightArm);
        group.add(rightArm);

        group.userData = { type: 'RidgeNode' };
        return group;
    }

    _addTriangleConnectors(parent) {
        const ax = 0.239 / 2;
        const h = (0.239 * Math.sqrt(3)) / 2;
        
        const couplerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.1, 12);
        couplerGeo.rotateZ(Math.PI/2); 

        const c1 = new THREE.Mesh(couplerGeo, this.matCoupler);
        c1.position.set(-0.05, h/2, 0); 
        parent.add(c1);

        const c2 = new THREE.Mesh(couplerGeo, this.matCoupler);
        c2.position.set(-0.05, -h/2, ax);
        parent.add(c2);

        const c3 = new THREE.Mesh(couplerGeo, this.matCoupler);
        c3.position.set(-0.05, -h/2, -ax);
        parent.add(c3);
    }
     
    createRidgeSupportAssembly(height = 1.5) {
        const group = new THREE.Group();

        const bottomCorner = this.createBoxCorner40();
        bottomCorner.position.y = 0; 
        group.add(bottomCorner);
        const trussLen = 1.0; 
        
        const spacer = this.tf.createTrussSegment(trussLen, 'H40V'); 
        spacer.rotation.z = Math.PI / 2; 
        spacer.position.y = 0.39/2 + trussLen/2; 
        group.add(spacer);

        const topNode = this.createRidgeNode();
        topNode.position.y = 0.39/2 + trussLen + 0.39/2;
        group.add(topNode);

        return group;
    }
}