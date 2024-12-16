const socket = io('https://api.negombotech.com'); // Connect to WebSocket server

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPicker');
const darkModeToggle = document.getElementById('darkModeToggle');
const logoutButton = document.getElementById('logoutButton');

let ignoredUsers = JSON.parse(localStorage.getItem('ignoredUsers')) || [];

// Fix: Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// Fix: Logout Button
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
});

// Fix: Emoji Picker Rendering
let pickerVisible = false;

emojiButton.addEventListener('click', () => {
    if (!pickerVisible) {
        emojiPickerContainer.classList.remove('hidden');
        const picker = new EmojiMart.Picker({
            set: 'apple',
            onEmojiSelect: (emoji) => {
                messageInput.value += emoji.native;
            },
        });
        emojiPickerContainer.innerHTML = ''; // Clear previous picker
        emojiPickerContainer.appendChild(picker);
        pickerVisible = true;
    } else {
        emojiPickerContainer.classList.add('hidden');
        pickerVisible = false;
    }
});

// Fix: Update Online Users
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;

        // Add Ignore/Unignore Button
        const button = document.createElement('button');
        button.textContent = ignoredUsers.includes(user) ? 'Unignore' : 'Ignore';
        button.addEventListener('click', () => {
            if (ignoredUsers.includes(user)) {
                ignoredUsers = ignoredUsers.filter((u) => u !== user);
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

// Fix: Display Messages with Ignored User Filtering
socket.on('message', (data) => {
    if (!ignoredUsers.includes(data.username)) {
        const div = document.createElement('div');
        div.classList.add('message', data.username === localStorage.getItem('username') ? 'sender' : 'receiver');
        div.textContent = `${data.username}: ${data.message}`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
});

// Fix: Send Message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', { username: localStorage.getItem('username'), message });
        messageInput.value = '';
    }
});

// Fix: Fetch Username from Local Storage
const username = localStorage.getItem('username');
if (username) {
    socket.emit('join', username);
} else {
    window.location.href = '/login.html'; // Redirect to login if username is missing
}
