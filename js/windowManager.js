
import { state } from './state.js';
import * as UI from './uiManager.js';

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

export async function openWindow(windowId) {
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
    state.zIndexCounter++;
    win.style.zIndex = state.zIndexCounter;

    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');

    const taskbarIcon = document.querySelector(`.taskbar-icon[data-window="${windowId}"]`);
    if(taskbarIcon) taskbarIcon.classList.add('active');

    if (window[windowId] && typeof window[windowId].init === 'function') {
        window[windowId].init();
    }
}

export function closeWindow(windowId) {
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

export function minimizeWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (win) {
        win.classList.add('minimized');
        win.classList.remove('focused');
        win.style.display = 'none';
    }
}

export function maximizeWindow(windowId) {
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

export function toggleWindow(windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win) return;

    if (win.style.display === 'flex' && !win.classList.contains('minimized')) {
        minimizeWindow(windowId);
    } else {
        openWindow(windowId);
    }
}

export function startDrag(event, windowId) {
    const win = document.getElementById(`window-${windowId}`);
    if (!win || win.classList.contains('maximized')) return;

    state.draggedWindow = win;

    // Focus the window
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    state.zIndexCounter++;
    win.style.zIndex = state.zIndexCounter;

    const rect = win.getBoundingClientRect();
    state.dragOffset.x = event.clientX - rect.left;
    state.dragOffset.y = event.clientY - rect.top;

    event.preventDefault();
}

export function handleWindowDrag(event) {
    if (!state.draggedWindow) return;

    const newX = event.clientX - state.dragOffset.x;
    const newY = event.clientY - state.dragOffset.y;

    state.draggedWindow.style.left = Math.max(0, newX) + 'px';
    state.draggedWindow.style.top = Math.max(0, newY) + 'px';
}

export function stopWindowDrag() {
    state.draggedWindow = null;
}

export function focusWindow(win) {
    document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
    win.classList.add('focused');
    state.zIndexCounter++;
    win.style.zIndex = state.zIndexCounter;
}
