// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function () {
    // Retrieve authentication token and user ID from session storage
    const token = sessionStorage.getItem('token');
    const loginStaffId = sessionStorage.getItem('loginStaffId');
    const rToken = getCookie('rToken');

    // Check token validity and handle accordingly
    if (token && !isTokenExpired(token)) {
        // If token is valid, redirect to profile page
        window.location.href = `index.html`; // change this with staff interface
        console.log("Logged in");
    } else if (rToken) {
        // If refresh token exists, attempt to refresh the token
        refreshToken(rToken);
    } else if (token && isTokenExpired(token)){
        // If token is expired, clear session and cookies
        sessionStorage.clear();
        deleteCookie('rToken');
        location.reload();
    }

    // Add event listener for login form submission
    document.getElementById('login').addEventListener('submit', async function (e) {
        e.preventDefault();
        // Gather login data from form
        const loginData = {
            username: document.getElementById('loginUsername').value,
            password_hash: document.getElementById('loginPassword').value
        };
        try {
            // Send POST request to login endpoint
            const response = await fetch('/staffs/login', {
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

            // Parse token and store relevant information in session storage
            const token = result.token;
            const decodedToken = parseJwt(token);
            const loginStaffId = decodedToken.user_id;

            const refreshToken = result.refreshToken;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('loginStaffId', loginStaffId);
            setCookie('rToken', refreshToken, 7);

            // Redirect to home page
            window.location.href = 'index.html'; //change to staff interface
        } catch (err) {
            // Display error message
            const errorField = document.getElementById('loginError');
            errorField.textContent = ''; // Clear previous error messages
            errorField.textContent = 'Login failed: Invalid e-mail or password';
        }
    });
});

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

// Function to check if token is expired
function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode the token payload
    const expiry = payload.exp * 1000; // Convert expiry time to milliseconds
    return Date.now() > expiry; // Check if the current time is past the expiry time
}

// Function to set a cookie
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

// Function to get a cookie by name
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
        const loginStaffId = decodedToken.staff_id;

        sessionStorage.setItem('token', token);
        sessionStorage.setItem('loginStaffId', loginStaffId);
        
        // Reload the page
        location.reload();
    } catch {
        console.log("error");
        alert('Login timed out.');
        // Clear session and cookies, then reload the page
        sessionStorage.clear();
        deleteCookie('rToken');   
        location.reload();
    }
}