// src/apps/dashboard/main.js

window.DashboardApp = {
    profile: null,
    windowEl: null,
    chartInstance: null,

    async init(profile, windowEl) {
        this.profile = profile;
        this.windowEl = windowEl;
        console.log("Dashboard App Initialized for profile:", this.profile.key);

        this.updateWelcomeMessage();
        await this.loadAndRenderStats();
    },

    updateWelcomeMessage() {
        const welcomeEl = this.windowEl.querySelector('#dashboard-welcome');
        if (welcomeEl) {
            welcomeEl.textContent = `Witaj, ${this.profile.name}!`;
        }
    },

    async loadAndRenderStats() {
        try {
            const allOffers = await window.StorageSystem.db.getAllByIndex('offers', 'profileKey', this.profile.key);

            this.renderStatCards(allOffers);
            this.renderRecentActivity(allOffers);
            this.renderChart(allOffers);

        } catch (error) {
            console.error("Failed to load dashboard stats:", error);
            this.windowEl.querySelector('.dashboard-grid').innerHTML = "<p>Błąd ładowania danych.</p>";
        }
    },

    _calculateOfferNetValue(offer) {
        return (offer.products || []).reduce((sum, p) => {
            const price = parseFloat(p.price) || 0;
            const qty = parseInt(p.qty, 10) || 0;
            const discount = parseFloat(p.discount) || 0;
            return sum + (price * qty * (1 - discount / 100));
        }, 0);
    },

    renderStatCards(allOffers) {
        const thisMonthOffers = allOffers.filter(offer => new Date(offer.timestamp).getMonth() === new Date().getMonth());

        const totalValue = thisMonthOffers.reduce((sum, offer) => sum + this._calculateOfferNetValue(offer), 0);
        const newClients = new Set(thisMonthOffers.map(o => o.buyer?.name.trim().toLowerCase())).size;
        const topOfferValue = Math.max(0, ...thisMonthOffers.map(o => this._calculateOfferNetValue(o)));

        this.windowEl.querySelector('#stats-total-offers').textContent = thisMonthOffers.length;
        this.windowEl.querySelector('#stats-total-value').textContent = `${totalValue.toFixed(2)} zł`;
        this.windowEl.querySelector('#stats-new-clients').textContent = newClients;
        this.windowEl.querySelector('#stats-top-offer').textContent = `${topOfferValue.toFixed(2)} zł`;
    },

    renderRecentActivity(allOffers) {
        const activityList = this.windowEl.querySelector('#recent-activity-list');
        allOffers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentOffers = allOffers.slice(0, 5);

        if (recentOffers.length === 0) {
            activityList.innerHTML = `<div class="empty-state-small"><p>Brak ostatniej aktywności.</p></div>`;
            return;
        }

        activityList.innerHTML = recentOffers.map(offer => {
            const value = this._calculateOfferNetValue(offer);
            return `
                <div class="activity-item">
                    <div class="activity-details">
                        <strong class="activity-title">Oferta ${offer.offer.number}</strong>
                        <span class="activity-subtitle">dla ${offer.buyer.name}</span>
                    </div>
                    <div class="activity-meta">
                        <strong class="activity-value">${value.toFixed(2)} zł</strong>
                        <time class="activity-time">${new Date(offer.timestamp).toLocaleDateString('pl-PL')}</time>
                    </div>
                </div>`;
        }).join('');
    },

    renderChart(allOffers) {
        const ctx = this.windowEl.querySelector('#offersChart')?.getContext('2d');
        if (!ctx) return;

        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.getMonth(), year: d.getFullYear() };
        }).reverse();

        const labels = months.map(m => new Date(m.year, m.month).toLocaleString('pl-PL', { month: 'short' }));

        const monthlyData = months.map(({ month, year }) => {
            const offersInMonth = allOffers.filter(o => {
                const offerDate = new Date(o.timestamp);
                return offerDate.getMonth() === month && offerDate.getFullYear() === year;
            });
            const totalValue = offersInMonth.reduce((sum, o) => sum + this._calculateOfferNetValue(o), 0);
            return { count: offersInMonth.length, value: totalValue };
        });

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Wartość Ofert (netto)',
                        data: monthlyData.map(d => d.value),
                        borderColor: 'var(--primary-500)',
                        backgroundColor: 'rgba(var(--primary-500-rgb), 0.1)',
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'yValue'
                    },
                    {
                        label: 'Ilość Ofert',
                        data: monthlyData.map(d => d.count),
                        borderColor: 'var(--accent-500)',
                         backgroundColor: 'rgba(var(--accent-500-rgb), 0.1)',
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'yCount'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yValue: { position: 'left', beginAtZero: true, title: { display: true, text: 'Wartość (zł)' } },
                    yCount: { position: 'right', beginAtZero: true, title: { display: true, text: 'Ilość' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }
};
