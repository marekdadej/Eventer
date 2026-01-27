import * as THREE from 'three';

export class ProlyteH30V {
    constructor() {
        this.initMaterials();
    }

    initMaterials() {
        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xdddddd, // Aluminium
            metalness: 0.6,
            roughness: 0.4
        });
        this.matCoupler = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa, // Złącza
            metalness: 0.5,
            roughness: 0.5
        });
    }

    /**
     * Tworzy segment kratownicy H30V (29x29cm)
     * @param {number} length - Długość segmentu (np. 0.5, 1.0, 2.0, 3.0, 4.0)
     */
    create(length) {
        const group = new THREE.Group();
        
        // Wymiary Prolyte H30V
        const size = 0.29; // 290mm w osiach rur (zewnętrznie)
        const mainTubeR = 0.024; // Rura 48mm
        const braceTubeR = 0.008; // Rurka zastrzału 16mm
        const half = size / 2;

        // 1. Rury główne (4 pasy)
        const chordGeo = new THREE.CylinderGeometry(mainTubeR, mainTubeR, length, 12);
        const positions = [
            [-half, -half], [half, -half], // Dół
            [-half, half],  [half, half]   // Góra
        ];

        positions.forEach(pos => {
            const chord = new THREE.Mesh(chordGeo, this.matAlu);
            chord.rotation.z = Math.PI / 2; // Poziomo wzdłuż X
            chord.position.set(length / 2, pos[1], pos[0]);
            chord.castShadow = true;
            chord.receiveShadow = true;
            group.add(chord);

            // Dodaj złącza stożkowe (Couplers) na końcach
            this._addCoupler(group, 0, pos[1], pos[0]);
            this._addCoupler(group, length, pos[1], pos[0]);
        });

        // 2. Zastrzały (Bracing) - ZigZag
        // Dla H30V skok zastrzału to zazwyczaj ok. 30-40cm
        this._createBracing(group, length, size, braceTubeR);

        // Dane metadane
        group.userData = {
            type: 'ProlyteH30V',
            length: length,
            weight: length * 6.0 // Przybliżona waga ~6kg/m
        };

        return group;
    }

    _addCoupler(group, x, y, z) {
        // Uproszczony stożek (Conical Coupler)
        const geo = new THREE.CylinderGeometry(0.023, 0.023, 0.08, 8);
        const mesh = new THREE.Mesh(geo, this.matCoupler);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(x, y, z);
        group.add(mesh);
    }

    _createBracing(group, length, size, r) {
        // Generowanie 4 ścian zastrzałów
        const steps = Math.ceil(length / 0.4); // Skok co ~40cm
        const stepLen = length / steps;
        const half = size / 2;

        const faces = [
            // Pary wierzchołków dla ścian (Y, Z)
            { a: [-half, -half], b: [-half, half] }, // Bok Lewy
            { a: [half, -half], b: [half, half] },   // Bok Prawy
            { a: [-half, half], b: [half, half] },   // Góra
            { a: [-half, -half], b: [half, -half] }  // Dół
        ];

        faces.forEach((face, index) => {
            for (let i = 0; i < steps; i++) {
                const x1 = i * stepLen;
                const x2 = (i + 1) * stepLen;
                
                // Zig-zag
                const pStart = new THREE.Vector3(x1, face.a[1], face.a[0]);
                const pEnd = new THREE.Vector3(x2, face.b[1], face.b[0]);
                
                // Odwracanie co drugi krok dla efektu kratownicy
                if (i % 2 !== 0) {
                    pStart.set(x1, face.b[1], face.b[0]);
                    pEnd.set(x2, face.a[1], face.a[0]);
                }

                const dist = pStart.distanceTo(pEnd);
                const brace = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dist, 6), this.matAlu);
                
                // Pozycjonowanie i obrót w 3D
                const center = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
                brace.position.copy(center);
                brace.lookAt(pEnd);
                brace.rotateX(Math.PI / 2);
                
                group.add(brace);
            }
        });
    }
}