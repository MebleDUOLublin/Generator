/**
 * PESTECZKA OS - MAIN SCRIPT
 * Orchestrates all modules and application logic.
 */
import { StorageSystem } from './storage.js';
import { WindowManager } from './windowManager.js';
import { ProfileManager } from './profileManager.js';
import * as UIManager from './uiManager.js';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await StorageSystem.init();
        await ProfileManager.populateSelector();
        setupStaticEventListeners();
        UIManager.loadWallpaper();
        console.log('✅ Pesteczka OS Initialized Successfully');
    } catch (error) {
        console.error('❌ CRITICAL ERROR during initialization:', error);
        const loginSubtitle = document.querySelector('.login-subtitle');
        if (loginSubtitle) {
            loginSubtitle.innerHTML = '<span style="color: #ef4444;">Błąd krytyczny. Sprawdź konsolę (F12).</span>';
        }
    }
});

// ============================================
// STATIC EVENT LISTENER SETUP
// ============================================
function setupStaticEventListeners() {
    // Clock
    UIManager.updateClock();
    setInterval(UIManager.updateClock, 1000);

    // Desktop Icons
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('dblclick', () => WindowManager.open(icon.dataset.window));
        icon.addEventListener('click', () => {
            document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
        });
    });

    // Taskbar & Start Menu
    document.querySelectorAll('.taskbar-icon[data-window]').forEach(icon => {
        icon.addEventListener('click', () => WindowManager.toggle(icon.dataset.window));
    });
    document.getElementById('startBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        UIManager.toggleStartMenu();
    });
    document.querySelectorAll('.start-app').forEach(app => {
        app.addEventListener('click', () => {
            WindowManager.open(app.dataset.window);
            UIManager.toggleStartMenu();
        });
    });
    document.getElementById('logoutBtn')?.addEventListener('click', ProfileManager.logout);

    // Global Listeners for closing menus, etc.
    document.addEventListener('click', (e) => {
        const startMenu = document.getElementById('startMenu');
        if (startMenu?.classList.contains('active') && !startMenu.contains(e.target) && !e.target.closest('#startBtn')) {
            UIManager.toggleStartMenu();
        }
        document.getElementById('contextMenu')?.classList.remove('active');
    });

    // Global drag handlers
    document.addEventListener('mousemove', WindowManager.handleDrag);
    document.addEventListener('mouseup', WindowManager.stopDrag);

    // Context Menu
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
            UIManager.handleContextMenuAction(action);
            contextMenu.classList.remove('active');
        }
    });
}
