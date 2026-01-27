import * as THREE from 'three';
import { ProlyteParts } from './ProlyteParts.js';

export class MPTStandard {
    constructor(scene) {
        this.scene = scene;
        // Importujemy części (to zakłada, że ProlyteParts.js jest w tym samym folderze)
        this.parts = new ProlyteParts();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        // MATERIAŁY
        // Szara plandeka (PVC)
        this.matCanopy = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            side: THREE.DoubleSide, 
            roughness: 0.6,
            metalness: 0.1
        });
        
        // Czarna siatka (Scrim) - boki i tył
        this.matScrim = new THREE.MeshBasicMaterial({
            color: 0x050505,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            wireframe: false // Można zmienić na true dla efektu siatki
        });
    }

    clear() {
        // Rekurencyjne czyszczenie geometrii, aby zwolnić pamięć
        this.group.traverse(c => { 
            if(c.isMesh) {
                if(c.geometry) c.geometry.dispose();
                // Materiałów nie usuwamy, bo są współdzielone
            }
        });
        this.group.clear();
    }

    build(config) {
        this.clear();
        
        // Wymiary sceny (np. 12x10)
        const W = parseFloat(config.width) || 12.0;
        const D = parseFloat(config.depth) || 10.0;
        
        // Wysokość CLEARANCE (prześwit od ziemi do spodu kraty)
        const clearance = parseFloat(config.roofClearance) || 7.0; 
        
        const showCanopy = config.showCanopy !== false;
        const showScrim = config.prolyteScrim === true;

        // Rozstaw wież (oś wieży jest w narożniku wymiaru W x D)
        const towerX = W / 2;
        const towerZ = D / 2;
        
        // 1. WIEŻE MPT (4 sztuki)
        // Wieże budujemy nieco wyższe niż prześwit, aby wystawały ponad dach (standard MPT)
        const towerHeight = clearance + 2.0; 

        // Lewy Tył
        this._buildTower(-towerX, towerZ, clearance, towerHeight);
        // Prawy Tył
        this._buildTower(towerX, towerZ, clearance, towerHeight);
        // Lewy Przód
        this._buildTower(-towerX, -towerZ, clearance, towerHeight);
        // Prawy Przód
        this._buildTower(towerX, -towerZ, clearance, towerHeight);

        // 2. KONSTRUKCJA DACHU
        // Dach spoczywa na wózkach (Sleeve Blockach), które są na wysokości 'clearance'
        // Sleeve Block ma swoją wysokość (ok. 50-60cm), krata H40V leży na nim lub jest przykręcona do boku.
        // Przyjmijmy, że oś kraty (gridu) jest na poziomie clearance + połowa grubości kraty.
        // Ale "clearance" to zazwyczaj spód.
        // H40V ma 40cm. Więc oś Gridu = clearance + 0.20m.
        
        const gridY = clearance + 0.20;
        
        this._buildRoofStructure(W, D, gridY, showCanopy, showScrim);
    }

    _buildTower(x, z, clearanceH, totalH) {
        const tGrp = new THREE.Group();
        tGrp.position.set(x, 0, z);

        // A. Baza MPT (na ziemi)
        tGrp.add(this.parts.createBase());

        // B. Maszt (od bazy do szczytu)
        // Baza ma ok 0.2m wysokości roboczej.
        let currentY = 0.2;
        const mastTop = totalH; 

        while(currentY < mastTop - 0.5) {
            // Używamy segmentów 1m lub 2m
            let segLen = 2.0;
            if (mastTop - currentY < 2.5) segLen = 1.0; // Końcówka krótsza

            const seg = this.parts.createMast(segLen); // H30V
            seg.rotation.z = Math.PI / 2; // Pionowo
            seg.position.y = currentY + segLen/2;
            tGrp.add(seg);
            currentY += segLen;
        }

        // C. Sleeve Block (Wózek) - ustawiony na wysokości clearance
        // Sleeve Block obejmuje maszt.
        const sleeve = this.parts.createSleeve();
        // Pozycja Y sleeve blocka to jego środek.
        // Jeśli clearance to spód kraty, a krata leży na sleeve...
        // Uproszczenie: Sleeve center = clearance + 0.3
        sleeve.position.y = clearance + 0.3; 
        tGrp.add(sleeve);

        // D. Top Section (Głowica z kółkami)
        const top = this.parts.createTop();
        top.position.y = mastTop;
        tGrp.add(top);

        // E. Opcjonalnie: Wyciągarka / Silnik (nie dodaję, żeby nie komplikować)

        this.group.add(tGrp);
    }

    _buildRoofStructure(W, D, y, showCanopy, showScrim) {
        const roofGrp = new THREE.Group();
        roofGrp.position.y = y;

        // Parametry dachu Prolyte MPT 12x10
        // Konstrukcja: Grid prostokątny + Dach dwuspadowy na wierzchu.
        // Spadek na BOKI (L/R). Kalenica (Ridge) biegnie PRZÓD-TYŁ (oś Z).
        // Cantilever (okap) wystaje z przodu (Z min).

        const trussSize = 0.39; // H40V
        const sleeveSize = 0.55; // Przybliżony wymiar wózka
        
        // Długości belek gridu (pomiędzy wózkami)
        const spanX = W - sleeveSize;
        const spanZ = D - sleeveSize;

        // --- 1. GRID (OBWIEDNIA PŁASKA) ---
        
        // Belki PRZÓD i TYŁ (Oś X)
        const beamFront = this.parts.createMainTruss(spanX); // H40V
        beamFront.position.set(0, 0, -D/2); // Przód (Z ujemne)
        roofGrp.add(beamFront);

        const beamBack = beamFront.clone();
        beamBack.position.set(0, 0, D/2); // Tył (Z dodatnie)
        roofGrp.add(beamBack);

        // Belki LEWA i PRAWA (Oś Z)
        const beamLeft = this.parts.createMainTruss(spanZ);
        beamLeft.rotation.y = Math.PI / 2;
        beamLeft.position.set(-W/2, 0, 0);
        roofGrp.add(beamLeft);

        const beamRight = beamLeft.clone();
        beamRight.position.set(W/2, 0, 0);
        roofGrp.add(beamRight);

        // --- 2. KONSTRUKCJA DWUSPADOWA (PITCHED ROOF) ---
        
        // Kalenica (Ridge) - podniesiona
        // Wysokość kalenicy (Rise) - dla 12m szerokości zazwyczaj ok. 1.5m - 2.0m
        const ridgeRise = 1.8; 
        
        // Słupki podtrzymujące kalenicę (Ridge Supports) na środku przodu i tyłu
        // Stoją na belkach Front i Back gridu.
        const supportFront = this.parts.createRidgeAssembly(ridgeRise);
        supportFront.position.set(0, trussSize/2, -D/2); // Na belce frontowej
        roofGrp.add(supportFront);

        const supportBack = this.parts.createRidgeAssembly(ridgeRise);
        supportBack.position.set(0, trussSize/2, D/2); // Na belce tylnej
        // Obracamy support tył o 180 stopni (jeśli ma asymetryczne elementy)
        supportBack.rotation.y = Math.PI; 
        roofGrp.add(supportBack);

        // Belka Kalenicowa (Ridge Beam) - biegnie od tyłu do przodu
        // + Cantilever (wystaje przed scenę)
        const cantileverLen = 2.0; // Długość okapu
        const ridgeLen = D + cantileverLen; 
        
        const ridgeBeam = this.parts.createMainTruss(ridgeLen); // H40V lub H30V
        ridgeBeam.rotation.y = Math.PI / 2; 
        // Pozycja: Y=wysokość, Z=przesunięcie (środek belki)
        // Belka ma długość D + Cant. Zaczyna się w D/2 (tył). 
        // Środek geometrii jest w 0. Musimy przesunąć.
        // Tył belki: Z = D/2. Przód belki: Z = -D/2 - Cantilever.
        // Środek = (D/2 + (-D/2 - Cant)) / 2 = -Cant/2.
        ridgeBeam.position.set(0, ridgeRise + trussSize, -cantileverLen/2);
        roofGrp.add(ridgeBeam);

        // --- 3. KROKWIE (RAFTERS) ---
        // Łączą kalenicę z bokami. Spadają na lewo i prawo.
        // Ilość par krokwi: Tył, Środek (opcja), Przód gridu, Koniec Cantilevera.
        // Zróbmy 4 pary: Tył (0), 1/3, 2/3 (Przód gridu), Cantilever.
        
        const halfSpan = W / 2;
        // Kąt nachylenia dachu
        const roofAngle = Math.atan2(ridgeRise, halfSpan);
        // Długość krokwi (przeciwprostokątna)
        const rafterLen = Math.sqrt(halfSpan*halfSpan + ridgeRise*ridgeRise);

        // Pozycje Z dla krokwi
        const rafterPositions = [
            D/2,               // Tył
            D/6,               // Środek-tył
            -D/6,              // Środek-przód
            -D/2,              // Linia frontu sceny (Słupy)
            -D/2 - cantileverLen // Koniec cantilevera
        ];

        rafterPositions.forEach(zPos => {
            // Lewa krokiew
            const rafL = this.parts.createRafter(rafterLen); // H30D
            // Ustawienie pozycji i obrotu (skomplikowane w 3D)
            // Środek krokwi jest w połowie drogi między kalenicą a bokiem
            // X = -W/4, Y = ridgeRise/2 + offset
            rafL.position.set(-W/4, ridgeRise/2 + 0.2, zPos);
            rafL.rotation.z = -roofAngle;
            roofGrp.add(rafL);

            // Prawa krokiew
            const rafR = this.parts.createRafter(rafterLen);
            rafR.position.set(W/4, ridgeRise/2 + 0.2, zPos);
            rafR.rotation.z = roofAngle;
            // Obracamy H30D o 180 wokół własnej osi Y, żeby trójkąt był dobrze skierowany (wierzchołkiem w górę/dół)
            rafR.rotation.y = Math.PI; 
            // Korekta rotacji Z po obrocie Y
            rafR.rotation.z = roofAngle; 
            roofGrp.add(rafR);
        });

        // --- 4. RURKI STĘŻAJĄCE (Tension bars) ---
        // Łączą końce cantilevera z rogami wież
        this._addTensionGear(roofGrp, W, D, cantileverLen, ridgeRise);

        // --- 5. PLANDEKA (CANOPY) ---
        if (showCanopy) {
            this._createGabledCanopy(roofGrp, W, D, cantileverLen, ridgeRise);
        }

        // --- 6. SIATKI (SCRIM) ---
        if (showScrim) {
            this._createScrims(roofGrp, W, D, clearance + ridgeRise);
        }

        this.group.add(roofGrp);
    }

    _addTensionGear(group, W, D, cant, rise) {
        // Wizualizacja linek stalowych od szczytu dachu (przód) do rogów gridu
        const topPoint = new THREE.Vector3(0, rise + 0.4, -D/2 - cant); // Koniec kalenicy
        const cornerL = new THREE.Vector3(-W/2, 0, -D/2);
        const cornerR = new THREE.Vector3(W/2, 0, -D/2);

        const matSteel = new THREE.MeshBasicMaterial({color: 0x333333});

        [cornerL, cornerR].forEach(corner => {
            const dist = topPoint.distanceTo(corner);
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, dist), matSteel);
            tube.position.copy(topPoint).lerp(corner, 0.5);
            tube.lookAt(corner);
            tube.rotateX(Math.PI/2);
            group.add(tube);
        });
    }

    _createGabledCanopy(group, W, D, cant, rise) {
        // Tworzymy kształt dachu (profil)
        // Wymiary z lekkim nadmiarem (overhang)
        const overhang = 0.4;
        const widthHalf = W/2 + overhang;
        
        // Punkty profilu (przód/tył)
        const shape = new THREE.Shape();
        shape.moveTo(-widthHalf, 0);       // Lewy dół
        shape.lineTo(0, rise + 0.25);      // Szczyt (nad kalenicą)
        shape.lineTo(widthHalf, 0);        // Prawy dół
        
        // Extrude (Wyciągnięcie) wzdłuż osi Z
        // Głębokość = D + Cantilever + overhang
        const depthTotal = D + cant + 0.2;
        
        const geo = new THREE.ExtrudeGeometry(shape, {
            steps: 1,
            depth: depthTotal,
            bevelEnabled: false
        });

        // Centrowanie geometrii
        // Domyślnie extrude idzie od Z=0 do Z=depth.
        // My chcemy od Z = D/2 (tył) do Z = -D/2 - Cant (przód)
        // Czyli musimy przesunąć o:
        // Start: D/2. Kierunek: -Z (musimy obrócić albo dać ujemny depth? Extrude zawsze idzie w +Z lokalnie)
        
        // Obróćmy geometrię o 180 st w Y, wtedy pójdzie w -Z.
        geo.rotateY(Math.PI);
        // Teraz startuje od 0 i idzie w -Z.
        // Przesuwamy start na D/2 + 0.1 (lekki tył)
        geo.translate(0, 0, D/2 + 0.1);

        const mesh = new THREE.Mesh(geo, this.matCanopy);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
    }

    _createScrims(group, W, D, totalH) {
        // Scrims (Siatki) wiszą zazwyczaj z tyłu i po bokach
        // Wysokość siatki = od gridu w dół.
        const scrimH = 6.0; // Przykładowa wysokość
        
        // TYŁ
        const planeBack = new THREE.PlaneGeometry(W, scrimH);
        const meshBack = new THREE.Mesh(planeBack, this.matScrim);
        meshBack.position.set(0, -scrimH/2, D/2);
        group.add(meshBack);

        // BOKI (częściowe, np. 2/3 głębokości)
        const sideLen = D * 0.7;
        const planeSide = new THREE.PlaneGeometry(sideLen, scrimH);
        
        // Lewy
        const meshL = new THREE.Mesh(planeSide, this.matScrim);
        meshL.rotation.y = Math.PI / 2;
        // Środek boku: Z = od tyłu (D/2) w stronę przodu.
        // D/2 - sideLen/2
        meshL.position.set(-W/2, -scrimH/2, D/2 - sideLen/2);
        group.add(meshL);

        // Prawy
        const meshR = new THREE.Mesh(planeSide, this.matScrim);
        meshR.rotation.y = -Math.PI / 2;
        meshR.position.set(W/2, -scrimH/2, D/2 - sideLen/2);
        group.add(meshR);
    }
}