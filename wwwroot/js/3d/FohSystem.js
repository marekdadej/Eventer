import * as THREE from 'three';
// POPRAWKA: Importujemy poprawne klasy z barrel file
import { 
    LayherPartsBase,
    VerticalStandardsLW,
    BaseJacks,
    BaseCollarNormal,
    HorizontalLedgersLW,
    ULedgers,
    Decks,
    ConsolesAndGirders,
    VerticalBracesLW,
    AntiSlipWoodPad
} from './layher/LayherPartsBase.js';

/**
 * FohSystem - Stanowisko realizatora (FOH) na systemie Layher.
 */
export class FohSystem {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Helpery (instancje klas pomocniczych)
        this.lpBase = new LayherPartsBase();
        this.consolesFactory = new ConsolesAndGirders();

        this.initMaterials();
    }

    initMaterials() {
        this.matRoofCanvas = new THREE.MeshStandardMaterial({
            color: 0x111111, // Czarna plandeka
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        this.matScrim = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });

        this.matTank = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.4,
            opacity: 0.9,
            transparent: true,
            roughness: 0.2
        });

        this.matStrap = new THREE.MeshStandardMaterial({ color: 0xff6600 });
    }

    clear() {
        this.group.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
        this.group.clear();
    }

    build(config) {
        this.clear();

        // 1. Walidacja wymiarów (min 2.07, max 6.21)
        let w = parseFloat(config.width) || 4.14;
        let d = parseFloat(config.depth) || 4.14;
        w = Math.max(2.07, Math.min(w, 6.21));
        d = Math.max(2.07, Math.min(d, 6.21));

        const dist = parseFloat(config.dist) || 20.0;
        
        // Poziomy: 'ground', 'twoStory', 'threeStory'
        const levelType = config.level || 'twoStory'; 
        
        let levels = [0.2]; // Zawsze parter (wysokość podłogi ~0.2m na belce)
        if (levelType === 'twoStory') levels.push(2.5); // I piętro na 2.5m
        if (levelType === 'threeStory') { levels.push(2.5); levels.push(5.0); } // II piętro na 5.0m

        const topFloorH = levels[levels.length - 1]; // Wysokość najwyższej podłogi

        // Moduł siatki Layher
        const modX = 2.07;
        const modZ = 2.07;
        const cols = Math.round(w / modX);
        const rows = Math.round(d / modZ);
        
        const realW = cols * modX;
        const realD = rows * modZ;
        const startX = -realW / 2;
        const startZ = -realD / 2;

        this.group.position.set(0, 0, dist);

        // ==========================================
        // 1. STRUKTURA NOŚNA (Słupy, Rygle, Podłogi)
        // ==========================================
        
        // Słupy (Vertical Standards)
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                const x = startX + i * modX;
                const z = startZ + j * modZ;
                
                // Czy to słup narożny? (potrzebny do dachu)
                const isCornerFront = (j === rows) && (i === 0 || i === cols); // Przód (Z max)
                const isCornerBack = (j === 0) && (i === 0 || i === cols); // Tył (Z min) -- UWAGA: w buildLayherSystem Z rośnie do tyłu? 
                // Sprawdźmy konwencję: zazwyczaj Z+ to przód (kierunek kamery), Z- tył.
                // W LayherRoof.js: frontZ (wysoki) > backZ (niski).
                // Przyjmijmy tutaj: Z=startZ (tył), Z=startZ+realD (przód - strona sceny).
                
                // Wysokość słupa:
                // Musi sięgać do dachu jeśli narożny, lub do barierki najwyższego piętra jeśli wewnętrzny.
                
                // Dach: Przód (przy scenie) = TopFloor + 3.0m
                // Tył = TopFloor + 2.0m (spadek 1m)
                
                let targetH = topFloorH + 1.2; // Domyślnie barierka na górze
                
                // Jeśli narożny - idzie do dachu
                // Uwaga: FOH stoi przodem do sceny. Scena jest w Z=0. FOH w Z=20.
                // Czyli "przód" FOHa (okno) to strona Z min (skierowana do 0). "Tył" FOHa (wejście) to Z max.
                // Czekaj, standardowo scena jest w 0,0,0. FOH w 0,0,20. Kamera patrzy z 30,20,40.
                // "Przód FOH" to ściana od strony sceny (czyli Z lokalne min, globalne mniejsze).
                
                // Poprawka logiki dachu zgodnie z życzeniem: "z przodu 3m a z tylu 2m".
                // Przód FOH (patrzący na scenę) to Z = startZ.
                // Tył FOH to Z = startZ + realD.
                
                let roofH = 0;
                if (j === 0) roofH = topFloorH + 3.0; // Przód (strona sceny)
                if (j === rows) roofH = topFloorH + 2.0; // Tył
                
                // Jeśli to skrajny słup w rzędzie (lewa/prawa krawędź), też musi trzymać dach (płatwie)
                if (i === 0 || i === cols) {
                    // Interpolacja wysokości dachu dla słupów bocznych pośrednich (jeśli depth > 2.07)
                    const ratio = j / rows; // 0 (przód) -> 1 (tył)
                    // Przód 3m, Tył 2m -> Spadek
                    const hAtPos = 3.0 - (1.0 * ratio); 
                    targetH = topFloorH + hAtPos;
                } else {
                    // Słupy środkowe (wewnątrz FOHa)
                    // Kończą się na barierce najwyższego piętra lub podpierają podłogę
                    targetH = topFloorH + 1.2; // Barierka
                }

                this._buildColumnStack(x, z, targetH);
            }
        }

        // Podłogi i Rygle na każdym poziomie
        levels.forEach((lvlH, index) => {
            const isTop = index === levels.length - 1;
            this._buildFloorLevel(cols, rows, modX, modZ, startX, startZ, lvlH, isTop);
        });

        // ==========================================
        // 2. DACH (O-Dźwigary + Krokwie)
        // ==========================================
        this._buildRoof(realW, realD, topFloorH, startX, startZ);

        // ==========================================
        // 3. SIATKI (Scrims)
        // ==========================================
        if (config.scrim !== false) {
            // Od ziemi (0) do dachu
            // Tylko Tył i Boki. Przód otwarty (okno).
            this._buildScrims(realW, realD, topFloorH, startX, startZ);
        }

        // ==========================================
        // 4. BALAST (Mausery na konstrukcji)
        // ==========================================
        // Pozycje balastu: za FOHem lub po bokach.
        // Zazwyczaj po bokach z tyłu.
        this._buildMauserStructure(-realW/2 - 1.5, startZ + realD - 1.0); // Lewy tył
        this._buildMauserStructure(realW/2 + 1.5, startZ + realD - 1.0);  // Prawy tył
    }

    _buildColumnStack(x, z, totalH) {
        const node = new THREE.Group();
        node.position.set(x, 0, z);

        // Podkład
        const pad = new AntiSlipWoodPad();
        node.add(pad.group);

        // Stopa (Jack) - minimalne wykręcenie, bo FOH stoi na równym
        const jack = new BaseJacks('60a', 0.10);
        jack.group.position.y = 0.045; // Grubość podkładu
        node.add(jack.group);

        // Element początkowy
        const collar = new BaseCollarNormal();
        collar.group.position.y = 0.145;
        node.add(collar.group);

        // Stojaki (modułowe)
        let currentH = 0.385; // 0.045 + 0.10 + 0.24
        let remaining = totalH; // Uproszczenie: budujemy od dołu do totalH

        // Algorytm doboru stojaków: 4m, 3m, 2m...
        const stds = [4.0, 3.0, 2.0, 1.5, 1.0, 0.5];
        
        // Jeśli wysokość jest np. 5.5m (2piętra + dach), trzeba łączyć.
        // Dla uproszczenia w 3D dajemy jedną rurę (wizualizacja), 
        // ale używając klasy VerticalStandardsLW z najbliższą długością
        // lub pętla. Zróbmy pętlę dla realizmu złącz.
        
        while(remaining > 0.2) {
            let seg = 2.0;
            if (remaining >= 4.0) seg = 4.0;
            else if (remaining >= 3.0) seg = 3.0;
            else if (remaining >= 2.0) seg = 2.0;
            else seg = remaining; // Ostatni kawałek (może być niestandardowy w wizualizacji)

            const std = new VerticalStandardsLW(seg, 'withSpigot');
            std.group.position.y = currentH;
            node.add(std.group);
            
            currentH += seg;
            remaining -= seg;
        }

        this.group.add(node);
    }

    _buildFloorLevel(cols, rows, modX, modZ, startX, startZ, y, isTop) {
        // 1. Rygle Nośne (U-Ledgers) - Kierunek Przód-Tył (Z)
        // User: "urygle od przodu do tylu"
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = startX + i * modX;
                const z = startZ + j * modZ + modZ/2; // Środek pola Z
                
                // Używamy wzmocnionych U-rygli (kratowych) dla FOH? 
                // "U-rygiel podwójny" był przy mauserach. Tu zwykłe U-rygle stalowe.
                const uLedger = new ULedgers(modZ, 'lwT14'); 
                uLedger.group.rotation.y = Math.PI/2; // Obrót na Z
                uLedger.group.position.set(x, y, z);
                this.group.add(uLedger.group);
            }
        }

        // 2. Rygle Stężające (O-Ledgers) - Kierunek Lewo-Prawo (X)
        // Spinają konstrukcję
        for (let j = 0; j <= rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = startX + i * modX + modX/2;
                const z = startZ + j * modZ;
                
                const oLedger = new HorizontalLedgersLW(modX, modX);
                oLedger.group.position.set(x, y, z);
                this.group.add(oLedger.group);
            }
        }

        // 3. Podesty (Decks) - Kierunek Lewo-Prawo (X)
        // User: "podesty od lewej do prowej"
        // Skoro U-rygle są w Z, to podesty muszą leżeć w X (opierać się hakami na ryglach Z). Zgadza się.
        for (let i = 0; i < rows; i++) { // Iterujemy po polach Z (rzędy)
            for (let j = 0; j < cols; j++) { // Iterujemy po polach X (kolumny)
                // Pole ma wymiar modX (2.07) na modZ (2.07).
                // Podesty układamy wzdłuż X.
                // 2 podesty 1.04m wypełniają 2.07m.
                
                const bayZ = startZ + i * modZ + modZ/2;
                const bayXStart = startX + j * modX;

                // Podest 1 (Tył pola)
                const d1 = new Decks(modX, 1.04, 'eventT16'); // Dł 2.07, Szer 1.04 (katalogowo)
                // Decks domyślnie wzdłuż X.
                // Pozycja Z lekko przesunięta
                d1.group.position.set(bayXStart + modX/2, y, bayZ - 0.52);
                this.group.add(d1.group);

                // Podest 2 (Przód pola)
                const d2 = new Decks(modX, 1.04, 'eventT16');
                d2.group.position.set(bayXStart + modX/2, y, bayZ + 0.52);
                this.group.add(d2.group);
            }
        }

        // 4. Barierki (tylko na isTop, chyba że klatka schodowa wewnątrz)
        if (isTop) {
            this._buildRailings(cols, rows, modX, modZ, startX, startZ, y);
        }
    }

    _buildRailings(cols, rows, modX, modZ, startX, startZ, y) {
        // Przód (Z min) - Podwójne (0.5, 1.0) - OKNO
        for (let i = 0; i < cols; i++) {
            const x = startX + i*modX + modX/2;
            const z = startZ; 
            [0.5, 1.0].forEach(h => {
                const rail = new HorizontalLedgersLW(modX, modX);
                rail.group.position.set(x, y+h, z);
                this.group.add(rail.group);
            });
        }

        // Tył (Z max) - Potrójne (0.5, 1.0, 1.5)
        const zBack = startZ + rows * modZ;
        for (let i = 0; i < cols; i++) {
            const x = startX + i*modX + modX/2;
            [0.5, 1.0, 1.5].forEach(h => {
                const rail = new HorizontalLedgersLW(modX, modX);
                rail.group.position.set(x, y+h, zBack);
                this.group.add(rail.group);
            });
        }

        // Boki (X min i X max) - Potrójne
        for (let j = 0; j < rows; j++) {
            const z = startZ + j*modZ + modZ/2;
            
            // Lewy
            [0.5, 1.0, 1.5].forEach(h => {
                const rail = new HorizontalLedgersLW(modZ, modZ);
                rail.group.rotation.y = Math.PI/2;
                rail.group.position.set(startX, y+h, z);
                this.group.add(rail.group);
            });

            // Prawy
            const xRight = startX + cols * modX;
            [0.5, 1.0, 1.5].forEach(h => {
                const rail = new HorizontalLedgersLW(modZ, modZ);
                rail.group.rotation.y = Math.PI/2;
                rail.group.position.set(xRight, y+h, z);
                this.group.add(rail.group);
            });
        }
    }

    _buildRoof(realW, realD, floorY, startX, startZ) {
        // Wysokości względem podłogi: Przód +3.0m, Tył +2.0m
        // Przód FOH (patrzący na scenę) to startZ.
        const frontH = 3.0;
        const backH = 2.0; // Spadek 1m

        // 1. O-Dźwigary (Lattice Girders) na bokach i środku wzdłuż osi Z (spadek)
        // Ale Layher Lattice Girder jest prosty. Spadek robi się rurkami lub pochyłym montażem.
        // User: "o dzwigary sa polaczone krokwiami z ktore sa rurkami...".
        // Zazwyczaj O-dźwigary idą na Przodzie i Tyle (poziomo), a rurki (krokwie) łączą je ze spadkiem.
        // Przyjmijmy:
        // Dźwigar przód (na wys 3m)
        const beamFront = this.consolesFactory.createULatticeGirderAlu(realW); // Lub O-Dźwigar
        // Pozycja dźwigara: środek
        beamFront.position.set(0, floorY + frontH, startZ);
        this.group.add(beamFront);

        // Dźwigar tył (na wys 2m)
        const beamBack = this.consolesFactory.createULatticeGirderAlu(realW);
        beamBack.position.set(0, floorY + backH, startZ + realD);
        this.group.add(beamBack);

        // 2. Krokwie (Rurki Alu) - co 25-30cm
        const spacing = 0.30;
        const count = Math.ceil(realW / spacing);
        const exactSpacing = realW / count;

        const slopeLen = Math.sqrt(realD*realD + 1.0*1.0); // 1.0m to różnica wysokości
        const angle = Math.atan2(1.0, realD); // Kąt spadku

        const rPipe = 0.024;

        for(let k=0; k<=count; k++) {
            const x = startX + k * exactSpacing;
            
            // Rurka od Front(top) do Back(top)
            // Współrzędne lokalne rurki
            const tube = new THREE.Mesh(
                new THREE.CylinderGeometry(rPipe, rPipe, slopeLen, 8),
                this.lpBase.matAlu
            );
            
            // Środek rurki
            const midY = floorY + (frontH + backH) / 2;
            const midZ = startZ + realD / 2;
            
            tube.position.set(x, midY + 0.25, midZ); // +0.25 bo leży NA dźwigarze (wys 0.5)
            tube.rotation.x = -angle; // Pochylenie w dół ku tyłowi (Z rośnie)
            
            this.group.add(tube);
        }

        // 3. Plandeka
        this._buildCanopy(realW, realD, floorY, frontH, backH, startZ);
    }

    _buildCanopy(w, d, y, hFront, hBack, zFront) {
        const shape = new THREE.Shape();
        shape.moveTo(0, hFront); // Przód góra
        shape.lineTo(d, hBack);  // Tył dół
        
        // Extrude wzdłuż X (szerokość)
        const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled:false });
        // Domyślnie extrude w Z. Obracamy geometrycznie.
        geo.rotateY(Math.PI/2);
        
        const mesh = new THREE.Mesh(geo, this.matRoofCanvas);
        mesh.position.set(-w/2, y + 0.27, zFront); // +0.27 nad rurki
        this.group.add(mesh);

        // Falbany (0.5m w dół)
        // ... (uproszczony box dookoła dachu)
        const valanceGeo = new THREE.BoxGeometry(w + 0.1, 0.5, d + 0.1);
        const valance = new THREE.Mesh(valanceGeo, this.matRoofCanvas);
        const midH = (hFront + hBack)/2;
        valance.position.set(0, y + midH, zFront + d/2);
        this.group.add(valance);
    }

    _buildScrims(w, d, topY, startX, startZ) {
        // Siatki od Y=0 do dachu (Tył i Boki)
        const roofBackH = topY + 2.0; // Wysokość dachu z tyłu
        
        // Tył
        const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(w, roofBackH), this.matScrim);
        backPlane.position.set(0, roofBackH/2, startZ + d);
        this.group.add(backPlane);

        // Boki (Trapezy) - Przód 3m+TopY, Tył 2m+TopY
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(d, 0);
        shape.lineTo(d, roofBackH);
        shape.lineTo(0, topY + 3.0);
        shape.closePath();
        
        const sideGeo = new THREE.ShapeGeometry(shape);
        
        const left = new THREE.Mesh(sideGeo, this.matScrim);
        left.rotation.y = -Math.PI/2;
        left.position.set(startX, 0, startZ);
        this.group.add(left);

        const right = new THREE.Mesh(sideGeo, this.matScrim);
        right.rotation.y = -Math.PI/2;
        right.position.set(startX + w, 0, startZ);
        this.group.add(right);
    }

    // ==========================================
    // 5. KONSTRUKCJA POD MAUSERA
    // ==========================================
    _buildMauserStructure(x, z) {
        const grp = new THREE.Group();
        grp.position.set(x, 0, z);

        const w = 2.07;
        const d = 2.07;
        
        // 4 Stojaki 0.5m
        const corners = [[-w/2, -d/2], [w/2, -d/2], [-w/2, d/2], [w/2, d/2]];
        corners.forEach(pos => {
            const jack = new BaseJacks('60a', 0.1);
            jack.group.position.set(pos[0], 0.05, pos[1]);
            grp.add(jack.group);

            const std = new VerticalStandardsLW(0.5, 'withoutSpigot');
            std.group.position.set(pos[0], 0.15 + 0.24, pos[1]); // nad collarem
            grp.add(std.group);
        });

        // Rygle
        // "na kazda klatke idzie 2 urygiel podwojny 2.07" -> Przyjmijmy U-Dźwigar 2.07 na bokach (Z)
        const h = 0.5 + 0.2; // Wysokość ryglowania
        
        const trussL = this.consolesFactory.createULatticeGirderLW(2.07);
        trussL.rotation.y = Math.PI/2;
        trussL.position.set(-w/2, h, 0);
        grp.add(trussL);

        const trussR = this.consolesFactory.createULatticeGirderLW(2.07);
        trussR.rotation.y = Math.PI/2;
        trussR.position.set(w/2, h, 0);
        grp.add(trussR);

        // "i trzy trawersy na u 2.07" -> U-rygle poprzeczne (X)
        // 3 sztuki: przód, środek, tył
        [-d/2, 0, d/2].forEach(posZ => {
            const u = new ULedgers(2.07, 'lwT14');
            u.group.position.set(0, h + 0.25, posZ); // Na górnym pasie dźwigara
            grp.add(u.group);
        });

        // Mauser na górze
        const tank = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.2), this.matTank);
        tank.position.set(0, h + 0.8, 0);
        grp.add(tank);

        // Pasy
        const strap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.1), this.matStrap);
        strap.position.set(0, h + 1.35, 0);
        grp.add(strap);

        this.group.add(grp);
    }
}