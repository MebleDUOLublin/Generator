/**
 * PESTECZKA OS - UI MANAGER
 * Handles general UI elements and interactions.
 */
import { WindowManager } from './windowManager.js';
import { ProfileManager } from './profileManager.js';

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

function showNotification(title, message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        return;
    }

    notification.querySelector('.notification-title').textContent = title;
    notification.querySelector('.notification-message').textContent = message;

    const colors = { info: '#3b82f6', success: '#10b981', error: '#ef4444' };
    notification.style.borderLeftColor = colors[type] || colors.info;

    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 4000);
}

function handleContextMenuAction(action) {
    switch (action) {
        case 'change-wallpaper':
            WindowManager.open('settings');
            break;
        case 'add-icon':
            showNotification('Informacja', 'Funkcja wkrótce dostępna!', 'info');
            break;
        case 'logout':
            ProfileManager.logout();
            break;
    }
}

function switchTab(tabId, event) {
    const tabsContainer = event.target.closest('.tabs');
    const windowContent = tabsContainer.parentElement;

    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.closest('.tab').classList.add('active');

    windowContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    windowContent.querySelector(`#${tabId}-tab`).classList.add('active');
}

function toggleStartMenu() {
    document.getElementById('startMenu').classList.toggle('active');
}

function changeWallpaper(wallpaperKey) {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;

    // Redesigned to use local assets/styles only
    const wallpapers = {
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        wallpaper1: 'linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)',
        wallpaper2: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
        wallpaper3: 'linear-gradient(45deg, #874da2 0%, #c43a30 100%)'
    };

    if (wallpapers[wallpaperKey]) {
        desktop.style.backgroundImage = wallpapers[wallpaperKey];
        showNotification('Informacja', `Zmieniono tapetę`, 'info');
        localStorage.setItem('pesteczkaOS_wallpaper', wallpaperKey);
    }
}

function loadWallpaper() {
    const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper') || 'default';
    changeWallpaper(savedWallpaper);
    document.querySelectorAll('.wallpaper-preview').forEach(p => p.classList.remove('active'));
    const activePreview = document.querySelector(`.wallpaper-preview[data-wallpaper="${savedWallpaper}"]`);
    if (activePreview) {
        activePreview.classList.add('active');
    }
}


export {
    updateClock,
    showNotification,
    handleContextMenuAction,
    switchTab,
    toggleStartMenu,
    changeWallpaper,
    loadWallpaper
};
