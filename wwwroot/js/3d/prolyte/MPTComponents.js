import * as THREE from 'three';

export class MPTComponents {
    constructor() {
        this.initMaterials();
    }

    initMaterials() {
        // Stal czarna (malowana proszkowo) - typowe dla baz MPT
        this.matBlackSteel = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.2,
            roughness: 0.7
        });

        // Aluminium (elementy złączne)
        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.6,
            roughness: 0.4
        });

        // Kółka wózka (często biały nylon lub czerwony poliuretan)
        this.matWheel = new THREE.MeshStandardMaterial({
            color: 0xdddddd, // Biały nylon
            roughness: 0.5
        });

        // Wrzeciona stóp (ocynk)
        this.matZinc = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.4,
            roughness: 0.5
        });
    }

    /**
     * Tworzy stalową bazę MPT z outriggerami (podporami)
     */
    createBase() {
        const group = new THREE.Group();

        // 1. Rama główna (Centrum)
        // Baza pod kratę H30V (29cm). Rama jest nieco większa, np. 60x60cm.
        const frameSize = 0.6;
        const frameH = 0.15;
        
        // Budujemy ramkę z 4 belek
        const beamGeo = new THREE.BoxGeometry(frameSize, frameH, 0.1);
        
        // Przód/Tył
        const b1 = new THREE.Mesh(beamGeo, this.matBlackSteel);
        b1.position.set(0, frameH/2, frameSize/2 - 0.05);
        group.add(b1);
        
        const b2 = b1.clone();
        b2.position.set(0, frameH/2, -frameSize/2 + 0.05);
        group.add(b2);

        // Boki
        const beamSideGeo = new THREE.BoxGeometry(0.1, frameH, frameSize - 0.2);
        const b3 = new THREE.Mesh(beamSideGeo, this.matBlackSteel);
        b3.position.set(frameSize/2 - 0.05, frameH/2, 0);
        group.add(b3);

        const b4 = b3.clone();
        b4.position.set(-frameSize/2 + 0.05, frameH/2, 0);
        group.add(b4);

        // 2. Konektory do kratownicy (CCS6) - 4 pół-stożki męskie wystające w górę
        const trussSize = 0.29;
        const half = trussSize / 2;
        const positions = [
            [-half, -half], [half, -half],
            [-half, half],  [half, half]
        ];

        const couplerGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.1, 16);
        positions.forEach(pos => {
            const coupler = new THREE.Mesh(couplerGeo, this.matZinc);
            // Umieszczamy je na górze ramy
            coupler.position.set(pos[0], frameH + 0.05, pos[1]);
            group.add(coupler);
        });

        // 3. Outriggery (Podpory stabilizujące)
        // Długie nogi (Long outriggers) idące pod kątem lub na wprost.
        // W standardzie MPT 4 nogi są wpinane w boki bazy.
        this._addOutriggers(group, frameSize);

        group.userData = { type: 'MPTBase' };
        return group;
    }

    _addOutriggers(group, frameSize) {
        // Długość nogi
        const legLen = 1.5; 
        const legAngle = Math.PI / 4; // 45 stopni (narożne)

        for (let i = 0; i < 4; i++) {
            const legGroup = new THREE.Group();
            
            // Rura teleskopowa
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, legLen, 8), this.matBlackSteel);
            tube.rotation.z = Math.PI / 2;
            tube.position.set(legLen / 2 + frameSize/2, 0.1, 0); // Lekko nad ziemią
            legGroup.add(tube);

            // Wrzeciono (Stopa) na końcu
            const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8), this.matZinc);
            jack.position.set(legLen + frameSize/2 - 0.1, -0.1, 0);
            legGroup.add(jack);

            // Podstawka stopy
            const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.01, 16), this.matZinc);
            plate.position.set(legLen + frameSize/2 - 0.1, -0.3, 0); // Na ziemi
            legGroup.add(plate);

            // Obrót całego outriggera o 45, 135, 225, 315 stopni
            legGroup.rotation.y = (i * Math.PI / 2) + legAngle;
            
            group.add(legGroup);
        }
    }

    /**
     * Tworzy Sleeve Block (Wózek)
     * Klatka, która jeździ po H30V i trzyma H40V
     */
    createSleeveBlock() {
        const group = new THREE.Group();

        // Wymiary zewnetrzne wózka (musi być większy niż H30V i pasować do H40V)
        // H40V ma 39cm. Wózek jest kostką ok. 50-60cm.
        const size = 0.55; 
        const height = 0.6; 

        // 1. Klatka (Narożniki)
        const postGeo = new THREE.BoxGeometry(0.06, height, 0.06);
        const half = size / 2;
        const posts = [
            { x: -half, z: -half }, { x: half, z: -half },
            { x: -half, z: half },  { x: half, z: half }
        ];

        posts.forEach(p => {
            const post = new THREE.Mesh(postGeo, this.matBlackSteel);
            post.position.set(p.x, height/2, p.z); // Pivot na dole
            group.add(post);
        });

        // 2. Płyty górna i dolna
        const plateGeo = new THREE.BoxGeometry(size, 0.02, size);
        // Otwór w środku (symulowany przez 4 belki zamiast pełnej płyty z dziurą dla wydajności)
        // Dla uproszczenia wizualnego zrobimy ramki góra/dół
        this._createFrame(group, size, 0.02, 0); // Dół
        this._createFrame(group, size, 0.02, height); // Góra

        // 3. Rolki prowadzące (wewnątrz)
        // Muszą dotykać wirtualnego masztu H30V (29cm)
        const mastSize = 0.29;
        const rollerR = 0.04;
        const rollerW = 0.05;
        const rollerGeo = new THREE.CylinderGeometry(rollerR, rollerR, rollerW, 16);
        
        // 4 zestawy rolek (po 2 na stronę)
        const rollerOffset = mastSize / 2 + rollerR; // Pozycja od środka
        
        // Przykładowe rolki (tylko wizualnie)
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

        // 4. Konektory dla dachu (H40V) na zewnątrz
        // H40V ma 39cm. Dodajemy "uszy" na ścianach bocznych
        this._addTrussConnectors(group, size, height);

        group.userData = { type: 'SleeveBlock' };
        return group;
    }

    _createFrame(group, size, thickness, y) {
        const w = 0.1; // szerokość belki ramy
        const half = size / 2;
        const geoX = new THREE.BoxGeometry(size, thickness, w);
        const geoZ = new THREE.BoxGeometry(w, thickness, size - 2*w); // Żeby się nie nakładały

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
        // H40V (39cm rozstawu). Sleeve ma 55cm.
        // Konektory są na środku ścian
        // Dodajemy proste "klocki" udające złącza żeńskie
        
        const h40 = 0.39;
        const halfH40 = h40 / 2;
        const halfSleeve = sleeveSize / 2;
        const zPos = [ -halfH40, halfH40 ]; // Górny i dolny pas kraty
        
        // Na wszystkich 4 ścianach (uniwersalny corner)
        // Ściana Front (Z+)
        zPos.forEach(locY => { // locY to offset w pionie od środka kraty
             // Krata H40 ma wysokość 39cm. Środek kraty wypada w środku wózka?
             // Zazwyczaj dolny pas kraty jest zlicowany z czymś, ale przyjmijmy środek.
             const gridCenterY = sleeveHeight / 2;
             
             // 4 punkty na ścianie (Góra-Lewo, Góra-Prawo, Dół-Lewo, Dół-Prawo)
             const offsets = [-halfH40, halfH40];
             
             offsets.forEach(off1 => {
                 offsets.forEach(off2 => {
                     // off1 = Y (względem środka kraty), off2 = X (szerokość kraty)
                     const conn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 16), this.matZinc);
                     conn.rotation.x = Math.PI / 2; // Wystaje w Z
                     conn.position.set(off2, gridCenterY + off1, halfSleeve);
                     group.add(conn);
                     
                     // Tył (Z-)
                     const connBack = conn.clone();
                     connBack.position.set(off2, gridCenterY + off1, -halfSleeve);
                     group.add(connBack);

                     // Bok Prawy (X+)
                     const connR = conn.clone();
                     connR.rotation.x = 0;
                     connR.rotation.z = Math.PI / 2;
                     connR.position.set(halfSleeve, gridCenterY + off1, off2);
                     group.add(connR);

                     // Bok Lewy (X-)
                     const connL = connR.clone();
                     connL.position.set(-halfSleeve, gridCenterY + off1, off2);
                     group.add(connL);
                 });
             });
        });
    }

    /**
     * Tworzy Top Section (Głowicę wieży)
     */
    createTopSection() {
        const group = new THREE.Group();
        
        // Rama nakładana na H30V (29cm)
        const size = 0.35; // Nieco szersza niż krata
        const height = 0.3;

        // Podstawa (płyta/rama)
        const base = new THREE.Mesh(new THREE.BoxGeometry(size, 0.05, size), this.matBlackSteel);
        group.add(base);

        // Boki trzymające kółko
        const wallGeo = new THREE.BoxGeometry(0.02, height, size);
        const w1 = new THREE.Mesh(wallGeo, this.matBlackSteel);
        w1.position.set(0.1, height/2, 0);
        group.add(w1);

        const w2 = w1.clone();
        w2.position.set(-0.1, height/2, 0);
        group.add(w2);

        // Kółko łańcuchowe (Roller)
        const wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 24);
        const wheel = new THREE.Mesh(wheelGeo, this.matBlackSteel); // Często czarne lub stalowe
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(0, height - 0.08, 0);
        group.add(wheel);

        group.userData = { type: 'MPTTop' };
        return group;
    }
}