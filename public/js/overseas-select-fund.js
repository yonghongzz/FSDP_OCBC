// Assuming you have authentication tokens already set up
const token = sessionStorage.getItem('token');
const loginUserId = sessionStorage.getItem('loginUserId');

// Fetch accounts for the logged-in user
async function fetchAllAccounts() {
    try {
        const response = await fetch('/accounts', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch accounts');
        }

        const accounts = await response.json();
        console.log(accounts);

        // Filter accounts for the logged-in user
        return accounts.filter(account => String(account.user_id) === String(loginUserId));
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return [];
    }
}

// Display the accounts on the page
function displayUserAccounts(accounts) {
    const recipientContainer = document.getElementById('recipient-container');
    recipientContainer.innerHTML = '';  // Clear any previous content

    if (accounts.length === 0) {
        recipientContainer.innerHTML = '<p>No accounts found. Please add an account.</p>';
        return;
    }

    accounts.forEach(account => {
        const recipientBox = document.createElement('div');
        recipientBox.classList.add('recipient-box');

        recipientBox.innerHTML = `
            <div class="recipient-left">
                <img src="path/to/bank-icon.png" alt="Bank Icon" class="recipient-pfp" />
                <div class="recipient-info">
                    <p class="recipient-name">${account.account_type}</p>
                    <p class="recipient-bank">**** **** **** ${account.account_number.slice(-4)}</p>
                </div>
            </div>
            <div class="recipient-right">
                <p class="recipient-bank">$${account.balance.toFixed(2)}</p>
            </div>
        `;

        // Add click event to select the account
        recipientBox.addEventListener('click', () => {
            // Remove selection from all accounts
            document.querySelectorAll('.recipient-box').forEach(box => {
                box.classList.remove('selected');
                // Reset inline styles
                box.style.boxShadow = 'none';
            });

            // Add selection to clicked account
            recipientBox.classList.add('selected');

            // Apply glow effect inline style
            recipientBox.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.8)'; // Blue glow effect

            // Store selected account in sessionStorage
            sessionStorage.setItem('selectedAccount', JSON.stringify(account));
        });

        recipientContainer.appendChild(recipientBox);
    });
}

// Function to apply the selected account from sessionStorage
function applySelectedAccount() {
    const selectedAccount = JSON.parse(sessionStorage.getItem('selectedAccount'));
    if (selectedAccount) {
        // Find the recipient box that corresponds to the selected account
        const recipientBoxes = document.querySelectorAll('.recipient-box');
        recipientBoxes.forEach(box => {
            const accountName = box.querySelector('.recipient-name').textContent;
            const accountNumber = box.querySelector('.recipient-bank').textContent;

            // Compare account name or account number (last 4 digits) to identify the correct account
            if (accountName === selectedAccount.account_type || 
                accountNumber.includes(selectedAccount.account_number.slice(-4))) {
                box.classList.add('selected');
                // Apply the glow effect to the selected box
                box.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.8)'; // Blue glow effect
            }
        });
    }
}

// Initialize page once DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const accounts = await fetchAllAccounts();

        if (accounts.length > 0) {
            displayUserAccounts(accounts);
            applySelectedAccount();  // Apply the selected account from sessionStorage
        } else {
            // Handle case where no accounts are available
            const recipientContainer = document.getElementById('recipient-container');
            recipientContainer.innerHTML = '<p>No accounts found. Please add an account.</p>';
        }
    } catch (error) {
        console.error('Error initializing accounts page:', error);
    }
});

// Next button handler (e.g., for transferring funds)
document.getElementById('next-button').addEventListener('click', () => {
    const selectedAccount = JSON.parse(sessionStorage.getItem('selectedAccount'));

    if (selectedAccount) {
        // Navigate to next page (e.g., overseas transfer details)
        window.location.href = 'overseas-transfer-details.html';
    } else {
        // Alert if no account is selected
        alert('Please select an account to proceed');
    }
});
