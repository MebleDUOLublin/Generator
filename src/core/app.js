/**
 * PESTECZKA OS - MAIN APPLICATION SCRIPT
 * Orchestrates all modules and application logic.
 */

// ============================================
// GLOBAL STATE
// ============================================
let currentProfile = null;

// ============================================
// UI SETUP
// ============================================
function setupUI() {
    console.log('🎨 Setting up UI event listeners...');
    
    updateClock();
    setInterval(updateClock, 1000);

    DesktopManager.setupDesktopInteractions();
    setupStaticUIElements();
    setupGlobalEventListeners();

    console.log('✅ All UI event listeners attached!');
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (!root || !theme) {
        console.warn('Attempted to apply theme but no theme object or root element was found.');
        return;
    }

    const themeColors = {
        '--primary-500': theme.primary,
        '--primary-600': theme.accent,
        '--primary-700': theme.accent,
        '--accent-500': theme.accent,
        '--accent-600': theme.primary,
        '--shadow-glow': `0 0 40px -10px ${theme.primary}`
    };

    for (const [key, value] of Object.entries(themeColors)) {
        if (value) {
            root.style.setProperty(key, value);
        }
    }
    console.log(`🎨 Theme applied with primary color: ${theme.primary}`);
}

function setupStaticUIElements() {
    document.getElementById('startBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStartMenu();
    });
    document.getElementById('logoutBtn')?.addEventListener('click', AuthManager.logout);
}

function setupGlobalEventListeners() {
    document.addEventListener('click', (e) => {
        const startMenu = document.getElementById('startMenu');
        const startBtn = document.getElementById('startBtn');
        if (startMenu?.classList.contains('active') && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.classList.remove('active');
        }
        document.getElementById('contextMenu')?.classList.remove('active');
    });

    document.addEventListener('mousemove', (e) => WindowManager.handleWindowDrag(e));
    document.addEventListener('mouseup', () => WindowManager.stopWindowDrag());
    document.addEventListener('keydown', handleGlobalHotkeys);
}

function handleGlobalHotkeys(e) {
    if (e.key === 'Escape') {
        document.getElementById('startMenu')?.classList.remove('active');
    }
}

// ============================================
// TAB SWITCHING & START MENU
// ============================================
function switchTab(tabId, event) {
    const clickedTab = event.target.closest('.tab');
    if (!clickedTab) return;

    const tabsContainer = clickedTab.closest('.tabs');
    const windowContent = clickedTab.closest('.window-content');

    tabsContainer.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');

    windowContent.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeTabContent = windowContent.querySelector(`#${tabId}-tab`);
    if (activeTabContent) {
        activeTabContent.classList.add('active');
    }
}

function toggleStartMenu() {
    const menu = document.getElementById('startMenu');
    if(menu) menu.classList.toggle('active');
}

// ============================================
// UTILITY & UI HELPER FUNCTIONS
// ============================================
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

console.log('✅ App.js loaded successfully');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Pesteczka OS Main App Script Started');

    try {
        if (!window.StorageSystem || !window.PluginLoader) {
            throw new Error('Core systems (StorageSystem, PluginLoader) not found.');
        }

        await Promise.all([
            window.StorageSystem.init(),
            window.PluginLoader.init()
        ]);

        await AuthManager.populateProfileSelector();

        console.log('✅ Pesteczka OS Initialized Successfully');
    } catch (error) {
        console.error('❌ CRITICAL ERROR during initialization:', error);
        document.body.innerHTML = `<div class="critical-error-container">
            <h1>Błąd krytyczny</h1>
            <p>Nie można załadować aplikacji. Sprawdź konsolę (F12), aby uzyskać szczegółowe informacje.</p>
            <pre>${error.stack}</pre>
        </div>`;
    }
});
