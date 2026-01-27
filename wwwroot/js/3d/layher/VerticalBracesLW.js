import * as THREE from 'three';
import { LayherPartsBase } from './LayherCore.js';

/**
 * VerticalBracesLW - Stężenia pionowe (Diagonale) - WYSOKI DETAL.
 * Odwzorowanie oryginalnego stężenia Layher Allround.
 * Zawiera: odlewaną głowicę, klin, sworzeń obrotowy oraz spłaszczoną końcówkę rury wystającą za sworzeń.
 */
export class VerticalBracesLW extends LayherPartsBase {
    constructor(fieldHeight, fieldWidth) {
        super();
        this.fieldHeight = fieldHeight; 
        this.fieldWidth = fieldWidth;   
        
        this.initMaterials();

        this.data = this._getData();
        this.group = this._buildHighDetail();
        
        this.group.userData = {
            type: 'VerticalBraceLW',
            height: this.fieldHeight,
            width: this.fieldWidth,
            length: this.data.length,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber
        };
    }

    initMaterials() {
        // Materiał odlewanej głowicy (ciemniejszy, chropowaty metal)
        this.matCastSteel = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            roughness: 0.9, 
            metalness: 0.4 
        }); 
        // Materiał klina (jaśniejszy, bardziej błyszczący ocynk)
        this.matWedgeShiny = new THREE.MeshStandardMaterial({ 
            color: 0xCCCCCC, 
            roughness: 0.4, 
            metalness: 0.7 
        });
        // Materiał rury i spłaszczenia (standardowy ocynk)
        this.matTubeGalv = this.matGalvNew; 
    }

    _getData() {
        // Uproszczona mapa danych
        const dataMap = {
            2.0: { 2.07: { length: 2.81 }, 2.57: { length: 3.18 }, 3.07: { length: 3.60 } },
            1.5: { 2.07: { length: 2.48 } },
            1.0: { 2.07: { length: 2.20 } }
        };
        const h = dataMap[this.fieldHeight];
        if (h && h[this.fieldWidth]) {
            return { ...h[this.fieldWidth], weight: 10, catalogNumber: 'DETAILED' };
        }
        const calcLen = Math.sqrt(this.fieldHeight**2 + this.fieldWidth**2);
        return { length: parseFloat(calcLen.toFixed(2)), weight: calcLen*3.5, catalogNumber: 'CUSTOM' };
    }

    _buildHighDetail() {
        const group = new THREE.Group();
        
        // Wymiary pola
        const H = this.fieldHeight;
        const W = this.fieldWidth;
        const gridDiagonalLen = Math.sqrt(H*H + W*W);

        // --- Parametry geometryczne ---
        const rPipe = 0.02415; // Promień rury 48.3mm
        
        // 1. STAND OFFSET: Odległość od środka słupa do środka klina w rozecie.
        // Dla dużych otworów Layher to ok. 58mm.
        const standOffset = 0.058; 

        // 2. PIVOT OFFSET: Odległość od środka klina do sworznia obrotowego w głowicy.
        const pivotOffset = 0.040; // 4cm

        // 3. TAIL LENGTH: Ile spłaszczona rura wystaje "za" sworzeń (odstaje).
        const tailLength = 0.035; // 3.5cm

        // Obliczamy punkty zaczepienia klinów w przestrzeni lokalnej (wzdłuż przekątnej)
        const startWedgePos = new THREE.Vector3(standOffset, 0, 0);
        const endWedgePos = new THREE.Vector3(gridDiagonalLen - standOffset, 0, 0);

        // Obliczamy punkty sworzni (pivotów) - to między nimi rozpięta jest rura
        const startPivotPos = new THREE.Vector3(standOffset + pivotOffset, 0, 0);
        const endPivotPos = new THREE.Vector3(gridDiagonalLen - (standOffset + pivotOffset), 0, 0);

        // --- Budowa ---

        // A. Dodaj głowice (nieruchome względem rozety)
        const head1 = this._createCastHead(startWedgePos, startPivotPos, false);
        group.add(head1);

        const head2 = this._createCastHead(endWedgePos, endPivotPos, true);
        group.add(head2);

        // B. Dodaj zespół rury (spłaszczenia + rura główna) rozpięty między sworzniami
        const tubeAssembly = this._createTubeAssembly(startPivotPos, endPivotPos, rPipe, tailLength);
        group.add(tubeAssembly);

        // Cienie
        group.traverse(obj => {
            if(obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
        });

        return group;
    }

    /**
     * Tworzy szczegółową głowicę odlewaną (szczękę) z klinem i sworzniem.
     */
    _createCastHead(wedgePos, pivotPos, isEnd) {
        const headGroup = new THREE.Group();
        headGroup.position.copy(wedgePos);
        
        // Jeśli to koniec, obracamy głowicę o 180st, żeby patrzyła "do środka"
        if (isEnd) {
            headGroup.rotation.y = Math.PI;
        }

        // Kierunek od klina do pivota (lokalnie zawsze +X po obrocie grupy)
        const distToPivot = wedgePos.distanceTo(pivotPos);
        
        // 1. Korpus głowicy (Cast Jaw) - złożony z kilku brył dla detalu
        const jawThickness = 0.012; // Grubość ścianki odlewu
        const jawHeight = 0.055;
        const jawWidth = 0.05; // Szerokość zewnętrzna (musi zmieścić spłaszczoną rurę w środku)
        const gapForTube = 0.016; // Szczelina w środku na spłaszczoną rurę
        const cheekThickness = (jawWidth - gapForTube) / 2;

        const cheekGeo = new THREE.BoxGeometry(distToPivot + 0.02, jawHeight, cheekThickness);
        
        // Lewy policzek
        const cheekL = new THREE.Mesh(cheekGeo, this.matCastSteel);
        cheekL.position.set(distToPivot/2, 0, -(gapForTube + cheekThickness)/2);
        headGroup.add(cheekL);

        // Prawy policzek
        const cheekR = new THREE.Mesh(cheekGeo, this.matCastSteel);
        cheekR.position.set(distToPivot/2, 0, (gapForTube + cheekThickness)/2);
        headGroup.add(cheekR);

        // Górna poprzeczka (nad rozetą)
        const topBlockGeo = new THREE.BoxGeometry(0.03, 0.02, jawWidth);
        const topBlock = new THREE.Mesh(topBlockGeo, this.matCastSteel);
        topBlock.position.set(0, jawHeight/2 + 0.01, 0);
        headGroup.add(topBlock);

        // 2. Klin (Wedge) - w punkcie 0,0,0 grupy
        // Realistyczny kształt klina (zwężający się, z "haczykiem" na górze)
        const wedgeShape = new THREE.Shape();
        const wTop = 0.015, wBot = 0.008, wLen = 0.14;
        wedgeShape.moveTo(-wTop/2, wLen/2);
        wedgeShape.lineTo(wTop/2, wLen/2);
        wedgeShape.lineTo(wBot/2, -wLen/2);
        wedgeShape.lineTo(-wBot/2, -wLen/2);
        wedgeShape.closePath();
        const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.006, bevelEnabled: false });
        const wedge = new THREE.Mesh(wedgeGeo, this.matWedgeShiny);
        wedge.rotation.y = Math.PI/2; // Obrót, żeby klin był płaski względem szczeliny
        wedge.position.y = 0.02; // Lekko wbity
        headGroup.add(wedge);

        // 3. Sworzeń (Pivot Pin) - w punkcie distToPivot
        const pinGeo = new THREE.CylinderGeometry(0.008, 0.008, jawWidth + 0.005, 12);
        pinGeo.rotateX(Math.PI/2);
        const pin = new THREE.Mesh(pinGeo, this.matHighSteel);
        pin.position.set(distToPivot, 0, 0);
        headGroup.add(pin);

        return headGroup;
    }

    /**
     * Tworzy zespół rury: spłaszczone końcówki + rura okrągła pomiędzy nimi.
     * Całość rozpięta między punktami sworzni.
     */
    _createTubeAssembly(p1, p2, rPipe, tailLength) {
        const assemblyGroup = new THREE.Group();
        
        // Ustawiamy grupę w p1 i kierujemy na p2
        assemblyGroup.position.copy(p1);
        assemblyGroup.lookAt(p2);
        
        const totalPivotDistance = p1.distanceTo(p2);
        
        // Wymiary spłaszczenia
        const flatThickness = 0.014; // Grubość spłaszczonej rury
        const flatWidth = rPipe * 1.8; // Szerokość spłaszczenia (trochę mniej niż 2*r)
        // Długość części płaskiej od sworznia w stronę rury (transition area)
        const flatTransitionLen = 0.08; 

        // 1. Spłaszczona końcówka START (przy p1)
        // Składa się z części "ogonowej" (tail) i części przejściowej
        const flatStartGeo = new THREE.BoxGeometry(tailLength + flatTransitionLen, flatThickness, flatWidth);
        const flatStart = new THREE.Mesh(flatStartGeo, this.matTubeGalv);
        // Środek geometrii jest przesunięty tak, aby otwór na sworzeń był w (0,0,0)
        // Czyli przesuwamy o (tailLength - flatTransitionLen) / 2 ? Nie.
        // Chcemy, żeby punkt 0 był w miejscu sworznia. Ogon idzie na -X, przejście na +X.
        flatStart.position.set((flatTransitionLen - tailLength)/2, 0, 0);
        assemblyGroup.add(flatStart);

        // 2. Spłaszczona końcówka END (przy p2)
        const flatEnd = flatStart.clone();
        // Pozycja na końcu dystansu pivotów
        flatEnd.position.set(totalPivotDistance - (flatTransitionLen - tailLength)/2, 0, 0);
        assemblyGroup.add(flatEnd);

        // 3. Rura główna okrągła (pomiędzy częściami płaskimi)
        const roundTubeLen = totalPivotDistance - 2 * flatTransitionLen;
        
        if (roundTubeLen > 0) {
            const tubeGeo = new THREE.CylinderGeometry(rPipe, rPipe, roundTubeLen, 16);
            tubeGeo.rotateZ(Math.PI/2); // Kładziemy wzdłuż X
            const tube = new THREE.Mesh(tubeGeo, this.matTubeGalv);
            // Środek rury
            tube.position.set(totalPivotDistance / 2, 0, 0);
            assemblyGroup.add(tube);

            // Naklejka i nity na okrągłej części
            this._addDetailsToTube(assemblyGroup, rPipe, roundTubeLen, totalPivotDistance / 2);
        }

        return assemblyGroup;
    }

    _addDetailsToTube(group, rPipe, tubeLen, centerX) {
        // Naklejka
        const stickerGeo = new THREE.CylinderGeometry(rPipe + 0.0005, rPipe + 0.0005, 0.08, 16, 1, true);
        stickerGeo.rotateZ(Math.PI/2);
        const sticker = new THREE.Mesh(stickerGeo, this.matPlasticRed);
        sticker.position.set(centerX, 0, 0);
        group.add(sticker);

        // Nity
        const rivetCount = Math.floor(tubeLen / 0.4);
        const startX = centerX - tubeLen/2;
        for(let i=1; i<rivetCount; i++) {
            const riv = new THREE.Mesh(this.geoRivet, this.matHighSteel);
            riv.position.set(startX + i*0.4, rPipe, 0);
            group.add(riv);
        }
    }
}