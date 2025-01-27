document.addEventListener('DOMContentLoaded', function() {
    // Retrieve the stored category from sessionStorage when the page loads
    const storedCategory = sessionStorage.getItem('transferCategory');

    if (storedCategory) {
        // If a category is found in sessionStorage, set it as the selected value in the dropdown
        document.getElementById('currency-dropdown').value = storedCategory;
    }

    // Handle the Next Button click event
    document.querySelector('.next-button').addEventListener('click', function() {
        // Get the selected value from the dropdown
        const selectedCategory = document.getElementById('currency-dropdown').value;

        // Store the selected category in sessionStorage
        sessionStorage.setItem('transferCategory', selectedCategory);

        // Proceed to the next page
        window.location.href = "overseas-transfer-review.html"; // Replace with the actual next page URL
    });
});
