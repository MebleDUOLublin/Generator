/**
 * PESTECZKA OS - MAIN APPLICATION SCRIPT (FIXED)
 * Orchestrates all modules and application logic.
 */

// ============================================
// GLOBAL STATE
// ============================================
let currentProfile = null;
let draggedWindow = null;
let dragOffset = { x: 0, y: 0 };
let pastedImageData = null;
let zIndexCounter = 1000;

// ============================================
// UI SETUP
// ============================================
function setupUI() {
    console.log('🎨 Setting up UI event listeners...');
    
    updateClock();
    setInterval(updateClock, 1000);

    setupDesktopInteractions();
    // setupTaskbarAndStartMenu(); // Now part of setupStaticUI
    setupStaticUIElements();
    setupWindowManagement();
    setupGlobalEventListeners();

    console.log('✅ All UI event listeners attached!');
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (!root || !theme) {
        console.warn('Attempted to apply theme but no theme object or root element was found.');
        return;
    }

    // This theme engine sets the core brand colors used in `style.css`.
    const themeColors = {
        '--primary-500': theme.primary,
        '--primary-600': theme.accent,
        '--primary-700': theme.accent, // Use accent for darker shades
        '--accent-500': theme.accent,
        '--accent-600': theme.primary,
        '--shadow-glow': `0 0 40px -10px ${theme.primary}`
    };

    for (const [key, value] of Object.entries(themeColors)) {
        if (value) { // Only set property if a value exists in the theme
            root.style.setProperty(key, value);
        }
    }
    console.log(`🎨 Theme applied with primary color: ${theme.primary}`);
}

function renderUIForProfile() {
    if (!currentProfile || !window.AppRegistry) return;

    // Get the full app objects for the apps enabled in the current profile.
    const enabledApps = window.AppRegistry.filter(app =>
        currentProfile.enabledApps && currentProfile.enabledApps.includes(app.id)
    );

    // Get containers
    const iconsContainer = document.getElementById('desktopIcons');
    const taskbarCenter = document.querySelector('.taskbar-center');
    const startAppsGrid = document.querySelector('.start-apps-grid');

    // Clear existing dynamic content
    if (iconsContainer) iconsContainer.innerHTML = '';
    if (taskbarCenter) {
        taskbarCenter.querySelectorAll('.taskbar-icon:not(#startBtn)').forEach(icon => icon.remove());
    }
    if (startAppsGrid) startAppsGrid.innerHTML = '';

    // Render UI elements for each enabled app
    enabledApps.forEach(app => {
        // 1. Render Desktop Icon
        if (iconsContainer) {
            const iconEl = document.createElement('div');
            iconEl.className = 'desktop-icon';
            iconEl.tabIndex = 0;
            iconEl.setAttribute('role', 'button');
            iconEl.setAttribute('aria-label', app.name);
            iconEl.dataset.window = app.id;
            iconEl.innerHTML = `
                <div class="desktop-icon-image">${app.icon}</div>
                <div class="desktop-icon-name">${app.name}</div>
            `;
            iconsContainer.appendChild(iconEl);
        }

        // 2. Render Taskbar Icon
        if (taskbarCenter) {
            const taskbarIcon = document.createElement('div');
            taskbarIcon.className = 'taskbar-icon';
            taskbarIcon.dataset.window = app.id;
            taskbarIcon.tabIndex = 0;
            taskbarIcon.setAttribute('role', 'button');
            taskbarIcon.setAttribute('aria-label', app.name);
            taskbarIcon.innerHTML = app.icon;
            taskbarCenter.appendChild(taskbarIcon);
        }

        // 3. Render Start Menu Item
        if (startAppsGrid) {
            const startItem = document.createElement('div');
            startItem.className = 'start-app';
            startItem.dataset.window = app.id;
            startItem.tabIndex = 0;
            startItem.setAttribute('role', 'menuitem');
            startItem.innerHTML = `
                <div class="start-app-icon">${app.icon}</div>
                <div class="start-app-name">${app.name}</div>
            `;
            startAppsGrid.appendChild(startItem);
        }
    });

    // Re-attach ALL relevant listeners for the newly created dynamic elements
    setupDesktopInteractions();
    setupDynamicAppLaunchers();
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

// Sets up listeners for dynamically created app icons
function setupDynamicAppLaunchers() {
    document.querySelectorAll('.taskbar-icon[data-window]').forEach(icon => {
        icon.addEventListener('click', () => toggleWindow(icon.dataset.window));
    });

    document.querySelectorAll('.start-app').forEach(app => {
        app.addEventListener('click', () => {
            openWindow(app.dataset.window);
            document.getElementById('startMenu')?.classList.remove('active');
        });
    });
}

function setupStaticUIElements() {
    document.getElementById('startBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
    });
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

function setupWindowManagement() {
    // This function is now intentionally empty.
    // Event listeners are added dynamically when windows are created
    // in `createWindow` and `setupWindowManagementEventListeners`.
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
    if (e.key === 'Escape') {
        document.getElementById('startMenu')?.classList.remove('active');
    }
}

// ============================================
// PROFILE MANAGEMENT & LOGIN
// ============================================
async function populateProfileSelector() {
    try {
        const profiles = await StorageSystem.ProfileManager.getAllProfiles();
        console.log('Profiles fetched for UI rendering:', JSON.stringify(profiles, null, 2));

        if (!profiles || profiles.length === 0) {
            console.warn('⚠️ No profiles found in DB for UI rendering.');
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
            profileCard.dataset.profileKey = profile.key;
            if (profile.key === 'pesteczka') {
                profileCard.id = 'pesteczka-profile-card';
            }
            profileCard.style.setProperty('--card-delay', `${index * 100}ms`);

            const logoPath = profile.logo || '';
            const logoHtml = logoPath
                ? `<img src="${logoPath}" alt="${profile.name} Logo" class="profile-logo">`
                : `<div class="profile-logo">${profile.name ? profile.name.substring(0, 1) : 'P'}</div>`;

            profileCard.innerHTML = `
                ${logoHtml}
                <h2 class="profile-name">${profile.name || 'Profil'}</h2>
                <p class="profile-desc">${profile.fullName || ''}</p>
                <button class="btn btn-primary">Zaloguj</button>
            `;

            profileCard.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                loginAs(profile.key);
            });

            profileCard.addEventListener('click', () => {
                loginAs(profile.key);
            });

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

        // Apply the theme BEFORE rendering the rest of the UI
        if (currentProfile.theme) {
            console.log("Applying theme:", currentProfile.theme);
            applyTheme(currentProfile.theme);
        } else {
            console.log("No theme found for profile. Using default.");
        }

        document.getElementById('userName').textContent = currentProfile.name || 'Użytkownik';
        document.getElementById('userEmail').textContent = currentProfile.email || '';
        document.getElementById('userAvatar').textContent = (currentProfile.name || 'U').substring(0, 2).toUpperCase();

        if (!currentProfile.logoData && currentProfile.logo) {
            await loadLogoAsBase64(currentProfile.logo);
        } else if (!currentProfile.logoData) {
            setLogoPlaceholder();
        }

        document.getElementById('loginScreen').classList.add('hidden');
        document.body.classList.remove('login-page');
        // Setup the main UI and apply wallpaper only AFTER login is successful
        setupUI();
        applySavedWallpaper();

        document.getElementById('desktop').classList.add('active');
        UI.Feedback.toast(`Witaj, ${currentProfile.name}!`, 'success');
        renderUIForProfile();
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
function createWindow(app) {
    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    windowEl.id = `window-${app.id}`;
    windowEl.setAttribute('role', 'dialog');
    windowEl.setAttribute('aria-labelledby', `window-${app.id}-title`);
    windowEl.style.width = app.width || '800px';
    windowEl.style.height = app.height || '600px';
    windowEl.style.top = '100px';
    windowEl.style.left = '150px';

    windowEl.innerHTML = `
        <div class="window-header">
            <div class="window-title">
                <span class="window-title-icon">${app.icon}</span>
                <span id="window-${app.id}-title">${app.name}</span>
            </div>
            <div class="window-controls">
                <button class="window-control-btn minimize" data-action="minimize" aria-label="Minimalizuj">−</button>
                <button class="window-control-btn maximize" data-action="maximize" aria-label="Maksymalizuj">□</button>
                <button class="window-control-btn close" data-action="close" aria-label="Zamknij">✕</button>
            </div>
        </div>
        <div class="window-content">
            <!-- Content will be loaded from the plugin -->
        </div>
    `;

    document.getElementById('desktop').appendChild(windowEl);
    setupWindowManagementEventListeners(windowEl);
    return windowEl;
}

function setupWindowManagementEventListeners(win) {
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
}

async function openWindow(windowId) {
    let win = document.getElementById(`window-${windowId}`);
    const app = window.AppRegistry.find(a => a.id === windowId);

    if (!app) {
        console.error(`App with ID '${windowId}' not found in registry.`);
        return;
    }

    if (!win) {
        win = createWindow(app);
    }

    const contentArea = win.querySelector('.window-content');
    if (!contentArea) {
        console.error(`Window #${windowId} is missing a .window-content child.`);
        return;
    }

    // Load plugin content only if it hasn't been loaded before
    if (!contentArea.classList.contains('loaded')) {
        const pluginAssets = await window.PluginLoader.loadPlugin(windowId);

        if (pluginAssets && pluginAssets.html) {
            contentArea.innerHTML = pluginAssets.html;
            contentArea.classList.add('loaded');

            // Wait for the next frame to ensure the new DOM is queryable
            await new Promise(r => requestAnimationFrame(r));

            try {
                const appObjectName = `${windowId.charAt(0).toUpperCase() + windowId.slice(1)}App`;
                if (window[appObjectName] && typeof window[appObjectName].init === 'function') {
                    console.log(`Initializing plugin: ${appObjectName}...`);
                    // Pass both the profile and the window element to the init function
                    window[appObjectName].init(currentProfile, win);
                } else {
                     console.warn(`Plugin ${appObjectName} loaded, but no init() function was found.`);
                }
            } catch (e) {
                console.error(`Error initializing plugin ${windowId}:`, e);
            }
        } else {
            contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Failed to load app: ${windowId}.</div>`;
        }
    }
    
    // Show and focus the window

    win.style.display = 'flex';
    win.classList.add('active');
    win.classList.remove('minimized');
    focusWindow(win);
    
    // Update taskbar icon state

    const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
    if(taskbarIcon) {
        taskbarIcon.classList.add('active');
        taskbarIcon.classList.add('open');
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
    const clickedTab = event.target.closest('.tab');
    if (!clickedTab) return;

    const tabsContainer = clickedTab.closest('.tabs');
    const windowContent = clickedTab.closest('.window-content');

    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');

    windowContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeTabContent = windowContent.querySelector(`#${tabId}-tab`);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
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
        clockEl.querySelector('.clock-time').textContent = time;
        clockEl.querySelector('.clock-date').textContent = date;
    }
}

function changeWallpaper(wallpaper) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    const wallpapers = {
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        wallpaper1: 'url(\'src/assets/userData/wallpapers/wallpaper1.jpg\')',
        wallpaper2: 'url(\'src/assets/userData/wallpapers/wallpaper2.jpg\')',
        wallpaper3: 'url(\'src/assets/userData/wallpapers/wallpaper3.jpg\')',
        wallpaper4: 'url(\'src/assets/userData/wallpapers/wallpaper4.jpg\')'
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
        if (!window.StorageSystem || !window.PluginLoader) {
            throw new Error('Core systems (StorageSystem, PluginLoader) not found.');
        }

        // Initialize core systems in parallel
        await Promise.all([
            window.StorageSystem.init(),
            window.PluginLoader.init() // This now fetches from the API
        ]);

        await populateProfileSelector();

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
