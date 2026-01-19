// src/apps/offers/main.js
(function() {
    let products = [];
    let productImages = {};
    let productIdCounter = 0;
    let draggedElement = null;

    function init() {
        console.log("Offers App Initialized");

        if (window.autosaveInterval) clearInterval(window.autosaveInterval);
        window.autosaveInterval = setInterval(autosaveOffer, 60000);

        generateOfferNumber();
        setTodayDate();
        attachEventListeners();
        updateProductView();
    }

    function attachEventListeners() {
        document.getElementById('addProductBtn')?.addEventListener('click', () => addProduct({}));
        document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
        document.getElementById('saveOfferBtn')?.addEventListener('click', saveOffer);
        document.getElementById('loadOfferBtn')?.addEventListener('click', loadOffer);

        document.getElementById('clearFormBtn')?.addEventListener('click', async () => {
            if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić formularz?')) {
                products = [];
                productImages = {};
                updateProductView();
                generateOfferNumber();
                setTodayDate();
                updateSummary();
                UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'info');
            }
        });

        document.querySelectorAll('#window-offers .tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if(typeof switchTab === 'function') {
                    switchTab(tab.dataset.tab, e);
                }
            });
        });

        document.getElementById('generateOfferNumberBtn')?.addEventListener('click', generateOfferNumber);
        document.getElementById('setTodayDateBtn')?.addEventListener('click', setTodayDate);
    }

    function createProductCard(productId) {
        const createEl = (tag, props = {}, children = []) => {
            const el = document.createElement(tag);
            Object.assign(el, props);
            children.forEach(child => el.appendChild(child));
            return el;
        };

        const createFormGroup = (label, input) => createEl('div', { className: 'form-group' }, [createEl('label', { className: 'form-label', textContent: label }), input]);
        const createInput = (id, type, value, oninput) => createEl('input', { id, type, value, oninput, className: 'form-input' });
        const createButton = (text, onclick, className) => createEl('button', { textContent: text, onclick, className });

        const productCard = createEl('div', {
            id: `product-${productId}`,
            className: 'product-card',
        });

        const dragHandle = createEl('div', { className: 'drag-handle', textContent: '☰', draggable: true });
        dragHandle.ondragstart = (e) => dragStart(e, productId);

        const imageZone = createEl('div', { className: 'product-image-zone' }, [
            createEl('div', { id: `productImagePreview-${productId}`, className: 'product-image-preview', textContent: '📷' }),
            createEl('input', { id: `productImage-${productId}`, type: 'file', accept: 'image/*', style: 'display:none', onchange: (e) => uploadProductImage(productId, e) })
        ]);
        imageZone.onclick = () => document.getElementById(`productImage-${productId}`).click();

        const productDetails = createEl('div', { className: 'product-details' }, [
            createFormGroup('Nazwa produktu', createInput(`productName-${productId}`, 'text', '', updateSummary)),
            createEl('div', { className: 'form-grid-inner' }, [
                createFormGroup('Kod', createInput(`productCode-${productId}`, 'text', '', null)),
                createFormGroup('Ilość', createInput(`productQty-${productId}`, 'number', 1, updateSummary)),
                createFormGroup('Cena netto', createInput(`productPrice-${productId}`, 'number', 0, updateSummary)),
                createFormGroup('Rabat (%)', createInput(`productDiscount-${productId}`, 'number', 0, updateSummary)),
            ])
        ]);

        productCard.append(
            dragHandle,
            createEl('div', { className: 'product-content-wrapper' }, [imageZone, productDetails]),
            createFormGroup('Opis produktu', createEl('textarea', { id: `productDesc-${productId}`, className: 'form-textarea', rows: 2, placeholder: '• Cecha 1\n• Cecha 2' })),
            createEl('div', { className: 'product-actions' }, [
                createButton('📋 Duplikuj', () => duplicateProduct(productId), 'btn btn-outline'),
                createButton('🗑️ Usuń', () => removeProduct(productId), 'btn btn-outline btn-danger')
            ])
        );

        productCard.addEventListener('dragover', dragOver);
        productCard.addEventListener('drop', (e) => drop(e, productId));
        productCard.addEventListener('dragenter', (e) => e.preventDefault());

        return productCard;
    }

    function updateProductView() {
        const productsListEl = document.getElementById('productsList');
        if (!productsListEl) return;
        const emptyStateEl = productsListEl.querySelector('.empty-state');

        if (products.length > 0) {
            if(emptyStateEl) emptyStateEl.remove();
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
        document.getElementById('productsList').appendChild(productCard);

        Object.entries(productData).forEach(([key, value]) => {
            const el = document.getElementById(`product${key.charAt(0).toUpperCase() + key.slice(1)}-${newId}`);
            if (el && key !== 'id') el.value = value;
        });

        if (productData.image) {
            productImages[newId] = productData.image;
            updateProductImage(newId);
        }
        updateSummary();
    }

    function removeProduct(productId) {
        const productCard = document.getElementById(`product-${productId}`);
        if (productCard) {
            productCard.remove();
            products = products.filter(id => id !== productId);
            delete productImages[productId];
        }
        updateProductView();
        updateSummary();
    }

    function updateProductImage(productId) {
        const preview = document.getElementById(`productImagePreview-${productId}`);
        if (preview) {
            if (productImages[productId]) {
                preview.innerHTML = `<img src="${productImages[productId]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            } else {
                preview.innerHTML = '📷';
            }
        }
    }

    function duplicateProduct(originalId) {
        const newId = Date.now() + productIdCounter++;
        const originalData = {
            id: newId,
            name: document.getElementById(`productName-${originalId}`)?.value || '',
            code: document.getElementById(`productCode-${originalId}`)?.value || '',
            qty: document.getElementById(`productQty-${originalId}`)?.value || '1',
            price: document.getElementById(`productPrice-${originalId}`)?.value || '0',
            discount: document.getElementById(`productDiscount-${originalId}`)?.value || '0',
            desc: document.getElementById(`productDesc-${originalId}`)?.value || '',
        };
        const originalImage = productImages[originalId];

        addProduct(originalData);
        if (originalImage) {
             productImages[newId] = originalImage;
             updateProductImage(newId);
        }
    }

    function uploadProductImage(productId, event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            productImages[productId] = e.target.result;
            updateProductImage(productId);
            UI.Feedback.toast('📸 Zdjęcie załadowane', 'success');
        };
        reader.readAsDataURL(file);
    }

    function dragStart(event, productId) {
        draggedElement = document.getElementById(`product-${productId}`);
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

        const draggedId = parseInt(event.dataTransfer.getData('text/plain'));
        const targetElement = document.getElementById(`product-${targetProductId}`);

        if (draggedId !== targetProductId && targetElement) {
            const container = document.getElementById('productsList');
            const rect = targetElement.getBoundingClientRect();
            const offsetY = event.clientY - rect.top;

            if (offsetY > rect.height / 2) {
                container.insertBefore(draggedElement, targetElement.nextSibling);
            } else {
                container.insertBefore(draggedElement, targetElement);
            }

            const draggedIndex = products.indexOf(draggedId);
            products.splice(draggedIndex, 1);
            const newNodes = Array.from(container.querySelectorAll('.product-card')).map(node => parseInt(node.id.replace('product-', '')));
            products = newNodes;
        }

        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }

    function updateSummary() {
        const tbody = document.getElementById('summaryTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        let totalNet = 0;

        const productData = products.map(id => ({
            name: document.getElementById(`productName-${id}`)?.value || '',
            qty: parseFloat(document.getElementById(`productQty-${id}`)?.value) || 0,
            price: parseFloat(document.getElementById(`productPrice-${id}`)?.value) || 0,
            discount: parseFloat(document.getElementById(`productDiscount-${id}`)?.value) || 0,
        })).filter(p => p.name.trim());

        if(productData.length === 0) {
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

        const vat = totalNet * 0.23;
        const gross = totalNet + vat;

        document.getElementById('totalNet').textContent = totalNet.toFixed(2) + ' zł';
        document.getElementById('totalVat').textContent = vat.toFixed(2) + ' zł';
        document.getElementById('totalGross').textContent = gross.toFixed(2) + ' zł';
    }

    async function generatePDF() {
        if (!currentProfile) {
            UI.Feedback.show('Błąd', 'Brak aktywnego profilu.', 'error');
            return;
        }

        const offerData = {
            number: document.getElementById('offerNumber')?.value || '',
            date: document.getElementById('offerDate')?.value || '',
            validUntil: document.getElementById('validUntil')?.value || '',
            currency: document.getElementById('currency')?.value || 'PLN',
            paymentTerms: document.getElementById('paymentTerms')?.value || '',
            deliveryTime: document.getElementById('deliveryTime')?.value || '',
            warranty: document.getElementById('warranty')?.value || '',
            deliveryMethod: document.getElementById('deliveryMethod')?.value || '',
            buyer: {
                name: document.getElementById('buyerName')?.value || '',
                nip: document.getElementById('buyerNIP')?.value || '',
                address: document.getElementById('buyerAddress')?.value || '',
                phone: document.getElementById('buyerPhone')?.value || '',
                email: document.getElementById('buyerEmail')?.value || '',
            },
            notes: document.getElementById('orderNotes')?.value || ''
        };

        const pdfProducts = products.map(id => ({
            id: id,
            name: document.getElementById(`productName-${id}`)?.value || '',
            code: document.getElementById(`productCode-${id}`)?.value || '',
            qty: document.getElementById(`productQty-${id}`)?.value || '1',
            price: document.getElementById(`productPrice-${id}`)?.value || '0',
            discount: document.getElementById(`productDiscount-${id}`)?.value || '0',
            desc: document.getElementById(`productDesc-${id}`)?.value || '',
            image: productImages[id] || null,
        }));

        document.getElementById('loadingOverlay')?.classList.add('show');

        try {
            const sellerData = {
                ...currentProfile,
                fullName: document.getElementById('sellerName')?.value || '',
                name: document.getElementById('sellerName')?.value || '',
                nip: document.getElementById('sellerNIP')?.value || '',
                address: document.getElementById('sellerAddress')?.value || '',
                phone: document.getElementById('sellerPhone')?.value || '',
                email: document.getElementById('sellerEmail')?.value || '',
                bankAccount: document.getElementById('sellerBank')?.value || '',
                sellerName: document.getElementById('sellerContact')?.value || '',
            };

            const pdf = await PDFManager.generatePDF({
                orientation: document.getElementById('pdfOrientation')?.value || 'portrait',
                format: document.getElementById('pdfFormat')?.value || 'a4',
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
        if (!currentProfile) return null;

        return {
            id: document.getElementById('offerNumber')?.value || `offer_${Date.now()}`,
            profileKey: currentProfile.key,
            offer: {
                number: document.getElementById('offerNumber')?.value || '',
                date: document.getElementById('offerDate')?.value || '',
                validUntil: document.getElementById('validUntil')?.value || '',
                currency: document.getElementById('currency')?.value || 'PLN'
            },
            buyer: {
                name: document.getElementById('buyerName')?.value || '',
                nip: document.getElementById('buyerNIP')?.value || '',
                address: document.getElementById('buyerAddress')?.value || '',
                phone: document.getElementById('buyerPhone')?.value || '',
                email: document.getElementById('buyerEmail')?.value || ''
            },
            terms: {
                payment: document.getElementById('paymentTerms')?.value || '',
                delivery: document.getElementById('deliveryTime')?.value || '',
                warranty: document.getElementById('warranty')?.value || '',
                deliveryMethod: document.getElementById('deliveryMethod')?.value || ''
            },
            products: products.map(id => ({
                id,
                name: document.getElementById(`productName-${id}`)?.value || '',
                code: document.getElementById(`productCode-${id}`)?.value || '',
                qty: document.getElementById(`productQty-${id}`)?.value || '1',
                price: document.getElementById(`productPrice-${id}`)?.value || '0',
                discount: document.getElementById(`productDiscount-${id}`)?.value || '0',
                desc: document.getElementById(`productDesc-${id}`)?.value || '',
                image: productImages[id] || null
            })),
            timestamp: new Date().toISOString()
        };
    }

    async function autosaveOffer() {
        const offerData = collectOfferData();
        if (!offerData || !offerData.offer.number || !offerData.buyer.name) return;

        try {
            await StorageSystem.db.set(StorageSystem.db.STORES.offers, offerData);
            console.log(`[Autosave] Offer ${offerData.id} saved at ${new Date().toLocaleTimeString()}`);
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

        const saveBtn = document.getElementById('saveOfferBtn');
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
        if (!currentProfile) {
            UI.Feedback.show('Błąd', 'Zaloguj się, aby wczytać oferty.', 'error');
            return;
        }

        try {
            const profileOffers = await StorageSystem.db.getAllBy(StorageSystem.db.STORES.offers, 'profileKey', currentProfile.key);
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
            if (!offer) {
                UI.Feedback.show('Błąd', 'Nie znaleziono oferty.', 'error');
                return;
            }

            products = [];
            productImages = {};
            document.getElementById('productsList').innerHTML = '';

            const fields = {
                'offerNumber': offer.offer?.number, 'offerDate': offer.offer?.date, 'validUntil': offer.offer?.validUntil,
                'currency': offer.offer?.currency, 'buyerName': offer.buyer?.name, 'buyerNIP': offer.buyer?.nip,
                'buyerAddress': offer.buyer?.address, 'buyerPhone': offer.buyer?.phone, 'buyerEmail': offer.buyer?.email,
                'paymentTerms': offer.terms?.payment, 'deliveryTime': offer.terms?.delivery, 'warranty': offer.terms?.warranty,
                'deliveryMethod': offer.terms?.deliveryMethod
            };
            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el && value) el.value = value;
            });

            if (offer.products?.length > 0) {
                offer.products.forEach(p => {
                    addProduct(p);
                    const newId = products[products.length - 1];
                    if(p.image) {
                         productImages[newId] = p.image;
                         updateProductImage(newId);
                    }
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
        document.getElementById('offerNumber').value = `OF/${year}/${month}/${day}/${random}`;
    }

    function setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('offerDate').value = today;
        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        document.getElementById('validUntil').value = validDate.toISOString().split('T')[0];
    }

    window.OffersApp = { init };
})();
