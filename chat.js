const socket = io('https://chatapi.copythingz.shop');

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPicker');
const darkModeToggle = document.getElementById('darkModeToggle');
const logoutButton = document.getElementById('logoutButton');
const loggedInUserDisplay = document.getElementById('loggedInUser');

// Maintain a list of ignored users
let ignoredUsers = [];

// Get Username and notify server
const username = localStorage.getItem('username') || `Guest_${Math.floor(Math.random() * 1000)}`;
localStorage.setItem('username', username); // Save username if not set
loggedInUserDisplay.textContent = `Logged in as: ${username}`;

// Emit "join" to inform server of the connected user
socket.emit('join', username);

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
                messageInput.value += emoji.native; // Append emoji to input field
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
    userList.innerHTML = ''; // Clear the list before updating

    if (Array.isArray(users) && users.length > 0) {
        users.forEach((username) => {
            const li = document.createElement('li');
            li.textContent = username;

            // Apply special style for Admin
            if (username === 'Admin') {
                li.style.color = 'red'; // Highlight Admin in red
                li.style.fontWeight = 'bold';
            }

            userList.appendChild(li);
        });
    } else {
        const noUsers = document.createElement('li');
        noUsers.textContent = 'No users online';
        userList.appendChild(noUsers);
    }
});

// Display Messages
socket.on('message', (data) => {
    if (ignoredUsers.includes(data.username)) return;

    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(data.username === username ? 'sender' : 'receiver');

    if (data.username === 'Admin') {
        div.style.color = 'red'; // Highlight Admin messages in red
        div.style.fontWeight = 'bold';
    }

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

// Request user list on connect
socket.on('connect', () => {
    console.log('Connected to server, requesting user list...');
    socket.emit('requestUserList');
});
