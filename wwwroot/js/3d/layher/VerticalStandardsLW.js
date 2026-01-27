import * as THREE from 'three';
// Import z LayherCore (zakładamy że LayherCore.js istnieje w tym samym folderze)
import { LayherPartsBase } from './LayherCore.js';

/**
 * VerticalStandardsLW - Stojaki pionowe LW (Allround).
 * POPRAWKI:
 * 1. Zawsze widoczna górna rozeta (dla rygli).
 * 2. Usunięto wizualny czop (łącznik), aby nie wystawał ponad podłogę.
 * 3. Dodano zaślepkę góry rury (nieprzenikalność).
 */
export class VerticalStandardsLW extends LayherPartsBase {
    constructor(length, variant = 'withSpigot') {
        super();
        this.length = length;
        this.variant = variant;
        this.data = this._getData();
        this.group = this._build();
        this.group.userData = {
            type: 'VerticalStandardLW',
            variant: this.variant,
            length: this.length,
            weight: this.data.weight,
            catalogNumber: this.data.catalogNumber
        };
    }

    _getData() {
        const withSpigotData = {
            0.50: { weight: 2.7, catalogNumber: '2617.050' },
            1.00: { weight: 4.9, catalogNumber: '2617.100' },
            1.50: { weight: 7.1, catalogNumber: '2617.150' },
            2.00: { weight: 9.3, catalogNumber: '2617.200' },
            2.50: { weight: 11.5, catalogNumber: '2617.250' },
            3.00: { weight: 13.7, catalogNumber: '2617.300' },
            4.00: { weight: 18.1, catalogNumber: '2617.400' }
        };
        const withoutSpigotData = {
            0.50: { weight: 2.2, catalogNumber: '2619.050' },
            1.00: { weight: 4.4, catalogNumber: '2619.100' },
            2.00: { weight: 8.8, catalogNumber: '2619.200' }
        };

        const map = this.variant === 'withSpigot' ? withSpigotData : withoutSpigotData;
        return map[this.length] || { weight: 5.0, catalogNumber: 'UNKNOWN' };
    }

    _build() {
        const group = new THREE.Group();
        const rPipe = 0.02415; // fi 48.3mm

        // 1. Rura główna
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(rPipe, rPipe, this.length, 16),
            this.matGalvNew
        );
        tube.position.y = this.length / 2;
        tube.castShadow = true;
        tube.receiveShadow = true;
        group.add(tube);

        // 2. Zaślepka góry (Nieprzenikalność)
        // Dysk na szczycie rury, żeby nie było widać "dziury" ani przenikania
        const capGeo = new THREE.CylinderGeometry(rPipe, rPipe, 0.005, 16);
        const cap = new THREE.Mesh(capGeo, this.matGalvNew); // Ten sam materiał co rura
        cap.position.y = this.length; 
        group.add(cap);

        // 3. Rozety (Rosettes)
        // Generujemy rozety co 0.5m, ALE zawsze wymuszamy rozetę na samej górze.
        // Rozeta górna jest kluczowa dla oparcia rygli podłogi.
        
        // Rozety pośrednie (0.5m, 1.0m itd.)
        const count = Math.floor(this.length / 0.5);
        for (let i = 1; i < count; i++) {
            const y = i * 0.5;
            // Dodajemy tylko jeśli nie jest zbyt blisko samej góry (bo tam damy topRosette)
            if (y < this.length - 0.1) { 
                const ros = new THREE.Mesh(this.geoRosette, this.matGalvNew);
                ros.position.y = y;
                ros.castShadow = true;
                group.add(ros);
            }
        }

        // 4. Górna Rozeta (ZAWSZE)
        // Znajduje się ok. 2-3 cm poniżej szczytu rury, by rygiel leżał na niej, a jego wierzch licował się ze stojakiem.
        const topRosetteY = this.length - 0.025; 
        const topRos = new THREE.Mesh(this.geoRosette, this.matGalvNew);
        topRos.position.y = topRosetteY;
        topRos.castShadow = true;
        group.add(topRos);

        // 5. Naklejka
        const stickerGeo = new THREE.CylinderGeometry(rPipe + 0.001, rPipe + 0.001, 0.08, 16, 1, true);
        const sticker = new THREE.Mesh(stickerGeo, this.matPlasticRed);
        // Pozycjonujemy naklejkę w widocznym miejscu, ale nie na rozecie
        const stickerPos = (this.length > 0.5) ? this.length - 0.3 : 0.25;
        sticker.position.y = Math.max(0.15, stickerPos);
        group.add(sticker);

        // 6. Nity (Detale)
        const rivetCount = Math.floor(this.length);
        for (let i = 1; i < rivetCount; i++) {
            const rivY = i * 1.0 - 0.25; // Pomiędzy rozetami
            if (rivY > 0 && rivY < this.length) {
                const riv = new THREE.Mesh(this.geoRivet, this.matHighSteel);
                riv.position.set(rPipe, rivY, 0);
                riv.rotation.z = -Math.PI / 2;
                group.add(riv);
            }
        }

        // UWAGA: USUNIĘTO GENEROWANIE CZOPA (SPIGOT)
        // Zgodnie z instrukcją "zawsze nie moze byc widac u niego lacznika o gory".
        // Nawet jeśli variant='withSpigot', nie dodajemy geometrii, 
        // aby podłoga leżała płasko na szczycie stojaka.

        return group;
    }
}

// --- POZOSTAŁE KLASY BEZ ZMIAN (Dla kompletności pliku) ---

export class BaseJacks extends LayherPartsBase {
    constructor(type, extension = 0.3) {
        super();
        this.type = type; 
        this.extension = extension;
        this.group = this._build();
    }

    _build() {
        const group = new THREE.Group();
        const totalLen = 0.60;
        const plateW = 0.15;

        const plate = new THREE.Mesh(new THREE.BoxGeometry(plateW, 0.01, plateW), this.matGalvNew);
        plate.position.y = 0.005;
        group.add(plate);

        const rThread = 0.019;
        const thread = new THREE.Mesh(new THREE.CylinderGeometry(rThread, rThread, totalLen, 12), this.matGalvNew);
        thread.position.y = totalLen / 2;
        group.add(thread);

        const nut = new THREE.Mesh(this.geoWingNut, this.matCastSteel);
        nut.position.y = this.extension; 
        group.add(nut);

        const stopMark = new THREE.Mesh(
            new THREE.CylinderGeometry(rThread + 0.001, rThread + 0.001, 0.02, 12),
            this.matPlasticRed
        );
        stopMark.position.y = totalLen - 0.1;
        group.add(stopMark);

        return group;
    }
}

export class SpigotConnector extends LayherPartsBase {
    constructor() { super(); this.group = this._build(); }
    _build() {
        const group = new THREE.Group();
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 12), this.matGalvNew);
        tube.position.y = 0.26;
        group.add(tube);
        return group;
    }
}

export class StandGuard extends LayherPartsBase {
    constructor() { super(); this.group = this._build(); }
    _build() {
        const group = new THREE.Group();
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.5, 12), this.matGalvNew);
        tube.position.y = 0.25;
        group.add(tube);
        return group;
    }
}

export class RedPlug extends LayherPartsBase {
    constructor() { super(); this.group = this._build(); }
    _build() {
        return new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.02, 12), this.matPlasticRed);
    }
}

export class AntiSlipWoodPad extends LayherPartsBase {
    constructor() { super(); this.group = this._build(); }
    _build() {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.045, 0.25), this.matPlywoodEvent);
        mesh.position.y = 0.0225;
        mesh.receiveShadow = true;
        return mesh;
    }
}

export class BaseCollarNormal extends LayherPartsBase {
    constructor() {
        super();
        this.group = this._build();
        this.group.userData = { type: 'BaseCollar' };
    }

    _build() {
        const group = new THREE.Group();
        const length = 0.24;
        const rCollar = 0.0265;

        // Rura
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(rCollar, rCollar, length, 24),
            this.matGalvNew
        );
        tube.position.y = length / 2;
        group.add(tube);

        // Rim (Dolny kołnierz)
        const rimH = 0.04;
        const rimGeo = new THREE.CylinderGeometry(rCollar + 0.008, rCollar + 0.002, rimH, 24);
        const rim = new THREE.Mesh(rimGeo, this.matCastSteel);
        rim.position.y = 0.02 + rimH / 2;
        group.add(rim);

        // Rozeta (w Base Collar zawsze jest jedna, ok 17cm od dołu)
        const ros = new THREE.Mesh(this.geoRosette, this.matGalvNew);
        ros.position.y = 0.17; 
        group.add(ros);

        return group;
    }
}