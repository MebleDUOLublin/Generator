// src/apps/offers/main.js

function initOffersApp() {
    console.log("Offers App Initialized");

    // Initialize advanced UI features like Undo/Redo for this window
    if (typeof initializeAdvancedUI === 'function') {
        initializeAdvancedUI();
    }

    // Start the autosave interval, ensuring only one runs at a time
    if (window.autosaveInterval) clearInterval(window.autosaveInterval);
    window.autosaveInterval = setInterval(() => {
        if (typeof autosaveOffer === 'function') {
            autosaveOffer();
        }
    }, 60000); // 60 seconds

    // Set up initial form state
    if (typeof generateOfferNumber === 'function') generateOfferNumber();
    if (typeof setTodayDate === 'function') setTodayDate();

    // --- CRITICAL FIX: Attach event listeners ONLY after the DOM is ready ---

    document.getElementById('addProductBtn')?.addEventListener('click', () => addProduct({}));
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
    document.getElementById('saveOfferBtn')?.addEventListener('click', saveOffer);
    document.getElementById('loadOfferBtn')?.addEventListener('click', loadOffer);

    document.getElementById('clearFormBtn')?.addEventListener('click', async () => {
        if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić formularz?')) {
            // These globals are managed by app.js
            products = [];
            productImages = {};
            updateProductView();
            generateOfferNumber();
            setTodayDate();
            updateSummary();
            UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'info');
        }
    });

    // Ensure the selector is specific to the offers window to avoid conflicts
    document.querySelectorAll('#window-offers .tabs .tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if(typeof switchTab === 'function') {
                switchTab(tab.dataset.tab, e);
            }
        });
    });
}

// Expose the init function to the global scope so app.js can call it
window.OffersApp = {
  init: initOffersApp
};
