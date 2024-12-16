const socket = io('https://api.negombotech.com'); // WebSocket connection URL

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

// Emoji Picker Initialization
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPicker');

let pickerVisible = false;

emojiButton.addEventListener('click', () => {
    if (!pickerVisible) {
        const picker = new EmojiMart.Picker({
            set: 'apple',
            onEmojiSelect: (emoji) => {
                messageInput.value += emoji.native; // Append emoji to message input
            },
        });

        emojiPickerContainer.innerHTML = '';
        emojiPickerContainer.appendChild(picker);
        emojiPickerContainer.classList.remove('hidden');
        pickerVisible = true;
    } else {
        emojiPickerContainer.innerHTML = '';
        emojiPickerContainer.classList.add('hidden');
        pickerVisible = false;
    }
});

// Retrieve username
const username = localStorage.getItem('username');
if (!username) {
    window.location.href = '/login.html';
} else {
    socket.emit('join', username);
}

// Update user list
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
    messages.scrollTop = messages.scrollHeight; // Auto-scroll
});

// Send message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;
    if (message.trim()) {
        socket.emit('message', { username, message });
        messageInput.value = ''; // Clear input
    }
});

// Logout functionality
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    alert('Logged out successfully!');
    window.location.href = '/login.html';
});
