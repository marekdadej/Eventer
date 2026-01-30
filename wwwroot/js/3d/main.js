import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ProlyteMPT } from './ProlyteMPT.js';
import { StageFloorSystem } from './StageFloorSystem.js';
import { FohSystem } from './FohSystem.js';
import { LayherRoof } from './layher/LayherRoof.js';


let app = null;

const RENDER_SETTINGS = {
    antialias: true,
    shadowMapType: THREE.PCFSoftShadowMap,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.2,
    clearColor: 0xe0e0e0 
};

class App3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) throw new Error(`Container ${containerId} not found`);

        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.lights = {};
        this.ground = null;
        this.grid = null;

        this.systems = {
            floor: null,
            roof: null,
            foh: null
        };

        this.currentEnv = 'mono';

        this.init();
        this.animate();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(30, 20, 40);

        this.renderer = new THREE.WebGLRenderer({ 
            antialias: RENDER_SETTINGS.antialias, 
            preserveDrawingBuffer: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = RENDER_SETTINGS.shadowMapType;
        this.renderer.outputColorSpace = RENDER_SETTINGS.outputColorSpace;
        this.renderer.toneMapping = RENDER_SETTINGS.toneMapping;
        this.renderer.toneMappingExposure = RENDER_SETTINGS.toneMappingExposure;

        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 300;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

        this.setupEnvironment('mono');

        this.resizeObserver = new ResizeObserver(() => this.onResize());
        this.resizeObserver.observe(this.container);
    }

    setupEnvironment(mode = 'mono') {
        this.currentEnv = mode;

        if (this.ground) {
            this.scene.remove(this.ground);
            if (this.ground.geometry) this.ground.geometry.dispose();
            if (this.ground.material) this.ground.material.dispose();
            this.ground = null;
        }
        if (this.grid) {
            this.scene.remove(this.grid);
            this.grid = null;
        }
        
        if (this.lights.hemi) this.scene.remove(this.lights.hemi);
        if (this.lights.dir) this.scene.remove(this.lights.dir);

        const planeGeo = new THREE.PlaneGeometry(400, 400);

        if (mode === 'natural') {
            this.scene.background = new THREE.Color(0x87ceeb);
            this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);

            const groundMat = new THREE.MeshStandardMaterial({
                color: 0x228940,
                roughness: 0.9,
                metalness: 0.0
            });
            this.ground = new THREE.Mesh(planeGeo, groundMat);
            this.ground.rotation.x = -Math.PI / 2;
            this.ground.position.y = -0.01;
            this.ground.receiveShadow = true;
            this.scene.add(this.ground);

            const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
            this.scene.add(hemi);
            this.lights.hemi = hemi;

            const dir = new THREE.DirectionalLight(0xffeebb, 2.5);
            dir.position.set(60, 100, 60);
            dir.castShadow = true;
            this.scene.add(dir);
            this.lights.dir = dir;

        } else {
            this.scene.background = new THREE.Color(RENDER_SETTINGS.clearColor);
            this.scene.fog = new THREE.Fog(RENDER_SETTINGS.clearColor, 30, 200);

            const groundMat = new THREE.MeshStandardMaterial({
                color: 0xdddddd,
                roughness: 0.8,
                metalness: 0.1
            });
            this.ground = new THREE.Mesh(planeGeo, groundMat);
            this.ground.rotation.x = -Math.PI / 2;
            this.ground.position.y = -0.01;
            this.ground.receiveShadow = true;
            this.scene.add(this.ground);

            this.grid = new THREE.GridHelper(200, 100, 0x888888, 0xbbbbbb);
            this.grid.position.y = 0.01;
            this.scene.add(this.grid);

            const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
            this.scene.add(hemi);
            this.lights.hemi = hemi;

            const dir = new THREE.DirectionalLight(0xffdfba, 1.5);
            dir.position.set(30, 50, 20);
            dir.castShadow = true;
            this.scene.add(dir);
            this.lights.dir = dir;
        }
    }

    resetSystems() {
        Object.values(this.systems).forEach(system => {
            if (system) {
                if (typeof system.clear === 'function') system.clear();
                if (system.group) this.scene.remove(system.group);
            }
        });
        this.systems = { floor: null, roof: null, foh: null };
    }

    updateScene(data) {
        this.resetSystems();

        const getVal = (key) => {
            return data[key] !== undefined ? data[key] : data[key.charAt(0).toLowerCase() + key.slice(1)];
        };

        const getBool = (key) => {
            let val = getVal(key);
            if (val === true || val === 'true') return true;
            return false;
        };

        const mainType = getVal('MainType') || 'stageWithRoof';

        const env = getVal('EnvMode') || 'mono';
        if (env !== this.currentEnv) {
            this.setupEnvironment(env);
        }

        const stageConfig = {
            width: parseFloat(getVal('StageWidth')) || 10.35,
            depth: parseFloat(getVal('StageDepth')) || 8.28,
            height: parseFloat(getVal('StageHeight')) || 1.5,
            floorType: getVal('FloorType') || 'layher'
        };

        this.systems.floor = new StageFloorSystem(this.scene);
        this.systems.floor.build(stageConfig);

        if (mainType === 'stageWithRoof' || mainType === 'stageNoRoof') {
            const includeRoof = mainType === 'stageWithRoof' || getBool('IncludeRoof');

            if (includeRoof) {
                const roofType = getVal('RoofType') || 'prolyte';

                const showScrim = data.hasScrim !== undefined 
                    ? (data.hasScrim === true || data.hasScrim === 'true')
                    : (getBool('prolyteScrim') || getBool('layherScrim'));

                if (roofType === 'prolyte') {
                    this.systems.roof = new ProlyteMPT(this.scene);
                    this.systems.roof.build({
                        width: stageConfig.width + 2,
                        depth: stageConfig.depth + 2,
                        height: parseFloat(getVal('RoofClearance')) || 7.0,
                        variant: getVal('ProlyteVariant') || 'standard',
                        hasScrim: showScrim, 
                        addBallast: getBool('addBallast')
                    });
                } else if (roofType === 'layher') {
                    this.systems.roof = new LayherRoof(this.scene);
                    this.systems.roof.group.position.y = stageConfig.height;
                    
                    this.systems.roof.build({
                        width: stageConfig.width,
                        depth: stageConfig.depth,
                        height: stageConfig.height, 
                        hasScrim: showScrim 
                    });
                }
            }

            if (getBool('includeFoh')) {
                this.systems.foh = new FohSystem(this.scene);
                this.systems.foh.build({
                    width: parseFloat(getVal('FohWidth')) || 4.14,
                    depth: parseFloat(getVal('FohDepth')) || 4.14,
                    level: getVal('FohType') === 'twoStory' ? 2 : (getVal('FohType') === 'threeStory' ? 3 : 1),
                    dist: parseFloat(getVal('FohDist')) || 20,
                    scrim: getBool('fohScrim'),
                    hasTower: getBool('fohTower'),
                    towerDepth: parseFloat(getVal('TowerDepth')) || 4.14,
                    towerHeight: parseFloat(getVal('TowerHeight')) || 6.0,
                    showMausery: getBool('showMausery')
                });
            }
        }

        this.fitCameraToScene();
    }

    fitCameraToScene() {
        const box = new THREE.Box3();
        let hasObjects = false;
        
        Object.values(this.systems).forEach(sys => {
            if (sys && sys.group) {
                box.expandByObject(sys.group);
                hasObjects = true;
            }
        });

        if (!hasObjects) {
            this.camera.position.set(30, 20, 40);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
            return;
        }

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        distance *= 1.5; 

        const direction = new THREE.Vector3(1, 0.6, 1).normalize();
        const newPos = center.clone().add(direction.multiplyScalar(distance));

        this.controls.target.copy(center);
        this.camera.position.copy(newPos);
        this.controls.update();
    }

    toggleGrid() {
        if (this.grid) {
            this.grid.visible = !this.grid.visible;
        }
    }

    onResize() {
        if (!this.container) return;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    getScreenshot() {
        this.renderer.render(this.scene, this.camera);
        return this.renderer.domElement.toDataURL('image/jpeg', 0.95);
    }
}

export function initApp(containerId) {
    if (app) return;
    try {
        app = new App3D(containerId);
    } catch (e) {
        console.error("3D Engine Init Error:", e);
    }
}

export function updateSceneData(data) {
    if (!app) return;
    app.updateScene(data);
}

export function getScreenshot() {
    return app ? app.getScreenshot() : null;
}

export function setEnvironment(mode) {
    if (!app) return;
    app.setupEnvironment(mode);
}

export function resetCamera() {
    if (app) app.fitCameraToScene();
}

export function toggleGrid() {
    if (app) app.toggleGrid();
}