// src/apps/offers/main.js
(function() {
    let products = [];
    let productImages = {};
    let productIdCounter = 0;
    let draggedElement = null;
    let appProfile = null;
    let appWindow = null; // Reference to the app's window element

    // Scoped query selector helper
    const $ = (selector) => appWindow.querySelector(selector);
    const $$ = (selector) => appWindow.querySelectorAll(selector);

    function populateSellerForm(profile) {
        if (!profile) {
            console.log("populateSellerForm: No profile provided.");
            return;
        }
        console.log("Populating seller form with profile:", profile);

        const setValue = (id, value) => {
            const el = $(`#${id}`);
            if (el && value !== undefined && value !== null) {
                el.value = value;
            }
        };

        setValue('sellerName', profile.fullName);
        setValue('sellerNIP', profile.nip);
        setValue('sellerAddress', profile.address);
        setValue('sellerPhone', profile.phone);
        setValue('sellerEmail', profile.email);
        setValue('sellerContact', profile.sellerName);
        setValue('sellerBank', profile.bankAccount);
    }

    function init(profile, windowEl) {
        console.log("Offers App Initialized");
        appProfile = profile;
        appWindow = windowEl; // Store the window element

        populateSellerForm(profile);

        if (window.autosaveInterval) clearInterval(window.autosaveInterval);
        window.autosaveInterval = setInterval(autosaveOffer, 60000);

        generateOfferNumber();
        setTodayDate();
        attachEventListeners();
        updateProductView();

        // Advanced UI Features
        if (window.UI && typeof window.UI.initAdvanced === 'function') {
            window.UI.initAdvanced(`#window-offers`);

            // Setup validation for dynamically loaded fields
            window.UI.Form.createField('offerNumber', {
                onValidate: (value) => value.trim() ? null : 'Numer oferty jest wymagany.'
            });
            window.UI.Form.createField('buyerName', {
                onValidate: (value) => value.trim() ? null : 'Nazwa nabywcy jest wymagana.'
            });
        }
    }

    function attachEventListeners() {
        $('#addProductBtn')?.addEventListener('click', () => addProduct({}));
        $('#generatePdfBtn')?.addEventListener('click', generatePDF);
        $('#saveOfferBtn')?.addEventListener('click', saveOffer);
        $('#loadOfferBtn')?.addEventListener('click', loadOffer);

        $('#clearFormBtn')?.addEventListener('click', async () => {
            if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić formularz?')) {
                products = [];
                productImages = {};
                $('#productsList').innerHTML = '';
                updateProductView();
                generateOfferNumber();
                setTodayDate();
                updateSummary();
                UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'info');
            }
        });

        $$('.tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (typeof window.switchTab === 'function') {
                    window.switchTab(tab.dataset.tab, e);
                }
            });
        });

        $('#generateOfferNumberBtn')?.addEventListener('click', generateOfferNumber);
        $('#setTodayDateBtn')?.addEventListener('click', setTodayDate);
    }

    function createProductCard(productId) {
        const template = $('#productCardTemplate');
        if (!template) {
            console.error("Product card template not found!");
            return null;
        }

        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.product-card');
        card.id = `product-${productId}`;

        // Elements
        const nameInput = card.querySelector('.product-name');
        const qtyInput = card.querySelector('.product-qty');
        const priceInput = card.querySelector('.product-price');
        const discountInput = card.querySelector('.product-discount');
        const imageZone = card.querySelector('.product-image-zone');
        const imageInput = card.querySelector('.product-image-input');
        const dragHandle = card.querySelector('.drag-handle');
        const deleteBtn = card.querySelector('.btn-delete');
        const duplicateBtn = card.querySelector('.btn-duplicate');

        // Event listeners for real-time summary update
        [nameInput, qtyInput, priceInput, discountInput].forEach(el => {
            el.addEventListener('input', updateSummary);
        });

        imageZone.onclick = () => imageInput.click();
        imageInput.onchange = (e) => uploadProductImage(productId, e, card);

        dragHandle.ondragstart = (e) => dragStart(e, productId);
        deleteBtn.onclick = () => removeProduct(productId);
        duplicateBtn.onclick = () => duplicateProduct(productId);

        card.addEventListener('dragover', dragOver);
        card.addEventListener('drop', (e) => drop(e, productId));
        card.addEventListener('dragenter', (e) => e.preventDefault());

        return card;
    }

    function updateProductView() {
        const productsListEl = $('#productsList');
        if (!productsListEl) return;
        const emptyStateEl = productsListEl.querySelector('.empty-state');

        if (products.length > 0) {
            if (emptyStateEl) emptyStateEl.remove();
        } else if (!emptyStateEl) {
            productsListEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-title">Brak produktów</div>
                    <div class="empty-state-desc">Kliknij "Dodaj produkt" aby rozpocząć</div>
                </div>
            `;
        }
    }

    function addProduct(productData = {}) {
        const newId = productData.id || Date.now() + productIdCounter++;
        products.push(newId);

        const productCard = createProductCard(newId);
        if (!productCard) return;

        $('#productsList').appendChild(productCard);

        // Populate fields
        if (productData.name) productCard.querySelector('.product-name').value = productData.name;
        if (productData.code) productCard.querySelector('.product-code').value = productData.code;
        if (productData.qty) productCard.querySelector('.product-qty').value = productData.qty;
        if (productData.price) productCard.querySelector('.product-price').value = productData.price;
        if (productData.discount) productCard.querySelector('.product-discount').value = productData.discount;
        if (productData.desc) productCard.querySelector('.product-desc').value = productData.desc;

        if (productData.image) {
            productImages[newId] = productData.image;
            updateProductImage(newId, productCard);
        }

        updateSummary();
        updateProductView();
    }

    function removeProduct(productId) {
        const productCard = $(`#product-${productId}`);
        if (productCard) {
            productCard.remove();
            products = products.filter(id => id !== productId);
            delete productImages[productId];
        }
        updateProductView();
        updateSummary();
    }

    function updateProductImage(productId, card) {
        if (!card) card = $(`#product-${productId}`);
        if (!card) return;

        const preview = card.querySelector('.product-image-preview');
        if (preview) {
            if (productImages[productId]) {
                preview.innerHTML = `<img src="${productImages[productId]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            } else {
                preview.innerHTML = '📷';
            }
        }
    }

    function duplicateProduct(originalId) {
        const card = $(`#product-${originalId}`);
        if (!card) return;

        const originalData = {
            name: card.querySelector('.product-name').value,
            code: card.querySelector('.product-code').value,
            qty: card.querySelector('.product-qty').value,
            price: card.querySelector('.product-price').value,
            discount: card.querySelector('.product-discount').value,
            desc: card.querySelector('.product-desc').value,
            image: productImages[originalId]
        };

        addProduct(originalData);
        UI.Feedback.toast('📋 Produkt zduplikowany', 'info');
    }

    function uploadProductImage(productId, event, card) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            productImages[productId] = e.target.result;
            updateProductImage(productId, card);
            UI.Feedback.toast('📸 Zdjęcie załadowane', 'success');
        };
        reader.readAsDataURL(file);
    }

    function dragStart(event, productId) {
        draggedElement = $(`#product-${productId}`);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', productId);
        setTimeout(() => {
            if (draggedElement) draggedElement.classList.add('dragging');
        }, 0);
    }

    function dragOver(event) {
        event.preventDefault();
    }

    function drop(event, targetProductId) {
        event.preventDefault();
        if (!draggedElement) return;

        const draggedId = event.dataTransfer.getData('text/plain');
        const targetElement = $(`#product-${targetProductId}`);

        if (draggedId !== targetProductId.toString() && targetElement) {
            const container = $('#productsList');
            const rect = targetElement.getBoundingClientRect();
            const offsetY = event.clientY - rect.top;

            if (offsetY > rect.height / 2) {
                container.insertBefore(draggedElement, targetElement.nextSibling);
            } else {
                container.insertBefore(draggedElement, targetElement);
            }

            // Update internal products array order
            const newNodes = Array.from(container.querySelectorAll('.product-card')).map(node => {
                return node.id.replace('product-', '');
            });
            products = newNodes;
            updateSummary();
        }

        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }

    function updateSummary() {
        const tbody = $('#summaryTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalNet = 0;

        const productData = products.map(id => {
            const card = $(`#product-${id}`);
            if (!card) return null;
            return {
                name: card.querySelector('.product-name').value || '',
                qty: parseFloat(card.querySelector('.product-qty').value) || 0,
                price: parseFloat(card.querySelector('.product-price').value) || 0,
                discount: parseFloat(card.querySelector('.product-discount').value) || 0,
            };
        }).filter(p => p && p.name.trim());

        if (productData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 2rem;">Brak produktów</td></tr>';
        } else {
            productData.forEach((p, index) => {
                const discountedPrice = p.price * (1 - p.discount / 100);
                const total = p.qty * discountedPrice;
                totalNet += total;

                tbody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${p.name}</td>
                        <td>${p.qty}</td>
                        <td>${p.price.toFixed(2)} zł</td>
                        <td>${p.discount}%</td>
                        <td>${total.toFixed(2)} zł</td>
                    </tr>
                `;
            });
        }

        const vatRate = parseFloat($('#vatRate')?.value) || 23;
        const vat = totalNet * (vatRate / 100);
        const gross = totalNet + vat;

        $('#totalNet').textContent = totalNet.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
        $('#totalVat').textContent = vat.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
        $('#totalGross').textContent = gross.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';
    }

    async function generatePDF() {
        if (!appProfile) {
            UI.Feedback.show('Błąd', 'Brak aktywnego profilu.', 'error');
            return;
        }

        const getValue = (id) => $(`#${id}`)?.value || '';

        const offerData = {
            number: getValue('offerNumber'),
            date: getValue('offerDate'),
            validUntil: getValue('validUntil'),
            currency: getValue('currency'),
            paymentTerms: getValue('paymentTerms'),
            deliveryTime: getValue('deliveryTime'),
            warranty: getValue('warranty'),
            deliveryMethod: getValue('deliveryMethod'),
            buyer: {
                name: getValue('buyerName'),
                nip: getValue('buyerNIP'),
                address: getValue('buyerAddress'),
                phone: getValue('buyerPhone'),
                email: getValue('buyerEmail'),
            },
            notes: getValue('orderNotes')
        };

        const pdfProducts = products.map(id => {
            const card = $(`#product-${id}`);
            return {
                id: id,
                name: card.querySelector('.product-name').value,
                code: card.querySelector('.product-code').value,
                qty: card.querySelector('.product-qty').value,
                price: card.querySelector('.product-price').value,
                discount: card.querySelector('.product-discount').value,
                desc: card.querySelector('.product-desc').value,
                image: productImages[id] || null,
            };
        });

        document.getElementById('loadingOverlay')?.classList.add('show');

        try {
            const sellerData = {
                ...appProfile,
                fullName: getValue('sellerName'),
                name: getValue('sellerName'),
                nip: getValue('sellerNIP'),
                address: getValue('sellerAddress'),
                phone: getValue('sellerPhone'),
                email: getValue('sellerEmail'),
                bankAccount: getValue('sellerBank'),
                sellerName: getValue('sellerContact'),
            };

            const pdf = await PDFManager.generatePDF({
                orientation: getValue('pdfOrientation'),
                format: getValue('pdfFormat'),
                vatRate: getValue('vatRate'),
                seller: sellerData,
                products: pdfProducts,
                offerData: offerData
            });

            const filename = `Oferta_${offerData.number.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
            PDFManager.savePDF(pdf, filename);

            UI.Feedback.toast('PDF wygenerowany!', 'success');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się wygenerować PDF: ' + error.message, 'error');
        } finally {
            document.getElementById('loadingOverlay')?.classList.remove('show');
        }
    }

    function collectOfferData() {
        if (!appProfile) return null;
        const getValue = (id) => $(`#${id}`)?.value || '';
        return {
            id: getValue('offerNumber') || `offer_${Date.now()}`,
            profileKey: appProfile.key,
            offer: {
                number: getValue('offerNumber'),
                date: getValue('offerDate'),
                validUntil: getValue('validUntil'),
                currency: getValue('currency')
            },
            buyer: {
                name: getValue('buyerName'),
                nip: getValue('buyerNIP'),
                address: getValue('buyerAddress'),
                phone: getValue('buyerPhone'),
                email: getValue('buyerEmail')
            },
            terms: {
                payment: getValue('paymentTerms'),
                delivery: getValue('deliveryTime'),
                warranty: getValue('warranty'),
                deliveryMethod: getValue('deliveryMethod')
            },
            products: products.map(id => {
                const card = $(`#product-${id}`);
                return {
                    id,
                    name: card.querySelector('.product-name').value,
                    code: card.querySelector('.product-code').value,
                    qty: card.querySelector('.product-qty').value,
                    price: card.querySelector('.product-price').value,
                    discount: card.querySelector('.product-discount').value,
                    desc: card.querySelector('.product-desc').value,
                    image: productImages[id] || null
                };
            }),
            timestamp: new Date().toISOString()
        };
    }

    async function autosaveOffer() {
        const offerData = collectOfferData();
        if (!offerData || !offerData.offer.number || !offerData.buyer.name) return;

        try {
            await StorageSystem.db.set(StorageSystem.db.STORES.offers, offerData);
        } catch (error) {
            console.error('Autosave offer error:', error);
        }
    }

    async function saveOffer() {
        const offerData = collectOfferData();
        if (!offerData) {
            UI.Feedback.show('Błąd', 'Zaloguj się, aby zapisać ofertę.', 'error');
            return;
        }

        const saveBtn = $('#saveOfferBtn');
        const originalBtnHTML = saveBtn.innerHTML;

        try {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span>💾</span> Zapisywanie...';
            await StorageSystem.db.set(StorageSystem.db.STORES.offers, offerData);
            UI.Feedback.toast('Zapisano!', `Oferta ${offerData.id} została zapisana.`, 'success');
        } catch (error) {
            console.error('Save offer error:', error);
            UI.Feedback.show('Błąd zapisu', 'Nie udało się zapisać oferty.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHTML;
        }
    }

    async function loadOffer() {
        if (!appProfile) {
            UI.Feedback.show('Błąd', 'Zaloguj się, aby wczytać oferty.', 'error');
            return;
        }

        try {
            const profileOffers = await StorageSystem.db.getAllBy(StorageSystem.db.STORES.offers, 'profileKey', appProfile.key);
            profileOffers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (profileOffers.length === 0) {
                UI.Feedback.toast('Brak zapisanych ofert dla tego profilu.', 'info');
                return;
            }

            const listHTML = profileOffers.map(offer => `
                <div class="offer-history-item" data-offer-id="${offer.id}">
                    <div class="offer-number">${offer.offer?.number || offer.id}</div>
                    <div class="offer-buyer">${offer.buyer?.name || 'Brak nabywcy'}</div>
                    <div class="offer-date">${new Date(offer.timestamp).toLocaleString('pl-PL')}</div>
                    <div class="offer-products">${offer.products?.length || 0} prod.</div>
                </div>
            `).join('');

            UI.Modal.show('Wczytaj ofertę', `<div class="offers-history-list">${listHTML}</div>`, 'loadOfferModal');

            document.querySelectorAll('.offer-history-item').forEach(item => {
                item.addEventListener('click', () => loadOfferFromHistory(item.dataset.offerId));
            });

        } catch (error) {
            console.error('Load offer error:', error);
            UI.Feedback.show('Błąd wczytywania', 'Nie udało się wczytać historii ofert.', 'error');
        }
    }

    async function loadOfferFromHistory(offerId) {
        try {
            const offer = await StorageSystem.db.get(StorageSystem.db.STORES.offers, offerId);
            if (!offer) return;

            products = [];
            productImages = {};
            $('#productsList').innerHTML = '';

            const fields = {
                'offerNumber': offer.offer?.number, 'offerDate': offer.offer?.date, 'validUntil': offer.offer?.validUntil,
                'currency': offer.offer?.currency, 'buyerName': offer.buyer?.name, 'buyerNIP': offer.buyer?.nip,
                'buyerAddress': offer.buyer?.address, 'buyerPhone': offer.buyer?.phone, 'buyerEmail': offer.buyer?.email,
                'paymentTerms': offer.terms?.payment, 'deliveryTime': offer.terms?.delivery, 'warranty': offer.terms?.warranty,
                'deliveryMethod': offer.terms?.deliveryMethod
            };
            Object.entries(fields).forEach(([id, value]) => {
                const el = $(`#${id}`);
                if (el && value) el.value = value;
            });

            if (offer.products?.length > 0) {
                offer.products.forEach(p => {
                    addProduct(p);
                });
            }
            updateSummary();
            UI.Modal.hide('loadOfferModal');
            UI.Feedback.toast(`Załadowano ofertę ${offer.id}.`, 'success');
        } catch (error) {
            console.error('Load from history error:', error);
            UI.Feedback.show('Błąd', 'Nie udało się wczytać wybranej oferty.', 'error');
        }
    }

    function generateOfferNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        $('#offerNumber').value = `OF/${year}/${month}/${day}/${random}`;
    }

    function setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        $('#offerDate').value = today;
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        $('#validUntil').value = validDate.toISOString().split('T')[0];
    }

    window.OffersApp = { init };
})();
