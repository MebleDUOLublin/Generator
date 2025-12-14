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

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Pesteczka OS Main App Script Started');

    try {
        console.log('1. Awaiting Storage System initialization...');
        if (window.StorageSystem && typeof window.StorageSystem.init === 'function') {
            await window.StorageSystem.init();
        }
        
        console.log('2. Populating profile selector...');
        await populateProfileSelector();
        
        console.log('3. Setting up core UI...');
        setupUI();

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

function setupDesktopInteractions() {
    // Event delegation for dynamically created icons
    const desktopIconsContainer = document.querySelector('.desktop-icons');
    if (desktopIconsContainer) {
        desktopIconsContainer.addEventListener('dblclick', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                const windowId = icon.dataset.window;
                if (windowId) openWindow(windowId);
            }
        });

        desktopIconsContainer.addEventListener('click', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
            }
        });
    }

    document.getElementById('desktop')?.addEventListener('click', (e) => {
        if (e.target.id === 'desktop' || e.target.classList.contains('desktop-icons')) {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        }
    });

    const contextMenu = document.getElementById('contextMenu');
    document.getElementById('desktop')?.addEventListener('contextmenu', (e) => {
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

function focusWindow(win) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    win.style.zIndex = ++zIndexCounter;
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

function focusWindow(win) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    win.style.zIndex = ++zIndexCounter;
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
// PROFILE MANAGEMENT & LOGIN
// ============================================
async function populateProfileSelector() {
    console.log('2a. Inside populateProfileSelector');
    try {
        const profiles = await StorageSystem.ProfileManager.getAllProfiles();
        console.log('2b. Profiles fetched from DB:', profiles);

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
            
            const logoInitial = profile.name ? profile.name.substring(0, 1) : 'P';

            profileCard.innerHTML = `
                <div class="profile-logo">${logoInitial}</div>
                <h2 class="profile-name">${profile.name || 'Profil'}</h2>
                <p class="profile-desc">${profile.fullName || ''}</p>
            `;
            selector.appendChild(profileCard);
        });
        console.log('2c. ✅ Profile selector populated.');
    } catch (error) {
        console.error('❌ Failed to populate profile selector:', error);
        const selector = document.querySelector('.profile-selector');
        if(selector) selector.innerHTML = '<p style="color: red;">Błąd ładowania profili. Sprawdź konsolę.</p>';
    }
}

async function loginAs(profileKey) {
    try {
        console.log('🔐 Logging in as:', profileKey);
        currentProfile = await StorageSystem.db.get(StorageSystem.db.STORES.profiles, profileKey);

        if (!currentProfile) {
            showNotification('Błąd', 'Profil nie znaleziony', 'error');
            return;
        }

        console.log('✅ Profile loaded:', currentProfile);

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

        renderDesktop();
        renderStartMenu();

        document.getElementById('loginScreen').classList.add('hidden');
        document.body.classList.remove('login-page');
        setTimeout(() => {
            document.getElementById('desktop').classList.add('active');
            showNotification('Witaj!', `Zalogowano jako ${currentProfile.name}`, 'success');
        }, 500);

    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Błąd logowania', 'Nie można załadować profilu: ' + error.message, 'error');
    }
}

function logout() {
    currentProfile = null;
    document.getElementById('desktop').classList.remove('active');
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
                console.log('✅ Logo loaded and converted to Base64');
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
    console.log('✅ Logo placeholder created');
}

function renderDesktop() {
    const iconsContainer = document.querySelector('.desktop-icons');
    if (!iconsContainer) return;

    iconsContainer.innerHTML = ''; // Clear existing static icons

    const icons = currentProfile.desktopIcons || [];
    icons.forEach(icon => {
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon';
        iconEl.dataset.window = icon.id;
        iconEl.tabIndex = 0;
        iconEl.setAttribute('role', 'button');
        iconEl.setAttribute('aria-label', `Otwórz ${icon.name}`);

        iconEl.innerHTML = `
            <div class="desktop-icon-image">${icon.icon}</div>
            <div class="desktop-icon-name">${icon.name}</div>
        `;
        iconsContainer.appendChild(iconEl);
    });
}

function renderStartMenu() {
    const appsGrid = document.querySelector('.start-apps-grid');
    if (!appsGrid) return;

    appsGrid.innerHTML = ''; // Clear existing static apps

    const menuItems = currentProfile.startMenuItems || [];
    menuItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'start-app';
        itemEl.dataset.window = item.id;
        itemEl.tabIndex = 0;
        itemEl.setAttribute('role', 'menuitem');

        itemEl.innerHTML = `
            <div class="start-app-icon">${item.icon}</div>
            <div class="start-app-name">${item.name}</div>
        `;
        appsGrid.appendChild(itemEl);
    });
}

// ============================================
// WINDOW MANAGEMENT - PEŁNA IMPLEMENTACJA
// ============================================

function openWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win) return;
    
    win.style.display = 'flex';
    win.classList.add('active');
    win.classList.remove('minimized');
    win.style.zIndex = ++zIndexCounter;
    
    // Focus the window
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    
    const taskbarIcon = document.getElementById(`taskbar-${windowId}`);
    if(taskbarIcon) taskbarIcon.classList.add('active');
    
    // If settings window, load profile settings
    if (windowId === 'settings') {
        loadProfileSettings();
    }

    // If dashboard window, initialize it
    if (windowId === 'dashboard') {
        Dashboard.init();
    }

    // If snake window, initialize it
    if (windowId === 'snake') {
        NeonSnake.init('snakeCanvas');
    }

    if (windowId === 'domator') {
        DomatorApp.init();
    }
}

function closeWindow(windowId) {
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
        taskbarIcon.classList.remove('active');
    }
}

function minimizeWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (win) {
        win.classList.add('minimized');
        win.classList.remove('focused');
        win.style.display = 'none';
    }
}

function maximizeWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win) return;
    
    if (win.classList.contains('maximized')) {
        // Restore
        win.classList.remove('maximized');
        win.style.top = win.dataset.prevTop || '50px';
        win.style.left = win.dataset.prevLeft || '100px';
        win.style.width = win.dataset.prevWidth || '90vw';
        win.style.height = win.dataset.prevHeight || '85vh';
    } else {
        // Maximize - save current position
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

// Window dragging
function startDrag(event, windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win || win.classList.contains('maximized')) return;
    
    draggedWindow = win;
    
    // Focus the window
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    win.style.zIndex = ++zIndexCounter;
    
    const rect = win.getBoundingClientRect();
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;
    
    event.preventDefault();
}

function handleWindowDrag(event) {
    if (!draggedWindow) return;
    
    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;
    
    draggedWindow.style.left = Math.max(0, newX) + 'px';
    draggedWindow.style.top = Math.max(0, newY) + 'px';
}

function stopWindowDrag() {
    draggedWindow = null;
}

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tabId, event) {
    const tabsContainer = event.target.parentElement;
    const windowContent = tabsContainer.parentElement;

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
    const command = new ProductCommand('add', productData);
    UI.Command.execute(command);

    if (productData.image) {
        const newId = products[products.length - 1];
        productImages[newId] = productData.image;
        updateProductImage(newId);
    }
}

function removeProduct(productId) {
    const productData = { id: productId };
    const command = new ProductCommand('remove', productData);
    UI.Command.execute(command);
}

function updateProductImage(productId) {
    const preview = document.getElementById(`productImagePreview-${productId}`);
    if (preview && productImages[productId]) {
        preview.innerHTML = `<img src="${productImages[productId]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    }
}

function duplicateProduct(productId) {
    const command = new DuplicateProductCommand(productId);
    UI.Command.execute(command);
}

function removeProduct(productId) {
    const command = new ProductCommand('remove', { id: productId });
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

// Product drag & drop
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

// ============================================
// PDF GENERATION
// ============================================

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
        // Gather seller data directly from the form fields to ensure any edits are captured.
        // This overrides the base profile data for the generated PDF.
        const sellerData = {
            ...currentProfile, // Use profile as a base for properties not in the form (e.g., logo)
            fullName: document.getElementById('sellerName')?.value || '',
            name: document.getElementById('sellerName')?.value || '', // Both name and fullName are used in PDF template
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
        
        showNotification('Sukces', 'PDF został pomyślnie wygenerowany!', 'success');
    } catch (error) {
        console.error('PDF Generation Error:', error);
        showNotification('Błąd', 'Nie udało się wygenerować PDF: ' + error.message, 'error');
    } finally {
        loadingOverlay?.classList.remove('show');
    }
}

// ============================================
// DATA PERSISTENCE (SAVE/LOAD)
// ============================================

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
            <div class="offer-history-item" onclick="loadOfferFromHistory('${offer.id}')">
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

// ============================================
// SETTINGS WINDOW
// ============================================

function loadProfileSettings() {
    if (!currentProfile) return;
    
    const fields = {
        'settingsName': currentProfile.name,
        'settingsFullName': currentProfile.fullName,
        'settingsNIP': currentProfile.nip,
        'settingsPhone': currentProfile.phone,
        'settingsAddress': currentProfile.address,
        'settingsEmail': currentProfile.email,
        'settingsBankAccount': currentProfile.bankAccount,
        'settingsSellerName': currentProfile.sellerName,
        'settingsSellerPosition': currentProfile.sellerPosition,
        'settingsSellerPhone': currentProfile.sellerPhone,
        'settingsSellerEmail': currentProfile.sellerEmail
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    });
    
    const preview = document.getElementById('logoPreview');
    if (preview) {
        if (currentProfile.logoData) {
            preview.innerHTML = `<img src="${currentProfile.logoData}" style="width: 100%; height: 100%; object-fit: contain;">`;
        } else {
            preview.innerHTML = '📋';
        }
    }
}

async function saveProfileSettings() {
    if (!currentProfile) return;

    const updatedProfile = {
        ...currentProfile,
        name: document.getElementById('settingsName')?.value || currentProfile.name,
        fullName: document.getElementById('settingsFullName')?.value || '',
        nip: document.getElementById('settingsNIP')?.value || '',
        phone: document.getElementById('settingsPhone')?.value || '',
        address: document.getElementById('settingsAddress')?.value || '',
        email: document.getElementById('settingsEmail')?.value || '',
        bankAccount: document.getElementById('settingsBankAccount')?.value || '',
        sellerName: document.getElementById('settingsSellerName')?.value || '',
        sellerPosition: document.getElementById('settingsSellerPosition')?.value || '',
        sellerPhone: document.getElementById('settingsSellerPhone')?.value || '',
        sellerEmail: document.getElementById('settingsSellerEmail')?.value || '',
    };
    
    try {
        await StorageSystem.ProfileManager.saveProfile(updatedProfile);
        currentProfile = updatedProfile;
        
        // Update seller fields
        const sellerNameEl = document.getElementById('sellerName');
        if (sellerNameEl) sellerNameEl.value = currentProfile.fullName || '';
        
        showNotification('Zapisano!', 'Ustawienia profilu zostały zaktualizowane.', 'success');
        closeWindow('settings');
    } catch (error) {
        console.error('Save profile error:', error);
        showNotification('Błąd', 'Nie udało się zapisać ustawień.', 'error');
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
// UTILITY & UI HELPER FUNCTIONS
// ============================================

function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        const timeEl = clockEl.querySelector('.clock-time');
        const dateEl = clockEl.querySelector('.clock-date');
        if (timeEl) timeEl.textContent = time;
        if (dateEl) dateEl.textContent = date;
    }
}

function showNotification(title, message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        return;
    }
    
    const titleEl = notification.querySelector('.notification-title');
    const messageEl = notification.querySelector('.notification-message');
    
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;
    
    const colors = { info: '#3b82f6', success: '#10b981', error: '#ef4444' };
    notification.style.borderLeftColor = colors[type] || colors.info;

    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
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

function changeWallpaper(wallpaper) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;

    const wallpapers = {
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        wallpaper1: 'url(\'https://source.unsplash.com/random/1920x1080?nature\')',
        wallpaper2: 'url(\'https://source.unsplash.com/random/1920x1080?abstract\')',
        wallpaper3: 'url(\'https://source.unsplash.com/random/1920x1080?space\')'
    };

    if (wallpapers[wallpaper]) {
        desktop.style.backgroundImage = wallpapers[wallpaper];
        desktop.style.backgroundSize = 'cover';
        desktop.style.backgroundPosition = 'center';
        UI.Feedback.toast(`🖼️ Zmieniono tapetę na ${wallpaper}`, 'info');
        // Save wallpaper choice to localStorage
        localStorage.setItem('pesteczkaOS_wallpaper', wallpaper);
    }
}

// On load, check for saved wallpaper
document.addEventListener('DOMContentLoaded', () => {
    const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper');
    if (savedWallpaper) {
        changeWallpaper(savedWallpaper);
        const activePreview = document.querySelector(`.wallpaper-preview[data-wallpaper="${savedWallpaper}"]`);
        if (activePreview) {
            activePreview.classList.add('active');
        }
    } else {
        const defaultPreview = document.querySelector('.wallpaper-preview[data-wallpaper="default"]');
        if (defaultPreview) {
            defaultPreview.classList.add('active');
        }
    }
});


console.log('✅ App.js loaded successfully');
