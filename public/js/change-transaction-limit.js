// token
const token = sessionStorage.getItem('token');
const loginUserId = sessionStorage.getItem('loginUserId');
const rToken = getCookie('rToken'); // refresh token

document.getElementById('back').addEventListener('click', function() {
    window.location.href = 'index.html';
});

let canSpeak = false;
let isSpeaking = false;
if(localStorage.getItem("tts") === "true"){
    canSpeak = true;
    console.log("canspeak");
}
else{
    canSpeak = false;
}
const performTTS = async(textContent) => {
    let utterance;
    utterance = new SpeechSynthesisUtterance(textContent);
  
    utterance.lang = 'en-US'; // Set the language (optional)
  
    // Optional: Set additional properties
    utterance.pitch = 1; // Range: 0 to 2
    utterance.rate = 1; // Range: 0.1 to 10
    utterance.volume = 1; // Range: 0 to 1
  
    // Speak the text
    speechSynthesis.speak(utterance);
    setTimeout(function() {
      isSpeaking = false;
    }, 1000);
};

// only getting the first account
// implement dynamic search in the future (using getUrlParams)
document.addEventListener('DOMContentLoaded', async () => {
    const accounts = await fetchUserAccounts(loginUserId); // Fetch user accounts
    const currentAccount = accounts[0];
    const accId = currentAccount.account_id;
    console.log(accId)

    // Function to handle transaction limit confirmation
    document.querySelector('.confirm-limit').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default anchor click behavior

        // Get the selected limit from the dropdown
        const selectedLimit = document.querySelector('.dropdown-menu .dropdown-item.active');
        if (selectedLimit) {
            const limitValue = selectedLimit.textContent;

            //console.log(currentAccount.accId)
            console.log(limitValue)

            // Update the transaction amount (you can implement the actual logic here)
            updateTransactionLimit(accId, limitValue);
            text = `Transaction limit updated to ${limitValue} SGD.`

            // Show a confirmation message (optional)
            if(canSpeak){
                if(!isSpeaking){
                    isSpeaking = true;
                    performTTS(text); // or any function handling the text
                    console.log("NM");
                }
            }
            alert(`Transaction limit updated to ${limitValue} SGD.`);
            
            // Redirect to index.html after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000); // Adjust the delay time as needed
        } else {
            text = 'Please select a transaction limit before confirming.';
            if(canSpeak){
                if(!isSpeaking){
                    isSpeaking = true;
                    performTTS(text); // or any function handling the text
                }
            }
            alert('Please select a transaction limit before confirming.');
        }
    });

    // Adding event listeners to dropdown items
    const dropdownItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove 'active' class from all items
            dropdownItems.forEach(i => i.classList.remove('active'));
            
            // Add 'active' class to the selected item
            this.classList.add('active');

            // Update the dropdown button text to reflect the selected limit
            const dropdownButton = document.querySelector('.dropdown-toggle');
            dropdownButton.textContent = `${this.textContent} SGD`;
        });
    });
});

// get the latest transaction amt
// update the account transaction amt when press confirm
// bring them back to index.html


async function fetchUserAccounts(user_id) {
    try {
        const response = await fetch(`/accounts`); // Adjust endpoint as needed
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const accounts = await response.json();

        // Filter accounts that match the loginUserId
        const userAccounts = accounts.filter(account => account.user_id == loginUserId);
        console.log(userAccounts); // Log the filtered accounts
        return userAccounts;

    } catch (error) {
        console.error('Error fetching user accounts:', error);
    }
}

async function updateTransactionLimit(accId, limit) {
    accId = parseInt(accId);

    const newTransactionLimit = {
        transaction_limit: parseFloat(limit)
    };

    try {
        const response = await fetch(`/accounts/${accId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newTransactionLimit)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update limit: ${errorText}`); // Log the response error
        }

        const updatedAccount = await response.json(); // Get updated account
        console.log('Updated account:', updatedAccount); // Log updated account
    } catch (error) {
        console.error('Error updating transaction limit:', error);
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
