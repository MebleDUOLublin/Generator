/**
 * PESTECZKA OS - DASHBOARD MODULE
 */
const Dashboard = (() => {
    let offersChart = null;

    const _fetchAndProcessData = async () => {
        const offers = await StorageSystem.db.getAll(StorageSystem.db.STORES.offers);
        const monthlyData = {};

        offers.forEach(offer => {
            const month = new Date(offer.timestamp).toLocaleString('default', { month: 'long' });
            if (!monthlyData[month]) {
                monthlyData[month] = { count: 0, totalValue: 0 };
            }
            monthlyData[month].count++;
            monthlyData[month].totalValue += offer.products.reduce((acc, p) => acc + (p.price * p.qty * (1 - p.discount / 100)), 0);
        });

        const labels = Object.keys(monthlyData);
        const offerCounts = labels.map(label => monthlyData[label].count);
        const offerValues = labels.map(label => monthlyData[label].totalValue);

        return { labels, offerCounts, offerValues };
    };

    const init = async () => {
        console.log('📊 Initializing Dashboard...');
        const ctx = document.getElementById('offersChart')?.getContext('2d');
        if (!ctx) return;

        if (offersChart) offersChart.destroy();

        const { labels, offerCounts, offerValues } = await _fetchAndProcessData();

        offersChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Wartość Ofert (netto)',
                        data: offerValues,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true,
                    },
                    {
                        label: 'Ilość Ofert',
                        data: offerCounts,
                        borderColor: '#6b7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        tension: 0.4,
                        fill: true,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('pl-PL') + ' zł'
                        }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Wyniki sprzedażowe w ostatnim półroczu' }
                }
            }
        });
        console.log('✅ Chart initialized.');
    };

    return {
        init
    };
})();
