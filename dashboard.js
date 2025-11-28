/**
 * PESTECZKA OS - DASHBOARD MODULE
 */
const Dashboard = (() => {
    let offersChart = null;

    const init = () => {
        console.log('📊 Initializing Dashboard...');
        const ctx = document.getElementById('offersChart')?.getContext('2d');
        if (!ctx) {
            console.error('Chart canvas context not found!');
            return;
        }

        // Destroy existing chart if it exists
        if (offersChart) {
            offersChart.destroy();
        }

        // Chart Configuration
        const chartConfig = {
            type: 'line',
            data: {
                labels: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec'],
                datasets: [
                    {
                        label: 'Wartość Ofert (netto)',
                        data: [12000, 19000, 15000, 28000, 22000, 31000, 29000],
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderColor: '#ef4444',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#ef4444'
                    },
                    {
                        label: 'Ilość Ofert',
                        data: [30, 45, 40, 55, 50, 62, 60],
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        borderColor: '#6b7280',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#6b7280',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#6b7280'
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
                            callback: function(value, index, values) {
                                return value.toLocaleString('pl-PL') + ' zł';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Wyniki sprzedażowe w ostatnim półroczu'
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        };

        offersChart = new Chart(ctx, chartConfig);
        console.log('✅ Chart initialized.');
    };

    return {
        init
    };
})();
