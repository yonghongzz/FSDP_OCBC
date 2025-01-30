document.addEventListener('DOMContentLoaded', function () {
    // Retrieving data from session storage
    const recipient = sessionStorage.getItem('selectedPayee');
    const transferAmount = parseFloat(sessionStorage.getItem('transferAmount'));
    const convertedAmount = parseFloat(sessionStorage.getItem('convertedAmount'));
    const transferCategory = sessionStorage.getItem('transferCategory');
    const accountGetId = sessionStorage.getItem('selectedAccount');
    const userID = JSON.parse(accountGetId);  // Extract user data from session storage
    const loginUserId = sessionStorage.getItem('loginUserId');
    const userid = JSON.parse(accountGetId)?.account_id; // Adjust based on actual key


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

        // Step 1: Fetch user account balance
        fetch(`/accounts/${userid}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to retrieve account details');
                }
                return response.json();
            })
            .then(accountData => {
                const currentBalance = parseFloat(accountData.balance);

                if (currentBalance < transferAmount) {
                    alert('Insufficient balance for this transfer.');
                    return;
                }

                // Step 2: Deduct the transfer amount
                const newBalance = currentBalance - transferAmount;

                // Step 3: Update the user's account balance in the backend
                return fetch(`/accounts/balance/${userid}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ balance: newBalance })
                }).then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update account balance');
                    }

                    // Step 4: Update session storage with the new balance
                    sessionStorage.setItem('updatedBalance', newBalance.toFixed(2));

                    // Prepare transaction data
                    const recipientDetails = JSON.parse(recipient);
                    const currency = recipientDetails.currency;
                    const adjustedConversionRate = convertedAmount / transferAmount;

                    const transactionData = {
                        payee_id: recipientDetails.payee_id,
                        user_id: loginUserId,
                        transaction_type: 'send',
                        amount: transferAmount,
                        currency: currency,
                        converted_amount: convertedAmount,
                        transaction_fee: 5.00,
                        transaction_date: new Date().toISOString(),
                        tags: transferCategory || 'gift',
                    };

                    // Step 5: Save the transaction to the database
                    return fetch('/overseas-transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(transactionData)
                    });
                });
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errorText => {
                        console.error('Error response:', errorText);
                        throw new Error('Failed to save transaction data');
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log('Transaction saved successfully:', data);
                window.location.href = '/overseas-transfer-success.html';
            })
            .catch(error => {
                console.error('Transaction failed:', error);
            });
    });
});
