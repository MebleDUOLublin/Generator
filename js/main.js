/**
 * PESTECZKA OS - MAIN SCRIPT
 * Orchestrates all modules and application logic.
 */
import { ProfileManager } from './profileManager.js';
import * as UIManager from './uiManager.js';
import { WindowManager } from './windowManager.js';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Start the application by populating the profile selector
    ProfileManager.populateSelector();

    // Set up all application-wide event listeners
    setupEventListeners();

    // Load the user's preferred wallpaper
    UIManager.loadWallpaper();

    console.log('✅ Pesteczka OS Initialized');
});

// ============================================
// EVENT LISTENER SETUP
// ============================================
function setupEventListeners() {
    // --- Clock ---
    UIManager.updateClock();
    setInterval(UIManager.updateClock, 1000);

    // --- Start Menu & Taskbar ---
    document.getElementById('startBtn')?.addEventListener('click', e => {
        e.stopPropagation();
        UIManager.toggleStartMenu();
    });

    // --- Logout ---
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        ProfileManager.logout();
    });

    // --- Event Delegation for Dynamic Content ---
    document.addEventListener('click', e => {
        // Close start menu if clicking outside
        const startMenu = document.getElementById('startMenu');
        if (startMenu?.classList.contains('active') && !startMenu.contains(e.target) && !e.target.closest('#startBtn')) {
            UIManager.toggleStartMenu(false); // Force hide
        }

        // Hide context menu on any click
        document.getElementById('contextMenu')?.classList.remove('active');

        // Handle clicks on dynamically generated start menu apps
        const startApp = e.target.closest('.start-app');
        if (startApp && startApp.dataset.window) {
            WindowManager.open(startApp.dataset.window);
            UIManager.toggleStartMenu(false); // Hide menu after opening app
        }
    });

    // Handle double-clicks on dynamically generated desktop icons
    document.getElementById('desktopIcons').addEventListener('dblclick', e => {
        const desktopIcon = e.target.closest('.desktop-icon');
        if (desktopIcon && desktopIcon.dataset.window) {
            WindowManager.open(desktopIcon.dataset.window);
        }
    });

    // --- Context Menu ---
    const contextMenu = document.getElementById('contextMenu');
    document.getElementById('desktop')?.addEventListener('contextmenu', e => {
        e.preventDefault();
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.classList.add('active');
    });

    contextMenu?.addEventListener('click', e => {
        const action = e.target.closest('.context-menu-item')?.dataset.action;
        if (action === 'logout') {
            ProfileManager.logout();
        } else {
            UIManager.handleContextMenuAction(action);
        }
        contextMenu.classList.remove('active');
    });
}
