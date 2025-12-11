/**
 * PESTECZKA OS - WINDOW MANAGER
 * Handles all logic related to application windows, including dynamic loading.
 */
import { state } from './state.js';

const windowsContainer = document.getElementById('windowsContainer');
const loadedApps = new Set();

/**
 * Dynamically loads an application's resources (HTML, CSS, JS)
 * and creates its window in the DOM.
 * @param {string} appId - The ID of the application to load (e.g., 'offers').
 */
async function loadApp(appId) {
    if (loadedApps.has(appId)) {
        return; // App is already loaded
    }

    try {
        // 1. Fetch HTML content for the window
        const response = await fetch(`apps/${appId}/view.html`);
        if (!response.ok) throw new Error(`Could not fetch view for ${appId}`);
        const html = await response.text();

        // 2. Create the window element
        const win = document.createElement('div');
        win.className = 'window';
        win.id = `window-${appId}`;
        win.style.display = 'none'; // Initially hidden

        // Find app metadata from desktop icons (a bit of a hack, but works for now)
        const appIcon = document.querySelector(`.desktop-icon[data-window="${appId}"]`);
        const appName = appIcon ? appIcon.querySelector('.desktop-icon-name').textContent : 'Application';
        const appEmoji = appIcon ? appIcon.querySelector('.desktop-icon-image').textContent : '🚀';


        win.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <span class="window-title-icon">${appEmoji}</span>
                    <span>${appName}</span>
                </div>
                <div class="window-controls">
                    <button class="window-control-btn minimize" data-action="minimize" aria-label="Minimalizuj">−</button>
                    <button class="window-control-btn maximize" data-action="maximize" aria-label="Maksymalizuj">□</button>
                    <button class="window-control-btn close" data-action="close" aria-label="Zamknij">✕</button>
                </div>
            </div>
            ${html}
        `;
        windowsContainer.appendChild(win);

        // 3. Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `apps/${appId}/style.css`;
        document.head.appendChild(link);

        // 4. Load and initialize JavaScript module
        const { init } = await import(`/apps/${appId}/app.js`);
        if (typeof init === 'function') {
            init();
        }

        loadedApps.add(appId);
        setupWindowEvents(win);

    } catch (error) {
        console.error(`Error loading app ${appId}:`, error);
        // Optionally, show an error to the user
    }
}

/**
 * Opens a window, loading the app first if necessary.
 * @param {string} windowId - The ID of the window/app to open.
 */
async function openWindow(windowId) {
    if (!loadedApps.has(windowId)) {
        await loadApp(windowId);
    }

    const win = document.getElementById(`window-${windowId}`);
    if (!win) return;

    win.style.display = 'flex';
    win.classList.add('active');
    win.classList.remove('minimized');

    focusWindow(win);

    const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
    if(taskbarIcon) taskbarIcon.classList.add('active');
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
    if (!win) {
        openWindow(windowId);
        return;
    };

    if (win.style.display === 'flex' && !win.classList.contains('minimized')) {
        minimizeWindow(windowId);
    } else {
        openWindow(windowId);
    }
}

function focusWindow(win) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    win.style.zIndex = ++state.zIndexCounter;
}

function startDrag(event, win) {
    if (win.classList.contains('maximized')) return;

    state.draggedWindow = win;
    focusWindow(win);

    const rect = win.getBoundingClientRect();
    state.dragOffset.x = event.clientX - rect.left;
    state.dragOffset.y = event.clientY - rect.top;

    event.preventDefault();
}

function handleWindowDrag(event) {
    if (!state.draggedWindow) return;

    const newX = event.clientX - state.dragOffset.x;
    const newY = event.clientY - state.dragOffset.y;

    state.draggedWindow.style.left = Math.max(0, newX) + 'px';
    state.draggedWindow.style.top = Math.max(0, newY) + 'px';
}

function stopWindowDrag() {
    state.draggedWindow = null;
}

function handleWindowAction(action, windowId) {
    switch (action) {
        case 'minimize': minimizeWindow(windowId); break;
        case 'maximize': maximizeWindow(windowId); break;
        case 'close': closeWindow(windowId); break;
    }
}


function setupWindowEvents(win) {
    const windowId = win.id.replace('window-', '');
    const header = win.querySelector('.window-header');

    header?.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.window-control-btn')) {
            startDrag(e, win);
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


export const WindowManager = {
    open: openWindow,
    close: closeWindow,
    minimize: minimizeWindow,
    maximize: maximizeWindow,
    toggle: toggleWindow,
    handleDrag: handleWindowDrag,
    stopDrag: stopWindowDrag,
};
