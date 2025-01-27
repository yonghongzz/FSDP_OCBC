// Get the recipient details from sessionStorage
const recipientDetails = JSON.parse(sessionStorage.getItem('recipientDetails'));

// Check if details exist in sessionStorage
if (recipientDetails) {
    // Populate the fields with the retrieved data
    document.getElementById('recipient-name').textContent = recipientDetails.payee_name;
    document.getElementById('bank-name').textContent = recipientDetails.bank_name;
    document.getElementById('account-number').textContent = `********${recipientDetails.account_number.slice(-4)}`;  // Show only last 4 digits of account number
    document.getElementById('country').textContent = recipientDetails.country;
} else {
    
}

document.getElementById('back-home').addEventListener('click', function () {
    event.preventDefault()
    window.location.href = 'overseas-transaction-menu.html';  // Replace with your desired page
});
