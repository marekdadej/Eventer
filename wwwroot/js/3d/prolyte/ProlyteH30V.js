import * as THREE from 'three';

export class ProlyteH30V {
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
        const half = size / 2;

        const chordGeo = new THREE.CylinderGeometry(mainTubeR, mainTubeR, length, 12);
        const positions = [
            [-half, -half], [half, -half], 
            [-half, half],  [half, half]   
        ];

        positions.forEach(pos => {
            const chord = new THREE.Mesh(chordGeo, this.matAlu);
            chord.rotation.z = Math.PI / 2;
            chord.position.set(length / 2, pos[1], pos[0]);
            chord.castShadow = true;
            chord.receiveShadow = true;
            group.add(chord);

            this._addCoupler(group, 0, pos[1], pos[0]);
            this._addCoupler(group, length, pos[1], pos[0]);
        });

        this._createBracing(group, length, size, braceTubeR);

        group.userData = {
            type: 'ProlyteH30V',
            length: length,
            weight: length * 6.0 
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

    _createBracing(group, length, size, r) {
        const steps = Math.ceil(length / 0.4); 
        const stepLen = length / steps;
        const half = size / 2;

        const faces = [
            { a: [-half, -half], b: [-half, half] }, 
            { a: [half, -half], b: [half, half] },   
            { a: [-half, half], b: [half, half] },   
            { a: [-half, -half], b: [half, -half] } 
        ];

        faces.forEach((face, index) => {
            for (let i = 0; i < steps; i++) {
                const x1 = i * stepLen;
                const x2 = (i + 1) * stepLen;
                
                const pStart = new THREE.Vector3(x1, face.a[1], face.a[0]);
                const pEnd = new THREE.Vector3(x2, face.b[1], face.b[0]);
                
                if (i % 2 !== 0) {
                    pStart.set(x1, face.b[1], face.b[0]);
                    pEnd.set(x2, face.a[1], face.a[0]);
                }

                const dist = pStart.distanceTo(pEnd);
                const brace = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dist, 6), this.matAlu);
                
                const center = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
                brace.position.copy(center);
                brace.lookAt(pEnd);
                brace.rotateX(Math.PI / 2);
                
                group.add(brace);
            }
        });
    }
}