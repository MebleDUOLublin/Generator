// src/apps/domator/main.js

const DomatorApp = {
    // App state will be stored here
};

DomatorApp.init = function() {
    this.VAT_RATE = 0.23;
    this.products = [];
    this.autosaveTimer = null;

    this.cacheElements();
    this.bindEvents();
    this.loadState();
    this.updateUI();

    console.log("Domator App Initialized");
};

DomatorApp.cacheElements = function() {
    this.elements = {
        productCount: document.getElementById('domatorProductCount'),
        sumNetto: document.getElementById('domatorSumNetto'),
        sumBrutto: document.getElementById('domatorSumBrutto'),
        status: document.getElementById('domatorStatus'),
        clientName: document.getElementById('domatorClientName'),
        street: document.getElementById('domatorStreet'),
        postCode: document.getElementById('domatorPostCode'),
        city: document.getElementById('domatorCity'),
        phone: document.getElementById('domatorPhone'),
        email: document.getElementById('domatorEmail'),
        notes: document.getElementById('domatorNotes'),
        productsBody: document.getElementById('domatorProductsBody'),
        totalNetto: document.getElementById('domatorTotalNetto'),
        totalBrutto: document.getElementById('domatorTotalBrutto'),
        addBtn: document.getElementById('addDomatorProductBtn'),
        clearBtn: document.getElementById('domatorClearBtn'),
        saveBtn: document.getElementById('domatorSaveBtn'),
    };
};

DomatorApp.bindEvents = function() {
    this.elements.addBtn.addEventListener('click', () => this.addProduct());
    this.elements.clearBtn.addEventListener('click', () => this.clearForm());
    this.elements.saveBtn.addEventListener('click', () => this.saveState());

    // Autosave on input change for address fields
    const fieldsToAutosave = ['clientName', 'street', 'postCode', 'city', 'phone', 'email', 'notes'];
    fieldsToAutosave.forEach(id => {
        this.elements[id].addEventListener('input', () => this.scheduleAutosave());
    });
};

DomatorApp.addProduct = function(product = { sku: '', ean: '', name: '', qty: 1, netto: 0 }) {
    this.products.push(product);
    this.updateUI();
    this.scheduleAutosave();
};

DomatorApp.removeProduct = function(index) {
    this.products.splice(index, 1);
    this.updateUI();
    this.scheduleAutosave();
};

DomatorApp.updateUI = function() {
    this.elements.productsBody.innerHTML = '';
    let totalNet = 0;

    this.products.forEach((p, index) => {
        const row = document.createElement('tr');
        const netto = parseFloat(p.netto) || 0;
        const brutto = netto * (1 + this.VAT_RATE);
        totalNet += netto * (parseInt(p.qty) || 0);

        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td><input type="text" class="form-input-table" data-index="${index}" data-field="sku" value="${p.sku}"></td>
            <td><input type="text" class="form-input-table" data-index="${index}" data-field="ean" value="${p.ean}"></td>
            <td><input type="text" class="form-input-table" data-index="${index}" data-field="name" value="${p.name}"></td>
            <td class="text-center"><input type="number" class="form-input-table text-center" data-index="${index}" data-field="qty" value="${p.qty}"></td>
            <td class="text-right"><input type="text" class="form-input-table text-right" data-index="${index}" data-field="netto" value="${netto.toFixed(2)}"></td>
            <td class="text-right"><input type="text" class="form-input-table text-right" data-index="${index}" data-field="brutto" value="${brutto.toFixed(2)}"></td>
            <td class="text-center"><button class="btn btn-sm btn-danger" data-index="${index}">&times;</button></td>
        `;

        this.elements.productsBody.appendChild(row);
    });

    const totalBrutto = totalNet * (1 + this.VAT_RATE);

    this.elements.productCount.textContent = this.products.length;
    this.elements.sumNetto.textContent = `${totalNet.toFixed(2)} zł`;
    this.elements.sumBrutto.textContent = `${totalBrutto.toFixed(2)} zł`;
    this.elements.totalNetto.textContent = `${totalNet.toFixed(2)} zł`;
    this.elements.totalBrutto.textContent = `${totalBrutto.toFixed(2)} zł`;

    // Add event listeners for new inputs
    this.elements.productsBody.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => this.handleProductInputChange(e));
        input.addEventListener('change', (e) => this.handleProductPriceChange(e));
    });
    this.elements.productsBody.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => this.removeProduct(e.target.dataset.index));
    });
};

DomatorApp.handleProductInputChange = function(e) {
    const { index, field } = e.target.dataset;
    this.products[index][field] = e.target.value;
    this.scheduleAutosave();
};

DomatorApp.handleProductPriceChange = function(e) {
    const { index, field } = e.target.dataset;
    let value = parseFloat(e.target.value.replace(',', '.')) || 0;

    if (field === 'netto') {
        this.products[index].netto = value;
    } else if (field === 'brutto') {
        this.products[index].netto = value / (1 + this.VAT_RATE);
    }

    this.updateUI(); // Recalculate and redraw all prices
};

DomatorApp.scheduleAutosave = function() {
    this.elements.status.textContent = '💾 Zapisywanie...';
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
        this.saveState();
        this.elements.status.textContent = '✅ Zapisano';
    }, 1500);
};

DomatorApp.saveState = function() {
    const state = {
        clientName: this.elements.clientName.value,
        street: this.elements.street.value,
        postCode: this.elements.postCode.value,
        city: this.elements.city.value,
        phone: this.elements.phone.value,
        email: this.elements.email.value,
        notes: this.elements.notes.value,
        products: this.products
    };
    localStorage.setItem('domatorAppState', JSON.stringify(state));
    console.log("Domator state saved.");
};

DomatorApp.loadState = function() {
    const state = JSON.parse(localStorage.getItem('domatorAppState'));
    if (state) {
        this.elements.clientName.value = state.clientName || '';
        this.elements.street.value = state.street || '';
        this.elements.postCode.value = state.postCode || '';
        this.elements.city.value = state.city || '';
        this.elements.phone.value = state.phone || '';
        this.elements.email.value = state.email || '';
        this.elements.notes.value = state.notes || '';
        this.products = state.products || [];
        console.log("Domator state loaded.");
    }
};

DomatorApp.clearForm = function() {
    if (confirm('Czy na pewno chcesz wyczyścić cały formularz? Ta operacja jest nieodwracalna.')) {
        localStorage.removeItem('domatorAppState');
        this.products = [];
        const fieldsToClear = ['clientName', 'street', 'postCode', 'city', 'phone', 'email', 'notes'];
        fieldsToClear.forEach(id => this.elements[id].value = '');
        this.updateUI();
        this.elements.status.textContent = '📝 Edycja';
        console.log("Domator form cleared.");
    }
};

window.DomatorApp = {
  init: DomatorApp.init.bind(DomatorApp)
};
