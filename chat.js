const socket = io("https://chatapi.copythingz.shop");

// UI elements
const userList = document.getElementById("userList");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const emojiButton = document.getElementById("emojiButton");
const emojiPickerContainer = document.getElementById("emojiPicker");
const darkModeToggle = document.getElementById("darkModeToggle");
const logoutButton = document.getElementById("logoutButton");
const loggedInUserDisplay = document.getElementById("loggedInUser");

// -------------------------------
// USER SETUP
// -------------------------------
const username = localStorage.getItem("username");

if (!username) {
    window.location.href = "login.html";
}

loggedInUserDisplay.textContent = `Logged in as: ${username}`;

// Join server
socket.emit("join", username);

// -------------------------------
// LOGOUT
// -------------------------------
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("username");
    localStorage.removeItem("isAdmin");
    window.location.href = "login.html";
});

// -------------------------------
// DARK MODE (background only)
// -------------------------------
(function initTheme() {
    const saved = localStorage.getItem("chat_theme");

    if (saved === "light") {
        document.body.classList.remove("dark");
        darkModeToggle.textContent = "Dark Mode";
    } else {
        document.body.classList.add("dark");
        darkModeToggle.textContent = "Light Mode";
        localStorage.setItem("chat_theme", "dark");
    }
})();

darkModeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    darkModeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
    localStorage.setItem("chat_theme", isDark ? "dark" : "light");
});

// -------------------------------
// EMOJI PICKER
// -------------------------------
let pickerVisible = false;

emojiButton.addEventListener("click", () => {
    if (!pickerVisible) {
        const picker = new EmojiMart.Picker({
            theme: "dark",
            onEmojiSelect: emoji => {
                messageInput.value += emoji.native;
                messageInput.focus();
            }
        });
        emojiPickerContainer.classList.remove("hidden");
        emojiPickerContainer.innerHTML = "";
        emojiPickerContainer.appendChild(picker);
        pickerVisible = true;
    } else {
        emojiPickerContainer.classList.add("hidden");
        pickerVisible = false;
    }
});

document.addEventListener("click", e => {
    if (
        pickerVisible &&
        !emojiPickerContainer.contains(e.target) &&
        e.target !== emojiButton
    ) {
        emojiPickerContainer.classList.add("hidden");
        pickerVisible = false;
    }
});

// -------------------------------
// FIXED COLOR BUBBLES (WHATSAPP STYLE)
// -------------------------------
const BUBBLE_ME = "background:#DCF8C6;color:#111;";
const BUBBLE_OTHER = "background:#FFFFFF;color:#111;";

// -------------------------------
// RENDER MESSAGE
// -------------------------------
function renderMessage(msg) {
    if (!msg) return;

    const wrapper = document.createElement("div");
    const isMe = msg.username === username;

    wrapper.classList.add("message-row");
    wrapper.classList.add(isMe ? "me" : "other");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    // WhatsApp fixed, non-theme-based bubble colors
    bubble.setAttribute(
        "style",
        isMe ? BUBBLE_ME : BUBBLE_OTHER
    );

    const safeName =
        msg.username === "Admin" ? "🛡️ Admin" : msg.username;

    bubble.innerHTML = `
        <div class="font-bold mb-1 text-sm">${safeName}</div>
        <div>${msg.message}</div>
    `;

    const meta = document.createElement("div");
    meta.classList.add("message-meta");
    meta.textContent = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    wrapper.appendChild(bubble);
    wrapper.appendChild(meta);

    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
}

// -------------------------------
// LOAD CHAT HISTORY
// -------------------------------
socket.on("chatHistory", history => {
    messages.innerHTML = "";
    history.forEach(m => renderMessage(m));
});

// -------------------------------
// LIVE MESSAGES
// -------------------------------
socket.on("message", msg => {
    renderMessage(msg);
});

// -------------------------------
// UPDATE ONLINE USERS
// -------------------------------
socket.on("updateUserList", list => {
    userList.innerHTML = "";

    if (!list || list.length === 0) {
        userList.innerHTML = `<li class="text-gray-300">No users online</li>`;
        return;
    }

    list.forEach(name => {
        const li = document.createElement("li");
        li.classList.add(
            "flex",
            "justify-between",
            "items-center",
            "bg-white/10",
            "p-2",
            "rounded"
        );

        let userLabel = name;
        if (name === username) userLabel += " (You)";
        if (name === "Admin") userLabel = "🛡️ Admin";

        li.innerHTML = `<span>${userLabel}</span>`;
        userList.appendChild(li);
    });
});

// -------------------------------
// SEND MESSAGE
// -------------------------------
messageForm.addEventListener("submit", e => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if (!msg) return;

    const payload = {
        username,
        message: msg,
        timestamp: new Date().toISOString()
    };

    socket.emit("message", payload);
    messageInput.value = "";
});
