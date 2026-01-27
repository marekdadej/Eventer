import * as THREE from 'three';

export class ProlyteH30D {
    constructor() {
        this.initMaterials();
    }

    initMaterials() {
        // Ten sam materiał co w innych kratach dla spójności
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

    /**
     * Tworzy segment kratownicy trójkątnej H30D (29x29cm)
     * Orientacja: "Point Up" (Jeden pas na górze, dwa na dole) - standard dla krokwi.
     * @param {number} length - Długość segmentu
     */
    create(length) {
        const group = new THREE.Group();
        
        // Wymiary H30D
        const size = 0.29; 
        const mainTubeR = 0.024; // 48mm
        const braceTubeR = 0.008; // 16mm
        
        // Obliczenie pozycji rur w przekroju trójkąta równobocznego/równoramiennego
        // Wysokość trójkąta o boku 29cm
        const triangleH = size * Math.sin(Math.PI / 3); // ok. 25cm
        
        // Pozycje Y, Z (X to długość)
        // Środek geometryczny dla obrotu
        const yTop = triangleH / 2;
        const yBot = -triangleH / 2;
        const zHalf = size / 2;

        const positions = [
            { y: yTop, z: 0 },       // Góra (Wierzchołek)
            { y: yBot, z: -zHalf },  // Dół Lewy
            { y: yBot, z: zHalf }    // Dół Prawy
        ];

        // 1. Rury główne (Main Chords)
        const chordGeo = new THREE.CylinderGeometry(mainTubeR, mainTubeR, length, 12);

        positions.forEach(pos => {
            const chord = new THREE.Mesh(chordGeo, this.matAlu);
            chord.rotation.z = Math.PI / 2; // Poziomo wzdłuż X
            chord.position.set(length / 2, pos.y, pos.z);
            chord.castShadow = true;
            group.add(chord);

            // Złącza na końcach
            this._addCoupler(group, 0, pos.y, pos.z);
            this._addCoupler(group, length, pos.y, pos.z);
        });

        // 2. Zastrzały (Bracing)
        // Mamy 3 ściany do ożebrowania: Dół (płaski), Lewy skos, Prawy skos
        
        // Ściana Dolna (między Dół Lewy a Dół Prawy)
        this._createLacing(group, length, positions[1], positions[2], braceTubeR);

        // Ściana Lewa (między Dół Lewy a Górą)
        this._createLacing(group, length, positions[1], positions[0], braceTubeR);

        // Ściana Prawa (między Dół Prawy a Górą)
        this._createLacing(group, length, positions[2], positions[0], braceTubeR);

        group.userData = {
            type: 'ProlyteH30D',
            length: length,
            weight: length * 4.5 // Lżejsza niż H30V (~4.5-5kg/m)
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

    // Funkcja pomocnicza do tworzenia "zygzaka" między dwoma pasami
    _createLacing(group, length, posA, posB, radius) {
        const step = 0.4; // Skok zastrzału
        const steps = Math.ceil(length / step);
        const actualStep = length / steps;

        for (let i = 0; i < steps; i++) {
            const x1 = i * actualStep;
            const x2 = (i + 1) * actualStep;

            // Punkty startowe i końcowe rurki zastrzału
            // Zygzak: Od pasa A (x1) do pasa B (x2)
            // A w następnym kroku odwracamy, ale tutaj robimy pojedyncze rurki
            
            // Rurka 1: A(x1) -> B(x2)
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
            
            // Ustawienie środka i orientacji
            const center = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
            brace.position.copy(center);
            brace.lookAt(pEnd);
            brace.rotateX(Math.PI / 2); // Cylinder domyślnie stoi w Y, lookAt ustawia Z
            
            group.add(brace);
        }
    }
}