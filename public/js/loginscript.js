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
        const userType = document.getElementById('userType').value;
        const loginData = {
            username: document.getElementById('loginUsername').value,
            password_hash: document.getElementById('loginPassword').value
        };
        try {
            const endpoint = userType === 'staff' ? '/staffs/login' : '/users/login';
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

            const redirectUrl = userType === 'staff' ? 'staff-video-calls.html' : 'index.html';
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