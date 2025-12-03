const OfferGenerator = (() => {
    let products = [];
    let productImages = {};
    let productIdCounter = 0;
    let pastedImageData = null;
    let draggedElement = null;

    const init = () => {
        console.log('📦 Offer Generator Initialized');
        setupEventListeners();
        generateOfferNumber();
        setTodayDate();
        updateProductView();
    };

    const setupEventListeners = () => {
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

        document.querySelectorAll('#window-offers .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = tab.dataset.tab;
                const tabsContainer = e.target.closest('.tabs');
                const windowContent = tabsContainer.parentElement;

                tabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                windowContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const activeTabContent = windowContent.querySelector(`#${tabId}-tab`);
                if(activeTabContent) activeTabContent.classList.add('active');
            });
        });
    };

    function updateProductView() {
        const productsListEl = document.getElementById('productsList');
        if (!productsListEl) return;
        const emptyStateEl = productsListEl.querySelector('.empty-state');

        if (products.length > 0 && emptyStateEl) {
            emptyStateEl.remove();
        } else if (products.length === 0 && !emptyStateEl) {
            productsListEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-title">Brak produktów</div>
                    <div class="empty-state-desc">Kliknij "Dodaj produkt" aby rozpocząć</div>
                </div>
            `;
        }
    }

    function addProduct(productData) {
        const command = new ProductCommand('add', productData, products, productImages);
        UI.Command.execute(command);

        if (productData.image) {
            const newId = products[products.length - 1];
            productImages[newId] = productData.image;
            updateProductImage(newId);
        }
    }

    function removeProduct(productId) {
        const productData = { id: productId };
        const command = new ProductCommand('remove', productData, products, productImages);
        UI.Command.execute(command);
    }

    function updateProductImage(productId) {
        const preview = document.getElementById(`productImagePreview-${productId}`);
        if (preview && productImages[productId]) {
            preview.innerHTML = `<img src="${productImages[productId]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
        }
    }

    function duplicateProduct(productId) {
        const command = new DuplicateProductCommand(productId, products, productImages);
        UI.Command.execute(command);
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
        const container = document.getElementById('productsList');
        if (!container) return;

        const afterElement = getDragAfterElement(container, event.clientY);
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;

        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    }

    function drop(event, productId) {
        event.preventDefault();
        const draggedId = parseInt(event.dataTransfer.getData('text/plain'));
        const targetId = productId;

        if (draggedId !== targetId) {
            const draggedIndex = products.indexOf(draggedId);
            const targetIndex = products.indexOf(targetId);
            const [removed] = products.splice(draggedIndex, 1);
            products.splice(targetIndex, 0, removed);
        }

        if(draggedElement) {
            draggedElement.classList.remove('dragging');
        }
        draggedElement = null;
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.product-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function updateSummary() {
        const tbody = document.getElementById('summaryTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        let totalNet = 0;
        let validIdx = 1;

        products.forEach(productId => {
            const nameEl = document.getElementById(`productName-${productId}`);
            const name = nameEl?.value;
            if (!name || !name.trim()) return;

            const qty = parseFloat(document.getElementById(`productQty-${productId}`)?.value) || 0;
            const price = parseFloat(document.getElementById(`productPrice-${productId}`)?.value) || 0;
            const discount = parseFloat(document.getElementById(`productDiscount-${productId}`)?.value) || 0;

            const discountedPrice = price * (1 - discount / 100);
            const total = qty * discountedPrice;
            totalNet += total;

            tbody.innerHTML += `
                <tr>
                    <td>${validIdx++}</td>
                    <td>${name}</td>
                    <td>${qty}</td>
                    <td>${price.toFixed(2)} zł</td>
                    <td>${discount}%</td>
                    <td>${total.toFixed(2)} zł</td>
                </tr>
            `;
        });

        if (validIdx === 1) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666; padding: 2rem;">Brak produktów</td></tr>';
        }

        const vat = totalNet * 0.23;
        const gross = totalNet + vat;

        const totalNetEl = document.getElementById('totalNet');
        const totalVatEl = document.getElementById('totalVat');
        const totalGrossEl = document.getElementById('totalGross');

        if (totalNetEl) totalNetEl.textContent = totalNet.toFixed(2) + ' zł';
        if (totalVatEl) totalVatEl.textContent = vat.toFixed(2) + ' zł';
        if (totalGrossEl) totalGrossEl.textContent = gross.toFixed(2) + ' zł';
    }

    async function generatePDF() {
        if (!currentProfile) {
            showNotification('Błąd', 'Brak aktywnego profilu.', 'error');
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

        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay?.classList.add('show');

        try {
            const pdf = await PDFManager.generatePDF({
                orientation: document.getElementById('pdfOrientation')?.value || 'portrait',
                format: document.getElementById('pdfFormat')?.value || 'a4',
                seller: currentProfile,
                products: pdfProducts,
                offerData: offerData
            });

            const filename = `Oferta_${offerData.number.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
            PDFManager.savePDF(pdf, filename);

            showNotification('Sukces', 'PDF został pomyślnie wygenerowany!', 'success');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            showNotification('Błąd', 'Nie udało się wygenerować PDF: ' + error.message, 'error');
        } finally {
            loadingOverlay?.classList.remove('show');
        }
    }

    async function saveOffer() {
        if (!currentProfile) {
            showNotification('Błąd', 'Zaloguj się, aby zapisać ofertę.', 'error');
            return;
        }

        const offerData = {
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

        try {
            await StorageSystem.db.set(StorageSystem.db.STORES.offers, offerData);
            showNotification('Zapisano!', `Oferta ${offerData.id} została zapisana.`, 'success');
        } catch (error) {
            console.error('Save offer error:', error);
            showNotification('Błąd zapisu', 'Nie udało się zapisać oferty.', 'error');
        }
    }

    async function loadOffer() {
        if (!currentProfile) {
            showNotification('Błąd', 'Zaloguj się, aby wczytać oferty.', 'error');
            return;
        }

        try {
            const allOffers = await StorageSystem.db.getAll(StorageSystem.db.STORES.offers);
            const profileOffers = allOffers
                .filter(o => o.profileKey === currentProfile.key)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (profileOffers.length === 0) {
                showNotification('Informacja', 'Brak zapisanych ofert dla tego profilu.', 'info');
                return;
            }

            const listHTML = profileOffers.map(offer => `
                <div class="offer-history-item" onclick="OfferGenerator.loadOfferFromHistory('${offer.id}')">
                    <div class="offer-number">${offer.offer?.number || offer.id}</div>
                    <div class="offer-buyer">${offer.buyer?.name || 'Brak nabywcy'}</div>
                    <div class="offer-date">${new Date(offer.timestamp).toLocaleString('pl-PL')}</div>
                    <div class="offer-products">${offer.products?.length || 0} prod.</div>
                </div>
            `).join('');

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="width: 600px;">
                    <h2 style="margin-bottom: 1.5rem;">Wczytaj ofertę</h2>
                    <div class="offers-history-list" style="max-height: 60vh; overflow-y: auto;">${listHTML}</div>
                    <button class="btn btn-outline" style="margin-top: 1.5rem;" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
                </div>
            `;
            document.body.appendChild(modal);

        } catch (error) {
            console.error('Load offer error:', error);
            showNotification('Błąd wczytywania', 'Nie udało się wczytać historii ofert.', 'error');
        }
    }

    async function loadOfferFromHistory(offerId) {
        try {
            const offer = await StorageSystem.db.get(StorageSystem.db.STORES.offers, offerId);
            if (!offer) {
                showNotification('Błąd', 'Nie znaleziono oferty.', 'error');
                return;
            }

            // Clear current form
            products = [];
            productImages = {};
            const productsList = document.getElementById('productsList');
            if (productsList) productsList.innerHTML = '';

            // Load data
            const fields = {
                'offerNumber': offer.offer?.number,
                'offerDate': offer.offer?.date,
                'validUntil': offer.offer?.validUntil,
                'currency': offer.offer?.currency,
                'buyerName': offer.buyer?.name,
                'buyerNIP': offer.buyer?.nip,
                'buyerAddress': offer.buyer?.address,
                'buyerPhone': offer.buyer?.phone,
                'buyerEmail': offer.buyer?.email,
                'paymentTerms': offer.terms?.payment,
                'deliveryTime': offer.terms?.delivery,
                'warranty': offer.terms?.warranty,
                'deliveryMethod': offer.terms?.deliveryMethod
            };

            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el && value) el.value = value;
            });

            // Load products
            if (offer.products && offer.products.length > 0) {
                offer.products.forEach(p => {
                    addProduct();
                    const newId = products[products.length - 1];

                    const productFields = {
                        [`productName-${newId}`]: p.name,
                        [`productCode-${newId}`]: p.code,
                        [`productQty-${newId}`]: p.qty,
                        [`productPrice-${newId}`]: p.price,
                        [`productDiscount-${newId}`]: p.discount,
                        [`productDesc-${newId}`]: p.desc
                    };

                    Object.entries(productFields).forEach(([id, value]) => {
                        const el = document.getElementById(id);
                        if (el && value) el.value = value;
                    });

                    if (p.image) {
                        productImages[newId] = p.image;
                        updateProductImage(newId);
                    }
                });
            }

            updateSummary();

            const modal = document.querySelector('.modal-overlay');
            if (modal) modal.remove();

            showNotification('Wczytano!', `Załadowano ofertę ${offer.id}.`, 'success');

        } catch (error) {
            console.error('Load from history error:', error);
            showNotification('Błąd', 'Nie udało się wczytać wybranej oferty.', 'error');
        }
    }

    function generateOfferNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const offerNumberInput = document.getElementById('offerNumber');
        if(offerNumberInput) offerNumberInput.value = `OF/${year}/${month}/${day}/${random}`;
    }

    function setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        const offerDateInput = document.getElementById('offerDate');
        if(offerDateInput) offerDateInput.value = today;

        const validDate = new Date();
        validDate.setDate(validDate.getDate() + 30);
        const validUntilInput = document.getElementById('validUntil');
        if(validUntilInput) validUntilInput.value = validDate.toISOString().split('T')[0];
    }


    return {
        init,
        loadOfferFromHistory
    };
})();
