const socket = io('https://api.negombotech.com');

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPicker');

// Emoji Picker Initialization
let pickerVisible = false;

emojiButton.addEventListener('click', () => {
    if (!pickerVisible) {
        const picker = new EmojiMart.Picker({
            set: 'apple',
            onEmojiSelect: (emoji) => {
                messageInput.value += emoji.native; // Add emoji
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

// Dark Mode Toggle
document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Handle Logout
document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
});

// Receive Online Users
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;
        userList.appendChild(li);
    });
});

// Receive Messages
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('message', data.username === localStorage.getItem('username') ? 'sender' : 'receiver');
    div.textContent = `${data.username}: ${data.message}`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});

// Send Message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', { username: localStorage.getItem('username'), message });
        messageInput.value = '';
    }
});
