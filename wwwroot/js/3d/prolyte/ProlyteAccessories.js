import * as THREE from 'three';
import { TrussFactory } from './TrussFactory.js'; // Użyjemy do wygenerowania odcinka 1m

export class ProlyteAccessories {
    constructor() {
        this.initMaterials();
        this.tf = new TrussFactory(); // Instancja do generowania kratek
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
            color: 0xaaaaaa, // Złącza/Piny
            metalness: 0.5,
            roughness: 0.5
        });
    }

    /**
     * Tworzy Box Corner (Kostkę) H40V.
     * Jest to element węzłowy na obwiedni.
     */
    createBoxCorner40() {
        const group = new THREE.Group();
        const size = 0.39; // Wymiar H40V (390mm)
        const plateThick = 0.01; // Grubość blachy

        // 1. Główna bryła (Płyty boczne tworzące sześcian)
        // Zamiast pełnego klocka, robimy 6 płyt dla realizmu (Box Corner jest pusty w środku)
        const plateGeo = new THREE.BoxGeometry(size, size, plateThick);
        
        // Przód/Tył
        const p1 = new THREE.Mesh(plateGeo, this.matAlu); p1.position.z = size/2; group.add(p1);
        const p2 = new THREE.Mesh(plateGeo, this.matAlu); p2.position.z = -size/2; group.add(p2);
        
        // Lewo/Prawo
        const p3 = new THREE.Mesh(plateGeo, this.matAlu); p3.rotation.y = Math.PI/2; p3.position.x = size/2; group.add(p3);
        const p4 = new THREE.Mesh(plateGeo, this.matAlu); p4.rotation.y = Math.PI/2; p4.position.x = -size/2; group.add(p4);

        // Góra/Dół
        const p5 = new THREE.Mesh(plateGeo, this.matAlu); p5.rotation.x = Math.PI/2; p5.position.y = size/2; group.add(p5);
        const p6 = new THREE.Mesh(plateGeo, this.matAlu); p6.rotation.x = Math.PI/2; p6.position.y = -size/2; group.add(p6);

        // 2. Konektory (pół-złącza przykręcone do płyt)
        // Dodajemy je na wszystkich 6 ścianach logicznie (można by parametryzować, ale damy full)
        this._addConnectorsToFace(group, size, 'z+');
        this._addConnectorsToFace(group, size, 'z-');
        this._addConnectorsToFace(group, size, 'x+');
        this._addConnectorsToFace(group, size, 'x-');
        this._addConnectorsToFace(group, size, 'y+'); // Ważne dla słupka kalenicy
        this._addConnectorsToFace(group, size, 'y-');

        group.userData = { type: 'BoxCorner40V' };
        return group;
    }

    _addConnectorsToFace(group, size, face) {
        const offset = size / 2 + 0.04; // Wystają poza płytę
        const spacing = 0.24; // Rozstaw otworów dla H40V (standard ok. 240mm w osiach?)
        // H40V ma 390mm zewn, rura 48mm. Rozstaw osiowy to ok 342mm.
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

    /**
     * Tworzy górny węzeł kalenicy (Ridge Node).
     * Łączy pionowy słupek (dół), kalenicę (przód/tył) i krokwie (lewo/prawo pod kątem).
     */
    createRidgeNode() {
        const group = new THREE.Group();
        // Bazujemy na kształcie Box Cornera, ale z uchwytami pod kątem
        const size = 0.39;
        
        // Centralny blok
        const core = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), this.matAlu);
        group.add(core);

        // Złącza dolne (do słupka 1m)
        this._addConnectorsToFace(group, size, 'y-');

        // Złącza Przód/Tył (dla kalenicy H40V)
        this._addConnectorsToFace(group, size, 'z+');
        this._addConnectorsToFace(group, size, 'z-');

        // Złącza dla Krokwi (H30D) - pod kątem
        // Kąt dachu np. 20 stopni (ok 0.35 rad)
        // H30D jest trójkątna (wierzchołek góra).
        // Tutaj robimy uproszczenie - adaptery wychodzą z boków X+ i X-
        
        const roofAngle = Math.atan2(2.0, 5.0); // Wysokość 2m na 5m szerokości
        
        // Lewe złącze (X-)
        const leftArm = new THREE.Group();
        leftArm.position.x = -size/2;
        leftArm.rotation.z = -roofAngle; // Pochylenie w dół
        // Dodajemy symulację złączy dla H30D (trójkąt)
        this._addTriangleConnectors(leftArm);
        group.add(leftArm);

        // Prawe złącze (X+)
        const rightArm = new THREE.Group();
        rightArm.position.x = size/2;
        rightArm.rotation.z = roofAngle; // Pochylenie w dół
        rightArm.rotation.y = Math.PI; // Obrót, żeby trójkąt pasował
        this._addTriangleConnectors(rightArm);
        group.add(rightArm);

        group.userData = { type: 'RidgeNode' };
        return group;
    }

    _addTriangleConnectors(parent) {
        // H30D: 1 rura na górze, 2 na dole. Rozstaw 239mm.
        const ax = 0.239 / 2;
        const h = (0.239 * Math.sqrt(3)) / 2;
        // Lokalny układ: Złącza wystają w osi X (ujemnej wewnątrz grupy parenta)
        
        const couplerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.1, 12);
        couplerGeo.rotateZ(Math.PI/2); // Poziomo

        // Góra
        const c1 = new THREE.Mesh(couplerGeo, this.matCoupler);
        c1.position.set(-0.05, h/2, 0); // Wystaje w lewo
        parent.add(c1);

        // Dół Lewy
        const c2 = new THREE.Mesh(couplerGeo, this.matCoupler);
        c2.position.set(-0.05, -h/2, ax);
        parent.add(c2);

        // Dół Prawy
        const c3 = new THREE.Mesh(couplerGeo, this.matCoupler);
        c3.position.set(-0.05, -h/2, -ax);
        parent.add(c3);
    }

    /**
     * Główna funkcja składająca podporę kalenicy.
     * Składa się z: Box Corner (Dół) + Krata 1m + Ridge Node (Góra).
     * @param {number} height - Całkowita wysokość (np. 1.5m lub 2.0m)
     */
    createRidgeSupportAssembly(height = 1.5) {
        const group = new THREE.Group();

        // 1. Dolny Box Corner
        const bottomCorner = this.createBoxCorner40();
        bottomCorner.position.y = 0; 
        group.add(bottomCorner);

        // 2. Krata pionowa (Spacer)
        // Wysokość kostki to 0.39. Wysokość górnej kostki to 0.39.
        // Długość kraty = height - (0.39/2 dolnej) - (0.39/2 górnej) ?
        // Zazwyczaj "height" to wysokość od osi do osi.
        // Jeśli chcemy 1m kratę:
        const trussLen = 1.0; 
        // Korzystamy z TrussFactory (musimy ją zaimportować lub przekazać)
        // W ProlyteAccessories mamy this.tf = new TrussFactory();
        
        // H40V czy H30V? Zazwyczaj słupki są H30V lub H40V. Przyjmijmy H40V dla stabilności.
        const spacer = this.tf.createTrussSegment(trussLen, 'H40V'); 
        spacer.rotation.z = Math.PI / 2; // Pionowo
        spacer.position.y = 0.39/2 + trussLen/2; // Stoi na kostce
        group.add(spacer);

        // 3. Górny Ridge Node
        const topNode = this.createRidgeNode();
        topNode.position.y = 0.39/2 + trussLen + 0.39/2;
        group.add(topNode);

        return group;
    }
}