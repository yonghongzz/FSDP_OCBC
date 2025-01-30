// overseas transaction routes
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

// Function to delete a cookie
function deleteCookie(cname) {
    document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// Function to refresh the authentication token
async function refreshToken(rToken) {
    try {
        const response = await fetch('/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${rToken}`
            }
        });
        if (!response.ok) {
            throw new Error(await response.text());
        }

        const result = await response.json();
        const token = result.token;
        const decodedToken = parseJwt(token);
        const loginUserId = decodedToken.user_id;

        sessionStorage.setItem('token', token);
        sessionStorage.setItem('loginUserId', loginUserId);

        location.reload();
    } catch {
        alert('Login timed out.');
        sessionStorage.clear();
        deleteCookie('rToken');
        location.reload();
    }
}

// Function to parse JWT token
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT token:', error);
        return null;
    }
}

// Function to fetch recent transfers data
async function fetchRecentTransfers(userId) {
    try {
        if (!userId) {
            throw new Error('User is not logged in');
        }

        const response = await fetch(`/overseas-transactions/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recent transfers');
        }

        const transfers = await response.json();
        console.log('Fetched Recent Transfers:', transfers);
        return transfers;
    } catch (error) {
        console.error('Error fetching recent transfers:', error);
        return [];
    }
}

// Function to fetch payee details (recipient's name, bank, and account number)
async function fetchPayeeDetails(payeeId) {
    try {
        const response = await fetch(`/overseas-payees/details/${payeeId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch payee details');
        }

        const payeeDetails = await response.json();
        console.log('Fetched payee details:', payeeDetails);
        return payeeDetails;
    } catch (error) {
        console.error('Error fetching payee details:', error);
        return null;
    }
}

// Function to handle repeating a transfer
function repeatTransfer(transfer, payeeDetails) {
    console.log('Transfer data:', transfer);
    console.log('Payee details:', payeeDetails);

    const transferData = {
        payee_id: transfer.payee_id,
        payee_name: payeeDetails ? payeeDetails.payee_name : 'Unknown Payee',
        bank_name: payeeDetails ? payeeDetails.bank_name : 'Unknown Bank',
        account_number: payeeDetails && payeeDetails.account_number ? payeeDetails.account_number : 'XXXX',
        currency: transfer.currency
    };

    // Store the data in sessionStorage
    sessionStorage.setItem('selectedPayee', JSON.stringify(transferData));
    sessionStorage.setItem('transferAmount', transfer.amount);
    sessionStorage.setItem('convertedAmount', transfer.converted_amount);
    sessionStorage.setItem('transferCategory', transfer.tags || '');

    console.log('Stored in sessionStorage:', transferData);

    // Redirect to the overseas repeat review page
    window.location.href = '/overseas-repeat-review.html';
}

// Function to display recent transfers
async function displayRecentTransfers() {
    const transfers = await fetchRecentTransfers(loginUserId);

    const transferContainer = document.querySelector('.recent-transfers');
    transferContainer.innerHTML = '';

    for (const transfer of transfers) {
        const { transaction_id, payee_id, amount, converted_amount, currency, transaction_fee, transaction_datetime, tags } = transfer;

        const payeeDetails = await fetchPayeeDetails(payee_id);
        
        console.log('PayeeDetails for transfer:', transaction_id, payeeDetails);

        const recipientName = payeeDetails?.payee_name ?? 'Unknown Payee';
        const recipientBank = payeeDetails?.bank_name ?? 'Unknown Bank';
        const recipientAccount = payeeDetails?.account_number 
            ? `****${payeeDetails.account_number.slice(-4)}` 
            : 'XXXX';

        const transferItem = document.createElement('div');
        transferItem.classList.add('transfer-item');

        transferItem.innerHTML = `
            <div class="recipient-info-recent">
                <span class="recipient-name">${recipientName}</span><br>
                <span class="recipient-bank-recent">${recipientBank} • ${recipientAccount}</span>
            </div>
            <div class="transfer-details">
                <span class="transfer-amount">${amount || 'N/A'} → ${converted_amount || 'N/A'} ${currency || 'N/A'}</span><br>
                <span class="exchange-rate">Fee: ${transaction_fee || 'N/A'}</span><br>
                <span class="transfer-date">${transaction_datetime ? new Date(transaction_datetime).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="transfer-status">
                <span class="status completed">Completed</span>
            </div>
            <div class="transfer-actions">
                <button class="details-button" data-transfer-id="${transaction_id || 'N/A'}">View Details</button>
                <button class="repeat-button" data-transfer-id="${transaction_id || 'N/A'}">Repeat Transfer</button>
            </div>
        `;

        transferContainer.appendChild(transferItem);

        const detailsButton = transferItem.querySelector('.details-button');
        const repeatButton = transferItem.querySelector('.repeat-button');

        detailsButton.addEventListener('click', () => viewTransferDetails(transaction_id));
        repeatButton.addEventListener('click', () => repeatTransfer(transfer, payeeDetails));
    }
}

// Function to handle view transfer details
function viewTransferDetails(transferId) {
    console.log(`Viewing details for transfer ID: ${transferId}`);
    // Implement view details functionality here
}

// Run the function to display recent transfers when the page loads
document.addEventListener('DOMContentLoaded', displayRecentTransfers);
