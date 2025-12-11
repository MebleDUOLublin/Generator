/**
 * PESTECZKA OS - UI MANAGER
 * Handles DOM manipulation, UI elements, and visual state transitions.
 */
import { state } from './state.js';
import { WindowManager } from './windowManager.js';

/**
 * A helper function to create a DOM element with specified attributes.
 * @param {string} tag - The HTML tag for the element.
 * @param {object} attributes - An object of attributes to set on the element.
 * @returns {HTMLElement} The created DOM element.
 */
export function createDOMElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key.startsWith('data-')) {
            element.dataset[key.substring(5)] = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    return element;
}

/**
 * Updates the clock in the taskbar every second.
 */
export function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });

    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.querySelector('.clock-time').textContent = time;
        clockEl.querySelector('.clock-date').textContent = date;
    }
}

/**
 * Displays a toast notification.
 * @param {string} title - The title of the notification.
 * @param {string} message - The body text of the notification.
 * @param {('info'|'success'|'error')} type - The type of notification.
 */
export function showNotification(title, message, type = 'info') {
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

/**
 * Toggles the visibility of the Start Menu.
 * @param {boolean} [force] - Optional. True to force show, false to force hide.
 */
export function toggleStartMenu(force) {
    document.getElementById('startMenu')?.classList.toggle('active', force);
}

/**
 * Handles actions triggered from the desktop context menu.
 * @param {string} action - The action to perform (e.g., 'logout').
 */
export function handleContextMenuAction(action) {
    if (action === 'change-wallpaper') {
        WindowManager.open('settings');
    }
    // Note: The 'logout' action is now handled directly in main.js
}

/**
 * Transitions the UI from the login screen to the desktop.
 */
export function transitionToDesktop() {
    const loginScreen = document.getElementById('loginScreen');
    const desktop = document.getElementById('desktop');

    loginScreen.classList.add('hidden');
    document.body.classList.remove('login-page');

    setTimeout(() => {
        desktop.classList.add('active');
    }, 500); // Match this with CSS animation duration
}

/**
 * Transitions the UI from the desktop back to the login screen.
 */
export function transitionToLogin() {
    const loginScreen = document.getElementById('loginScreen');
    const desktop = document.getElementById('desktop');

    desktop.classList.remove('active');

    setTimeout(() => {
        loginScreen.classList.remove('hidden');
        document.body.classList.add('login-page');
    }, 500);
}

/**
 * Updates the user info display in the Start Menu.
 * @param {object} profile - The current user's profile object.
 */
export function updateUserInfo(profile) {
    if (!profile) return;
    document.getElementById('userName').textContent = profile.name || 'Użytkownik';
    document.getElementById('userEmail').textContent = profile.email || '';
    document.getElementById('userAvatar').textContent = (profile.name || 'U').substring(0, 2).toUpperCase();
}


/**
 * Loads the saved wallpaper from localStorage or applies the default.
 */
export function loadWallpaper() {
    const desktop = document.getElementById('desktop');
    const savedWallpaper = localStorage.getItem('pesteczkaOS_wallpaper') || 'default';
    const wallpapers = {
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        wallpaper1: 'linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)',
        wallpaper2: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
        wallpaper3: 'linear-gradient(45deg, #874da2 0%, #c43a30 100%)'
    };
    if (desktop && wallpapers[savedWallpaper]) {
        desktop.style.backgroundImage = wallpapers[savedWallpaper];
    }
}
