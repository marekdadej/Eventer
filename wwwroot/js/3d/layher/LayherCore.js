import * as THREE from 'three';
// POPRAWKA 1: Importujemy wszystko jako 'BufferGeometryUtils'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class LayherPartsBase {
    constructor() {
        this.initMaterials();
        this.initGeometries();
        this.cache = {};
    }

    initMaterials() {
        this.matGalvNew = new THREE.MeshStandardMaterial({
            color: 0xf0f4f8,
            metalness: 0.65,
            roughness: 0.25
        });
        this.matGalvOld = new THREE.MeshStandardMaterial({
            color: 0x8c969d,
            metalness: 0.4,
            roughness: 0.7
        });
        this.matCastSteel = new THREE.MeshStandardMaterial({
            color: 0x7a848f,
            metalness: 0.5,
            roughness: 0.6
        });
        this.matHighSteel = new THREE.MeshStandardMaterial({
            color: 0x9caab5,
            metalness: 0.8,
            roughness: 0.35
        });
        this.matAlu = new THREE.MeshStandardMaterial({
            color: 0xdce3e8,
            metalness: 0.6,
            roughness: 0.4
        });
        this.matPlywoodEvent = new THREE.MeshStandardMaterial({
            color: 0x3d2e24,
            roughness: 0.9,
            metalness: 0.05,
            bumpScale: 0.02
        });
        this.matPlywoodRobust = new THREE.MeshStandardMaterial({
            color: 0x8f6b4e,
            roughness: 0.8,
            metalness: 0.0
        });
        this.matPlasticRed = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            roughness: 0.5,
            metalness: 0.1
        });
        this.matPlasticYellow = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.7,
            metalness: 0.0
        });
        this.matWoodRaw = new THREE.MeshStandardMaterial({
            color: 0x8b5a2b,
            roughness: 0.9
        });
        this.matSticker = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.matStickerRed = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
        this.matCoupler = this.matCastSteel; // Alias dla złączy
    }

    initGeometries() {
        this.geoRosette = this._buildRosetteGeo();
        this.geoWedgeHead = this._buildWedgeHeadGeo();
        this.geoWedge = this._buildWedgeGeo();
        this.geoSpigot = new THREE.CylinderGeometry(0.022, 0.022, 0.20, 16);
        this.geoBoltHead = new THREE.CylinderGeometry(0.008, 0.008, 0.005, 6);
        this.geoRivet = new THREE.CylinderGeometry(0.004, 0.004, 0.002, 8);
        this.geoEventHook = this._buildEventHookGeometry(0.07);
        this.geoEventProfile = this._buildEventProfileShape();
        this.geoSwivelCoupler = this._buildSwivelCouplerGeo();
        this.geoWingNut = this._buildWingNutGeo();
        this.geoPerforationHole = new THREE.CylinderGeometry(0.005, 0.005, 0.04, 8);
        
        // Złącze stałe (półzłącze) używane np. w OProfileConnector
        this.geoCoupler = this._buildSwivelCouplerGeo(); 
    }

    // --- Helpery (Metody pomocnicze używane przez klasy potomne) ---

    _addWedgeHeads(group, length, rotated = false) {
        const hL = new THREE.Mesh(this.geoWedgeHead, this.matCastSteel);
        hL.position.x = 0;
        group.add(hL);
        const hR = hL.clone();
        hR.rotation.y = Math.PI;
        hR.position.x = length;
        group.add(hR);
        const wL = new THREE.Mesh(this.geoWedge, this.matHighSteel);
        wL.position.set(0.025, 0.045, 0);
        group.add(wL);
        const wR = wL.clone();
        wR.position.x = length - 0.025;
        group.add(wR);
    }

    _addSwivelCouplers(group, length) {
        const cGeo = this.geoSwivelCoupler;
        const cL = new THREE.Mesh(cGeo, this.matCastSteel);
        cL.position.x = 0.06;
        group.add(cL);
        const cR = cL.clone();
        cR.position.x = length - 0.06;
        group.add(cR);
    }

    _addTube(group, x1, y1, z1, x2, y2, z2, r) {
        const v1 = new THREE.Vector3(x1, y1, z1);
        const v2 = new THREE.Vector3(x2, y2, z2);
        const len = v1.distanceTo(v2);
        const geo = new THREE.CylinderGeometry(r, r, len, 8);
        geo.rotateX(Math.PI / 2);
        const mesh = new THREE.Mesh(geo, this.matGalvNew);
        const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
        mesh.position.copy(mid);
        mesh.lookAt(v2);
        group.add(mesh);
    }

    // --- Buildery Geometrii ---

    _buildRosetteGeo() {
        const outerR = 0.055;
        const innerR = 0.025;
        const holeSmallR = 0.007;
        const holeLargeR = 0.012;
        const holeDist = 0.04;
        const shape = new THREE.Shape();
        shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
        const innerHole = new THREE.Path().absarc(0, 0, innerR, 0, Math.PI * 2, true);
        shape.holes.push(innerHole);
        for (let i = 0; i < 8; i++) {
            const ang = i * Math.PI / 4;
            const r = (i % 2 === 0) ? holeSmallR : holeLargeR;
            const hole = new THREE.Path().absarc(Math.cos(ang) * holeDist, Math.sin(ang) * holeDist, r, 0, Math.PI * 2, true);
            shape.holes.push(hole);
        }
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelSize: 0.001, bevelThickness: 0.001 });
        geo.rotateX(Math.PI / 2);
        geo.translate(0, -0.004, 0);
        return geo;
    }

    _buildWedgeHeadGeo() {
        const shape = new THREE.Shape();
        shape.moveTo(0, -0.028);
        shape.lineTo(0.055, -0.028);
        shape.lineTo(0.055, 0.035);
        shape.lineTo(0, 0.035);
        shape.lineTo(0, 0.015);
        shape.quadraticCurveTo(0.022, 0, 0, -0.015);
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002 });
        geo.translate(0, 0, -0.01);
        return geo;
    }

    _buildWedgeGeo() {
        const geo = new THREE.BoxGeometry(0.006, 0.11, 0.03);
        geo.rotateZ(-0.15);
        return geo;
    }

    _buildEventProfileShape() {
        const shape = new THREE.Shape();
        const h = 0.086;
        const w = 0.048;
        const th = 0.003;
        shape.moveTo(-w/2, 0);
        shape.lineTo(-w/2, h);
        shape.lineTo(-w/2 + th, h - th);
        shape.lineTo(-w/2 + th, th);
        shape.lineTo(w/2 - th, th);
        shape.lineTo(w/2 - th, h - th);
        shape.lineTo(w/2, h);
        shape.lineTo(w/2, 0);
        shape.lineTo(w/2 - 0.008, 0.008);
        shape.lineTo(-w/2 + 0.008, 0.008);
        shape.closePath();
        return shape;
    }

    _buildEventHookGeometry(width) {
        const shape = new THREE.Shape();
        shape.moveTo(0,0);
        shape.lineTo(0.045,0);
        shape.lineTo(0.045,0.06);
        shape.lineTo(0,0.06);
        shape.absarc(0.024, 0.035, 0.025, Math.PI, 0, true);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelSize: 0.002 });
    }

    _buildUProfileShape(variant) {
        const shape = new THREE.Shape();
        const w = 0.048; 
        const h = (variant === 'event') ? 0.086 : 0.054;
        const th = 0.0035;
        shape.moveTo(-w/2, h/2);
        shape.lineTo(-w/2, -h/2);
        shape.lineTo(w/2, -h/2);
        shape.lineTo(w/2, h/2);
        shape.lineTo(w/2 - th, h/2);
        shape.lineTo(w/2 - th, -h/2 + th);
        shape.lineTo(-w/2 + th, -h/2 + th);
        shape.lineTo(-w/2 + th, h/2);
        shape.closePath();
        return shape;
    }

    _buildWingNutGeo() {
        const geometries = [];
        const core = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12);
        geometries.push(core);
        const handle = new THREE.BoxGeometry(0.25, 0.03, 0.03);
        geometries.push(handle);
        const handle2 = handle.clone();
        handle2.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2));
        geometries.push(handle2);
        
        // POPRAWKA 2: Zmiana nazwy funkcji na mergeGeometries
        return BufferGeometryUtils.mergeGeometries(geometries);
    }

    _buildSwivelCouplerGeo() {
        const geometries = [];
        const body = new THREE.BoxGeometry(0.12, 0.06, 0.04);
        geometries.push(body);
        const plate = new THREE.CylinderGeometry(0.05, 0.05, 0.01, 16);
        plate.translate(0, 0.03, 0);
        geometries.push(plate);
        const bolt = new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8);
        bolt.translate(0, 0.04, 0);
        geometries.push(bolt);
        
        // POPRAWKA 2: Zmiana nazwy funkcji na mergeGeometries
        return BufferGeometryUtils.mergeGeometries(geometries);
    }
}