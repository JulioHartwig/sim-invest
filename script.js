document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o simulador quando o DOM estiver pronto
    const simulateButton = document.getElementById('simulateButton');
    simulateButton.addEventListener('click', simulate);
});

let myChart = null;

function formatCurrency(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function calculateCAGR(initialValue, endingValue, years) {
    if (initialValue <= 0) return 0;
    return ((Math.pow(endingValue / initialValue, 1 / years) - 1) * 100);
}

function simulate() {
    // Obter valores dos inputs
    const initialCapital = parseFloat(document.getElementById('initialCapital').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const years = parseInt(document.getElementById('years').value) || 1;
    const inflation = (parseFloat(document.getElementById('inflation').value) || 0) / 100;
    const baseInterest = (parseFloat(document.getElementById('interest').value) || 0) / 100;
    const interestVariation = (parseFloat(document.getElementById('interestVariation').value) || 0) / 100;
    const marketCondition = document.getElementById('marketCondition').value;
    const taxation = (parseFloat(document.getElementById('taxation').value) || 0) / 100;
    const contributionAdjustment = (parseFloat(document.getElementById('contributionAdjustment').value) || 0) / 100;
    
    // Ajustar retorno base pela condição do mercado
    let marketMultiplier;
    switch(marketCondition) {
        case 'bull': marketMultiplier = 1.3; break;
        case 'bear': marketMultiplier = 0.7; break;
        default: marketMultiplier = 1.0;
    }
    
    // Inicializar variáveis
    let currentValue = initialCapital;
    let totalContributions = initialCapital;
    let totalTaxes = 0;
    let annualContributions = monthlyContribution * 12;
    
    // Preparar arrays para resultados
    const results = [];
    const labels = [];
    const realValues = [];
    const nominalValues = [];
    const contributions = [];
    const taxes = [];
    const earnings = [];
    const interestRates = [];
    
    // Simulação ano a ano
    for(let year = 1; year <= years; year++) {
        // Calcular retorno deste ano com variação aleatória
        const randomVariation = (Math.random() * 2 - 1) * interestVariation;
        let annualInterest = baseInterest * marketMultiplier + randomVariation;
        
        // Calcular aportes do ano (com ajuste anual)
        if(year > 1) {
            annualContributions *= (1 + contributionAdjustment);
        }
        
        // Calcular rendimento antes dos impostos
        const earningsBeforeTax = currentValue * annualInterest;
        
        // Calcular impostos sobre o rendimento
        const yearTaxes = earningsBeforeTax * taxation;
        
        // Calcular rendimento líquido
        const netEarnings = earningsBeforeTax - yearTaxes;
        
        // Atualizar valor total
        const initialYearValue = currentValue;
        currentValue += netEarnings + annualContributions;
        totalContributions += annualContributions;
        totalTaxes += yearTaxes;
        
        // Calcular valor real (ajustado pela inflação)
        const realValue = currentValue / Math.pow(1 + inflation, year);
        
        // Armazenar resultados
        results.push({
            year: year,
            initialValue: initialYearValue,
            contribution: annualContributions,
            earnings: netEarnings,
            taxes: yearTaxes,
            finalValue: currentValue,
            realValue: realValue,
            interestRate: annualInterest * 100
        });
        
        labels.push(`Ano ${year}`);
        realValues.push(realValue);
        nominalValues.push(currentValue);
        contributions.push(annualContributions);
        taxes.push(yearTaxes);
        earnings.push(netEarnings);
        interestRates.push(annualInterest * 100);
    }
    
    // Exibir resultados
    displayChart(labels, nominalValues, realValues, contributions);
    displayTable(results);
    displaySummary(results, totalContributions, totalTaxes, inflation, initialCapital);
}

function displayChart(labels, nominalValues, realValues, contributions) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    
    if(myChart) {
        myChart.destroy();
    }
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valor Nominal (R$)',
                    data: nominalValues,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Valor Real (ajustado pela inflação)',
                    data: realValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Aportes Acumulados',
                    data: contributions,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function displayTable(results) {
    const tableBody = document.querySelector('#resultsData tbody');
    tableBody.innerHTML = '';
    
    results.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.year}</td>
            <td>${formatCurrency(item.initialValue)}</td>
            <td>${formatCurrency(item.contribution)}</td>
            <td>${formatCurrency(item.earnings)} (${item.interestRate.toFixed(2)}%)</td>
            <td>${formatCurrency(item.taxes)}</td>
            <td>${formatCurrency(item.finalValue)}</td>
            <td>${formatCurrency(item.realValue)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    document.getElementById('resultsTable').style.display = 'block';
}

function displaySummary(results, totalContributions, totalTaxes, inflation, initialCapital) {
    const lastYear = results[results.length - 1];
    const totalEarnings = lastYear.finalValue - totalContributions;
    const realFinalValue = lastYear.realValue;
    
    // Calcular CAGR (Compound Annual Growth Rate)
    const cagrNominal = calculateCAGR(initialCapital, lastYear.finalValue, results.length);
    const cagrReal = calculateCAGR(initialCapital, realFinalValue, results.length);
    
    const summaryContent = `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Valor Final Nominal:</span>
                <span class="summary-value">${formatCurrency(lastYear.finalValue)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Valor Final Real:</span>
                <span class="summary-value">${formatCurrency(realFinalValue)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total Aplicado:</span>
                <span class="summary-value">${formatCurrency(totalContributions)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total em Rendimentos:</span>
                <span class="summary-value">${formatCurrency(totalEarnings)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Total em Tributos:</span>
                <span class="summary-value">${formatCurrency(totalTaxes)}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Rentabilidade Média Anual Nominal:</span>
                <span class="summary-value">${cagrNominal.toFixed(2)}%</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Rentabilidade Média Anual Real:</span>
                <span class="summary-value">${(cagrReal - inflation * 100).toFixed(2)}%</span>
            </div>
        </div>
    `;
    
    document.getElementById('summaryContent').innerHTML = summaryContent;
    document.getElementById('summary').style.display = 'block';
}