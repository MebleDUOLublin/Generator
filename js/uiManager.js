
import { openWindow, toggleWindow } from './windowManager.js';
import { logout } from './profileManager.js';
import { state } from './state.js';

export function setupDesktopInteractions() {
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

export function setupTaskbarAndStartMenu() {
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

export function switchTab(tabId, event) {
    const tabButton = event.currentTarget;
    const windowContent = tabButton.closest('.window-content');

    // Deactivate all tabs and content within the same window
    windowContent.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    windowContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activate the clicked tab and its corresponding content
    tabButton.classList.add('active');
    const activeTabContent = windowContent.querySelector(`#${tabId}`);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    } else {
        console.error(`Tab content with ID #${tabId} not found.`);
    }
}

export function toggleStartMenu() {
    const menu = document.getElementById('startMenu');
    if(menu) menu.classList.toggle('active');
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

export function changeWallpaper(wallpaper) {
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
