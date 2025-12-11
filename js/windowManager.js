/**
 * PESTECZKA OS - WINDOW MANAGER
 * Handles loading, creating, and managing all application windows.
 */
import { state } from './state.js';

let draggedWindow = null;
let dragOffset = { x: 0, y: 0 };
const loadedApps = new Set();
const windowsContainer = document.getElementById('windowsContainer');

const WindowManager = {
    /**
     * Opens a window, dynamically loading the app's resources if it's the first time.
     * @param {string} appId - The unique ID of the application to open.
     */
    async open(appId) {
        // Prevent opening if a window is already in the process of opening/closing
        const existingWindow = document.getElementById(`window-${appId}`);
        if (existingWindow?.classList.contains('opening') || existingWindow?.classList.contains('closing')) {
            return;
        }

        if (!loadedApps.has(appId)) {
            await this._loadAppResources(appId);
        }

        const win = document.getElementById(`window-${appId}`);
        if (!win) return;

        win.style.display = 'flex';
        win.classList.add('opening');
        win.classList.remove('minimized');

        this.focus(win);

        win.addEventListener('animationend', () => {
            win.classList.remove('opening');
        }, { once: true });
    },

    /**
     * Closes a window and removes its taskbar icon.
     * @param {string} appId - The ID of the application window to close.
     */
    close(appId) {
        const win = document.getElementById(`window-${appId}`);
        if (win) {
            win.classList.add('closing');
            win.addEventListener('animationend', () => {
                win.style.display = 'none';
                win.classList.remove('closing', 'active', 'focused');
            }, { once: true });
        }
    },

    /**
     * Closes all currently open application windows.
     */
    closeAll() {
        document.querySelectorAll('.window').forEach(win => {
            this.close(win.id.replace('window-', ''));
        });
    },

    /**
     * Brings a window to the front and gives it focus.
     * @param {HTMLElement} win - The window element to focus.
     */
    focus(win) {
        document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
        win.classList.add('focused');
        win.style.zIndex = ++state.zIndexCounter;
    },

    /**
     * Fetches and injects an application's HTML, CSS, and JS.
     * @private
     */
    async _loadAppResources(appId) {
        try {
            const appData = this._getAppData(appId);
            if (!appData) throw new Error(`App data for "${appId}" not found in any profile.`);

            const [htmlResponse, jsModule] = await Promise.all([
                fetch(`apps/${appId}/view.html`),
                import(`/apps/${appId}/app.js`)
            ]);

            if (!htmlResponse.ok) throw new Error(`Could not fetch view.html for ${appId}`);

            this._createWindowShell(appId, appData, await htmlResponse.text());
            this._injectAppStyles(appId);

            if (jsModule && typeof jsModule.default?.init === 'function') {
                // Pass the window's content container to the app's init function
                const contentContainer = document.querySelector(`#window-${appId} .window-content`);
                jsModule.default.init(contentContainer);
                state.apps[appId] = jsModule.default; // Store app instance
            }

            loadedApps.add(appId);
        } catch (error) {
            console.error(`❌ Failed to load app "${appId}":`, error);
            // Consider showing a user-facing error notification
        }
    },

    /**
     * Creates the main window element and appends it to the container.
     * @private
     */
    _createWindowShell(appId, appData, contentHtml) {
        const win = document.createElement('div');
        win.className = 'window';
        win.id = `window-${appId}`;
        win.style.display = 'none';

        win.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <span class="window-title-icon">${appData.icon}</span>
                    <span>${appData.name}</span>
                </div>
                <div class="window-controls">
                    <button class="window-control-btn close" data-action="close" aria-label="Zamknij">✕</button>
                </div>
            </div>
            <div class="window-content">
                ${contentHtml}
            </div>
        `;
        windowsContainer.appendChild(win);
        this._setupWindowEvents(win);
    },

    /**
     * Injects an application's specific stylesheet into the document head.
     * @private
     */
    _injectAppStyles(appId) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `apps/${appId}/style.css`;
        link.id = `style-for-${appId}`;
        document.head.appendChild(link);
    },

    /**
     * Finds app data (name, icon) from the loaded profiles.
     * @private
     */
    _getAppData(appId) {
         for (const profile of state.profiles) {
            const app = profile.desktopIcons?.find(a => a.id === appId) || profile.startMenuItems?.find(a => a.id === appId);
            if (app) return app;
        }
        return { name: 'Aplikacja', icon: '❓' }; // Fallback
    },

    /**
     * Sets up event listeners for window dragging and controls.
     * @private
     */
    _setupWindowEvents(win) {
        const header = win.querySelector('.window-header');
        const appId = win.id.replace('window-', '');

        header?.addEventListener('mousedown', e => {
            if (!e.target.closest('.window-control-btn')) {
                this._startDrag(e, win);
            }
        });

        win.querySelector('.window-control-btn[data-action="close"]').addEventListener('click', () => this.close(appId));
        win.addEventListener('mousedown', () => this.focus(win));
    },

    // --- Drag and Drop Logic ---
    _startDrag(event, win) {
        draggedWindow = win;
        this.focus(win);
        const rect = win.getBoundingClientRect();
        dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        document.addEventListener('mousemove', this._handleDrag);
        document.addEventListener('mouseup', this._stopDrag, { once: true });
    },

    _handleDrag(event) {
        if (!draggedWindow) return;
        const newX = event.clientX - dragOffset.x;
        const newY = event.clientY - dragOffset.y;
        draggedWindow.style.left = `${newX}px`;
        draggedWindow.style.top = `${newY}px`;
    },

    _stopDrag() {
        draggedWindow = null;
        document.removeEventListener('mousemove', this._handleDrag);
    }
};

// Bind `this` for the global event listeners
WindowManager._handleDrag = WindowManager._handleDrag.bind(WindowManager);
WindowManager._stopDrag = WindowManager._stopDrag.bind(WindowManager);

export { WindowManager };
