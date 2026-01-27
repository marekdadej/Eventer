import { ProlyteH30V } from './ProlyteH30V.js';
import { ProlyteH40V } from './ProlyteH40V.js';
import { ProlyteH30D } from './ProlyteH30D.js';
import { MPTComponents } from './MPTComponents.js';
import { ProlyteAccessories } from './ProlyteAccessories.js';

export class ProlyteParts {
    constructor() {
        // Inicjalizacja klas generujących geometrię
        this.h30v = new ProlyteH30V();
        this.h40v = new ProlyteH40V();
        this.h30d = new ProlyteH30D(); // Używane do krokwi (Rafters)
        this.comp = new MPTComponents();
        this.acc = new ProlyteAccessories();
    }
    
    /**
     * Tworzy maszt wieży (Standardowo H30V)
     */
    createMast(len) { 
        return this.h30v.create(len); 
    }

    /**
     * Tworzy główne belki gridu i kalenicy (Standardowo H40V)
     * Jest to grubsza krata (39x39cm)
     */
    createMainTruss(len) { 
        return this.h40v.create(len); 
    }

    /**
     * Tworzy krokwie dachu (Rafters)
     * W systemach MPT często używa się lżejszej kraty trójkątnej H30D
     */
    createRafter(len) { 
        return this.h30d.create(len); 
    }

    /**
     * Tworzy bazę wieży MPT
     */
    createBase() { 
        return this.comp.createBase(); 
    }

    /**
     * Tworzy wózek (Sleeve Block)
     */
    createSleeve() { 
        return this.comp.createSleeveBlock(); 
    }

    /**
     * Tworzy głowicę wieży (Top Section)
     */
    createTop() { 
        return this.comp.createTopSection(); 
    }

    /**
     * Tworzy zespół podparcia kalenicy (Słupek + Adaptery)
     * @param {number} h - Wysokość słupka
     */
    createRidgeAssembly(h) { 
        return this.acc.createRidgeSupportAssembly(h); 
    }

    /**
     * Tworzy Box Corner (Kostkę) - opcjonalnie, jeśli potrzebne
     */
    createBoxCorner() { 
        return this.acc.createBoxCorner40(); 
    }
}