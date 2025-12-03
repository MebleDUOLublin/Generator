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
    setupGlobalEventListeners();

    console.log('✅ All UI event listeners attached!');
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
    document.getElementById('desktop').addEventListener('mousedown', (e) => {
        const win = e.target.closest('.window');
        if (!win) return;

        focusWindow(win);

        const header = e.target.closest('.window-header');
        if (header && !e.target.closest('.window-control-btn')) {
            const windowId = win.id.replace('window-', '');
            startDrag(e, windowId);
        }
    });

    document.getElementById('desktop').addEventListener('click', (e) => {
        const controlBtn = e.target.closest('.window-control-btn');
        if (controlBtn) {
            e.stopPropagation();
            const win = controlBtn.closest('.window');
            const windowId = win.id.replace('window-', '');
            handleWindowAction(controlBtn.dataset.action, windowId);
        }
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
            const command = new UpdateProductImageCommand(productId, imageData, oldImage, productImages);
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
        
        profiles.forEach(profile => {
            const profileCard = document.createElement('div');
            profileCard.className = 'profile-card';
            profileCard.onclick = () => loginAs(profile.key);
            
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

        document.getElementById('loginScreen').classList.add('hidden');
        document.body.classList.remove('login-page');
        setTimeout(() => {
            document.getElementById('desktop').classList.add('active');
            showNotification('Witaj!', `Zalogowano jako ${currentProfile.name}`, 'success');
        }, 500);

        // Pokaż ikonę Domator tylko dla profilu alekrzesla
        const domatorIcon = document.querySelector('[data-window="domator"]');
        if (domatorIcon) {
            domatorIcon.style.display = profileKey === 'alekrzesla' ? 'flex' : 'none';
        }

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

// ============================================
// WINDOW MANAGEMENT - PEŁNA IMPLEMENTACJA
// ============================================

const AppLoader = (() => {
    const loadedApps = new Set();

    const load = async (appName) => {
        if (loadedApps.has(appName)) {
            console.log(`App "${appName}" already loaded.`);
            return true;
        }

        try {
            const appPath = `apps/${appName}`;
            const htmlPath = `${appPath}/index.html`;
            const cssPath = `${appPath}/style.css`;
            const jsPath = `${appPath}/app.js`;

            // Fetch HTML
            const htmlResponse = await fetch(htmlPath);
            if (!htmlResponse.ok) throw new Error(`Could not load ${htmlPath}`);
            const htmlContent = await htmlResponse.text();
            document.getElementById('desktop').insertAdjacentHTML('beforeend', htmlContent);

            // Load CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = cssPath;
            document.head.appendChild(cssLink);

            // Load JS
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = jsPath;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });

            loadedApps.add(appName);
            console.log(`✅ App "${appName}" loaded successfully.`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load app "${appName}":`, error);
            UI.Feedback.toast(`Błąd ładowania aplikacji: ${appName}`, 'error');
            return false;
        }
    };

    return { load };
})();

async function openWindow(windowId) {
    const windowElementId = `window-${windowId}`;
    let win = document.getElementById(windowElementId);

    if (!win) {
        const loaded = await AppLoader.load(windowId);
        if (!loaded) return;
        win = document.getElementById(windowElementId);
        if (!win) {
            console.error(`Window element #${windowElementId} not found after loading app.`);
            return;
        }
    }
    
    win.style.display = 'flex';
    win.classList.add('active');
    win.classList.remove('minimized');
    win.style.zIndex = ++zIndexCounter;
    
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    
    const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
    if(taskbarIcon) taskbarIcon.classList.add('active');
    
    switch (windowId) {
        case 'settings':
            if (window.SettingsApp) SettingsApp.init();
            break;
        case 'dashboard':
            if (window.Dashboard) Dashboard.init();
            break;
        case 'snake':
            if (window.NeonSnake) NeonSnake.init('snakeCanvas');
            break;
        case 'domator':
            if (window.DomatorApp) DomatorApp.init();
            break;
        case 'offers':
            if (window.OfferGenerator) OfferGenerator.init();
            break;
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
    const tabButton = event.currentTarget;
    const windowContent = tabButton.closest('.window-content');

    // Deactivate all tab buttons
    windowContent.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Hide all tab content divs
    windowContent.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none'; // Force hide
    });

    // Activate the clicked tab button
    tabButton.classList.add('active');

    // Show the corresponding tab content div
    const activeTabContent = windowContent.querySelector(`#${tabId}`);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
        activeTabContent.style.display = 'block'; // Force show
    } else {
        console.error(`Tab content with ID #${tabId} not found.`);
    }
}

function toggleStartMenu() {
    const menu = document.getElementById('startMenu');
    if(menu) menu.classList.toggle('active');
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
