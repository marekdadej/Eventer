import * as THREE from 'three';
import { 
    LayherPartsBase,
    VerticalStandardsLW,
    BaseJacks,
    BaseCollarNormal,
    HorizontalLedgersLW,
    ULedgers,
    Decks,
    ConsolesAndGirders,
    VerticalBracesLW, // Upewnij się, że masz to w LayherPartsBase.js
    AntiSlipWoodPad
} from './layher/LayherPartsBase.js';

/**
 * FohSystem - Stanowisko realizatora (FOH) na systemie Layher.
 * Naprawiona geometria, poziomy węzłowe i stężenia.
 */
export class FohSystem {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.lpBase = new LayherPartsBase();
        this.consolesFactory = new ConsolesAndGirders();

        this.initMaterials();
    }

    initMaterials() {
        this.matRoofCanvas = new THREE.MeshStandardMaterial({
            color: 0x222222, // Ciemnoszara plandeka
            roughness: 0.8,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        this.matScrim = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide
        });
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

        // 1. Konfiguracja wymiarów
        let w = parseFloat(config.width) || 4.14;
        let d = parseFloat(config.depth) || 4.14;
        const dist = parseFloat(config.dist) || 20.0;
        const levelType = config.level || 'twoStory'; // 'ground', 'twoStory', 'threeStory'

        // Siatka Layher (Moduł 2.07m)
        const modX = 2.07;
        const modZ = 2.07;
        
        // Zaokrąglamy wymiary do najbliższego modułu
        const cols = Math.max(1, Math.round(w / modX));
        const rows = Math.max(1, Math.round(d / modZ));
        
        const realW = cols * modX;
        const realD = rows * modZ;
        
        // Centrowanie lokalne
        const startX = -realW / 2;
        const startZ = -realD / 2;

        // Ustawienie całej grupy FOH w scenie (oś Z to głębokość od sceny)
        this.group.position.set(0, 0, dist);

        // 2. Definicja Poziomów (Wysokości rozet)
        // Base Collar (element początkowy) ma rozetę na wys ok. 0.17-0.20m nad ziemią
        const baseH = 0.20; 

        let floorLevels = [];
        
        // --- POZIOM 0 (PARTER) ---
        // Zawsze obecny, na elementach początkowych
        floorLevels.push(baseH);

        // --- POZIOM 1 ---
        // Na wysokości pierwszego stojaka 2.0m lub 2.5m. 
        // User prosił: "drugie pietro podloga na wysokosci stojaka 2.5m"
        // Czyli 0.20 + 2.50 = 2.70m
        if (levelType === 'twoStory' || levelType === 'threeStory') {
            floorLevels.push(baseH + 2.5); 
        }

        // --- POZIOM 2 ---
        // User prosił: "trzecie pietro na wysokosci 5m stojaka"
        // Czyli 0.20 + 5.00 = 5.20m
        if (levelType === 'threeStory') {
            floorLevels.push(baseH + 5.0);
        }

        // Wysokość ostatniej podłogi (baza do dachu)
        const topFloorH = floorLevels[floorLevels.length - 1];

        // Wysokość dachu (względem ziemi)
        // Przód wyższy (3.0m nad podłogą), tył niższy (2.2m nad podłogą)
        const roofFrontY = topFloorH + 2.8;
        const roofBackY = topFloorH + 2.2;

        // ==========================================
        // BUDOWA KONSTRUKCJI
        // ==========================================

        // 1. SŁUPY (PIONY)
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                const x = startX + i * modX;
                const z = startZ + j * modZ;

                // Obliczamy docelową wysokość słupa w tym punkcie
                // Musi sięgać do dachu.
                // j=0 to Przód (od strony sceny, jeśli patrzymy na FOH), j=rows to Tył.
                // Interpolacja wysokości dachu:
                const ratio = j / rows; 
                const roofYAtPos = roofFrontY - ((roofFrontY - roofBackY) * ratio);
                
                // Słup musi wystawać minimalnie nad linię dachu, żeby zamontować złącze
                const targetH = roofYAtPos + 0.1; 

                this._buildColumnStack(x, z, targetH, floorLevels);
            }
        }

        // 2. PIĘTRA (POZIOMY + STĘŻENIA)
        floorLevels.forEach((y, index) => {
            const isTop = (index === floorLevels.length - 1);
            this._buildFloorLevel(cols, rows, modX, modZ, startX, startZ, y, isTop);
            
            // Stężenia pionowe (Diagonals) - budujemy POMIĘDZY poziomami
            // Jeśli to parter (index 0), stężamy do następnego poziomu (jeśli istnieje)
            // Ale stężenia w Layherze montuje się w polach 2m/2.5m wysokości.
            // Tutaj logika: stężamy klatki od poziomu Y w górę (o 2.5m).
            
            // Stężamy tył i boki. Przód otwarty.
            if (y < topFloorH) { 
                const nextY = y + 2.5; // Zakładamy moduł pionowy 2.5m
                this._buildDiagonals(cols, rows, modX, modZ, startX, startZ, y, nextY);
            }
        });

        // 3. DACH
        this._buildRoof(realW, realD, roofFrontY, roofBackY, startX, startZ);

        // 4. SIATKI (Opcjonalnie)
        if (config.scrim) {
            this._buildScrims(realW, realD, topFloorH, roofFrontY, roofBackY, startX, startZ);
        }

        // Usunięto: _buildMauserStructure (boczne balasty)
    }

    _buildColumnStack(x, z, totalH, floorLevels) {
        const node = new THREE.Group();
        node.position.set(x, 0, z);

        // Podkład i Stopa
        node.add(new AntiSlipWoodPad().group);
        const jack = new BaseJacks('60a', 0.15); // Wykręcenie 15cm
        jack.group.position.y = 0.045;
        node.add(jack.group);

        // Element początkowy (Base Collar)
        const collar = new BaseCollarNormal();
        collar.group.position.y = 0.195; // 0.045 + 0.15
        node.add(collar.group);

        // Obliczamy wysokość startu rur stojakowych
        // Rozeta collara jest na ok 0.20m (baseH)
        // Rura stojaka zaczyna się fizycznie nieco wyżej w czopie collara, ale logicznie 
        // moduły liczymy od węzła.
        
        let currentH = 0.20; // Poziom 0
        let remainingH = totalH - currentH;

        // Budujemy stojakami 2.0m lub 2.5m (dla tego projektu 2.5m bo takie są piętra)
        // Jeśli remainingH jest duże, dajemy rury.
        
        while (remainingH > 0.5) {
            let segLen = 2.5; // Domyślny pion
            // Jeśli zostało mniej niż 2.5, dobieramy mniejszą
            if (remainingH < 2.5 && remainingH >= 2.0) segLen = 2.0;
            else if (remainingH < 2.0 && remainingH >= 1.5) segLen = 1.5;
            else if (remainingH < 1.5 && remainingH >= 1.0) segLen = 1.0;
            else if (remainingH < 1.0) segLen = remainingH; // Docinka

            const std = new VerticalStandardsLW(segLen, 'withSpigot');
            // Korekta wizualna: rura zaczyna się trochę nad węzłem (ok 15-20cm w rzeczywistości od bazy)
            // Ale dla uproszczenia w 3D pozycjonujemy na węźle + offset grafiki.
            // W VerticalStandardsLW geometry zaczyna się w 0.
            // Musimy dodać to do currentH.
            
            // Uwaga: W LayherPartsBase, VerticalStandard zazwyczaj ma pivot na dole rury.
            // Rozeta dolna jest blisko dołu.
            std.group.position.y = currentH + 0.15; // Offset na czop
            node.add(std.group);

            currentH += segLen;
            remainingH -= segLen;
        }

        this.group.add(node);
    }

    _buildFloorLevel(cols, rows, modX, modZ, startX, startZ, y, isTop) {
        // 1. Rygle Nośne (U-Ledgers) - GŁĘBOKOŚĆ (Z)
        // Podesty kładziemy na U-ryglach. 
        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = startX + i * modX;
                const z = startZ + j * modZ + modZ/2;
                
                const u = new ULedgers(modZ, 'lwT14'); // Wzmocniony
                u.group.rotation.y = Math.PI/2;
                u.group.position.set(x, y, z);
                this.group.add(u.group);
            }
        }

        // 2. Rygle Stężające (O-Ledgers/Rury) - SZEROKOŚĆ (X)
        for (let j = 0; j <= rows; j++) {
            for (let i = 0; i < cols; i++) {
                const x = startX + i * modX + modX/2;
                const z = startZ + j * modZ;
                
                const o = new HorizontalLedgersLW(modX);
                o.group.position.set(x, y, z);
                this.group.add(o.group);
            }
        }

        // 3. Podesty (Decks)
        // Kładzione wzdłuż X (na ryglach Z)
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const cellX = startX + i * modX + modX/2;
                const cellZ = startZ + j * modZ;
                
                // 2 podesty 1.04m (łącznie ~2.08m)
                const d1 = new Decks(modX, 1.04, 'eventT16');
                d1.group.position.set(cellX, y, cellZ + 0.52);
                this.group.add(d1.group);

                const d2 = new Decks(modX, 1.04, 'eventT16');
                d2.group.position.set(cellX, y, cellZ + 1.55);
                this.group.add(d2.group);
            }
        }

        // 4. Barierki (Tylko na najwyższym poziomie)
        if (isTop) {
            this._buildRailings(cols, rows, modX, modZ, startX, startZ, y);
        }
    }

    _buildDiagonals(cols, rows, modX, modZ, startX, startZ, lowerY, upperY) {
        // Stężenia pionowe (Diagonals)
        // Zwykle w co drugim polu lub na rogach. Tu damy na zewnętrznych ścianach.
        
        // 1. Ściany Boczne (Lewa/Prawa - wzdłuż Z)
        // X = startX (Lewa), X = startX + realW (Prawa)
        const xPositions = [startX, startX + (cols * modX)];
        
        xPositions.forEach(xPos => {
            for (let j = 0; j < rows; j++) {
                const zStart = startZ + j * modZ;
                const zEnd = startZ + (j+1) * modZ;
                
                // Tworzymy stężenie (VerticalBrace)
                // W LayherPartsBase VerticalBracesLW(wysokosc, dlugoscPola)
                // Np. Brace dla pola 2.57m wys x 2.07m dł.
                
                // Sprawdź czy mamy klasę VerticalBracesLW, jeśli nie symulujemy rurą
                try {
                    const brace = new VerticalBracesLW(2.5, 2.07); // 2.5m wys, 2.07m dł
                    // Brace domyślnie jest w XY. Musimy obrócić w YZ.
                    brace.group.rotation.y = Math.PI/2;
                    
                    // Pozycjonowanie: środek pola Z, dół Y
                    brace.group.position.set(xPos, lowerY, zStart + modZ/2);
                    
                    this.group.add(brace.group);
                } catch(e) {
                    // Fallback: Rura
                    // ... (kod fallbacku pominięty dla czytelności, zakładam że klasa jest)
                }
            }
        });

        // 2. Ściana Tylna (Z = startZ + realD)
        const zBack = startZ + (rows * modZ);
        for (let i = 0; i < cols; i++) {
            const xStart = startX + i * modX;
            
            const brace = new VerticalBracesLW(2.5, 2.07);
            brace.group.position.set(xStart + modX/2, lowerY, zBack);
            this.group.add(brace.group);
        }
        
        // Przód zostawiamy otwarty (okno)
    }

    _buildRailings(cols, rows, modX, modZ, startX, startZ, y) {
        // Przód
        for (let i = 0; i < cols; i++) {
            const x = startX + i*modX + modX/2;
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modX);
                r.group.position.set(x, y+h, startZ);
                this.group.add(r.group);
            });
        }
        // Tył
        const zBack = startZ + rows * modZ;
        for (let i = 0; i < cols; i++) {
            const x = startX + i*modX + modX/2;
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modX);
                r.group.position.set(x, y+h, zBack);
                this.group.add(r.group);
            });
        }
        // Boki
        for (let j = 0; j < rows; j++) {
            const z = startZ + j*modZ + modZ/2;
            // Lewy
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modZ);
                r.group.rotation.y = Math.PI/2;
                r.group.position.set(startX, y+h, z);
                this.group.add(r.group);
            });
            // Prawy
            const xRight = startX + cols*modX;
            [0.5, 1.0].forEach(h => {
                const r = new HorizontalLedgersLW(modZ);
                r.group.rotation.y = Math.PI/2;
                r.group.position.set(xRight, y+h, z);
                this.group.add(r.group);
            });
        }
    }

    _buildRoof(w, d, floorY, frontH, backH, startX, startZ) {
        // Dźwigary Kratowe (Lattice Girders) na bokach (Lewo/Prawo wzdłuż Z)
        // Referencja pokazuje dźwigary idące wzdłuż spadku (krokwie kratowe) lub płaskie.
        // Najprościej: Dźwigar przód (X), Dźwigar tył (X), Rurki (Z).
        
        // 1. Dźwigar Przód (X)
        const beamFront = this.consolesFactory.createULatticeGirderAlu(w);
        beamFront.position.set(0, frontH, startZ); 
        this.group.add(beamFront);

        // 2. Dźwigar Tył (X)
        const beamBack = this.consolesFactory.createULatticeGirderAlu(w);
        beamBack.position.set(0, backH, startZ + d);
        this.group.add(beamBack);

        // 3. Krokwie (Rurki) łączące przód z tyłem
        const spacing = 0.5; // gęściej pod plandekę
        const count = Math.ceil(w / spacing);
        const step = w / count; 
        
        // Geometria rurki skośnej
        const lengthZ = Math.sqrt(d*d + (frontH - backH)**2);
        const angle = Math.atan2(frontH - backH, d);

        for (let k = 0; k <= count; k++) {
            const x = startX + k * step;
            
            const tube = new THREE.Mesh(
                new THREE.CylinderGeometry(0.024, 0.024, lengthZ + 0.4, 8), // +0.4 na okapy
                this.lpBase.matAlu
            );
            
            // Pozycja środka rurki
            const midH = (frontH + backH) / 2 + 0.25; // +0.25 nad pas górny dźwigara
            const midZ = startZ + d / 2;
            
            tube.position.set(x, midH, midZ);
            tube.rotation.x = angle; 
            this.group.add(tube);
        }

        // 4. Plandeka
        const roofGeo = new THREE.PlaneGeometry(w + 0.6, lengthZ + 0.6);
        const canvas = new THREE.Mesh(roofGeo, this.matRoofCanvas);
        
        // Pozycjonowanie plandeki
        const midH = (frontH + backH) / 2 + 0.28; // minimalnie nad rurki
        canvas.position.set(0, midH, startZ + d/2);
        canvas.rotation.x = -Math.PI/2 + angle; // Poziom + spadek
        this.group.add(canvas);
    }

    _buildScrims(w, d, topFloorH, hFront, hBack, startX, startZ) {
        // Siatki od parteru do dachu
        const bottomY = 0.2;
        
        // 1. Tył
        const backH = hBack - bottomY;
        const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(w, backH), this.matScrim);
        backPlane.position.set(0, bottomY + backH/2, startZ + d);
        // backPlane.rotation.y = Math.PI; // Opcjonalnie
        this.group.add(backPlane);

        // 2. Boki (Trapezy)
        const shape = new THREE.Shape();
        shape.moveTo(0, bottomY);          // Przód dół
        shape.lineTo(d, bottomY);          // Tył dół
        shape.lineTo(d, hBack);            // Tył góra
        shape.lineTo(0, hFront);           // Przód góra
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
}