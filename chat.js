// ----------------------------------------
// CONNECT SOCKET
// ----------------------------------------
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

// MOBILE SIDEBAR ELEMENTS
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// ----------------------------------------
// USER SETUP
// ----------------------------------------
const username = localStorage.getItem("username");
if (!username) window.location.href = "login.html";

loggedInUserDisplay.textContent = `Logged in as: ${username}`;
socket.emit("join", username);

// ----------------------------------------
// LOGOUT
// ----------------------------------------
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "login.html";
});

// ----------------------------------------
// MOBILE SIDEBAR CONTROL
// ----------------------------------------
function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // prevent background scroll
}

function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.add("hidden");
    document.body.style.overflow = ""; // restore scrolling
}

mobileMenuBtn.addEventListener("click", openSidebar);
overlay.addEventListener("click", closeSidebar);

// Auto close when resizing to desktop
window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeSidebar();
});

// ----------------------------------------
// EMOJI PICKER
// ----------------------------------------
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

// Close emoji picker when clicking outside
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

// ----------------------------------------
// SCROLL TO BOTTOM (WhatsApp style)
// ----------------------------------------
function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
}

// ----------------------------------------
// RENDER MESSAGE
// ----------------------------------------
function renderMessage(msg) {
    if (!msg) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-row");
    if (msg.username === username) wrapper.classList.add("me");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    if (msg.username === username) bubble.classList.add("me");

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

    scrollToBottom();
}

// ----------------------------------------
// LOAD CHAT HISTORY
// ----------------------------------------
socket.on("chatHistory", history => {
    messages.innerHTML = "";
    history.forEach(m => renderMessage(m));
    scrollToBottom();
});

// ----------------------------------------
// LIVE MESSAGES
// ----------------------------------------
socket.on("message", msg => {
    renderMessage(msg);
});

// ----------------------------------------
// UPDATE ONLINE USERS
// ----------------------------------------
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

        let label = name;
        if (name === username) label += " (You)";
        if (name === "Admin") label = "🛡️ Admin";

        li.innerHTML = `<span>${label}</span>`;
        userList.appendChild(li);
    });
});

// ----------------------------------------
// SEND MESSAGE
// ----------------------------------------
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
});
