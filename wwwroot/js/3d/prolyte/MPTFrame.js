import * as THREE from 'three';
import { MPTStandard } from './MPTStandard.js';

export class MPTFrame extends MPTStandard {
    constructor(scene) {
        super(scene);
    }

    build(config) {
        this.clear();
        
        // Pobieramy wymiary i ograniczamy je zgodnie z Twoimi założeniami
        // Min 6x4, Max 14x12
        let W = parseFloat(config.width) || 12.0;
        let D = parseFloat(config.depth) || 10.0;
        const H = parseFloat(config.height) || 7.0;

        // Walidacja wymiarów (opcjonalna, ale zgodna z opisem)
        if (W > 14) W = 14; if (W < 6) W = 6;
        if (D > 12) D = 12; if (D < 4) D = 4;

        // 1. WIEŻE (4 sztuki) - Używamy gotowej metody z MPTStandard
        const towerX = W / 2;
        const towerZ = D / 2;
        
        // Wieże stoją w narożnikach
        this._buildTower(towerX, towerZ, H);
        this._buildTower(-towerX, towerZ, H);
        this._buildTower(towerX, -towerZ, H);
        this._buildTower(-towerX, -towerZ, H);

        // 2. PŁASKA OBWIEDNIA (GRID)
        // Wisi na wysokości H (dolna rura) + offset do środka kraty
        const gridY = H + 0.20; 
        this._buildFlatGrid(W, D, gridY);
    }

    _buildFlatGrid(W, D, y) {
        const grp = new THREE.Group();
        grp.position.y = y;

        // W narożnikach MPT Grid stosuje się Box Cornery lub Sleeve Blocki.
        // Tutaj Sleeve Blocki są już częścią wieży.
        // Więc budujemy belki pomiędzy wieżami.

        // Odległość między środkami wież to W i D.
        // Długość kratownicy = Wymiar - szerokość Sleeve Blocka (ok. 0.6m)
        const sleeveSize = 0.6;
        const trussLenX = W - sleeveSize;
        const trussLenZ = D - sleeveSize;

        // Belki Przód / Tył (Oś X)
        const beamFront = this.parts.createMainTruss(trussLenX);
        beamFront.position.set(0, 0, D/2);
        grp.add(beamFront);

        const beamBack = beamFront.clone();
        beamBack.position.set(0, 0, -D/2);
        grp.add(beamBack);

        // Belki Lewo / Prawo (Oś Z)
        const beamLeft = this.parts.createMainTruss(trussLenZ);
        beamLeft.rotation.y = Math.PI / 2;
        beamLeft.position.set(-W/2, 0, 0);
        grp.add(beamLeft);

        const beamRight = beamLeft.clone();
        beamRight.position.set(W/2, 0, 0);
        grp.add(beamRight);

        // Opcjonalnie: Belka środkowa (rozpórka) jeśli szerokość duża
        if (W > 10) {
            const beamMid = this.parts.createMainTruss(trussLenZ);
            beamMid.rotation.y = Math.PI / 2;
            beamMid.position.set(0, 0, 0);
            grp.add(beamMid);
        }

        this.group.add(grp);
    }
}