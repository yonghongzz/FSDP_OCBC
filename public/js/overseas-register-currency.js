document.getElementById('next-button').addEventListener('click', function() {
    const selectedCurrency = document.getElementById('currency-dropdown').value;

    // Save the selected currency to sessionStorage
    sessionStorage.setItem('selectedCurrency', selectedCurrency);

    // Optionally log to the console to verify
    console.log('Selected Currency:', selectedCurrency);

    // Redirect to the next page
    window.location.href = 'overseas-register-details.html';  // Replace with the next page URL
});
