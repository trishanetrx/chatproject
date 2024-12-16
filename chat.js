const socket = io('https://api.negombotech.com');

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPicker');
const darkModeToggle = document.getElementById('darkModeToggle');
const logoutButton = document.getElementById('logoutButton');
const loggedInUserDisplay = document.getElementById('loggedInUser');

// Get Username
const username = localStorage.getItem('username') || 'Unknown';
loggedInUserDisplay.textContent = `Logged in as: ${username}`;

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Logout
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
});

// Emoji Picker
let pickerVisible = false;
emojiButton.addEventListener('click', () => {
    if (!pickerVisible) {
        const picker = new EmojiMart.Picker({
            set: 'apple',
            onEmojiSelect: (emoji) => {
                messageInput.value += emoji.native;
            },
        });
        emojiPickerContainer.innerHTML = '';
        emojiPickerContainer.appendChild(picker);
        emojiPickerContainer.classList.remove('hidden');
        pickerVisible = true;
    } else {
        emojiPickerContainer.classList.add('hidden');
        pickerVisible = false;
    }
});

// Update User List
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
});

// Display Messages
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(data.username === username ? 'sender' : 'receiver');
    div.textContent = `${data.username}: ${data.message}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});

// Send Messages
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', { username, message });
        messageInput.value = '';
    }
});
