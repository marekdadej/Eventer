import * as THREE from 'three';

export class ProlyteH30D {
    constructor() {
        this.initMaterials();
    }

    initMaterials() {
        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xdddddd, 
            metalness: 0.6,
            roughness: 0.4
        });
        this.matCoupler = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.5,
            roughness: 0.5
        });
    }

    create(length) {
        const group = new THREE.Group();
        
        const size = 0.29; 
        const mainTubeR = 0.024; 
        const braceTubeR = 0.008; 
        
        const triangleH = size * Math.sin(Math.PI / 3); 
        
        const yTop = triangleH / 2;
        const yBot = -triangleH / 2;
        const zHalf = size / 2;

        const positions = [
            { y: yTop, z: 0 },      
            { y: yBot, z: -zHalf },  
            { y: yBot, z: zHalf }    
        ];

        const chordGeo = new THREE.CylinderGeometry(mainTubeR, mainTubeR, length, 12);

        positions.forEach(pos => {
            const chord = new THREE.Mesh(chordGeo, this.matAlu);
            chord.rotation.z = Math.PI / 2; 
            chord.position.set(length / 2, pos.y, pos.z);
            chord.castShadow = true;
            group.add(chord);

            this._addCoupler(group, 0, pos.y, pos.z);
            this._addCoupler(group, length, pos.y, pos.z);
        });
        
        this._createLacing(group, length, positions[1], positions[2], braceTubeR);

        this._createLacing(group, length, positions[1], positions[0], braceTubeR);

        this._createLacing(group, length, positions[2], positions[0], braceTubeR);

        group.userData = {
            type: 'ProlyteH30D',
            length: length,
            weight: length * 4.5 
        };

        return group;
    }

    _addCoupler(group, x, y, z) {
        const geo = new THREE.CylinderGeometry(0.023, 0.023, 0.08, 8);
        const mesh = new THREE.Mesh(geo, this.matCoupler);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(x, y, z);
        group.add(mesh);
    }

    _createLacing(group, length, posA, posB, radius) {
        const step = 0.4; 
        const steps = Math.ceil(length / step);
        const actualStep = length / steps;

        for (let i = 0; i < steps; i++) {
            const x1 = i * actualStep;
            const x2 = (i + 1) * actualStep;
            
            let pStart, pEnd;

            if (i % 2 === 0) {
                pStart = new THREE.Vector3(x1, posA.y, posA.z);
                pEnd = new THREE.Vector3(x2, posB.y, posB.z);
            } else {
                pStart = new THREE.Vector3(x1, posB.y, posB.z);
                pEnd = new THREE.Vector3(x2, posA.y, posA.z);
            }

            const dist = pStart.distanceTo(pEnd);
            const brace = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dist, 6), this.matAlu);
            
            const center = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
            brace.position.copy(center);
            brace.lookAt(pEnd);
            brace.rotateX(Math.PI / 2); 
            
            group.add(brace);
        }
    }
}