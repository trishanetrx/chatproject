const socket = io("https://chatapi.copythingz.shop");

// Elements
const userList = document.getElementById("userList");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const emojiButton = document.getElementById("emojiButton");
const emojiPicker = document.getElementById("emojiPicker");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileSidebar = document.getElementById("mobileSidebar");
const logoutButton = document.getElementById("logoutButton");

const username = localStorage.getItem("username");
if (!username) window.location.href = "login.html";

// ------------------------------------------------------
// ANDROID SAFE HEIGHT FIX
// ------------------------------------------------------
function applyRealVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}
applyRealVH();
window.addEventListener("resize", applyRealVH);
window.addEventListener("orientationchange", applyRealVH);

// ------------------------------------------------------
// SIDEBAR MOBILE
// ------------------------------------------------------
mobileSidebar.addEventListener("click", () => {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
});
sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
});

// ------------------------------------------------------
// LOGOUT
// ------------------------------------------------------
logoutButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

// ------------------------------------------------------
// EMOJI PICKER
// ------------------------------------------------------
let pickerVisible = false;

emojiButton.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!pickerVisible) {
        const picker = new EmojiMart.Picker({
            theme: "dark",
            onEmojiSelect: (emoji) => {
                messageInput.value += emoji.native;
                messageInput.focus();
            }
        });

        emojiPicker.innerHTML = "";
        emojiPicker.appendChild(picker);
        emojiPicker.classList.add("show");
        pickerVisible = true;
    } else {
        emojiPicker.classList.remove("show");
        pickerVisible = false;
    }
});

document.addEventListener("click", (e) => {
    if (
        pickerVisible &&
        !emojiPicker.contains(e.target) &&
        e.target !== emojiButton
    ) {
        emojiPicker.classList.remove("show");
        pickerVisible = false;
    }
});

// ------------------------------------------------------
// TEXTAREA AUTO HEIGHT
// ------------------------------------------------------
messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
});

// ------------------------------------------------------
// SCROLL TO BOTTOM
// ------------------------------------------------------
function scrollToBottom(smooth = false) {
    messages.scrollTo({
        top: messages.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
    });
}

// ------------------------------------------------------
// RENDER MESSAGE (Original logic merged)
// ------------------------------------------------------
function formatTime(ts) {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

function renderMessage(data) {
    if (!data || !data.username || typeof data.message !== "string") return;

    const isMe = data.username === username;

    const row = document.createElement("div");
    row.classList.add("message-row");
    if (isMe) row.classList.add("me");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    // NAME (Admin orange, You label)
    const nameEl = document.createElement("div");
    nameEl.classList.add("message-username");
    if (data.username === "Admin") nameEl.style.color = "#f97316";
    nameEl.textContent = isMe ? `${data.username} (You)` : data.username;

    // TEXT
    const textEl = document.createElement("div");
    textEl.textContent = data.message;

    // META
    const meta = document.createElement("div");
    meta.classList.add("message-meta");
    meta.textContent = formatTime(data.timestamp);

    bubble.appendChild(nameEl);
    bubble.appendChild(textEl);

    row.appendChild(bubble);
    row.appendChild(meta);

    messages.appendChild(row);
    scrollToBottom(true);
}

// ------------------------------------------------------
// REQUEST USER LIST ON CONNECT (Admin compatibility)
// ------------------------------------------------------
socket.on("connect", () => {
    socket.emit("requestUserList");
    socket.emit("join", username);
});

// ------------------------------------------------------
// RESTORE OLD USER LIST LOGIC (Admin-safe)
// ------------------------------------------------------
socket.on("updateUserList", (users) => {
    userList.innerHTML = "";

    if (!Array.isArray(users) || users.length === 0) {
        const noUsers = document.createElement("div");
        noUsers.style.padding = "20px";
        noUsers.style.color = "var(--text-secondary)";
        noUsers.style.textAlign = "center";
        noUsers.textContent = "No users online";
        userList.appendChild(noUsers);
        return;
    }

    users.forEach((name) => {
        // Create Item Container
        const item = document.createElement("div"); // Changed from li to div for better styling flexibility
        item.classList.add("user-item");

        // Avatar
        const avatar = document.createElement("div");
        avatar.classList.add("user-avatar");
        avatar.textContent = name.charAt(0).toUpperCase();
        // Give Admin a different avatar color if you want, or handle in CSS
        if (name === "Admin") {
            avatar.style.background = "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)";
        }

        // Info Container
        const info = document.createElement("div");
        info.classList.add("user-info");

        // Name
        const nameEl = document.createElement("div");
        nameEl.classList.add("user-name");
        nameEl.textContent = name === username ? `${name} (You)` : name;

        // Badge (optional)
        const badge = document.createElement("span");
        if (name === "Admin") {
            badge.textContent = "Admin";
            badge.classList.add("user-badge");
            badge.style.marginLeft = "6px";
            nameEl.appendChild(badge);
        }

        info.appendChild(nameEl);

        // Online Indicator
        const indicator = document.createElement("div");
        indicator.classList.add("online-indicator");

        // Assemble
        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(indicator);

        userList.appendChild(item);
    });
});

// ------------------------------------------------------
// CHAT HISTORY (Original logic)
// ------------------------------------------------------
socket.on("chatHistory", (history) => {
    messages.innerHTML = "";
    if (Array.isArray(history)) {
        history.forEach((msg) => renderMessage(msg));
    }
    scrollToBottom();
});

// ------------------------------------------------------
// KICKED EVENT
// ------------------------------------------------------
// ------------------------------------------------------
// KICKED / BANNED EVENTS
// ------------------------------------------------------
socket.on("kicked", () => {
    localStorage.clear();
    window.location.href = "login.html?reason=kicked";
});

socket.on("banned", () => {
    localStorage.clear();
    window.location.href = "login.html?reason=banned";
});

// ------------------------------------------------------
// NEW MESSAGE
// ------------------------------------------------------
socket.on("message", (data) => {
    renderMessage(data);
});

// ------------------------------------------------------
// SEND MESSAGE + ENTER KEY (Original behavior)
// ------------------------------------------------------
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event("submit"));
    }
});

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message) return;

    socket.emit("message", {
        username,
        message,
        timestamp: new Date().toISOString(),
    });

    messageInput.value = "";
    messageInput.style.height = "auto";

    scrollToBottom(true);
});
