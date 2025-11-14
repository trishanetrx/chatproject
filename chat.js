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

// Maintain a list of ignored users (future use)
let ignoredUsers = [];

// ---------- THEME (Dark Mode) ----------
(function initTheme() {
    const savedTheme = localStorage.getItem('chat_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        darkModeToggle.textContent = 'Light Mode';
    } else {
        // default: dark mode on
        document.body.classList.add('dark');
        darkModeToggle.textContent = 'Light Mode';
        localStorage.setItem('chat_theme', 'dark');
    }
})();

darkModeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark');
    darkModeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('chat_theme', isDark ? 'dark' : 'light');
});

// ---------- USER SETUP ----------
const username = localStorage.getItem('username') || `Guest_${Math.floor(Math.random() * 1000)}`;
localStorage.setItem('username', username);
loggedInUserDisplay.textContent = `Logged in as: ${username}`;

// Emit "join" to inform server of the connected user
socket.emit('join', username);

// ---------- LOGOUT ----------
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
});

// ---------- EMOJI PICKER ----------
let pickerVisible = false;
let emojiPickerInstance = null;

emojiButton.addEventListener('click', () => {
    if (!pickerVisible) {
        emojiPickerInstance = new EmojiMart.Picker({
            set: 'apple',
            theme: 'dark',
            onEmojiSelect: (emoji) => {
                messageInput.value += emoji.native;
                messageInput.focus();
            },
        });
        emojiPickerContainer.innerHTML = '';
        emojiPickerContainer.appendChild(emojiPickerInstance);
        emojiPickerContainer.classList.remove('hidden');
        pickerVisible = true;
    } else {
        emojiPickerContainer.classList.add('hidden');
        pickerVisible = false;
    }
});

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
    if (
        pickerVisible &&
        !emojiPickerContainer.contains(e.target) &&
        e.target !== emojiButton
    ) {
        emojiPickerContainer.classList.add('hidden');
        pickerVisible = false;
    }
});

// ---------- USER LIST ----------
socket.on('updateUserList', (users) => {
    userList.innerHTML = '';

    if (Array.isArray(users) && users.length > 0) {
        users.forEach((name) => {
            const li = document.createElement('li');

            const label = document.createElement('span');
            label.textContent = name === username ? `${name} (You)` : name;

            if (name === 'Admin') {
                label.style.color = '#f97316';
                label.style.fontWeight = 'bold';
            }

            li.appendChild(label);
            userList.appendChild(li);
        });
    } else {
        const noUsers = document.createElement('li');
        noUsers.textContent = 'No users online';
        userList.appendChild(noUsers);
    }
});

// ---------- MESSAGE RENDERING ----------
function formatTime(ts) {
    try {
        const d = ts ? new Date(ts) : new Date();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function renderMessage(data) {
    if (!data || !data.username || typeof data.message !== 'string') return;
    if (ignoredUsers.includes(data.username)) return;

    const isMe = data.username === username;
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-row', isMe ? 'me' : 'other');

    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble', isMe ? 'me' : 'other');

    const nameEl = document.createElement('div');
    nameEl.classList.add('message-username');
    if (data.username === 'Admin') {
        nameEl.style.color = '#f97316';
    }
    nameEl.textContent = isMe ? `${data.username} (You)` : data.username;

    const textEl = document.createElement('div');
    textEl.textContent = data.message;

    const meta = document.createElement('div');
    meta.classList.add('message-meta');
    const timeLabel = formatTime(data.timestamp);
    meta.textContent = timeLabel ? timeLabel : '';

    bubble.appendChild(nameEl);
    bubble.appendChild(textEl);
    wrapper.appendChild(bubble);
    wrapper.appendChild(meta);

    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
}

// ---------- SOCKET HANDLERS ----------
socket.on('message', (data) => {
    renderMessage(data);
});

// Request user list on connect
socket.on('connect', () => {
    console.log('Connected to server, requesting user list...');
    socket.emit('requestUserList');
});

// ---------- SEND MESSAGE ----------
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    const payload = {
        username,
        message,
        timestamp: new Date().toISOString(),
    };

    socket.emit('message', payload);
    messageInput.value = '';
});
