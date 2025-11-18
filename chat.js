const socket = io("https://chatapi.copythingz.shop");

// UI
const userList = document.getElementById("userList");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const emojiButton = document.getElementById("emojiButton");
const emojiPickerContainer = document.getElementById("emojiPicker");
const logoutButton = document.getElementById("logoutButton");
const themeToggle = document.getElementById("themeToggle");
const loggedInUserDisplay = document.getElementById("loggedInUser");

// Mobile sidebar
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// -------------------------------------------
// USER SETUP
// -------------------------------------------
const username = localStorage.getItem("username");
if (!username) window.location.href = "login.html";

loggedInUserDisplay.textContent = `Logged in as: ${username}`;
socket.emit("join", username);

// -------------------------------------------
// LOGOUT
// -------------------------------------------
logoutButton.addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "login.html";
});

// -------------------------------------------
// THEME TOGGLE (WhatsApp style)
// -------------------------------------------
function applyTheme() {
    const theme = localStorage.getItem("theme") || "dark";

    if (theme === "dark") {
        document.documentElement.classList.add("dark");
        themeToggle.textContent = "☀️";
    } else {
        document.documentElement.classList.remove("dark");
        themeToggle.textContent = "🌙";
    }
}

applyTheme();

themeToggle.addEventListener("click", () => {
    const current = localStorage.getItem("theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme();
});

// -------------------------------------------
// MOBILE SIDEBAR
// -------------------------------------------
mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
});

overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        sidebar.classList.remove("open");
        overlay.classList.add("hidden");
        document.body.style.overflow = "";
    }
});

// -------------------------------------------
// EMOJI PICKER
// -------------------------------------------
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

// -------------------------------------------
// SCROLL TO BOTTOM
// -------------------------------------------
function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
}

// -------------------------------------------
// RENDER MESSAGE (WhatsApp bubbles)
// -------------------------------------------
function renderMessage(msg) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("max-w-[75%]");

    const isMe = msg.username === username;

    let bubbleClass = "";
    if (isMe) {
        bubbleClass = document.documentElement.classList.contains("dark")
            ? "bubble-me-dark"
            : "bubble-me-light";
    } else {
        bubbleClass = document.documentElement.classList.contains("dark")
            ? "bubble-other-dark"
            : "bubble-other-light";
    }

    wrapper.classList.add(isMe ? "ml-auto" : "mr-auto");

    wrapper.innerHTML = `
        <div class="p-3 rounded-lg ${bubbleClass}">
            <div class="font-bold text-sm">${msg.username}</div>
            <div>${msg.message}</div>
            <div class="text-xs opacity-60 mt-1">
                ${new Date(msg.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
            </div>
        </div>
    `;

    messages.appendChild(wrapper);
    scrollBottom();
}

// -------------------------------------------
// HISTORY
// -------------------------------------------
socket.on("chatHistory", history => {
    messages.innerHTML = "";
    history.forEach(renderMessage);
    scrollBottom();
});

// -------------------------------------------
// NEW MESSAGE
// -------------------------------------------
socket.on("message", renderMessage);

// -------------------------------------------
// USER LIST UPDATE
// -------------------------------------------
socket.on("updateUserList", list => {
    userList.innerHTML = "";
    list.forEach(name => {
        const li = document.createElement("li");
        li.className = "p-2 rounded bg-gray-200 dark:bg-[#111] text-black dark:text-white";
        li.textContent = name === username ? `${name} (You)` : name;
        userList.appendChild(li);
    });
});

// -------------------------------------------
// SEND MESSAGE
// -------------------------------------------
messageForm.addEventListener("submit", e => {
    e.preventDefault();

    const msg = messageInput.value.trim();
    if (!msg) return;

    socket.emit("message", {
        username,
        message: msg,
        timestamp: new Date().toISOString(),
    });

    messageInput.value = "";
});
