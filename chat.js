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
const username = localStorage.getItem('username') || 'Guest';
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
    users.forEach((user) => {
        const li = document.createElement('li');
        li.textContent = user; // Assign username to the list item text

        // Optional: Add additional UI elements or buttons if required
        const removeButton = document.createElement('button');
        removeButton.textContent = 'X';
        removeButton.onclick = () => {
            alert(`Feature not implemented yet for removing: ${user}`);
        };

        li.appendChild(removeButton); // Attach button to list item
        userList.appendChild(li);    // Add list item to the DOM
    });
});

// Ensure socket connection emits a request for the current user list upon page load
socket.emit('requestUserList');

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
