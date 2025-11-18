const socket = io("https://chatapi.copythingz.shop");

// UI elements
const userList = document.getElementById("userList");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const emojiButton = document.getElementById("emojiButton");
const emojiPickerContainer = document.getElementById("emojiPicker");
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
    window.location.href = "login.html";
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

        emojiPickerContainer.innerHTML = "";
        emojiPickerContainer.appendChild(picker);

        emojiPickerContainer.classList.remove("hidden");
        pickerVisible = true;

    } else {
        emojiPickerContainer.classList.add("hidden");
        pickerVisible = false;
    }
});

document.addEventListener("click", (e) => {
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
// RENDER MESSAGE (OLED FIX)
// -------------------------------
function renderMessage(msg) {
    if (!msg) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-row");

    const isMe = msg.username === username;
    if (isMe) wrapper.classList.add("me");

    // Create bubble
    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    // WhatsApp AMOLED theme colors
    if (isMe) {
        bubble.style.background = "#25D366";  // WhatsApp green
        bubble.style.color = "#000";          // readable on green
    } else {
        bubble.style.background = "#1f1f1f";  // dark grey
        bubble.style.color = "#fff";
    }

    let displayName = msg.username;
    if (msg.username === "Admin") displayName = "🛡️ Admin";

    bubble.innerHTML = `
        <div class="font-bold mb-1 text-sm">${displayName}</div>
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
        userList.innerHTML = `<li class="text-gray-400">No users online</li>`;
        return;
    }

    list.forEach(name => {
        const li = document.createElement("li");
        li.classList.add(
            "flex", "justify-between", "items-center",
            "bg-[#1f2937]", "p-2", "rounded", "text-white"
        );

        let label = name;
        if (name === username) label += " (You)";
        if (name === "Admin") label = "🛡️ Admin";

        li.innerHTML = `<span>${label}</span>`;
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
