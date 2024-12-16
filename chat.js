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

// Manage ignored users
let ignoredUsers = JSON.parse(localStorage.getItem('ignoredUsers')) || [];

// Add user to ignore list
function ignoreUser(user) {
    if (!ignoredUsers.includes(user)) {
        ignoredUsers.push(user);
        localStorage.setItem('ignoredUsers', JSON.stringify(ignoredUsers));
    }
}

// Remove user from ignore list
function unignoreUser(user) {
    ignoredUsers = ignoredUsers.filter((ignoredUser) => ignoredUser !== user);
    localStorage.setItem('ignoredUsers', JSON.stringify(ignoredUsers));
}

// Check if user is ignored
function isUserIgnored(user) {
    return ignoredUsers.includes(user);
}

// Update user list with ignore/unignore buttons
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;

        // Ignore/Unignore Button
        const button = document.createElement('button');
        button.textContent = isUserIgnored(user) ? 'Unignore' : 'Ignore';
        button.className = 'ml-2 px-2 py-1 text-sm bg-gray-300 rounded hover:bg-gray-400';
        button.addEventListener('click', () => {
            if (isUserIgnored(user)) {
                unignoreUser(user);
                button.textContent = 'Ignore';
            } else {
                ignoreUser(user);
                button.textContent = 'Unignore';
            }
        });

        li.appendChild(button);
        userList.appendChild(li);
    });
});

// Display incoming messages
socket.on('message', (data) => {
    if (!isUserIgnored(data.username)) {
        const div = document.createElement('div');
        div.textContent = `${data.username}: ${data.message}`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight; // Auto-scroll
    }
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
