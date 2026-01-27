import * as THREE from 'three';
import { LayherPartsBase } from './LayherCore.js';

/**
 * LayherAccessories - Akcesoria, schody i elementy złączne.
 */
export class LayherAccessories extends LayherPartsBase {
    constructor() {
        super();
    }

    // 1. U-belka policzkowa 500 LW
    createStringerStairs500(stepsVariant = '5steps') {
        const group = new THREE.Group();
        const data = stepsVariant === '5steps' 
            ? { height: 1.0, width: 1.57, weight: 18.0, catalogNumber: '2639.004' }
            : { height: 2.0, width: 2.57, weight: 34.0, catalogNumber: '2639.009' };

        const stepHeight = data.height / (stepsVariant === '5steps' ? 5 : 9);
        const stepDepth = 0.25;
        const cheekH = 0.5;
        const cheekW = 0.1;

        const cheekGeo = new THREE.BoxGeometry(cheekW, cheekH, data.width);
        
        const leftCheek = new THREE.Mesh(cheekGeo, this.matAlu);
        const angle = Math.atan2(data.height, data.width);
        leftCheek.rotation.x = -angle; 
        leftCheek.position.set(-0.3, data.height/2, data.width/2);
        group.add(leftCheek);

        const rightCheek = leftCheek.clone();
        rightCheek.position.set(0.3, data.height/2, data.width/2);
        group.add(rightCheek);

        const stepGeo = new THREE.BoxGeometry(0.6, 0.04, stepDepth);
        const numSteps = stepsVariant === '5steps' ? 5 : 9;
        const runPerStep = data.width / numSteps;
        
        for (let i = 1; i <= numSteps; i++) {
            const step = new THREE.Mesh(stepGeo, this.matAlu);
            const y = i * stepHeight - stepHeight/2;
            const z = i * runPerStep - runPerStep/2;
            step.position.set(0, y, z);
            group.add(step);
        }

        group.userData = {
            type: 'StringerStairs500LW',
            variant: stepsVariant,
            height: data.height,
            weight: data.weight,
            catalogNumber: data.catalogNumber
        };
        return group;
    }

    // 2. U-schody podestowe aluminiowe
    createPlatformStairs(length, height = 2.0) {
        const group = new THREE.Group();
        const dataMap = {
            2.57: { width: 0.64, weight: height === 2.0 ? 21.9 : 21.5, catalogNumber: height === 2.0 ? '1753.257' : '1753.251' },
            3.07: { width: 0.64, weight: 26.3, catalogNumber: '1753.307' }
        };
        const data = dataMap[length] || { width: 0.64, weight: 25.0, catalogNumber: 'CUSTOM' };

        const stepHeight = 0.20;
        const numSteps = Math.round(height / stepHeight);
        const run = length - 0.3;

        const stringerLength = Math.sqrt(run*run + height*height);
        const stringerGeo = new THREE.BoxGeometry(0.05, 0.15, stringerLength);
        const angle = Math.atan2(height, run);

        const s1 = new THREE.Mesh(stringerGeo, this.matAlu);
        s1.rotation.z = angle; 
        s1.position.set(run / 2, height / 2, 0.025);
        group.add(s1);

        const s2 = s1.clone();
        s2.position.z = data.width - 0.025;
        group.add(s2);

        const stepGeo = new THREE.BoxGeometry(0.25, 0.04, data.width - 0.1);
        for (let i = 1; i <= numSteps; i++) {
            const step = new THREE.Mesh(stepGeo, this.matAlu);
            const progress = i / numSteps; 
            const x = run * progress - (run/numSteps)/2;
            const y = height * progress - (height/numSteps)/2;
            step.position.set(x, y, data.width / 2);
            group.add(step);
        }

        const hookGeo = this._buildEventHookGeometry(0.05);
        const hL = new THREE.Mesh(hookGeo, this.matCastSteel);
        hL.position.set(run, height - 0.05, 0.03); 
        group.add(hL);
        const hR = hL.clone();
        hR.position.z = data.width - 0.03;
        group.add(hR);

        group.userData = { type: 'PlatformStairsAlu', length, height, weight: data.weight };
        return group;
    }

    // 3. Belka bazowa
    createBaseBeam(length = 2.07) {
        const group = new THREE.Group();
        const beamGeo = new THREE.BoxGeometry(length, 0.2, 0.1);
        const beam = new THREE.Mesh(beamGeo, this.matGalvNew);
        beam.position.y = 0.1;
        group.add(beam);
        group.userData = { type: 'BaseBeam', length };
        return group;
    }

    // 4. Trawersa Truss
    createTrussTravers(length = 2.07) {
        const group = new THREE.Group();
        const trussGeo = new THREE.BoxGeometry(length, 0.4, 0.2);
        const truss = new THREE.Mesh(trussGeo, this.matGalvNew);
        truss.position.y = 0.2;
        group.add(truss);
        group.userData = { type: 'TrussTravers', length };
        return group;
    }

    // 5. Płyta podstawy typ 1
    createBasePlateType1() {
        const group = new THREE.Group();
        const size = 0.41;
        const plateGeo = new THREE.BoxGeometry(size, 0.02, size);
        const plate = new THREE.Mesh(plateGeo, this.matGalvNew);
        group.add(plate);

        const holeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.021, 8);
        const matHole = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const spacing = size / 6;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 5; j++) {
                if ((i + j) % 2 === 0) continue; 
                const hole = new THREE.Mesh(holeGeo, matHole);
                hole.position.set(-size/2 + i*spacing, 0, -size/2 + j*spacing);
                group.add(hole);
            }
        }
        group.userData = { type: 'BasePlateType1', size };
        return group;
    }

    // 6. Łącznik rurowy do U-profili (pomocniczy)
    createUProfileConnector(withPins = false) {
        const group = new THREE.Group();
        const length = withPins ? 2.1 : 1.8;
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, length, 16), this.matGalvNew);
        tube.position.y = length / 2;
        group.add(tube);
        if (withPins) {
            const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8), this.matHighSteel);
            pin.rotation.x = Math.PI / 2;
            pin.position.set(0, length / 2 + 0.035, 0);
            group.add(pin);
        }
        return group;
    }

    // 7. Łącznik rurowy do O-profili (pomocniczy)
    createOProfileConnector(diameter = 19) {
        const group = new THREE.Group();
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.3, 16), this.matGalvNew);
        tube.position.y = 0.15;
        group.add(tube);
        const halfCoupler = new THREE.Mesh(this.geoCoupler, this.matCoupler);
        halfCoupler.position.y = 0.15; 
        halfCoupler.position.x = 0.04;
        group.add(halfCoupler);
        return group;
    }

    // ==========================================
    // NOWE ELEMENTY (SCENA WYSOKA / BARIERKI)
    // ==========================================

    /**
     * 8. Łącznik rurowy (Spigot) - Czop 214.000
     */
    createSpigotConnector(withBolt = true) {
        const group = new THREE.Group();
        const catalogNumber = '214.000'; 
        const weight = 1.6;

        // Rura czopa (fi ~38mm)
        const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.019, 0.019, 0.52, 16),
            this.matGalvNew
        );
        group.add(tube);

        // Pierścień oporowy
        const ring = new THREE.Mesh(
            new THREE.CylinderGeometry(0.023, 0.023, 0.005, 16),
            this.matGalvNew
        );
        group.add(ring);

        // Otwory
        if (withBolt) {
            const holeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
            const holeGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8);
            
            const holeTop = new THREE.Mesh(holeGeo, holeMat);
            holeTop.rotation.z = Math.PI / 2;
            holeTop.position.y = 0.15; 
            group.add(holeTop);
            
            const holeBot = holeTop.clone();
            holeBot.position.y = -0.15; 
            group.add(holeBot);
        }

        group.userData = { type: 'Spigot', weight, catalogNumber };
        return group;
    }

    /**
     * 9. Zawleczka sprężysta ("Świńskie ucho") - 4000.001
     */
    createRedLockingPin() {
        const group = new THREE.Group();
        const catalogNumber = '4000.001'; 
        
        const pinLen = 0.07;
        const pinGeo = new THREE.CylinderGeometry(0.0045, 0.0045, pinLen, 8);
        const pin = new THREE.Mesh(pinGeo, this.matHighSteel);
        pin.rotation.z = Math.PI / 2;
        group.add(pin);

        const loopRadius = 0.015;
        const tubeRadius = 0.003;
        const loopGeo = new THREE.TorusGeometry(loopRadius, tubeRadius, 6, 16, Math.PI * 1.8);
        const loop = new THREE.Mesh(loopGeo, this.matPlasticRed);
        loop.position.set(-pinLen/2, -loopRadius, 0);
        loop.rotation.z = Math.PI / 4; 
        
        group.add(loop);

        group.userData = { type: 'RedLockingPin', weight: 0.1, catalogNumber };
        return group;
    }

    /**
     * 10. Śruba specjalna M12 x 60 z nakrętką 19 - 4905.062
     */
    createSpecialBoltM12() {
        const group = new THREE.Group();
        const catalogNumber = '4905.062';
        const weight = 0.06;

        const boltLen = 0.06; 
        const threadRadius = 0.006; 
        const hexRadius = 0.011; 

        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(threadRadius, threadRadius, boltLen, 12),
            this.matHighSteel
        );
        shaft.rotation.z = Math.PI / 2;
        group.add(shaft);

        const headGeo = new THREE.CylinderGeometry(hexRadius, hexRadius, 0.008, 6);
        const head = new THREE.Mesh(headGeo, this.matHighSteel);
        head.rotation.z = Math.PI / 2;
        head.position.x = -boltLen / 2; 
        group.add(head);

        const nut = new THREE.Mesh(headGeo, this.matHighSteel); 
        nut.rotation.z = Math.PI / 2;
        nut.position.x = boltLen / 2 - 0.005; 
        group.add(nut);

        group.userData = { type: 'BoltM12x60', weight, catalogNumber };
        return group;
    }
}