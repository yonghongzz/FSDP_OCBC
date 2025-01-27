document.addEventListener('DOMContentLoaded', function() {

    // Retrieving data from session storage
    const recipient = sessionStorage.getItem('selectedPayee');

    // Check if there's data
    if (recipient) {
        const recipientDetails = JSON.parse(recipient);

        // Now you can access the properties
        console.log(recipientDetails.payee_name);  // "John Doe"
        console.log(recipientDetails.bank_name);  // "XYZ Bank"
        // Populate the recipient's name and bank
        document.getElementById('recipient-name').textContent = recipientDetails.payee_name;
        document.getElementById('recipient-bank').textContent = recipientDetails.bank_name;
        document.getElementById('will-receive-text').textContent = `${recipientDetails.payee_name} will receive:`;
    } else {
        console.log('No recipient data found');
    }

    const account = sessionStorage.getItem('selectedAccount');

    if (account) {
        const selectedAccount = JSON.parse(account);
        console.log(selectedAccount.balance);
    }

    const currency = sessionStorage.getItem('selectedPayee');
    const curr = JSON.parse(currency);
    const c = curr.currency;
    console.log(c);

    // Handle the Refresh Button click event
    document.querySelector('.refresh-button').addEventListener('click', async function() {
        // Get the amount entered by the user
        const transferAmount = parseFloat(document.getElementById('transfer-amount').value);

        // Retrieve account data from session storage
        const account = sessionStorage.getItem('selectedAccount');
        if (!account) {
            alert('No account data found');
            return;
        }
        const selectedAccount = JSON.parse(account);

        // Get the balance
        const userBalance = parseFloat(selectedAccount.balance);

        // Validate the transfer amount
        if (isNaN(transferAmount) || transferAmount <= 0) {
            alert("Please enter a valid amount greater than 0.");

            // Clear session storage if invalid value
            sessionStorage.setItem('transferAmount', '0');
            sessionStorage.setItem('convertedAmount', '0');

            // Clear the UI as well
            document.getElementById('transfer-amount').value = '';
            document.getElementById('payee-gets').textContent = '';
            document.getElementById('base-to-new').textContent = '';

            return;
        }

        // Check if the entered amount is greater than the balance
        if (transferAmount > userBalance) {
            alert("You don't have enough funds to complete this transfer.");

            // Clear the input and any displayed results if the transfer amount is invalid
            document.getElementById('transfer-amount').value = '';
            document.getElementById('payee-gets').textContent = '';
            document.getElementById('base-to-new').textContent = '';

            return; // Stop further execution if not enough balance
        }

        // If balance is sufficient, proceed with currency conversion
        const conversionRate = await getCurrencyConversionRate('SGD', c);
        if (conversionRate) {
            // Calculate the converted amount
            const convertedAmount = transferAmount * conversionRate;

            // Ensure convertedAmount is a valid number before applying .toFixed(2)
            if (isNaN(convertedAmount)) {
                alert("Invalid conversion result. Please try again.");
                return;
            }

            // Update the UI with the new converted amount (formatted to 2 decimal places)
            document.getElementById('payee-gets').textContent = `${convertedAmount.toFixed(2)} ${c}`;
            document.getElementById('base-to-new').textContent = `1 SGD = ${conversionRate.toFixed(2)} ${c}`;

            // Update the sessionStorage with the latest transfer amount and converted amount
            sessionStorage.setItem('transferAmount', transferAmount);
            sessionStorage.setItem('convertedAmount', convertedAmount);
        } else {
            alert("Error fetching exchange rate data. Please try again.");
        }
    });

    // Handle the Next Button click event
    document.querySelector('.next-button').addEventListener('click', function() {
        // Check if the user has entered a valid amount and completed the transfer details
        const transferAmount = parseFloat(document.getElementById('transfer-amount').value);
        const account = sessionStorage.getItem('selectedAccount');
        const selectedAccount = JSON.parse(account);
        const userBalance = parseFloat(selectedAccount.balance);

        if (transferAmount > userBalance) {
            // Alert the user if they attempt to proceed with an invalid amount
            alert("You cannot proceed with an amount higher than your available balance.");
            return; // Don't allow the user to proceed to the next page
        }

        // If everything is valid, go to the next page
        window.location.href = "overseas-transfer-category.html"; // Replace with the actual next page URL
    });

    // Retrieve stored values from session storage when the page loads
    const storedTransferAmount = sessionStorage.getItem('transferAmount');
    const storedConvertedAmount = sessionStorage.getItem('convertedAmount');
    
    // Only populate if the stored values are not '0' (indicating an invalid value was stored)
    if (storedTransferAmount && storedTransferAmount !== '0' && storedConvertedAmount && storedConvertedAmount !== '0') {
        // Populate the fields with the stored values
        document.getElementById('transfer-amount').value = storedTransferAmount;
        document.getElementById('payee-gets').textContent = `${storedConvertedAmount} ${c}`;
        document.getElementById('base-to-new').textContent = `1 SGD = ${(storedConvertedAmount / storedTransferAmount).toFixed(2)} ${c}`;
    } else {
        // Clear the input fields and results if no valid session data exists
        document.getElementById('transfer-amount').value = '';
        document.getElementById('payee-gets').textContent = '';
        document.getElementById('base-to-new').textContent = '';
    }

});

// Function to fetch the exchange rate between two currencies
async function getCurrencyConversionRate(fromCurrency, toCurrency) {
    const apiKey = '88003b992f3b4189a74632ecd0100455'; // Replace with your actual API key
    const url = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${apiKey}&symbols=${fromCurrency},${toCurrency}`;

    try {
        // Make the API request
        const response = await fetch(url);
        const data = await response.json();

        // Check if the response contains the required rates
        if (data && data.rates) {
            const rateFrom = data.rates[fromCurrency];
            const rateTo = data.rates[toCurrency];

            // Convert the exchange rate and return it
            if (rateFrom && rateTo) {
                const conversionRate = rateTo / rateFrom;  // MYR per SGD conversion rate
                return conversionRate;
            } else {
                throw new Error('Exchange rate data is missing.');
            }
        } else {
            throw new Error('Error fetching exchange rate data.');
        }
    } catch (error) {
        console.error('Error fetching conversion rate:', error);
        return null; // Return null if something went wrong
    }
}
