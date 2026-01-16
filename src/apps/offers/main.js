// src/apps/offers/main.js

function init() {
    console.log("Offers App Initialized");

    // Call functions that depend on this app's UI
    if (typeof generateOfferNumber === 'function') generateOfferNumber();
    if (typeof setTodayDate === 'function') setTodayDate();

    // Attach all event listeners for the Offer Generator UI
    document.getElementById('addProductBtn')?.addEventListener('click', () => addProduct({}));
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
    document.getElementById('saveOfferBtn')?.addEventListener('click', saveOffer);
    document.getElementById('loadOfferBtn')?.addEventListener('click', loadOffer);

    document.getElementById('clearFormBtn')?.addEventListener('click', async () => {
        if (await UI.Feedback.confirm('Czy na pewno chcesz wyczyścić formularz?')) {
            products = [];
            productImages = {};
            updateProductView();
            generateOfferNumber();
            setTodayDate();
            updateSummary();
            UI.Feedback.toast('🗑️ Formularz wyczyszczony', 'info');
        }
    });

    document.querySelectorAll('#window-offers .tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(tab.dataset.tab, e));
    });
}

// Expose the init function
window.OffersApp = {
  init: init
};
