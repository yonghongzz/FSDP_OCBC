// Token and user information
const token = sessionStorage.getItem('token');
const loginUserId = sessionStorage.getItem('loginUserId');
const rToken = getCookie('rToken'); // refresh token

// Function to get a cookie by name
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Function to check if token is expired
function isTokenExpired(token) {
    if (!token) return true;
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    const exp = payload.exp;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    return currentTimestamp > exp;
}

// Function to refresh token
async function refreshToken() {
    try {
        const response = await fetch('/refresh-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${rToken}`
            }
        });
        if (!response.ok) throw new Error('Failed to refresh token');
        const data = await response.json();
        sessionStorage.setItem('token', data.token);
        return data.token;
    } catch (error) {
        console.error('Error refreshing token:', error);
        window.location.href = '/login.html';
    }
}

// Function to fetch with token refresh
async function fetchWithToken(url, options = {}) {
    if (isTokenExpired(token)) {
        const newToken = await refreshToken();
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`
        };
    } else {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return fetch(url, options);
}

// Function to fetch recurring transfers data from database
async function fetchRecurringTransfers(userId) {
    try {
        if (!userId) throw new Error('User is not logged in');
        const response = await fetchWithToken(`/recurring-transfers/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch recurring transfers');
        const recurringTransfers = await response.json();
        console.log('Fetched Recurring Transfers:', recurringTransfers);
        return recurringTransfers;
    } catch (error) {
        console.error('Error fetching recurring transfers:', error);
        alert('Failed to fetch recurring transfers');
        return [];
    }
}

// Function to fetch payee details
async function fetchPayeeDetails(payeeId) {
    try {
        const response = await fetchWithToken(`/overseas-payees/details/${payeeId}`);
        if (!response.ok) throw new Error('Failed to fetch payee details');
        return await response.json();
    } catch (error) {
        console.error('Error fetching payee details:', error);
        return {};
    }
}

// Function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

// Function to display recurring transfers
async function displayRecurringTransfers() {
    const transferContainer = document.querySelector('.recurring-transfers');
    transferContainer.innerHTML = '';

    // Display transfers from the database
    const dbTransfers = await fetchRecurringTransfers(loginUserId);
    for (const transfer of dbTransfers) {
        const { transfer_id, payee_id, amount, frequency, next_transfer_date, status } = transfer;
        const payeeDetails = await fetchPayeeDetails(payee_id);
        const recipientName = payeeDetails.payee_name || 'Unknown Payee';
        const recipientBank = payeeDetails.bank_name || 'Unknown Bank';
        const recipientAccount = payeeDetails.account_number ? `****${payeeDetails.account_number.slice(-4)}` : 'XXXX';

        const transferItem = document.createElement('div');
        transferItem.classList.add('transfer-item');
        transferItem.innerHTML = `
            <div class="recipient-info-recurring">
                <span class="recipient-name">${recipientName}</span><br>
                <span class="recipient-bank-recurring">${recipientBank} • ${recipientAccount}</span>
            </div>
            <div class="transfer-details">
                <span class="transfer-amount">${amount || 'N/A'}</span><br>
                <span class="transfer-frequency">Frequency: ${frequency || 'N/A'}</span><br>
                <span class="next-transfer-date">Next Transfer: ${formatDate(next_transfer_date) || 'N/A'}</span>
            </div>
            <div class="transfer-actions">
                <button class="edit-button" data-transfer-id="${transfer_id || 'N/A'}">Edit</button>
                <button class="delete-button" data-transfer-id="${transfer_id || 'N/A'}">Delete</button>
            </div>
        `;
        transferContainer.appendChild(transferItem);
    }

    // Display transfers from session storage
    const sessionTransfers = JSON.parse(sessionStorage.getItem('recurringTransfers')) || [];
    for (const transfer of sessionTransfers) {
        const transferItem = document.createElement('div');
        transferItem.classList.add('transfer-item');
        transferItem.innerHTML = `
            <div class="recipient-info-recurring">
                <span class="recipient-name">${transfer.recipientName}</span><br>
                <span class="recipient-bank-recurring">${transfer.sourceAccount} • ****${transfer.accountNumber.slice(-4)}</span>
            </div>
            <div class="transfer-details">
                <span class="transfer-amount">${transfer.currency}</span><br>
                <span class="transfer-frequency">Frequency: ${transfer.frequency}</span><br>
                <span class="next-transfer-date">Next Transfer: ${formatDate(transfer.startDate)}</span>
            </div>
            <div class="transfer-actions">
                <button class="edit-button" data-transfer-id="${transfer.id}">Edit</button>
                <button class="delete-button" data-transfer-id="${transfer.id}">Delete</button>
            </div>
        `;
        transferContainer.appendChild(transferItem);
    }

    // Add event listeners for the buttons
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const transferId = e.target.getAttribute('data-transfer-id');
            editRecurringTransfer(transferId);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const transferId = e.target.getAttribute('data-transfer-id');
            if (confirm('Are you sure you want to delete this recurring transfer?')) {
                deleteRecurringTransfer(transferId);
            }
        });
    });
}

// Function to handle editing a recurring transfer
function editRecurringTransfer(transferId) {
    console.log(`Editing recurring transfer ID: ${transferId}`);
    // Check if it's a session storage transfer
    const sessionTransfers = JSON.parse(sessionStorage.getItem('recurringTransfers')) || [];
    const sessionTransfer = sessionTransfers.find(t => t.id === transferId);
    if (sessionTransfer) {
        // It's a session storage transfer, handle editing locally
        window.location.href = `/overseas-recurring-createedit.html?id=${transferId}&source=session`;
    } else {
        // It's a database transfer, use the existing logic
        window.location.href = `/overseas-recurring-createedit.html?id=${transferId}`;
    }
}

// Function to handle deleting a recurring transfer
async function deleteRecurringTransfer(transferId) {
    // Check if it's a session storage transfer
    const sessionTransfers = JSON.parse(sessionStorage.getItem('recurringTransfers')) || [];
    const sessionTransferIndex = sessionTransfers.findIndex(t => t.id === transferId);
    if (sessionTransferIndex !== -1) {
        // It's a session storage transfer, delete locally
        sessionTransfers.splice(sessionTransferIndex, 1);
        sessionStorage.setItem('recurringTransfers', JSON.stringify(sessionTransfers));
        alert('Recurring transfer deleted successfully!');
        displayRecurringTransfers(); // Refresh the display
    } else {
        // It's a database transfer, use the existing logic
        try {
            const response = await fetchWithToken(`/recurring-transfer/${transferId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete recurring transfer');
            alert('Recurring transfer deleted successfully!');
            displayRecurringTransfers(); // Refresh the display
        } catch (error) {
            console.error('Error deleting recurring transfer:', error);
            alert('Error deleting recurring transfer');
        }
    }
}

// Run the function to display recurring transfers when the page loads
document.addEventListener('DOMContentLoaded', displayRecurringTransfers);
