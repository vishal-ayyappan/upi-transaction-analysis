document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const csvFileInput = document.getElementById('csv-file-input');
    const uploadLabel = document.getElementById('upload-label');
    const fileNameDisplay = document.getElementById('file-name');
    const dashboard = document.getElementById('dashboard');

    // --- Chart Instance Variables ---
    let peakHoursChart = null;
    let trendsChart = null;
    
    // --- Event Listeners ---
    csvFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) handleFile(file);
    });

    const uploadArea = uploadLabel.parentElement;
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
        fileNameDisplay.textContent = `Processing file: ${file.name}...`;
        document.getElementById('loading-spinner').classList.remove('hidden');
        dashboard.classList.remove('hidden');
        sendDataToBackend(file);
    }

    function sendDataToBackend(file) {
        const formData = new FormData();
        formData.append('file', file);

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
        //
        .then(data => {
            console.log('Success:', data);
            fileNameDisplay.textContent = `Showing analysis for: ${file.name}`;
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message}. Please check the console.`);
            fileNameDisplay.textContent = `Failed to process: ${file.name}`;
        })
        .finally(() => {
            // Hide the spinner regardless of success or failure
            document.getElementById('loading-spinner').classList.add('hidden');
        });
    }

    function updateDashboard(data) {
        // Update KPIs
        document.getElementById('total-revenue').textContent = `₹${data.total_revenue.toFixed(2)}`;
        document.getElementById('total-transactions').textContent = data.total_transactions;
        document.getElementById('avg-transaction-value').textContent = `₹${data.avg_transaction_value.toFixed(2)}`;

        // Update Top Customers Table
        const tableBody = document.getElementById('top-customers-table');
        tableBody.innerHTML = ''; // Clear existing rows
        data.top_customers.forEach(customer => {
            const row = tableBody.insertRow();
            row.className = 'border-b';
            row.innerHTML = `
                <td class="py-2 px-1">${customer.customer}</td>
                <td class="py-2 px-1">₹${customer.total_spent.toFixed(2)}</td>
                <td class="py-2 px-1 text-center">${customer.visits}</td>
            `;
        });

        // --- Chart Updates ---
        // Destroy existing charts before creating new ones
        if (peakHoursChart) {
            peakHoursChart.destroy();
        }
        if (trendsChart) {
            trendsChart.destroy();
        }

        // Create Peak Hours Bar Chart
        const peakHoursCtx = document.getElementById('peak-hours-chart').getContext('2d');
        peakHoursChart = new Chart(peakHoursCtx, {
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
        const trendsCtx = document.getElementById('trends-line-chart').getContext('2d');
        trendsChart = new Chart(trendsCtx, {
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
        const summarySection = document.getElementById('summary-section');
        const summaryText = document.getElementById('cleaning-summary-text');
        if (data.cleaning_summary) {
            summaryText.innerHTML = `
                <strong>Initial Records:</strong> ${data.cleaning_summary.initial_records} <br>
                <strong>Final Records:</strong> ${data.cleaning_summary.final_records} <br>
                <strong>Records Removed:</strong> ${data.cleaning_summary.records_removed}
            `;
            summarySection.classList.remove('hidden');
        } else {
            summarySection.classList.add('hidden');
        }
    }
});