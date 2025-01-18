const { startRegistration,startAuthentication } = SimpleWebAuthnBrowser;
// token
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
        let text = `Transaction Successful: Your transaction has been processed.`;
        speechSynthesis.cancel();
        isSpeaking = false;
        performTTS(text);
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
    document.querySelector('.confirm-btn').addEventListener('click', async function(event) {
        event.preventDefault(); // Prevent the default anchor click behavior
        if(await getPasskey(loginUserId)){
            if(await authenticateAuth(loginUserId)){
                await transaction();
            }
            else{
                alert("Authentication failed. Fingerprint is not correct");
            }
        }
        else{
            await transaction();
        }
    });

    async function transaction(){
        const bal = currentAccount.balance - amount;

        //console.log(currentAccount.accId)
        console.log(amount)

        // Update the transaction amount (you can implement the actual logic here)
        updateBalance(accId, bal);

        createTransaction(accId, amount);

        const user = await fetchUser(loginUserId);
        sendEmail(user,amount);

        // Show a confirmation message (optional)
        alert(`balance: ${bal}`);

        // Redirect to index.html after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000); // Adjust the delay time as needed
    }

    async function sendEmail(user,amount){
        try {
            const body = {
                user:user,
                amount:amount,
            }
            const response = await fetch(`/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to send email:', errorData);
                alert(`Error: ${errorData.message}\nDetails: ${errorData.errors.join(', ')}`);
                return;
            }
            
        } catch (error) {
            console.error("Error creating transaction:", error);
            alert("There was an error processing your transaction. Please try again.");
        }
    }

    async function fetchUser(user_id) {
        try {
            const response = await fetch(`/users/${user_id}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const user = await response.json();
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    async function getPasskey(userId){
        const response = await fetch(`/get-passkey?userId=${userId}`);
        if(response.ok){
          const text = await response.text();
          if (!text) {
              return null; // Return null if response body is empty
          }
  
          const passkey = JSON.parse(text); // Parse as JSON if the body is not empty
          return passkey;
        }
      }
    
      async function authenticateAuth(userId){
        console.log(userId);
        const passkey = await getPasskey(userId);
        const resp = await fetch(`/generate-authentication-options?userId=${userId}`,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(passkey),
        });
        const options = await resp.json();
        console.log(options);
        let asseResp;
        try{
          asseResp = await startAuthentication({ optionsJSON: options, useBrowserAutofill: false });
          console.log(asseResp);
        }catch(error){
          console.log(error);
        }
    
        const body = {
          asseResp,
          passkey,
        }
        console.log(passkey);
    
        const verificationResp = await fetch(`/verify-authentication`,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
    
        const verificationJSON = await verificationResp.json();
        console.log(verificationJSON);
        if(verificationJSON && verificationJSON.verified){
          console.log("Success");
          console.log(verificationJSON);
          updateCounter(passkey,verificationJSON.authenticationInfo.newCounter);
          return true;
        }
      }
      
      async function updateCounter(passkey,newCounter){
        passkey.counter = newCounter;
        const updatePasskeyCounter = await fetch('/update-counter',{
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(passkey),
        });
    
      }
});