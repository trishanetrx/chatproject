const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allowed Origins
const allowedOrigins = [
    'https://negombotech.com',
    'https://chat.negombotech.com',
    'https://api.negombotech.com'
];

// CORS Middleware for Express
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Middleware
app.use(bodyParser.json());

// In-memory storage for users (replace with a database in production)
const users = new Map();

// REST API Endpoints
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (users.has(username)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    users.set(username, password);
    res.status(201).json({ message: 'Registration successful' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (users.get(username) === password) {
        return res.json({ token: 'dummy-token', username }); // Include username in response
    }
    res.status(401).json({ message: 'Invalid username or password' });
});

// Socket.IO Server with CORS Configuration
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// WebSocket Handlers
const onlineUsers = new Set();

io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle joining a user
    socket.on('join', (username) => {
        socket.username = username;
        onlineUsers.add(username);
        io.emit('updateUserList', Array.from(onlineUsers));
        console.log(`${username} joined the chat`);
    });

    // Handle messages
    socket.on('message', (data) => {
        io.emit('message', data);
        console.log(`Message from ${data.username}: ${data.message}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        onlineUsers.delete(socket.username);
        io.emit('updateUserList', Array.from(onlineUsers));
        console.log(`${socket.username} disconnected`);
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

