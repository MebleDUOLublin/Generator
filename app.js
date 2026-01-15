/**
 * PESTECZKA OS - MAIN APPLICATION SCRIPT (FIXED)
 * Orchestrates all modules and application logic.
 */

// ============================================
// GLOBAL STATE
// ============================================
let currentProfile = null;
let products = [];
let productImages = {};
let productIdCounter = 0;
let draggedWindow = null;
let dragOffset = { x: 0, y: 0 };
let pastedImageData = null;
let zIndexCounter = 1000;
let draggedElement = null;
let autosaveInterval = null;

// ============================================
// UI SETUP
// ============================================
function setupUI() {
    console.log('🎨 Setting up UI event listeners...');
    
    updateClock();
    setInterval(updateClock, 1000);

    setupDesktopInteractions();
    setupTaskbarAndStartMenu();
    setupWindowManagement();
    setupOfferGenerator();
    setupSettings();
    setupGlobalEventListeners();

    console.log('✅ All UI event listeners attached!');
}

function renderUIForProfile() {
    if (!currentProfile) return;

    // 1. Render Desktop Icons
    const iconsContainer = document.getElementById('desktopIcons');
    if (iconsContainer) {
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
    }

    // 2. Render Taskbar Icons
    const taskbarCenter = document.querySelector('.taskbar-center');
    if (taskbarCenter) {
        const existingIcons = taskbarCenter.querySelectorAll('.taskbar-icon:not(#startBtn)');
        existingIcons.forEach(icon => icon.remove());

        if (currentProfile.desktopIcons && Array.isArray(currentProfile.desktopIcons)) {
            currentProfile.desktopIcons.forEach(iconData => {
                 const iconEl = document.createElement('div');
                 iconEl.className = 'taskbar-icon';
                 iconEl.dataset.window = iconData.id;
                 iconEl.tabIndex = 0;
                 iconEl.setAttribute('role', 'button');
                 iconEl.setAttribute('aria-label', iconData.name);
                 iconEl.innerHTML = iconData.icon;
                 taskbarCenter.appendChild(iconEl);
            });
        }
    }

    // 3. Render Start Menu Items
    const startAppsGrid = document.querySelector('.start-apps-grid');
    if (startAppsGrid) {
        startAppsGrid.innerHTML = '';
        if (currentProfile.startMenuItems && Array.isArray(currentProfile.startMenuItems)) {
            currentProfile.startMenuItems.forEach(itemData => {
                const itemEl = document.createElement('div');
                itemEl.className = 'start-app';
                itemEl.dataset.window = itemData.id;
                itemEl.tabIndex = 0;
                itemEl.setAttribute('role', 'menuitem');

                itemEl.innerHTML = `
                    <div class="start-app-icon">${itemData.icon}</div>
                    <div class="start-app-name">${itemData.name}</div>
                `;
                startAppsGrid.appendChild(itemEl);
            });
        }
    }

    // 4. Re-attach ALL relevant listeners
    setupDesktopInteractions();
    setupTaskbarAndStartMenu();
}


function setupDesktopInteractions() {
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dblclick', () => {
            const windowId = icon.dataset.window;
            if (windowId) openWindow(windowId);
        });
        icon.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    const desktopEl = document.getElementById('desktop');
    if (desktopEl) {
        desktopEl.addEventListener('click', (e) => {
            if (e.target.id === 'desktop' || e.target.classList.contains('desktop-icons')) {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            }
        });

        const contextMenu = document.getElementById('contextMenu');
        desktopEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.classList.add('active');
        });

        contextMenu?.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action) {
                handleContextMenuAction(action);
                contextMenu.classList.remove('active');
            }
        });
    }
}

function setupTaskbarAndStartMenu() {
    document.querySelectorAll('.taskbar-icon[data-window]').forEach(icon => {
        icon.addEventListener('click', () => toggleWindow(icon.dataset.window));
    });

    document.getElementById('startBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
    });

    document.querySelectorAll('.start-app').forEach(app => {
        app.addEventListener('click', () => {
            openWindow(app.dataset.window);
            document.getElementById('startMenu')?.classList.remove('active');
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
                startDrag(e, windowId);
            }
        });

        win.querySelectorAll('.window-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleWindowAction(btn.dataset.action, windowId);
            });
        });

        win.addEventListener('mousedown', () => focusWindow(win));
    });
}

function setupOfferGenerator() {
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
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(tab.dataset.tab, e));
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

function setupGlobalEventListeners() {
    document.addEventListener('click', (e) => {
        const startMenu = document.getElementById('startMenu');
        const startBtn = document.getElementById('startBtn');
        if (startMenu?.classList.contains('active') && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.classList.remove('active');
        }
        document.getElementById('contextMenu')?.classList.remove('active');
    });

    document.addEventListener('mousemove', handleWindowDrag);
    document.addEventListener('mouseup', stopWindowDrag);
    document.addEventListener('keydown', handleGlobalHotkeys);
    document.addEventListener('paste', handlePaste);
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
            <h2>Wklejony obraz</h2>
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
    const pasteToNewProductBtn = modal.querySelector('#pasteToNewProductBtn');

    select.addEventListener('change', () => {
        pasteToExistingBtn.disabled = !select.value;
    });

    pasteToNewProductBtn.addEventListener('click', () => {
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

function handleWindowAction(action, windowId) {
    switch (action) {
        case 'minimize':
            minimizeWindow(windowId);
            break;
        case 'maximize':
            maximizeWindow(windowId);
            break;
        case 'close':
            closeWindow(windowId);
            break;
    }
}

function focusWindow(win) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    win.style.zIndex = ++zIndexCounter;
}

function handleGlobalHotkeys(e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveOffer();
    }
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        generatePDF();
    }
    if (e.key === 'Escape') {
        document.getElementById('startMenu')?.classList.remove('active');
    }
}

// ============================================
// COMMAND CLASSES
// ============================================
class ProductCommand {
    constructor(action, productData) {
        this.action = action;
        this.productData = productData;
        this.productId = productData.id;
    }

    execute() {
        if (this.action === 'add') {
            const productsListEl = document.getElementById('productsList');
            if (!products.includes(this.productId)) {
                products.push(this.productId);
                const productCard = createProductCard(this.productId);
                productsListEl.appendChild(productCard);
                Object.entries(this.productData).forEach(([key, value]) => {
                    const el = document.getElementById(`product${key.charAt(0).toUpperCase() + key.slice(1)}-${this.productId}`);
                    if (el && key !== 'id') el.value = value;
                });
            }
        } else if (this.action === 'remove') {
            const productCard = document.getElementById(`product-${this.productId}`);
            if (productCard) {
                productCard.remove();
                products = products.filter(id => id !== this.productId);
                delete productImages[this.productId];
            }
        }
        updateProductView();
        updateSummary();
    }

    undo() {
        if (this.action === 'add') {
            const productCard = document.getElementById(`product-${this.productId}`);
            if (productCard) productCard.remove();
            products = products.filter(id => id !== this.productId);
        } else if (this.action === 'remove') {
            // This is simplified, a real undo would need to restore the exact state
            addProduct(this.productData);
        }
        updateProductView();
        updateSummary();
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
    }

    undo() {
        productImages[this.productId] = this.oldImage;
        updateProductImage(this.productId);
    }
}

class DuplicateProductCommand {
    constructor(originalId) {
        this.originalId = originalId;
        this.newId = Date.now() + productIdCounter++;
    }

    execute() {
        const originalData = {
            id: this.newId,
            name: document.getElementById(`productName-${this.originalId}`)?.value || '',
            code: document.getElementById(`productCode-${this.originalId}`)?.value || '',
            qty: document.getElementById(`productQty-${this.originalId}`)?.value || '1',
            price: document.getElementById(`productPrice-${this.originalId}`)?.value || '0',
            discount: document.getElementById(`productDiscount-${this.originalId}`)?.value || '0',
            desc: document.getElementById(`productDesc-${this.originalId}`)?.value || '',
        };
        const originalImage = productImages[this.originalId];

        addProduct(originalData);
        if (originalImage) {
             productImages[this.newId] = originalImage;
             updateProductImage(this.newId);
        }
    }

    undo() {
        removeProduct(this.newId);
    }
}

// ============================================
// PROFILE MANAGEMENT & LOGIN
// ============================================
async function populateProfileSelector() {
    try {
        const profiles = await StorageSystem.ProfileManager.getAllProfiles();

        if (!profiles || profiles.length === 0) {
            console.warn('⚠️ No profiles found in DB.');
            const selector = document.querySelector('.profile-selector');
            if(selector) selector.innerHTML = '<p style="color: white;">Nie znaleziono profili. Sprawdź plik profiles.json i konsolę.</p>';
            return;
        }

        const selector = document.querySelector('.profile-selector');
        if (!selector) {
            console.error('Profile selector element not found in HTML');
            return;
        }
        
        selector.innerHTML = '';
        
        profiles.forEach((profile, index) => {
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';
            profileCard.onclick = () => loginAs(profile.key);
            profileCard.style.setProperty('--card-delay', `${index * 100}ms`);
            
            const logoHtml = profile.logo
                ? `<img src="${profile.logo}" alt="${profile.name} Logo" class="profile-logo">`
                : `<div class="profile-logo">${profile.name ? profile.name.substring(0, 1) : 'P'}</div>`;


            profileCard.innerHTML = `
                ${logoHtml}
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

        if (!currentProfile) {
            UI.Feedback.show('Błąd', 'Profil nie znaleziony', 'error');
            return;
        }

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
            UI.Feedback.toast(`Witaj, ${currentProfile.name}!`, 'success');
            renderUIForProfile();
        }, 500);
    } catch (error) {
        console.error('Login failed:', error);
        UI.Feedback.show('Błąd logowania', 'Nie można załadować profilu: ' + error.message, 'error');
    }
}

function logout() {
    currentProfile = null;
    document.getElementById('desktop').classList.remove('active');
    document.body.classList.add('login-page');
    setTimeout(() => {
        document.getElementById('loginScreen').classList.remove('hidden');
    }, 500);
}

async function loadLogoAsBase64(logoPath) {
    try {
        const response = await fetch(logoPath);
        if (!response.ok) throw new Error('Network response was not ok.');
        const blob = await response.blob();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                currentProfile.logoData = reader.result;
                StorageSystem.db.set(StorageSystem.db.STORES.profiles, currentProfile);
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn(`⚠️ Could not load logo from path "${logoPath}". Using placeholder.`);
        setLogoPlaceholder();
    }
}

function setLogoPlaceholder() {
    if (!currentProfile) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = currentProfile.color || '#dc2626';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((currentProfile.name || 'U').substring(0, 2).toUpperCase(), 100, 50);
    
    currentProfile.logoData = canvas.toDataURL('image/png');
}

// ============================================
// WINDOW MANAGEMENT
// ============================================
function openWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win) return;
    
    win.style.display = 'flex';
    win.classList.add('active');
    win.classList.remove('minimized');
    
    focusWindow(win);
    
    const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
    if(taskbarIcon) {
        taskbarIcon.classList.add('active');
        taskbarIcon.classList.add('open');
    }
    
    if (windowId === 'settings') loadProfileSettings();
    if (windowId === 'dashboard') Dashboard.init();
    if (windowId === 'snake') NeonSnake.init('snakeCanvas');
    if (windowId === 'domator') DomatorApp.init();

    if (windowId === 'offers') {
        initializeAdvancedUI();
        if (autosaveInterval) clearInterval(autosaveInterval);
        autosaveInterval = setInterval(autosaveOffer, 60000);
    }
}

function closeWindow(windowId) {
    if (windowId === 'offers' && autosaveInterval) {
        clearInterval(autosaveInterval);
        autosaveInterval = null;
    }

    const win = document.getElementById(`window-${windowId}`);
    if (win) {
        win.classList.add('closing');
        win.addEventListener('animationend', () => {
            win.classList.remove('active', 'focused', 'closing');
            win.style.display = 'none';
        }, { once: true });
    }
    const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
    if (taskbarIcon) {
        taskbarIcon.classList.remove('active', 'open');
    }
}

function minimizeWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (win) {
        win.classList.add('minimized');
        win.classList.remove('focused');
        setTimeout(() => {
             win.style.display = 'none';
        }, 200);
    }
}

function maximizeWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win) return;
    
    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        win.style.top = win.dataset.prevTop || '50px';
        win.style.left = win.dataset.prevLeft || '100px';
        win.style.width = win.dataset.prevWidth || '90vw';
        win.style.height = win.dataset.prevHeight || '85vh';
    } else {
        win.dataset.prevTop = win.style.top;
        win.dataset.prevLeft = win.style.left;
        win.dataset.prevWidth = win.style.width;
        win.dataset.prevHeight = win.style.height;
        win.classList.add('maximized');
    }
}

function toggleWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win) return;

    if (win.style.display === 'flex' && !win.classList.contains('minimized')) {
        minimizeWindow(windowId);
    } else {
        openWindow(windowId);
    }
}

function startDrag(event, windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win || win.classList.contains('maximized')) return;
    
    draggedWindow = win;
    focusWindow(win);
    
    const rect = win.getBoundingClientRect();
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;
    
    event.preventDefault();
}

function handleWindowDrag(event) {
    if (!draggedWindow) return;
    const desktop = document.getElementById('desktop');
    const headerHeight = 40;
    const taskbarHeight = 40;
    
    const maxLeft = desktop.clientWidth - draggedWindow.clientWidth;
    const maxTop = desktop.clientHeight - draggedWindow.clientHeight - taskbarHeight;

    let newX = event.clientX - dragOffset.x;
    let newY = event.clientY - dragOffset.y;

    newX = Math.max(0, Math.min(newX, maxLeft));
    newY = Math.max(0, Math.min(newY, maxTop));
    
    draggedWindow.style.left = newX + 'px';
    draggedWindow.style.top = newY + 'px';
}

function stopWindowDrag() {
    draggedWindow = null;
}

// ============================================
// TAB SWITCHING & START MENU
// ============================================
function switchTab(tabId, event) {
    const tabsContainer = event.target.closest('.tabs');
    const windowContent = event.target.closest('.window-content');

    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    windowContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeTabContent = windowContent.querySelector(`#${tabId}-tab`);
    if(activeTabContent) activeTabContent.classList.add('active');
}

function toggleStartMenu() {
    const menu = document.getElementById('startMenu');
    if(menu) menu.classList.toggle('active');
}

// ============================================
// PRODUCT MANAGEMENT
// ============================================
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
            createButton('🗑️ Usuń', () => UI.Command.execute(new ProductCommand('remove', { id: productId })), 'btn btn-outline btn-danger')
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
    const command = new ProductCommand('add', { ...productData, id: newId });
    UI.Command.execute(command);

    if (productData.image) {
        const commandImg = new UpdateProductImageCommand(newId, productData.image, null);
        UI.Command.execute(commandImg);
    }
}

function removeProduct(productId) {
    const productData = { id: productId };
    const command = new ProductCommand('remove', productData);
    UI.Command.execute(command);
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

        // Update products array order
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

// ============================================
// PDF GENERATION
// ============================================
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

// ============================================
// DATA PERSISTENCE (SAVE/LOAD)
// ============================================
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

// ============================================
// SETTINGS WINDOW
// ============================================
function loadProfileSettings() {
    if (!currentProfile) return;
    const fields = {
        'settingsName': currentProfile.name, 'settingsFullName': currentProfile.fullName,
        'settingsNIP': currentProfile.nip, 'settingsPhone': currentProfile.phone,
        'settingsAddress': currentProfile.address, 'settingsEmail': currentProfile.email,
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
        preview.innerHTML = currentProfile.logoData ? `<img src="${currentProfile.logoData}" style="width: 100%; height: 100%; object-fit: contain;">` : '📋';
    }
}

async function saveProfileSettings() {
    if (!currentProfile) return;
    const updatedProfile = {
        ...currentProfile,
        name: document.getElementById('settingsName')?.value,
        fullName: document.getElementById('settingsFullName')?.value,
        nip: document.getElementById('settingsNIP')?.value,
        phone: document.getElementById('settingsPhone')?.value,
        address: document.getElementById('settingsAddress')?.value,
        email: document.getElementById('settingsEmail')?.value,
        bankAccount: document.getElementById('settingsBankAccount')?.value,
        sellerName: document.getElementById('settingsSellerName')?.value,
        sellerPosition: document.getElementById('settingsSellerPosition')?.value,
        sellerPhone: document.getElementById('settingsSellerPhone')?.value,
        sellerEmail: document.getElementById('settingsSellerEmail')?.value,
    };
    
    try {
        await StorageSystem.ProfileManager.saveProfile(updatedProfile);
        currentProfile = updatedProfile;
        document.getElementById('sellerName').value = currentProfile.fullName || '';
        UI.Feedback.toast('Ustawienia profilu zostały zaktualizowane.', 'success');
        closeWindow('settings');
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
        document.getElementById('logoPreview').innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: contain;">`;
        UI.Feedback.toast('📸 Logo gotowe do zapisania', 'info');
    };
    reader.readAsDataURL(file);
}

// ============================================
// UTILITY & UI HELPER FUNCTIONS
// ============================================
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.querySelector('.clock-time').textContent = time;
        clockEl.querySelector('.clock-date').textContent = date;
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

function changeWallpaper(wallpaper) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const wallpapers = {
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        wallpaper1: 'url(\'userData/wallpapers/wallpaper1.jpg\')',
        wallpaper2: 'url(\'userData/wallpapers/wallpaper2.jpg\')',
        wallpaper3: 'url(\'userData/wallpapers/wallpaper3.jpg\')',
        wallpaper4: 'url(\'userData/wallpapers/wallpaper4.jpg\')'
    };
    if (wallpapers[wallpaper]) {
        desktop.style.backgroundImage = wallpapers[wallpaper];
        desktop.style.backgroundSize = 'cover';
        desktop.style.backgroundPosition = 'center';
        UI.Feedback.toast(`🖼️ Zmieniono tapetę`, 'info');
        localStorage.setItem('pesteczkaOS_wallpaper', wallpaper);
    }
}

function applySavedWallpaper() {
    const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper') || 'default';
    changeWallpaper(savedWallpaper);
    document.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
    const activePreview = document.querySelector(`.wallpaper-preview[data-wallpaper="${savedWallpaper}"]`);
    if (activePreview) {
        activePreview.classList.add('active');
    }
}

console.log('✅ App.js loaded successfully');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Pesteczka OS Main App Script Started');

    try {
        if (!window.StorageSystem || typeof window.StorageSystem.init !== 'function') {
            throw new Error('StorageSystem not found or is not a valid module.');
        }
        await window.StorageSystem.init();

        await populateProfileSelector();

        setupUI();
        applySavedWallpaper();

        console.log('✅ Pesteczka OS Initialized Successfully');
    } catch (error) {
        console.error('❌ CRITICAL ERROR during initialization:', error);
        document.body.innerHTML = `<div class="critical-error-container">
            <h1>Błąd krytyczny</h1>
            <p>Nie można załadować aplikacji. Sprawdź konsolę (F12), aby uzyskać szczegółowe informacje.</p>
            <pre>${error.stack}</pre>
        </div>`;
    }
});
