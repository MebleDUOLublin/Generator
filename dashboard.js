/**
 * PESTECZKA OS - DASHBOARD MODULE
 */
const Dashboard = (() => {
    let offersChart = null;

    const init = async () => {
        console.log('📊 Initializing Dashboard...');

        try {
            const offers = await StorageSystem.db.getAll(StorageSystem.db.STORES.offers);
            updateStats(offers);
            renderChart(offers);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Optionally render chart with empty/default data
        }
    };

    const updateStats = (offers) => {
        const totalOffers = offers.length;
        const totalValue = offers.reduce((sum, offer) => sum + calculateOfferNetValue(offer), 0);
        const newClients = new Set(offers.map(o => o.buyer.name)).size;

        document.getElementById('stats-total-offers').textContent = totalOffers;
        document.getElementById('stats-total-value').textContent = `${(totalValue / 1000).toFixed(1)}K zł`;
        document.getElementById('stats-new-clients').textContent = newClients;
        // Conversion rate is static for now
    };

    const calculateOfferNetValue = (offer) => {
        return offer.products.reduce((sum, p) => {
            const price = parseFloat(p.price) || 0;
            const qty = parseFloat(p.qty) || 0;
            const discount = parseFloat(p.discount) || 0;
            return sum + (price * qty * (1 - discount / 100));
        }, 0);
    };

    const renderChart = (offers) => {
        const ctx = document.getElementById('offersChart')?.getContext('2d');
        if (!ctx) {
            console.error('Chart canvas context not found!');
            return;
        }

        if (offersChart) {
            offersChart.destroy();
        }

        const monthlyData = offers.reduce((acc, offer) => {
            const month = new Date(offer.timestamp).toLocaleString('default', { month: 'long' });
            if (!acc[month]) {
                acc[month] = { value: 0, count: 0 };
            }
            acc[month].value += calculateOfferNetValue(offer);
            acc[month].count++;
            return acc;
        }, {});

        const labels = Object.keys(monthlyData);
        const valueData = labels.map(l => monthlyData[l].value);
        const countData = labels.map(l => monthlyData[l].count);

        const chartConfig = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Wartość Ofert (netto)',
                        data: valueData,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderColor: '#ef4444',
                        tension: 0.4,
                        fill: true,
                    },
                    {
                        label: 'Ilość Ofert',
                        data: countData,
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        borderColor: '#6b7280',
                        tension: 0.4,
                        fill: true,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        };

        offersChart = new Chart(ctx, chartConfig);
        console.log('✅ Chart initialized with dynamic data.');
    };

    return {
        init
    };
})();
