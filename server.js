const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// JWT secret
const ADMIN_JWT_SECRET = "super-secret-admin-jwt-key";

// -----------------------------------------
// Ensure database folder exists
// -----------------------------------------
if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database');
}

// -----------------------------------------
// SETUP SQLITE DATABASE
// -----------------------------------------
const db = new Database('./database/chat.db');

// USERS TABLE
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        is_admin INTEGER DEFAULT 0,
        is_online INTEGER DEFAULT 0
    )
`).run();

// MESSAGES TABLE
db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        message TEXT,
        timestamp TEXT
    )
`).run();

// BANS TABLE
db.prepare(`
    CREATE TABLE IF NOT EXISTS bans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE
    )
`).run();

// Ensure is_admin column exists (SQLite is weird with alter)
try {
    db.prepare(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`).run();
} catch (e) { /* ignore */ }

try {
    db.prepare(`ALTER TABLE users ADD COLUMN is_online INTEGER DEFAULT 0`).run();
} catch (e) { /* ignore */ }

// Insert master admin if missing
const adminUser = db.prepare(`SELECT username FROM users WHERE username='Admin'`).get();
if (!adminUser) {
    db.prepare(`INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)`)
      .run("Admin", "testpass231");
    console.log("Admin user created with default password.");
}

// -----------------------------------------
// Express Setup
// -----------------------------------------
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
    'https://copythingz.shop',
    'https://chat.copythingz.shop',
    'https://chatapi.copythingz.shop'
];

app.use(cors({
    origin: (origin, cb) =>
        (!origin || allowedOrigins.includes(origin))
            ? cb(null, true)
            : cb(new Error("CORS Blocked")),
    credentials: true
}));

app.use(bodyParser.json());

// -----------------------------------------
// ADMIN LOGIN (JWT)
// -----------------------------------------
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    const admin = db.prepare(`SELECT * FROM users WHERE username='Admin'`).get();

    if (!admin || username !== "Admin" || password !== admin.password) {
        return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
        { username: "Admin", role: "admin" },
        ADMIN_JWT_SECRET,
        { expiresIn: "24h" }
    );

    res.json({ token });
});

// -----------------------------------------
// ADMIN JWT VERIFY MIDDLEWARE
// -----------------------------------------
function verifyAdminJWT(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(403).json({ message: "Missing token" });

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
        req.admin = decoded;
        next();
    } catch {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

// -----------------------------------------
// USER REGISTER
// -----------------------------------------
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
        return res.status(400).json({ message: "Missing username or password" });

    try {
        db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`)
          .run(username, password);
        res.json({ message: "User registered" });
    } catch (err) {
        if (err.message.includes("UNIQUE")) {
            return res.status(400).json({ message: "Username already exists" });
        }
        return res.status(500).json({ message: "Server error" });
    }
});

// -----------------------------------------
// USER LOGIN
// -----------------------------------------
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare(`SELECT * FROM users WHERE username=?`).get(username);

    if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const banned = db.prepare(`SELECT username FROM bans WHERE username=?`).get(username);
    if (banned) return res.status(403).json({ message: "User is banned" });

    res.json({
        message: "Login successful",
        username: user.username,
        isAdmin: !!user.is_admin
    });
});

// -----------------------------------------
// ADMIN API
// -----------------------------------------

// ALL USERS WITH STATUS
app.get('/api/admin/all-users', verifyAdminJWT, (req, res) => {
    const users = db.prepare(`
        SELECT id, username, is_admin,
               CASE WHEN is_online = 1 THEN 1 ELSE 0 END AS is_online
        FROM users ORDER BY username
    `).all();

    res.json(users);
});

// DELETE USER
app.delete('/api/admin/users/:id', verifyAdminJWT, (req, res) => {
    const { id } = req.params;

    const check = db.prepare(`SELECT * FROM users WHERE id=?`).get(id);

    if (!check) return res.json({ message: "User does not exist." });

    if (check.username === "Admin") {
        return res.status(400).json({ message: "Cannot delete master Admin." });
    }

    db.prepare(`DELETE FROM users WHERE id=?`).run(id);
    res.json({ message: "User deleted successfully" });
});

// GET MESSAGES
app.get('/api/admin/messages', verifyAdminJWT, (req, res) => {
    const messages = db.prepare(`
        SELECT * FROM messages ORDER BY id DESC LIMIT 200
    `).all().reverse();
    res.json(messages);
});

// DELETE ALL MESSAGES (must come BEFORE the :id route)
app.delete('/api/admin/messages/delete-all', verifyAdminJWT, (req, res) => {
    try {
        const result = db.prepare(`DELETE FROM messages`).run();
        console.log(`Deleted ${result.changes} messages`);
        res.json({ 
            message: "All messages deleted successfully",
            deletedCount: result.changes
        });
    } catch (error) {
        console.error("Error deleting all messages:", error);
        res.status(500).json({ message: "Failed to delete messages" });
    }
});

// DELETE MESSAGE
app.delete('/api/admin/messages/:id', verifyAdminJWT, (req, res) => {
    db.prepare(`DELETE FROM messages WHERE id=?`).run(req.params.id);
    res.json({ message: "Message deleted" });
});

// BANNED USERS
app.get('/api/admin/bans', verifyAdminJWT, (req, res) => {
    res.json(db.prepare(`SELECT username FROM bans`).all());
});

// BAN USER
app.post('/api/admin/ban', verifyAdminJWT, (req, res) => {
    db.prepare(`INSERT OR IGNORE INTO bans(username) VALUES(?)`)
      .run(req.body.username);
    res.json({ message: "User banned" });
});

// UNBAN USER
app.post('/api/admin/unban', verifyAdminJWT, (req, res) => {
    db.prepare(`DELETE FROM bans WHERE username=?`)
      .run(req.body.username);
    res.json({ message: "User unbanned" });
});

// ⬆️⬆️⬆️ END OF NEW ENDPOINT ⬆️⬆️⬆️

// BANNED USERS
app.get('/api/admin/bans', verifyAdminJWT, (req, res) => {
    res.json(db.prepare(`SELECT username FROM bans`).all());
});

// KICK USER (socket disconnect)
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

const onlineUsers = new Map();

app.post('/api/admin/kick', verifyAdminJWT, (req, res) => {
    const username = req.body.username;
    const socket = onlineUsers.get(username);

    if (socket) {
        socket.disconnect(true);
        onlineUsers.delete(username);
        db.prepare(`UPDATE users SET is_online=0 WHERE username=?`).run(username);
    }

    res.json({ message: "User kicked" });
});

// -----------------------------------------
// SOCKET.IO LOGIC
// -----------------------------------------
function loadHistory() {
    return db.prepare(`
        SELECT username, message, timestamp
        FROM messages ORDER BY id DESC LIMIT 200
    `).all().reverse();
}

function saveMessage(u, m, t) {
    db.prepare(`
        INSERT INTO messages(username, message, timestamp)
        VALUES (?, ?, ?)
    `).run(u, m, t);
}

io.on('connection', (socket) => {
    socket.emit("chatHistory", loadHistory());

    socket.on("join", (username) => {
        socket.username = username;

        const banned = db.prepare(`SELECT username FROM bans WHERE username=?`)
            .get(username);

        if (banned) {
            socket.emit("message", {
                username: "Admin",
                message: "You are banned from the chat.",
                timestamp: new Date().toISOString()
            });
            return socket.disconnect();
        }

        // Track online status in DB + memory
        onlineUsers.set(username, socket);
        db.prepare(`UPDATE users SET is_online=1 WHERE username=?`).run(username);

        io.emit("updateUserList", [...onlineUsers.keys()]);
    });

    socket.on("message", (data) => {
        saveMessage(data.username, data.message, data.timestamp);
        io.emit("message", data);
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(socket.username);

        if (socket.username) {
            db.prepare(`UPDATE users SET is_online=0 WHERE username=?`)
                .run(socket.username);
        }

        io.emit("updateUserList", [...onlineUsers.keys()]);
    });
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});
