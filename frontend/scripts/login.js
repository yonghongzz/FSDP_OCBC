document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    
    loginBtn.addEventListener('click', () => {
        const userType = document.getElementById('user-type').value;
        const userId = document.getElementById('user-id').value;

        if (!userId) {
            alert('Please enter an ID');
            return;
        }

        // Store login info in sessionStorage
        sessionStorage.setItem('userType', userType);
        sessionStorage.setItem('userId', userId);

        // Redirect based on user type
        if (userType === 'staff') {
            window.location.href = 'staffDashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    });
}); 