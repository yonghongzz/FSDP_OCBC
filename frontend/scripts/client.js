let localStream;
let peerConnection;
let socket;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
        // Add TURN servers for production
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    const userType = sessionStorage.getItem('userType');
    const userId = sessionStorage.getItem('userId');

    if (!userType || !userId) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize WebSocket connection
    socket = io();
    
    // Register user
    socket.emit('register', { userId, userType });
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        document.getElementById('local-video').srcObject = localStream;

        // If staff, check for stored call data
        if (userType === 'staff') {
            const currentCall = JSON.parse(sessionStorage.getItem('currentCall'));
            if (currentCall) {
                handleIncomingCall(currentCall.callerId, currentCall.offer);
                sessionStorage.removeItem('currentCall');
            }
        } else {
            // If user, initiate call to available staff
            initiateCall('STAFF1'); // You might want to implement staff discovery
        }
    } catch (err) {
        console.error('Error accessing media devices:', err);
    }

    initializeEventListeners();
});

function initializeEventListeners() {
    socket.on('incoming-call', async ({ callerId, callerType, offer }) => {
        if (confirm(`Incoming call from ${callerType} ${callerId}. Accept?`)) {
            await handleIncomingCall(callerId, offer);
        } else {
            socket.emit('call-rejected', { targetUserId: callerId });
        }
    });

    socket.on('answer-made', async ({ answer }) => {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });

    socket.on('call-ended', () => {
        endCall();
    });

    // Button event listeners
    document.getElementById('camera-toggle').addEventListener('click', toggleCamera);
    document.getElementById('screen-share').addEventListener('click', toggleScreenShare);
    document.getElementById('end-call').addEventListener('click', () => {
        socket.emit('end-call', { targetUserId: currentCallId });
        endCall();
    });
    document.getElementById('help-button').addEventListener('click', () => {
        // In a real application, you would get the available staff ID
        const staffId = 'STAFF1';
        initiateCall(staffId);
    });
}

async function initiateCall(targetUserId) {
    currentCallId = targetUserId;
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Handle incoming tracks
    peerConnection.ontrack = ({ streams: [stream] }) => {
        document.getElementById('remote-video').srcObject = stream;
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('ice-candidate', { targetUserId, candidate });
        }
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('call-user', { targetUserId, offer });

    document.getElementById('end-call').classList.remove('hidden');
}

async function handleIncomingCall(callerId, offer) {
    currentCallId = callerId;
    peerConnection = new RTCPeerConnection(configuration);

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = ({ streams: [stream] }) => {
        document.getElementById('remote-video').srcObject = stream;
    };

    peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
            socket.emit('ice-candidate', { targetUserId: callerId, candidate });
        }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('call-answered', { targetUserId: callerId, answer });
    document.getElementById('end-call').classList.remove('hidden');
}

function toggleCamera() {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    const cameraBtn = document.getElementById('camera-toggle');
    const cameraIcon = cameraBtn.querySelector('i');
    cameraIcon.classList.remove('bi-camera-video-fill', 'bi-camera-video-off-fill');
    cameraIcon.classList.add(videoTrack.enabled ? 'bi-camera-video-fill' : 'bi-camera-video-off-fill');
}

async function toggleScreenShare() {
    try {
        if (localStream.getVideoTracks()[0].label.includes('screen')) {
            // Switch back to camera
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const videoTrack = cameraStream.getVideoTracks()[0];
            replaceTrack(videoTrack);
            const screenShareBtn = document.getElementById('screen-share');
            const screenShareIcon = screenShareBtn.querySelector('i');
            screenShareIcon.classList.remove('bi-box-arrow-up', 'bi-box-arrow-down');
            screenShareIcon.classList.add('bi-box-arrow-down');
        } else {
            // Switch to screen share
            const screenStream = await navigator.mediaDevices.getDisplayMedia();
            const videoTrack = screenStream.getVideoTracks()[0];
            replaceTrack(videoTrack);
            const screenShareBtn = document.getElementById('screen-share');
            const screenShareIcon = screenShareBtn.querySelector('i');
            screenShareIcon.classList.remove('bi-box-arrow-up', 'bi-box-arrow-down');
            screenShareIcon.classList.add('bi-box-arrow-down');

            // Handle user stopping screen share through browser UI
            videoTrack.onended = async () => {
                const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
                replaceTrack(cameraStream.getVideoTracks()[0]);
                const screenShareBtn = document.getElementById('screen-share');
                const screenShareIcon = screenShareBtn.querySelector('i');
                screenShareIcon.classList.remove('bi-box-arrow-up', 'bi-box-arrow-down');
                screenShareIcon.classList.add('bi-box-arrow-up');
            };
        }
    } catch (err) {
        console.error('Error sharing screen:', err);
    }
}

function replaceTrack(newTrack) {
    const sender = peerConnection.getSenders().find(s => 
        s.track.kind === newTrack.kind);
    if (sender) {
        sender.replaceTrack(newTrack);
    }
    localStream.getVideoTracks()[0].stop();
    localStream.removeTrack(localStream.getVideoTracks()[0]);
    localStream.addTrack(newTrack);
    document.getElementById('local-video').srcObject = localStream;
}

function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    document.getElementById('remote-video').srcObject = null;
    document.getElementById('end-call').classList.add('hidden');
    currentCallId = null;
}