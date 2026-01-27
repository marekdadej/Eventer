// wwwroot/js/3d/prolyte/ProlyteParts.js
import { ProlyteH30V } from './ProlyteH30V.js';
import { ProlyteH40V } from './ProlyteH40V.js';
import { ProlyteH30D } from './ProlyteH30D.js';
import { MPTComponents } from './MPTComponents.js';
import { ProlyteAccessories } from './ProlyteAccessories.js';

export class ProlyteParts {
    constructor() {
        this.h30v = new ProlyteH30V();
        this.h40v = new ProlyteH40V();
        this.h30d = new ProlyteH30D();
        this.comp = new MPTComponents();
        this.acc = new ProlyteAccessories();
    }
    
    // Metody proxy dla wygody
    createMast(len) { return this.h30v.create(len); }
    createMainTruss(len) { return this.h40v.create(len); }
    createRafter(len) { return this.h30d.create(len); }
    createBase() { return this.comp.createBase(); }
    createSleeve() { return this.comp.createSleeveBlock(); }
    createTop() { return this.comp.createTopSection(); }
    createRidgeAssembly(h) { return this.acc.createRidgeSupportAssembly(h); }
    createBoxCorner() { return this.acc.createBoxCorner40(); }
}