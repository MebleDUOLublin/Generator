/**
 * PESTECZKA OS - MAIN APPLICATION ORCHESTRATOR
 * Orchestrates all modules and application logic.
 */

const App = (() => {
    let appRegistry = [];

    const init = async () => {
        console.log('🚀 Pesteczka OS Starting...');

        try {
            if (!window.StorageSystem || !window.PluginLoader || !window.WindowManager || !window.AuthManager) {
                throw new Error('Core systems missing.');
            }

            // Initialize core systems
            await Promise.all([
                window.StorageSystem.init(),
                window.PluginLoader.init()
            ]);

            // Window manager init (event listeners)
            window.WindowManager.init();

            // Auth manager init (profile selector)
            await window.AuthManager.init();

            console.log('✅ Pesteczka OS Core Initialized');
        } catch (error) {
            console.error('❌ CRITICAL ERROR during initialization:', error);
            showCriticalError(error);
        }
    };

    const showCriticalError = (error) => {
        document.body.innerHTML = `
            <div class="critical-error-container" style="padding: 2rem; background: white; border-radius: 1rem; margin: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <h1 style="color: #dc2626;">Błąd krytyczny</h1>
                <p>Nie można załadować aplikacji. Sprawdź konsolę (F12).</p>
                <pre style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow: auto;">${error.stack}</pre>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Spróbuj ponownie</button>
            </div>
        `;
    };

    const onLoginSuccess = (profile) => {
        setupUI();
        applySavedWallpaper();
        document.getElementById('desktop').classList.add('active');
        renderUIForProfile(profile);
    };

    const setupUI = () => {
        updateClock();
        setInterval(updateClock, 1000);
        setupGlobalEventListeners();
        setupStaticUIElements();
    };

    const setupStaticUIElements = () => {
        document.getElementById('startBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStartMenu();
        });
        document.getElementById('logoutBtn')?.addEventListener('click', () => window.AuthManager.logout());
    };

    const setupGlobalEventListeners = () => {
        document.addEventListener('click', (e) => {
            const startMenu = document.getElementById('startMenu');
            const startBtn = document.getElementById('startBtn');
            if (startMenu?.classList.contains('active') && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
                startMenu.classList.remove('active');
            }
            document.getElementById('contextMenu')?.classList.remove('active');
        });

        const desktopEl = document.getElementById('desktop');
        if (desktopEl) {
            const contextMenu = document.getElementById('contextMenu');
            desktopEl.addEventListener('contextmenu', (e) => {
                if (e.target.id === 'desktop' || e.target.classList.contains('desktop-icons')) {
                    e.preventDefault();
                    contextMenu.style.top = `${e.clientY}px`;
                    contextMenu.style.left = `${e.clientX}px`;
                    contextMenu.classList.add('active');
                }
            });

            contextMenu?.addEventListener('click', (e) => {
                const action = e.target.closest('.context-menu-item')?.dataset.action;
                if (action) {
                    handleContextMenuAction(action);
                    contextMenu.classList.remove('active');
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('startMenu')?.classList.remove('active');
            }
        });
    };

    const handleContextMenuAction = (action) => {
        switch (action) {
            case 'change-wallpaper':
                window.WindowManager.openWindow('settings');
                break;
            case 'add-icon':
                window.UI.Feedback.toast('Funkcja wkrótce dostępna!', 'info');
                break;
            case 'logout':
                window.AuthManager.logout();
                break;
        }
    };

    const renderUIForProfile = (profile) => {
        if (!profile || !window.AppRegistry) return;

        const enabledApps = window.AppRegistry.filter(app =>
            profile.enabledApps && profile.enabledApps.includes(app.id)
        );

        const iconsContainer = document.getElementById('desktopIcons');
        const taskbarCenter = document.querySelector('.taskbar-center');
        const startAppsGrid = document.querySelector('.start-apps-grid');

        if (iconsContainer) iconsContainer.innerHTML = '';
        if (taskbarCenter) {
            taskbarCenter.querySelectorAll('.taskbar-icon:not(#startBtn)').forEach(icon => icon.remove());
        }
        if (startAppsGrid) startAppsGrid.innerHTML = '';

        enabledApps.forEach(app => {
            // 1. Desktop Icon
            if (iconsContainer) {
                const iconEl = document.createElement('div');
                iconEl.className = 'desktop-icon';
                iconEl.dataset.window = app.id;
                iconEl.innerHTML = `
                    <div class="desktop-icon-image">${app.icon}</div>
                    <div class="desktop-icon-name">${app.name}</div>
                `;
                iconEl.addEventListener('dblclick', () => window.WindowManager.openWindow(app.id));
                iconEl.addEventListener('click', () => {
                    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
                    iconEl.classList.add('selected');
                });
                iconsContainer.appendChild(iconEl);
            }

            // 2. Taskbar Icon
            if (taskbarCenter) {
                const taskbarIcon = document.createElement('div');
                taskbarIcon.className = 'taskbar-icon';
                taskbarIcon.dataset.window = app.id;
                taskbarIcon.innerHTML = app.icon;
                taskbarIcon.addEventListener('click', () => window.WindowManager.toggleWindow(app.id));
                taskbarCenter.appendChild(taskbarIcon);
            }

            // 3. Start Menu Item
            if (startAppsGrid) {
                const startItem = document.createElement('div');
                startItem.className = 'start-app';
                startItem.dataset.window = app.id;
                startItem.innerHTML = `
                    <div class="start-app-icon">${app.icon}</div>
                    <div class="start-app-name">${app.name}</div>
                `;
                startItem.addEventListener('click', () => {
                    window.WindowManager.openWindow(app.id);
                    document.getElementById('startMenu')?.classList.remove('active');
                });
                startAppsGrid.appendChild(startItem);
            }
        });
    };

    const updateClock = () => {
        const now = new Date();
        const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
        const clockEl = document.getElementById('clock');
        if (clockEl) {
            clockEl.querySelector('.clock-time').textContent = time;
            clockEl.querySelector('.clock-date').textContent = date;
        }
    };

    const toggleStartMenu = () => {
        document.getElementById('startMenu')?.classList.toggle('active');
    };

    const switchTab = (tabId, event) => {
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
    };
    window.switchTab = switchTab;

    const applySavedWallpaper = () => {
        const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper') || 'default';
        changeWallpaper(savedWallpaper);
    };

    const changeWallpaper = (wallpaper) => {
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
            localStorage.setItem('pesteczkaOS_wallpaper', wallpaper);
        }
    };

    return {
        init,
        onLoginSuccess,
        getCurrentProfile: () => window.AuthManager.getCurrentProfile(),
        changeWallpaper,
        switchTab,
        renderUIForProfile: () => renderUIForProfile(window.AuthManager.getCurrentProfile())
    };
})();

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});
