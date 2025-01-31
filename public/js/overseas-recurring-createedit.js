document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.recurring-transfer-form');
    form.addEventListener('submit', handleFormSubmit);
});

function handleFormSubmit(event) {
    event.preventDefault();
    
    const recipientName = document.getElementById('recipient-name').value;
    const accountNumber = document.getElementById('account-number').value;
    const sourceAccount = document.getElementById('source-account').value;
    const transferAmount = document.getElementById('transfer-amount').value;
    const frequency = document.getElementById('frequency').value;
    const startDate = document.getElementById('start-date').value;
    const currency = document.getElementById('currency').value;

    const transferData = {
        id: Date.now().toString(),
        recipientName,
        accountNumber,
        sourceAccount,
        transferAmount: parseFloat(transferAmount),
        frequency,
        startDate,
        currency
    };

    // Store only the latest transfer data, replacing the previous one
    sessionStorage.setItem('recurringTransfers', JSON.stringify([transferData]));

    alert('Recurring transfer updated successfully!');

    // Redirect to the recurring transfers list page
    window.location.href = 'overseas-recurring-transfer.html';
}
