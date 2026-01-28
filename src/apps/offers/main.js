// src/apps/offers/main.js

/**
 * @class OffersApp
 * @description Manages the entire lifecycle and state of the Offers application.
 */
const OffersApp = {
    // ============================================
    // STATE & PROPERTIES
    // ============================================
    products: [],
    productImages: {},
    productIdCounter: 0,
    draggedElement: null,
    profile: null,
    windowEl: null,
    autosaveInterval: null,
    autosaveDebounce: null,

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initializes the application, linking it to a profile and a window element.
     * @param {object} profile - The user's profile data.
     * @param {HTMLElement} windowEl - The DOM element for the application's window.
     */
    init(profile, windowEl) {
        console.log("🚀 Offers App Initializing...");

        this.profile = profile;
        this.windowEl = windowEl;

        // Setup a debounced version of autosave for high-frequency events
        this.autosaveDebounce = this.debounce(this.autosaveOffer.bind(this), 1500);

        this.populateSellerForm();
        this.attachEventListeners();
        this.renderProductView();

        this.generateOfferNumber();
        this.setTodayDate();

        // Start a periodic autosave
        if (this.autosaveInterval) clearInterval(this.autosaveInterval);
        this.autosaveInterval = setInterval(() => this.autosaveOffer(false), 30000);

        console.log("✅ Offers App Initialized Successfully");
    },

    // ============================================
    // EVENT HANDLING & DOM MANIPULATION
    // ============================================

    /**
     * Helper to query for a single element scoped to the app's window.
     * @param {string} selector - The CSS selector.
     * @returns {HTMLElement|null}
     */
    $(selector) {
        return this.windowEl.querySelector(selector);
    },

    /**
     * Helper to query for multiple elements scoped to the app's window.
     * @param {string} selector - The CSS selector.
     * @returns {NodeListOf<HTMLElement>}
     */
    $$(selector) {
        return this.windowEl.querySelectorAll(selector);
    },

    /**
     * Attaches all primary event listeners for the application UI.
     */
    attachEventListeners() {
        // Main action buttons
        this.$('#addProductBtn')?.addEventListener('click', () => this.addProduct());
        this.$('#generatePdfBtn')?.addEventListener('click', this.generatePDF.bind(this));
        this.$('#saveOfferBtn')?.addEventListener('click', () => this.autosaveOffer(true)); // Manual save
        this.$('#loadOfferBtn')?.addEventListener('click', this.loadOffer.bind(this));

        // Quick actions
        this.$('#generateOfferNumberBtn')?.addEventListener('click', this.generateOfferNumber.bind(this));
        this.$('#setTodayDateBtn')?.addEventListener('click', this.setTodayDate.bind(this));

        // Form clearing
        this.$('#clearFormBtn')?.addEventListener('click', async () => {
            if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić cały formularz? Wszystkie niezapisane zmiany zostaną utracone.')) {
                this.clearForm();
                UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'info');
            }
        });

        // Tab switching
        this.$$('.tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (window.switchTab) window.switchTab(tab.dataset.tab, e);
            });
        });

        // Autosave triggers on input change
        this.$('.offers-main').addEventListener('input', () => {
            this.setSaveStatus('waiting');
            this.autosaveDebounce();
        });
    },

    /**
     * Populates the seller information form from the current profile.
     */
    populateSellerForm() {
        if (!this.profile) return;
        const fields = {
            'sellerName': this.profile.fullName,
            'sellerNIP': this.profile.nip,
            'sellerAddress': this.profile.address,
            'sellerPhone': this.profile.phone,
            'sellerEmail': this.profile.email,
            'sellerContact': this.profile.sellerName,
            'sellerBank': this.profile.bankAccount
        };
        for (const [id, value] of Object.entries(fields)) {
            const el = this.$(`#${id}`);
            if (el && value) el.value = value;
        }
    },

    /**
     * Clears the entire form and resets the product list.
     */
    clearForm() {
        this.products = [];
        this.productImages = {};
        this.renderProductView();
        this.updateSummary();
        this.generateOfferNumber();
        this.setTodayDate();

        // Clear buyer and offer details, but not seller info
        const fieldsToClear = [
            '#offerNumber', '#offerDate', '#validUntil', '#buyerName', '#buyerNIP',
            '#buyerAddress', '#buyerPhone', '#buyerEmail', '#orderNotes'
        ];
        fieldsToClear.forEach(selector => {
            const el = this.$(selector);
            if (el) el.value = '';
        });
    },

    // ============================================
    // PRODUCT MANAGEMENT
    // ============================================

    /**
     * Creates and returns a new product card DOM element from the template.
     * @param {number} productId - The unique ID for the new product.
     * @returns {HTMLElement} The created product card element.
     */
    createProductCard(productId) {
        const template = this.$('#product-card-template');
        if (!template) {
            console.error("Product card template not found!");
            return document.createElement('div');
        }
        const card = template.content.cloneNode(true).firstElementChild;
        card.id = `product-${productId}`;

        // Attach event listeners to the new card's elements
        card.querySelector('[data-action="delete"]').addEventListener('click', () => this.removeProduct(productId));
        card.querySelector('[data-action="duplicate"]').addEventListener('click', () => this.duplicateProduct(productId));

        const imageZone = card.querySelector('.product-image-zone');
        imageZone.addEventListener('click', () => card.querySelector('[data-role="image-input"]').click());
        imageZone.addEventListener('change', (e) => this.uploadProductImage(productId, e));

        // Drag and drop listeners
        const dragHandle = card.querySelector('.drag-handle');
        dragHandle.addEventListener('dragstart', (e) => this.dragStart(e, productId));
        card.addEventListener('dragover', this.dragOver.bind(this));
        card.addEventListener('drop', (e) => this.drop(e, productId));
        card.addEventListener('dragenter', (e) => e.preventDefault());

        return card;
    },

    /**
     * Adds a new product to the list and renders it.
     * @param {object} [productData={}] - Optional data to pre-fill the product card.
     */
    addProduct(productData = {}, options = { showToast: true }) {
        const newId = productData.id || Date.now() + this.productIdCounter++;
        this.products.push(newId);

        const productCard = this.createProductCard(newId);
        this.$('#productsList').appendChild(productCard);

        // Populate fields if data is provided
        Object.entries(productData).forEach(([key, value]) => {
            const el = productCard.querySelector(`[data-role="product-${key}"]`);
            if (el && key !== 'id') el.value = value;
        });

        if (productData.image) {
            this.productImages[newId] = productData.image;
            this.updateProductImageView(newId);
        }

        this.updateSummary();
        this.renderProductView();
        if (options.showToast) {
            UI.Feedback.toast('➕ Dodano nowy produkt', 'success');
        }
    },

    /**
     * Removes a product from the list and the DOM.
     * @param {number} productId - The ID of the product to remove.
     */
    removeProduct(productId) {
        const productCard = this.$(`#product-${productId}`);
        if (productCard) {
            productCard.remove();
            this.products = this.products.filter(id => id !== productId);
            delete this.productImages[productId];
            this.renderProductView();
            this.updateSummary();
            UI.Feedback.toast('🗑️ Usunięto produkt', 'info');
        }
    },

    /**
     * Duplicates an existing product.
     * @param {number} originalId - The ID of the product to duplicate.
     */
    duplicateProduct(originalId) {
        const originalCard = this.$(`#product-${originalId}`);
        if (!originalCard) return;

        const originalData = {
            name: originalCard.querySelector('[data-role="product-name"]').value,
            code: originalCard.querySelector('[data-role="product-code"]').value,
            qty: originalCard.querySelector('[data-role="product-qty"]').value,
            price: originalCard.querySelector('[data-role="product-price"]').value,
            discount: originalCard.querySelector('[data-role="product-discount"]').value,
            desc: originalCard.querySelector('[data-role="product-desc"]').value,
        };
        const originalImage = this.productImages[originalId];

        this.addProduct(originalData);

        if (originalImage) {
            const newId = this.products[this.products.length - 1];
            this.productImages[newId] = originalImage;
            this.updateProductImageView(newId);
        }
        UI.Feedback.toast('📋 Sklonowano produkt', 'success');
    },

    /**
     * Renders the empty state for the product list if no products are present.
     */
    renderProductView() {
        const productsListEl = this.$('#productsList');
        if (!productsListEl) return;

        let emptyStateEl = productsListEl.querySelector('.empty-state');
        if (this.products.length > 0) {
            if (emptyStateEl) emptyStateEl.remove();
        } else {
            if (!emptyStateEl) {
                 emptyStateEl = document.createElement('div');
                 emptyStateEl.className = 'empty-state';
                 emptyStateEl.innerHTML = `
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-title">Brak produktów</div>
                    <div class="empty-state-desc">Kliknij "Dodaj produkt" aby rozpocząć</div>
                 `;
                 productsListEl.innerHTML = ''; // Clear first
                 productsListEl.appendChild(emptyStateEl);
            }
        }
    },

    // ============================================
    // IMAGE HANDLING
    // ============================================

    /**
     * Handles the upload of a product image file.
     * @param {number} productId - The ID of the product.
     * @param {Event} event - The file input change event.
     */
    uploadProductImage(productId, event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.productImages[productId] = e.target.result;
            this.updateProductImageView(productId);
            UI.Feedback.toast('📸 Zdjęcie załadowane', 'success');
        };
        reader.readAsDataURL(file);
    },

    /**
     * Updates the preview image for a product.
     * @param {number} productId - The ID of the product.
     */
    updateProductImageView(productId) {
        const card = this.$(`#product-${productId}`);
        const preview = card?.querySelector('[data-role="image-preview"]');
        if (!preview) return;

        if (this.productImages[productId]) {
            preview.innerHTML = `<img src="${this.productImages[productId]}" class="product-image-filled">`;
        } else {
            preview.innerHTML = `
                <span class="placeholder-icon">📷</span>
                <span class="placeholder-text">Upuść obraz lub kliknij</span>
            `;
        }
    },

    // ============================================
    // DRAG & DROP
    // ============================================

    dragStart(event, productId) {
        this.draggedElement = this.$(`#product-${productId}`);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', productId);
        setTimeout(() => this.draggedElement?.classList.add('dragging'), 0);
    },

    dragOver(event) {
        event.preventDefault();
    },

    drop(event, targetProductId) {
        event.preventDefault();
        if (!this.draggedElement) return;

        const draggedId = parseInt(event.dataTransfer.getData('text/plain'));
        const targetElement = this.$(`#product-${targetProductId}`);

        if (draggedId !== targetProductId && targetElement) {
            const container = this.$('#productsList');
            const rect = targetElement.getBoundingClientRect();
            const isAfter = event.clientY > rect.top + rect.height / 2;

            if (isAfter) {
                container.insertBefore(this.draggedElement, targetElement.nextSibling);
            } else {
                container.insertBefore(this.draggedElement, targetElement);
            }

            // Reorder the `this.products` array to match the new DOM order
            const newOrder = Array.from(container.children)
                .map(child => parseInt(child.id.replace('product-', '')))
                .filter(id => !isNaN(id));
            this.products = newOrder;
        }

        this.draggedElement.classList.remove('dragging');
        this.draggedElement = null;
        this.autosaveOffer(); // Save the new order
    },

    // ============================================
    // DATA & CALCULATIONS
    // ============================================

    /**
     * Updates the financial summary table based on the current product list.
     */
    updateSummary() {
        const tbody = this.$('#summaryTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalNet = 0;

        const productData = this.products.map(id => {
            const card = this.$(`#product-${id}`);
            return {
                name: card.querySelector('[data-role="product-name"]').value,
                qty: parseFloat(card.querySelector('[data-role="product-qty"]').value) || 0,
                price: parseFloat(card.querySelector('[data-role="product-price"]').value) || 0,
                discount: parseFloat(card.querySelector('[data-role="product-discount"]').value) || 0,
            };
        }).filter(p => p.name.trim());

        if (productData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-8">Brak produktów</td></tr>';
        } else {
            productData.forEach((p, index) => {
                const discountedPrice = p.price * (1 - p.discount / 100);
                const total = p.qty * discountedPrice;
                totalNet += total;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${this.escapeHTML(p.name)}</td>
                    <td>${p.qty}</td>
                    <td>${p.price.toFixed(2)} zł</td>
                    <td>${p.discount}%</td>
                    <td>${total.toFixed(2)} zł</td>
                `;
                tbody.appendChild(row);
            });
        }

        const vatRate = parseFloat(this.$('#vatRate')?.value || '23') / 100;
        const vat = totalNet * vatRate;
        const gross = totalNet + vat;

        this.$('#totalNet').textContent = totalNet.toFixed(2) + ' zł';
        this.$('#totalVat').textContent = vat.toFixed(2) + ' zł';
        this.$('#totalGross').textContent = gross.toFixed(2) + ' zł';
    },

    /**
     * Collects all form data into a structured object.
     * @returns {object|null} The offer data object or null if profile is missing.
     */
    collectOfferData() {
        if (!this.profile) return null;
        const getValue = (selector) => this.$(selector)?.value || '';

        return {
            id: getValue('#offerNumber') || `offer_${Date.now()}`,
            profileKey: this.profile.key,
            offer: {
                number: getValue('#offerNumber'),
                date: getValue('#offerDate'),
                validUntil: getValue('#validUntil'),
                currency: getValue('#currency')
            },
            seller: {
                name: getValue('#sellerName'),
                nip: getValue('#sellerNIP'),
                address: getValue('#sellerAddress'),
                phone: getValue('#sellerPhone'),
                email: getValue('#sellerEmail'),
                contact: getValue('#sellerContact'),
                bank: getValue('#sellerBank'),
            },
            buyer: {
                name: getValue('#buyerName'),
                nip: getValue('#buyerNIP'),
                address: getValue('#buyerAddress'),
                phone: getValue('#buyerPhone'),
                email: getValue('#buyerEmail')
            },
            terms: {
                payment: getValue('#paymentTerms'),
                delivery: getValue('#deliveryTime'),
                warranty: getValue('#warranty'),
                deliveryMethod: getValue('#deliveryMethod')
            },
            products: this.products.map(id => {
                 const card = this.$(`#product-${id}`);
                 return {
                    id,
                    name: card.querySelector('[data-role="product-name"]').value,
                    code: card.querySelector('[data-role="product-code"]').value,
                    qty: card.querySelector('[data-role="product-qty"]').value,
                    price: card.querySelector('[data-role="product-price"]').value,
                    discount: card.querySelector('[data-role="product-discount"]').value,
                    desc: card.querySelector('[data-role="product-desc"]').value,
                    image: this.productImages[id] || null
                 }
            }),
            notes: getValue('#orderNotes'),
            pdfSettings: {
                vatRate: getValue('#vatRate'),
                orientation: getValue('#pdfOrientation'),
                format: getValue('#pdfFormat')
            },
            timestamp: new Date().toISOString()
        };
    },

    // ============================================
    // DATA PERSISTENCE (SAVE/LOAD)
    // ============================================

    /**
     * Migrates an offer object from a legacy (flat) structure to the new nested structure.
     * @param {object} data - The raw offer data from the database.
     * @returns {object} The offer data in the new, consistent format.
     */
    migrateOfferData(data) {
        // If the `offer` key exists, we assume it's already in the new format.
        if (data.offer && typeof data.offer === 'object') {
            return data;
        }

        console.warn("🔧 Migrating legacy offer data on-the-fly...");

        // Legacy data is flat. We need to reconstruct the nested structure.
        return {
            id: data.id,
            profileKey: data.profileKey,
            offer: {
                number: data.number,
                date: data.date,
                validUntil: data.validUntil,
                currency: data.currency
            },
            seller: {}, // Seller data is not saved in the old format, it's populated from profile
            buyer: {
                name: data.buyerName,
                nip: data.buyerNIP,
                address: data.buyerAddress,
                phone: data.buyerPhone,
                email: data.buyerEmail
            },
            terms: {
                payment: data.paymentTerms,
                delivery: data.deliveryTime,
                warranty: data.warranty,
                deliveryMethod: data.deliveryMethod
            },
            products: data.products || [],
            notes: data.orderNotes || '',
            pdfSettings: {
                vatRate: '23', // Default for old offers
                orientation: 'portrait',
                format: 'a4'
            },
            timestamp: data.timestamp || new Date().toISOString()
        };
    },

    /**
     * Sets the visual status of the save indicator.
     * @param {'waiting'|'saving'|'saved'|'error'} status - The status to display.
     */
    setSaveStatus(status) {
        const statusEl = this.$('#save-status');
        if (!statusEl) return;

        statusEl.classList.remove('waiting', 'saving', 'saved', 'error');

        switch (status) {
            case 'waiting':
                statusEl.textContent = 'Zmiany niezapisane';
                statusEl.classList.add('waiting');
                break;
            case 'saving':
                statusEl.textContent = 'Zapisywanie...';
                statusEl.classList.add('saving');
                break;
            case 'saved':
                const time = new Date().toLocaleTimeString('pl-PL');
                statusEl.textContent = `Zapisano o ${time}`;
                statusEl.classList.add('saved');
                break;
            case 'error':
                statusEl.textContent = 'Błąd zapisu!';
                statusEl.classList.add('error');
                break;
        }
    },

    /**
     * Saves the current offer data to the database.
     * @param {boolean} [isManual=false] - True if triggered by a user click.
     */
    async autosaveOffer(isManual = false) {
        const offerData = this.collectOfferData();
        if (!offerData || !offerData.offer.number || !offerData.buyer.name) {
            if (isManual) UI.Feedback.toast('Wypełnij numer oferty i nazwę nabywcy, aby zapisać.', 'warning');
            return;
        }

        this.setSaveStatus('saving');

        try {
            await StorageSystem.db.set(StorageSystem.db.STORES.offers, offerData);
            this.setSaveStatus('saved');
            if (isManual) UI.Feedback.toast(`Zapisano ofertę ${offerData.id}`, 'success');
        } catch (error) {
            console.error('Save offer error:', error);
            this.setSaveStatus('error');
            if (isManual) UI.Feedback.show('Błąd zapisu', `Nie udało się zapisać oferty: ${error.message}`, 'error');
        }
    },

    /**
     * Displays a modal with a list of saved offers to load.
     */
    async loadOffer() {
        if (!this.profile) return;

        try {
            const allOffers = await StorageSystem.db.getAll(StorageSystem.db.STORES.offers);
            const profileOffers = allOffers.filter(o => o.profileKey === this.profile.key)
                                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (profileOffers.length === 0) {
                UI.Feedback.toast('Brak zapisanych ofert dla tego profilu.', 'info');
                return;
            }

            const listHTML = profileOffers.map(offer => `
                <div class="offer-history-item" data-offer-id="${offer.id}">
                    <div class="offer-number">${this.escapeHTML(offer.offer?.number || offer.id)}</div>
                    <div class="offer-buyer">${this.escapeHTML(offer.buyer?.name || 'Brak nabywcy')}</div>
                    <div class="offer-date">${new Date(offer.timestamp).toLocaleString('pl-PL')}</div>
                    <div class="offer-products">${offer.products?.length || 0} prod.</div>
                </div>
            `).join('');

            UI.Modal.show('Wczytaj ofertę', `<div class="offers-history-list">${listHTML}</div>`, 'loadOfferModal');
            document.querySelectorAll('.offer-history-item').forEach(item => {
                item.addEventListener('click', () => this.loadOfferFromHistory(item.dataset.offerId));
            });

        } catch (error) {
            console.error('Load offer error:', error);
            UI.Feedback.show('Błąd', `Nie udało się wczytać historii ofert: ${error.message}`, 'error');
        }
    },

    /**
     * Loads a selected offer from the database into the form.
     * @param {string} offerId - The ID of the offer to load.
     */
    async loadOfferFromHistory(offerId) {
        try {
            const rawOffer = await StorageSystem.db.get(StorageSystem.db.STORES.offers, offerId);
            if (!rawOffer) {
                UI.Feedback.show('Błąd', 'Nie znaleziono wybranej oferty.', 'error');
                return;
            }

            // On-the-fly migration for old data structure
            const offer = this.migrateOfferData(rawOffer);

            // Clear current form and products
            this.clearForm();
            this.products = [];
            this.productImages = {};
            this.$('#productsList').innerHTML = '';

            // Populate fields
            const fields = {
                '#offerNumber': offer.offer?.number, '#offerDate': offer.offer?.date, '#validUntil': offer.offer?.validUntil,
                '#currency': offer.offer?.currency, '#buyerName': offer.buyer?.name, '#buyerNIP': offer.buyer?.nip,
                '#buyerAddress': offer.buyer?.address, '#buyerPhone': offer.buyer?.phone, '#buyerEmail': offer.buyer?.email,
                '#paymentTerms': offer.terms?.payment, '#deliveryTime': offer.terms?.delivery, '#warranty': offer.terms?.warranty,
                '#deliveryMethod': offer.terms?.deliveryMethod, '#orderNotes': offer.notes, '#vatRate': offer.pdfSettings?.vatRate
            };
            for(const [selector, value] of Object.entries(fields)) {
                 const el = this.$(selector);
                 if(el && value) el.value = value;
            }

            // Add products
            if (offer.products?.length > 0) {
                // In old versions, addProduct had a side-effect of showing a toast.
                // We'll add products without the toast spam during loading.
                offer.products.forEach(p => this.addProduct(p, { showToast: false }));
            }

            this.updateSummary();
            UI.Modal.hide('loadOfferModal');
            UI.Feedback.toast(`Załadowano ofertę ${offer.id}.`, 'success');
            this.setSaveStatus('saved');

        } catch (error) {
            console.error('Load from history error:', error);
            UI.Feedback.show('Błąd', `Nie udało się wczytać oferty: ${error.message}`, 'error');
        }
    },

    // ============================================
    // PDF GENERATION
    // ============================================

    /**
     * Generates and triggers the download of a PDF document for the current offer.
     */
    async generatePDF() {
        const offerData = this.collectOfferData();
        if (!offerData) {
            UI.Feedback.show('Błąd', 'Brak aktywnego profilu.', 'error');
            return;
        }

        document.getElementById('loadingOverlay')?.classList.add('show');

        try {
            // Ensure PDFManager is loaded
            if (typeof PDFManager === 'undefined' || typeof PDFManager.generatePDF !== 'function') {
                throw new Error("Moduł PDFManager nie jest załadowany.");
            }

            const pdfDoc = await PDFManager.generatePDF(offerData);
            const filename = `Oferta_${offerData.offer.number.replace(/[\/\\?%*:|"<>]/g, '-')}.pdf`;
            PDFManager.savePDF(pdfDoc, filename);

            UI.Feedback.toast('PDF wygenerowany!', 'success');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            UI.Feedback.show('Błąd generowania PDF', `Wystąpił błąd: ${error.message}`, 'error');
        } finally {
            document.getElementById('loadingOverlay')?.classList.remove('show');
        }
    },

    // ============================================
    // UTILITIES
    // ============================================

    /**
     * Generates a new, unique offer number.
     */
    generateOfferNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.$('#offerNumber').value = `OF/${year}/${month}/${day}/${random}`;
    },

    /**
     * Sets the offer date to today and the valid date 30 days from now.
     */
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        this.$('#offerDate').value = today;
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        this.$('#validUntil').value = validDate.toISOString().split('T')[0];
    },

    /**
     * Debounces a function to prevent it from being called too frequently.
     * @param {Function} func The function to debounce.
     * @param {number} delay The debounce delay in milliseconds.
     * @returns {Function} The debounced function.
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    },

    /**
     * Escapes HTML to prevent XSS.
     * @param {string} str The string to escape.
     * @returns {string} The escaped string.
     */
    escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }
};

// Expose the app object to the global window scope for the plugin loader
window.OffersApp = OffersApp;
