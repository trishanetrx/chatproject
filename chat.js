const socket = io('https://api.negombotech.com'); // WebSocket connection URL

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const darkModeToggle = document.getElementById('darkModeToggle');
const logoutButton = document.getElementById('logoutButton');

let ignoredUsers = JSON.parse(localStorage.getItem('ignoredUsers')) || [];

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Logout Button Functionality
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

// Fetch Username
const username = localStorage.getItem('username');
if (!username) {
    alert("Please login!");
    window.location.href = '/login.html';
} else {
    socket.emit('join', username);
}

// Update Online User List
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;

        const button = document.createElement('button');
        button.textContent = ignoredUsers.includes(user) ? 'Unignore' : 'Ignore';
        button.addEventListener('click', () => {
            if (ignoredUsers.includes(user)) {
                ignoredUsers = ignoredUsers.filter((ignored) => ignored !== user);
                button.textContent = 'Ignore';
            } else {
                ignoredUsers.push(user);
                button.textContent = 'Unignore';
            }
            localStorage.setItem('ignoredUsers', JSON.stringify(ignoredUsers));
        });

        li.appendChild(button);
        userList.appendChild(li);
    });
});

// Display Messages
socket.on('message', (data) => {
    if (!ignoredUsers.includes(data.username)) {
        const div = document.createElement('div');
        div.classList.add('message', data.username === username ? 'sender' : 'receiver');
        div.textContent = `${data.username}: ${data.message}`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
});

// Send Message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', { username, message });
        messageInput.value = '';
    }
});
