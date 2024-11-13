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

async function updateBalance(accId, bal) {
    accId = parseInt(accId);

    const newBalance = {
        balance: parseFloat(bal)
    };

    console.log(accId, bal)

    try {
        const response = await fetch(`/accounts/balance/${accId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newBalance)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update balance: ${errorText}`); // Log the response error
        }

        const updatedAccount = await response.json(); // Get updated account
        console.log('Updated account:', updatedAccount); // Log updated account
    } catch (error) {
        console.error('Error updating balance:', error);
    }
}

async function createTransaction(accId, amount) {

    const newTransactionData = {
        account_id: accId,
        transaction_type: "transfer",
        amount: amount,
        name: "John"
    };

    try {
        const response = await fetch(`/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newTransactionData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to create transaction:', errorData);
            alert(`Error: ${errorData.message}\nDetails: ${errorData.errors.join(', ')}`);
            return; // Stop further execution if the transaction creation fails
        }

        const responseData = await response.json();
        console.log('Transaction created successfully:', responseData);
        alert(`Transaction Successful: ${responseData.message || 'Your transaction has been processed.'}`);
    } catch (error) {
        console.error("Error creating transaction:", error);
        alert("There was an error processing your transaction. Please try again.");
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
    const nextBtn = document.getElementById("next");
    const accounts = await fetchUserAccounts(loginUserId); // Fetch user accounts
    if (accounts && accounts.length > 0) {
        // Store the accounts in session storage for later use
        sessionStorage.setItem('userAccounts', JSON.stringify(accounts));
        console.log("useracc:", sessionStorage)
    }

    let amount;
    
    //nextBtn.addEventListener('click',()=>{
       //amount = localStorage.getItem("amount");
       //let number = localStorage.getItem("number");
       //document.getElementById("amount").text
    //});

    amount = localStorage.getItem("amount");
       let number = localStorage.getItem("number");
       //document.getElementById("amount").text

    console.log(amount)

    const currentAccount = accounts[0];
    const accId = currentAccount.account_id;
    console.log(`were here ${accId}`);

    // Function to handle transaction limit confirmation
    document.querySelector('.confirm-btn').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default anchor click behavior

        const bal = currentAccount.balance - amount;

            //console.log(currentAccount.accId)
            console.log(amount)

            // Update the transaction amount (you can implement the actual logic here)
            updateBalance(accId, bal);

            createTransaction(accId, amount);

            // Show a confirmation message (optional)
            alert(`balance: ${bal}`);

            // Redirect to index.html after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000); // Adjust the delay time as needed
    });
});