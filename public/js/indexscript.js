// token
const token = sessionStorage.getItem('token');
const loginUserId = sessionStorage.getItem('loginUserId');
const rToken = getCookie('rToken'); // refresh token

function displayAccount(account, card) {

    const accountType = document.querySelector('.account-type');
    const accountNumber = document.querySelector('.account-number');
    const balanceAmount = document.querySelector('.balance-amount');
    const debitCardnum = document.querySelector('.debit-cardnum');
    const transactionAmount = document.querySelector('.tc-amt');

    // Set the text content
    accountType.textContent = `${account.account_type}`;
    accountNumber.textContent = `${account.account_number}`;
    balanceAmount.textContent = `${account.balance.toFixed(2)} SGD`;
    debitCardnum.textContent = `${card.card_number}`;
    transactionAmount.textContent = `${account.transaction_limit.toFixed(2)} SGD`;
}

async function fetchUserAccounts(user_id) {
    try {
        const response = await fetch(`/accounts`); // Adjust endpoint as needed
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const accounts = await response.json();
        console.log(accounts)
        console.log(user_id);

        /*
        const userAccounts = [];
        for (const account of accounts) {
            const userId = account.user_id;
            if (userId == loginUserId) {
                userAccounts.push(account);
            }
        }
        */

        // Filter accounts that match the loginUserId
        const userAccounts = accounts.filter(account => account.user_id == loginUserId);
        console.log(userAccounts); // Log the filtered accounts
        return userAccounts;

    } catch (error) {
        console.error('Error fetching user accounts:', error);
    }
}

async function fetchCards(account_id) {
    try {
        const response = await fetch(`/cards?accountId=${account_id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const cards = await response.json();
        return cards;
    } catch (error) {
        console.error('Error fetching cards:', error);
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

// document.getElementById('person').addEventListener('click', function() {
//     window.location.href = 'login.html';
// });

// currently only looks at the first account and card it encounters
document.addEventListener('DOMContentLoaded', async () => {
    fetchUsername(loginUserId); // Fetch username

    const accounts = await fetchUserAccounts(loginUserId); // Fetch user accounts
    if (accounts && accounts.length > 0) {
        // Store the accounts in session storage for later use
        sessionStorage.setItem('userAccounts', JSON.stringify(accounts));
        console.log("useracc:", sessionStorage)

        const accId = accounts[0].acc_id;
        const cards = await fetchCards(accId);

        if (cards && cards.length > 0) {
            // Store the cards in session storage for later use
            sessionStorage.setItem('userCards', JSON.stringify(cards));
            console.log("usercards:", sessionStorage);

        } else {
            console.log("No cards found for this account.");
        }

        // Display the first account by default
        displayAccount(accounts[0], cards[0]); // Create a function to display account details
    }
    else{
        window.location.href = "login.html";
    }
});