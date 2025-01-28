// token
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

// Function to fetch recurring transfers data
async function fetchRecurringTransfers(userId) {
    try {
        if (!userId) {
            throw new Error('User is not logged in');
        }

        const response = await fetch(`/recurring-transfers/user/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch recurring transfers');
        }

        const recurringTransfers = await response.json();
        console.log('Fetched Recurring Transfers:', recurringTransfers); // Log the JSON response
        return recurringTransfers;
    } catch (error) {
        console.error('Error fetching recurring transfers:', error);
        alert('Failed to fetch recurring transfers');
        return [];
    }
}

// Function to fetch payee details (recipient's name, bank, and account number)
async function fetchPayeeDetails(payeeId) {
    try {
        const response = await fetch(`/overseas-payees/details/${payeeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Include token for authentication
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch payee details');
        }

        const payeeDetails = await response.json();
        return payeeDetails;
    } catch (error) {
        console.error('Error fetching payee details:', error);
        return {};
    }
}

// Function to display recurring transfers
async function displayRecurringTransfers() {
    const recurringTransfers = await fetchRecurringTransfers(loginUserId); // Fetch recurring transfers

    const transferContainer = document.querySelector('.recurring-transfers');
    transferContainer.innerHTML = ''; // Clear any existing transfers

    for (const transfer of recurringTransfers) {
        const { transfer_id, payee_id, amount, frequency, next_transfer_date, status } = transfer;

        // Fetch recipient details for each transfer
        const payeeDetails = await fetchPayeeDetails(payee_id);
        const recipientName = payeeDetails.payee_name || 'Unknown Payee';
        const recipientBank = payeeDetails.bank_name || 'Unknown Bank';
        const recipientAccount = payeeDetails.account_number ? `****${payeeDetails.account_number.slice(-4)}` : 'XXXX';

        // Create the recurring transfer item element
        const transferItem = document.createElement('div');
        transferItem.classList.add('transfer-item');

        // Populate with transfer details
        transferItem.innerHTML = `
            <div class="recipient-info-recurring">
                <span class="recipient-name">${recipientName}</span><br>
                <span class="recipient-bank-recurring">${recipientBank} • ${recipientAccount}</span>
            </div>
            <div class="transfer-details">
                <span class="transfer-amount">${amount || 'N/A'}</span><br>
                <span class="transfer-frequency">Frequency: ${frequency || 'N/A'}</span><br>
                <span class="next-transfer-date">Next Transfer: ${next_transfer_date || 'N/A'}</span>
            </div>
            <div class="transfer-actions">
                <button class="edit-button" data-transfer-id="${transfer_id || 'N/A'}">Edit</button>
                <button class="delete-button" data-transfer-id="${transfer_id || 'N/A'}">Delete</button>
            </div>
        `;

        // Append the transfer item to the container
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
            deleteRecurringTransfer(transferId);
        });
    });
}

// Function to handle editing a recurring transfer
function editRecurringTransfer(transferId) {
    console.log(`Editing recurring transfer ID: ${transferId}`);
    // Logic to edit the transfer, could open a form with pre-filled info or show a modal.
}

// Function to handle deleting a recurring transfer
async function deleteRecurringTransfer(transferId) {
    console.log(`Deleting recurring transfer ID: ${transferId}`);
    // Here, you could send a delete request to the server to remove the transfer
    try {
        const response = await fetch(`/recurring-transfer/${transferId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`, // Include token for authentication
            },
        });
        if (!response.ok) {
            throw new Error('Failed to delete recurring transfer');
        }
        alert('Recurring transfer deleted successfully!');
        location.reload(); // Reload page to reflect the changes
    } catch (error) {
        console.error('Error deleting recurring transfer:', error);
        alert('Error deleting recurring transfer');
    }
}

// Run the function to display recurring transfers when the page loads
document.addEventListener('DOMContentLoaded', displayRecurringTransfers);
