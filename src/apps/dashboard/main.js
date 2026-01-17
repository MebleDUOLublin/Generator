// src/apps/dashboard/main.js

const Dashboard = {
    init: function() {
        console.log("Dashboard App Initialized");
        this.renderChart();
    },

    renderChart: function() {
        const ctx = document.getElementById('offersChart')?.getContext('2d');
        if (!ctx) {
            console.warn('Could not find offersChart canvas element.');
            return;
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
                y: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Wartość (zł)'
                    }
                },
                y1: {
                    beginAtZero: true,
                    type: 'linear',
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Ilość'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Aktywność Ofert w Czasie'
                }
            }
        };

        new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }
};


window.DashboardApp = {
  init: Dashboard.init.bind(Dashboard)
};
