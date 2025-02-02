// formHandler.js

document.addEventListener("DOMContentLoaded", async function () {
    const token = sessionStorage.getItem('token');
    const loginUserId = sessionStorage.getItem('loginUserId');
    const rToken = getCookie('rToken'); // refresh token
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

function displaySmallTransactionLimit(account) {
    const tll = document.querySelector('.tll');
    tll.textContent = `Transfer limit: ${account.transaction_limit} SGD`;
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

    const nextButton = document.querySelector(".next-button");
    nextButton.addEventListener("click", function(event) {
        event.preventDefault(); // Prevent default link behavior

        // Capture form data
        const mobile = document.getElementById("mobile").value;
        const amount = document.getElementById("amount").value;
        const comments = document.getElementById("comments").value;

        // Validate mobile number and amount
        if (!mobile || !amount) {
            text = "Please fill in the required fields: Mobile number and Amount."
            performTTS(text);
            alert("Please fill in the required fields: Mobile number and Amount.");
            
            return;
        }

        // Store data in sessionStorage
        sessionStorage.setItem("mobile", mobile);
        sessionStorage.setItem("amount", amount);
        sessionStorage.setItem("comments", comments);

    });

    const nextBtn = document.getElementById("next");
    const accounts = await fetchUserAccounts(loginUserId); // Fetch user accounts
    if (accounts && accounts.length > 0) {
        // Store the accounts in session storage for later use
        sessionStorage.setItem('userAccounts', JSON.stringify(accounts));
        console.log("useracc:", sessionStorage)
    }

    displaySmallTransactionLimit(accounts[0]);

    nextBtn.addEventListener('click',()=>{
       let amount = document.getElementById("amount").value;
       let number = document.getElementById("mobile").value;
       console.log(accounts[0]);
       if(amount > accounts[0].transaction_limit){
        console.log("Amount exceed transaction limit!");
        text = "Amount excees transaction limit!";
        performTTS(text);
        alert(`Amount exceed transaction limit!`);
       } 
       else if(amount > accounts[0].balance){
        console.log("Not enough balance!");
        text = "Not enough balance!";
        performTTS(text);
        alert(`Not enough balance!`);
       }
       else if(!number || number.length != 8){
        console.log("Please enter a valid number.");
        text = "Please enter a valid number";
        performTTS(text);
        alert(`Please enter a valid number.`);
       }
       else{
        localStorage.setItem("amount",amount);
        localStorage.setItem("number",number);

        window.location.href = "reviewconf.html"
       }
    });
});
