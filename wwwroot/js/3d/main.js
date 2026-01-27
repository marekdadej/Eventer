import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// =============================================================================
// IMPORTS - SYSTEMY KONSTRUKCYJNE
// =============================================================================

// Systemy znajdujące się w tym samym folderze co main.js (folder '3d')
import { ProlyteMPT } from './ProlyteMPT.js';
import { StageFloorSystem } from './StageFloorSystem.js';
import { FohSystem } from './FohSystem.js';

// Systemy Layher (folder '3d/layher')
import { LayherRoof } from './layher/LayherRoof.js';

// =============================================================================
// GLOBAL VARIABLES & CONFIG
// =============================================================================

let app = null;

const RENDER_SETTINGS = {
    antialias: true,
    shadowMapType: THREE.PCFSoftShadowMap,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.2,
    clearColor: 0xe0e0e0 // Studio grey
};

// =============================================================================
// CORE APPLICATION CLASS
// =============================================================================

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
        // 1. Scena i Kamera
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(30, 20, 40);

        // 2. Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: RENDER_SETTINGS.antialias, 
            preserveDrawingBuffer: true 
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

        // 3. Kontrolery
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 300;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05;

        // 4. Środowisko startowe
        this.setupEnvironment('mono');

        // 5. Event Listeners
        window.addEventListener('resize', this.onResize.bind(this));
    }

    setupEnvironment(mode = 'mono') {
        this.currentEnv = mode;

        // Sprzątanie
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
        
        // Reset świateł środowiskowych
        if (this.lights.hemi) this.scene.remove(this.lights.hemi);
        if (this.lights.dir) this.scene.remove(this.lights.dir);

        const planeGeo = new THREE.PlaneGeometry(400, 400);

        if (mode === 'natural') {
            // --- TRYB NATURALNY ---
            this.scene.background = new THREE.Color(0x87ceeb);
            this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);

            const groundMat = new THREE.MeshStandardMaterial({
                color: 0x3d8c40,
                roughness: 0.9,
                metalness: 0.0
            });
            this.ground = new THREE.Mesh(planeGeo, groundMat);
            this.ground.rotation.x = -Math.PI / 2;
            this.ground.position.y = -0.01;
            this.ground.receiveShadow = true;
            this.scene.add(this.ground);

            const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
            hemi.position.set(0, 100, 0);
            this.scene.add(hemi);
            this.lights.hemi = hemi;

            const dir = new THREE.DirectionalLight(0xffeebb, 2.5);
            dir.position.set(60, 100, 60);
            dir.castShadow = true;
            dir.shadow.camera.left = -100;
            dir.shadow.camera.right = 100;
            dir.shadow.camera.top = 100;
            dir.shadow.camera.bottom = -100;
            dir.shadow.mapSize.width = 4096;
            dir.shadow.mapSize.height = 4096;
            this.scene.add(dir);
            this.lights.dir = dir;

        } else {
            // --- TRYB STUDIO (MONO) ---
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
            hemi.position.set(0, 50, 0);
            this.scene.add(hemi);
            this.lights.hemi = hemi;

            const dir = new THREE.DirectionalLight(0xffdfba, 1.5);
            dir.position.set(30, 50, 20);
            dir.castShadow = true;
            dir.shadow.camera.left = -50;
            dir.shadow.camera.right = 50;
            dir.shadow.camera.top = 50;
            dir.shadow.camera.bottom = -50;
            dir.shadow.mapSize.width = 4096;
            dir.shadow.mapSize.height = 4096;
            this.scene.add(dir);
            this.lights.dir = dir;
        }
    }

    resetSystems() {
        Object.values(this.systems).forEach(system => {
            if (system) {
                // Jeśli system ma metodę clear() (np. do dispose geometrii)
                if (typeof system.clear === 'function') system.clear();
                // Usunięcie grupy ze sceny
                if (system.group) this.scene.remove(system.group);
            }
        });
        this.systems = { floor: null, roof: null, foh: null };
    }

    updateScene(data) {
        console.log("Aktualizacja sceny - Dane:", data);

        this.resetSystems();

        const mainType = data.MainType || 'stageWithRoof';

        // Aktualizacja środowiska
        const env = data.envMode || 'mono';
        if (env !== this.currentEnv) {
            this.setupEnvironment(env);
        }

        // --- KONFIGURACJA PODSTAWOWA ---
        const stageConfig = {
            width: parseFloat(data.StageWidth) || 12.42,
            depth: parseFloat(data.StageDepth) || 10.35,
            height: parseFloat(data.StageHeight) || 1.5,
            floorType: data.floorType || 'layher'
        };

        // Zawsze budujemy podłogę
        this.systems.floor = new StageFloorSystem(this.scene);
        this.systems.floor.build(stageConfig);

        // --- GŁÓWNA LOGIKA KONSTRUKCJI ---
        if (mainType === 'stageWithRoof' || mainType === 'stageNoRoof') {
            const includeRoof = mainType === 'stageWithRoof' || data.includeRoof === true;

            // Dach
            if (includeRoof) {
                const roofType = data.roofType || 'prolyte';

                if (roofType === 'prolyte') {
                    this.systems.roof = new ProlyteMPT(this.scene);
                    this.systems.roof.build({
                        width: stageConfig.width + 2,
                        depth: stageConfig.depth + 2,
                        height: parseFloat(data.roofClearance) || 7.0,
                        variant: data.prolyteVariant || 'ground',
                        hasScrim: data.prolyteScrim === true,
                        addBallast: data.showMausery === true
                    });
                } else if (roofType === 'layher') {
                    // LayherRoof importowany z ./layher/LayherRoof.js
                    this.systems.roof = new LayherRoof(this.scene);
                    // Opcjonalnie: ustawienie pozycji Y dachu, jeśli nie jest to obsłużone wewnątrz klasy
                    this.systems.roof.group.position.y = stageConfig.height;
                    
                    this.systems.roof.build({
                        width: stageConfig.width,
                        depth: stageConfig.depth,
                        height: parseFloat(data.roofClearance) || 7.0
                    });
                }
            }

            // FOH
            if (data.includeFoh === true) {
                this.systems.foh = new FohSystem(this.scene);
                this.systems.foh.build({
                    width: parseFloat(data.fohWidth) || 4.14,
                    depth: parseFloat(data.fohDepth) || 4.14,
                    level: data.fohType === 'twoStory' ? 2 : 1,
                    dist: parseFloat(data.fohDist) || 20,
                    scrim: data.fohScrim === true,
                    hasTower: data.fohTower === true,
                    towerDepth: parseFloat(data.towerDepth) || 4.14,
                    towerOffset: parseFloat(data.towerOffset) || 0
                });
            }

        } else if (mainType === 'layherTower') {
            // Przykład: sama wieża Layher (nadpisanie konfiguracji)
            stageConfig.height = 10.0; // Przykładowa wysokość
            // Tutaj można wywołać specyficzny builder dla wieży, jeśli istnieje
            this.systems.floor.build(stageConfig); // Tymczasowo używamy floorSystem
            
        } else if (mainType === 'ledWall') {
            // Konstrukcja pod LED
            stageConfig.width = 14.49;
            stageConfig.depth = 2.07;
            stageConfig.height = 8.0;
            this.systems.floor.build(stageConfig);
        }

        this.fitCameraToScene();
    }

    fitCameraToScene() {
        // Obliczanie BoundingBox dla całej sceny
        // Uwaga: Może obejmować ziemię/siatkę jeśli nie są ignorowane
        // Lepiej byłoby liczyć bbox tylko dla this.systems.*.group
        const box = new THREE.Box3();
        
        Object.values(this.systems).forEach(sys => {
            if (sys && sys.group) {
                box.expandByObject(sys.group);
            }
        });

        if (box.isEmpty()) {
            // Fallback, jeśli scena pusta
            this.camera.position.set(30, 20, 40);
            this.controls.target.set(0, 5, 0);
            this.controls.update();
            return;
        }

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Dopasowanie kamery
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let distance = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        distance *= 1.5; // Margines

        const direction = new THREE.Vector3()
            .subVectors(this.camera.position, this.controls.target)
            .normalize()
            .multiplyScalar(distance);

        this.controls.target.copy(center);
        this.camera.position.copy(center).add(direction);
        this.controls.update();
    }

    onResize() {
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

// =============================================================================
// EXPORTS & BRIDGE (Dla komunikacji z UI)
// =============================================================================

export function initApp(containerId) {
    if (app) return;
    try {
        app = new App3D(containerId);
        console.log("3D Engine Initialized.");
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