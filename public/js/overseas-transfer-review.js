document.addEventListener('DOMContentLoaded', function () {
    // Retrieving data from session storage
    const recipient = sessionStorage.getItem('selectedPayee');
    const transferAmount = parseFloat(sessionStorage.getItem('transferAmount'));
    const convertedAmount = parseFloat(sessionStorage.getItem('convertedAmount'));
    const transferCategory = sessionStorage.getItem('transferCategory');
    const accountGetId = sessionStorage.getItem('selectedAccount');
    const userID = JSON.parse(accountGetId);  // Extract user data from session storage

    // Check if recipient data exists
    if (recipient) {
        const recipientDetails = JSON.parse(recipient);
        const currency = recipientDetails.currency;  // Currency of the recipient

        // Populate the recipient's name and bank
        document.getElementById('recipient-name').textContent = recipientDetails.payee_name;
        document.getElementById('recipient-bank').textContent = recipientDetails.bank_name;
        document.getElementById('will-receive-text').textContent = `${recipientDetails.payee_name} will receive:`;

        // Calculate the adjusted conversion rate
        if (!isNaN(convertedAmount) && !isNaN(transferAmount) && transferAmount !== 0) {
            const adjustedConversionRate = convertedAmount / transferAmount;
            document.getElementById('payee-gets').textContent = `${convertedAmount.toFixed(2)} ${currency}`;
            document.getElementById('base-to-new').textContent = `1 SGD = ${adjustedConversionRate.toFixed(2)} ${currency}`;
        } else {
            document.getElementById('payee-gets').textContent = 'Invalid amount or rate';
            document.getElementById('base-to-new').textContent = '';
        }

        document.getElementById('tC').textContent = `${transferCategory || 'Not provided'}`;
    } else {
        console.log('No recipient data found');
    }

    // Handle the Confirm button click
    document.querySelector('.next-button').addEventListener('click', function () {
        if (!recipient) {
            console.log('No recipient data found!');
            return;
        }

        // Prepare transaction data
        const recipientDetails = JSON.parse(recipient);
        const currency = recipientDetails.currency;
        const adjustedConversionRate = convertedAmount / transferAmount;

        const transactionData = {
            payee_id: recipientDetails.payee_id,  // The recipient's ID
            account_id: userID.account_id,  // Only the account ID, not the whole object
            transaction_type: 'send',  // Assuming 'send' as the transaction type
            amount: transferAmount,
            currency: currency,
            converted_amount: convertedAmount,
            transaction_fee: 5.00,  // Example fee
            transaction_date: new Date().toISOString(),  // Current date-time in ISO format
            tags: transferCategory || 'gift',  // Default to 'gift' if no category is selected
        };

        // Send the transaction data to the backend API
        fetch('/overseas-transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData) // Send the transaction data as JSON
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(errorText => {
                    console.error('Error response:', errorText);
                    throw new Error('Failed to save transaction data');
                });
            }
            return response.json();  // Parse as JSON if response is valid
        })
        .then(data => {
            console.log('Transaction data saved successfully:', data);
            // Redirect to another page after success
            window.location.href = '/overseas-transfer-success.html';  // Adjust URL as needed
        })
        .catch(error => {
            console.error('Error saving transaction data:', error);
        });
    });
});
