const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/scripts', express.static(path.join(__dirname, '../frontend/scripts')));

// Serve socket.io client file
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.js'));
});

const users = new Map(); // Store user socket mappings
const availableStaff = new Set();

io.on('connection', socket => {
    console.log('User connected:', socket.id);

    socket.on('register', ({ userType, userId }) => {
        users.set(userId, { socket, userType });
        socket.userId = userId;
        socket.userType = userType;

        if (userType === 'staff') {
            availableStaff.add(userId);
        }
    });

    socket.on('call-user', ({ targetUserId, offer }) => {
        const targetUser = users.get(targetUserId);
        if (targetUser) {
            targetUser.socket.emit('incoming-call', {
                callerId: socket.userId,
                callerType: socket.userType,
                offer
            });
        }
    });

    socket.on('call-answered', ({ targetUserId, answer }) => {
        const targetUser = users.get(targetUserId);
        if (targetUser) {
            targetUser.socket.emit('answer-made', { answer });
        }
    });

    socket.on('ice-candidate', ({ targetUserId, candidate }) => {
        const targetUser = users.get(targetUserId);
        if (targetUser) {
            targetUser.socket.emit('ice-candidate', { candidate });
        }
    });

    socket.on('end-call', ({ targetUserId }) => {
        const targetUser = users.get(targetUserId);
        if (targetUser) {
            targetUser.socket.emit('call-ended');
        }
    });

    socket.on('disconnect', () => {
        if (socket.userId) {
            users.delete(socket.userId);
            if (socket.userType === 'staff') {
                availableStaff.delete(socket.userId);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});