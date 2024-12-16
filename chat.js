const socket = io('https://api.negombotech.com'); // WebSocket connection URL

const userList = document.getElementById('userList');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPicker');

let ignoredUsers = JSON.parse(localStorage.getItem('ignoredUsers')) || [];

// Add/Remove ignore logic
function ignoreUser(user) {
    if (!ignoredUsers.includes(user)) {
        ignoredUsers.push(user);
        localStorage.setItem('ignoredUsers', JSON.stringify(ignoredUsers));
    }
}

function unignoreUser(user) {
    ignoredUsers = ignoredUsers.filter((ignored) => ignored !== user);
    localStorage.setItem('ignoredUsers', JSON.stringify(ignoredUsers));
}

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

// Dark Mode Toggle
document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
});

// User List Update with Ignore Button
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user;

        const button = document.createElement('button');
        button.textContent = ignoredUsers.includes(user) ? 'Unignore' : 'Ignore';
        button.addEventListener('click', () => {
            if (ignoredUsers.includes(user)) {
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

// Display Messages - Filter Ignored Users
socket.on('message', (data) => {
    if (!ignoredUsers.includes(data.username)) {
        const div = document.createElement('div');
        div.classList.add('message');
        div.classList.add(data.username === localStorage.getItem('username') ? 'sender' : 'receiver');
        div.textContent = `${data.username}: ${data.message}`;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('message', { username: localStorage.getItem('username'), message });
        messageInput.value = '';
    }
});
