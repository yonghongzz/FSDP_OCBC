// token
const token = sessionStorage.getItem('token');
const loginUserId = sessionStorage.getItem('loginUserId');
const rToken = getCookie('rToken'); // refresh token

async function fetchUserAccounts(user_id) {
    try {
        const response = await fetch(`/accounts`); // Adjust endpoint as needed
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const accounts = await response.json();
        console.log(accounts)
        console.log(user_id);

        // Filter accounts that match the loginUserId
        const userAccounts = accounts.filter(account => account.user_id == loginUserId);
        console.log(userAccounts); // Log the filtered accounts
        return userAccounts;

    } catch (error) {
        console.error('Error fetching user accounts:', error);
    }
}

async function fetchUsername(user_id) {
    try {
        const response = await fetch(`/users/${user_id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const user = await response.json();
        const username = user.username;

        const welcomeBackDiv = document.querySelector('.welcome-back');
        const paragraph = welcomeBackDiv.querySelector('p');
        paragraph.textContent = `Welcome back, ${username}!`;
    } catch (error) {
        console.error('Error fetching username:', error);
    }
}

function displayAccount(account) {
    const accountType = document.querySelector('.acc-type');
    const accountNumber = document.querySelector('.acc-num');
    const balanceAmount = document.querySelector('.ab-amt');

    // Set the text content
    accountType.textContent = `${account.account_type}`;
    accountNumber.textContent = `${account.account_number}`;
    balanceAmount.textContent = `${account.balance.toFixed(2)} SGD`;
}

async function fetchTransactions(account_id) {
    try {
        const response = await fetch(`/transactions`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const transactions = await response.json();
        console.log("should be tr list:",transactions)

        // Filter accounts that match the loginUserId
        const accountTransactions = transactions.filter(transaction => transaction.account_id == account_id);
        console.log(accountTransactions); // Log the filtered accounts
        return accountTransactions;

    } catch (error) {
        console.error('Error fetching account transactions:', error);
    }
}

async function displayTransactions(transactions) {
    const transactionLogsContainer = document.getElementById('transaction-logs');
    transactionLogsContainer.innerHTML = '';

    transactions.forEach(transaction => {
        console.log(transaction)

        const transactionDate = new Date(transaction.transaction_datetime); // Assuming this is a valid date string
        const formattedDate = formatDate(transactionDate);

            const logDiv = document.createElement('div');
            logDiv.className = `tr-log ${transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund' ? 'tr-log-green' : 'tr-log-red'}`;

            logDiv.innerHTML = `
                <div class="tr-date">${formattedDate}</div>
                <div class="tr-infomoney">
                    <div class="tr-info">${transaction.name}</div>
                    <div class="tr-money">${transaction.transaction_type === 'deposit' || transaction.transaction_type === 'refund' ? '+' : '-'}${transaction.amount.toFixed(2)} SGD</div>
                </div>
            `;

        transactionLogsContainer.appendChild(logDiv);
    });
}

function formatDate(date) {
    const pad = (n) => (n < 10 ? '0' + n : n); // Helper function to add leading zeros
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are zero-based
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode the token payload
    const expiry = payload.exp * 1000; // Convert expiry time to milliseconds
    return Date.now() > expiry; // Check if the current time is past the expiry time
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
        // Send POST request to refresh token
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

        // Parse new token and update session storage
        const token = result.token;
        const decodedToken = parseJwt(token);
        const loginUserId = decodedToken.user_id;

        sessionStorage.setItem('token', token);
        sessionStorage.setItem('loginUserId', loginUserId);

        // Reload the page
        location.reload();
    } catch {
        console.log("error")
        alert('Login timed out.');
        // Clear session and cookies, reload
        sessionStorage.clear();
        deleteCookie('rToken');
        location.reload();
    }
}

document.getElementById('back').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// currently only looks at the first account and card it encounters
document.addEventListener('DOMContentLoaded', async () => {
    fetchUsername(loginUserId); // Fetch username

    const accounts = await fetchUserAccounts(loginUserId); // Fetch user accounts
    if (accounts && accounts.length > 0) {

        const accId = accounts[0].acc_id;

        // Display the first account by default
        displayAccount(accounts[0]); // Create a function to display account details
    }

    const transactions = await fetchTransactions(accounts[0].account_id);
    console.log(transactions);
    await displayTransactions(transactions)
});