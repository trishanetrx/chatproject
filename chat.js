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

// Maintain list of ignored users (future)
let ignoredUsers = [];

/* ------------------------------------
   THEME: DARK MODE INIT
------------------------------------ */
(function initTheme() {
    const savedTheme = localStorage.getItem('chat_theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark');
        darkModeToggle.textContent = 'Dark Mode';
    } else {
        // Default dark mode
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

/* ------------------------------------
   USER SETUP
------------------------------------ */
const username = localStorage.getItem('username') || `Guest_${Math.floor(Math.random() * 1000)}`;
localStorage.setItem('username', username);
loggedInUserDisplay.textContent = `Logged in as: ${username}`;

// Tell server that user joined
socket.emit('join', username);

/* ------------------------------------
   LOGOUT
------------------------------------ */
logoutButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
});

/* ------------------------------------
   EMOJI PICKER
------------------------------------ */
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
    if (pickerVisible &&
        !emojiPickerContainer.contains(e.target) &&
        e.target !== emojiButton) {
        emojiPickerContainer.classList.add('hidden');
        pickerVisible = false;
    }
});

/* ------------------------------------
   USER LIST UPDATE
------------------------------------ */
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

/* ------------------------------------
   FORMAT TIME
------------------------------------ */
function formatTime(ts) {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

/* ------------------------------------
   RENDER MESSAGE
------------------------------------ */
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
    meta.textContent = formatTime(data.timestamp);

    bubble.appendChild(nameEl);
    bubble.appendChild(textEl);
    wrapper.appendChild(bubble);
    wrapper.appendChild(meta);

    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
}

/* ------------------------------------
   NEW FEATURE:
   LOAD CHAT HISTORY FROM DATABASE
------------------------------------ */
socket.on('chatHistory', (historyMessages) => {
    if (Array.isArray(historyMessages)) {
        historyMessages.forEach((msg) => renderMessage(msg));
    }
});

/* ------------------------------------
   SOCKET: LIVE INCOMING MESSAGES
------------------------------------ */
socket.on('message', (data) => {
    renderMessage(data);
});

/* ------------------------------------
   ON CONNECT: REQUEST USERS
------------------------------------ */
socket.on('connect', () => {
    console.log('Connected to server, requesting user list...');
    socket.emit('requestUserList');
});

/* ------------------------------------
   SEND MESSAGE
------------------------------------ */
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
