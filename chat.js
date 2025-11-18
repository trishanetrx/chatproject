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

// ------------------------------
// ANDROID VIEWPORT FIX
// ------------------------------
function applyRealVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}
applyRealVH();
window.addEventListener("resize", applyRealVH);
window.addEventListener("orientationchange", applyRealVH);

// ------------------------------
// SIDEBAR MOBILE
// ------------------------------
mobileSidebar.addEventListener("click", () => {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
});

sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
});

// ------------------------------
// LOGOUT
// ------------------------------
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "login.html";
});

// ------------------------------
// EMOJI PICKER
// ------------------------------
let pickerVisible = false;

emojiButton.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!pickerVisible) {
        const picker = new EmojiMart.Picker({
            theme: "dark",
            onEmojiSelect: emoji => {
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

// ------------------------------
// TEXTAREA AUTO-RESIZE
// ------------------------------
messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
});

// ------------------------------
// SCROLL TO BOTTOM
// ------------------------------
function scrollToBottom(smooth = false) {
    messages.scrollTo({
        top: messages.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
    });
}

// ------------------------------
// RENDER MESSAGE
// ------------------------------
function renderMessage(msg) {
    const row = document.createElement("div");
    row.classList.add("message-row");

    if (msg.username === username) row.classList.add("me");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    bubble.innerHTML = `
        <div>${msg.message}</div>
        <div class="message-meta">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
    `;

    row.appendChild(bubble);
    messages.appendChild(row);

    scrollToBottom(true);
}

// ------------------------------
// CHAT HISTORY
// ------------------------------
socket.on("chatHistory", history => {
    messages.innerHTML = "";
    history.forEach(m => renderMessage(m));
    scrollToBottom();
});

// ------------------------------
// NEW MESSAGE
// ------------------------------
socket.on("message", msg => {
    renderMessage(msg);
});

// ------------------------------
// USER LIST (WhatsApp style)
// ------------------------------
socket.on("updateUserList", list => {
    userList.innerHTML = "";

    list.forEach(name => {
        const li = document.createElement("li");
        li.classList.add("user-item");

        const isAdmin = name === "Admin";
        const isCurrent = name === username;

        li.innerHTML = `
            <div class="user-avatar">
                ${isAdmin ? "🛡️" : name.charAt(0).toUpperCase()}
            </div>

            <div class="user-info">
                <div class="user-name">${name}${isCurrent ? " (You)" : ""}</div>
                ${isAdmin ? `<div class="user-badge">Administrator</div>` : ""}
            </div>

            <div class="online-indicator"></div>
        `;

        userList.appendChild(li);
    });
});

// ------------------------------
// SEND MESSAGE (Enter = send)
// ------------------------------
messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event("submit"));
    }
});

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const msg = messageInput.value.trim();
    if (!msg) return;

    socket.emit("message", {
        username,
        message: msg,
        timestamp: new Date().toISOString()
    });

    messageInput.value = "";
    messageInput.style.height = "auto";

    scrollToBottom(true);
});
