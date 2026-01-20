// src/apps/dashboard/main.js

const DashboardApp = {
    // Keep track of the current profile, window element, and chart instance
    profile: null,
    windowEl: null,
    chartInstance: null,

    // Initialize the app
    async init(profile, windowEl) {
        console.log("Dashboard App Initialized");
        this.profile = profile;
        this.windowEl = windowEl;

        this.updateWelcomeMessage();
        await this.loadAndRenderStats();
        this.renderChart(); // Render the main chart
    },

    // Update welcome message
    updateWelcomeMessage() {
        const welcomeEl = this.windowEl.querySelector('#dashboard-welcome');
        if (welcomeEl && this.profile) {
            welcomeEl.textContent = `Witaj, ${this.profile.name}!`;
        }
    },

    // Fetch data and render all statistical components
    async loadAndRenderStats() {
        if (!this.profile) return;

        try {
            // Use the new, correct indexedDB function
            const allOffers = await PesteczkaOS.core.StorageSystem.db.getAllByIndex('offers', 'profileKey', this.profile.key);
            const thisMonthOffers = allOffers.filter(offer => new Date(offer.timestamp).getMonth() === new Date().getMonth());

            this.renderStatCards(thisMonthOffers);
            this.renderRecentActivity(allOffers);
        } catch (error) {
            console.error("Failed to load dashboard stats:", error);
        }
    },

    // Render the four main statistic cards
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

        const topOfferValue = Math.max(0, ...offers.map(offer => {
            return (offer.products || []).reduce((offerSum, p) => {
                const price = parseFloat(p.price) || 0;
                const qty = parseInt(p.qty, 10) || 0;
                const discount = parseFloat(p.discount) || 0;
                return offerSum + (price * qty * (1 - discount / 100));
            }, 0);
        }));

        this.windowEl.querySelector('#stats-total-offers').textContent = offers.length;
        this.windowEl.querySelector('#stats-total-value').textContent = `${totalValue.toFixed(2)} zł`;
        this.windowEl.querySelector('#stats-new-clients').textContent = newClients;
        this.windowEl.querySelector('#stats-top-offer').textContent = `${topOfferValue.toFixed(2)} zł`;
    },

    // Render the list of recent activities
    renderRecentActivity(offers) {
        const activityList = this.windowEl.querySelector('#recent-activity-list');
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
                </div>`;
        }).join('');
    },

    // Render the main line chart
    renderChart() {
        const ctx = this.windowEl.querySelector('#offersChart')?.getContext('2d');
        if (!ctx) {
            console.warn('Could not find offersChart canvas element.');
            return;
        }

        // IMPORTANT: Destroy the previous chart instance if it exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const data = {
            labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip'],
            datasets: [
                {
                    label: 'Wartość Ofert (netto)',
                    data: [12000, 19000, 15000, 22000, 18000, 25000, 28000],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'Ilość Ofert',
                    data: [15, 22, 18, 25, 20, 28, 32],
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, type: 'linear', position: 'left', title: { display: true, text: 'Wartość (zł)' } },
                y1: { beginAtZero: true, type: 'linear', position: 'right', title: { display: true, text: 'Ilość' }, grid: { drawOnChartArea: false } }
            },
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Aktywność Ofert w Czasie' }
            }
        };

        // Store the new chart instance
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }
};

// Expose the init function to the global scope for the plugin loader
window.DashboardApp = {
    init: DashboardApp.init.bind(DashboardApp)
};
