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
const replyIndicator = document.getElementById("replyIndicator");
const replyName = document.getElementById("replyName");
const closeReply = document.getElementById("closeReply");

const username = localStorage.getItem("username");
if (!username) window.location.href = "login.html";

let currentRecipient = null;
let slowModeDuration = 0;
let lastMessageTime = 0;

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
// REPLY LOGIC
// ------------------------------------------------------
function setRecipient(name) {
    if (name === username || name === "System") return;
    currentRecipient = name;
    replyName.textContent = name;
    replyIndicator.classList.add("show");
    messageInput.focus();

    // Mobile: close sidebar
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
}

function clearRecipient() {
    currentRecipient = null;
    replyIndicator.classList.remove("show");
}

closeReply.addEventListener("click", clearRecipient);

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
// RENDER MESSAGE
// ------------------------------------------------------
function formatTime(ts) {
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

function renderMessage(data, isPrivate = false) {
    if (!data || !data.message) return;

    // Use 'from' for PMs, 'username' for Public
    const senderName = data.from || data.username;
    const isMe = senderName === username;

    const row = document.createElement("div");
    row.classList.add("message-row");
    if (isMe) row.classList.add("me");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    if (isPrivate) bubble.classList.add("private");

    // NAME
    const nameEl = document.createElement("div");
    nameEl.classList.add("message-username");

    // Style Admin
    if (senderName === "Admin") nameEl.style.color = "#f97316";

    // Format Name
    let displayName = senderName;
    if (isMe) displayName += " (You)";

    // Private Label
    if (isPrivate) {
        if (isMe && data.to) {
            displayName += ` ➝ ${data.to}`;
        } else {
            displayName += ` (Private)`;
        }
    }

    nameEl.textContent = displayName;

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
// REQUEST USER LIST ON CONNECT
// ------------------------------------------------------
socket.on("connect", () => {
    socket.emit("requestUserList");
    socket.emit("join", username);
});

// ------------------------------------------------------
// USER LIST
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
        // ... (Existing item creation code) ...
        const item = document.createElement("div");
        item.classList.add("user-item");

        // CLICK TO PM
        if (name !== username) {
            item.addEventListener("click", () => setRecipient(name));
        }

        const avatar = document.createElement("div");
        avatar.classList.add("user-avatar");
        avatar.textContent = name.charAt(0).toUpperCase();
        if (name === "Admin") {
            avatar.style.background = "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)";
        }

        const info = document.createElement("div");
        info.classList.add("user-info");

        const nameEl = document.createElement("div");
        nameEl.classList.add("user-name");
        nameEl.textContent = name === username ? `${name} (You)` : name;

        const badge = document.createElement("span");
        if (name === "Admin") {
            badge.textContent = "Admin";
            badge.classList.add("user-badge");
            badge.style.marginLeft = "6px";
            nameEl.appendChild(badge);
        }

        info.appendChild(nameEl);

        const indicator = document.createElement("div");
        indicator.classList.add("online-indicator");

        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(indicator);

        userList.appendChild(item);
    });
});

// ------------------------------------------------------
// CHAT HISTORY
// ------------------------------------------------------
socket.on("chatHistory", (history) => {
    messages.innerHTML = "";
    if (Array.isArray(history)) {
        history.forEach((msg) => renderMessage(msg));
    }
    scrollToBottom();
});

// ------------------------------------------------------
// KICKED / BANNED
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

socket.on("private_message", (data) => {
    renderMessage(data, true);
});

// ------------------------------------------------------
// SEND MESSAGE
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

    // SLOW MODE CHECK
    if (slowModeDuration > 0 && !currentRecipient) {
        const now = Date.now();
        const diff = now - lastMessageTime;
        const requiredDelay = slowModeDuration * 1000;

        if (diff < requiredDelay) {
            const remaining = Math.ceil((requiredDelay - diff) / 1000);
            // Use a custom alert or reuse broadcast overlay? System message is better but alert is quick.
            // Since we have verifyAdminJWT on server, this is just client UX.
            alert(`⏳ Slow mode is active. Please wait ${remaining}s.`);
            return;
        }
        lastMessageTime = now;
    }

    if (currentRecipient) {
        socket.emit("private_message", {
            to: currentRecipient,
            message: message
        });
    } else {
        socket.emit("message", {
            username,
            message,
            timestamp: new Date().toISOString(),
        });
    }

    messageInput.value = "";
    messageInput.style.height = "auto";
    scrollToBottom(true);
});

// ==========================================
// BROADCAST & SLOW MODE HANDLERS
// ==========================================
const broadcastOverlay = document.getElementById("broadcastOverlay");
const broadcastMessage = document.getElementById("broadcastMessage");
const slowModeIndicator = document.getElementById("slowModeIndicator");
const slowModeTime = document.getElementById("slowModeTime");

socket.on("system_broadcast", (data) => {
    console.log("[DEBUG] Broadcast received:", data);
    if (!broadcastMessage || !broadcastOverlay) {
        console.error("[DEBUG] Broadcast elements missing!");
        return;
    }
    broadcastMessage.textContent = data.message;
    broadcastOverlay.classList.remove("hidden");
    requestAnimationFrame(() => {
        broadcastOverlay.classList.remove("opacity-0");
        broadcastOverlay.firstElementChild.classList.remove("scale-95");
        broadcastOverlay.firstElementChild.classList.add("scale-100");
    });
});

socket.on("slow_mode_updated", (data) => {
    slowModeDuration = data.enabled ? data.duration : 0;
    if (slowModeIndicator && slowModeTime) {
        if (slowModeDuration > 0) {
            slowModeTime.textContent = slowModeDuration;
            slowModeIndicator.classList.remove("hidden");
        } else {
            slowModeIndicator.classList.add("hidden");
        }
    }
});

window.closeBroadcast = () => {
    if (!broadcastOverlay) return;
    broadcastOverlay.classList.add("opacity-0");
    broadcastOverlay.firstElementChild.classList.remove("scale-100");
    broadcastOverlay.firstElementChild.classList.add("scale-95");
    setTimeout(() => {
        broadcastOverlay.classList.add("hidden");
    }, 300);
};
