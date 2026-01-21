// src/apps/domator/main.js
(function() {
    const DomatorApp = {
        VAT_RATE: 0.23,
        products: [],
        autosaveTimer: null,
        elements: {},

        init: function() {
            this.cacheElements();
            this.bindEvents();
            this.loadState();
            console.log("Domator App Initialized");
        },

        cacheElements: function() {
            const ids = ['productCount', 'sumNetto', 'sumBrutto', 'status', 'clientName', 'street', 'postCode', 'city', 'phone', 'email', 'notes', 'productsBody', 'totalNetto', 'totalBrutto', 'addBtn', 'clearBtn', 'saveBtn'];
            ids.forEach(id => this.elements[id] = document.getElementById(`domator${id.charAt(0).toUpperCase() + id.slice(1)}`));
        },

        bindEvents: function() {
            this.elements.addBtn.addEventListener('click', () => this.addProduct());
            this.elements.clearBtn.addEventListener('click', () => this.clearForm());
            this.elements.saveBtn.addEventListener('click', () => this.saveState(true));

            const fieldsToAutosave = ['clientName', 'street', 'postCode', 'city', 'phone', 'email', 'notes'];
            fieldsToAutosave.forEach(id => {
                if(this.elements[id]) {
                    this.elements[id].addEventListener('input', () => this.scheduleAutosave());
                }
            });
        },

        addProduct: function(product = { sku: '', ean: '', name: '', qty: 1, netto: 0 }) {
            this.products.push(product);
            this.updateUI();
            this.scheduleAutosave();
        },

        removeProduct: function(index) {
            this.products.splice(index, 1);
            this.updateUI();
            this.scheduleAutosave();
        },

        updateUI: function() {
            if (!this.elements.productsBody) return;
            this.elements.productsBody.innerHTML = '';
            let totalNet = 0;
            this.products.forEach((p, index) => {
                const row = document.createElement('tr');
                const netto = parseFloat(p.netto) || 0;
                totalNet += netto * (parseInt(p.qty) || 0);
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td><input type="text" class="form-input" data-index="${index}" data-field="name" value="${p.name}"></td>
                    <td><input type="number" class="form-input" data-index="${index}" data-field="qty" value="${p.qty}"></td>
                    <td><input type="text" class="form-input" data-index="${index}" data-field="netto" value="${netto.toFixed(2)}"></td>
                    <td><button class="btn btn-danger" data-index="${index}">&times;</button></td>
                `;
                this.elements.productsBody.appendChild(row);
            });
            const totalBrutto = totalNet * (1 + this.VAT_RATE);
            if(this.elements.sumNetto) this.elements.sumNetto.textContent = `${totalNet.toFixed(2)} zł`;
            if(this.elements.sumBrutto) this.elements.sumBrutto.textContent = `${totalBrutto.toFixed(2)} zł`;
            this.elements.productsBody.querySelectorAll('input, button').forEach(el => {
                el.addEventListener('input', (e) => this.handleProductInputChange(e));
                if (el.tagName === 'BUTTON') el.addEventListener('click', (e) => this.removeProduct(e.target.dataset.index));
            });
        },

        handleProductInputChange: function(e) {
            const { index, field } = e.target.dataset;
            this.products[index][field] = e.target.value;
            if(field === 'netto') this.updateUI(); // Recalculate totals
            this.scheduleAutosave();
        },

        scheduleAutosave: function() {
            if(!this.elements.status) return;
            this.elements.status.textContent = '💾 Zapisywanie...';
            clearTimeout(this.autosaveTimer);
            this.autosaveTimer = setTimeout(() => this.saveState(), 1500);
        },

        saveState: async function(manual = false) {
            const state = {
                id: 'domator_state',
                clientName: this.elements.clientName?.value,
                products: this.products
            };
            try {
                await PesteczkaOS.core.StorageSystem.db.set('domator', state);
                if(this.elements.status) this.elements.status.textContent = '✅ Zapisano';
                if (manual) PesteczkaOS.core.UI.Feedback.toast('Zapisano stan.', 'success');
            } catch (error) {
                if(this.elements.status) this.elements.status.textContent = '❌ Błąd zapisu';
                if (manual) PesteczkaOS.core.UI.Feedback.show('Błąd', 'Nie udało się zapisać stanu.', 'error');
            }
        },

        loadState: async function() {
            const state = await PesteczkaOS.core.StorageSystem.db.get('domator', 'domator_state');
            if (state) {
                if(this.elements.clientName) this.elements.clientName.value = state.clientName || '';
                this.products = state.products || [];
                this.updateUI();
            }
        },

        clearForm: async function() {
            if (await PesteczkaOS.core.UI.Feedback.confirm('Czy na pewno chcesz wyczyścić formularz?')) {
                await PesteczkaOS.core.StorageSystem.db.delete('domator', 'domator_state');
                this.products = [];
                if(this.elements.clientName) this.elements.clientName.value = '';
                this.updateUI();
                if(this.elements.status) this.elements.status.textContent = '📝 Edycja';
            }
        }
    };

    window.DomatorApp = {
      init: DomatorApp.init.bind(DomatorApp)
    };
})();
