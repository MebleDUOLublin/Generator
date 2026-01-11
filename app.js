/**
 * PESTECZKA OS - MAIN APPLICATION SCRIPT
 * Orchestrates all modules and application logic.
 */

// ============================================
// GLOBAL STATE
// ============================================
let currentProfile = null;
let products = [];
let productImages = {};
let productIdCounter = 0;
let pastedImageData = null;
let draggedElement = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Pesteczka OS Main App Script Started');

    try {
        await StorageSystem.init();
        await populateProfileSelector();
        
        UI.init();
        setupAppEventListeners();

        console.log('✅ Pesteczka OS Initialized Successfully');
    } catch (error) {
        console.error('❌ CRITICAL ERROR during initialization:', error);
        const loginSubtitle = document.querySelector('.login-subtitle');
        if (loginSubtitle) {
            loginSubtitle.innerHTML = '<span style="color: #ef4444;">Błąd krytyczny. Sprawdź konsolę (F12).</span>';
        }
    }
});

// ============================================
// EVENT LISTENERS SETUP
// ============================================
function setupAppEventListeners() {
    console.log('🎧 Setting up App-specific event listeners...');

    setupDesktopInteractions();
    setupTaskbarAndStartMenu();
    setupWindowManagement();
    setupOfferGenerator();
    setupSettings();
    setupGlobalHotkeys();

    document.addEventListener('paste', handlePaste);

    console.log('✅ All App event listeners attached!');
}

function renderDesktop() {
    const iconsContainer = document.getElementById('desktopIcons');
    if (!iconsContainer) return;

    iconsContainer.innerHTML = '';
    if (currentProfile.desktopIcons && Array.isArray(currentProfile.desktopIcons)) {
        currentProfile.desktopIcons.forEach(iconData => {
            const iconEl = document.createElement('div');
            iconEl.className = 'desktop-icon';
            iconEl.tabIndex = 0;
            iconEl.setAttribute('role', 'button');
            iconEl.setAttribute('aria-label', iconData.name);
            iconEl.dataset.window = iconData.id;

            iconEl.innerHTML = `
                <div class="desktop-icon-image">${iconData.icon}</div>
                <div class="desktop-icon-name">${iconData.name}</div>
            `;
            iconsContainer.appendChild(iconEl);
        });
    }
    // Re-attach listeners for new icons
    setupDesktopInteractions();
}

function setupDesktopInteractions() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const windowId = icon.dataset.window;
            if (windowId) openWindow(windowId);
        });
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    document.getElementById('desktop')?.addEventListener('click', () => {
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    });

    document.getElementById('desktop')?.addEventListener('contextmenu', (e) => UI.showContextMenu(e));

    document.getElementById('contextMenu')?.addEventListener('click', (e) => {
        const action = e.target.closest('.context-menu-item')?.dataset.action;
        if (action) {
            handleContextMenuAction(action);
            document.getElementById('contextMenu').classList.remove('active');
        }
    });
}

function setupTaskbarAndStartMenu() {
    document.querySelectorAll('.taskbar-icon[data-window]').forEach(icon => {
        icon.addEventListener('click', () => UI.toggleWindow(icon.dataset.window));
    });

    document.getElementById('startBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.toggleStartMenu();
    });

    document.querySelectorAll('.start-app').forEach(app => {
        app.addEventListener('click', () => {
            openWindow(app.dataset.window);
            UI.toggleStartMenu(false);
        });
    });

    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

function setupWindowManagement() {
    document.querySelectorAll('.window').forEach(win => {
        const windowId = win.id.replace('window-', '');
        const header = win.querySelector('.window-header');

        header?.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.window-control-btn')) {
                UI.startDrag(e, win);
            }
        });

        win.querySelectorAll('.window-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                UI.handleWindowAction(btn.dataset.action, windowId);
            });
        });

        win.addEventListener('mousedown', () => UI.focusWindow(win));
    });
}

function setupOfferGenerator() {
    document.getElementById('addProductBtn')?.addEventListener('click', () => addProduct());
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

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => UI.switchTab(tab));
    });
}

function setupSettings() {
    document.getElementById('saveProfileSettingsBtn')?.addEventListener('click', saveProfileSettings);
    document.getElementById('loadProfileSettingsBtn')?.addEventListener('click', loadProfileSettings);
    document.getElementById('logoUploadInput')?.addEventListener('change', uploadLogoFromSettings);

    document.querySelectorAll('.wallpaper-preview').forEach(preview => {
        preview.addEventListener('click', () => {
            changeWallpaper(preview.dataset.wallpaper);
            document.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
            preview.classList.add('active');
        });
    });
}

function handlePaste(event) {
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
        }
    }
}

function showPasteImageModal(imageData) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'pasteImageModal';

    const productOptions = products.map(id => {
        const name = document.getElementById(`productName-${id}`)?.value || `Produkt #${id}`;
        return `<option value="${id}">${name}</option>`;
    }).join('');

    modal.innerHTML = `
        <div class="modal-content" style="width: 500px;">
            <h2 class="modal-title">Wklejony obraz</h2>
            <p>Co chcesz zrobić z tym obrazem?</p>
            <div class="paste-image-preview">
                <img src="${imageData}" alt="Pasted image preview">
            </div>
            <div class="paste-image-actions">
                <button class="btn btn-primary" id="pasteToNewProductBtn">Utwórz nowy produkt</button>
                <div class="paste-to-existing">
                    <select class="form-select" id="pasteProductSelect">
                        <option value="">Wybierz produkt...</option>
                        ${productOptions}
                    </select>
                    <button class="btn btn-secondary" id="pasteToExistingProductBtn" disabled>Wklej do istniejącego</button>
                </div>
            </div>
            <button class="btn btn-outline" style="margin-top: 1rem;" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
        </div>
    `;

    document.body.appendChild(modal);

    const select = modal.querySelector('#pasteProductSelect');
    const pasteToExistingBtn = modal.querySelector('#pasteToExistingProductBtn');

    select.addEventListener('change', () => {
        pasteToExistingBtn.disabled = !select.value;
    });

    modal.querySelector('#pasteToNewProductBtn').addEventListener('click', () => {
        addProduct({ image: imageData });
        modal.remove();
    });

    pasteToExistingBtn.addEventListener('click', () => {
        const productId = select.value;
        if (productId) {
            const oldImage = productImages[productId];
            const command = new UpdateProductImageCommand(productId, imageData, oldImage);
            UI.Command.execute(command);
            modal.remove();
        }
    });
}

function handleContextMenuAction(action) {
    switch (action) {
        case 'change-wallpaper':
            openWindow('settings');
            break;
        case 'add-icon':
            UI.Feedback.toast('Funkcja wkrótce dostępna!', 'info');
            break;
        case 'logout':
            logout();
            break;
    }
}

function setupGlobalHotkeys() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveOffer();
        }
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            generatePDF();
        }
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            UI.Command.undo();
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            UI.Command.redo();
        }
        if (e.key === 'Escape') {
            UI.toggleStartMenu(false);
        }
    });
}

// ============================================
// PROFILE MANAGEMENT & LOGIN
// ============================================
async function populateProfileSelector() {
    try {
        const profiles = await StorageSystem.ProfileManager.getAllProfiles();
        if (!profiles || profiles.length === 0) {
            throw new Error("No profiles found in DB.");
        }

        const selector = document.querySelector('.profile-selector');
        selector.innerHTML = '';
        
        profiles.forEach((profile, index) => {
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';
            profileCard.onclick = () => loginAs(profile.key);
            profileCard.style.setProperty('--card-delay', `${index * 100}ms`);
            
            const logoHtml = profile.logo
                ? `<img src="${profile.logo}" alt="${profile.name} Logo" style="width: 100%; height: 100%; object-fit: contain;">`
                : `<span>${profile.name ? profile.name.substring(0, 1) : 'P'}</span>`;

            profileCard.innerHTML = `
                <div class="profile-logo">${logoHtml}</div>
                <h2 class="profile-name">${profile.name || 'Profil'}</h2>
                <p class="profile-desc">${profile.fullName || ''}</p>
            `;
            selector.appendChild(profileCard);
        });
    } catch (error) {
        console.error('❌ Failed to populate profile selector:', error);
        const selector = document.querySelector('.profile-selector');
        if(selector) selector.innerHTML = '<p style="color: red;">Błąd ładowania profili. Sprawdź konsolę.</p>';
    }
}

async function loginAs(profileKey) {
    try {
        currentProfile = await StorageSystem.db.get(StorageSystem.db.STORES.profiles, profileKey);
        if (!currentProfile) throw new Error(`Profile "${profileKey}" not found.`);

        const fieldMap = {
            sellerName: currentProfile.fullName,
            sellerNIP: currentProfile.nip,
            sellerAddress: currentProfile.address,
            sellerPhone: currentProfile.phone,
            sellerEmail: currentProfile.email,
            sellerBank: currentProfile.bankAccount,
            sellerContact: currentProfile.sellerName,
        };
        for (const [id, value] of Object.entries(fieldMap)) {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        }

        document.getElementById('userName').textContent = currentProfile.name || 'Użytkownik';
        document.getElementById('userEmail').textContent = currentProfile.email || '';
        document.getElementById('userAvatar').textContent = (currentProfile.name || 'U').substring(0, 2).toUpperCase();

        if (!currentProfile.logoData && currentProfile.logo) {
            await loadLogoAsBase64(currentProfile.logo);
        } else if (!currentProfile.logoData) {
            setLogoPlaceholder();
        }

        generateOfferNumber();
        setTodayDate();

        document.getElementById('loginScreen').classList.add('hidden');
        document.body.classList.remove('login-page');

        setTimeout(() => {
            document.getElementById('desktop').classList.add('active');
            UI.Feedback.show('Witaj!', `Zalogowano jako ${currentProfile.name}`, 'success');
            renderDesktop();
        }, 500);

    } catch (error) {
        console.error('Login failed:', error);
        UI.Feedback.show('Błąd logowania', 'Nie można załadować profilu: ' + error.message, 'error');
    }
}

function logout() {
    currentProfile = null;
    document.getElementById('desktop').classList.remove('active');
    setTimeout(() => {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.body.classList.add('login-page');
    }, 500);
}

async function loadLogoAsBase64(logoPath) {
    try {
        const response = await fetch(logoPath);
        if (!response.ok) throw new Error('Network response was not ok.');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            currentProfile.logoData = reader.result;
            StorageSystem.db.set(StorageSystem.db.STORES.profiles, currentProfile);
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        console.warn(`⚠️ Could not load logo from path "${logoPath}". Using placeholder.`);
        setLogoPlaceholder();
    }
}

function setLogoPlaceholder() {
    if (!currentProfile) return;
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = currentProfile.color || '#dc2626';
    ctx.fillRect(0, 0, 200, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((currentProfile.name || 'U').substring(0, 2).toUpperCase(), 100, 50);
    currentProfile.logoData = canvas.toDataURL('image/png');
}

// ============================================
// APP-SPECIFIC LOGIC
// ============================================

function openWindow(windowId) {
    UI.openWindow(windowId);
    
    // App-specific initialization logic
    if (windowId === 'settings') loadProfileSettings();
    if (windowId === 'dashboard') Dashboard.init();
    if (windowId === 'snake') NeonSnake.init('snakeCanvas');
    if (windowId === 'domator') DomatorApp.init();
}

// ============================================
// PRODUCT MANAGEMENT
// ============================================
class ProductCommand {
    constructor(action, productData = {}) {
        this.action = action;
        this.productData = productData;
        if (action === 'add' && !this.productData.id) {
            this.productData.id = Date.now() + productIdCounter++;
        }
    }

    execute() {
        if (this.action === 'add') this._addProduct();
        else this._removeProduct();
    }

    undo() {
        if (this.action === 'add') this._removeProduct();
        else this._addProduct();
    }

    _addProduct() {
        const { id, name, code, qty, price, discount, desc, image } = this.productData;
        if (!products.includes(id)) products.push(id);

        const productCard = createProductCard(id);
        document.getElementById('productsList').appendChild(productCard);

        if(name) document.getElementById(`productName-${id}`).value = name;
        if(code) document.getElementById(`productCode-${id}`).value = code;
        document.getElementById(`productQty-${id}`).value = qty || 1;
        document.getElementById(`productPrice-${id}`).value = price || 0;
        document.getElementById(`productDiscount-${id}`).value = discount || 0;
        if(desc) document.getElementById(`productDesc-${id}`).value = desc;
        if (image) {
            productImages[id] = image;
            updateProductImage(id);
        }

        updateProductView();
        updateSummary();
    }

    _removeProduct() {
        const { id } = this.productData;
        const el = document.getElementById(`product-${id}`);
        if(el) {
            // Save state for undo
            this.productData.name = document.getElementById(`productName-${id}`).value;
            this.productData.desc = document.getElementById(`productDesc-${id}`).value;
            this.productData.image = productImages[id];
            el.remove();
        }
        products = products.filter(pId => pId !== id);
        delete productImages[id];
        updateProductView();
        updateSummary();
    }
}


function createProductCard(productId) {
    const card = document.createElement('div');
    card.id = `product-${productId}`;
    card.className = 'product-card';
    card.draggable = true;
    card.addEventListener('dragstart', (e) => dragStart(e, productId));
    card.addEventListener('dragover', dragOver);
    card.addEventListener('drop', (e) => drop(e, productId));

    card.innerHTML = `
        <div class="drag-handle">☰</div>
        <div class="product-content-wrapper">
            <div class="product-image-zone">
                <div id="productImagePreview-${productId}" class="product-image-preview">📷</div>
                <input id="productImage-${productId}" type="file" accept="image/*" style="display:none">
            </div>
            <div class="product-details">
                <div class="form-group">
                    <label class="form-label">Nazwa produktu</label>
                    <input id="productName-${productId}" type="text" class="form-input" oninput="updateSummary()">
                </div>
                <div class="form-grid-inner">
                    <div class="form-group"><label class="form-label">Kod</label><input id="productCode-${productId}" type="text" class="form-input"></div>
                    <div class="form-group"><label class="form-label">Ilość</label><input id="productQty-${productId}" type="number" value="1" class="form-input" oninput="updateSummary()"></div>
                    <div class="form-group"><label class="form-label">Cena netto</label><input id="productPrice-${productId}" type="number" value="0" class="form-input" oninput="updateSummary()"></div>
                    <div class="form-group"><label class="form-label">Rabat (%)</label><input id="productDiscount-${productId}" type="number" value="0" class="form-input" oninput="updateSummary()"></div>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Opis produktu</label>
            <textarea id="productDesc-${productId}" class="form-textarea" rows="2" placeholder="• Cecha 1\n• Cecha 2"></textarea>
        </div>
        <div class="product-actions">
            <button class="btn btn-outline" id="duplicateProductBtn-${productId}">📋 Duplikuj</button>
            <button class="btn btn-outline btn-danger" id="removeProductBtn-${productId}">🗑️ Usuń</button>
        </div>
    `;

    // Add event listeners
    card.querySelector('.product-image-zone').addEventListener('click', () => card.querySelector(`#productImage-${productId}`).click());
    card.querySelector(`#productImage-${productId}`).addEventListener('change', (e) => uploadProductImage(productId, e));
    card.querySelector(`#duplicateProductBtn-${productId}`).addEventListener('click', () => duplicateProduct(productId));
    card.querySelector(`#removeProductBtn-${productId}`).addEventListener('click', () => removeProduct(productId));

    return card;
}


class DuplicateProductCommand {
    constructor(originalProductId) {
        this.originalProductId = originalProductId;
        this.newProductCommand = null;
    }

    execute() {
        const originalData = {
            name: `${document.getElementById(`productName-${this.originalProductId}`).value} (Kopia)`,
            code: document.getElementById(`productCode-${this.originalProductId}`).value,
            qty: document.getElementById(`productQty-${this.originalProductId}`).value,
            price: document.getElementById(`productPrice-${this.originalProductId}`).value,
            discount: document.getElementById(`productDiscount-${this.originalProductId}`).value,
            desc: document.getElementById(`productDesc-${this.originalProductId}`).value,
            image: productImages[this.originalProductId]
        };
        this.newProductCommand = new ProductCommand('add', originalData);
        UI.Command.execute(this.newProductCommand);
        UI.Feedback.toast('📋 Produkt zduplikowany', 'info');
    }

    undo() {
        if(this.newProductCommand) {
            this.newProductCommand.undo();
            UI.Feedback.toast('Cofnięto duplikację', 'info');
        }
    }
}

class UpdateProductImageCommand {
    constructor(productId, newImage, oldImage) {
        this.productId = productId;
        this.newImage = newImage;
        this.oldImage = oldImage;
    }

    execute() {
        productImages[this.productId] = this.newImage;
        updateProductImage(this.productId);
        UI.Feedback.toast('🖼️ Zaktualizowano obraz produktu', 'success');
    }

    undo() {
        productImages[this.productId] = this.oldImage;
        updateProductImage(this.productId);
        UI.Feedback.toast('Cofnięto zmianę obrazu produktu', 'info');
    }
}

function updateProductView() {
    const productsListEl = document.getElementById('productsList');
    const emptyStateEl = productsListEl.querySelector('.empty-state');
    if (products.length > 0) {
        if(emptyStateEl) emptyStateEl.style.display = 'none';
    } else {
        if(emptyStateEl) emptyStateEl.style.display = 'block';
    }
}

function addProduct(initialData = {}) {
    const command = new ProductCommand('add', initialData);
    UI.Command.execute(command);
}

function removeProduct(productId) {
    const command = new ProductCommand('remove', { id: productId });
    UI.Command.execute(command);
    UI.Feedback.toast('🗑️ Usunięto produkt', 'info');
}

function updateProductImage(productId) {
    const preview = document.getElementById(`productImagePreview-${productId}`);
    if (preview && productImages[productId]) {
        preview.innerHTML = `<img src="${productImages[productId]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    } else if(preview) {
        preview.innerHTML = '📷';
    }
}

function duplicateProduct(productId) {
    const command = new DuplicateProductCommand(productId);
    UI.Command.execute(command);
}

function uploadProductImage(productId, event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const oldImage = productImages[productId];
        const command = new UpdateProductImageCommand(productId, e.target.result, oldImage);
        UI.Command.execute(command);
    };
    reader.readAsDataURL(file);
}

// Product drag & drop
function dragStart(event, productId) {
    draggedElement = document.getElementById(`product-${productId}`);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => draggedElement.classList.add('dragging'), 0);
}

function dragOver(event) {
    event.preventDefault();
    const container = document.getElementById('productsList');
    const afterElement = getDragAfterElement(container, event.clientY);
    const dragging = document.querySelector('.dragging');
    if (afterElement == null) {
        container.appendChild(dragging);
    } else {
        container.insertBefore(dragging, afterElement);
    }
}

function drop(event, targetProductId) {
    event.preventDefault();
    if (draggedElement) {
        draggedElement.classList.remove('dragging');

        const draggedId = parseInt(draggedElement.id.replace('product-', ''));
        const targetId = targetProductId;

        const draggedIndex = products.indexOf(draggedId);
        const targetEl = document.getElementById(`product-${targetId}`);
        const allCards = Array.from(document.querySelectorAll('.product-card'));
        const targetIndex = allCards.indexOf(targetEl);

        const [removed] = products.splice(draggedIndex, 1);
        products.splice(targetIndex, 0, removed);

        draggedElement = null;
    }
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
    tbody.innerHTML = '';
    
    let totalNet = 0;
    
    products.forEach((productId, index) => {
        const name = document.getElementById(`productName-${productId}`)?.value || '';
        if (!name.trim()) return;
        
        const qty = parseFloat(document.getElementById(`productQty-${productId}`).value) || 0;
        const price = parseFloat(document.getElementById(`productPrice-${productId}`).value) || 0;
        const discount = parseFloat(document.getElementById(`productDiscount-${productId}`).value) || 0;
        
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
    
    if (tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 3rem;">Brak produktów</td></tr>';
    }
    
    const vatRate = (parseInt(document.getElementById('vatRate')?.value) || 23) / 100;
    const vat = totalNet * vatRate;
    const gross = totalNet + vat;
    
    document.getElementById('totalNet').textContent = totalNet.toFixed(2) + ' zł';
    document.getElementById('totalVat').textContent = vat.toFixed(2) + ' zł';
    document.getElementById('totalGross').textContent = gross.toFixed(2) + ' zł';
}

// ============================================
// PDF GENERATION
// ============================================

async function generatePDF() {
    if (!currentProfile) {
        UI.Feedback.show('Błąd', 'Brak aktywnego profilu.', 'error');
        return;
    }

    const offerData = {
        number: document.getElementById('offerNumber').value,
        date: document.getElementById('offerDate').value,
        validUntil: document.getElementById('validUntil').value,
        currency: document.getElementById('currency').value,
        paymentTerms: document.getElementById('paymentTerms').value,
        deliveryTime: document.getElementById('deliveryTime').value,
        warranty: document.getElementById('warranty').value,
        deliveryMethod: document.getElementById('deliveryMethod').value,
        buyer: {
            name: document.getElementById('buyerName').value,
            nip: document.getElementById('buyerNIP').value,
            address: document.getElementById('buyerAddress').value,
            phone: document.getElementById('buyerPhone').value,
            email: document.getElementById('buyerEmail').value,
        },
        notes: document.getElementById('orderNotes').value
    };

    const pdfProducts = products.map(id => ({
        name: document.getElementById(`productName-${id}`).value,
        code: document.getElementById(`productCode-${id}`).value,
        qty: document.getElementById(`productQty-${id}`).value,
        price: document.getElementById(`productPrice-${id}`).value,
        discount: document.getElementById(`productDiscount-${id}`).value,
        desc: document.getElementById(`productDesc-${id}`).value,
        image: productImages[id] || null,
    }));

    document.getElementById('loadingOverlay').classList.add('show');

    try {
        const sellerData = {
            ...currentProfile,
            fullName: document.getElementById('sellerName').value,
            name: document.getElementById('sellerName').value,
            nip: document.getElementById('sellerNIP').value,
            address: document.getElementById('sellerAddress').value,
            phone: document.getElementById('sellerPhone').value,
            email: document.getElementById('sellerEmail').value,
            bankAccount: document.getElementById('sellerBank').value,
            sellerName: document.getElementById('sellerContact').value,
        };

        const pdf = await PDFManager.generatePDF({
            orientation: document.getElementById('pdfOrientation').value,
            format: document.getElementById('pdfFormat').value,
            vatRate: parseInt(document.getElementById('vatRate').value),
            seller: sellerData,
            products: pdfProducts,
            offerData: offerData
        });
        
        const filename = `Oferta_${offerData.number.replace(/\//g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
        PDFManager.savePDF(pdf, filename);
        
        UI.Feedback.show('Sukces', 'PDF został pomyślnie wygenerowany!', 'success');
    } catch (error) {
        console.error('PDF Generation Error:', error);
        UI.Feedback.show('Błąd', 'Nie udało się wygenerować PDF: ' + error.message, 'error');
    } finally {
        document.getElementById('loadingOverlay').classList.remove('show');
    }
}

// ============================================
// DATA PERSISTENCE (SAVE/LOAD)
// ============================================

async function saveOffer() {
    if (!currentProfile) {
        UI.Feedback.show('Błąd', 'Zaloguj się, aby zapisać ofertę.', 'error');
        return;
    }
    
    const offerData = {
        id: document.getElementById('offerNumber').value || `offer_${Date.now()}`,
        profileKey: currentProfile.key,
        offer: {
            number: document.getElementById('offerNumber').value,
            date: document.getElementById('offerDate').value,
            validUntil: document.getElementById('validUntil').value,
            currency: document.getElementById('currency').value
        },
        buyer: {
            name: document.getElementById('buyerName').value,
            nip: document.getElementById('buyerNIP').value,
            address: document.getElementById('buyerAddress').value,
            phone: document.getElementById('buyerPhone').value,
            email: document.getElementById('buyerEmail').value
        },
        terms: {
            payment: document.getElementById('paymentTerms').value,
            delivery: document.getElementById('deliveryTime').value,
            warranty: document.getElementById('warranty').value,
            deliveryMethod: document.getElementById('deliveryMethod').value
        },
        products: products.map(id => ({
            id,
            name: document.getElementById(`productName-${id}`).value,
            code: document.getElementById(`productCode-${id}`).value,
            qty: document.getElementById(`productQty-${id}`).value,
            price: document.getElementById(`productPrice-${id}`).value,
            discount: document.getElementById(`productDiscount-${id}`).value,
            desc: document.getElementById(`productDesc-${id}`).value,
            image: productImages[id] || null
        })),
        timestamp: new Date().toISOString()
    };

    try {
        await StorageSystem.db.set(StorageSystem.db.STORES.offers, offerData);
        UI.Feedback.show('Zapisano!', `Oferta ${offerData.id} została zapisana.`, 'success');
    } catch (error) {
        console.error('Save offer error:', error);
        UI.Feedback.show('Błąd zapisu', 'Nie udało się zapisać oferty.', 'error');
    }
}

async function loadOffer() {
    if (!currentProfile) {
        UI.Feedback.show('Błąd', 'Zaloguj się, aby wczytać oferty.', 'error');
        return;
    }

    try {
        const profileOffers = (await StorageSystem.db.getAll(StorageSystem.db.STORES.offers))
            .filter(o => o.profileKey === currentProfile.key)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (profileOffers.length === 0) {
            UI.Feedback.show('Informacja', 'Brak zapisanych ofert dla tego profilu.', 'info');
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
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="width: 700px;">
                <h2 class="modal-title">Wczytaj ofertę</h2>
                <div class="offers-history-list">${listHTML}</div>
                <button class="btn btn-outline" style="margin-top: 1.5rem;" onclick="this.closest('.modal-overlay').remove()">Anuluj</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelectorAll('.offer-history-item').forEach(item => {
            item.addEventListener('click', () => {
                loadOfferFromHistory(item.dataset.offerId);
                modal.remove();
            });
        });

    } catch (error) {
        console.error('Load offer error:', error);
        UI.Feedback.show('Błąd wczytywania', 'Nie udało się wczytać historii ofert.', 'error');
    }
}

async function loadOfferFromHistory(offerId) {
    try {
        const offer = await StorageSystem.db.get(StorageSystem.db.STORES.offers, offerId);
        if (!offer) throw new Error("Offer not found.");

        // Clear current form
        products = [];
        productImages = {};
        document.getElementById('productsList').innerHTML = ''; // Keep empty state
        updateProductView();

        const fields = {
            'offerNumber': offer.offer?.number, 'offerDate': offer.offer?.date, 'validUntil': offer.offer?.validUntil,
            'currency': offer.offer?.currency, 'buyerName': offer.buyer?.name, 'buyerNIP': offer.buyer?.nip,
            'buyerAddress': offer.buyer?.address, 'buyerPhone': offer.buyer?.phone, 'buyerEmail': offer.buyer?.email,
            'paymentTerms': offer.terms?.payment, 'deliveryTime': offer.terms?.delivery,
            'warranty': offer.terms?.warranty, 'deliveryMethod': offer.terms?.deliveryMethod
        };
        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        });

        if (offer.products) {
            offer.products.forEach(p => addProduct(p));
        }

        updateSummary();
        UI.Feedback.show('Wczytano!', `Załadowano ofertę ${offer.id}.`, 'success');

    } catch (error) {
        console.error('Load from history error:', error);
        UI.Feedback.show('Błąd', 'Nie udało się wczytać wybranej oferty.', 'error');
    }
}

// ============================================
// SETTINGS WINDOW
// ============================================

function loadProfileSettings() {
    if (!currentProfile) return;
    const fields = {
        'settingsName': currentProfile.name, 'settingsFullName': currentProfile.fullName, 'settingsNIP': currentProfile.nip,
        'settingsPhone': currentProfile.phone, 'settingsAddress': currentProfile.address, 'settingsEmail': currentProfile.email,
        'settingsBankAccount': currentProfile.bankAccount, 'settingsSellerName': currentProfile.sellerName,
        'settingsSellerPosition': currentProfile.sellerPosition, 'settingsSellerPhone': currentProfile.sellerPhone,
        'settingsSellerEmail': currentProfile.sellerEmail
    };
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    });
    
    const preview = document.getElementById('logoPreview');
    if (preview) {
        preview.innerHTML = currentProfile.logoData
            ? `<img src="${currentProfile.logoData}" style="width: 100%; height: 100%; object-fit: contain;">`
            : '📋';
    }
}

async function saveProfileSettings() {
    if (!currentProfile) return;
    const updatedProfile = { ...currentProfile };
    const fields = [
        'name', 'fullName', 'nip', 'phone', 'address', 'email', 'bankAccount',
        'sellerName', 'sellerPosition', 'sellerPhone', 'sellerEmail'
    ];
    fields.forEach(field => {
        const el = document.getElementById(`settings${field.charAt(0).toUpperCase() + field.slice(1)}`);
        if (el) updatedProfile[field] = el.value;
    });
    
    try {
        await StorageSystem.ProfileManager.saveProfile(updatedProfile);
        currentProfile = updatedProfile;
        
        document.getElementById('sellerName').value = currentProfile.fullName || '';
        
        UI.Feedback.show('Zapisano!', 'Ustawienia profilu zostały zaktualizowane.', 'success');
        UI.closeWindow('settings');
    } catch (error) {
        console.error('Save profile error:', error);
        UI.Feedback.show('Błąd', 'Nie udało się zapisać ustawień.', 'error');
    }
}

function uploadLogoFromSettings(event) {
    const file = event.target.files[0];
    if (!file || !currentProfile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentProfile.logoData = e.target.result;
        const preview = document.getElementById('logoPreview');
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
        }
        UI.Feedback.toast('📸 Logo gotowe do zapisania', 'info');
    };
    reader.readAsDataURL(file);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

function changeWallpaper(wallpaper) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;

    const wallpapers = {
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        wallpaper1: "url('userData/wallpapers/wallpaper1.jpg')",
        wallpaper2: "url('userData/wallpapers/wallpaper2.jpg')",
        wallpaper3: "url('userData/wallpapers/wallpaper3.jpg')"
    };

    if (wallpapers[wallpaper]) {
        desktop.style.backgroundImage = wallpapers[wallpaper];
        desktop.style.backgroundSize = 'cover';
        desktop.style.backgroundPosition = 'center';
        UI.Feedback.toast(`🖼️ Zmieniono tapetę`, 'info');
        localStorage.setItem('pesteczkaOS_wallpaper', wallpaper);
    }
}

// On load, check for saved wallpaper
document.addEventListener('DOMContentLoaded', () => {
    const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper') || 'default';
    changeWallpaper(savedWallpaper);
    document.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
    const activePreview = document.querySelector(`.wallpaper-preview[data-wallpaper="${savedWallpaper}"]`);
    if (activePreview) activePreview.classList.add('active');
});

console.log('✅ App.js loaded successfully');
