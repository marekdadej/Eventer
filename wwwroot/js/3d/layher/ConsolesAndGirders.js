import * as THREE from 'three';
// POPRAWKA: Import z LayherCore.js
import { LayherPartsBase } from './LayherCore.js';

/**
 * ConsolesAndGirders - Konsole U/O LW i dźwigary kratowe U LW/Alu.
 * Dane z katalogu Layher Event/Allround 2024/2025.
 */
export class ConsolesAndGirders extends LayherPartsBase {
    constructor() {
        super();
    }

    // 1. U-konsola LW (a-f)
    createUConsoleLW(variant = 'a') {
        const group = new THREE.Group();

        const dataMap = {
            'a': { width: 0.28, weight: 3.4, packQuantity: 100, catalogNumber: '2632.019' },
            'b': { width: 0.39, weight: 3.9, packQuantity: 125, catalogNumber: '2632.039' },
            'c': { width: 0.73, weight: 6.4, packQuantity: 80, catalogNumber: '2632.073' },
            'd': { width: 0.45, weight: 3.1, packQuantity: 80, catalogNumber: '2632.045' },
            'e': { width: 0.73, weight: 5.0, packQuantity: 80, catalogNumber: '2632.074' },
            'f': { width: 1.09, weight: 12.0, packQuantity: 30, catalogNumber: '2632.109' }
        };

        const data = dataMap[variant];
        if (!data) throw new Error(`Brak danych dla wariantu U-konsoli ${variant}`);

        const length = data.width; // Szerokość konsoli to jej długość robocza
        
        // Profil U
        // _buildUProfileShape jest w LayherCore
        const shape = this._buildUProfileShape(); 
        // Długość profilu = długość całkowita - miejsce na głowice (ok 5cm)
        const profileLen = length - 0.05; 
        
        const geo = new THREE.ExtrudeGeometry(shape, { depth: profileLen, bevelEnabled: false });
        geo.rotateY(Math.PI / 2);
        // Przesunięcie, by zaczynał się za głowicą
        geo.translate(length / 2, 0, 0);

        const profile = new THREE.Mesh(geo, this.matGalvNew);
        group.add(profile);

        // Głowice klinowe (tylko z jednej strony przy konsolach, z drugiej zazwyczaj zaczep/spigot lub koniec)
        // Ale konsole Layher mają głowice klinowe do wpięcia w stojak (x=0).
        // Druga strona (x=length) ma często czop do poręczy (spigot).
        
        // Głowica przy stojaku (x=0)
        this._addWedgeHeads(group, 0);

        // Jeśli wariant ma czop na końcu (dla poręczy), dodajemy go
        // Większość konsol Layher ma czop.
        const rPipe = 0.02415;
        const spigot = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.15, 16), this.matGalvNew);
        spigot.position.set(length - 0.025, 0.05, 0); // Na końcu, wystaje do góry
        group.add(spigot);

        // Zastrzał (Diagonal brace) - rurka pod spodem
        // Od dołu głowicy do końca profilu
        const braceLen = Math.sqrt(length*length + 0.3*0.3); // Przykład
        // Uproszczony zastrzał
        this._addTube(group, 0, -0.3, 0, length - 0.05, -0.05, 0, 0.016);
        // Pionowy element przy głowicy
        this._addTube(group, 0, 0, 0, 0, -0.3, 0, 0.02);

        group.userData = {
            type: 'UConsoleLW',
            variant: variant,
            width: data.width,
            weight: data.weight,
            catalogNumber: data.catalogNumber
        };

        group.castShadow = true;
        group.receiveShadow = true;

        return group;
    }

    // 2. O-konsola (a-f)
    createOConsole(variant = 'a') {
        const group = new THREE.Group();

        const dataMap = {
            'a': { width: 0.26, weight: 2.3, packQuantity: 250, catalogNumber: '2631.026' },
            'b': { width: 0.36, weight: 3.4, packQuantity: 125, catalogNumber: '2630.038' },
            'c': { width: 0.39, weight: 3.9, packQuantity: 125, catalogNumber: '2631.039' },
            'd': { width: 0.69, weight: 4.2, packQuantity: 125, catalogNumber: '2630.069' },
            'e': { width: 0.73, weight: 6.8, packQuantity: 80, catalogNumber: '2631.073' },
            'f': { width: 1.09, weight: 12.0, packQuantity: 30, catalogNumber: '2631.109' }
        };

        const data = dataMap[variant];
        if (!data) throw new Error(`Brak danych dla wariantu O-konsoli ${variant}`);

        const length = data.width;
        const rPipe = 0.02415;

        // Rura pozioma
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(rPipe, rPipe, length - 0.05, 16),
            this.matGalvNew
        );
        tube.rotation.z = Math.PI / 2;
        tube.position.x = length / 2;
        group.add(tube);

        // Głowica klinowa przy stojaku (x=0)
        this._addWedgeHeads(group, 0);

        // Spigot na końcu
        const spigot = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.15, 16), this.matGalvNew);
        spigot.position.set(length - 0.025, 0.05, 0);
        group.add(spigot);

        // Zastrzał (dla szerszych konsol)
        if (length > 0.4) {
             this._addTube(group, 0, -0.3, 0, length - 0.05, -0.02, 0, 0.016);
             this._addTube(group, 0, 0, 0, 0, -0.3, 0, 0.02);
        }

        group.userData = {
            type: 'OConsole',
            variant: variant,
            width: data.width,
            weight: data.weight,
            catalogNumber: data.catalogNumber
        };

        group.castShadow = true;
        group.receiveShadow = true;

        return group;
    }

    // 3. U-dźwigar kratowy aluminiowy
    createULatticeGirderAlu(length) {
        const group = this._createLatticeGirder(length, true); // true = alu
        const dataMap = {
            1.57: { weight: 8.6, packQuantity: 50, catalogNumber: '3206.157' },
            2.07: { weight: 12.3, packQuantity: 50, catalogNumber: '3206.207' },
            2.57: { weight: 15.2, packQuantity: 50, catalogNumber: '3206.257' },
            3.07: { weight: 17.0, packQuantity: 50, catalogNumber: '3206.307' },
            4.14: { weight: 24.6, packQuantity: 50, catalogNumber: '3206.414' },
            5.14: { weight: 30.2, packQuantity: 50, catalogNumber: '3206.514' },
            6.14: { weight: 35.5, packQuantity: 40, catalogNumber: '3206.614' },
            6.21: { weight: 36.5, packQuantity: 40, catalogNumber: '3206.621' }
        };
        // Fallback dla innych wymiarów
        const data = dataMap[length] || { weight: length * 5.0, catalogNumber: 'CUSTOM' };
        
        group.userData = {
            type: 'ULatticeGirderAlu',
            length: length,
            weight: data.weight,
            catalogNumber: data.catalogNumber
        };
        return group;
    }

    // 4. U-dźwigar kratowy LW stalowy
    createULatticeGirderLW(length) {
        const group = this._createLatticeGirder(length, false); // false = stal
        const dataMap = {
            2.07: { weight: 21.4, packQuantity: 40, catalogNumber: '2673.207' },
            2.57: { weight: 24.9, packQuantity: 40, catalogNumber: '2673.257' },
            3.07: { weight: 31.9, packQuantity: 40, catalogNumber: '2673.307' },
            4.14: { weight: 40.0, packQuantity: 40, catalogNumber: '2673.414' },
            5.14: { weight: 51.2, packQuantity: 40, catalogNumber: '2673.514' },
            6.14: { weight: 60.5, packQuantity: 40, catalogNumber: '2673.614' },
            6.21: { weight: 61.0, packQuantity: 40, catalogNumber: '2673.621' }
        };
        const data = dataMap[length] || { weight: length * 10.0, catalogNumber: 'CUSTOM' };
        
        group.userData = {
            type: 'ULatticeGirderLW',
            length: length,
            weight: data.weight,
            catalogNumber: data.catalogNumber
        };
        return group;
    }

    // 5. O-dźwigar kratowy LW, stalowy
    createOLatticeGirderLW(length) {
        const group = this._createLatticeGirder(length, false); 

        const dataMap = {
            2.07: { weight: 22.2, packQuantity: 40, catalogNumber: '2674.207' },
            2.57: { weight: 25.5, packQuantity: 40, catalogNumber: '2674.257' },
            3.07: { weight: 30.9, packQuantity: 40, catalogNumber: '2674.307' },
            4.14: { weight: 40.2, packQuantity: 40, catalogNumber: '2674.414' },
            5.14: { weight: 51.2, packQuantity: 40, catalogNumber: '2674.514' },
            6.14: { weight: 59.2, packQuantity: 40, catalogNumber: '2674.614' },
            6.21: { weight: 60.0, packQuantity: 40, catalogNumber: '2674.621' }
        };

        const data = dataMap[length] || { weight: length * 10.0, catalogNumber: 'CUSTOM' };

        group.userData = {
            type: 'OLatticeGirderLW',
            length: length,
            weight: data.weight,
            catalogNumber: data.catalogNumber,
            material: 'Steel'
        };

        return group;
    }

    // Helper budujący kratownicę
    _createLatticeGirder(length, isAlu = true) {
        const group = new THREE.Group();
        const trussH = 0.5; // Standardowa wysokość dźwigara Layher
        const rChord = 0.024; // Pasy (rura 48.3)
        const rBrace = 0.016; // Krzyżulce
        const mat = isAlu ? this.matAlu : this.matGalvNew;

        // Pas górny
        const chordGeo = new THREE.CylinderGeometry(rChord, rChord, length - 0.1, 16);
        const top = new THREE.Mesh(chordGeo, mat);
        top.rotation.z = Math.PI / 2;
        top.position.set(length / 2, trussH, 0);
        group.add(top);

        // Pas dolny
        const bottom = top.clone();
        bottom.position.y = 0; // Dolny pas na poziomie 0 (względem lokalnego układu, czyli na ryglu)
        // Uwaga: Dźwigar montuje się na głowicach. Oś dolnego pasa jest na poziomie rygla.
        group.add(bottom);

        // Krzyżulce (Zig-Zag)
        const step = 0.5; // Krok kratownicy
        const steps = Math.floor(length / step);
        const startX = 0.05; // Offset od głowicy
        
        for (let i = 0; i < steps; i++) {
            const x1 = startX + i * step;
            const x2 = startX + (i + 1) * step;
            
            // Unikamy wyjścia poza długość
            if (x2 > length - 0.05) break;

            // Rurka ukośna
            this._addTube(group, x1, 0, 0, x2, trussH, 0, rBrace, mat);
            // Rurka pionowa
            this._addTube(group, x2, 0, 0, x2, trussH, 0, rBrace, mat);
        }
        // Pierwszy pion
        this._addTube(group, startX, 0, 0, startX, trussH, 0, rBrace, mat);

        // Głowice klinowe na końcach (4 sztuki: góra/dół, lewo/prawo)
        // Layher ma głowice na dolnym i górnym pasie
        this._addWedgeHeads(group, 0); // Dół Lewy
        
        // Górne głowice są przesunięte w górę
        const headTopL = new THREE.Mesh(this.geoWedgeHead, this.matCastSteel);
        headTopL.position.set(0, trussH, 0);
        group.add(headTopL);
        
        // Prawa strona
        // Dolna
        const headBotR = new THREE.Mesh(this.geoWedgeHead, this.matCastSteel);
        headBotR.rotation.y = Math.PI;
        headBotR.position.x = length;
        group.add(headBotR);
        
        // Górna
        const headTopR = headBotR.clone();
        headTopR.position.y = trussH;
        group.add(headTopR);

        group.castShadow = true;
        group.receiveShadow = true;

        return group;
    }
}