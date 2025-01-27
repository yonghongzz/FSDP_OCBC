document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.recipient-details-form');

    form.addEventListener('submit', function (event) {
        event.preventDefault();  // Prevent default form submission

        // Get values from form fields
        const bankName = document.getElementById('bank-name').value;
        const accountNumber = document.getElementById('account-number').value;
        const fullName = document.getElementById('full-name').value;
        const country = document.getElementById('country').value;
        //const currency = document.getElementById('currency-dropdown').value;  // Add the currency field
        const currency = sessionStorage.getItem('selectedCurrency')
        const userId = 1;  // You can dynamically get this from the session or login data

        // Validate input fields
        if (bankName && accountNumber && fullName && country && currency) {
            const recipientDetails = {
                user_id: userId,
                payee_name: fullName,
                bank_name: bankName,
                country: country,
                account_number: accountNumber,
                currency: currency,
                is_pinned: false,  // Default value
            };

            sessionStorage.setItem('recipientDetails', JSON.stringify(recipientDetails));

            console.log('Sending the following data to the server:', recipientDetails);

            // Send the data to the backend
            fetch('/overseas-payees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipientDetails),
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server response:', data);
                if (data.success) {
                    window.location.href = 'overseas-register-success.html';
                } else {
                    window.location.href = 'overseas-register-success.html';
                }
            })
        } else {
            alert('Please fill out all fields');
        }
    });
});
