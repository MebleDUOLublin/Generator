// src/apps/dashboard/main.js

const DashboardApp = {
    profile: null,
    windowEl: null,
    chartInstance: null,

    async init(profile, windowEl) {
        this.profile = profile;
        this.windowEl = windowEl;
        this.updateWelcomeMessage();
        await this.loadAndRenderStats();
        this.renderChart();
    },

    updateWelcomeMessage() {
        const welcomeEl = this.windowEl.querySelector('#dashboard-welcome');
        if (welcomeEl && this.profile) {
            welcomeEl.textContent = `Witaj, ${this.profile.name}!`;
        }
    },

    async loadAndRenderStats() {
        if (!this.profile) return;
        try {
            const allOffers = await PesteczkaOS.core.StorageSystem.db.getAllByIndex('offers', 'profileKey', this.profile.key);
            const thisMonthOffers = allOffers.filter(offer => new Date(offer.timestamp).getMonth() === new Date().getMonth());
            this.renderStatCards(thisMonthOffers);
            this.renderRecentActivity(allOffers);
        } catch (error) {
            console.error("Failed to load dashboard stats:", error);
        }
    },

    renderStatCards(offers) {
        const totalValue = offers.reduce((sum, offer) => sum + (offer.products || []).reduce((offerSum, p) => offerSum + (p.price * p.qty * (1 - p.discount / 100)), 0), 0);
        const newClients = new Set(offers.map(o => o.buyer?.name.trim().toLowerCase())).size;
        const topOfferValue = Math.max(0, ...offers.map(offer => (offer.products || []).reduce((offerSum, p) => offerSum + (p.price * p.qty * (1 - p.discount / 100)), 0)));

        this.windowEl.querySelector('#stats-total-offers').textContent = offers.length;
        this.windowEl.querySelector('#stats-total-value').textContent = `${totalValue.toFixed(2)} zł`;
        this.windowEl.querySelector('#stats-new-clients').textContent = newClients;
        this.windowEl.querySelector('#stats-top-offer').textContent = `${topOfferValue.toFixed(2)} zł`;
    },

    renderRecentActivity(offers) {
        const activityList = this.windowEl.querySelector('#recent-activity-list');
        if (!activityList) return;

        const recentOffers = offers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
        if (recentOffers.length === 0) {
            activityList.innerHTML = `<div class="empty-state-small">Brak aktywności.</div>`;
            return;
        }

        activityList.innerHTML = recentOffers.map(offer => {
            const value = (offer.products || []).reduce((sum, p) => sum + (p.price * p.qty * (1 - p.discount / 100)), 0);
            return `
                <div class="activity-item">
                    <div>Nowa oferta: ${offer.offer.number} dla ${offer.buyer.name}</div>
                    <div>${value.toFixed(2)} zł - ${new Date(offer.timestamp).toLocaleDateString()}</div>
                </div>`;
        }).join('');
    },

    renderChart() {
        const ctx = this.windowEl.querySelector('#offersChart')?.getContext('2d');
        if (!ctx) return;
        if (this.chartInstance) this.chartInstance.destroy();

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip'],
                datasets: [{
                    label: 'Wartość Ofert (netto)',
                    data: [12000, 19000, 15000, 22000, 18000, 25000, 28000],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

window.DashboardApp = {
    init: DashboardApp.init.bind(DashboardApp)
};
