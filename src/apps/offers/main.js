// src/apps/offers/main.js
(function() {
    let products = [];
    let productImages = {};
    let productIdCounter = 0;
    let draggedElement = null;
    let appProfile = null;
    let autosaveInterval = null;
    let appWindow = null;

    const $ = (selector) => appWindow.querySelector(selector);
    const $$ = (selector) => appWindow.querySelectorAll(selector);

    function populateSellerForm(profile) {
        if (!profile) return;
        const setValue = (id, value) => {
            const el = $(`#${id}`);
            if (el && value) el.value = value;
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
        appProfile = profile;
        appWindow = windowEl;
        populateSellerForm(profile);
        if (autosaveInterval) clearInterval(autosaveInterval);
        autosaveInterval = setInterval(autosaveOffer, 60000);
        generateOfferNumber();
        setTodayDate();
        attachEventListeners();
        updateProductView();
        updateAutosaveStatus('waiting');
    }

    function attachEventListeners() {
        $('#addProductBtn')?.addEventListener('click', () => addProduct({}));
        $('#generatePdfBtn')?.addEventListener('click', generatePDF);
        $('#saveOfferBtn')?.addEventListener('click', saveOffer);
        $('#loadOfferBtn')?.addEventListener('click', loadOffer);
        $('#clearFormBtn')?.addEventListener('click', async () => {
            if (await PesteczkaOS.core.UI.Feedback.confirm('Czy na pewno chcesz wyczyścić formularz?')) {
                products = [];
                productImages = {};
                updateProductView();
                generateOfferNumber();
                setTodayDate();
                updateSummary();
                PesteczkaOS.core.UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'info');
            }
        });
        $$('.tabs .tab').forEach(tab => tab.addEventListener('click', (e) => PesteczkaOS.core.switchTab(tab.dataset.tab, e)));
        $('#generateOfferNumberBtn')?.addEventListener('click', generateOfferNumber);
        $('#setTodayDateBtn')?.addEventListener('click', setTodayDate);
    }

    function createProductCard(productId) {
        const productCard = document.createElement('div');
        productCard.id = `product-${productId}`;
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="drag-handle" draggable="true">☰</div>
            <div class="product-image-zone"><div id="productImagePreview-${productId}" class="product-image-preview">📷</div></div>
            <div class="product-details">
                <input id="productName-${productId}" type="text" placeholder="Nazwa produktu" class="form-input">
                <input id="productQty-${productId}" type="number" value="1" class="form-input">
                <input id="productPrice-${productId}" type="number" value="0" class="form-input">
                <input id="productDiscount-${productId}" type="number" value="0" class="form-input">
            </div>
            <textarea id="productDesc-${productId}" class="form-textarea" rows="2" placeholder="Opis"></textarea>
            <div class="product-actions">
                <button class="btn btn-outline" data-action="duplicate">Duplikuj</button>
                <button class="btn btn-outline btn-danger" data-action="remove">Usuń</button>
            </div>
        `;

        productCard.querySelector('[data-action="remove"]').addEventListener('click', () => removeProduct(productId));
        productCard.querySelector('[data-action="duplicate"]').addEventListener('click', () => duplicateProduct(productId));
        productCard.querySelector('.product-image-zone').addEventListener('click', () => {
            let imageInput = $(`#productImage-${productId}`);
            if (!imageInput) {
                imageInput = document.createElement('input');
                imageInput.type = 'file';
                imageInput.id = `productImage-${productId}`;
                imageInput.style.display = 'none';
                imageInput.addEventListener('change', (e) => uploadProductImage(productId, e));
                productCard.appendChild(imageInput);
            }
            imageInput.click();
        });

        const dragHandle = productCard.querySelector('.drag-handle');
        dragHandle.addEventListener('dragstart', (e) => dragStart(e, productId));
        productCard.addEventListener('dragover', dragOver);
        productCard.addEventListener('drop', (e) => drop(e, productId));
        productCard.addEventListener('dragenter', (e) => e.preventDefault());

        return productCard;
    }

    function addProduct(productData = {}) {
        const newId = productData.id || Date.now();
        products.push(newId);
        const productCard = createProductCard(newId);
        $('#productsList').appendChild(productCard);
        if (productData.name) $(`#productName-${newId}`).value = productData.name;
        // Populate other fields if they exist in productData
        if (productData.qty) $(`#productQty-${newId}`).value = productData.qty;
        if (productData.price) $(`#productPrice-${newId}`).value = productData.price;
        if (productData.discount) $(`#productDiscount-${newId}`).value = productData.discount;
        if (productData.desc) $(`#productDesc-${newId}`).value = productData.desc;

        if (productData.image) {
            productImages[newId] = productData.image;
            updateProductImage(newId);
        }
        updateProductView();
        updateSummary();
    }

    function removeProduct(productId) {
        const productCard = $(`#product-${productId}`);
        if (productCard) productCard.remove();
        products = products.filter(id => id !== productId);
        delete productImages[productId];
        updateProductView();
        updateSummary();
    }

    function duplicateProduct(originalId) {
        const originalData = {
            name: $(`#productName-${originalId}`)?.value || '',
            qty: $(`#productQty-${originalId}`)?.value || '1',
            price: $(`#productPrice-${originalId}`)?.value || '0',
            discount: $(`#productDiscount-${originalId}`)?.value || '0',
            desc: $(`#productDesc-${originalId}`)?.value || '',
            image: productImages[originalId]
        };
        addProduct(originalData);
    }

    function dragStart(event, productId) {
        draggedElement = $(`#product-${productId}`);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', productId);
    }

    function dragOver(event) {
        event.preventDefault();
    }

    function drop(event, targetProductId) {
        event.preventDefault();
        if (!draggedElement) return;

        const draggedId = parseInt(event.dataTransfer.getData('text/plain'));
        const targetElement = $(`#product-${targetProductId}`);

        if (draggedId !== targetProductId && targetElement) {
            const container = $('#productsList');
            const draggedIndex = products.indexOf(draggedId);
            const targetIndex = products.indexOf(targetProductId);

            // Reorder in DOM
            if (draggedIndex < targetIndex) {
                container.insertBefore(draggedElement, targetElement.nextSibling);
            } else {
                container.insertBefore(draggedElement, targetElement);
            }

            // Reorder in array
            const [movedItem] = products.splice(draggedIndex, 1);
            products.splice(targetIndex, 0, movedItem);
        }
        draggedElement = null;
    }

    function updateProductView() {
        const listEl = $('#productsList');
        if (products.length === 0) {
            listEl.innerHTML = `<div class="empty-state">Brak produktów</div>`;
        } else {
            const emptyState = listEl.querySelector('.empty-state');
            if (emptyState) emptyState.remove();
        }
    }

    function updateSummary() {
        const tbody = $('#summaryTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        let totalNet = 0;
        products.forEach((id, index) => {
            const name = $(`#productName-${id}`)?.value || '';
            const qty = parseFloat($(`#productQty-${id}`)?.value) || 0;
            const price = parseFloat($(`#productPrice-${id}`)?.value) || 0;
            const discount = parseFloat($(`#productDiscount-${id}`)?.value) || 0;
            const discountedPrice = price * (1 - discount / 100);
            const total = qty * discountedPrice;
            totalNet += total;
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${name}</td>
                    <td>${qty}</td>
                    <td>${price.toFixed(2)} zł</td>
                    <td>${discount}%</td>
                    <td>${total.toFixed(2)} zł</td>
                </tr>
            `;
        });
        const vat = totalNet * 0.23;
        const gross = totalNet + vat;
        $('#totalNet').textContent = totalNet.toFixed(2) + ' zł';
        $('#totalVat').textContent = vat.toFixed(2) + ' zł';
        $('#totalGross').textContent = gross.toFixed(2) + ' zł';
    }

    async function generatePDF() { /* ... implementation unchanged ... */ }
    function collectOfferDataForPdf() { /* ... implementation unchanged ... */ }
    async function saveOffer() { /* ... implementation unchanged ... */ }
    async function loadOffer() { /* ... implementation unchanged ... */ }
    async function loadOfferFromHistory(offerId) { /* ... implementation unchanged ... */ }
    function collectOfferDataForDb() { /* ... implementation unchanged ... */ }
    async function autosaveOffer() { /* ... implementation unchanged ... */ }
    function updateAutosaveStatus(status) { /* ... implementation unchanged ... */ }
    function uploadProductImage(productId, event) {
         const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            productImages[productId] = e.target.result;
            updateProductImage(productId);
        };
        reader.readAsDataURL(file);
    }
    function updateProductImage(productId) {
        const preview = $(`#productImagePreview-${productId}`);
        if(preview && productImages[productId]) {
            preview.innerHTML = `<img src="${productImages[productId]}" style="width:100%; height:100%; object-fit:cover;">`;
        }
    }
    function generateOfferNumber() { /* ... stub ... */ }
    function setTodayDate() { /* ... stub ... */ }

    // Keeping unchanged functions as stubs for brevity
    async function generatePDF() { if (!appProfile) return; document.getElementById('loadingOverlay')?.classList.add('show'); try { const offerData = collectOfferDataForPdf(); const pdf = await PesteczkaOS.core.PDFManager.generatePDF(offerData); PesteczkaOS.core.PDFManager.savePDF(pdf, `Oferta_${offerData.offerData.number.replace(/\//g, '-')}.pdf`); PesteczkaOS.core.UI.Feedback.toast('PDF wygenerowany!', 'success'); } catch (error) { console.error('PDF Generation Error:', error); PesteczkaOS.core.UI.Feedback.show('Błąd', 'Nie udało się wygenerować PDF: ' + error.message, 'error'); } finally { document.getElementById('loadingOverlay')?.classList.remove('show'); } }
    function collectOfferDataForPdf() { return { seller: { ...appProfile }, products: products.map(id => ({ id, name: $(`#productName-${id}`).value, qty: $(`#productQty-${id}`).value, price: $(`#productPrice-${id}`).value, discount: $(`#productDiscount-${id}`).value, desc: $(`#productDesc-${id}`).value, image: productImages[id] })), offerData: { number: $('#offerNumber').value, date: $('#offerDate').value, validUntil: $('#validUntil').value } }; }
    async function saveOffer() { const offerData = collectOfferDataForDb(); if (!offerData) return; try { await PesteczkaOS.core.StorageSystem.db.set('offers', offerData); PesteczkaOS.core.UI.Feedback.toast('Zapisano!', 'success'); } catch (error) { PesteczkaOS.core.UI.Feedback.show('Błąd zapisu', error.message, 'error'); } }
    async function loadOffer() { try { const offers = await PesteczkaOS.core.StorageSystem.db.getAllBy('offers', 'profileKey', appProfile.key); if (offers.length === 0) { PesteczkaOS.core.UI.Feedback.toast('Brak ofert.', 'info'); return; } const listHTML = offers.map(o => `<div class="offer-history-item" data-offer-id="${o.id}">${o.offer.number}</div>`).join(''); PesteczkaOS.core.UI.Modal.show('Wczytaj ofertę', listHTML, 'loadOfferModal'); document.querySelectorAll('.offer-history-item').forEach(item => { item.addEventListener('click', () => loadOfferFromHistory(item.dataset.offerId)); }); } catch (error) { PesteczkaOS.core.UI.Feedback.show('Błąd wczytywania', error.message, 'error'); } }
    async function loadOfferFromHistory(offerId) { const offer = await PesteczkaOS.core.StorageSystem.db.get('offers', offerId); products = []; $('#productsList').innerHTML = ''; $('#offerNumber').value = offer.offer.number; offer.products.forEach(p => addProduct(p)); PesteczkaOS.core.UI.Modal.hide('loadOfferModal'); PesteczkaOS.core.UI.Feedback.toast('Załadowano ofertę.', 'success'); }
    function collectOfferDataForDb() { return { id: $('#offerNumber').value, profileKey: appProfile.key, offer: { number: $('#offerNumber').value }, products: products.map(id => ({ id, name: $(`#productName-${id}`).value })), timestamp: new Date().toISOString() }; }
    async function autosaveOffer() { const offerData = collectOfferDataForDb(); if(!offerData.id) return; updateAutosaveStatus('saving'); try { await PesteczkaOS.core.StorageSystem.db.set('offers', offerData); updateAutosaveStatus('saved'); } catch { updateAutosaveStatus('error'); } }
    function updateAutosaveStatus(status) { const statusEl = $('#autosave-status'); if(!statusEl) return; const messages = { saving: 'Zapisywanie...', saved: `✅ Zapisano o ${new Date().toLocaleTimeString()}`, error: 'Błąd zapisu!', waiting: 'Zmiany są zapisywane automatycznie' }; statusEl.innerHTML = messages[status]; }
    function generateOfferNumber() { const d=new Date();$('#offerNumber').value=`OF/${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`; }
    function setTodayDate() { const today=new Date().toISOString().split('T')[0];$('#offerDate').value=today;const valid=new Date();valid.setDate(valid.getDate()+30);$('#validUntil').value=valid.toISOString().split('T')[0]; }


    window.OffersApp = {
        init
    };
})();
