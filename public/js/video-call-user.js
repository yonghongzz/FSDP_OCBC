// public/video-call-user.js
const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const callBtn = document.getElementById('call-btn');
const endCallBtn = document.getElementById('end-call-btn');
const toggleVideoBtn = document.getElementById('toggle-video-btn');
const toggleAudioBtn = document.getElementById('toggle-audio-btn');
const shareScreenBtn = document.getElementById('share-screen-btn');
const callEndedMessage = document.getElementById('call-ended-message');

let localStream, remoteStream, screenStream;
let peerConnection;
let callId;
let videoTrackEnabled = true;
let audioTrackEnabled = true;

// Setup media and initiate call for user
async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        createPeerConnection();

        callId = `call-${Date.now()}`;
        // Ensure 'username' is defined, possibly passed via query parameters
        socket.emit("initiate-call", { username, callId });

        // Hide call button and show other controls
        callBtn.style.display = 'none';
        endCallBtn.style.display = 'block';
        toggleVideoBtn.style.display = 'block';
        toggleAudioBtn.style.display = 'block';
        shareScreenBtn.style.display = 'block';
    } catch (error) {
        console.error('Error starting call:', error);
    }
}

// End call
function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    endCallBtn.style.display = 'none';
    toggleVideoBtn.style.display = 'none';
    toggleAudioBtn.style.display = 'none';
    shareScreenBtn.style.display = 'none';
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000); // Redirect to index.html after 2 seconds
}

// Toggle video
function toggleVideo() {
    videoTrackEnabled = !videoTrackEnabled;
    if (localStream) {
        localStream.getVideoTracks()[0].enabled = videoTrackEnabled;
        toggleVideoBtn.textContent = videoTrackEnabled ? '🎥' : '📷';
    }
}

// Toggle audio
function toggleAudio() {
    audioTrackEnabled = !audioTrackEnabled;
    if (localStream) {
        localStream.getAudioTracks()[0].enabled = audioTrackEnabled;
        toggleAudioBtn.textContent = audioTrackEnabled ? '🎤' : '🔇';
    }
}

// Setup WebRTC peer connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }  // Public STUN server for ICE connectivity
        ]
    });
    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, callId });
        }
    };
}

// Initiate call as user
if (callBtn) {
    callBtn.addEventListener('click', async () => {
        await startCall();
        createPeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { callId, offer });
    });
}

// Handle WebRTC signaling
socket.on('offer', async ({ callId, offer }) => {
    createPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { callId, answer });
});

socket.on('answer', async ({ answer }) => {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
});

socket.on('ice-candidate', async ({ candidate }) => {
    if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// Handle call accepted
socket.on('call-accepted', async (callId) => {
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { callId, offer });
});

// Handle call rejected
socket.on('call-rejected', () => {
    endCall();
    alert('Call was rejected');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});

// Handle call ended by staff
socket.on('call-ended-by-staff', () => {
    endCall();
    alert('Call ended by staff');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});

// Add event listeners for buttons
if (endCallBtn) {
    endCallBtn.addEventListener('click', endCall);
}
if (toggleVideoBtn) {
    toggleVideoBtn.addEventListener('click', toggleVideo);
}
if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', toggleAudio);
}
if (shareScreenBtn) {
    shareScreenBtn.addEventListener('click', async () => {
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            
            // Create a new sender for the screen track
            const screenTrack = screenStream.getVideoTracks()[0];
            const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
            
            if (sender) {
                sender.replaceTrack(screenTrack);
            } else {
                peerConnection.addTrack(screenTrack, screenStream);
            }

            // Handle when the user stops sharing the screen
            screenTrack.onended = async () => {
                const videoTrack = localStream.getVideoTracks()[0];
                const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
                socket.emit('stop-share-screen', { callId });
            };

            socket.emit('share-screen', { callId });
        } catch (error) {
            console.error('Error sharing screen:', error);
        }
    });
}

