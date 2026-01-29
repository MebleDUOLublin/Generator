// src/core/desktopManager.js
// Manages desktop icons, wallpaper, and related UI elements.

const DesktopManager = {
    renderUIForProfile() {
        if (!currentProfile || !window.AppRegistry) return;

        const enabledApps = window.AppRegistry.filter(app =>
            currentProfile.enabledApps && currentProfile.enabledApps.includes(app.id)
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

        this.setupDesktopInteractions();
        this.setupDynamicAppLaunchers();
    },

    setupDesktopInteractions() {
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', () => {
                const windowId = icon.dataset.window;
                if (windowId) WindowManager.openWindow(windowId);
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
                    this.handleContextMenuAction(action);
                    contextMenu.classList.remove('active');
                }
            });
        }
    },

    setupDynamicAppLaunchers() {
        document.querySelectorAll('.taskbar-icon[data-window]').forEach(icon => {
            icon.addEventListener('click', () => WindowManager.toggleWindow(icon.dataset.window));
        });

        document.querySelectorAll('.start-app').forEach(app => {
            app.addEventListener('click', () => {
                WindowManager.openWindow(app.dataset.window);
                document.getElementById('startMenu')?.classList.remove('active');
            });
        });
    },

    handleContextMenuAction(action) {
        switch (action) {
            case 'change-wallpaper':
                WindowManager.openWindow('settings');
                break;
            case 'add-icon':
                UI.Feedback.toast('Funkcja wkrótce dostępna!', 'info');
                break;
            case 'logout':
                AuthManager.logout();
                break;
        }
    },

    changeWallpaper(wallpaper) {
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
    },

    applySavedWallpaper() {
        const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper') || 'default';
        this.changeWallpaper(savedWallpaper);
        document.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
        const activePreview = document.querySelector(`.wallpaper-preview[data-wallpaper="${savedWallpaper}"]`);
        if (activePreview) {
            activePreview.classList.add('active');
        }
    }
};
