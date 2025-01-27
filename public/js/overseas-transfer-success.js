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

        // Display transfer success message
        document.getElementById('success-message').textContent = `You have successfully transferred ${transferAmount.toFixed(2)} SGD to ${recipientDetails.payee_name}.`;
        document.getElementById('recipient-names').textContent = recipientDetails.payee_name;
        document.getElementById('recipient-banks').textContent = recipientDetails.bank_name;
        document.getElementById('will-receive-text').textContent = `${recipientDetails.payee_name} receives:`;
        document.getElementById('tC').textContent = `${transferCategory || 'Not provided'}`;
        
        // Calculate the adjusted conversion rate
        if (!isNaN(convertedAmount) && !isNaN(transferAmount) && transferAmount !== 0) {
            const adjustedConversionRate = convertedAmount / transferAmount;
            document.getElementById('payee-gets').textContent = `${convertedAmount.toFixed(2)} ${currency}`;
            document.getElementById('base-to-new').textContent = `1 SGD = ${adjustedConversionRate.toFixed(2)} ${currency}`;
        } else {
            document.getElementById('base-to-new').textContent = '';
        }
    } else {
        console.log('No recipient data found');
    }

    // Back to Home button functionality
    document.getElementById('back-home').addEventListener('click', function (event) {
        event.preventDefault();  // Prevent default action if the button is inside a form or link
        window.location.href = 'overseas-transaction-menu.html';  // Replace with your desired page
    });
});
