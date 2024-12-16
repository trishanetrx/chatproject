const socket = io('https://api.negombotech.com'); // WebSocket connection URL

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
                messageInput.value += emoji.native; // Append emoji to input
            },
        });

        emojiPickerContainer.innerHTML = ''; // Clear previous picker
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
    const mode = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
    document.getElementById('darkModeToggle').textContent = mode;
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
    div.classList.add('message');
    div.classList.add(data.username === username ? 'sender' : 'receiver');
    div.textContent = `${data.username}: ${data.message}`;
    messages.appendChild(div);

    setTimeout(() => {
        div.classList.add('show');
    }, 10); // Smooth appearance animation

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
