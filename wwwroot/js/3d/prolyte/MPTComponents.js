import * as THREE from 'three';

export class MPTComponents {
    constructor() {
        this.initMaterials();
    }

    initMaterials() {
        this.matBlackSteel = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.2,
            roughness: 0.7
        });

        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.6,
            roughness: 0.4
        });

        this.matWheel = new THREE.MeshStandardMaterial({
            color: 0xdddddd, 
            roughness: 0.5
        });

        this.matZinc = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.4,
            roughness: 0.5
        });
    }

    createBase() {
        const group = new THREE.Group();

        const frameSize = 0.6;
        const frameH = 0.15;
        
        const beamGeo = new THREE.BoxGeometry(frameSize, frameH, 0.1);
        
        const b1 = new THREE.Mesh(beamGeo, this.matBlackSteel);
        b1.position.set(0, frameH/2, frameSize/2 - 0.05);
        group.add(b1);
        
        const b2 = b1.clone();
        b2.position.set(0, frameH/2, -frameSize/2 + 0.05);
        group.add(b2);

        const beamSideGeo = new THREE.BoxGeometry(0.1, frameH, frameSize - 0.2);
        const b3 = new THREE.Mesh(beamSideGeo, this.matBlackSteel);
        b3.position.set(frameSize/2 - 0.05, frameH/2, 0);
        group.add(b3);

        const b4 = b3.clone();
        b4.position.set(-frameSize/2 + 0.05, frameH/2, 0);
        group.add(b4);

        const trussSize = 0.29;
        const half = trussSize / 2;
        const positions = [
            [-half, -half], [half, -half],
            [-half, half],  [half, half]
        ];

        const couplerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.1, 16);
        positions.forEach(pos => {
            const coupler = new THREE.Mesh(couplerGeo, this.matZinc);
            coupler.position.set(pos[0], frameH + 0.05, pos[1]);
            group.add(coupler);
        });

        this._addOutriggers(group, frameSize);

        group.userData = { type: 'MPTBase' };
        return group;
    }

    _addOutriggers(group, frameSize) {
        const legLen = 1.5; 
        const legAngle = Math.PI / 4; 

        for (let i = 0; i < 4; i++) {
            const legGroup = new THREE.Group();
            
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, legLen, 8), this.matBlackSteel);
            tube.rotation.z = Math.PI / 2;
            tube.position.set(legLen / 2 + frameSize/2, 0.1, 0); 
            legGroup.add(tube);

            const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), this.matZinc);
            jack.position.set(legLen + frameSize/2 - 0.1, -0.1, 0);
            legGroup.add(jack);

            const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.01, 16), this.matZinc);
            plate.position.set(legLen + frameSize/2 - 0.1, -0.3, 0); 
            legGroup.add(plate);

            legGroup.rotation.y = (i * Math.PI / 2) + legAngle;
            
            group.add(legGroup);
        }
    }

    createSleeveBlock() {
        const group = new THREE.Group();

        const size = 0.55; 
        const height = 0.6; 

        const postGeo = new THREE.BoxGeometry(0.06, height, 0.06);
        const half = size / 2;
        const posts = [
            { x: -half, z: -half }, { x: half, z: -half },
            { x: -half, z: half },  { x: half, z: half }
        ];

        posts.forEach(p => {
            const post = new THREE.Mesh(postGeo, this.matBlackSteel);
            post.position.set(p.x, height/2, p.z); 
            group.add(post);
        });

        const plateGeo = new THREE.BoxGeometry(size, 0.02, size);
    
        this._createFrame(group, size, 0.02, 0); 
        this._createFrame(group, size, 0.02, height); 

        const mastSize = 0.29;
        const rollerR = 0.04;
        const rollerW = 0.05;
        const rollerGeo = new THREE.CylinderGeometry(rollerR, rollerR, rollerW, 16);
        
        const rollerOffset = mastSize / 2 + rollerR; 
        
        const rollerPositions = [
            { x: rollerOffset, y: height*0.2, z: 0, rotZ: Math.PI/2 },
            { x: -rollerOffset, y: height*0.2, z: 0, rotZ: Math.PI/2 },
            { x: 0, y: height*0.8, z: rollerOffset, rotX: Math.PI/2 },
            { x: 0, y: height*0.8, z: -rollerOffset, rotX: Math.PI/2 }
        ];

        rollerPositions.forEach(rp => {
            const r = new THREE.Mesh(rollerGeo, this.matWheel);
            r.position.set(rp.x, rp.y, rp.z);
            if (rp.rotZ) r.rotation.z = rp.rotZ;
            if (rp.rotX) r.rotation.x = rp.rotX;
            group.add(r);
        });

        this._addTrussConnectors(group, size, height);

        group.userData = { type: 'SleeveBlock' };
        return group;
    }

    _createFrame(group, size, thickness, y) {
        const w = 0.1; 
        const half = size / 2;
        const geoX = new THREE.BoxGeometry(size, thickness, w);
        const geoZ = new THREE.BoxGeometry(w, thickness, size - 2*w); 

        const m1 = new THREE.Mesh(geoX, this.matBlackSteel);
        m1.position.set(0, y, half - w/2);
        group.add(m1);

        const m2 = m1.clone();
        m2.position.set(0, y, -half + w/2);
        group.add(m2);

        const m3 = new THREE.Mesh(geoZ, this.matBlackSteel);
        m3.position.set(half - w/2, y, 0);
        group.add(m3);

        const m4 = m3.clone();
        m4.position.set(-half + w/2, y, 0);
        group.add(m4);
    }

    _addTrussConnectors(group, sleeveSize, sleeveHeight) {
        
        const h40 = 0.39;
        const halfH40 = h40 / 2;
        const halfSleeve = sleeveSize / 2;
        const zPos = [ -halfH40, halfH40 ]; 
        
        zPos.forEach(locY => { 
             const gridCenterY = sleeveHeight / 2;
             
             const offsets = [-halfH40, halfH40];
             
             offsets.forEach(off1 => {
                 offsets.forEach(off2 => {
                     const conn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16), this.matZinc);
                     conn.rotation.x = Math.PI / 2; 
                     conn.position.set(off2, gridCenterY + off1, halfSleeve);
                     group.add(conn);
                     
                     const connBack = conn.clone();
                     connBack.position.set(off2, gridCenterY + off1, -halfSleeve);
                     group.add(connBack);

                     const connR = conn.clone();
                     connR.rotation.x = 0;
                     connR.rotation.z = Math.PI / 2;
                     connR.position.set(halfSleeve, gridCenterY + off1, off2);
                     group.add(connR);

                     const connL = connR.clone();
                     connL.position.set(-halfSleeve, gridCenterY + off1, off2);
                     group.add(connL);
                 });
             });
        });
    }

    createTopSection() {
        const group = new THREE.Group();
        
        const size = 0.35; 
        const height = 0.3;

        const base = new THREE.Mesh(new THREE.BoxGeometry(size, 0.05, size), this.matBlackSteel);
        group.add(base);

        const wallGeo = new THREE.BoxGeometry(0.02, height, size);
        const w1 = new THREE.Mesh(wallGeo, this.matBlackSteel);
        w1.position.set(0.1, height/2, 0);
        group.add(w1);

        const w2 = w1.clone();
        w2.position.set(-0.1, height/2, 0);
        group.add(w2);

        const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 24);
        const wheel = new THREE.Mesh(wheelGeo, this.matBlackSteel); 
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(0, height - 0.08, 0);
        group.add(wheel);

        group.userData = { type: 'MPTTop' };
        return group;
    }
}