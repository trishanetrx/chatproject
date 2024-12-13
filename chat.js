const socket = io('https://negombotech.com'); // Connect to WebSocket backend

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

// Emit event when user joins
const username = localStorage.getItem('username') || prompt('Enter your username:');
localStorage.setItem('username', username); // Store username for reuse
socket.emit('join', username);

// Update the user list
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
});

// Display incoming messages
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.textContent = `${data.username}: ${data.message}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight; // Auto-scroll to the bottom
});

// Send messages
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (message.trim()) {
        socket.emit('message', { username, message });
        messageInput.value = '';
    }
});

// Logout functionality
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token'); // Clear authentication token
    localStorage.removeItem('username'); // Clear username
    alert('Logged out successfully!');
    window.location.href = '/login.html'; // Redirect to login page
});
