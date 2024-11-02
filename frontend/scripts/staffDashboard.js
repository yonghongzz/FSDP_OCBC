let socket;

document.addEventListener('DOMContentLoaded', () => {
    const userType = sessionStorage.getItem('userType');
    const userId = sessionStorage.getItem('userId');

    if (!userType || !userId || userType !== 'staff') {
        window.location.href = 'login.html';
        return;
    }

    // Initialize socket connection
    socket = io();
    
    // Register as staff
    socket.emit('register', { userType, userId });

    // Handle incoming call requests
    socket.on('incoming-call', ({ callerId, callerType, offer }) => {
        const requestsContainer = document.getElementById('call-requests');
        
        const callRequest = document.createElement('div');
        callRequest.className = 'call-request';
        callRequest.innerHTML = `
            <div class="user-info">
                Call request from: ${callerId}
            </div>
            <div class="call-actions">
                <button class="accept-call">Accept</button>
                <button class="reject-call">Reject</button>
            </div>
        `;

        // Store the offer for when we accept the call
        callRequest.dataset.offer = JSON.stringify(offer);
        callRequest.dataset.callerId = callerId;

        requestsContainer.appendChild(callRequest);

        // Handle accept button
        callRequest.querySelector('.accept-call').addEventListener('click', () => {
            sessionStorage.setItem('currentCall', JSON.stringify({
                callerId,
                offer
            }));
            window.location.href = 'vidCall.html';
        });

        // Handle reject button
        callRequest.querySelector('.reject-call').addEventListener('click', () => {
            socket.emit('call-rejected', { targetUserId: callerId });
            callRequest.remove();
        });
    });

    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
}); 