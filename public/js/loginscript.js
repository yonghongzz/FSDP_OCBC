const { startRegistration,startAuthentication } = SimpleWebAuthnBrowser;

document.addEventListener('DOMContentLoaded', function () {
    const token = sessionStorage.getItem('token');
    const loginUserId = sessionStorage.getItem('loginUserId');
    const rToken = getCookie('rToken');

    if (token && !isTokenExpired(token)) {
        window.location.href = `index.html`;
        console.log("Logged in");
    } else if (rToken) {
        refreshToken(rToken);
    } else if (token && isTokenExpired(token)){
        sessionStorage.clear();
        deleteCookie('rToken');
        location.reload();
    }

    document.getElementById('login').addEventListener('submit', async function (e) {
        e.preventDefault();
        const userType = localStorage.getItem('role');
        console.log(userType);
        const loginData = {
            username: document.getElementById('loginUsername').value,
            password_hash: document.getElementById('loginPassword').value
        };
        try {
            const endpoint = userType === 'staff' ? '/staffs/login' : '/users/login';
            console.log(endpoint);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }

            const result = await response.json();
            alert('Login successful');

            const token = result.token;
            const decodedToken = parseJwt(token);
            const loginUserId = decodedToken.user_id;

            const refreshToken = result.refreshToken;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('loginUserId', loginUserId);
            setCookie('rToken', refreshToken, 7);

            const redirectUrl = userType === 'staff' ? 'staff-page.html' : 'index.html';
            window.location.href = redirectUrl;
        } catch (err) {
            const errorField = document.getElementById('loginError');
            errorField.textContent = '';
            errorField.textContent = 'Login failed: Invalid e-mail or password';
        }
    });
});

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

function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    return Date.now() > expiry;
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
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

function deleteCookie(cname) {
    document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

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
        console.log("error");
        alert('Login timed out.');
        sessionStorage.clear();
        deleteCookie('rToken');   
        location.reload();
    }
}

const fingerprint = document.getElementById("biometric");
fingerprint.addEventListener('click',async()=>{
    const username = document.getElementById("loginUsername").value;
    if(!username){
        const errorField = document.getElementById('loginError');
        errorField.textContent = 'Please enter your username!';
        return;
    }
    const userId = await fetchUserId(username);

    if(!userId){
        alert("User not found.");
        return;
    }

    const passkey = await getPasskey(userId);

    if(!passkey){
        alert("Biometric not register yet!");
        return;
    }
    try {
        authenticateAuth(userId);
    } catch (error) {
        console.error('Error during fingerprint authentication:', error);
    }
});

async function fetchUserId(username) {
    try {
        const response = await fetch(`/userId/${username}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        userId = await response.json();
        return userId;
    } catch (error) {
        console.error('Error fetching username:', error);
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
      const response = await fetch(`/users/${userId}`);
      const user = await response.json();
      if(user){
        sessionStorage.setItem('loginUserId',userId);
        window.location.href = "index.html";
      }
      console.log(user);
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