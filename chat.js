const socket = io("https://chatapi.copythingz.shop");

// Elements
const userList = document.getElementById("userList");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const emojiButton = document.getElementById("emojiButton");
const emojiPickerContainer = document.getElementById("emojiPicker");
const logoutButton = document.getElementById("logoutButton");
const loggedInUserDisplay = document.getElementById("loggedInUser");

const username = localStorage.getItem("username");
if (!username) window.location.href = "login.html";

loggedInUserDisplay.textContent = `Logged in as: ${username}`;
socket.emit("join", username);

// LOGOUT
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "login.html";
});

// EMOJI PICKER
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

// Close emoji picker
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

// =============================
// DYNAMIC BOTTOM PADDING FIX
// =============================
function fixBottomPadding() {
    const formHeight = messageForm.offsetHeight;
    messages.style.paddingBottom = (formHeight + 40) + "px";
}
setInterval(fixBottomPadding, 600);
window.addEventListener("resize", fixBottomPadding);
fixBottomPadding();

// Auto-scroll to bottom
function scrollToBottom(smooth = false) {
    messages.scrollTo({
        top: messages.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
    });
}

// =============================
// RENDER MESSAGE
// =============================
function renderMessage(msg) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("message-row");

    const isMe = msg.username === username;
    if (isMe) wrapper.classList.add("me");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    bubble.style.background = isMe ? "#25D366" : "#1f1f1f";
    bubble.style.color = isMe ? "#000" : "#fff";

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

    scrollToBottom(true);
}

// HISTORY
socket.on("chatHistory", history => {
    messages.innerHTML = "";
    history.forEach(m => renderMessage(m));
    scrollToBottom();
});

// LIVE MESSAGES
socket.on("message", msg => {
    renderMessage(msg);
});

// ONLINE USER LIST
socket.on("updateUserList", list => {
    userList.innerHTML = "";
    if (!list.length) {
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

// SEND MESSAGE
messageForm.addEventListener("submit", e => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if (!msg) return;

    socket.emit("message", {
        username,
        message: msg,
        timestamp: new Date().toISOString()
    });

    messageInput.value = "";
    scrollToBottom(true);
});
