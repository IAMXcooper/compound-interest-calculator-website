document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const inputs = {
        principal: document.getElementById('principal'),
        principalRange: document.getElementById('principal-range'),
        principalDisplay: document.getElementById('principal-display'),
        rate: document.getElementById('rate'),
        rateRange: document.getElementById('rate-range'),
        rateDisplay: document.getElementById('rate-display'),
        years: document.getElementById('years'),
        yearsRange: document.getElementById('years-range'),
        yearsDisplay: document.getElementById('years-display'),
        frequency: document.getElementById('frequency')
    };

    const outputs = {
        totalValue: document.getElementById('total-value'),
        totalInterest: document.getElementById('total-interest')
    };

    const ctx = document.getElementById('growthChart').getContext('2d');
    let growthChart;

    // --- State ---
    let state = {
        principal: 10000,
        rate: 5,
        years: 10,
        frequency: 1
    };

    // --- Initialization ---
    function init() {
        setupEventListeners();
        setupChart();
        updateCalculation();
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Sync Inputs and Sliders
        syncInput(inputs.principal, inputs.principalRange, 'principal', (val) => formatCurrency(val));
        syncInput(inputs.rate, inputs.rateRange, 'rate', (val) => `${val}%`);
        syncInput(inputs.years, inputs.yearsRange, 'years', (val) => `${val} Years`);

        // Frequency Change
        inputs.frequency.addEventListener('change', (e) => {
            state.frequency = parseInt(e.target.value);
            updateCalculation();
        });

        // FAQ Standard Accordion
        document.querySelectorAll('.accordion-button').forEach(button => {
            button.addEventListener('click', () => {
                const expanded = button.getAttribute('aria-expanded') === 'true';
                button.setAttribute('aria-expanded', !expanded);
                const content = button.nextElementSibling;
                if (!expanded) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                } else {
                    content.style.maxHeight = '0px';
                }
            });
        });
    }

    function syncInput(numberInput, rangeInput, key, formatFn) {
        // Input -> Range & State
        numberInput.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val)) val = 0;
            
            state[key] = val;
            rangeInput.value = val;
            if (inputs[`${key}Display`]) {
                inputs[`${key}Display`].textContent = formatFn(val);
            }
            updateCalculation();
        });

        // Range -> Input & State
        rangeInput.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            state[key] = val;
            numberInput.value = val;
            if (inputs[`${key}Display`]) {
                inputs[`${key}Display`].textContent = formatFn(val);
            }
            updateCalculation();
        });
    }

    // --- Calculation Logic ---
    function calculateCompoundInterest() {
        // P = Principal
        // r = Annual Interest Rate (decimal)
        // n = Frequency of Compounding per year
        // t = Time in years
        
        const P = state.principal;
        const r = state.rate / 100;
        const n = state.frequency;
        const t = state.years;

        // Formula: A = P(1 + r/n)^(nt)
        const A = P * Math.pow((1 + (r / n)), (n * t));
        const totalInterest = A - P;

        return {
            totalValue: A,
            totalInterest: totalInterest,
            yearlyData: generateYearlyData(P, r, n, t)
        };
    }

    function generateYearlyData(P, r, n, t) {
        const data = [];
        const labels = [];
        for (let i = 0; i <= t; i++) {
            const amount = P * Math.pow((1 + (r / n)), (n * i));
            data.push(amount);
            labels.push(`Year ${i}`);
        }
        return { labels, data };
    }

    function updateCalculation() {
        const result = calculateCompoundInterest();

        // Update Text Outputs
        outputs.totalValue.textContent = formatCurrency(result.totalValue);
        outputs.totalInterest.textContent = formatCurrency(result.totalInterest);

        // Update Chart
        updateChart(result.yearlyData);
    }

    // --- Chart.js Setup ---
    function setupChart() {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)'); // Start color
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)'); // End color

        growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Value',
                    data: [],
                    borderColor: '#38bdf8',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#38bdf8',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#f8fafc',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value.toLocaleString(); // Scuffed currency formatting for axis
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        });
    }

    function updateChart(chartData) {
        growthChart.data.labels = chartData.labels;
        growthChart.data.datasets[0].data = chartData.data;
        growthChart.update();
    }

    // --- Utilities ---
    function formatCurrency(num) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2
        }).format(num);
    }

    // Run
    init();
});
