// public/video-call-staff.js
const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const sharedScreenVideo = document.getElementById('sharedScreenVideo');
const endCallBtn = document.getElementById('end-call-btn');
const toggleVideoBtn = document.getElementById('toggle-video-btn');
const toggleAudioBtn = document.getElementById('toggle-audio-btn');
const callEndedMessage = document.getElementById('call-ended-message');
const sharedScreen = document.getElementById('shared-screen');

let localStream, remoteStream, screenStream;
let peerConnection;
let callId;
let videoTrackEnabled = true;
let audioTrackEnabled = true;
let activeUsers = new Map();

// Handle incoming calls for staff
socket.on('new-call', (data) => {
    const callElement = document.createElement('div');
    callElement.className = 'call-item';
    callElement.dataset.callId = data.callId;
    callElement.innerHTML = `
        <span>${data.username}</span>
        <div class="call-buttons">
            <button class="accept-btn" onclick="acceptCall('${data.callId}', '${data.username}')">✓</button>
            <button class="reject-btn" onclick="rejectCall('${data.callId}')">✕</button>
        </div>
    `;
    document.getElementById('incoming-calls').appendChild(callElement);
});

// Accept Call Function
async function acceptCall(callId, username) {
    try {
        // Remove from incoming calls
        document.querySelector(`[data-call-id="${callId}"]`).remove();
        // Request access to camera and microphone
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        // Initialize peer connection
        createPeerConnection();

        // Emit an event to the server indicating the call has been accepted
        socket.emit('accept-call', { callId });

        // Update UI elements as needed (e.g., hide incoming calls panel)
        // Additional UI updates can be handled here
    } catch (error) {
        console.error('Error accepting call:', error);
    }
}

// Reject Call Function
function rejectCall(callId) {
    socket.emit('reject-call', { callId });
    document.querySelector(`[data-call-id="${callId}"]`).remove();
}

// End Call Function for Staff
function endCallStaff() {
    socket.emit('staff-end-call');
    activeUsers.forEach((user, callId) => {
        const wrapper = document.getElementById(`wrapper-${callId}`);
        if (wrapper) wrapper.remove();
    });
    activeUsers.clear();

    // Remove video streams on the staff interface
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
    if (sharedScreenVideo) sharedScreenVideo.srcObject = null;
    sharedScreen.style.display = 'none';
}

// Setup WebRTC Peer Connection
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
        const track = event.track;
        // Check if this is a screen sharing track
        console.log(event.streams[0].getTracks());
        console.log(track.kind);
        console.log(event.streams[0].getTracks().length);
        if (event.streams[0].getTracks().length === 2 && track.kind === 'video') {
            // This is likely a screen sharing track
            sharedScreen.style.display = 'flex';
            sharedScreenVideo.srcObject = event.streams[0];
        } else {
            // This is a regular video/audio track
            remoteStream.addTrack(track);
        }
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, callId });
        }
    };
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

// Handle Call Accepted Event
socket.on('call-accepted', async (callId) => {
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { callId, offer });
});

// // Handle Share Screen Event (User to Staff)
// socket.on('share-screen', ({ callId, screenStream }) => {
//     sharedScreen.style.display = 'flex';
//     sharedScreenVideo.srcObject = screenStream;
// });

// // Handle Stop Share Screen Event
// socket.on('stop-share-screen', () => {
//     sharedScreen.style.display = 'none';
//     if (sharedScreenVideo) {
//         sharedScreenVideo.srcObject = null;
//     }
// });

// Handle Call Rejected Event
socket.on('call-rejected', () => {
    endCallStaff();
    alert('Call was rejected');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});

// Handle Call Ended by Staff Event
socket.on('call-ended-by-staff', () => {
    endCallStaff();
    alert('Call ended by staff');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
});

// Add event listeners for buttons
if (endCallBtn) {
    endCallBtn.addEventListener('click', endCallStaff);
}
if (toggleVideoBtn) {
    toggleVideoBtn.addEventListener('click', toggleVideo);
}
if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', toggleAudio);
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