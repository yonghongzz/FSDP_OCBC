// script.js
document.addEventListener('DOMContentLoaded', () => {
    const monthDropdown = document.getElementById('month-dropdown');
    const chartCanvas = document.getElementById('breakdown-chart');
    const detailsTableBody = document.querySelector('#details-table tbody');
  
    const data = {
      "2025-01": {
        categories: ["Gift", "Business", "Education", "Charity"],
        amounts: [200, 150, 100, 300]
      },
      "2025-02": {
        categories: ["Gift", "Business", "Education"],
        amounts: [180, 200, 120]
      },
      // Add more months dynamically
    };
  
    const renderChart = (categories, amounts) => {
      const total = amounts.reduce((acc, val) => acc + val, 0);
      const percentages = amounts.map(amount => ((amount / total) * 100).toFixed(2));
  
      // Populate details table
      detailsTableBody.innerHTML = '';
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
  
      // Render Pie Chart
      new Chart(chartCanvas, {
        type: 'pie',
        data: {
          labels: categories,
          datasets: [{
            data: amounts,
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
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
  
    // Initial render for the first month
    const firstMonth = monthDropdown.value;
    renderChart(data[firstMonth].categories, data[firstMonth].amounts);
  
    // Update chart on dropdown change
    monthDropdown.addEventListener('change', (e) => {
      const selectedMonth = e.target.value;
      const { categories, amounts } = data[selectedMonth];
      renderChart(categories, amounts);
    });
  });
  