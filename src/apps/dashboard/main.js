// src/apps/dashboard/main.js

(function() {
    let appProfile = null;
    let appWindow = null;

    const $ = (selector) => appWindow.querySelector(selector);

    async function init(profile, windowEl) {
        console.log("Dashboard App Initialized");
        appProfile = profile;
        appWindow = windowEl;

        updateWelcomeMessage();
        await loadAndRenderStats();
        renderChart();
    }

    function updateWelcomeMessage() {
        const welcomeEl = $('#dashboard-welcome');
        if (welcomeEl && appProfile) {
            welcomeEl.textContent = `Witaj, ${appProfile.name}!`;
        }
    }

    async function loadAndRenderStats() {
        if (!appProfile) return;

        try {
            const allOffers = await StorageSystem.db.getAllBy(StorageSystem.db.STORES.offers, 'profileKey', appProfile.key);
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();

            const thisMonthOffers = allOffers.filter(offer => {
                const date = new Date(offer.timestamp);
                return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
            });

            renderStatCards(thisMonthOffers);
            renderRecentActivity(allOffers);
        } catch (error) {
            console.error("Failed to load dashboard stats:", error);
        }
    }

    function renderStatCards(offers) {
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

        if ($('#stats-total-offers')) $('#stats-total-offers').textContent = offers.length;
        if ($('#stats-total-value')) $('#stats-total-value').textContent = `${totalValue.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
        if ($('#stats-new-clients')) $('#stats-new-clients').textContent = newClients;
        if ($('#stats-top-offer')) $('#stats-top-offer').textContent = `${topOffer.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
    }

    function renderRecentActivity(offers) {
        const activityList = $('#recent-activity-list');
        if (!activityList) return;

        offers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recentOffers = offers.slice(0, 5);

        if (recentOffers.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state" style="padding: 2rem 0;">
                    <div class="empty-state-icon" style="font-size: 2rem;">📂</div>
                    <p>Brak ostatniej aktywności.</p>
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
                <div class="activity-item" style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--gray-100);">
                    <div class="activity-icon" style="font-size: 1.25rem;">📄</div>
                    <div class="activity-details" style="flex: 1;">
                        <div class="activity-title" style="font-weight: 600; font-size: 0.9rem;">${offer.offer?.number || 'Oferta'}</div>
                        <div class="activity-subtitle" style="font-size: 0.8rem; color: var(--gray-500);">${offer.buyer?.name || 'Brak nabywcy'}</div>
                    </div>
                    <div class="activity-meta" style="text-align: right;">
                        <div class="activity-value" style="font-weight: 700; color: var(--primary-600); font-size: 0.9rem;">${value.toFixed(2)} zł</div>
                        <div class="activity-time" style="font-size: 0.75rem; color: var(--gray-400);">${new Date(offer.timestamp).toLocaleDateString('pl-PL')}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderChart() {
        const canvas = $('#offersChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Mock data for the chart, in a real app this would come from the database
        const data = {
            labels: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip'],
            datasets: [{
                label: 'Wartość Ofert (netto)',
                data: [12000, 19000, 15000, 22000, 18000, 25000, 28000],
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#ef4444',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f3f4f6' },
                    ticks: {
                        callback: (value) => value + ' zł',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                }
            }
        };

        new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }

    window.DashboardApp = { init };
})();
