// token
const token = sessionStorage.getItem('token');
const loginUserId = sessionStorage.getItem('loginUserId');
const rToken = getCookie('rToken'); // refresh token


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

async function fetchOverseasPayee(user_id) {
    try {
        const response = await fetch(`/overseas-payees/${user_id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const overseasPayees = await response.json();
        return overseasPayees.filter(payee => payee.user_id == user_id);
    } catch (error) {
        console.error('Error fetching overseas payee details:', error);
    }
}

async function displayOverseasPayees() {
    const overseasPayees = await fetchOverseasPayee(loginUserId);
    if (overseasPayees && overseasPayees.length > 0) {
        const pinnedContainer = document.createElement('div');
        const unpinnedContainer = document.createElement('div');

        pinnedContainer.classList.add('recipient-container', 'pinned-container');
        unpinnedContainer.classList.add('recipient-container', 'unpinned-container');

        overseasPayees.forEach(payee => {
            const recipientBox = document.createElement('div');
            recipientBox.classList.add('recipient-box');
            recipientBox.innerHTML = `
                <div class="recipient-left">
                    <img src="path/to/pfp-icon.png" alt="Profile Icon" class="recipient-pfp" />
                    <div class="recipient-info">
                        <p class="recipient-name">${payee.payee_name}</p>
                        <p class="recipient-bank">${payee.bank_name}</p>
                    </div>
                </div>
            `;

            if (payee.is_pinned) {
                recipientBox.classList.add('pinned');
                pinnedContainer.appendChild(recipientBox);
            } else {
                unpinnedContainer.appendChild(recipientBox);
            }

            recipientBox.addEventListener('click', () => {
                document.querySelectorAll('.recipient-box').forEach(box => {
                    box.classList.remove('selected');
                    box.style.boxShadow = 'none';
                });
                recipientBox.classList.add('selected');
                recipientBox.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.8)';
                sessionStorage.setItem('selectedPayee', JSON.stringify(payee));
            });
        });

        const recipientSection = document.getElementById('recipient-container');
        recipientSection.innerHTML = '';
        recipientSection.appendChild(pinnedContainer);
        recipientSection.appendChild(unpinnedContainer);

        applySelectedPayee();
    }
}

function applySelectedPayee() {
    const selectedPayee = JSON.parse(sessionStorage.getItem('selectedPayee'));
    if (selectedPayee) {
        document.querySelectorAll('.recipient-box').forEach(box => {
            const payeeName = box.querySelector('.recipient-name').textContent;
            if (payeeName === selectedPayee.payee_name) {
                box.classList.add('selected');
                box.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.8)';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await displayOverseasPayees();
});

// Next button event listener
document.getElementById('next-button').addEventListener('click', () => {
    const selectedPayee = JSON.parse(sessionStorage.getItem('selectedPayee'));
    if (selectedPayee) {
        window.location.href = 'overseas-select-fund-recurring.html';
    } else {
        alert('Please select a payee to proceed');
    }
});
