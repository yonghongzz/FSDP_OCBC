document.addEventListener('DOMContentLoaded', () => {
  const monthDropdown = document.getElementById('month-dropdown');
  const chartCanvas = document.getElementById('breakdown-chart');
  const detailsTableBody = document.querySelector('#details-table tbody');
  let chartInstance = null; // This will hold the chart instance for later destruction

  // Fetch transactions for the selected month
  const fetchTransactionsForMonth = async (month) => {
      const userId = 1;  // Replace with dynamic user ID if necessary
      try {
          const response = await fetch(`/overseas-transactions/${userId}/month/${month}`);
          const transactions = await response.json();
          processTransactions(transactions);
      } catch (error) {
          console.error('Error fetching transactions:', error);
      }
  };

  // Process fetched transactions to calculate totals by category
  const processTransactions = (transactions) => {
      const categories = {};
      transactions.forEach(transaction => {
          const tag = transaction.tags || 'Other';  // Default to 'Other' if no tags are provided
          if (!categories[tag]) categories[tag] = 0;
          categories[tag] += transaction.amount;
      });

      const categoryLabels = Object.keys(categories);
      const categoryAmounts = Object.values(categories);

      renderChart(categoryLabels, categoryAmounts);
      updateTable(categoryLabels, categoryAmounts);
  };

  // Render Pie Chart
  const renderChart = (categories, amounts) => {
      const total = amounts.reduce((acc, val) => acc + val, 0);
      const percentages = amounts.map(amount => ((amount / total) * 100).toFixed(2));

      // Destroy the previous chart if it exists
      if (chartInstance) {
          chartInstance.destroy();
      }

      // Render Pie Chart using Chart.js
      chartInstance = new Chart(chartCanvas, {
          type: 'pie',
          data: {
              labels: categories,
              datasets: [{
                  data: amounts,
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40', '#9966FF']
              }]
          },
          options: {
              responsive: true,
              plugins: {
                  legend: {
                      position: 'top'
                  }
              }
          }
      });
  };

  // Update the table with category totals and percentages
  const updateTable = (categories, amounts) => {
      const total = amounts.reduce((acc, val) => acc + val, 0);
      const percentages = amounts.map(amount => ((amount / total) * 100).toFixed(2));

      // Populate details table with categories, amounts, and percentages
      detailsTableBody.innerHTML = '';  // Clear any existing rows
      categories.forEach((category, index) => {
          const row = `
              <tr>
                  <td>${category}</td>
                  <td>${amounts[index].toFixed(2)}</td>
                  <td>${percentages[index]}%</td>
              </tr>
          `;
          detailsTableBody.innerHTML += row;
      });
  };

  // Initial render for the first month selected in the dropdown
  const firstMonth = monthDropdown.value;
  fetchTransactionsForMonth(firstMonth);

  // Update chart and table when dropdown value changes
  monthDropdown.addEventListener('change', (e) => {
      const selectedMonth = e.target.value;
      fetchTransactionsForMonth(selectedMonth);
  });
});
