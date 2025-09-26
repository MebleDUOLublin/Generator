// /js/welcome.js

function initializeWelcome() {
    // Inicjalizacja statystyk i ostatnich aktywności
    updateWelcomeStats();
    updateRecentActivity();
    console.log('Moduł Welcome zainicjalizowany.');
}

/**
 * Aktualizuje statystyki na ekranie powitalnym.
 */
function updateWelcomeStats() {
    try {
        const offersData = safeJSONParse(localStorage.getItem('lastSavedOffer'), {});
        const diabloData = safeJSONParse(localStorage.getItem('diabloOrder'), {});

        const totalOffers = (offersData && offersData.products) ? offersData.products.length : 0;
        const totalOrders = (diabloData && diabloData.products) ? diabloData.products.length : 0;

        let totalValue = 0;
        if (offersData && offersData.products && Array.isArray(offersData.products)) {
            offersData.products.forEach(product => {
                const qty = parseFloat(product.qty) || 0;
                const price = parseFloat(product.price) || 0;
                const discount = parseFloat(product.discount) || 0;
                const discountedPrice = price * (1 - discount / 100);
                totalValue += qty * discountedPrice;
            });
        }

        document.getElementById('totalOffers').textContent = totalOffers;
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('totalValue').textContent = formatCurrency(totalValue);
    } catch (error) {
        console.error('Błąd aktualizacji statystyk powitalnych:', error);
    }
}

/**
 * Aktualizuje listę ostatnich działań na ekranie powitalnym.
 */
function updateRecentActivity() {
    try {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        const history = safeJSONParse(localStorage.getItem('orderHistory'), []);
        if (history.length === 0) {
            activityList.innerHTML = `
                <div class="activity-empty">
                    <div class="empty-icon">📋</div>
                    <div class="empty-title">Brak ostatnich działań</div>
                    <div class="empty-desc">Rozpocznij pracę, aby zobaczyć historię</div>
                </div>`;
            return;
        }

        let html = '';
        history.slice(-3).reverse().forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString('pl-PL');
            const desc = entry.data?.offer?.number ? `Oferta ${entry.data.offer.number}` : 'Zapisana oferta';
            const icon = entry.type === 'offer' ? '📄' : '🪑';

            html += `
                <div class="activity-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: white; border-radius: 8px; margin-bottom: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div class="activity-icon" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem;">
                        ${icon}
                    </div>
                    <div class="activity-content" style="flex: 1;">
                        <div class="activity-title" style="font-weight: 600; color: var(--dark);">${desc}</div>
                        <div class="activity-date" style="font-size: 0.875rem; color: var(--gray);">${date}</div>
                    </div>
                </div>
            `;
        });
        activityList.innerHTML = html;
    } catch (error) {
        console.error('Błąd aktualizacji ostatnich działań:', error);
    }
}

/**
 * Wczytuje ostatnio zapisaną ofertę.
 */
function loadLastOffer() {
    const saved = localStorage.getItem('lastSavedOffer');
    if (!saved) {
        showNotification('Brak zapisanej oferty do wczytania.', 'warning');
        return;
    }

    const data = safeJSONParse(saved);
    if (data && typeof loadOfferData === 'function') {
        switchApp('offers');
        // Opóźnienie, aby dać czas na przełączenie widoku
        setTimeout(() => {
            loadOfferData(data);
            showNotification('Ostatnia zapisana oferta została wczytana.', 'success');
        }, 100);
    } else {
        showNotification('Nie udało się wczytać ostatniej oferty.', 'error');
    }
}

/**
 * Wyświetla modal z analityką.
 */
function showAnalytics() {
    if (typeof generateAnalyticsDashboard !== 'function') {
        showNotification('Funkcja analityki jest niedostępna.', 'error');
        return;
    }

    const analytics = generateAnalyticsDashboard();
    const modal = document.createElement('div');
    modal.className = 'modal-enhanced show';
    modal.innerHTML = `
        <div class="modal-content-enhanced" style="max-width: 700px;">
            <div style="padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="margin: 0; color: var(--dark); font-family: 'Poppins', sans-serif;">📊 Dashboard Analityczny</h2>
                    <button onclick="this.closest('.modal-enhanced').remove()" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--gray);">&times;</button>
                </div>
                <!-- Treść analityki -->
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}


/**
 * Wyświetla pomoc dla ekranu powitalnego.
 */
function showWelcomeHelp() {
    const modal = document.createElement('div');
    modal.className = 'modal-enhanced show';
    modal.innerHTML = `
        <div class="modal-content-enhanced">
            <div style="padding: 2rem;">
                <h2 style="font-family: 'Poppins', sans-serif;">Pomoc</h2>
                <p>To jest Centrum Dowodzenia. Możesz stąd zarządzać ofertami i zamówieniami.</p>
                <button onclick="this.closest('.modal-enhanced').remove()">Zamknij</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}