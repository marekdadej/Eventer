import * as THREE from 'three';

export class TrussFactory {
    constructor() {
        this.initMaterials();
        this.initGeometries();
    }

    initMaterials() {
        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.6,
            roughness: 0.35
        });
        this.matCoupler = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.7,
            roughness: 0.2
        });
        this.matBlackSteel = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.7
        });
        this.matPin = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.9,
            roughness: 0.3
        });
        this.matWheel = new THREE.MeshStandardMaterial({
            color: 0xaa2222,
            roughness: 0.5,
            metalness: 0.1
        });
        this.matCanopy = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95
        });
    }

    initGeometries() {
        this.geoPin = new THREE.CylinderGeometry(0.008, 0.008, 0.09, 12);
        this.geoRClip = new THREE.TorusGeometry(0.012, 0.002, 6, 16, Math.PI * 1.5);
        this.geoCoupler = this._buildCouplerGeo();
        this.geoEndRing = this._buildEndRingGeo();
    }

    createTrussSegment(length, type = 'H30V') {
        const group = new THREE.Group();
        const isH40 = type === 'H40V';
        const size = isH40 ? 0.40 : 0.29;
        const mainR = 0.025;
        const braceR = 0.012;
        const half = size / 2;

        const chordGeo = new THREE.CylinderGeometry(mainR, mainR, length, 24);
        const positions = [
            [-half, half], [half, half],
            [-half, -half], [half, -half]
        ];

        positions.forEach(pos => {
            const chord = new THREE.Mesh(chordGeo, this.matAlu);
            chord.rotation.z = Math.PI / 2;
            chord.position.set(length / 2, pos[1], pos[0]);
            group.add(chord);
            this._addEndConnector(group, 0, pos[1], pos[0], true);
            this._addEndConnector(group, length, pos[1], pos[0], false);
        });

        this._addEndFrame(group, 0, size);
        this._addEndFrame(group, length, size);

        const step = isH40 ? 0.5 : 0.42;
        this._buildZigZagBracing(group, length, step, size, braceR);

        group.castShadow = true;
        group.receiveShadow = true;

        return group;
    }

    _buildZigZagBracing(group, length, step, size, r) {
        const steps = Math.ceil(length / step);
        const actualStep = length / steps;
        const half = size / 2;

        const faces = [
            {y: half, zStart: -half, zEnd: half},
            {y: -half, zStart: -half, zEnd: half},
            {yStart: -half, yEnd: half, z: half},
            {yStart: -half, yEnd: half, z: -half}
        ];

        faces.forEach(face => {
            for (let i = 0; i < steps; i++) {
                const x1 = i * actualStep;
                const x2 = (i + 1) * actualStep;
                let p1, p2;
                if (i % 2 === 0) {
                    p1 = new THREE.Vector3(x1, face.y || face.yStart, face.zStart || face.z);
                    p2 = new THREE.Vector3(x2, face.y || face.yEnd, face.zEnd || face.z);
                } else {
                    p1 = new THREE.Vector3(x1, face.y || face.yEnd, face.zEnd || face.z);
                    p2 = new THREE.Vector3(x2, face.y || face.yStart, face.zStart || face.z);
                }
                const dist = p1.distanceTo(p2);
                const brace = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dist, 12), this.matAlu);
                const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                brace.position.copy(mid);
                brace.lookAt(p2);
                brace.rotateX(Math.PI / 2);
                group.add(brace);
            }
        });
    }

    _addEndFrame(group, x, size) {
        const r = 0.025;
        const half = size / 2;
        const barGeo = new THREE.CylinderGeometry(r, r, size, 16);

        [half, -half].forEach(y => {
            const bar = new THREE.Mesh(barGeo, this.matAlu);
            bar.rotation.x = Math.PI / 2;
            bar.position.set(x, y, 0);
            group.add(bar);
        });

        [half, -half].forEach(z => {
            const bar = new THREE.Mesh(barGeo, this.matAlu);
            bar.position.set(x, 0, z);
            group.add(bar);
        });
    }

    _addEndConnector(group, x, y, z, isFemale) {
        const grp = new THREE.Group();
        grp.position.set(x, y, z);

        if (isFemale) {
            const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16), this.matCoupler);
            ring.rotation.z = Math.PI / 2;
            ring.position.x = 0.03;
            grp.add(ring);
        } else {
            const cone = new THREE.Mesh(this.geoCoupler, this.matCoupler);
            cone.rotation.z = Math.PI / 2;
            grp.add(cone);
        }

        const pin = new THREE.Mesh(this.geoPin, this.matPin);
        pin.position.x = isFemale ? 0.03 : -0.03;
        if (Math.abs(y) > 0.01) pin.rotation.x = Math.PI / 2;
        grp.add(pin);

        const clip = new THREE.Mesh(this.geoRClip, this.matBlackSteel);
        clip.position.set(pin.position.x, Math.abs(y) > 0.01 ? 0 : -0.045, Math.abs(y) > 0.01 ? -0.045 : 0);
        if (Math.abs(y) > 0.01) clip.rotation.y = Math.PI / 2;
        grp.add(clip);

        group.add(grp);
    }

    createMPTBase() {
        const group = new THREE.Group();
        const baseW = 0.6;
        const frameH = 0.15;

        const beamL = new THREE.BoxGeometry(baseW, frameH, 0.08);
        const b1 = new THREE.Mesh(beamL, this.matBlackSteel);
        b1.position.set(0, frameH/2, baseW/2 - 0.04);
        group.add(b1);
        const b2 = b1.clone();
        b2.position.z = -baseW/2 + 0.04;
        group.add(b2);

        const beamT = new THREE.BoxGeometry(0.08, frameH, baseW - 0.16);
        const b3 = new THREE.Mesh(beamT, this.matBlackSteel);
        b3.position.set(baseW/2 - 0.04, frameH/2, 0);
        group.add(b3);
        const b4 = b3.clone();
        b4.position.x = -baseW/2 + 0.04;
        group.add(b4);

        const trussOff = 0.29 / 2;
        const spindleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12);
        const positions = [
            {x: trussOff, z: trussOff},
            {x: -trussOff, z: trussOff},
            {x: trussOff, z: -trussOff},
            {x: -trussOff, z: -trussOff}
        ];
        positions.forEach(p => {
            const s = new THREE.Mesh(spindleGeo, this.matCoupler);
            s.position.set(p.x, 0.25, p.z);
            group.add(s);
            const c = new THREE.Mesh(this.geoCoupler, this.matCoupler);
            c.rotation.x = -Math.PI/2;
            c.position.set(p.x, 0.5, p.z);
            group.add(c);
        });

        this._addOutriggers(group, baseW);

        return group;
    }

    createMPTSleeve() {
        const group = new THREE.Group();
        const outer = 0.55;
        const height = 0.6;

        const postGeo = new THREE.BoxGeometry(0.08, height, 0.08);
        const corners = [
            {x: outer/2, z: outer/2},
            {x: -outer/2, z: outer/2},
            {x: outer/2, z: -outer/2},
            {x: -outer/2, z: -outer/2}
        ];
        corners.forEach(c => {
            const post = new THREE.Mesh(postGeo, this.matBlackSteel);
            post.position.set(c.x, 0, c.z);
            group.add(post);
        });

        const beamGeo = new THREE.BoxGeometry(outer, 0.05, 0.05);
        [height/2, -height/2].forEach(y => {
            const b1 = new THREE.Mesh(beamGeo, this.matBlackSteel);
            b1.position.set(0, y, outer/2);
            group.add(b1);
            const b2 = b1.clone();
            b2.position.z = -outer/2;
            group.add(b2);
            const b3 = new THREE.Mesh(beamGeo, this.matBlackSteel);
            b3.rotation.y = Math.PI/2;
            b3.position.set(outer/2, y, 0);
            group.add(b3);
            const b4 = b3.clone();
            b4.position.x = -outer/2;
            group.add(b4);
        });

        const wheelR = 0.05;
        const wheelW = 0.04;
        const wGeo = new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 24);
        wGeo.rotateZ(Math.PI/2);

        const wOffset = 0.16;
        const wY = 0.20;
        const wheels = [
            {x: wOffset, z: 0.1, ry: 0},
            {x: -wOffset, z: 0.1, ry: 0},
            {x: 0.1, z: wOffset, ry: Math.PI/2},
            {x: 0.1, z: -wOffset, ry: Math.PI/2}
        ];
        wheels.forEach(w => {
            [wY, -wY].forEach(y => {
                const mesh = new THREE.Mesh(wGeo, this.matWheel);
                mesh.rotation.y = w.ry;
                mesh.position.set(w.x, y, w.z);
                group.add(mesh);
            });
        });

        const h40Off = 0.39 / 2;
        const faces = [
            {x: outer/2, z: 0, ry: Math.PI/2},
            {x: -outer/2, z: 0, ry: -Math.PI/2},
            {x: 0, z: outer/2, ry: 0}
        ];
        faces.forEach(f => {
            const plate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.02), this.matBlackSteel);
            plate.rotation.y = f.ry;
            plate.position.set(f.x, 0, f.z);
            group.add(plate);

            const cPos = [
                {y: h40Off, z: h40Off},
                {y: h40Off, z: -h40Off},
                {y: -h40Off, z: h40Off},
                {y: -h40Off, z: -h40Off}
            ];
            cPos.forEach(cp => {
                const c = new THREE.Mesh(this.geoCoupler, this.matCoupler);
                c.rotation.z = Math.PI/2;
                const v = new THREE.Vector3(0, cp.y, cp.z);
                v.applyAxisAngle(new THREE.Vector3(0,1,0), f.ry);
                v.add(new THREE.Vector3(f.x, 0, f.z));
                c.position.copy(v);
                group.add(c);
            });
        });

        return group;
    }

    _addOutriggers(group, baseW) {
        const len = 1.5;
        const angle = Math.PI / 4;
        const rPipe = 0.03;

        for (let i = 0; i < 4; i++) {
            const legGrp = new THREE.Group();
            const tube = new THREE.Mesh(new THREE.CylinderGeometry(rPipe, rPipe, len, 8), this.matBlackSteel);
            tube.rotation.z = Math.PI / 2;
            tube.position.x = baseW/2 + len/2;
            legGrp.add(tube);
            const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), this.matCoupler);
            jack.position.set(baseW/2 + len - 0.1, -0.2, 0);
            legGrp.add(jack);
            legGrp.rotation.y = i * (Math.PI/2) + angle;
            group.add(legGrp);
        }
    }

    _buildCouplerGeo() {
        const pts = [];
        pts.push(new THREE.Vector2(0.023, 0));
        pts.push(new THREE.Vector2(0.028, 0.005));
        pts.push(new THREE.Vector2(0.028, 0.04));
        pts.push(new THREE.Vector2(0.020, 0.07));
        pts.push(new THREE.Vector2(0, 0.07));
        return new THREE.LatheGeometry(pts, 16);
    }

    _buildEndRingGeo() {
        const outerR = 0.035;
        const innerR = 0.025;
        const shape = new THREE.Shape();
        shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
        const hole = new THREE.Path().absarc(0, 0, innerR, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        return new THREE.ExtrudeGeometry(shape, { depth: 0.02 });
    }
}