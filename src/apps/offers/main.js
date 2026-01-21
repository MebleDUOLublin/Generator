// src/apps/offers/main.js

window.OffersApp = {
    // --- App State ---
    profile: null,
    windowEl: null,
    products: [], // Source of truth for product data
    autosaveTimer: null,
    autosaveStatus: 'idle', // idle, waiting, saving, success, error

    // --- Initialization ---
    init: function(profile, windowEl) {
        this.profile = profile;
        this.windowEl = windowEl;

        this.populateSellerForm();
        this.generateOfferNumber();
        this.setTodayDate();
        this.attachEventListeners();
        this.render();

        // Start autosave
        if (this.autosaveTimer) clearInterval(this.autosaveTimer);
        this.autosaveTimer = setInterval(() => this.autosaveOffer(), 30000); // Save every 30s
        this.setAutosaveStatus('waiting');
    },

    // --- Event Handling ---
    attachEventListeners: function() {
        const el = (selector, event, handler) => {
            this.windowEl.querySelector(selector)?.addEventListener(event, handler.bind(this));
        };

        el('#addProductBtn', 'click', () => this.addProduct());
        el('#generatePdfBtn', 'click', this.generatePDF);
        el('#saveOfferBtn', 'click', this.saveOffer);
        el('#loadOfferBtn', 'click', this.loadOffer);
        el('#clearFormBtn', 'click', this.clearForm);
        el('#generateOfferNumberBtn', 'click', this.generateOfferNumber);
        el('#setTodayDateBtn', 'click', this.setTodayDate);

        this.windowEl.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabSwitch(e));
        });

        // Listen for changes in any form field to trigger autosave
        this.windowEl.querySelector('.offers-main').addEventListener('input', () => {
            this.setAutosaveStatus('waiting');
        });
    },

    handleTabSwitch: function(event) {
        const tabButton = event.target.closest('.tab');
        if (!tabButton) return;
        const tabId = tabButton.dataset.tab;

        this.windowEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.windowEl.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tabButton.classList.add('active');
        this.windowEl.querySelector(`#${tabId}-tab`).classList.add('active');
    },

    // --- Data & State Management ---

    addProduct: function(data = {}) {
        const newProduct = {
            id: data.id || Date.now(),
            name: data.name || '',
            code: data.code || '',
            qty: data.qty || 1,
            price: data.price || 0,
            discount: data.discount || 0,
            desc: data.desc || '',
            image: data.image || null,
        };
        this.products.push(newProduct);
        this.render();
    },

    updateProduct: function(id, field, value) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            product[field] = value;
            this.renderSummary(); // No need to re-render the whole product list
            this.setAutosaveStatus('waiting');
        }
    },

    removeProduct: function(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.render();
    },

    duplicateProduct: function(id) {
        const original = this.products.find(p => p.id === id);
        if(original) {
            const newProduct = {...original, id: Date.now()};
            this.addProduct(newProduct);
        }
    },

    uploadProductImage: function(id, event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const product = this.products.find(p => p.id === id);
            if (product) {
                product.image = e.target.result;
                this.renderProductImage(id);
                this.setAutosaveStatus('waiting');
                UI.Feedback.toast('📸 Zdjęcie dodane', 'success');
            }
        };
        reader.readAsDataURL(file);
    },

    // --- Rendering ---

    render: function() {
        this.renderProductsList();
        this.renderSummary();
    },

    renderProductsList: function() {
        const container = this.windowEl.querySelector('#productsList');
        container.innerHTML = ''; // Clear existing

        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3 class="empty-state-title">Brak produktów</h3>
                    <p class="empty-state-desc">Kliknij "Dodaj produkt", aby rozpocząć.</p>
                </div>`;
            return;
        }

        this.products.forEach(p => {
            const card = this.createProductCard(p);
            container.appendChild(card);
        });
    },

    createProductCard: function(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.id = `product-${product.id}`;
        card.innerHTML = `
            <div class="drag-handle" draggable="true">☰</div>
            <div class="product-content-wrapper">
                <div class="product-image-zone">
                    <div class="product-image-preview" id="preview-${product.id}">📷</div>
                    <input type="file" id="upload-${product.id}" class="hidden" accept="image/*">
                </div>
                <div class="product-details">
                    <div class="form-group">
                        <label class="form-label">Nazwa produktu</label>
                        <input type="text" class="form-input" data-field="name" value="${product.name}">
                    </div>
                    <div class="form-grid-inner">
                        <div class="form-group"><label>Kod</label><input type="text" class="form-input" data-field="code" value="${product.code}"></div>
                        <div class="form-group"><label>Ilość</label><input type="number" class="form-input" data-field="qty" value="${product.qty}"></div>
                        <div class="form-group"><label>Cena netto</label><input type="number" class="form-input" data-field="price" value="${product.price}"></div>
                        <div class="form-group"><label>Rabat (%)</label><input type="number" class="form-input" data-field="discount" value="${product.discount}"></div>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Opis produktu</label>
                <textarea class="form-textarea" data-field="desc" rows="2" placeholder="• Cecha 1\n• Cecha 2">${product.desc}</textarea>
            </div>
            <div class="product-actions">
                <button class="btn btn-outline btn-sm" data-action="duplicate">📋 Duplikuj</button>
                <button class="btn btn-danger btn-sm" data-action="remove">🗑️ Usuń</button>
            </div>
        `;

        // Add event listeners
        card.querySelector('.product-image-zone').addEventListener('click', () => card.querySelector(`#upload-${product.id}`).click());
        card.querySelector(`#upload-${product.id}`).addEventListener('change', (e) => this.uploadProductImage(product.id, e));
        card.querySelector('[data-action="duplicate"]').addEventListener('click', () => this.duplicateProduct(product.id));
        card.querySelector('[data-action="remove"]').addEventListener('click', () => this.removeProduct(product.id));

        card.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', (e) => {
                const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                this.updateProduct(product.id, e.target.dataset.field, value);
            });
        });

        this.renderProductImage(product.id, card);
        return card;
    },

    renderProductImage: function(id, parentNode = this.windowEl) {
        const product = this.products.find(p => p.id === id);
        const preview = parentNode.querySelector(`#preview-${id}`);
        if (preview && product) {
            preview.innerHTML = product.image ? `<img src="${product.image}" alt="Podgląd">` : '📷';
        }
    },

    renderSummary: function() {
        const tbody = this.windowEl.querySelector('#summaryTableBody');
        tbody.innerHTML = '';
        let totalNet = 0;

        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-8">Brak produktów</td></tr>';
            return;
        }

        this.products.forEach((p, index) => {
            const netValue = p.qty * (p.price * (1 - p.discount / 100));
            totalNet += netValue;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${p.name || '<i>Brak nazwy</i>'}</td>
                <td>${p.qty}</td>
                <td>${p.price.toFixed(2)} zł</td>
                <td>${p.discount}%</td>
                <td>${netValue.toFixed(2)} zł</td>
            `;
            tbody.appendChild(row);
        });

        const vatRate = parseFloat(this.windowEl.querySelector('#vatRate').value) / 100;
        const totalVat = totalNet * vatRate;
        const totalGross = totalNet + totalVat;

        this.windowEl.querySelector('#totalNet').textContent = `${totalNet.toFixed(2)} zł`;
        this.windowEl.querySelector('#totalVat').textContent = `${totalVat.toFixed(2)} zł`;
        this.windowEl.querySelector('#totalGross').textContent = `${totalGross.toFixed(2)} zł`;
    },

    // --- Actions ---

    clearForm: async function() {
        if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić cały formularz? Niezapisane zmiany zostaną utracone.')) {
            this.products = [];
            this.generateOfferNumber();
            this.setTodayDate();
            this.render();
            UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'info');
        }
    },

    generatePDF: async function() {
        const getValue = (id) => this.windowEl.querySelector(`#${id}`).value;
        const offerData = {
            number: getValue('offerNumber'), date: getValue('offerDate'), validUntil: getValue('validUntil'),
            currency: getValue('currency'), paymentTerms: getValue('paymentTerms'), deliveryTime: getValue('deliveryTime'),
            warranty: getValue('warranty'), deliveryMethod: getValue('deliveryMethod'), notes: getValue('orderNotes'),
            buyer: { name: getValue('buyerName'), nip: getValue('buyerNIP'), address: getValue('buyerAddress'),
                     phone: getValue('buyerPhone'), email: getValue('buyerEmail') }
        };
        const sellerData = { ...this.profile, fullName: getValue('sellerName'), nip: getValue('sellerNIP'),
                             address: getValue('sellerAddress'), phone: getValue('sellerPhone'), email: getValue('sellerEmail'),
                             bankAccount: getValue('sellerBank'), sellerName: getValue('sellerContact') };

        document.getElementById('loadingOverlay')?.classList.add('show');
        try {
            const pdf = await PDFManager.generatePDF({
                orientation: getValue('pdfOrientation'), format: getValue('pdfFormat'),
                vatRate: parseFloat(getValue('vatRate')),
                seller: sellerData, products: this.products, offerData: offerData
            });
            const filename = `Oferta_${offerData.number.replace(/[\/\\?%*:|"<>]/g, '-')}.pdf`;
            PDFManager.savePDF(pdf, filename);
            UI.Feedback.toast('PDF wygenerowany pomyślnie!', 'success');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            UI.Feedback.show('Błąd PDF', 'Wystąpił błąd podczas generowania dokumentu: ' + error.message, 'error');
        } finally {
            document.getElementById('loadingOverlay')?.classList.remove('show');
        }
    },

    // --- Persistence (Save/Load/Autosave) ---

    collectOfferData: function() {
        const getValue = (id) => this.windowEl.querySelector(`#${id}`).value;
        return {
            id: getValue('offerNumber') || `offer_${Date.now()}`,
            profileKey: this.profile.key,
            offer: { number: getValue('offerNumber'), date: getValue('offerDate'), validUntil: getValue('validUntil'), currency: getValue('currency') },
            buyer: { name: getValue('buyerName'), nip: getValue('buyerNIP'), address: getValue('buyerAddress'), phone: getValue('buyerPhone'), email: getValue('buyerEmail') },
            terms: { payment: getValue('paymentTerms'), delivery: getValue('deliveryTime'), warranty: getValue('warranty'), deliveryMethod: getValue('deliveryMethod') },
            products: this.products,
            timestamp: new Date().toISOString()
        };
    },

    setAutosaveStatus: function(status) {
        this.autosaveStatus = status;
        const indicator = this.windowEl.querySelector('#autosaveStatus');
        if (!indicator) return;

        switch (status) {
            case 'waiting': indicator.innerHTML = ' zmiany...'; break;
            case 'saving': indicator.innerHTML = 'Zapisywanie...'; break;
            case 'success': indicator.innerHTML = 'Zapisano ✔'; break;
            case 'error': indicator.innerHTML = 'Błąd zapisu ❌'; break;
            default: indicator.innerHTML = '';
        }
    },

    autosaveOffer: async function() {
        if (this.autosaveStatus !== 'waiting') return;
        const offerData = this.collectOfferData();
        if (!offerData.offer.number || !offerData.buyer.name) return;

        this.setAutosaveStatus('saving');
        try {
            await StorageSystem.db.set(StorageSystem.db.STORES.offers, offerData);
            this.setAutosaveStatus('success');
        } catch (error) {
            console.error('Autosave error:', error);
            this.setAutosaveStatus('error');
        }
    },

    saveOffer: async function() {
        this.autosaveStatus = 'waiting'; // Force save
        await this.autosaveOffer();
        if (this.autosaveStatus === 'success') {
            UI.Feedback.toast('Oferta została pomyślnie zapisana.', 'success');
        }
    },

    loadOffer: async function() {
        try {
            const offers = await StorageSystem.db.getAllBy(StorageSystem.db.STORES.offers, 'profileKey', this.profile.key);
            offers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (offers.length === 0) {
                UI.Feedback.toast('Brak zapisanych ofert dla tego profilu.', 'info');
                return;
            }
            const listHTML = offers.map(o => `
                <div class="offer-history-item" data-id="${o.id}">
                    <strong class="offer-number">${o.offer.number}</strong>
                    <span>${o.buyer.name}</span>
                    <span class="text-muted">${new Date(o.timestamp).toLocaleString('pl-PL')}</span>
                </div>`).join('');
            UI.Modal.show('Wczytaj Ofertę', `<div class="offers-history-list">${listHTML}</div>`, 'loadOfferModal');
            document.querySelectorAll('.offer-history-item').forEach(item => {
                item.addEventListener('click', () => this.applyLoadedOffer(item.dataset.id));
            });
        } catch (error) {
            UI.Feedback.show('Błąd', 'Nie udało się wczytać historii ofert.', 'error');
        }
    },

    applyLoadedOffer: async function(id) {
        const offer = await StorageSystem.db.get(StorageSystem.db.STORES.offers, id);
        if (!offer) return;

        const setValue = (selector, value) => { this.windowEl.querySelector(selector).value = value || ''; };
        setValue('#offerNumber', offer.offer.number);
        setValue('#offerDate', offer.offer.date);
        setValue('#validUntil', offer.offer.validUntil);
        setValue('#currency', offer.offer.currency);
        setValue('#buyerName', offer.buyer.name);
        setValue('#buyerNIP', offer.buyer.nip);
        setValue('#buyerAddress', offer.buyer.address);
        setValue('#buyerPhone', offer.buyer.phone);
        setValue('#buyerEmail', offer.buyer.email);
        setValue('#paymentTerms', offer.terms.payment);
        setValue('#deliveryTime', offer.terms.delivery);
        setValue('#warranty', offer.terms.warranty);
        setValue('#deliveryMethod', offer.terms.deliveryMethod);

        this.products = offer.products || [];
        this.render();
        UI.Modal.hide('loadOfferModal');
        UI.Feedback.toast(`Załadowano ofertę ${id}.`, 'success');
    },

    // --- Utilities ---
    populateSellerForm: function() {
        const setValue = (id, value) => { this.windowEl.querySelector(`#${id}`).value = value || ''; };
        setValue('sellerName', this.profile.fullName);
        setValue('sellerNIP', this.profile.nip);
        setValue('sellerAddress', this.profile.address);
        setValue('sellerPhone', this.profile.phone);
        setValue('sellerEmail', this.profile.email);
        setValue('sellerContact', this.profile.sellerName);
        setValue('sellerBank', this.profile.bankAccount);
    },

    generateOfferNumber: function() {
        const d = new Date();
        const num = `OF/${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getHours()}${d.getMinutes()}${d.getSeconds()}`;
        this.windowEl.querySelector('#offerNumber').value = num;
    },

    setTodayDate: function() {
        const today = new Date();
        this.windowEl.querySelector('#offerDate').value = today.toISOString().split('T')[0];
        today.setDate(today.getDate() + 30);
        this.windowEl.querySelector('#validUntil').value = today.toISOString().split('T')[0];
    }
};
