import { state } from '/js/state.js';
import { showNotification } from '/js/uiManager.js';

let pastedImageData = null;

// ============================================
// PRODUCT MANAGEMENT
// ============================================

function addProduct(productData = {}) {
    state.productIdCounter++;
    const productId = state.productIdCounter;
    state.products.push(productId);

    const productCard = renderProductCard(productId, productData);

    const productsListEl = document.getElementById('productsList');
    const emptyState = productsListEl.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    productsListEl.appendChild(productCard);

    updateSummary();
}

function removeProduct(productId) {
    const index = state.products.indexOf(productId);
    if (index > -1) {
        state.products.splice(index, 1);
        delete state.productImages[productId];
    }

    const productCard = document.getElementById(`product-${productId}`);
    if (productCard) {
        productCard.remove();
    }

    updateProductView();
    updateSummary();
}


function updateProductView() {
    const productsListEl = document.getElementById('productsList');
    if (!productsListEl) return;
    const emptyStateEl = productsListEl.querySelector('.empty-state');

    if (state.products.length > 0 && emptyStateEl) {
        emptyStateEl.remove();
    } else if (state.products.length === 0 && !emptyStateEl) {
        productsListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div class="empty-state-title">Brak produktów</div>
                <div class="empty-state-desc">Kliknij "Dodaj produkt" aby rozpocząć</div>
            </div>
        `;
    }
}


function renderProductCard(productId, productData) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.id = `product-${productId}`;
    productCard.innerHTML = `
        <div class="product-card-header">
            <span class="product-card-title">Produkt #${productId}</span>
            <div class="product-card-actions">
                <button class="btn-icon" data-action="remove" data-id="${productId}" title="Usuń produkt">🗑️</button>
            </div>
        </div>
        <div class="product-card-body">
            <div class="form-group">
                <label>Nazwa Produktu</label>
                <input type="text" class="form-input" id="productName-${productId}" value="${productData.name || ''}">
            </div>
            <div class="form-grid-col-2">
                <div class="form-group">
                    <label>Ilość</label>
                    <input type="number" class="form-input" id="productQty-${productId}" value="${productData.qty || '1'}" min="1">
                </div>
                <div class="form-group">
                    <label>Cena (netto)</label>
                    <input type="number" class="form-input" id="productPrice-${productId}" value="${productData.price || '0.00'}" step="0.01">
                </div>
            </div>
             <div class="form-group">
                <label>Opis</label>
                <textarea class="form-textarea" id="productDesc-${productId}" rows="2">${productData.desc || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Zdjęcie produktu</label>
                <div class="product-image-preview" id="productImagePreview-${productId}">
                    Brak zdjęcia
                </div>
            </div>
        </div>
    `;

    // Event Listeners for the card
    productCard.querySelector('[data-action="remove"]').addEventListener('click', () => removeProduct(productId));
    productCard.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', updateSummary);
    });

    return productCard;
}

function updateSummary() {
    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) return;

    let totalNet = 0;
    tbody.innerHTML = ''; // Clear previous summary

    if (state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 3rem;">Brak produktów</td></tr>';
    } else {
        state.products.forEach((productId, index) => {
            const name = document.getElementById(`productName-${productId}`).value;
            const qty = parseFloat(document.getElementById(`productQty-${productId}`).value) || 0;
            const price = parseFloat(document.getElementById(`productPrice-${productId}`).value) || 0;
            const value = qty * price;
            totalNet += value;

            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${name || `Produkt #${productId}`}</td>
                    <td>${qty}</td>
                    <td>${price.toFixed(2)} zł</td>
                    <td>0%</td> <!-- Discount not implemented in this simplified version -->
                    <td>${value.toFixed(2)} zł</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    const vatRate = 0.23; // Assuming 23% VAT
    const totalVat = totalNet * vatRate;
    const totalGross = totalNet + totalVat;

    document.getElementById('totalNet').textContent = `${totalNet.toFixed(2)} zł`;
    document.getElementById('totalVat').textContent = `${totalVat.toFixed(2)} zł`;
    document.getElementById('totalGross').textContent = `${totalGross.toFixed(2)} zł`;
}


// ============================================
// PASTE FUNCTIONALITY
// ============================================

function handlePaste(event) {
    const offerWindow = document.getElementById('window-offers');
    if (!offerWindow || offerWindow.style.display === 'none' || !offerWindow.classList.contains('focused')) {
        return;
    }

    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
                pastedImageData = e.target.result;
                showPasteImageModal(pastedImageData);
            };
            reader.readAsDataURL(file);
            event.preventDefault();
        }
    }
}

window.showPasteImageModal = function(imageData) {
    const existingModal = document.getElementById('pasteImageModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'pasteImageModal';

    const productOptions = state.products.map(id => {
        const name = document.getElementById(`productName-${id}`)?.value || `Produkt #${id}`;
        return `<option value="${id}">${name}</option>`;
    }).join('');

    modal.innerHTML = `
        <div class="modal-content" style="width: 500px;">
            <h2>Wklejony obraz</h2>
            <p>Co chcesz zrobić z tym obrazem?</p>
            <div style="text-align:center; margin: 1rem 0;"><img src="${imageData}" style="max-width:100%; max-height:200px; border-radius:8px;"></div>
            <div class="form-group">
                <button class="btn btn-primary" id="pasteToNewProductBtn">Utwórz nowy produkt z tym obrazem</button>
            </div>
            <hr style="margin: 1rem 0;">
            <div class="form-group">
                <label>Lub przypisz do istniejącego:</label>
                <select class="form-select" id="pasteProductSelect"><option value="">-- Wybierz produkt --</option>${productOptions}</select>
            </div>
            <button class="btn btn-secondary" id="pasteToSelectedProductBtn" disabled>Przypisz do wybranego</button>
            <button class="btn btn-outline" style="margin-top: 1rem;" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
        </div>
    `;
    document.body.appendChild(modal);

    const select = modal.querySelector('#pasteProductSelect');
    const pasteToSelectedBtn = modal.querySelector('#pasteToSelectedProductBtn');
    const pasteToNewBtn = modal.querySelector('#pasteToNewProductBtn');

    select.addEventListener('change', () => {
        pasteToSelectedBtn.disabled = !select.value;
    });

    pasteToNewBtn.addEventListener('click', () => {
        addProduct({ image: imageData });
        const newProductId = state.products[state.products.length - 1];
        state.productImages[newProductId] = imageData;
        updateProductImage(newProductId);
        modal.remove();
    });

    pasteToSelectedBtn.addEventListener('click', () => {
        const productId = select.value;
        if (productId) {
            state.productImages[productId] = pastedImageData;
            updateProductImage(productId);
            modal.remove();
        }
    });
}

function updateProductImage(productId) {
    const preview = document.getElementById(`productImagePreview-${productId}`);
    if (preview && state.productImages[productId]) {
        preview.innerHTML = `<img src="${state.productImages[productId]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    }
}

// ============================================
// INITIALIZATION
// ============================================

export function init() {
    console.log("Offer Generator App Initialized with full product logic.");

    // Static event listeners for the offer generator window
    document.getElementById('addProductBtn')?.addEventListener('click', () => addProduct());
    // Add other listeners for save, load, clear etc. later if needed

    // Global listener for paste
    document.addEventListener('paste', handlePaste);

    // Initial UI state
    updateProductView();
    updateSummary();
}
