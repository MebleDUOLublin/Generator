/**
 * PESTECZKA OS - WINDOW MANAGER
 * Handles window creation, lifecycle, and taskbar integration.
 */

const WindowManager = (() => {
    let zIndexCounter = 1000;
    let draggedWindow = null;
    let dragOffset = { x: 0, y: 0 };

    const init = () => {
        document.addEventListener('mousemove', handleWindowDrag);
        document.addEventListener('mouseup', stopWindowDrag);
    };

    const createWindow = (app) => {
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
    };

    const setupWindowManagementEventListeners = (win) => {
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
    };

    const handleWindowAction = (action, windowId) => {
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
    };

    const focusWindow = (win) => {
        if (typeof win === 'string') win = document.getElementById(`window-${win}`);
        if (!win) return;

        document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
        win.style.zIndex = ++zIndexCounter;

        // Update taskbar focus state
        const windowId = win.id.replace('window-', '');
        document.querySelectorAll('.taskbar-icon').forEach(icon => icon.classList.remove('active'));
        const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if (taskbarIcon) {
            taskbarIcon.classList.add('active');
        }
    };

    const openWindow = async (windowId) => {
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
                        window[appObjectName].init(window.App.getCurrentProfile(), win);
                    } else {
                         console.warn(`Plugin ${appObjectName} loaded, but no init() function was found.`);
                    }
                } catch (e) {
                    console.error(`Error initializing plugin ${windowId}:`, e);
                    contentArea.innerHTML += `<div class="p-4 text-red-500">Error initializing app: ${e.message}</div>`;
                }
            } else {
                contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Failed to load app: ${windowId}.</div>`;
            }
        }

        win.style.display = 'flex';
        win.classList.add('active');
        win.classList.remove('minimized');
        focusWindow(win);

        const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if(taskbarIcon) {
            taskbarIcon.classList.add('active');
            taskbarIcon.classList.add('open');
        }
    };

    const closeWindow = (windowId) => {
        const win = document.getElementById(`window-${windowId}`);
        if (win) {
            win.classList.add('closing');
            win.addEventListener('animationend', () => {
                win.classList.remove('active', 'focused', 'closing');
                win.style.display = 'none';
                // Optional: Remove from DOM to save memory, but keep for now to avoid reloading
                // win.remove();
            }, { once: true });
        }
        const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if (taskbarIcon) {
            taskbarIcon.classList.remove('active', 'open');
        }
    };

    const minimizeWindow = (windowId) => {
        const win = document.getElementById(`window-${windowId}`);
        if (win) {
            win.classList.add('minimized');
            win.classList.remove('focused');
            setTimeout(() => {
                 win.style.display = 'none';
            }, 200);
        }
        const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
        if (taskbarIcon) {
            taskbarIcon.classList.remove('active');
        }
    };

    const maximizeWindow = (windowId) => {
        const win = document.getElementById(`window-${windowId}`);
        if (!win) return;

        if (win.classList.contains('maximized')) {
            win.classList.remove('maximized');
            win.style.top = win.dataset.prevTop || '100px';
            win.style.left = win.dataset.prevLeft || '150px';
            win.style.width = win.dataset.prevWidth || '800px';
            win.style.height = win.dataset.prevHeight || '600px';
        } else {
            win.dataset.prevTop = win.style.top;
            win.dataset.prevLeft = win.style.left;
            win.dataset.prevWidth = win.style.width;
            win.dataset.prevHeight = win.style.height;
            win.classList.add('maximized');
        }
    };

    const toggleWindow = (windowId) => {
        const win = document.getElementById(`window-${windowId}`);
        if (!win || win.style.display === 'none' || win.classList.contains('minimized')) {
            openWindow(windowId);
        } else {
            minimizeWindow(windowId);
        }
    };

    const startDrag = (event, windowId) => {
        const win = document.getElementById(`window-${windowId}`);
        if (!win || win.classList.contains('maximized')) return;

        draggedWindow = win;
        focusWindow(win);

        const rect = win.getBoundingClientRect();
        dragOffset.x = event.clientX - rect.left;
        dragOffset.y = event.clientY - rect.top;

        event.preventDefault();
    };

    const handleWindowDrag = (event) => {
        if (!draggedWindow) return;
        const desktop = document.getElementById('desktop');
        const taskbarHeight = 72;

        const maxLeft = desktop.clientWidth - draggedWindow.clientWidth;
        const maxTop = desktop.clientHeight - draggedWindow.clientHeight - taskbarHeight;

        let newX = event.clientX - dragOffset.x;
        let newY = event.clientY - dragOffset.y;

        newX = Math.max(0, Math.min(newX, maxLeft));
        newY = Math.max(0, Math.min(newY, maxTop));

        draggedWindow.style.left = newX + 'px';
        draggedWindow.style.top = newY + 'px';
    };

    const stopWindowDrag = () => {
        draggedWindow = null;
    };

    return {
        init,
        openWindow,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        toggleWindow,
        focusWindow
    };
})();

window.WindowManager = WindowManager;
