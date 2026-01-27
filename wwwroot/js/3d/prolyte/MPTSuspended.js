import * as THREE from 'three';
import { MPTStandard } from './MPTStandard.js';

// POPRAWKA ŚCIEŻKI:
// 1. "../" wychodzi z folderu 'prolyte' do folderu '3d'
// 2. "layher/" wchodzi do folderu layher
// 3. "LayherPartsBase.js" to nazwa Twojego pliku
import { LayherPartsBase } from '../layher/LayherPartsBase.js';

export class MPTSuspended extends MPTStandard {
    constructor(scene) {
        super(scene);
        // Inicjalizacja klasy z zaimportowanego pliku
        this.lp = new LayherPartsBase();
    }

    build(config) {
        this.clear();
        const W = parseFloat(config.width) || 12.0;
        const D = parseFloat(config.depth) || 10.0;
        const H = parseFloat(config.height) || 8.0;
        const showCanopy = config.showCanopy !== false;
        
        // 1. GRID DACHU (Wisi w powietrzu, bez wież MPT pod spodem!)
        const gridY = H; 
        this._buildRoofGrid(W, D, gridY, showCanopy);

        // 2. WIEŻE LAYHER (ZEWNĘTRZNE - SUPPORT)
        // Muszą być szersze niż dach, żeby go objąć
        const towerSpreadX = W + 3.0; // 1.5m luzu z każdej strony
        const towerSpreadZ = D + 2.0; // 1.0m luzu
        // Wieże muszą być wyższe niż dach, żeby podwiesić silniki
        const towerH = H + 2.0; 

        const towers = [
            {x: towerSpreadX/2, z: towerSpreadZ/2},
            {x: -towerSpreadX/2, z: towerSpreadZ/2},
            {x: towerSpreadX/2, z: -towerSpreadZ/2},
            {x: -towerSpreadX/2, z: -towerSpreadZ/2}
        ];

        towers.forEach(t => {
            // Budujemy wieżę Layher (2.07 x 2.07)
            this._buildLayherSupportTower(t.x, t.z, towerH);
            
            // Dodajemy wysięgnik (konsolę) i łańcuch do rogu dachu
            this._addCantilever(t.x, t.z, towerH, W/2, D/2, gridY);
        });
    }

    _buildLayherSupportTower(x, z, h) {
        const size = 2.07;
        
        // Sprawdzamy czy mamy metody Layhera (dla bezpieczeństwa)
        if (!this.lp.createStandard || !this.lp.createLedgerO) {
            console.warn("Brak metod Layher w MPTSuspended. Sprawdź plik LayherPartsBase.");
            return;
        }

        // 4 stojaki w narożnikach
        const offs = [-size/2, size/2];
        offs.forEach(ox => {
            offs.forEach(oz => {
                const std = this.lp.createStandard(h);
                std.position.set(x + ox, 0, z + oz);
                this.group.add(std);
            });
        });
        
        // Rygle co 2m wysokości
        for(let y=2; y<=h; y+=2) {
            // Rygle X
            const ledX = this.lp.createLedgerO(size);
            ledX.position.set(x, y, z - size/2);
            this.group.add(ledX);
            
            const ledX2 = ledX.clone(); 
            ledX2.position.z = z + size/2; 
            this.group.add(ledX2);
            
            // Rygle Z (obrócone)
            const ledZ = this.lp.createLedgerO(size);
            ledZ.rotation.y = Math.PI/2;
            ledZ.position.set(x - size/2, y, z);
            this.group.add(ledZ);
            
            const ledZ2 = ledZ.clone(); 
            ledZ2.position.x = x + size/2; 
            this.group.add(ledZ2);
        }
    }

    _addCantilever(tx, tz, th, roofHalfW, roofHalfD, roofH) {
        // Obliczamy gdzie jest róg dachu względem wieży
        const targetX = (tx > 0) ? roofHalfW : -roofHalfW;
        const targetZ = (tz > 0) ? roofHalfD : -roofHalfD;
        
        // Ramię wysięgnika (Stalowy profil) - uproszczone
        const armLen = 2.5;
        const arm = new THREE.Mesh(
            new THREE.BoxGeometry(armLen, 0.2, 0.1), 
            new THREE.MeshStandardMaterial({color:0x333333})
        );
        
        // Kierunek ramienia (do środka sceny w osi X)
        const dir = (tx > 0) ? -1 : 1; 
        arm.position.set(tx + (dir * armLen/2), th - 0.5, tz);
        this.group.add(arm);

        // Łańcuch / Silnik
        // Od końca ramienia do rogu dachu
        const hookX = tx + (dir * (armLen - 0.2)); // Punkt zaczepienia na ramieniu
        const start = new THREE.Vector3(hookX, th - 0.6, tz);
        const end = new THREE.Vector3(targetX, roofH, targetZ); // Róg dachu (gridu)
        
        const dist = start.distanceTo(end);
        
        // Łańcuch (czarny cylinder)
        const chain = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, dist), 
            new THREE.MeshStandardMaterial({color:0x111111})
        );
        
        // Ustawienie łańcucha między punktami
        chain.position.copy(start).lerp(end, 0.5);
        chain.lookAt(end);
        chain.rotateX(Math.PI/2); // Cylinder domyślnie leży w Y, lookAt celuje Z
        this.group.add(chain);
    }
}