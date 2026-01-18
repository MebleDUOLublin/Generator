// src/apps/dashboard/main.js

const DashboardApp = {
    async init() {
        console.log("Dashboard App Initialized");
        this.updateWelcomeMessage();
        await this.loadAndRenderStats();
    },

    updateWelcomeMessage() {
        const welcomeEl = document.getElementById('dashboard-welcome');
        if (welcomeEl && currentProfile) {
            welcomeEl.textContent = `Witaj, ${currentProfile.name}!`;
        }
    },

    async loadAndRenderStats() {
        if (!currentProfile) return;

        try {
            const allOffers = await StorageSystem.db.getAllBy(StorageSystem.db.STORES.offers, 'profileKey', currentProfile.key);
            const thisMonthOffers = allOffers.filter(offer => new Date(offer.timestamp).getMonth() === new Date().getMonth());

            this.renderStatCards(thisMonthOffers);
            this.renderRecentActivity(allOffers);
        } catch (error) {
            console.error("Failed to load dashboard stats:", error);
        }
    },

    renderStatCards(offers) {
        const totalValue = offers.reduce((sum, offer) => {
            return sum + (offer.products || []).reduce((offerSum, p) => {
                const price = parseFloat(p.price) || 0;
                const qty = parseInt(p.qty, 10) || 0;
                const discount = parseFloat(p.discount) || 0;
                return offerSum + (price * qty * (1 - discount / 100));
            }, 0);
        }, 0);

        const newClients = new Set(offers.map(o => o.buyer?.name.trim().toLowerCase())).size;
        const topOffer = Math.max(0, ...offers.map(offer => {
             return (offer.products || []).reduce((offerSum, p) => {
                const price = parseFloat(p.price) || 0;
                const qty = parseInt(p.qty, 10) || 0;
                const discount = parseFloat(p.discount) || 0;
                return offerSum + (price * qty * (1 - discount / 100));
            }, 0);
        }));

        document.getElementById('stats-total-offers').textContent = offers.length;
        document.getElementById('stats-total-value').textContent = `${totalValue.toFixed(2)} zł`;
        document.getElementById('stats-new-clients').textContent = newClients;
        document.getElementById('stats-top-offer').textContent = `${topOffer.toFixed(2)} zł`;
    },

    renderRecentActivity(offers) {
        const activityList = document.getElementById('recent-activity-list');
        if (!activityList) return;

        offers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentOffers = offers.slice(0, 5);

        if (recentOffers.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state-small">
                    <div class="empty-state-icon">📂</div>
                    <p>Brak ostatniej aktywności do wyświetlenia.</p>
                </div>`;
            return;
        }

        activityList.innerHTML = recentOffers.map(offer => {
            const value = (offer.products || []).reduce((sum, p) => {
                 const price = parseFloat(p.price) || 0;
                const qty = parseInt(p.qty, 10) || 0;
                const discount = parseFloat(p.discount) || 0;
                return sum + (price * qty * (1 - discount / 100));
            }, 0);

            return `
                <div class="activity-item">
                    <div class="activity-icon">📄</div>
                    <div class="activity-details">
                        <span class="activity-title">Nowa oferta: ${offer.offer.number}</span>
                        <span class="activity-subtitle">dla ${offer.buyer.name}</span>
                    </div>
                    <div class="activity-meta">
                        <span class="activity-value">${value.toFixed(2)} zł</span>
                        <span class="activity-time">${new Date(offer.timestamp).toLocaleDateString('pl-PL')}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};

window.DashboardApp = {
    init: DashboardApp.init.bind(DashboardApp)
};
