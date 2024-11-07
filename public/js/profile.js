document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    logoutBtn.addEventListener('click', async function() {
        try {
            const rToken = getCookie('rToken');
            
            // Call server to invalidate refresh token
            const response = await fetch('/logout', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${rToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok && response.status !== 404) {
                throw new Error('Logout failed');
            }

            // Clear client-side storage
            sessionStorage.clear();
            deleteCookie('rToken');
            
            // Redirect to login page
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('Logout error:', error);
            // Even if server call fails, clear client-side storage and redirect
            sessionStorage.clear();
            deleteCookie('rToken');
            window.location.href = 'login.html';
        }
    });
});

// Reuse your existing cookie functions
function deleteCookie(cname) {
    document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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