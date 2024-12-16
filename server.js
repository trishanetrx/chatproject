const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const cors = require('cors');
const allowedOrigins = ['https://negombotech.com', 'https://chat.negombotech.com'];

app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
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
        return res.json({ token: 'dummy-token' });
    }
    res.status(401).json({ message: 'Invalid username or password' });
});

// WebSocket Handlers
const onlineUsers = new Set();

io.on('connection', (socket) => {
    socket.on('join', (username) => {
        onlineUsers.add(username);
        io.emit('updateUserList', Array.from(onlineUsers));
    });

    socket.on('message', (data) => {
        io.emit('message', data);
    });

    socket.on('disconnect', () => {
        onlineUsers.delete(socket.username);
        io.emit('updateUserList', Array.from(onlineUsers));
    });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
