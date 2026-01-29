// src/core/windowManager.js
// Handles window creation, movement, and lifecycle.

const WindowManager = {
    zIndexCounter: 1000,
    draggedWindow: null,
    dragOffset: { x: 0, y: 0 },

    async createWindow(app) {
        const windowEl = document.createElement('div');
        windowEl.className = 'window';
        windowEl.id = `window-${app.id}`;
        windowEl.setAttribute('role', 'dialog');
        windowEl.setAttribute('aria-labelledby', `window-${app.id}-title`);

        const savedState = await StorageSystem.db.get('windowState', app.id);

        windowEl.style.width = savedState?.width || app.width || '800px';
        windowEl.style.height = savedState?.height || app.height || '600px';
        windowEl.style.top = savedState?.top || '100px';
        windowEl.style.left = savedState?.left || '150px';

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
        this.setupWindowManagementEventListeners(windowEl);
        return windowEl;
    },

    setupWindowManagementEventListeners(win) {
        const windowId = win.id.replace('window-', '');
        const header = win.querySelector('.window-header');

        header?.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.window-control-btn')) {
                this.startDrag(e, windowId);
            }
        });

        win.querySelectorAll('.window-control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleWindowAction(btn.dataset.action, windowId);
            });
        });

        win.addEventListener('mousedown', () => this.focusWindow(win));
    },

    async openWindow(windowId) {
        let win = document.getElementById(`window-${windowId}`);
        const app = window.AppRegistry.find(a => a.id === windowId);

        if (!app) {
            console.error(`App with ID '${windowId}' not found in registry.`);
            return;
        }

        if (!win) {
            win = await this.createWindow(app);
        }

        const contentArea = win.querySelector('.window-content');
        if (!contentArea) {
            console.error(`Window #${windowId} is missing a .window-content child.`);
            return;
        }

        if (!contentArea.classList.contains('loaded')) {
            const pluginAssets = await window.PluginLoader.loadPlugin(windowId);

            if (pluginAssets && pluginAssets.html) {
                contentArea.innerHTML = pluginAssets.html;
                contentArea.classList.add('loaded');

                await new Promise(r => requestAnimationFrame(r));

                try {
                    const appObjectName = `${windowId.charAt(0).toUpperCase() + windowId.slice(1)}App`;
                    if (window[appObjectName] && typeof window[appObjectName].init === 'function') {
                        console.log(`Initializing plugin: ${appObjectName}...`);
                        window[appObjectName].init(currentProfile, win);
                    } else {
                         console.warn(`Plugin ${appObjectName} loaded, but no init() function was found.`);
                    }
                } catch (e) {
                    console.error(`Error initializing plugin ${windowId}:`, e);
                    UI.Feedback.showError('Błąd Aplikacji', `Wystąpił błąd podczas uruchamiania aplikacji "${windowId}".`);
                    this.closeWindow(windowId);
                }
            } else {
                contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Failed to load app: ${windowId}.</div>`;
            }
        }

        win.style.display = 'flex';
        win.classList.add('active');
        win.classList.remove('minimized');
        this.focusWindow(win);

        const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if(taskbarIcon) {
            taskbarIcon.classList.add('active');
            taskbarIcon.classList.add('open');
        }
    },

    closeWindow(windowId) {
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
    },

    minimizeWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (win) {
            win.classList.add('minimized');
            win.classList.remove('focused');
            setTimeout(() => {
                 win.style.display = 'none';
            }, 200);
        }
    },

    maximizeWindow(windowId) {
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
    },

    toggleWindow(windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        if (win.style.display === 'flex' && !win.classList.contains('minimized')) {
            this.minimizeWindow(windowId);
        } else {
            this.openWindow(windowId);
        }
    },

    startDrag(event, windowId) {
        const win = document.getElementById(`window-${windowId}`);
        if (!win || win.classList.contains('maximized')) return;

        this.draggedWindow = win;
        this.focusWindow(win);

        const rect = win.getBoundingClientRect();
        this.dragOffset.x = event.clientX - rect.left;
        this.dragOffset.y = event.clientY - rect.top;

        event.preventDefault();
    },

    handleWindowDrag(event) {
        if (!this.draggedWindow) return;
        const desktop = document.getElementById('desktop');
        const taskbarHeight = 40;

        const maxLeft = desktop.clientWidth - this.draggedWindow.clientWidth;
        const maxTop = desktop.clientHeight - this.draggedWindow.clientHeight - taskbarHeight;

        let newX = event.clientX - this.dragOffset.x;
        let newY = event.clientY - this.dragOffset.y;

        newX = Math.max(0, Math.min(newX, maxLeft));
        newY = Math.max(0, Math.min(newY, maxTop));

        this.draggedWindow.style.left = newX + 'px';
        this.draggedWindow.style.top = newY + 'px';
    },

    stopWindowDrag() {
        if (this.draggedWindow) {
            const win = this.draggedWindow;
            const windowId = win.id.replace('window-', '');
            const state = {
                id: windowId,
                top: win.style.top,
                left: win.style.left,
                width: win.style.width,
                height: win.style.height
            };
            StorageSystem.db.set('windowState', state);
        }
        this.draggedWindow = null;
    },

    focusWindow(win) {
        document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
        win.style.zIndex = ++this.zIndexCounter;
    },

    handleWindowAction(action, windowId) {
        switch (action) {
            case 'minimize':
                this.minimizeWindow(windowId);
                break;
            case 'maximize':
                this.maximizeWindow(windowId);
                break;
            case 'close':
                this.closeWindow(windowId);
                break;
        }
    }
};
