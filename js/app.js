// /js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // Inicjalizacja po załadowaniu DOM
    initializeApp();
});

function initializeApp() {
    // Wczytaj ostatnio aktywną aplikację
    const lastApp = localStorage.getItem('lastActiveApp');
    if (lastApp) {
        // Bezpieczne przełączanie, jeśli element istnieje
        const tabButton = document.querySelector(`.control-tab[onclick="switchApp('${lastApp}')"]`);
        if (tabButton) {
            switchApp(lastApp, tabButton);
        }
    }

    // Nasłuchuj globalnych skrótów klawiszowych
    document.addEventListener('keydown', handleGlobalShortcuts);

    // Inicjalizacja poszczególnych modułów
    if (typeof initializeWelcome === 'function') {
        initializeWelcome();
    }
    if (typeof initializeOffers === 'function') {
        initializeOffers();
    }
    if (typeof initializeDiablo === 'function') {
        initializeDiablo();
    }
}

/**
 * Przełącza widok między aplikacjami (zakładkami).
 * @param {string} appName - Nazwa aplikacji do aktywacji ('welcome', 'offers', 'diablo', 'help').
 * @param {HTMLElement} clickedTab - Opcjonalnie, kliknięty element zakładki.
 */
function switchApp(appName, clickedTab) {
    // Ukryj wszystkie sekcje aplikacji
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
    });

    // Dezaktywuj wszystkie przyciski zakładek
    document.querySelectorAll('.control-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Pokaż wybraną sekcję aplikacji
    const selectedApp = document.getElementById(`${appName}-app`);
    if (selectedApp) {
        selectedApp.classList.add('active');
    }

    // Aktywuj klikniętą zakładkę
    const tabToActivate = clickedTab || document.querySelector(`.control-tab[onclick="switchApp('${appName}')"]`);
    if (tabToActivate) {
        tabToActivate.classList.add('active');
    }

    // Zapisz ostatnio aktywną aplikację w localStorage
    localStorage.setItem('lastActiveApp', appName);
}

/**
 * Wyświetla powiadomienie na ekranie.
 * @param {string} message - Treść powiadomienia.
 * @param {string} type - Typ powiadomienia ('success', 'error', 'warning', 'info').
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Wyświetla krótką wiadomość (toast).
 * @param {string} message - Treść wiadomości.
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

/**
 * Formatuje liczbę jako walutę.
 * @param {number} amount - Kwota do sformatowania.
 * @returns {string} Sformatowana kwota.
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number') {
        return '0,00 zł';
    }
    return amount.toFixed(2).replace('.', ',') + ' zł';
}

/**
 * Bezpiecznie parsuje string JSON.
 * @param {string} jsonString - String do sparsowania.
 * @param {*} fallback - Wartość domyślna w razie błędu.
 * @returns {object|null} Sparsowany obiekt lub fallback.
 */
function safeJSONParse(jsonString, fallback = null) {
    try {
        if (!jsonString || typeof jsonString !== 'string') {
            return fallback;
        }
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Błąd parsowania JSON:', error);
        return fallback;
    }
}

/**
 * Obsługuje globalne skróty klawiszowe.
 * @param {KeyboardEvent} e - Obiekt zdarzenia klawiatury.
 */
function handleGlobalShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case '1':
                switchApp('welcome');
                e.preventDefault();
                break;
            case '2':
                switchApp('offers');
                e.preventDefault();
                break;
            case '3':
                switchApp('diablo');
                e.preventDefault();
                break;
        }
    }
}

console.log('Ładowanie app.js zakończone.');