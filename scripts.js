document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const transactionFileInput = document.getElementById('transaction-file-input');
    const fileUploadLabel = document.getElementById('file-upload-label');
    const fileStatusDisplay = document.getElementById('file-status-display');
    const dashboard = document.getElementById('dashboard');
    const filterStartDateInput = document.getElementById('filter-start-date');
    const filterEndDateInput = document.getElementById('filter-end-date');
    const applyDateFiltersBtn = document.getElementById('apply-date-filters');

    // --- Chart Instance Variables ---
    let peakBusinessHoursChart = null;
    let transactionTrendsChart = null;
    
    // --- Event Listeners ---
    transactionFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) handleFile(file);
    });

    applyDateFiltersBtn.addEventListener('click', () => {
        sendDataToBackend(null, filterStartDateInput.value, filterEndDateInput.value);
    });

    const uploadArea = fileUploadLabel.parentElement;
    uploadArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadArea.classList.add('border-indigo-600', 'bg-indigo-50');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-indigo-600', 'bg-indigo-50');
    });
    uploadArea.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadArea.classList.remove('border-indigo-600', 'bg-indigo-50');
        const file = event.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    // --- Core Functions ---
    function handleFile(file) {
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a valid CSV file.');
            return;
        }
        fileStatusDisplay.textContent = `Processing file: ${file.name}...`;
        document.getElementById('analysis-loading-spinner').classList.remove('hidden');
        dashboard.classList.remove('hidden');
        sendDataToBackend(file);
    }

    function sendDataToBackend(file = null, startDate = '', endDate = '') {
        const formData = new FormData();
        if (file) {
            formData.append('file', file);
        }
        if (startDate) {
            formData.append('start_date', startDate);
        }
        if (endDate) {
            formData.append('end_date', endDate);
        }

        fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
             if (!response.ok) {
                // Handle server-side errors (like 400 or 500)
                return response.json().then(err => { throw new Error(err.error) });
             }
             return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            if (file) {
                fileStatusDisplay.textContent = `Showing analysis for: ${file.name}`;
            } else {
                fileStatusDisplay.textContent = `Showing filtered data`;
            }
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error:', error);
            if (file) {
                alert(`An error occurred: ${error.message}. Please check the console.`);
                fileStatusDisplay.textContent = `Failed to process: ${file.name}`;
            } else {
                // For filtering errors (only for file upload), show alert
                alert(`An error occurred: ${error.message}. Please check the console.`);
            }
        })
        .finally(() => {
            // Hide the spinner regardless of success or failure
            document.getElementById('analysis-loading-spinner').classList.add('hidden');
        });
    }

    function updateDashboard(data) {
        // Update KPIs
        document.getElementById('total-revenue').textContent = `₹${data.total_revenue.toFixed(2)}`;
        document.getElementById('total-transactions').textContent = data.total_transactions;
        document.getElementById('avg-transaction-value').textContent = `₹${data.avg_transaction_value.toFixed(2)}`;

        // Set date range if not already set
        if (data.trends.labels.length > 0 && !filterStartDateInput.value) {
            const dates = data.trends.labels.map(d => new Date(d));
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            filterStartDateInput.value = minDate.toISOString().split('T')[0];
            filterEndDateInput.value = maxDate.toISOString().split('T')[0];
        }

        // Update Top Customers Table
        const tableBody = document.getElementById('top-customers-table');
        tableBody.innerHTML = ''; // Clear existing rows
        data.top_customers.forEach(customer => {
            const row = tableBody.insertRow();
            row.className = 'table-body';
            row.innerHTML = `
                <td class="table-cell">${customer.customer}</td>
                <td class="table-cell">₹${customer.total_spent.toFixed(2)}</td>
                <td class="table-cell table-cell-center">${customer.visits}</td>
            `;
        });

        // --- Chart Updates ---
        // Destroy existing charts before creating new ones
        if (peakBusinessHoursChart) {
            peakBusinessHoursChart.destroy();
        }
        if (transactionTrendsChart) {
            transactionTrendsChart.destroy();
        }

        // Create Peak Business Hours Bar Chart
        const peakBusinessHoursCtx = document.getElementById('peak-business-hours-chart').getContext('2d');
        peakBusinessHoursChart = new Chart(peakBusinessHoursCtx, {
            type: 'bar',
            data: {
                labels: data.peak_hours.labels,
                datasets: [{
                    label: 'Number of Transactions',
                    data: data.peak_hours.data,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });

        // Create Transaction Trends Line Chart
        const transactionTrendsCtx = document.getElementById('transaction-trends-chart').getContext('2d');
        transactionTrendsChart = new Chart(transactionTrendsCtx, {
            type: 'line',
            data: {
                labels: data.trends.labels,
                datasets: [{
                    label: 'Daily Revenue (₹)',
                    data: data.trends.data,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });

        // Update Cleaning Summary
        const dataCleaningSummarySection = document.getElementById('data-cleaning-summary-section');
        const dataCleaningSummaryContent = document.getElementById('data-cleaning-summary-content');
        if (data.cleaning_summary) {
            dataCleaningSummaryContent.innerHTML = `
                <strong>Initial Records:</strong> ${data.cleaning_summary.initial_records} <br>
                <strong>Final Records:</strong> ${data.cleaning_summary.final_records} <br>
                <strong>Records Removed:</strong> ${data.cleaning_summary.records_removed}
            `;
            dataCleaningSummarySection.classList.remove('hidden');
        } else {
            dataCleaningSummarySection.classList.add('hidden');
        }
    }
});