import * as THREE from 'three';

export class ProlyteH40V {
    constructor() {
        this.initMaterials();
    }

    initMaterials() {
        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xeef1f5, // Nieco jaśniejsze alu
            metalness: 0.6,
            roughness: 0.35
        });
        this.matCoupler = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.5,
            roughness: 0.5
        });
    }

    /**
     * Tworzy segment kratownicy H40V (39x39cm)
     * @param {number} length - Długość segmentu
     */
    create(length) {
        const group = new THREE.Group();
        
        // Wymiary Prolyte H40V
        const size = 0.39; // 390mm
        const mainTubeR = 0.024; // 48mm
        const braceTubeR = 0.010; // Zastrzały 20mm (grubsze niż w H30)
        const half = size / 2;

        // 1. Rury główne
        const chordGeo = new THREE.CylinderGeometry(mainTubeR, mainTubeR, length, 16); // Więcej segmentów dla ładniejszego wyglądu
        const positions = [
            [-half, -half], [half, -half],
            [-half, half],  [half, half]
        ];

        positions.forEach(pos => {
            const chord = new THREE.Mesh(chordGeo, this.matAlu);
            chord.rotation.z = Math.PI / 2;
            chord.position.set(length / 2, pos[1], pos[0]);
            chord.castShadow = true;
            group.add(chord);

            this._addCoupler(group, 0, pos[1], pos[0]);
            this._addCoupler(group, length, pos[1], pos[0]);
        });

        // 2. Drabinka (Ladder) na końcach segmentu (charakterystyczne dla H40)
        // H40V ma często poprzeczkę na samym końcu przed złączem
        this._addEndFrame(group, 0, size, braceTubeR);
        this._addEndFrame(group, length, size, braceTubeR);

        // 3. Zastrzały
        this._createBracing(group, length, size, braceTubeR);

        group.userData = {
            type: 'ProlyteH40V',
            length: length,
            weight: length * 8.5 // ~8.5kg/m
        };

        return group;
    }

    _addCoupler(group, x, y, z) {
        const geo = new THREE.CylinderGeometry(0.024, 0.024, 0.09, 8);
        const mesh = new THREE.Mesh(geo, this.matCoupler);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(x, y, z);
        group.add(mesh);
    }

    _addEndFrame(group, x, size, r) {
        const half = size / 2;
        const barGeo = new THREE.CylinderGeometry(r, r, size, 8);
        
        // Pionowe
        const v1 = new THREE.Mesh(barGeo, this.matAlu);
        v1.position.set(x, 0, -half);
        group.add(v1);
        
        const v2 = new THREE.Mesh(barGeo, this.matAlu);
        v2.position.set(x, 0, half);
        group.add(v2);

        // Poziome
        const h1 = new THREE.Mesh(barGeo, this.matAlu);
        h1.rotation.x = Math.PI / 2;
        h1.position.set(x, -half, 0);
        group.add(h1);

        const h2 = new THREE.Mesh(barGeo, this.matAlu);
        h2.rotation.x = Math.PI / 2;
        h2.position.set(x, half, 0);
        group.add(h2);
    }

    _createBracing(group, length, size, r) {
        // Dłuższy skok dla H40V (ok 0.5m)
        const steps = Math.ceil(length / 0.5); 
        const stepLen = length / steps;
        const half = size / 2;

        const faces = [
            { a: [-half, -half], b: [-half, half] },
            { a: [half, -half], b: [half, half] }, 
            { a: [-half, half], b: [half, half] },
            { a: [-half, -half], b: [half, -half] }
        ];

        faces.forEach((face) => {
            for (let i = 0; i < steps; i++) {
                const x1 = i * stepLen;
                const x2 = (i + 1) * stepLen;
                
                let pStart = new THREE.Vector3(x1, face.a[1], face.a[0]);
                let pEnd = new THREE.Vector3(x2, face.b[1], face.b[0]);
                
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