// src/apps/dashboard/main.js

const DashboardApp = {
    async init() {
        console.log("Dashboard App Initialized");
        this.updateWelcomeMessage();
        await this.loadAndRenderStats();
        this.renderChart();
    },

    updateWelcomeMessage() {
        const welcomeEl = document.getElementById('dashboard-welcome');
        if (welcomeEl && window.currentProfile) {
            welcomeEl.textContent = `Witaj, ${window.currentProfile.name}!`;
        }
    },

    async loadAndRenderStats() {
        if (!window.currentProfile) return;

        try {
            // Fallback to getAll and filter if getAllBy is missing
            let allOffers = [];
            if (typeof StorageSystem.db.getAllBy === 'function') {
                allOffers = await StorageSystem.db.getAllBy(StorageSystem.db.STORES.offers, 'profileKey', window.currentProfile.key);
            } else {
                const rawOffers = await StorageSystem.db.getAll(StorageSystem.db.STORES.offers);
                allOffers = rawOffers.filter(o => o.profileKey === window.currentProfile.key);
            }

            const now = new Date();
            const thisMonthOffers = allOffers.filter(offer => {
                const offerDate = new Date(offer.timestamp);
                return offerDate.getMonth() === now.getMonth() && offerDate.getFullYear() === now.getFullYear();
            });

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

        const newClients = new Set(offers.map(o => o.buyer?.name?.trim().toLowerCase()).filter(Boolean)).size;

        const topOffer = offers.length > 0 ? Math.max(...offers.map(offer => {
             return (offer.products || []).reduce((offerSum, p) => {
                const price = parseFloat(p.price) || 0;
                const qty = parseInt(p.qty, 10) || 0;
                const discount = parseFloat(p.discount) || 0;
                return offerSum + (price * qty * (1 - discount / 100));
            }, 0);
        })) : 0;

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl('stats-total-offers', offers.length);
        setEl('stats-total-value', `${totalValue.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`);
        setEl('stats-new-clients', newClients);
        setEl('stats-top-offer', `${topOffer.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`);
    },

    renderRecentActivity(offers) {
        const activityList = document.getElementById('recent-activity-list');
        if (!activityList) return;

        offers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentOffers = offers.slice(0, 5);

        if (recentOffers.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state-small" style="text-align: center; padding: 2rem; color: var(--gray-400);">
                    <div class="empty-state-icon" style="font-size: 2rem;">📂</div>
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
                <div class="activity-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--gray-100);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="activity-icon" style="font-size: 1.25rem;">📄</div>
                        <div class="activity-details" style="display: flex; flex-direction: column;">
                            <span class="activity-title" style="font-weight: 600; color: var(--gray-800);">${offer.offer?.number || 'Oferta'}</span>
                            <span class="activity-subtitle" style="font-size: 0.8rem; color: var(--gray-500);">dla ${offer.buyer?.name || 'Klienta'}</span>
                        </div>
                    </div>
                    <div class="activity-meta" style="text-align: right; display: flex; flex-direction: column;">
                        <span class="activity-value" style="font-weight: 700; color: var(--primary-600);">${value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</span>
                        <span class="activity-time" style="font-size: 0.75rem; color: var(--gray-400);">${new Date(offer.timestamp).toLocaleDateString('pl-PL')}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderChart() {
        const ctx = document.getElementById('offersChart')?.getContext('2d');
        if (!ctx) return;

        // Dummy data for visualization
        const data = {
            labels: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'],
            datasets: [{
                label: 'Wartość Ofert',
                data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-500').trim() || '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
};

window.DashboardApp = DashboardApp;
